window.STORAGE_KEYS = {
  ORDERS: 'velora_orders_history',
  INVENTORY: 'velora_inventory_state',
  RETURNS: 'velora_returns_state',
  CUSTOMERS: 'velora_customers_state',
  PAYMENTS: 'velora_payments_state',
  NOTIFICATIONS: 'velora_notifications_state',
  SETTINGS: 'velora_settings_state',
  COUNTRY: 'velora_admin_country',
  AUTH_USER: 'velora_admin_user'
};

// Safe offline and fallback SVG image generators (Zero external network dependencies)
window.createInitialsAvatarSvg = function(name) {
  const initials = (name || 'V').split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'V';
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23232030'/%3E%3Ctext x='40' y='46' fill='%23c9a57a' font-size='24' font-weight='600' text-anchor='middle' font-family='sans-serif'%3E${initials}%3C/text%3E%3C/svg%3E`;
};

window.createProductFallbackSvg = function(title) {
  const initial = (title || 'P').charAt(0).toUpperCase();
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='10' fill='%23232030'/%3E%3Ctext x='40' y='46' fill='%23c9a57a' font-size='26' font-weight='600' text-anchor='middle' font-family='sans-serif'%3E${initial}%3C/text%3E%3C/svg%3E`;
};

// Seed dataset
const INITIAL_ORDERS = [
  {
    id: '#390561',
    date: '2026-04-12 14:32',
    dateShort: 'Apr 12, 14:32',
    status: 'Paid',
    total: 3450.00,
    customer: {
      fullName: 'Michelle Black',
      email: 'michelle.black@domain.co.za',
      phone: '+27 82 459 1024',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      { id: 1, title: 'Everyday leather tote', category: 'Bags', price: 1250.00, qty: 1, img: 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=100&w=100' },
      { id: 2, title: 'Minimalist leather belt', category: 'Accessories', price: 450.00, qty: 1, img: 'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=100&w=100' },
      { id: 3, title: 'Studio wool overcoat', category: 'Apparel', price: 1750.00, qty: 1, img: 'https://images.pexels.com/photos/32677219/pexels-photo-32677219.jpeg?auto=compress&cs=tinysrgb&h=100&w=100' }
    ],
    waybill: 'ZA-JHB-892011'
  },
  {
    id: '#390560',
    date: '2026-04-12 11:15',
    dateShort: 'Apr 12, 11:15',
    status: 'In-Transit',
    total: 1250.00,
    customer: {
      fullName: 'Pieter van der Merwe',
      email: 'pieter.vdm@netactive.co.za',
      phone: '+27 83 291 0044',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      { id: 1, title: 'Everyday leather tote', category: 'Bags', price: 1250.00, qty: 1, img: 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=100&w=100' }
    ],
    waybill: 'ZA-CPT-339210'
  },
  {
    id: '#390559',
    date: '2026-04-11 16:45',
    dateShort: 'Apr 11, 16:45',
    status: 'Delivered',
    total: 890.00,
    customer: {
      fullName: 'Nomvula Sithole',
      email: 'nomvula.s@vodamail.co.za',
      phone: '+27 71 884 9201',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      { id: 4, title: 'Raw ceramic vessel', category: 'Objects', price: 890.00, qty: 1, img: 'https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&h=100&w=100' }
    ],
    waybill: 'ZA-DBN-449102'
  },
  {
    id: '#390558',
    date: '2026-04-11 09:20',
    dateShort: 'Apr 11, 09:20',
    status: 'Paid',
    total: 2150.00,
    customer: {
      fullName: 'Keagan Pillay',
      email: 'k.pillay@creative.co.za',
      phone: '+27 84 551 2289',
      avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      { id: 5, title: 'Architectural desk lamp', category: 'Objects', price: 2150.00, qty: 1, img: 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&h=100&w=100' }
    ],
    waybill: 'ZA-PTA-192003'
  },
  {
    id: '#390557',
    date: '2026-04-10 18:02',
    dateShort: 'Apr 10, 18:02',
    status: 'Cancelled',
    total: 450.00,
    customer: {
      fullName: 'Lara Croft-Mthembu',
      email: 'lara.m@safari.com',
      phone: '+27 82 990 1234',
      avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
    },
    items: [
      { id: 2, title: 'Minimalist leather belt', category: 'Accessories', price: 450.00, qty: 1, img: 'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=100&w=100' }
    ],
    waybill: 'ZA-CAN-000000'
  }
];

const INITIAL_INVENTORY = [];

const INITIAL_RETURNS = [
  { id: 'RET-0981', orderId: '#390557', customer: 'Lara Croft-Mthembu', reason: 'Size too small, requested return before shipment', refundAmount: 450.00, status: 'Authorised' },
  { id: 'RET-0982', orderId: '#390560', customer: 'Pieter van der Merwe', reason: 'Duplicate purchase by family member', refundAmount: 1250.00, status: 'Under Review' }
];

const INITIAL_CUSTOMERS = [
  { id: 'CUST-001', name: 'Michelle Black', email: 'michelle.black@domain.co.za', phone: '+27 82 459 1024', city: 'Johannesburg, GP', tier: 'VIP Privilege', totalOrders: 6, lifetimeSpend: 14890.00, lastActive: 'Today, 14:32', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&h=150&w=150' },
  { id: 'CUST-002', name: 'Pieter van der Merwe', email: 'pieter.vdm@netactive.co.za', phone: '+27 83 291 0044', city: 'Cape Town, WC', tier: 'Gold Member', totalOrders: 3, lifetimeSpend: 4720.00, lastActive: 'Today, 11:15', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=150&w=150' },
  { id: 'CUST-003', name: 'Nomvula Sithole', email: 'nomvula.s@vodamail.co.za', phone: '+27 71 884 9201', city: 'Durban, KZN', tier: 'Standard', totalOrders: 2, lifetimeSpend: 1890.00, lastActive: 'Yesterday', avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&h=150&w=150' },
  { id: 'CUST-004', name: 'Keagan Pillay', email: 'k.pillay@creative.co.za', phone: '+27 84 551 2289', city: 'Pretoria, GP', tier: 'Gold Member', totalOrders: 4, lifetimeSpend: 6850.00, lastActive: 'Apr 11', avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&h=150&w=150' },
  { id: 'CUST-005', name: 'Lara Croft-Mthembu', email: 'lara.m@safari.com', phone: '+27 82 990 1234', city: 'Sandton, GP', tier: 'Standard', totalOrders: 1, lifetimeSpend: 450.00, lastActive: 'Apr 10', avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&h=150&w=150' }
];

const INITIAL_PAYMENTS = [
  { ref: 'PAY-ZA-8902', orderId: '#390561', customer: 'Michelle Black', gateway: 'Ozow Instant EFT', grossAmount: 3450.00, fee: 51.75, netAmount: 3398.25, timestamp: '12 Apr, 14:32', status: 'Settled', bank: 'Standard Bank of SA' },
  { ref: 'PAY-ZA-8901', orderId: '#390560', customer: 'Pieter van der Merwe', gateway: 'SnapScan', grossAmount: 1250.00, fee: 35.00, netAmount: 1215.00, timestamp: '12 Apr, 11:15', status: 'Settled', bank: 'First National Bank' },
  { ref: 'PAY-ZA-8900', orderId: '#390559', customer: 'Nomvula Sithole', gateway: 'Visa / Mastercard', grossAmount: 890.00, fee: 26.70, netAmount: 863.30, timestamp: '11 Apr, 16:45', status: 'Settled', bank: 'Nedbank' },
  { ref: 'PAY-ZA-8899', orderId: '#390558', customer: 'Keagan Pillay', gateway: 'Apple Pay', grossAmount: 2150.00, fee: 58.05, netAmount: 2091.95, timestamp: '11 Apr, 09:20', status: 'Settled', bank: 'Investec Private Bank' },
  { ref: 'PAY-ZA-8898', orderId: '#390557', customer: 'Lara Croft-Mthembu', gateway: 'Ozow Instant EFT', grossAmount: 450.00, fee: 6.75, netAmount: 443.25, timestamp: '10 Apr, 18:02', status: 'Refunded', bank: 'ABSA Bank' }
];

const INITIAL_NOTIFICATIONS = [
  { id: 'notif-1', type: 'order', icon: '🛒', title: 'New Express Order #390561', description: 'Michelle Black placed an order for 3 items. Pending courier dispatch.', time: '8m ago', unread: true, actionTab: 'orders', orderId: '#390561' },
  { id: 'notif-2', type: 'stock', icon: '⚠️', title: 'Low Stock Alert: Ryobi ONE Drill', description: 'Warehouse inventory is down to 3 units remaining.', time: '24m ago', unread: true, actionTab: 'inventory' },
  { id: 'notif-3', type: 'order', icon: '🚚', title: 'Courier Dispatched #390560', description: 'Waybill ZA-CPT-339210 scanned by Velora Fleet Logistics.', time: '2h ago', unread: true, actionTab: 'orders', orderId: '#390560' },
  { id: 'notif-4', type: 'refund', icon: '↶', title: 'Return Authorization Requested', description: 'Return RET-0982 submitted for Order #390560.', time: '3h ago', unread: false, actionTab: 'returns' }
];

// Helper to load or initialize from localStorage
function loadStorage(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    console.error(`Failed to load ${key}`, e);
    return defaultVal;
  }
}

function saveStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed to save ${key}`, e);
  }
}

const INITIAL_SETTINGS = {
  storeName: 'VELORA E-Commerce Studio',
  supportEmail: 'studio@velora.co.za',
  phone: '+27 11 883 0000',
  address: 'Nelson Mandela Square, Sandton, Johannesburg, 2196, South Africa',
  currency: 'ZAR',
  vatRate: 15,
  vatNumber: '4890284910',
  invoicePrefix: 'VEL-ZA-',
  vatInclusive: true,
  gatewayOzow: true,
  gatewaySnapScan: true,
  gatewayCards: true,
  gatewayApplePay: true,
  courierPartner: 'The Courier Guy',
  standardShipping: 150,
  expressShipping: 280,
  freeShippingThreshold: 1500,
  lowStockThreshold: 5,
  autoDraftWaybill: 'enabled',
  sessionTimeout: '60'
};

// Global active states
window.ordersData = loadStorage(window.STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
window.inventoryData = loadStorage(window.STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY);
if (Array.isArray(window.inventoryData)) {
  window.inventoryData = window.inventoryData.filter(item => {
    if (!item) return false;
    const isMock = typeof item.id === 'string' && /^prod-[1-6]$/.test(item.id);
    return !isMock;
  });
}
window.returnsData = loadStorage(window.STORAGE_KEYS.RETURNS, INITIAL_RETURNS);
window.customersData = loadStorage(window.STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
window.paymentsData = loadStorage(window.STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
window.notificationsData = loadStorage(window.STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
window.settingsData = loadStorage(window.STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);

window.saveOrders = () => saveStorage(window.STORAGE_KEYS.ORDERS, window.ordersData);
window.saveInventory = () => saveStorage(window.STORAGE_KEYS.INVENTORY, window.inventoryData);
window.saveReturns = () => saveStorage(window.STORAGE_KEYS.RETURNS, window.returnsData);
window.saveCustomers = () => saveStorage(window.STORAGE_KEYS.CUSTOMERS, window.customersData);
window.savePayments = () => saveStorage(window.STORAGE_KEYS.PAYMENTS, window.paymentsData);
window.saveNotifications = () => saveStorage(window.STORAGE_KEYS.NOTIFICATIONS, window.notificationsData);
window.saveSettings = () => saveStorage(window.STORAGE_KEYS.SETTINGS, window.settingsData);
