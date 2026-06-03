import { Types, Document } from "mongoose";

// ─── User ───────────────────────────────────────────────────────────────────

export interface IOtp {
  hash: string;
  expiresAt: Date;
  attempts: number;
}

export interface IFriendRequest {
  from: Types.ObjectId | string;
  status: "pending" | "accepted" | "declined";
}

export interface IPushSubscription {
  endpoint: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
  createdAt?: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  upiId: string;
  avatarUrl?: string;
  otp?: IOtp;
  pendingEmail?: string;
  friends: Types.ObjectId[];
  friendRequests: IFriendRequest[];
  pushSubscriptions?: IPushSubscription[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Group ──────────────────────────────────────────────────────────────────

export type GroupCategory = "food" | "trip" | "home" | "fun" | "other";
export type MemberRole = "admin" | "member";

export interface IGroupMember {
  userId: Types.ObjectId | string;
  role: MemberRole;
  joinedAt: Date;
}

export interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  category: GroupCategory;
  emoji: string;
  inviteToken: string;
  members: IGroupMember[];
  isArchived: boolean;
  createdBy: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Expense ────────────────────────────────────────────────────────────────

export type SplitType = "equal" | "exact" | "percentage";

export interface IExpenseSplit {
  userId: Types.ObjectId | string;
  share: number;
  splitType: SplitType;
}

export interface IExpense extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId | string;
  description: string;
  amount: number;
  category: string;
  paidBy: Types.ObjectId | string;
  date: Date;
  splits: IExpenseSplit[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Settlement ─────────────────────────────────────────────────────────────

export interface ISettlement extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId | string;
  payer: Types.ObjectId | string;
  payee: Types.ObjectId | string;
  amount: number;
  markedManually: boolean;
  createdAt: Date;
}

// ─── Notification ───────────────────────────────────────────────────────────

export type NotificationType =
  | "expense_added"
  | "settled"
  | "group_joined"
  | "friend_request"
  | "friend_accepted";

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId | string;
  type: NotificationType;
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// ─── API ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
}

// ─── UPI ────────────────────────────────────────────────────────────────────

export interface UpiParams {
  /** Payee VPA / UPI ID */
  pa: string;
  /** Payee name */
  pn: string;
  /** Amount */
  am: string;
  /** Transaction note (optional — omit to avoid bank risk-engine rejections) */
  tn?: string;
}
