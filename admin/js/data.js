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
const INITIAL_ORDERS = [];

const INITIAL_INVENTORY = [];

const INITIAL_RETURNS = [
  { id: 'RET-0981', orderId: '#390557', customer: 'Lara Croft-Mthembu', reason: 'Size too small, requested return before shipment', refundAmount: 450.00, status: 'Authorised' },
  { id: 'RET-0982', orderId: '#390560', customer: 'Pieter van der Merwe', reason: 'Duplicate purchase by family member', refundAmount: 1250.00, status: 'Under Review' }
];

const INITIAL_CUSTOMERS = [];

const INITIAL_PAYMENTS = [
  { ref: 'PAY-ZA-8902', orderId: '#390561', customer: 'Michelle Black', gateway: 'Ozow Instant EFT', grossAmount: 3450.00, fee: 51.75, netAmount: 3398.25, timestamp: '12 Apr, 14:32', status: 'Settled', bank: 'Standard Bank of SA' },
  { ref: 'PAY-ZA-8901', orderId: '#390560', customer: 'Pieter van der Merwe', gateway: 'SnapScan', grossAmount: 1250.00, fee: 35.00, netAmount: 1215.00, timestamp: '12 Apr, 11:15', status: 'Settled', bank: 'First National Bank' },
  { ref: 'PAY-ZA-8900', orderId: '#390559', customer: 'Nomvula Sithole', gateway: 'Visa / Mastercard', grossAmount: 890.00, fee: 26.70, netAmount: 863.30, timestamp: '11 Apr, 16:45', status: 'Settled', bank: 'Nedbank' },
  { ref: 'PAY-ZA-8899', orderId: '#390558', customer: 'Keagan Pillay', gateway: 'Apple Pay', grossAmount: 2150.00, fee: 58.05, netAmount: 2091.95, timestamp: '11 Apr, 09:20', status: 'Settled', bank: 'Investec Private Bank' },
  { ref: 'PAY-ZA-8898', orderId: '#390557', customer: 'Lara Croft-Mthembu', gateway: 'Ozow Instant EFT', grossAmount: 450.00, fee: 6.75, netAmount: 443.25, timestamp: '10 Apr, 18:02', status: 'Refunded', bank: 'ABSA Bank' }
];

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
if (Array.isArray(window.ordersData)) {
  window.ordersData = window.ordersData.filter(order => {
    if (!order) return false;
    const isMockId = typeof order.id === 'string' && /^#?39055[7-9]|^#?39056[0-1]/.test(order.id);
    const isMockEmail = order.customer && order.customer.email && (
      order.customer.email.includes('michelle.black') ||
      order.customer.email.includes('pieter.vdm') ||
      order.customer.email.includes('nomvula.s') ||
      order.customer.email.includes('k.pillay') ||
      order.customer.email.includes('lara.m')
    );
    return !isMockId && !isMockEmail;
  });
}
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
if (Array.isArray(window.customersData)) {
  window.customersData = window.customersData.filter(cust => {
    if (!cust) return false;
    const isMock = typeof cust.id === 'string' && /^CUST-00[1-5]$/.test(cust.id);
    const isMockEmail = cust.email && (
      cust.email.includes('michelle.black') ||
      cust.email.includes('pieter.vdm') ||
      cust.email.includes('nomvula.s') ||
      cust.email.includes('k.pillay') ||
      cust.email.includes('lara.m')
    );
    return !isMock && !isMockEmail;
  });
}
window.paymentsData = loadStorage(window.STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
window.settingsData = loadStorage(window.STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);

window.saveOrders = () => saveStorage(window.STORAGE_KEYS.ORDERS, window.ordersData);
window.saveInventory = () => saveStorage(window.STORAGE_KEYS.INVENTORY, window.inventoryData);
window.saveReturns = () => saveStorage(window.STORAGE_KEYS.RETURNS, window.returnsData);
window.saveCustomers = () => saveStorage(window.STORAGE_KEYS.CUSTOMERS, window.customersData);
window.savePayments = () => saveStorage(window.STORAGE_KEYS.PAYMENTS, window.paymentsData);
window.saveSettings = () => saveStorage(window.STORAGE_KEYS.SETTINGS, window.settingsData);
