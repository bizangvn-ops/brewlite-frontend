/**
 * Trang Menu (Task 3) — plan.md mục 5:
 * loading skeleton → render lưới; có empty / error / no-results state;
 * tìm kiếm debounce 300ms + lọc danh mục (lưu trên URL ?q= & ?category=);
 * nút "+" thêm nhanh size M vào giỏ (không điều hướng).
 */
(function () {
  'use strict';

  var B = window.BrewLite;
  var content = document.getElementById('menu-content');
  var searchInput = document.getElementById('search-input');
  var searchClear = document.getElementById('search-clear');
  var categoryFilterEl = document.getElementById('category-filter');
  var cartCountEl = document.getElementById('cart-count-value');

  var products = [];        // dữ liệu đầy đủ sau khi "gọi API"
  var params = new URLSearchParams(location.search);
  var state = {
    q: params.get('q') || '',
    category: params.get('category') || '',
  };
  var debounceTimer = null;

  /* ---------- Vòng đời dữ liệu ---------- */
  function load(retry) {
    content.setAttribute('aria-busy', 'true');
    content.innerHTML = renderSkeleton(8);
    B.fetchMock(window.BREW_DATA.products, retry)
      .then(function (data) {
        products = data;
        renderCategoryChips();
        render();
      })
      .catch(function () {
        content.setAttribute('aria-busy', 'false');
        content.innerHTML = renderError();
        var retryBtn = document.getElementById('retry-btn');
        if (retryBtn) retryBtn.addEventListener('click', function () { load(true); });
      });
  }

  function render() {
    content.setAttribute('aria-busy', 'false');

    if (products.length === 0) {
      content.innerHTML = renderEmpty();
      return;
    }

    var list = B.filterProducts(products, state.q, state.category);

    if (list.length === 0) {
      content.innerHTML = renderNoResults();
      var clearBtn = document.getElementById('clear-filters-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          state.q = '';
          state.category = '';
          searchInput.value = '';
          searchClear.hidden = true;
          syncUrl();
          renderCategoryChips();
          render();
        });
      }
      return;
    }

    var grid = document.createElement('div');
    grid.className = 'product-grid';
    list.forEach(function (p) { grid.appendChild(renderCard(p)); });
    content.innerHTML = '';
    content.appendChild(grid);
  }

  /* ---------- 1 thẻ sản phẩm ---------- */
  function renderCard(p) {
    var soldOut = p.stock === 0;
    var card = document.createElement('article');
    card.className = 'product-card' + (soldOut ? ' is-sold-out' : '');

    var media = document.createElement('div');
    media.className = 'product-card__media';
    var img = document.createElement('img');
    img.src = p.imageUrl || 'images/fallback.svg';
    img.alt = p.name;
    img.loading = 'lazy';
    img.addEventListener('error', function () { img.src = 'images/fallback.svg'; });
    media.appendChild(img);
    if (soldOut) {
      var badge = document.createElement('span');
      badge.className = 'product-card__badge';
      badge.textContent = 'Hết hàng';
      media.appendChild(badge);
    }
    if (p.category) {
      var cat = document.createElement('span');
      cat.className = 'product-card__category';
      cat.textContent = p.category;
      media.appendChild(cat);
    }

    var body = document.createElement('div');
    body.className = 'product-card__body';

    var name = document.createElement('h2');
    name.className = 'product-card__name';
    name.textContent = p.name;

    var desc = document.createElement('p');
    desc.className = 'product-card__desc';
    desc.textContent = p.description || '';

    var footer = document.createElement('div');
    footer.className = 'product-card__footer';

    var price = document.createElement('span');
    price.className = 'product-card__price';
    price.textContent = B.formatVND(p.price);

    var addBtn = document.createElement('button');
    addBtn.className = 'product-card__add';
    addBtn.type = 'button';
    addBtn.textContent = '+';
    addBtn.setAttribute('aria-label', 'Thêm ' + p.name + ' vào giỏ');
    addBtn.disabled = soldOut;
    addBtn.addEventListener('click', function (e) {
      e.preventDefault();
      B.cartAddItem(p.id, 'M');       // size M, không topping (giả định 8)
      B.toast('Đã thêm ' + p.name + ' (size M) vào giỏ');
    });

    footer.appendChild(price);
    footer.appendChild(addBtn);
    body.appendChild(name);
    body.appendChild(desc);
    body.appendChild(footer);
    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  /* ---------- Category chips ---------- */
  function renderCategoryChips() {
    var categories = [];
    products.forEach(function (p) {
      if (p.category && categories.indexOf(p.category) === -1) categories.push(p.category);
    });

    // Chỉ hiện filter khi dữ liệu có category (features.hasCategories trong plan)
    if (categories.length === 0) {
      categoryFilterEl.hidden = true;
      return;
    }
    categoryFilterEl.hidden = false;
    categoryFilterEl.innerHTML = '';

    [''].concat(categories).forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (state.category === cat ? ' is-active' : '');
      btn.textContent = cat === '' ? 'Tất cả' : cat;
      btn.setAttribute('aria-pressed', String(state.category === cat));
      btn.addEventListener('click', function () {
        state.category = cat;
        syncUrl();
        renderCategoryChips();
        render();
      });
      categoryFilterEl.appendChild(btn);
    });
  }

  /* ---------- Search (debounce 300ms, không phân biệt hoa/thường + dấu) ---------- */
  searchInput.addEventListener('input', function () {
    searchClear.hidden = searchInput.value === '';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      state.q = searchInput.value;
      syncUrl();
      render();
    }, 300);
  });

  searchClear.addEventListener('click', function () {
    searchInput.value = '';
    searchClear.hidden = true;
    state.q = '';
    syncUrl();
    render();
    searchInput.focus();
  });

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.category) p.set('category', state.category);
    var qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  /* ---------- Render khối HTML cho các state ---------- */
  function renderSkeleton(count) {
    var html = '<div class="product-grid" aria-hidden="true">';
    for (var i = 0; i < count; i++) {
      html +=
        '<div class="skeleton-card">' +
          '<div class="skeleton-block"></div>' +
          '<div class="skeleton-card__body">' +
            '<div class="skeleton-line"></div>' +
            '<div class="skeleton-line short"></div>' +
          '</div>' +
        '</div>';
    }
    return html + '</div>';
  }

  function renderError() {
    return (
      '<div class="state-box" role="alert">' +
        '<div class="state-box__icon" aria-hidden="true">⚠️</div>' +
        '<h2>Không tải được menu</h2>' +
        '<p>Có lỗi xảy ra khi tải dữ liệu sản phẩm.</p>' +
        '<button class="btn btn--primary" id="retry-btn" type="button">Thử lại</button>' +
      '</div>'
    );
  }

  function renderEmpty() {
    return (
      '<div class="state-box">' +
        '<div class="state-box__icon" aria-hidden="true">🍵</div>' +
        '<h2>Hiện chưa có món nào</h2>' +
        '<p>Menu đang được cập nhật, bạn quay lại sau nhé!</p>' +
      '</div>'
    );
  }

  function renderNoResults() {
    return (
      '<div class="state-box">' +
        '<div class="state-box__icon" aria-hidden="true">🔍</div>' +
        '<h2>Không tìm thấy món phù hợp</h2>' +
        '<p>Thử từ khóa khác hoặc xóa bộ lọc nhé.</p>' +
        '<button class="btn btn--ghost" id="clear-filters-btn" type="button">Xóa bộ lọc</button>' +
      '</div>'
    );
  }

  /* ---------- Cập nhật badge giỏ ---------- */
  function updateCartCount() { cartCountEl.textContent = String(B.cartCount()); }
  document.addEventListener('cart:changed', updateCartCount);
  updateCartCount();

  /* ---------- Khởi động: giữ giá trị q từ URL ---------- */
  searchInput.value = state.q;
  searchClear.hidden = state.q === '';
  load(false);
})();

