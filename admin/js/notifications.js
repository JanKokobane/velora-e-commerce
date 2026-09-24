window.currentNotifCategory = 'all';

const NOTIFICATIONS_API =
  'https://velora-e-commerce-qby7.onrender.com/api/notifications';

const getNotificationToken = () => {
  return localStorage.getItem('token');
};

const notificationRequest = async (url, options = {}) => {
  const token = getNotificationToken();

  if (!token) {
    throw new Error('Authentication token not found.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
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
    notification.category === 'orders'
  ) {
    return 'order';
  }

  if (
    notification.type === 'refund' ||
    notification.type === 'payment' ||
    notification.category === 'payment' ||
    notification.category === 'finance'
  ) {
    return 'refund';
  }

  return 'system';
};

const getNotificationIcon = (notification) => {
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
    notification.category === 'orders'
  ) {
    return '🛒';
  }

  if (
    notification.type === 'refund' ||
    notification.type === 'payment'
  ) {
    return '↶';
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
    actionTab: null,
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

window.fetchNotifications = async function() {
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

    window.notificationsData =
      notifications
        .map(normalizeNotification)
        .filter(notification => !notification.cleared);

    window.renderNotificationsView();

    return window.notificationsData;
  } catch (error) {
    console.error(
      'Fetch notifications error:',
      error
    );

    window.notificationsData = [];

    window.renderNotificationsView();

    window.showToast(
      error.message ||
      'Failed to load notifications.'
    );

    return [];
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

  const feedList =
    document.getElementById(
      'notificationsFeedList'
    );

  if (!feedList) {
    return;
  }

  let items = notifications;

  if (
    window.currentNotifCategory ===
    'unread'
  ) {
    items = items.filter(
      notification =>
        notification.unread
    );
  } else if (
    window.currentNotifCategory ===
    'order'
  ) {
    items = items.filter(
      notification =>
        notification.type === 'order'
    );
  } else if (
    window.currentNotifCategory ===
    'inventory'
  ) {
    items = items.filter(
      notification =>
        notification.type === 'stock'
    );
  } else if (
    window.currentNotifCategory ===
    'payment'
  ) {
    items = items.filter(
      notification =>
        notification.type === 'refund'
    );
  }

  if (items.length === 0) {
    const emptyState =
      document.createElement('div');

    emptyState.className =
      'notif-empty-state';

    const iconBox =
      document.createElement('div');

    iconBox.className =
      'notif-empty-icon';

    const svg =
      document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg'
      );

    svg.setAttribute(
      'width',
      '24'
    );

    svg.setAttribute(
      'height',
      '24'
    );

    svg.setAttribute(
      'viewBox',
      '0 0 24 24'
    );

    svg.setAttribute(
      'fill',
      'none'
    );

    svg.setAttribute(
      'stroke',
      'currentColor'
    );

    svg.setAttribute(
      'stroke-width',
      '2'
    );

    const path1 =
      document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );

    path1.setAttribute(
      'd',
      'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'
    );

    const path2 =
      document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );

    path2.setAttribute(
      'd',
      'M13.73 21a2 2 0 0 1-3.46 0'
    );

    svg.append(
      path1,
      path2
    );

    iconBox.appendChild(svg);

    const title =
      document.createElement('h4');

    title.className =
      'notif-empty-title';

    title.textContent =
      'No alerts in this category';

    const desc =
      document.createElement('p');

    desc.className =
      'notif-empty-desc';

    desc.textContent =
      'All operational updates and notices for this filter are currently clear.';

    emptyState.append(
      iconBox,
      title,
      desc
    );

    feedList.replaceChildren(
      emptyState
    );

    return;
  }

  const nodes = items.map(
    notification => {
      const card =
        document.createElement('div');

      card.className =
        `notif-card-item${
          notification.unread
            ? ' unread'
            : ''
        }`;

      const icon =
        document.createElement('div');

      icon.className =
        `notif-item-icon ${
          notification.type ||
          'system'
        }`;

      icon.textContent =
        notification.icon;

      const body =
        document.createElement('div');

      body.className =
        'notif-item-body';

      const headerRow =
        document.createElement('div');

      headerRow.className =
        'notif-item-header';

      const titleRow =
        document.createElement('div');

      titleRow.className =
        'notif-item-title-row';

      const title =
        document.createElement('h5');

      title.className =
        'notif-item-title';

      title.textContent =
        notification.title;

      const badge =
        document.createElement('span');

      badge.className =
        'notif-tag-badge';

      if (
        notification.type ===
        'order'
      ) {
        badge.textContent =
          'Order';
      } else if (
        notification.type ===
        'stock'
      ) {
        badge.textContent =
          'Inventory';
      } else if (
        notification.type ===
        'refund'
      ) {
        badge.textContent =
          'Finance';
      } else {
        badge.textContent =
          'System';
      }

      titleRow.append(
        title,
        badge
      );

      const time =
        document.createElement('span');

      time.className =
        'notif-item-time';

      time.textContent =
        notification.time;

      headerRow.append(
        titleRow,
        time
      );

      const desc =
        document.createElement('p');

      desc.className =
        'notif-item-desc';

      desc.textContent =
        notification.description;

      const actionsRow =
        document.createElement('div');

      actionsRow.className =
        'notif-item-actions';

      if (
        notification.actionUrl
      ) {
        const actionBtn =
          document.createElement('button');

        actionBtn.type =
          'button';

        actionBtn.className =
          'notif-action-cta';

        actionBtn.textContent =
          'View';

        actionBtn.addEventListener(
          'click',
          () => {
            window.handleNotificationAction(
              notification.id
            );
          }
        );

        actionsRow.appendChild(
          actionBtn
        );
      }

      if (
        notification.unread
      ) {
        const markReadBtn =
          document.createElement('button');

        markReadBtn.type =
          'button';

        markReadBtn.className =
          'notif-mark-read-cta';

        markReadBtn.textContent =
          'Mark as read';

        markReadBtn.addEventListener(
          'click',
          () => {
            window.markNotificationRead(
              notification.id
            );
          }
        );

        actionsRow.appendChild(
          markReadBtn
        );
      }

      body.append(
        headerRow,
        desc,
        actionsRow
      );

      const dismissBtn =
        document.createElement('button');

      dismissBtn.type =
        'button';

      dismissBtn.className =
        'notif-dismiss-btn';

      dismissBtn.title =
        'Remove notification';

      const dismissSvg =
        document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        );

      dismissSvg.setAttribute(
        'width',
        '14'
      );

      dismissSvg.setAttribute(
        'height',
        '14'
      );

      dismissSvg.setAttribute(
        'viewBox',
        '0 0 24 24'
      );

      dismissSvg.setAttribute(
        'fill',
        'none'
      );

      dismissSvg.setAttribute(
        'stroke',
        'currentColor'
      );

      dismissSvg.setAttribute(
        'stroke-width',
        '2'
      );

      const dLine1 =
        document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        );

      dLine1.setAttribute(
        'x1',
        '18'
      );

      dLine1.setAttribute(
        'y1',
        '6'
      );

      dLine1.setAttribute(
        'x2',
        '6'
      );

      dLine1.setAttribute(
        'y2',
        '18'
      );

      const dLine2 =
        document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        );

      dLine2.setAttribute(
        'x1',
        '6'
      );

      dLine2.setAttribute(
        'y1',
        '6'
      );

      dLine2.setAttribute(
        'x2',
        '18'
      );

      dLine2.setAttribute(
        'y2',
        '18'
      );

      dismissSvg.append(
        dLine1,
        dLine2
      );

      dismissBtn.appendChild(
        dismissSvg
      );

      dismissBtn.addEventListener(
        'click',
        () => {
          window.dismissNotification(
            notification.id
          );
        }
      );

      card.append(
        icon,
        body,
        dismissBtn
      );

      return card;
    }
  );

  feedList.replaceChildren(
    ...nodes
  );
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

    if (
      notification.actionUrl
    ) {
      window.location.href =
        notification.actionUrl;

      return;
    }

    if (
      notification.actionTab &&
      typeof window.switchTab ===
        'function'
    ) {
      window.switchTab(
        notification.actionTab
      );
    }
  };

window.markNotificationRead =
  async function(
    id,
    showToast = true
  ) {
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
    window.notificationsData = [];
    window.renderNotificationsView();
    window.fetchNotifications();
  }
);