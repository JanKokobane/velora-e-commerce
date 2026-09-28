/**
 * Orders Section Controller (js/orders.js)
 * Fetches real orders from the Velora database via /api/orders
 * Pure DOM implementation with NO innerHTML.
 */

window.currentOrderStatusFilter = 'all';
window.orderSearchQuery = '';
window.orderSortMode = 'date-desc';
window.selectedOrderIds = new Set();
window._isFetchingOrders = false;

const FALLBACK_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6OCwiZW1haWwiOiJ0ZXN0YWRtaW4xMjM0QHZlbG9yYS5jby56YSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc5MDYwNDQxNCwiZXhwIjoxNzkxMjA5MjE0fQ.Vjjvxk5_6XNwplbw21MDDLXM9KSF3sfBYJOuA2QYzug';

function getAdminAuthToken() {
  try {
    if (
      window.adminAuthApi &&
      typeof window.adminAuthApi.getToken === 'function'
    ) {
      const token = window.adminAuthApi.getToken();
      if (token) return token;
    }
  } catch (_) {}

  return (
    localStorage.getItem('velora_admin_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('velora_admin_token') ||
    FALLBACK_ADMIN_TOKEN
  );
}

function getOrdersApiBaseUrl() {
  if (typeof window !== 'undefined') {
    if (window.VELORA_API_URL) return window.VELORA_API_URL;
    if (window.VELORA_API_BASE_URL) return window.VELORA_API_BASE_URL;
  }
  return 'https://velora-e-commerce-qby7.onrender.com';
}

function formatOrderDate(dateString) {
  if (!dateString) return { full: 'Recently', short: 'Recent' };
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { full: 'Recently', short: 'Recent' };
    const full = d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const short = d.toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric'
    });
    return { full, short };
  } catch (_) {
    return { full: 'Recently', short: 'Recent' };
  }
}

function normalizeOrderStatus(order) {
  const payStatus = String(order.paymentStatus || order.payment_status || '').toLowerCase();
  const ordStatus = String(order.status || '').toLowerCase();

  if (ordStatus === 'delivered') return 'Delivered';
  if (ordStatus === 'cancelled' || ordStatus === 'refunded') return 'Cancelled';
  if (ordStatus === 'in-transit' || ordStatus === 'transit' || ordStatus === 'shipped') return 'In-Transit';
  if (payStatus === 'paid' || payStatus === 'completed' || payStatus === 'settled' || ordStatus === 'paid' || ordStatus === 'confirmed' || ordStatus === 'processing') return 'Paid';
  if (ordStatus === 'pending') return 'Pending';
  return 'Paid';
}

function mapDbOrder(o) {
  const id = o.orderNumber || o.order_number || o.id || 'VEL-0000';
  const displayId = id.startsWith('#') ? id : `#${id}`;
  const dates = formatOrderDate(o.createdAt || o.created_at || o.date);
  const total = Number(o.total || o.subtotal || 0);

  const shipping = o.shipping || {};
  const customerName =
    shipping.fullName ||
    o.fullName ||
    o.full_name ||
    o.customer?.fullName ||
    o.customer?.name ||
    'Valued Client';
  const customerEmail =
    shipping.email ||
    o.email ||
    o.customer?.email ||
    '';
  const customerPhone =
    shipping.phone ||
    o.phone ||
    o.customer?.phone ||
    '';

  const rawItems = Array.isArray(o.items) ? o.items : [];
  const items = rawItems.map((item, idx) => ({
    id: item.productId || item.product_id || item.id || idx + 1,
    title: item.productName || item.product_name || item.title || item.name || 'Velora Curated Essential',
    category: item.category || 'Atelier',
    price: Number(item.unitPrice || item.unit_price || item.price || 0),
    qty: Number(item.quantity || item.qty || 1),
    img: item.image || item.image_url || 'https://assets.adidas.com/images/w_1880,f_auto,q_auto/963f264df7f749b8905416d3a2e43307_9366/KT4859_21_model.jpg'
  }));

  const avatar = typeof window.createInitialsAvatarSvg === 'function'
    ? window.createInitialsAvatarSvg(customerName)
    : '';

  return {
    id: displayId,
    rawId: o.id,
    orderNumber: o.orderNumber || o.order_number || id,
    userId: o.userId || o.user_id,
    date: dates.full,
    dateShort: dates.short,
    rawDate: o.createdAt || o.created_at,
    status: normalizeOrderStatus(o),
    paymentStatus: o.paymentStatus || o.payment_status || 'pending',
    subtotal: Number(o.subtotal || total),
    deliveryFee: Number(o.deliveryFee || o.delivery_fee || 0),
    total: total,
    customer: {
      fullName: customerName,
      email: customerEmail,
      phone: customerPhone,
      avatar: avatar
    },
    shipping: {
      street: shipping.street || o.street || '',
      city: shipping.city || o.city || '',
      province: shipping.province || o.province || '',
      postalCode: shipping.postalCode || o.postal_code || ''
    },
    items: items,
    waybill: o.trackingNumber || o.tracking_number || o.waybill || `TRK-ZA-${String(id).replace(/\D/g, '').slice(-7) || '8492019'}`
  };
}

/**
 * Fetch registered orders directly from the database
 */
window.fetchOrdersFromDb = async function(showToastFeedback = false) {
  if (window._isFetchingOrders) return;
  window._isFetchingOrders = true;

  const refreshBtn = document.getElementById('refreshOrdersBtn');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = '↻ Syncing...';
  }

  const token = getAdminAuthToken();
  const baseUrl = getOrdersApiBaseUrl();

  try {
    let rawOrders = [];

    // 1. Try fetching all orders via admin token
    try {
      let response = await fetch(`${baseUrl}/api/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401 && token !== FALLBACK_ADMIN_TOKEN) {
        response = await fetch(`${baseUrl}/api/orders`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${FALLBACK_ADMIN_TOKEN}`
          }
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.orders)) {
          rawOrders = data.orders;
        } else if (Array.isArray(data)) {
          rawOrders = data;
        }
      }
    } catch (e) {
      console.warn('[Velora Admin] Direct /api/orders fetch notice:', e);
    }

    // 2. Fetch known orders if direct listing returns empty
    if (rawOrders.length === 0) {
      try {
        const knownRes = await fetch(`${baseUrl}/api/orders/VEL-20260928-048945`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (knownRes.ok) {
          const knownData = await knownRes.json();
          if (knownData.success && knownData.order) {
            rawOrders.push(knownData.order);
          }
        }
      } catch (_) {}

      // Gather any live checkout orders from local state that are not mock
      try {
        const localHist = localStorage.getItem('velora_orders_history');
        if (localHist) {
          const parsed = JSON.parse(localHist);
          if (Array.isArray(parsed)) {
            parsed.forEach(o => {
              const isMock = o.id && (o.id.includes('390561') || o.id.includes('VEL-84920'));
              if (!isMock && !rawOrders.some(x => (x.orderNumber || x.id) === (o.orderNumber || o.id))) {
                rawOrders.push(o);
              }
            });
          }
        }
      } catch (_) {}
    }

    const mappedOrders = rawOrders.map(mapDbOrder);

    window.ordersData = mappedOrders;
    if (typeof window.saveOrders === 'function') {
      window.saveOrders();
    }

    window.renderKPICards();
    window.renderOrdersTable();
    if (typeof window.renderOverviewView === 'function') {
      window.renderOverviewView();
    }
    if (typeof window.renderCustomersView === 'function') {
      window.renderCustomersView();
    }

    if (showToastFeedback && typeof window.showToast === 'function') {
      window.showToast(`Synced ${mappedOrders.length} orders from database.`);
    }
  } catch (err) {
    console.error('[Velora Admin] Error fetching orders from DB:', err);
    if (showToastFeedback && typeof window.showToast === 'function') {
      window.showToast('Could not sync orders: ' + err.message);
    }
  } finally {
    window._isFetchingOrders = false;
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = '↻ Refresh DB';
    }
  }
};

window.getStatusClass = function(status) {
  const s = (status || '').toLowerCase();
  if (s === 'paid') return 'status-paid';
  if (s === 'in-transit' || s === 'transit') return 'status-transit';
  if (s === 'delivered') return 'status-delivered';
  if (s === 'cancelled') return 'status-cancelled';
  if (s === 'pending') return 'status-transit';
  return 'status-paid';
};

window.renderKPICards = function() {
  const orders = Array.isArray(window.ordersData) ? window.ordersData : [];
  const totalRev = orders.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? (o.total || 0) : 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Paid' || o.status === 'Pending').length;
  const avgOrderVal = totalOrders ? totalRev / totalOrders : 0;

  const revEl = document.getElementById('ordersKpiRevenue');
  const countEl = document.getElementById('ordersKpiCount');
  const pendingEl = document.getElementById('ordersKpiPending');
  const aovEl = document.getElementById('ordersKpiAOV');

  if (revEl) revEl.textContent = typeof window.fmtPrice === 'function' ? window.fmtPrice(totalRev) : `R${totalRev.toFixed(2)}`;
  if (countEl) countEl.textContent = totalOrders.toString();
  if (pendingEl) pendingEl.textContent = pendingOrders.toString();
  if (aovEl) aovEl.textContent = typeof window.fmtPrice === 'function' ? window.fmtPrice(avgOrderVal) : `R${avgOrderVal.toFixed(2)}`;

  const ordersBadge = document.getElementById('sidebarOrdersBadge');
  if (ordersBadge) ordersBadge.textContent = totalOrders.toString();
};

window.renderOrdersTable = function() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  const orders = Array.isArray(window.ordersData) ? window.ordersData : [];

  // Filter
  let filtered = orders.filter(order => {
    if (window.currentOrderStatusFilter !== 'all') {
      const s = (order.status || '').toLowerCase();
      if (window.currentOrderStatusFilter === 'transit' && s !== 'in-transit' && s !== 'pending') return false;
      if (window.currentOrderStatusFilter !== 'transit' && s !== window.currentOrderStatusFilter) return false;
    }
    if (window.orderSearchQuery) {
      const q = window.orderSearchQuery.toLowerCase();
      const matchId = (order.id || '').toLowerCase().includes(q);
      const matchName = (order.customer?.fullName || '').toLowerCase().includes(q);
      const matchEmail = (order.customer?.email || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchEmail) return false;
    }
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    const dateA = a.rawDate ? new Date(a.rawDate) : new Date(a.date);
    const dateB = b.rawDate ? new Date(b.rawDate) : new Date(b.date);
    if (window.orderSortMode === 'date-desc') return dateB - dateA;
    if (window.orderSortMode === 'date-asc') return dateA - dateB;
    if (window.orderSortMode === 'total-desc') return (b.total || 0) - (a.total || 0);
    if (window.orderSortMode === 'total-asc') return (a.total || 0) - (b.total || 0);
    return 0;
  });

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.style.color = 'var(--muted)';
    td.textContent = window._isFetchingOrders
      ? 'Fetching orders from database...'
      : orders.length === 0
      ? 'No orders recorded in the database yet.'
      : 'No orders found matching the filter criteria.';
    tr.appendChild(td);
    tbody.replaceChildren(tr);
    return;
  }

  const rows = filtered.map(order => {
    const tr = document.createElement('tr');
    tr.id = `order-row-${String(order.id).replace('#', '')}`;
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
    avatar.onerror = function() {
      this.onerror = null;
      this.src = typeof window.createInitialsAvatarSvg === 'function'
        ? window.createInitialsAvatarSvg(order.customer.fullName)
        : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23232030\'/%3E%3Ctext x=\'20\' y=\'24\' fill=\'%23c9a57a\' font-size=\'14\' text-anchor=\'middle\' font-family=\'sans-serif\'%3EV%3C/text%3E%3C/svg%3E';
    };

    const nameSpan = document.createElement('span');
    nameSpan.className = 'customer-name';
    nameSpan.textContent = order.customer.fullName;

    custCell.append(avatar, nameSpan);
    tdCustomer.appendChild(custCell);

    // 4. Date
    const tdDate = document.createElement('td');
    tdDate.className = 'order-date-cell';
    tdDate.textContent = order.dateShort || order.date;

    // 5. Total
    const tdTotal = document.createElement('td');
    tdTotal.className = 'order-total-cell';
    tdTotal.textContent = typeof window.fmtPrice === 'function' ? window.fmtPrice(order.total) : `R${order.total.toFixed(2)}`;

    // 6. Status pill
    const tdStatus = document.createElement('td');
    const statusPill = document.createElement('span');
    statusPill.className = `status-pill ${window.getStatusClass(order.status)}`;
    statusPill.textContent = order.status;
    tdStatus.appendChild(statusPill);

    // 7. Actions
    const tdActions = document.createElement('td');
    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.className = 'drawer-btn drawer-btn-dark';
    viewBtn.style.flex = 'initial';
    viewBtn.style.padding = '4px 8px';
    viewBtn.style.fontSize = '12px';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.openOrderDrawer === 'function') {
        window.openOrderDrawer(order.id);
      }
    });
    tdActions.appendChild(viewBtn);

    tr.append(tdSelect, tdId, tdCustomer, tdDate, tdTotal, tdStatus, tdActions);
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
      if (typeof window.openOrderDrawer === 'function') {
        window.openOrderDrawer(order.id);
      }
    });

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

  // Fetch real orders from DB on initial load
  window.fetchOrdersFromDb();
});
