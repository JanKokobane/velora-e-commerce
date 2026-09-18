/**
 * Velora E-Commerce — Order Processing & Parcel Tracking (orders.js)
 * Powered by CodeAlpha Logistics (www.codealpha.tech)
 * Features:
 * 1. Real-time Order Processing lifecycle verification
 * 2. Parcel Tracking lookup by Order ID or Courier Tracking Number
 * 3. Milestone timeline: Atelier -> CodeAlpha Logistics Hub -> Courier -> Delivery
 * 4. Interactive visual logistics route preview
 * 5. Waybill generation & delivery note printing
 */

import { updateGlobalHeaderUser } from './auth.js';

const ORDERS_STORAGE_KEY = 'velora_orders_history';

// Default mock parcel if none exists in history
const DEFAULT_PARCEL = {
  id: 'VEL-84920',
  trackingNumber: 'TRK-ZA-8492019',
  date: '18 Sep 2026',
  estimatedDelivery: 'Tomorrow, 19 Sep (14:00 – 17:00)',
  status: 'In Transit — Out for Express Delivery',
  currentStageIndex: 3, // 0: Placed, 1: Processed, 2: Dispatched, 3: Out for Delivery, 4: Delivered
  carrier: 'CodeAlpha Express Courier (www.codealpha.tech)',
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
  processingPartner: 'CodeAlpha Tech Infrastructure (www.codealpha.tech)',
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
      title: 'CodeAlpha Order Processing & Atelier Allocation',
      location: 'Woodstock Studio, Cape Town',
      time: '18 Sep 2026, 11:30',
      completed: true,
      description: 'Handcrafted goods inspected by master artisan. Packed in biodegradable raw cotton dust bag.'
    },
    {
      title: 'Dispatched to CodeAlpha Logistics Hub',
      location: 'Airport Industria Dispatch Hub, Western Cape',
      time: '18 Sep 2026, 16:45',
      completed: true,
      description: 'Waybill scanned and audited by CodeAlpha Tech logistics system (www.codealpha.tech).'
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
    return parsed.length > 0 ? parsed : [DEFAULT_PARCEL];
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
  const root = document.getElementById('ordersAppRoot');
  if (!root) return;

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

// Render the main tracking interface
function renderOrdersInterface(order) {
  const root = document.getElementById('ordersAppRoot');
  if (!root) return;

  const customerName = order.customer?.fullName || 'Elena Vance';
  const deliveryAddress = order.customer?.street 
    ? `${order.customer.street}, ${order.customer.city || 'Cape Town'}`
    : (order.customer?.address || '14 Kloof Street, Gardens, Cape Town');
  const items = order.items || [];
  const milestones = order.milestones || DEFAULT_PARCEL.milestones;
  const totalDisplay = typeof order.total === 'number' ? `R${order.total.toLocaleString('en-ZA')}` : (order.total || 'R1,290');

  root.innerHTML = `
    <!-- Top Search & Verification Header -->
    <div class="orders-search-section">
      <div class="search-box-card">
        <span class="codealpha-tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Audited by CodeAlpha Tech • <a href="https://www.codealpha.tech" target="_blank" rel="noopener">www.codealpha.tech</a>
        </span>
        <h2>Track Parcel & Order Processing</h2>
        <p>Enter your Velora Order ID or CodeAlpha Tracking Waybill to monitor real-time fulfillment status.</p>

        <form id="orderSearchForm" class="order-search-bar">
          <div class="search-input-wrapper">
            <svg class="search-lens" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              id="orderSearchInput" 
              placeholder="e.g. ${order.id || 'VEL-84920'} or ${order.trackingNumber || 'TRK-ZA-8492019'}" 
              value="${order.id || ''}"
              required
            >
          </div>
          <button type="submit" class="search-submit-btn">
            Track Parcel ↗
          </button>
        </form>

        <div class="demo-chips-row">
          <span>Quick Lookup:</span>
          <button type="button" class="quick-chip" data-code="${order.id}">${order.id} (Current)</button>
          <button type="button" class="quick-chip" data-code="VEL-84920">VEL-84920 (Sneakers)</button>
          <button type="button" class="quick-chip" data-code="TRK-ZA-8492019">CodeAlpha Waybill</button>
        </div>
      </div>
    </div>

    <!-- Active Parcel Status Hero -->
    <div class="order-overview-card">
      <div class="overview-header">
        <div class="overview-title-block">
          <div class="parcel-id-row">
            <span class="badge-accent">Express Courier</span>
            <span class="tracking-number-code">Waybill: <strong>${order.trackingNumber || 'TRK-ZA-8492019'}</strong></span>
          </div>
          <h1 class="order-heading">${order.status || 'In Transit — Out for Express Delivery'}</h1>
          <p class="order-partner-note">
            Order Reference: <strong>${order.id}</strong> • Processed via <strong>CodeAlpha Logistics (<a href="https://www.codealpha.tech" target="_blank" rel="noopener">www.codealpha.tech</a>)</strong>
          </p>
        </div>
        
        <div class="overview-eta-box">
          <span class="eta-label">Estimated Delivery</span>
          <strong class="eta-time">${order.estimatedDelivery || 'Tomorrow (14:00 – 17:00)'}</strong>
          <span class="eta-sub">Cape Town Metropolitan Area</span>
        </div>
      </div>

      <!-- Graphical Logistics Route Diagram -->
      <div class="logistics-route-map">
        <div class="route-point start">
          <div class="point-dot"></div>
          <span class="point-name">Atelier Workshop</span>
          <span class="point-city">Cape Town</span>
        </div>
        <div class="route-line active">
          <div class="van-indicator">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
        </div>
        <div class="route-point hub">
          <div class="point-dot"></div>
          <span class="point-name">CodeAlpha Logistics Hub</span>
          <span class="point-city">Airport Industria</span>
        </div>
        <div class="route-line active"></div>
        <div class="route-point dest">
          <div class="point-dot pulse"></div>
          <span class="point-name">Destination</span>
          <span class="point-city">${customerName}</span>
        </div>
      </div>
    </div>

    <!-- 2-Column Details: Timeline & Manifest -->
    <div class="tracking-grid">
      
      <!-- Left: Milestone Processing Timeline -->
      <div class="tracking-left-col">
        <div class="timeline-card">
          <div class="timeline-header">
            <h3>Order Processing Stages</h3>
            <span class="live-pill"><span class="pulse-dot"></span> Live Updates</span>
          </div>

          <div class="timeline-list">
            ${milestones.map((ms, idx) => `
              <div class="timeline-item ${ms.completed ? 'completed' : 'pending'} ${idx === 3 ? 'current' : ''}">
                <div class="timeline-marker">
                  <div class="marker-circle">
                    ${ms.completed ? '✓' : idx + 1}
                  </div>
                  <div class="marker-line"></div>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title-row">
                    <h4>${ms.title}</h4>
                    <span class="timeline-time">${ms.time}</span>
                  </div>
                  <span class="timeline-location">📍 ${ms.location}</span>
                  <p class="timeline-desc">${ms.description}</p>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- CodeAlpha Tech Audit Seal -->
          <div class="codealpha-seal">
            <div class="seal-icon">🔒</div>
            <div>
              <strong>Cryptographically Verified by CodeAlpha Tech</strong>
              <p>Supply chain telemetry authenticated at each physical checkpoint via <a href="https://www.codealpha.tech" target="_blank" rel="noopener">www.codealpha.tech</a>.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Courier Details, Address & Goods Manifest -->
      <div class="tracking-right-col">
        
        <!-- Courier Card -->
        <div class="courier-card">
          <h4>Designated Courier Driver</h4>
          <div class="courier-info">
            <div class="driver-avatar">SK</div>
            <div class="driver-details">
              <strong>Sipho Khumalo</strong>
              <span class="driver-rating">CodeAlpha Senior Courier • 4.9 ★ (1,420 deliveries)</span>
              <span class="driver-vehicle">Vehicle: Toyota Hilux Van (CA 892 411)</span>
            </div>
          </div>
          <div class="driver-actions">
            <button type="button" class="btn-driver-call" id="callCourierBtn">📞 Contact Courier</button>
            <button type="button" class="btn-driver-note" id="addDeliveryNoteBtn">📝 Delivery Instructions</button>
          </div>
        </div>

        <!-- Recipient & Delivery Details -->
        <div class="destination-card">
          <h4>Delivery Destination</h4>
          <div class="dest-row">
            <span class="dest-label">Recipient:</span>
            <strong>${customerName}</strong>
          </div>
          <div class="dest-row">
            <span class="dest-label">Address:</span>
            <span>${deliveryAddress}</span>
          </div>
          <div class="dest-row">
            <span class="dest-label">Service:</span>
            <span>Velora Priority Express (Complimentary)</span>
          </div>
          <div class="dest-row">
            <span class="dest-label">Logistics Partner:</span>
            <span style="color: var(--accent-dark); font-weight: 600;">CodeAlpha Tech (www.codealpha.tech)</span>
          </div>
        </div>

        <!-- Items Manifest -->
        <div class="manifest-card">
          <h4>Parcel Contents (${items.length} ${items.length === 1 ? 'item' : 'items'})</h4>
          <div class="manifest-items-list">
            ${items.map(item => `
              <div class="manifest-item">
                <img src="${item.image || 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg'}" alt="${item.title}">
                <div class="manifest-item-info">
                  <strong>${item.title}</strong>
                  <span>Size: ${item.size || 'Standard'} &times; ${item.quantity || 1}</span>
                </div>
                <span class="manifest-item-price">R${(item.price * (item.quantity || 1)).toLocaleString('en-ZA')}</span>
              </div>
            `).join('')}
          </div>

          <div class="manifest-total-row">
            <span>Total Parcel Value:</span>
            <strong>${totalDisplay}</strong>
          </div>
        </div>

        <!-- Action Links -->
        <div class="tracking-action-buttons">
          <button type="button" class="btn-print-waybill" onclick="window.print()">
            Print Waybill & Tax Invoice 🖨️
          </button>
          <a href="auth.html" class="btn-account-link">
            View My Account ↗
          </a>
        </div>

      </div>

    </div>
  `;
}

// Bind search and interaction events
function bindEvents() {
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
        bindEvents();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Create custom tracking preview for the entered code
        const customOrder = {
          ...DEFAULT_PARCEL,
          id: val.toUpperCase().startsWith('VEL-') ? val.toUpperCase() : `VEL-${val}`,
          trackingNumber: `TRK-ZA-${Math.floor(1000000 + Math.random() * 9000000)}`
        };
        renderOrdersInterface(customOrder);
        bindEvents();
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
        bindEvents();
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
        alert('Delivery instruction updated successfully: "' + note + '" has been transmitted to the driver.');
      }
    });
  }
}

// Auto-run on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initOrdersPage();
  });
}
