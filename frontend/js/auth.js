const USERS_STORAGE_KEY = 'velora_users_db';
const CURRENT_USER_KEY = 'velora_current_user';
const ORDERS_STORAGE_KEY = 'velora_orders_history';

// Pre-seeded demo user
export const DEMO_USER = {
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

  const accountLinks = document.querySelectorAll('.header-account-link, #headerAccountBtn');
  accountLinks.forEach((link) => {
    const isComponent = window.location.pathname.includes('/components/');
    if (user) {
      link.href = isComponent ? './account.html' : './components/account.html';
    } else {
      link.href = isComponent ? './auth.html' : './components/auth.html';
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
  const authCard = document.getElementById('authCard');
  const alreadySignedInCard = document.getElementById('alreadySignedInCard');
  if (!authCard && !alreadySignedInCard) return;

  const urlParams = new URLSearchParams(window.location.search);
  const returnTarget = urlParams.get('return');

  function handlePostAuthRedirect() {
    if (returnTarget === 'checkout') {
      window.location.href = 'checkout.html';
    } else {
      window.location.href = 'account.html';
    }
  }

  const currentUser = getCurrentUser();

  if (currentUser) {
    if (returnTarget === 'checkout') {
      window.location.href = 'checkout.html';
      return;
    }
    if (alreadySignedInCard) {
      alreadySignedInCard.style.display = 'block';
      const avatarEl = document.getElementById('signedInAvatar');
      const greetingEl = document.getElementById('signedInGreeting');
      const emailEl = document.getElementById('signedInEmail');
      const tierEl = document.getElementById('signedInTier');

      if (avatarEl) {
        avatarEl.textContent = currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'V';
      }
      if (greetingEl) {
        greetingEl.textContent = `You are signed in as ${currentUser.fullName || 'Client'}`;
      }
      if (emailEl) {
        emailEl.textContent = currentUser.email || '';
      }
      if (tierEl) {
        tierEl.textContent = currentUser.memberTier || 'Velora Privilege Client';
      }
    }
    if (authCard) {
      authCard.style.display = 'none';
    }
  } else {
    if (alreadySignedInCard) {
      alreadySignedInCard.style.display = 'none';
    }
  }

  // Tab Navigation
  const tabSignInBtn = document.getElementById('tabSignInBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const panelSignIn = document.getElementById('panelSignIn');
  const panelRegister = document.getElementById('panelRegister');

  if (tabSignInBtn && tabRegisterBtn && panelSignIn && panelRegister) {
    tabSignInBtn.addEventListener('click', () => {
      tabSignInBtn.classList.add('active');
      tabSignInBtn.setAttribute('aria-selected', 'true');
      tabRegisterBtn.classList.remove('active');
      tabRegisterBtn.setAttribute('aria-selected', 'false');

      panelSignIn.classList.add('active');
      panelRegister.classList.remove('active');
    });

    tabRegisterBtn.addEventListener('click', () => {
      tabRegisterBtn.classList.add('active');
      tabRegisterBtn.setAttribute('aria-selected', 'true');
      tabSignInBtn.classList.remove('active');
      tabSignInBtn.setAttribute('aria-selected', 'false');

      panelRegister.classList.add('active');
      panelSignIn.classList.remove('active');
    });
  }

  // Quick Demo Login Button
  const demoBtn = document.getElementById('quickDemoLoginBtn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      setCurrentUser(DEMO_USER);
      handlePostAuthRedirect();
    });
  }

  // Sign out button on already-signed-in card
  const authSignOutBtn = document.getElementById('authSignOutBtn');
  if (authSignOutBtn) {
    authSignOutBtn.addEventListener('click', () => {
      setCurrentUser(null);
      if (alreadySignedInCard) alreadySignedInCard.style.display = 'none';
      if (authCard) authCard.style.display = 'block';
    });
  }

  // Forgot password handler
  const forgotBtn = document.getElementById('forgotPasswordBtn');
  if (forgotBtn) {
    forgotBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const alert = document.getElementById('signInAlert');
      const emailInput = document.getElementById('loginEmail');
      const email = emailInput ? emailInput.value.trim() : 'your email';
      if (alert) {
        alert.style.display = 'block';
        alert.className = 'auth-alert info';
        alert.textContent = `Demo reset instruction sent to ${email || 'your email'}. (Use password password123 for testing).`;
      }
    });
  }

  // Sign In Form Handler
  const signInForm = document.getElementById('signInForm');
  if (signInForm) {
    signInForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');
      const alert = document.getElementById('signInAlert');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';

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
          handlePostAuthRedirect();
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
      handlePostAuthRedirect();
    });
  }

  // Register Form Handler
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullNameInput = document.getElementById('regFullName');
      const emailInput = document.getElementById('regEmail');
      const phoneInput = document.getElementById('regPhone');
      const cityInput = document.getElementById('regCity');
      const provinceInput = document.getElementById('regProvince');
      const passwordInput = document.getElementById('regPassword');
      const confirmPasswordInput = document.getElementById('regConfirmPassword');
      const alert = document.getElementById('registerAlert');

      const fullName = fullNameInput ? fullNameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const city = cityInput ? cityInput.value.trim() || 'Cape Town' : 'Cape Town';
      const province = provinceInput ? provinceInput.value || 'Western Cape' : 'Western Cape';
      const password = passwordInput ? passwordInput.value : '';
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

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
      handlePostAuthRedirect();
    });
  }
}

// Auto-run on DOMContentLoaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initAuthPage();
    updateGlobalHeaderUser();
  });
}
