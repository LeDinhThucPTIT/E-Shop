# API reference

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


## Payments

Online checkout accepts `paymentMethod: "momo"`. See [MoMo integration](MOMO.md) for gateway routes and reconciliation. An online order cannot be confirmed or shipped until payment is verified; cancellation is blocked while a payment is unresolved or requires a refund.
