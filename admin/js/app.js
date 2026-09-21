/**
 * Velora Studio Admin - Main Application Coordinator (js/app.js)
 * Modular orchestrator for routing, tab switching, and event binding.
 * Pure DOM implementation with NO innerHTML.
 */

window.currentTab = 'dashboard';

window.switchTab = function(tabId) {
  window.currentTab = tabId;

  // Sidebar navigation active state
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Views toggling
  const views = {
    dashboard: document.getElementById('overviewMainView'),
    orders: document.getElementById('ordersMainView'),
    returns: document.getElementById('returnsMainView'),
    inventory: document.getElementById('inventoryMainView'),
    customers: document.getElementById('customersMainView'),
    payments: document.getElementById('paymentsMainView'),
    notifications: document.getElementById('notificationsMainView'),
    settings: document.getElementById('settingsMainView')
  };

  Object.entries(views).forEach(([key, el]) => {
    if (el) el.style.display = key === tabId ? 'block' : 'none';
  });

  // Topbar title update
  const topbarTitle = document.getElementById('currentViewTitle');
  if (topbarTitle) {
    const titles = {
      dashboard: 'Store Overview',
      orders: 'Orders',
      returns: 'Returns',
      inventory: 'Catalog & Stock',
      customers: 'Client Registry',
      payments: 'Payments & Settlements',
      notifications: 'Notifications',
      settings: 'Operations Settings'
    };
    topbarTitle.textContent = titles[tabId] || (tabId.charAt(0).toUpperCase() + tabId.slice(1));
  }

  // Trigger view controller render
  window.refreshCurrentView();

  // Close mobile sidebar if open
  window.closeMobileSidebar();
};

window.refreshCurrentView = function() {
  const tab = window.currentTab;
  if (tab === 'dashboard' && typeof window.renderOverviewView === 'function') {
    window.renderOverviewView();
  } else if (tab === 'orders') {
    if (typeof window.renderKPICards === 'function') window.renderKPICards();
    if (typeof window.renderOrdersTable === 'function') window.renderOrdersTable();
  } else if (tab === 'returns' && typeof window.renderReturnsView === 'function') {
    window.renderReturnsView();
  } else if (tab === 'inventory' && typeof window.renderInventoryView === 'function') {
    window.renderInventoryView();
  } else if (tab === 'customers' && typeof window.renderCustomersView === 'function') {
    window.renderCustomersView();
  } else if (tab === 'payments' && typeof window.renderPaymentsView === 'function') {
    window.renderPaymentsView();
  } else if (tab === 'notifications' && typeof window.renderNotificationsView === 'function') {
    window.renderNotificationsView();
  } else if (tab === 'settings' && typeof window.renderSettingsView === 'function') {
    window.renderSettingsView();
  }
};

window.toggleMobileSidebar = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  const sidebar = document.getElementById('dashboardSidebar');
  const backdrop = document.getElementById('mobileSidebarBackdrop');
  const toggleBtn = document.getElementById('mobileMenuToggle');
  if (!sidebar) return;

  const isOpen = sidebar.classList.contains('mobile-open') || sidebar.classList.contains('open');
  if (isOpen) {
    window.closeMobileSidebar();
  } else {
    sidebar.classList.add('mobile-open', 'open');
    if (backdrop) backdrop.classList.add('active');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('sidebar-drawer-active');
  }
};

window.closeMobileSidebar = function() {
  const sidebar = document.getElementById('dashboardSidebar');
  const backdrop = document.getElementById('mobileSidebarBackdrop');
  const toggleBtn = document.getElementById('mobileMenuToggle');
  if (sidebar) sidebar.classList.remove('mobile-open', 'open');
  if (backdrop) backdrop.classList.remove('active');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('sidebar-drawer-active');
};

document.addEventListener('DOMContentLoaded', () => {
  // Mobile toggle button
  const mobileToggle = document.getElementById('mobileMenuToggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.toggleMobileSidebar(e);
    });
  }

  const mobileBackdrop = document.getElementById('mobileSidebarBackdrop');
  if (mobileBackdrop) {
    mobileBackdrop.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.closeMobileSidebar();
    });
    mobileBackdrop.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.closeMobileSidebar();
    }, { passive: false });
  }

  // Auto-close sidebar on mobile/tablet when main content area is clicked
  const mainContent = document.querySelector('.dashboard-main');
  if (mainContent) {
    mainContent.addEventListener('click', (e) => {
      const sidebar = document.getElementById('dashboardSidebar');
      const toggleBtn = document.getElementById('mobileMenuToggle');
      if (sidebar && (sidebar.classList.contains('mobile-open') || sidebar.classList.contains('open'))) {
        if (toggleBtn && (toggleBtn === e.target || toggleBtn.contains(e.target))) return;
        window.closeMobileSidebar();
      }
    });
  }

  // Auto-close if clicked anywhere outside the sidebar
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('dashboardSidebar');
    const toggleBtn = document.getElementById('mobileMenuToggle');
    if (sidebar && (sidebar.classList.contains('mobile-open') || sidebar.classList.contains('open'))) {
      if (toggleBtn && (toggleBtn === e.target || toggleBtn.contains(e.target))) return;
      if (!sidebar.contains(e.target)) {
        window.closeMobileSidebar();
      }
    }
  });

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeMobileSidebar();
    }
  });

  // Close sidebar on viewport resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      window.closeMobileSidebar();
    }
  });

  window.addEventListener('orientationchange', () => {
    window.closeMobileSidebar();
  });

  // Bind all nav items with data-tab (they automatically close the mobile sidebar on navigation)
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) window.switchTab(tab);
    });
  });

  // Topbar notification button -> Navigate to Notifications Page
  const headerNotifBtn = document.getElementById('headerNotificationBtn');
  if (headerNotifBtn) {
    headerNotifBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.switchTab('notifications');
    });
  }

  // Initial render of default view
  window.switchTab('dashboard');
});
