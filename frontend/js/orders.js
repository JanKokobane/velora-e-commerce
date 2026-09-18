mport { updateGlobalHeaderUser } from './auth.js';

const ORDERS_STORAGE_KEY = 'velora_orders_history';

// Default mock parcel if none exists in history
const DEFAULT_PARCEL = {
  id: 'VEL-84920',
  trackingNumber: 'TRK-ZA-8492019',
  date: '18 Sep 2026',
  estimatedDelivery: 'Tomorrow, 19 Sep (14:00 – 17:00)',
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
      title: 'Cloud-step sneakers',
      size: 'UK 7 (EU 40)',
      quantity: 1,
      price: 1290,
      image: 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    }
  ],
  milestones: [
    {
      title: 'Order Verified & Payment Cleared',
      location: 'Velora Digital Gateway',
      time: '18 Sep 2026, 09:15',
      completed: true,
      description: 'Transaction authorized via Ozow SSL gateway. Digital invoice generated.'
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
      time: '19 Sep 2026, 08:30',
      completed: true,
      description: 'Parcel loaded into express courier van. Courier Sipho K. is currently on route.'
    },
    {
      title: 'Final Handover & Recipient Signature',
      location: '14 Kloof Street, Gardens, Cape Town',
      time: 'Expected 19 Sep 2026, 14:00 – 17:00',
      completed: false,
      description: 'Signature required upon handover. Mobile pin verification enabled.'
    }
  ]
};

// Retrieve all orders
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

// Find order by ID or Tracking
function findOrder(query) {
  if (!query) return null;
  const clean = query.trim().toUpperCase();
  const orders = getAllOrders();

  return orders.find(o => 
    (o.id && o.id.toUpperCase() === clean) ||
    (o.trackingNumber && o.trackingNumber.toUpperCase() === clean) ||
    (o.id && o.id.replace(/\D/g, '') === clean.replace(/\D/g, ''))
  ) || null;
}

// Initialize Order Processing Page
export function initOrdersPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const requestedId = urlParams.get('orderId') || urlParams.get('tracking');

  let activeOrder = null;
  if (requestedId) {
    activeOrder = findOrder(requestedId);
  }

  // If not found or not specified, use the first order from history or DEFAULT_PARCEL
  if (!activeOrder) {
    const orders = getAllOrders();
    activeOrder = orders[0] || DEFAULT_PARCEL;
  }

  renderOrdersInterface(activeOrder);
  bindEvents();
  updateGlobalHeaderUser();
}

// Render the main tracking interface using safe DOM manipulation
function renderOrdersInterface(order) {
  const customerName = order.customer?.fullName || 'Elena Vance';
  const deliveryAddress = order.customer?.street 
    ? `${order.customer.street}, ${order.customer.city || 'Cape Town'}`
    : (order.customer?.address || '14 Kloof Street, Gardens, Cape Town');
  const items = order.items || [];
  const milestones = order.milestones || DEFAULT_PARCEL.milestones;
  const totalDisplay = typeof order.total === 'number' 
    ? `R${order.total.toLocaleString('en-ZA')}` 
    : (order.total || 'R1,290');

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
  if (etaTimeEl) etaTimeEl.textContent = order.estimatedDelivery || 'Tomorrow, 19 Sep (14:00 – 17:00)';

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
  const driverRatingEl = document.getElementById('driverRating');
  const driverVehicleEl = document.getElementById('driverVehicle');
  const driverAvatarEl = document.getElementById('driverAvatar');

  if (driverNameEl) driverNameEl.textContent = order.driver?.name || 'Sipho Khumalo';
  if (driverRatingEl) {
    driverRatingEl.textContent = `Velora Senior Courier • ${order.driver?.rating || '4.9 ★'} (1,420 deliveries)`;
  }
  if (driverVehicleEl) {
    driverVehicleEl.textContent = `Vehicle: ${order.driver?.vehicle || 'Toyota Hilux Van (CA 892 411)'}`;
  }
  if (driverAvatarEl) {
    const initials = (order.driver?.name || 'Sipho Khumalo')
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
    driverAvatarEl.textContent = initials || 'SK';
  }

  // Delivery Destination
  const destCustomer = document.getElementById('destCustomerName');
  const destAddress = document.getElementById('destDeliveryAddress');

  if (destCustomer) destCustomer.textContent = customerName;
  if (destAddress) destAddress.textContent = deliveryAddress;

  // Items Manifest
  const manifestHeading = document.getElementById('manifestCardHeading');
  if (manifestHeading) {
    manifestHeading.textContent = `Parcel Contents (${items.length} ${items.length === 1 ? 'item' : 'items'})`;
  }

  const manifestContainer = document.getElementById('manifestItemsListContainer');
  const manifestTemplate = document.getElementById('manifestItemTemplate');

  if (manifestContainer && manifestTemplate) {
    manifestContainer.replaceChildren();

    items.forEach((item) => {
      const clone = manifestTemplate.content.cloneNode(true);
      const thumb = clone.querySelector('.manifest-thumb');
      const title = clone.querySelector('.manifest-title');
      const meta = clone.querySelector('.manifest-meta');
      const price = clone.querySelector('.manifest-item-price');

      if (thumb) {
        thumb.src = item.image || 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg';
        thumb.alt = item.title || 'Product item';
      }
      if (title) title.textContent = item.title || 'Velora item';
      if (meta) meta.textContent = `Size: ${item.size || 'Standard'} × ${item.quantity || 1}`;
      if (price) {
        const itemLineTotal = (item.price || 0) * (item.quantity || 1);
        price.textContent = `R${itemLineTotal.toLocaleString('en-ZA')}`;
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
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('orderSearchInput');
      const val = input ? input.value.trim() : '';
      if (!val) return;

      const found = findOrder(val);
      if (found) {
        renderOrdersInterface(found);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Create custom tracking preview for the entered code
        const customOrder = {
          ...DEFAULT_PARCEL,
          id: val.toUpperCase().startsWith('VEL-') ? val.toUpperCase() : `VEL-${val}`,
          trackingNumber: `TRK-ZA-${Math.floor(1000000 + Math.random() * 9000000)}`
        };
        renderOrdersInterface(customOrder);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Quick Chips
  const chips = document.querySelectorAll('.quick-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const code = chip.dataset.code;
      const found = findOrder(code);
      if (found) {
        renderOrdersInterface(found);
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
