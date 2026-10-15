/**
 * Hàm dùng chung cho cả 2 trang (Menu + Lịch sử đơn).
 * Bám các hàm ở plan.md mục 7: formatVND, formatDate; plus
 * normalize (tìm kiếm không phân biệt hoa/thường + dấu) và store giỏ tối thiểu.
 */
(function () {
  'use strict';

  /** 45000 → "45.000đ" */
  function formatVND(value) {
    if (!Number.isFinite(value)) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
  }

  /** ISO → "dd/MM/yyyy · HH:mm" */
  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return (
      pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
      ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
    );
  }

  /** "Cà phê sữa" → "ca phe sua" — bỏ dấu, hạ chữ, gộp khoảng trắng. */
  function normalize(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Hàm thuần lọc sản phẩm (plan.md mục 5.2) — kết hợp từ khóa + danh mục.
   * @param {Array} products  mảng Product
   * @param {string} q        từ khóa tìm (đã normalize hoặc chưa)
   * @param {string} category danh mục ('' = tất cả)
   */
  function filterProducts(products, q, category) {
    var nq = normalize(q);
    return products.filter(function (p) {
      var okCategory = !category || p.category === category;
      var okQuery = !nq || normalize(p.name).indexOf(nq) !== -1;
      return okCategory && okQuery;
    });
  }

  /* ---------- Giỏ hàng tối thiểu (localStorage) — Task 5 sẽ thay bằng store chính ---------- */
  var CART_KEY = 'brewlite_cart';

  function readCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var cart = raw ? JSON.parse(raw) : [];
      return Array.isArray(cart) ? cart : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent('cart:changed', { detail: { count: cartCount() } }));
  }

  /** Thêm nhanh 1 món, size M, không topping (plan.md giả định 8). */
  function cartAddItem(productId, size) {
    var cart = readCart();
    var found = cart.find(function (i) { return i.productId === productId && i.size === (size || 'M'); });
    if (found) {
      found.qty += 1;
    } else {
      cart.push({ productId: productId, size: size || 'M', qty: 1 });
    }
    writeCart(cart);
  }

  function cartCount() {
    return readCart().reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  /* ---------- Toast phản hồi "Đã thêm" ---------- */
  var toastTimer = null;
  function toast(message) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 1800);
  }

  /* ---------- Giả lập API (web tĩnh: delay 600ms để thấy loading state) ---------- */
  /**
   * Gọi "API" giả lập. Hỗ trợ cờ demo trên URL (plan.md mục 4):
   *  ?mock=error → ném lỗi;  ?mock=empty → trả mảng rỗng.
   * retry=true (bấm "Thử lại") sẽ bỏ qua cờ error.
   */
  function fetchMock(data, retry) {
    var params = new URLSearchParams(location.search);
    var mode = params.get('mock');
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (mode === 'error' && !retry) {
          reject(new Error('Không tải được dữ liệu. Vui lòng thử lại.'));
          return;
        }
        if (mode === 'empty') {
          resolve([]);
          return;
        }
        resolve(data);
      }, 600);
    });
  }

  window.BrewLite = {
    formatVND: formatVND,
    formatDate: formatDate,
    normalize: normalize,
    filterProducts: filterProducts,
    cartAddItem: cartAddItem,
    cartCount: cartCount,
    toast: toast,
    fetchMock: fetchMock,
  };
})();
