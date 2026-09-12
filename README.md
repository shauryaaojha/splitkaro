# SplitKaro

A mobile-first PWA for friend groups to track shared expenses, auto-split bills and settle dues directly over **UPI** — no app download needed. Built for India, where UPI is the default payment rail.

Core loop: **Create Group → Add Expense → Auto-Split → Settle via UPI QR / deep link.**

**Stack:** Next.js (App Router) · React · TypeScript · MongoDB / Mongoose · JWT auth · Nodemailer (OTP + invites) · Google OAuth · `qrcode` · zod · SWR

## Features

- **Auth** — email + OTP verification, password login, Google sign-in, profile completion with UPI ID.
- **Groups** — create, invite by link/email, join via `/join/[token]`, leave, transfer admin.
- **Expenses** — add/edit/delete per group, split among members, per-group balance view.
- **Auto Settle** — debt simplification collapses chains (A→B→C ⇒ A→C) into the minimum number of transfers (`lib/settle.ts`).
- **UPI settlement** — generates a UPI QR / deep link for each due (`/api/upi/qr`); settlements are recorded per group.
- **Friends** — send/accept friend requests, see balances across groups on the dashboard.
- **Activity feed & notifications** — in-app notifications with read state, email unsubscribe.

## Run it

```bash
npm install
# .env.local: MONGODB_URI, JWT_SECRET, SMTP_HOST/PORT/USER/PASS, MAIL_FROM,
#             GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_APP_URL
npm run dev        # http://localhost:3000
```

## Routes

| Area | Pages |
| --- | --- |
| Auth | `/login`, `/register`, `/verify`, `/complete-profile`, `/signup` |
| App | `/` (dashboard), `/groups`, `/groups/new`, `/groups/[id]`, `/groups/[id]/expense/*`, `/groups/[id]/settle`, `/groups/[id]/invite`, `/friends`, `/activity`, `/profile` |
| Invite | `/join/[token]` |

API lives under `app/api/` — `auth/*`, `groups/*` (expenses, balances, settle, settlements, leave, transfer-admin), `friends/*`, `settlements`, `notifications/*`, `invite/email`, `upi/qr`, `dashboard/balances`.

## Layout

```
app/(auth)/      login / register / verify / complete-profile
app/(app)/       dashboard, groups, friends, activity, profile
app/api/         route handlers
components/      UI
hooks/           SWR data hooks
lib/             auth, db, otp, mail, google, balance, settle, upi
models/          User, Group, Expense, Settlement, Notification, Unsubscribe
proxy.ts         route gating
```

Product spec: [`../prd.md`](../prd.md).
