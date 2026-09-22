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

  // Direct Project ZIP Download function
  window.downloadProjectZip = function() {
    if (typeof window.showToast === 'function') {
      window.showToast('Preparing project ZIP archive...');
    }

    const downloadPath = window.location.pathname.startsWith('/admin') ? '/admin/download' : '/download';

    fetch(downloadPath)
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'velora-project.zip';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          if (a.parentNode) a.parentNode.removeChild(a);
        }, 2000);
        if (typeof window.showToast === 'function') {
          window.showToast('Velora Project ZIP downloaded successfully!');
        }
      })
      .catch(err => {
        console.warn('[Velora Download] Blob fetch error, trying direct link:', err);
        const fallbackA = document.createElement('a');
        fallbackA.href = downloadPath;
        fallbackA.download = 'velora-project.zip';
        fallbackA.target = '_blank';
        document.body.appendChild(fallbackA);
        fallbackA.click();
        setTimeout(() => {
          if (fallbackA.parentNode) fallbackA.parentNode.removeChild(fallbackA);
        }, 1000);
      });
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
