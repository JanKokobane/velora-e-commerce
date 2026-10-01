import {
  getCurrentUser,
  fetchCurrentUser,
  logoutUser,
  updateGlobalHeaderUser
} from './auth.js';

// Base API URL configuration
function resolveBackendBaseUrl() {
  if (typeof window !== 'undefined' && window.VELORA_API_BASE_URL) {
    return window.VELORA_API_BASE_URL;
  }
  return 'https://velora-e-commerce-qby7.onrender.com';
}

const API_BASE_URL = resolveBackendBaseUrl();
const AUTH_TOKEN_KEY = 'velora_auth_token';
const CURRENT_USER_KEY = 'velora_current_user';
const SHIPPING_STORAGE_KEY = 'velora_shipping_details';
let accountNotificationRecords = [];
let accountNotificationOrderRecords = [];

/**
 * Format currency
 */
function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]+/g, '')) || 0;
  return `R ${num.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getEstimatedDelivery(order) {
  const start = new Date(order.driverAssignedAt || order.acceptedAt || order.createdAt || Date.now());
  if (Number.isNaN(start.getTime())) return 'Within 3 days of dispatch';
  start.setDate(start.getDate() + 3);
  return `By ${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

// ============================================================
// INITIALIZE ACCOUNT PAGE
// ============================================================
export async function initAccountPage() {
  const guestView = document.getElementById('accountGuestView');
  const dashboardView = document.getElementById('accountDashboardView');

  if (!guestView || !dashboardView) {
    return;
  }

  let currentUser = getCurrentUser();
  if (currentUser) {
    currentUser = await fetchCurrentUser() || getCurrentUser();
  }

  // ==========================================================
  // GUEST VIEW
  // ==========================================================
  if (!currentUser) {
    guestView.style.display = 'grid';
    dashboardView.style.display = 'none';

    const guestLoginBtn = document.getElementById('guestDemoLoginBtn');
    if (guestLoginBtn) {
      guestLoginBtn.onclick = () => {
        window.location.href = 'auth.html?return=account';
      };
    }

    const trackForm = document.getElementById('guestTrackForm');
    if (trackForm) {
      trackForm.onsubmit = (e) => {
        e.preventDefault();
        const input = document.getElementById('guestTrackInput');
        const code = input ? input.value.trim() : '';
        if (code) {
          window.location.href = `orders.html?orderId=${encodeURIComponent(code)}`;
        }
      };
    }

    return;
  }

  // ==========================================================
  // LOGGED IN DASHBOARD VIEW
  // ==========================================================
  guestView.style.display = 'none';
  dashboardView.style.display = 'grid';

  // Populate Sidebar
  updateSidebarProfile(currentUser);

  // Pre-fill Profile & Delivery Address Form
  populateProfileForm(currentUser);

  // Tab Switching
  setupTabs();
  setupAccountNotificationControls();

  // Profile Form Submission (PUT /api/users/:id)
  setupProfileForm(currentUser);
  setupDeleteProfile(currentUser);

  // Sign Out Handler
  const signOutBtn = document.getElementById('dashboardSignOutBtn');
  if (signOutBtn) {
    signOutBtn.onclick = () => {
      logoutUser();
      window.location.href = 'auth.html';
    };
  }

  // Sidebar Quick Track
  const sidebarTrackForm = document.getElementById('sidebarQuickTrackForm');
  if (sidebarTrackForm) {
    sidebarTrackForm.onsubmit = (e) => {
      e.preventDefault();
      const input = document.getElementById('sidebarQuickTrackInput');
      const val = input ? input.value.trim() : '';
      if (val) {
        window.location.href = `orders.html?orderId=${encodeURIComponent(val)}`;
      }
    };
  }

  // Fetch and display orders from backend and local cache
  loadAndRenderOrders(currentUser);
  if (window._accountOrderRefreshTimer) window.clearInterval(window._accountOrderRefreshTimer);
  window._accountOrderRefreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadAndRenderOrders(currentUser, { silent: true });
    }
  }, 5 * 60 * 1000);
  if (window._accountNotificationRefreshTimer) window.clearInterval(window._accountNotificationRefreshTimer);
  window._accountNotificationRefreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') refreshAccountNotifications();
  }, 30 * 1000);
}

// ============================================================
// UPDATE SIDEBAR UI
// ============================================================
function updateSidebarProfile(user) {
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarFullName = document.getElementById('sidebarFullName');
  const sidebarEmail = document.getElementById('sidebarEmail');
  const sidebarMemberTier = document.getElementById('sidebarMemberTier');

  const addrName = document.getElementById('sidebarAddressName');
  const addrPhone = document.getElementById('sidebarAddressPhone');
  const addrStreet = document.getElementById('sidebarAddressStreet');
  const addrCity = document.getElementById('sidebarAddressCity');

  if (sidebarAvatar) {
    sidebarAvatar.textContent = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'V';
  }
  if (sidebarFullName) {
    sidebarFullName.textContent = user.fullName || 'Valued Client';
  }
  if (sidebarEmail) {
    sidebarEmail.textContent = user.email || '';
  }
  if (sidebarMemberTier) {
    sidebarMemberTier.textContent = user.memberTier || 'Velora Privilege Client';
  }

  if (addrName) addrName.textContent = user.fullName || 'Valued Client';
  if (addrPhone) addrPhone.textContent = user.phone || 'Phone not set';
  if (addrStreet) addrStreet.textContent = user.street || 'Address not specified';
  if (addrCity) {
    const city = user.city || '';
    const province = user.province || '';
    addrCity.textContent = city && province ? `${city}, ${province}` : (city || province || 'South Africa');
  }
}

// ============================================================
// PRE-FILL PROFILE FORM
// ============================================================
function populateProfileForm(user) {
  const profFullName = document.getElementById('profFullName');
  const profEmail = document.getElementById('profEmail');
  const profPhone = document.getElementById('profPhone');
  const profStreet = document.getElementById('profStreet');
  const profCity = document.getElementById('profCity');
  const profProvince = document.getElementById('profProvince');

  // Also check if user has saved shipping details in localStorage
  let savedShipping = null;
  try {
    const raw = localStorage.getItem(SHIPPING_STORAGE_KEY);
    if (raw) savedShipping = JSON.parse(raw);
  } catch (_) {}

  if (profFullName) profFullName.value = user.fullName || savedShipping?.fullName || '';
  if (profEmail) {
    profEmail.value = user.email || '';
    profEmail.readOnly = false;
  }
  if (profPhone) profPhone.value = user.phone || savedShipping?.phone || '';
  if (profStreet) profStreet.value = user.street || savedShipping?.street || '';
  if (profCity) profCity.value = user.city || savedShipping?.city || '';
  if (profProvince) profProvince.value = user.province || savedShipping?.province || '';
}

// ============================================================
// TAB NAVIGATION
// ============================================================
function setupTabs() {
  const navOrdersTab = document.getElementById('navOrdersTab');
  const navNotificationsTab = document.getElementById('navNotificationsTab');
  const navProfileTab = document.getElementById('navProfileTab');
  const paneOrders = document.getElementById('paneOrders');
  const paneNotifications = document.getElementById('paneNotifications');
  const paneProfile = document.getElementById('paneProfile');

  const tabs = [
    { button: navOrdersTab, pane: paneOrders },
    { button: navNotificationsTab, pane: paneNotifications },
    { button: navProfileTab, pane: paneProfile }
  ].filter(tab => tab.button && tab.pane);
  if (tabs.length !== 3) return;

  const activateTab = (activeTab) => {
    tabs.forEach(tab => {
      const isActive = tab === activeTab;
      tab.button.classList.toggle('active', isActive);
      tab.pane.style.display = isActive ? 'block' : 'none';
    });
  };
  tabs.forEach(tab => {
    tab.button.onclick = () => activateTab(tab);
  });

  const requestedTab = window.location.hash === '#notifications'
    ? tabs[1]
    : ['#profile', '#address'].includes(window.location.hash)
      ? tabs[2]
      : tabs[0];
  activateTab(requestedTab);
}

function renderAccountNotifications(notifications, orders) {
  const container = document.getElementById('accountNotificationsList');
  if (!container) return;

  accountNotificationRecords = Array.isArray(notifications) ? notifications : [];
  accountNotificationOrderRecords = Array.isArray(orders) ? orders : [];
  const expandedNotificationIds = new Set(
    Array.from(container.querySelectorAll('.account-notification-card[open]'), card => card.dataset.notificationId).filter(Boolean)
  );
  const visibleNotifications = accountNotificationRecords
    .filter(notification => notification.is_cleared !== true)
    .sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0));
  const unreadCount = visibleNotifications.filter(notification => notification.is_read !== true).length;
  const badge = document.getElementById('navNotificationsBadge');
  if (badge) {
    badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    badge.hidden = unreadCount === 0;
    badge.setAttribute('aria-label', `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`);
  }
  const count = document.getElementById('accountNotificationCount');
  if (count) count.textContent = `${visibleNotifications.length} notification${visibleNotifications.length === 1 ? '' : 's'}`;
  const markAllBtn = document.getElementById('markAllUserNotificationsRead');
  if (markAllBtn) markAllBtn.disabled = unreadCount === 0;
  const clearAllBtn = document.getElementById('clearAllUserNotifications');
  if (clearAllBtn) clearAllBtn.disabled = visibleNotifications.length === 0;

  if (visibleNotifications.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'account-notifications-empty';
    emptyState.textContent = 'New order and return updates will appear here.';
    container.replaceChildren(emptyState);
    return;
  }

  const cards = visibleNotifications.map(notification => {
    const type = String(notification.type || '').toLowerCase();
    const isReturn = type.startsWith('return_');
    const details = type === 'return_pending'
      ? { title: 'Return request received', label: 'Under review' }
      : type === 'return_approved'
        ? { title: 'Return approved', label: 'Approved' }
        : type === 'return_refunded'
          ? { title: 'Return refunded', label: 'Refunded' }
          : type === 'return_rejected'
            ? { title: 'Return request update', label: 'Closed' }
            : { title: notification.title || 'Account update', label: 'Update' };
    const orderNumber = notification.order_number || (notification.entity_type === 'order' ? notification.entity_id : '');
    const matchingOrder = (Array.isArray(orders) ? orders : []).find(item =>
      String(item.orderNumber || item.order_number || item.id) === String(orderNumber)
    );
    const card = document.createElement('details');
    card.className = `account-notification-card${type === 'return_refunded' ? ' is-refunded' : ''}${notification.is_read === true ? '' : ' is-unread'}`;
    card.dataset.notificationId = String(notification.id);
    card.open = expandedNotificationIds.has(String(notification.id));

    const trigger = document.createElement('summary');
    trigger.className = 'account-notification-trigger';
    const icon = document.createElement('span');
    icon.className = 'account-notification-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = type === 'return_refunded' ? '↶' : isReturn ? '↻' : '•';

    const content = document.createElement('div');
    content.className = 'account-notification-content';
    const heading = document.createElement('div');
    heading.className = 'account-notification-heading';
    const title = document.createElement('h3');
    title.textContent = notification.title || details.title;
    const status = document.createElement('span');
    status.className = 'account-notification-status';
    status.textContent = details.label;
    heading.append(title, status);
    if (notification.is_read !== true) {
      const unreadDot = document.createElement('span');
      unreadDot.className = 'account-notification-unread-dot';
      unreadDot.setAttribute('aria-hidden', 'true');
      heading.prepend(unreadDot);
    }

    const orderReference = document.createElement('p');
    orderReference.className = 'account-notification-order';
    orderReference.textContent = orderNumber ? `Order ${orderNumber}` : '';
    const message = document.createElement('p');
    message.className = 'account-notification-reason';
    message.textContent = notification.message || '';
    content.append(heading);
    if (orderNumber) content.appendChild(orderReference);
    if (notification.message) content.appendChild(message);

    const time = document.createElement('time');
    time.className = 'account-notification-time';
    const timestamp = notification.created_at;
    if (timestamp) {
      const date = new Date(timestamp);
      if (!Number.isNaN(date.getTime())) {
        time.dateTime = date.toISOString();
        time.textContent = date.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
      }
    }
    const clock = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    clock.setAttribute('viewBox', '0 0 24 24');
    clock.setAttribute('aria-hidden', 'true');
    clock.classList.add('account-notification-clock');
    const clockFace = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    clockFace.setAttribute('cx', '12');
    clockFace.setAttribute('cy', '12');
    clockFace.setAttribute('r', '9');
    const clockHands = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    clockHands.setAttribute('d', 'M12 7v5l3 2');
    clock.append(clockFace, clockHands);
    time.prepend(clock);
    const chevron = document.createElement('span');
    chevron.className = 'account-notification-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '⌄';
    trigger.append(icon, content, time, chevron);

    const expanded = document.createElement('div');
    expanded.className = 'account-notification-expanded';
    if (matchingOrder) {
      const orderHeading = document.createElement('h4');
      orderHeading.className = 'account-notification-section-title';
      orderHeading.textContent = 'Order details';
      expanded.appendChild(orderHeading);

      const orderGrid = document.createElement('div');
      orderGrid.className = 'account-notification-order-grid';
      const addOrderField = (label, value) => {
        const field = document.createElement('div');
        field.className = 'account-notification-order-field';
        const fieldLabel = document.createElement('span');
        fieldLabel.textContent = label;
        const fieldValue = document.createElement('strong');
        fieldValue.textContent = value || 'Not recorded';
        field.append(fieldLabel, fieldValue);
        orderGrid.appendChild(field);
      };
      const placedOn = matchingOrder.createdAt || matchingOrder.created_at;
      const placedDate = placedOn && !Number.isNaN(new Date(placedOn).getTime())
        ? new Date(placedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Not recorded';
      const trackingNumber = matchingOrder.trackingNumber || matchingOrder.tracking_number || 'Not assigned';
      const paymentStatus = String(matchingOrder.paymentStatus || matchingOrder.payment_status || 'pending');
      const normalizedPaymentStatus = paymentStatus.toLowerCase();
      addOrderField('Order Reference', orderNumber);
      addOrderField('Placed On', placedDate);
      addOrderField('Tracking Number', trackingNumber);
      addOrderField('Payment Status', normalizedPaymentStatus === 'refunded'
        ? 'Refunded'
        : paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1));
      expanded.appendChild(orderGrid);

      const orderStatus = String(matchingOrder.status || '').toLowerCase();
      const deliveryState = document.createElement('p');
      deliveryState.className = 'account-notification-delivery-state';
      deliveryState.textContent = orderStatus === 'delivered' ? 'Delivered & Signed' : paymentStatus;
      expanded.appendChild(deliveryState);

      const items = Array.isArray(matchingOrder.items) ? matchingOrder.items : [];
      if (items.length > 0) {
        const itemsList = document.createElement('div');
        itemsList.className = 'account-notification-items';
        items.forEach(item => {
          const itemRow = document.createElement('div');
          itemRow.className = 'account-notification-item';
          const imageUrl = item.image || item.image_url;
          if (imageUrl) {
            const image = document.createElement('img');
            image.src = imageUrl;
            image.alt = item.productName || item.title || item.name || 'Order item';
            image.loading = 'lazy';
            itemRow.appendChild(image);
          }
          const itemInfo = document.createElement('div');
          itemInfo.className = 'account-notification-item-info';
          const itemName = document.createElement('strong');
          itemName.textContent = item.productName || item.title || item.name || 'Order item';
          const itemMeta = document.createElement('span');
          itemMeta.textContent = `Size: ${item.size || 'Standard'} • Qty: ${Number(item.quantity) || 1}`;
          const itemPrice = document.createElement('span');
          itemPrice.textContent = formatCurrency((Number(item.unitPrice || item.price) || 0) * (Number(item.quantity) || 1));
          itemInfo.append(itemName, itemMeta, itemPrice);
          itemRow.appendChild(itemInfo);
          itemsList.appendChild(itemRow);
        });
        expanded.appendChild(itemsList);
      }

      const courier = matchingOrder.driver?.fullName || matchingOrder.driver?.full_name || 'Not assigned';
      const currentLocation = matchingOrder.trackingLocation || matchingOrder.tracking_location ||
        [matchingOrder.shipping?.street || matchingOrder.street, matchingOrder.shipping?.city || matchingOrder.city]
          .filter(Boolean).join(', ') || 'Not recorded';
      const deliveryInfo = document.createElement('div');
      deliveryInfo.className = 'account-notification-delivery-info';
      [
        ['Courier Partner', courier],
        ['Current Location', currentLocation],
        ['Estimated Delivery', orderStatus === 'delivered' ? 'Delivered' : getEstimatedDelivery(matchingOrder)]
      ].forEach(([label, value]) => {
        const field = document.createElement('p');
        const fieldLabel = document.createElement('span');
        fieldLabel.textContent = `${label}: `;
        const fieldValue = document.createElement('strong');
        fieldValue.textContent = value;
        field.append(fieldLabel, fieldValue);
        deliveryInfo.appendChild(field);
      });
      expanded.appendChild(deliveryInfo);

      const milestones = [
        ['Order placed', matchingOrder.createdAt || matchingOrder.created_at],
        ['Accepted at logistics hub', matchingOrder.acceptedAt || matchingOrder.accepted_at],
        ['In transit', matchingOrder.driverAssignedAt || matchingOrder.driver_assigned_at],
        ['Delivered', orderStatus === 'delivered' ? matchingOrder.updatedAt || matchingOrder.updated_at : null]
      ];
      const milestoneList = document.createElement('ol');
      milestoneList.className = 'account-notification-milestones';
      milestones.forEach(([label, value]) => {
        const step = document.createElement('li');
        const stepLabel = document.createElement('strong');
        stepLabel.textContent = label;
        const stepTime = document.createElement('time');
        stepTime.textContent = value && !Number.isNaN(new Date(value).getTime())
          ? new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          : 'Awaiting update';
        step.append(stepLabel, stepTime);
        milestoneList.appendChild(step);
      });
      expanded.appendChild(milestoneList);

      const orderFooter = document.createElement('div');
      orderFooter.className = 'account-notification-order-footer';
      const total = document.createElement('strong');
      total.textContent = `Total: ${formatCurrency(Number(matchingOrder.total) || 0)}`;
      const trackLink = document.createElement('a');
      trackLink.href = `orders.html?orderId=${encodeURIComponent(orderNumber)}`;
      trackLink.className = 'order-btn-outline';
      trackLink.textContent = 'Track in Velora Logistics ↗';
      orderFooter.append(total, trackLink);
      expanded.appendChild(orderFooter);
    } else {
      const missingOrder = document.createElement('p');
      missingOrder.className = 'account-notification-reason';
      missingOrder.textContent = notification.message || 'Order details are currently unavailable.';
      expanded.appendChild(missingOrder);
    }

    const actions = document.createElement('div');
    actions.className = 'account-notification-actions';
    if (notification.is_read !== true) {
      const readBtn = document.createElement('button');
      readBtn.type = 'button';
      readBtn.className = 'account-notification-read-action';
      readBtn.textContent = 'Mark as read';
      readBtn.addEventListener('click', event => {
        event.stopPropagation();
        markAccountNotificationRead(notification.id);
      });
      actions.appendChild(readBtn);
    }
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'account-notification-clear-action';
    clearBtn.textContent = 'Clear notification';
    clearBtn.addEventListener('click', event => {
      event.stopPropagation();
      clearAccountNotification(notification.id);
    });
    actions.appendChild(clearBtn);
    expanded.appendChild(actions);

    card.addEventListener('toggle', () => {
      if (card.open && notification.is_read !== true) {
        markAccountNotificationRead(notification.id);
      }
    });

    card.append(trigger, expanded);
    return card;
  });
  container.replaceChildren(...cards);
}

async function accountNotificationRequest(path) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}/api/notifications/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `Notification request failed (${response.status}).`);
  return data;
}

async function refreshAccountNotifications() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token || window._accountNotificationFetchInProgress) return;
  window._accountNotificationFetchInProgress = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `Unable to load notifications (${response.status}).`);
    renderAccountNotifications(Array.isArray(data?.notifications) ? data.notifications : [], accountNotificationOrderRecords);
  } catch (error) {
    console.warn('Unable to refresh account notifications:', error);
  } finally {
    window._accountNotificationFetchInProgress = false;
  }
}

function setAccountNotificationFeedback(message = '') {
  const feedback = document.getElementById('accountNotificationFeedback');
  if (feedback) feedback.textContent = message;
}

async function markAccountNotificationRead(id) {
  const notification = accountNotificationRecords.find(item => String(item.id) === String(id));
  if (!notification || notification.is_read === true || notification.readPending) return;
  notification.readPending = true;
  try {
    await accountNotificationRequest(`mine/${encodeURIComponent(id)}/read`);
    notification.is_read = true;
    notification.readPending = false;
    setAccountNotificationFeedback('Notification marked as read.');
    renderAccountNotifications(accountNotificationRecords, accountNotificationOrderRecords);
  } catch (error) {
    notification.readPending = false;
    setAccountNotificationFeedback(error.message || 'Unable to mark notification as read.');
  }
}

async function clearAccountNotification(id) {
  try {
    await accountNotificationRequest(`mine/${encodeURIComponent(id)}/clear`);
    accountNotificationRecords = accountNotificationRecords.filter(item => String(item.id) !== String(id));
    setAccountNotificationFeedback('Notification cleared.');
    renderAccountNotifications(accountNotificationRecords, accountNotificationOrderRecords);
  } catch (error) {
    setAccountNotificationFeedback(error.message || 'Unable to clear notification.');
  }
}

function setupAccountNotificationControls() {
  const markAllBtn = document.getElementById('markAllUserNotificationsRead');
  if (markAllBtn) {
    markAllBtn.onclick = async () => {
      markAllBtn.disabled = true;
      try {
        await accountNotificationRequest('mine/read-all');
        accountNotificationRecords.forEach(notification => {
          notification.is_read = true;
        });
        setAccountNotificationFeedback('All notifications marked as read.');
        renderAccountNotifications(accountNotificationRecords, accountNotificationOrderRecords);
      } catch (error) {
        setAccountNotificationFeedback(error.message || 'Unable to mark notifications as read.');
        renderAccountNotifications(accountNotificationRecords, accountNotificationOrderRecords);
      }
    };
  }

  const clearAllBtn = document.getElementById('clearAllUserNotifications');
  if (clearAllBtn) {
    clearAllBtn.onclick = async () => {
      if (accountNotificationRecords.length === 0 || !window.confirm('Clear all notifications? This cannot be undone.')) return;
      clearAllBtn.disabled = true;
      try {
        await accountNotificationRequest('mine/clear-all');
        accountNotificationRecords = [];
        setAccountNotificationFeedback('All notifications cleared.');
        renderAccountNotifications(accountNotificationRecords, accountNotificationOrderRecords);
      } catch (error) {
        setAccountNotificationFeedback(error.message || 'Unable to clear notifications.');
        renderAccountNotifications(accountNotificationRecords, accountNotificationOrderRecords);
      }
    };
  }
}

// ============================================================
// PROFILE FORM SUBMISSION (PUT /api/users/:id)
// ============================================================
function setupProfileForm(currentUser) {
  const form = document.getElementById('updateProfileForm');
  if (!form) return;

  const profFullName = document.getElementById('profFullName');
  const profEmail = document.getElementById('profEmail');
  const profPhone = document.getElementById('profPhone');
  const profStreet = document.getElementById('profStreet');
  const profCity = document.getElementById('profCity');
  const profProvince = document.getElementById('profProvince');
  const msgEl = document.getElementById('saveProfileMsg');

  form.onsubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      window.location.href = 'auth.html?return=account';
      return;
    }

    const userId = currentUser.id;
    if (!userId) {
      alert('Your account session is missing user identifier. Please sign in again.');
      window.location.href = 'auth.html?return=account';
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Save Delivery Details';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving Changes...';
      submitBtn.style.opacity = '0.8';
    }

    const updatedData = {
      fullName: profFullName ? profFullName.value.trim() : currentUser.fullName,
      email: profEmail ? profEmail.value.trim() : currentUser.email,
      phone: profPhone ? profPhone.value.trim() : currentUser.phone,
      street: profStreet ? profStreet.value.trim() : currentUser.street,
      city: profCity ? profCity.value.trim() : currentUser.city,
      province: profProvince ? profProvince.value.trim() : currentUser.province
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || data?.error || `Profile update failed (Status: ${response.status})`);
      }

      // Merge updated user data into cached object
      const serverUser = data?.user || data?.data?.user || data?.data;
      if (serverUser) {
        currentUser.fullName = serverUser.fullName || serverUser.full_name || updatedData.fullName;
        currentUser.email = serverUser.email || updatedData.email;
        currentUser.phone = serverUser.phone || updatedData.phone;
        currentUser.street = serverUser.street || updatedData.street;
        currentUser.city = serverUser.city || updatedData.city;
        currentUser.province = serverUser.province || updatedData.province;
      } else {
        currentUser.fullName = updatedData.fullName;
        currentUser.email = updatedData.email;
        currentUser.phone = updatedData.phone;
        currentUser.street = updatedData.street;
        currentUser.city = updatedData.city;
        currentUser.province = updatedData.province;
      }

      // Save to localStorage
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));

      // Also sync shipping details cache for checkout
      try {
        const shippingDetails = {
          fullName: currentUser.fullName,
          email: currentUser.email,
          phone: currentUser.phone,
          street: currentUser.street,
          city: currentUser.city,
          province: currentUser.province,
          postalCode: '8001'
        };
        localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(shippingDetails));
      } catch (_) {}

      // Update UI components
      updateSidebarProfile(currentUser);
      updateGlobalHeaderUser();

      // Feedback message
      if (msgEl) {
        msgEl.textContent = '✓ Profile & delivery details saved successfully.';
        msgEl.style.color = '#1e6b37';
        msgEl.style.display = 'inline';
        setTimeout(() => {
          msgEl.style.display = 'none';
        }, 4000);
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      if (msgEl) {
        msgEl.textContent = err.message || 'Unable to update profile. Please try again.';
        msgEl.style.color = '#b33a3a';
        msgEl.style.display = 'inline';
        setTimeout(() => {
          msgEl.style.display = 'none';
        }, 5000);
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        submitBtn.style.opacity = '1';
      }
    }
  };
}

function setupDeleteProfile(currentUser) {
  const deleteBtn = document.getElementById('deleteProfileBtn');
  const dialog = document.getElementById('deleteProfileDialog');
  const cancelBtn = document.getElementById('cancelDeleteProfileBtn');
  const confirmBtn = document.getElementById('confirmDeleteProfileBtn');
  const errorEl = document.getElementById('deleteProfileError');

  if (!deleteBtn || !dialog || !confirmBtn) return;

  deleteBtn.addEventListener('click', () => {
    if (errorEl) errorEl.textContent = '';
    dialog.showModal();
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => dialog.close());
  }

  confirmBtn.addEventListener('click', async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token || !currentUser.id) {
      if (errorEl) errorEl.textContent = 'Your session expired. Sign in again and retry.';
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(currentUser.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `Profile deletion failed (${response.status}).`);
      }

      localStorage.removeItem(SHIPPING_STORAGE_KEY);
      logoutUser();
      window.location.href = 'auth.html';
    } catch (error) {
      if (errorEl) errorEl.textContent = error.message || 'Unable to delete your profile.';
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete Profile';
    }
  });
}

// ============================================================
// FETCH & RENDER ORDERS (BACKEND & LOCAL CACHE)
// ============================================================
async function loadAndRenderOrders(currentUser, { silent = false } = {}) {
  const container = document.getElementById('ordersListContainer');
  const emptyState = document.getElementById('ordersEmptyState');
  const cardTemplate = document.getElementById('orderCardTemplate');
  const itemRowTemplate = document.getElementById('orderItemRowTemplate');
  const badge = document.getElementById('navOrdersBadge');
  const summaryCount = document.getElementById('ordersSummaryCount');

  if (!container || !cardTemplate || !itemRowTemplate) return;
  const expandedOrderIds = new Set(
    Array.from(container.querySelectorAll('.order-card[open]'), card => card.dataset.orderId).filter(Boolean)
  );

  if (window._accountOrdersFetchInProgress) return;
  window._accountOrdersFetchInProgress = true;

  // Show loading state only for the initial user-requested load.
  if (!silent) container.innerHTML = `
    <div style="padding: 40px; text-align: center; color: var(--muted); font-size: 14px;">
      <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid var(--accent); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px;"></div>
      <div>Loading your Velora orders & parcel updates...</div>
    </div>
  `;

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    window._accountOrdersFetchInProgress = false;
    window.location.href = 'auth.html?return=account';
    return;
  }

  let orders = [];
  let userReturns = [];
  let userNotifications = accountNotificationRecords;
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || `Unable to load orders (${response.status}).`);
    }
    orders = Array.isArray(data?.orders) ? data.orders : [];

    try {
      const returnsResponse = await fetch(`${API_BASE_URL}/api/returns/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const returnsData = await returnsResponse.json().catch(() => null);
      if (returnsResponse.ok && Array.isArray(returnsData?.returns)) {
        userReturns = returnsData.returns;
      }
    } catch (returnError) {
      console.warn('Unable to load your return requests:', returnError);
    }

    try {
      const notificationsResponse = await fetch(`${API_BASE_URL}/api/notifications/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notificationsData = await notificationsResponse.json().catch(() => null);
      if (notificationsResponse.ok && Array.isArray(notificationsData?.notifications)) {
        userNotifications = notificationsData.notifications;
      } else if (!notificationsResponse.ok) {
        throw new Error(notificationsData?.message || `Unable to load notifications (${notificationsResponse.status}).`);
      }
    } catch (notificationError) {
      console.warn('Unable to load account notifications:', notificationError);
    }
    renderAccountNotifications(userNotifications, orders);
  } catch (error) {
    console.error('Backend orders fetch failed:', error);
    if (!silent) {
      container.replaceChildren();
      const message = document.createElement('p');
      message.className = 'orders-load-error';
      message.textContent = error.message || 'Unable to load your orders. Please try again.';
      container.appendChild(message);
      if (badge) badge.textContent = '0';
      if (summaryCount) summaryCount.textContent = 'Orders unavailable';
    }
    window._accountOrdersFetchInProgress = false;
    return;
  }
  window._accountOrdersFetchInProgress = false;

  // 4. Update badge and counts
  if (badge) badge.textContent = String(orders.length);
  if (summaryCount) {
    summaryCount.textContent = `${orders.length} active parcel${orders.length === 1 ? '' : 's'}`;
  }

  // 5. Render Empty State if no orders exist
  container.replaceChildren();

  if (orders.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // 6. Render each Order Card
  orders.forEach((order) => {
    const cardClone = cardTemplate.content.cloneNode(true);

    const orderId = order.orderNumber || order.id || 'VEL-84920';
    const orderCard = cardClone.querySelector('.order-card');
    if (orderCard) {
      orderCard.dataset.orderId = String(orderId);
      orderCard.open = expandedOrderIds.has(String(orderId));
    }
    const trackingNumber = order.trackingNumber || 'Assigned after acceptance';
    const orderDateFormatted = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : (order.date || 'Recent');
    const estDelivery = String(order.status).toLowerCase() === 'delivered'
      ? 'Delivered'
      : getEstimatedDelivery(order);
    const totalAmount = Number(order.total) || 0;

    // Elements inside template
    const orderIdEl = cardClone.querySelector('.card-order-id');
    const orderDateEl = cardClone.querySelector('.card-order-date');
    const trackingEl = cardClone.querySelector('.card-order-tracking');
    const paymentStatusEl = cardClone.querySelector('.card-payment-status');
    const statusTextEl = cardClone.querySelector('.card-status-text');
    const statusBadgeEl = cardClone.querySelector('.order-status-badge');
    const courierEl = cardClone.querySelector('.card-courier-name');
    const trackingLocationEl = cardClone.querySelector('.card-tracking-location');
    const estDeliveryEl = cardClone.querySelector('.card-est-delivery');
    const totalEl = cardClone.querySelector('.card-order-total');
    const trackBtnEl = cardClone.querySelector('.card-track-btn');
    const cancelBtnEl = cardClone.querySelector('.card-cancel-btn');
    const returnBtnEl = cardClone.querySelector('.card-return-btn');
    const returnFormEl = cardClone.querySelector('.return-request-form');
    const returnReasonEl = cardClone.querySelector('.return-reason-input');
    const cancelReturnFormBtn = cardClone.querySelector('.cancel-return-form-btn');
    const submitReturnBtn = cardClone.querySelector('.submit-return-btn');
    const actionMessageEl = cardClone.querySelector('.card-order-action-message');
    const itemsListEl = cardClone.querySelector('.card-items-list');

    if (orderIdEl) orderIdEl.textContent = orderId;
    if (orderDateEl) orderDateEl.textContent = orderDateFormatted;
    if (trackingEl) trackingEl.textContent = trackingNumber;
    if (paymentStatusEl) {
      const paymentStatus = String(order.paymentStatus || 'pending').toLowerCase();
      paymentStatusEl.textContent = paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);
    }

    const normalizedStatus = String(order.status || 'pending').toLowerCase().replace(/_/g, '-');
    const stage = normalizedStatus === 'delivered'
      ? 3
      : ['in-transit', 'transit', 'shipped'].includes(normalizedStatus)
        ? 2
        : normalizedStatus === 'accepted'
          ? 1
          : 0;
    const statusText = normalizedStatus === 'delivered'
      ? 'Delivered & Signed'
      : stage === 2
        ? `In transit with ${order.driver?.fullName || order.driver?.full_name || 'Velora Courier'}`
        : stage === 1
          ? 'Accepted at Velora Logistics Hub'
          : order.paymentStatus === 'paid'
            ? 'Paid — awaiting dispatch acceptance'
            : 'Order received';
    if (statusTextEl) statusTextEl.textContent = statusText;
    if (statusBadgeEl) {
      statusBadgeEl.classList.toggle('delivered', normalizedStatus === 'delivered');
      statusBadgeEl.classList.toggle('in-transit', stage === 2);
    }

    if (courierEl) courierEl.textContent = order.driver?.fullName || order.driver?.full_name || 'Driver assigned after hub acceptance';
    if (trackingLocationEl) {
      trackingLocationEl.textContent = order.trackingLocation || (stage === 1
        ? 'Velora Logistics Hub, Airport Industria'
        : stage === 2
          ? 'Velora Logistics Hub, Airport Industria'
          : stage === 3
            ? `${order.shipping?.city || ''}, ${order.shipping?.province || ''}`.replace(/^, |, $/g, '')
            : 'Velora Fulfillment Centre');
    }
    if (estDeliveryEl) estDeliveryEl.textContent = estDelivery;
    if (totalEl) totalEl.textContent = formatCurrency(totalAmount);

    if (trackBtnEl) {
      trackBtnEl.href = `orders.html?orderId=${encodeURIComponent(orderId)}`;
      trackBtnEl.title = `Track parcel ${orderId} in Velora Logistics`;
    }

    if (cancelBtnEl) {
      cancelBtnEl.hidden = normalizedStatus !== 'pending';
      cancelBtnEl.addEventListener('click', async () => {
        if (!window.confirm(`Cancel order ${orderId}?`)) return;
        cancelBtnEl.disabled = true;
        try {
          await submitOrderAction(`/api/orders/${encodeURIComponent(orderId)}/cancel`, 'PATCH');
          await loadAndRenderOrders(currentUser);
        } catch (error) {
          if (actionMessageEl) actionMessageEl.textContent = error.message;
          cancelBtnEl.disabled = false;
        }
      });
    }

    const trackingSteps = Array.from(cardClone.querySelectorAll('.tracking-step'));
    const stepTitles = ['Order placed', 'Accepted at logistics hub', 'In transit', 'Delivered'];
    const stepLocations = [
      'Order confirmed',
      'Velora Logistics Hub, Airport Industria',
      'With assigned Velora driver',
      'Customer delivery address'
    ];
    const milestoneDates = [
      order.createdAt,
      order.acceptedAt || order.accepted_at,
      order.driverAssignedAt || order.driver_assigned_at,
      normalizedStatus === 'delivered' ? order.updatedAt || order.updated_at : null
    ];
    trackingSteps.forEach((step, index) => {
      step.classList.remove('completed', 'current', 'pending');
      step.classList.add(index < stage || normalizedStatus === 'delivered' ? 'completed' : index === stage ? 'current' : 'pending');
      const title = step.querySelector('.step-title');
      const time = step.querySelector('.step-time');
      if (title) title.textContent = stepTitles[index];
      if (time) time.textContent = index < stage || normalizedStatus === 'delivered'
        ? (milestoneDates[index] ? new Date(milestoneDates[index]).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : stepLocations[index])
        : index === stage
          ? (order.trackingLocation || stepLocations[index])
          : 'Awaiting update';
    });
    if (returnBtnEl) {
      const existingReturn = userReturns.find(item => item.order_number === orderId);
      const returnAlreadyFiled = existingReturn && existingReturn.status !== 'rejected';
      returnBtnEl.hidden = normalizedStatus !== 'delivered' || Boolean(returnAlreadyFiled);
      if (returnAlreadyFiled && actionMessageEl) {
        actionMessageEl.textContent = '';
      }
      returnBtnEl.addEventListener('click', () => {
        if (returnFormEl) returnFormEl.hidden = false;
        returnBtnEl.hidden = true;
        returnReasonEl?.focus();
      });
      cancelReturnFormBtn?.addEventListener('click', () => {
        if (returnFormEl) returnFormEl.hidden = true;
        returnBtnEl.hidden = false;
      });
      returnFormEl?.addEventListener('submit', async event => {
        event.preventDefault();
        const reason = String(returnReasonEl?.value || '').trim();
        if (reason.length < 3) {
          if (actionMessageEl) actionMessageEl.textContent = 'Please enter at least 3 characters.';
          return;
        }
        if (submitReturnBtn) submitReturnBtn.disabled = true;
        try {
          const result = await submitOrderAction(`/api/orders/${encodeURIComponent(orderId)}/returns`, 'POST', { reason });
          if (actionMessageEl) actionMessageEl.textContent = '';
          if (returnFormEl) returnFormEl.hidden = true;
          returnBtnEl.hidden = true;
          if (returnReasonEl) returnReasonEl.value = '';
          if (result?.returnRequest) userReturns.unshift(result.returnRequest);
        } catch (error) {
          if (actionMessageEl) actionMessageEl.textContent = error.message;
          if (returnFormEl) returnFormEl.hidden = false;
          returnBtnEl.hidden = true;
        } finally {
          if (submitReturnBtn) submitReturnBtn.disabled = false;
        }
      });
    }

    // Render Order Items
    const items = Array.isArray(order.items) ? order.items : [];
    if (itemsListEl && items.length > 0) {
      itemsListEl.replaceChildren();

      items.forEach((item) => {
        const itemRowClone = itemRowTemplate.content.cloneNode(true);
        const thumb = itemRowClone.querySelector('.order-item-thumb');
        const title = itemRowClone.querySelector('.card-item-title');
        const meta = itemRowClone.querySelector('.card-item-meta');
        const price = itemRowClone.querySelector('.card-item-price');

        const itemName = item.productName || item.title || item.name || 'Velora Curated Essential';
        const itemImage = item.image || item.image_url || 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
        const itemSize = item.size || 'Standard';
        const itemQty = Number(item.quantity) || 1;
        const itemPrice = Number(item.unitPrice || item.price) || 0;

        if (thumb) {
          thumb.src = itemImage;
          thumb.alt = itemName;
        }
        if (title) title.textContent = itemName;
        if (meta) meta.textContent = `Size: ${itemSize} • Qty: ${itemQty}`;
        if (price) price.textContent = formatCurrency(itemPrice * itemQty);

        itemsListEl.appendChild(itemRowClone);
      });
    }

    container.appendChild(cardClone);
  });
}

async function submitOrderAction(path, method, body) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status}).`);
  }
  return data;
}

// ============================================================
// AUTO-INITIALIZE ON DOM READY
// ============================================================
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initAccountPage();
    updateGlobalHeaderUser();
  });
}
