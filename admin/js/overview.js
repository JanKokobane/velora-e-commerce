/**
 * Overview Section Controller (js/overview.js)
 * Pure DOM implementation with NO innerHTML.
 */

function isPaidOverviewOrder(order) {
  const paymentStatus = String(order.paymentStatus || order.payment_status || '').toLowerCase();
  const orderStatus = String(order.status || '').toLowerCase().replace(/_/g, '-');
  if (['cancelled', 'canceled', 'refunded'].includes(orderStatus)) return false;
  if (paymentStatus) return ['paid', 'settled', 'completed'].includes(paymentStatus);
  return ['paid', 'processing', 'confirmed', 'in-transit', 'transit', 'shipped', 'delivered'].includes(orderStatus);
}

function renderOverviewOperations(orders, returns) {
  const pendingFulfillment = orders.filter(order => {
    const status = String(order.status || '').toLowerCase().replace(/_/g, '-');
    return isPaidOverviewOrder(order) && ['paid', 'processing', 'confirmed'].includes(status);
  }).length;
  const inTransit = orders.filter(order =>
    ['in-transit', 'transit', 'shipped'].includes(String(order.status || '').toLowerCase().replace(/_/g, '-'))
  ).length;
  const pendingReturns = returns.filter(item => {
    const status = String(item.apiStatus || item.status || '').toLowerCase().replace(/ /g, '_');
    return ['pending', 'under_review'].includes(status);
  }).length;

  const pendingCount = document.getElementById('overviewPendingFulfillmentCount');
  const transitCount = document.getElementById('overviewInTransitCount');
  const returnsCount = document.getElementById('overviewPendingReturnsCount');
  if (pendingCount) pendingCount.textContent = String(pendingFulfillment);
  if (transitCount) transitCount.textContent = String(inTransit);
  if (returnsCount) returnsCount.textContent = String(pendingReturns);
}

function renderOverviewTrendingGoods(orders) {
  const list = document.getElementById('overviewTrendingGoodsList');
  if (!list) return;

  const inventory = Array.isArray(window.inventoryData) ? window.inventoryData : [];
  const soldProducts = new Map();
  const inventoryId = product => String(product.dbId || product.id || '').replace(/^db-/, '').toLowerCase();

  orders.filter(isPaidOverviewOrder).forEach(order => {
    (Array.isArray(order.items) ? order.items : []).forEach(item => {
      const quantity = Number(item.qty ?? item.quantity) || 0;
      if (quantity <= 0) return;

      const productId = String(item.productId || item.product_id || item.id || '').replace(/^db-/, '').toLowerCase();
      const title = String(item.title || item.productName || item.product_name || item.name || 'Product');
      const key = productId || title.toLowerCase();
      const inventoryProduct = inventory.find(product =>
        (productId && inventoryId(product) === productId) ||
        String(product.title || product.name || '').toLowerCase() === title.toLowerCase()
      );
      const current = soldProducts.get(key);

      if (current) {
        current.unitsSold += quantity;
      } else {
        soldProducts.set(key, {
          title: inventoryProduct?.title || title,
          category: inventoryProduct?.category || item.category || 'Product',
          image: inventoryProduct?.img || inventoryProduct?.image_url || item.img || item.image || '',
          price: Number(inventoryProduct?.price ?? item.price ?? item.unitPrice ?? item.unit_price) || 0,
          unitsSold: quantity
        });
      }
    });
  });

  const trending = Array.from(soldProducts.values())
    .sort((first, second) => second.unitsSold - first.unitsSold)
    .slice(0, 3);

  if (trending.length === 0) {
    const empty = document.createElement('div');
    empty.style.padding = '16px 0';
    empty.style.color = 'var(--muted)';
    empty.style.fontSize = '13px';
    empty.textContent = 'No paid product sales recorded yet.';
    list.replaceChildren(empty);
    return;
  }

  const rows = trending.map(product => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '12px';

    const image = document.createElement('img');
    image.src = product.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"%3E%3Crect width="44" height="44" fill="%23e8e8e8"/%3E%3C/svg%3E';
    image.alt = product.title;
    image.style.width = '44px';
    image.style.height = '44px';
    image.style.flex = '0 0 44px';
    image.style.borderRadius = '6px';
    image.style.objectFit = 'cover';
    image.onerror = function() {
      this.onerror = null;
      this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"%3E%3Crect width="44" height="44" fill="%23e8e8e8"/%3E%3C/svg%3E';
    };

    const details = document.createElement('div');
    details.style.flex = '1';
    details.style.minWidth = '0';
    const title = document.createElement('div');
    title.style.fontSize = '13px';
    title.style.fontWeight = '600';
    title.textContent = product.title;
    const meta = document.createElement('div');
    meta.style.fontSize = '11.5px';
    meta.style.color = 'var(--muted)';
    meta.textContent = `${product.category} · ${product.unitsSold} unit${product.unitsSold === 1 ? '' : 's'} sold`;
    details.append(title, meta);

    const price = document.createElement('div');
    price.style.fontWeight = '700';
    price.style.fontSize = '13.5px';
    price.textContent = window.fmtPrice(product.price);

    row.append(image, details, price);
    return row;
  });
  list.replaceChildren(...rows);
}

window.renderOverviewView = function() {
  const orders = Array.isArray(window.ordersData) ? window.ordersData : [];
  const returns = Array.isArray(window.returnsData) ? window.returnsData : [];
  const totalRev = orders.reduce((acc, order) => acc + (order.status !== 'Cancelled' ? Number(order.total) || 0 : 0), 0);
  const totalOrders = orders.length;
  const avgOrderVal = totalOrders ? totalRev / totalOrders : 0;
  const activeReturns = returns.filter(item => ['pending', 'approved'].includes(String(item.apiStatus || item.status || '').toLowerCase())).length;

  renderOverviewOperations(orders, returns);
  renderOverviewTrendingGoods(orders);

  // Update KPI Metric Cards
  const kpiRev = document.getElementById('overviewKpiTotalRev');
  const kpiOrders = document.getElementById('overviewKpiTotalOrders');
  const kpiReturns = document.getElementById('overviewKpiActiveReturns');
  const kpiBasket = document.getElementById('overviewKpiAvgBasket');

  if (kpiRev) kpiRev.textContent = window.fmtPrice(totalRev);
  if (kpiOrders) kpiOrders.textContent = totalOrders.toString();
  if (kpiReturns) kpiReturns.textContent = activeReturns.toString();
  if (kpiBasket) kpiBasket.textContent = window.fmtPrice(avgOrderVal);

  // Render Recent Orders Table
  const tbody = document.getElementById('overviewRecentOrdersBody');
  if (!tbody) return;

  const recents = orders.slice(0, 5);

  if (recents.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.style.textAlign = 'center';
    td.style.padding = '32px';
    td.style.color = 'var(--muted)';
    td.textContent = 'No orders recorded yet.';
    tr.appendChild(td);
    tbody.replaceChildren(tr);
    return;
  }

  const rows = recents.map(order => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
      if (typeof window.selectAndOpenOrder === 'function') {
        window.selectAndOpenOrder(order.id);
      }
    });

    // 1. Status dot
    const tdDot = document.createElement('td');
    tdDot.className = 'select-col';
    const dotSpan = document.createElement('span');
    dotSpan.style.display = 'inline-block';
    dotSpan.style.width = '8px';
    dotSpan.style.height = '8px';
    dotSpan.style.borderRadius = '50%';
    dotSpan.style.background = order.status === 'Paid' ? '#10b981' : (order.status === 'Cancelled' ? '#ef4444' : '#f59e0b');
    tdDot.appendChild(dotSpan);

    // 2. Order ID
    const tdId = document.createElement('td');
    tdId.className = 'order-id-cell';
    tdId.textContent = order.id;

    // 3. Customer
    const tdCustomer = document.createElement('td');
    const custCell = document.createElement('div');
    custCell.className = 'customer-cell';

    const avatarImg = document.createElement('img');
    avatarImg.className = 'customer-avatar';
    avatarImg.src = order.customer.avatar;
    avatarImg.alt = order.customer.fullName;
    avatarImg.onerror = function() {
      this.onerror = null;
      this.src = (typeof window.createInitialsAvatarSvg === 'function')
        ? window.createInitialsAvatarSvg(order.customer.fullName)
        : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23232030\'/%3E%3Ctext x=\'20\' y=\'24\' fill=\'%23c9a57a\' font-size=\'14\' text-anchor=\'middle\' font-family=\'sans-serif\'%3EV%3C/text%3E%3C/svg%3E';
    };

    const nameSpan = document.createElement('span');
    nameSpan.className = 'customer-name';
    nameSpan.textContent = order.customer.fullName;

    custCell.append(avatarImg, nameSpan);
    tdCustomer.appendChild(custCell);

    // 4. Status pill
    const tdStatus = document.createElement('td');
    const statusPill = document.createElement('span');
    statusPill.className = `status-pill ${typeof window.getStatusClass === 'function' ? window.getStatusClass(order.status) : 'status-paid'}`;
    statusPill.textContent = order.status;
    tdStatus.appendChild(statusPill);

    // 5. Total
    const tdTotal = document.createElement('td');
    tdTotal.className = 'order-total-cell';
    tdTotal.textContent = window.fmtPrice(order.total);

    // 6. Date
    const tdDate = document.createElement('td');
    tdDate.className = 'order-date-cell';
    tdDate.textContent = order.dateShort || order.date;

    tr.append(tdDot, tdId, tdCustomer, tdStatus, tdTotal, tdDate);
    return tr;
  });

  tbody.replaceChildren(...rows);
};

window.filterToStatus = function(statusKey) {
  if (typeof window.switchTab === 'function') {
    window.switchTab('orders');
  }

  // Set active status tab in orders toolbar
  const statusBtns = document.querySelectorAll('.status-tab-btn[data-status]');
  statusBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-status') === statusKey);
  });

  if (typeof window.setOrderStatusFilter === 'function') {
    window.setOrderStatusFilter(statusKey);
  }
};
