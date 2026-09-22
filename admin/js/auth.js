(function() {
  'use strict';

  window.currentKinderMode = 'login'; // 'login' | 'signup'
  let isPasswordVisible = false;

  const getAuthKey = function() {
    return (window.STORAGE_KEYS && window.STORAGE_KEYS.AUTH_USER) || 'velora_admin_user';
  };

  const getSessionActiveKey = function() {
    return 'velora_admin_session_active';
  };

  function showAuthAlert(message, type = 'error') {
    const alertEl = document.getElementById('kinderAuthAlert');
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.className = `kinder-auth-alert ${type}`;
    alertEl.style.display = 'flex';
  }

  function clearAuthAlert() {
    const alertEl = document.getElementById('kinderAuthAlert');
    if (!alertEl) return;
    alertEl.textContent = '';
    alertEl.style.display = 'none';
  }

  window.adminLogin = function(email, role, name, avatar) {
    const user = {
      email: email || 'kris.evans@velora.co.za',
      role: role || 'Store Director',
      name: name || (email && email.includes('thabo') ? 'Thabo Ndlovu' : email && email.includes('lerato') ? 'Lerato Khumalo' : 'Kristina Evans'),
      avatar: avatar || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&h=100&w=100',
      loginTime: new Date().toISOString()
    };

    try {
      localStorage.setItem(getAuthKey(), JSON.stringify(user));
      sessionStorage.setItem(getSessionActiveKey(), 'true');
      sessionStorage.removeItem('velora_explicit_signout');
    } catch (e) {
      console.warn('[Velora Auth] storage set error:', e);
    }

    // If on standalone auth.html, navigate to dashboard index
    if (window.location.pathname.endsWith('auth.html')) {
      window.location.href = './index.html';
      return;
    }

    window.checkAdminAuthSession();
    if (typeof window.showToast === 'function') {
      window.showToast(`Welcome back, ${user.name} (${user.role})`);
    }
  };

  window.adminSignOut = function() {
    try {
      localStorage.removeItem(getAuthKey());
      sessionStorage.removeItem(getSessionActiveKey());
      sessionStorage.setItem('velora_explicit_signout', 'true');
    } catch (e) {
      console.warn('[Velora Auth] storage remove error:', e);
    }

    clearAuthAlert();
    window.setKinderAuthMode('login', false);

    const emailInput = document.getElementById('kinderEmail');
    if (emailInput) emailInput.value = '';
    const passInput = document.getElementById('kinderPassword');
    if (passInput) passInput.value = '';

    window.checkAdminAuthSession();
    if (typeof window.showToast === 'function') {
      window.showToast('Signed out of Velora Studio Operations');
    }
  };

  window._realAdminSignOut = window.adminSignOut;
  window._realAdminLogin = window.adminLogin;
  window._realShowAuthGate = window.showAuthGate;
  window._realCloseAuthGate = window.closeAuthGate;

  window.checkAdminAuthSession = function() {
    const authScreen = document.getElementById('adminAuthScreen');
    const userPill = document.getElementById('adminProfilePill') || document.getElementById('topbarUserPill');
    const backBtn = document.getElementById('kinderBackToDashBtn');
    const closeBtns = document.querySelectorAll('.kinder-card-close-btn');

    let userRaw = null;
    try {
      userRaw = localStorage.getItem(getAuthKey());
    } catch (e) {
      console.warn('[Velora Auth] localStorage get error:', e);
    }

    let isSessionActive = false;
    try {
      isSessionActive = sessionStorage.getItem(getSessionActiveKey()) === 'true';
    } catch (e) {}

    const isStandaloneAuthPage = window.location.pathname.endsWith('auth.html');

    if (userRaw && isSessionActive) {
      // User is logged in and authenticated in this session: show dashboard
      if (isStandaloneAuthPage) {
        window.location.href = './index.html';
        return;
      }
      if (authScreen) {
        authScreen.style.setProperty('display', 'none', 'important');
        authScreen.classList.add('auth-hidden');
      }
      if (backBtn) backBtn.style.display = 'inline-flex';
      closeBtns.forEach(btn => btn.style.display = 'flex');
      if (userPill) userPill.style.display = 'flex';
      try {
        const u = JSON.parse(userRaw);
        const nameEl = document.getElementById('topbarAdminName');
        const roleEl = document.getElementById('topbarAdminRole');
        const avatarEl = document.getElementById('topbarAdminAvatar');
        if (nameEl && u.name) nameEl.textContent = u.name;
        if (roleEl && (u.role || u.email)) roleEl.textContent = u.role || u.email;
        if (avatarEl && u.avatar) avatarEl.src = u.avatar;
      } catch (e) {
        console.warn(e);
      }
    } else {
      // User is not authenticated: open the auth section first!
      if (authScreen) {
        authScreen.style.setProperty('display', 'flex', 'important');
        authScreen.classList.remove('auth-hidden');
      }
      if (backBtn) backBtn.style.display = 'none';
      closeBtns.forEach(btn => btn.style.display = 'none');
      if (userPill) userPill.style.display = 'none';

      // If user was previously remembered, populate fields for convenient re-entry
      if (userRaw) {
        try {
          const u = JSON.parse(userRaw);
          const emailInput = document.getElementById('kinderEmail');
          const nameInput = document.getElementById('kinderFullName');
          if (emailInput && u.email) emailInput.value = u.email;
          if (nameInput && u.name) nameInput.value = u.name;
        } catch (e) {}
      }
    }
  };

  // Allow closing the auth modal ONLY if already authenticated
  window.closeAuthGate = function() {
    let isSessionActive = false;
    let userRaw = null;
    try {
      userRaw = localStorage.getItem(getAuthKey());
      isSessionActive = sessionStorage.getItem(getSessionActiveKey()) === 'true';
    } catch(e) {}

    if (!userRaw || !isSessionActive) {
      if (typeof window.showToast === 'function') {
        window.showToast('Please sign in to access the Velora Operations dashboard.');
      }
      return;
    }

    const authScreen = document.getElementById('adminAuthScreen');
    if (authScreen) {
      authScreen.style.setProperty('display', 'none', 'important');
      authScreen.classList.add('auth-hidden');
    }
  };

  // Open the auth modal to switch account or re-authenticate
  window.showAuthGate = function() {
    const authScreen = document.getElementById('adminAuthScreen');
    const backBtn = document.getElementById('kinderBackToDashBtn');
    const closeBtns = document.querySelectorAll('.kinder-card-close-btn');
    let userRaw = null;
    let isSessionActive = false;
    try {
      userRaw = localStorage.getItem(getAuthKey());
      isSessionActive = sessionStorage.getItem(getSessionActiveKey()) === 'true';
    } catch (e) {}

    if (authScreen) {
      authScreen.style.setProperty('display', 'flex', 'important');
      authScreen.classList.remove('auth-hidden');
    }
    if (userRaw && isSessionActive) {
      if (backBtn) backBtn.style.display = 'inline-flex';
      closeBtns.forEach(btn => btn.style.display = 'flex');
    } else {
      if (backBtn) backBtn.style.display = 'none';
      closeBtns.forEach(btn => btn.style.display = 'none');
    }
  };

  // Set Auth Mode ('signup' | 'login')
  window.setKinderAuthMode = function(mode, shouldFocus = false) {
    window.currentKinderMode = mode;
    clearAuthAlert();

    const tabLogin = document.getElementById('kinderTabLogin');
    const tabSignUp = document.getElementById('kinderTabSignUp');
    const titleEl = document.getElementById('kinderAuthTitle');
    const subtitleEl = document.getElementById('kinderAuthSubtitle');
    const nameGroup = document.getElementById('kinderNameGroup');
    const confirmPassGroup = document.getElementById('kinderConfirmPasswordGroup');
    const termsText = document.getElementById('kinderTermsText');
    const primaryBtn = document.getElementById('kinderPrimaryBtn');
    const secondaryBtn = document.getElementById('kinderSecondaryBtn');
    const fullNameInput = document.getElementById('kinderFullName');
    const emailInput = document.getElementById('kinderEmail');
    const modeLabel = document.getElementById('kinderPortalModeLabel');

    if (mode === 'signup') {
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabSignUp) tabSignUp.classList.add('active');
      if (titleEl) titleEl.textContent = 'Create Account';
      if (subtitleEl) subtitleEl.textContent = 'Register your credentials to join the Velora Operations team.';
      if (modeLabel) modeLabel.textContent = 'New Staff Registration';
      if (nameGroup) nameGroup.style.display = 'flex';
      if (confirmPassGroup) confirmPassGroup.style.display = 'flex';
      if (fullNameInput) {
        fullNameInput.required = true;
        if (shouldFocus) fullNameInput.focus();
      }
      if (termsText) termsText.textContent = 'I agree to the Velora Security & Access Policy';
      if (primaryBtn) primaryBtn.textContent = 'Create Account & Sign In';
      if (secondaryBtn) secondaryBtn.textContent = 'Already registered? Sign In';
    } else {
      if (tabSignUp) tabSignUp.classList.remove('active');
      if (tabLogin) tabLogin.classList.add('active');
      if (titleEl) titleEl.textContent = 'Welcome Back';
      if (subtitleEl) subtitleEl.textContent = 'Sign in with your authorized studio email to manage operations.';
      if (modeLabel) modeLabel.textContent = 'Secure Operations';
      if (nameGroup) nameGroup.style.display = 'none';
      if (confirmPassGroup) confirmPassGroup.style.display = 'none';
      if (fullNameInput) fullNameInput.required = false;
      if (emailInput && shouldFocus) emailInput.focus();
      if (termsText) termsText.textContent = 'Remember me on this workstation';
      if (primaryBtn) primaryBtn.textContent = 'Sign In';
      if (secondaryBtn) secondaryBtn.textContent = "Don't have an account? Sign Up";
    }
  };

  // Toggle between Signup and Login
  window.toggleKinderAuthMode = function() {
    const nextMode = window.currentKinderMode === 'signup' ? 'login' : 'signup';
    window.setKinderAuthMode(nextMode, true);
  };

  // Toggle Password Masking Visibility
  window.togglePasswordVisibility = function() {
    const passwordInput = document.getElementById('kinderPassword');
    const confirmInput = document.getElementById('kinderConfirmPassword');
    const eyeIcon = document.getElementById('kinderEyeIcon');
    if (!passwordInput) return;

    isPasswordVisible = !isPasswordVisible;
    passwordInput.type = isPasswordVisible ? 'text' : 'password';
    if (confirmInput) confirmInput.type = isPasswordVisible ? 'text' : 'password';

    if (eyeIcon) {
      if (isPasswordVisible) {
        eyeIcon.replaceChildren(
          createSvgElement('path', { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }),
          createSvgElement('circle', { cx: '12', cy: '12', r: '3' })
        );
      } else {
        eyeIcon.replaceChildren(
          createSvgElement('path', { d: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' }),
          createSvgElement('line', { x1: '1', y1: '1', x2: '23', y2: '23' })
        );
      }
    }
  };

  function createSvgElement(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
  }

  // Quick Demo Account Auto-Fill & Login
  window.fillKinderAccount = function(who) {
    clearAuthAlert();
    const fullNameInput = document.getElementById('kinderFullName');
    const emailInput = document.getElementById('kinderEmail');
    const passwordInput = document.getElementById('kinderPassword');
    const confirmInput = document.getElementById('kinderConfirmPassword');

    if (who === 'kris') {
      if (fullNameInput) fullNameInput.value = 'Kristina Evans';
      if (emailInput) emailInput.value = 'kris.evans@velora.co.za';
      if (passwordInput) passwordInput.value = 'velora2026';
      if (confirmInput) confirmInput.value = 'velora2026';
      window.adminLogin('kris.evans@velora.co.za', 'Store Director', 'Kristina Evans', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&h=100&w=100');
    } else if (who === 'thabo') {
      if (fullNameInput) fullNameInput.value = 'Thabo Ndlovu';
      if (emailInput) emailInput.value = 'thabo.ndlovu@velora.co.za';
      if (passwordInput) passwordInput.value = 'velora2026';
      if (confirmInput) confirmInput.value = 'velora2026';
      window.adminLogin('thabo.ndlovu@velora.co.za', 'Logistics Lead', 'Thabo Ndlovu', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=100&w=100');
    } else if (who === 'lerato') {
      if (fullNameInput) fullNameInput.value = 'Lerato Khumalo';
      if (emailInput) emailInput.value = 'lerato.khumalo@velora.co.za';
      if (passwordInput) passwordInput.value = 'velora2026';
      if (confirmInput) confirmInput.value = 'velora2026';
      window.adminLogin('lerato.khumalo@velora.co.za', 'Client Concierge', 'Lerato Khumalo', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&h=100&w=100');
    }
  };

  // Robust Form Submit Handler
  window.handleKinderAuthSubmit = function(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    clearAuthAlert();

    const fullNameInput = document.getElementById('kinderFullName');
    const emailInput = document.getElementById('kinderEmail');
    const passwordInput = document.getElementById('kinderPassword');
    const confirmInput = document.getElementById('kinderConfirmPassword');

    const name = fullNameInput ? fullNameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirmPass = confirmInput ? confirmInput.value : '';

    if (!email) {
      showAuthAlert('Please enter your email address.');
      if (emailInput) emailInput.focus();
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showAuthAlert('Please enter a valid email format (e.g. name@velora.co.za).');
      if (emailInput) emailInput.focus();
      return;
    }

    if (!password) {
      showAuthAlert('Please enter your password.');
      if (passwordInput) passwordInput.focus();
      return;
    }

    if (password.length < 4) {
      showAuthAlert('Password must be at least 4 characters long.');
      if (passwordInput) passwordInput.focus();
      return;
    }

    if (window.currentKinderMode === 'signup') {
      if (!name) {
        showAuthAlert('Please enter your full name to create an account.');
        if (fullNameInput) fullNameInput.focus();
        return;
      }
      if (confirmPass && password !== confirmPass) {
        showAuthAlert('Passwords do not match. Please verify.');
        if (confirmInput) confirmInput.focus();
        return;
      }
      showAuthAlert('Account created successfully! Signing in...', 'success');
      window.adminLogin(email, 'Store Operations Specialist', name);
    } else {
      showAuthAlert('Authenticating credentials...', 'success');
      window.adminLogin(email, 'Store Director', name || 'Kristina Evans');
    }
  };

  // Initialization function
  window.initAuth = function() {
    const authForm = document.getElementById('kinderAuthForm');
    if (authForm && !authForm._hasAuthSubmitListener) {
      authForm._hasAuthSubmitListener = true;
      authForm.addEventListener('submit', window.handleKinderAuthSubmit);
    }

    const eyeBtn = document.getElementById('kinderEyeToggle');
    if (eyeBtn && !eyeBtn._hasEyeClickListener) {
      eyeBtn._hasEyeClickListener = true;
      eyeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.togglePasswordVisibility();
      });
    }

    if (!window._hasAuthEscListener) {
      window._hasAuthEscListener = true;
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          let userRaw = null;
          try { userRaw = localStorage.getItem(getAuthKey()); } catch(err) {}
          if (userRaw) {
            window.closeAuthGate();
          }
        }
      });
    }

    window.setKinderAuthMode('login', false);
    window.checkAdminAuthSession();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initAuth);
  } else {
    window.initAuth();
  }

})();
