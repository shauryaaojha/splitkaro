import webpush, { WebPushError } from "web-push";
import { after } from "next/server";
import { webPush } from "./config";
import { connectDB } from "./db";
import User from "@/models/User";
import type { NotificationType } from "@/types";

if (webPush.isConfigured) {
  webpush.setVapidDetails(webPush.subject, webPush.publicKey, webPush.privateKey);
}

/** The fields of an in-app notification that a push is built from. */
export interface PushSource {
  userId: unknown;
  type: NotificationType;
  message: string;
  metadata?: Record<string, unknown>;
}

const TITLES: Record<NotificationType, string> = {
  expense_added: "New expense",
  settled: "Payment settled",
  group_joined: "Group update",
  friend_request: "Friend request",
  friend_accepted: "Friend request accepted",
  settlement_disputed: "Payment not received",
};

/** Where tapping the notification should take the user. */
function targetUrl(source: PushSource): string {
  const groupId = source.metadata?.groupId;
  if (typeof groupId === "string" && groupId) return `/groups/${groupId}`;
  if (source.type === "friend_request" || source.type === "friend_accepted") return "/friends";
  return "/activity";
}

async function sendToUser(source: PushSource): Promise<void> {
  const user = await User.findById(source.userId).select("pushSubscriptions").lean();
  const subscriptions = user?.pushSubscriptions ?? [];
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: TITLES[source.type] ?? "SplitKaro",
    body: source.message,
    tag: `${source.type}:${String(source.metadata?.groupId ?? source.userId)}`,
    data: { url: targetUrl(source) },
  });

  const expired: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
          payload,
          { TTL: 60 * 60 * 24, timeout: 5000 }
        );
      } catch (err) {
        // 404/410 mean the browser dropped this subscription for good.
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          expired.push(sub.endpoint);
        } else {
          console.error("Web push failed:", err instanceof Error ? err.message : err);
        }
      }
    })
  );

  if (expired.length > 0) {
    await User.updateOne(
      { _id: source.userId },
      { $pull: { pushSubscriptions: { endpoint: { $in: expired } } } }
    );
  }
}

async function sendPushes(sources: PushSource[]): Promise<void> {
  await connectDB();
  await Promise.allSettled(sources.map(sendToUser));
}

/**
 * Mirror in-app notifications to the users' devices as Web Push.
 *
 * Runs after the response is sent so API latency is unaffected. Notifications
 * about the user's own actions (`metadata.isSelf`) are not pushed.
 */
export function pushNotifications(sources: PushSource[]): void {
  if (!webPush.isConfigured) return;

  const toSend = sources.filter((s) => !s.metadata?.isSelf);
  if (toSend.length === 0) return;

  const task = () =>
    sendPushes(toSend).catch((err) => console.error("Web push batch failed:", err));

  try {
    after(task);
  } catch {
    // Outside a request scope (scripts, tests): send inline instead.
    void task();
  }
}
