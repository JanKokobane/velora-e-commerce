/**
 * Returns Section Controller (js/returns.js)
 * Pure DOM implementation with NO innerHTML.
 */

window.renderReturnsView = function() {
  const totalPendingRefund = window.returnsData.reduce((acc, r) => acc + (r.refundAmount || 0), 0);

  const pendingCountEl = document.getElementById('returnsKpiPendingCount');
  const totalValueEl = document.getElementById('returnsKpiTotalValue');

  if (pendingCountEl) pendingCountEl.textContent = window.returnsData.length.toString();
  if (totalValueEl) totalValueEl.textContent = window.fmtPrice(totalPendingRefund);

  const returnsBadge = document.getElementById('sidebarReturnsBadge');
  if (returnsBadge) returnsBadge.textContent = window.returnsData.length.toString();

  const tbody = document.getElementById('returnsTableBody');
  if (!tbody) return;

  if (window.returnsData.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.style.color = 'var(--muted)';
    td.textContent = 'No pending returns or refund disputes recorded.';
    tr.appendChild(td);
    tbody.replaceChildren(tr);
    return;
  }

  const rows = window.returnsData.map(ret => {
    const tr = document.createElement('tr');

    // 1. Return ID
    const tdId = document.createElement('td');
    tdId.style.fontWeight = '700';
    tdId.style.letterSpacing = '0.04em';
    tdId.style.color = 'var(--ink)';
    tdId.textContent = ret.id;

    // 2. Order ID link button
    const tdOrder = document.createElement('td');
    const orderBtn = document.createElement('button');
    orderBtn.type = 'button';
    orderBtn.className = 'drawer-btn drawer-btn-dark';
    orderBtn.style.flex = 'initial';
    orderBtn.style.padding = '4px 10px';
    orderBtn.style.fontSize = '11.5px';
    orderBtn.textContent = `${ret.orderId} ↗`;
    orderBtn.addEventListener('click', () => {
      if (typeof window.selectAndOpenOrder === 'function') {
        window.selectAndOpenOrder(ret.orderId);
      }
    });
    tdOrder.appendChild(orderBtn);

    // 3. Customer
    const tdCust = document.createElement('td');
    const strong = document.createElement('strong');
    strong.textContent = ret.customer;
    tdCust.appendChild(strong);

    // 4. Reason
    const tdReason = document.createElement('td');
    tdReason.style.color = 'var(--muted)';
    tdReason.style.fontSize = '12.5px';
    tdReason.style.maxWidth = '260px';
    tdReason.textContent = ret.reason;

    // 5. Refund amount
    const tdAmount = document.createElement('td');
    tdAmount.style.fontWeight = '700';
    tdAmount.textContent = window.fmtPrice(ret.refundAmount);

    // 6. Status
    const tdStatus = document.createElement('td');
    const pill = document.createElement('span');
    pill.className = `status-pill ${ret.status === 'Authorised' ? 'status-delivered' : 'status-paid'}`;
    pill.textContent = ret.status;
    tdStatus.appendChild(pill);

    // 7. Action
    const tdAction = document.createElement('td');
    const actionWrap = document.createElement('div');
    actionWrap.style.display = 'flex';
    actionWrap.style.gap = '8px';

    const approveBtn = document.createElement('button');
    approveBtn.type = 'button';
    approveBtn.className = 'drawer-btn drawer-btn-accent';
    approveBtn.style.flex = 'initial';
    approveBtn.style.padding = '5px 10px';
    approveBtn.style.fontSize = '11.5px';
    approveBtn.textContent = 'Approve Refund';
    approveBtn.addEventListener('click', () => {
      window.processReturnRefund(ret.id);
    });

    actionWrap.appendChild(approveBtn);
    tdAction.appendChild(actionWrap);

    tr.append(tdId, tdOrder, tdCust, tdReason, tdAmount, tdStatus, tdAction);
    return tr;
  });

  tbody.replaceChildren(...rows);
};

window.processReturnRefund = function(returnId) {
  const ret = window.returnsData.find(r => r.id === returnId);
  if (!ret) return;

  ret.status = 'Refund Processed';
  window.saveReturns();

  window.showToast(`Refund of ${window.fmtPrice(ret.refundAmount)} approved for ${ret.customer}`);
  window.renderReturnsView();
  if (typeof window.renderOverviewView === 'function') window.renderOverviewView();
};
