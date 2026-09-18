/**
 * Velora Online Store - Authentication & Order Management Logic
 * CodeAlpha Project Task: User registration/login, Order processing, and Order tracking
 */

// Storage Keys
const USERS_KEY = 'velora_registered_users';
const CURRENT_USER_KEY = 'velora_current_user';
const ORDERS_KEY = 'velora_customer_orders';

// Initial Seed Data (Demo Account & Sample Orders)
function seedInitialData() {
  // Seed Demo User if none exists
  if (!localStorage.getItem(USERS_KEY)) {
    const defaultUsers = [
      {
        id: 'usr_elena_01',
        name: 'Elena Rostova',
        email: 'elena@example.com',
        phone: '+27 82 555 4192',
        street: '14 Kloof Street, Gardens',
        city: 'Cape Town',
        province: 'Western Cape',
        postal: '8001',
        password: 'password123',
        createdAt: '2026-08-15T10:00:00.000Z'
      },
      {
        id: 'usr_marcus_02',
        name: 'Marcus Vance',
        email: 'marcus@example.com',
        phone: '+27 71 884 1029',
        street: '82 Rose Street, Bo-Kaap',
        city: 'Cape Town',
        province: 'Western Cape',
        postal: '8001',
        password: 'password123',
        createdAt: '2026-09-01T12:00:00.000Z'
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }

  // Seed Initial Orders if none exists
  if (!localStorage.getItem(ORDERS_KEY)) {
    const defaultOrders = [
      {
        orderId: 'VEL-839201',
        trackingNumber: 'VEL-EXP-772910',
        userId: 'usr_elena_01',
        userEmail: 'elena@example.com',
        customer: {
          firstName: 'Elena',
          lastName: 'Rostova',
          email: 'elena@example.com',
          phone: '+27 82 555 4192'
        },
        address: '14 Kloof Street, Gardens, Cape Town, Western Cape (8001)',
        date: '15 September 2026',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'In Transit',
        statusStep: 3, // 1: Confirmed, 2: Prepared, 3: In Transit, 4: Delivered
        carrier: 'Velora Courier Express',
        estimatedDelivery: 'Tomorrow, by 15:00',
        items: [
          {
            id: 'everyday-leather-tote',
            title: 'Everyday leather tote',
            collection: 'Velora Essentials',
            price: 'R1 290',
            numericPrice: 1290,
            size: 'Standard',
            quantity: 1,
            image: 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
          },
          {
            id: 'relaxed-linen-shirt',
            title: 'Relaxed linen shirt',
            collection: 'Studio Collection',
            price: 'R890',
            numericPrice: 890,
            size: 'M',
            quantity: 1,
            image: 'https://images.pexels.com/photos/19915586/pexels-photo-19915586.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
          }
        ],
        subtotal: 2180,
        discount: 0,
        delivery: 0,
        total: 2180,
        paymentMethod: 'Credit / Debit Card (Visa •••• 4532)',
        timeline: [
          { title: 'Order Placed & Payment Secured', time: '15 Sep 2026, 09:32', done: true, current: false },
          { title: 'Hand-inspected & Packed at Cape Town Studio', time: '15 Sep 2026, 14:15', done: true, current: false },
          { title: 'Dispatched via Velora Courier Express', time: '16 Sep 2026, 08:40', done: true, current: true },
          { title: 'Delivered to Doorstep', time: 'Expected 18 Sep 2026', done: false, current: false }
        ]
      },
      {
        orderId: 'VEL-419823',
        trackingNumber: 'VEL-EXP-338291',
        userId: 'usr_elena_01',
        userEmail: 'elena@example.com',
        customer: {
          firstName: 'Elena',
          lastName: 'Rostova',
          email: 'elena@example.com',
          phone: '+27 82 555 4192'
        },
        address: '14 Kloof Street, Gardens, Cape Town, Western Cape (8001)',
        date: '02 September 2026',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        status: 'Delivered',
        statusStep: 4,
        carrier: 'Velora Courier Express',
        estimatedDelivery: 'Delivered on 04 September 2026',
        items: [
          {
            id: 'cloud-step-sneakers',
            title: 'Cloud-step sneakers',
            collection: 'Weekend Uniform',
            price: 'R1 150',
            numericPrice: 1150,
            size: '41',
            quantity: 1,
            image: 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
          }
        ],
        subtotal: 1150,
        discount: 115,
        delivery: 0,
        total: 1035,
        paymentMethod: 'Instant EFT (Ozow)',
        timeline: [
          { title: 'Order Placed & Payment Secured', time: '02 Sep 2026, 11:20', done: true, current: false },
          { title: 'Handcrafted & Inspected', time: '02 Sep 2026, 16:00', done: true, current: false },
          { title: 'Dispatched with Courier', time: '03 Sep 2026, 09:10', done: true, current: false },
          { title: 'Delivered to Doorstep (Signed by Resident)', time: '04 Sep 2026, 14:22', done: true, current: false }
        ]
      }
    ];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(defaultOrders));
  }
}

seedInitialData();

// ============================================================================
// 1. AUTHENTICATION MODULE
// ============================================================================

export const VeloraAuth = {
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
      return [];
    }
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;
    } catch {
      return null;
    }
  },

  register({ name, email, password, phone = '', street = '', city = '', province = '', postal = '' }) {
    if (!name || !name.trim()) return { success: false, error: 'Full name is required.' };
    if (!email || !email.trim() || !email.includes('@')) return { success: false, error: 'A valid email address is required.' };
    if (!password || password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }

    const newUser = {
      id: 'usr_' + Date.now().toString(36),
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      province: province.trim(),
      postal: postal.trim(),
      password,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    this.setCurrentUser(newUser);

    return { success: true, user: newUser };
  },

  login(email, password) {
    if (!email || !password) return { success: false, error: 'Email and password are required.' };
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const found = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);

    if (!found) {
      return { success: false, error: 'Invalid email or password. Please verify your credentials.' };
    }

    this.setCurrentUser(found);
    return { success: true, user: found };
  },

  setCurrentUser(user) {
    if (user) {
      const safeUser = { ...user };
      delete safeUser.password;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    window.dispatchEvent(new CustomEvent('velora:auth-change', { detail: { user } }));
  },

  logout() {
    this.setCurrentUser(null);
  },

  updateProfile(updates) {
    const current = this.getCurrentUser();
    if (!current) return { success: false, error: 'Not authenticated' };

    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === current.id || u.email.toLowerCase() === current.email.toLowerCase());

    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      this.setCurrentUser(users[idx]);
      return { success: true, user: users[idx] };
    }
    return { success: false, error: 'User record not found' };
  }
};

// ============================================================================
// 2. ORDER PROCESSING & TRACKING MODULE
// ============================================================================

export const VeloraOrders = {
  getAllOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    } catch {
      return [];
    }
  },

  getOrdersForUser(emailOrUserId) {
    if (!emailOrUserId) return [];
    const target = emailOrUserId.toLowerCase().trim();
    const orders = this.getAllOrders();
    return orders.filter(o => {
      const matchesEmail = o.userEmail && o.userEmail.toLowerCase() === target;
      const matchesCustomerEmail = o.customer && o.customer.email && o.customer.email.toLowerCase() === target;
      const matchesId = o.userId && o.userId.toLowerCase() === target;
      return matchesEmail || matchesCustomerEmail || matchesId;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  findOrder(orderRef, optionalEmail = '') {
    if (!orderRef) return null;
    const cleanRef = orderRef.trim().toUpperCase();
    const cleanEmail = optionalEmail.trim().toLowerCase();
    const orders = this.getAllOrders();

    return orders.find(o => {
      const matchRef = o.orderId.toUpperCase() === cleanRef || 
                       o.orderId.toUpperCase().replace('VEL-', '') === cleanRef.replace('VEL-', '') ||
                       (o.trackingNumber && o.trackingNumber.toUpperCase() === cleanRef);
      if (!matchRef) return false;
      if (!cleanEmail) return true;
      const oEmail = (o.userEmail || (o.customer && o.customer.email) || '').toLowerCase();
      return oEmail === cleanEmail;
    }) || null;
  },

  createOrder({
    orderId,
    customer,
    address,
    items,
    subtotal,
    discount = 0,
    delivery = 0,
    total,
    paymentMethod = 'Card',
    date
  }) {
    const currentUser = VeloraAuth.getCurrentUser();
    const generatedId = orderId || ('VEL-' + Math.floor(100000 + Math.random() * 900000));
    const generatedTracking = 'VEL-EXP-' + Math.floor(100000 + Math.random() * 900000);
    const orderDate = date || new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
    const now = new Date();

    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder = {
      orderId: generatedId,
      trackingNumber: generatedTracking,
      userId: currentUser ? currentUser.id : null,
      userEmail: (customer && customer.email) || (currentUser ? currentUser.email : 'guest@example.com'),
      customer: customer || {
        firstName: currentUser ? currentUser.name.split(' ')[0] : 'Customer',
        lastName: currentUser ? currentUser.name.split(' ').slice(1).join(' ') : '',
        email: currentUser ? currentUser.email : 'guest@example.com',
        phone: currentUser ? currentUser.phone : ''
      },
      address: address || (currentUser ? `${currentUser.street}, ${currentUser.city} (${currentUser.postal})` : 'Delivery address specified'),
      date: orderDate,
      createdAt: now.toISOString(),
      status: 'Confirmed',
      statusStep: 1,
      carrier: 'Velora Courier Express',
      estimatedDelivery: '2–4 business days',
      items: items || [],
      subtotal: subtotal || 0,
      discount: discount || 0,
      delivery: delivery || 0,
      total: total || 0,
      paymentMethod,
      timeline: [
        { title: 'Order Placed & Payment Secured', time: `${orderDate}, ${formattedTime}`, done: true, current: true },
        { title: 'Hand-inspected & Packed at Cape Town Studio', time: 'In Queue', done: false, current: false },
        { title: 'Dispatched via Velora Courier Express', time: 'Pending fulfillment', done: false, current: false },
        { title: 'Delivered to Doorstep', time: 'Pending courier delivery', done: false, current: false }
      ]
    };

    const orders = this.getAllOrders();
    orders.unshift(newOrder);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    window.dispatchEvent(new CustomEvent('velora:order-created', { detail: { order: newOrder } }));
    return newOrder;
  }
};

// Attach to window object for seamless accessibility across pages and inline scripts
if (typeof window !== 'undefined') {
  window.VeloraAuth = VeloraAuth;
  window.VeloraOrders = VeloraOrders;
}

// ============================================================================
// 3. UI INJECTION & HEADER SYNCHRONIZATION
// ============================================================================

function setupGlobalAuthUI() {
  injectAuthStyles();
  injectAuthModal();
  injectTrackingModal();
  updateHeaderAuthDisplay();
  checkCheckoutAutoFill();

  // Re-run whenever auth state changes
  window.addEventListener('velora:auth-change', () => {
    updateHeaderAuthDisplay();
    checkCheckoutAutoFill();
  });
}

function injectAuthStyles() {
  if (document.getElementById('veloraAuthStyles')) return;
  const style = document.createElement('style');
  style.id = 'veloraAuthStyles';
  style.textContent = `
    /* Auth Modal & Header Dropdown Styles */
    .user-auth-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .08em;
      text-transform: uppercase;
      background: transparent;
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 6px 14px;
      color: var(--ink);
      cursor: pointer;
      transition: all .2s ease;
      white-space: nowrap;
    }
    .user-auth-btn:hover {
      background: var(--ink);
      color: #fff;
      border-color: var(--ink);
    }
    .user-auth-btn svg {
      width: 13px;
      height: 13px;
    }
    .user-auth-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(201, 165, 122, .18);
      border: 1px solid var(--accent);
      border-radius: 20px;
      padding: 5px 12px;
      color: var(--ink);
      cursor: pointer;
      position: relative;
    }
    .user-auth-pill:hover {
      background: rgba(201, 165, 122, .3);
    }
    .user-auth-pill .avatar-circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--ink);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 700;
    }
    
    /* User Dropdown Menu */
    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 220px;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 4px;
      box-shadow: 0 10px 30px rgba(0,0,0,.08);
      padding: 8px 0;
      z-index: 1000;
      display: none;
      text-align: left;
    }
    .user-dropdown-menu.show {
      display: block;
      animation: veloraFadeDown .2s ease;
    }
    @keyframes veloraFadeDown {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .user-dropdown-header {
      padding: 10px 16px 8px;
      border-bottom: 1px solid var(--line);
      font-size: 11px;
      color: var(--muted);
    }
    .user-dropdown-header strong {
      display: block;
      color: var(--ink);
      font-size: 13px;
      margin-bottom: 2px;
    }
    .user-dropdown-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 16px;
      font-size: 12px;
      color: var(--ink);
      text-decoration: none;
      transition: background .15s;
    }
    .user-dropdown-link:hover {
      background: var(--cream);
      color: var(--accent-dark);
    }
    .user-dropdown-link.logout-btn {
      color: var(--danger, #b33a3a);
      border-top: 1px solid var(--line);
      margin-top: 4px;
      cursor: pointer;
      width: 100%;
      border-radius: 0;
      background: transparent;
      border-left: 0;
      border-right: 0;
      border-bottom: 0;
    }

    /* Modal Backdrop & Container */
    .velora-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(27, 27, 26, .65);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .velora-modal-backdrop.active {
      display: flex;
      animation: veloraFadeIn .25s ease;
    }
    @keyframes veloraFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .velora-modal-card {
      background: var(--paper, #fff);
      width: 100%;
      max-width: 460px;
      border-radius: 6px;
      border: 1px solid var(--line);
      box-shadow: 0 20px 40px rgba(0,0,0,.15);
      position: relative;
      overflow: hidden;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    .velora-modal-header {
      padding: 24px 28px 16px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .velora-modal-header h3 {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      margin: 0;
      color: var(--ink);
    }
    .velora-modal-close {
      background: transparent;
      border: 0;
      font-size: 20px;
      cursor: pointer;
      color: var(--muted);
      padding: 4px;
      line-height: 1;
    }
    .velora-modal-close:hover {
      color: var(--ink);
    }
    .velora-modal-body {
      padding: 24px 28px 28px;
      overflow-y: auto;
    }
    
    /* Tabs */
    .velora-auth-tabs {
      display: flex;
      border-bottom: 1px solid var(--line);
      margin-bottom: 20px;
    }
    .velora-auth-tab {
      flex: 1;
      text-align: center;
      padding: 10px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .06em;
      text-transform: uppercase;
      background: transparent;
      border: 0;
      color: var(--muted);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all .2s;
    }
    .velora-auth-tab.active {
      color: var(--ink);
      border-bottom-color: var(--ink);
    }
    
    /* Form groups inside modal */
    .velora-form-group {
      margin-bottom: 16px;
      text-align: left;
    }
    .velora-form-group label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .06em;
      text-transform: uppercase;
      color: var(--ink);
      margin-bottom: 6px;
    }
    .velora-form-group input {
      width: 100%;
      padding: 11px 14px;
      border: 1px solid var(--line);
      border-radius: 4px;
      background: var(--cream);
      font-size: 13px;
      color: var(--ink);
      box-sizing: border-box;
      transition: border-color .2s, background .2s;
    }
    .velora-form-group input:focus {
      outline: none;
      border-color: var(--ink);
      background: #fff;
    }
    .velora-auth-btn-primary {
      width: 100%;
      background: var(--ink);
      color: #fff;
      padding: 13px;
      border: 0;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .1em;
      text-transform: uppercase;
      cursor: pointer;
      margin-top: 8px;
      transition: opacity .2s;
    }
    .velora-auth-btn-primary:hover {
      opacity: .9;
    }
    .velora-auth-alert {
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 12px;
      margin-bottom: 16px;
      display: none;
    }
    .velora-auth-alert.error {
      display: block;
      background: #fdf2f2;
      border: 1px solid #f8b4b4;
      color: #9b1c1c;
    }
    .velora-auth-alert.success {
      display: block;
      background: #f3faf7;
      border: 1px solid #bcf0da;
      color: #03543f;
    }
    .demo-account-box {
      margin-top: 20px;
      padding: 12px 14px;
      background: rgba(201, 165, 122, .12);
      border: 1px dashed var(--accent);
      border-radius: 4px;
      font-size: 11px;
      color: var(--muted);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .demo-account-btn {
      background: var(--ink);
      color: #fff;
      border: 0;
      padding: 5px 10px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);
}

function injectAuthModal() {
  if (document.getElementById('veloraAuthModal')) return;

  const modalHtml = `
    <div class="velora-modal-backdrop" id="veloraAuthModal" aria-hidden="true" role="dialog">
      <div class="velora-modal-card">
        <div class="velora-modal-header">
          <h3 id="veloraAuthModalTitle">Client Portal</h3>
          <button type="button" class="velora-modal-close" id="closeAuthModalBtn" aria-label="Close modal">&times;</button>
        </div>
        <div class="velora-modal-body">
          <div class="velora-auth-tabs">
            <button type="button" class="velora-auth-tab active" id="tabSignInBtn">Sign In</button>
            <button type="button" class="velora-auth-tab" id="tabRegisterBtn">Create Account</button>
          </div>

          <div id="authAlertBox" class="velora-auth-alert"></div>

          <!-- SIGN IN FORM -->
          <form id="veloraSignInForm">
            <div class="velora-form-group">
              <label for="authLoginEmail">Email Address *</label>
              <input type="email" id="authLoginEmail" required placeholder="name@example.com" autocomplete="email">
            </div>
            <div class="velora-form-group">
              <label for="authLoginPassword">Password *</label>
              <input type="password" id="authLoginPassword" required placeholder="••••••••" autocomplete="current-password">
            </div>
            <button type="submit" class="velora-auth-btn-primary" id="submitLoginBtn">Sign In to Velora</button>
            
            <div class="demo-account-box">
              <span><strong>Quick Demo:</strong> elena@example.com</span>
              <button type="button" class="demo-account-btn" id="fillDemoUserBtn">Fill & Login</button>
            </div>
          </form>

          <!-- REGISTER FORM -->
          <form id="veloraRegisterForm" style="display: none;">
            <div class="velora-form-group">
              <label for="regFullName">Full Name *</label>
              <input type="text" id="regFullName" required placeholder="Elena Rostova">
            </div>
            <div class="velora-form-group">
              <label for="regEmail">Email Address *</label>
              <input type="email" id="regEmail" required placeholder="name@example.com" autocomplete="email">
            </div>
            <div class="velora-form-group">
              <label for="regPassword">Create Password * (min 6 chars)</label>
              <input type="password" id="regPassword" required minlength="6" placeholder="••••••••" autocomplete="new-password">
            </div>
            <div class="velora-form-group">
              <label for="regPhone">Mobile Phone (for delivery SMS)</label>
              <input type="tel" id="regPhone" placeholder="+27 82 000 0000">
            </div>
            <div class="velora-form-group">
              <label for="regStreet">Delivery Address (Street & Suburb)</label>
              <input type="text" id="regStreet" placeholder="14 Kloof Street, Gardens">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="velora-form-group">
                <label for="regCity">City</label>
                <input type="text" id="regCity" placeholder="Cape Town">
              </div>
              <div class="velora-form-group">
                <label for="regPostal">Postal Code</label>
                <input type="text" id="regPostal" placeholder="8001">
              </div>
            </div>
            <button type="submit" class="velora-auth-btn-primary" id="submitRegisterBtn">Create My Account</button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  bindAuthModalEvents();
}

function bindAuthModalEvents() {
  const modal = document.getElementById('veloraAuthModal');
  const closeBtn = document.getElementById('closeAuthModalBtn');
  const tabSignIn = document.getElementById('tabSignInBtn');
  const tabRegister = document.getElementById('tabRegisterBtn');
  const formSignIn = document.getElementById('veloraSignInForm');
  const formRegister = document.getElementById('veloraRegisterForm');
  const alertBox = document.getElementById('authAlertBox');
  const demoBtn = document.getElementById('fillDemoUserBtn');

  function showAlert(msg, isError = true) {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `velora-auth-alert ${isError ? 'error' : 'success'}`;
  }

  function clearAlert() {
    if (!alertBox) return;
    alertBox.className = 'velora-auth-alert';
    alertBox.textContent = '';
  }

  function switchTab(tab) {
    clearAlert();
    if (tab === 'register') {
      tabRegister.classList.add('active');
      tabSignIn.classList.remove('active');
      formRegister.style.display = 'block';
      formSignIn.style.display = 'none';
      document.getElementById('veloraAuthModalTitle').textContent = 'Join Velora';
    } else {
      tabSignIn.classList.add('active');
      tabRegister.classList.remove('active');
      formSignIn.style.display = 'block';
      formRegister.style.display = 'none';
      document.getElementById('veloraAuthModalTitle').textContent = 'Welcome Back';
    }
  }

  tabSignIn?.addEventListener('click', () => switchTab('signin'));
  tabRegister?.addEventListener('click', () => switchTab('register'));

  closeBtn?.addEventListener('click', () => closeAuthModal());
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeAuthModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeAuthModal();
    }
  });

  // Demo user 1-click
  demoBtn?.addEventListener('click', () => {
    document.getElementById('authLoginEmail').value = 'elena@example.com';
    document.getElementById('authLoginPassword').value = 'password123';
    formSignIn.dispatchEvent(new Event('submit'));
  });

  // Login submission
  formSignIn?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAlert();
    const email = document.getElementById('authLoginEmail').value;
    const password = document.getElementById('authLoginPassword').value;

    const result = VeloraAuth.login(email, password);
    if (!result.success) {
      showAlert(result.error, true);
    } else {
      showAlert(`Welcome back, ${result.user.name}.`, false);
      setTimeout(() => {
        closeAuthModal();
        // If on checkout page or account page, refresh or auto-fill
        if (window.location.pathname.includes('account.html')) {
          window.location.reload();
        }
      }, 500);
    }
  });

  // Register submission
  formRegister?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAlert();
    const name = document.getElementById('regFullName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value;
    const street = document.getElementById('regStreet').value;
    const city = document.getElementById('regCity').value;
    const postal = document.getElementById('regPostal').value;

    const result = VeloraAuth.register({ name, email, password, phone, street, city, postal });
    if (!result.success) {
      showAlert(result.error, true);
    } else {
      showAlert(`Account created successfully! Welcome, ${result.user.name}.`, false);
      setTimeout(() => {
        closeAuthModal();
        if (window.location.pathname.includes('account.html')) {
          window.location.reload();
        }
      }, 700);
    }
  });
}

export function openAuthModal(tab = 'signin') {
  const modal = document.getElementById('veloraAuthModal');
  if (!modal) {
    injectAuthModal();
  }
  const modalEl = document.getElementById('veloraAuthModal');
  if (modalEl) {
    modalEl.classList.add('active');
    modalEl.setAttribute('aria-hidden', 'false');
    const tabBtn = tab === 'register' ? document.getElementById('tabRegisterBtn') : document.getElementById('tabSignInBtn');
    tabBtn?.click();
  }
}

export function closeAuthModal() {
  const modal = document.getElementById('veloraAuthModal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
}

// Global quick order tracker modal
function injectTrackingModal() {
  if (document.getElementById('veloraTrackModal')) return;

  const modalHtml = `
    <div class="velora-modal-backdrop" id="veloraTrackModal" aria-hidden="true" role="dialog">
      <div class="velora-modal-card" style="max-width: 520px;">
        <div class="velora-modal-header">
          <h3>Track Your Order</h3>
          <button type="button" class="velora-modal-close" id="closeTrackModalBtn" aria-label="Close tracking modal">&times;</button>
        </div>
        <div class="velora-modal-body">
          <p style="font-size: 12px; color: var(--muted); margin-bottom: 18px;">
            Enter your Velora Order Reference (e.g. <strong>VEL-839201</strong>) to view real-time courier tracking and delivery milestones.
          </p>
          <form id="veloraQuickTrackForm" style="display: flex; gap: 8px; margin-bottom: 20px;">
            <input type="text" id="quickTrackInput" placeholder="Order Ref (VEL-XXXXXX)" required 
                   style="flex: 1; padding: 10px 14px; border: 1px solid var(--line); border-radius: 4px; font-size: 13px; text-transform: uppercase;">
            <button type="submit" class="velora-auth-btn-primary" style="width: auto; margin-top: 0; padding: 10px 18px;">Track</button>
          </form>

          <div id="quickTrackResult" style="min-height: 50px;"></div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('veloraTrackModal');
  document.getElementById('closeTrackModalBtn')?.addEventListener('click', () => {
    modal.classList.remove('active');
  });
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  document.getElementById('veloraQuickTrackForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const ref = document.getElementById('quickTrackInput').value;
    const resultBox = document.getElementById('quickTrackResult');
    const order = VeloraOrders.findOrder(ref);

    if (!order) {
      resultBox.innerHTML = `
        <div style="background: #fdf2f2; border: 1px solid #f8b4b4; padding: 14px; border-radius: 4px; color: #9b1c1c; font-size: 12px;">
          No order found with reference <strong>${ref}</strong>. Please check your reference number or sign in to view your orders.
        </div>
      `;
      return;
    }

    renderQuickTrackOrder(order, resultBox);
  });
}

function renderQuickTrackOrder(order, targetEl) {
  const steps = order.timeline || [
    { title: 'Order Placed & Confirmed', time: order.date, done: true },
    { title: 'Prepared & Packed', time: 'Completed', done: order.statusStep >= 2 },
    { title: 'Dispatched with Express Courier', time: order.statusStep >= 3 ? 'In Transit' : 'Pending', done: order.statusStep >= 3 },
    { title: 'Delivered to Doorstep', time: order.statusStep >= 4 ? 'Delivered' : 'Pending', done: order.statusStep >= 4 }
  ];

  targetEl.innerHTML = `
    <div style="background: var(--cream); border: 1px solid var(--line); border-radius: 6px; padding: 18px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <span style="font-size: 10px; color: var(--accent-dark); font-weight: 700; letter-spacing: .1em; text-transform: uppercase;">Live Status</span>
          <h4 style="margin: 2px 0 0; font-size: 16px; color: var(--ink);">${order.orderId}</h4>
        </div>
        <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; border-radius: 20px; background: ${order.status === 'Delivered' ? '#03543f' : '#9c7951'}; color: #fff;">
          ${order.status}
        </span>
      </div>

      <div style="font-size: 12px; color: var(--muted); margin-bottom: 16px;">
        <div><strong>Carrier:</strong> ${order.carrier || 'Velora Courier Express'}</div>
        <div><strong>Tracking #:</strong> ${order.trackingNumber || 'VEL-EXP-PENDING'}</div>
        <div><strong>Estimated Arrival:</strong> ${order.estimatedDelivery || '2–4 Business Days'}</div>
      </div>

      <!-- Stepper list -->
      <div style="border-left: 2px solid var(--line); margin-left: 10px; padding-left: 18px; display: flex; flex-direction: column; gap: 14px;">
        ${steps.map(s => `
          <div style="position: relative;">
            <div style="position: absolute; left: -25px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: ${s.done ? 'var(--ink)' : '#ddd'}; border: 2px solid #fff;"></div>
            <div style="font-size: 12px; font-weight: 600; color: ${s.done ? 'var(--ink)' : 'var(--muted)'};">${s.title}</div>
            <div style="font-size: 10px; color: var(--muted);">${s.time}</div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 20px; text-align: right;">
        <a href="${window.location.pathname.includes('/components/') ? 'account.html' : './components/account.html'}?track=${order.orderId}" 
           style="font-size: 11px; font-weight: 700; color: var(--accent-dark); text-decoration: underline;">
          View Complete Order Receipt ↗
        </a>
      </div>
    </div>
  `;
}

export function openTrackModal(orderRef = '') {
  injectTrackingModal();
  const modal = document.getElementById('veloraTrackModal');
  if (modal) {
    modal.classList.add('active');
    if (orderRef) {
      const input = document.getElementById('quickTrackInput');
      if (input) {
        input.value = orderRef;
        document.getElementById('veloraQuickTrackForm')?.dispatchEvent(new Event('submit'));
      }
    }
  }
}

// ============================================================================
// 4. HEADER USER ACTIONS SYNCHRONIZATION
// ============================================================================

function updateHeaderAuthDisplay() {
  const user = VeloraAuth.getCurrentUser();
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;

  const isSubPage = window.location.pathname.includes('/components/');
  const accountUrl = isSubPage ? 'account.html' : './components/account.html';

  let authContainer = document.getElementById('headerAuthContainer');
  if (!authContainer) {
    authContainer = document.createElement('div');
    authContainer.id = 'headerAuthContainer';
    authContainer.style.position = 'relative';
    // Insert before menu-button or as first child of header-actions
    headerActions.insertBefore(authContainer, headerActions.firstChild);
  }

  if (user) {
    const firstName = user.name.split(' ')[0];
    const initial = firstName.charAt(0).toUpperCase();
    const userOrders = VeloraOrders.getOrdersForUser(user.email);

    authContainer.innerHTML = `
      <div class="user-auth-pill" id="userPillBtn" title="Account: ${user.name}">
        <span class="avatar-circle">${initial}</span>
        <span>${firstName}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 10px; height: 10px; margin-left: 2px;">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div class="user-dropdown-menu" id="userDropdownMenu">
        <div class="user-dropdown-header">
          <strong>${user.name}</strong>
          <span>${user.email}</span>
        </div>
        <a href="${accountUrl}#orders" class="user-dropdown-link">
          <span>📦 My Orders</span>
          <strong style="font-size: 11px; background: var(--cream); padding: 2px 6px; border-radius: 10px;">${userOrders.length}</strong>
        </a>
        <a href="${accountUrl}#track" class="user-dropdown-link">
          <span>🔍 Track a Package</span>
        </a>
        <a href="${accountUrl}#profile" class="user-dropdown-link">
          <span>👤 Shipping Details</span>
        </a>
        <button type="button" class="user-dropdown-link logout-btn" id="headerLogoutBtn">
          <span>Sign Out</span>
        </button>
      </div>
    `;

    const pill = document.getElementById('userPillBtn');
    const menu = document.getElementById('userDropdownMenu');
    const logoutBtn = document.getElementById('headerLogoutBtn');

    pill?.addEventListener('click', (e) => {
      e.stopPropagation();
      menu?.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!authContainer.contains(e.target)) {
        menu?.classList.remove('show');
      }
    });

    logoutBtn?.addEventListener('click', () => {
      VeloraAuth.logout();
      menu?.classList.remove('show');
      if (window.location.pathname.includes('account.html')) {
        window.location.reload();
      }
    });
  } else {
    authContainer.innerHTML = `
      <button type="button" class="user-auth-btn" id="headerSignInBtn" title="Sign In or Create Account">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Account</span>
      </button>
    `;

    document.getElementById('headerSignInBtn')?.addEventListener('click', () => {
      openAuthModal('signin');
    });
  }

  // Also sync mobile nav with an Account link if not already present
  syncMobileNavAuth(user, accountUrl);
}

function syncMobileNavAuth(user, accountUrl) {
  const mobileNav = document.querySelector('.mobile-nav');
  if (!mobileNav) return;

  let mobileAuthLink = document.getElementById('mobileNavAuthLink');
  if (!mobileAuthLink) {
    mobileAuthLink = document.createElement('a');
    mobileAuthLink.id = 'mobileNavAuthLink';
    mobileNav.appendChild(mobileAuthLink);
  }

  if (user) {
    mobileAuthLink.href = accountUrl;
    mobileAuthLink.textContent = `My Account (${user.name.split(' ')[0]})`;
  } else {
    mobileAuthLink.href = accountUrl;
    mobileAuthLink.textContent = 'Account / Track Orders';
  }
}

// ============================================================================
// 5. CHECKOUT PAGE AUTO-FILL & AUTH LINKING
// ============================================================================

function checkCheckoutAutoFill() {
  const user = VeloraAuth.getCurrentUser();
  const emailInput = document.getElementById('shippingEmail') || document.getElementById('coEmail');
  const phoneInput = document.getElementById('shippingPhone') || document.getElementById('coPhone');
  const firstInput = document.getElementById('shippingFirstName') || document.getElementById('coFirstName');
  const lastInput = document.getElementById('shippingLastName') || document.getElementById('coLastName');
  const addressInput = document.getElementById('shippingAddress') || document.getElementById('coAddress');
  const cityInput = document.getElementById('shippingCity') || document.getElementById('coCity');
  const postalInput = document.getElementById('shippingPostal') || document.getElementById('coPostal');

  // If user is logged in and fields exist, auto-populate if empty
  if (user) {
    if (emailInput && !emailInput.value) emailInput.value = user.email || '';
    if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
    if (firstInput && !firstInput.value) firstInput.value = user.name.split(' ')[0] || '';
    if (lastInput && !lastInput.value) lastInput.value = user.name.split(' ').slice(1).join(' ') || '';
    if (addressInput && !addressInput.value) addressInput.value = user.street || '';
    if (cityInput && !cityInput.value) cityInput.value = user.city || '';
    if (postalInput && !postalInput.value) postalInput.value = user.postal || '';

    // If there's an account prompt in checkout, update it
    const accountNotice = document.querySelector('.checkout-section-card h2 span a');
    if (accountNotice && accountNotice.textContent.toLowerCase().includes('sign in')) {
      const parentSpan = accountNotice.parentElement;
      if (parentSpan) {
        parentSpan.innerHTML = `Signed in as <strong>${user.name}</strong> • <a href="#" id="checkoutSignOutLink" style="text-decoration: underline; color: var(--accent-dark);">Sign out</a>`;
        document.getElementById('checkoutSignOutLink')?.addEventListener('click', (e) => {
          e.preventDefault();
          VeloraAuth.logout();
        });
      }
    }
  } else {
    // If not logged in, ensure "Sign in" link opens auth modal
    const signInLinks = document.querySelectorAll('a[href*="sign in"], a[href*="Sign in"], a[href*="#newsletter"]');
    signInLinks.forEach(link => {
      if (link.textContent.toLowerCase().includes('sign in')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          openAuthModal('signin');
        });
      }
    });
  }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGlobalAuthUI);
  } else {
    setupGlobalAuthUI();
  }
}
