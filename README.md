# NEURALSTORE

A full-stack electronics store built with React, TypeScript, Express and MongoDB. The project covers SKU-based shopping, transactional checkout, customer orders, product reviews and an administration dashboard.

[Storefront demo](https://e-shop-iota-two.vercel.app) · [API health](https://e-shop-c8oh.onrender.com/api/health) · [Architecture and CV notes](docs/PORTFOLIO.md) · [API](docs/API.md)

## What the project demonstrates

- **Reliable checkout:** prices are calculated on the server; order creation and stock changes run in a MongoDB transaction. Idempotency keys prevent duplicate orders when a request is retried.
- **Inventory consistency:** SKU-level stock checks, optimistic version checks for admin edits, and transactional stock restoration on cancellation.
- **Authentication and authorization:** hashed passwords, JWT authentication, live database role checks and ownership checks on customer resources.
- **Payment integration:** COD and MoMo sandbox, signed requests/IPN verification, payment attempts, duplicate-notification handling and background reconciliation.
- **Product discovery:** filtering, sorting, reviews, comparison, wishlist and a rule-based shopping assistant using the current catalog. The assistant does not call an external language model.
- **Automated verification:** GitHub Actions runs frontend lint/tests/build and backend integration tests against a temporary MongoDB replica set.

MoMo sandbox creation has been verified locally. Requests from the Render deployment have returned **HTTP 403 HTML**; online payment on the hosted demo remains unresolved. Use **COD** for the portfolio demo until the hosting-to-gateway connection is verified. Automatic refunds are not implemented.

## Stack and structure

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Axios |
| Backend | Node.js, Express 5, Mongoose, MongoDB, JWT, bcrypt |
| Payments | MoMo Wallet sandbox, HMAC SHA256, server-to-server IPN |
| Testing | Node.js test runner, isolated MongoDB replica set, gateway mocks |
| Deployment | Vercel frontend, Render API, MongoDB replica set/Atlas |

```text
Frontend/src/
  components/  layouts/  pages/  routes/
  services/    stores/   types/  utils/
Backend/
  src/controllers/  src/routes/       src/middlewares/
  src/services/     src/models/       src/repositories/
  src/config/       src/chat/         src/utils/
  scripts/          test/
docs/               # Setup, architecture, API and payment notes
```

## Run locally

Requires **Node.js 22.12+** and **MongoDB with a replica set**, or MongoDB Atlas. A standalone MongoDB server cannot run the checkout/review transactions.

```bash
npm ci --prefix Backend
npm ci --prefix Frontend
```

Copy `Backend/.env.example` to `Backend/.env` and `Frontend/.env.example` to `Frontend/.env` only if those files do not already exist. Keep credentials in local files or hosting environment settings; they are excluded from Git.

Minimum backend configuration:

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27018/neuralstore?replicaSet=rs0
JWT_SECRET=<generate-a-random-secret-at-least-32-characters>
CORS_ORIGIN=http://localhost:5173
```

Frontend:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Generate a JWT secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

For local MongoDB, run `npm run db:dev --prefix Backend` in a separate terminal. It starts a dedicated replica set on port **27018**, using `.local/mongodb-27018`. It does not modify a MongoDB instance on port 27017. Set `MONGOD_BINARY` if `mongod` is not discoverable.

Start the API and storefront in separate terminals:

```bash
npm run dev --prefix Backend
npm run dev --prefix Frontend
```

The storefront opens at `http://localhost:5173`; API health is `http://localhost:5000/api/health`.

## Populate a demo and create an admin

The catalog is empty on a new database. The optional seed script inserts fictional products into **`neuralstore_demo` only** and preserves existing records:

```powershell
$env:DEMO_MONGO_URI = 'mongodb://127.0.0.1:27018/neuralstore_demo?replicaSet=rs0'
npm run seed:demo --prefix Backend
```

To use that catalog, point `MONGO_URI` to the same `neuralstore_demo` database and restart the API. The seed does not create accounts or orders.

Register through the storefront, then promote your existing account:

```bash
npm run admin --prefix Backend -- your-email@example.com
```

Sign in again and open `/admin`. No shared admin password is included. See the [demo walkthrough](docs/PORTFOLIO.md) for a short presentation sequence.

## Quality checks

```bash
node scripts/check-repository.cjs
npm run lint --prefix Frontend
npm test --prefix Frontend
npm run build --prefix Frontend
npm test --prefix Backend
```

Backend tests start an isolated, temporary replica set on a random port and do not use the application database. They require a `mongod` executable; on Windows you can set:

```powershell
$env:MONGOD_BINARY = 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe'
npm test --prefix Backend
```

The suites cover authorization, pricing, duplicate requests, concurrent inventory updates, rollback, cancellation, reviews, payment signatures, timeouts and reconciliation. See [CI](.github/workflows/ci.yml) for the automated commands.

## Documentation and current scope

- [Architecture, demo walkthrough and suggested CV wording](docs/PORTFOLIO.md)
- [Vercel / Render / MongoDB deployment](docs/DEPLOYMENT.md)
- [API contracts and business rules](docs/API.md)
- [MoMo sandbox setup and troubleshooting](docs/MOMO.md)
- [Credential handling and security](SECURITY.md)

The shopping assistant is rule-based. Wishlist/comparison/chat history are browser-local. Email password recovery, social login, product Q&A, coupons and automated refunds are not complete. Shipping prices and the 8% tax are demo business rules, not a tax or fulfillment integration.
