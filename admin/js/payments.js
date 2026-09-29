/**
 * Payments & Settlements Section Controller (js/payments.js)
 * Pure DOM implementation with NO innerHTML.
 */

window.paymentGatewayFilter = 'all';
window.paymentStatusFilter = 'all';
window.paymentSearchQuery = '';
window.paymentsLoadError = '';
window._isFetchingPayments = false;

function getPaymentsApiBaseUrl() {
  return window.VELORA_API_URL ||
    window.VELORA_API_BASE_URL ||
    'https://velora-e-commerce-qby7.onrender.com';
}

function getAdminAuthToken() {
  if (window.adminAuthApi && typeof window.adminAuthApi.getToken === 'function') {
    return window.adminAuthApi.getToken() || '';
  }

  return localStorage.getItem('velora_admin_token') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token') || '';
}

function formatPaymentTimestamp(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function mapDbPayment(payment) {
  const method = String(payment.paymentMethod || '').toLowerCase();
  const methods = {
    eft: 'EFT',
    snapscan: 'SnapScan',
    zapper: 'Zapper',
    card: 'Card',
    cod: 'Cash on Delivery'
  };
  const status = String(payment.paymentStatus || 'unknown');
  const amount = Number(payment.amount) || 0;
  const rawOrderNumber = payment.orderNumber || payment.orderId || '';
  const orderId = String(rawOrderNumber).startsWith('#')
    ? String(rawOrderNumber)
    : `#${rawOrderNumber}`;
  const customer = payment.customer || {};

  return {
    ref: payment.transactionReference || payment.gatewayReference || `PAY-${payment.id}`,
    orderId,
    customer: customer.fullName || customer.email || 'Customer not recorded',
    gateway: methods[method] || (method ? method.toUpperCase() : 'Not recorded'),
    grossAmount: amount,
    fee: payment.fee == null ? null : Number(payment.fee),
    netAmount: payment.netAmount == null ? null : Number(payment.netAmount),
    timestamp: formatPaymentTimestamp(payment.createdAt || payment.updatedAt),
    status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
    bank: payment.bank || 'Not recorded'
  };
}

window.fetchPaymentsFromDb = async function() {
  if (window._isFetchingPayments) return;
  window._isFetchingPayments = true;
  window.paymentsLoadError = '';
  window.renderPaymentsView();

  try {
    const token = getAdminAuthToken();
    if (!token) throw new Error('Administrator sign-in is required to view payments.');

    const baseUrl = getPaymentsApiBaseUrl().replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/api/payments/admin`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || `Payments API returned HTTP ${response.status}.`);
    }

    const payments = Array.isArray(data?.payments) ? data.payments : [];
    window.paymentsData = payments.map(mapDbPayment);
  } catch (error) {
    console.error('[Velora Admin] Error fetching payments:', error);
    window.paymentsData = [];
    window.paymentsLoadError = error.message || 'Unable to load payments.';
  } finally {
    window._isFetchingPayments = false;
    window.renderPaymentsView();
  }
};

window.renderPaymentsView = function() {
  const payments = Array.isArray(window.paymentsData) ? window.paymentsData : [];
  const paidPayments = payments.filter(p => p.status === 'Paid' || p.status === 'Settled');
  const grossVolume = paidPayments.reduce((acc, p) => acc + p.grossAmount, 0);
  const knownNetPayments = paidPayments.filter(p => Number.isFinite(p.netAmount));
  const netVolume = knownNetPayments.reduce((acc, p) => acc + p.netAmount, 0);
  const settledCount = paidPayments.length;
  const instantEftCount = payments.filter(p => ['eft', 'snapscan'].includes(p.gateway.toLowerCase())).length;
  const eftSharePercent = payments.length ? Math.round((instantEftCount / payments.length) * 100) : 0;

  const grossEl = document.getElementById('paymentsKpiGross');
  const netEl = document.getElementById('paymentsKpiNet');
  const eftEl = document.getElementById('paymentsKpiEftShare');
  const settledNote = document.getElementById('paymentsKpiSettledNote');

  if (grossEl) grossEl.textContent = window.fmtPrice(grossVolume);
  if (netEl) netEl.textContent = knownNetPayments.length ? window.fmtPrice(netVolume) : 'Not recorded';
  if (eftEl) eftEl.textContent = `${eftSharePercent}%`;
  if (settledNote) {
    const span = document.createElement('span');
    span.textContent = `${settledCount} paid transactions`;
    settledNote.replaceChildren(span);
  }

  const sidebarBadge = document.getElementById('sidebarPaymentsBadge');
  if (sidebarBadge) sidebarBadge.textContent = payments.length.toString();

  const tbody = document.getElementById('paymentsTableBody');
  if (!tbody) return;

  const filtered = payments.filter(pay => {
    if (window.paymentGatewayFilter !== 'all' && pay.gateway !== window.paymentGatewayFilter) return false;
    if (window.paymentStatusFilter !== 'all' && pay.status.toLowerCase() !== window.paymentStatusFilter.toLowerCase()) return false;
    if (window.paymentSearchQuery) {
      const q = window.paymentSearchQuery.toLowerCase();
      const matchRef = pay.ref.toLowerCase().includes(q);
      const matchOrd = pay.orderId.toLowerCase().includes(q);
      const matchCust = pay.customer.toLowerCase().includes(q);
      if (!matchRef && !matchOrd && !matchCust) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 9;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.style.color = 'var(--muted)';
    td.textContent = window.paymentsLoadError
      ? 'Could not load payments from the server.'
      : window._isFetchingPayments
        ? 'Loading payments...'
        : payments.length
          ? 'No payments found for the selected filter.'
          : 'No payment records found.';
    tr.appendChild(td);
    tbody.replaceChildren(tr);
    return;
  }

  const rows = filtered.map(pay => {
    const tr = document.createElement('tr');

    // 1. Payment Ref
    const tdRef = document.createElement('td');
    tdRef.style.fontWeight = '700';
    tdRef.style.letterSpacing = '0.04em';
    tdRef.style.color = 'var(--ink)';
    tdRef.style.fontSize = '13px';
    tdRef.textContent = pay.ref;

    // 2. Order ID button
    const tdOrder = document.createElement('td');
    const orderBtn = document.createElement('button');
    orderBtn.type = 'button';
    orderBtn.className = 'drawer-btn drawer-btn-dark';
    orderBtn.style.flex = 'initial';
    orderBtn.style.padding = '4px 9px';
    orderBtn.style.fontSize = '11.5px';
    orderBtn.textContent = `${pay.orderId} ↗`;
    orderBtn.addEventListener('click', () => {
      if (typeof window.selectAndOpenOrder === 'function') {
        window.selectAndOpenOrder(pay.orderId);
      }
    });
    tdOrder.appendChild(orderBtn);

    // 3. Customer
    const tdCust = document.createElement('td');
    tdCust.style.fontWeight = '600';
    tdCust.style.fontSize = '13.5px';
    tdCust.textContent = pay.customer;

    // 4. Gateway badge
    const tdGateway = document.createElement('td');
    const gwBadge = document.createElement('span');
    let gwClass = 'gateway-card';
    if (pay.gateway.includes('EFT')) gwClass = 'gateway-ozow';
    else if (pay.gateway.includes('SnapScan')) gwClass = 'gateway-snapscan';
    else if (pay.gateway.includes('Card')) gwClass = 'gateway-card';

    gwBadge.className = `badge-gateway ${gwClass}`;
    gwBadge.textContent = pay.gateway;
    tdGateway.appendChild(gwBadge);

    // 5. Gross
    const tdGross = document.createElement('td');
    tdGross.style.fontWeight = '700';
    tdGross.style.color = 'var(--ink)';
    tdGross.style.fontSize = '13.5px';
    tdGross.textContent = window.fmtPrice(pay.grossAmount);

    // 6. Net
    const tdNet = document.createElement('td');
    tdNet.style.fontSize = '13px';
    tdNet.style.color = '#047857';
    tdNet.style.fontWeight = '600';
    tdNet.textContent = Number.isFinite(pay.netAmount) ? window.fmtPrice(pay.netAmount) : 'Not recorded';

    // 7. Timestamp
    const tdTime = document.createElement('td');
    tdTime.style.fontSize = '12.5px';
    tdTime.style.color = 'var(--muted)';
    tdTime.textContent = pay.timestamp;

    // 8. Status pill
    const tdStatus = document.createElement('td');
    const statusPill = document.createElement('span');
    statusPill.className = 'status-pill';
    if (pay.status === 'Refunded' || pay.status === 'Failed') {
      statusPill.style.background = '#fee2e2';
      statusPill.style.color = '#b91c1c';
    } else if (pay.status === 'Processing' || pay.status === 'Pending') {
      statusPill.style.background = '#fef9c3';
      statusPill.style.color = '#854d0e';
    } else {
      statusPill.style.background = '#dcfce7';
      statusPill.style.color = '#15803d';
    }
    statusPill.textContent = pay.status;
    tdStatus.appendChild(statusPill);

    // 9. Receipt action button
    const tdAction = document.createElement('td');
    const receiptBtn = document.createElement('button');
    receiptBtn.type = 'button';
    receiptBtn.className = 'action-dots-btn';
    receiptBtn.title = 'Inspect Payment Receipt';
    receiptBtn.addEventListener('click', () => {
      window.openPaymentReceiptModal(pay.ref);
    });

    const docSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    docSvg.setAttribute('width', '15');
    docSvg.setAttribute('height', '15');
    docSvg.setAttribute('viewBox', '0 0 24 24');
    docSvg.setAttribute('fill', 'none');
    docSvg.setAttribute('stroke', 'currentColor');
    docSvg.setAttribute('stroke-width', '2');

    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', '14 2 14 8 20 8');
    docSvg.append(path1, poly);

    receiptBtn.appendChild(docSvg);
    tdAction.appendChild(receiptBtn);

    tr.append(tdRef, tdOrder, tdCust, tdGateway, tdGross, tdNet, tdTime, tdStatus, tdAction);
    return tr;
  });

  tbody.replaceChildren(...rows);
};

window.openPaymentReceiptModal = function(payRef) {
  const payment = window.paymentsData.find(p => p.ref === payRef);
  if (!payment) return;

  const refEl = document.getElementById('receiptRefCode');
  const statusEl = document.getElementById('receiptStatusPill');
  const orderIdEl = document.getElementById('receiptOrderId');
  const timeEl = document.getElementById('receiptTimestamp');
  const custEl = document.getElementById('receiptCustomer');
  const gwEl = document.getElementById('receiptGateway');
  const bankEl = document.getElementById('receiptBank');
  const grossEl = document.getElementById('receiptGrossAmount');
  const feeEl = document.getElementById('receiptFeeAmount');
  const netEl = document.getElementById('receiptNetAmount');

  if (refEl) refEl.textContent = payment.ref;
  if (statusEl) statusEl.textContent = payment.status;
  if (orderIdEl) orderIdEl.textContent = payment.orderId;
  if (timeEl) timeEl.textContent = payment.timestamp;
  if (custEl) custEl.textContent = payment.customer;
  if (gwEl) gwEl.textContent = payment.gateway;
  if (bankEl) bankEl.textContent = payment.bank || 'Not recorded';
  if (grossEl) grossEl.textContent = window.fmtPrice(payment.grossAmount);
  if (feeEl) feeEl.textContent = Number.isFinite(payment.fee) ? `-${window.fmtPrice(payment.fee)}` : 'Not recorded';
  if (netEl) netEl.textContent = Number.isFinite(payment.netAmount) ? window.fmtPrice(payment.netAmount) : 'Not recorded';

  const modal = document.getElementById('paymentReceiptModal');
  if (modal) modal.classList.add('open');
};

window.closePaymentReceiptModal = function() {
  const modal = document.getElementById('paymentReceiptModal');
  if (modal) modal.classList.remove('open');
};

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('paymentSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      window.paymentSearchQuery = e.target.value.trim();
      window.renderPaymentsView();
    });
  }

  const gwSelect = document.getElementById('paymentGatewayFilter');
  if (gwSelect) {
    gwSelect.addEventListener('change', (e) => {
      window.paymentGatewayFilter = e.target.value;
      window.renderPaymentsView();
    });
  }

  const statusSelect = document.getElementById('paymentStatusFilter');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      window.paymentStatusFilter = e.target.value;
      window.renderPaymentsView();
    });
  }
});
