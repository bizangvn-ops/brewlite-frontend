/**
 * Dữ liệu mẫu BrewLite — khớp plan.md mục 4 & 5.2:
 * 10 món nước + 5 món ăn vặt, trong đó 1 món stock = 0 để demo "Hết hàng".
 * Ảnh nằm trong thư mục images/ (tải local để trang chạy offline được).
 */
window.BREW_DATA = {
  products: [
    // ——— 10 món nước ———
    { id: 'p01', name: 'Cà phê sữa đá',   price: 35000, imageUrl: 'images/image3.jpeg',  stock: 20, category: 'Cà phê',              description: 'Cà phê phin pha với sữa đặc, thêm đá.' },
    { id: 'p02', name: 'Cà phê đen đá',   price: 25000, imageUrl: 'images/image1.jpeg',  stock: 18, category: 'Cà phê',              description: 'Cà phê đen đậm đà, uống nguyên bản.' },
    { id: 'p03', name: 'Bạc xỉu',         price: 38000, imageUrl: 'images/bac-xiu.jpg',  stock: 15, category: 'Cà phê',              description: 'Nhiều sữa, ít cà phê — thơm béo nhẹ.' },
    { id: 'p04', name: 'Americano',       price: 40000, imageUrl: 'images/americano.jpg', stock: 25, category: 'Cà phê',             description: 'Espresso pha với nước, sạch vị.' },
    { id: 'p05', name: 'Cappuccino',      price: 45000, imageUrl: 'images/cappuccino.jpg', stock: 12, category: 'Cà phê',            description: 'Bọt sữa mịn, cân bằng cà phê.' },
    { id: 'p06', name: 'Cà phê muối',     price: 42000, imageUrl: 'images/ca-phe-muoi.png', stock: 0,  category: 'Cà phê',             description: 'Kem mặn phô mai trên lớp cà phê — hết hàng hôm nay.' },
    { id: 'p07', name: 'Trà đào cam sả',  price: 39000, imageUrl: 'images/tra-dao.jpg',  stock: 30, category: 'Trà',                 description: 'Đào giòn, cam vàng, sả thơm.' },
    { id: 'p08', name: 'Trà sữa trân châu', price: 35000, imageUrl: 'images/tra-sua.jpg', stock: 22, category: 'Trà',                description: 'Trà đen sữa, trân châu dẻo.' },
    { id: 'p09', name: 'Sinh tố bơ',      price: 45000, imageUrl: 'images/sinh-to-bo.jpg', stock: 10, category: 'Sinh tố & Nước ép', description: 'Bơ chín xay mịn, béo ngậy.' },
    { id: 'p10', name: 'Nước cam ép',     price: 30000, imageUrl: 'images/nuoc-cam.jpg', stock: 16, category: 'Sinh tố & Nước ép',   description: 'Cam tươi ép trong ngày.' },

    // ——— 5 món ăn vặt ———
    { id: 'p11', name: 'Gà rán giòn',       price: 69000, imageUrl: 'images/ga-ran.jpg',         stock: 8,  category: 'Ăn vặt', description: 'Cánh & đùi gà giòn rụm.' },
    { id: 'p12', name: 'Khoai tây chiên',   price: 35000, imageUrl: 'images/khoai-tay-chien.jpg', stock: 20, category: 'Ăn vặt', description: 'Khoai cắt lát, chiên giòn.' },
    { id: 'p13', name: 'Chả giò (5 cuốn)', price: 30000, imageUrl: 'images/nem-ran.jpg',        stock: 14, category: 'Ăn vặt', description: 'Chả giò rán vàng, ăn kèm rau.' },
    { id: 'p14', name: 'Bánh chuối chiên', price: 25000, imageUrl: 'images/banh-chuoi-chien.jpg', stock: 9, category: 'Ăn vặt', description: 'Chuối chín bọc bột chiên giòn.' },
    { id: 'p15', name: 'Chè khúc bạch',    price: 30000, imageUrl: 'images/che-khuc-bach.jpg',   stock: 11, category: 'Ăn vặt', description: 'Khúc bạch mát, đường phèn nhẹ.' },
  ],

  /**
   * Đơn hàng mẫu (Task 9): 8 đơn phủ đủ 7 trạng thái của đề bài,
   * đã sắp xếp mới nhất → cũ nhất. Tổng tiền = tổng lineTotal các món.
   */
  orders: [
    {
      id: '1044', userId: 'u-demo', status: 'PREPARING', total: 70000, createdAt: '2026-10-15T10:05:00+07:00',
      items: [
        { productId: 'p08', productName: 'Trà sữa trân châu', size: 'M', qty: 1, lineTotal: 35000 },
        { productId: 'p12', productName: 'Khoai tây chiên',   size: 'M', qty: 1, lineTotal: 35000 },
      ],
    },
    {
      id: '1043', userId: 'u-demo', status: 'PAID', total: 70000, createdAt: '2026-10-15T09:20:00+07:00',
      items: [
        { productId: 'p01', productName: 'Cà phê sữa đá', size: 'M', qty: 2, lineTotal: 70000 },
      ],
    },
    {
      id: '1042', userId: 'u-demo', status: 'PAID', total: 123000, createdAt: '2026-10-14T09:15:00+07:00',
      items: [
        { productId: 'p05', productName: 'Cappuccino',      size: 'M', qty: 1, lineTotal: 45000 },
        { productId: 'p07', productName: 'Trà đào cam sả',  size: 'L', qty: 2, lineTotal: 78000 },
      ],
    },
    {
      id: '1041', userId: 'u-demo', status: 'READY', total: 70000, createdAt: '2026-10-14T08:02:00+07:00',
      items: [
        { productId: 'p04', productName: 'Americano',        size: 'M', qty: 1, lineTotal: 40000 },
        { productId: 'p13', productName: 'Chả giò (5 cuốn)', size: 'M', qty: 1, lineTotal: 30000 },
      ],
    },
    {
      id: '1039', userId: 'u-demo', status: 'COMPLETED', total: 95000, createdAt: '2026-10-12T16:45:00+07:00',
      items: [
        { productId: 'p09', productName: 'Sinh tố bơ',      size: 'M', qty: 1, lineTotal: 45000 },
        { productId: 'p14', productName: 'Bánh chuối chiên', size: 'M', qty: 1, lineTotal: 25000 },
        { productId: 'p02', productName: 'Cà phê đen đá',   size: 'M', qty: 1, lineTotal: 25000 },
      ],
    },
    {
      id: '1037', userId: 'u-demo', status: 'COMPLETED', total: 99000, createdAt: '2026-10-10T14:30:00+07:00',
      items: [
        { productId: 'p11', productName: 'Gà rán giòn', size: 'M', qty: 1, lineTotal: 69000 },
        { productId: 'p10', productName: 'Nước cam ép', size: 'M', qty: 1, lineTotal: 30000 },
      ],
    },
    {
      id: '1036', userId: 'u-demo', status: 'CANCELLED', total: 60000, createdAt: '2026-10-09T19:10:00+07:00',
      items: [
        { productId: 'p15', productName: 'Chè khúc bạch', size: 'M', qty: 2, lineTotal: 60000 },
      ],
    },
    {
      id: '1035', userId: 'u-demo', status: 'PAYMENT_FAILED', total: 38000, createdAt: '2026-10-08T11:25:00+07:00',
      items: [
        { productId: 'p03', productName: 'Bạc xỉu', size: 'M', qty: 1, lineTotal: 38000 },
      ],
    },
  ],
};
