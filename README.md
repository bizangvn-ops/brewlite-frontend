# BrewLite — Frontend web tĩnh (Menu + Lịch sử đơn)

Demo frontend tĩnh cho đồ uống BrewLite theo **plan.md** và đề bài **BrewLite-CongNghePhanMem.pdf**:

- **Task 3 — Trang Menu** (`index.html`): hero liquid, lưới 15 sản phẩm (**10 món nước + 5 món ăn vặt, có ảnh minh họa**), tìm kiếm không phân biệt hoa/thường + dấu, lọc theo danh mục kèm số lượng, trạng thái loading/empty/error/no-results, món hết hàng, nút thêm nhanh vào giỏ (size M).
- **Task 9 — Lịch sử đơn** (`orders.html`): thống kê tổng quan, lọc theo trạng thái, danh sách đơn (mới nhất lên đầu), badge 7 trạng thái đúng bảng màu đề bài, bấm vào đơn để mở/đóng chi tiết món (hỗ trợ bàn phím, `aria-expanded`).
- **Giỏ hàng dùng chung**: drawer mở từ header, thêm/xóa/tăng giảm số lượng, tạm tính, lưu bằng `localStorage` (khóa `brewlite_cart`) và đồng bộ giữa hai trang.

Giao diện được làm mới theo hướng **ấm, tối giản kiểu quán cà phê**: bảng màu espresso/kem, tiêu đề serif, icon SVG nội bộ, animation chất lỏng ở hero, hiệu ứng ripple và chuyển động mềm cho thẻ sản phẩm/đơn hàng. Có hỗ trợ `prefers-reduced-motion`.

Web **thuần HTML/CSS/JS, không cần build** — mở trực tiếp hoặc host tĩnh bất kỳ đâu (GitHub Pages…). Không phụ thuộc font hay CDN bên ngoài; icon dùng SVG inline.

## Chạy local

```bash
# Cách 1: mở trực tiếp index.html bằng trình duyệt

# Cách 2: chạy server tĩnh (khuyên dùng để test URL ?mock=… )
npx serve .
# hoặc
python -m http.server 8080
```

Sau đó mở `http://localhost:8080/` (menu) và `http://localhost:8080/orders.html` (lịch sử đơn).

## Cờ demo trạng thái (query param)

| URL | Hiệu ứng |
|---|---|
| `/?mock=error` | Menu giả lập lỗi mạng → hiện "Thử lại" |
| `/?mock=empty` | Menu trả rỗng → hiện empty state |
| `/?mock=error&retry=1` | Bấm "Thử lại" sẽ tải lại thành công |
| `/orders.html?mock=error` | Lịch sử đơn giả lập lỗi |
| `/orders.html?mock=empty` | Lịch sử đơn rỗng |
| `/orders.html?status=CANCELLED` | Lọc sẵn đơn theo trạng thái |

Tìm kiếm/lọc được lưu trên URL: `/?q=ca+phe&category=Cà+phe`. Nhấn `/` để focus ô tìm kiếm.

## Cấu trúc

```
├─ index.html        # Menu (Task 3)
├─ orders.html       # Lịch sử đơn (Task 9)
├─ css/
│  ├─ base.css       # token màu, header, button, state-box, toast, cart drawer, footer
│  ├─ menu.css       # hero liquid, search, chip danh mục, lưới & thẻ sản phẩm
│  └─ orders.css     # thống kê, chip trạng thái, thẻ đơn, badge, chi tiết món
├─ js/
│  ├─ data.js        # dữ liệu mẫu: 15 sản phẩm + 8 đơn đủ 7 trạng thái
│  ├─ utils.js       # formatVND, formatDate, normalize, filterProducts, giỏ (localStorage), toast
│  ├─ cart.js        # drawer giỏ hàng, tăng/giảm/xóa, tạm tính
│  ├─ menu.js        # điều khiển trang Menu
│  └─ orders.js      # điều khiển trang Lịch sử đơn
└─ images/           # ảnh minh họa 15 món (local, không phụ thuộc mạng)
```

## Nối API thật sau này (theo plan.md)

Dữ liệu đang được nạp qua `BrewLite.fetchMock()` (giả lập `GET /products`, `GET /orders/me` với delay 600ms). Khi backend sẵn sàng, chỉ cần thay hàm này trong `js/utils.js` bằng `fetch` thật:

- `GET /products` → `Product { id, name, price, imageUrl, stock, category? }`
- `GET /orders/me` → `Order { id, status, total, createdAt, items[] }` (kèm JWT)

Component/hook khác không đụng tới (giả định "một chỗ sửa" trong plan.md mục 13).

## Ảnh minh họa

15 ảnh trong `images/` tải local (Wikimedia Commons / ảnh dự án trước), credit xem `docs/image-credits.md` trong repo `project`. Ảnh lỗi tự động fallback về `images/fallback.svg`.
