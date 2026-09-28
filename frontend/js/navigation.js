/**
 * Velora Global Mobile Navigation Controller
 * Handles mobile hamburger menu toggle, outside click, ESC key, and accessibility.
 */
export function initMobileNav() {
  const menuButtons = document.querySelectorAll('.menu-button');
  const siteHeaders = document.querySelectorAll('.site-header');
  const mobileNavs = document.querySelectorAll('.mobile-nav');

  if (!menuButtons.length) return;

  function closeAllMenus() {
    document.body.classList.remove('menu-open');
    siteHeaders.forEach((h) => h.classList.remove('menu-open'));
    menuButtons.forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open menu');
    });
  }

  function openMenu(btn, header) {
    document.body.classList.add('menu-open');
    if (header) header.classList.add('menu-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close menu');
  }

  menuButtons.forEach((btn) => {
    // Avoid double-binding if called multiple times
    if (btn._veloraNavInit) return;
    btn._veloraNavInit = true;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const header = btn.closest('.site-header') || document.querySelector('.site-header');
      const isOpen = document.body.classList.contains('menu-open') || (header && header.classList.contains('menu-open'));

      if (isOpen) {
        closeAllMenus();
      } else {
        openMenu(btn, header);
      }
    });
  });

  // Auto-close on link click
  document.querySelectorAll('.mobile-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      closeAllMenus();
    });
  });

  // Auto-close on click outside header or mobile nav
  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('menu-open')) {
      const isInsideHeader = e.target.closest('.site-header');
      const isInsideBtn = e.target.closest('.menu-button');
      const isInsideNav = e.target.closest('.mobile-nav');
      if (!isInsideHeader && !isInsideBtn && !isInsideNav) {
        closeAllMenus();
      }
    }
  });

  // Auto-close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllMenus();
    }
  });

  // Ensure initial aria attributes
  menuButtons.forEach((btn) => {
    if (!btn.getAttribute('aria-label')) {
      btn.setAttribute('aria-label', 'Open menu');
    }
    if (!btn.getAttribute('aria-expanded')) {
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

// Auto-run when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
}
