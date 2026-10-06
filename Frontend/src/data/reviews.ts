import type { Review } from "../types";
import { products } from "./products";

const authors = [
  "Nguyễn Minh Anh", "Trần Quốc Bảo", "Lê Thị Hà", "Phạm Đức Huy", "Vũ Thu Trang",
  "Đặng Gia Bảo", "Hoàng Ngọc Linh", "Bùi Anh Tuấn", "Đỗ Khánh Vy", "Ngô Thành Long",
];

const titles = [
  "Rất đáng tiền", "Hiệu năng ấn tượng", "Đóng gói cẩn thận, giao nhanh",
  "Sản phẩm tốt hơn mong đợi", "Chất lượng ổn định", "Sẽ mua lại lần sau",
];

const bodies = [
  "Mình đã dùng được hơn 2 tuần, hiệu năng ổn định và không gặp vấn đề gì đáng kể. Đóng gói kỹ, giao hàng nhanh hơn dự kiến.",
  "Thiết kế đẹp, cầm chắc tay, phù hợp với nhu cầu công việc hàng ngày. Giá hơi cao nhưng xứng đáng với chất lượng.",
  "So với sản phẩm cũ mình dùng thì đây là một bước tiến lớn. Hỗ trợ AI trên NEURALSTORE tư vấn khá chính xác.",
  "Pin trâu, không nóng nhiều khi dùng lâu. Rất hài lòng với trải nghiệm mua hàng tại NEURALSTORE.",
  "Đúng như mô tả, đóng gói chuyên nghiệp. Sẽ giới thiệu cho bạn bè và đồng nghiệp.",
];

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export const reviews: Review[] = products.flatMap((product, pIdx) => {
  const rand = seededRandom(pIdx + 7);
  const count = 3 + Math.floor(rand() * 3);
  return Array.from({ length: count }, (_, i) => {
    const rating = Math.max(3, Math.min(5, Math.round(product.rating + (rand() - 0.5) * 1.4)));
    return {
      id: `${product.id}-rv-${i}`,
      productId: product.id,
      author: authors[Math.floor(rand() * authors.length)],
      rating,
      title: titles[Math.floor(rand() * titles.length)],
      content: bodies[Math.floor(rand() * bodies.length)],
      date: new Date(Date.now() - Math.floor(rand() * 60) * 86400000).toISOString(),
      verified: rand() > 0.25,
      helpful: Math.floor(rand() * 40),
    } as Review;
  });
});

export const getReviewsForProduct = (productId: string) =>
  reviews.filter((r) => r.productId === productId);
