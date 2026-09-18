import { addToCart, updateCartBadge, parseCurrency } from './cart.js';

// ---------- Synchronize cart badge on page load ----------
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initShopCartButtons();
});

// ---------- Shopping cart buttons for catalog & shop section ----------
export function initShopCartButtons() {
  const addButtons = document.querySelectorAll('.add-cart');

  addButtons.forEach((btn) => {
    // Avoid double binding
    if (btn.dataset.cartInitialized) return;
    btn.dataset.cartInitialized = 'true';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const card = btn.closest('.product-card') || btn.closest('article');
      if (card) {
        const titleEl = card.querySelector('h2, .product-title, h3');
        const priceEl = card.querySelector('strong, .product-price');
        const imgEl = card.querySelector('img');
        const catEl = card.querySelector('.product-info p, [data-category]');

        const title = titleEl ? titleEl.textContent.trim() : 'Velora Product';
        const priceText = priceEl ? priceEl.textContent.trim() : '0';
        const price = parseCurrency(priceText);
        const image = imgEl ? imgEl.src : '';
        const category = catEl ? catEl.textContent.trim() : (card.dataset.category || 'Velora Goods');
        const id = card.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        addToCart({
          id,
          title,
          price,
          category,
          image,
          size: 'Standard',
          quantity: 1
        });
      } else {
        // Fallback generic item if clicked outside a standard card
        addToCart({
          id: `item-${Date.now()}`,
          title: btn.getAttribute('aria-label') || 'Velora Curated Essential',
          price: 950,
          category: 'Velora Essentials',
          size: 'Standard',
          quantity: 1
        });
      }

      btn.classList.add('added');
      setTimeout(() => btn.classList.remove('added'), 1200);
    });
  });
}

// ---------- Newsletter subscription ----------
const newsletterForm = document.getElementById('newsletterForm');
const newsletterFeedback = document.getElementById('newsletterFeedback');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('newsletterEmail');
    const email = emailInput ? emailInput.value.trim() : '';

    if (email && newsletterFeedback) {
      newsletterFeedback.textContent = 'Welcome to Velora! Check your inbox for a confirmation.';
      if (emailInput) emailInput.value = '';
      setTimeout(() => { newsletterFeedback.textContent = ''; }, 4000);
    }
  });
}
