(function () {
  'use strict';

  var B = window.BrewLite;
  var dialog = document.getElementById('cart-dialog');
  if (!dialog || !B) return;

  var itemsEl = document.getElementById('cart-items');
  var footEl = document.getElementById('cart-foot');
  var countEls = Array.prototype.slice.call(document.querySelectorAll('[data-cart-count]'));
  var openBtns = Array.prototype.slice.call(document.querySelectorAll('[data-cart-open]'));
  var closeBtns = Array.prototype.slice.call(document.querySelectorAll('[data-cart-close]'));
  var productMap = {};

  (window.BREW_DATA.products || []).forEach(function (product) {
    productMap[product.id] = product;
  });

  function detailedItems() {
    return B.cartGetItems()
      .map(function (item) {
        var product = productMap[item.productId];
        if (!product) return null;
        return {
          productId: item.productId,
          size: item.size,
          qty: item.qty,
          product: product,
          lineTotal: product.price * item.qty,
        };
      })
      .filter(Boolean);
  }

  function updateCount() {
    var count = B.cartCount();
    countEls.forEach(function (el) { el.textContent = String(count); });
    openBtns.forEach(function (btn) {
      btn.setAttribute('aria-label', count ? 'Mở giỏ hàng, ' + count + ' món' : 'Mở giỏ hàng, đang trống');
    });
  }

  function bump() {
    openBtns.forEach(function (btn) {
      btn.classList.remove('is-bumped');
      void btn.offsetWidth;
      btn.classList.add('is-bumped');
      setTimeout(function () { btn.classList.remove('is-bumped'); }, 450);
    });
  }

  function renderEmpty() {
    itemsEl.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'cart-empty';
    wrap.innerHTML =
      '<span class="cart-empty__icon">' + B.icon('bag') + '</span>' +
      '<h3>Giỏ đang trống</h3>' +
      '<p>Thêm vài món từ thực đơn để bắt đầu nhé.</p>';
    var cta = document.createElement('a');
    cta.className = 'btn btn--accent';
    cta.href = 'index.html';
    cta.textContent = 'Xem thực đơn';
    wrap.appendChild(cta);
    itemsEl.appendChild(wrap);
    footEl.hidden = true;
    footEl.innerHTML = '';
  }

  function renderRow(item) {
    var row = document.createElement('article');
    row.className = 'cart-item';

    var img = document.createElement('img');
    img.className = 'cart-item__media';
    img.src = item.product.imageUrl || 'images/fallback.svg';
    img.alt = item.product.name;
    img.loading = 'lazy';
    img.addEventListener('error', function () { img.src = 'images/fallback.svg'; });

    var info = document.createElement('div');
    info.className = 'cart-item__info';

    var name = document.createElement('p');
    name.className = 'cart-item__name';
    name.textContent = item.product.name;

    var meta = document.createElement('p');
    meta.className = 'cart-item__meta';
    meta.textContent = 'Size ' + item.size + ' · ' + B.formatVND(item.product.price);

    var qty = document.createElement('div');
    qty.className = 'qty';
    qty.innerHTML =
      '<button type="button" data-step="-1" aria-label="Giảm số lượng">' + B.icon('minus') + '</button>' +
      '<span aria-live="polite">' + item.qty + '</span>' +
      '<button type="button" data-step="1" aria-label="Tăng số lượng">' + B.icon('plus') + '</button>';

    qty.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        B.cartSetQty(item.productId, item.size, item.qty + Number(btn.getAttribute('data-step')));
      });
    });

    info.appendChild(name);
    info.appendChild(meta);
    info.appendChild(qty);

    var right = document.createElement('div');
    right.className = 'cart-item__right';

    var total = document.createElement('span');
    total.className = 'cart-item__total';
    total.textContent = B.formatVND(item.lineTotal);

    var remove = document.createElement('button');
    remove.className = 'cart-item__remove';
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Xóa ' + item.product.name + ' khỏi giỏ');
    remove.innerHTML = B.icon('trash');
    remove.addEventListener('click', function () {
      B.cartRemove(item.productId, item.size);
      B.toast('Đã xóa ' + item.product.name + ' khỏi giỏ');
    });

    right.appendChild(total);
    right.appendChild(remove);

    row.appendChild(img);
    row.appendChild(info);
    row.appendChild(right);
    itemsEl.appendChild(row);
  }

  function renderFoot(items) {
    var subtotal = items.reduce(function (sum, item) { return sum + item.lineTotal; }, 0);
    footEl.hidden = false;
    footEl.innerHTML =
      '<div class="cart-subtotal"><span>Tạm tính</span><span>' + B.formatVND(subtotal) + '</span></div>' +
      '<p class="cart-note">Giá đã bao gồm thuế. Thanh toán tại quầy sau khi đặt.</p>' +
      '<div class="cart-actions">' +
        '<button type="button" class="btn btn--ghost" data-cart-clear>Xóa giỏ</button>' +
        '<button type="button" class="btn btn--primary" data-cart-checkout>Đặt hàng</button>' +
      '</div>';

    footEl.querySelector('[data-cart-clear]').addEventListener('click', function () {
      B.cartClear();
      B.toast('Đã xóa toàn bộ giỏ hàng');
    });

    footEl.querySelector('[data-cart-checkout]').addEventListener('click', function () {
      B.toast('Bản demo chưa kết nối thanh toán.');
    });
  }

  function render() {
    if (!itemsEl) return;
    var items = detailedItems();
    updateCount();
    itemsEl.innerHTML = '';
    if (items.length === 0) {
      renderEmpty();
      return;
    }
    items.forEach(renderRow);
    renderFoot(items);
  }

  function open() {
    render();
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function close() {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  openBtns.forEach(function (btn) {
    btn.addEventListener('click', open);
  });

  closeBtns.forEach(function (btn) {
    btn.addEventListener('click', close);
  });

  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) close();
  });

  document.addEventListener('cart:changed', function () {
    render();
    bump();
  });

  render();
})();
