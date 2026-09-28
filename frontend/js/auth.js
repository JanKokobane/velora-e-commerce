// ============================================================
// VELORA AUTHENTICATION
// ============================================================
// Backend/PostgreSQL is the ONLY source of truth.
//
// Backend:
// https://velora-e-commerce-qby7.onrender.com
//
// Routes:
// POST /api/users/register
// POST /api/users/login
// GET  /api/users/me
// ============================================================

const API_BASE_URL =
  window.VELORA_API_BASE_URL ||
  'https://velora-e-commerce-qby7.onrender.com';

const AUTH_TOKEN_KEY = 'velora_auth_token';
const CURRENT_USER_KEY = 'velora_current_user';
const ORDERS_STORAGE_KEY = 'velora_orders_history';


// ============================================================
// API REQUEST HELPER
// ============================================================

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}.`;

    const requestError = new Error(message);

    requestError.status = response.status;
    requestError.data = data;

    throw requestError;
  }

  return data;
}


// ============================================================
// VALIDATE EMAIL
// ============================================================

function isValidEmail(email) {
  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// ============================================================
// NORMALIZE USER FROM BACKEND
// ============================================================

function normalizeUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  if (!user.id || !user.email) {
    return null;
  }

  return {
    id: user.id,

    fullName:
      user.fullName ??
      user.full_name ??
      '',

    email:
      user.email ??
      '',

    phone:
      user.phone ??
      '',

    city:
      user.city ??
      '',

    province:
      user.province ??
      '',

    street:
      user.street ??
      '',

    memberTier:
      user.memberTier ??
      user.member_tier ??
      'Velora Client',

    joinedDate:
      user.joinedDate ??
      user.joined_date ??
      user.createdAt ??
      user.created_at ??
      ''
  };
}


// ============================================================
// GET AUTH TOKEN
// ============================================================

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}


// ============================================================
// SAVE AUTH TOKEN
// ============================================================

function setAuthToken(token) {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return false;
  }

  localStorage.setItem(
    AUTH_TOKEN_KEY,
    token
  );

  return true;
}


// ============================================================
// GET CURRENT USER
// ============================================================
//
// This reads the current frontend session.
//
// IMPORTANT:
// The authoritative version is fetchCurrentUser(),
// which asks the backend /api/users/me.
// ============================================================

export function getCurrentUser() {
  const data =
    localStorage.getItem(
      CURRENT_USER_KEY
    );

  if (!data) {
    return null;
  }

  try {
    const user = JSON.parse(data);

    if (
      !user ||
      !user.id ||
      !user.email
    ) {
      localStorage.removeItem(
        CURRENT_USER_KEY
      );

      return null;
    }

    return user;

  } catch (error) {
    console.error(
      'Unable to read current Velora user:',
      error
    );

    localStorage.removeItem(
      CURRENT_USER_KEY
    );

    return null;
  }
}


// ============================================================
// SAVE CURRENT USER
// ============================================================
//
// NEVER save passwords.
// NEVER save password_hash.
// ============================================================

function saveCurrentUser(user) {
  const normalizedUser =
    normalizeUser(user);

  if (!normalizedUser) {
    localStorage.removeItem(
      CURRENT_USER_KEY
    );

    return false;
  }

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(normalizedUser)
  );

  return true;
}


// ============================================================
// SET CURRENT USER
// ============================================================
//
// This function only stores a user returned by the backend.
// It does NOT create users.
// It does NOT validate passwords.
// ============================================================

export function setCurrentUser(user) {
  const normalizedUser =
    normalizeUser(user);

  if (!normalizedUser) {
    localStorage.removeItem(
      CURRENT_USER_KEY
    );

    updateGlobalHeaderUser();

    return false;
  }

  const saved =
    saveCurrentUser(normalizedUser);

  updateGlobalHeaderUser();

  return saved;
}


// ============================================================
// FETCH CURRENT USER FROM BACKEND
// ============================================================
//
// This is the authoritative session check.
//
// GET:
// https://velora-e-commerce-qby7.onrender.com/api/users/me
// ============================================================

export async function fetchCurrentUser() {
  const token = getAuthToken();

  if (!token) {
    localStorage.removeItem(
      CURRENT_USER_KEY
    );

    return null;
  }

  try {
    const data =
      await apiRequest(
        '/api/users/me',
        {
          method: 'GET'
        }
      );

    if (
      !data ||
      data.success !== true ||
      !data.user
    ) {
      throw new Error(
        'Unable to verify your account.'
      );
    }

    const user =
      normalizeUser(data.user);

    if (!user) {
      throw new Error(
        'The server returned an invalid user account.'
      );
    }

    saveCurrentUser(user);

    updateGlobalHeaderUser();

    return user;

  } catch (error) {

    console.error(
      'Unable to verify current Velora user:',
      error
    );

    // Token is invalid/expired.
    if (
      error.status === 401
    ) {
      logoutUser();
    }

    return null;
  }
}


// ============================================================
// CHECK LOGIN STATUS
// ============================================================
//
// This checks whether a token and local session exist.
// Pages requiring strict authentication should call
// fetchCurrentUser().
// ============================================================

export function isUserLoggedIn() {
  return !!(
    getAuthToken() &&
    getCurrentUser()
  );
}


// ============================================================
// LOG USER OUT
// ============================================================

export function logoutUser() {
  localStorage.removeItem(
    AUTH_TOKEN_KEY
  );

  localStorage.removeItem(
    CURRENT_USER_KEY
  );

  localStorage.removeItem(
    'velora_last_order'
  );

  localStorage.removeItem(
    'velora_shipping_details'
  );

  localStorage.removeItem(
    ORDERS_STORAGE_KEY
  );

  updateGlobalHeaderUser();
}


// ============================================================
// LOGIN USER
// ============================================================
//
// IMPORTANT:
// There is NO localStorage user lookup.
// There is NO local password comparison.
//
// The backend verifies:
// email + password
//
// PostgreSQL is the source of truth.
// ============================================================

export async function loginUser(
  email,
  password
) {
  const normalizedEmail =
    String(email || '')
      .trim()
      .toLowerCase();

  if (
    !normalizedEmail ||
    !password
  ) {
    throw new Error(
      'Please provide both email and password.'
    );
  }

  if (
    !isValidEmail(normalizedEmail)
  ) {
    throw new Error(
      'Please enter a valid email address.'
    );
  }



  const data =
    await apiRequest(
      '/api/users/login',
      {
        method: 'POST',

        body: JSON.stringify({
          email: normalizedEmail,
          password
        })
      }
    );

  if (
    !data ||
    data.success !== true ||
    !data.token ||
    !data.user
  ) {
    throw new Error(
      data?.message ||
      'Login failed. Please check your credentials.'
    );
  }

  // Save JWT returned by backend.
  const tokenSaved =
    setAuthToken(data.token);

  if (!tokenSaved) {
    throw new Error(
      'Unable to create your login session.'
    );
  }

  const user =
    normalizeUser(data.user);

  if (!user) {
    localStorage.removeItem(
      AUTH_TOKEN_KEY
    );

    throw new Error(
      'The server returned an invalid user account.'
    );
  }

  saveCurrentUser(user);

  updateGlobalHeaderUser();

  return user;
}


// ============================================================
// REGISTER USER
// ============================================================
//
// Registration is handled by PostgreSQL through the backend.
//
// The frontend NEVER:
// - creates a user ID
// - saves a password
// - saves a user to velora_users_db
// ============================================================

export async function registerUser({
  fullName,
  email,
  phone,
  city,
  province,
  password,
  consent = false
}) {
  const normalizedFullName =
    String(fullName || '').trim();

  const normalizedEmail =
    String(email || '')
      .trim()
      .toLowerCase();

  const normalizedPhone =
    String(phone || '').trim();

  const normalizedCity =
    String(city || '').trim();

  const normalizedProvince =
    String(province || '').trim();

  if (
    !normalizedFullName ||
    !normalizedEmail ||
    !normalizedPhone ||
    !normalizedCity ||
    !normalizedProvince ||
    !password
  ) {
    throw new Error(
      'Please fill in all required fields.'
    );
  }

  if (
    !isValidEmail(normalizedEmail)
  ) {
    throw new Error(
      'Please enter a valid email address.'
    );
  }

  if (password.length < 6) {
    throw new Error(
      'Password must contain at least 6 characters.'
    );
  }

 

  const data =
    await apiRequest(
      '/api/users/register',
      {
        method: 'POST',

        body: JSON.stringify({
          fullName:
            normalizedFullName,

          email:
            normalizedEmail,

          phone:
            normalizedPhone,

          city:
            normalizedCity,

          province:
            normalizedProvince,

          password,

          consent:
            Boolean(consent)
        })
      }
    );

  if (
    !data ||
    data.success !== true
  ) {
    throw new Error(
      data?.message ||
      'Registration failed. Please try again.'
    );
  }

  return data;
}


// ============================================================
// FIND USER BY EMAIL
// ============================================================
//
// Compatibility function.
//
// IMPORTANT:
// This does NOT search a local users database.
//
// It only checks the currently authenticated user.
// ============================================================

export function findUserByEmail(email) {
  const currentUser =
    getCurrentUser();

  if (
    !currentUser ||
    !email
  ) {
    return null;
  }

  const normalizedEmail =
    String(email)
      .trim()
      .toLowerCase();

  if (
    currentUser.email
      .trim()
      .toLowerCase() ===
    normalizedEmail
  ) {
    return currentUser;
  }

  return null;
}


// ============================================================
// FIND USER BY ID
// ============================================================
//
// Compatibility function.
//
// It only returns the currently authenticated user.
// ============================================================

export function findUserById(userId) {
  const currentUser =
    getCurrentUser();

  if (
    !currentUser ||
    !userId
  ) {
    return null;
  }

  return (
    currentUser.id === userId
      ? currentUser
      : null
  );
}


// ============================================================
// UPDATE GLOBAL HEADER USER
// ============================================================

export function updateGlobalHeaderUser() {
  const user =
    getCurrentUser();

  const accountLabels =
    document.querySelectorAll(
      '.account-btn-label, #headerAccountText'
    );

  accountLabels.forEach(
    (element) => {

      if (
        user &&
        user.fullName
      ) {
        const firstName =
          user.fullName
            .trim()
            .split(/\s+/)[0];

        element.textContent =
          firstName;

      } else {
        element.textContent =
          'Account';
      }
    }
  );


  const accountLinks =
    document.querySelectorAll(
      '.header-account-link, #headerAccountBtn'
    );

  accountLinks.forEach(
    (link) => {

      const isComponent =
        window.location.pathname.includes(
          '/components/'
        );

      if (user) {

        link.href =
          isComponent
            ? './account.html'
            : './components/account.html';

      } else {

        link.href =
          isComponent
            ? './auth.html'
            : './components/auth.html';
      }
    }
  );
}


// ============================================================
// GET CURRENT USER'S ORDERS
// ============================================================
//
// Orders can remain in localStorage for now.
//
// They are filtered using the authenticated backend
// user's ID.
// ============================================================

export function getUserOrders() {
  const currentUser =
    getCurrentUser();

  if (
    !currentUser ||
    !currentUser.id
  ) {
    return [];
  }

  const rawOrders =
    localStorage.getItem(
      ORDERS_STORAGE_KEY
    );

  if (!rawOrders) {
    return [];
  }

  try {

    const orders =
      JSON.parse(rawOrders);

    if (!Array.isArray(orders)) {
      return [];
    }

    return orders.filter(
      (order) =>
        order &&
        order.userId ===
          currentUser.id
    );

  } catch (error) {

    console.error(
      'Unable to read Velora orders:',
      error
    );

    return [];
  }
}


// ============================================================
// GET ORDERS FOR SPECIFIC USER
// ============================================================
//
// Security:
// A normal user can only request their own orders.
// ============================================================

export function getOrdersForUser(userId) {
  const currentUser =
    getCurrentUser();

  if (
    !currentUser ||
    !currentUser.id ||
    currentUser.id !== userId
  ) {
    return [];
  }

  return getUserOrders();
}


// ============================================================
// INITIALIZE AUTH PAGE
// ============================================================

export function initAuthPage() {

  const authCard =
    document.getElementById(
      'authCard'
    );

  const alreadySignedInCard =
    document.getElementById(
      'alreadySignedInCard'
    );

  if (
    !authCard &&
    !alreadySignedInCard
  ) {
    return;
  }


  // ==========================================================
  // RETURN TARGET
  // ==========================================================

  const urlParams =
    new URLSearchParams(
      window.location.search
    );

  const returnTarget =
    urlParams.get('return');


  // ==========================================================
  // POST AUTH REDIRECT
  // ==========================================================

  function handlePostAuthRedirect() {

    if (
      returnTarget ===
      'checkout'
    ) {

      window.location.href =
        'checkout.html';

    } else {

      window.location.href =
        'account.html';
    }
  }


  // ==========================================================
  // CHECK CURRENT SESSION
  // ==========================================================

  const currentUser =
    getCurrentUser();

  if (currentUser) {

    if (
      returnTarget ===
      'checkout'
    ) {

      window.location.href =
        'checkout.html';

      return;
    }


    if (alreadySignedInCard) {

      alreadySignedInCard.style.display =
        'block';


      const avatarEl =
        document.getElementById(
          'signedInAvatar'
        );

      const greetingEl =
        document.getElementById(
          'signedInGreeting'
        );

      const emailEl =
        document.getElementById(
          'signedInEmail'
        );

      const tierEl =
        document.getElementById(
          'signedInTier'
        );


      if (avatarEl) {

        avatarEl.textContent =
          currentUser.fullName
            ? currentUser.fullName
                .charAt(0)
                .toUpperCase()
            : 'V';
      }


      if (greetingEl) {

        greetingEl.textContent =
          `You are signed in as ${
            currentUser.fullName ||
            'Client'
          }`;
      }


      if (emailEl) {

        emailEl.textContent =
          currentUser.email ||
          '';
      }


      if (tierEl) {

        tierEl.textContent =
          currentUser.memberTier ||
          'Velora Client';
      }
    }


    if (authCard) {

      authCard.style.display =
        'none';
    }

  } else {

    if (alreadySignedInCard) {

      alreadySignedInCard.style.display =
        'none';
    }

    if (authCard) {

      authCard.style.display =
        'block';
    }
  }


  // ==========================================================
  // TAB NAVIGATION
  // ==========================================================

  const tabSignInBtn =
    document.getElementById(
      'tabSignInBtn'
    );

  const tabRegisterBtn =
    document.getElementById(
      'tabRegisterBtn'
    );

  const panelSignIn =
    document.getElementById(
      'panelSignIn'
    );

  const panelRegister =
    document.getElementById(
      'panelRegister'
    );


  if (
    tabSignInBtn &&
    tabRegisterBtn &&
    panelSignIn &&
    panelRegister
  ) {

    tabSignInBtn.addEventListener(
      'click',
      () => {

        tabSignInBtn.classList.add(
          'active'
        );

        tabSignInBtn.setAttribute(
          'aria-selected',
          'true'
        );

        tabRegisterBtn.classList.remove(
          'active'
        );

        tabRegisterBtn.setAttribute(
          'aria-selected',
          'false'
        );

        panelSignIn.classList.add(
          'active'
        );

        panelRegister.classList.remove(
          'active'
        );
      }
    );


    tabRegisterBtn.addEventListener(
      'click',
      () => {

        tabRegisterBtn.classList.add(
          'active'
        );

        tabRegisterBtn.setAttribute(
          'aria-selected',
          'true'
        );

        tabSignInBtn.classList.remove(
          'active'
        );

        tabSignInBtn.setAttribute(
          'aria-selected',
          'false'
        );

        panelRegister.classList.add(
          'active'
        );

        panelSignIn.classList.remove(
          'active'
        );
      }
    );
  }


  // ==========================================================
  // SIGN OUT
  // ==========================================================

  const authSignOutBtn =
    document.getElementById(
      'authSignOutBtn'
    );

  if (authSignOutBtn) {

    authSignOutBtn.addEventListener(
      'click',
      () => {

        logoutUser();

        if (alreadySignedInCard) {

          alreadySignedInCard.style.display =
            'none';
        }

        if (authCard) {

          authCard.style.display =
            'block';
        }
      }
    );
  }


  // ==========================================================
  // FORGOT PASSWORD
  // ==========================================================

  const forgotBtn =
    document.getElementById(
      'forgotPasswordBtn'
    );

  if (forgotBtn) {

    forgotBtn.addEventListener(
      'click',
      (event) => {

        event.preventDefault();

        const alert =
          document.getElementById(
            'signInAlert'
          );

        if (alert) {

          alert.style.display =
            'block';

          alert.className =
            'auth-alert info';

          alert.textContent =
            'Password reset is currently unavailable in this version. Please contact Velora support.';
        }
      }
    );
  }


  // ==========================================================
  // SIGN IN
  // ==========================================================

  const signInForm =
    document.getElementById(
      'signInForm'
    );

  if (signInForm) {

    signInForm.addEventListener(
      'submit',
      async (event) => {

        event.preventDefault();


        const emailInput =
          document.getElementById(
            'loginEmail'
          );

        const passwordInput =
          document.getElementById(
            'loginPassword'
          );

        const alert =
          document.getElementById(
            'signInAlert'
          );


        const email =
          emailInput
            ? emailInput.value
                .trim()
                .toLowerCase()
            : '';

        const password =
          passwordInput
            ? passwordInput.value
            : '';


        // ------------------------------------------------------
        // REQUIRED FIELDS
        // ------------------------------------------------------

        if (
          !email ||
          !password
        ) {

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert error';

            alert.textContent =
              'Please provide both email and password.';
          }

          return;
        }


        // ------------------------------------------------------
        // EMAIL VALIDATION
        // ------------------------------------------------------

        if (
          !isValidEmail(email)
        ) {

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert error';

            alert.textContent =
              'Please enter a valid email address.';
          }

          return;
        }


        // ------------------------------------------------------
        // LOGIN AGAINST BACKEND
        // ------------------------------------------------------

        try {

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert info';

            alert.textContent =
              'Signing you in...';
          }


          const user =
            await loginUser(
              email,
              password
            );


          if (!user) {

            throw new Error(
              'Unable to sign you in.'
            );
          }


          // ----------------------------------------------------
          // LOGIN SUCCESS
          // ----------------------------------------------------

          if (alert) {

            alert.style.display =
              'none';

            alert.textContent =
              '';
          }


          handlePostAuthRedirect();

        } catch (error) {

          console.error(
            'Velora login failed:',
            error
          );


          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert error';

            alert.textContent =
              error?.message ||
              'Login failed. Please check your email and password.';
          }
        }
      }
    );
  }


  // ==========================================================
  // REGISTER
  // ==========================================================

  const registerForm =
    document.getElementById(
      'registerForm'
    );

  if (registerForm) {

    registerForm.addEventListener(
      'submit',
      async (event) => {

        event.preventDefault();


        const fullNameInput =
          document.getElementById(
            'regFullName'
          );

        const emailInput =
          document.getElementById(
            'regEmail'
          );

        const phoneInput =
          document.getElementById(
            'regPhone'
          );

        const cityInput =
          document.getElementById(
            'regCity'
          );

        const provinceInput =
          document.getElementById(
            'regProvince'
          );

        const passwordInput =
          document.getElementById(
            'regPassword'
          );

        const confirmPasswordInput =
          document.getElementById(
            'regConfirmPassword'
          );

        const alert =
          document.getElementById(
            'registerAlert'
          );


        const fullName =
          fullNameInput
            ? fullNameInput.value.trim()
            : '';

        const email =
          emailInput
            ? emailInput.value
                .trim()
                .toLowerCase()
            : '';

        const phone =
          phoneInput
            ? phoneInput.value.trim()
            : '';

        const city =
          cityInput
            ? cityInput.value.trim()
            : '';

        const province =
          provinceInput
            ? provinceInput.value.trim()
            : '';

        const password =
          passwordInput
            ? passwordInput.value
            : '';

        const confirmPassword =
          confirmPasswordInput
            ? confirmPasswordInput.value
            : '';


        // ------------------------------------------------------
        // REQUIRED FIELDS
        // ------------------------------------------------------

        if (
          !fullName ||
          !email ||
          !phone ||
          !city ||
          !province ||
          !password ||
          !confirmPassword
        ) {

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert error';

            alert.textContent =
              'Please fill in all required fields.';
          }

          return;
        }


        // ------------------------------------------------------
        // EMAIL VALIDATION
        // ------------------------------------------------------

        if (
          !isValidEmail(email)
        ) {

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert error';

            alert.textContent =
              'Please enter a valid email address.';
          }

          return;
        }


        // ------------------------------------------------------
        // PASSWORD LENGTH
        // ------------------------------------------------------

        if (
          password.length < 6
        ) {

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert error';

            alert.textContent =
              'Password must contain at least 6 characters.';
          }

          return;
        }


        // ------------------------------------------------------
        // CONFIRM PASSWORD
        // ------------------------------------------------------

        if (
          password !==
          confirmPassword
        ) {

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert error';

            alert.textContent =
              'Passwords do not match. Please re-enter.';
          }

          return;
        }


        // ------------------------------------------------------
        // REGISTER THROUGH BACKEND
        // ------------------------------------------------------
        //
        // IMPORTANT:
        // We DO NOT:
        //
        // - call getUsers()
        // - search velora_users_db
        // - create a fake ID
        // - save a password in localStorage
        // - call saveUsers()
        //
        // PostgreSQL handles all of that.
        // ------------------------------------------------------

        try {

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert info';

            alert.textContent =
              'Creating your Velora account...';
          }


          await registerUser({
            fullName,
            email,
            phone,
            city,
            province,
            password,
            consent: false
          });


          // ----------------------------------------------------
          // REGISTRATION SUCCESS
          // ----------------------------------------------------

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert success';

            alert.textContent =
              'Your account has been created successfully. Please sign in.';
          }


          // ----------------------------------------------------
          // SWITCH TO SIGN-IN TAB
          // ----------------------------------------------------

          if (
            tabSignInBtn &&
            tabRegisterBtn &&
            panelSignIn &&
            panelRegister
          ) {

            tabSignInBtn.classList.add(
              'active'
            );

            tabSignInBtn.setAttribute(
              'aria-selected',
              'true'
            );

            tabRegisterBtn.classList.remove(
              'active'
            );

            tabRegisterBtn.setAttribute(
              'aria-selected',
              'false'
            );

            panelSignIn.classList.add(
              'active'
            );

            panelRegister.classList.remove(
              'active'
            );
          }


          // ----------------------------------------------------
          // PUT REGISTERED EMAIL INTO LOGIN FORM
          // ----------------------------------------------------

          const loginEmail =
            document.getElementById(
              'loginEmail'
            );

          if (loginEmail) {
            loginEmail.value =
              email;
          }


          // Clear passwords.
          if (passwordInput) {
            passwordInput.value =
              '';
          }

          if (confirmPasswordInput) {
            confirmPasswordInput.value =
              '';
          }

        } catch (error) {

          console.error(
            'Velora registration failed:',
            error
          );


          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert error';

            alert.textContent =
              error?.message ||
              'Registration failed. Please try again.';
          }
        }
      }
    );
  }
}


// ============================================================
// AUTO INITIALIZE
// ============================================================

if (
  typeof document !==
  'undefined'
) {

  document.addEventListener(
    'DOMContentLoaded',
    () => {

      initAuthPage();

      updateGlobalHeaderUser();
    }
  );
}