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

// Seed Customers (South African luxury e-commerce client base)
const INITIAL_CUSTOMERS = [
  {
    id: 'CUST-001',
    name: 'Michelle Black',
    email: 'michelle.b@example.com',
    phone: '+27 82 441 9021',
    city: 'Sandton, Johannesburg',
    tier: 'VIP Privilege',
    totalOrders: 5,
    lifetimeSpend: 4850.00,
    lastActive: 'Jan 8, 2026',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    id: 'CUST-002',
    name: 'Janice Chandler',
    email: 'janice.c@example.com',
    phone: '+27 83 912 4001',
    city: 'Camps Bay, Cape Town',
    tier: 'VIP Privilege',
    totalOrders: 8,
    lifetimeSpend: 12400.00,
    lastActive: 'Jan 6, 2026',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    id: 'CUST-003',
    name: 'Mildred Hall',
    email: 'mildred.hall@example.com',
    phone: '+27 71 882 1092',
    city: 'Umhlanga, Durban',
    tier: 'Gold Member',
    totalOrders: 3,
    lifetimeSpend: 2150.00,
    lastActive: 'Jan 5, 2026',
    avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    id: 'CUST-004',
    name: 'David Miller',
    email: 'david.m@example.com',
    phone: '+27 82 110 9348',
    city: 'Waterkloof, Pretoria',
    tier: 'Standard',
    totalOrders: 2,
    lifetimeSpend: 1420.00,
    lastActive: 'Jan 2, 2026',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    id: 'CUST-005',
    name: 'Ronald Young',
    email: 'ronald.y@example.com',
    phone: '+27 79 332 1009',
    city: 'Stellenbosch, WC',
    tier: 'Gold Member',
    totalOrders: 4,
    lifetimeSpend: 3890.00,
    lastActive: 'Dec 29, 2025',
    avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    id: 'CUST-006',
    name: 'Arthur Turner',
    email: 'arthur.t@example.com',
    phone: '+27 84 892 4192',
    city: 'Morningside, Sandton',
    tier: 'VIP Privilege',
    totalOrders: 7,
    lifetimeSpend: 9350.00,
    lastActive: 'Dec 28, 2025',
    avatar: 'https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    id: 'CUST-007',
    name: 'Gary Gilbert',
    email: 'gary.gilbert@example.com',
    phone: '+27 82 901 2345',
    city: 'Gqeberha, EC',
    tier: 'Standard',
    totalOrders: 1,
    lifetimeSpend: 287.00,
    lastActive: 'Dec 18, 2025',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    id: 'CUST-008',
    name: 'Frances Howell',
    email: 'frances.h@example.com',
    phone: '+27 84 330 9102',
    city: 'Centurion, GP',
    tier: 'VIP Privilege',
    totalOrders: 6,
    lifetimeSpend: 8740.00,
    lastActive: 'Dec 17, 2025',
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    id: 'CUST-009',
    name: 'Herbert Boyd',
    email: 'herbert.boyd@example.com',
    phone: '+27 72 401 2293',
    city: 'Bloemfontein, FS',
    tier: 'Standard',
    totalOrders: 2,
    lifetimeSpend: 1428.00,
    lastActive: 'Dec 14, 2025',
    avatar: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    id: 'CUST-010',
    name: 'Siyabonga Ndlovu',
    email: 'siyabonga.n@example.com',
    phone: '+27 82 770 1928',
    city: 'Rosebank, Johannesburg',
    tier: 'Gold Member',
    totalOrders: 3,
    lifetimeSpend: 3200.00,
    lastActive: 'Dec 12, 2025',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    id: 'CUST-011',
    name: 'Lerato Khumalo',
    email: 'lerato.k@example.com',
    phone: '+27 83 451 0982',
    city: 'Kirstenbosch, Cape Town',
    tier: 'VIP Privilege',
    totalOrders: 9,
    lifetimeSpend: 15600.00,
    lastActive: 'Dec 10, 2025',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    id: 'CUST-012',
    name: 'Thabo Mokoena',
    email: 'thabo.m@example.com',
    phone: '+27 71 300 4819',
    city: 'Midrand, GP',
    tier: 'Standard',
    totalOrders: 1,
    lifetimeSpend: 850.00,
    lastActive: 'Dec 08, 2025',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  }
];

// Seed Payments (South African ZAR payment transactions)
const INITIAL_PAYMENTS = [
  {
    ref: 'PAY-ZA-90181',
    orderId: '#390561',
    customer: 'Michelle Black',
    gateway: 'Ozow Instant EFT',
    grossAmount: 780.00,
    fee: 15.60,
    netAmount: 764.40,
    timestamp: 'Jan 8, 13:52',
    status: 'Settled',
    settlementBank: 'Standard Bank (ZA)'
  },
  {
    ref: 'PAY-ZA-90182',
    orderId: '#663334',
    customer: 'Janice Chandler',
    gateway: 'SnapScan',
    grossAmount: 1250.00,
    fee: 37.50,
    netAmount: 1212.50,
    timestamp: 'Jan 6, 11:20',
    status: 'Settled',
    settlementBank: 'FNB South Africa'
  },
  {
    ref: 'PAY-ZA-90183',
    orderId: '#418135',
    customer: 'Mildred Hall',
    gateway: 'Visa / Mastercard',
    grossAmount: 540.95,
    fee: 17.85,
    netAmount: 523.10,
    timestamp: 'Jan 5, 16:45',
    status: 'Settled',
    settlementBank: 'Nedbank ZA'
  },
  {
    ref: 'PAY-ZA-90184',
    orderId: '#801999',
    customer: 'David Miller',
    gateway: 'Apple Pay',
    grossAmount: 399.00,
    fee: 11.97,
    netAmount: 387.03,
    timestamp: 'Jan 2, 09:15',
    status: 'Settled',
    settlementBank: 'Investec Private Bank'
  },
  {
    ref: 'PAY-ZA-90185',
    orderId: '#391480',
    customer: 'Ronald Young',
    gateway: 'Ozow Instant EFT',
    grossAmount: 890.00,
    fee: 17.80,
    netAmount: 872.20,
    timestamp: 'Dec 29, 14:10',
    status: 'Settled',
    settlementBank: 'Capitec Bank'
  },
  {
    ref: 'PAY-ZA-90186',
    orderId: '#183610',
    customer: 'Arthur Turner',
    gateway: 'Visa / Mastercard',
    grossAmount: 645.00,
    fee: 21.28,
    netAmount: 623.72,
    timestamp: 'Dec 28, 17:30',
    status: 'Settled',
    settlementBank: 'Standard Bank (ZA)'
  },
  {
    ref: 'PAY-ZA-90187',
    orderId: '#994812',
    customer: 'Lerato Khumalo',
    gateway: 'SnapScan',
    grossAmount: 2350.00,
    fee: 70.50,
    netAmount: 2279.50,
    timestamp: 'Dec 26, 10:05',
    status: 'Settled',
    settlementBank: 'Absa Group'
  },
  {
    ref: 'PAY-ZA-90188',
    orderId: '#773012',
    customer: 'Siyabonga Ndlovu',
    gateway: 'Ozow Instant EFT',
    grossAmount: 1120.00,
    fee: 22.40,
    netAmount: 1097.60,
    timestamp: 'Dec 22, 19:40',
    status: 'Settled',
    settlementBank: 'FNB South Africa'
  },
  {
    ref: 'PAY-ZA-90189',
    orderId: '#045321',
    customer: 'Gary Gilbert',
    gateway: 'Visa / Mastercard',
    grossAmount: 287.00,
    fee: 9.47,
    netAmount: 277.53,
    timestamp: 'Dec 18, 08:50',
    status: 'Settled',
    settlementBank: 'Capitec Bank'
  },
  {
    ref: 'PAY-ZA-90190',
    orderId: '#082848',
    customer: 'Frances Howell',
    gateway: 'Apple Pay',
    grossAmount: 1740.00,
    fee: 52.20,
    netAmount: 1687.80,
    timestamp: 'Dec 17, 12:10',
    status: 'Settled',
    settlementBank: 'Investec Private Bank'
  },
  {
    ref: 'PAY-ZA-90191',
    orderId: '#646072',
    customer: 'Herbert Boyd',
    gateway: 'Ozow Instant EFT',
    grossAmount: 714.00,
    fee: 14.28,
    netAmount: 699.72,
    timestamp: 'Dec 14, 15:40',
    status: 'Settled',
    settlementBank: 'Standard Bank (ZA)'
  },
  {
    ref: 'PAY-ZA-90192',
    orderId: '#510294',
    customer: 'Thabo Mokoena',
    gateway: 'SnapScan',
    grossAmount: 850.00,
    fee: 25.50,
    netAmount: 824.50,
    timestamp: 'Dec 08, 11:15',
    status: 'Settled',
    settlementBank: 'FNB South Africa'
  },
  {
    ref: 'PAY-ZA-90193',
    orderId: '#319204',
    customer: 'Janice Chandler',
    gateway: 'Visa / Mastercard',
    grossAmount: 3100.00,
    fee: 102.30,
    netAmount: 2997.70,
    timestamp: 'Dec 05, 16:22',
    status: 'Settled',
    settlementBank: 'Nedbank ZA'
  },
  {
    ref: 'PAY-ZA-90194',
    orderId: '#418135',
    customer: 'Mildred Hall',
    gateway: 'Ozow Instant EFT',
    grossAmount: 540.95,
    fee: 10.82,
    netAmount: 530.13,
    timestamp: 'Jan 7, 14:35',
    status: 'Refunded',
    settlementBank: 'Standard Bank (ZA)'
  }
];

// Storage keys
const CUSTOMERS_STORAGE_KEY = 'velora_customers_data';
const PAYMENTS_STORAGE_KEY = 'velora_payments_data';
const ADMIN_STORAGE_KEY = 'velora_admin_user';
const ADMINS_LIST_KEY = 'velora_registered_admins';

// App State
let ordersData = [];
let inventoryData = [];
let returnsData = [...INITIAL_RETURNS];
let customersData = [];
let paymentsData = [];
let selectedOrderId = '#390561';
let currentTab = 'dashboard'; // Default active on Dashboard per user request
let filterStatus = 'all';
let filterPrice = 'all';
let sortBy = 'date-desc';
let searchQuery = '';

// Customer & Payment filters
let customerSearchQuery = '';
let customerTierFilter = 'all';
let paymentSearchQuery = '';
let paymentGatewayFilter = 'all';
let paymentStatusFilter = 'all';

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

    // Load customers
    const rawCust = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    customersData = rawCust ? JSON.parse(rawCust) : INITIAL_CUSTOMERS;

    // Load payments
    const rawPay = localStorage.getItem(PAYMENTS_STORAGE_KEY);
    paymentsData = rawPay ? JSON.parse(rawPay) : INITIAL_PAYMENTS;
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    ordersData = SEED_ORDERS;
    inventoryData = INITIAL_INVENTORY;
    customersData = INITIAL_CUSTOMERS;
    paymentsData = INITIAL_PAYMENTS;
  }
}

function saveOrdersData() {
  // Sync in-memory modifications
  // Also keep selected order valid
  if (!ordersData.find(o => o.id === selectedOrderId) && ordersData.length > 0) {
    selectedOrderId = ordersData[0].id;
  }
}

function saveCustomersData() {
  localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customersData));
}

function savePaymentsData() {
  localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(paymentsData));
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

// ============================================================================
// Multi-Country Currency Configuration & Real-Time Formatting Engine
// ============================================================================
const CURRENCY_STORAGE_KEY = 'velora_currency_settings';
const NOTIFICATIONS_STORAGE_KEY = 'velora_admin_notifications';

const SUPPORTED_COUNTRIES = [
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', symbol: 'R', rate: 1.0, locale: 'en-ZA', decimals: 2 },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', rate: 0.055, locale: 'en-US', decimals: 2 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', rate: 0.043, locale: 'en-GB', decimals: 2 },
  { code: 'EU', name: 'European Union', flag: '🇪🇺', currency: 'EUR', symbol: '€', rate: 0.050, locale: 'de-DE', decimals: 2 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', symbol: '¥', rate: 8.25, locale: 'ja-JP', decimals: 0 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: 'CA$', rate: 0.075, locale: 'en-CA', decimals: 2 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', symbol: 'A$', rate: 0.084, locale: 'en-AU', decimals: 2 },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', symbol: 'KSh', rate: 7.15, locale: 'en-KE', decimals: 2 },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', symbol: '₦', rate: 82.5, locale: 'en-NG', decimals: 2 },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', symbol: 'AED', rate: 0.20, locale: 'ar-AE', decimals: 2 },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF', symbol: 'CHF', rate: 0.048, locale: 'de-CH', decimals: 2 },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹', rate: 4.60, locale: 'en-IN', decimals: 2 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', symbol: 'R$', rate: 0.31, locale: 'pt-BR', decimals: 2 },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', symbol: 'S$', rate: 0.074, locale: 'en-SG', decimals: 2 },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', currency: 'NZD', symbol: 'NZ$', rate: 0.091, locale: 'en-NZ', decimals: 2 },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', symbol: '₩', rate: 76.5, locale: 'ko-KR', decimals: 0 }
];

let currentCountry = (() => {
  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const matched = SUPPORTED_COUNTRIES.find(c => c.code === parsed.code);
      if (matched) return matched;
    }
  } catch (_) {}
  return SUPPORTED_COUNTRIES[0]; // South Africa (ZAR) default
})();

/**
 * Format currency according to the selected country and exchange rate
 */
function fmtPrice(val) {
  const baseVal = Number(val || 0);
  const converted = baseVal * (currentCountry.rate || 1.0);
  const decimals = currentCountry.decimals !== undefined ? currentCountry.decimals : 2;
  const formatted = converted.toLocaleString(currentCountry.locale || 'en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return `${currentCountry.symbol} ${formatted}`.trim();
}

window.fmtPrice = fmtPrice;

function applyCountryCurrency(country, notify = true) {
  currentCountry = country;
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(country));
  } catch (_) {}

  // Update topbar flag and code
  const flagEl = document.getElementById('headerSelectedFlag');
  const codeEl = document.getElementById('headerSelectedCode');
  if (flagEl) flagEl.textContent = country.flag;
  if (codeEl) codeEl.textContent = country.currency;

  // Update static text across the dashboard
  document.querySelectorAll('.active-currency-code').forEach(el => el.textContent = country.currency);
  document.querySelectorAll('.active-currency-symbol').forEach(el => el.textContent = country.symbol);
  document.querySelectorAll('.active-currency-name').forEach(el => el.textContent = `${country.name} (${country.currency})`);
  document.querySelectorAll('.active-currency-label').forEach(el => el.textContent = `${country.currency} (${country.symbol})`);
  document.querySelectorAll('.currency-converted-price').forEach(el => {
    const base = parseFloat(el.getAttribute('data-base-price'));
    if (!isNaN(base)) el.textContent = fmtPrice(base);
  });

  // Update filter select labels
  const pMid = document.getElementById('filterOptMid');
  if (pMid) pMid.textContent = `${fmtPrice(100)} – ${fmtPrice(1500)}`;
  const pLow = document.getElementById('filterOptLow');
  if (pLow) pLow.textContent = `Under ${fmtPrice(500)}`;
  const pHigh = document.getElementById('filterOptHigh');
  if (pHigh) pHigh.textContent = `Above ${fmtPrice(1500)}`;

  // Re-render currently active view
  renderOverviewView();
  if (currentTab === 'orders') {
    renderKPICards();
    renderOrdersTable();
  } else if (currentTab === 'returns') {
    renderReturnsView();
  } else if (currentTab === 'inventory') {
    renderInventoryView();
  } else if (currentTab === 'customers') {
    renderCustomersView();
  } else if (currentTab === 'payments') {
    renderPaymentsView();
  }

  // If order drawer is open, re-render it
  if (selectedOrderId) {
    renderOrderDrawer();
  }

  // Update country list selection highlight
  renderCountryDropdownList();

  if (notify) {
    showToast(`Currency changed to ${country.name} (${country.currency} ${country.symbol})`, 'success');
    pushNotification({
      type: 'system',
      icon: country.flag,
      title: `Store Currency: ${country.currency}`,
      description: `Values converted to ${country.name} (${country.currency}). Rate: 1 ZAR = ${country.rate} ${country.currency}.`,
      actionTab: currentTab
    });
  }
}

function initCountryCurrencySelector() {
  const container = document.getElementById('countryCurrencyPickerContainer');
  const btn = document.getElementById('countryCurrencyBtn');
  const dropdown = document.getElementById('countryCurrencyDropdown');
  const searchInput = document.getElementById('countrySearchInput');

  if (!btn || !dropdown) return;

  // Initial flag and code
  const flagEl = document.getElementById('headerSelectedFlag');
  const codeEl = document.getElementById('headerSelectedCode');
  if (flagEl) flagEl.textContent = currentCountry.flag;
  if (codeEl) codeEl.textContent = currentCountry.currency;

  renderCountryDropdownList();

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.style.display === 'block';
    toggleCountryDropdown(!isOpen);
    toggleNotificationPanel(false);
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderCountryDropdownList(e.target.value.trim().toLowerCase());
    });
    searchInput.addEventListener('click', (e) => e.stopPropagation());
  }

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (container && !container.contains(e.target)) {
      toggleCountryDropdown(false);
    }
  });

  // Apply initially (without toast) to update all prices & labels
  applyCountryCurrency(currentCountry, false);
}

function toggleCountryDropdown(open) {
  const dropdown = document.getElementById('countryCurrencyDropdown');
  const btn = document.getElementById('countryCurrencyBtn');
  if (!dropdown) return;
  dropdown.style.display = open ? 'block' : 'none';
  if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    const searchInput = document.getElementById('countrySearchInput');
    if (searchInput) {
      searchInput.value = '';
      renderCountryDropdownList();
      setTimeout(() => searchInput.focus(), 50);
    }
  }
}

function renderCountryDropdownList(filterQuery = '') {
  const listEl = document.getElementById('countryDropdownList');
  if (!listEl) return;

  const filtered = SUPPORTED_COUNTRIES.filter(c => {
    if (!filterQuery) return true;
    return c.name.toLowerCase().includes(filterQuery) ||
           c.currency.toLowerCase().includes(filterQuery) ||
           c.symbol.toLowerCase().includes(filterQuery) ||
           c.code.toLowerCase().includes(filterQuery);
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--muted); font-size: 12.5px;">No matching countries found</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(c => {
    const isSelected = c.code === currentCountry.code;
    return `
      <div class="country-option-item ${isSelected ? 'selected' : ''}" onclick="window.selectCountryByCode('${c.code}')">
        <div class="country-option-left">
          <span class="country-option-flag">${c.flag}</span>
          <span class="country-option-name">${c.name}</span>
        </div>
        <div class="country-option-right">
          <span class="country-option-curr">${c.currency} (${c.symbol})</span>
          <svg class="country-option-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
    `;
  }).join('');
}

window.selectCountryByCode = function(code) {
  const country = SUPPORTED_COUNTRIES.find(c => c.code === code);
  if (country) {
    applyCountryCurrency(country, true);
    toggleCountryDropdown(false);
  }
};

// ============================================================================
// Interactive Notification Center & Toast Alert System
// ============================================================================
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'order',
    icon: '🛒',
    title: 'New Express Order #390561',
    description: 'Michelle Black placed an order for 3 items. Pending courier dispatch.',
    time: '8m ago',
    unread: true,
    actionTab: 'orders',
    orderId: '#390561'
  },
  {
    id: 'notif-2',
    type: 'stock',
    icon: '⚠️',
    title: 'Low Stock Alert: Ryobi ONE Drill',
    description: 'Warehouse inventory is down to 3 units remaining.',
    time: '24m ago',
    unread: true,
    actionTab: 'inventory'
  },
  {
    id: 'notif-3',
    type: 'payment',
    icon: '💳',
    title: 'Payment Cleared: Instant EFT',
    description: 'Order #663334 payment confirmed via PayFast instant settlement.',
    time: '1h ago',
    unread: true,
    actionTab: 'payments'
  },
  {
    id: 'notif-4',
    type: 'return',
    icon: '🔄',
    title: 'Return Request #RET-9921',
    description: 'Janice Chandler requested return for Everyday leather tote (Sizing adjustment).',
    time: '2h ago',
    unread: true,
    actionTab: 'returns'
  },
  {
    id: 'notif-5',
    type: 'system',
    icon: '🚚',
    title: 'Courier Dispatch En Route',
    description: '4 parcels collected by The Courier Guy for Gauteng express delivery route.',
    time: '4h ago',
    unread: false,
    actionTab: 'orders'
  }
];

let notificationsData = [];
let currentNotifFilter = 'all';

function loadNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      notificationsData = JSON.parse(raw);
    } else {
      notificationsData = [...DEFAULT_NOTIFICATIONS];
      saveNotifications();
    }
  } catch (_) {
    notificationsData = [...DEFAULT_NOTIFICATIONS];
  }
}

function saveNotifications() {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notificationsData));
  } catch (_) {}
}

function updateNotificationBadges() {
  const unreadCount = notificationsData.filter(n => n.unread).length;

  const headerBadge = document.getElementById('headerNotificationCount');
  if (headerBadge) {
    headerBadge.textContent = unreadCount;
    if (unreadCount === 0) {
      headerBadge.classList.add('hidden');
    } else {
      headerBadge.classList.remove('hidden');
    }
  }

  const sidebarBadge = document.getElementById('sidebarNotificationBadge');
  if (sidebarBadge) {
    sidebarBadge.textContent = unreadCount;
    sidebarBadge.style.display = unreadCount === 0 ? 'none' : 'inline-block';
  }

  const unreadPill = document.getElementById('notificationUnreadPill');
  if (unreadPill) {
    unreadPill.textContent = unreadCount > 0 ? `${unreadCount} New` : 'All Caught Up';
    unreadPill.style.background = unreadCount > 0 ? '#fef3c7' : '#e5e7eb';
    unreadPill.style.color = unreadCount > 0 ? '#b45309' : '#4b5563';
  }

  const countAll = document.getElementById('notifCountAll');
  if (countAll) countAll.textContent = notificationsData.length;

  const countUnread = document.getElementById('notifCountUnread');
  if (countUnread) countUnread.textContent = unreadCount;
}

function renderNotificationsList() {
  const listEl = document.getElementById('notificationItemsList');
  if (!listEl) return;

  const items = currentNotifFilter === 'unread'
    ? notificationsData.filter(n => n.unread)
    : notificationsData;

  if (items.length === 0) {
    listEl.innerHTML = `
      <div class="notif-empty-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 8px; opacity: 0.5; display: block;">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <div style="font-weight: 600; color: var(--ink); margin-bottom: 2px;">No notifications here</div>
        <div style="font-size: 11.5px;">${currentNotifFilter === 'unread' ? 'All notifications have been read.' : 'You have cleared all alerts.'}</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = items.map(n => {
    const iconClass = n.type ? `notif-icon-${n.type}` : 'notif-icon-system';
    return `
      <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="window.handleNotificationClick('${n.id}')">
        <div class="notif-icon-bubble ${iconClass}">${n.icon || '🔔'}</div>
        <div class="notif-content">
          <div class="notif-title">${n.title}</div>
          <div class="notif-desc">${n.description}</div>
          <div class="notif-time">${n.time}</div>
        </div>
        <button type="button" class="notif-dismiss-btn" title="Dismiss" onclick="event.stopPropagation(); window.dismissNotification('${n.id}')">&times;</button>
      </div>
    `;
  }).join('');
}

function toggleNotificationPanel(forceState) {
  const panel = document.getElementById('notificationDropdownPanel');
  const btn = document.getElementById('headerNotificationBtn');
  if (!panel) return;

  const isCurrentlyOpen = panel.style.display === 'block';
  const shouldOpen = typeof forceState === 'boolean' ? forceState : !isCurrentlyOpen;

  panel.style.display = shouldOpen ? 'block' : 'none';
  if (btn) btn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');

  if (shouldOpen) {
    toggleCountryDropdown(false);
    renderNotificationsList();
    updateNotificationBadges();
  }
}

window.toggleNotificationPanel = function(eventOrForce) {
  if (eventOrForce && eventOrForce.stopPropagation) {
    eventOrForce.stopPropagation();
    toggleNotificationPanel();
  } else {
    toggleNotificationPanel(eventOrForce);
  }
};

window.handleNotificationClick = function(notifId) {
  const notif = notificationsData.find(n => n.id === notifId);
  if (notif) {
    notif.unread = false;
    saveNotifications();
    updateNotificationBadges();
    renderNotificationsList();

    if (notif.orderId) {
      switchTab('orders');
      if (typeof window.selectAndOpenOrder === 'function') {
        window.selectAndOpenOrder(notif.orderId);
      }
    } else if (notif.actionTab) {
      switchTab(notif.actionTab);
    }

    toggleNotificationPanel(false);
  }
};

window.dismissNotification = function(notifId) {
  notificationsData = notificationsData.filter(n => n.id !== notifId);
  saveNotifications();
  updateNotificationBadges();
  renderNotificationsList();
};

function pushNotification(notif) {
  const newNotif = {
    id: 'notif-' + Date.now(),
    type: notif.type || 'system',
    icon: notif.icon || '🔔',
    title: notif.title || 'System Alert',
    description: notif.description || '',
    time: 'Just now',
    unread: true,
    actionTab: notif.actionTab || currentTab,
    orderId: notif.orderId
  };
  notificationsData.unshift(newNotif);
  if (notificationsData.length > 30) notificationsData.pop();
  saveNotifications();
  updateNotificationBadges();
  renderNotificationsList();
}

window.pushNotification = pushNotification;

function initNotificationSystem() {
  loadNotifications();
  updateNotificationBadges();

  const container = document.getElementById('notificationCenterContainer');
  const markReadBtn = document.getElementById('markAllNotifsReadBtn');
  const clearBtn = document.getElementById('clearAllNotifsBtn');
  const tabAll = document.getElementById('notifTabAll');
  const tabUnread = document.getElementById('notifTabUnread');

  if (markReadBtn) {
    markReadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationsData.forEach(n => n.unread = false);
      saveNotifications();
      updateNotificationBadges();
      renderNotificationsList();
      showToast('All notifications marked as read', 'info');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationsData = [];
      saveNotifications();
      updateNotificationBadges();
      renderNotificationsList();
      showToast('Notifications cleared', 'info');
    });
  }

  if (tabAll && tabUnread) {
    tabAll.addEventListener('click', (e) => {
      e.stopPropagation();
      currentNotifFilter = 'all';
      tabAll.classList.add('active');
      tabUnread.classList.remove('active');
      renderNotificationsList();
    });

    tabUnread.addEventListener('click', (e) => {
      e.stopPropagation();
      currentNotifFilter = 'unread';
      tabUnread.classList.add('active');
      tabAll.classList.remove('active');
      renderNotificationsList();
    });
  }

  // Close panel on outside click
  document.addEventListener('click', (e) => {
    if (container && !container.contains(e.target)) {
      const sidebarNotifBtn = document.getElementById('sidebarNotificationBtn');
      if (sidebarNotifBtn && sidebarNotifBtn.contains(e.target)) return;
      toggleNotificationPanel(false);
    }
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('veloraToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `velora-toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.95)';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

window.showToast = showToast;

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
        showToast(`Refund processed for Order ${order.id}`, 'info');
        pushNotification({
          type: 'payment',
          icon: '↶',
          title: `Refund Processed: ${order.id}`,
          description: `Refund of ${fmtPrice(order.total)} issued for ${order.customer.fullName}.`,
          orderId: order.id,
          actionTab: 'orders'
        });
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
  const customersView = document.getElementById('customersMainView');
  const paymentsView = document.getElementById('paymentsMainView');
  const topbarTitle = document.getElementById('currentViewTitle');
  const filterBar = document.getElementById('mainFilterBar');

  if (overviewView) overviewView.style.display = tabId === 'dashboard' ? 'block' : 'none';
  if (ordersView) ordersView.style.display = tabId === 'orders' ? 'block' : 'none';
  if (returnsView) returnsView.style.display = tabId === 'returns' ? 'block' : 'none';
  if (inventoryView) inventoryView.style.display = tabId === 'inventory' ? 'block' : 'none';
  if (customersView) customersView.style.display = tabId === 'customers' ? 'block' : 'none';
  if (paymentsView) paymentsView.style.display = tabId === 'payments' ? 'block' : 'none';

  if (filterBar) {
    filterBar.style.display = tabId === 'orders' ? 'flex' : 'none';
  }

  if (topbarTitle) {
    if (tabId === 'dashboard') topbarTitle.textContent = 'Store Overview';
    else if (tabId === 'orders') topbarTitle.textContent = 'Orders';
    else if (tabId === 'returns') topbarTitle.textContent = 'Returns & Exchanges';
    else if (tabId === 'inventory') topbarTitle.textContent = 'Catalog & Stock';
    else if (tabId === 'customers') topbarTitle.textContent = 'Client Registry';
    else if (tabId === 'payments') topbarTitle.textContent = 'Payments & Settlements';
    else topbarTitle.textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1);
  }

  if (tabId === 'dashboard') {
    renderOverviewView();
  } else if (tabId === 'orders') {
    renderKPICards();
    renderOrdersTable();
  } else if (tabId === 'returns') {
    renderReturnsView();
  } else if (tabId === 'inventory') {
    renderInventoryView();
  } else if (tabId === 'customers') {
    renderCustomersView();
  } else if (tabId === 'payments') {
    renderPaymentsView();
  }
}

window.switchTab = switchTab;

/**
 * Render Customers Section View
 */
function renderCustomersView() {
  const kpiEl = document.getElementById('customersKPISection');
  if (kpiEl) {
    const totalClients = customersData.length;
    const vipClients = customersData.filter(c => c.tier === 'VIP Privilege').length;
    const totalLifetimeSpend = customersData.reduce((acc, c) => acc + (c.lifetimeSpend || 0), 0);
    const avgLifetimeVal = totalClients ? totalLifetimeSpend / totalClients : 0;

    kpiEl.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-header">
          <span>Active Clients</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${totalClients}</div>
        <div class="kpi-trend positive">
          <span>↑ +3 joined</span>
          <span style="color: var(--muted); font-weight: 400;">this week</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>VIP Privilege Tiers</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${vipClients}</div>
        <div class="kpi-trend neutral">
          <span>High-value concierge</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>Avg Lifetime Value</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${fmtPrice(avgLifetimeVal)}</div>
        <div class="kpi-trend positive">
          <span>↑ +14.2%</span>
          <span style="color: var(--muted); font-weight: 400;">annual retention</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>Client Retention</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
        <div class="kpi-value">94.8%</div>
        <div class="kpi-trend positive">
          <span>Repeat purchasers</span>
        </div>
      </div>
    `;
  }

  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  const filtered = customersData.filter(cust => {
    if (customerTierFilter !== 'all' && cust.tier !== customerTierFilter) return false;
    if (customerSearchQuery) {
      const q = customerSearchQuery.toLowerCase();
      const matchName = cust.name.toLowerCase().includes(q);
      const matchEmail = cust.email.toLowerCase().includes(q);
      const matchCity = cust.city.toLowerCase().includes(q);
      const matchPhone = cust.phone.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCity && !matchPhone) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: var(--muted);">
          No clients match the current filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(cust => {
    let tierClass = 'tier-member';
    if (cust.tier === 'VIP Privilege') tierClass = 'tier-vip';
    else if (cust.tier === 'Gold Member') tierClass = 'tier-gold';

    return `
      <tr>
        <td>
          <div class="customer-cell">
            <img class="customer-avatar" src="${cust.avatar}" alt="${cust.name}">
            <div>
              <div style="font-weight: 700; color: var(--ink); font-size: 13.5px;">${cust.name}</div>
              <div style="font-size: 11px; color: var(--muted);">${cust.id}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-size: 13px; font-weight: 500;">${cust.email}</div>
          <div style="font-size: 11.5px; color: var(--muted);">${cust.phone}</div>
        </td>
        <td style="font-size: 13px;">${cust.city}</td>
        <td>
          <span class="tier-tag ${tierClass}">
            ${cust.tier === 'VIP Privilege' ? '★ ' : ''}${cust.tier}
          </span>
        </td>
        <td style="font-weight: 600; font-size: 13.5px;">${cust.totalOrders} orders</td>
        <td style="font-weight: 700; color: var(--ink); font-size: 13.5px;">${fmtPrice(cust.lifetimeSpend)}</td>
        <td style="font-size: 12.5px; color: var(--muted);">${cust.lastActive}</td>
        <td>
          <button type="button" class="drawer-btn drawer-btn-dark" style="flex: initial; padding: 5px 10px; font-size: 11.5px;" onclick="window.viewCustomerOrders('${cust.name.replace(/'/g, "\\'")}')">
            Orders ↗
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.renderCustomersView = renderCustomersView;

window.viewCustomerOrders = function(customerName) {
  switchTab('orders');
  const searchInput = document.getElementById('orderSearchInput');
  if (searchInput) {
    searchInput.value = customerName;
    searchQuery = customerName;
    renderOrdersTable();
  }
};

window.openNewCustomerModal = function() {
  const modal = document.getElementById('newCustomerModal');
  if (modal) modal.classList.add('open');
};

window.closeNewCustomerModal = function() {
  const modal = document.getElementById('newCustomerModal');
  if (modal) modal.classList.remove('open');
};

/**
 * Render Payments Section View
 */
function renderPaymentsView() {
  const kpiEl = document.getElementById('paymentsKPISection');
  if (kpiEl) {
    const grossVolume = paymentsData.reduce((acc, p) => acc + (p.status === 'Settled' ? p.grossAmount : 0), 0);
    const netVolume = paymentsData.reduce((acc, p) => acc + (p.status === 'Settled' ? p.netAmount : 0), 0);
    const settledCount = paymentsData.filter(p => p.status === 'Settled').length;
    const instantEftCount = paymentsData.filter(p => p.gateway.includes('EFT') || p.gateway.includes('SnapScan')).length;
    const eftSharePercent = paymentsData.length ? Math.round((instantEftCount / paymentsData.length) * 100) : 0;

    kpiEl.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-header">
          <span>Gross Settled Volume</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${fmtPrice(grossVolume)}</div>
        <div class="kpi-trend positive">
          <span>↑ +22.8%</span>
          <span style="color: var(--muted); font-weight: 400;">cleared in ZAR</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>Available Net Payout</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${fmtPrice(netVolume)}</div>
        <div class="kpi-trend positive">
          <span>Ready for Standard Bank dispatch</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>Instant EFT & SnapScan</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
        </div>
        <div class="kpi-value">${eftSharePercent}%</div>
        <div class="kpi-trend positive">
          <span>Zero-chargeback gateway</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span>Settlement Rate</span>
          <div class="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
        <div class="kpi-value">99.4%</div>
        <div class="kpi-trend positive">
          <span>${settledCount} cleared transactions</span>
        </div>
      </div>
    `;
  }

  const tbody = document.getElementById('paymentsTableBody');
  if (!tbody) return;

  const filtered = paymentsData.filter(pay => {
    if (paymentGatewayFilter !== 'all' && pay.gateway !== paymentGatewayFilter) return false;
    if (paymentStatusFilter !== 'all' && pay.status.toLowerCase() !== paymentStatusFilter.toLowerCase()) return false;
    if (paymentSearchQuery) {
      const q = paymentSearchQuery.toLowerCase();
      const matchRef = pay.ref.toLowerCase().includes(q);
      const matchOrd = pay.orderId.toLowerCase().includes(q);
      const matchCust = pay.customer.toLowerCase().includes(q);
      if (!matchRef && !matchOrd && !matchCust) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: var(--muted);">
          No payment settlements found for the selected filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(pay => {
    let gwClass = 'gateway-card';
    if (pay.gateway.includes('Ozow')) gwClass = 'gateway-ozow';
    else if (pay.gateway.includes('SnapScan')) gwClass = 'gateway-snapscan';
    else if (pay.gateway.includes('Apple')) gwClass = 'gateway-applepay';

    let statusStyle = 'background: #dcfce7; color: #15803d;';
    if (pay.status === 'Refunded') statusStyle = 'background: #fee2e2; color: #b91c1c;';
    else if (pay.status === 'Processing') statusStyle = 'background: #fef9c3; color: #854d0e;';

    return `
      <tr>
        <td style="font-weight: 700; letter-spacing: 0.04em; color: var(--ink); font-size: 13px;">${pay.ref}</td>
        <td>
          <button type="button" class="drawer-btn drawer-btn-dark" style="flex: initial; padding: 4px 9px; font-size: 11.5px;" onclick="window.selectAndOpenOrder('${pay.orderId}')">
            ${pay.orderId} ↗
          </button>
        </td>
        <td style="font-weight: 600; font-size: 13.5px;">${pay.customer}</td>
        <td>
          <span class="badge-gateway ${gwClass}">
            ${pay.gateway}
          </span>
        </td>
        <td style="font-weight: 700; color: var(--ink); font-size: 13.5px;">${fmtPrice(pay.grossAmount)}</td>
        <td style="font-size: 13px; color: #047857; font-weight: 600;">${fmtPrice(pay.netAmount)}</td>
        <td style="font-size: 12.5px; color: var(--muted);">${pay.timestamp}</td>
        <td>
          <span class="status-pill" style="${statusStyle}">${pay.status}</span>
        </td>
        <td>
          <button type="button" class="action-dots-btn" title="Inspect Payment Receipt" onclick="window.openPaymentReceiptModal('${pay.ref}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.renderPaymentsView = renderPaymentsView;

window.openPaymentReceiptModal = function(ref) {
  const payment = paymentsData.find(p => p.ref === ref);
  if (!payment) return;

  const contentEl = document.getElementById('paymentReceiptContent');
  if (contentEl) {
    contentEl.innerHTML = `
      <div style="background: #faf8f5; border: 1px solid var(--dash-border); border-radius: 12px; padding: 18px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 700;">Transaction Receipt</div>
            <div style="font-size: 18px; font-weight: 700; color: var(--ink); margin-top: 2px;">${payment.ref}</div>
          </div>
          <span class="status-pill status-delivered">${payment.status}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
          <div><span style="color: var(--muted);">Order ID:</span> <strong>${payment.orderId}</strong></div>
          <div><span style="color: var(--muted);">Date:</span> <strong>${payment.timestamp}</strong></div>
          <div><span style="color: var(--muted);">Customer:</span> <strong>${payment.customer}</strong></div>
          <div><span style="color: var(--muted);">Gateway:</span> <strong>${payment.gateway}</strong></div>
          <div style="grid-column: 1 / -1;"><span style="color: var(--muted);">Settlement Bank:</span> <strong>${payment.settlementBank}</strong></div>
        </div>
      </div>

      <div style="border-top: 1px solid var(--dash-border); padding-top: 14px; font-size: 13.5px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span>Gross Collected (ZAR)</span>
          <span style="font-weight: 600;">${fmtPrice(payment.grossAmount)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--muted);">
          <span>Gateway Processing Fee</span>
          <span>-${fmtPrice(payment.fee)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px dashed var(--dash-border); font-size: 15px; font-weight: 700; color: var(--ink);">
          <span>Net Dispatched Settlement</span>
          <span style="color: #047857;">${fmtPrice(payment.netAmount)}</span>
        </div>
      </div>
    `;
  }

  const modal = document.getElementById('paymentReceiptModal');
  if (modal) modal.classList.add('open');
};

window.closePaymentReceiptModal = function() {
  const modal = document.getElementById('paymentReceiptModal');
  if (modal) modal.classList.remove('open');
};

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
    showToast(`Return ${ret.id} approved & refunded`, 'success');
    pushNotification({
      type: 'return',
      icon: '🔄',
      title: `Return Authorized: ${ret.id}`,
      description: `Return for ${ret.customer} approved. Refund: ${fmtPrice(ret.refundAmount)}.`,
      actionTab: 'returns'
    });
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

  // Mobile menu toggle & backdrop auto-close
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('dashboardSidebar') || document.querySelector('.dashboard-sidebar');
  const mobileBackdrop = document.getElementById('mobileSidebarBackdrop');

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (mobileBackdrop) mobileBackdrop.classList.remove('active');
  }
  window.closeMobileSidebar = closeMobileSidebar;

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = sidebar.classList.toggle('open');
      if (mobileBackdrop) {
        mobileBackdrop.classList.toggle('active', isOpen);
      }
    });
  }

  if (mobileBackdrop) {
    mobileBackdrop.addEventListener('click', () => {
      closeMobileSidebar();
    });
  }

  // On mobile & tablet (<=1024px), auto-close sidebar when main content area is clicked
  const mainContentArea = document.querySelector('.dashboard-main');
  if (mainContentArea) {
    mainContentArea.addEventListener('click', () => {
      if (window.innerWidth <= 1024 && sidebar && sidebar.classList.contains('open')) {
        closeMobileSidebar();
      }
    });
  }

  // Also auto-close sidebar when any navigation tab is clicked on mobile & tablet
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        closeMobileSidebar();
      }
    });
  });

  // Customer filters
  const custTierSelect = document.getElementById('customerTierFilterSelect');
  if (custTierSelect) {
    custTierSelect.addEventListener('change', (e) => {
      customerTierFilter = e.target.value;
      renderCustomersView();
    });
  }

  const custSearchInput = document.getElementById('customerSearchInput');
  if (custSearchInput) {
    custSearchInput.addEventListener('input', (e) => {
      customerSearchQuery = e.target.value.trim();
      renderCustomersView();
    });
  }

  // Customer form submission
  const addCustForm = document.getElementById('newCustomerForm');
  if (addCustForm) {
    addCustForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('newCustName').value.trim();
      const email = document.getElementById('newCustEmail').value.trim();
      const phone = document.getElementById('newCustPhone').value.trim();
      const city = document.getElementById('newCustCity').value.trim() || 'Johannesburg, GP';
      const tier = document.getElementById('newCustTier').value;
      const initialSpend = parseFloat(document.getElementById('newCustSpend').value) || 0;

      const newCust = {
        id: `CUST-${String(customersData.length + 1).padStart(3, '0')}`,
        name,
        email,
        phone,
        city,
        tier,
        totalOrders: initialSpend > 0 ? 1 : 0,
        lifetimeSpend: initialSpend,
        lastActive: 'Just now',
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      };

      customersData.unshift(newCust);
      saveCustomersData();
      window.closeNewCustomerModal();
      addCustForm.reset();
      renderCustomersView();
    });
  }

  // Payment filters
  const payGatewaySelect = document.getElementById('paymentGatewayFilterSelect');
  if (payGatewaySelect) {
    payGatewaySelect.addEventListener('change', (e) => {
      paymentGatewayFilter = e.target.value;
      renderPaymentsView();
    });
  }

  const payStatusSelect = document.getElementById('paymentStatusFilterSelect');
  if (payStatusSelect) {
    payStatusSelect.addEventListener('change', (e) => {
      paymentStatusFilter = e.target.value;
      renderPaymentsView();
    });
  }

  const paySearchInput = document.getElementById('paymentSearchInput');
  if (paySearchInput) {
    paySearchInput.addEventListener('input', (e) => {
      paymentSearchQuery = e.target.value.trim();
      renderPaymentsView();
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

  // Admin Auth Gate Events
  setupAdminAuthEvents();
}

/**
 * Admin Authentication Gate Logic
 */
function initAdminAuth() {
  const authScreen = document.getElementById('adminAuthScreen');
  const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);

  if (!storedAdmin) {
    // Admin is not authenticated -> show auth gate first!
    if (authScreen) {
      authScreen.style.display = 'flex';
    }
  } else {
    // Authenticated admin session found
    try {
      const admin = JSON.parse(storedAdmin);
      updateAdminTopbarUI(admin);
      if (authScreen) {
        authScreen.style.display = 'none';
      }
    } catch (err) {
      console.warn('Failed parsing stored admin session:', err);
      if (authScreen) authScreen.style.display = 'flex';
    }
  }
}

function updateAdminTopbarUI(admin) {
  const nameEl = document.getElementById('topbarAdminName');
  const roleEl = document.getElementById('topbarAdminRole');
  const avatarEl = document.getElementById('topbarAdminAvatar');

  if (nameEl) nameEl.textContent = admin.name || 'Kristina Evans';
  if (roleEl) roleEl.textContent = admin.role || 'Store Director';
  if (avatarEl && admin.avatar) avatarEl.src = admin.avatar;
}

window.switchAuthScreenTab = function(mode) {
  const signinForm = document.getElementById('adminGateSignInForm');
  const registerForm = document.getElementById('adminGateRegisterForm');
  const tabSignin = document.getElementById('tabAuthSignin');
  const tabRegister = document.getElementById('tabAuthRegister');

  if (mode === 'signin') {
    if (signinForm) signinForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (tabSignin) tabSignin.classList.add('active');
    if (tabRegister) tabRegister.classList.remove('active');
  } else {
    if (signinForm) signinForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (tabSignin) tabSignin.classList.remove('active');
    if (tabRegister) tabRegister.classList.add('active');
  }
};

// Mock admin registration profiles for instant testing
const MOCK_ADMIN_ACCOUNTS = [
  {
    name: 'Kristina Evans',
    email: 'kris.evans@velora.co.za',
    role: 'Store Director & Lead',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    name: 'Thabo Ndlovu',
    email: 'thabo.n@velora.co.za',
    role: 'Logistics & Dispatch Manager',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  },
  {
    name: 'Lerato Khumalo',
    email: 'lerato.k@velora.co.za',
    role: 'Client Concierge Specialist',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
  }
];

window.pickMockAccount = function(key) {
  window.switchAuthScreenTab('signin');
  const emailInput = document.getElementById('gateEmail') || document.getElementById('gateAdminEmail');
  const passInput = document.getElementById('gatePassword') || document.getElementById('gateAdminPassword');

  let target = MOCK_ADMIN_ACCOUNTS[0];
  if (key === 'thabo') target = MOCK_ADMIN_ACCOUNTS[1];
  else if (key === 'lerato') target = MOCK_ADMIN_ACCOUNTS[2];

  if (emailInput) emailInput.value = target.email;
  if (passInput) passInput.value = 'password123';
};

window.fillDemoCredentials = function() {
  window.pickMockAccount('kris');
};

window.adminSignOut = function() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
  const authScreen = document.getElementById('adminAuthScreen');
  if (authScreen) {
    authScreen.style.display = 'flex';
    window.switchAuthScreenTab('signin');
  }
};

function setupAdminAuthEvents() {
  const signinForm = document.getElementById('adminGateSignInForm');
  const registerForm = document.getElementById('adminGateRegisterForm');
  const authScreen = document.getElementById('adminAuthScreen');

  if (signinForm) {
    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('gateEmail') || document.getElementById('gateAdminEmail');
      const passInput = document.getElementById('gatePassword') || document.getElementById('gateAdminPassword');
      const email = (emailInput ? emailInput.value.trim() : '') || 'admin@velora.co.za';
      const password = (passInput ? passInput.value.trim() : '') || 'password123';

      // Check registered or mock admins first
      const registeredRaw = localStorage.getItem(ADMINS_LIST_KEY);
      let admins = [];
      if (registeredRaw) {
        try { admins = JSON.parse(registeredRaw); } catch (_) {}
      }

      let matched = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (!matched) {
        matched = MOCK_ADMIN_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase());
      }

      // Per user request: Mock mode allows ANY email and password to log in!
      if (!matched) {
        const usernamePart = email.includes('@') ? email.split('@')[0] : email;
        const formattedName = usernamePart
          ? usernamePart.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          : 'Velora Administrator';

        matched = {
          name: formattedName,
          email: email,
          role: 'Store Administrator',
          avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
        };
      }

      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(matched));
      updateAdminTopbarUI(matched);

      if (authScreen) authScreen.style.display = 'none';
      switchTab('dashboard');
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('gateRegName');
      const emailInput = document.getElementById('gateRegEmail');
      const roleInput = document.getElementById('gateRegRole');
      const passInput = document.getElementById('gateRegPassword');

      const name = (nameInput ? nameInput.value.trim() : '') || 'Velora Admin';
      const email = (emailInput ? emailInput.value.trim() : '') || 'admin@velora.co.za';
      const role = (roleInput ? roleInput.value : '') || 'Store Administrator';
      const pass = (passInput ? passInput.value : '') || 'password123';

      // Store in registered admins
      const registeredRaw = localStorage.getItem(ADMINS_LIST_KEY);
      let admins = [];
      if (registeredRaw) {
        try { admins = JSON.parse(registeredRaw); } catch (_) {}
      }

      const newAdmin = {
        name,
        email,
        role,
        password: pass,
        avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      };

      admins.push(newAdmin);
      localStorage.setItem(ADMINS_LIST_KEY, JSON.stringify(admins));

      // Auto login newly registered admin (any registration succeeds)
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(newAdmin));
      updateAdminTopbarUI(newAdmin);

      if (authScreen) authScreen.style.display = 'none';
      registerForm.reset();
      switchTab('dashboard');
    });
  }
}

// Auto bootstrap on DOM load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  initAdminAuth();
  initCountryCurrencySelector();
  initNotificationSystem();
  setupEventListeners();
  switchTab('dashboard'); // Always open active on dashboard per user request
});
