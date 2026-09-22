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

  function clearAuthAlert() {
    const alertEl = document.getElementById('kinderAuthAlert');
    if (!alertEl) return;
    alertEl.textContent = '';
    alertEl.style.display = 'none';
  }

  function createSvgElement(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
  }

  // --- LOGOUT LOGIC ---
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

    if (typeof window.checkAdminAuthSession === 'function') {
      window.checkAdminAuthSession();
    }

    if (typeof window.showToast === 'function') {
      window.showToast('Signed out of Velora Studio Operations');
    }
  };

  // --- FORM SWITCH LOGIC ---
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
      if (subtitleEl) subtitleEl.textContent = 'Register your credentials.';
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
      if (subtitleEl) subtitleEl.textContent = 'Sign in with your email to manage operations.';
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

  window.toggleKinderAuthMode = function() {
    const nextMode = window.currentKinderMode === 'signup' ? 'login' : 'signup';
    window.setKinderAuthMode(nextMode, true);
  };

  // --- PASSWORD VIEW LOGIC ---
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

  // --- INITIALIZATION ---
  window.initAuth = function() {
    const eyeBtn = document.getElementById('kinderEyeToggle');
    if (eyeBtn && !eyeBtn._hasEyeClickListener) {
      eyeBtn._hasEyeClickListener = true;
      eyeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.togglePasswordVisibility();
      });
    }

    window.setKinderAuthMode('login', false);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initAuth);
  } else {
    window.initAuth();
  }

})();