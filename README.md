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
| `CORS_ORIGIN` | Frontend origin (default `http://localhost:5173`) |
| `BCRYPT_ROUNDS` | bcrypt cost factor (default `12`) |

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
