const USERS_STORAGE_KEY = 'velora_users_db';
const CURRENT_USER_KEY = 'velora_current_user';
const ORDERS_STORAGE_KEY = 'velora_orders_history';


// ============================================================
// GET ALL REGISTERED USERS
// ============================================================

export function getUsers() {
  const data = localStorage.getItem(USERS_STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    const users = JSON.parse(data);

    if (!Array.isArray(users)) {
      return [];
    }

    return users.filter((user) => {
      return (
        user &&
        typeof user === 'object' &&
        user.id &&
        user.email &&
        user.password
      );
    });
  } catch (error) {
    console.error('Unable to read Velora users:', error);
    return [];
  }
}


// ============================================================
// SAVE USERS
// ============================================================

export function saveUsers(users) {
  if (!Array.isArray(users)) {
    return;
  }

  localStorage.setItem(
    USERS_STORAGE_KEY,
    JSON.stringify(users)
  );
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
// GET CURRENT LOGGED-IN USER
// ============================================================

export function getCurrentUser() {
  const data = localStorage.getItem(CURRENT_USER_KEY);

  if (!data) {
    return null;
  }

  try {
    const sessionUser = JSON.parse(data);

    /*
     * A valid session must contain a real user ID
     * and email.
     */
    if (
      !sessionUser ||
      !sessionUser.id ||
      !sessionUser.email
    ) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }

    /*
     * IMPORTANT:
     *
     * Also verify that the logged-in user still exists
     * in the registered users database.
     *
     * This prevents an old/stale session from being
     * treated as a valid login after the user is removed.
     */
    const registeredUser = findUserById(
      sessionUser.id
    );

    if (!registeredUser) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }

    /*
     * Make sure the email in the session matches
     * the registered account.
     */
    if (
      registeredUser.email.trim().toLowerCase() !==
      sessionUser.email.trim().toLowerCase()
    ) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }

    return sessionUser;

  } catch (error) {
    console.error(
      'Unable to read current Velora user:',
      error
    );

    localStorage.removeItem(CURRENT_USER_KEY);

    return null;
  }
}


// ============================================================
// SET CURRENT LOGGED-IN USER
// ============================================================

export function setCurrentUser(user) {
  if (!user || !user.id || !user.email) {
    localStorage.removeItem(CURRENT_USER_KEY);

    updateGlobalHeaderUser();

    return false;
  }

  /*
   * Only allow a user to become logged in if that
   * user actually exists in the registered users list.
   */
  const registeredUser = findUserById(user.id);

  if (!registeredUser) {
    console.error(
      'Login blocked: user is not registered.'
    );

    localStorage.removeItem(CURRENT_USER_KEY);

    updateGlobalHeaderUser();

    return false;
  }

  /*
   * Store only session information.
   *
   * NEVER store the password inside the current
   * logged-in session.
   */
  const sessionUser = {
    id: registeredUser.id,
    fullName: registeredUser.fullName,
    email: registeredUser.email,
    phone: registeredUser.phone,
    city: registeredUser.city,
    province: registeredUser.province,
    street: registeredUser.street || '',
    memberTier:
      registeredUser.memberTier ||
      'Velora Client',
    joinedDate:
      registeredUser.joinedDate || ''
  };

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(sessionUser)
  );

  updateGlobalHeaderUser();

  return true;
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

  if (!isValidEmail(normalizedEmail)) {
    return null;
  }

  const users = getUsers();

  return (
    users.find((user) => {
      if (!user.email) {
        return false;
      }

      return (
        user.email.trim().toLowerCase() ===
        normalizedEmail
      );
    }) || null
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
      (user) =>
        user &&
        user.id === userId
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

  accountLabels.forEach((element) => {
    if (user && user.fullName) {
      const firstName = user.fullName
        .trim()
        .split(/\s+/)[0];

      element.textContent = firstName;
    } else {
      element.textContent = 'Account';
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
   * No logged-in user = no orders.
   */
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
    const orders = JSON.parse(rawOrders);

    if (!Array.isArray(orders)) {
      return [];
    }

    /*
     * Only return orders belonging to the
     * currently authenticated user.
     */
    return orders.filter(
      (order) =>
        order &&
        order.userId === currentUser.id
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
        order &&
        order.userId === userId
    );

  } catch (error) {
    console.error(
      'Unable to read user orders:',
      error
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
    if (returnTarget === 'checkout') {
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
      (event) => {

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

        if (!email || !password) {

          if (alert) {
            alert.style.display = 'block';
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

        if (!isValidEmail(email)) {

          if (alert) {
            alert.style.display = 'block';
            alert.className =
              'auth-alert error';
            alert.textContent =
              'Please enter a valid email address.';
          }

          return;
        }


        // ------------------------------------------------------
        // FIND REGISTERED USER
        // ------------------------------------------------------

        const user =
          findUserByEmail(email);


        /*
         * IMPORTANT:
         *
         * NEVER create an account during login.
         *
         * If the email was never registered,
         * login MUST fail.
         */

        if (!user) {

          if (alert) {
            alert.style.display = 'block';
            alert.className =
              'auth-alert error';
            alert.textContent =
              'No registered account was found with this email address. Please create an account first.';
          }

          return;
        }


        // ------------------------------------------------------
        // VERIFY USER ID
        // ------------------------------------------------------

        if (!user.id) {

          if (alert) {
            alert.style.display = 'block';
            alert.className =
              'auth-alert error';
            alert.textContent =
              'This account is invalid. Please register again.';
          }

          return;
        }


        // ------------------------------------------------------
        // VERIFY PASSWORD
        // ------------------------------------------------------

        if (
          !user.password ||
          user.password !== password
        ) {

          if (alert) {
            alert.style.display = 'block';
            alert.className =
              'auth-alert error';
            alert.textContent =
              'Incorrect password. Please check your password and try again.';
          }

          return;
        }


        // ------------------------------------------------------
        // CREATE AUTHENTICATED SESSION
        // ------------------------------------------------------

        const loginSuccessful =
          setCurrentUser(user);


        if (!loginSuccessful) {

          if (alert) {
            alert.style.display = 'block';
            alert.className =
              'auth-alert error';
            alert.textContent =
              'Unable to create your login session. Please try again.';
          }

          return;
        }


        // ------------------------------------------------------
        // LOGIN SUCCESS
        // ------------------------------------------------------

        if (alert) {
          alert.style.display = 'none';
          alert.textContent = '';
        }

        handlePostAuthRedirect();
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
      (event) => {

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
            alert.style.display = 'block';
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

        if (!isValidEmail(email)) {

          if (alert) {
            alert.style.display = 'block';
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

        if (password.length < 6) {

          if (alert) {
            alert.style.display = 'block';
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
            alert.style.display = 'block';
            alert.className =
              'auth-alert error';
            alert.textContent =
              'Passwords do not match. Please re-enter.';
          }

          return;
        }


        // ------------------------------------------------------
        // GET REGISTERED USERS
        // ------------------------------------------------------

        const users =
          getUsers();


        // ------------------------------------------------------
        // CHECK DUPLICATE EMAIL
        // ------------------------------------------------------

        const existingUser =
          users.find((user) => {

            if (!user.email) {
              return false;
            }

            return (
              user.email
                .trim()
                .toLowerCase() ===
              email
            );
          });


        if (existingUser) {

          if (alert) {
            alert.style.display = 'block';
            alert.className =
              'auth-alert error';
            alert.textContent =
              'An account with this email already exists. Please sign in instead.';
          }

          return;
        }


        // ------------------------------------------------------
        // CREATE REGISTERED USER
        // ------------------------------------------------------

        const newUser = {

          id:
            `usr_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 10)}`,

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
        // SAVE REGISTERED USER
        // ------------------------------------------------------

        users.push(newUser);

        saveUsers(users);


        // ------------------------------------------------------
        // VERIFY USER WAS SAVED
        // ------------------------------------------------------

        const savedUser =
          findUserByEmail(email);


        if (
          !savedUser ||
          savedUser.id !== newUser.id
        ) {

          if (alert) {
            alert.style.display = 'block';
            alert.className =
              'auth-alert error';
            alert.textContent =
              'Your account could not be created. Please try again.';
          }

          return;
        }


        // ------------------------------------------------------
        // CREATE SESSION
        // ------------------------------------------------------

        const loginSuccessful =
          setCurrentUser(savedUser);


        if (!loginSuccessful) {

          if (alert) {
            alert.style.display = 'block';
            alert.className =
              'auth-alert error';
            alert.textContent =
              'Your account was created, but we could not sign you in. Please sign in manually.';
          }

          return;
        }


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