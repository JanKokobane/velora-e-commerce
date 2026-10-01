window.currentNotifCategory = 'all';
const handledInventoryRefreshNotificationIds = new Set();

const NOTIFICATIONS_API = (() => {
  const baseUrl = window.VELORA_API_URL || window.VELORA_API_BASE_URL || 'https://velora-e-commerce-qby7.onrender.com';
  return `${baseUrl.replace(/\/+$/, '')}/api/notifications`;
})();

const isSeedNotification = (id) => String(id).startsWith('notif-seed-');
const isSeedNotificationFeed = () =>
  Array.isArray(window.notificationsData) &&
  window.notificationsData.length > 0 &&
  window.notificationsData.every(notification => isSeedNotification(notification.id));

const getNotificationToken = () => {
  if (
    window.adminAuthApi &&
    typeof window.adminAuthApi.getToken === 'function'
  ) {
    const token = window.adminAuthApi.getToken();
    if (token) return token;
  }

  return (
    localStorage.getItem('velora_admin_token') ||
    localStorage.getItem('admin_token') ||
    sessionStorage.getItem('velora_admin_token') ||
    sessionStorage.getItem('admin_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    ''
  );
};

const notificationRequest = async (url, options = {}) => {
  const token = getNotificationToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      `Notification request failed with status ${response.status}.`
    );
  }

  return data;
};

const getNotificationType = (notification) => {
  if (String(notification.type || '').startsWith('return_')) {
    return 'order';
  }

  if (
    notification.category === 'inventory' ||
    notification.type === 'product_created' ||
    notification.type === 'product_updated' ||
    notification.type === 'product_deleted'
  ) {
    return 'stock';
  }

  if (
    notification.type === 'order' ||
    notification.type === 'order_created' ||
    notification.category === 'orders'
  ) {
    return 'order';
  }

  if (
    notification.type === 'refund' ||
    notification.type === 'payment' ||
    notification.type === 'payment_received' ||
    notification.type === 'payment_settled' ||
    notification.category === 'payment' ||
    notification.category === 'payments' ||
    notification.category === 'finance'
  ) {
    return 'refund';
  }

  if (
    notification.type === 'user_registered' ||
    notification.type === 'customer' ||
    notification.category === 'customers' ||
    notification.category === 'users'
  ) {
    return 'customer';
  }

  return 'system';
};

const getNotificationIcon = (notification) => {
  if (String(notification.type || '').startsWith('return_')) {
    return '↶';
  }

  if (notification.type === 'product_out_of_stock') {
    return '⚠️';
  }

  if (notification.type === 'product_created') {
    return '➕';
  }

  if (notification.type === 'product_updated') {
    return '✏️';
  }

  if (notification.type === 'product_deleted') {
    return '🗑️';
  }

  if (
    notification.type === 'order' ||
    notification.type === 'order_created' ||
    notification.category === 'orders'
  ) {
    return '🛒';
  }

  if (
    notification.type === 'payment_received' ||
    notification.type === 'payment_settled' ||
    notification.category === 'payments'
  ) {
    return '💳';
  }

  if (
    notification.type === 'refund' ||
    notification.type === 'payment'
  ) {
    return '↶';
  }

  if (
    notification.type === 'user_registered' ||
    notification.category === 'customers' ||
    notification.category === 'users'
  ) {
    return '👤';
  }

  if (notification.category === 'inventory') {
    return '📦';
  }

  return '🔔';
};

const formatNotificationTime = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 0) {
    return date.toLocaleString();
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
};

const normalizeNotification = (notification) => {
  const type = getNotificationType(notification);

  return {
    id: notification.id,
    type,
    backendType: notification.type,
    icon: getNotificationIcon(notification),
    title: notification.title || 'Notification',
    description:
      notification.message ||
      notification.description ||
      '',
    time: formatNotificationTime(
      notification.created_at ||
      notification.createdAt ||
      notification.timestamp
    ),
    unread:
      notification.is_read === false ||
      notification.isRead === false,
    cleared:
      notification.is_cleared === true ||
      notification.isCleared === true,
    actionUrl:
      notification.action_url ||
      notification.actionUrl ||
      null,
    actionTab:
      String(notification.type || '').startsWith('return_')
        ? 'returns'
        : type === 'order'
        ? 'orders'
        : type === 'customer'
          ? 'customers'
          : type === 'refund'
            ? 'payments'
            : type === 'stock'
              ? 'inventory'
              : null,
    entityType:
      notification.entity_type ||
      notification.entityType ||
      null,
    entityId:
      notification.entity_id ||
      notification.entityId ||
      null
  };
};

const SEED_NOTIFICATIONS = [
  {
    id: 'notif-seed-1',
    type: 'order',
    backendType: 'order_created',
    icon: '🛒',
    title: 'Order Paid · #VEL-20260930-4EBD55',
    description: 'Jan Kokobane purchased 2 items totaling R2 598,00. Awaiting Limpopo regional driver assignment.',
    time: '30 Sept 2026, 14:44',
    unread: true,
    cleared: false,
    actionTab: 'orders',
    entityType: 'order',
    entityId: 'VEL-20260930-4EBD55'
  },
  {
    id: 'notif-seed-2',
    type: 'stock',
    backendType: 'product_out_of_stock',
    icon: '⚠️',
    title: 'Low Catalog Stock Warning',
    description: 'ADIDAS CARE BEARS SHORTS TEE SET is down to 2 units remaining at Sandton Central warehouse.',
    time: '30 Sept 2026, 13:10',
    unread: true,
    cleared: false,
    actionTab: 'inventory',
    entityType: 'product',
    entityId: 'PRD-102'
  },
  {
    id: 'notif-seed-3',
    type: 'refund',
    backendType: 'payment_settled',
    icon: '💳',
    title: 'Payment Confirmed · Instant EFT',
    description: 'Capitec Pay settlement of R2 598,00 verified for Order #VEL-20260930-4EBD55.',
    time: '30 Sept 2026, 14:45',
    unread: false,
    cleared: false,
    actionTab: 'payments',
    entityType: 'payment',
    entityId: 'PAY-CPT-4401'
  },
  {
    id: 'notif-seed-4',
    type: 'customer',
    backendType: 'user_registered',
    icon: '👤',
    title: 'VIP Client Registered',
    description: 'Jan Kokobane registered for Velora VIP Privilege with nationwide courier access.',
    time: '30 Sept 2026, 11:20',
    unread: false,
    cleared: false,
    actionTab: 'customers',
    entityType: 'user',
    entityId: 'USR-1049'
  },
  {
    id: 'notif-seed-5',
    type: 'system',
    backendType: 'system_alert',
    icon: '🚚',
    title: 'Courier Manifest Assigned',
    description: 'The Courier Guy scheduled for Limpopo & Gauteng hub dispatch at 16:00 SAST.',
    time: '30 Sept 2026, 09:30',
    unread: false,
    cleared: false,
    actionTab: 'drivers',
    entityType: 'driver',
    entityId: 'LOG-LP-01'
  }
];

window.fetchNotifications = async function() {
  if (!getNotificationToken()) {
    if (!Array.isArray(window.notificationsData) || window.notificationsData.length === 0) {
      window.notificationsData = [...SEED_NOTIFICATIONS];
    }
    window.renderNotificationsView();
    return window.notificationsData;
  }

  try {
    const data = await notificationRequest(
      NOTIFICATIONS_API
    );

    const notifications =
      Array.isArray(data)
        ? data
        : Array.isArray(data?.notifications)
          ? data.notifications
          : Array.isArray(data?.data)
            ? data.data
            : [];

    const normalized = notifications
      .map(normalizeNotification)
      .filter(notification => !notification.cleared);

    window.notificationsData = normalized;

    const newInventoryNotifications =
      window.notificationsData.filter(notification =>
        ['order_created', 'order_cancelled', 'product_out_of_stock'].includes(notification.backendType) &&
        !handledInventoryRefreshNotificationIds.has(String(notification.id))
      );

    newInventoryNotifications.forEach(notification => {
      handledInventoryRefreshNotificationIds.add(String(notification.id));
    });

    if (
      newInventoryNotifications.length > 0 &&
      typeof window.fetchProductsFromDatabase === 'function'
    ) {
      window.fetchProductsFromDatabase();
    }

    window.renderNotificationsView();

    return window.notificationsData;
  } catch (error) {
    console.error(
      'Fetch notifications error:',
      error
    );

    if (!Array.isArray(window.notificationsData) || window.notificationsData.length === 0) {
      window.notificationsData = [...SEED_NOTIFICATIONS];
    }

    window.renderNotificationsView();

    return window.notificationsData;
  }
};

window.updateNotificationBadges = function() {
  const notifications =
    Array.isArray(window.notificationsData)
      ? window.notificationsData
      : [];

  const unreadCount =
    notifications.filter(
      notification => notification.unread
    ).length;

  const badgeEls = [
    document.getElementById('headerNotificationCount'),
    document.getElementById('headerNotifBadge'),
    document.getElementById('sidebarNotificationBadge')
  ];

  badgeEls.forEach(el => {
    if (el) {
      el.textContent =
        unreadCount.toString();

      el.style.display =
        unreadCount > 0
          ? 'inline-block'
          : 'none';
    }
  });

  const unreadPill =
    document.getElementById(
      'notificationUnreadPill'
    );

  if (unreadPill) {
    unreadPill.textContent =
      `${unreadCount} New`;
  }
};

window.renderNotificationsView = function() {
  window.updateNotificationBadges();

  const notifications =
    Array.isArray(window.notificationsData)
      ? window.notificationsData
      : [];

  const totalCount =
    notifications.length;

  const unreadCount =
    notifications.filter(
      notification => notification.unread
    ).length;

  const actionableCount =
    notifications.filter(
      notification =>
        notification.actionUrl
    ).length;

  const kpiTotal =
    document.getElementById(
      'notifsKpiTotalCount'
    );

  if (kpiTotal) {
    kpiTotal.textContent =
      totalCount.toString();
  }

  const kpiUnread =
    document.getElementById(
      'notifsKpiUnreadCount'
    );

  if (kpiUnread) {
    kpiUnread.textContent =
      unreadCount.toString();
  }

  const kpiActionable =
    document.getElementById(
      'notifsKpiActionableCount'
    );

  if (kpiActionable) {
    kpiActionable.textContent =
      actionableCount.toString();
  }

  const countAllEl =
    document.getElementById(
      'pillCountAll'
    );

  if (countAllEl) {
    countAllEl.textContent =
      totalCount.toString();
  }

  const countUnreadEl =
    document.getElementById(
      'pillCountUnread'
    );

  if (countUnreadEl) {
    countUnreadEl.textContent =
      unreadCount.toString();
  }

  const countOrdersEl =
    document.getElementById(
      'pillCountOrders'
    );

  if (countOrdersEl) {
    countOrdersEl.textContent =
      notifications.filter(
        notification =>
          notification.type === 'order'
      ).length.toString();
  }

  const countInventoryEl =
    document.getElementById(
      'pillCountInventory'
    );

  if (countInventoryEl) {
    countInventoryEl.textContent =
      notifications.filter(
        notification =>
          notification.type === 'stock'
      ).length.toString();
  }

  const countPaymentEl =
    document.getElementById(
      'pillCountPayment'
    );

  if (countPaymentEl) {
    countPaymentEl.textContent =
      notifications.filter(
        notification =>
          notification.type === 'refund'
      ).length.toString();
  }

  const countCustomersEl =
    document.getElementById(
      'pillCountCustomers'
    );

  if (countCustomersEl) {
    countCustomersEl.textContent =
      notifications.filter(
        notification =>
          notification.type === 'customer'
      ).length.toString();
  }

  const tbody = document.getElementById('notificationsTableBody');
  const feedList = document.getElementById('notificationsFeedList');

  if (!tbody && !feedList) {
    return;
  }

  window.notificationSearchQuery = window.notificationSearchQuery || '';
  window.notificationStatusFilter = window.notificationStatusFilter || 'all';

  let items = notifications;

  if (window.currentNotifCategory === 'unread') {
    items = items.filter(notification => notification.unread);
  } else if (window.currentNotifCategory === 'order') {
    items = items.filter(notification => notification.type === 'order');
  } else if (window.currentNotifCategory === 'inventory') {
    items = items.filter(notification => notification.type === 'stock');
  } else if (window.currentNotifCategory === 'payment') {
    items = items.filter(notification => notification.type === 'refund');
  } else if (window.currentNotifCategory === 'customer') {
    items = items.filter(notification => notification.type === 'customer');
  }

  if (window.notificationStatusFilter === 'unread') {
    items = items.filter(n => n.unread);
  } else if (window.notificationStatusFilter === 'read') {
    items = items.filter(n => !n.unread);
  }

  if (window.notificationSearchQuery) {
    const q = window.notificationSearchQuery.toLowerCase().trim();
    items = items.filter(n =>
      String(n.title || '').toLowerCase().includes(q) ||
      String(n.description || n.desc || n.message || '').toLowerCase().includes(q) ||
      String(n.reference || n.orderId || n.productId || n.entityId || '').toLowerCase().includes(q)
    );
  }

  if (items.length === 0) {
    if (tbody) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.style.padding = '36px 20px';
      cell.style.textAlign = 'center';
      cell.style.color = 'var(--muted)';
      cell.textContent = 'No operational alerts matching the selected filter in this category.';
      row.appendChild(cell);
      tbody.replaceChildren(row);
    }
    if (feedList) {
      const emptyState = document.createElement('div');
      emptyState.className = 'notif-empty-state';
      emptyState.textContent = 'No operational alerts in this category.';
      feedList.replaceChildren(emptyState);
    }
    return;
  }

  if (tbody) {
    const rows = items.map(notification => {
      const tr = document.createElement('tr');
      if (notification.unread) {
        tr.classList.add('unread');
      }

      // 1. Category Badge
      const tdCategory = document.createElement('td');
      const badge = document.createElement('span');
      const catType = notification.type || 'system';
      badge.className = `notif-tag-badge ${catType}`;
      badge.textContent = catType === 'order' ? 'Order' :
                          catType === 'stock' ? 'Inventory' :
                          catType === 'refund' ? 'Finance' :
                          catType === 'customer' ? 'Customer' : 'System';
      tdCategory.appendChild(badge);

      // 2. Alert & Details
      const tdDetails = document.createElement('td');
      const detailsWrap = document.createElement('div');
      detailsWrap.style.display = 'flex';
      detailsWrap.style.alignItems = 'flex-start';
      detailsWrap.style.gap = '10px';

      const iconBubble = document.createElement('div');
      iconBubble.className = `notif-icon-bubble notif-icon-${catType}`;
      iconBubble.style.width = '28px';
      iconBubble.style.height = '28px';
      iconBubble.style.fontSize = '13px';
      iconBubble.style.borderRadius = '6px';
      iconBubble.style.flexShrink = '0';
      iconBubble.textContent = notification.icon || '🔔';

      const textWrap = document.createElement('div');
      textWrap.style.flex = '1';
      textWrap.style.minWidth = '0';

      const titleEl = document.createElement('div');
      titleEl.style.fontWeight = '700';
      titleEl.style.color = 'var(--ink)';
      titleEl.style.fontSize = '13px';
      titleEl.style.marginBottom = '2px';
      titleEl.textContent = notification.title;

      const descEl = document.createElement('div');
      descEl.style.fontSize = '12px';
      descEl.style.color = 'var(--muted)';
      descEl.style.lineHeight = '1.4';
      descEl.textContent = notification.description || '';

      textWrap.append(titleEl, descEl);
      detailsWrap.append(iconBubble, textWrap);
      tdDetails.appendChild(detailsWrap);

      // 3. Reference
      const tdRef = document.createElement('td');
      const refVal = notification.entityId || notification.reference || notification.orderId || notification.productId || (notification.title && notification.title.match(/VEL-[\w-]+/)?.[0]) || null;
      if (refVal) {
        const refPill = document.createElement('span');
        refPill.style.fontFamily = 'monospace, sans-serif';
        refPill.style.fontSize = '11.5px';
        refPill.style.fontWeight = '600';
        refPill.style.padding = '3px 8px';
        refPill.style.background = '#faf8f5';
        refPill.style.border = '1px solid var(--dash-border)';
        refPill.style.borderRadius = '5px';
        refPill.style.color = 'var(--ink)';
        refPill.textContent = refVal;
        if (String(refVal).startsWith('VEL-') || catType === 'order') {
          refPill.style.cursor = 'pointer';
          refPill.title = 'Click to view order details';
          refPill.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof window.selectAndOpenOrder === 'function') {
              window.selectAndOpenOrder(refVal);
            }
          });
        }
        tdRef.appendChild(refPill);
      } else {
        tdRef.textContent = '—';
        tdRef.style.color = 'var(--muted)';
        tdRef.style.fontSize = '12px';
      }

      // 4. Timestamp
      const tdTime = document.createElement('td');
      tdTime.style.fontSize = '12px';
      tdTime.style.color = 'var(--muted)';
      tdTime.style.whiteSpace = 'nowrap';
      tdTime.style.fontVariantNumeric = 'tabular-nums';
      tdTime.textContent = notification.time || 'Recently';

      // 5. Status
      const tdStatus = document.createElement('td');
      const statusPill = document.createElement('span');
      statusPill.className = `status-pill ${notification.unread ? 'status-cancelled' : 'status-paid'}`;
      statusPill.textContent = notification.unread ? 'Unread' : 'Read';
      tdStatus.appendChild(statusPill);

      // 6. Action
      const tdAction = document.createElement('td');
      tdAction.style.textAlign = 'right';
      tdAction.style.whiteSpace = 'nowrap';

      const actionWrap = document.createElement('div');
      actionWrap.style.display = 'inline-flex';
      actionWrap.style.alignItems = 'center';
      actionWrap.style.gap = '6px';
      actionWrap.style.justifyContent = 'flex-end';

      const viewBtn = document.createElement('button');
      viewBtn.type = 'button';
      viewBtn.className = 'drawer-btn drawer-btn-dark';
      viewBtn.style.padding = '4px 10px';
      viewBtn.style.fontSize = '11.5px';
      viewBtn.textContent = 'View';
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.handleNotificationAction(notification.id);
      });
      actionWrap.appendChild(viewBtn);

      if (notification.unread) {
        const readBtn = document.createElement('button');
        readBtn.type = 'button';
        readBtn.className = 'drawer-btn drawer-btn-outline';
        readBtn.style.padding = '4px 10px';
        readBtn.style.fontSize = '11.5px';
        readBtn.textContent = 'Read';
        readBtn.title = 'Mark as read';
        readBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.markNotificationRead(notification.id);
        });
        actionWrap.appendChild(readBtn);
      }

      const dismissBtn = document.createElement('button');
      dismissBtn.type = 'button';
      dismissBtn.className = 'action-dots-btn';
      dismissBtn.style.padding = '4px 7px';
      dismissBtn.title = 'Dismiss notification';
      dismissBtn.textContent = '✕';
      dismissBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dismissNotification(notification.id);
      });
      actionWrap.appendChild(dismissBtn);

      tdAction.appendChild(actionWrap);

      tr.append(tdCategory, tdDetails, tdRef, tdTime, tdStatus, tdAction);
      tr.addEventListener('click', () => {
        if (notification.unread) {
          window.markNotificationRead(notification.id, false);
        }
        window.handleNotificationAction(notification.id);
      });

      return tr;
    });

    tbody.replaceChildren(...rows);
  }
};

window.filterNotificationsCategory =
  function(cat) {
    window.currentNotifCategory =
      cat;

    const pills =
      document.querySelectorAll(
        '#notifCategoryFilterGroup .notif-pill'
      );

    pills.forEach(pill => {
      if (
        pill.getAttribute(
          'data-category'
        ) === cat
      ) {
        pill.classList.add(
          'active'
        );
      } else {
        pill.classList.remove(
          'active'
        );
      }
    });

    window.renderNotificationsView();
  };

window.handleNotificationAction =
  function(id) {
    const notification =
      window.notificationsData.find(
        item => item.id === id
      );

    if (!notification) {
      return;
    }

    if (
      notification.unread
    ) {
      window.markNotificationRead(
        id,
        false
      );
    }

    const orderRef = notification.entityId ||
      (notification.title && notification.title.match(/VEL-[\w-]+/)?.[0]) ||
      (notification.description && notification.description.match(/VEL-[\w-]+/)?.[0]);

    if ((notification.type === 'order' || notification.backendType === 'order_created' || String(notification.title).includes('Order')) && orderRef) {
      if (typeof window.switchTab === 'function') window.switchTab('orders');
      if (typeof window.selectAndOpenOrder === 'function') {
        setTimeout(() => window.selectAndOpenOrder(orderRef), 120);
        return;
      }
    }

    if (
      notification.actionTab &&
      typeof window.switchTab ===
        'function'
    ) {
      window.switchTab(
        notification.actionTab
      );
      return;
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

window.markNotificationRead =
  async function(
    id,
    showToast = true
  ) {
    if (isSeedNotification(id)) {
      const notification = window.notificationsData.find(item => item.id === id);
      if (notification) notification.unread = false;
      window.renderNotificationsView();
      if (showToast) window.showToast('Notification marked as read');
      return;
    }

    try {
      await notificationRequest(
        `${NOTIFICATIONS_API}/${id}/read`,
        {
          method: 'PUT'
        }
      );

      const notification =
        window.notificationsData.find(
          item => item.id === id
        );

      if (notification) {
        notification.unread = false;
      }

      window.renderNotificationsView();

      if (showToast) {
        window.showToast(
          'Notification marked as read'
        );
      }
    } catch (error) {
      console.error(
        'Mark notification read error:',
        error
      );

      window.showToast(
        error.message ||
        'Failed to mark notification as read.'
      );
    }
  };

window.dismissNotification =
  async function(id) {
    if (isSeedNotification(id)) {
      window.notificationsData = window.notificationsData.filter(notification => notification.id !== id);
      window.renderNotificationsView();
      window.showToast('Notification cleared');
      return;
    }

    try {
      await notificationRequest(
        `${NOTIFICATIONS_API}/${id}/clear`,
        {
          method: 'PUT'
        }
      );

      window.notificationsData =
        window.notificationsData.filter(
          notification =>
            notification.id !== id
        );

      window.renderNotificationsView();

      window.showToast(
        'Notification cleared'
      );
    } catch (error) {
      console.error(
        'Clear notification error:',
        error
      );

      window.showToast(
        error.message ||
        'Failed to clear notification.'
      );
    }
  };

window.markAllNotificationsRead =
  async function() {
    if (isSeedNotificationFeed()) {
      window.notificationsData.forEach(notification => {
        notification.unread = false;
      });
      window.renderNotificationsView();
      window.showToast('All notifications marked as read');
      return;
    }

    try {
      await notificationRequest(
        `${NOTIFICATIONS_API}/read-all`,
        {
          method: 'PUT'
        }
      );

      window.notificationsData.forEach(
        notification => {
          notification.unread = false;
        }
      );

      window.renderNotificationsView();

      window.showToast(
        'All notifications marked as read'
      );
    } catch (error) {
      console.error(
        'Mark all notifications read error:',
        error
      );

      window.showToast(
        error.message ||
        'Failed to mark all notifications as read.'
      );
    }
  };

window.clearAllNotifications =
  async function() {
    const notificationCount = Array.isArray(window.notificationsData)
      ? window.notificationsData.length
      : 0;
    if (notificationCount === 0) return;

    const confirmed = typeof window.showConfirmModal === 'function'
      ? await window.showConfirmModal({
          title: 'Clear all notifications?',
          subtitle: `${notificationCount} alert${notificationCount === 1 ? '' : 's'}`,
          message: 'This will remove all notifications from the admin feed. This action cannot be undone.',
          confirmText: 'Clear notifications',
          cancelText: 'Keep notifications',
          danger: true
        })
      : window.confirm(`Clear all ${notificationCount} notifications? This action cannot be undone.`);
    if (!confirmed) return;

    if (isSeedNotificationFeed()) {
      window.notificationsData = [];
      window.renderNotificationsView();
      window.showToast('All notification alerts cleared');
      return;
    }

    try {
      await notificationRequest(
        `${NOTIFICATIONS_API}/clear-all`,
        {
          method: 'PUT'
        }
      );

      window.notificationsData = [];

      window.renderNotificationsView();

      window.showToast(
        'All notification alerts cleared'
      );
    } catch (error) {
      console.error(
        'Clear all notifications error:',
        error
      );

      window.showToast(
        error.message ||
        'Failed to clear all notifications.'
      );
    }
  };

window.showToast =
  function(msg) {
    let container =
      document.getElementById(
        'veloraToastContainer'
      );

    if (!container) {
      container =
        document.createElement('div');

      container.id =
        'veloraToastContainer';

      container.className =
        'velora-toast-container';

      document.body.appendChild(
        container
      );
    }

    const toast =
      document.createElement('div');

    toast.className =
      'velora-toast';

    toast.style.cssText =
      'display: flex; align-items: center; gap: 8px; background: #18181b; color: #ffffff; padding: 12px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-top: 8px; z-index: 9999; animation: fadeIn 0.2s ease;';

    const dot =
      document.createElement('span');

    dot.style.cssText =
      'display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;';

    const text =
      document.createElement('span');

    text.textContent =
      msg;

    toast.append(
      dot,
      text
    );

    container.appendChild(
      toast
    );

    setTimeout(() => {
      toast.style.transition =
        'opacity 0.25s ease, transform 0.25s ease';

      toast.style.opacity = '0';

      toast.style.transform =
        'translateY(8px)';

      setTimeout(() => {
        if (
          toast.parentNode
        ) {
          toast.parentNode.removeChild(
            toast
          );
        }
      }, 250);
    }, 2800);
  };

document.addEventListener(
  'DOMContentLoaded',
  () => {
    const searchInput = document.getElementById('notificationSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        window.notificationSearchQuery = e.target.value;
        window.renderNotificationsView();
      });
    }

    const statusFilter = document.getElementById('notifStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        window.notificationStatusFilter = e.target.value;
        window.renderNotificationsView();
      });
    }

    window.notificationsData = Array.isArray(window.notificationsData) && window.notificationsData.length > 0
      ? window.notificationsData
      : [...SEED_NOTIFICATIONS];

    window.renderNotificationsView();
    window.fetchNotifications();
    window.setInterval(() => {
      if (document.visibilityState === 'visible' && getNotificationToken()) {
        window.fetchNotifications();
      }
    }, 30000);
  }
);

['veloraAdminLogin', 'veloraAdminSessionRestored'].forEach(eventName => {
  window.addEventListener(eventName, () => {
    window.fetchNotifications();
  });
});