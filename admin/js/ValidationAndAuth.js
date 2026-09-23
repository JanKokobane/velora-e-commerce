const VELORA_API_URL =
  "https://velora-e-commerce-qby7.onrender.com";

const VELORA_REMEMBER_KEY =
  "velora_admin_remember";

const VELORA_SESSION_KEY =
  "velora_admin_session";

const VELORA_REMEMBER_DAYS = 30;

const VELORA_CACHE_PREFIX =
  "velora_cache_";

const adminAuthApi = {
  async register({
    full_name,
    email,
    password,
  }) {
    const response = await fetch(
      `${VELORA_API_URL}/api/admin/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name,
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to create admin account."
      );
    }

    return data;
  },

  async login({
    email,
    password,
    rememberMe = false,
  }) {
    const response = await fetch(
      `${VELORA_API_URL}/api/admin/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Invalid email or password."
      );
    }

    if (!data.token) {
      throw new Error(
        "Login succeeded but no authentication token was returned."
      );
    }

    if (!data.admin) {
      throw new Error(
        "Login succeeded but no administrator information was returned."
      );
    }

    // Persist authentication tokens and administrator profile
    localStorage.setItem(
      "velora_admin_token",
      data.token
    );

    localStorage.setItem(
      "velora_admin",
      JSON.stringify(data.admin)
    );

    localStorage.setItem(
      "token",
      data.token
    );

    localStorage.setItem(
      "admin",
      JSON.stringify(data.admin)
    );

    // Cache /me profile immediately so reloads don't require an initial network wait
    localStorage.setItem(
      `${VELORA_CACHE_PREFIX}/api/admin/auth/me`,
      JSON.stringify(data.admin)
    );

    if (rememberMe) {
      const expiresAt =
        Date.now() +
        VELORA_REMEMBER_DAYS *
          24 *
          60 *
          60 *
          1000;

      localStorage.setItem(
        VELORA_REMEMBER_KEY,
        "true"
      );

      localStorage.setItem(
        VELORA_SESSION_KEY,
        String(expiresAt)
      );

      sessionStorage.removeItem(
        "velora_admin_session"
      );
    } else {
      localStorage.removeItem(
        VELORA_REMEMBER_KEY
      );

      localStorage.removeItem(
        VELORA_SESSION_KEY
      );

      sessionStorage.setItem(
        "velora_admin_session",
        "true"
      );
    }

    return data;
  },

  logout() {
    localStorage.removeItem(
      "velora_admin_token"
    );

    localStorage.removeItem(
      "velora_admin"
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "admin"
    );

    localStorage.removeItem(
      VELORA_REMEMBER_KEY
    );

    localStorage.removeItem(
      VELORA_SESSION_KEY
    );

    sessionStorage.removeItem(
      "velora_admin_session"
    );

    // Clear API caches on explicit logout
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(VELORA_CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // ignore
    }
  },

  getToken() {
    return (
      localStorage.getItem(
        "velora_admin_token"
      ) ||
      localStorage.getItem(
        "token"
      )
    );
  },

  getAdmin() {
    const admin =
      localStorage.getItem(
        "velora_admin"
      ) ||
      localStorage.getItem(
        "admin"
      );

    if (!admin) {
      return null;
    }

    try {
      return JSON.parse(admin);
    } catch {
      return null;
    }
  },

  isRememberedSessionValid() {
    const remember =
      localStorage.getItem(
        VELORA_REMEMBER_KEY
      );

    const expiresAt =
      Number(
        localStorage.getItem(
          VELORA_SESSION_KEY
        )
      );

    if (
      remember !== "true" ||
      !expiresAt
    ) {
      return false;
    }

    if (Date.now() >= expiresAt) {
      this.logout();
      return false;
    }

    return true;
  },

  isAuthenticated() {
    const token =
      this.getToken();

    if (!token) {
      return false;
    }

    if (
      this.isRememberedSessionValid()
    ) {
      return true;
    }

    const session =
      sessionStorage.getItem(
        "velora_admin_session"
      );

    if (session === "true") {
      return true;
    }

    // FIX: Maintain active session across tab refreshes if token & admin exist
    return Boolean(token && this.getAdmin());
  },

  // Cache helper to store and retrieve fetched API responses across page refreshes
  getCachedData(endpoint) {
    try {
      const cached = localStorage.getItem(
        `${VELORA_CACHE_PREFIX}${endpoint}`
      );
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },

  setCachedData(endpoint, data) {
    try {
      localStorage.setItem(
        `${VELORA_CACHE_PREFIX}${endpoint}`,
        JSON.stringify(data)
      );
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  },

  async request(
    endpoint,
    options = {}
  ) {
    const token =
      this.getToken();

    const headers = {
      "Content-Type":
        "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        `${VELORA_API_URL}${endpoint}`,
        {
          ...options,
          headers,
        }
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        // ONLY log out if backend returns 401 Unauthorized
        if (response.status === 401) {
          console.warn(
            "[Velora Admin] Session expired (401)."
          );
          this.logout();
          if (
            typeof openVeloraAuthScreen === "function"
          ) {
            openVeloraAuthScreen();
          }
        }

        throw new Error(
          (data && data.message) ||
            `Request failed with status ${response.status}.`
        );
      }

      // Automatically cache GET responses so refresh never loses fetched data
      if (
        !options.method ||
        options.method.toUpperCase() === "GET"
      ) {
        this.setCachedData(endpoint, data);
      }

      return data;
    } catch (error) {
      // FIX: If network is offline or Render is spinning up, return cached data
      // instead of throwing and forcing the caller to fall back to mock data
      if (
        !options.method ||
        options.method.toUpperCase() === "GET"
      ) {
        const cached =
          this.getCachedData(endpoint);
        if (cached !== null) {
          console.warn(
            `[Velora Admin] Network issue; using cached data for ${endpoint}:`,
            error
          );
          return cached;
        }
      }

      throw error;
    }
  },
};

window.adminAuthApi =
  adminAuthApi;

function getAdminInitials(
  fullName
) {
  if (!fullName) {
    return "AD";
  }

  const nameParts =
    String(fullName)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (nameParts.length === 0) {
    return "AD";
  }

  if (nameParts.length === 1) {
    return nameParts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    nameParts[0].charAt(0) +
    nameParts[
      nameParts.length - 1
    ].charAt(0)
  ).toUpperCase();
}

function createAdminInitialsAvatar(
  fullName
) {
  const initials =
    getAdminInitials(
      fullName
    );

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#2a2638"/>
      <text x="50" y="58" font-size="32" fill="#c9a57a" text-anchor="middle" font-family="Arial, sans-serif" font-weight="600">${initials}</text>
    </svg>
  `)}`;
}

function updateAdminProfilePill(
  admin
) {
  if (!admin) {
    console.warn(
      "No admin data available for profile."
    );
    return;
  }

  const nameElement =
    document.getElementById(
      "topbarAdminName"
    );

  const roleElement =
    document.getElementById(
      "topbarAdminRole"
    );

  const avatarElement =
    document.getElementById(
      "topbarAdminAvatar"
    );

  const fullName =
    admin.full_name ||
    admin.fullName ||
    admin.name ||
    admin.email ||
    "Administrator";

  const email =
    admin.email ||
    "";

  const initials =
    getAdminInitials(
      fullName
    );

  if (nameElement) {
    nameElement.textContent =
      fullName;
  }

  if (roleElement) {
    roleElement.textContent =
      email;
  }

  if (avatarElement) {
    avatarElement.src =
      createAdminInitialsAvatar(
        fullName
      );

    avatarElement.alt =
      fullName;
  }

  console.log(
    "[Velora Admin] Profile displayed:",
    {
      name: fullName,
      email: email,
      initials: initials,
    }
  );
}

window.updateAdminProfilePill =
  updateAdminProfilePill;

async function fetchLoggedInAdmin() {
  const token =
    window.adminAuthApi.getToken();

  if (!token) {
    console.warn(
      "[Velora Admin] No authentication token found."
    );
    return null;
  }

  // FIX: Immediately load and show locally stored admin so UI doesn't flicker with mock data
  const cachedAdmin =
    window.adminAuthApi.getAdmin();

  if (cachedAdmin) {
    updateAdminProfilePill(
      cachedAdmin
    );
  }

  try {
    const data =
      await window.adminAuthApi.request(
        "/api/admin/auth/me"
      );

    const admin =
      data.admin || data;

    if (!admin) {
      console.warn(
        "[Velora Admin] Backend did not return admin data."
      );
      return cachedAdmin || null;
    }

    localStorage.setItem(
      "velora_admin",
      JSON.stringify(admin)
    );

    localStorage.setItem(
      "admin",
      JSON.stringify(admin)
    );

    updateAdminProfilePill(
      admin
    );

    console.log(
      "[Velora Admin] Authenticated admin fetched from /me:",
      admin
    );

    return admin;
  } catch (error) {
    console.error(
      "[Velora Admin] Failed to fetch authenticated admin from /me:",
      error
    );

    // FIX: DO NOT return null if we have cached admin in localStorage!
    // Returning null caused logout() to wipe credentials when Render was spinning up.
    if (cachedAdmin) {
      return cachedAdmin;
    }

    return null;
  }
}

window.fetchLoggedInAdmin =
  fetchLoggedInAdmin;

function showKinderValidationMessage(
  message,
  type = "error"
) {
  const alertBox =
    document.getElementById(
      "kinderAuthAlert"
    );

  if (alertBox) {
    alertBox.textContent =
      message;

    alertBox.style.removeProperty(
      "display"
    );

    alertBox.classList.remove(
      "error",
      "validation-error",
      "success",
      "validation-success"
    );

    if (type === "error") {
      alertBox.classList.add(
        "error"
      );
    }

    if (type === "success") {
      alertBox.classList.add(
        "success"
      );
    }
  }

  console.log(
    `Validation (${type}):`,
    message
  );
}

function clearKinderValidationMessage() {
  const alertBox =
    document.getElementById(
      "kinderAuthAlert"
    );

  if (alertBox) {
    alertBox.textContent = "";

    alertBox.style.display =
      "none";

    alertBox.classList.remove(
      "error",
      "validation-error",
      "success",
      "validation-success"
    );
  }

  document
    .querySelectorAll(
      ".kinder-input-error, .kinder-input-success"
    )
    .forEach((input) => {
      input.classList.remove(
        "kinder-input-error",
        "kinder-input-success"
      );
    });

  document
    .querySelectorAll(
      ".kinder-field-error, .kinder-field-success"
    )
    .forEach((group) => {
      group.classList.remove(
        "kinder-field-error",
        "kinder-field-success"
      );
    });
}

function markKinderFieldError(
  inputEl
) {
  if (!inputEl) {
    return;
  }

  inputEl.classList.add(
    "kinder-input-error"
  );

  inputEl.classList.remove(
    "kinder-input-success"
  );

  const group =
    inputEl.closest(
      ".kinder-field-group"
    );

  if (group) {
    group.classList.add(
      "kinder-field-error"
    );

    group.classList.remove(
      "kinder-field-success"
    );
  }
}

function markKinderFieldSuccess(
  inputEl
) {
  if (!inputEl) {
    return;
  }

  inputEl.classList.add(
    "kinder-input-success"
  );

  inputEl.classList.remove(
    "kinder-input-error"
  );

  const group =
    inputEl.closest(
      ".kinder-field-group"
    );

  if (group) {
    group.classList.add(
      "kinder-field-success"
    );

    group.classList.remove(
      "kinder-field-error"
    );
  }
}

function validateKinderPassword(
  password
) {
  return {
    length:
      password.length >= 8,
    uppercase:
      /[A-Z]/.test(password),
    lowercase:
      /[a-z]/.test(password),
    number:
      /[0-9]/.test(password),
    special:
      /[^A-Za-z0-9]/.test(
        password
      ),
  };
}

function isKinderEmailValid(
  email
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

window.handleKinderAuthSubmit =
  async function (event) {
    if (event) event.preventDefault();

    clearKinderValidationMessage();

    const signupTab =
      document.getElementById(
        "kinderTabSignUp"
      );

    const isSignup =
      signupTab &&
      signupTab.classList.contains(
        "active"
      );

    const emailInput =
      document.getElementById(
        "kinderEmail"
      );

    const passwordInput =
      document.getElementById(
        "kinderPassword"
      );

    const primaryButton =
      document.getElementById(
        "kinderPrimaryBtn"
      );

    if (
      !emailInput ||
      !passwordInput
    ) {
      console.error(
        "Email or password input could not be found."
      );
      return;
    }

    const email =
      emailInput.value
        .trim()
        .toLowerCase();

    const password =
      passwordInput.value;

    let hasError = false;
    let firstErrorInput = null;

    if (!email) {
      markKinderFieldError(
        emailInput
      );

      if (!hasError) {
        showKinderValidationMessage(
          "Email address is required.",
          "error"
        );

        firstErrorInput =
          emailInput;

        hasError = true;
      }
    } else if (
      !isKinderEmailValid(email)
    ) {
      markKinderFieldError(
        emailInput
      );

      if (!hasError) {
        showKinderValidationMessage(
          "Please enter a valid email address.",
          "error"
        );

        firstErrorInput =
          emailInput;

        hasError = true;
      }
    } else {
      markKinderFieldSuccess(
        emailInput
      );
    }

    if (!password) {
      markKinderFieldError(
        passwordInput
      );

      if (!hasError) {
        showKinderValidationMessage(
          "Password is required.",
          "error"
        );

        firstErrorInput =
          passwordInput;

        hasError = true;
      }
    } else if (isSignup) {
      const passwordRequirements =
        validateKinderPassword(
          password
        );

      if (
        !passwordRequirements.length
      ) {
        markKinderFieldError(
          passwordInput
        );

        if (!hasError) {
          showKinderValidationMessage(
            "Password must be at least 8 characters.",
            "error"
          );

          firstErrorInput =
            passwordInput;

          hasError = true;
        }
      } else if (
        !passwordRequirements.uppercase
      ) {
        markKinderFieldError(
          passwordInput
        );

        if (!hasError) {
          showKinderValidationMessage(
            "Password must contain at least one uppercase letter.",
            "error"
          );

          firstErrorInput =
            passwordInput;

          hasError = true;
        }
      } else if (
        !passwordRequirements.lowercase
      ) {
        markKinderFieldError(
          passwordInput
        );

        if (!hasError) {
          showKinderValidationMessage(
            "Password must contain at least one lowercase letter.",
            "error"
          );

          firstErrorInput =
            passwordInput;

          hasError = true;
        }
      } else if (
        !passwordRequirements.number
      ) {
        markKinderFieldError(
          passwordInput
        );

        if (!hasError) {
          showKinderValidationMessage(
            "Password must contain at least one number.",
            "error"
          );

          firstErrorInput =
            passwordInput;

          hasError = true;
        }
      } else if (
        !passwordRequirements.special
      ) {
        markKinderFieldError(
          passwordInput
        );

        if (!hasError) {
          showKinderValidationMessage(
            "Password must contain at least one special character.",
            "error"
          );

          firstErrorInput =
            passwordInput;

          hasError = true;
        }
      } else {
        markKinderFieldSuccess(
          passwordInput
        );
      }
    } else {
      markKinderFieldSuccess(
        passwordInput
      );
    }

    let fullName = "";
    let confirmPassword = "";
    let termsInput = null;
    let rememberInput = null;
    let fullNameInput = null;
    let confirmPasswordInput = null;

    if (isSignup) {
      fullNameInput =
        document.getElementById(
          "kinderFullName"
        );

      confirmPasswordInput =
        document.getElementById(
          "kinderConfirmPassword"
        );

      termsInput =
        document.getElementById(
          "kinderTermsCheckbox"
        );

      if (
        !fullNameInput ||
        !confirmPasswordInput ||
        !termsInput
      ) {
        console.error(
          "One or more signup fields could not be found."
        );
        return;
      }

      fullName =
        fullNameInput.value.trim();

      confirmPassword =
        confirmPasswordInput.value;

      if (!fullName) {
        markKinderFieldError(
          fullNameInput
        );

        if (!hasError) {
          showKinderValidationMessage(
            "Full name is required.",
            "error"
          );

          firstErrorInput =
            fullNameInput;

          hasError = true;
        }
      } else if (
        fullName.length < 2
      ) {
        markKinderFieldError(
          fullNameInput
        );

        if (!hasError) {
          showKinderValidationMessage(
            "Full name must be at least 2 characters.",
            "error"
          );

          firstErrorInput =
            fullNameInput;

          hasError = true;
        }
      } else {
        markKinderFieldSuccess(
          fullNameInput
        );
      }

      if (!confirmPassword) {
        markKinderFieldError(
          confirmPasswordInput
        );

        if (!hasError) {
          showKinderValidationMessage(
            "Please confirm your password.",
            "error"
          );

          firstErrorInput =
            confirmPasswordInput;

          hasError = true;
        }
      } else if (
        password !==
        confirmPassword
      ) {
        markKinderFieldError(
          confirmPasswordInput
        );

        if (!hasError) {
          showKinderValidationMessage(
            "Passwords do not match.",
            "error"
          );

          firstErrorInput =
            confirmPasswordInput;

          hasError = true;
        }
      } else {
        markKinderFieldSuccess(
          confirmPasswordInput
        );
      }

      if (!termsInput.checked) {
        termsInput.classList.add(
          "kinder-input-error"
        );

        termsInput.classList.remove(
          "kinder-input-success"
        );

        if (!hasError) {
          showKinderValidationMessage(
            "Please select the checkbox to continue.",
            "error"
          );

          firstErrorInput =
            termsInput;

          hasError = true;
        }
      } else {
        termsInput.classList.remove(
          "kinder-input-error"
        );

        termsInput.classList.add(
          "kinder-input-success"
        );
      }
    } else {
      rememberInput =
        document.getElementById(
          "kinderRememberCheckbox"
        );
    }

    if (hasError) {
      if (firstErrorInput) {
        firstErrorInput.focus();
      }
      return;
    }

    if (primaryButton) {
      primaryButton.disabled =
        true;

      primaryButton.textContent =
        isSignup
          ? "Creating Account..."
          : "Signing In...";
    }

    try {
      if (isSignup) {
        showKinderValidationMessage(
          "Creating your admin account...",
          "success"
        );

        const result =
          await window.adminAuthApi.register(
            {
              full_name:
                fullName,
              email,
              password,
            }
          );

        showKinderValidationMessage(
          result.message ||
            "Account created successfully. Please sign in.",
          "success"
        );

        passwordInput.value =
          "";

        if (
          confirmPasswordInput
        ) {
          confirmPasswordInput.value =
            "";
        }

        markKinderFieldSuccess(
          emailInput
        );

        setTimeout(() => {
          const loginTab =
            document.getElementById(
              "kinderTabLogin"
            );

          if (loginTab) {
            loginTab.click();
          } else if (
            typeof window.setKinderAuthMode ===
            "function"
          ) {
            window.setKinderAuthMode(
              "login",
              false
            );
          }

          emailInput.value =
            email;

          emailInput.focus();

          clearKinderValidationMessage();
        }, 1000);

        return;
      }

      const rememberMe =
        rememberInput
          ? rememberInput.checked
          : false;

      showKinderValidationMessage(
        "Signing in...",
        "success"
      );

      const result =
        await window.adminAuthApi.login(
          {
            email,
            password,
            rememberMe,
          }
        );

      const loggedInAdmin =
        result.admin;

      updateAdminProfilePill(
        loggedInAdmin
      );

      showKinderValidationMessage(
        result.message ||
          "Sign in successful!",
        "success"
      );

      setTimeout(() => {
        closeVeloraAuthScreen();

        if (
          typeof window.closeAuthGate ===
          "function"
        ) {
          window.closeAuthGate();
        }

        window.dispatchEvent(
          new CustomEvent(
            "veloraAdminLogin",
            {
              detail:
                loggedInAdmin,
            }
          )
        );
      }, 700);
    } catch (error) {
      console.error(
        "Velora authentication error:",
        error
      );

      showKinderValidationMessage(
        error.message ||
          "Authentication failed. Please try again.",
        "error"
      );
    } finally {
      if (primaryButton) {
        primaryButton.disabled =
          false;

        primaryButton.textContent =
          isSignup
            ? "Create Account"
            : "Sign In";
      }
    }
  };

function openVeloraAuthScreen() {
  const authScreen =
    document.getElementById(
      "adminAuthScreen"
    );

  if (!authScreen) {
    return;
  }

  authScreen.style.display =
    "flex";

  document.body.classList.add(
    "velora-auth-open"
  );
}

function closeVeloraAuthScreen() {
  const authScreen =
    document.getElementById(
      "adminAuthScreen"
    );

  if (!authScreen) {
    return;
  }

  authScreen.style.display =
    "none";

  document.body.classList.remove(
    "velora-auth-open"
  );
}

window.openVeloraAuthScreen =
  openVeloraAuthScreen;

window.closeVeloraAuthScreen =
  closeVeloraAuthScreen;

// FIX: Restores admin session on refresh WITHOUT flashing the auth modal
// and WITHOUT reverting to mock data on network latency or sleep.
async function restoreVeloraAdminSession() {
  const token =
    window.adminAuthApi.getToken();

  // 1. If no token at all, open the login modal
  if (!token) {
    openVeloraAuthScreen();
    return;
  }

  // 2. If remembered session is explicitly expired, log out
  if (
    !window.adminAuthApi.isAuthenticated()
  ) {
    window.adminAuthApi.logout();
    openVeloraAuthScreen();
    return;
  }

  // 3. User is authenticated! DO NOT open or flash the auth screen!
  closeVeloraAuthScreen();

  // 4. INSTANT RESTORE: Immediately populate the UI with cached admin data!
  const cachedAdmin =
    window.adminAuthApi.getAdmin();

  if (cachedAdmin) {
    updateAdminProfilePill(
      cachedAdmin
    );

    // Notify listeners immediately so dashboard displays real cached data right away
    window.dispatchEvent(
      new CustomEvent(
        "veloraAdminSessionRestored",
        {
          detail: cachedAdmin,
        }
      )
    );

    window.dispatchEvent(
      new CustomEvent(
        "veloraAdminLogin",
        {
          detail: cachedAdmin,
        }
      )
    );
  }

  // 5. Silently verify with /me in the background (without clearing data if network lags)
  try {
    const admin =
      await fetchLoggedInAdmin();

    if (admin) {
      updateAdminProfilePill(
        admin
      );

      window.dispatchEvent(
        new CustomEvent(
          "veloraAdminSessionRestored",
          {
            detail: admin,
          }
        )
      );

      window.dispatchEvent(
        new CustomEvent(
          "veloraAdminLogin",
          {
            detail: admin,
          }
        )
      );
    }
  } catch (err) {
    console.warn(
      "[Velora Admin] Background sync skipped, keeping active session."
    );
  }
}

function initializeVeloraAdminSession() {
  restoreVeloraAdminSession();
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeVeloraAdminSession,
    {
      once: true,
    }
  );
} else {
  initializeVeloraAdminSession();
}