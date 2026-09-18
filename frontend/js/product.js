import { addToCart, updateCartBadge } from './cart.js';

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  // -------------------------------------------------------------
  // 1. Auto-rotating Gallery with Hover-to-Pause
  // -------------------------------------------------------------
  const mainImage = document.getElementById('mainProductImage');
  const thumbsContainer = document.getElementById('galleryThumbs');
  const thumbs = thumbsContainer ? Array.from(thumbsContainer.querySelectorAll('.thumb')) : [];
  const galleryMain = document.querySelector('.gallery-main');
  const rotateBadge = document.getElementById('rotateBadge');

  let activeIndex = 0;
  let rotateInterval = null;
  const ROTATE_INTERVAL_MS = 3500; // 3.5 seconds

  function switchImage(index, animate = true) {
    if (!thumbs.length || !mainImage) return;

    // Boundary check
    activeIndex = (index + thumbs.length) % thumbs.length;
    const targetThumb = thumbs[activeIndex];
    const newSrc = targetThumb.getAttribute('data-image');
    const thumbImg = targetThumb.querySelector('img');
    const altText = thumbImg ? thumbImg.alt : 'Product angle';

    // Update active thumb classes
    thumbs.forEach((t, i) => {
      t.classList.toggle('active', i === activeIndex);
    });

    if (animate) {
      mainImage.classList.add('fading');
      setTimeout(() => {
        mainImage.src = newSrc;
        mainImage.alt = altText;
        mainImage.classList.remove('fading');
      }, 200);
    } else {
      mainImage.src = newSrc;
      mainImage.alt = altText;
    }
  }

  function startRotation() {
    stopRotation();
    rotateInterval = setInterval(() => {
      switchImage(activeIndex + 1);
    }, ROTATE_INTERVAL_MS);
  }

  function stopRotation() {
    if (rotateInterval) {
      clearInterval(rotateInterval);
      rotateInterval = null;
    }
  }

  // Set up click handlers on thumbs
  thumbs.forEach((thumb, idx) => {
    thumb.addEventListener('click', () => {
      switchImage(idx);
      // Restart interval on manual selection
      startRotation();
    });
  });

  // Hover-to-pause events
  const hoverAreas = [galleryMain, thumbsContainer, rotateBadge].filter(Boolean);
  hoverAreas.forEach((area) => {
    area.addEventListener('mouseenter', stopRotation);
    area.addEventListener('mouseleave', startRotation);
  });

  // Start automatic rotation
  if (thumbs.length > 1) {
    startRotation();
  }

  // -------------------------------------------------------------
  // 2. Size Selection
  // -------------------------------------------------------------
  const sizeButtons = document.querySelectorAll('#productSizesContainer button');
  let selectedSize = '36'; // Default selected size

  sizeButtons.forEach((btn) => {
    if (btn.classList.contains('selected')) {
      selectedSize = btn.textContent.trim();
    }
    btn.addEventListener('click', () => {
      sizeButtons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSize = btn.textContent.trim();
    });
  });

  // -------------------------------------------------------------
  // 3. Quantity Controls
  // -------------------------------------------------------------
  const quantityEl = document.getElementById('quantity');
  const decreaseBtn = document.querySelector('[data-quantity="decrease"]');
  const increaseBtn = document.querySelector('[data-quantity="increase"]');
  let currentQty = 1;

  if (decreaseBtn && increaseBtn && quantityEl) {
    decreaseBtn.addEventListener('click', () => {
      if (currentQty > 1) {
        currentQty--;
        quantityEl.textContent = currentQty;
      }
    });

    increaseBtn.addEventListener('click', () => {
      currentQty++;
      quantityEl.textContent = currentQty;
    });
  }

  // -------------------------------------------------------------
  // 4. Add to Bag Logic
  // -------------------------------------------------------------
  const addToBagBtn = document.getElementById('addToBag');
  const buyNowBtn = document.getElementById('buyNowBtn');
  const addedFeedback = document.getElementById('addedFeedback');

  function getCurrentProductData() {
    const titleEl = document.getElementById('productTitle');
    const priceEl = document.getElementById('productPrice');
    const categoryEl = document.getElementById('breadcrumbCategory');
    const imageEl = document.getElementById('mainProductImage');

    const cleanTitle = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : 'Cloud-step sneakers';
    const cleanPrice = priceEl ? priceEl.textContent.replace(/[^0-9]/g, '') : '1150';
    const cleanCategory = categoryEl ? categoryEl.textContent.trim() : 'Footwear';
    const imageSrc = imageEl ? imageEl.src : 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

    return {
      id: 'cloud-step-sneakers',
      title: cleanTitle,
      price: parseInt(cleanPrice, 10) || 1150,
      category: cleanCategory,
      size: selectedSize,
      quantity: currentQty,
      image: imageSrc
    };
  }

  if (addToBagBtn) {
    addToBagBtn.addEventListener('click', () => {
      const product = getCurrentProductData();
      addToCart(product);

      // Visual feedback
      addToBagBtn.classList.add('added');
      if (addedFeedback) {
        addedFeedback.innerHTML = `✓ Added to your bag (Size: ${product.size}, Qty: ${product.quantity}) &middot; <a href="cart.html" style="text-decoration: underline; color: var(--ink); font-weight: 600;">View Bag ↗</a>`;
        addedFeedback.style.display = 'block';
        addedFeedback.style.color = 'var(--success, #55755b)';
      }

      setTimeout(() => {
        addToBagBtn.classList.remove('added');
      }, 1500);
    });
  }

  // -------------------------------------------------------------
  // 5. Direct Checkout Button
  // -------------------------------------------------------------
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const product = getCurrentProductData();
      addToCart(product);
      window.location.href = 'checkout.html';
    });
  }

  // -------------------------------------------------------------
  // 6. Mobile Menu Toggle
  // -------------------------------------------------------------
  const menuButton = document.querySelector('.menu-button');
  const siteHeader = document.querySelector('.site-header');

  if (menuButton && siteHeader) {
    menuButton.addEventListener('click', () => {
      const isOpen = siteHeader.classList.toggle('menu-open');
      menuButton.setAttribute('aria-expanded', isOpen);
    });
  }

  // -------------------------------------------------------------
  // 7. Newsletter Subscription Form
  // -------------------------------------------------------------
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterFeedback = document.getElementById('newsletterFeedback');

  if (newsletterForm && newsletterFeedback) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletterEmail');
      if (emailInput && emailInput.value.trim()) {
        newsletterFeedback.textContent = "Thank you for subscribing to Velora.";
        newsletterFeedback.style.color = 'var(--accent-dark, #9c7951)';
        newsletterForm.reset();
        setTimeout(() => {
          newsletterFeedback.textContent = '';
        }, 4000);
      }
    });
  }
});
