/**
 * Overview Section Controller (js/overview.js)
 * Pure DOM implementation with NO innerHTML.
 */

window.renderOverviewView = function() {
  const totalRev = window.ordersData.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? o.total : 0), 0);
  const totalOrders = window.ordersData.length;
  const avgOrderVal = totalOrders ? totalRev / totalOrders : 0;
  const activeReturns = window.returnsData.length;

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

  const recents = window.ordersData.slice(0, 5);

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
