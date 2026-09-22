/**
 * Velora Studio Admin - Component Renderer & Modular Controller Loader
 * Dynamically loads and renders HTML components from /admin/components/ into /admin/index.html,
 * then initializes the dashboard controllers in strict order.
 */

(function() {
  'use strict';

  console.log('[Velora Admin] Starting component renderer...');

  const COMPONENTS = [
    { name: 'sidebar', targetId: 'componentSidebar', file: 'sidebar.html' },
    { name: 'header', targetId: 'componentHeader', file: 'header.html' },
    { name: 'overview', targetId: 'componentOverview', file: 'overview.html' },
    { name: 'orders', targetId: 'componentOrders', file: 'orders.html' },
    { name: 'returns', targetId: 'componentReturns', file: 'returns.html' },
    { name: 'inventory', targetId: 'componentInventory', file: 'inventory.html' },
    { name: 'customers', targetId: 'componentCustomers', file: 'customers.html' },
    { name: 'payments', targetId: 'componentPayments', file: 'payments.html' },
    { name: 'notifications', targetId: 'componentNotifications', file: 'notifications.html' },
    { name: 'settings', targetId: 'componentSettings', file: 'settings.html' },
    { name: 'order-drawer', targetId: 'componentOrderDrawer', file: 'order-drawer.html' },
    { name: 'modals', targetId: 'componentModals', file: 'modals.html' },
    { name: 'auth', targetId: 'componentAuth', file: 'auth.html' }
  ];

  const CONTROLLER_SCRIPTS = [
    './js/data.js',
    './js/currency.js',
    './js/notifications.js',
    './js/overview.js',
    './js/orders.js',
    './js/order-drawer.js',
    './js/returns.js',
    './js/inventory.js',
    './js/customers.js',
    './js/payments.js',
    './js/settings.js',
    './js/modals.js',
    './js/search.js',
    './js/auth.js',
    './js/app.js',
    './dashboard.js'
  ];

  // Intercept and store DOMContentLoaded event listeners registered by controllers
  const domLoadedCallbacks = [];
  const nativeAddEventListener = document.addEventListener.bind(document);
  let isBootstrapping = true;
  let hasBootstrapped = false;

  document.addEventListener = function(type, listener, options) {
    if (type === 'DOMContentLoaded') {
      if (hasBootstrapped) {
        // Dashboard has already completed bootstrapping; run listener immediately
        try { listener(); } catch(e) { console.warn(e); }
        return;
      }
      domLoadedCallbacks.push(listener);
      return;
    }
    return nativeAddEventListener(type, listener, options);
  };

  /**
   * Loads an individual HTML component file and replaces its target placeholder
   */
  async function renderComponent(comp, basePath) {
    const target = document.getElementById(comp.targetId) || document.querySelector(`[data-component="${comp.name}"]`);
    if (!target) {
      console.warn(`[Velora Admin] Target placeholder not found for component: ${comp.name}`);
      return;
    }

    try {
      const response = await fetch(`${basePath}${comp.file}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${comp.file}`);
      }
      const htmlText = await response.text();

      // Create a temporary container and convert into a DocumentFragment
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlText;

      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }

      if (target.parentNode) {
        target.parentNode.replaceChild(fragment, target);
      }
    } catch (err) {
      console.error(`[Velora Admin] Failed to render component ${comp.name}:`, err);
    }
  }

  /**
   * Checks if a script is already present in the document
   */
  function isScriptAlreadyPresent(src) {
    const filename = src.split('/').pop();
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    return scripts.some(s => {
      const sSrc = s.getAttribute('src') || '';
      return sSrc.endsWith(filename);
    });
  }

  /**
   * Sequentially loads a JavaScript script if not already in document
   */
  function loadScript(src) {
    return new Promise((resolve) => {
      if (isScriptAlreadyPresent(src)) {
        return resolve();
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = (err) => {
        console.error(`[Velora Admin] Failed to load script ${src}:`, err);
        resolve(); // Continue with other scripts even if one errors
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Main bootstrap function
   */
  async function bootstrapModularDashboard() {
    if (hasBootstrapped) return;
    hasBootstrapped = true;

    try {
      // Determine correct base path for components
      let basePath = './components/';
      if (window.location.pathname.startsWith('/admin')) {
        basePath = '/admin/components/';
      }

      // 1. Fetch and inject all HTML components in parallel
      await Promise.all(COMPONENTS.map(comp => renderComponent(comp, basePath)));
      console.log('[Velora Admin] All HTML components rendered successfully.');

      // 2. Load any modular JS controllers that were not statically loaded
      for (const scriptUrl of CONTROLLER_SCRIPTS) {
        if (!isScriptAlreadyPresent(scriptUrl)) {
          await loadScript(scriptUrl);
        }
      }
      console.log('[Velora Admin] All controller scripts verified.');

      isBootstrapping = false;

      // Restore native addEventListener now that bootstrap phase is ending
      document.addEventListener = nativeAddEventListener;

      // 3. Fire all DOMContentLoaded listeners now that DOM is complete
      const callbacks = domLoadedCallbacks.slice();
      domLoadedCallbacks.length = 0;
      callbacks.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.error('[Velora Admin] Error in controller DOMContentLoaded callback:', e);
        }
      });

      // 4. Initialize module states explicitly
      try { if (typeof window.initAuth === 'function') window.initAuth(); } catch(e) { console.warn(e); }
      try { if (typeof window.initSearch === 'function') window.initSearch(); } catch(e) { console.warn(e); }
      try { if (typeof window.initModals === 'function') window.initModals(); } catch(e) { console.warn(e); }
      try { if (typeof window.initCurrency === 'function') window.initCurrency(); } catch(e) { console.warn(e); }
      try { if (typeof window.renderSettingsView === 'function') window.renderSettingsView(); } catch(e) { console.warn(e); }
      try { if (typeof window.initApp === 'function') window.initApp(); } catch(e) { console.warn(e); }
      try { if (typeof window.updateNotificationBadges === 'function') window.updateNotificationBadges(); } catch(e) { console.warn(e); }
      try { if (typeof window.checkAdminAuthSession === 'function') window.checkAdminAuthSession(); } catch(e) { console.warn(e); }
      try {
        if (typeof window.initDashboard === 'function') {
          window.initDashboard();
        } else if (typeof window.switchTab === 'function') {
          window.switchTab(window.currentTab || 'dashboard');
        }
      } catch(e) { console.warn(e); }

      // 5. Flush any early queued actions
      if (Array.isArray(window._earlyActionQueue) && window._earlyActionQueue.length > 0) {
        const queue = window._earlyActionQueue.slice();
        window._earlyActionQueue = [];
        queue.forEach(action => {
          try { action(); } catch (e) { console.warn(e); }
        });
      }

      // Signal completion
      document.documentElement.setAttribute('data-admin-rendered', 'true');
      console.log('[Velora Admin] Dashboard initialization complete.');
    } catch (err) {
      console.error('[Velora Admin] Bootstrap failure:', err);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    nativeAddEventListener('DOMContentLoaded', bootstrapModularDashboard);
  } else {
    bootstrapModularDashboard();
  }

})();
