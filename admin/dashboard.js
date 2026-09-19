/**
 * Velora Dashboard Application Logic (dashboard.js)
 * Real-time order state management, reactive filters, drawer detail inspections,
 * status transitions, inventory stock updates, and live analytics sync.
 */

// Storage Keys matching Velora store
const ORDERS_STORAGE_KEY = 'velora_orders_history';
const INVENTORY_STORAGE_KEY = 'velora_inventory_state';

// Initial Mock Seed Orders (matching the screenshot's rich data: #390561, #663334, #418135, etc.)
const SEED_ORDERS = [
  {
    id: '#390561',
    date: 'Jan 8, 13:52',
    dateShort: 'Jan 8',
    status: 'Paid',
    total: 780.00,
    trackingNumber: 'TRK-ZA-390561',
    customer: {
      fullName: 'Michelle Black',
      email: 'michelle.b@example.com',
      phone: '+27 82 441 9021',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Ryobi ONE drill/driver kit',
        category: 'Hardware',
        price: 409.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      },
      {
        title: 'Socket Systeme Electric Pack',
        category: 'Electrical',
        price: 238.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/32677219/pexels-photo-32677219.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      },
      {
        title: 'DVB-T2 Receiver digital box',
        category: 'Electronics',
        price: 133.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#663334',
    date: 'Jan 6, 11:20',
    dateShort: 'Jan 6',
    status: 'Delivered',
    total: 1250.00,
    trackingNumber: 'TRK-ZA-663334',
    customer: {
      fullName: 'Janice Chandler',
      email: 'janice.c@example.com',
      phone: '+27 83 912 4001',
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Everyday leather tote',
        category: 'Bags',
        price: 1250.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#418135',
    date: 'Jan 5, 16:45',
    dateShort: 'Jan 5',
    status: 'Paid',
    total: 540.95,
    trackingNumber: 'TRK-ZA-418135',
    customer: {
      fullName: 'Mildred Hall',
      email: 'mildred.hall@example.com',
      phone: '+27 71 882 1092',
      avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Polarised sunglasses',
        category: 'Objects',
        price: 540.95,
        quantity: 1,
        image: 'https://images.pexels.com/photos/32677219/pexels-photo-32677219.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#801999',
    date: 'Jan 2, 09:15',
    dateShort: 'Jan 2',
    status: 'Paid',
    total: 1489.00,
    trackingNumber: 'TRK-ZA-801999',
    customer: {
      fullName: 'Ana Carter',
      email: 'ana.carter@example.com',
      phone: '+27 82 300 4811',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Classic denim jacket',
        category: 'Apparel',
        price: 1489.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/3649765/pexels-photo-3649765.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#517783',
    date: 'Dec 28, 14:02',
    dateShort: 'Dec 28',
    status: 'Completed',
    total: 925.00,
    trackingNumber: 'TRK-ZA-517783',
    customer: {
      fullName: 'John Sherman',
      email: 'john.sherman@example.com',
      phone: '+27 76 544 1920',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Relaxed linen shirt',
        category: 'Apparel',
        price: 925.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/19915586/pexels-photo-19915586.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#602992',
    date: 'Dec 26, 17:30',
    dateShort: 'Dec 26',
    status: 'Paid',
    total: 1620.00,
    trackingNumber: 'TRK-ZA-602992',
    customer: {
      fullName: 'James Miller',
      email: 'james.miller@example.com',
      phone: '+27 84 991 3820',
      avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Ryobi ONE drill/driver kit',
        category: 'Hardware',
        price: 409.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      },
      {
        title: 'Socket Systeme Electric Pack',
        category: 'Electrical',
        price: 238.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/32677219/pexels-photo-32677219.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      },
      {
        title: 'DVB-T2 receiver digital tuner',
        category: 'Electronics',
        price: 139.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      },
      {
        title: 'Inforce oil-free compressor',
        category: 'Machinery',
        price: 135.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/27381288/pexels-photo-27381288.png?auto=compress&cs=tinysrgb&h=150&w=150'
      },
      {
        title: 'TIG-200 welding inverter',
        category: 'Machinery',
        price: 699.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/27204277/pexels-photo-27204277.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#730345',
    date: 'Dec 22, 10:14',
    dateShort: 'Dec 22',
    status: 'Paid',
    total: 315.50,
    trackingNumber: 'TRK-ZA-730345',
    customer: {
      fullName: 'Travis French',
      email: 'travis.french@example.com',
      phone: '+27 82 770 1290',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Heritage ceramic mug set',
        category: 'Objects',
        price: 315.50,
        quantity: 1,
        image: 'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#126955',
    date: 'Dec 20, 18:04',
    dateShort: 'Dec 20',
    status: 'Paid',
    total: 1267.45,
    trackingNumber: 'TRK-ZA-126955',
    customer: {
      fullName: 'Ralph Hall',
      email: 'ralph.h@example.com',
      phone: '+27 83 221 0094',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Cloud-step sneakers',
        category: 'Footwear',
        price: 1267.45,
        quantity: 1,
        image: 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#045321',
    date: 'Dec 18, 08:50',
    dateShort: 'Dec 18',
    status: 'Completed',
    total: 287.00,
    trackingNumber: 'TRK-ZA-045321',
    customer: {
      fullName: 'Gary Gilbert',
      email: 'gary.gilbert@example.com',
      phone: '+27 82 901 2345',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Everyday linen pouch',
        category: 'Objects',
        price: 287.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#082848',
    date: 'Dec 17, 12:10',
    dateShort: 'Dec 17',
    status: 'Delivered',
    total: 1740.00,
    trackingNumber: 'TRK-ZA-082848',
    customer: {
      fullName: 'Frances Howell',
      email: 'frances.h@example.com',
      phone: '+27 84 330 9102',
      avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Tan leather boots',
        category: 'Footwear',
        price: 1740.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/27381288/pexels-photo-27381288.png?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#646072',
    date: 'Dec 14, 15:40',
    dateShort: 'Dec 14',
    status: 'Paid',
    total: 714.00,
    trackingNumber: 'TRK-ZA-646072',
    customer: {
      fullName: 'Herbert Boyd',
      email: 'herbert.boyd@example.com',
      phone: '+27 72 401 2293',
      avatar: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Heritage leather watch',
        category: 'Objects',
        price: 714.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#432019',
    date: 'Dec 13, 09:25',
    dateShort: 'Dec 13',
    status: 'Paid',
    total: 267.65,
    trackingNumber: 'TRK-ZA-432019',
    customer: {
      fullName: 'Alan White',
      email: 'alan.white@example.com',
      phone: '+27 83 992 1109',
      avatar: 'https://images.pexels.com/photos/937481/pexels-photo-937481.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Minimalist leather keychain',
        category: 'Objects',
        price: 267.65,
        quantity: 1,
        image: 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  },
  {
    id: '#985927',
    date: 'Dec 11, 19:15',
    dateShort: 'Dec 11',
    status: 'Delivered',
    total: 389.00,
    trackingNumber: 'TRK-ZA-985927',
    customer: {
      fullName: 'Julie Martin',
      email: 'julie.martin@example.com',
      phone: '+27 82 110 4492',
      avatar: 'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      {
        title: 'Organic cotton studio tee',
        category: 'Apparel',
        price: 389.00,
        quantity: 1,
        image: 'https://images.pexels.com/photos/19915586/pexels-photo-19915586.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      }
    ]
  }
];

// Product catalog stock state
const INITIAL_INVENTORY = [
  { id: 'prod-1', title: 'Everyday leather tote', category: 'Bags', price: 1290, stock: 34, image: 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=300&w=300' },
  { id: 'prod-2', title: 'Relaxed linen shirt', category: 'Apparel', price: 890, stock: 18, image: 'https://images.pexels.com/photos/19915586/pexels-photo-19915586.jpeg?auto=compress&cs=tinysrgb&h=300&w=300' },
  { id: 'prod-3', title: 'Cloud-step sneakers', category: 'Footwear', price: 1150, stock: 7, image: 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=300&w=300' },
  { id: 'prod-4', title: 'Heritage leather watch', category: 'Objects', price: 1890, stock: 12, image: 'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=300&w=300' },
  { id: 'prod-5', title: 'Polarised sunglasses', category: 'Objects', price: 690, stock: 45, image: 'https://images.pexels.com/photos/32677219/pexels-photo-32677219.jpeg?auto=compress&cs=tinysrgb&h=300&w=300' },
  { id: 'prod-6', title: 'Classic denim jacket', category: 'Apparel', price: 1450, stock: 9, image: 'https://images.pexels.com/photos/3649765/pexels-photo-3649765.jpeg?auto=compress&cs=tinysrgb&h=300&w=300' },
  { id: 'prod-7', title: 'Tan leather boots', category: 'Footwear', price: 1690, stock: 4, image: 'https://images.pexels.com/photos/27381288/pexels-photo-27381288.png?auto=compress&cs=tinysrgb&h=300&w=300' },
  { id: 'prod-8', title: 'Soft leather shoulder bag', category: 'Bags', price: 1590, stock: 22, image: 'https://images.pexels.com/photos/27204277/pexels-photo-27204277.jpeg?auto=compress&cs=tinysrgb&h=300&w=300' }
];

// Returns state
const INITIAL_RETURNS = [
  {
    id: 'RET-8841',
    orderId: '#390561',
    customer: 'Michelle Black',
    reason: 'Size exchange / alternative colour preference',
    refundAmount: 780.00,
    status: 'Inspection Pending',
    date: 'Jan 9, 10:14'
  },
  {
    id: 'RET-7712',
    orderId: '#418135',
    customer: 'Mildred Hall',
    reason: 'Incorrect lens specification ordered',
    refundAmount: 540.95,
    status: 'Authorised',
    date: 'Jan 7, 14:30'
  }
];

// App State
let ordersData = [];
let inventoryData = [];
let returnsData = [...INITIAL_RETURNS];
let selectedOrderId = '#390561';
let currentTab = 'orders';
let filterStatus = 'all';
let filterPrice = 'all';
let sortBy = 'date-desc';
let searchQuery = '';

/**
 * Load initial orders and synchronize with consumer store orders
 */
function loadDashboardData() {
  try {
    const rawLocal = localStorage.getItem(ORDERS_STORAGE_KEY);
    let storeOrders = [];
    if (rawLocal) {
      storeOrders = JSON.parse(rawLocal);
    }

    // Convert any consumer store orders to dashboard shape
    const formattedStoreOrders = (Array.isArray(storeOrders) ? storeOrders : []).map(o => ({
      id: o.id.startsWith('#') ? o.id : `#${o.id.replace(/^VEL-/, '')}`,
      date: o.date || 'Recent',
      dateShort: o.date ? o.date.slice(0, 6) : 'Today',
      status: o.status && o.status.includes('Confirmed') ? 'Paid' : (o.status || 'Paid'),
      total: Number(o.total) || 1290,
      trackingNumber: o.trackingNumber || `TRK-ZA-${Math.floor(100000 + Math.random() * 900000)}`,
      customer: {
        fullName: o.customer ? `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim() || o.customer.fullName || 'Valued Customer' : 'Valued Customer',
        email: (o.customer && o.customer.email) || 'client@velora.co.za',
        phone: (o.customer && o.customer.phone) || '+27 82 555 0192',
        avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      },
      items: (o.items && o.items.length > 0) ? o.items : [
        {
          title: 'Everyday leather tote',
          category: 'Bags',
          price: o.total || 1290,
          quantity: 1,
          image: 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
        }
      ]
    }));

    // Merge consumer orders with seed orders (deduplicating by ID)
    const orderMap = new Map();
    [...formattedStoreOrders, ...SEED_ORDERS].forEach(ord => {
      if (!orderMap.has(ord.id)) {
        orderMap.set(ord.id, ord);
      }
    });

    ordersData = Array.from(orderMap.values());

    // Load inventory
    const rawInv = localStorage.getItem(INVENTORY_STORAGE_KEY);
    inventoryData = rawInv ? JSON.parse(rawInv) : INITIAL_INVENTORY;
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    ordersData = SEED_ORDERS;
    inventoryData = INITIAL_INVENTORY;
  }
}

function saveOrdersData() {
  // Sync in-memory modifications
  // Also keep selected order valid
  if (!ordersData.find(o => o.id === selectedOrderId) && ordersData.length > 0) {
    selectedOrderId = ordersData[0].id;
  }
}

/**
 * Filter & Sort Orders
 */
function getFilteredOrders() {
  return ordersData.filter(order => {
    // Status filter
    if (filterStatus !== 'all' && order.status.toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }

    // Price range filter
    if (filterPrice === '100-1500') {
      if (order.total < 100 || order.total > 1500) return false;
    } else if (filterPrice === 'under-500') {
      if (order.total >= 500) return false;
    } else if (filterPrice === 'above-1500') {
      if (order.total < 1500) return false;
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchCust = order.customer.fullName.toLowerCase().includes(q);
      const matchEmail = order.customer.email.toLowerCase().includes(q);
      const matchItem = order.items.some(i => i.title.toLowerCase().includes(q));
      if (!matchId && !matchCust && !matchEmail && !matchItem) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') return b.id.localeCompare(a.id);
    if (sortBy === 'date-asc') return a.id.localeCompare(b.id);
    if (sortBy === 'total-desc') return b.total - a.total;
    if (sortBy === 'total-asc') return a.total - b.total;
    return 0;
  });
}

/**
 * Format currency with R / $
 */
function fmtPrice(val) {
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get status pill CSS class
 */
function getStatusClass(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('paid')) return 'status-paid';
  if (s.includes('deliver')) return 'status-delivered';
  if (s.includes('complete')) return 'status-completed';
  if (s.includes('transit')) return 'status-transit';
  if (s.includes('cancel')) return 'status-cancelled';
  return 'status-paid';
}

/**
 * Render KPI Cards in Dashboard
 */
function renderKPICards() {
  const kpiEl = document.getElementById('dashKPISection');
  if (!kpiEl) return;

  const totalRev = ordersData.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? o.total : 0), 0);
  const totalOrders = ordersData.length;
  const pendingOrders = ordersData.filter(o => o.status === 'Paid').length;
  const avgOrderVal = totalOrders ? totalRev / totalOrders : 0;

  kpiEl.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-header">
        <span>Total Revenue</span>
        <div class="kpi-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
      </div>
      <div class="kpi-value">${fmtPrice(totalRev)}</div>
      <div class="kpi-trend positive">
        <span>↑ +18.4%</span>
        <span style="color: var(--muted); font-weight: 400;">vs last month</span>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-header">
        <span>Total Orders</span>
        <div class="kpi-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
      </div>
      <div class="kpi-value">${totalOrders}</div>
      <div class="kpi-trend positive">
        <span>↑ +12 new</span>
        <span style="color: var(--muted); font-weight: 400;">today</span>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-header">
        <span>Orders to Fulfill</span>
        <div class="kpi-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
      </div>
      <div class="kpi-value">${pendingOrders}</div>
      <div class="kpi-trend neutral">
        <span>Dispatch ready</span>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-header">
        <span>Avg Order Value</span>
        <div class="kpi-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        </div>
      </div>
      <div class="kpi-value">${fmtPrice(avgOrderVal)}</div>
      <div class="kpi-trend positive">
        <span>↑ +6.2%</span>
        <span style="color: var(--muted); font-weight: 400;">conversion</span>
      </div>
    </div>
  `;
}

/**
 * Render Table of Orders
 */
function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  const filtered = getFilteredOrders();

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 48px; color: var(--muted);">
          <p style="font-size: 15px; margin-bottom: 8px;">No orders found matching your criteria</p>
          <button type="button" class="drawer-btn drawer-btn-dark" style="max-width: 160px; margin: 0 auto;" onclick="window.resetFilters()">
            Clear Filters
          </button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(order => {
    const isSelected = order.id === selectedOrderId;
    const statusClass = getStatusClass(order.status);

    return `
      <tr class="${isSelected ? 'selected' : ''}" data-order-id="${order.id}">
        <td class="select-col">
          <input type="checkbox" class="dash-checkbox row-select-checkbox" ${isSelected ? 'checked' : ''} data-order-id="${order.id}">
        </td>
        <td class="order-id-cell">${order.id}</td>
        <td>
          <div class="customer-cell">
            <img class="customer-avatar" src="${order.customer.avatar}" alt="${order.customer.fullName}">
            <span class="customer-name">${order.customer.fullName}</span>
          </div>
        </td>
        <td>
          <span class="status-pill ${statusClass}">${order.status}</span>
        </td>
        <td class="order-total-cell">${fmtPrice(order.total)}</td>
        <td class="order-date-cell">${order.dateShort || order.date}</td>
        <td>
          <button type="button" class="action-dots-btn" title="Quick Options" data-order-id="${order.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="2"></circle>
              <circle cx="19" cy="12" r="2"></circle>
              <circle cx="5" cy="12" r="2"></circle>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Render Right Side Order Inspection Drawer
 */
function renderOrderDrawer() {
  const drawer = document.getElementById('orderDetailDrawer');
  if (!drawer) return;

  const order = ordersData.find(o => o.id === selectedOrderId) || ordersData[0];
  if (!order) {
    drawer.innerHTML = `
      <div style="padding: 40px; text-align: center; color: var(--muted);">
        Select an order to inspect full line items and logistics details.
      </div>
    `;
    return;
  }

  const statusClass = getStatusClass(order.status);

  drawer.innerHTML = `
    <!-- Drawer Header -->
    <div class="drawer-header">
      <div class="drawer-title-group">
        <h2 class="drawer-order-id">Order ${order.id}</h2>
        <div class="drawer-status-line">
          <span class="status-pill ${statusClass}">${order.status}</span>
          <span>${order.date}</span>
        </div>
      </div>
      <button type="button" class="drawer-close-btn" id="closeDrawerBtn" title="Close Panel">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Customer Card -->
    <div class="drawer-customer-card">
      <img class="drawer-customer-avatar" src="${order.customer.avatar}" alt="${order.customer.fullName}">
      <div class="drawer-customer-name">${order.customer.fullName}</div>
      <div class="drawer-contact-actions">
        <a href="mailto:${order.customer.email}" class="contact-action-btn" title="Send Email">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
        </a>
        <a href="tel:${order.customer.phone}" class="contact-action-btn" title="Call Customer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </a>
        <button type="button" class="contact-action-btn" title="Message via WhatsApp" onclick="window.alert('Opening client conversation channel...')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Order Items List -->
    <div class="drawer-items-section">
      <h3 class="drawer-section-heading">Order items</h3>
      <div class="drawer-items-list">
        ${order.items.map(item => `
          <div class="drawer-item-row">
            <img class="drawer-item-thumb" src="${item.image || 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'}" alt="${item.title}">
            <div class="drawer-item-info">
              <div class="drawer-item-title">${item.title}</div>
              <p class="drawer-item-sub">Qty: ${item.quantity || 1} &bull; ${item.category || 'Velora Goods'}</p>
            </div>
            <div class="drawer-item-price">${fmtPrice(item.price)}</div>
          </div>
        `).join('')}
      </div>

      <!-- Quick Delivery / Logistics Note -->
      <div style="margin-top: 20px; padding: 12px 14px; background: var(--dash-bg); border-radius: 10px; font-size: 12px; color: var(--ink); line-height: 1.5;">
        <div style="font-weight: 600; margin-bottom: 2px;">Velora Logistics Waybill</div>
        <div style="color: var(--muted); font-weight: 500; letter-spacing: 0.04em;">${order.trackingNumber}</div>
      </div>
    </div>

    <!-- Drawer Footer Actions -->
    <div class="drawer-footer">
      <div class="drawer-total-row">
        <span class="drawer-total-label">Total</span>
        <span class="drawer-total-amount">${fmtPrice(order.total)}</span>
      </div>
      <div class="drawer-actions-row">
        <button type="button" class="drawer-btn drawer-btn-dark" id="btnTrackOrder" data-id="${order.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Track 👁️
        </button>
        <button type="button" class="drawer-btn drawer-btn-accent" id="btnRefundOrder" data-id="${order.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          Refund ↶
        </button>
      </div>
    </div>
  `;

  // Attach drawer events
  const closeBtn = document.getElementById('closeDrawerBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeOrderDrawer();
    });
  }

  const trackBtn = document.getElementById('btnTrackOrder');
  if (trackBtn) {
    trackBtn.addEventListener('click', () => {
      window.open(`../orders.html?orderId=${encodeURIComponent(order.id)}`, '_blank');
    });
  }

  const refundBtn = document.getElementById('btnRefundOrder');
  if (refundBtn) {
    refundBtn.addEventListener('click', () => {
      if (confirm(`Process a refund of ${fmtPrice(order.total)} for Order ${order.id}?`)) {
        order.status = 'Cancelled';
        saveOrdersData();
        renderOrdersTable();
        renderOrderDrawer();
        renderKPICards();
      }
    });
  }
}

/**
 * Render Inventory Products View
 */
function renderInventoryView() {
  const container = document.getElementById('inventoryContentContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h3 style="margin: 0 0 4px; font-size: 18px; font-weight: 700;">Catalog & Stock Inventory</h3>
        <p style="margin: 0; color: var(--muted); font-size: 13px;">Manage real-time product availability across online and studio stock.</p>
      </div>
      <button type="button" class="drawer-btn drawer-btn-dark" style="flex: initial; padding: 10px 20px;" onclick="window.openNewProductModal()">
        ＋ Add New Product
      </button>
    </div>

    <div class="product-inventory-grid">
      ${inventoryData.map(p => `
        <div class="product-manage-card">
          <img class="product-manage-img" src="${p.image}" alt="${p.title}">
          <div class="product-manage-body">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h4 class="product-manage-title">${p.title}</h4>
              <span class="stock-tag ${p.stock > 10 ? 'stock-in' : 'stock-low'}">
                ${p.stock > 10 ? `${p.stock} in stock` : `Low: ${p.stock} left`}
              </span>
            </div>
            <div class="product-manage-meta">
              <span>Category: ${p.category}</span>
              <span class="product-manage-price">${fmtPrice(p.price)}</span>
            </div>
            <div style="margin-top: 10px; display: flex; gap: 8px;">
              <button type="button" class="action-icon-btn" style="flex: 1; height: 32px; font-size: 12px; font-weight: 600;" onclick="window.adjustStock('${p.id}', 5)">
                ＋ Restock 5
              </button>
              <button type="button" class="action-icon-btn" style="height: 32px; width: 32px;" onclick="window.adjustStock('${p.id}', -1)">
                －
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Global helper methods attached to window
 */
window.resetFilters = function() {
  filterStatus = 'all';
  filterPrice = 'all';
  searchQuery = '';
  document.getElementById('statusFilterSelect').value = 'all';
  document.getElementById('priceFilterSelect').value = 'all';
  document.getElementById('orderSearchInput').value = '';
  renderOrdersTable();
};

window.adjustStock = function(prodId, delta) {
  const item = inventoryData.find(p => p.id === prodId);
  if (item) {
    item.stock = Math.max(0, item.stock + delta);
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryData));
    renderInventoryView();
  }
};

window.openNewProductModal = function() {
  const modal = document.getElementById('newProductModal');
  if (modal) modal.classList.add('open');
};

window.closeNewProductModal = function() {
  const modal = document.getElementById('newProductModal');
  if (modal) modal.classList.remove('open');
};

/**
 * Render Dashboard Overview View
 */
function renderOverviewView() {
  const kpiEl = document.getElementById('dashOverviewKPISection');
  if (kpiEl) {
    const totalRev = ordersData.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? o.total : 0), 0);
    const totalOrders = ordersData.length;
    const pendingOrders = ordersData.filter(o => o.status === 'Paid').length;
    const avgOrderVal = totalOrders ? totalRev / totalOrders : 0;

    kpiEl.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-header">
          <span>Total Revenue</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${fmtPrice(totalRev)}</div>
        <div class="kpi-trend positive">
          <span>↑ +18.4%</span>
          <span style="color: var(--muted); font-weight: 400;">vs last month</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>Total Orders</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${totalOrders}</div>
        <div class="kpi-trend positive">
          <span>↑ +12 new</span>
          <span style="color: var(--muted); font-weight: 400;">today</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>Active Returns</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${returnsData.length}</div>
        <div class="kpi-trend neutral">
          <span>Awaiting action</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>Average Basket</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${fmtPrice(avgOrderVal)}</div>
        <div class="kpi-trend positive">
          <span>↑ +6.2%</span>
          <span style="color: var(--muted); font-weight: 400;">conversion</span>
        </div>
      </div>
    `;
  }

  const recentsTbody = document.getElementById('overviewRecentOrdersBody');
  if (recentsTbody) {
    const recents = ordersData.slice(0, 5);
    recentsTbody.innerHTML = recents.map(order => {
      const statusClass = getStatusClass(order.status);
      return `
        <tr style="cursor: pointer;" onclick="window.selectAndOpenOrder('${order.id}')">
          <td class="select-col">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${order.status === 'Paid' ? '#10b981' : '#6b7280'};"></span>
          </td>
          <td class="order-id-cell">${order.id}</td>
          <td>
            <div class="customer-cell">
              <img class="customer-avatar" src="${order.customer.avatar}" alt="${order.customer.fullName}">
              <span class="customer-name">${order.customer.fullName}</span>
            </div>
          </td>
          <td><span class="status-pill ${statusClass}">${order.status}</span></td>
          <td class="order-total-cell">${fmtPrice(order.total)}</td>
          <td class="order-date-cell">${order.dateShort || order.date}</td>
        </tr>
      `;
    }).join('');
  }
}

/**
 * Render Returns Section View
 */
function renderReturnsView() {
  const kpiEl = document.getElementById('returnsKPISection');
  if (kpiEl) {
    const totalPendingRefund = returnsData.reduce((acc, r) => acc + r.refundAmount, 0);
    kpiEl.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-header">
          <span>Pending Return Requests</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${returnsData.length}</div>
        <div class="kpi-trend neutral"><span>In review queue</span></div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>Estimated Return Value</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${fmtPrice(totalPendingRefund)}</div>
        <div class="kpi-trend neutral"><span>Potential refunds</span></div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>Return Resolution Rate</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
        <div class="kpi-value">98.4%</div>
        <div class="kpi-trend positive"><span>Within 24h SLA</span></div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>Store Return Rate</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M16 12l-4-4-4 4"></path>
            </svg>
          </div>
        </div>
        <div class="kpi-value">0.8%</div>
        <div class="kpi-trend positive"><span>Low industry benchmark</span></div>
      </div>
    `;
  }

  const tbody = document.getElementById('returnsTableBody');
  if (!tbody) return;

  if (returnsData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--muted);">
          No pending returns or refund disputes recorded.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = returnsData.map(ret => `
    <tr>
      <td style="font-weight: 700; letter-spacing: 0.04em; color: var(--ink);">${ret.id}</td>
      <td>
        <button type="button" class="drawer-btn drawer-btn-dark" style="flex: initial; padding: 4px 10px; font-size: 11.5px;" onclick="window.selectAndOpenOrder('${ret.orderId}')">
          ${ret.orderId} ↗
        </button>
      </td>
      <td><strong>${ret.customer}</strong></td>
      <td style="color: var(--muted); font-size: 12.5px; max-width: 260px;">${ret.reason}</td>
      <td style="font-weight: 700;">${fmtPrice(ret.refundAmount)}</td>
      <td>
        <span class="status-pill ${ret.status === 'Authorised' ? 'status-delivered' : 'status-paid'}">${ret.status}</span>
      </td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="drawer-btn drawer-btn-accent" style="flex: initial; padding: 5px 10px; font-size: 11.5px;" onclick="window.processReturnRefund('${ret.id}')">
            Approve Refund
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Tab Navigation
 */
function switchTab(tabId) {
  currentTab = tabId;

  // Nav items highlight
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Views toggle
  const overviewView = document.getElementById('overviewMainView');
  const ordersView = document.getElementById('ordersMainView');
  const returnsView = document.getElementById('returnsMainView');
  const inventoryView = document.getElementById('inventoryMainView');
  const topbarTitle = document.getElementById('currentViewTitle');
  const filterBar = document.getElementById('mainFilterBar');

  if (overviewView) overviewView.style.display = tabId === 'dashboard' ? 'block' : 'none';
  if (ordersView) ordersView.style.display = tabId === 'orders' ? 'block' : 'none';
  if (returnsView) returnsView.style.display = tabId === 'returns' ? 'block' : 'none';
  if (inventoryView) inventoryView.style.display = tabId === 'inventory' ? 'block' : 'none';

  if (filterBar) {
    filterBar.style.display = tabId === 'orders' ? 'flex' : 'none';
  }

  if (topbarTitle) {
    if (tabId === 'dashboard') topbarTitle.textContent = 'Store Overview';
    else if (tabId === 'orders') topbarTitle.textContent = 'Orders';
    else if (tabId === 'returns') topbarTitle.textContent = 'Returns & Exchanges';
    else if (tabId === 'inventory') topbarTitle.textContent = 'Catalog & Stock';
    else if (tabId === 'customers') topbarTitle.textContent = 'Client Registry';
    else topbarTitle.textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1);
  }

  if (tabId === 'dashboard') {
    renderOverviewView();
  } else if (tabId === 'returns') {
    renderReturnsView();
  } else if (tabId === 'inventory') {
    renderInventoryView();
  }
}

window.switchTab = switchTab;

function openOrderDrawer(orderId) {
  if (orderId) {
    selectedOrderId = orderId;
  }
  renderOrderDrawer();
  const drawer = document.getElementById('orderDetailDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) {
    drawer.classList.add('open');
  }
  if (backdrop) {
    backdrop.classList.add('active');
  }
}

function closeOrderDrawer() {
  const drawer = document.getElementById('orderDetailDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) {
    drawer.classList.remove('open');
  }
  if (backdrop) {
    backdrop.classList.remove('active');
  }
}

window.openOrderDrawer = openOrderDrawer;
window.closeOrderDrawer = closeOrderDrawer;

window.selectAndOpenOrder = function(orderId) {
  selectedOrderId = orderId;
  switchTab('orders');
  renderOrdersTable();
  openOrderDrawer(orderId);
};

window.filterToStatus = function(status) {
  switchTab('orders');
  filterStatus = status;
  const select = document.getElementById('statusFilterSelect');
  if (select) select.value = status;
  renderOrdersTable();
};

window.processReturnRefund = function(returnId) {
  const ret = returnsData.find(r => r.id === returnId);
  if (!ret) return;
  if (confirm(`Approve and process refund of ${fmtPrice(ret.refundAmount)} for Return ${ret.id} (Order ${ret.orderId})?`)) {
    ret.status = 'Authorised';
    const ord = ordersData.find(o => o.id === ret.orderId);
    if (ord) {
      ord.status = 'Cancelled';
      saveOrdersData();
    }
    renderReturnsView();
    renderKPICards();
    renderOrdersTable();
    renderOrderDrawer();
  }
};

/**
 * Event Bindings
 */
function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Filter selects
  const statusSelect = document.getElementById('statusFilterSelect');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      renderOrdersTable();
    });
  }

  const priceSelect = document.getElementById('priceFilterSelect');
  if (priceSelect) {
    priceSelect.addEventListener('change', (e) => {
      filterPrice = e.target.value;
      renderOrdersTable();
    });
  }

  const sortSelect = document.getElementById('sortFilterSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderOrdersTable();
    });
  }

  // Search input
  const searchInput = document.getElementById('orderSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderOrdersTable();
    });
  }

  // Table row click to select and open drawer ONLY when an order row is clicked
  const tbody = document.getElementById('ordersTableBody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      // Ignore clicks directly on checkbox or action dots
      if (e.target.closest('.row-select-checkbox') || e.target.closest('.action-dots-btn')) {
        return;
      }

      const row = e.target.closest('tr[data-order-id]');
      if (!row) return;

      const orderId = row.getAttribute('data-order-id');
      selectedOrderId = orderId;

      // Update selection UI
      document.querySelectorAll('#ordersTableBody tr').forEach(r => r.classList.remove('selected'));
      document.querySelectorAll('.row-select-checkbox').forEach(cb => cb.checked = false);

      row.classList.add('selected');
      const cb = row.querySelector('.row-select-checkbox');
      if (cb) cb.checked = true;

      // Open drawer on demand
      openOrderDrawer(orderId);
    });
  }

  // Backdrop click to close drawer
  const backdrop = document.getElementById('drawerBackdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeOrderDrawer();
    });
  }

  // Escape key to close drawer or modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOrderDrawer();
      window.closeNewProductModal();
    }
  });

  // Select all checkbox
  const selectAllCb = document.getElementById('selectAllOrders');
  if (selectAllCb) {
    selectAllCb.addEventListener('change', (e) => {
      const checked = e.target.checked;
      document.querySelectorAll('.row-select-checkbox').forEach(cb => {
        cb.checked = checked;
      });
    });
  }

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.querySelector('.dashboard-sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // New product form
  const addProdForm = document.getElementById('newProductForm');
  if (addProdForm) {
    addProdForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('newProdTitle').value;
      const price = parseFloat(document.getElementById('newProdPrice').value) || 990;
      const category = document.getElementById('newProdCategory').value;
      const stock = parseInt(document.getElementById('newProdStock').value, 10) || 10;
      const image = document.getElementById('newProdImage').value || 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=300&w=300';

      inventoryData.unshift({
        id: `prod-${Date.now()}`,
        title,
        price,
        category,
        stock,
        image
      });

      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryData));
      window.closeNewProductModal();
      addProdForm.reset();
      renderInventoryView();
    });
  }
}

// Auto bootstrap on DOM load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  renderKPICards();
  renderOrdersTable();
  setupEventListeners();
  // Notice: The inspection drawer is kept closed on initial dashboard load.
  // It only opens when an order is clicked.
});
