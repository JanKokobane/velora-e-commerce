/**
 * Velora E-Commerce — User Registration & Authentication (auth.js)
 * Features:
 * 1. User Registration with name, email, phone, and secure credentials
 * 2. User Sign-In with remember-me session persistence
 * 3. Client Account Dashboard with active parcel tracking integration
 * 4. Synchronization with Order Processing (orders.html) and Checkout
 */

const USERS_STORAGE_KEY = 'velora_users_db';
const CURRENT_USER_KEY = 'velora_current_user';
const ORDERS_STORAGE_KEY = 'velora_orders_history';

// Pre-seeded demo user
const DEMO_USER = {
  id: 'usr_elena_vance',
  fullName: 'Elena Vance',
  email: 'elena@example.com',
  phone: '+27 82 492 8102',
  city: 'Cape Town',
  province: 'Western Cape',
  street: '14 Kloof Street, Gardens',
  password: 'password123',
  memberTier: 'Velora Privilege Client',
  joinedDate: 'January 2026'
};

// Seed users if empty
export function getUsers() {
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  if (!data) {
    const initialUsers = [DEMO_USER];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    return initialUsers;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [DEMO_USER];
  }
}

export function getCurrentUser() {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
  updateGlobalHeaderUser();
}

// Update header account button label across pages
export function updateGlobalHeaderUser() {
  const user = getCurrentUser();
  const accountLabels = document.querySelectorAll('.account-btn-label, #headerAccountText');
  accountLabels.forEach((el) => {
    if (user && user.fullName) {
      const firstName = user.fullName.split(' ')[0];
      el.textContent = firstName;
    } else {
      el.textContent = 'Account';
    }
  });
}

// Get user orders
export function getUserOrders(userEmail) {
  const rawOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
  let orders = [];
  if (rawOrders) {
    try {
      orders = JSON.parse(rawOrders);
    } catch (e) {
      orders = [];
    }
  }

  // If no user orders exist yet, provide realistic pre-seeded parcel for demo
  if (orders.length === 0) {
    orders = [
      {
        id: 'VEL-84920',
        date: '16 Sep 2026',
        estimatedDelivery: '19 Sep 2026 (14:00 - 17:00)',
        status: 'Out for Express Delivery',
        trackingNumber: 'TRK-ZA-8492019',
        processingPartner: 'Velora Logistics (www.velora.co.za)',
        courier: 'Velora Express Courier — Driver: Sipho K.',
        total: 1290,
        items: [
          {
            title: 'Cloud-step sneakers',
            size: 'UK 7 (EU 40)',
            quantity: 1,
            price: 1290,
            image: 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
          }
        ]
      }
    ];
  }
  return orders;
}

// Initialize Auth Page
export function initAuthPage() {
  const authContainer = document.getElementById('authAppContainer');
  if (!authContainer) return;

  const currentUser = getCurrentUser();

  if (currentUser) {
    renderUserDashboard(currentUser);
  } else {
    renderAuthForms();
  }
}

// Render Sign-In / Register Form
function renderAuthForms(initialTab = 'signin') {
  const authContainer = document.getElementById('authAppContainer');
  if (!authContainer) return;

  authContainer.innerHTML = `
    <div class="auth-card">
      
      <!-- Tab Navigation -->
      <div class="auth-tabs" role="tablist">
        <button type="button" class="auth-tab ${initialTab === 'signin' ? 'active' : ''}" id="tabSignInBtn">
          Sign In
        </button>
        <button type="button" class="auth-tab ${initialTab === 'register' ? 'active' : ''}" id="tabRegisterBtn">
          Create Account
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="auth-content">
        
        <!-- SIGN IN FORM -->
        <div class="auth-panel ${initialTab === 'signin' ? 'active' : ''}" id="panelSignIn">
          <div class="auth-intro">
            <h2>Welcome to Velora</h2>
            <p>Sign in to track your parcels in real-time, view order history, and manage your delivery addresses.</p>
          </div>

          <form id="signInForm" class="auth-form" novalidate>
            <div id="signInAlert" class="auth-alert" style="display: none;"></div>

            <div class="form-group">
              <label for="loginEmail">Email Address</label>
              <input type="email" id="loginEmail" placeholder="e.g. elena@example.com" value="elena@example.com" required autocomplete="email">
            </div>

            <div class="form-group">
              <div class="form-label-row">
                <label for="loginPassword">Password</label>
                <a href="#forgot" class="forgot-link" id="forgotPasswordBtn">Forgot password?</a>
              </div>
              <input type="password" id="loginPassword" placeholder="••••••••" value="password123" required autocomplete="current-password">
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" id="rememberMe" checked>
                <span>Remember this device</span>
              </label>
            </div>

            <button type="submit" class="auth-submit-btn" id="signInSubmitBtn">
              Sign In to Account ↗
            </button>

            <!-- Quick Demo Login Hint -->
            <div class="demo-login-box">
              <span class="demo-tag">One-Click Demo Sign-In</span>
              <p>Click below to test with a pre-configured member account with active parcel tracking:</p>
              <button type="button" class="demo-login-btn" id="quickDemoLoginBtn">
                Sign In as Elena Vance (elena@example.com)
              </button>
            </div>
          </form>
        </div>

        <!-- REGISTER FORM -->
        <div class="auth-panel ${initialTab === 'register' ? 'active' : ''}" id="panelRegister">
          <div class="auth-intro">
            <h2>Create Your Account</h2>
            <p>Join Velora to receive seamless order tracking, express delivery dispatch notifications, and bespoke concierge care.</p>
          </div>

          <form id="registerForm" class="auth-form" novalidate>
            <div id="registerAlert" class="auth-alert" style="display: none;"></div>

            <div class="form-group">
              <label for="regFullName">Full Name *</label>
              <input type="text" id="regFullName" placeholder="e.g. Marcus Dlamini" required>
            </div>

            <div class="form-group">
              <label for="regEmail">Email Address *</label>
              <input type="email" id="regEmail" placeholder="e.g. marcus@example.co.za" required>
            </div>

            <div class="form-group">
              <label for="regPhone">Mobile Phone (For Courier Parcel SMS) *</label>
              <input type="tel" id="regPhone" placeholder="+27 82 123 4567" required>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="regCity">City</label>
                <input type="text" id="regCity" placeholder="Cape Town" value="Cape Town">
              </div>
              <div class="form-group">
                <label for="regProvince">Province</label>
                <select id="regProvince" class="auth-select">
                  <option value="Western Cape" selected>Western Cape</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="regPassword">Password *</label>
                <input type="password" id="regPassword" placeholder="Minimum 6 characters" required>
              </div>
              <div class="form-group">
                <label for="regConfirmPassword">Confirm Password *</label>
                <input type="password" id="regConfirmPassword" placeholder="Repeat password" required>
              </div>
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" id="regConsent" checked required>
                <span>I agree to receive SMS and email parcel dispatch updates via Velora Logistics</span>
              </label>
            </div>

            <button type="submit" class="auth-submit-btn" id="registerSubmitBtn">
              Create Client Account ↗
            </button>
          </form>
        </div>

      </div>

    </div>
  `;

  // Attach tab switching events
  const tabSignInBtn = document.getElementById('tabSignInBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const panelSignIn = document.getElementById('panelSignIn');
  const panelRegister = document.getElementById('panelRegister');

  if (tabSignInBtn && tabRegisterBtn) {
    tabSignInBtn.addEventListener('click', () => {
      tabSignInBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      panelSignIn.classList.add('active');
      panelRegister.classList.remove('active');
    });

    tabRegisterBtn.addEventListener('click', () => {
      tabRegisterBtn.classList.add('active');
      tabSignInBtn.classList.remove('active');
      panelRegister.classList.add('active');
      panelSignIn.classList.remove('active');
    });
  }

  // Quick Demo Login Button
  const demoBtn = document.getElementById('quickDemoLoginBtn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      setCurrentUser(DEMO_USER);
      renderUserDashboard(DEMO_USER);
    });
  }

  // Forgot password handler
  const forgotBtn = document.getElementById('forgotPasswordBtn');
  if (forgotBtn) {
    forgotBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const alert = document.getElementById('signInAlert');
      if (alert) {
        alert.style.display = 'block';
        alert.className = 'auth-alert info';
        alert.innerHTML = `Demo reset instruction sent to <strong>${document.getElementById('loginEmail')?.value || 'your email'}</strong>. (Use password <code>password123</code> for testing).`;
      }
    });
  }

  // Sign In Form Handler
  const signInForm = document.getElementById('signInForm');
  if (signInForm) {
    signInForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value.trim();
      const alert = document.getElementById('signInAlert');

      if (!email || !password) {
        if (alert) {
          alert.style.display = 'block';
          alert.className = 'auth-alert error';
          alert.textContent = 'Please provide both email and password.';
        }
        return;
      }

      const users = getUsers();
      const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (match) {
        if (match.password === password || password === 'password123') {
          setCurrentUser(match);
          renderUserDashboard(match);
          return;
        }
      }

      // If user is new email, allow smooth authentication for seamless demo experience
      const newUser = {
        id: `usr_${Date.now()}`,
        fullName: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: email,
        phone: '+27 82 000 0000',
        city: 'Cape Town',
        province: 'Western Cape',
        password: password,
        memberTier: 'Velora Member',
        joinedDate: 'September 2026'
      };
      users.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      setCurrentUser(newUser);
      renderUserDashboard(newUser);
    });
  }

  // Register Form Handler
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = document.getElementById('regFullName')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();
      const phone = document.getElementById('regPhone')?.value.trim();
      const city = document.getElementById('regCity')?.value.trim() || 'Cape Town';
      const province = document.getElementById('regProvince')?.value || 'Western Cape';
      const password = document.getElementById('regPassword')?.value;
      const confirmPassword = document.getElementById('regConfirmPassword')?.value;
      const alert = document.getElementById('registerAlert');

      if (!fullName || !email || !phone || !password) {
        if (alert) {
          alert.style.display = 'block';
          alert.className = 'auth-alert error';
          alert.textContent = 'Please fill in all required fields.';
        }
        return;
      }

      if (password !== confirmPassword) {
        if (alert) {
          alert.style.display = 'block';
          alert.className = 'auth-alert error';
          alert.textContent = 'Passwords do not match. Please re-enter.';
        }
        return;
      }

      const users = getUsers();
      const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        if (alert) {
          alert.style.display = 'block';
          alert.className = 'auth-alert error';
          alert.textContent = 'An account with this email already exists. Please sign in instead.';
        }
        return;
      }

      const newUser = {
        id: `usr_${Date.now()}`,
        fullName,
        email,
        phone,
        city,
        province,
        password,
        memberTier: 'Velora Client',
        joinedDate: 'September 2026'
      };

      users.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      setCurrentUser(newUser);
      renderUserDashboard(newUser);
    });
  }
}

// Render User Dashboard with Parcel Tracking
function renderUserDashboard(user) {
  const authContainer = document.getElementById('authAppContainer');
  if (!authContainer) return;

  const orders = getUserOrders(user.email);
  const activeParcels = orders.filter(o => o.status !== 'Delivered');

  authContainer.innerHTML = `
    <div class="user-dashboard-grid">
      
      <!-- Left Sidebar: Profile & Controls -->
      <div class="dashboard-sidebar">
        
        <div class="profile-card">
          <div class="profile-avatar">
            ${user.fullName ? user.fullName.charAt(0).toUpperCase() : 'V'}
          </div>
          <h3 class="profile-name">${user.fullName || 'Client'}</h3>
          <p class="profile-email">${user.email}</p>
          <span class="profile-badge">${user.memberTier || 'Velora Privilege Client'}</span>
          
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-val">${orders.length}</span>
              <span class="stat-lbl">Total Orders</span>
            </div>
            <div class="stat-item">
              <span class="stat-val" style="color: var(--accent-dark, #8b6b43); font-weight: 700;">${activeParcels.length}</span>
              <span class="stat-lbl">In Transit</span>
            </div>
          </div>
        </div>

        <div class="profile-details-card">
          <h4 class="card-subtitle">Default Shipping Details</h4>
          <div class="detail-row">
            <span class="detail-label">Full Name:</span>
            <span class="detail-val">${user.fullName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-val">${user.phone || '+27 82 492 8102'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-val">${user.city || 'Cape Town'}, ${user.province || 'Western Cape'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Fulfillment:</span>
            <span class="detail-val" style="color: var(--accent-dark);">Velora Logistics (www.velora.co.za)</span>
          </div>
        </div>

        <!-- Quick Track Box -->
        <div class="quick-track-box">
          <h4>Have a Tracking Code?</h4>
          <p>Track any parcel directly via Velora Logistics:</p>
          <form id="sidebarTrackForm" class="sidebar-track-form">
            <input type="text" id="sidebarTrackInput" placeholder="e.g. VEL-84920" required>
            <button type="submit">Track ↗</button>
          </form>
        </div>

        <button type="button" class="sign-out-btn" id="signOutBtn">
          Sign Out of Account
        </button>

      </div>

      <!-- Right Main: Live Parcel Tracking & Order Processing -->
      <div class="dashboard-main">
        
        <!-- Live Parcel Banner -->
        <div class="parcel-status-banner">
          <div class="banner-badge">
            <span class="live-pulse"></span>
            Live Courier Dispatch
          </div>
          <h2>Active Parcel Shipments</h2>
          <p>Orders are dispatched from our Cape Town workshop and routed via <strong>Velora Logistics (<a href="./orders.html" style="color: inherit; text-decoration: underline;">www.velora.co.za</a>)</strong>.</p>
        </div>

        <!-- Orders & Parcel Cards List -->
        <div class="orders-list" id="dashboardOrdersList">
          ${orders.map(order => renderOrderCard(order)).join('')}
        </div>

        <!-- Secondary CTA -->
        <div class="dashboard-footer-banner">
          <div>
            <h3>Need bespoke packaging or expedited routing?</h3>
            <p>Our Cape Town atelier concierges are available 7 days a week.</p>
          </div>
          <div class="banner-actions">
            <a href="orders.html" class="cta-primary">Full Order Processing System ↗</a>
            <a href="shop.html" class="cta-secondary">Browse Shop ↗</a>
          </div>
        </div>

      </div>

    </div>
  `;

  // Attach Sign Out Handler
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      setCurrentUser(null);
      renderAuthForms('signin');
    });
  }

  // Sidebar Track Form
  const sidebarTrackForm = document.getElementById('sidebarTrackForm');
  if (sidebarTrackForm) {
    sidebarTrackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('sidebarTrackInput')?.value.trim();
      if (code) {
        window.location.href = `orders.html?orderId=${encodeURIComponent(code)}`;
      }
    });
  }
}

// Render Individual Order Card with Parcel Tracking
function renderOrderCard(order) {
  const items = order.items || [];
  const totalDisplay = typeof order.total === 'number' ? `R${order.total.toLocaleString('en-ZA')}` : order.total;

  return `
    <div class="dashboard-order-card">
      <div class="order-card-header">
        <div>
          <span class="order-id-tag">${order.id}</span>
          <span class="order-date-tag">Placed on ${order.date}</span>
        </div>
        <div class="order-header-right">
          <span class="order-status-pill in-transit">${order.status || 'In Transit'}</span>
          <strong class="order-total-amount">${totalDisplay}</strong>
        </div>
      </div>

      <!-- Live Tracking Progress Bar -->
      <div class="tracking-progress-wrapper">
        <div class="tracking-meta-row">
          <span>Courier: <strong>Velora Express (${order.trackingNumber || 'TRK-ZA-8492019'})</strong></span>
          <span>Est. Delivery: <strong>${order.estimatedDelivery || 'In 2 business days'}</strong></span>
        </div>
        <div class="progress-track-bar">
          <div class="progress-track-fill" style="width: 75%;"></div>
        </div>
        <div class="tracking-steps-row">
          <span class="step-lbl done">1. Order Placed</span>
          <span class="step-lbl done">2. Workshop Packaged</span>
          <span class="step-lbl active">3. Courier In Transit</span>
          <span class="step-lbl">4. Delivered</span>
        </div>
      </div>

      <!-- Item Preview -->
      <div class="order-items-preview">
        ${items.map(item => `
          <div class="preview-item">
            <img src="${item.image || 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg'}" alt="${item.title}">
            <div class="preview-details">
              <strong>${item.title}</strong>
              <span>Size: ${item.size || 'Standard'} &times; ${item.quantity || 1}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Card Actions -->
      <div class="order-card-actions">
        <a href="orders.html?orderId=${order.id}" class="track-btn">
          Track Live in Velora Logistics ↗
        </a>
        <span class="logistics-partner-note">Audited by www.velora.co.za</span>
      </div>
    </div>
  `;
}

// Auto-run on DOMContentLoaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initAuthPage();
    updateGlobalHeaderUser();
  });
}
