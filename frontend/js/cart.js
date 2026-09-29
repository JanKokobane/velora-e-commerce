import { initMobileNav } from './navigation.js';

export const CART_STORAGE_KEY = 'velora_cart';
export const LEGACY_STORAGE_KEY = 'cart';

function normalizeCartItem(item) {
  const hasStock = item.stock !== undefined && item.stock !== null && item.stock !== '';
  const parsedStock = hasStock ? Number(item.stock) : Number.NaN;
  const stock = Number.isFinite(parsedStock)
    ? Math.max(0, Math.floor(parsedStock))
    : undefined;

  let quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

  if (stock > 0) {
    quantity = Math.min(quantity, stock);
  }

  return {
    ...item,
    id: String(item.id),
    size: item.size ? String(item.size).trim() : 'Standard',
    quantity,
    ...(stock === undefined ? {} : { stock }),
    price:
      typeof item.price === 'number'
        ? item.price
        : parseCurrency(item.price)
  };
}

export function getCart() {
  try {
    const raw =
      localStorage.getItem(CART_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY);

    if (!raw) return [];

    const items = JSON.parse(raw);

    if (!Array.isArray(items)) return [];

    return items.map(normalizeCartItem);
  } catch (err) {
    console.error('Error parsing cart from localStorage:', err);
    return [];
  }
}

export function saveCart(items) {
  try {
    const normalizedItems = items.map(normalizeCartItem);

    const serialized = JSON.stringify(normalizedItems);

    localStorage.setItem(CART_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_STORAGE_KEY, serialized);

    updateCartBadge();

    window.dispatchEvent(
      new CustomEvent('velora:cartUpdated', {
        detail: {
          cart: normalizedItems
        }
      })
    );
  } catch (err) {
    console.error('Error saving cart to localStorage:', err);
  }
}

export function addToCart(item) {
  const cart = getCart();

  const id = String(item.id || `item-${Date.now()}`);

  const quantityToAdd = Math.max(
    1,
    parseInt(item.quantity, 10) || 1
  );

  const size = item.size
    ? String(item.size).trim()
    : 'Standard';

  const existingIndex = cart.findIndex(
    (entry) =>
      String(entry.id) === id &&
      String(entry.size || 'Standard') === size
  );

  const existingItem =
    existingIndex > -1
      ? cart[existingIndex]
      : null;

  const suppliedStock =
    item.stock === undefined || item.stock === null
      ? existingItem?.stock
      : Number(item.stock);

  const availableStock = Number.isFinite(Number(suppliedStock))
    ? Math.max(0, Math.floor(Number(suppliedStock)))
    : undefined;

  const existingProductQuantity = cart
    .filter((entry) => String(entry.id) === id)
    .reduce(
      (total, entry) => total + entry.quantity,
      0
    );

  const acceptedQuantity =
    availableStock === undefined
      ? quantityToAdd
      : Math.min(
          quantityToAdd,
          Math.max(
            0,
            availableStock - existingProductQuantity
          )
        );

  if (acceptedQuantity === 0) {
    return cart;
  }

  if (existingIndex > -1) {
    const nextQuantity =
      cart[existingIndex].quantity + acceptedQuantity;

    cart[existingIndex].quantity =
      availableStock === undefined
        ? nextQuantity
        : Math.min(
            nextQuantity,
            availableStock
          );

    if (availableStock !== undefined) {
      cart[existingIndex].stock =
        availableStock;
    }
  } else {
    cart.push({
      id,
      title:
        item.title ||
        'Velora Essential Item',
      category:
        item.category ||
        'Velora Goods',
      price:
        typeof item.price === 'number'
          ? item.price
          : parseCurrency(item.price),
      size,
      quantity: acceptedQuantity,
      ...(availableStock === undefined
        ? {}
        : { stock: availableStock }),
      image:
        item.image ||
        'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    });
  }

  saveCart(cart);

  return cart;
}

export function updateCartQuantity(
  id,
  size,
  delta
) {
  const cart = getCart();

  const normalizedId = String(id);
  const normalizedSize = String(
    size || 'Standard'
  );

  const matchIndex = cart.findIndex(
    (item) =>
      String(item.id) === normalizedId &&
      String(item.size || 'Standard') ===
        normalizedSize
  );

  if (matchIndex > -1) {
    const nextQty =
      cart[matchIndex].quantity +
      Number(delta || 0);

    const availableStock = Number(
      cart[matchIndex].stock
    );

    const otherProductQuantity =
      cart.reduce(
        (total, item, index) => {
          return index !== matchIndex &&
            String(item.id) === normalizedId
            ? total + item.quantity
            : total;
        },
        0
      );

    const maxQuantity =
      Number.isFinite(availableStock)
        ? Math.max(
            0,
            availableStock -
              otherProductQuantity
          )
        : Number.POSITIVE_INFINITY;

    if (nextQty <= 0) {
      cart.splice(matchIndex, 1);
    } else if (maxQuantity <= 0) {
      return cart;
    } else {
      cart[matchIndex].quantity =
        Math.min(
          nextQty,
          maxQuantity
        );
    }

    saveCart(cart);
  }

  return cart;
}

export function getCartStockError(
  cart = getCart()
) {
  const totals = new Map();
  const limits = new Map();

  cart.forEach((item) => {
    const id = String(item.id);
    const stock = Number(item.stock);

    totals.set(
      id,
      (totals.get(id) || 0) +
        item.quantity
    );

    if (Number.isFinite(stock)) {
      limits.set(id, stock);
    }
  });

  for (const [id, quantity] of totals) {
    const stock = limits.get(id);

    const item = cart.find(
      (entry) =>
        String(entry.id) === id
    );

    if (stock === undefined) {
      return `We couldn't verify stock for ${
        item?.title || 'an item'
      }. Please try again.`;
    }

    if (stock <= 0) {
      return `${
        item?.title || 'An item'
      } is out of stock. Remove it from your bag to continue.`;
    }

    if (quantity > stock) {
      return `Your bag has more ${
        item?.title || 'items'
      } than are currently available. Update the quantity to continue.`;
    }
  }

  return '';
}

export async function refreshCartStock() {
  const cart = getCart();

  if (cart.length === 0) {
    return cart;
  }

  const baseUrl =
    typeof window !== 'undefined'
      ? window.VELORA_API_URL ||
        window.VELORA_API_BASE_URL ||
        'https://velora-e-commerce-qby7.onrender.com'
      : 'https://velora-e-commerce-qby7.onrender.com';

  const response = await fetch(
    `${baseUrl.replace(
      /\/+$/,
      ''
    )}/api/products`,
    {
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    throw new Error(
      `Stock check failed (HTTP ${response.status}).`
    );
  }

  const data = await response.json();

  const products = Array.isArray(
    data?.products
  )
    ? data.products
    : Array.isArray(data)
      ? data
      : [];

  const productsById = new Map(
    products.map((product) => [
      String(product.id),
      product
    ])
  );

  const updatedCart = cart.map(
    (item) => {
      const product =
        productsById.get(
          String(
            item.productId ||
              item.id
          )
        );

      const stock = product
        ? Math.max(
            0,
            Number(product.stock) || 0
          )
        : 0;

      return {
        ...item,
        title:
          product?.title ||
          item.title,
        stock
      };
    }
  );

  const allocatedByProduct =
    new Map();

  const reconciledCart =
    updatedCart.map((item) => {
      const id = String(item.id);

      const allocated =
        allocatedByProduct.get(id) ||
        0;

      const remaining =
        Math.max(
          0,
          item.stock - allocated
        );

      const quantity =
        item.stock > 0
          ? Math.min(
              item.quantity,
              remaining
            )
          : item.quantity;

      allocatedByProduct.set(
        id,
        allocated + quantity
      );

      return {
        ...item,
        quantity
      };
    });

  saveCart(reconciledCart);

  return getCart();
}

export function removeFromCart(
  id,
  size
) {
  const normalizedId = String(id);

  const normalizedSize = String(
    size || 'Standard'
  );

  let cart = getCart();

  cart = cart.filter(
    (item) =>
      !(
        String(item.id) ===
          normalizedId &&
        String(
          item.size || 'Standard'
        ) === normalizedSize
      )
  );

  saveCart(cart);

  return cart;
}

export function clearCart() {
  saveCart([]);
}

export function getCartTotalCount() {
  const cart = getCart();

  return cart.reduce(
    (total, item) =>
      total +
      (parseInt(
        item.quantity,
        10
      ) || 0),
    0
  );
}

export function getCartSubtotal() {
  const cart = getCart();

  return cart.reduce(
    (total, item) => {
      const itemPrice =
        typeof item.price === 'number'
          ? item.price
          : parseCurrency(item.price);

      const itemQty =
        parseInt(
          item.quantity,
          10
        ) || 0;

      return (
        total +
        itemPrice * itemQty
      );
    },
    0
  );
}

export function parseCurrency(val) {
  if (typeof val === 'number') {
    return val;
  }

  if (!val) {
    return 0;
  }

  const cleaned = String(val).replace(
    /[^0-9.]/g,
    ''
  );

  return parseFloat(cleaned) || 0;
}

export function formatCurrency(
  amount
) {
  const rounded = Math.round(
    amount || 0
  );

  const formatted = rounded
    .toString()
    .replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ' '
    );

  return `R${formatted}`;
}

export function updateCartBadge() {
  const count =
    getCartTotalCount();

  const badgeEls =
    document.querySelectorAll(
      '#cartCount, .cart-count, [data-cart-count]'
    );

  badgeEls.forEach((el) => {
    el.textContent = count;
  });
}

export function initCartPage() {
  const emptyView =
    document.getElementById(
      'emptyCartView'
    );

  const contentView =
    document.getElementById(
      'cartContentView'
    );

  const itemsContainer =
    document.getElementById(
      'cartItemsContainer'
    );

  const bagHeadingCount =
    document.getElementById(
      'bagHeadingCount'
    );

  const subtotalEl =
    document.getElementById(
      'cartSubtotal'
    );

  const deliveryEl =
    document.getElementById(
      'cartDelivery'
    );

  const totalEl =
    document.getElementById(
      'cartTotal'
    );

  const promoInput =
    document.getElementById(
      'cartPromoInput'
    );

  const promoBtn =
    document.getElementById(
      'cartPromoBtn'
    );

  const promoFeedback =
    document.getElementById(
      'cartPromoFeedback'
    );

  const discountRow =
    document.getElementById(
      'cartDiscountRow'
    );

  const discountEl =
    document.getElementById(
      'cartDiscountAmount'
    );

  const clearCartBtn =
    document.getElementById(
      'clearCartBtn'
    );

  const checkoutBtn =
    document.querySelector(
      '.proceed-checkout-btn'
    );

  const stockMessage =
    document.getElementById(
      'cartStockMessage'
    );

  let cartStockValidated = false;

  if (!emptyView || !contentView) {
    return;
  }

  let promoDiscountPercent = 0;

  function render() {
    const cart = getCart();

    const count =
      getCartTotalCount();

    const subtotal =
      getCartSubtotal();

    const productQuantities =
      new Map();

    cart.forEach((item) => {
      const id = String(item.id);

      productQuantities.set(
        id,
        (productQuantities.get(id) ||
          0) + item.quantity
      );
    });

    updateCartBadge();

    if (checkoutBtn) {
      checkoutBtn.setAttribute(
        'aria-disabled',
        String(
          !cartStockValidated ||
            cart.length === 0
        )
      );
    }

    if (bagHeadingCount) {
      bagHeadingCount.textContent =
        count === 1
          ? '1 item'
          : `${count} items`;
    }

    if (cart.length === 0) {
      emptyView.style.display =
        'block';

      contentView.style.display =
        'none';

      if (itemsContainer) {
        itemsContainer.replaceChildren();
      }

      if (subtotalEl) {
        subtotalEl.textContent =
          formatCurrency(0);
      }

      if (deliveryEl) {
        deliveryEl.textContent =
          'Complimentary';
      }

      if (totalEl) {
        totalEl.textContent =
          formatCurrency(0);
      }

      if (discountRow) {
        discountRow.style.display =
          'none';
      }

      return;
    }

    emptyView.style.display =
      'none';

    contentView.style.display =
      'grid';

    if (itemsContainer) {
      itemsContainer.innerHTML =
        cart
          .map((item) => {
            const unitPrice =
              typeof item.price ===
              'number'
                ? item.price
                : parseCurrency(
                    item.price
                  );

            const lineTotal =
              unitPrice *
              item.quantity;

            const displaySize =
              item.size ||
              'Standard';

            const availableStock =
              Number(item.stock);

            const hasStockLimit =
              Number.isFinite(
                availableStock
              );

            const productQuantity =
              productQuantities.get(
                String(item.id)
              ) ||
              item.quantity;

            const stockLabel =
              !hasStockLimit
                ? 'Checking availability'
                : availableStock === 0
                  ? 'Out of stock'
                  : availableStock < 5
                    ? `Only ${availableStock} left`
                    : `${availableStock} in stock`;

            const incrementDisabled =
              hasStockLimit &&
              productQuantity >=
                availableStock;

            return `
              <div
                class="cart-item"
                data-id="${item.id}"
                data-size="${displaySize}"
              >
                <div class="cart-item-image">
                  <img
                    src="${item.image || ''}"
                    alt="${item.title || 'Velora Product'}"
                  >
                </div>

                <div class="cart-item-details">
                  <div class="cart-item-header">
                    <div>
                      <span class="cart-item-category">
                        ${item.category || 'Velora Goods'}
                      </span>

                      <h3 class="cart-item-title">
                        ${item.title || 'Velora Product'}
                      </h3>
                    </div>

                    <button
                      type="button"
                      class="remove-item-btn"
                      aria-label="Remove ${item.title || 'product'}"
                      data-remove-id="${item.id}"
                      data-remove-size="${displaySize}"
                    >
                      ✕
                    </button>
                  </div>

                  <div class="cart-item-meta">
                    <span class="item-size-badge">
                      Size:
                      <strong>${displaySize}</strong>
                    </span>

                    <span class="item-unit-price">
                      ${formatCurrency(unitPrice)} each
                    </span>

                    <span class="cart-stock-note ${
                      hasStockLimit &&
                      availableStock > 0 &&
                      availableStock < 5
                        ? 'is-low-stock'
                        : ''
                    } ${
                      hasStockLimit &&
                      availableStock === 0
                        ? 'is-out-of-stock'
                        : ''
                    }">
                      ${stockLabel}
                    </span>
                  </div>

                  <div class="cart-item-footer">
                    <div class="cart-qty-stepper">
                      <button
                        type="button"
                        class="qty-btn minus"
                        data-change="-1"
                        data-id="${item.id}"
                        data-size="${displaySize}"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <span class="qty-val">
                        ${item.quantity}
                      </span>

                      <button
                        type="button"
                        class="qty-btn plus"
                        data-change="1"
                        data-id="${item.id}"
                        data-size="${displaySize}"
                        aria-label="Increase quantity"
                        ${
                          incrementDisabled
                            ? 'disabled'
                            : ''
                        }
                      >
                        ＋
                      </button>
                    </div>

                    <div class="cart-item-total">
                      <span>
                        ${formatCurrency(lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            `;
          })
          .join('');
    }

    const discountAmount =
      promoDiscountPercent > 0
        ? Math.round(
            subtotal *
              (promoDiscountPercent /
                100)
          )
        : 0;

    const discountedSubtotal =
      subtotal -
      discountAmount;

    const deliveryFee =
      subtotal >= 800
        ? 0
        : 120;

    const grandTotal =
      discountedSubtotal +
      deliveryFee;

    if (subtotalEl) {
      subtotalEl.textContent =
        formatCurrency(
          subtotal
        );
    }

    if (
      discountRow &&
      discountEl
    ) {
      if (discountAmount > 0) {
        discountRow.style.display =
          'flex';

        discountEl.textContent =
          `-${formatCurrency(
            discountAmount
          )}`;
      } else {
        discountRow.style.display =
          'none';
      }
    }

    if (deliveryEl) {
      if (deliveryFee === 0) {
        deliveryEl.innerHTML =
          '<span class="free-delivery-tag">Complimentary</span>';
      } else {
        deliveryEl.textContent =
          formatCurrency(
            deliveryFee
          );
      }
    }

    if (totalEl) {
      totalEl.textContent =
        formatCurrency(
          grandTotal
        );
    }
  }

  if (itemsContainer) {
    itemsContainer.addEventListener(
      'click',
      (e) => {
        const removeBtn =
          e.target.closest(
            '[data-remove-id]'
          );

        if (removeBtn) {
          const id =
            removeBtn.getAttribute(
              'data-remove-id'
            );

          const size =
            removeBtn.getAttribute(
              'data-remove-size'
            );

          removeFromCart(
            id,
            size
          );

          render();

          return;
        }

        const qtyBtn =
          e.target.closest(
            '.qty-btn'
          );

        if (qtyBtn) {
          const id =
            qtyBtn.getAttribute(
              'data-id'
            );

          const size =
            qtyBtn.getAttribute(
              'data-size'
            );

          const delta =
            parseInt(
              qtyBtn.getAttribute(
                'data-change'
              ),
              10
            ) || 0;

          updateCartQuantity(
            id,
            size,
            delta
          );

          render();
        }
      }
    );
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener(
      'click',
      () => {
        if (
          confirm(
            'Are you sure you want to empty your shopping bag?'
          )
        ) {
          clearCart();
          render();
        }
      }
    );
  }

  if (
    promoBtn &&
    promoInput &&
    promoFeedback
  ) {
    promoBtn.addEventListener(
      'click',
      () => {
        const code =
          promoInput.value
            .trim()
            .toUpperCase();

        if (!code) {
          promoFeedback.textContent =
            'Please enter a voucher or promo code.';

          promoFeedback.className =
            'promo-feedback error';

          return;
        }

        if (
          code === 'VELORA10'
        ) {
          promoDiscountPercent = 10;

          promoFeedback.textContent =
            '10% privilege discount applied successfully!';

          promoFeedback.className =
            'promo-feedback success';

          render();
        } else if (
          code === 'WELCOME15'
        ) {
          promoDiscountPercent = 15;

          promoFeedback.textContent =
            '15% new member discount applied!';

          promoFeedback.className =
            'promo-feedback success';

          render();
        } else {
          promoFeedback.textContent =
            'Code invalid or expired. Try "VELORA10".';

          promoFeedback.className =
            'promo-feedback error';
        }
      }
    );
  }

  async function checkCartStock() {
    cartStockValidated =
      false;

    if (stockMessage) {
      stockMessage.textContent =
        'Checking current stock…';

      stockMessage.classList.remove(
        'is-error',
        'is-success'
      );
    }

    try {
      const cart =
        await refreshCartStock();

      if (cart.length === 0) {
        if (stockMessage) {
          stockMessage.textContent =
            'Your bag is empty.';

          stockMessage.classList.add(
            'is-error'
          );
        }

        render();

        return false;
      }

      const stockError =
        getCartStockError(cart);

      cartStockValidated =
        !stockError;

      if (stockMessage) {
        stockMessage.textContent =
          stockError ||
          'Stock confirmed for your bag.';

        stockMessage.classList.add(
          stockError
            ? 'is-error'
            : 'is-success'
        );
      }

      render();

      return !stockError;
    } catch (_) {
      if (stockMessage) {
        stockMessage.textContent =
          'We could not verify stock. Please try again before checkout.';

        stockMessage.classList.add(
          'is-error'
        );
      }

      render();

      return false;
    }
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener(
      'click',
      async (e) => {
        e.preventDefault();

        if (
          !(await checkCartStock())
        ) {
          return;
        }

        const rawUser =
          localStorage.getItem(
            'velora_current_user'
          );

        let isAuthenticated =
          false;

        if (rawUser) {
          try {
            const user =
              JSON.parse(rawUser);

            if (
              user &&
              (user.email ||
                user.id)
            ) {
              isAuthenticated =
                true;
            }
          } catch (err) {
            isAuthenticated =
              false;
          }
        }

        if (
          isAuthenticated
        ) {
          window.location.href =
            'checkout.html';
        } else {
          window.location.href =
            'auth.html?return=checkout';
        }
      }
    );
  }

  render();

  checkCartStock();

  window.addEventListener(
    'velora:cartUpdated',
    render
  );
}

export function initCheckoutPage() {
  const checkoutItemsList =
    document.getElementById(
      'checkoutPageItemsList'
    );

  const subtotalEl =
    document.getElementById(
      'checkoutPageSubtotal'
    );

  const discountRow =
    document.getElementById(
      'checkoutPageDiscountRow'
    );

  const discountEl =
    document.getElementById(
      'checkoutPageDiscount'
    );

  const deliveryEl =
    document.getElementById(
      'checkoutPageDelivery'
    );

  const totalEl =
    document.getElementById(
      'checkoutPageTotal'
    );

  const promoInput =
    document.getElementById(
      'checkoutPagePromoInput'
    );

  const promoBtn =
    document.getElementById(
      'checkoutPagePromoBtn'
    );

  const promoFeedback =
    document.getElementById(
      'checkoutPagePromoFeedback'
    );

  const shippingForm =
    document.getElementById(
      'standaloneShippingForm'
    );

  const stockMessage =
    document.getElementById(
      'checkoutStockMessage'
    );

  const continueButton =
    document.getElementById(
      'continueToPaymentBtn'
    );

  if (
    !checkoutItemsList ||
    !subtotalEl
  ) {
    return;
  }

  let promoDiscountPercent = 0;

  function renderCheckout() {
    const cart = getCart();

    const subtotal =
      getCartSubtotal();

    if (cart.length === 0) {
      checkoutItemsList.innerHTML = `
        <div style="padding: 20px 0; text-align: center; color: var(--muted); font-size: 13px;">
          Your shopping bag is currently empty.

          <div style="margin-top: 10px;">
            <a
              href="shop.html"
              style="text-decoration: underline; color: var(--ink); font-weight: 600;"
            >
              Return to Shop
            </a>
          </div>
        </div>
      `;
    } else {
      checkoutItemsList.innerHTML =
        cart
          .map((item) => {
            const unitPrice =
              typeof item.price ===
              'number'
                ? item.price
                : parseCurrency(
                    item.price
                  );

            const lineTotal =
              unitPrice *
              item.quantity;

            return `
              <div
                class="checkout-item"
                style="display: flex; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line);"
              >
                <div
                  style="width: 54px; height: 54px; border-radius: 4px; overflow: hidden; background: var(--cream); flex-shrink: 0; border: 1px solid var(--line);"
                >
                  <img
                    src="${item.image || ''}"
                    alt="${item.title || 'Velora Product'}"
                    style="width: 100%; height: 100%; object-fit: cover;"
                  >
                </div>

                <div
                  style="flex: 1; min-width: 0;"
                >
                  <h4
                    style="margin: 0; font-size: 13px; font-weight: 600; color: var(--ink);"
                  >
                    ${item.title || 'Velora Product'}
                  </h4>

                  <div
                    style="font-size: 11px; color: var(--muted); margin-top: 2px;"
                  >
                    Size:
                    ${item.size || 'Standard'}
                    &times;
                    ${item.quantity}
                  </div>
                </div>

                <strong
                  style="font-size: 13px; color: var(--ink);"
                >
                  ${formatCurrency(
                    lineTotal
                  )}
                </strong>
              </div>
            `;
          })
          .join('');
    }

    const discountAmount =
      promoDiscountPercent > 0
        ? Math.round(
            subtotal *
              (promoDiscountPercent /
                100)
          )
        : 0;

    const discountedSubtotal =
      subtotal -
      discountAmount;

    const deliveryFee =
      subtotal >= 800 ||
      subtotal === 0
        ? 0
        : 120;

    const grandTotal =
      discountedSubtotal +
      deliveryFee;

    subtotalEl.textContent =
      formatCurrency(
        subtotal
      );

    if (
      discountRow &&
      discountEl
    ) {
      if (discountAmount > 0) {
        discountRow.style.display =
          'flex';

        discountEl.textContent =
          `-${formatCurrency(
            discountAmount
          )}`;
      } else {
        discountRow.style.display =
          'none';
      }
    }

    if (deliveryEl) {
      deliveryEl.textContent =
        deliveryFee === 0
          ? 'Complimentary'
          : formatCurrency(
              deliveryFee
            );
    }

    if (totalEl) {
      totalEl.textContent =
        formatCurrency(
          grandTotal
        );
    }
  }

  async function verifyCheckoutStock() {
    if (continueButton) {
      continueButton.disabled =
        true;
    }

    if (stockMessage) {
      stockMessage.textContent =
        'Checking current stock…';

      stockMessage.classList.remove(
        'is-error',
        'is-success'
      );
    }

    try {
      const cart =
        await refreshCartStock();

      const stockError =
        getCartStockError(cart);

      if (stockMessage) {
        stockMessage.textContent =
          stockError ||
          'Stock confirmed for your order.';

        stockMessage.classList.add(
          stockError
            ? 'is-error'
            : 'is-success'
        );
      }

      renderCheckout();

      const stockIsValid =
        !stockError &&
        cart.length > 0;

      if (continueButton) {
        continueButton.disabled =
          !stockIsValid;
      }

      return stockIsValid;
    } catch (_) {
      if (stockMessage) {
        stockMessage.textContent =
          'We could not verify stock. Please try again before continuing.';

        stockMessage.classList.add(
          'is-error'
        );
      }

      if (continueButton) {
        continueButton.disabled =
          true;
      }

      return false;
    }
  }

  if (
    promoBtn &&
    promoInput &&
    promoFeedback
  ) {
    promoBtn.addEventListener(
      'click',
      () => {
        const code =
          promoInput.value
            .trim()
            .toUpperCase();

        if (
          code === 'VELORA10'
        ) {
          promoDiscountPercent =
            10;

          promoFeedback.textContent =
            '10% discount applied!';

          promoFeedback.style.color =
            'var(--success, #55755b)';

          renderCheckout();
        } else {
          promoFeedback.textContent =
            'Invalid promo code. Try VELORA10';

          promoFeedback.style.color =
            'var(--danger, #b33a3a)';
        }
      }
    );
  }

  if (shippingForm) {
    shippingForm.addEventListener(
      'submit',
      async (e) => {
        e.preventDefault();

        const stockIsValid =
          await verifyCheckoutStock();

        if (!stockIsValid) {
          return;
        }

        const rawUser =
          localStorage.getItem(
            'velora_current_user'
          );

        let isAuthenticated =
          false;

        if (rawUser) {
          try {
            const user =
              JSON.parse(rawUser);

            if (
              user &&
              (user.email ||
                user.id)
            ) {
              isAuthenticated =
                true;
            }
          } catch (err) {
            isAuthenticated =
              false;
          }
        }

        if (
          isAuthenticated
        ) {
          window.location.href =
            'payment.html';
        } else {
          window.location.href =
            'auth.html?return=checkout';
        }
      }
    );
  }

  renderCheckout();


  verifyCheckoutStock();

  window.addEventListener(
    'velora:cartUpdated',
    renderCheckout
  );
}

document.addEventListener(
  'DOMContentLoaded',
  () => {
    updateCartBadge();

    initCartPage();
    initCheckoutPage();
    initMobileNav();
  }
);