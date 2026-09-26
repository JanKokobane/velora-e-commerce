(function() {
  'use strict';

  window.VeloraAdmin = window.VeloraAdmin || {
    version: '2.0.0',
    modular: true
  };

  window.downloadProjectZip = function() {
    if (typeof window.showToast === 'function') {
      window.showToast('Preparing project ZIP archive...');
    }

    const downloadPath = window.location.pathname.startsWith('/admin')
      ? '/admin/download'
      : '/download';

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

          if (a.parentNode) {
            a.parentNode.removeChild(a);
          }
        }, 2000);

        if (typeof window.showToast === 'function') {
          window.showToast(
            'Velora Project ZIP downloaded successfully!'
          );
        }
      })
      .catch(err => {
        console.warn(
          '[Velora Download] Blob fetch error, trying direct link:',
          err
        );

        const fallbackA = document.createElement('a');

        fallbackA.href = downloadPath;
        fallbackA.download = 'velora-project.zip';
        fallbackA.target = '_blank';

        document.body.appendChild(fallbackA);
        fallbackA.click();

        setTimeout(() => {
          if (fallbackA.parentNode) {
            fallbackA.parentNode.removeChild(fallbackA);
          }
        }, 1000);
      });
  };

  window._realDownloadProjectZip =
    window.downloadProjectZip;

  function openAdminAuth() {
    const authScreen =
      document.getElementById('adminAuthScreen');

    if (!authScreen) {
      console.warn(
        '[Velora Admin] Authentication screen not found.'
      );

      return;
    }

    authScreen.style.display = 'flex';

    document.body.classList.add(
      'velora-auth-open'
    );
  }

  function closeAdminAuth() {
    const authScreen =
      document.getElementById('adminAuthScreen');

    if (!authScreen) {
      return;
    }

    authScreen.style.display = 'none';

    document.body.classList.remove(
      'velora-auth-open'
    );
  }

  function initializeDashboardAfterAuth() {

    closeAdminAuth();

    if (
      typeof window.updateNotificationBadges ===
      'function'
    ) {
      window.updateNotificationBadges();
    }

    if (
      typeof window.switchTab ===
      'function'
    ) {
      window.switchTab(
        window.currentTab || 'dashboard'
      );
    }
  }

  window.initDashboard = function() {

    const authScreen =
      document.getElementById(
        'adminAuthScreen'
      );

    if (authScreen) {
      authScreen.style.display =
        'flex';
    }

    if (
      typeof window.checkAdminAuthSession ===
      'function'
    ) {
      const authenticated =
        window.checkAdminAuthSession();

      if (authenticated === false) {
        openAdminAuth();
        return;
      }

      if (authenticated === true) {
        initializeDashboardAfterAuth();
        return;
      }
    }

    if (
      window.adminAuthApi &&
      typeof window.adminAuthApi.isAuthenticated ===
        'function'
    ) {
      if (
        window.adminAuthApi.isAuthenticated()
      ) {
        initializeDashboardAfterAuth();
        return;
      }
    }

    openAdminAuth();
  };

  window.addEventListener(
    'veloraAdminLogin',
    function() {

      initializeDashboardAfterAuth();
    }
  );

  window.addEventListener(
    'veloraAdminSessionRestored',
    function() {

      initializeDashboardAfterAuth();
    }
  );

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      window.initDashboard,
      {
        once: true
      }
    );
  } else {
    window.initDashboard();
  }

})();