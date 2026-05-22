# Banking Backend API

Node.js REST API (Express + MongoDB) that replaces the in-browser Redux logic for users, accounts, balances, and transfers.

## Requirements

- Node.js 20+
- MongoDB Atlas cluster (recommended) or a local MongoDB instance configured as a replica set

## Setup

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL (MongoDB Atlas connection string) and JWT_SECRET (min 16 chars)

npm install
npm run dev
```

The API listens on `http://localhost:3000`. Health check: `GET /health`.

Optional demo user:

```bash
npm run seed
# email: demo@bank.com  password: DemoPass1!
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `3000`) |
| `DATABASE_URL` | MongoDB connection string (Atlas `mongodb+srv://...` recommended) |
| `JWT_SECRET` | Secret for signing JWTs (min 16 chars) |
| `JWT_ACCESS_EXPIRES` | Access token TTL (default `1h`) |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL (default `7d`) |
| `CORS_ORIGIN` | Frontend origin (default `http://localhost:5173`; set to your deployed frontend URL on Render) |
| `BCRYPT_ROUNDS` | bcrypt cost factor (default `12`) |

## Deploy to Render

This API runs as a long-lived Node web service on Render via [`src/index.js`](./src/index.js) (`npm start`).

### 1. Create the service

1. Open the [Render Dashboard](https://dashboard.render.com).
2. **New → Blueprint** and connect GitHub repo `Coldcolin/BankApiCohort7` (repo root is this `server/` directory), **or** **New → Web Service** with:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/health`
3. If using the blueprint, [`render.yaml`](./render.yaml) applies the same settings automatically.

### 2. Set environment variables

In Render **Environment**, set:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | MongoDB Atlas connection string |
| `JWT_SECRET` | Strong secret (min 16 chars) |
| `CORS_ORIGIN` | Your deployed frontend URL (e.g. `https://your-frontend.example.com`) |
| `NODE_ENV` | `production` |

Render injects `PORT` automatically; do not override it.

### 3. MongoDB Atlas

In Atlas **Network Access**, allow Render outbound IPs. On Render's free tier the simplest option is `0.0.0.0/0` (allow from anywhere). Confirm the database user in `DATABASE_URL` matches Atlas credentials.

### 4. Verify deployment

```bash
curl https://<your-service>.onrender.com/health
# {"status":"ok"}

curl -I https://<your-service>.onrender.com/api-docs
# 200 OK
```

Update [`openapi.yaml`](./openapi.yaml) `servers` production URL to match your Render hostname.

**Note:** Free Render web services spin down after ~15 minutes of inactivity; the first request after idle may take 30–60 seconds.

### Post-migration checklist

- Delete or disable the old Vercel project for this API.
- Point your frontend API base URL to `https://<your-service>.onrender.com/api/v1`.
- Rotate `JWT_SECRET` if it was ever committed or exposed in deployment logs.

## API base path

All routes are under `/api/v1`.

## Frontend integration map

| Redux action | HTTP endpoint |
|--------------|---------------|
| `signUp` | `POST /auth/signup` |
| `logIn` | `POST /auth/login` |
| `logOut` | `POST /auth/logout` |
| `transferFunds` | `POST /transfers` (use `recipientUserId`, not `reciepientID`) |
| `deleteAccount` | `DELETE /users/:id` |
| `addNewAccount` | `POST /accounts` |

Store `accessToken` from login/signup responses. Send it as `Authorization: Bearer <token>` on protected routes.

## Breaking differences from Redux

- Passwords are hashed with bcrypt; never returned in responses.
- User `id` is a MongoDB ObjectId string, not `Date.now()`.
- Transfer balance check uses strict `>` (same as Redux): exact balance transfers are rejected.
- `GET /auth/me` includes optional `totalBalance` (sum of all account balances).
- Add-account allowance errors return `{ message, amountAllowable, code }` with clear values (fixes frontend bug).

## curl examples

Replace `TOKEN`, account IDs, and account numbers with values from your responses.

### Sign up

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePass1!",
    "confirmPassword": "SecurePass1!"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"SecurePass1!"}'
```

### Current user

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer TOKEN"
```

### List accounts

```bash
curl http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer TOKEN"
```

### Add account

```bash
curl -X POST http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accountName":"Savings","amount":50000}'
```

### Lookup recipient (transfer UI)

```bash
curl http://localhost:3000/api/v1/accounts/lookup/ACC482917 \
  -H "Authorization: Bearer TOKEN"
```

### Get account by number

```bash
curl http://localhost:3000/api/v1/accounts/ACC482917 \
  -H "Authorization: Bearer TOKEN"
```

### Transfer funds

```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "senderAccountId": "SENDER_ACCOUNT_ID",
    "recipientAccountNumber": "ACC111222",
    "recipientUserId": "RECIPIENT_USER_ID",
    "amount": 5000,
    "memo": "Rent"
  }'
```

### Transaction history

```bash
curl http://localhost:3000/api/v1/transactions \
  -H "Authorization: Bearer TOKEN"
```

### Delete user

```bash
curl -X DELETE http://localhost:3000/api/v1/users/USER_ID \
  -H "Authorization: Bearer TOKEN"
```

## Tests

```bash
npm test
```

Tests use an in-memory MongoDB replica set via `mongodb-memory-server` (no Docker required). On first run, a MongoDB binary may be downloaded (~600 MB).

To run tests against your own MongoDB instead, set `MONGODB_TEST_URI` to a dedicated test database connection string before running `npm test`.

## OpenAPI

Interactive docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Raw spec: [http://localhost:3000/openapi.yaml](http://localhost:3000/openapi.yaml) or [openapi.yaml](./openapi.yaml)
