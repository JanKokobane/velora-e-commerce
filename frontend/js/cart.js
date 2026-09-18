/**
 * Velora E-Commerce — Shopping Cart Management (cart.js)
 * Handles localStorage persistence, quantity manipulation, cart page rendering,
 * order totals, promo code validation, and navbar badge updates.
 */

export const CART_STORAGE_KEY = 'velora_cart';
export const LEGACY_STORAGE_KEY = 'cart';

/**
 * Retrieve current cart items from localStorage
 * @returns {Array} Array of cart item objects
 */
export function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.error('Error parsing cart from localStorage:', err);
    return [];
  }
}

/**
 * Persist cart items to localStorage and trigger badge / event updates
 * @param {Array} items
 */
export function saveCart(items) {
  try {
    const serialized = JSON.stringify(items);
    localStorage.setItem(CART_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_STORAGE_KEY, serialized); // keep legacy key in sync
    updateCartBadge();
    window.dispatchEvent(new CustomEvent('velora:cartUpdated', { detail: { cart: items } }));
  } catch (err) {
    console.error('Error saving cart to localStorage:', err);
  }
}

/**
 * Add a product item to the shopping cart
 * @param {Object} item - { id, title, price, size, quantity, image, category }
 */
export function addToCart(item) {
  const cart = getCart();
  const quantityToAdd = Math.max(1, parseInt(item.quantity, 10) || 1);
  const size = item.size ? String(item.size).trim() : 'Standard';

  // Check if identical item (same id AND size) already exists
  const existingIndex = cart.findIndex(
    (entry) => entry.id === item.id && String(entry.size || 'Standard') === size
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantityToAdd;
  } else {
    cart.push({
      id: item.id || `item-${Date.now()}`,
      title: item.title || 'Velora Essential Item',
      category: item.category || 'Velora Goods',
      price: typeof item.price === 'number' ? item.price : parseCurrency(item.price),
      size: size,
      quantity: quantityToAdd,
      image: item.image || 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    });
  }

  saveCart(cart);
  return cart;
}

/**
 * Update quantity for an existing cart item
 * @param {string} id
 * @param {string} size
 * @param {number} delta (+1 or -1 or explicit change)
 */
export function updateCartQuantity(id, size, delta) {
  let cart = getCart();
  const matchIndex = cart.findIndex(
    (item) => item.id === id && String(item.size || 'Standard') === String(size || 'Standard')
  );

  if (matchIndex > -1) {
    const nextQty = cart[matchIndex].quantity + delta;
    if (nextQty <= 0) {
      // Remove item
      cart.splice(matchIndex, 1);
    } else {
      cart[matchIndex].quantity = nextQty;
    }
    saveCart(cart);
  }
  return cart;
}

/**
 * Remove an item completely from the cart
 * @param {string} id
 * @param {string} size
 */
export function removeFromCart(id, size) {
  let cart = getCart();
  cart = cart.filter(
    (item) => !(item.id === id && String(item.size || 'Standard') === String(size || 'Standard'))
  );
  saveCart(cart);
  return cart;
}

/**
 * Empty the shopping bag
 */
export function clearCart() {
  saveCart([]);
}

/**
 * Calculate total quantity across all cart items
 * @returns {number}
 */
export function getCartTotalCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (parseInt(item.quantity, 10) || 0), 0);
}

/**
 * Calculate subtotal price
 * @returns {number}
 */
export function getCartSubtotal() {
  const cart = getCart();
  return cart.reduce((total, item) => {
    const itemPrice = typeof item.price === 'number' ? item.price : parseCurrency(item.price);
    const itemQty = parseInt(item.quantity, 10) || 0;
    return total + itemPrice * itemQty;
  }, 0);
}

/**
 * Parse currency string like "R1 150" or "R 890" into a numeric integer
 * @param {string|number} val
 * @returns {number}
 */
export function parseCurrency(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Format integer to South African Rand display: "R1 150"
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const rounded = Math.round(amount || 0);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `R${formatted}`;
}

/**
 * Synchronize cart quantity badge across header elements
 */
export function updateCartBadge() {
  const count = getCartTotalCount();
  const badgeEls = document.querySelectorAll('#cartCount, .cart-count, [data-cart-count]');
  badgeEls.forEach((el) => {
    el.textContent = count;
  });
}

/**
 * Initialize and render the Cart page (/components/cart.html)
 */
export function initCartPage() {
  const emptyView = document.getElementById('emptyCartView');
  const contentView = document.getElementById('cartContentView');
  const itemsContainer = document.getElementById('cartItemsContainer');
  const bagHeadingCount = document.getElementById('bagHeadingCount');
  const subtotalEl = document.getElementById('cartSubtotal');
  const deliveryEl = document.getElementById('cartDelivery');
  const totalEl = document.getElementById('cartTotal');
  const promoInput = document.getElementById('cartPromoInput');
  const promoBtn = document.getElementById('cartPromoBtn');
  const promoFeedback = document.getElementById('cartPromoFeedback');
  const discountRow = document.getElementById('cartDiscountRow');
  const discountEl = document.getElementById('cartDiscountAmount');
  const clearCartBtn = document.getElementById('clearCartBtn');

  if (!emptyView || !contentView) {
    return; // Not on the cart page
  }

  let promoDiscountPercent = 0;

  function render() {
    const cart = getCart();
    const count = getCartTotalCount();
    const subtotal = getCartSubtotal();

    updateCartBadge();

    if (bagHeadingCount) {
      bagHeadingCount.textContent = count === 1 ? '1 item' : `${count} items`;
    }

    if (cart.length === 0) {
      emptyView.style.display = 'block';
      contentView.style.display = 'none';
      return;
    }

    emptyView.style.display = 'none';
    contentView.style.display = 'grid';

    // Render items list
    if (itemsContainer) {
      itemsContainer.innerHTML = cart
        .map((item) => {
          const unitPrice = typeof item.price === 'number' ? item.price : parseCurrency(item.price);
          const lineTotal = unitPrice * item.quantity;
          const displaySize = item.size ? item.size : 'Standard';

          return `
            <div class="cart-item" data-id="${item.id}" data-size="${displaySize}">
              <div class="cart-item-image">
                <img src="${item.image}" alt="${item.title}">
              </div>
              <div class="cart-item-details">
                <div class="cart-item-header">
                  <div>
                    <span class="cart-item-category">${item.category || 'Velora Goods'}</span>
                    <h3 class="cart-item-title">${item.title}</h3>
                  </div>
                  <button type="button" class="remove-item-btn" aria-label="Remove ${item.title}" data-remove-id="${item.id}" data-remove-size="${displaySize}">✕</button>
                </div>

                <div class="cart-item-meta">
                  <span class="item-size-badge">Size: <strong>${displaySize}</strong></span>
                  <span class="item-unit-price">${formatCurrency(unitPrice)} each</span>
                </div>

                <div class="cart-item-footer">
                  <div class="cart-qty-stepper">
                    <button type="button" class="qty-btn minus" data-change="-1" data-id="${item.id}" data-size="${displaySize}" aria-label="Decrease quantity">−</button>
                    <span class="qty-val">${item.quantity}</span>
                    <button type="button" class="qty-btn plus" data-change="1" data-id="${item.id}" data-size="${displaySize}" aria-label="Increase quantity">＋</button>
                  </div>
                  <div class="cart-item-total">
                    <span>${formatCurrency(lineTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        })
        .join('');
    }

    // Calculations
    const discountAmount = promoDiscountPercent > 0 ? Math.round(subtotal * (promoDiscountPercent / 100)) : 0;
    const discountedSubtotal = subtotal - discountAmount;
    // Complimentary delivery over R800, otherwise R120
    const deliveryFee = subtotal >= 800 ? 0 : 120;
    const grandTotal = discountedSubtotal + deliveryFee;

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);

    if (discountRow && discountEl) {
      if (discountAmount > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = `-${formatCurrency(discountAmount)}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (deliveryEl) {
      if (deliveryFee === 0) {
        deliveryEl.innerHTML = '<span class="free-delivery-tag">Complimentary</span>';
      } else {
        deliveryEl.textContent = formatCurrency(deliveryFee);
      }
    }

    if (totalEl) totalEl.textContent = formatCurrency(grandTotal);
  }

  // Delegated clicks for cart item actions (quantity and remove)
  if (itemsContainer) {
    itemsContainer.addEventListener('click', (e) => {
      // Remove button
      const removeBtn = e.target.closest('[data-remove-id]');
      if (removeBtn) {
        const id = removeBtn.getAttribute('data-remove-id');
        const size = removeBtn.getAttribute('data-remove-size');
        removeFromCart(id, size);
        render();
        return;
      }

      // Quantity buttons
      const qtyBtn = e.target.closest('.qty-btn');
      if (qtyBtn) {
        const id = qtyBtn.getAttribute('data-id');
        const size = qtyBtn.getAttribute('data-size');
        const delta = parseInt(qtyBtn.getAttribute('data-change'), 10) || 0;
        updateCartQuantity(id, size, delta);
        render();
        return;
      }
    });
  }

  // Clear cart button
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to empty your shopping bag?')) {
        clearCart();
        render();
      }
    });
  }

  // Promo Code Handler
  if (promoBtn && promoInput && promoFeedback) {
    promoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (!code) {
        promoFeedback.textContent = 'Please enter a voucher or promo code.';
        promoFeedback.className = 'promo-feedback error';
        return;
      }

      if (code === 'VELORA10') {
        promoDiscountPercent = 10;
        promoFeedback.textContent = '10% privilege discount applied successfully!';
        promoFeedback.className = 'promo-feedback success';
        render();
      } else if (code === 'WELCOME15') {
        promoDiscountPercent = 15;
        promoFeedback.textContent = '15% new member discount applied!';
        promoFeedback.className = 'promo-feedback success';
        render();
      } else {
        promoFeedback.textContent = 'Code invalid or expired. Try "VELORA10".';
        promoFeedback.className = 'promo-feedback error';
      }
    });
  }

  // Initial render
  render();

  // Listen to external updates
  window.addEventListener('velora:cartUpdated', render);
}

/**
 * Initialize checkout page summary and promo calculations
 */
export function initCheckoutPage() {
  const checkoutItemsList = document.getElementById('checkoutPageItemsList');
  const subtotalEl = document.getElementById('checkoutPageSubtotal');
  const discountRow = document.getElementById('checkoutPageDiscountRow');
  const discountEl = document.getElementById('checkoutPageDiscount');
  const deliveryEl = document.getElementById('checkoutPageDelivery');
  const totalEl = document.getElementById('checkoutPageTotal');
  const promoInput = document.getElementById('checkoutPagePromoInput');
  const promoBtn = document.getElementById('checkoutPagePromoBtn');
  const promoFeedback = document.getElementById('checkoutPagePromoFeedback');
  const shippingForm = document.getElementById('standaloneShippingForm');

  if (!checkoutItemsList || !subtotalEl) return;

  let promoDiscountPercent = 0;

  function renderCheckout() {
    const cart = getCart();
    const subtotal = getCartSubtotal();

    if (cart.length === 0) {
      checkoutItemsList.innerHTML = `
        <div style="padding: 20px 0; text-align: center; color: var(--muted); font-size: 13px;">
          Your shopping bag is currently empty.
          <div style="margin-top: 10px;">
            <a href="shop.html" style="text-decoration: underline; color: var(--ink); font-weight: 600;">Return to Shop</a>
          </div>
        </div>
      `;
    } else {
      checkoutItemsList.innerHTML = cart
        .map((item) => {
          const unitPrice = typeof item.price === 'number' ? item.price : parseCurrency(item.price);
          const lineTotal = unitPrice * item.quantity;
          return `
            <div class="checkout-item" style="display: flex; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line);">
              <div style="width: 54px; height: 54px; border-radius: 4px; overflow: hidden; background: var(--cream); flex-shrink: 0; border: 1px solid var(--line);">
                <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
              <div style="flex: 1; min-width: 0;">
                <h4 style="margin: 0; font-size: 13px; font-weight: 600; color: var(--ink);">${item.title}</h4>
                <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">Size: ${item.size || 'Standard'} &times; ${item.quantity}</div>
              </div>
              <strong style="font-size: 13px; color: var(--ink);">${formatCurrency(lineTotal)}</strong>
            </div>
          `;
        })
        .join('');
    }

    const discountAmount = promoDiscountPercent > 0 ? Math.round(subtotal * (promoDiscountPercent / 100)) : 0;
    const discountedSubtotal = subtotal - discountAmount;
    const deliveryFee = subtotal >= 800 || subtotal === 0 ? 0 : 120;
    const grandTotal = discountedSubtotal + deliveryFee;

    subtotalEl.textContent = formatCurrency(subtotal);

    if (discountRow && discountEl) {
      if (discountAmount > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = `-${formatCurrency(discountAmount)}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (deliveryEl) {
      deliveryEl.textContent = deliveryFee === 0 ? 'Complimentary' : formatCurrency(deliveryFee);
    }

    if (totalEl) {
      totalEl.textContent = formatCurrency(grandTotal);
    }
  }

  if (promoBtn && promoInput && promoFeedback) {
    promoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'VELORA10') {
        promoDiscountPercent = 10;
        promoFeedback.textContent = '10% discount applied!';
        promoFeedback.style.color = 'var(--success, #55755b)';
        renderCheckout();
      } else {
        promoFeedback.textContent = 'Invalid promo code. Try VELORA10';
        promoFeedback.style.color = 'var(--danger, #b33a3a)';
      }
    });
  }

  if (shippingForm) {
    shippingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'payment.html';
    });
  }

  renderCheckout();
}

// Auto-run badge synchronization on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initCartPage();
  initCheckoutPage();
});
