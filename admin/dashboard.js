/**
 * Velora Studio Admin - Dashboard Master Controller
 * Refactored to modular architecture (components/, css/, js/).
 * Pure DOM implementation with NO innerHTML.
 */

(function() {
  'use strict';

  // Ensure modular dependencies are loaded
  console.log('[Velora Admin] Initializing modular dashboard controller...');

  // Global namespace
  window.VeloraAdmin = window.VeloraAdmin || {
    version: '2.0.0',
    modular: true
  };

  // Re-export core methods for any external or inline calls
  window.initDashboard = function() {
    if (typeof window.checkAdminAuthSession === 'function') {
      window.checkAdminAuthSession();
    }
    if (typeof window.updateNotificationBadges === 'function') {
      window.updateNotificationBadges();
    }
    if (typeof window.switchTab === 'function') {
      window.switchTab(window.currentTab || 'dashboard');
    }
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initDashboard);
  } else {
    window.initDashboard();
  }
})();
