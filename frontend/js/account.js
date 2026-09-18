import { getCurrentUser, setCurrentUser, getUserOrders, DEMO_USER, updateGlobalHeaderUser } from './auth.js';

export function initAccountPage() {
  const guestView = document.getElementById('accountGuestView');
  const dashboardView = document.getElementById('accountDashboardView');

  if (!guestView || !dashboardView) return;

  const currentUser = getCurrentUser();

  if (!currentUser) {
    guestView.style.display = 'grid';
    dashboardView.style.display = 'none';

    // Guest demo login button
    const demoBtn = document.getElementById('guestDemoLoginBtn');
    if (demoBtn) {
      demoBtn.onclick = () => {
        setCurrentUser(DEMO_USER);
        initAccountPage();
        updateGlobalHeaderUser();
      };
    }

    // Guest track form
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

  // User is logged in: show dashboard
  guestView.style.display = 'none';
  dashboardView.style.display = 'grid';

  // Populate sidebar profile information
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarFullName = document.getElementById('sidebarFullName');
  const sidebarEmail = document.getElementById('sidebarEmail');
  const sidebarMemberTier = document.getElementById('sidebarMemberTier');

  if (sidebarAvatar) {
    sidebarAvatar.textContent = currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'V';
  }
  if (sidebarFullName) {
    sidebarFullName.textContent = currentUser.fullName || 'Valued Client';
  }
  if (sidebarEmail) {
    sidebarEmail.textContent = currentUser.email || '';
  }
  if (sidebarMemberTier) {
    sidebarMemberTier.textContent = currentUser.memberTier || 'Velora Privilege Client';
  }

  // Populate sidebar address
  const addrName = document.getElementById('sidebarAddressName');
  const addrPhone = document.getElementById('sidebarAddressPhone');
  const addrStreet = document.getElementById('sidebarAddressStreet');
  const addrCity = document.getElementById('sidebarAddressCity');

  if (addrName) addrName.textContent = currentUser.fullName || 'Valued Client';
  if (addrPhone) addrPhone.textContent = currentUser.phone || '+27 82 492 8102';
  if (addrStreet) addrStreet.textContent = currentUser.street || '14 Kloof Street, Gardens';
  if (addrCity) addrCity.textContent = `${currentUser.city || 'Cape Town'}, ${currentUser.province || 'Western Cape'}`;

  // Populate form fields in profile tab
  const profFullName = document.getElementById('profFullName');
  const profEmail = document.getElementById('profEmail');
  const profPhone = document.getElementById('profPhone');
  const profStreet = document.getElementById('profStreet');
  const profCity = document.getElementById('profCity');
  const profProvince = document.getElementById('profProvince');

  if (profFullName) profFullName.value = currentUser.fullName || '';
  if (profEmail) profEmail.value = currentUser.email || '';
  if (profPhone) profPhone.value = currentUser.phone || '';
  if (profStreet) profStreet.value = currentUser.street || '';
  if (profCity) profCity.value = currentUser.city || '';
  if (profProvince) profProvince.value = currentUser.province || '';

  // Tab switching: Orders vs Profile
  const navOrdersTab = document.getElementById('navOrdersTab');
  const navProfileTab = document.getElementById('navProfileTab');
  const paneOrders = document.getElementById('paneOrders');
  const paneProfile = document.getElementById('paneProfile');

  if (navOrdersTab && navProfileTab && paneOrders && paneProfile) {
    navOrdersTab.onclick = () => {
      navOrdersTab.classList.add('active');
      navProfileTab.classList.remove('active');
      paneOrders.style.display = 'block';
      paneProfile.style.display = 'none';
    };

    navProfileTab.onclick = () => {
      navProfileTab.classList.add('active');
      navOrdersTab.classList.remove('active');
      paneProfile.style.display = 'block';
      paneOrders.style.display = 'none';
    };
  }

  // Handle Profile Form Submit
  const updateProfileForm = document.getElementById('updateProfileForm');
  if (updateProfileForm) {
    updateProfileForm.onsubmit = (e) => {
      e.preventDefault();
      currentUser.fullName = profFullName ? profFullName.value.trim() : currentUser.fullName;
      currentUser.phone = profPhone ? profPhone.value.trim() : currentUser.phone;
      currentUser.street = profStreet ? profStreet.value.trim() : currentUser.street;
      currentUser.city = profCity ? profCity.value.trim() : currentUser.city;
      currentUser.province = profProvince ? profProvince.value.trim() : currentUser.province;

      setCurrentUser(currentUser);

      // Refresh sidebar labels
      if (sidebarFullName) sidebarFullName.textContent = currentUser.fullName;
      if (addrName) addrName.textContent = currentUser.fullName;
      if (addrPhone) addrPhone.textContent = currentUser.phone;
      if (addrStreet) addrStreet.textContent = currentUser.street;
      if (addrCity) addrCity.textContent = `${currentUser.city}, ${currentUser.province}`;

      const msg = document.getElementById('saveProfileMsg');
      if (msg) {
        msg.style.display = 'inline';
        setTimeout(() => {
          msg.style.display = 'none';
        }, 3000);
      }
    };
  }

  // Sign out button
  const signOutBtn = document.getElementById('dashboardSignOutBtn');
  if (signOutBtn) {
    signOutBtn.onclick = () => {
      setCurrentUser(null);
      window.location.href = 'auth.html';
    };
  }

  // Sidebar quick track form
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

  // Render Orders cleanly using <template> cloning without innerHTML
  renderOrders(currentUser.email);
}

function renderOrders(userEmail) {
  const container = document.getElementById('ordersListContainer');
  const emptyState = document.getElementById('ordersEmptyState');
  const cardTemplate = document.getElementById('orderCardTemplate');
  const itemRowTemplate = document.getElementById('orderItemRowTemplate');
  const badge = document.getElementById('navOrdersBadge');
  const summaryCount = document.getElementById('ordersSummaryCount');

  if (!container || !cardTemplate || !itemRowTemplate) return;

  const orders = getUserOrders(userEmail);

  if (badge) badge.textContent = String(orders.length);
  if (summaryCount) {
    summaryCount.textContent = `${orders.length} active parcel${orders.length === 1 ? '' : 's'}`;
  }

  // Clear existing items using replaceChildren
  container.replaceChildren();

  if (orders.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  orders.forEach((order) => {
    const cardClone = cardTemplate.content.cloneNode(true);

    const orderIdEl = cardClone.querySelector('.card-order-id');
    const orderDateEl = cardClone.querySelector('.card-order-date');
    const trackingEl = cardClone.querySelector('.card-order-tracking');
    const statusTextEl = cardClone.querySelector('.card-status-text');
    const courierEl = cardClone.querySelector('.card-courier-name');
    const estDeliveryEl = cardClone.querySelector('.card-est-delivery');
    const totalEl = cardClone.querySelector('.card-order-total');
    const trackBtnEl = cardClone.querySelector('.card-track-btn');
    const itemsListEl = cardClone.querySelector('.card-items-list');

    if (orderIdEl) orderIdEl.textContent = `#${order.id}`;
    if (orderDateEl) orderDateEl.textContent = order.date;
    if (trackingEl) trackingEl.textContent = order.trackingNumber || `TRK-ZA-${order.id}`;
    if (statusTextEl) statusTextEl.textContent = order.status;
    if (courierEl) courierEl.textContent = order.courier || 'Velora Express Courier';
    if (estDeliveryEl) estDeliveryEl.textContent = order.estimatedDelivery || 'In 2-3 Business Days';
    if (totalEl) totalEl.textContent = `R ${(order.total || 0).toLocaleString('en-ZA')}`;
    if (trackBtnEl) trackBtnEl.href = `orders.html?orderId=${encodeURIComponent(order.id)}`;

    if (itemsListEl && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const itemRowClone = itemRowTemplate.content.cloneNode(true);
        const thumb = itemRowClone.querySelector('.order-item-thumb');
        const title = itemRowClone.querySelector('.card-item-title');
        const meta = itemRowClone.querySelector('.card-item-meta');
        const price = itemRowClone.querySelector('.card-item-price');

        if (thumb) {
          thumb.src = item.image || '';
          thumb.alt = item.title || 'Product item';
        }
        if (title) title.textContent = item.title || 'Artisan item';
        if (meta) meta.textContent = `Qty: ${item.quantity || 1} • ${item.size || 'Standard'}`;
        if (price) price.textContent = `R ${(item.price || 0).toLocaleString('en-ZA')}`;

        itemsListEl.appendChild(itemRowClone);
      });
    }

    container.appendChild(cardClone);
  });
}

// Auto-run on DOMContentLoaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initAccountPage();
    updateGlobalHeaderUser();
  });
}
