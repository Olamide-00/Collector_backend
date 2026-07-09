# Collection Tracker — Backend

Express + MongoDB (Mongoose) API for the Collection Tracker app, with Paystack
Dedicated Virtual Accounts wired in.

## Setup

```bash
npm install
cp .env.example .env
# fill in .env — see below
npm run seed:admin   # creates your first admin login
npm run dev          # starts the server with auto-reload
```

## Environment variables (`.env`)

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URI` | yes | Your MongoDB connection string (Atlas or self-hosted) |
| `JWT_SECRET` | yes | Random string, 16+ characters |
| `JWT_EXPIRES_IN` | no | Default `7d` |
| `PAYSTACK_SECRET_KEY` | yes | From your Paystack dashboard → Settings → API Keys. **Secret key only, never the public key** |
| `PAYSTACK_BASE_URL` | no | Default `https://api.paystack.co` |
| `PAYSTACK_PREFERRED_BANK` | no | Default `wema-bank` — the bank Paystack issues the dedicated account through |
| `CLIENT_URL` | no | Your frontend's origin, for CORS. Default `http://localhost:5173` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | no | Only used by `npm run seed:admin` |

The server validates these on startup and will refuse to boot with a clear
error message if a required one is missing — that's intentional, not a bug.

## Architecture

```
src/
  config/       env loading + validation, MongoDB connection
  constants/    HTTP status codes, roles, collection/account/payment enums
  models/       Mongoose schemas: User, Collection, Payment
  validations/  Joi schemas for request bodies/params
  middleware/   auth (JWT), role guard, validation runner, rate limiting, error handler
  services/     business logic — the only layer that touches models directly
  controllers/  thin HTTP layer — calls services, shapes the response
  routes/       Express routers, wire middleware + controllers together
  utils/        ApiError, catchAsync, sendSuccess, JWT helpers
  scripts/      one-off scripts (seedAdmin)
  app.js        Express app (no listening)
  server.js     connects to Mongo, then starts the app
```

Controllers never touch Mongoose models directly, and services never touch
`req`/`res` — that boundary is what keeps this swappable and testable.

## Auth

`POST /api/auth/login` → `{ token, user }`. Send the token back as
`Authorization: Bearer <token>` on every other request.

There's no public signup route by design — an **admin** account is created
once via `npm run seed:admin`, and every **debtor** (collection owner) login
is created *by* an admin, either at collection-creation time or via the
assign/reset-login endpoint. This matches the frontend flow exactly.

## Endpoints

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | public | Log in, get a JWT |
| GET | `/api/auth/me` | any | Current user |
| GET | `/api/collections` | admin | List all collections + totals |
| POST | `/api/collections` | admin | Create a collection — login is required in the body, and a dedicated Paystack account is provisioned automatically |
| GET | `/api/collections/:id` | admin, or the owning debtor | One collection |
| POST | `/api/collections/:id/account/retry` | admin | Retry Paystack account creation if it failed |
| GET | `/api/collections/:id/payments` | admin, or the owning debtor | Payment history |
| POST | `/api/collections/:id/payments` | admin | Record a manually-received payment |
| POST | `/api/collections/:id/login` | admin | Assign or reset the debtor login for a collection |
| POST | `/api/webhooks/paystack` | Paystack only (signature-verified) | Auto-records a payment when money lands in a collection's dedicated account |

## The Paystack piece

On collection creation, the backend:
1. Creates a Paystack **customer** for the collection
2. Requests a **dedicated virtual account** for that customer
3. Saves the bank name / account number / account name onto the collection

If either call fails (bad API key, Paystack account not yet approved for DVAs,
network issue), the collection is still created — `accountStatus` is just set
to `failed`, and the admin can hit the retry endpoint once it's fixed.

**Set up the webhook in your Paystack dashboard** pointing to:
```
https://your-domain.com/api/webhooks/paystack
```
Whenever someone transfers directly into a collection's dedicated account,
Paystack fires a `charge.success` event, the signature gets verified with
your secret key, and a `Payment` is recorded automatically with
`source: "paystack"` and `recordedByRole: "system"` — no admin action needed.
Manually recorded payments (e.g. someone paid into a personal account
instead) still go through the normal `POST /payments` route and show up the
same way in the history.

## A few things worth knowing before production

- Passwords are hashed with bcrypt — good. But there's no password reset flow
  yet (admin resets debtor logins directly; there's nothing for an admin to
  reset their *own* password if lost — worth adding before real users touch this).
- Rate limiting is in place on `/api` generally and more strictly on
  `/api/auth/login`, but tune the numbers for your actual traffic.
- No automated tests yet — the service layer is written so they're easy to
  add (pure functions, no `req`/`res` dependency) whenever you're ready.
- Mongoose transactions aren't used for the payment → collection balance
  update (two saves in sequence instead), since transactions need a replica
  set. Fine for a single app instance; worth revisiting if you scale writes.
