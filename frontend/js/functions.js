import { addToCart, updateCartBadge, parseCurrency } from './cart.js';

const API_URL = 'https://velora-e-commerce-qby7.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initShopCartButtons();
  fetchProducts();
});

async function fetchProducts() {
  const productGrid = document.getElementById('productGrid');

  if (!productGrid) return;

  try {
    const response = await fetch(`${API_URL}/api/products`);

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    const products = data.products || data;

    productGrid.replaceChildren();

    products.forEach((product) => {
      const article = document.createElement('article');
      article.className = 'product-card';
      article.id = String(product.id);
      article.dataset.category = product.category || '';

      const visual = document.createElement('a');
      visual.className = 'product-visual';
      visual.href = `product.html?id=${encodeURIComponent(product.id)}`;

      const image = document.createElement('img');
      image.src = product.image_url || '';
      image.alt = product.title || 'Velora Product';

      visual.appendChild(image);

      const info = document.createElement('div');
      info.className = 'product-info';

      const infoText = document.createElement('div');

      const category = document.createElement('p');
      category.textContent = product.eyebrow || product.category || '';

      const title = document.createElement('h2');
      title.textContent = product.title || '';

      infoText.appendChild(category);
      infoText.appendChild(title);

      const price = document.createElement('strong');
      price.textContent = `R${Number(product.price || 0).toLocaleString('en-ZA')}`;

      info.appendChild(infoText);
      info.appendChild(price);

      const addButton = document.createElement('button');
      addButton.type = 'button';
      addButton.className = 'add-cart';
      addButton.setAttribute('aria-label', `Add ${product.title || 'product'} to cart`);
      addButton.textContent = 'Add to bag';

      article.appendChild(visual);
      article.appendChild(info);
      article.appendChild(addButton);

      productGrid.appendChild(article);
    });

    initShopCartButtons();
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }
}

export function initShopCartButtons() {
  const addButtons = document.querySelectorAll('.add-cart');

  addButtons.forEach((btn) => {
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