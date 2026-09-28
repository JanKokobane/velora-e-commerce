import { updateGlobalHeaderUser } from './auth.js';

function resolveBackendBaseUrl() {
  if (typeof window !== 'undefined' && window.VELORA_API_BASE_URL) {
    return window.VELORA_API_BASE_URL;
  }
  return 'https://velora-e-commerce-qby7.onrender.com';
}

const API_BASE_URL = resolveBackendBaseUrl();
const ORDERS_STORAGE_KEY = 'velora_orders_history';

// Default parcel benchmark for demonstration if no orders exist yet
const DEFAULT_PARCEL = {
  id: 'VEL-84920',
  trackingNumber: 'TRK-ZA-8492019',
  date: '18 Sep 2026',
  estimatedDelivery: 'Tomorrow (14:00 – 17:00)',
  status: 'In Transit — Out for Express Delivery',
  currentStageIndex: 3,
  carrier: 'Velora Express Courier (www.velora.co.za)',
  driver: {
    name: 'Sipho Khumalo',
    vehicle: 'Toyota Hilux Van (CA 892 411)',
    phone: '+27 82 555 0192',
    rating: '4.9 ★'
  },
  customer: {
    fullName: 'Elena Vance',
    email: 'elena@example.com',
    phone: '+27 82 492 8102',
    address: '14 Kloof Street, Gardens, Cape Town, 8001'
  },
  paymentMethod: 'Instant EFT (Capitec Bank) — Verified',
  processingPartner: 'Velora Logistics Infrastructure (www.velora.co.za)',
  items: [
    {
      title: 'Adizero Running Gel Pocket Crop Top',
      size: 'M',
      quantity: 1,
      price: 999,
      image: 'https://assets.adidas.com/images/w_1880,f_auto,q_auto/963f264df7f749b8905416d3a2e43307_9366/KT4859_21_model.jpg'
    }
  ],
  milestones: [
    {
      title: 'Order Verified & Payment Cleared',
      location: 'Velora Digital Gateway',
      time: '18 Sep 2026, 09:15',
      completed: true,
      description: 'Transaction authorized via Velora SSL gateway. Digital invoice generated.'
    },
    {
      title: 'Velora Order Processing & Atelier Allocation',
      location: 'Woodstock Studio, Cape Town',
      time: '18 Sep 2026, 11:30',
      completed: true,
      description: 'Handcrafted goods inspected by master artisan. Packed in biodegradable raw cotton dust bag.'
    },
    {
      title: 'Dispatched to Velora Logistics Hub',
      location: 'Airport Industria Dispatch Hub, Western Cape',
      time: '18 Sep 2026, 16:45',
      completed: true,
      description: 'Waybill scanned and audited by Velora logistics system (www.velora.co.za).'
    },
    {
      title: 'Out for Express Delivery',
      location: 'City Bowl & Atlantic Seaboard Route',
      time: 'Today, 08:30',
      completed: true,
      description: 'Parcel loaded into express courier van. Courier Sipho K. is currently on route.'
    },
    {
      title: 'Final Handover & Recipient Signature',
      location: '14 Kloof Street, Gardens, Cape Town',
      time: 'Expected Today, 14:00 – 17:00',
      completed: false,
      description: 'Signature required upon handover. Mobile PIN verification enabled.'
    }
  ]
};

// Retrieve all local orders
function getAllOrders() {
  const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!raw) return [DEFAULT_PARCEL];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_PARCEL];
  } catch (e) {
    return [DEFAULT_PARCEL];
  }
}

// Convert a backend order into a parcel tracking model
function buildParcelFromOrder(o) {
  const orderId = o.orderNumber || o.id || 'VEL-84920';
  const customer = o.shipping || o.customer || {
    fullName: o.fullName || 'Elena Vance',
    email: o.email || 'elena@example.com',
    phone: o.phone || '+27 82 000 0000',
    street: o.street || '14 Kloof Street',
    city: o.city || 'Cape Town'
  };

  const items = Array.isArray(o.items) && o.items.length > 0 ? o.items.map(item => ({
    title: item.productName || item.title || item.name || 'Velora Item',
    size: item.size || 'Standard',
    quantity: Number(item.quantity) || 1,
    price: Number(item.unitPrice || item.price) || 0,
    image: item.image || item.image_url || 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
  })) : DEFAULT_PARCEL.items;

  const dateStr = o.createdAt
    ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : (o.date || 'Recent');

  const fullAddr = customer.street
    ? `${customer.street}, ${customer.city || 'Cape Town'}, ${customer.province || 'Western Cape'}`
    : (customer.address || '14 Kloof Street, Gardens, Cape Town');

  const isDelivered = o.status === 'delivered';

  return {
    id: orderId,
    trackingNumber: o.trackingNumber || `TRK-ZA-${String(orderId).replace(/\D/g, '').slice(-7) || Math.floor(1000000 + Math.random() * 9000000)}`,
    date: dateStr,
    estimatedDelivery: o.estimatedDelivery || 'In 2-3 Business Days (14:00 – 17:00)',
    status: isDelivered ? 'Delivered & Signed' : 'In Transit — Out for Express Delivery',
    currentStageIndex: isDelivered ? 4 : 3,
    carrier: 'Velora Express Courier (www.velora.co.za)',
    driver: {
      name: 'Sipho Khumalo',
      vehicle: 'Toyota Hilux Van (CA 892 411)',
      phone: '+27 82 555 0192',
      rating: '4.9 ★'
    },
    customer: {
      fullName: customer.fullName || 'Elena Vance',
      email: customer.email || 'elena@example.com',
      phone: customer.phone || '+27 82 000 0000',
      address: fullAddr
    },
    paymentMethod: o.paymentMethod || 'Secure Card / EFT — Verified',
    processingPartner: 'Velora Logistics Infrastructure (www.velora.co.za)',
    items,
    total: Number(o.total) || 0,
    milestones: [
      {
        title: 'Order Verified & Payment Cleared',
        location: 'Velora Digital Gateway',
        time: `${dateStr}, 09:15`,
        completed: true,
        description: 'Transaction authorized via Velora SSL gateway. Digital invoice generated.'
      },
      {
        title: 'Velora Order Processing & Atelier Allocation',
        location: 'Woodstock Studio, Cape Town',
        time: `${dateStr}, 11:30`,
        completed: true,
        description: 'Handcrafted goods inspected by master artisan. Packed in biodegradable raw cotton dust bag.'
      },
      {
        title: 'Dispatched to Velora Logistics Hub',
        location: 'Airport Industria Dispatch Hub, Western Cape',
        time: `${dateStr}, 16:45`,
        completed: true,
        description: 'Waybill scanned and audited by Velora logistics system (www.velora.co.za).'
      },
      {
        title: 'Out for Express Delivery',
        location: `${customer.city || 'Cape Town'} Hub Route`,
        time: 'Today, 08:30',
        completed: true,
        description: 'Parcel loaded into express courier van. Courier Sipho K. is currently on route.'
      },
      {
        title: 'Final Handover & Recipient Signature',
        location: fullAddr,
        time: 'Expected 14:00 – 17:00',
        completed: isDelivered,
        description: 'Signature required upon handover. Mobile PIN verification enabled.'
      }
    ]
  };
}

// Find order by ID or Tracking
function findLocalOrder(query) {
  if (!query) return null;
  const clean = query.trim().toUpperCase();
  const orders = getAllOrders();

  return orders.find(o => 
    (o.id && o.id.toUpperCase() === clean) ||
    (o.orderNumber && o.orderNumber.toUpperCase() === clean) ||
    (o.trackingNumber && o.trackingNumber.toUpperCase() === clean) ||
    (o.id && o.id.replace(/\D/g, '') === clean.replace(/\D/g, ''))
  ) || null;
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

  let activeOrder = null;
  if (requestedId) {
    const local = findLocalOrder(requestedId);
    if (local) {
      activeOrder = buildParcelFromOrder(local);
    } else {
      activeOrder = await fetchOrderFromBackend(requestedId);
    }
  }

  // If not found or not specified, check most recent order
  if (!activeOrder) {
    const orders = getAllOrders();
    activeOrder = orders[0] ? buildParcelFromOrder(orders[0]) : DEFAULT_PARCEL;
  }

  renderOrdersInterface(activeOrder);
  bindEvents();
  updateGlobalHeaderUser();
}

// Render the main tracking interface using safe DOM manipulation
function renderOrdersInterface(order) {
  const customerName = order.customer?.fullName || 'Elena Vance';
  const deliveryAddress = order.customer?.address || '14 Kloof Street, Gardens, Cape Town';
  const items = order.items || [];
  const milestones = order.milestones || DEFAULT_PARCEL.milestones;
  const totalDisplay = typeof order.total === 'number' && order.total > 0
    ? `R ${order.total.toLocaleString('en-ZA')}` 
    : 'R 999';

  // Search input and chips
  const searchInput = document.getElementById('orderSearchInput');
  if (searchInput) searchInput.value = order.id || '';

  const chipCurrent = document.getElementById('chipCurrentOrder');
  if (chipCurrent) {
    chipCurrent.textContent = `${order.id || 'VEL-84920'} (Current)`;
    chipCurrent.dataset.code = order.id || 'VEL-84920';
  }

  // Hero Status
  const trackingCodeEl = document.getElementById('trackingNumberCode');
  if (trackingCodeEl) trackingCodeEl.textContent = order.trackingNumber || 'TRK-ZA-8492019';

  const orderStatusEl = document.getElementById('orderStatusHeading');
  if (orderStatusEl) orderStatusEl.textContent = order.status || 'In Transit — Out for Express Delivery';

  const orderRefEl = document.getElementById('orderReferenceDisplay');
  if (orderRefEl) orderRefEl.textContent = order.id || 'VEL-84920';

  const etaTimeEl = document.getElementById('etaTimeDisplay');
  if (etaTimeEl) etaTimeEl.textContent = order.estimatedDelivery || 'In 2-3 Business Days (14:00 – 17:00)';

  const routeDestCity = document.getElementById('routeCustomerCity');
  if (routeDestCity) routeDestCity.textContent = customerName;

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
        if (idx === 3) {
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
  if (driverNameEl) driverNameEl.textContent = order.driver?.name || 'Sipho Khumalo';

  const driverVehicleEl = document.getElementById('driverVehicle');
  if (driverVehicleEl) driverVehicleEl.textContent = order.driver?.vehicle || 'Toyota Hilux Van (CA 892 411)';

  const driverPhoneEl = document.getElementById('driverPhone');
  if (driverPhoneEl) driverPhoneEl.textContent = order.driver?.phone || '+27 82 555 0192';

  const driverRatingEl = document.getElementById('driverRating');
  if (driverRatingEl) driverRatingEl.textContent = order.driver?.rating || '4.9 ★';

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
  if (paymentMethodBadge) paymentMethodBadge.textContent = order.paymentMethod || 'Instant EFT (Capitec Bank) — Verified';

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
        const itemP = typeof item.price === 'number' ? item.price : 999;
        price.textContent = `R ${(itemP * item.quantity).toLocaleString('en-ZA')}`;
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

      let found = findLocalOrder(val);
      if (found) {
        renderOrdersInterface(buildParcelFromOrder(found));
      } else {
        const remote = await fetchOrderFromBackend(val);
        if (remote) {
          renderOrdersInterface(remote);
        } else {
          // Custom generated tracking for the entered identifier
          const customOrder = buildParcelFromOrder({
            id: val.toUpperCase().startsWith('VEL-') ? val.toUpperCase() : `VEL-${val}`,
            trackingNumber: `TRK-ZA-${Math.floor(1000000 + Math.random() * 9000000)}`,
            total: 999,
            status: 'In Transit — Live Tracking Enabled'
          });
          renderOrdersInterface(customOrder);
        }
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
      const found = findLocalOrder(code);
      if (found) {
        renderOrdersInterface(buildParcelFromOrder(found));
      } else {
        const remote = await fetchOrderFromBackend(code);
        if (remote) {
          renderOrdersInterface(remote);
        }
      }
    });
  });

  // Courier call simulation
  const callBtn = document.getElementById('callCourierBtn');
  if (callBtn) {
    callBtn.addEventListener('click', () => {
      alert('Connecting to Courier Driver Sipho Khumalo (+27 82 555 0192)... Your parcel is currently on schedule.');
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
