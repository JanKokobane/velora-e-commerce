/**
 * Velora Online Store - Core JavaScript
 * Pure Vanilla JavaScript: Responsive Catalog, Shopping Cart Drawer & Seamless Checkout
 */

const CART_STORAGE_KEY = 'velora_cart_items';
const LEGACY_CART_KEY = 'velora-cart-count';

// Product Catalog Data matching customer's 8 pieces
const PRODUCTS = [
  {
    id: 'everyday-leather-tote',
    title: 'Everyday leather tote',
    collection: 'Velora Essentials',
    price: 'R1 290',
    numericPrice: 1290,
    category: 'bags',
    tag: 'New in',
    image: 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/27204277/pexels-photo-27204277.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    ],
    description: 'Constructed from full-grain vegetable-tanned leather that develops an organic, rich patina with age. Features reinforced dual handles, a magnetic collar clasp, and internal drop pocket sized for 14-inch laptops.',
    sizes: ['Standard'],
    details: {
      material: '100% Full-grain vegetable tanned bovine leather, unlined raw suede interior.',
      origin: 'Handcrafted in Cape Town, South Africa.',
      care: 'Condition twice annually with natural beeswax balm. Keep away from prolonged moisture.',
      shipping: 'Complimentary standard delivery across South Africa. 2–4 business days.'
    }
  },
  {
    id: 'relaxed-linen-shirt',
    title: 'Relaxed linen shirt',
    collection: 'Studio Collection',
    price: 'R890',
    numericPrice: 890,
    category: 'apparel',
    tag: 'Best seller',
    image: 'https://images.pexels.com/photos/19915586/pexels-photo-19915586.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/19915586/pexels-photo-19915586.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/3649765/pexels-photo-3649765.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    ],
    description: 'Spun from airy French flax with a garment-washed hand feel. Cut with an easy drop-shoulder silhouette, mother-of-pearl buttons, and a curved hem designed to be worn untucked or loosely layered.',
    sizes: ['S', 'M', 'L', 'XL'],
    details: {
      material: '100% Certified European flax linen (175 GSM).',
      origin: 'Milled in Normandy, tailored in Durban.',
      care: 'Machine wash cool on gentle cycle. Line dry in shade; steam lightly if desired.',
      shipping: 'Complimentary standard delivery across South Africa. 2–4 business days.'
    }
  },
  {
    id: 'cloud-step-sneakers',
    title: 'Cloud-step sneakers',
    collection: 'Weekend Uniform',
    price: 'R1 150',
    numericPrice: 1150,
    category: 'footwear',
    tag: 'Limited',
    image: 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/27381288/pexels-photo-27381288.png?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    ],
    description: 'Understated court sneakers built on a shock-absorbing natural rubber cupsole. Engineered with an orthotic cork footbed that molds to your arch over time and organic cotton twill lining for all-day breathability.',
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
    details: {
      material: 'Chrome-free calf leather upper, vulcanized wild Amazonian rubber sole.',
      origin: 'Ethically crafted in Porto, Portugal.',
      care: 'Spot clean with damp cloth and gentle soap. Store with cedar shoe trees.',
      shipping: 'Complimentary standard delivery across South Africa. 2–4 business days.'
    }
  },
  {
    id: 'heritage-leather-watch',
    title: 'Heritage leather watch',
    collection: 'Velora Essentials',
    price: 'R1 890',
    numericPrice: 1890,
    category: 'objects',
    tag: 'New in',
    image: 'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/32677219/pexels-photo-32677219.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    ],
    description: 'An elemental timepiece featuring a surgical grade 316L stainless steel case, minimalist dial indices, Japanese Miyota quartz movement, and an interchangeable bridle leather strap with quick-release spring bars.',
    sizes: ['40mm', '42mm'],
    details: {
      material: '316L Brushed stainless steel, sapphire-coated crystal glass, English bridle leather.',
      origin: 'Movement assembled in Nagano, Japan; cased and strapped in Johannesburg.',
      care: 'Water resistant to 5 ATM (50 meters). Wipe case with microfiber cloth.',
      shipping: 'Complimentary standard delivery across South Africa. 2–4 business days.'
    }
  },
  {
    id: 'polarised-sunglasses',
    title: 'Polarised sunglasses',
    collection: 'Studio Collection',
    price: 'R690',
    numericPrice: 690,
    category: 'objects',
    tag: 'Best seller',
    image: 'https://images.pexels.com/photos/32677219/pexels-photo-32677219.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/32677219/pexels-photo-32677219.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    ],
    description: 'Hand-shaped cellulose acetate frames with five-barrel German hinges and Category 3 polarised nylon lenses. Delivers 100% UV400 defense against harsh coastal reflections while maintaining true color clarity.',
    sizes: ['One Size'],
    details: {
      material: 'Plant-based Mazzucchelli acetate, scratch-resistant polarised lenses.',
      origin: 'Designed in Cape Town, handcrafted in Cadore, Italy.',
      care: 'Rinse with lukewarm water and wipe with included microfiber pouch.',
      shipping: 'Complimentary standard delivery across South Africa. 2–4 business days.'
    }
  },
  {
    id: 'classic-denim-jacket',
    title: 'Classic denim jacket',
    collection: 'Weekend Uniform',
    price: 'R1 450',
    numericPrice: 1450,
    category: 'apparel',
    tag: 'Limited',
    image: 'https://images.pexels.com/photos/3649765/pexels-photo-3649765.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/3649765/pexels-photo-3649765.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/19915586/pexels-photo-19915586.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    ],
    description: 'Constructed from 13.5 oz ring-spun selvedge denim woven on vintage shuttle looms. Finished with custom antiqued copper shank hardware, dual chest flap pockets, and tailored welt side pockets.',
    sizes: ['S', 'M', 'L', 'XL'],
    details: {
      material: '100% Organic ring-spun cotton selvedge denim.',
      origin: 'Woven in Okayama, Japan; sewn in Port Elizabeth.',
      care: 'Wash inside out in cold water after 15–20 wears. Air dry flat.',
      shipping: 'Complimentary standard delivery across South Africa. 2–4 business days.'
    }
  },
  {
    id: 'tan-leather-boots',
    title: 'Tan leather boots',
    collection: 'Studio Collection',
    price: 'R1 690',
    numericPrice: 1690,
    category: 'footwear',
    tag: 'Best seller',
    image: 'https://images.pexels.com/photos/27381288/pexels-photo-27381288.png?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/27381288/pexels-photo-27381288.png?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    ],
    description: 'A refined Goodyear-welted Chelsea silhouette with oiled nubuck leather that repels road stains and light showers. Features elastic side gussets, woven pull loops, and a durable stacked leather heel.',
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
    details: {
      material: 'Waxed pull-up nubuck, full calfskin lining, Vibram rubber half-sole.',
      origin: 'Crafted in Northamptonshire, England.',
      care: 'Apply neutral suede/nubuck waterproofing protector prior to first use.',
      shipping: 'Complimentary standard delivery across South Africa. 2–4 business days.'
    }
  },
  {
    id: 'soft-leather-shoulder-bag',
    title: 'Soft leather shoulder bag',
    collection: 'Velora Essentials',
    price: 'R1 590',
    numericPrice: 1590,
    category: 'bags',
    tag: 'New in',
    image: 'https://images.pexels.com/photos/27204277/pexels-photo-27204277.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/27204277/pexels-photo-27204277.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    ],
    description: 'Supple slouchy shoulder bag with an adjustable strap for underarm or crossbody carry. Fitted with an interior zip pocket for valuables, solid brass hardware, and a concealed magnetic closure.',
    sizes: ['Standard'],
    details: {
      material: 'Semi-aniline pebble-grain leather, 100% unbleached organic cotton canvas lining.',
      origin: 'Handcrafted in Cape Town, South Africa.',
      care: 'Gently wipe with a soft dry cloth. Store in provided cotton dust bag.',
      shipping: 'Complimentary standard delivery across South Africa. 2–4 business days.'
    }
  }
];

// Helper: Format ZAR price (e.g. 1290 -> "R1 290")
function formatCurrency(amount) {
  return 'R' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Load cart items from localStorage
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Could not read cart from localStorage', err);
  }
  return [];
}

// Save cart items to localStorage
function saveCart(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    localStorage.setItem(LEGACY_CART_KEY, String(totalCount));
  } catch (err) {
    console.error('Could not save cart', err);
  }
}

// Store state
let cart = loadCart();
let discountRate = 0; // 0.10 for 10%
let activeCategory = 'all';
let activeSort = 'featured';
let queryText = '';

// ==========================================
// STORE INITIALIZATION
// ==========================================
function initStore() {
  injectCartDrawer();
  injectCheckoutModal();
  injectSearchOverlay();
  injectToast();

  bindHeaderControls();

  // Check if we are on the standalone product view page (product.html)
  if (document.getElementById('productInfo')) {
    initProductPage();
  }

  // Check if we are on the dedicated checkout page (checkout.html)
  if (document.getElementById('standaloneShippingForm')) {
    initCheckoutPage();
  }

  // Check if we are on the dedicated payment page (payment.html)
  if (document.getElementById('standalonePaymentForm')) {
    initPaymentPage();
  }

  // Check if we are on the catalog page (index.html or shop.html)
  if (document.getElementById('productGrid')) {
    bindCatalogControls();
    renderCatalog();
  }

  bindNewsletter();
  updateCartCounter();
}

// ==========================================
// STANDALONE PRODUCT PAGE (product.html)
// ==========================================
function initProductPage() {
  const detailSection = document.getElementById('productInfo');
  if (!detailSection) return;

  // Determine product from query param ?id=... (defaults to cloud-step-sneakers)
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id') || 'cloud-step-sneakers';
  const product = PRODUCTS.find(p => p.id === productId) || PRODUCTS[2]; // Default to sneakers

  // Update Page Title and Meta description
  document.title = `${product.title} — Velora`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', `${product.title} — Velora. Considered essentials for everyday living.`);
  }

  // Update Breadcrumbs
  const bCat = document.getElementById('breadcrumbCategory');
  const bTitle = document.getElementById('breadcrumbTitle');
  if (bCat) bCat.textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);
  if (bTitle) bTitle.textContent = product.title;

  // Update Main Image & Gallery Thumbs
  const mainImg = document.getElementById('mainProductImage');
  if (mainImg) {
    mainImg.src = product.gallery[0] || product.image;
    mainImg.alt = product.title;
  }

  const thumbsWrap = document.getElementById('galleryThumbs');
  let currentImageIdx = 0;
  let autoRotateInterval = null;
  let isHovered = false;
  const ROTATE_DELAY = 3500; // auto-rotates every 3.5 seconds

  function switchGalleryImage(index) {
    if (!product.gallery || product.gallery.length <= 1) return;
    currentImageIdx = (index + product.gallery.length) % product.gallery.length;
    const targetUrl = product.gallery[currentImageIdx];

    if (mainImg) {
      mainImg.classList.add('fading');
      setTimeout(() => {
        mainImg.src = targetUrl;
        mainImg.classList.remove('fading');
      }, 160);
    }

    if (thumbsWrap) {
      thumbsWrap.querySelectorAll('.thumb').forEach((t, i) => {
        if (i === currentImageIdx) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
    }
  }

  function startAutoRotation() {
    stopAutoRotation();
    if (!product.gallery || product.gallery.length <= 1) return;
    autoRotateInterval = setInterval(() => {
      if (!isHovered) {
        switchGalleryImage(currentImageIdx + 1);
      }
    }, ROTATE_DELAY);
  }

  function stopAutoRotation() {
    if (autoRotateInterval) {
      clearInterval(autoRotateInterval);
      autoRotateInterval = null;
    }
  }

  if (thumbsWrap && product.gallery && product.gallery.length > 0) {
    thumbsWrap.innerHTML = product.gallery.map((imgUrl, idx) => `
      <button class="thumb ${idx === 0 ? 'active' : ''}" data-image="${imgUrl}" data-index="${idx}" type="button" aria-label="View photo ${idx + 1}">
        <img src="${imgUrl}" alt="${product.title} photo ${idx + 1}">
      </button>
    `).join('');

    thumbsWrap.querySelectorAll('.thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.getAttribute('data-index') || '0', 10);
        switchGalleryImage(idx);
        startAutoRotation(); // restart cycle from clicked image
      });
    });

    // Pause on hover or touch so user can examine closely
    const galleryEl = document.querySelector('.product-gallery');
    if (galleryEl) {
      galleryEl.addEventListener('mouseenter', () => { isHovered = true; });
      galleryEl.addEventListener('mouseleave', () => { isHovered = false; });
      galleryEl.addEventListener('touchstart', () => { isHovered = true; }, { passive: true });
      galleryEl.addEventListener('touchend', () => { 
        setTimeout(() => { isHovered = false; }, 2500); 
      });
    }

    // Start auto-rotation
    startAutoRotation();
  }

  // Update Product Copy
  const eyebrowEl = document.getElementById('productEyebrow');
  const titleEl = document.getElementById('productTitle');
  const priceEl = document.getElementById('productPrice');
  const descEl = document.getElementById('productDesc');

  if (eyebrowEl) eyebrowEl.textContent = product.collection;
  if (titleEl) {
    const parts = product.title.split(' ');
    const firstWord = parts[0];
    const rest = parts.slice(1).join(' ');
    titleEl.innerHTML = `${firstWord} <em>${rest ? rest + '.' : ''}</em>`;
  }
  if (priceEl) priceEl.textContent = product.price;
  if (descEl) descEl.textContent = product.description;

  // Update Accordion details
  const detailsContent = document.getElementById('detailsContent');
  const deliveryContent = document.getElementById('deliveryContent');
  const careContent = document.getElementById('careContent');

  if (detailsContent) detailsContent.textContent = `${product.details.material} ${product.details.origin}`;
  if (deliveryContent) deliveryContent.textContent = `${product.details.shipping} Returns are accepted within 14 days of delivery in pristine original condition.`;
  if (careContent) careContent.textContent = product.details.care;

  // Update Size Options
  const sizesContainer = document.getElementById('productSizesContainer');
  let selectedSize = product.sizes[0] || 'Standard';

  if (sizesContainer && product.sizes) {
    sizesContainer.innerHTML = product.sizes.map((s, idx) => `
      <button type="button" class="${idx === 0 ? 'selected' : ''}" data-size="${s}">${s}</button>
    `).join('');

    sizesContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        sizesContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedSize = btn.getAttribute('data-size') || btn.textContent.trim();
      });
    });
  }

  // Quantity Controls
  let currentQty = 1;
  const qtySpan = document.getElementById('quantity');
  const decBtn = document.querySelector('[data-quantity="decrease"]');
  const incBtn = document.querySelector('[data-quantity="increase"]');

  if (decBtn) {
    decBtn.addEventListener('click', () => {
      currentQty = Math.max(1, currentQty - 1);
      if (qtySpan) qtySpan.textContent = String(currentQty);
    });
  }
  if (incBtn) {
    incBtn.addEventListener('click', () => {
      currentQty += 1;
      if (qtySpan) qtySpan.textContent = String(currentQty);
    });
  }

  // Add to Bag action on product page
  const addBtn = document.getElementById('addToBag');
  const feedback = document.getElementById('addedFeedback');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addItemToCart(product.id, currentQty, selectedSize);

      addBtn.classList.add('added');
      addBtn.innerHTML = 'Added to bag <span>✓</span>';

      if (feedback) {
        feedback.textContent = `✓ Added to bag: ${currentQty}x ${product.title} (${selectedSize})`;
        feedback.style.color = 'var(--success)';
        feedback.style.opacity = '1';
      }

      setTimeout(() => {
        addBtn.classList.remove('added');
        addBtn.innerHTML = 'Add to bag <span>↗</span>';
      }, 1800);
    });
  }

  // Buy Now / Direct Checkout Button on product page
  const buyNowBtn = document.getElementById('buyNowBtn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      addItemToCart(product.id, currentQty, selectedSize);
      window.location.href = 'checkout.html';
    });
  }

  // Populate "You may also like" related cards
  const relatedGrid = document.getElementById('relatedProductsGrid');
  if (relatedGrid) {
    const related = PRODUCTS.filter(p => p.id !== product.id).slice(0, 3);
    relatedGrid.innerHTML = related.map(rel => `
      <article class="product-card" data-category="${rel.category}">
        <a class="product-visual" href="product.html?id=${rel.id}">
          <img src="${rel.image}" alt="${rel.title}" loading="lazy">
          <span class="product-tag">${rel.tag}</span>
        </a>
        <div class="product-info">
          <div>
            <p>${rel.collection}</p>
            <h2>${rel.title}</h2>
          </div>
          <strong>${rel.price}</strong>
        </div>
        <button class="add-cart" type="button" aria-label="Add ${rel.title} to cart" data-product-id="${rel.id}">＋</button>
      </article>
    `).join('');

    relatedGrid.querySelectorAll('.add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pId = btn.getAttribute('data-product-id');
        if (pId) {
          addItemToCart(pId, 1);
          btn.classList.add('added');
          btn.textContent = '✓';
          setTimeout(() => {
            btn.classList.remove('added');
            btn.textContent = '＋';
          }, 1100);
        }
      });
    });
  }
}


// ==========================================
// CART DRAWER (SLIDE-OVER BAG)
// ==========================================
function injectCartDrawer() {
  if (document.getElementById('cartDrawerContainer')) return;

  const wrap = document.createElement('div');
  wrap.id = 'cartDrawerContainer';
  wrap.innerHTML = `
    <div class="cart-backdrop" id="cartBackdrop"></div>
    <aside class="cart-drawer" id="cartDrawer" aria-label="Shopping Bag">
      <div class="cart-header">
        <h2>Shopping Bag (<span id="drawerCount">0</span>)</h2>
        <button class="cart-close-btn" id="cartCloseBtn" type="button" aria-label="Close bag">✕</button>
      </div>

      <div class="cart-shipping-meter" id="cartMeter">
        <div class="meter-text">
          <span id="meterLabel">Complimentary delivery on orders over R800</span>
          <strong id="meterRemaining">R800 away</strong>
        </div>
        <div class="meter-bar">
          <div class="meter-fill" id="meterFill" style="width: 0%;"></div>
        </div>
      </div>

      <div class="cart-body" id="cartBody"></div>

      <div class="cart-footer" id="cartFooter">
        <div class="cart-summary-row">
          <span>Subtotal</span>
          <strong id="cartSubtotal">R0</strong>
        </div>
        <div class="cart-summary-row" id="cartDiscountRow" style="display: none;">
          <span>Privilege Discount (10%)</span>
          <strong id="cartDiscount" style="color: var(--success);">-R0</strong>
        </div>
        <div class="cart-summary-row">
          <span>Standard Delivery</span>
          <strong id="cartDelivery">Complimentary</strong>
        </div>
        <div class="cart-summary-row total-row">
          <span>Estimated Total</span>
          <strong id="cartTotal">R0</strong>
        </div>
        <button class="cart-checkout-btn" id="cartCheckoutBtn" type="button">
          <span>Proceed to Checkout</span>
          <span aria-hidden="true">→</span>
        </button>
        <div class="cart-perks">
          <span>✓ Secure checkout</span>
          <span>✓ 30-day returns</span>
        </div>
      </div>
    </aside>
  `;
  document.body.appendChild(wrap);

  document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
  document.getElementById('cartBackdrop').addEventListener('click', closeCart);
  document.getElementById('cartCheckoutBtn').addEventListener('click', () => {
    closeCart();
    window.location.href = 'checkout.html';
  });
}

function openCart() {
  updateCartDrawerUI();
  document.getElementById('cartBackdrop').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartBackdrop').classList.remove('open');
  document.getElementById('cartDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

function updateCartCounter() {
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('#cartCount, #drawerCount').forEach(el => {
    el.textContent = String(total);
  });
}

function bumpBag() {
  document.querySelectorAll('.bag-button').forEach(btn => {
    btn.classList.add('bump');
    setTimeout(() => btn.classList.remove('bump'), 300);
  });
}

function addItemToCart(productId, qty = 1, size = null) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const chosenSize = size || product.sizes[0] || 'Standard';
  const existing = cart.find(i => i.productId === productId && i.size === chosenSize);

  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      id: `${productId}-${chosenSize}-${Date.now()}`,
      productId: product.id,
      title: product.title,
      collection: product.collection,
      price: product.price,
      numericPrice: product.numericPrice,
      image: product.image,
      size: chosenSize,
      quantity: qty
    });
  }

  saveCart(cart);
  updateCartCounter();
  updateCartDrawerUI();
  bumpBag();
  triggerToast(`${product.title} added to bag.`);
}

function updateItemQuantity(itemId, nextQty) {
  if (nextQty <= 0) {
    removeItemFromCart(itemId);
    return;
  }
  const item = cart.find(i => i.id === itemId);
  if (item) {
    item.quantity = nextQty;
    saveCart(cart);
    updateCartCounter();
    updateCartDrawerUI();
  }
}

function removeItemFromCart(itemId) {
  cart = cart.filter(i => i.id !== itemId);
  saveCart(cart);
  updateCartCounter();
  updateCartDrawerUI();
}

function updateCartDrawerUI() {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  const fill = document.getElementById('meterFill');
  const meterLabel = document.getElementById('meterLabel');
  const meterRemaining = document.getElementById('meterRemaining');
  const subtotalEl = document.getElementById('cartSubtotal');
  const discountRow = document.getElementById('cartDiscountRow');
  const discountEl = document.getElementById('cartDiscount');
  const deliveryEl = document.getElementById('cartDelivery');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');

  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <h3>Your shopping bag is empty</h3>
        <p>Explore our curated collection of quiet everyday essentials crafted to endure.</p>
        <button class="cart-empty-btn" type="button" id="cartExploreBtn">Explore Collection</button>
      </div>
    `;
    document.getElementById('cartExploreBtn').addEventListener('click', () => {
      closeCart();
      const cat = document.getElementById('catalog');
      if (cat) cat.scrollIntoView({ behavior: 'smooth' });
    });

    if (footer) footer.style.display = 'none';
    if (fill) fill.style.width = '0%';
    if (meterLabel) meterLabel.textContent = 'Complimentary delivery on orders over R800';
    if (meterRemaining) meterRemaining.textContent = 'R800 away';
    return;
  }

  if (footer) footer.style.display = 'block';

  body.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-img">
        <img src="${item.image}" alt="${item.title}">
      </div>
      <div class="cart-item-details">
        <span class="cart-item-category">${item.collection}</span>
        <h4 class="cart-item-title">${item.title}</h4>
        <span class="cart-item-size">Size: ${item.size}</span>
        <span class="cart-item-price">${formatCurrency(item.numericPrice * item.quantity)}</span>
        <div class="cart-item-actions">
          <div class="cart-qty-ctrl">
            <button type="button" data-action="dec" data-id="${item.id}" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-action="inc" data-id="${item.id}" aria-label="Increase quantity">＋</button>
          </div>
          <button class="cart-item-remove" type="button" data-action="del" data-id="${item.id}">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  body.querySelectorAll('[data-action="dec"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const found = cart.find(i => i.id === id);
      if (found) updateItemQuantity(id, found.quantity - 1);
    });
  });

  body.querySelectorAll('[data-action="inc"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const found = cart.find(i => i.id === id);
      if (found) updateItemQuantity(id, found.quantity + 1);
    });
  });

  body.querySelectorAll('[data-action="del"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      removeItemFromCart(id);
    });
  });

  const subtotal = cart.reduce((sum, i) => sum + (i.numericPrice * i.quantity), 0);
  const discount = Math.round(subtotal * discountRate);
  const freeShip = subtotal >= 800;
  const delivery = freeShip ? 0 : 120;
  const total = Math.max(0, subtotal - discount + delivery);

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (discountRow && discountEl) {
    if (discountRate > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-${formatCurrency(discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
  if (deliveryEl) deliveryEl.textContent = freeShip ? 'Complimentary' : formatCurrency(120);
  if (totalEl) totalEl.textContent = formatCurrency(total);

  if (fill && meterLabel && meterRemaining) {
    const pct = Math.min(100, Math.round((subtotal / 800) * 100));
    fill.style.width = `${pct}%`;
    if (freeShip) {
      meterLabel.textContent = 'Unlocked: Complimentary delivery';
      meterRemaining.textContent = 'Qualified ✓';
      fill.style.background = 'var(--success)';
    } else {
      const diff = 800 - subtotal;
      meterLabel.textContent = 'Complimentary delivery on orders over R800';
      meterRemaining.textContent = `${formatCurrency(diff)} away`;
      fill.style.background = 'var(--accent)';
    }
  }

  if (checkoutBtn) {
    checkoutBtn.querySelector('span:first-child').textContent = `Proceed to Checkout • ${formatCurrency(total)}`;
  }
}

// ==========================================
// SEAMLESS CHECKOUT MODAL
// ==========================================
function injectCheckoutModal() {
  if (document.getElementById('checkoutModalContainer')) return;

  const wrap = document.createElement('div');
  wrap.id = 'checkoutModalContainer';
  wrap.innerHTML = `
    <div class="checkout-modal-backdrop" id="checkoutBackdrop">
      <div class="checkout-modal" id="checkoutModal" role="dialog" aria-modal="true">
        <div class="checkout-modal-header">
          <h2>Velora Checkout</h2>
          <button class="checkout-modal-close" id="checkoutCloseBtn" type="button" aria-label="Close checkout">✕</button>
        </div>

        <div id="checkoutModalContent">
          <div class="checkout-grid">
            <!-- Form Column -->
            <div class="checkout-form-col">
              <form id="checkoutForm">
                <h3>1. Contact & Delivery</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="coFirstName">First name</label>
                    <input type="text" id="coFirstName" required placeholder="Elena">
                  </div>
                  <div class="form-group">
                    <label for="coLastName">Last name</label>
                    <input type="text" id="coLastName" required placeholder="Vance">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="coEmail">Email address</label>
                    <input type="email" id="coEmail" required placeholder="elena@example.com">
                  </div>
                  <div class="form-group">
                    <label for="coPhone">Phone number</label>
                    <input type="tel" id="coPhone" required placeholder="+27 82 123 4567">
                  </div>
                </div>

                <div class="form-group">
                  <label for="coAddress">Street address</label>
                  <input type="text" id="coAddress" required placeholder="14 Kloof Street, Gardens">
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="coCity">City</label>
                    <input type="text" id="coCity" required placeholder="Cape Town">
                  </div>
                  <div class="form-group">
                    <label for="coPostal">Postal code</label>
                    <input type="text" id="coPostal" required placeholder="8001">
                  </div>
                </div>

                <div class="form-group">
                  <label for="coProvince">Province</label>
                  <select id="coProvince" required>
                    <option value="Western Cape">Western Cape</option>
                    <option value="Gauteng">Gauteng</option>
                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                    <option value="Eastern Cape">Eastern Cape</option>
                    <option value="Free State">Free State</option>
                    <option value="Limpopo">Limpopo</option>
                    <option value="Mpumalanga">Mpumalanga</option>
                    <option value="North West">North West</option>
                    <option value="Northern Cape">Northern Cape</option>
                  </select>
                </div>

                <h3 style="margin-top: 24px;">2. Payment Method</h3>
                <div class="payment-methods" id="paymentMethodsGroup">
                  <label class="payment-option active" data-method="card">
                    <input type="radio" name="paymentMethod" value="card" checked>
                    <span>Credit / Debit Card</span>
                  </label>
                  <label class="payment-option" data-method="eft">
                    <input type="radio" name="paymentMethod" value="eft">
                    <span>Instant EFT (Ozow)</span>
                  </label>
                  <label class="payment-option" data-method="snapscan">
                    <input type="radio" name="paymentMethod" value="snapscan">
                    <span>SnapScan / Zapper</span>
                  </label>
                  <label class="payment-option" data-method="cod">
                    <input type="radio" name="paymentMethod" value="cod">
                    <span>Cash on Delivery</span>
                  </label>
                </div>

                <div class="card-details-box" id="cardDetailsBox">
                  <div class="form-group">
                    <label for="coCardNumber">Card Number</label>
                    <input type="text" id="coCardNumber" placeholder="4532 •••• •••• 8921" maxlength="19">
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="coCardExpiry">Expiry</label>
                      <input type="text" id="coCardExpiry" placeholder="MM/YY" maxlength="5">
                    </div>
                    <div class="form-group">
                      <label for="coCardCvv">CVV</label>
                      <input type="password" id="coCardCvv" placeholder="123" maxlength="4">
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label for="coNotes">Delivery notes (optional)</label>
                  <input type="text" id="coNotes" placeholder="Leave with building concierge or reception">
                </div>

                <button type="submit" class="place-order-btn" id="placeOrderSubmitBtn">
                  Complete Order • <span id="checkoutSubmitTotal">R0</span>
                </button>
              </form>
            </div>

            <!-- Summary Column -->
            <div class="checkout-summary-col">
              <h3>Order Summary</h3>
              <div class="checkout-items-list" id="checkoutItemsList"></div>

              <div class="promo-row">
                <input type="text" id="promoInput" placeholder="Promo code (try VELORA10)">
                <button type="button" id="applyPromoBtn">Apply</button>
              </div>
              <div id="promoFeedback" style="font-size: 11px; margin-bottom: 12px; min-height: 14px;"></div>

              <div class="cart-summary-row">
                <span>Items total</span>
                <strong id="checkoutSubtotal">R0</strong>
              </div>
              <div class="cart-summary-row" id="checkoutDiscountRow" style="display: none;">
                <span>Discount (10%)</span>
                <strong id="checkoutDiscount" style="color: var(--success);">-R0</strong>
              </div>
              <div class="cart-summary-row">
                <span>Delivery</span>
                <strong id="checkoutDelivery">Complimentary</strong>
              </div>
              <div class="cart-summary-row total-row">
                <span>Total due</span>
                <strong id="checkoutFinalTotal">R0</strong>
              </div>
              <p style="font-size: 10px; color: var(--muted); margin-top: 16px; line-height: 1.5;">
                Includes 15% South African VAT. By completing this order, you agree to Velora’s terms of service and quiet 30-day exchange policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  document.getElementById('checkoutCloseBtn').addEventListener('click', closeCheckout);
  document.getElementById('checkoutBackdrop').addEventListener('click', (e) => {
    if (e.target === document.getElementById('checkoutBackdrop')) closeCheckout();
  });

  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const radio = opt.querySelector('input');
      if (radio) radio.checked = true;

      const cardBox = document.getElementById('cardDetailsBox');
      if (cardBox) {
        cardBox.style.display = opt.getAttribute('data-method') === 'card' ? 'block' : 'none';
      }
    });
  });

  document.getElementById('applyPromoBtn').addEventListener('click', handlePromo);
  document.getElementById('checkoutForm').addEventListener('submit', submitOrder);
}

function openCheckout() {
  if (cart.length === 0) {
    triggerToast('Your shopping bag is empty.');
    return;
  }
  updateCheckoutSummary();
  document.getElementById('checkoutBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('checkoutBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function updateCheckoutSummary() {
  const list = document.getElementById('checkoutItemsList');
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const discountRow = document.getElementById('checkoutDiscountRow');
  const discountEl = document.getElementById('checkoutDiscount');
  const deliveryEl = document.getElementById('checkoutDelivery');
  const totalEl = document.getElementById('checkoutFinalTotal');
  const submitTotal = document.getElementById('checkoutSubmitTotal');

  if (!list) return;

  list.innerHTML = cart.map(item => `
    <div class="checkout-item-mini">
      <span>${item.quantity}x ${item.title} (${item.size})</span>
      <span>${formatCurrency(item.numericPrice * item.quantity)}</span>
    </div>
  `).join('');

  const subtotal = cart.reduce((sum, i) => sum + (i.numericPrice * i.quantity), 0);
  const discount = Math.round(subtotal * discountRate);
  const freeShip = subtotal >= 800;
  const delivery = freeShip ? 0 : 120;
  const total = Math.max(0, subtotal - discount + delivery);

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (discountRow && discountEl) {
    if (discountRate > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-${formatCurrency(discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
  if (deliveryEl) deliveryEl.textContent = freeShip ? 'Complimentary' : formatCurrency(120);
  if (totalEl) totalEl.textContent = formatCurrency(total);
  if (submitTotal) submitTotal.textContent = formatCurrency(total);
}

function handlePromo() {
  const input = document.getElementById('promoInput');
  const feedback = document.getElementById('promoFeedback');
  if (!input || !feedback) return;

  const val = (input.value || '').trim().toUpperCase();
  if (val === 'VELORA10') {
    discountRate = 0.10;
    feedback.textContent = '✓ 10% Velora Privilege discount applied!';
    feedback.style.color = 'var(--success)';
    updateCheckoutSummary();
    updateCartDrawerUI();
  } else if (!val) {
    feedback.textContent = 'Please enter a code.';
    feedback.style.color = '#c94b4b';
  } else {
    feedback.textContent = 'Invalid promo code. Try VELORA10.';
    feedback.style.color = '#c94b4b';
  }
}

function submitOrder(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('placeOrderSubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Securing your order...';
  }

  const firstName = document.getElementById('coFirstName')?.value || 'Customer';
  const email = document.getElementById('coEmail')?.value || 'customer@example.com';
  const address = document.getElementById('coAddress')?.value || 'Kloof Street';
  const city = document.getElementById('coCity')?.value || 'Cape Town';
  const province = document.getElementById('coProvince')?.value || 'Western Cape';
  const postal = document.getElementById('coPostal')?.value || '8001';

  const orderNum = 'VEL-' + Math.floor(100000 + Math.random() * 900000);
  const orderDate = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  const subtotal = cart.reduce((sum, i) => sum + (i.numericPrice * i.quantity), 0);
  const discount = Math.round(subtotal * discountRate);
  const freeShip = subtotal >= 800;
  const delivery = freeShip ? 0 : 120;
  const total = Math.max(0, subtotal - discount + delivery);
  const purchased = [...cart];

  // Save to separate orders and tracking logic
  if (window.VeloraOrders && typeof window.VeloraOrders.createOrder === 'function') {
    window.VeloraOrders.createOrder({
      orderId: orderNum,
      customer: {
        firstName,
        lastName: '',
        email,
        phone: document.getElementById('coPhone')?.value || ''
      },
      address: `${address}, ${city}, ${province} (${postal})`,
      items: purchased,
      subtotal,
      discount,
      delivery,
      total,
      paymentMethod: 'Credit / Debit Card',
      date: orderDate
    });
  }

  setTimeout(() => {
    const content = document.getElementById('checkoutModalContent');
    if (content) {
      const isSub = window.location.pathname.includes('/components/');
      const trackUrl = isSub ? `account.html?track=${orderNum}` : `./components/account.html?track=${orderNum}`;

      content.innerHTML = `
        <div class="order-success-view">
          <div class="order-success-icon">✓</div>
          <p class="eyebrow" style="color: var(--accent-dark); margin-bottom: 8px;">Order Confirmed</p>
          <h2>Thank you, <em>${firstName}.</em></h2>
          <p>We’ve received your order and are preparing your thoughtful pieces with care. A confirmation email has been dispatched to <strong>${email}</strong>.</p>

          <div class="order-receipt">
            <div class="receipt-row">
              <span>Order Reference:</span>
              <strong>${orderNum}</strong>
            </div>
            <div class="receipt-row">
              <span>Order Date:</span>
              <strong>${orderDate}</strong>
            </div>
            <div class="receipt-row">
              <span>Delivery Address:</span>
              <strong>${address}, ${city}, ${province} (${postal})</strong>
            </div>
            <div class="receipt-row">
              <span>Courier Method:</span>
              <strong>Express Tracked Delivery (2–4 business days)</strong>
            </div>
            <div style="border-top: 1px dashed var(--line); margin: 12px 0;"></div>
            <div class="receipt-row">
              <span>Items Total:</span>
              <strong>${purchased.reduce((acc, i) => acc + i.quantity, 0)} pieces</strong>
            </div>
            ${purchased.map(i => `
              <div class="receipt-row" style="font-size: 11px; padding: 2px 0;">
                <span>• ${i.quantity}x ${i.title} (${i.size})</span>
                <span>${formatCurrency(i.numericPrice * i.quantity)}</span>
              </div>
            `).join('')}
            <div style="border-top: 1px solid var(--line); margin: 12px 0;"></div>
            <div class="receipt-row" style="font-size: 14px; font-weight: 700; color: var(--ink);">
              <span>Total Paid:</span>
              <span>${formatCurrency(total)}</span>
            </div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
            <a href="${trackUrl}" class="place-order-btn" style="display: inline-block; width: auto; padding: 14px 28px; text-decoration: none; background: var(--accent-dark); color: #fff;">
              Track Order Live ↗
            </a>
            <button class="cart-empty-btn" id="finishShoppingBtn" type="button" style="width: auto; padding: 14px 24px;">
              Continue Shopping
            </button>
          </div>
        </div>
      `;

      document.getElementById('finishShoppingBtn')?.addEventListener('click', () => {
        closeCheckout();
        cart = [];
        discountRate = 0;
        saveCart(cart);
        updateCartCounter();
        updateCartDrawerUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    cart = [];
    discountRate = 0;
    saveCart(cart);
    updateCartCounter();
    updateCartDrawerUI();
  }, 1200);
}

// ==========================================
// PRODUCT DETAIL MODAL (QUICK VIEW)
// ==========================================
function injectProductModal() {
  if (document.getElementById('productDetailModalContainer')) return;

  const wrap = document.createElement('div');
  wrap.id = 'productDetailModalContainer';
  wrap.innerHTML = `
    <div class="product-detail-modal-backdrop" id="productModalBackdrop">
      <div class="product-detail-modal" id="productModal" role="dialog" aria-modal="true">
        <button class="modal-close-icon" id="productModalCloseBtn" type="button" aria-label="Close product view">✕</button>
        <div id="productModalContent"></div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  document.getElementById('productModalCloseBtn').addEventListener('click', closeProductModal);
  document.getElementById('productModalBackdrop').addEventListener('click', (e) => {
    if (e.target === document.getElementById('productModalBackdrop')) closeProductModal();
  });
}

function openProductDetail(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const content = document.getElementById('productModalContent');
  if (!content) return;

  let selectedSize = product.sizes[0] || 'Standard';
  let qty = 1;
  const recommended = PRODUCTS.filter(p => p.id !== product.id).slice(0, 3);

  content.innerHTML = `
    <div class="breadcrumbs">
      <a href="#catalog" id="modalBreadcrumb">Shop</a>
      <span>/</span>
      <span style="text-transform: capitalize;">${product.category}</span>
      <span>/</span>
      <span>${product.title}</span>
    </div>

    <div class="product-detail">
      <div class="product-gallery">
        <div class="gallery-main">
          <img id="modalMainImage" src="${product.gallery[0] || product.image}" alt="${product.title}">
        </div>
        <div class="gallery-thumbs">
          ${product.gallery.map((img, idx) => `
            <button class="thumb ${idx === 0 ? 'active' : ''}" type="button" data-image="${img}" aria-label="View photo ${idx + 1}">
              <img src="${img}" alt="${product.title} photo ${idx + 1}">
            </button>
          `).join('')}
        </div>
      </div>

      <div class="product-copy">
        <p class="eyebrow">${product.collection}</p>
        <h1>${product.title}</h1>

        <div class="rating">
          <span>★★★★★</span>
          <p>4.9 (34 quiet reviews)</p>
        </div>

        <div class="detail-price">${product.price}</div>
        <p class="detail-description">${product.description}</p>

        <div class="detail-rule"></div>

        <div class="option-row">
          <span>Size / Variant</span>
          <span style="color: var(--muted); text-decoration: underline; font-size: 11px;">Complimentary sizing</span>
        </div>

        <div class="size-options" id="modalSizes">
          ${product.sizes.map((s, idx) => `
            <button type="button" class="${idx === 0 ? 'selected' : ''}" data-size="${s}">${s}</button>
          `).join('')}
        </div>

        <div class="purchase-row">
          <div class="quantity">
            <button type="button" id="modalQtyMinus" aria-label="Decrease quantity">−</button>
            <span id="modalQtyDisplay">${qty}</span>
            <button type="button" id="modalQtyPlus" aria-label="Increase quantity">＋</button>
          </div>

          <button class="add-to-bag" id="modalAddBtn" type="button">
            Add to bag <span>＋</span>
          </button>
        </div>

        <div class="added-feedback" id="modalFeedback"></div>

        <div class="detail-accordions">
          <details open>
            <summary>Materials & Construction <span>＋</span></summary>
            <p>${product.details.material} ${product.details.origin}</p>
          </details>
          <details>
            <summary>Care & Preservation <span>＋</span></summary>
            <p>${product.details.care}</p>
          </details>
          <details>
            <summary>Complimentary Shipping & Returns <span>＋</span></summary>
            <p>${product.details.shipping} Returns accepted within 30 days of receipt in pristine original condition.</p>
          </details>
        </div>
      </div>
    </div>

    <section class="you-may-like">
      <div class="section-heading">
        <h2>You may <em>also like.</em></h2>
        <span class="text-link" style="cursor: pointer;" id="modalExploreLink">Explore collection <span>↗</span></span>
      </div>
      <div class="product-grid">
        ${recommended.map(rec => `
          <article class="product-card" data-category="${rec.category}">
            <div class="product-visual" data-rec="${rec.id}">
              <img src="${rec.image}" alt="${rec.title}">
              <span class="product-tag">${rec.tag}</span>
            </div>
            <div class="product-info" data-rec="${rec.id}">
              <div>
                <p>${rec.collection}</p>
                <h2>${rec.title}</h2>
              </div>
              <strong>${rec.price}</strong>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;

  content.querySelectorAll('.thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const img = content.querySelector('#modalMainImage');
      const targetSrc = thumb.getAttribute('data-image');
      if (img && targetSrc) img.src = targetSrc;
      content.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  content.querySelectorAll('#modalSizes button').forEach(btn => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('#modalSizes button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSize = btn.getAttribute('data-size') || selectedSize;
    });
  });

  const qtyDisplay = content.querySelector('#modalQtyDisplay');
  content.querySelector('#modalQtyMinus').addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    if (qtyDisplay) qtyDisplay.textContent = String(qty);
  });
  content.querySelector('#modalQtyPlus').addEventListener('click', () => {
    qty += 1;
    if (qtyDisplay) qtyDisplay.textContent = String(qty);
  });

  const addBtn = content.querySelector('#modalAddBtn');
  const feedback = content.querySelector('#modalFeedback');
  addBtn.addEventListener('click', () => {
    addItemToCart(product.id, qty, selectedSize);
    addBtn.classList.add('added');
    addBtn.innerHTML = 'Added to bag <span>✓</span>';
    if (feedback) {
      feedback.textContent = `${qty} piece${qty > 1 ? 's' : ''} (${selectedSize}) placed into your shopping bag.`;
    }
    setTimeout(() => {
      addBtn.classList.remove('added');
      addBtn.innerHTML = 'Add to bag <span>＋</span>';
    }, 1800);
  });

  content.querySelectorAll('[data-rec]').forEach(el => {
    el.addEventListener('click', () => {
      const rId = el.getAttribute('data-rec');
      if (rId) openProductDetail(rId);
    });
  });

  content.querySelector('#modalBreadcrumb').addEventListener('click', (e) => {
    e.preventDefault();
    closeProductModal();
  });
  content.querySelector('#modalExploreLink').addEventListener('click', () => {
    closeProductModal();
  });

  document.getElementById('productModalBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('productModalBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

// ==========================================
// SEARCH OVERLAY & SORTING
// ==========================================
function injectSearchOverlay() {
  if (document.getElementById('searchOverlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.id = 'searchOverlay';
  overlay.innerHTML = `
    <div class="search-inner">
      <input type="text" class="search-input" id="searchInput" placeholder="Search by title, collection, or category (e.g., tote, linen, sneakers)..." aria-label="Search collection">
      <button class="search-close-btn" id="searchCloseBtn" type="button" aria-label="Close search">✕</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = document.getElementById('searchInput');
  input.addEventListener('input', () => {
    queryText = (input.value || '').trim().toLowerCase();
    renderCatalog();
  });

  document.getElementById('searchCloseBtn').addEventListener('click', () => {
    overlay.classList.remove('open');
    input.value = '';
    queryText = '';
    renderCatalog();
  });
}

function injectToast() {
  if (document.getElementById('toastNotification')) return;

  const toast = document.createElement('div');
  toast.id = 'toastNotification';
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <span id="toastMessage">Item added to your bag</span>
    <span class="toast-view-cart" id="toastViewCart">View Bag →</span>
  `;
  document.body.appendChild(toast);

  document.getElementById('toastViewCart').addEventListener('click', () => {
    document.getElementById('toastNotification').classList.remove('show');
    openCart();
  });
}

let toastTimer = null;
function triggerToast(message) {
  const toast = document.getElementById('toastNotification');
  const msgEl = document.getElementById('toastMessage');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// ==========================================
// CATALOG RENDERING & EVENTS
// ==========================================
function renderCatalog() {
  const cards = document.querySelectorAll('.shop-grid .product-card');
  let visible = 0;

  cards.forEach(card => {
    const category = card.getAttribute('data-category') || '';
    const title = card.querySelector('h2')?.textContent?.toLowerCase() || '';
    const sub = card.querySelector('.product-info p')?.textContent?.toLowerCase() || '';

    const matchCat = activeCategory === 'all' || category === activeCategory;
    const matchSearch = !queryText || title.includes(queryText) || sub.includes(queryText) || category.includes(queryText);

    if (matchCat && matchSearch) {
      card.style.display = 'flex';
      card.hidden = false;
      visible += 1;
    } else {
      card.style.display = 'none';
      card.hidden = true;
    }
  });

  const totalEl = document.getElementById('productTotal');
  if (totalEl) totalEl.textContent = String(visible).padStart(2, '0');

  const grid = document.getElementById('productGrid');
  let empty = document.getElementById('catalogEmptyNotice');

  if (visible === 0) {
    if (!empty && grid) {
      empty = document.createElement('div');
      empty.id = 'catalogEmptyNotice';
      empty.className = 'catalog-empty';
      empty.innerHTML = `
        <h3>No pieces match your search</h3>
        <p>Try searching for a different term or resetting your collection filters.</p>
        <button type="button" id="resetFilterBtn">View All Products</button>
      `;
      grid.appendChild(empty);

      document.getElementById('resetFilterBtn')?.addEventListener('click', () => {
        activeCategory = 'all';
        queryText = '';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('.filter-link').forEach(l => l.classList.remove('active'));
        document.querySelector('.filter-link[data-filter="all"]')?.classList.add('active');
        renderCatalog();
      });
    }
  } else if (empty) {
    empty.remove();
  }
}

function sortProducts(type) {
  activeSort = type;
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.product-card'));
  cards.sort((a, b) => {
    const pA = parseInt((a.querySelector('.product-info strong')?.textContent || '0').replace(/[^\d]/g, ''), 10);
    const pB = parseInt((b.querySelector('.product-info strong')?.textContent || '0').replace(/[^\d]/g, ''), 10);
    const tA = a.querySelector('h2')?.textContent || '';
    const tB = b.querySelector('h2')?.textContent || '';

    if (type === 'price-low') return pA - pB;
    if (type === 'price-high') return pB - pA;
    if (type === 'name') return tA.localeCompare(tB);
    return 0;
  });

  cards.forEach(card => grid.appendChild(card));

  const label = document.querySelector('.sort-button strong');
  if (label) {
    const titles = {
      'featured': 'Featured',
      'price-low': 'Price: Low to High',
      'price-high': 'Price: High to Low',
      'name': 'Name: A–Z'
    };
    label.textContent = titles[type] || 'Featured';
  }
}

function bindHeaderControls() {
  // Mobile menu button
  document.querySelectorAll('.menu-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const header = btn.closest('.site-header');
      if (header) {
        const isOpen = header.classList.toggle('menu-open');
        btn.setAttribute('aria-expanded', String(isOpen));
      }
    });
  });

  // Bag button click
  document.querySelectorAll('.bag-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCart();
    });
  });

  // Search button click
  document.querySelectorAll('.search-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const overlay = document.getElementById('searchOverlay');
      overlay?.classList.add('open');
      document.getElementById('searchInput')?.focus();
    });
  });
}

function bindCatalogControls() {
  // Category filter links
  document.querySelectorAll('.filter-link').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-filter') || 'all';
      document.querySelectorAll('.filter-link').forEach(l => l.classList.remove('active'));
      btn.classList.add('active');
      renderCatalog();
    });
  });

  // Sort dropdown
  const sortBtn = document.querySelector('.sort-button');
  if (sortBtn) {
    let dropdown = document.getElementById('sortDropdownMenu');
    if (!dropdown) {
      const wrapper = document.createElement('div');
      wrapper.className = 'sort-wrapper';
      sortBtn.parentNode.insertBefore(wrapper, sortBtn);
      wrapper.appendChild(sortBtn);

      dropdown = document.createElement('div');
      dropdown.id = 'sortDropdownMenu';
      dropdown.className = 'sort-dropdown';
      dropdown.innerHTML = `
        <button class="sort-option active" type="button" data-sort="featured">Featured</button>
        <button class="sort-option" type="button" data-sort="price-low">Price: Low to High</button>
        <button class="sort-option" type="button" data-sort="price-high">Price: High to Low</button>
        <button class="sort-option" type="button" data-sort="name">Name: A–Z</button>
      `;
      wrapper.appendChild(dropdown);

      sortBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
        sortBtn.setAttribute('aria-expanded', String(dropdown.classList.contains('open')));
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('open');
        sortBtn.setAttribute('aria-expanded', 'false');
      });

      dropdown.querySelectorAll('.sort-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const s = opt.getAttribute('data-sort') || 'featured';
          sortProducts(s);
          dropdown.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          dropdown.classList.remove('open');
          sortBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  // Bind product cards
  const cards = document.querySelectorAll('.shop-grid .product-card');
  cards.forEach((card, idx) => {
    const product = PRODUCTS[idx] || PRODUCTS[0];
    card.setAttribute('data-product-id', product.id);

    const visual = card.querySelector('.product-visual');
    if (visual) {
      visual.setAttribute('href', `product.html?id=${encodeURIComponent(product.id)}`);
      if (!visual.querySelector('.quick-view-badge')) {
        const badge = document.createElement('span');
        badge.className = 'quick-view-badge';
        badge.textContent = 'View Piece';
        visual.appendChild(badge);
      }
    }

    const info = card.querySelector('.product-info');
    visual?.addEventListener('click', (e) => {
      // Allow standard link navigation or navigate directly
      window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
    });
    info?.addEventListener('click', (e) => {
      window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
    });

    const addBtn = card.querySelector('.add-cart');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addItemToCart(product.id, 1);

        addBtn.classList.add('added');
        addBtn.textContent = '✓';
        setTimeout(() => {
          addBtn.classList.remove('added');
          addBtn.textContent = '＋';
        }, 1100);
      });
    }
  });
}

// ==========================================
// DEDICATED CHECKOUT PAGE (checkout.html)
// ==========================================
function initCheckoutPage() {
  const form = document.getElementById('standaloneShippingForm');
  if (!form) return;

  const grid = document.getElementById('checkoutMainGrid');
  const itemsList = document.getElementById('checkoutPageItemsList');

  // If cart is empty, show empty notice
  if (cart.length === 0) {
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 70px 20px; background: var(--paper); border: 1px solid var(--line); border-radius: 4px;">
          <h2 style="font-size: 26px; margin-bottom: 12px; font-weight: 500;">Your shopping bag is empty</h2>
          <p style="color: var(--muted); font-size: 13px; max-width: 420px; margin: 0 auto 24px;">Please select pieces from our catalog before proceeding with checkout.</p>
          <a href="shop.html#catalog" class="place-order-btn" style="display: inline-block; width: auto; padding: 14px 32px; text-decoration: none;">Explore Collection</a>
        </div>
      `;
    }
    return;
  }

  // Populate items list
  if (itemsList) {
    itemsList.innerHTML = cart.map(item => `
      <div class="checkout-item-mini" style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line);">
        <img src="${item.image}" alt="${item.title}" style="width: 46px; height: 46px; object-fit: cover; border-radius: 3px; border: 1px solid var(--line);">
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 12px; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--ink);">${item.title}</h4>
          <span style="font-size: 11px; color: var(--muted); display: block; margin-top: 2px;">${item.size ? 'Size: ' + item.size + ' • ' : ''}Qty: ${item.quantity}</span>
        </div>
        <span style="font-size: 12px; font-weight: 600; color: var(--ink);">${formatCurrency(item.numericPrice * item.quantity)}</span>
      </div>
    `).join('');
  }

  // Load saved discount rate
  const savedDiscount = localStorage.getItem('velora_discount_rate');
  if (savedDiscount) {
    discountRate = parseFloat(savedDiscount) || 0;
  }

  function updateCheckoutTotals() {
    const subtotal = cart.reduce((sum, i) => sum + (i.numericPrice * i.quantity), 0);
    const discount = Math.round(subtotal * discountRate);
    const freeShip = subtotal >= 800;
    const delivery = freeShip ? 0 : 120;
    const total = Math.max(0, subtotal - discount + delivery);

    const subEl = document.getElementById('checkoutPageSubtotal');
    const delEl = document.getElementById('checkoutPageDelivery');
    const totEl = document.getElementById('checkoutPageTotal');
    const discRow = document.getElementById('checkoutPageDiscountRow');
    const discEl = document.getElementById('checkoutPageDiscount');
    const feeEl = document.getElementById('shippingMethodFee');

    if (subEl) subEl.textContent = formatCurrency(subtotal);
    if (delEl) delEl.textContent = freeShip ? 'Complimentary' : formatCurrency(120);
    if (totEl) totEl.textContent = formatCurrency(total);
    if (feeEl) feeEl.textContent = freeShip ? 'Complimentary' : formatCurrency(120);

    if (discRow && discEl) {
      if (discountRate > 0) {
        discRow.style.display = 'flex';
        discEl.textContent = `-${formatCurrency(discount)}`;
      } else {
        discRow.style.display = 'none';
      }
    }
  }

  updateCheckoutTotals();

  // Promo code handling
  const promoBtn = document.getElementById('checkoutPagePromoBtn');
  const promoInp = document.getElementById('checkoutPagePromoInput');
  const promoFb = document.getElementById('checkoutPagePromoFeedback');

  if (promoBtn && promoInp) {
    if (discountRate > 0 && promoFb) {
      promoFb.textContent = '✓ 10% privilege discount active';
      promoFb.style.color = 'var(--success)';
    }

    promoBtn.addEventListener('click', () => {
      const code = promoInp.value.trim().toUpperCase();
      if (code === 'VELORA10') {
        discountRate = 0.10;
        localStorage.setItem('velora_discount_rate', '0.10');
        if (promoFb) {
          promoFb.textContent = '✓ 10% privilege discount applied.';
          promoFb.style.color = 'var(--success)';
        }
        updateCheckoutTotals();
      } else {
        if (promoFb) {
          promoFb.textContent = 'Invalid promo code. Try VELORA10';
          promoFb.style.color = 'var(--danger)';
        }
      }
    });
  }

  // Pre-fill previously entered shipping details if available
  const savedShippingJson = localStorage.getItem('velora_shipping_details');
  if (savedShippingJson) {
    try {
      const saved = JSON.parse(savedShippingJson);
      if (saved.email && document.getElementById('shippingEmail')) document.getElementById('shippingEmail').value = saved.email;
      if (saved.phone && document.getElementById('shippingPhone')) document.getElementById('shippingPhone').value = saved.phone;
      if (saved.firstName && document.getElementById('shippingFirstName')) document.getElementById('shippingFirstName').value = saved.firstName;
      if (saved.lastName && document.getElementById('shippingLastName')) document.getElementById('shippingLastName').value = saved.lastName;
      if (saved.street && document.getElementById('shippingStreet')) document.getElementById('shippingStreet').value = saved.street;
      if (saved.apartment && document.getElementById('shippingApartment')) document.getElementById('shippingApartment').value = saved.apartment;
      if (saved.city && document.getElementById('shippingCity')) document.getElementById('shippingCity').value = saved.city;
      if (saved.postal && document.getElementById('shippingPostal')) document.getElementById('shippingPostal').value = saved.postal;
      if (saved.province && document.getElementById('shippingProvince')) document.getElementById('shippingProvince').value = saved.province;
    } catch(e) {}
  }

  // Handle Form Submission -> Go to Payment Page
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const shippingDetails = {
      email: document.getElementById('shippingEmail')?.value.trim() || '',
      phone: document.getElementById('shippingPhone')?.value.trim() || '',
      firstName: document.getElementById('shippingFirstName')?.value.trim() || '',
      lastName: document.getElementById('shippingLastName')?.value.trim() || '',
      street: document.getElementById('shippingStreet')?.value.trim() || '',
      apartment: document.getElementById('shippingApartment')?.value.trim() || '',
      city: document.getElementById('shippingCity')?.value.trim() || '',
      postal: document.getElementById('shippingPostal')?.value.trim() || '',
      province: document.getElementById('shippingProvince')?.value || 'Western Cape',
      deliveryOption: 'express'
    };

    localStorage.setItem('velora_shipping_details', JSON.stringify(shippingDetails));
    localStorage.setItem('velora_discount_rate', String(discountRate));

    window.location.href = 'payment.html';
  });
}

// ==========================================
// DEDICATED PAYMENT PAGE (payment.html)
// ==========================================
function initPaymentPage() {
  const form = document.getElementById('standalonePaymentForm');
  if (!form) return;

  const container = document.getElementById('paymentPageMainContainer');
  const itemsList = document.getElementById('paymentPageItemsList');

  // If cart is empty, show empty notice
  if (cart.length === 0) {
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 70px 20px; background: var(--paper); border: 1px solid var(--line); border-radius: 4px;">
          <h2 style="font-size: 26px; margin-bottom: 12px; font-weight: 500;">Your shopping bag is empty</h2>
          <p style="color: var(--muted); font-size: 13px; max-width: 420px; margin: 0 auto 24px;">Please select pieces from our catalog before proceeding with payment.</p>
          <a href="shop.html#catalog" class="place-order-btn" style="display: inline-block; width: auto; padding: 14px 32px; text-decoration: none;">Explore Collection</a>
        </div>
      `;
    }
    return;
  }

  // Load saved shipping details
  let shipping = null;
  try {
    const saved = localStorage.getItem('velora_shipping_details');
    shipping = saved ? JSON.parse(saved) : null;
  } catch(e) {}

  if (!shipping || !shipping.email) {
    shipping = {
      email: 'customer@velora.co.za',
      phone: '+27 82 456 7890',
      firstName: 'Elena',
      lastName: 'Vance',
      street: '14 Kloof Street, Gardens',
      apartment: '',
      city: 'Cape Town',
      postal: '8001',
      province: 'Western Cape'
    };
  }

  // Update Review Card
  const revContact = document.getElementById('paymentReviewContact');
  const revAddress = document.getElementById('paymentReviewAddress');
  const revMethod = document.getElementById('paymentReviewMethod');

  if (revContact) revContact.textContent = `${shipping.email} • ${shipping.phone}`;
  if (revAddress) {
    const apt = shipping.apartment ? `, ${shipping.apartment}` : '';
    revAddress.textContent = `${shipping.street}${apt}, ${shipping.city}, ${shipping.province} ${shipping.postal}`;
  }

  // Populate items list
  if (itemsList) {
    itemsList.innerHTML = cart.map(item => `
      <div class="checkout-item-mini" style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line);">
        <img src="${item.image}" alt="${item.title}" style="width: 46px; height: 46px; object-fit: cover; border-radius: 3px; border: 1px solid var(--line);">
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 12px; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--ink);">${item.title}</h4>
          <span style="font-size: 11px; color: var(--muted); display: block; margin-top: 2px;">${item.size ? 'Size: ' + item.size + ' • ' : ''}Qty: ${item.quantity}</span>
        </div>
        <span style="font-size: 12px; font-weight: 600; color: var(--ink);">${formatCurrency(item.numericPrice * item.quantity)}</span>
      </div>
    `).join('');
  }

  // Load saved discount rate
  const savedDiscount = localStorage.getItem('velora_discount_rate');
  if (savedDiscount) {
    discountRate = parseFloat(savedDiscount) || 0;
  }

  let calculatedTotal = 0;

  function updatePaymentTotals() {
    const subtotal = cart.reduce((sum, i) => sum + (i.numericPrice * i.quantity), 0);
    const discount = Math.round(subtotal * discountRate);
    const freeShip = subtotal >= 800;
    const delivery = freeShip ? 0 : 120;
    calculatedTotal = Math.max(0, subtotal - discount + delivery);

    const subEl = document.getElementById('paymentPageSubtotal');
    const delEl = document.getElementById('paymentPageDelivery');
    const totEl = document.getElementById('paymentPageTotal');
    const discRow = document.getElementById('paymentPageDiscountRow');
    const discEl = document.getElementById('paymentPageDiscount');
    const payAmtSpan = document.getElementById('payButtonAmount');

    if (subEl) subEl.textContent = formatCurrency(subtotal);
    if (delEl) delEl.textContent = freeShip ? 'Complimentary' : formatCurrency(120);
    if (totEl) totEl.textContent = formatCurrency(calculatedTotal);
    if (payAmtSpan) payAmtSpan.textContent = formatCurrency(calculatedTotal);

    if (revMethod) {
      revMethod.textContent = `Velora Courier Express (2–4 business days) • ${freeShip ? 'Complimentary' : 'R120'}`;
    }

    if (discRow && discEl) {
      if (discountRate > 0) {
        discRow.style.display = 'flex';
        discEl.textContent = `-${formatCurrency(discount)}`;
      } else {
        discRow.style.display = 'none';
      }
    }
  }

  updatePaymentTotals();

  // Promo code handling on payment page
  const promoBtn = document.getElementById('paymentPagePromoBtn');
  const promoInp = document.getElementById('paymentPagePromoInput');
  const promoFb = document.getElementById('paymentPagePromoFeedback');

  if (promoBtn && promoInp) {
    if (discountRate > 0 && promoFb) {
      promoFb.textContent = '✓ 10% privilege discount active';
      promoFb.style.color = 'var(--success)';
    }

    promoBtn.addEventListener('click', () => {
      const code = promoInp.value.trim().toUpperCase();
      if (code === 'VELORA10') {
        discountRate = 0.10;
        localStorage.setItem('velora_discount_rate', '0.10');
        if (promoFb) {
          promoFb.textContent = '✓ 10% privilege discount applied.';
          promoFb.style.color = 'var(--success)';
        }
        updatePaymentTotals();
      } else {
        if (promoFb) {
          promoFb.textContent = 'Invalid promo code. Try VELORA10';
          promoFb.style.color = 'var(--danger)';
        }
      }
    });
  }

  // Payment Method switching
  const methodOptions = document.querySelectorAll('#pagePaymentMethods .payment-option');
  const cardView = document.getElementById('pageCardFieldsView');
  const eftView = document.getElementById('pageEftView');
  const snapView = document.getElementById('pageSnapscanView');
  const codView = document.getElementById('pageCodView');

  methodOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      methodOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');

      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const method = opt.getAttribute('data-method');
      if (cardView) cardView.style.display = method === 'card' ? 'block' : 'none';
      if (eftView) eftView.style.display = method === 'eft' ? 'block' : 'none';
      if (snapView) snapView.style.display = method === 'snapscan' ? 'block' : 'none';
      if (codView) codView.style.display = method === 'cod' ? 'block' : 'none';

      // Toggle required fields
      const cardInputs = cardView ? cardView.querySelectorAll('input') : [];
      cardInputs.forEach(input => {
        if (method === 'card') {
          input.setAttribute('required', 'true');
        } else {
          input.removeAttribute('required');
        }
      });
    });
  });

  // Bank Chips in EFT selection
  const bankChips = document.querySelectorAll('#pageEftBankGrid .bank-chip');
  bankChips.forEach(chip => {
    chip.addEventListener('click', () => {
      bankChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
  });

  // Card input auto-formatting
  const cardNum = document.getElementById('pageCardNumber');
  if (cardNum) {
    cardNum.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 16);
      val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = val;
    });
  }

  const cardExpiry = document.getElementById('pageCardExpiry');
  if (cardExpiry) {
    cardExpiry.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (val.length >= 2) {
        val = val.slice(0, 2) + '/' + val.slice(2);
      }
      e.target.value = val;
    });
  }

  // Handle Form Submit -> Process Payment and Show Order Receipt
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('payNowSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Verifying with bank... <span>🔒</span>';
    }

    setTimeout(() => {
      const orderRef = 'VEL-' + Math.floor(100000 + Math.random() * 900000);
      const orderDate = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
      const totalPieces = cart.reduce((sum, item) => sum + item.quantity, 0);
      const finalPaidAmount = formatCurrency(calculatedTotal);

      // Save order to separate auth & order management logic
      if (window.VeloraOrders && typeof window.VeloraOrders.createOrder === 'function') {
        const selectedRadio = document.querySelector('input[name="paymentOptionRadio"]:checked')?.value;
        const payMethod = selectedRadio === 'eft' ? 'Instant EFT (Ozow)' :
                          selectedRadio === 'snapscan' ? 'SnapScan' :
                          selectedRadio === 'cod' ? 'Cash on Delivery' : 'Credit / Debit Card';

        window.VeloraOrders.createOrder({
          orderId: orderRef,
          customer: {
            firstName: shipping.firstName || 'Client',
            lastName: shipping.lastName || '',
            email: shipping.email || 'customer@example.com',
            phone: shipping.phone || ''
          },
          address: `${shipping.street || ''}, ${shipping.city || 'Cape Town'} (${shipping.postal || '8001'})`,
          items: [...cart],
          subtotal: cart.reduce((sum, item) => sum + (item.numericPrice * item.quantity), 0),
          discount: discountAmount,
          delivery: deliveryCost,
          total: calculatedTotal,
          paymentMethod: payMethod,
          date: orderDate
        });
      }

      // Render Order Confirmation Screen
      if (container) {
        container.innerHTML = `
          <div class="order-success-view">
            <div class="order-success-icon">✓</div>
            <p class="eyebrow" style="color: var(--accent-dark); font-size: 11px; letter-spacing: .12em; text-transform: uppercase;">Payment Confirmed</p>
            <h2 style="font-size: clamp(28px, 4vw, 36px); margin: 6px 0 14px;">Order <em>Confirmed.</em></h2>
            <p style="color: var(--muted); font-size: 13px; max-width: 480px; margin: 0 auto 28px; line-height: 1.6;">
              Thank you for choosing Velora. Your payment has been secured and our studio in Cape Town is now hand-packing your goods for delivery.
            </p>

            <div class="order-receipt">
              <div class="receipt-row">
                <span>Order Reference</span>
                <strong>${orderRef}</strong>
              </div>
              <div class="receipt-row">
                <span>Date & Time</span>
                <strong>${orderDate}</strong>
              </div>
              <div class="receipt-row">
                <span>Customer</span>
                <strong>${shipping.firstName} ${shipping.lastName}</strong>
              </div>
              <div class="receipt-row">
                <span>Delivery Address</span>
                <strong>${shipping.street}, ${shipping.city}</strong>
              </div>
              <div class="receipt-row">
                <span>Tracking Notification</span>
                <strong>Dispatched to ${shipping.email}</strong>
              </div>
              <div class="receipt-row">
                <span>Courier Service</span>
                <strong>Velora Tracked Express (2–4 days)</strong>
              </div>
              <div class="receipt-row">
                <span>Items Ordered</span>
                <strong>${totalPieces} pieces</strong>
              </div>
              <div class="receipt-row" style="border-top: 1px dashed var(--line); margin-top: 10px; padding-top: 10px;">
                <span>Total Paid</span>
                <strong style="font-size: 15px; color: var(--ink);">${finalPaidAmount}</strong>
              </div>
            </div>

            <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
              <a href="account.html?track=${orderRef}" class="place-order-btn" style="display: inline-block; width: auto; padding: 16px 32px; text-decoration: none; background: var(--accent-dark); color: #fff;">
                Track Live Delivery ↗
              </a>
              <a href="shop.html#catalog" class="place-order-btn" style="display: inline-block; width: auto; padding: 16px 36px; text-decoration: none;">
                Return to Shop
              </a>
            </div>
          </div>
        `;
      }

      // Clear cart
      cart = [];
      saveCart(cart);
      updateCartCounter();
      localStorage.removeItem('velora_discount_rate');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  });
}

function bindNewsletter() {
  const form = document.querySelector('#newsletterForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fb = document.querySelector('#newsletterFeedback');
      if (fb) fb.textContent = 'You are on the list. Welcome to Velora.';
      form.reset();
    });
  }
}

// Auto-run when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStore);
} else {
  initStore();
}
