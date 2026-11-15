// Pure rules: this module never calls an external AI service or mutates a cart.
const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
const words = (value) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const contains = (text, phrase) =>
  ` ${words(text)} `.includes(` ${words(phrase)} `);
const money = (amount) => new Intl.NumberFormat("vi-VN").format(amount) + "đ";
const groups = {
  laptop: ["laptop", "macbook", "may tinh xach tay"],
  smartphone: ["dien thoai", "smartphone", "iphone"],
  headphones: ["tai nghe", "headphones", "headphone", "airpods"],
  smartwatch: ["dong ho", "smartwatch", "apple watch"],
  gpu: ["gpu", "card do hoa", "vga", "rtx", "radeon"],
  cpu: ["cpu", "vi xu ly", "ryzen", "intel core"],
  monitor: ["man hinh", "monitor"],
  keyboard: ["ban phim", "keyboard"],
  mouse: ["chuot", "mouse"],
  "smart-home": ["nha thong minh", "smart home"],
  "ai-hardware": ["ai hardware", "jetson", "kinh vr"],
};

function offer(product) {
  const variants = (product.variants || []).filter(
    (v) => Number.isSafeInteger(v.price) && v.price >= 0,
  );
  const available = variants.filter((v) => v.stock > 0);
  const selected = [...(available.length ? available : variants)].sort(
    (a, b) => a.price - b.price || String(a.sku).localeCompare(String(b.sku)),
  )[0];
  return {
    price: selected ? selected.price : (product.discountPrice ?? product.price),
    sku: selected?.sku || product.sku || String(product._id),
    stock: selected ? selected.stock : product.stock || 0,
    image: selected?.image || product.images?.[0] || product.thumbnail,
    variant: selected
      ? [selected.color, selected.storage].filter(Boolean).join(" - ") ||
        selected.sku
      : "",
  };
}

function categoryOf(text, catalog) {
  for (const [key, aliases] of Object.entries(groups))
    if (aliases.some((alias) => contains(text, alias))) return key;
  for (const product of catalog) {
    const category = product.category;
    if (
      category &&
      typeof category === "object" &&
      [category.name, category.slug].some(
        (name) => name && contains(text, name),
      )
    )
      return category.slug || category.name;
  }
  return null;
}
function matchesCategory(product, category) {
  if (!category) return true;
  const taxonomy =
    typeof product.category === "object"
      ? `${product.category?.slug || ""} ${product.category?.name || ""}`
      : product.category;
  if (contains(taxonomy, category)) return true;
  return (groups[category] || [category]).some((alias) =>
    contains(`${product.name} ${taxonomy}`, alias),
  );
}
function brandOf(text, catalog) {
  return (
    [
      ...new Set(
        catalog
          .map((p) => (typeof p.brand === "object" ? p.brand?.name : p.brand))
          .filter(Boolean),
      ),
    ]
      .sort((a, b) => b.length - a.length)
      .find((brand) => contains(text, brand)) || null
  );
}
function number(value) {
  const parts = value.split(/[.,]/);
  return parts.length > 1 && parts.slice(1).every((part) => part.length === 3)
    ? Number(parts.join(""))
    : Number(value.replace(",", "."));
}
function multiplier(unit = "") {
  return /^(trieu|tr|m)$/.test(unit)
    ? 1e6
    : /^(nghin|ngan|k)$/.test(unit)
      ? 1e3
      : 1;
}
function budgetOf(text) {
  const q = normalize(text);
  const unit = "(trieu|tr\\b|m\\b|nghin|ngan|k\\b|vnd|dong|d\\b)";
  const amount = "(\\d+(?:[.,]\\d+)*)";
  const range = q.match(
    new RegExp(
      `(?:tu|khoang|tam)?\\s*${amount}\\s*${unit}?\\s*(?:den|toi|[-–])\\s*${amount}\\s*${unit}`,
    ),
  );
  if (range)
    return {
      minPrice: Math.round(number(range[1]) * multiplier(range[2] || range[4])),
      maxPrice: Math.round(number(range[3]) * multiplier(range[4])),
    };
  const single = q.match(new RegExp(`${amount}\\s*${unit}`));
  const plain = /(?:ngan sach|gia|duoi|tren|toi da|toi thieu)/.test(q)
    ? q.match(/\b(\d{5,})\b/)
    : null;
  if (!single && !plain) return null;
  const value = Math.round(
    number((single || plain)[1]) * multiplier(single?.[2]),
  );
  if (!Number.isSafeInteger(value) || value < 0) return null;
  return /(?:tren|toi thieu|it nhat)\s*\d/.test(q)
    ? { minPrice: value, maxPrice: null }
    : { minPrice: null, maxPrice: value };
}
function purposeOf(text) {
  if (
    ["lap trinh", "coding", "developer", "code"].some((s) => contains(text, s))
  )
    return "programming";
  if (["gaming", "choi game", "game"].some((s) => contains(text, s)))
    return "gaming";
  if (["machine learning", "huan luyen", "ai"].some((s) => contains(text, s)))
    return "ml";
  if (
    ["hoc tap", "sinh vien", "hoc online", "van phong"].some((s) =>
      contains(text, s),
    )
  )
    return "study";
  return null;
}
function namedProducts(text, catalog) {
  const query = words(text);
  const ignored = new Set([
    "laptop",
    "phone",
    "smartphone",
    "test",
    "pro",
    "max",
    "plus",
    "may",
    "tinh",
    "apple",
    "samsung",
    "gaming",
  ]);
  return catalog.filter((p) => {
    if (contains(query, p.name) || (p.slug && contains(query, p.slug)))
      return true;
    const distinctive = words(p.name)
      .split(" ")
      .filter((word) => word.length > 2 && !ignored.has(word));
    const matched = distinctive.filter((word) => contains(query, word));
    return matched.length >= 2 || matched.some((word) => /\d/.test(word));
  });
}
function references(text, focus, catalog) {
  const named = namedProducts(text, catalog);
  if (named.length) return named;
  const ordinals = [
    ...normalize(text).matchAll(
      /(?:mau|san pham|so|thu|cai)\s*(?:thu\s*)?([1-5]|nhat|hai|ba|bon|nam)\b/g,
    ),
  ];
  if (ordinals.length) {
    const indices = ordinals.map(
      (match) =>
        ({ nhat: 1, hai: 2, ba: 3, bon: 4, nam: 5 })[match[1]] ||
        Number(match[1]),
    );
    return [...new Set(indices)]
      .map((index) => focus[index - 1])
      .filter(Boolean);
  }
  return focus;
}
function apply(text, state, focus, catalog) {
  const category = categoryOf(text, catalog);
  const brand = brandOf(text, catalog);
  const budget = budgetOf(text);
  const purpose = purposeOf(text);
  if (/(?:bat dau lai|doi chu de|xoa bo loc)/.test(normalize(text)))
    Object.assign(state, {
      category: null,
      brand: null,
      minPrice: null,
      maxPrice: null,
      purpose: null,
    });
  if (category && category !== state.category) {
    state.category = category;
    state.brand = null;
  }
  if (brand) state.brand = brand;
  if (
    /(?:bat ky thuong hieu|khong can thuong hieu|bo thuong hieu)/.test(
      normalize(text),
    )
  )
    state.brand = null;
  if (purpose) state.purpose = purpose;
  if (budget) Object.assign(state, budget);
  if (/(?:khong gioi han|bo ngan sach|bat ky gia)/.test(normalize(text)))
    Object.assign(state, { minPrice: null, maxPrice: null });
  const relevant = references(text, focus, catalog);
  if (
    !budget &&
    relevant.length &&
    /(?:re hon|gia thap hon)/.test(normalize(text))
  )
    state.maxPrice = Math.min(
      state.maxPrice ?? Infinity,
      offer(relevant[0]).price - 1,
    );
  if (
    !budget &&
    relevant.length &&
    /(?:dat hon|gia cao hon)/.test(normalize(text))
  )
    state.minPrice = Math.max(
      state.minPrice ?? 0,
      offer(relevant[0]).price + 1,
    );
}
function score(product, purpose) {
  const terms =
    {
      programming: ["lap trinh", "developer", "coding"],
      gaming: ["gaming", "game"],
      ml: ["ai", "machine learning", "gpu"],
      study: ["hoc tap", "van phong", "sinh vien"],
    }[purpose] || [];
  const text = `${product.name} ${(product.tags || []).join(" ")} ${product.description || ""}`;
  return (
    (product.rating || 0) * 10 +
    (product.featured ? 3 : 0) +
    terms.filter((term) => contains(text, term)).length * 20
  );
}
function snapshot(product) {
  const selected = offer(product);
  return { ...product, chatOffer: selected };
}
function compare(products) {
  const rows = products.map((p, index) => {
    const selected = offer(p);
    const specs = (p.specifications || [])
      .slice(0, 6)
      .map((s) => `   ${s.name || s.label}: ${s.value}`)
      .join("\n");
    return `${index + 1}. ${p.name}\n   Giá: ${money(selected.price)}${selected.variant ? ` (${selected.variant})` : ""}\n   ${selected.stock > 0 ? `Còn ${selected.stock} sản phẩm ở phiên bản này` : "Hết hàng"}${specs ? "\n" + specs : ""}${p.warranty ? `\n   Bảo hành: ${p.warranty} tháng` : ""}`;
  });
  const cheapest = [...products].sort(
    (a, b) => offer(a).price - offer(b).price,
  )[0];
  const difference =
    Math.max(...products.map((p) => offer(p).price)) - offer(cheapest).price;
  return `So sánh theo thông tin hiện có trong cửa hàng:\n\n${rows.join("\n\n")}\n\n${difference ? `${cheapest.name} có giá thấp nhất, chênh ${money(difference)} so với mẫu giá cao nhất.` : "Các mẫu có cùng mức giá."} Mình chỉ đối chiếu thông số đã lưu, chưa có kết quả đo hiệu năng thực tế.`;
}

function respond(message, history, inputCatalog) {
  const catalog = inputCatalog.filter(
    (p) =>
      p.isActive !== false &&
      Number.isSafeInteger(offer(p).price) &&
      offer(p).price >= 0,
  );
  const byId = new Map(catalog.map((p) => [String(p._id), p]));
  const state = {
    category: null,
    brand: null,
    minPrice: null,
    maxPrice: null,
    purpose: null,
  };
  let focus = [];
  for (const turn of history) {
    if (turn.role === "user") apply(turn.content, state, focus, catalog);
    else if (turn.productIds?.length)
      focus = turn.productIds.map((id) => byId.get(id)).filter(Boolean);
  }
  const previousCategory = state.category;
  apply(message, state, focus, catalog);
  if (
    state.category !== previousCategory &&
    !namedProducts(message, catalog).length
  )
    focus = [];
  const q = normalize(message);
  const answer = (text, products = []) => ({
    text,
    recommendedProducts: products.slice(0, 5).map(snapshot),
  });
  if (/(?:phi van chuyen|phi ship|giao hang|bao lau)/.test(q))
    return answer(
      "Giao tiêu chuẩn: 50.000đ, miễn phí khi tiền hàng trên 20 triệu; giao nhanh: 80.000đ. Thời gian dự kiến tương ứng 3–5 ngày và 1–2 ngày. Tổng tiền và phí chính xác được xác nhận ở bước đặt hàng.",
    );
  if (/(?:thanh toan|vnpay|momo|chuyen khoan|\bcod\b)/.test(q))
    return answer(
      "Cửa hàng hỗ trợ thanh toán khi nhận hàng (COD) và MoMo khi được cấu hình. VNPay và chuyển khoản chưa được kích hoạt. Bạn có thể đặt hàng từ giỏ hàng và xem trạng thái thanh toán trong chi tiết đơn.",
    );
  if (/(?:don hang|huy don|kiem tra don)/.test(q))
    return answer(
      "Đăng nhập rồi mở mục Đơn hàng để xem trạng thái và chi tiết đơn của bạn. Bạn có thể hủy đơn đang chờ xác nhận; đơn đã được xác nhận cần liên hệ cửa hàng. Chatbot không tự truy cập hoặc thay đổi đơn hàng.",
    );
  const relevant = references(message, focus, catalog);
  if (
    /(?:bao hanh|thong so|cau hinh)/.test(q) &&
    relevant.length &&
    !/(?:so sanh|tim|goi y)/.test(q)
  ) {
    return answer(
      relevant
        .slice(0, 3)
        .map(
          (p) =>
            `${p.name}:\n${
              (p.specifications || [])
                .slice(0, 6)
                .map((s) => `${s.name || s.label}: ${s.value}`)
                .join("\n") || "Chưa có thông số chi tiết."
            }\n${p.warranty ? `Bảo hành: ${p.warranty} tháng.` : "Chưa có thông tin bảo hành; vui lòng liên hệ cửa hàng."}`,
        )
        .join("\n\n"),
      relevant,
    );
  }
  if (/(?:con hang|ton kho|het hang)/.test(q)) {
    if (!relevant.length)
      return answer(
        "Bạn muốn kiểm tra sản phẩm nào? Hãy gửi tên sản phẩm hoặc chọn “mẫu thứ 1/2” trong danh sách vừa gợi ý.",
      );
    return answer(
      relevant
        .slice(0, 5)
        .map((p) => {
          const selected = offer(p);
          const detail = p.variants?.length
            ? p.variants.map((v) => `${v.sku}: ${v.stock || 0}`).join(", ")
            : `${p.stock || 0} sản phẩm`;
          return `${p.name}: ${selected.stock > 0 ? "còn hàng" : "hết hàng"} (${detail}).`;
        })
        .join("\n"),
      relevant,
    );
  }
  let candidates = catalog.filter(
    (p) =>
      matchesCategory(p, state.category) &&
      (!state.brand ||
        contains(
          typeof p.brand === "object" ? p.brand?.name : p.brand,
          state.brand,
        )) &&
      (state.minPrice === null || offer(p).price >= state.minPrice) &&
      (state.maxPrice === null || offer(p).price <= state.maxPrice),
  );
  if (/(?:so sanh|khac nhau|chon mau nao)/.test(q)) {
    const selected =
      relevant.length >= 2
        ? relevant.slice(
            0,
            /(?:hai|2) mau/.test(q) || !namedProducts(message, catalog).length
              ? 2
              : 3,
          )
        : namedProducts(message, catalog).length
          ? relevant
          : [];
    if (selected.length < 2)
      return answer(
        "Bạn muốn so sánh những mẫu nào? Hãy gửi tên hai sản phẩm, hoặc tìm sản phẩm trước rồi nhắn “so sánh hai mẫu này”.",
        selected,
      );
    return answer(compare(selected), selected);
  }
  if (/(?:them.*gio|mua mau|mua cai)/.test(q))
    return answer(
      "Bạn có thể bấm nút giỏ hàng trên thẻ sản phẩm bên dưới để thêm đúng phiên bản và giá đang hiển thị. Hệ thống sẽ kiểm tra tồn kho và yêu cầu đăng nhập.",
      relevant,
    );
  if (/^(?:xin chao|chao|hello|hi|cam on|thanks)[!.\s]*$/.test(q))
    return answer(
      "Chào bạn! Mình có thể tìm sản phẩm theo ngân sách, kiểm tra tồn kho và so sánh thông số. Ví dụ: “Laptop lập trình từ 15 đến 25 triệu”, rồi hỏi “có mẫu rẻ hơn không?”.",
    );
  if (
    !state.category &&
    !state.brand &&
    state.maxPrice === null &&
    state.minPrice === null &&
    !state.purpose &&
    !namedProducts(message, catalog).length &&
    !/(?:goi y|san pham|re nhat)/.test(q)
  )
    return answer(
      "Mình hỗ trợ chọn sản phẩm trong cửa hàng. Bạn muốn tìm loại thiết bị nào và ngân sách khoảng bao nhiêu? Mình cũng có thể trả lời về phí giao hàng, thanh toán và cách xem đơn hàng.",
    );
  const named = namedProducts(message, catalog);
  if (named.length && !/(?:re hon|dat hon)/.test(q))
    candidates = candidates.filter((p) => named.includes(p));
  candidates = candidates.filter((p) => offer(p).stock > 0);
  const cheap = /(?:re hon|re nhat|gia thap)/.test(q);
  candidates.sort(
    (a, b) =>
      (cheap
        ? offer(a).price - offer(b).price
        : score(b, state.purpose) - score(a, state.purpose) ||
          offer(a).price - offer(b).price) ||
      String(a._id).localeCompare(String(b._id)),
  );
  const selected = candidates.slice(0, 5);
  if (!selected.length)
    return answer(
      "Chưa có sản phẩm còn hàng phù hợp với các tiêu chí hiện tại. Bạn có thể tăng ngân sách, đổi thương hiệu hoặc nhắn “bỏ ngân sách” / “xóa bộ lọc”. Mình sẽ không tự gợi ý sản phẩm vượt mức bạn đã đặt.",
    );
  const criteria = [
    state.category && `loại ${state.category}`,
    state.brand && `thương hiệu ${state.brand}`,
    state.minPrice !== null && `từ ${money(state.minPrice)}`,
    state.maxPrice !== null && `đến ${money(state.maxPrice)}`,
  ]
    .filter(Boolean)
    .join(", ");
  return answer(
    `Các sản phẩm còn hàng${criteria ? ` theo tiêu chí ${criteria}` : ""}:\n\n${selected
      .map((p, index) => {
        const selected = offer(p);
        return `${index + 1}. ${p.name} — ${money(selected.price)}${selected.variant ? ` (${selected.variant})` : ""}`;
      })
      .join(
        "\n",
      )}\n\nBạn có thể hỏi “mẫu thứ 2 còn hàng không?”, “có mẫu rẻ hơn không?” hoặc “so sánh hai mẫu này”. Giá trên là giá sản phẩm, chưa gồm phí giao hàng và thuế ước tính khi đặt hàng.`,
    selected,
  );
}
module.exports = { respond, offer, budgetOf };
