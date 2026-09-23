window.currentInventoryViewMode = localStorage.getItem('velora_product_view_mode') || 'cards';

window._pvRotateInterval = null;

window.setInventoryViewMode = function(mode) {
  if (!['cards', 'list', 'details'].includes(mode)) mode = 'cards';
  window.currentInventoryViewMode = mode;
  try {
    localStorage.setItem('velora_product_view_mode', mode);
  } catch (_) {}

  // Update switcher buttons in the header
  const toggleContainer = document.getElementById('invViewToggle');
  if (toggleContainer) {
    toggleContainer.querySelectorAll('.inv-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === mode);
    });
  }

  window.renderInventoryView();
};

window.renderInventoryView = function() {
  const container = document.getElementById('productInventoryContainer') || document.getElementById('productInventoryGrid');
  if (!container) return;

  const currentMode = window.currentInventoryViewMode || 'cards';
  const toggleContainer = document.getElementById('invViewToggle');
  if (toggleContainer) {
    toggleContainer.querySelectorAll('.inv-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === currentMode);
    });
  }

  if (!window.inventoryData || window.inventoryData.length === 0) {
    container.className = 'product-inventory-grid';
    const emptyNotice = document.createElement('div');
    emptyNotice.style.gridColumn = '1 / -1';
    emptyNotice.style.textAlign = 'center';
    emptyNotice.style.padding = '60px 20px';
    emptyNotice.style.color = 'var(--muted)';
    emptyNotice.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.6;">📦</div>
      <h3 style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 6px;">No products in catalog yet</h3>
      <p style="font-size: 13px; color: #64748b; margin-bottom: 18px;">Your product catalog is clean. Publish your first piece to your online storefront.</p>
      <button type="button" class="studio-btn-publish" style="margin: 0 auto; display: inline-flex;" onclick="window.openNewProductModal()">
        <span>+ Add First Product</span>
      </button>
    `;
    container.replaceChildren(emptyNotice);
    return;
  }

  // Render appropriate view mode
  if (currentMode === 'list') {
    renderListView(container, window.inventoryData);
  } else if (currentMode === 'details') {
    renderDetailsView(container, window.inventoryData);
  } else {
    renderCardsView(container, window.inventoryData);
  }
};

function renderCardsView(container, products) {
  container.className = 'product-inventory-grid';

  const productCards = products.map(prod => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.title = `Click to view presentation for ${prod.title}`;

    // Click card to open full presentation
    card.addEventListener('click', (e) => {
      // Don't trigger if clicked on an action button
      if (e.target.closest('.prod-action-btn')) return;
      window.openProductDetailModal(prod);
    });

    // 1. Thumbnail
    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'product-thumb-container';

    const img = document.createElement('img');
    img.className = 'product-thumb-img';
    img.src = prod.img || prod.image_url || '';
    img.alt = prod.title;
    img.loading = 'lazy';
    img.onerror = function() {
      this.onerror = null;
      this.src = (typeof window.createProductFallbackSvg === 'function')
        ? window.createProductFallbackSvg(prod.title)
        : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Crect width=\'80\' height=\'80\' fill=\'%23232030\' rx=\'8\'/%3E%3Ctext x=\'40\' y=\'46\' fill=\'%23c9a57a\' font-size=\'20\' text-anchor=\'middle\' font-family=\'sans-serif\'%3EV%3C/text%3E%3C/svg%3E';
    };
    thumbContainer.appendChild(img);

    // 2. Body
    const body = document.createElement('div');
    body.className = 'product-card-body';

    const catTag = document.createElement('span');
    catTag.className = 'product-category-tag';
    catTag.textContent = prod.category;

    const title = document.createElement('h4');
    title.className = 'product-card-title';
    title.textContent = prod.title;

    const priceRow = document.createElement('div');
    priceRow.className = 'product-card-price';
    priceRow.textContent = window.fmtPrice ? window.fmtPrice(prod.price) : `R${prod.price}`;

    if (prod.compareAtPrice && prod.compareAtPrice > prod.price) {
      const strike = document.createElement('span');
      strike.style.cssText = 'font-size: 12px; color: #94a3b8; text-decoration: line-through; margin-left: 8px; font-weight: normal;';
      strike.textContent = window.fmtPrice ? window.fmtPrice(prod.compareAtPrice) : `R${prod.compareAtPrice}`;
      priceRow.appendChild(strike);
    }

    // 3. Stock row
    const stockRow = document.createElement('div');
    stockRow.className = 'product-stock-row';

    const badge = document.createElement('span');
    let badgeClass = 'stock-in';
    let badgeText = `${prod.stock} in stock`;

    if (prod.stock === 0) {
      badgeClass = 'stock-out';
      badgeText = 'Sold Out';
    } else if (prod.stock <= 5) {
      badgeClass = 'stock-low';
      badgeText = `${prod.stock} low stock`;
    }

    badge.className = `product-stock-badge ${badgeClass}`;
    badge.textContent = badgeText;

    const actions = document.createElement('div');
    actions.className = 'product-stock-actions';

    // View button
    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.className = 'prod-action-btn prod-view-btn';
    viewBtn.title = 'View product showcase';
    viewBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <span>View</span>
    `;
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.openProductDetailModal(prod);
    });

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'prod-action-btn prod-edit-btn';
    editBtn.title = 'Edit product specifications';
    editBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      <span>Edit</span>
    `;
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.openEditProductModal === 'function') {
        window.openEditProductModal(prod);
      }
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'prod-action-btn prod-delete-btn';
    deleteBtn.title = 'Delete product from store';
    deleteBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      <span>Delete</span>
    `;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.deleteProductHandler === 'function') {
        window.deleteProductHandler(prod);
      }
    });

    actions.append(viewBtn, editBtn, deleteBtn);
    stockRow.append(badge, actions);

    body.append(catTag, title, priceRow, stockRow);
    card.append(thumbContainer, body);
    return card;
  });

  container.replaceChildren(...productCards);
}

/**
 * 2. List View Mode
 */
function renderListView(container, products) {
  container.className = 'product-inventory-list-wrap';

  const table = document.createElement('table');
  table.className = 'inv-list-table';

  // Table header
  table.innerHTML = `
    <thead>
      <tr>
        <th style="min-width: 240px;">Product Piece</th>
        <th>Category</th>
        <th>Retail Price</th>
        <th>Stock Threshold</th>
        <th>Specifications</th>
        <th style="text-align: right; min-width: 170px;">Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  products.forEach(prod => {
    const row = document.createElement('tr');
    row.className = 'inv-list-row';
    row.title = `Click to view presentation for ${prod.title}`;

    // Click row to view
    row.addEventListener('click', (e) => {
      if (e.target.closest('.prod-action-btn')) return;
      window.openProductDetailModal(prod);
    });

    // 1. Product cell (Image + Title + Eyebrow)
    const productCell = document.createElement('td');
    const productWrap = document.createElement('div');
    productWrap.className = 'inv-cell-product';

    const img = document.createElement('img');
    img.className = 'inv-list-thumb';
    img.src = prod.img || prod.image_url || '';
    img.alt = prod.title;
    img.loading = 'lazy';
    img.onerror = function() {
      this.onerror = null;
      this.src = (typeof window.createProductFallbackSvg === 'function')
        ? window.createProductFallbackSvg(prod.title)
        : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Crect width=\'80\' height=\'80\' fill=\'%23232030\' rx=\'8\'/%3E%3Ctext x=\'40\' y=\'46\' fill=\'%23c9a57a\' font-size=\'20\' text-anchor=\'middle\' font-family=\'sans-serif\'%3EV%3C/text%3E%3C/svg%3E';
    };

    const titleWrap = document.createElement('div');
    titleWrap.className = 'inv-list-title-wrap';

    const eyebrow = document.createElement('span');
    eyebrow.className = 'inv-list-eyebrow';
    eyebrow.textContent = prod.eyebrow || 'Velora Atelier';

    const title = document.createElement('span');
    title.className = 'inv-list-title';
    title.textContent = prod.title;

    titleWrap.append(eyebrow, title);
    productWrap.append(img, titleWrap);
    productCell.appendChild(productWrap);

    // 2. Category cell
    const catCell = document.createElement('td');
    const catTag = document.createElement('span');
    catTag.className = 'product-category-tag';
    catTag.style.margin = '0';
    catTag.textContent = prod.category;
    catCell.appendChild(catTag);

    // 3. Price cell
    const priceCell = document.createElement('td');
    const priceSpan = document.createElement('span');
    priceSpan.style.fontWeight = '700';
    priceSpan.style.color = '#0f172a';
    priceSpan.textContent = window.fmtPrice ? window.fmtPrice(prod.price) : `R${prod.price}`;
    priceCell.appendChild(priceSpan);

    if (prod.compareAtPrice && prod.compareAtPrice > prod.price) {
      const strike = document.createElement('span');
      strike.style.cssText = 'font-size: 11.5px; color: #94a3b8; text-decoration: line-through; margin-left: 6px;';
      strike.textContent = window.fmtPrice ? window.fmtPrice(prod.compareAtPrice) : `R${prod.compareAtPrice}`;
      priceCell.appendChild(strike);
    }

    // 4. Stock cell
    const stockCell = document.createElement('td');
    const badge = document.createElement('span');
    let badgeClass = 'stock-in';
    let badgeText = `${prod.stock} in stock`;

    if (prod.stock === 0) {
      badgeClass = 'stock-out';
      badgeText = 'Sold Out';
    } else if (prod.stock <= 5) {
      badgeClass = 'stock-low';
      badgeText = `${prod.stock} low stock`;
    }

    badge.className = `product-stock-badge ${badgeClass}`;
    badge.textContent = badgeText;
    stockCell.appendChild(badge);

    // 5. Specs / variants cell
    const specsCell = document.createElement('td');
    let specsText = '';
    if (prod.sizes) {
      const count = prod.sizes.split(',').filter(Boolean).length;
      specsText = `${count} size${count === 1 ? '' : 's'}`;
    }
    if (prod.colors) {
      specsText += specsText ? ` • ${prod.colors}` : prod.colors;
    }
    if (!specsText) specsText = 'Standard fit';
    specsCell.style.color = '#64748b';
    specsCell.style.fontSize = '12px';
    specsCell.textContent = specsText;

    // 6. Actions cell
    const actionsCell = document.createElement('td');
    actionsCell.style.textAlign = 'right';

    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'inv-list-actions';
    actionsWrap.style.justifyContent = 'flex-end';

    // View button
    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.className = 'prod-action-btn prod-view-btn';
    viewBtn.title = 'View product presentation';
    viewBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <span>View</span>
    `;
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.openProductDetailModal(prod);
    });

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'prod-action-btn prod-edit-btn';
    editBtn.title = 'Edit specifications';
    editBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      <span>Edit</span>
    `;
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.openEditProductModal === 'function') {
        window.openEditProductModal(prod);
      }
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'prod-action-btn prod-delete-btn';
    deleteBtn.title = 'Delete product';
    deleteBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      <span>Delete</span>
    `;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.deleteProductHandler === 'function') {
        window.deleteProductHandler(prod);
      }
    });

    actionsWrap.append(viewBtn, editBtn, deleteBtn);
    actionsCell.appendChild(actionsWrap);

    row.append(productCell, catCell, priceCell, stockCell, specsCell, actionsCell);
    tbody.appendChild(row);
  });

  container.replaceChildren(table);
}

/**
 * 3. Details View Mode
 */
function renderDetailsView(container, products) {
  container.className = 'product-inventory-details-grid';

  const detailCards = products.map(prod => {
    const card = document.createElement('div');
    card.className = 'inv-detail-card';
    card.title = `Click to view presentation for ${prod.title}`;

    // Click card to open full presentation
    card.addEventListener('click', (e) => {
      if (e.target.closest('.prod-action-btn')) return;
      window.openProductDetailModal(prod);
    });

    // Left: Visual
    const visual = document.createElement('div');
    visual.className = 'inv-detail-visual';

    const img = document.createElement('img');
    img.className = 'inv-detail-img';
    img.src = prod.img || prod.image_url || '';
    img.alt = prod.title;
    img.loading = 'lazy';
    img.onerror = function() {
      this.onerror = null;
      this.src = (typeof window.createProductFallbackSvg === 'function')
        ? window.createProductFallbackSvg(prod.title)
        : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Crect width=\'80\' height=\'80\' fill=\'%23232030\' rx=\'8\'/%3E%3Ctext x=\'40\' y=\'46\' fill=\'%23c9a57a\' font-size=\'20\' text-anchor=\'middle\' font-family=\'sans-serif\'%3EV%3C/text%3E%3C/svg%3E';
    };
    visual.appendChild(img);

    // Multi-angle badge
    const imagesCount = [prod.img || prod.image_url, prod.image_2_url, prod.image_3_url].filter(Boolean).length;
    if (imagesCount > 1) {
      const angleBadge = document.createElement('span');
      angleBadge.className = 'inv-detail-angle-badge';
      angleBadge.textContent = `📷 ${imagesCount} views`;
      visual.appendChild(angleBadge);
    }

    // Right: Content
    const content = document.createElement('div');
    content.className = 'inv-detail-content';

    // Top Row: Category + Eyebrow + Stock Badge
    const topRow = document.createElement('div');
    topRow.className = 'inv-detail-top';

    const topMeta = document.createElement('div');
    const catTag = document.createElement('span');
    catTag.className = 'product-category-tag';
    catTag.textContent = `${prod.category} • ${prod.eyebrow || 'Velora Atelier'}`;
    topMeta.appendChild(catTag);

    const title = document.createElement('h3');
    title.className = 'inv-detail-title';
    title.textContent = prod.title;
    topMeta.appendChild(title);

    let badgeClass = 'stock-in';
    let badgeText = `${prod.stock} in stock`;
    if (prod.stock === 0) {
      badgeClass = 'stock-out';
      badgeText = 'Sold Out';
    } else if (prod.stock <= 5) {
      badgeClass = 'stock-low';
      badgeText = `${prod.stock} low stock`;
    }

    const badge = document.createElement('span');
    badge.className = `product-stock-badge ${badgeClass}`;
    badge.textContent = badgeText;

    topRow.append(topMeta, badge);

    // Financials Row
    const financialsRow = document.createElement('div');
    financialsRow.className = 'inv-detail-financials';

    const price = document.createElement('span');
    price.className = 'inv-detail-price';
    price.textContent = window.fmtPrice ? window.fmtPrice(prod.price) : `R${prod.price}`;
    financialsRow.appendChild(price);

    if (prod.compareAtPrice && prod.compareAtPrice > prod.price) {
      const compare = document.createElement('span');
      compare.style.cssText = 'font-size: 13px; color: #94a3b8; text-decoration: line-through;';
      compare.textContent = window.fmtPrice ? window.fmtPrice(prod.compareAtPrice) : `R${prod.compareAtPrice}`;
      financialsRow.appendChild(compare);
    }

    if (prod.costPrice) {
      const cost = document.createElement('span');
      cost.className = 'inv-detail-cost';
      cost.textContent = `Cost: ${window.fmtPrice ? window.fmtPrice(prod.costPrice) : 'R' + prod.costPrice}`;
      financialsRow.appendChild(cost);

      if (prod.price > prod.costPrice) {
        const margin = Math.round(((prod.price - prod.costPrice) / prod.price) * 100);
        const marginSpan = document.createElement('span');
        marginSpan.style.cssText = 'font-size: 11.5px; color: #15803d; font-weight: 600; background: #dcfce7; padding: 2px 7px; border-radius: 4px;';
        marginSpan.textContent = `${margin}% margin`;
        financialsRow.appendChild(marginSpan);
      }
    }

    // Specifications Grid
    const specsGrid = document.createElement('div');
    specsGrid.className = 'inv-detail-specs-grid';

    specsGrid.innerHTML = `
      <div class="inv-spec-item">
        <strong>Sizes</strong>
        <span>${prod.sizes || 'One size / Standard'}</span>
      </div>
      <div class="inv-spec-item">
        <strong>Colors</strong>
        <span>${prod.colors || 'Natural / Studio edit'}</span>
      </div>
      <div class="inv-spec-item">
        <strong>Silhouette</strong>
        <span>${prod.fit || 'Regular Atelier Fit'}</span>
      </div>
      <div class="inv-spec-item">
        <strong>Fabric & Detail</strong>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;">${prod.details || prod.description || 'Premium material craft'}</span>
      </div>
    `;

    // Actions Footer
    const actionsRow = document.createElement('div');
    actionsRow.className = 'inv-detail-actions';

    const leftMeta = document.createElement('div');
    leftMeta.style.fontSize = '12px';
    leftMeta.style.color = '#64748b';
    leftMeta.textContent = `Rating: ★ 5.0 (${prod.reviews || 12} reviews)`;

    const btnsGroup = document.createElement('div');
    btnsGroup.style.display = 'flex';
    btnsGroup.style.gap = '8px';

    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.className = 'prod-action-btn prod-view-btn';
    viewBtn.style.padding = '0 12px';
    viewBtn.style.height = '28px';
    viewBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <span>View Product Showcase</span>
    `;
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.openProductDetailModal(prod);
    });

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'prod-action-btn prod-edit-btn';
    editBtn.style.padding = '0 10px';
    editBtn.style.height = '28px';
    editBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      <span>Edit</span>
    `;
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.openEditProductModal === 'function') {
        window.openEditProductModal(prod);
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'prod-action-btn prod-delete-btn';
    deleteBtn.style.padding = '0 10px';
    deleteBtn.style.height = '28px';
    deleteBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      <span>Delete</span>
    `;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.deleteProductHandler === 'function') {
        window.deleteProductHandler(prod);
      }
    });

    btnsGroup.append(viewBtn, editBtn, deleteBtn);
    actionsRow.append(leftMeta, btnsGroup);

    content.append(topRow, financialsRow, specsGrid, actionsRow);
    card.append(visual, content);
    return card;
  });

  container.replaceChildren(...detailCards);
}

/**
 * =========================================================================
 * 4. Interactive Product Detail Modal Controller
 *    Matches the exact layout & features of the user's storefront product page:
 *    - Breadcrumbs (Category / Title)
 *    - Main Image + Thumbnails
 *    - Auto-rotating angles (hover to pause)
 *    - Eyebrow, Italic-accented Title, Rating, Reviews
 *    - Formatted Price, Compare-at Price
 *    - Size options selection
 *    - Color options
 *    - Quantity selector
 *    - Accordions for Details, Delivery, Care
 *    - Direct Edit Specifications & Delete Piece action buttons
 * =========================================================================
 */
window.openProductDetailModal = function(prod) {
  if (!prod) return;
  const modal = document.getElementById('productDetailModal');
  if (!modal) return;

  // Clear any existing rotation timer
  if (window._pvRotateInterval) {
    clearInterval(window._pvRotateInterval);
    window._pvRotateInterval = null;
  }

  // 1. Breadcrumbs
  const breadcrumbCategory = document.getElementById('breadcrumbCategory');
  if (breadcrumbCategory) breadcrumbCategory.textContent = prod.category || 'Atelier';

  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  if (breadcrumbTitle) breadcrumbTitle.textContent = prod.title || 'Product Piece';

  // 2. Stock Badge
  const stockBadge = document.getElementById('pvStockBadge');
  if (stockBadge) {
    let badgeClass = 'stock-in';
    let badgeText = `${prod.stock} in stock`;
    if (prod.stock === 0) {
      badgeClass = 'stock-out';
      badgeText = 'Sold Out';
    } else if (prod.stock <= 5) {
      badgeClass = 'stock-low';
      badgeText = `${prod.stock} low stock`;
    }
    stockBadge.className = `product-stock-badge ${badgeClass}`;
    stockBadge.textContent = badgeText;
  }

  // 3. Images & Gallery Auto-rotation
  const mainImage = document.getElementById('mainProductImage');
  const thumbsContainer = document.getElementById('galleryThumbs');
  const rotateBadge = document.getElementById('rotateBadge');
  const rotateBadgeText = document.getElementById('rotateBadgeText');
  const galleryWrapper = document.getElementById('pvProductGallery');

  // Collect available images
  const images = [
    prod.img || prod.image_url,
    prod.image_2_url,
    prod.image_3_url
  ].filter(Boolean);

  if (images.length === 0) {
    images.push('https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940');
  }

  let activeIndex = 0;

  function setActiveImage(index) {
    if (!images[index]) return;
    activeIndex = index;
    if (mainImage) {
      mainImage.style.opacity = '0.4';
      mainImage.src = images[index];
      mainImage.alt = `${prod.title} - angle ${index + 1}`;
      setTimeout(() => { mainImage.style.opacity = '1'; }, 100);
    }
    if (thumbsContainer) {
      const thumbs = thumbsContainer.querySelectorAll('.thumb');
      thumbs.forEach((th, i) => th.classList.toggle('active', i === index));
    }
  }

  // Initial main image
  setActiveImage(0);

  // Render thumbnails
  if (thumbsContainer) {
    thumbsContainer.replaceChildren();
    images.forEach((imgUrl, idx) => {
      const thumbBtn = document.createElement('button');
      thumbBtn.type = 'button';
      thumbBtn.className = `thumb ${idx === 0 ? 'active' : ''}`;
      thumbBtn.dataset.image = imgUrl;

      const thumbImg = document.createElement('img');
      thumbImg.src = imgUrl;
      thumbImg.alt = `${prod.title} view ${idx + 1}`;
      thumbBtn.appendChild(thumbImg);

      thumbBtn.addEventListener('click', () => {
        setActiveImage(idx);
        restartAutoRotation();
      });

      thumbsContainer.appendChild(thumbBtn);
    });
  }

  // Auto-rotation timer logic
  function startAutoRotation() {
    if (images.length <= 1) return;
    if (window._pvRotateInterval) clearInterval(window._pvRotateInterval);
    window._pvRotateInterval = setInterval(() => {
      const nextIdx = (activeIndex + 1) % images.length;
      setActiveImage(nextIdx);
    }, 3500);
    if (rotateBadgeText) rotateBadgeText.textContent = 'Auto-rotating angles (hover to pause)';
  }

  function pauseAutoRotation() {
    if (window._pvRotateInterval) {
      clearInterval(window._pvRotateInterval);
      window._pvRotateInterval = null;
    }
    if (rotateBadgeText) rotateBadgeText.textContent = 'Angles paused (hovering)';
  }

  function restartAutoRotation() {
    pauseAutoRotation();
    startAutoRotation();
  }

  if (images.length > 1) {
    if (rotateBadge) rotateBadge.style.display = 'inline-flex';
    startAutoRotation();

    if (galleryWrapper && !galleryWrapper._hasRotateHoverBound) {
      galleryWrapper._hasRotateHoverBound = true;
      galleryWrapper.addEventListener('mouseenter', pauseAutoRotation);
      galleryWrapper.addEventListener('mouseleave', startAutoRotation);
    }
  } else {
    if (rotateBadge) rotateBadge.style.display = 'none';
  }

  // 4. Product Copy & Styling
  const eyebrowEl = document.getElementById('productEyebrow');
  if (eyebrowEl) eyebrowEl.textContent = prod.eyebrow || 'Velora Atelier';

  const titleEl = document.getElementById('productTitle');
  if (titleEl) {
    const rawTitle = prod.title || 'Product Piece';
    const words = rawTitle.trim().split(' ');
    if (words.length > 1) {
      const lastWord = words.pop();
      titleEl.innerHTML = `${words.join(' ')} <em>${lastWord}.</em>`;
    } else {
      titleEl.innerHTML = `${rawTitle} <em>edition.</em>`;
    }
  }

  const reviewsEl = document.getElementById('productReviewsCount');
  if (reviewsEl) reviewsEl.textContent = `${prod.reviews || 12} reviews`;

  const priceEl = document.getElementById('productPrice');
  if (priceEl) priceEl.textContent = window.fmtPrice ? window.fmtPrice(prod.price) : `R${prod.price}`;

  const comparePriceEl = document.getElementById('productComparePrice');
  if (comparePriceEl) {
    if (prod.compareAtPrice && prod.compareAtPrice > prod.price) {
      comparePriceEl.style.display = 'inline-block';
      comparePriceEl.textContent = window.fmtPrice ? window.fmtPrice(prod.compareAtPrice) : `R${prod.compareAtPrice}`;
    } else {
      comparePriceEl.style.display = 'none';
    }
  }

  const descEl = document.getElementById('productDesc');
  if (descEl) {
    descEl.textContent = prod.description ||
      'A light, considered everyday piece with a soft step and a clean silhouette. Tailored for comfort, slow mornings, and timeless modern living.';
  }

  const fitBadge = document.getElementById('productFitBadge');
  if (fitBadge) fitBadge.textContent = prod.fit || 'Regular Classic Fit';

  // 5. Sizes Selector
  const sizesContainer = document.getElementById('productSizesContainer');
  if (sizesContainer) {
    sizesContainer.replaceChildren();
    const rawSizes = prod.sizes || '36, 37, 38, 39, 40';
    const sizeList = rawSizes.split(',').map(s => s.trim()).filter(Boolean);

    sizeList.forEach((sz, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = idx === 0 ? 'selected' : '';
      btn.textContent = sz;
      btn.addEventListener('click', () => {
        sizesContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      sizesContainer.appendChild(btn);
    });
  }

  // 6. Colors Section
  const colorsContainer = document.getElementById('productColorsContainer');
  const colorsWrap = document.getElementById('productColorsWrap');
  if (colorsContainer && colorsWrap) {
    colorsContainer.replaceChildren();
    if (prod.colors) {
      colorsWrap.style.display = 'block';
      const colorList = prod.colors.split(',').map(c => c.trim()).filter(Boolean);
      colorList.forEach(col => {
        const pill = document.createElement('span');
        pill.className = 'color-chip-pill';
        pill.textContent = col;
        colorsContainer.appendChild(pill);
      });
    } else {
      colorsWrap.style.display = 'none';
    }
  }

  // 7. Quantity Stepper
  let currentQty = 1;
  const qtySpan = document.getElementById('quantity');
  const qtyMinus = document.getElementById('pvQtyMinus');
  const qtyPlus = document.getElementById('pvQtyPlus');
  if (qtySpan) qtySpan.textContent = currentQty;

  if (qtyMinus && !qtyMinus._bound) {
    qtyMinus._bound = true;
    qtyMinus.addEventListener('click', () => {
      if (currentQty > 1) {
        currentQty--;
        if (qtySpan) qtySpan.textContent = currentQty;
      }
    });
  }

  if (qtyPlus && !qtyPlus._bound) {
    qtyPlus._bound = true;
    qtyPlus.addEventListener('click', () => {
      currentQty++;
      if (qtySpan) qtySpan.textContent = currentQty;
    });
  }

  // 8. Accordions
  const detailsContent = document.getElementById('detailsContent');
  if (detailsContent) {
    detailsContent.textContent = prod.details ||
      'Breathable textile upper, cushioned footbed, and durable rubber sole. Designed in Cape Town and tailored for longevity.';
  }

  const deliveryContent = document.getElementById('deliveryContent');
  if (deliveryContent) {
    deliveryContent.textContent = prod.delivery ||
      'Complimentary delivery across South Africa on orders over R800. Pristine returns accepted within 14 business days.';
  }

  const careContent = document.getElementById('careContent');
  if (careContent) {
    careContent.textContent = prod.care ||
      'Wipe gently with a soft, damp cloth. Allow to air dry naturally away from direct heat and direct sunlight.';
  }

  // 9. Admin Quick Metrics Strip
  const metricStock = document.getElementById('pvMetricStock');
  if (metricStock) metricStock.textContent = `${prod.stock} units`;

  const metricCost = document.getElementById('pvMetricCost');
  if (metricCost) {
    metricCost.textContent = prod.costPrice ? (window.fmtPrice ? window.fmtPrice(prod.costPrice) : `R${prod.costPrice}`) : 'N/A';
  }

  const metricMargin = document.getElementById('pvMetricMargin');
  if (metricMargin) {
    if (prod.price && prod.costPrice && prod.price > prod.costPrice) {
      const margin = Math.round(((prod.price - prod.costPrice) / prod.price) * 100);
      metricMargin.textContent = `${margin}%`;
    } else {
      metricMargin.textContent = '62%';
    }
  }

  const metricId = document.getElementById('pvMetricId');
  if (metricId) {
    metricId.textContent = prod.dbId ? `#${prod.dbId}` : (prod.id || '#1');
  }

  // 10. Action Buttons (Header Edit, Body Edit, Body Delete)
  const headerEditBtn = document.getElementById('pvHeaderEditBtn');
  if (headerEditBtn) {
    headerEditBtn.onclick = () => {
      window.closeProductDetailModal();
      if (typeof window.openEditProductModal === 'function') {
        window.openEditProductModal(prod);
      }
    };
  }

  const bodyEditBtn = document.getElementById('addToBag');
  if (bodyEditBtn) {
    bodyEditBtn.onclick = () => {
      window.closeProductDetailModal();
      if (typeof window.openEditProductModal === 'function') {
        window.openEditProductModal(prod);
      }
    };
  }

  const bodyDeleteBtn = document.getElementById('buyNowBtn');
  if (bodyDeleteBtn) {
    bodyDeleteBtn.onclick = () => {
      window.closeProductDetailModal();
      if (typeof window.deleteProductHandler === 'function') {
        window.deleteProductHandler(prod);
      }
    };
  }

  // Open modal
  modal.classList.add('open');
};

/**
 * Close Product Detail Modal
 */
window.closeProductDetailModal = function() {
  const modal = document.getElementById('productDetailModal');
  if (modal) modal.classList.remove('open');

  if (window._pvRotateInterval) {
    clearInterval(window._pvRotateInterval);
    window._pvRotateInterval = null;
  }
};

window.quickRestockProduct = function(prodId, count = 5) {
  const prod = window.inventoryData.find(p => p.id === prodId);
  if (!prod) return;

  prod.stock += count;
  if (typeof window.saveInventory === 'function') window.saveInventory();
  window.renderInventoryView();
  if (typeof window.showToast === 'function') {
    window.showToast(`Restocked ${count} units of ${prod.title}`);
  }
};

window.quickDeductProduct = function(prodId, count = 1) {
  const prod = window.inventoryData.find(p => p.id === prodId);
  if (!prod || prod.stock <= 0) return;

  prod.stock = Math.max(0, prod.stock - count);
  if (typeof window.saveInventory === 'function') window.saveInventory();
  window.renderInventoryView();
  if (typeof window.showToast === 'function') {
    window.showToast(`Deducted ${count} unit from ${prod.title}`);
  }
};
