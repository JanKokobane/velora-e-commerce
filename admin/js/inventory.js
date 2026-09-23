/**
 * Catalog & Stock Inventory Controller (js/inventory.js)
 * Pure DOM implementation with NO innerHTML.
 */

window.renderInventoryView = function() {
  const grid = document.getElementById('productInventoryGrid');
  if (!grid) return;

  if (!window.inventoryData || window.inventoryData.length === 0) {
    const emptyNotice = document.createElement('div');
    emptyNotice.style.gridColumn = '1 / -1';
    emptyNotice.style.textAlign = 'center';
    emptyNotice.style.padding = '60px 20px';
    emptyNotice.style.color = 'var(--muted)';
    emptyNotice.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.6;">📦</div>
      <h3 style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 6px;">No products in catalog yet</h3>
      <p style="font-size: 13px; color: #64748b; margin-bottom: 18px;">Your product catalog is ready. Publish your first piece to your online storefront.</p>
      <button type="button" class="studio-btn-publish" style="margin: 0 auto; display: inline-flex;" onclick="window.openNewProductModal()">
        <span>+ Add First Product</span>
      </button>
    `;
    grid.replaceChildren(emptyNotice);
    return;
  }

  const productCards = window.inventoryData.map(prod => {
    const card = document.createElement('div');
    card.className = 'product-card';

    // 1. Thumbnail
    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'product-thumb-container';

    const img = document.createElement('img');
    img.className = 'product-thumb-img';
    img.src = prod.img;
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

    const price = document.createElement('div');
    price.className = 'product-card-price';
    price.textContent = window.fmtPrice(prod.price);

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

    actions.append(editBtn, deleteBtn);
    stockRow.append(badge, actions);

    body.append(catTag, title, price, stockRow);
    card.append(thumbContainer, body);
    return card;
  });

  grid.replaceChildren(...productCards);
};

window.quickRestockProduct = function(prodId, count = 5) {
  const prod = window.inventoryData.find(p => p.id === prodId);
  if (!prod) return;

  prod.stock += count;
  window.saveInventory();
  window.renderInventoryView();
  window.showToast(`Restocked ${count} units of ${prod.title}`);
};

window.quickDeductProduct = function(prodId, count = 1) {
  const prod = window.inventoryData.find(p => p.id === prodId);
  if (!prod || prod.stock <= 0) return;

  prod.stock = Math.max(0, prod.stock - count);
  window.saveInventory();
  window.renderInventoryView();
  window.showToast(`Deducted ${count} unit from ${prod.title}`);
};
