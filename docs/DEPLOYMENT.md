# Deployment

Deploy this repository as a separate frontend and API service. It is not the FindJob repository. Never copy another project's database configuration into this service.

## Backend — Render

| Setting | Value |
| --- | --- |
| Repository directory | `Backend` (case-sensitive) |
| Runtime | Node.js 22.12+ |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check | `/api/health` |

Set these variables in the backend service's Environment settings:

```dotenv
MONGO_URI=<MongoDB Atlas or replica set connection string>
JWT_SECRET=<random secret of at least 32 characters>
CORS_ORIGIN=https://<your-frontend-domain>
```

Use the service-provided `PORT`. Atlas must allow the service's outbound IP ranges and the database user must have the required permissions. The API verifies replica set support at startup and creates indexes; it does not seed or migrate the application database automatically.

If using MoMo, also configure the six variables in [MOMO.md](MOMO.md). `.env.local` is ignored by Git and is not deployed automatically. The startup marker `[MoMo config v1] READY` confirms only presence/URL validation, not credentials or gateway connectivity. A missing MoMo configuration does not prevent COD from working.

## Frontend — Vercel

| Setting | Value |
| --- | --- |
| Root Directory | `Frontend` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

```dotenv
VITE_API_BASE_URL=https://<your-api-domain>/api
```

Include `/api` in the base URL. Frontend environment values are baked into the build; changing them requires a new deployment. `Frontend/vercel.json` rewrites navigation paths to `index.html`, so `/checkout`, `/orders/...` and payment return URLs survive refresh/direct navigation.

## Smoke checks

1. Confirm the deployment is connected to the correct repository and root directory; wait for startup to complete.
2. Check `/api/health`, open the storefront and register/sign in.
3. Reload a nested frontend route and confirm CORS allows the exact frontend origin.
4. Verify a COD checkout in a demo database before testing MoMo sandbox.
5. Verify IPN is reachable publicly, then use MoMo Test with sandbox credentials. Do not mark a payment successful from a return URL alone.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `uri ... undefined` | Exact `MONGO_URI` variable on the API service |
| MongoDB standalone error | Atlas/replica set instead of standalone MongoDB |
| `/checkout` returns 404 | Vercel Root Directory and SPA rewrite deployment |
| Missing MoMo variables | API service Environment, save/deploy, startup diagnostics |
| MoMo `403 text/html` | Hosting-to-gateway access; retain HTTP status/content type and contact the provider with timestamp/outbound IP information |
| Request is 400 | Read the JSON `message`; validate address, method, amount and stock |
| JWT invalid after rotation | Sign in again; previous JWTs were signed with the old key |

Environment files were tracked in earlier revisions. See [SECURITY.md](../SECURITY.md) before sharing the repository.
