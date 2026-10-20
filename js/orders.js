(function () {
  'use strict';

  var B = window.BrewLite;
  var content = document.getElementById('orders-content');
  var statsEl = document.getElementById('order-stats');
  var filtersEl = document.getElementById('order-filters');
  var resultsText = document.getElementById('orders-results-text');

  var STATUS_META = {
    PENDING: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    PREPARING: 'Đang pha chế',
    READY: 'Sẵn sàng lấy',
    COMPLETED: 'Hoàn thành',
    PAYMENT_FAILED: 'Thanh toán lỗi',
    CANCELLED: 'Đã hủy',
  };

  var ACTIVE_STATUSES = ['PENDING', 'PAID', 'PREPARING', 'READY'];
  var params = new URLSearchParams(location.search);
  var state = { status: params.get('status') || '' };
  var orders = [];
  var productMap = {};

  (window.BREW_DATA.products || []).forEach(function (product) {
    productMap[product.id] = product;
  });

  function statusLabel(status) {
    return STATUS_META[status] || 'Không rõ';
  }

  function statusKey(status) {
    return STATUS_META[status] ? status : 'UNKNOWN';
  }

  function load(retry) {
    content.setAttribute('aria-busy', 'true');
    content.innerHTML = renderSkeleton(4);
    statsEl.hidden = false;
    statsEl.innerHTML = renderStatsSkeleton();
    filtersEl.hidden = true;
    resultsText.textContent = 'Đang tải đơn hàng…';

    B.fetchMock(window.BREW_DATA.orders, retry)
      .then(function (data) {
        content.setAttribute('aria-busy', 'false');
        orders = (data || []).slice().sort(function (a, b) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        if (orders.length === 0) {
          statsEl.hidden = true;
          filtersEl.hidden = true;
          resultsText.textContent = '0 đơn';
          content.innerHTML = renderEmpty();
          return;
        }

        statsEl.hidden = false;
        statsEl.innerHTML = renderStats();
        renderFilters();
        render();
      })
      .catch(function () {
        content.setAttribute('aria-busy', 'false');
        statsEl.hidden = true;
        filtersEl.hidden = true;
        resultsText.textContent = '';
        content.innerHTML = renderError();
        var retryBtn = document.getElementById('retry-btn');
        if (retryBtn) retryBtn.addEventListener('click', function () { load(true); });
      });
  }

  function renderStats() {
    var processing = orders.filter(function (order) {
      return ACTIVE_STATUSES.indexOf(order.status) !== -1;
    }).length;
    var completed = orders.filter(function (order) {
      return order.status === 'COMPLETED';
    }).length;
    var value = orders.reduce(function (sum, order) {
      if (order.status === 'CANCELLED' || order.status === 'PAYMENT_FAILED') return sum;
      return sum + (Number(order.total) || 0);
    }, 0);

    var cards = [
      { icon: 'receipt', label: 'Tổng đơn', value: String(orders.length) },
      { icon: 'clock', label: 'Đang xử lý', value: String(processing) },
      { icon: 'check', label: 'Hoàn thành', value: String(completed) },
      { icon: 'wallet', label: 'Tổng giá trị', value: B.formatVND(value) },
    ];

    return cards
      .map(function (card, index) {
        return (
          '<div class="stat-card" style="--i:' + index + '">' +
            '<span class="stat-card__icon">' + B.icon(card.icon) + '</span>' +
            '<span class="stat-card__value">' + card.value + '</span>' +
            '<span class="stat-card__label">' + card.label + '</span>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderStatsSkeleton() {
    var html = '';
    for (var i = 0; i < 4; i++) {
      html +=
        '<div class="stat-card stat-card--skeleton">' +
          '<div class="skeleton-line short"></div>' +
          '<div class="skeleton-line"></div>' +
        '</div>';
    }
    return html;
  }

  function renderFilters() {
    var counts = {};
    orders.forEach(function (order) {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });

    if (state.status && !counts[state.status]) {
      state.status = '';
      syncUrl();
    }

    var keys = Object.keys(STATUS_META).filter(function (key) { return counts[key]; });
    if (keys.length === 0) {
      filtersEl.hidden = true;
      filtersEl.innerHTML = '';
      return;
    }

    filtersEl.hidden = false;
    filtersEl.innerHTML = '';

    var entries = [{ label: 'Tất cả', value: '', count: orders.length }].concat(
      keys.map(function (key) {
        return { label: STATUS_META[key], value: key, count: counts[key] };
      })
    );

    entries.forEach(function (entry) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'status-chip' +
        (entry.value ? ' status-' + entry.value : '') +
        (state.status === entry.value ? ' is-active' : '');
      btn.setAttribute('aria-pressed', String(state.status === entry.value));

      var dot = document.createElement('span');
      dot.className = 'status-chip__dot';
      var label = document.createElement('span');
      label.textContent = entry.label;
      var count = document.createElement('span');
      count.className = 'status-chip__count';
      count.textContent = String(entry.count);

      btn.appendChild(dot);
      btn.appendChild(label);
      btn.appendChild(count);

      btn.addEventListener('click', function () {
        state.status = entry.value;
        syncUrl();
        renderFilters();
        render();
      });

      filtersEl.appendChild(btn);
    });
  }

  function render() {
    var list = state.status
      ? orders.filter(function (order) { return order.status === state.status; })
      : orders;

    resultsText.innerHTML = 'Hiển thị <strong>' + list.length + '</strong> / ' + orders.length + ' đơn';

    if (list.length === 0) {
      content.innerHTML = renderNoResults();
      var clearBtn = document.getElementById('clear-status-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          state.status = '';
          syncUrl();
          renderFilters();
          render();
        });
      }
      return;
    }

    var listEl = document.createElement('div');
    listEl.className = 'order-list';
    list.forEach(function (order, index) { listEl.appendChild(renderOrderCard(order, index)); });
    content.innerHTML = '';
    content.appendChild(listEl);
  }

  function renderOrderCard(order, index) {
    var card = document.createElement('article');
    var key = statusKey(order.status);
    card.className = 'order-card status-' + key;
    card.style.setProperty('--i', String(Math.min(index, 10)));

    var items = Array.isArray(order.items) ? order.items : [];
    var itemCount = items.reduce(function (sum, item) { return sum + (item.qty || 0); }, 0);
    var bodyId = 'order-body-' + order.id;

    var head = document.createElement('button');
    head.type = 'button';
    head.className = 'order-card__head';
    head.setAttribute('aria-expanded', 'false');
    head.setAttribute('aria-controls', bodyId);

    var idEl = document.createElement('span');
    idEl.className = 'order-card__id';
    idEl.textContent = '#' + order.id;

    var statusEl = document.createElement('span');
    statusEl.className = 'order-card__status';
    var badge = document.createElement('span');
    badge.className = 'status-badge status-' + key;
    badge.setAttribute('data-status', order.status || '');
    badge.textContent = statusLabel(order.status);
    statusEl.appendChild(badge);

    var dateEl = document.createElement('span');
    dateEl.className = 'order-card__date';
    dateEl.textContent = B.formatDate(order.createdAt);

    var meta = document.createElement('span');
    meta.className = 'order-card__meta';

    var countEl = document.createElement('span');
    countEl.className = 'order-card__count';
    countEl.textContent = itemCount + ' món';

    var right = document.createElement('span');
    right.className = 'order-card__right';

    var totalEl = document.createElement('span');
    totalEl.className = 'order-card__total';
    totalEl.textContent = 'Tổng: ' + B.formatVND(order.total);

    var toggle = document.createElement('span');
    toggle.className = 'order-card__toggle';
    toggle.innerHTML =
      '<span class="toggle-text">Xem món</span>' +
      '<span class="chev">' + B.icon('chevron') + '</span>';

    right.appendChild(totalEl);
    right.appendChild(toggle);
    meta.appendChild(countEl);
    meta.appendChild(right);

    head.appendChild(idEl);
    head.appendChild(statusEl);
    head.appendChild(dateEl);
    head.appendChild(meta);

    var body = document.createElement('div');
    body.className = 'order-card__body';
    body.id = bodyId;
    body.hidden = true;

    items.forEach(function (item) {
      var product = productMap[item.productId];
      var row = document.createElement('div');
      row.className = 'order-item';

      var thumb = document.createElement('span');
      thumb.className = 'order-item__thumb';
      var img = document.createElement('img');
      img.src = (product && product.imageUrl) || 'images/fallback.svg';
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', function () { img.src = 'images/fallback.svg'; });
      thumb.appendChild(img);

      var nameEl = document.createElement('span');
      nameEl.className = 'order-item__name';
      nameEl.textContent = item.productName || ('Sản phẩm #' + item.productId);

      var metaEl = document.createElement('span');
      metaEl.className = 'order-item__meta';
      metaEl.textContent = 'Size ' + (item.size || 'M') + ' × ' + (item.qty || 1);

      var lineTotal = document.createElement('span');
      lineTotal.className = 'order-item__line-total';
      lineTotal.textContent = B.formatVND(item.lineTotal || 0);

      row.appendChild(thumb);
      row.appendChild(nameEl);
      row.appendChild(metaEl);
      row.appendChild(lineTotal);
      body.appendChild(row);
    });

    var grand = document.createElement('div');
    grand.className = 'order-card__grand';
    grand.innerHTML = '<span>Tổng cộng</span><span>' + B.formatVND(order.total) + '</span>';
    body.appendChild(grand);

    head.addEventListener('click', function () {
      var open = body.hidden;
      body.hidden = !open;
      card.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.toggle-text').textContent = open ? 'Ẩn món' : 'Xem món';
    });

    card.appendChild(head);
    card.appendChild(body);
    return card;
  }

  function syncUrl() {
    var next = new URLSearchParams();
    if (state.status) next.set('status', state.status);
    var qs = next.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  function renderSkeleton(count) {
    var html = '<div class="order-list" aria-hidden="true">';
    for (var i = 0; i < count; i++) {
      html +=
        '<div class="skeleton-card">' +
          '<div class="skeleton-card__body">' +
            '<div class="skeleton-line"></div>' +
            '<div class="skeleton-line short"></div>' +
          '</div>' +
        '</div>';
    }
    return html + '</div>';
  }

  function renderEmpty() {
    return (
      '<div class="state-box">' +
        '<div class="state-box__icon">' + B.icon('receipt') + '</div>' +
        '<h2>Bạn chưa có đơn nào</h2>' +
        '<p>Chọn món yêu thích tại thực đơn và đặt thử nhé!</p>' +
        '<a class="btn btn--primary" href="index.html">Về thực đơn</a>' +
      '</div>'
    );
  }

  function renderNoResults() {
    return (
      '<div class="state-box">' +
        '<div class="state-box__icon">' + B.icon('search') + '</div>' +
        '<h2>Không có đơn ở trạng thái này</h2>' +
        '<p>Thử chọn trạng thái khác hoặc xem tất cả đơn hàng.</p>' +
        '<button class="btn btn--ghost" id="clear-status-btn" type="button">Xem tất cả</button>' +
      '</div>'
    );
  }

  function renderError() {
    return (
      '<div class="state-box" role="alert">' +
        '<div class="state-box__icon">' + B.icon('alert') + '</div>' +
        '<h2>Không tải được đơn hàng</h2>' +
        '<p>Có lỗi xảy ra khi tải lịch sử đơn. Kiểm tra kết nối rồi thử lại nhé.</p>' +
        '<button class="btn btn--primary" id="retry-btn" type="button">Thử lại</button>' +
      '</div>'
    );
  }

  load(false);
})();
