/**
 * Orders Section Controller (js/orders.js)
 * Pure DOM implementation with NO innerHTML.
 */

window.currentOrderStatusFilter = 'all';
window.orderSearchQuery = '';
window.orderSortMode = 'date-desc';
window.selectedOrderIds = new Set();

window.getStatusClass = function(status) {
  const s = (status || '').toLowerCase();
  if (s === 'paid') return 'status-paid';
  if (s === 'in-transit' || s === 'transit') return 'status-transit';
  if (s === 'delivered') return 'status-delivered';
  if (s === 'cancelled') return 'status-cancelled';
  return 'status-paid';
};

window.renderKPICards = function() {
  const totalRev = window.ordersData.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? o.total : 0), 0);
  const totalOrders = window.ordersData.length;
  const pendingOrders = window.ordersData.filter(o => o.status === 'Paid').length;
  const avgOrderVal = totalOrders ? totalRev / totalOrders : 0;

  const revEl = document.getElementById('ordersKpiRevenue');
  const countEl = document.getElementById('ordersKpiCount');
  const pendingEl = document.getElementById('ordersKpiPending');
  const aovEl = document.getElementById('ordersKpiAOV');

  if (revEl) revEl.textContent = window.fmtPrice(totalRev);
  if (countEl) countEl.textContent = totalOrders.toString();
  if (pendingEl) pendingEl.textContent = pendingOrders.toString();
  if (aovEl) aovEl.textContent = window.fmtPrice(avgOrderVal);

  const ordersBadge = document.getElementById('sidebarOrdersBadge');
  if (ordersBadge) ordersBadge.textContent = totalOrders.toString();
};

window.renderOrdersTable = function() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  // Filter
  let filtered = window.ordersData.filter(order => {
    if (window.currentOrderStatusFilter !== 'all') {
      const s = order.status.toLowerCase();
      if (window.currentOrderStatusFilter === 'transit' && s !== 'in-transit') return false;
      if (window.currentOrderStatusFilter !== 'transit' && s !== window.currentOrderStatusFilter) return false;
    }
    if (window.orderSearchQuery) {
      const q = window.orderSearchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchName = order.customer.fullName.toLowerCase().includes(q);
      const matchEmail = order.customer.email.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchEmail) return false;
    }
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    if (window.orderSortMode === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (window.orderSortMode === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (window.orderSortMode === 'total-desc') return b.total - a.total;
    if (window.orderSortMode === 'total-asc') return a.total - b.total;
    return 0;
  });

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.style.color = 'var(--muted)';
    td.textContent = 'No orders found matching the filter criteria.';
    tr.appendChild(td);
    tbody.replaceChildren(tr);
    return;
  }

  const rows = filtered.map(order => {
    const tr = document.createElement('tr');
    tr.id = `order-row-${order.id.replace('#', '')}`;
    if (window.selectedOrderIds.has(order.id)) {
      tr.classList.add('selected');
    }

    // 1. Select checkbox
    const tdSelect = document.createElement('td');
    tdSelect.className = 'select-col';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'dash-checkbox';
    checkbox.checked = window.selectedOrderIds.has(order.id);
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      if (checkbox.checked) {
        window.selectedOrderIds.add(order.id);
        tr.classList.add('selected');
      } else {
        window.selectedOrderIds.delete(order.id);
        tr.classList.remove('selected');
      }
      window.updateSelectAllCheckboxState();
    });
    tdSelect.appendChild(checkbox);

    // 2. Order ID
    const tdId = document.createElement('td');
    tdId.className = 'order-id-cell';
    tdId.textContent = order.id;

    // 3. Customer
    const tdCustomer = document.createElement('td');
    const custCell = document.createElement('div');
    custCell.className = 'customer-cell';

    const avatar = document.createElement('img');
    avatar.className = 'customer-avatar';
    avatar.src = order.customer.avatar;
    avatar.alt = order.customer.fullName;

    const name = document.createElement('span');
    name.className = 'customer-name';
    name.textContent = order.customer.fullName;

    custCell.append(avatar, name);
    tdCustomer.appendChild(custCell);

    // 4. Status
    const tdStatus = document.createElement('td');
    const statusPill = document.createElement('span');
    statusPill.className = `status-pill ${window.getStatusClass(order.status)}`;
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

    // 7. Actions inspect button
    const tdAction = document.createElement('td');
    const inspectBtn = document.createElement('button');
    inspectBtn.type = 'button';
    inspectBtn.className = 'action-dots-btn';
    inspectBtn.title = 'View Order Details';
    inspectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.selectAndOpenOrder === 'function') {
        window.selectAndOpenOrder(order.id);
      }
    });

    const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowSvg.setAttribute('width', '14');
    arrowSvg.setAttribute('height', '14');
    arrowSvg.setAttribute('viewBox', '0 0 24 24');
    arrowSvg.setAttribute('fill', 'none');
    arrowSvg.setAttribute('stroke', 'currentColor');
    arrowSvg.setAttribute('stroke-width', '2');

    const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowPath.setAttribute('d', 'M9 18l6-6-6-6');
    arrowSvg.appendChild(arrowPath);
    inspectBtn.appendChild(arrowSvg);
    tdAction.appendChild(inspectBtn);

    // Row click opens drawer
    tr.addEventListener('click', () => {
      if (typeof window.selectAndOpenOrder === 'function') {
        window.selectAndOpenOrder(order.id);
      }
    });

    tr.append(tdSelect, tdId, tdCustomer, tdStatus, tdTotal, tdDate, tdAction);
    return tr;
  });

  tbody.replaceChildren(...rows);
  window.updateSelectAllCheckboxState();
};

window.updateSelectAllCheckboxState = function() {
  const selectAll = document.getElementById('selectAllOrders');
  if (!selectAll) return;
  const count = window.ordersData.length;
  selectAll.checked = count > 0 && window.selectedOrderIds.size === count;
};

window.setOrderStatusFilter = function(statusKey) {
  window.currentOrderStatusFilter = statusKey;
  window.renderOrdersTable();
};

// Toolbar setup
document.addEventListener('DOMContentLoaded', () => {
  // Status tab buttons
  document.querySelectorAll('.status-tab-btn[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.status-tab-btn[data-status]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.setOrderStatusFilter(btn.getAttribute('data-status'));
    });
  });

  // Search input
  const searchInput = document.getElementById('orderSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      window.orderSearchQuery = e.target.value.trim();
      window.renderOrdersTable();
    });
  }

  // Sort select
  const sortSelect = document.getElementById('sortFilterSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      window.orderSortMode = e.target.value;
      window.renderOrdersTable();
    });
  }

  // Select all checkbox
  const selectAll = document.getElementById('selectAllOrders');
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      if (selectAll.checked) {
        window.ordersData.forEach(o => window.selectedOrderIds.add(o.id));
      } else {
        window.selectedOrderIds.clear();
      }
      window.renderOrdersTable();
    });
  }
});
