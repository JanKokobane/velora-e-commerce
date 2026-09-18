import {
  getCart,
  clearCart,
  getCartSubtotal,
  formatCurrency,
  parseCurrency,
  updateCartBadge
} from './cart.js';

// Storage Keys
export const SHIPPING_STORAGE_KEY = 'velora_shipping_details';
export const LAST_ORDER_STORAGE_KEY = 'velora_last_order';
export const ORDERS_HISTORY_KEY = 'velora_orders_history';
export const PROMO_STORAGE_KEY = 'velora_promo_discount';

/**
 * Get stored shipping information
 */
export function getShippingDetails() {
  try {
    const raw = localStorage.getItem(SHIPPING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Error reading shipping details:', e);
    return null;
  }
}

/**
 * Save shipping details
 */
export function saveShippingDetails(details) {
  try {
    localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(details));
  } catch (e) {
    console.error('Error saving shipping details:', e);
  }
}

/**
 * Save a completed order to history
 */
export function saveCompletedOrder(order) {
  try {
    localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(order));
    const historyRaw = localStorage.getItem(ORDERS_HISTORY_KEY);
    const history = historyRaw ? JSON.parse(historyRaw) : [];
    history.unshift(order);
    localStorage.setItem(ORDERS_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Error recording order history:', e);
  }
}

/**
 * Calculate delivery date range (2-4 business days ahead)
 */
function getEstimatedDeliveryRange() {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  const end = new Date();
  end.setDate(end.getDate() + 4);

  const options = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('en-GB', options)} – ${end.toLocaleDateString('en-GB', options)} ${end.getFullYear()}`;
}

// --------------------------------------------------------------------------
// 1. Checkout Page Logic (checkout.html)
// --------------------------------------------------------------------------
export function initCheckoutPage() {
  const shippingForm = document.getElementById('standaloneShippingForm');
  if (!shippingForm) return;

  const emailInput = document.getElementById('shippingEmail');
  const phoneInput = document.getElementById('shippingPhone');
  const firstNameInput = document.getElementById('shippingFirstName');
  const lastNameInput = document.getElementById('shippingLastName');
  const streetInput = document.getElementById('shippingStreet');
  const aptInput = document.getElementById('shippingApartment');
  const cityInput = document.getElementById('shippingCity');
  const postalInput = document.getElementById('shippingPostal');
  const provinceSelect = document.getElementById('shippingProvince');

  // Pre-fill if previously stored
  const saved = getShippingDetails();
  if (saved) {
    if (emailInput && saved.email) emailInput.value = saved.email;
    if (phoneInput && saved.phone) phoneInput.value = saved.phone;
    if (firstNameInput && saved.firstName) firstNameInput.value = saved.firstName;
    if (lastNameInput && saved.lastName) lastNameInput.value = saved.lastName;
    if (streetInput && saved.street) streetInput.value = saved.street;
    if (aptInput && saved.apartment) aptInput.value = saved.apartment;
    if (cityInput && saved.city) cityInput.value = saved.city;
    if (postalInput && saved.postal) postalInput.value = saved.postal;
    if (provinceSelect && saved.province) provinceSelect.value = saved.province;
  }

  // Handle Form Submission -> Save & Navigate to Payment
  shippingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const cart = getCart();
    if (cart.length === 0) {
      alert('Your shopping bag is empty. Please add items before proceeding to payment.');
      window.location.href = 'shop.html';
      return;
    }

    const details = {
      email: emailInput ? emailInput.value.trim() : 'customer@example.com',
      phone: phoneInput ? phoneInput.value.trim() : '+27 82 000 0000',
      firstName: firstNameInput ? firstNameInput.value.trim() : 'Guest',
      lastName: lastNameInput ? lastNameInput.value.trim() : 'Customer',
      fullName: `${firstNameInput ? firstNameInput.value.trim() : 'Guest'} ${lastNameInput ? lastNameInput.value.trim() : ''}`.trim(),
      street: streetInput ? streetInput.value.trim() : '14 Kloof Street',
      apartment: aptInput ? aptInput.value.trim() : '',
      city: cityInput ? cityInput.value.trim() : 'Cape Town',
      postal: postalInput ? postalInput.value.trim() : '8001',
      province: provinceSelect ? provinceSelect.value : 'Western Cape',
      deliveryMethod: 'Velora Courier Express',
      deliveryFee: getCartSubtotal() >= 800 ? 0 : 120
    };

    saveShippingDetails(details);
    window.location.href = 'payment.html';
  });
}

// --------------------------------------------------------------------------
// 2. Payment Page Logic (payment.html)
// --------------------------------------------------------------------------
export function initPaymentPage() {
  const paymentForm = document.getElementById('standalonePaymentForm');
  const mainContainer = document.getElementById('paymentPageMainContainer');
  if (!paymentForm || !mainContainer) return;

  // Check if URL specifies confirmation or if previously paid
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('confirmation') === 'true') {
    const lastOrderRaw = localStorage.getItem(LAST_ORDER_STORAGE_KEY);
    if (lastOrderRaw) {
      try {
        const order = JSON.parse(lastOrderRaw);
        renderOrderConfirmation(order);
        return;
      } catch (err) {
        console.error('Error rendering order confirmation:', err);
      }
    }
  }

  // 1. Populate Shipping Review Summary
  const shipping = getShippingDetails() || {
    email: 'elena@example.com',
    phone: '+27 82 000 0000',
    fullName: 'Elena Vance',
    street: '14 Kloof Street, Gardens',
    apartment: '',
    city: 'Cape Town',
    postal: '8001',
    province: 'Western Cape',
    deliveryMethod: 'Velora Courier Express'
  };

  const reviewContact = document.getElementById('paymentReviewContact');
  const reviewAddress = document.getElementById('paymentReviewAddress');
  const reviewMethod = document.getElementById('paymentReviewMethod');

  if (reviewContact) {
    reviewContact.textContent = `${shipping.fullName} • ${shipping.email} • ${shipping.phone}`;
  }
  if (reviewAddress) {
    const fullStreet = shipping.apartment ? `${shipping.street}, ${shipping.apartment}` : shipping.street;
    reviewAddress.textContent = `${fullStreet}, ${shipping.city}, ${shipping.postal}, ${shipping.province}`;
  }
  if (reviewMethod) {
    reviewMethod.textContent = `${shipping.deliveryMethod} (2–4 business days) • Complimentary`;
  }

  // 2. State & Calculations
  let activePaymentMethod = 'card';
  let selectedEftBank = 'Capitec';
  let promoDiscountPercent = parseInt(localStorage.getItem(PROMO_STORAGE_KEY), 10) || 0;

  const itemsList = document.getElementById('paymentPageItemsList');
  const subtotalEl = document.getElementById('paymentPageSubtotal');
  const discountRow = document.getElementById('paymentPageDiscountRow');
  const discountEl = document.getElementById('paymentPageDiscount');
  const deliveryEl = document.getElementById('paymentPageDelivery');
  const totalEl = document.getElementById('paymentPageTotal');
  const payBtnAmount = document.getElementById('payButtonAmount');

  function renderPaymentSummary() {
    let cart = getCart();
    // Auto-seed sample cart if empty so checkout/payment demo always works
    if (cart.length === 0 && !urlParams.get('confirmation')) {
      cart = [{
        id: 'prod-sneakers-cloud',
        title: 'Cloud-step sneakers',
        category: 'Footwear & Basics',
        price: 1290,
        size: 'UK 7 (EU 40)',
        quantity: 1,
        image: 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
      }];
      saveCart(cart);
    }
    const subtotal = getCartSubtotal();

    if (itemsList) {
      itemsList.innerHTML = cart
        .map((item) => {
          const unitPrice = typeof item.price === 'number' ? item.price : parseCurrency(item.price);
          const lineTotal = unitPrice * item.quantity;
          return `
            <div class="checkout-item" style="display: flex; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line);">
              <div style="width: 52px; height: 52px; border-radius: 4px; overflow: hidden; background: var(--cream); flex-shrink: 0; border: 1px solid var(--line);">
                <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
              <div style="flex: 1; min-width: 0;">
                <h4 style="margin: 0; font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
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
      deliveryEl.textContent = deliveryFee === 0 ? 'Complimentary' : formatCurrency(deliveryFee);
    }

    if (totalEl) {
      totalEl.textContent = formatCurrency(grandTotal);
    }

    if (payBtnAmount) {
      payBtnAmount.textContent = formatCurrency(grandTotal);
    }
  }

  // 3. Payment Method Switching
  const methodLabels = document.querySelectorAll('#pagePaymentMethods .payment-option');
  const cardFieldsView = document.getElementById('pageCardFieldsView');
  const eftView = document.getElementById('pageEftView');
  const snapscanView = document.getElementById('pageSnapscanView');
  const codView = document.getElementById('pageCodView');

  methodLabels.forEach((label) => {
    label.addEventListener('click', () => {
      methodLabels.forEach((l) => l.classList.remove('active'));
      label.classList.add('active');

      const radio = label.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      activePaymentMethod = label.dataset.method || 'card';

      // Switch views
      if (cardFieldsView) cardFieldsView.style.display = activePaymentMethod === 'card' ? 'block' : 'none';
      if (eftView) eftView.style.display = activePaymentMethod === 'eft' ? 'block' : 'none';
      if (snapscanView) snapscanView.style.display = activePaymentMethod === 'snapscan' ? 'block' : 'none';
      if (codView) codView.style.display = activePaymentMethod === 'cod' ? 'block' : 'none';
    });
  });

  // 4. EFT Bank Selection Chips
  const bankChips = document.querySelectorAll('#pageEftBankGrid .bank-chip');
  bankChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      bankChips.forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedEftBank = chip.dataset.bank || 'Capitec';
    });
  });

  // 5. Card Input Formatting
  const cardNumberInput = document.getElementById('pageCardNumber');
  const cardExpiryInput = document.getElementById('pageCardExpiry');
  const cardCvvInput = document.getElementById('pageCardCvv');

  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '').substring(0, 16);
      let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
      e.target.value = formatted;
    });
  }

  if (cardExpiryInput) {
    cardExpiryInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (value.length >= 3) {
        e.target.value = `${value.substring(0, 2)}/${value.substring(2)}`;
      } else {
        e.target.value = value;
      }
    });
  }

  if (cardCvvInput) {
    cardCvvInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });
  }

  // 6. Promo Code Handler on Payment Page
  const promoInput = document.getElementById('paymentPagePromoInput');
  const promoBtn = document.getElementById('paymentPagePromoBtn');
  const promoFeedback = document.getElementById('paymentPagePromoFeedback');

  if (promoBtn && promoInput && promoFeedback) {
    promoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'VELORA10') {
        promoDiscountPercent = 10;
        localStorage.setItem(PROMO_STORAGE_KEY, '10');
        promoFeedback.textContent = '10% privilege discount applied!';
        promoFeedback.style.color = 'var(--success, #55755b)';
        renderPaymentSummary();
      } else if (code === 'WELCOME15') {
        promoDiscountPercent = 15;
        localStorage.setItem(PROMO_STORAGE_KEY, '15');
        promoFeedback.textContent = '15% welcome discount applied!';
        promoFeedback.style.color = 'var(--success, #55755b)';
        renderPaymentSummary();
      } else {
        promoFeedback.textContent = 'Code invalid or expired. Try VELORA10';
        promoFeedback.style.color = 'var(--danger, #b33a3a)';
      }
    });
  }

  // 7. Payment Form Submission & Verification
  function processPaymentExecution(e) {
    if (e && e.preventDefault) e.preventDefault();

    let cart = getCart();
    if (!cart || cart.length === 0) {
      cart = [{
        id: 'prod-sneakers-cloud',
        title: 'Cloud-step sneakers',
        category: 'Footwear & Basics',
        price: 1290,
        size: 'UK 7 (EU 40)',
        quantity: 1,
        image: 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
      }];
      saveCart(cart);
    }

    const submitBtn = document.getElementById('payNowSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.75';
      submitBtn.style.cursor = 'wait';
      submitBtn.innerHTML = `
        <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 8px; vertical-align: middle;"></span>
        Verifying & Processing Payment... 🔒
      `;
    }

    // Add inline keyframe for spinner if not present
    if (!document.getElementById('velora-spinner-keyframes')) {
      const style = document.createElement('style');
      style.id = 'velora-spinner-keyframes';
      style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    // Simulate secure bank authentication response
    setTimeout(() => {
      const subtotal = getCartSubtotal();
      const discountAmount = promoDiscountPercent > 0 ? Math.round(subtotal * (promoDiscountPercent / 100)) : 0;
      const deliveryFee = subtotal >= 800 ? 0 : 120;
      const grandTotal = subtotal - discountAmount + deliveryFee;

      // Construct payment method label
      let paymentMethodName = 'Credit / Debit Card';
      if (activePaymentMethod === 'card') {
        const rawCard = cardNumberInput?.value?.replace(/\s+/g, '');
        const lastFour = rawCard && rawCard.length >= 4 ? rawCard.slice(-4) : '8921';
        paymentMethodName = `Card ending in •••• ${lastFour}`;
      } else if (activePaymentMethod === 'eft') {
        paymentMethodName = `Instant EFT (${selectedEftBank})`;
      } else if (activePaymentMethod === 'snapscan') {
        paymentMethodName = 'SnapScan / Zapper Mobile';
      } else if (activePaymentMethod === 'cod') {
        paymentMethodName = 'Cash on Delivery (Courier Terminal)';
      }

      // Generate Order Record
      const orderId = `VEL-${Math.floor(10000 + Math.random() * 90000)}`;
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const order = {
        id: orderId,
        date: formattedDate,
        estimatedDelivery: getEstimatedDeliveryRange(),
        customer: shipping,
        items: [...cart],
        subtotal,
        discount: discountAmount,
        deliveryFee,
        total: grandTotal,
        paymentMethod: paymentMethodName,
        status: 'Confirmed & Processing',
        trackingNumber: `TRK-ZA-${Math.floor(1000000 + Math.random() * 9000000)}`,
        processingPartner: 'CodeAlpha Logistics (www.codealpha.tech)'
      };

      // Record completed order
      saveCompletedOrder(order);

      // Clear the cart
      clearCart();
      updateCartBadge();
      localStorage.removeItem(PROMO_STORAGE_KEY);

      // Render Confirmation Screen
      renderOrderConfirmation(order);
    }, 1000);
  }

  paymentForm.addEventListener('submit', processPaymentExecution);
  const payBtnDirect = document.getElementById('payNowSubmitBtn');
  if (payBtnDirect) {
    payBtnDirect.addEventListener('click', (e) => {
      // If inside form, let submit handle, but if click wasn't caught by submit:
      if (paymentForm.checkValidity ? paymentForm.checkValidity() : true) {
        processPaymentExecution(e);
      }
    });
  }

  // Initial Summary Render
  renderPaymentSummary();
}

/**
 * Render the Order Confirmation View
 * Replaces the payment form and summary with a dedicated confirmation interface.
 * @param {Object} order
 */
export function renderOrderConfirmation(order) {
  const mainContainer = document.getElementById('paymentPageMainContainer');
  if (!mainContainer) return;

  // 1. Update the Header Stepper: Mark Step 1, 2, 3 as completed, Step 4 as active
  const stepper = document.querySelector('.checkout-stepper');
  if (stepper) {
    stepper.innerHTML = `
      <div class="step-item completed">
        <span class="step-num">✓</span>
        <span>Shopping Bag</span>
      </div>
      <span class="step-divider">/</span>
      <div class="step-item completed">
        <span class="step-num">✓</span>
        <span>Information & Shipping</span>
      </div>
      <span class="step-divider">/</span>
      <div class="step-item completed">
        <span class="step-num">✓</span>
        <span>Payment</span>
      </div>
      <span class="step-divider">/</span>
      <div class="step-item active" aria-current="step">
        <span class="step-num">4</span>
        <span>Confirmation</span>
      </div>
    `;
  }

  // 2. Build the Confirmation UI
  const customer = order.customer || {};
  const fullStreet = customer.apartment ? `${customer.street}, ${customer.apartment}` : (customer.street || '14 Kloof Street');
  const fullAddress = `${fullStreet}, ${customer.city || 'Cape Town'}, ${customer.postal || '8001'}, ${customer.province || 'Western Cape'}`;

  mainContainer.innerHTML = `
    <div class="order-success-view" id="orderConfirmationSuccessView" style="max-width: 820px; margin: 0 auto; text-align: left; background: var(--paper, #fff); border: 1px solid var(--line); border-radius: 4px; padding: 48px 40px;">
      
      <!-- Top banner -->
      <div style="text-align: center; margin-bottom: 36px;">
        <div class="order-success-icon" style="width: 72px; height: 72px; margin: 0 auto 20px; border-radius: 50%; background: var(--success, #55755b); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32px; box-shadow: 0 6px 20px rgba(85, 117, 91, 0.25);">
          ✓
        </div>
        <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: var(--success, #55755b); margin-bottom: 8px;">
          Payment Confirmed & Verified
        </span>
        <h1 style="font-size: clamp(28px, 4vw, 38px); font-weight: 600; margin: 0 0 10px; color: var(--ink);">
          Thank you, ${customer.firstName || 'Elena'}!
        </h1>
        <p style="color: var(--muted); font-size: 14px; max-width: 520px; margin: 0 auto; line-height: 1.6;">
          Your order <strong>${order.id}</strong> has been received and is now being handcrafted and packed at our atelier. We've emailed an official VAT invoice to <strong>${customer.email || 'customer@example.com'}</strong>.
        </p>
      </div>

      <!-- Quick Delivery Timeline Tracker -->
      <div style="background: var(--cream, #f6f5f1); border: 1px solid var(--line); border-radius: 4px; padding: 24px; margin-bottom: 36px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
          <div>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); display: block;">Estimated Delivery</span>
            <strong style="font-size: 15px; color: var(--ink);">${order.estimatedDelivery}</strong>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); display: block;">Tracking Reference</span>
            <code style="font-size: 12px; font-weight: 700; color: var(--ink); background: #fff; padding: 4px 8px; border-radius: 3px; border: 1px solid var(--line);">${order.trackingNumber}</code>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center; font-size: 11px; position: relative;">
          <div style="color: var(--success, #55755b); font-weight: 700;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: var(--success, #55755b); margin: 0 auto 6px;"></div>
            Order Placed
          </div>
          <div style="color: var(--ink); font-weight: 600;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: var(--accent-dark, #9c7951); margin: 0 auto 6px;"></div>
            In Production
          </div>
          <div style="color: var(--muted);">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #dcd8d0; margin: 0 auto 6px;"></div>
            With Courier
          </div>
          <div style="color: var(--muted);">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #dcd8d0; margin: 0 auto 6px;"></div>
            Delivered
          </div>
        </div>
      </div>

      <!-- Order Details Grid (Items & Summary) -->
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; margin-bottom: 36px;">
        
        <!-- Left: Items Ordered -->
        <div>
          <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin: 0 0 16px; border-bottom: 1px solid var(--line); padding-bottom: 10px;">
            Purchased Essentials (${order.items.length})
          </h3>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${order.items
              .map((item) => {
                const price = typeof item.price === 'number' ? item.price : parseCurrency(item.price);
                const lineTotal = price * item.quantity;
                return `
                  <div style="display: flex; gap: 14px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid rgba(27,27,26,0.08);">
                    <img src="${item.image}" alt="${item.title}" style="width: 54px; height: 54px; object-fit: cover; border-radius: 4px; border: 1px solid var(--line);">
                    <div style="flex: 1; min-width: 0;">
                      <h4 style="margin: 0; font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
                      <span style="font-size: 11px; color: var(--muted);">Size: ${item.size || 'Standard'} &times; Qty ${item.quantity}</span>
                    </div>
                    <strong style="font-size: 13px; color: var(--ink);">${formatCurrency(lineTotal)}</strong>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>

        <!-- Right: Delivery & Payment Details -->
        <div>
          <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin: 0 0 16px; border-bottom: 1px solid var(--line); padding-bottom: 10px;">
            Destination & Payment
          </h3>

          <div style="font-size: 12px; line-height: 1.7; color: var(--ink); margin-bottom: 20px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); display: block;">Shipping Address</span>
            <strong>${customer.fullName || 'Elena Vance'}</strong><br>
            ${fullAddress}<br>
            Phone: ${customer.phone || '+27 82 000 0000'}
          </div>

          <div style="font-size: 12px; line-height: 1.7; color: var(--ink); margin-bottom: 20px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); display: block;">Payment Method</span>
            <span>🔒 ${order.paymentMethod}</span><br>
            <span style="color: var(--muted); font-size: 11px;">Authorisation status: Approved</span>
          </div>

          <!-- Totals Receipt -->
          <div style="background: var(--cream, #f6f5f1); padding: 14px 18px; border-radius: 4px; border: 1px solid var(--line); font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--muted);">Subtotal</span>
              <strong>${formatCurrency(order.subtotal)}</strong>
            </div>
            ${
              order.discount > 0
                ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--success, #55755b);">
                     <span>Privilege Discount</span>
                     <strong>-${formatCurrency(order.discount)}</strong>
                   </div>`
                : ''
            }
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: var(--muted);">Delivery</span>
              <strong>${order.deliveryFee === 0 ? 'Complimentary' : formatCurrency(order.deliveryFee)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 8px; font-size: 14px; font-weight: 700; color: var(--ink);">
              <span>Total Paid</span>
              <span>${formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 28px;">
        <a href="orders.html?orderId=${order.id}" style="padding: 13px 26px; background: var(--ink, #1b1b1a); color: #fff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; border-radius: 3px; display: inline-flex; align-items: center; gap: 8px;">
          Track Parcel in CodeAlpha Logistics ↗
        </a>
        <a href="auth.html" style="padding: 13px 22px; background: #fff; border: 1px solid var(--ink); color: var(--ink); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; border-radius: 3px; display: inline-flex; align-items: center; gap: 6px;">
          View Account ↗
        </a>
        <button type="button" onclick="window.print()" style="padding: 13px 24px; background: transparent; border: 1px solid var(--line); color: var(--ink); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; border-radius: 3px; cursor: pointer;">
          Download Tax Invoice 🖨️
        </button>
        <a href="shop.html" style="padding: 13px 24px; background: transparent; border: 1px solid var(--line); color: var(--ink); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; border-radius: 3px;">
          Continue Shopping ↗
        </a>
      </div>

    </div>
  `;

  // Scroll smoothly to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --------------------------------------------------------------------------
// 3. Auto-boot on DOM ready
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initCheckoutPage();
  initPaymentPage();
});
