/**
 * Returns Section Controller (js/returns.js)
 * Pure DOM implementation with NO innerHTML.
 */

function getReturnsApiUrl() {
  const baseUrl = window.VELORA_API_URL || window.VELORA_API_BASE_URL || 'https://velora-e-commerce-qby7.onrender.com';
  return `${baseUrl.replace(/\/+$/, '')}/api/returns`;
}

window.fetchReturnsFromDb = async function() {
  const token = window.adminAuthApi?.getToken?.() ||
    localStorage.getItem('velora_admin_token') ||
    localStorage.getItem('token') || '';
  try {
    const response = await fetch(getReturnsApiUrl(), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || `Returns API returned HTTP ${response.status}.`);
    }
    window.returnsData = (Array.isArray(data?.returns) ? data.returns : []).map((item) => ({
      id: String(item.id),
      orderId: item.order_number,
      customer: item.customer_name,
      reason: item.reason,
      refundAmount: Number(item.amount) || 0,
      status: item.status === 'pending'
        ? 'Under Review'
        : item.status === 'approved'
          ? 'Approved'
          : item.status === 'refunded'
            ? 'Refunded'
            : 'Rejected',
      apiStatus: item.status
    }));
    window.renderReturnsView();
    if (typeof window.renderOverviewView === 'function') window.renderOverviewView();
    return window.returnsData;
  } catch (error) {
    console.error('[Velora Admin] Error fetching returns:', error);
    window.returnsData = [];
    if (typeof window.renderOverviewView === 'function') window.renderOverviewView();
    if (typeof window.showToast === 'function') {
      window.showToast(`Could not load returns: ${error.message}`);
    }
    return [];
  }
};

window.renderReturnsView = function() {
  const returns = Array.isArray(window.returnsData) ? window.returnsData : [];
  const pendingReturns = returns.filter(r => r.apiStatus === 'pending');
  const totalPendingRefund = pendingReturns.reduce((acc, r) => acc + (r.refundAmount || 0), 0);

  const pendingCountEl = document.getElementById('returnsKpiPendingCount');
  const totalValueEl = document.getElementById('returnsKpiTotalValue');

  if (pendingCountEl) pendingCountEl.textContent = pendingReturns.length.toString();
  if (totalValueEl) totalValueEl.textContent = window.fmtPrice(totalPendingRefund);

  const returnsBadge = document.getElementById('sidebarReturnsBadge');
  if (returnsBadge) returnsBadge.textContent = pendingReturns.length.toString();

  const tbody = document.getElementById('returnsTableBody');
  if (!tbody) return;

  if (returns.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.style.color = 'var(--muted)';
    td.textContent = 'No return requests recorded.';
    tr.appendChild(td);
    tbody.replaceChildren(tr);
    return;
  }

  const rows = returns.map(ret => {
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
    pill.className = `status-pill ${['Approved', 'Refunded'].includes(ret.status) ? 'status-delivered' : 'status-paid'}`;
    pill.textContent = ret.status;
    tdStatus.appendChild(pill);

    // 7. Action
    const tdAction = document.createElement('td');
    const actionWrap = document.createElement('div');
    actionWrap.style.display = 'flex';
    actionWrap.style.gap = '8px';

    if (ret.apiStatus === 'pending') {
      ['approved', 'rejected'].forEach(status => {
        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.className = status === 'approved' ? 'drawer-btn drawer-btn-accent' : 'drawer-btn';
        actionBtn.style.flex = 'initial';
        actionBtn.style.padding = '5px 10px';
        actionBtn.style.fontSize = '11.5px';
        actionBtn.textContent = status === 'approved' ? 'Approve' : 'Reject';
        actionBtn.addEventListener('click', () => window.processReturnRequest(ret.id, status));
        actionWrap.appendChild(actionBtn);
      });
    } else if (ret.apiStatus === 'approved') {
      const refundBtn = document.createElement('button');
      refundBtn.type = 'button';
      refundBtn.className = 'drawer-btn drawer-btn-accent';
      refundBtn.style.flex = 'initial';
      refundBtn.style.padding = '5px 10px';
      refundBtn.style.fontSize = '11.5px';
      refundBtn.textContent = 'Refund';
      refundBtn.addEventListener('click', () => window.processReturnRefund(ret));
      actionWrap.appendChild(refundBtn);
    }
    tdAction.appendChild(actionWrap);

    tr.append(tdId, tdOrder, tdCust, tdReason, tdAmount, tdStatus, tdAction);
    return tr;
  });

  tbody.replaceChildren(...rows);
};

window.processReturnRefund = async function(returnRequest) {
  const confirmed = typeof window.showConfirmModal === 'function'
    ? await window.showConfirmModal({
        title: 'Record Return Refund',
        subtitle: returnRequest.orderId,
        message: `Record a refund of ${window.fmtPrice(returnRequest.refundAmount)} for ${returnRequest.customer}?`,
        confirmText: 'Refund',
        cancelText: 'Keep Return',
        danger: false
      })
    : window.confirm(`Record a refund of ${window.fmtPrice(returnRequest.refundAmount)} for order ${returnRequest.orderId}?`);
  if (!confirmed) return;

  const token = window.adminAuthApi?.getToken?.() ||
    localStorage.getItem('velora_admin_token') ||
    localStorage.getItem('token') || '';
  try {
    const response = await fetch(`${getReturnsApiUrl()}/${encodeURIComponent(returnRequest.id)}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || `Refund failed (${response.status}).`);
    }
    window.showToast('Refund recorded in the payment ledger.');
    await window.fetchReturnsFromDb();
    if (typeof window.fetchOrdersFromDb === 'function') await window.fetchOrdersFromDb();
  } catch (error) {
    window.showToast(error.message || 'Unable to refund return.');
  }
};

window.processReturnRequest = async function(returnId, status = 'approved') {
  const token = window.adminAuthApi?.getToken?.() ||
    localStorage.getItem('velora_admin_token') ||
    localStorage.getItem('token') || '';
  try {
    const response = await fetch(`${getReturnsApiUrl()}/${encodeURIComponent(returnId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || `Return update failed (${response.status}).`);
    }
    window.showToast(status === 'approved' ? 'Return approved.' : 'Return rejected.');
    await window.fetchReturnsFromDb();
    if (typeof window.renderOverviewView === 'function') window.renderOverviewView();
  } catch (error) {
    window.showToast(error.message || 'Unable to update return.');
  }
};
