import { addToCart, updateCartBadge, getCart } from './cart.js';

const API_URL = 'https://velora-e-commerce-qby7.onrender.com';

let currentProduct = null;
let selectedSize = 'Standard';
let currentQty = 1;
let activeIndex = 0;
let rotateInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initProductPage();
  initMobileMenu();
  initNewsletter();
});

async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    console.error('Product ID is missing.');
    return;
  }

  await loadProduct(productId);
}

async function loadProduct(productId) {
  try {
    const response = await fetch(
      `${API_URL}/api/products/${encodeURIComponent(productId)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }

    const data = await response.json();
    currentProduct = data.product || data;

    if (!currentProduct) {
      throw new Error('Product not found');
    }

    renderProduct(currentProduct);
    initQuantityControls();
    initPurchaseActions();
    loadRelatedProducts(currentProduct);
  } catch (error) {
    console.error('Failed to load product:', error);
  }
}

function renderProduct(product) {
  const title = product.title || 'Velora Product';
  const category = product.category || '';
  const eyebrow = product.eyebrow || category;
  const price = Number(product.price || 0);
  const rating = Number(product.rating || 0);
  const reviews = Number(product.reviews || 0);

  const pageTitle = document.getElementById('pageTitle');
  const pageDescription = document.getElementById('pageDescription');
  const pageOgTitle = document.getElementById('pageOgTitle');
  const pageOgDescription = document.getElementById('pageOgDescription');

  if (pageTitle) {
    pageTitle.textContent = `${title} — Velora`;
  }

  if (pageDescription) {
    pageDescription.content =
      product.description || `${title} — Velora.`;
  }

  if (pageOgTitle) {
    pageOgTitle.content = `${title} — Velora`;
  }

  if (pageOgDescription) {
    pageOgDescription.content =
      product.description || `Explore ${title} from Velora.`;
  }

  const breadcrumbCategory =
    document.getElementById('breadcrumbCategory');

  const breadcrumbTitle =
    document.getElementById('breadcrumbTitle');

  const productEyebrow =
    document.getElementById('productEyebrow');

  const productTitle =
    document.getElementById('productTitle');

  const productPrice =
    document.getElementById('productPrice');

  const productDesc =
    document.getElementById('productDesc');

  const productRating =
    document.getElementById('productRating');

  const productReviewsCount =
    document.getElementById('productReviewsCount');

  if (breadcrumbCategory) {
    breadcrumbCategory.textContent = category;
  }

  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = title;
  }

  if (productEyebrow) {
    productEyebrow.textContent = eyebrow;
  }

  if (productTitle) {
    productTitle.textContent = title;
  }

  if (productPrice) {
    productPrice.textContent =
      `R${price.toLocaleString('en-ZA')}`;
  }

  if (productDesc) {
    productDesc.textContent =
      product.description || '';
  }

  if (productRating) {
    productRating.textContent =
      '★'.repeat(Math.round(rating)) +
      '☆'.repeat(5 - Math.round(rating));
  }

  if (productReviewsCount) {
    productReviewsCount.textContent =
      `${reviews} ${reviews === 1 ? 'review' : 'reviews'}`;
  }

  renderGallery(product);
  renderSizes(product);
  renderDetails(product);
}

function renderGallery(product) {
  const mainImage =
    document.getElementById('mainProductImage');

  const thumbsContainer =
    document.getElementById('galleryThumbs');

  if (!mainImage || !thumbsContainer) {
    return;
  }

  const images = [
    product.image_url,
    product.image_2_url,
    product.image_3_url
  ].filter(Boolean);

  thumbsContainer.replaceChildren();

  activeIndex = 0;

  if (!images.length) {
    mainImage.removeAttribute('src');
    mainImage.alt = product.title || 'Velora Product';
    return;
  }

  images.forEach((imageUrl, index) => {
    const thumb = document.createElement('button');

    thumb.type = 'button';
    thumb.className =
      index === 0
        ? 'thumb active'
        : 'thumb';

    thumb.dataset.image = imageUrl;

    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt =
      `${product.title || 'Product'} view ${index + 1}`;

    thumb.appendChild(image);
    thumbsContainer.appendChild(thumb);
  });

  mainImage.src = images[0];
  mainImage.alt = product.title || 'Velora Product';

  initGallery();

  const rotateBadge =
    document.getElementById('rotateBadge');

  if (rotateBadge) {
    rotateBadge.style.display =
      images.length > 1
        ? ''
        : 'none';
  }
}

function initGallery() {
  const mainImage =
    document.getElementById('mainProductImage');

  const thumbsContainer =
    document.getElementById('galleryThumbs');

  const galleryMain =
    document.querySelector('.gallery-main');

  const rotateBadge =
    document.getElementById('rotateBadge');

  const thumbs = thumbsContainer
    ? Array.from(
        thumbsContainer.querySelectorAll('.thumb')
      )
    : [];

  if (!mainImage || !thumbs.length) {
    stopRotation();
    return;
  }

  const switchImage = (index, animate = true) => {
    activeIndex =
      (index + thumbs.length) % thumbs.length;

    const targetThumb =
      thumbs[activeIndex];

    const newSrc =
      targetThumb.dataset.image;

    const thumbImage =
      targetThumb.querySelector('img');

    const altText =
      thumbImage
        ? thumbImage.alt
        : 'Product angle';

    thumbs.forEach((thumb, thumbIndex) => {
      thumb.classList.toggle(
        'active',
        thumbIndex === activeIndex
      );
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
  };

  const startRotation = () => {
    stopRotation();

    if (thumbs.length < 2) {
      return;
    }

    rotateInterval = setInterval(() => {
      switchImage(activeIndex + 1);
    }, 3500);
  };

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener('click', () => {
      switchImage(index);
      startRotation();
    });
  });

  const hoverAreas = [
    galleryMain,
    thumbsContainer,
    rotateBadge
  ].filter(Boolean);

  hoverAreas.forEach((area) => {
    area.addEventListener(
      'mouseenter',
      stopRotation
    );

    area.addEventListener(
      'mouseleave',
      startRotation
    );
  });

  startRotation();
}

function stopRotation() {
  if (rotateInterval) {
    clearInterval(rotateInterval);
    rotateInterval = null;
  }
}

function renderSizes(product) {
  const container =
    document.getElementById(
      'productSizesContainer'
    );

  if (!container) {
    return;
  }

  container.replaceChildren();

  const rawSizes =
    product.sizes
      ? String(product.sizes)
          .split(',')
          .map((size) => size.trim())
          .filter(Boolean)
      : [];

  const sizes =
    rawSizes.length
      ? rawSizes
      : ['Standard'];

  selectedSize = sizes[0];

  sizes.forEach((size, index) => {
    const button =
      document.createElement('button');

    button.type = 'button';
    button.textContent = size;

    if (index === 0) {
      button.classList.add('selected');
    }

    button.addEventListener('click', () => {
      container
        .querySelectorAll('button')
        .forEach((sizeButton) => {
          sizeButton.classList.remove(
            'selected'
          );
        });

      button.classList.add('selected');
      selectedSize = size;
    });

    container.appendChild(button);
  });
}

function renderDetails(product) {
  const detailsContent =
    document.getElementById(
      'detailsContent'
    );

  const deliveryContent =
    document.getElementById(
      'deliveryContent'
    );

  const careContent =
    document.getElementById(
      'careContent'
    );

  if (detailsContent) {
    detailsContent.textContent =
      product.details || '';
  }

  if (deliveryContent) {
    deliveryContent.textContent =
      product.delivery || '';
  }

  if (careContent) {
    careContent.textContent =
      product.care || '';
  }
}

function initQuantityControls() {
  const quantityEl =
    document.getElementById('quantity');

  const decreaseBtn =
    document.querySelector(
      '[data-quantity="decrease"]'
    );

  const increaseBtn =
    document.querySelector(
      '[data-quantity="increase"]'
    );

  currentQty = 1;

  if (!quantityEl) {
    return;
  }

  quantityEl.textContent =
    currentQty;

  if (decreaseBtn) {
    decreaseBtn.addEventListener(
      'click',
      () => {
        if (currentQty > 1) {
          currentQty--;
          quantityEl.textContent =
            currentQty;
        }
      }
    );
  }

  if (increaseBtn) {
    increaseBtn.addEventListener(
      'click',
      () => {
        currentQty++;
        quantityEl.textContent =
          currentQty;
      }
    );
  }
}

function getCurrentProductData() {
  if (!currentProduct) {
    return null;
  }

  return {
    id: currentProduct.id,
    title: currentProduct.title || 'Velora Product',
    price: Number(currentProduct.price || 0),
    category: currentProduct.category || 'Velora Goods',
    size: selectedSize,
    quantity: currentQty,
    image: currentProduct.image_url || ''
  };
}

function initPurchaseActions() {
  const addToBagBtn =
    document.getElementById('addToBag');

  const buyNowBtn =
    document.getElementById('buyNowBtn');

  const addedFeedback =
    document.getElementById(
      'addedFeedback'
    );

  if (addToBagBtn) {
    addToBagBtn.addEventListener(
      'click',
      () => {
        const product =
          getCurrentProductData();

        if (!product) {
          return;
        }

        addToCart(product);
        updateCartBadge();

        addToBagBtn.classList.add(
          'added'
        );

        if (addedFeedback) {
          addedFeedback.textContent =
            `Added to your bag (Size: ${product.size}, Qty: ${product.quantity}). View Bag ↗`;

          addedFeedback.style.display =
            'block';
        }

        setTimeout(() => {
          addToBagBtn.classList.remove(
            'added'
          );
        }, 1500);
      }
    );
  }

  if (buyNowBtn) {
    buyNowBtn.addEventListener(
      'click',
      () => {
        const product =
          getCurrentProductData();

        if (!product) {
          return;
        }

        const alreadyInCart = getCart().some(
          (entry) =>
            String(entry.id) === String(product.id) &&
            String(entry.size || 'Standard') ===
              String(product.size || 'Standard')
        );

        if (!alreadyInCart) {
          addToCart(product);
          updateCartBadge();
        }

        // Check authentication: if signed in proceed to checkout.html, else auth.html?return=checkout
        const rawUser = localStorage.getItem('velora_current_user');
        let isAuthenticated = false;
        if (rawUser) {
          try {
            const user = JSON.parse(rawUser);
            if (user && (user.email || user.id)) {
              isAuthenticated = true;
            }
          } catch (e) {
            isAuthenticated = false;
          }
        }

        if (isAuthenticated) {
          window.location.href = 'checkout.html';
        } else {
          window.location.href = 'auth.html?return=checkout';
        }
      }
    );
  }
}

async function loadRelatedProducts(product) {
  const relatedGrid =
    document.getElementById(
      'relatedProductsGrid'
    );

  if (!relatedGrid) {
    return;
  }

  try {
    const response =
      await fetch(
        `${API_URL}/api/products`
      );

    if (!response.ok) {
      throw new Error(
        'Failed to fetch related products'
      );
    }

    const data =
      await response.json();

    const products =
      data.products || data;

    const relatedProducts =
      products
        .filter(
          (item) =>
            String(item.id) !==
              String(product.id) &&
            String(item.category || '')
              .trim()
              .toLowerCase() ===
              String(product.category || '')
                .trim()
                .toLowerCase()
        )
        .slice(0, 3);

    relatedGrid.replaceChildren();

    relatedProducts.forEach(
      (relatedProduct) => {
        const article =
          document.createElement(
            'article'
          );

        article.className =
          'product-card';

        article.dataset.category =
          relatedProduct.category || '';

        const visual =
          document.createElement('a');

        visual.className =
          'product-visual';

        visual.href =
          `product.html?id=${encodeURIComponent(
            relatedProduct.id
          )}`;

        const image =
          document.createElement('img');

        image.src =
          relatedProduct.image_url || '';

        image.alt =
          relatedProduct.title ||
          'Velora Product';

        visual.appendChild(image);

        const info =
          document.createElement('div');

        info.className =
          'product-info';

        const infoText =
          document.createElement('div');

        const category =
          document.createElement('p');

        category.textContent =
          relatedProduct.eyebrow ||
          relatedProduct.category ||
          '';

        const title =
          document.createElement('h2');

        title.textContent =
          relatedProduct.title || '';

        const price =
          document.createElement('strong');

        price.textContent =
          `R${Number(
            relatedProduct.price || 0
          ).toLocaleString('en-ZA')}`;

        infoText.appendChild(
          category
        );

        infoText.appendChild(
          title
        );

        info.appendChild(
          infoText
        );

        info.appendChild(
          price
        );

        article.appendChild(
          visual
        );

        article.appendChild(
          info
        );

        relatedGrid.appendChild(
          article
        );
      }
    );
  } catch (error) {
    console.error(
      'Failed to fetch related products:',
      error
    );
  }
}

function initMobileMenu() {
  const menuButton =
    document.querySelector(
      '.menu-button'
    );

  const siteHeader =
    document.querySelector(
      '.site-header'
    );

  if (!menuButton || !siteHeader) {
    return;
  }

  menuButton.addEventListener(
    'click',
    () => {
      const isOpen =
        siteHeader.classList.toggle(
          'menu-open'
        );

      menuButton.setAttribute(
        'aria-expanded',
        String(isOpen)
      );
    }
  );
}

function initNewsletter() {
  const newsletterForm =
    document.getElementById(
      'newsletterForm'
    );

  const newsletterFeedback =
    document.getElementById(
      'newsletterFeedback'
    );

  if (
    !newsletterForm ||
    !newsletterFeedback
  ) {
    return;
  }

  newsletterForm.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();

      const emailInput =
        document.getElementById(
          'newsletterEmail'
        );

      if (
        emailInput &&
        emailInput.value.trim()
      ) {
        newsletterFeedback.textContent =
          'Thank you for subscribing to Velora.';

        newsletterFeedback.style.color =
          'var(--accent-dark, #9c7951)';

        newsletterForm.reset();

        setTimeout(() => {
          newsletterFeedback.textContent =
            '';
        }, 4000);
      }
    }
  );
}
