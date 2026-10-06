# NEURALSTORE — AI Shopping cho thiết bị điện tử

Nền tảng thương mại điện tử điện tử ứng dụng AI, xây dựng bằng React + TypeScript + Vite.

## Cài đặt

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
npm run preview
```

## Công nghệ

- React 19 + TypeScript + Vite
- React Router DOM (routing)
- Zustand (state management, persist qua localStorage)
- Tailwind CSS (design system)
- Lucide React (icon system)

## Kiến trúc

Xem `src/` — được tổ chức theo components/pages/stores/data/utils như mô tả trong tài liệu dự án.

## Ghi chú quan trọng

- Đây là bản demo **frontend-only**. Xác thực người dùng, thanh toán, và khu vực quản trị (`/admin`)
  đều được mô phỏng (mock) — không có backend hay xử lý giao dịch thật.
- Trợ lý AI (`/ai-assistant`) sử dụng một "recommendation engine" mock nằm trong
  `src/utils/aiService.ts`. Toàn bộ logic được đóng gói trong hàm `getAIResponse()`,
  có thể thay thế bằng lời gọi API thật (OpenAI, Gemini, Claude, ...) mà không cần
  sửa bất kỳ UI nào.
- Dữ liệu giỏ hàng, yêu thích, so sánh, đơn hàng và tài khoản được lưu trong `localStorage`
  của trình duyệt (qua Zustand `persist` middleware).
