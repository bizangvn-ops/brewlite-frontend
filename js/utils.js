(function () {
  'use strict';

  var ICONS = {
    cup: '<path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8Z"/><path d="M16 9h1.8a3 3 0 0 1 0 6H16"/><path d="M8 3v2M12 3v2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/>',
    bag: '<path d="M5 8h14l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M16 12h.01M3 10h18"/>',
    alert: '<path d="M12 4 2.8 20h18.4L12 4Z"/><path d="M12 10v4"/><path d="M12 17.5h.01"/>',
  };

  function icon(name, className) {
    var body = ICONS[name];
    if (!body) return '';
    return (
      '<svg class="' + (className || 'icon') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>'
    );
  }

  function formatVND(value) {
    if (!Number.isFinite(value)) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return (
      pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
      ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
    );
  }

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

  function filterProducts(products, q, category) {
    var nq = normalize(q);
    return products.filter(function (p) {
      var okCategory = !category || p.category === category;
      var okQuery = !nq || normalize(p.name).indexOf(nq) !== -1;
      return okCategory && okQuery;
    });
  }

  var CART_KEY = 'brewlite_cart';

  function readCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var cart = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(cart)) return [];
      return cart
        .filter(function (item) {
          return item && typeof item.productId === 'string' && Number(item.qty) > 0;
        })
        .map(function (item) {
          return {
            productId: item.productId,
            size: item.size || 'M',
            qty: Math.min(99, Math.floor(Number(item.qty)) || 1),
          };
        });
    } catch (e) {
      return [];
    }
  }

  function writeCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      /* storage may be unavailable */
    }
    document.dispatchEvent(new CustomEvent('cart:changed', { detail: { count: cartCount() } }));
  }

  function cartGetItems() {
    return readCart();
  }

  function cartAddItem(productId, size) {
    var key = size || 'M';
    var cart = readCart();
    var found = cart.find(function (item) {
      return item.productId === productId && item.size === key;
    });
    if (found) {
      found.qty = Math.min(99, found.qty + 1);
    } else {
      cart.push({ productId: productId, size: key, qty: 1 });
    }
    writeCart(cart);
  }

  function cartSetQty(productId, size, qty) {
    var key = size || 'M';
    var next = Math.max(0, Math.min(99, Math.floor(Number(qty) || 0)));
    var cart = readCart();
    var index = -1;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].productId === productId && cart[i].size === key) {
        index = i;
        break;
      }
    }
    if (index === -1) {
      if (next > 0) cart.push({ productId: productId, size: key, qty: next });
    } else if (next === 0) {
      cart.splice(index, 1);
    } else {
      cart[index].qty = next;
    }
    writeCart(cart);
  }

  function cartRemove(productId, size) {
    var key = size || 'M';
    writeCart(
      readCart().filter(function (item) {
        return !(item.productId === productId && item.size === key);
      })
    );
  }

  function cartClear() {
    writeCart([]);
  }

  function cartCount() {
    return readCart().reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  var toastTimer = null;

  function toast(message) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
    }
    var host = document.querySelector('dialog[open]') || document.body;
    if (el.parentElement !== host) host.appendChild(el);
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2000);
  }

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

  function initRipples() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.addEventListener('pointerdown', function (event) {
      if (event.button !== 0) return;
      var target = event.target.closest(
        '.btn, .chip, .cart-btn, .nav-link, .icon-btn, .status-chip, .order-card__toggle, .product-card__add, .search__clear'
      );
      if (!target || target.disabled) return;
      var rect = target.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
      target.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 620);
    }, { passive: true });
  }

  window.BrewLite = {
    formatVND: formatVND,
    formatDate: formatDate,
    normalize: normalize,
    filterProducts: filterProducts,
    cartGetItems: cartGetItems,
    cartAddItem: cartAddItem,
    cartSetQty: cartSetQty,
    cartRemove: cartRemove,
    cartClear: cartClear,
    cartCount: cartCount,
    toast: toast,
    fetchMock: fetchMock,
    icon: icon,
  };

  initRipples();
})();
