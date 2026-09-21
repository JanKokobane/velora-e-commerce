/**
 * Notification Center & Notifications Page Controller (js/notifications.js)
 * Pure DOM implementation with NO innerHTML.
 */

window.currentNotifCategory = 'all';

window.updateNotificationBadges = function() {
  const unreadCount = window.notificationsData.filter(n => n.unread).length;

  const badgeEls = [
    document.getElementById('headerNotificationCount'),
    document.getElementById('headerNotifBadge'),
    document.getElementById('sidebarNotificationBadge')
  ];

  badgeEls.forEach(el => {
    if (el) {
      el.textContent = unreadCount.toString();
      el.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
  });

  const unreadPill = document.getElementById('notificationUnreadPill');
  if (unreadPill) {
    unreadPill.textContent = `${unreadCount} New`;
  }
};

window.renderNotificationsView = function() {
  window.updateNotificationBadges();

  const totalCount = window.notificationsData.length;
  const unreadCount = window.notificationsData.filter(n => n.unread).length;
  const actionableCount = window.notificationsData.filter(n => n.actionTab).length;

  const kpiTotal = document.getElementById('notifsKpiTotalCount');
  if (kpiTotal) kpiTotal.textContent = totalCount.toString();

  const kpiUnread = document.getElementById('notifsKpiUnreadCount');
  if (kpiUnread) kpiUnread.textContent = unreadCount.toString();

  const kpiActionable = document.getElementById('notifsKpiActionableCount');
  if (kpiActionable) kpiActionable.textContent = actionableCount.toString();

  // Update pill counts
  const countAllEl = document.getElementById('pillCountAll');
  if (countAllEl) countAllEl.textContent = totalCount.toString();

  const countUnreadEl = document.getElementById('pillCountUnread');
  if (countUnreadEl) countUnreadEl.textContent = unreadCount.toString();

  const countOrdersEl = document.getElementById('pillCountOrders');
  if (countOrdersEl) {
    countOrdersEl.textContent = window.notificationsData.filter(n => n.type === 'order').length.toString();
  }

  const countInventoryEl = document.getElementById('pillCountInventory');
  if (countInventoryEl) {
    countInventoryEl.textContent = window.notificationsData.filter(n => n.type === 'stock').length.toString();
  }

  const countPaymentEl = document.getElementById('pillCountPayment');
  if (countPaymentEl) {
    countPaymentEl.textContent = window.notificationsData.filter(n => n.type === 'refund' || n.type === 'payment').length.toString();
  }

  // Render feed items
  const feedList = document.getElementById('notificationsFeedList');
  if (!feedList) return;

  let items = window.notificationsData;
  if (window.currentNotifCategory === 'unread') {
    items = items.filter(n => n.unread);
  } else if (window.currentNotifCategory === 'order') {
    items = items.filter(n => n.type === 'order');
  } else if (window.currentNotifCategory === 'inventory') {
    items = items.filter(n => n.type === 'stock');
  } else if (window.currentNotifCategory === 'payment') {
    items = items.filter(n => n.type === 'refund' || n.type === 'payment');
  }

  if (items.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'notif-empty-state';

    const iconBox = document.createElement('div');
    iconBox.className = 'notif-empty-icon';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9');
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M13.73 21a2 2 0 0 1-3.46 0');
    svg.append(path1, path2);
    iconBox.appendChild(svg);

    const title = document.createElement('h4');
    title.className = 'notif-empty-title';
    title.textContent = 'No alerts in this category';

    const desc = document.createElement('p');
    desc.className = 'notif-empty-desc';
    desc.textContent = 'All operational updates and notices for this filter are currently clear.';

    emptyState.append(iconBox, title, desc);
    feedList.replaceChildren(emptyState);
    return;
  }

  const nodes = items.map(n => {
    const card = document.createElement('div');
    card.className = `notif-card-item${n.unread ? ' unread' : ''}`;

    // Icon
    const icon = document.createElement('div');
    icon.className = `notif-item-icon ${n.type || 'system'}`;
    icon.textContent = n.icon || '🔔';

    // Body
    const body = document.createElement('div');
    body.className = 'notif-item-body';

    const headerRow = document.createElement('div');
    headerRow.className = 'notif-item-header';

    const titleRow = document.createElement('div');
    titleRow.className = 'notif-item-title-row';

    const title = document.createElement('h5');
    title.className = 'notif-item-title';
    title.textContent = n.title;

    const badge = document.createElement('span');
    badge.className = 'notif-tag-badge';
    badge.textContent = n.type === 'order' ? 'Order' : (n.type === 'stock' ? 'Inventory' : (n.type === 'refund' ? 'Returns' : 'System'));

    titleRow.append(title, badge);

    const time = document.createElement('span');
    time.className = 'notif-item-time';
    time.textContent = n.time;

    headerRow.append(titleRow, time);

    const desc = document.createElement('p');
    desc.className = 'notif-item-desc';
    desc.textContent = n.description;

    const actionsRow = document.createElement('div');
    actionsRow.className = 'notif-item-actions';

    if (n.actionTab) {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'notif-action-cta';
      actionBtn.textContent = n.actionTab === 'orders' ? 'View Order' : (n.actionTab === 'inventory' ? 'Inspect Stock' : 'Review Return');
      actionBtn.addEventListener('click', () => {
        window.handleNotificationAction(n.id);
      });
      actionsRow.appendChild(actionBtn);
    }

    if (n.unread) {
      const markReadBtn = document.createElement('button');
      markReadBtn.type = 'button';
      markReadBtn.className = 'notif-mark-read-cta';
      markReadBtn.textContent = 'Mark as read';
      markReadBtn.addEventListener('click', () => {
        n.unread = false;
        window.saveNotifications();
        window.renderNotificationsView();
      });
      actionsRow.appendChild(markReadBtn);
    }

    body.append(headerRow, desc, actionsRow);

    // Dismiss Button
    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'notif-dismiss-btn';
    dismissBtn.title = 'Remove notification';

    const dismissSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dismissSvg.setAttribute('width', '14');
    dismissSvg.setAttribute('height', '14');
    dismissSvg.setAttribute('viewBox', '0 0 24 24');
    dismissSvg.setAttribute('fill', 'none');
    dismissSvg.setAttribute('stroke', 'currentColor');
    dismissSvg.setAttribute('stroke-width', '2');

    const dLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    dLine1.setAttribute('x1', '18');
    dLine1.setAttribute('y1', '6');
    dLine1.setAttribute('x2', '6');
    dLine1.setAttribute('y2', '18');

    const dLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    dLine2.setAttribute('x1', '6');
    dLine2.setAttribute('y1', '6');
    dLine2.setAttribute('x2', '18');
    dLine2.setAttribute('y2', '18');

    dismissSvg.append(dLine1, dLine2);
    dismissBtn.appendChild(dismissSvg);

    dismissBtn.addEventListener('click', () => {
      window.dismissNotification(n.id);
    });

    card.append(icon, body, dismissBtn);
    return card;
  });

  feedList.replaceChildren(...nodes);
};

window.filterNotificationsCategory = function(cat) {
  window.currentNotifCategory = cat;

  const pills = document.querySelectorAll('#notifCategoryFilterGroup .notif-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-category') === cat) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  window.renderNotificationsView();
};

window.handleNotificationAction = function(id) {
  const notif = window.notificationsData.find(n => n.id === id);
  if (!notif) return;

  notif.unread = false;
  window.saveNotifications();
  window.updateNotificationBadges();

  if (notif.actionTab && typeof window.switchTab === 'function') {
    window.switchTab(notif.actionTab);
    if (notif.orderId && typeof window.selectAndOpenOrder === 'function') {
      setTimeout(() => {
        window.selectAndOpenOrder(notif.orderId);
      }, 100);
    }
  }
};

window.dismissNotification = function(id) {
  window.notificationsData = window.notificationsData.filter(n => n.id !== id);
  window.saveNotifications();
  window.renderNotificationsView();
};

window.markAllNotificationsRead = function() {
  window.notificationsData.forEach(n => { n.unread = false; });
  window.saveNotifications();
  window.renderNotificationsView();
  window.showToast('All notifications marked as read');
};

window.clearAllNotifications = function() {
  window.notificationsData = [];
  window.saveNotifications();
  window.renderNotificationsView();
  window.showToast('All notification alerts cleared');
};

window.showToast = function(msg) {
  let container = document.getElementById('veloraToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'veloraToastContainer';
    container.className = 'velora-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'velora-toast';
  toast.style.cssText = 'display: flex; align-items: center; gap: 8px; background: #18181b; color: #ffffff; padding: 12px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-top: 8px; z-index: 9999; animation: fadeIn 0.2s ease;';

  const dot = document.createElement('span');
  dot.style.cssText = 'display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;';

  const text = document.createElement('span');
  text.textContent = msg;

  toast.append(dot, text);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }, 2800);
};

document.addEventListener('DOMContentLoaded', () => {
  window.updateNotificationBadges();
});
