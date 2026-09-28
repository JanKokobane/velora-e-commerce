const USERS_STORAGE_KEY = 'velora_users_db';
const CURRENT_USER_KEY = 'velora_current_user';
const ORDERS_STORAGE_KEY = 'velora_orders_history';


// ============================================================
// GET ALL USERS
// ============================================================

export function getUsers() {
  const data = localStorage.getItem(USERS_STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    const users = JSON.parse(data);

    return Array.isArray(users) ? users : [];
  } catch (e) {
    console.error('Unable to read Velora users:', e);
    return [];
  }
}


// ============================================================
// SAVE USERS
// ============================================================

export function saveUsers(users) {
  localStorage.setItem(
    USERS_STORAGE_KEY,
    JSON.stringify(users)
  );
}


// ============================================================
// GET CURRENT LOGGED-IN USER
// ============================================================

export function getCurrentUser() {
  const data = localStorage.getItem(CURRENT_USER_KEY);

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(
      'Unable to read current Velora user:',
      e
    );

    localStorage.removeItem(CURRENT_USER_KEY);

    return null;
  }
}


// ============================================================
// SET CURRENT LOGGED-IN USER
// ============================================================

export function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);

    updateGlobalHeaderUser();

    return;
  }

  /*
   * Store only the information required for the
   * current session.
   *
   * Password is NOT stored in the current-user session.
   */
  const sessionUser = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    city: user.city,
    province: user.province,
    street: user.street || '',
    memberTier: user.memberTier || 'Velora Client',
    joinedDate: user.joinedDate || ''
  };

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(sessionUser)
  );

  updateGlobalHeaderUser();
}


// ============================================================
// CHECK LOGIN STATUS
// ============================================================

export function isUserLoggedIn() {
  return !!getCurrentUser();
}


// ============================================================
// LOG USER OUT
// ============================================================

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);

  updateGlobalHeaderUser();
}


// ============================================================
// FIND USER BY EMAIL
// ============================================================

export function findUserByEmail(email) {
  if (!email) {
    return null;
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  const users = getUsers();

  return (
    users.find(
      (user) =>
        user.email &&
        user.email.trim().toLowerCase() ===
          normalizedEmail
    ) || null
  );
}


// ============================================================
// FIND USER BY ID
// ============================================================

export function findUserById(userId) {
  if (!userId) {
    return null;
  }

  const users = getUsers();

  return (
    users.find(
      (user) => user.id === userId
    ) || null
  );
}


// ============================================================
// UPDATE GLOBAL HEADER USER
// ============================================================

export function updateGlobalHeaderUser() {
  const user = getCurrentUser();

  const accountLabels =
    document.querySelectorAll(
      '.account-btn-label, #headerAccountText'
    );

  accountLabels.forEach((el) => {
    if (user && user.fullName) {
      const firstName = user.fullName
        .trim()
        .split(/\s+/)[0];

      el.textContent = firstName;
    } else {
      el.textContent = 'Account';
    }
  });


  const accountLinks =
    document.querySelectorAll(
      '.header-account-link, #headerAccountBtn'
    );

  accountLinks.forEach((link) => {
    const isComponent =
      window.location.pathname.includes(
        '/components/'
      );

    if (user) {
      link.href = isComponent
        ? './account.html'
        : './components/account.html';
    } else {
      link.href = isComponent
        ? './auth.html'
        : './components/auth.html';
    }
  });
}


// ============================================================
// GET CURRENT USER'S ORDERS
// ============================================================

export function getUserOrders() {
  const currentUser = getCurrentUser();

  /*
   * If nobody is logged in, return no orders.
   */
  if (!currentUser || !currentUser.id) {
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
    const orders = JSON.parse(rawOrders);

    if (!Array.isArray(orders)) {
      return [];
    }

    /*
     * Only return orders belonging to the
     * currently logged-in user.
     */
    return orders.filter(
      (order) =>
        order.userId === currentUser.id
    );
  } catch (e) {
    console.error(
      'Unable to read Velora orders:',
      e
    );

    return [];
  }
}


// ============================================================
// GET ORDERS FOR SPECIFIC USER
// ============================================================

export function getOrdersForUser(userId) {
  if (!userId) {
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
    const orders = JSON.parse(rawOrders);

    if (!Array.isArray(orders)) {
      return [];
    }

    return orders.filter(
      (order) =>
        order.userId === userId
    );
  } catch (e) {
    console.error(
      'Unable to read user orders:',
      e
    );

    return [];
  }
}


// ============================================================
// INITIALIZE AUTH PAGE
// ============================================================

export function initAuthPage() {
  const authCard =
    document.getElementById('authCard');

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


  // ----------------------------------------------------------
  // RETURN TARGET
  // ----------------------------------------------------------

  const urlParams =
    new URLSearchParams(
      window.location.search
    );

  const returnTarget =
    urlParams.get('return');


  // ----------------------------------------------------------
  // POST AUTH REDIRECT
  // ----------------------------------------------------------

  function handlePostAuthRedirect() {
    if (returnTarget === 'checkout') {
      window.location.href =
        'checkout.html';
    } else {
      window.location.href =
        'account.html';
    }
  }


  // ----------------------------------------------------------
  // CHECK CURRENT USER
  // ----------------------------------------------------------

  const currentUser =
    getCurrentUser();


  if (currentUser) {

    if (returnTarget === 'checkout') {
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
          currentUser.email || '';
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
      (e) => {

        e.preventDefault();


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
  // SIGN IN FORM
  // ==========================================================

  const signInForm =
    document.getElementById(
      'signInForm'
    );


  if (signInForm) {

    signInForm.addEventListener(
      'submit',
      (e) => {

        e.preventDefault();


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
        // VALIDATION
        // ------------------------------------------------------

        if (!email || !password) {

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
        // FIND EXISTING USER
        // ------------------------------------------------------

        const user =
          findUserByEmail(email);


        /*
         * Do NOT create users during login.
         */

        if (!user) {

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert error';

            alert.textContent =
              'No account was found with this email address. Please create an account first.';
          }

          return;
        }


        // ------------------------------------------------------
        // VERIFY PASSWORD
        // ------------------------------------------------------

        if (user.password !== password) {

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert error';

            alert.textContent =
              'Incorrect password. Please check your password and try again.';
          }

          return;
        }


        // ------------------------------------------------------
        // LOGIN SUCCESS
        // ------------------------------------------------------

        setCurrentUser(user);


        if (alert) {
          alert.style.display =
            'none';

          alert.textContent = '';
        }


        handlePostAuthRedirect();
      }
    );
  }


  // ==========================================================
  // REGISTER FORM
  // ==========================================================

  const registerForm =
    document.getElementById(
      'registerForm'
    );


  if (registerForm) {

    registerForm.addEventListener(
      'submit',
      (e) => {

        e.preventDefault();


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
            ? cityInput.value.trim() ||
              'Cape Town'
            : 'Cape Town';


        const province =
          provinceInput
            ? provinceInput.value ||
              'Western Cape'
            : 'Western Cape';


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
          !password
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
        // PASSWORD LENGTH
        // ------------------------------------------------------

        if (password.length < 6) {

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
        // CHECK EXISTING USER
        // ------------------------------------------------------

        const users =
          getUsers();


        const existing =
          users.find(
            (user) =>
              user.email &&
              user.email
                .trim()
                .toLowerCase() ===
                email
          );


        if (existing) {

          if (alert) {

            alert.style.display =
              'block';

            alert.className =
              'auth-alert error';

            alert.textContent =
              'An account with this email already exists. Please sign in instead.';
          }

          return;
        }


        // ------------------------------------------------------
        // CREATE USER
        // ------------------------------------------------------

        const newUser = {

          id:
            `usr_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 8)}`,

          fullName,

          email,

          phone,

          city,

          province,

          street: '',

          password,

          memberTier:
            'Velora Client',

          joinedDate:
            new Date().toLocaleDateString(
              'en-US',
              {
                month: 'long',
                year: 'numeric'
              }
            )
        };


        // ------------------------------------------------------
        // SAVE NEW USER
        // ------------------------------------------------------

        users.push(newUser);

        saveUsers(users);


        // ------------------------------------------------------
        // LOG NEW USER IN
        // ------------------------------------------------------

        setCurrentUser(newUser);


        // ------------------------------------------------------
        // REDIRECT
        // ------------------------------------------------------

        handlePostAuthRedirect();
      }
    );
  }
}


// ============================================================
// AUTO INITIALIZE
// ============================================================

if (typeof document !== 'undefined') {

  document.addEventListener(
    'DOMContentLoaded',
    () => {

      initAuthPage();

      updateGlobalHeaderUser();
    }
  );
}
