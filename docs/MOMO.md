# MoMo sandbox

## Configuration

Place local settings in `Backend/.env.local` or configure them on the backend hosting service. Hosting environment variables take precedence over local files.

```dotenv
MOMO_PARTNER_CODE=<your sandbox partner code>
MOMO_ACCESS_KEY=<your sandbox access key>
MOMO_SECRET_KEY=<your sandbox secret key>
MOMO_REDIRECT_URL=http://localhost:5173/checkout/payment-result
MOMO_IPN_URL=https://<public-backend>/api/payments/momo/ipn
MOMO_API_BASE_URL=https://test-payment.momo.vn/v2/gateway/api
```

Do not put merchant secrets in frontend environment variables. The return URL points to the frontend; IPN points to the backend and must be publicly reachable. For local development, use an HTTPS tunnel you control for IPN. A localhost URL cannot receive a callback from MoMo servers. Use a MoMo Test account/app for sandbox payment confirmation.

Use the same frontend origin when starting checkout and returning from MoMo so the browser can retain the login session. No embedded test merchant credentials are provided by the repository. COD does not need a MoMo configuration.

## Payment flow

1. Create an order with `paymentMethod: "momo"` and an `Idempotency-Key`. The server validates SKU prices, reserves stock and stores the order transactionally. Wallet amounts must be integer VND between 1,000 and 50,000,000; invalid totals roll back stock changes.
2. Call `POST /api/payments/momo/create` with JWT and `{ "orderId": "<MongoDB order ID>" }`. A persisted attempt and initiation lease prevent duplicate creation. The API calls MoMo `captureWallet`, using native `https.request` and a signed JSON payload. It returns `paymentUrl` and `expiresAt`.
3. The browser opens MoMo's hosted payment page. A successful create request means a session/link was created, not that money was received. QR is shown by MoMo after a valid session is available; this version does not render an on-site QR.
4. MoMo sends `POST /api/payments/momo/ipn`. The API verifies HMAC SHA256 and partner/order/request IDs and amount. Valid notifications return 204; duplicate notifications do not apply payment twice.
5. The browser returns to `/checkout/payment-result?orderId=<attempt-reference>`. The frontend reads server-side state through authenticated `GET /api/payments/momo/result/:reference`. Redirect query parameters cannot mark the order paid.

`GET /api/payments/orders/:id` returns the authenticated customer's payment/order state. Customers can retry within the order's payment window from order details. Admin can see payment status and reconciliation flags.

## Reliability and limits

- Signed request field order follows the MoMo Wallet API. IPN signatures use constant-time comparison. `secretKey` is never sent in the request body; raw signature strings and response bodies are not logged.
- Native HTTPS sends an accurate byte `Content-Length`, collects all response chunks before JSON parsing, limits responses to 1 MiB and uses a 30-second timeout. The frontend waits up to 40 seconds for creation.
- Server-side gateway responses must match IDs and amount. Create response signatures are checked when supplied. Query results are correlated over HTTPS; that API does not specify the same response signature as IPN.
- A timeout retains the same attempt/orderId/requestId. A new attempt is permitted only after a known terminal failure. Unknown or processing results retain stock for reconciliation.
- New payment initiation closes 15 minutes after order creation. This is the store's deadline; it does not assert that MoMo's own URL expires at the same moment.
- A worker queries pending attempts and checks expired orders. Orders with no attempt or only confirmed failures can be cancelled/restocked. Unresolved payment attempts block cancellation. The worker runs in the API process and resumes on restart; it is not a durable queue or distributed rate limiter.
- Orders cannot be confirmed/shipped until paid and clear of review flags. Late success after cancellation or a second settlement sets `paymentNeedsReview`; automatic refunds are not implemented.
- `resultCode=0` from verified IPN or a server-side query marks paid. Authorization/processing/unknown states remain pending until a final result is verified.

## Current hosted issue

Sandbox creation with the supplied local configuration returned success, a payment URL and QR data during development. The Render deployment has returned **HTTP 403 with `text/html`** from the gateway path. This is not a valid payment response; no QR/session can be produced from it. The cause of that environment-specific access failure has not been established.

Inspect `[MoMo gateway]` log metadata: operation, environment, HTTP status, content type and result code when available. Do not infer a bad signature from a non-JSON 403. Check the configured environment, record the timestamp and service outbound IP ranges, and ask the provider to inspect the rejected request. A change from fetch to native HTTPS does not guarantee a hosting access problem is solved.

Use COD for the hosted portfolio walkthrough while the 403 remains unresolved. Local sandbox success is not production settlement verification.

## Legacy data and production

Existing VNPay order methods/labels remain readable. New checkout only accepts COD and MoMo. Attempts without provider metadata are treated as legacy VNPay; the MoMo worker does not query them. Resolve old outstanding VNPay sessions separately before migrating a deployment that actually used them.

For production, obtain production merchant credentials, change `MOMO_API_BASE_URL` to `https://payment.momo.vn/v2/gateway/api`, use HTTPS frontend/backend URLs, validate IPN delivery and establish an operational refund/reconciliation process before accepting live payments.

Official references: [Wallet API](https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/), [IPN](https://developers.momo.vn/v3/docs/payment/api/result-handling/notification/), [Query](https://developers.momo.vn/v3/docs/payment/api/payment-api/query/), [Result codes](https://developers.momo.vn/v3/docs/payment/api/result-handling/resultcode/).
