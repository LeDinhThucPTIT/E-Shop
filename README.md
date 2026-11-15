# NEURALSTORE

Ứng dụng thương mại điện tử với React/TypeScript, Express và MongoDB. Frontend gọi API thật cho xác thực, sản phẩm, danh mục, thương hiệu, giỏ hàng, checkout COD/MoMo, đơn hàng, hồ sơ và quản trị. Xem [hướng dẫn cấu hình MoMo sandbox, IPN và đối soát](docs/MOMO.md).

## Điểm nổi bật kỹ thuật

- Checkout dùng MongoDB transaction để tạo đơn và trừ kho cùng lúc; kiểm tra giá theo SKU ở server.
- Idempotency key chống tạo đơn trùng khi thử lại; kiểm soát version khi quản trị cập nhật tồn kho.
- JWT và kiểm tra quyền từ database; test cho phân quyền, rollback, mua đồng thời, hoàn kho và trạng thái đơn.
- GitHub Actions được cấu hình để chạy lint, test, build frontend và integration test backend với replica set tạm.

Xem [kiến trúc, dữ liệu demo và kịch bản giới thiệu](docs/PORTFOLIO.md), cùng [hướng dẫn triển khai](docs/DEPLOYMENT.md). Chưa có URL demo công khai được cấu hình trong repo.

## Chạy dự án

Yêu cầu Node.js 22.12+ và MongoDB có replica set (hoặc MongoDB Atlas). Đặt hàng, trừ tồn kho và hoàn kho sử dụng transaction, không hỗ trợ MongoDB standalone.

```powershell
npm install --prefix Backend
npm install --prefix Frontend
Copy-Item Backend/.env.example Backend/.env
Copy-Item Frontend/.env.example Frontend/.env
```

Nếu đã có `.env`, giữ cấu hình hiện tại và bổ sung các biến trong `.env.example`; không ghi đè file chứa cấu hình của bạn. Đặt `JWT_SECRET` thành chuỗi ngẫu nhiên dài ít nhất 32 ký tự. Không đưa bí mật lên Git.

Có thể tạo secret bằng `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` và tự điền vào `.env`.

MongoDB local riêng, ở terminal thứ nhất:

```powershell
npm run db:dev --prefix Backend
```

Script tự tìm MongoDB trên Windows, hoặc dùng `mongod` trong PATH. Có thể đặt `MONGOD_BINARY` thành đường dẫn mongod. Database này dùng cổng **27018**, replica set `rs0`, dữ liệu trong `.local/mongodb-27018`; không sửa MongoDB đang chạy trên cổng 27017.

Đặt `Backend/.env`:

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27018/neuralstore?replicaSet=rs0
JWT_SECRET=<secret-cua-ban>
CORS_ORIGIN=http://localhost:5173
```

Nếu dùng Atlas hoặc replica set hiện có, dùng URI tương ứng và bỏ qua `db:dev`. Backend không tự chuyển đổi dữ liệu hay cấu hình MongoDB hiện có.

Chạy API và frontend ở hai terminal khác:

```powershell
npm run dev --prefix Backend
npm run dev --prefix Frontend
```

Frontend mặc định dùng `http://localhost:5000/api`; có thể đổi qua `VITE_API_BASE_URL`. CORS có thể nhận nhiều origin, phân cách bằng dấu phẩy. Khi deploy frontend, cấu hình hosting chuyển các đường dẫn ứng dụng về `index.html`.

## Tài khoản quản trị đầu tiên

Đăng ký một tài khoản bằng giao diện (họ tên, email, điện thoại, mật khẩu ít nhất 6 ký tự). Sau đó chạy tại thư mục Backend:

```powershell
npm run admin -- email-cua-ban@example.com
```

Script chỉ nâng quyền tài khoản đã tồn tại; không tạo tài khoản/mật khẩu mặc định. Đăng nhập lại rồi mở `/admin`. Từ quản trị có thể thêm danh mục, thương hiệu và sản phẩm; database mới ban đầu chưa có sản phẩm. Không tự động import dữ liệu demo.

## Hợp đồng API

Tất cả URL có tiền tố `/api`. Các API cần đăng nhập dùng header `Authorization: Bearer <token>`. Quyền admin luôn được kiểm tra từ database; việc sửa localStorage không cấp quyền.

| Nhóm | Endpoint | Quyền |
|---|---|---|
| Trạng thái | `GET /health` | Công khai |
| Đăng ký/đăng nhập | `POST /users/register`, `POST /users/login` | Công khai |
| Hồ sơ | `GET /users/me`, `PUT /users/me` | Chính chủ |
| Người dùng | `GET /users`, `GET /users/count`, `GET/PUT/DELETE /users/:id` | Admin; GET/PUT cũng cho chính chủ |
| Sản phẩm | `GET /products`, `GET /products/:id-or-slug` | Công khai, chỉ sản phẩm đang bán |
| Đánh giá đã lưu | `GET /products/:id/reviews` | Công khai |
| Quản trị sản phẩm | `GET /products/admin/all`, `POST /products`, `PUT/DELETE /products/:id` | Admin |
| Danh mục/thương hiệu | `GET /categories`, `GET /brands`, `GET /categories/:id`, `GET /brands/:id` | Công khai |
| Sửa danh mục/thương hiệu | `POST/PUT/DELETE` trên các endpoint tương ứng | Admin |
| Giỏ hàng | `GET/POST/PUT/DELETE /cart`, `DELETE /cart/:productId?sku=...` | Đã đăng nhập |
| Tạo đơn | `POST /orders` | Đã đăng nhập, cần `Idempotency-Key` |
| Đơn của khách | `GET /orders/my-orders`, `GET /orders/my-orders/:orderCode` | Chính chủ |
| Hủy đơn | `PUT /orders/my-orders/:id/cancel` | Chính chủ, đơn đang chờ xác nhận |
| Đơn quản trị | `GET /orders/admin`, `GET /orders/admin/:id`, `PUT /orders/admin/:id/status` | Admin |
| Thống kê | `GET /orders/admin/stats` | Admin |

Sản phẩm/người dùng/đơn hàng hỗ trợ `page`, `limit` (tối đa 100). Danh sách sản phẩm hỗ trợ `search`, `category`, `brand` (ID phân cách bằng dấu phẩy), `minPrice`, `maxPrice`, `minRating`, `availability`, `sortBy`, `order`.

API danh sách phân trang trả `{ data: [], pagination: { page, limit, totalItems, totalPages } }`. Danh mục/thương hiệu trả mảng trực tiếp. Giỏ hàng và chi tiết đơn trả `{ success: true, data: ... }`. Lỗi trả `{ success: false, message }` với mã HTTP tương ứng. Axios giữ response chuẩn; từng module service lấy và chuẩn hóa dữ liệu ở ranh giới API.

Giỏ hàng `POST` thêm số lượng, `PUT` đặt lại số lượng. Body:

```json
{ "product": "<MongoDB-product-ID>", "sku": "<SKU>", "quantity": 2 }
```

Với sản phẩm không có biến thể, SKU là `product.sku`, hoặc `_id` nếu chưa có SKU. Frontend luôn gửi SKU rõ ràng. Số lượng phải là số nguyên từ 1–999 và không vượt tồn kho. Các thao tác giỏ hàng frontend được xếp hàng để tránh response về sai thứ tự; backend bảo vệ ghi đồng thời bằng version.

Tạo đơn hàng: gửi `Idempotency-Key` duy nhất cho mỗi lần xác nhận. Khi thử lại cùng nội dung, giữ nguyên key; đổi nội dung phải đổi key. Body:

```json
{
  "items": [{ "product": "<product-ID>", "sku": "<SKU>", "quantity": 1 }],
  "shippingAddress": {
    "name": "Người nhận", "phone": "0901234567", "email": "buyer@example.com",
    "street": "123 Đường A", "ward": "Phường B", "district": "Quận C", "province": "TP HCM"
  },
  "shippingMethod": "standard",
  "paymentMethod": "cod"
}
```

Server lấy giá hiện tại theo SKU trong database, bỏ qua giá/giảm giá/phí vận chuyển do client gửi. Quy tắc tính tiền hiện giữ theo giao diện cũ: thuế ước tính 8%, giao tiêu chuẩn 50.000đ (miễn phí nếu tiền hàng >20 triệu), giao nhanh 80.000đ, chưa áp dụng voucher. Đây là cấu hình nghiệp vụ của dự án, cần điều chỉnh theo chính sách bán hàng trước khi vận hành.

Tạo đơn và trừ kho nằm trong cùng transaction; lỗi ở bất kỳ sản phẩm nào sẽ rollback. Hủy đơn hoàn kho một lần. Admin chuyển trạng thái `pending → confirmed → shipping → delivered`; có thể hủy khi `pending/confirmed`. COD chỉ ghi nhận đã thanh toán khi giao thành công. Doanh thu dashboard lấy từ đơn đã thanh toán.

Khi cập nhật `stock` hoặc `variants`, gửi `expectedVersion` lấy từ `__v` của sản phẩm vừa đọc; nếu có đơn hàng hoặc người khác thay đổi dữ liệu, API trả 409 để tải lại. Frontend tự xử lý trường này. Không đổi SKU đang có trong đơn chưa hoàn tất. DELETE sản phẩm/danh mục/thương hiệu/người dùng là ẩn/khóa để giữ lịch sử.

## Kiểm tra

```powershell
npm run lint --prefix Frontend
npm test --prefix Frontend
npm run build --prefix Frontend
```

Kiểm thử tích hợp backend tự tạo **MongoDB replica set tạm**, dùng cổng ngẫu nhiên, không đọc `.env` và không chạm database hiện tại. Cần mongod trong PATH hoặc đặt `MONGOD_BINARY`:

```powershell
$env:MONGOD_BINARY = 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe'
npm test --prefix Backend
```

Test kiểm tra phân quyền, mật khẩu, giỏ hàng, giá từ database, gửi lặp yêu cầu, mua đồng thời, rollback, hoàn kho, trạng thái và thống kê. Database tạm được dọn sau test.

## Nâng cấp đánh giá và bảo vệ API

- `POST /api/products/:id/reviews` yêu cầu đăng nhập, body `{ rating, title, content }`. Mỗi tài khoản đánh giá một lần; điểm 1–5, tiêu đề tối đa 120 ký tự, nội dung tối đa 2000 ký tự.
- Nhãn đã mua hàng chỉ được server cấp nếu có đơn đã giao. Ghi đánh giá và cập nhật điểm trung bình dùng transaction, yêu cầu MongoDB replica set.
- Đăng nhập/đăng ký giới hạn chung 100 yêu cầu/IP/15 phút; chat 30 yêu cầu/IP/phút. Phản hồi 429 có `Retry-After`. Bộ giới hạn lưu trong bộ nhớ từng process; triển khai nhiều instance cần giới hạn dùng chung ở gateway. Backend mặc định không tin header IP chuyển tiếp; cấu hình proxy theo hạ tầng thực tế trước khi vận hành.

## Phạm vi còn lại

- Hỗ trợ COD và tích hợp MoMo (mặc định sandbox); MoMo cần credentials merchant và IPN public theo [hướng dẫn](docs/MOMO.md). VNPay đã ngừng tạo giao dịch mới; chuyển khoản chưa tích hợp. Hoàn tiền MoMo cần xử lý với nhà cung cấp, chưa tự động trong ứng dụng.
- Đăng nhập Google/Facebook và khôi phục mật khẩu qua email chưa tích hợp nhà cung cấp.
- Trợ lý mua sắm dùng bộ gợi ý theo quy tắc trên danh mục API, chưa gọi mô hình AI bên ngoài.
- Yêu thích/so sánh, lịch sử xem và cuộc trò chuyện vẫn lưu phía trình duyệt, chưa đồng bộ nhiều thiết bị.
- Các mục địa chỉ/phương thức thanh toán/cài đặt mở rộng trong hồ sơ và hỏi đáp sản phẩm chưa có đầy đủ nghiệp vụ.
