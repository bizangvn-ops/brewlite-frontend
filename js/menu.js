(function () {
  'use strict';

  var B = window.BrewLite;
  var content = document.getElementById('menu-content');
  var searchInput = document.getElementById('search-input');
  var searchClear = document.getElementById('search-clear');
  var categoryFilterEl = document.getElementById('category-filter');
  var resultsText = document.getElementById('results-text');
  var resetBtn = document.getElementById('reset-filters');

  var products = [];
  var params = new URLSearchParams(location.search);
  var state = {
    q: params.get('q') || '',
    category: params.get('category') || '',
  };
  var debounceTimer = null;

  function updateResults(count) {
    resultsText.innerHTML = 'Hiển thị <strong>' + count + '</strong> / ' + products.length + ' món';
    resetBtn.hidden = !(state.q || state.category);
  }

  function load(retry) {
    content.setAttribute('aria-busy', 'true');
    content.innerHTML = renderSkeleton(8);
    resultsText.textContent = 'Đang tải thực đơn…';
    resetBtn.hidden = true;
    B.fetchMock(window.BREW_DATA.products, retry)
      .then(function (data) {
        products = data;
        renderCategoryChips();
        render();
      })
      .catch(function () {
        content.setAttribute('aria-busy', 'false');
        content.innerHTML = renderError();
        resultsText.textContent = '';
        resetBtn.hidden = true;
        categoryFilterEl.hidden = true;
        var retryBtn = document.getElementById('retry-btn');
        if (retryBtn) retryBtn.addEventListener('click', function () { load(true); });
      });
  }

  function render() {
    content.setAttribute('aria-busy', 'false');

    if (products.length === 0) {
      content.innerHTML = renderEmpty();
      resultsText.textContent = 'Thực đơn đang cập nhật.';
      resetBtn.hidden = true;
      return;
    }

    var list = B.filterProducts(products, state.q, state.category);
    updateResults(list.length);

    if (list.length === 0) {
      content.innerHTML = renderNoResults();
      var clearBtn = document.getElementById('clear-filters-btn');
      if (clearBtn) clearBtn.addEventListener('click', resetFilters);
      return;
    }

    var grid = document.createElement('div');
    grid.className = 'product-grid';
    list.forEach(function (product, index) { grid.appendChild(renderCard(product, index)); });
    content.innerHTML = '';
    content.appendChild(grid);
  }

  function renderCard(product, index) {
    var soldOut = product.stock === 0;
    var card = document.createElement('article');
    card.className = 'product-card' + (soldOut ? ' is-sold-out' : '');
    card.style.setProperty('--i', String(Math.min(index, 12)));

    var media = document.createElement('div');
    media.className = 'product-card__media';

    var img = document.createElement('img');
    img.src = product.imageUrl || 'images/fallback.svg';
    img.alt = product.name;
    img.loading = 'lazy';
    img.addEventListener('error', function () { img.src = 'images/fallback.svg'; });
    media.appendChild(img);

    if (soldOut) {
      var badge = document.createElement('span');
      badge.className = 'product-card__badge';
      badge.textContent = 'Hết hàng';
      media.appendChild(badge);
    }

    if (product.category) {
      var cat = document.createElement('span');
      cat.className = 'product-card__category';
      cat.textContent = product.category;
      media.appendChild(cat);
    }

    var body = document.createElement('div');
    body.className = 'product-card__body';

    var name = document.createElement('h2');
    name.className = 'product-card__name';
    name.textContent = product.name;

    var desc = document.createElement('p');
    desc.className = 'product-card__desc';
    desc.textContent = product.description || '';

    var footer = document.createElement('div');
    footer.className = 'product-card__footer';

    var price = document.createElement('span');
    price.className = 'product-card__price';
    price.textContent = B.formatVND(product.price);

    var addBtn = document.createElement('button');
    addBtn.className = 'product-card__add';
    addBtn.type = 'button';
    addBtn.innerHTML = B.icon('plus');
    addBtn.setAttribute('aria-label', 'Thêm ' + product.name + ' vào giỏ');
    addBtn.disabled = soldOut;

    var resetTimer = null;
    addBtn.addEventListener('click', function (event) {
      event.preventDefault();
      B.cartAddItem(product.id, 'M');
      B.toast('Đã thêm ' + product.name + ' (size M) vào giỏ');
      addBtn.classList.add('is-added');
      addBtn.innerHTML = B.icon('check');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        addBtn.classList.remove('is-added');
        addBtn.innerHTML = B.icon('plus');
      }, 900);
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

  function renderCategoryChips() {
    var categories = [];
    var counts = {};
    products.forEach(function (product) {
      if (!product.category) return;
      if (categories.indexOf(product.category) === -1) categories.push(product.category);
      counts[product.category] = (counts[product.category] || 0) + 1;
    });

    if (categories.length === 0) {
      categoryFilterEl.hidden = true;
      categoryFilterEl.innerHTML = '';
      return;
    }

    categoryFilterEl.hidden = false;
    categoryFilterEl.innerHTML = '';

    var entries = [{ label: 'Tất cả', value: '', count: products.length }].concat(
      categories.map(function (cat) {
        return { label: cat, value: cat, count: counts[cat] };
      })
    );

    entries.forEach(function (entry) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (state.category === entry.value ? ' is-active' : '');
      btn.setAttribute('aria-pressed', String(state.category === entry.value));

      var label = document.createElement('span');
      label.textContent = entry.label;
      var count = document.createElement('span');
      count.className = 'chip__count';
      count.textContent = String(entry.count);

      btn.appendChild(label);
      btn.appendChild(count);
      btn.addEventListener('click', function () {
        state.category = entry.value;
        syncUrl();
        renderCategoryChips();
        render();
      });
      categoryFilterEl.appendChild(btn);
    });
  }

  function resetFilters() {
    state.q = '';
    state.category = '';
    searchInput.value = '';
    searchClear.hidden = true;
    clearTimeout(debounceTimer);
    syncUrl();
    renderCategoryChips();
    render();
    searchInput.focus();
  }

  searchInput.addEventListener('input', function () {
    searchClear.hidden = searchInput.value === '';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      state.q = searchInput.value;
      syncUrl();
      render();
    }, 300);
  });

  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && searchInput.value) {
      searchInput.value = '';
      searchClear.hidden = true;
      state.q = '';
      syncUrl();
      render();
    }
  });

  searchClear.addEventListener('click', function () {
    searchInput.value = '';
    searchClear.hidden = true;
    state.q = '';
    syncUrl();
    render();
    searchInput.focus();
  });

  resetBtn.addEventListener('click', resetFilters);

  document.addEventListener('keydown', function (event) {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    var target = event.target;
    var tag = target && target.tagName ? target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (target && target.isContentEditable)) return;
    event.preventDefault();
    searchInput.focus();
  });

  function syncUrl() {
    var next = new URLSearchParams();
    if (state.q) next.set('q', state.q);
    if (state.category) next.set('category', state.category);
    var qs = next.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

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
        '<div class="state-box__icon">' + B.icon('alert') + '</div>' +
        '<h2>Không tải được menu</h2>' +
        '<p>Có lỗi xảy ra khi tải dữ liệu sản phẩm. Kiểm tra kết nối rồi thử lại nhé.</p>' +
        '<button class="btn btn--primary" id="retry-btn" type="button">Thử lại</button>' +
      '</div>'
    );
  }

  function renderEmpty() {
    return (
      '<div class="state-box">' +
        '<div class="state-box__icon">' + B.icon('cup') + '</div>' +
        '<h2>Hiện chưa có món nào</h2>' +
        '<p>Menu đang được cập nhật, bạn quay lại sau nhé!</p>' +
      '</div>'
    );
  }

  function renderNoResults() {
    return (
      '<div class="state-box">' +
        '<div class="state-box__icon">' + B.icon('search') + '</div>' +
        '<h2>Không tìm thấy món phù hợp</h2>' +
        '<p>Thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ thực đơn.</p>' +
        '<button class="btn btn--ghost" id="clear-filters-btn" type="button">Xóa bộ lọc</button>' +
      '</div>'
    );
  }

  function initHeroSpotlight() {
    var hero = document.querySelector('.menu-hero');
    if (!hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var frame = null;
    hero.addEventListener('pointermove', function (event) {
      if (frame) return;
      frame = requestAnimationFrame(function () {
        var rect = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (event.clientX - rect.left) + 'px');
        hero.style.setProperty('--my', (event.clientY - rect.top) + 'px');
        frame = null;
      });
    }, { passive: true });
  }

  searchInput.value = state.q;
  searchClear.hidden = state.q === '';
  initHeroSpotlight();
  load(false);
})();
