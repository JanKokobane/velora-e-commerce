import {
  getCart,
  saveCart,
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

/**
 * Require authentication check
 * Returns the current authenticated user object from 'velora_current_user' or null
 */
export function requireAuthentication() {
  try {
    const raw = localStorage.getItem('velora_current_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && (user.email || user.id) ? user : null;
  } catch (e) {
    return null;
  }
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
  const signInLink = document.getElementById('checkoutSignInLink');

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

  // Pre-fill from authenticated user if available
  const currentUser = requireAuthentication();
  if (currentUser) {
    if (emailInput && !emailInput.value && currentUser.email) emailInput.value = currentUser.email;
    if (phoneInput && !phoneInput.value && currentUser.phone) phoneInput.value = currentUser.phone;
    if (currentUser.fullName) {
      const parts = currentUser.fullName.split(' ');
      if (firstNameInput && !firstNameInput.value) firstNameInput.value = parts[0] || '';
      if (lastNameInput && !lastNameInput.value) lastNameInput.value = parts.slice(1).join(' ') || '';
    }
    if (streetInput && !streetInput.value && currentUser.street) streetInput.value = currentUser.street;
    if (cityInput && !cityInput.value && currentUser.city) cityInput.value = currentUser.city;
    if (provinceSelect && currentUser.province) provinceSelect.value = currentUser.province;

    if (signInLink && signInLink.parentElement) {
      signInLink.parentElement.innerHTML = `Signed in as <strong style="color: var(--ink);">${currentUser.fullName || currentUser.email}</strong>`;
    }
  } else {
    if (signInLink) {
      signInLink.href = 'auth.html?return=checkout';
    }
  }

  // Handle Continue Button / Form Submission -> requireAuthentication()
  shippingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const cart = getCart();
    if (cart.length === 0) {
      alert('Your shopping bag is empty. Please add items before proceeding to payment.');
      window.location.href = 'shop.html';
      return;
    }

    const details = {
      email: emailInput ? emailInput.value.trim() : (currentUser?.email || 'customer@example.com'),
      phone: phoneInput ? phoneInput.value.trim() : (currentUser?.phone || '+27 82 000 0000'),
      firstName: firstNameInput ? firstNameInput.value.trim() : (currentUser?.fullName?.split(' ')[0] || 'Guest'),
      lastName: lastNameInput ? lastNameInput.value.trim() : (currentUser?.fullName?.split(' ').slice(1).join(' ') || 'Customer'),
      fullName: `${firstNameInput ? firstNameInput.value.trim() : ''} ${lastNameInput ? lastNameInput.value.trim() : ''}`.trim() || currentUser?.fullName || 'Guest Customer',
      street: streetInput ? streetInput.value.trim() : (currentUser?.street || '14 Kloof Street'),
      apartment: aptInput ? aptInput.value.trim() : '',
      city: cityInput ? cityInput.value.trim() : (currentUser?.city || 'Cape Town'),
      postal: postalInput ? postalInput.value.trim() : '8001',
      province: provinceSelect ? provinceSelect.value : (currentUser?.province || 'Western Cape'),
      deliveryMethod: 'Velora Courier Express',
      deliveryFee: getCartSubtotal() >= 800 ? 0 : 120
    };

    saveShippingDetails(details);

    // Authentication Check Gate
    const authenticatedUser = requireAuthentication();
    if (authenticatedUser) {
      // SIGNED IN -> proceed to payment.html
      window.location.href = 'payment.html';
    } else {
      // NOT SIGNED IN -> render the auth page first
      window.location.href = 'auth.html?return=checkout';
    }
  });
}

// --------------------------------------------------------------------------
// 2. Payment Page Logic (payment.html)
// --------------------------------------------------------------------------
export function initPaymentPage() {
  const paymentForm = document.getElementById('standalonePaymentForm');
  const mainContainer = document.getElementById('paymentPageMainContainer');
  if (!paymentForm || !mainContainer) return;

  const urlParams = new URLSearchParams(window.location.search);

  // Require authentication on payment page as well
  const authenticatedUser = requireAuthentication();
  if (!authenticatedUser && urlParams.get('confirmation') !== 'true') {
    window.location.href = 'auth.html?return=checkout';
    return;
  }
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

    // Render items using <template id="checkoutItemRowTemplate">
    if (itemsList) {
      itemsList.replaceChildren();
      const template = document.getElementById('checkoutItemRowTemplate');

      cart.forEach((item) => {
        const unitPrice = typeof item.price === 'number' ? item.price : parseCurrency(item.price);
        const lineTotal = unitPrice * item.quantity;

        if (template) {
          const clone = template.content.cloneNode(true);
          const thumb = clone.querySelector('.checkout-item-thumb');
          const title = clone.querySelector('.checkout-item-title');
          const meta = clone.querySelector('.checkout-item-meta');
          const price = clone.querySelector('.checkout-item-price');

          if (thumb) {
            thumb.src = item.image;
            thumb.alt = item.title;
          }
          if (title) title.textContent = item.title;
          if (meta) meta.textContent = `Size: ${item.size || 'Standard'} × ${item.quantity}`;
          if (price) price.textContent = formatCurrency(lineTotal);

          itemsList.appendChild(clone);
        }
      });
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
    const spinner = document.getElementById('payBtnSpinner');
    const label = document.getElementById('payBtnLabel');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.75';
      submitBtn.style.cursor = 'wait';
      if (spinner) spinner.style.display = 'inline-block';
      if (label) label.textContent = 'Verifying & Processing Payment... 🔒';
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
        processingPartner: 'Velora Logistics (www.velora.co.za)'
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
 * Displays dedicated confirmation view without innerHTML.
 * @param {Object} order
 */
export function renderOrderConfirmation(order) {
  // 1. Update Stepper navigation using DOM properties
  const step3 = document.getElementById('stepperStep3');
  const step3Num = document.getElementById('stepperStep3Num');
  const step4 = document.getElementById('stepperStep4');

  if (step3) {
    step3.classList.remove('active');
    step3.classList.add('completed');
    step3.removeAttribute('aria-current');
  }
  if (step3Num) {
    step3Num.textContent = '✓';
  }
  if (step4) {
    step4.classList.add('active');
    step4.setAttribute('aria-current', 'step');
  }

  // 2. Hide checkout form and display confirmation view
  const checkoutGrid = document.getElementById('checkoutGridSection');
  const confirmationView = document.getElementById('orderConfirmationSuccessView');

  if (checkoutGrid) checkoutGrid.style.display = 'none';
  if (confirmationView) confirmationView.style.display = 'block';

  // 3. Populate confirmation details safely with textContent
  const customer = order.customer || {};
  const fullStreet = customer.apartment ? `${customer.street}, ${customer.apartment}` : (customer.street || '14 Kloof Street');
  const fullAddress = `${fullStreet}, ${customer.city || 'Cape Town'}, ${customer.postal || '8001'}, ${customer.province || 'Western Cape'}`;

  const greetingEl = document.getElementById('confirmCustomerGreeting');
  const orderIdEl = document.getElementById('confirmOrderId');
  const emailEl = document.getElementById('confirmCustomerEmail');
  const estDeliveryEl = document.getElementById('confirmEstimatedDelivery');
  const trackingNumberEl = document.getElementById('confirmTrackingNumber');
  const itemsHeadingEl = document.getElementById('confirmItemsHeading');

  if (greetingEl) greetingEl.textContent = `Thank you, ${customer.firstName || 'Elena'}!`;
  if (orderIdEl) orderIdEl.textContent = order.id;
  if (emailEl) emailEl.textContent = customer.email || 'customer@example.com';
  if (estDeliveryEl) estDeliveryEl.textContent = order.estimatedDelivery;
  if (trackingNumberEl) trackingNumberEl.textContent = order.trackingNumber;
  if (itemsHeadingEl) itemsHeadingEl.textContent = `Purchased Essentials (${order.items.length})`;

  // Render Purchased Items with <template id="confirmItemRowTemplate">
  const itemsContainer = document.getElementById('confirmItemsListContainer');
  const confirmTemplate = document.getElementById('confirmItemRowTemplate');

  if (itemsContainer && confirmTemplate) {
    itemsContainer.replaceChildren();

    order.items.forEach((item) => {
      const clone = confirmTemplate.content.cloneNode(true);
      const thumb = clone.querySelector('.confirm-item-thumb');
      const title = clone.querySelector('.confirm-item-title');
      const meta = clone.querySelector('.confirm-item-meta');
      const price = clone.querySelector('.confirm-item-price');

      const itemPrice = typeof item.price === 'number' ? item.price : parseCurrency(item.price);
      const lineTotal = itemPrice * item.quantity;

      if (thumb) {
        thumb.src = item.image;
        thumb.alt = item.title;
      }
      if (title) title.textContent = item.title;
      if (meta) meta.textContent = `Size: ${item.size || 'Standard'} × Qty ${item.quantity}`;
      if (price) price.textContent = formatCurrency(lineTotal);

      itemsContainer.appendChild(clone);
    });
  }

  // Address and payment method
  const addrFullNameEl = document.getElementById('confirmAddressFullName');
  const addrTextEl = document.getElementById('confirmAddressFullText');
  const addrPhoneEl = document.getElementById('confirmAddressPhone');
  const paymentMethodEl = document.getElementById('confirmPaymentMethodText');

  if (addrFullNameEl) addrFullNameEl.textContent = customer.fullName || 'Elena Vance';
  if (addrTextEl) addrTextEl.textContent = fullAddress;
  if (addrPhoneEl) addrPhoneEl.textContent = `Phone: ${customer.phone || '+27 82 000 0000'}`;
  if (paymentMethodEl) paymentMethodEl.textContent = `🔒 ${order.paymentMethod}`;

  // Totals receipt
  const subtotalEl = document.getElementById('confirmReceiptSubtotal');
  const discountRow = document.getElementById('confirmReceiptDiscountRow');
  const discountEl = document.getElementById('confirmReceiptDiscount');
  const deliveryEl = document.getElementById('confirmReceiptDelivery');
  const totalEl = document.getElementById('confirmReceiptTotal');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(order.subtotal);

  if (discountRow && discountEl) {
    if (order.discount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-${formatCurrency(order.discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (deliveryEl) {
    deliveryEl.textContent = order.deliveryFee === 0 ? 'Complimentary' : formatCurrency(order.deliveryFee);
  }

  if (totalEl) totalEl.textContent = formatCurrency(order.total);

  // Configure action buttons
  const trackLink = document.getElementById('confirmTrackParcelLink');
  if (trackLink) trackLink.href = `orders.html?orderId=${order.id}`;

  const printBtn = document.getElementById('confirmPrintInvoiceBtn');
  if (printBtn) {
    printBtn.onclick = () => window.print();
  }

  // Scroll smoothly to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --------------------------------------------------------------------------
// 3. Auto-boot on DOM ready
// --------------------------------------------------------------------------
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    initCheckoutPage();
    initPaymentPage();

    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterFeedback = document.getElementById('newsletterFeedback');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('newsletterEmail');
        if (emailInput && emailInput.value.trim()) {
          if (newsletterFeedback) {
            newsletterFeedback.textContent = 'Thank you for subscribing to Velora.';
            newsletterFeedback.style.color = 'var(--accent-light, #e5c69a)';
            setTimeout(() => {
              newsletterFeedback.textContent = '';
            }, 4000);
          }
          newsletterForm.reset();
        }
      });
    }
  });
}
