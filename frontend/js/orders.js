import { updateGlobalHeaderUser } from './auth.js';

function resolveBackendBaseUrl() {
  if (typeof window !== 'undefined' && window.VELORA_API_BASE_URL) {
    return window.VELORA_API_BASE_URL;
  }
  return 'https://velora-e-commerce-qby7.onrender.com';
}

const API_BASE_URL = resolveBackendBaseUrl();
let activeTrackingOrderId = null;
let trackingRefreshTimer = null;
let trackingRefreshInProgress = false;

// Convert a backend order into a parcel tracking model
function buildParcelFromOrder(o) {
  const orderId = o.orderNumber || o.id || 'Order';
  const customer = o.shipping || o.customer || {
    fullName: o.fullName || '',
    email: o.email || '',
    phone: o.phone || '',
    street: o.street || '',
    city: o.city || ''
  };

  const items = Array.isArray(o.items) ? o.items.map(item => ({
    title: item.productName || item.title || item.name || 'Velora Item',
    size: item.size || 'Standard',
    quantity: Number(item.quantity) || 1,
    price: Number(item.unitPrice || item.price) || 0,
    image: item.image || item.image_url || 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
  })) : [];

  const dateStr = o.createdAt
    ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : (o.date || 'Recent');

  const fullAddr = customer.street
    ? `${customer.street}, ${customer.city || ''}, ${customer.province || ''}`.replace(/,\s*,/g, ',').replace(/,$/, '')
    : (customer.address || '');

  const orderStatus = String(o.status || 'pending').toLowerCase();
  const statusLabels = {
    pending: 'Order Pending',
    processing: 'Processing',
    confirmed: 'Confirmed',
    accepted: 'Accepted at Velora Logistics Hub',
    shipped: 'Shipped',
    transit: 'In Transit',
    'in-transit': 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded'
  };
  const statusLabel = statusLabels[orderStatus] || String(o.status || 'Order Pending');
  const acceptedAt = o.acceptedAt || o.accepted_at;
  const driverAssignedAt = o.driverAssignedAt || o.driver_assigned_at;
  const deliveredAt = orderStatus === 'delivered' ? (o.updatedAt || o.updated_at) : null;
  const etaStart = new Date(driverAssignedAt || acceptedAt || o.createdAt || Date.now());
  etaStart.setDate(etaStart.getDate() + 3);
  const estimatedDelivery = acceptedAt
    ? `Within 3 days · by ${etaStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : 'Within 3 days after hub acceptance';
  const stageIndex = orderStatus === 'delivered'
    ? 3
    : ['in-transit', 'transit', 'shipped'].includes(orderStatus)
      ? 2
      : orderStatus === 'accepted'
        ? 1
        : 0;
  const trackingLocation = o.trackingLocation || (stageIndex === 1
    ? 'Velora Logistics Hub, Airport Industria'
    : stageIndex === 2
      ? 'Velora Logistics Hub, Airport Industria'
      : stageIndex === 3
        ? fullAddr
        : 'Velora Fulfillment Centre');
  const assignedDriver = o.driver || null;
  const milestones = [
    {
      title: 'Order Placed & Payment Confirmed',
      location: 'Velora Order System',
      time: o.createdAt ? new Date(o.createdAt).toLocaleString('en-GB') : dateStr,
      completed: stageIndex >= 0,
      description: `Order ${orderId} and payment status: ${o.paymentStatus || 'pending'}.`
    },
    {
      title: 'Accepted at Velora Logistics Hub',
      location: 'Velora Logistics Hub, Airport Industria',
      time: acceptedAt ? new Date(acceptedAt).toLocaleString('en-GB') : 'Awaiting update',
      completed: stageIndex >= 1,
      description: 'The paid order has been accepted for dispatch at the Velora logistics hub.'
    },
    {
      title: 'In Transit with Assigned Driver',
      location: trackingLocation,
      time: driverAssignedAt ? new Date(driverAssignedAt).toLocaleString('en-GB') : 'Awaiting update',
      completed: stageIndex >= 2,
      description: assignedDriver ? `Parcel assigned to ${assignedDriver.fullName || assignedDriver.full_name}.` : 'Awaiting driver assignment.'
    },
    {
      title: 'Delivered to Customer',
      location: fullAddr || 'Delivery address',
      time: deliveredAt ? new Date(deliveredAt).toLocaleString('en-GB') : 'Awaiting update',
      completed: stageIndex >= 3,
      description: stageIndex >= 3 ? 'Order marked delivered.' : 'Delivery confirmation will appear here once completed.'
    }
  ];

  return {
    id: orderId,
    trackingNumber: o.trackingNumber || 'Assigned after acceptance',
    date: dateStr,
    estimatedDelivery: orderStatus === 'delivered' ? 'Delivered' : estimatedDelivery,
    status: statusLabel,
    currentStageIndex: stageIndex,
    trackingLocation,
    carrier: 'Velora Express Courier (www.velora.co.za)',
    driver: {
      name: assignedDriver?.fullName || assignedDriver?.full_name || 'Not assigned',
      vehicle: 'Vehicle details not recorded',
      phone: assignedDriver?.phone || '',
      rating: assignedDriver ? 'Assigned Velora courier' : 'Driver will appear after dispatch assignment'
    },
    customer: {
      fullName: customer.fullName || 'Customer',
      email: customer.email || '',
      phone: customer.phone || '',
      address: fullAddr,
      region: [customer.city, customer.province].filter(Boolean).join(', ')
    },
    paymentMethod: o.paymentMethod || 'Not recorded',
    processingPartner: o.deliveryMethod || 'Not assigned',
    items,
    total: Number(o.total) || 0,
    milestones: milestones.map((milestone, index) => ({
      ...milestone,
      time: milestone.time || (milestone.completed ? dateStr : 'Awaiting update'),
      current: index === stageIndex
    }))
  };
}

// Fetch order directly from backend
async function fetchOrderFromBackend(orderId) {
  const token = localStorage.getItem('velora_auth_token');
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/${encodeURIComponent(orderId)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.order) {
        return buildParcelFromOrder(data.order);
      }
    }
  } catch (e) {
    console.warn('Direct order fetch error:', e);
  }

  // Fallback: search within user's orders list
  try {
    const listRes = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData.success && Array.isArray(listData.orders)) {
        const clean = orderId.trim().toUpperCase();
        const found = listData.orders.find(o =>
          (o.orderNumber && o.orderNumber.toUpperCase() === clean) ||
          (String(o.id) === clean) ||
          (o.trackingNumber && o.trackingNumber.toUpperCase() === clean)
        );
        if (found) {
          return buildParcelFromOrder(found);
        }
      }
    }
  } catch (_) {}

  return null;
}

// Initialize Order Processing Page
export async function initOrdersPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const requestedId = urlParams.get('orderId') || urlParams.get('tracking');
  const token = localStorage.getItem('velora_auth_token');

  if (!token) {
    showTrackingNotice('Sign in to view your orders and parcel tracking.');
    bindEvents();
    updateGlobalHeaderUser();
    return;
  }

  let activeOrder = requestedId
    ? await fetchOrderFromBackend(requestedId)
    : null;

  if (!requestedId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json().catch(() => null);
      if (response.ok && Array.isArray(data?.orders) && data.orders.length > 0) {
        activeOrder = buildParcelFromOrder(data.orders[0]);
      }
    } catch (error) {
      console.warn('Unable to fetch current user orders:', error);
    }
  }

  if (activeOrder) {
    showTrackingInterface();
    renderOrdersInterface(activeOrder);
    startTrackingRefresh(activeOrder.id);
  } else {
    showTrackingNotice(requestedId
      ? 'That order was not found in your account.'
      : 'No orders are available in your account yet.');
  }
  bindEvents();
  updateGlobalHeaderUser();
}

function startTrackingRefresh(orderNumber) {
  activeTrackingOrderId = orderNumber;
  if (trackingRefreshTimer) window.clearInterval(trackingRefreshTimer);
  trackingRefreshTimer = window.setInterval(async () => {
    if (document.visibilityState !== 'visible' || trackingRefreshInProgress || !activeTrackingOrderId) return;
    trackingRefreshInProgress = true;
    try {
      const order = await fetchOrderFromBackend(activeTrackingOrderId);
      if (order) {
        showTrackingInterface();
        renderOrdersInterface(order);
        if (order.status === 'Delivered') {
          window.clearInterval(trackingRefreshTimer);
          trackingRefreshTimer = null;
        }
      }
    } finally {
      trackingRefreshInProgress = false;
    }
  }, 5 * 60 * 1000);
}

function showTrackingNotice(message) {
  const notice = document.getElementById('trackingNotice');
  const overview = document.getElementById('orderOverviewCard');
  const details = document.getElementById('trackingMainGrid');
  if (notice) {
    notice.textContent = message;
    notice.hidden = false;
  }
  if (overview) overview.hidden = true;
  if (details) details.hidden = true;
}

function showTrackingInterface() {
  const notice = document.getElementById('trackingNotice');
  const overview = document.getElementById('orderOverviewCard');
  const details = document.getElementById('trackingMainGrid');
  if (notice) notice.hidden = true;
  if (overview) overview.hidden = false;
  if (details) details.hidden = false;
}

// Render the main tracking interface using safe DOM manipulation
function renderOrdersInterface(order) {
  activeTrackingOrderId = order.id;
  const customerName = order.customer?.fullName || 'Customer';
  const deliveryAddress = order.customer?.address || 'Delivery address not recorded';
  const items = order.items || [];
  const milestones = Array.isArray(order.milestones) ? order.milestones : [];
  const totalDisplay = typeof order.total === 'number' && Number.isFinite(order.total)
    ? `R ${order.total.toLocaleString('en-ZA')}` 
    : 'Total not recorded';

  // Search input and chips
  const searchInput = document.getElementById('orderSearchInput');
  if (searchInput) searchInput.value = order.id || '';

  const chipCurrent = document.getElementById('chipCurrentOrder');
  if (chipCurrent) {
    chipCurrent.textContent = `${order.id || 'Order'} (Current)`;
    chipCurrent.dataset.code = order.id || '';
  }

  // Hero Status
  const trackingCodeEl = document.getElementById('trackingNumberCode');
  if (trackingCodeEl) trackingCodeEl.textContent = order.trackingNumber || 'Assigned after acceptance';

  const orderStatusEl = document.getElementById('orderStatusHeading');
  if (orderStatusEl) orderStatusEl.textContent = order.status || 'Order status unavailable';

  const orderRefEl = document.getElementById('orderReferenceDisplay');
  if (orderRefEl) orderRefEl.textContent = order.id || 'Order';

  const etaTimeEl = document.getElementById('etaTimeDisplay');
  if (etaTimeEl) etaTimeEl.textContent = order.estimatedDelivery || 'Within 3 days after hub acceptance';
  const etaRegionEl = document.getElementById('etaSubRegion');
  if (etaRegionEl) etaRegionEl.textContent = order.customer?.region || order.customer?.address || 'Destination province not recorded';

  const currentLocationEl = document.getElementById('trackingCurrentLocation');
  if (currentLocationEl) currentLocationEl.textContent = order.trackingLocation || 'Velora Fulfillment Centre';

  // Render Milestones using <template id="timelineItemTemplate">
  const timelineContainer = document.getElementById('timelineListContainer');
  const timelineTemplate = document.getElementById('timelineItemTemplate');

  if (timelineContainer && timelineTemplate) {
    timelineContainer.replaceChildren();

    milestones.forEach((ms, idx) => {
      const clone = timelineTemplate.content.cloneNode(true);
      const itemEl = clone.querySelector('.timeline-item');
      const markerCircle = clone.querySelector('.marker-circle');
      const titleEl = clone.querySelector('.timeline-title');
      const timeEl = clone.querySelector('.timeline-time');
      const locEl = clone.querySelector('.timeline-location');
      const descEl = clone.querySelector('.timeline-desc');

      if (itemEl) {
        if (ms.completed) {
          itemEl.classList.add('completed');
        } else {
          itemEl.classList.add('pending');
        }
        if (idx === order.currentStageIndex) {
          itemEl.classList.add('current');
        }
      }

      if (markerCircle) {
        markerCircle.textContent = ms.completed ? '✓' : String(idx + 1);
      }
      if (titleEl) titleEl.textContent = ms.title;
      if (timeEl) timeEl.textContent = ms.time;
      if (locEl) locEl.textContent = `📍 ${ms.location}`;
      if (descEl) descEl.textContent = ms.description;

      timelineContainer.appendChild(clone);
    });
  }

  // Courier Info
  const driverNameEl = document.getElementById('driverName');
  if (driverNameEl) driverNameEl.textContent = order.driver?.name || 'Not assigned';

  const driverAvatarEl = document.getElementById('driverAvatar');
  if (driverAvatarEl) {
    const initials = String(order.driver?.name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
    driverAvatarEl.textContent = initials || '--';
  }

  const driverVehicleEl = document.getElementById('driverVehicle');
  if (driverVehicleEl) driverVehicleEl.textContent = order.driver?.vehicle || 'Vehicle details not recorded';

  const driverPhoneEl = document.getElementById('driverPhone');
  if (driverPhoneEl) driverPhoneEl.textContent = order.driver?.phone || 'Not available';

  const driverRatingEl = document.getElementById('driverRating');
  if (driverRatingEl) driverRatingEl.textContent = order.driver?.name ? 'Assigned Velora courier' : 'Driver will appear after dispatch assignment';

  // Delivery Address Card
  const shipCustomerEl = document.getElementById('shipCustomerName');
  if (shipCustomerEl) shipCustomerEl.textContent = customerName;

  const shipStreetEl = document.getElementById('shipStreetAddress');
  if (shipStreetEl) shipStreetEl.textContent = deliveryAddress;

  const shipPhoneEl = document.getElementById('shipPhoneContact');
  if (shipPhoneEl) shipPhoneEl.textContent = order.customer?.phone || '+27 82 492 8102';

  const shipEmailEl = document.getElementById('shipEmailContact');
  if (shipEmailEl) shipEmailEl.textContent = order.customer?.email || 'customer@example.com';

  // Payment Breakdown
  const paymentMethodBadge = document.getElementById('orderPaymentMethodBadge');
  if (paymentMethodBadge) paymentMethodBadge.textContent = order.paymentMethod || 'Payment method not recorded';

  // Manifest items using <template id="manifestItemTemplate">
  const manifestContainer = document.getElementById('manifestItemsContainer');
  const manifestTemplate = document.getElementById('manifestItemTemplate');

  if (manifestContainer && manifestTemplate) {
    manifestContainer.replaceChildren();

    items.forEach((item) => {
      const clone = manifestTemplate.content.cloneNode(true);
      const thumb = clone.querySelector('.manifest-thumb');
      const title = clone.querySelector('.manifest-title');
      const meta = clone.querySelector('.manifest-meta');
      const price = clone.querySelector('.manifest-price');

      if (thumb) {
        thumb.src = item.image;
        thumb.alt = item.title;
      }
      if (title) title.textContent = item.title;
      if (meta) meta.textContent = `Size: ${item.size} • Qty: ${item.quantity}`;
      if (price) {
        const itemP = Number(item.price);
        price.textContent = Number.isFinite(itemP) ? `R ${(itemP * item.quantity).toLocaleString('en-ZA')}` : 'Price not recorded';
      }

      manifestContainer.appendChild(clone);
    });
  }

  const manifestTotalEl = document.getElementById('manifestTotalDisplay');
  if (manifestTotalEl) manifestTotalEl.textContent = totalDisplay;
}

let eventsBound = false;

// Bind search and interaction events
function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;

  const form = document.getElementById('orderSearchForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('orderSearchInput');
      const val = input ? input.value.trim() : '';
      if (!val) return;

      const submitBtn = document.getElementById('trackParcelSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Searching...';
      }

      const remote = await fetchOrderFromBackend(val);
      if (remote) {
        showTrackingInterface();
        renderOrdersInterface(remote);
      } else {
        showTrackingNotice('That order was not found in your account.');
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Track Parcel ↗';
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Quick Chips
  const chips = document.querySelectorAll('.quick-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', async () => {
      const code = chip.dataset.code;
      const remote = await fetchOrderFromBackend(code);
      if (remote) {
        showTrackingInterface();
        renderOrdersInterface(remote);
      } else {
        showTrackingNotice('That order was not found in your account.');
      }
    });
  });

  // Contact the assigned courier when a phone number is available.
  const callBtn = document.getElementById('callCourierBtn');
  if (callBtn) {
    callBtn.addEventListener('click', () => {
      const phone = document.getElementById('driverPhone')?.textContent || '';
      if (phone && phone !== 'Not available') {
        window.location.href = `tel:${phone}`;
      } else {
        alert('Courier contact will be available after a driver is assigned.');
      }
    });
  }

  // Delivery note simulation
  const noteBtn = document.getElementById('addDeliveryNoteBtn');
  if (noteBtn) {
    noteBtn.addEventListener('click', () => {
      const note = prompt('Enter special delivery instructions (e.g. Gate code, concierge drop-off):', 'Please leave with reception concierge if unavailable.');
      if (note) {
        alert(`Delivery instruction updated successfully: "${note}" has been transmitted to the driver.`);
      }
    });
  }

  // Print button
  const printBtn = document.getElementById('printWaybillBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// Auto-run on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initOrdersPage();
  });
}
