/**
 * Trang Lịch sử đơn (Task 9) — plan.md mục 6:
 * đơn mới nhất lên đầu; bấm vào đơn để mở/đóng danh sách món (aria-expanded);
 * badge trạng thái theo STATUS_META; loading / empty / error state.
 */
(function () {
  'use strict';

  var B = window.BrewLite;
  var content = document.getElementById('orders-content');

  /** Nhãn + màu trạng thái (plan.md mục 6.2) — trạng thái lạ rơi về UNKNOWN. */
  var STATUS_META = {
    PENDING:        'Chờ thanh toán',
    PAID:           'Đã thanh toán',
    PREPARING:      'Đang pha chế',
    READY:          'Sẵn sàng lấy',
    COMPLETED:      'Hoàn thành',
    PAYMENT_FAILED: 'Thanh toán lỗi',
    CANCELLED:      'Đã hủy',
  };

  function statusLabel(status) {
    return STATUS_META[status] || 'Không rõ';
  }

  /* ---------- Vòng đời dữ liệu ---------- */
  function load(retry) {
    content.setAttribute('aria-busy', 'true');
    content.innerHTML = renderSkeleton(4);
    B.fetchMock(window.BREW_DATA.orders, retry)
      .then(function (orders) {
        content.setAttribute('aria-busy', 'false');
        if (!orders || orders.length === 0) {
          content.innerHTML = renderEmpty();
          return;
        }
        // Sắp xếp mới nhất → cũ nhất (createdAt giảm dần)
        var sorted = orders.slice().sort(function (a, b) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        var list = document.createElement('div');
        list.className = 'order-list';
        sorted.forEach(function (o) { list.appendChild(renderOrderCard(o)); });
        content.innerHTML = '';
        content.appendChild(list);
      })
      .catch(function () {
        content.setAttribute('aria-busy', 'false');
        content.innerHTML = renderError();
        var retryBtn = document.getElementById('retry-btn');
        if (retryBtn) retryBtn.addEventListener('click', function () { load(true); });
      });
  }

  /* ---------- 1 thẻ đơn hàng (mở/đóng bằng button + aria-expanded) ---------- */
  function renderOrderCard(order) {
    var card = document.createElement('article');
    card.className = 'order-card';

    var items = Array.isArray(order.items) ? order.items : [];
    var itemCount = items.reduce(function (sum, it) { return sum + (it.qty || 0); }, 0);
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
    badge.className = 'status-badge status-' + (STATUS_META[order.status] ? order.status : 'UNKNOWN');
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
    right.style.display = 'inline-flex';
    right.style.alignItems = 'center';
    right.style.gap = '0.75rem';
    var totalEl = document.createElement('span');
    totalEl.className = 'order-card__total';
    totalEl.textContent = 'Tổng: ' + B.formatVND(order.total);
    var toggle = document.createElement('span');
    toggle.className = 'order-card__toggle';
    toggle.innerHTML = '<span class="toggle-text">Xem món</span> <span class="chev" aria-hidden="true">▾</span>';
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

    items.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'order-item';
      var nameEl = document.createElement('span');
      nameEl.className = 'order-item__name';
      // Thiếu tên sản phẩm → hiển thị "Sản phẩm #id" (giả định 2 trong plan)
      nameEl.textContent = it.productName || ('Sản phẩm #' + it.productId);
      var lineTotal = document.createElement('span');
      lineTotal.className = 'order-item__line-total';
      lineTotal.textContent = B.formatVND(it.lineTotal || 0);
      var metaEl = document.createElement('span');
      metaEl.className = 'order-item__meta';
      metaEl.textContent = 'Size ' + (it.size || 'M') + ' × ' + (it.qty || 1);
      row.appendChild(nameEl);
      row.appendChild(lineTotal);
      row.appendChild(metaEl);
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

  /* ---------- State: skeleton / empty / error ---------- */
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
        '<div class="state-box__icon" aria-hidden="true">🧾</div>' +
        '<h2>Bạn chưa có đơn nào</h2>' +
        '<p>Chọn món yêu thích tại menu và đặt thử nhé!</p>' +
        '<a class="btn btn--primary" href="index.html">Về menu</a>' +
      '</div>'
    );
  }

  function renderError() {
    return (
      '<div class="state-box" role="alert">' +
        '<div class="state-box__icon" aria-hidden="true">⚠️</div>' +
        '<h2>Không tải được đơn hàng</h2>' +
        '<p>Có lỗi xảy ra khi tải lịch sử đơn.</p>' +
        '<button class="btn btn--primary" id="retry-btn" type="button">Thử lại</button>' +
      '</div>'
    );
  }

  load(false);
})();
