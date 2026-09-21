/**
 * Catalog & Stock Inventory Controller (js/inventory.js)
 * Pure DOM implementation with NO innerHTML.
 */

window.renderInventoryView = function() {
  const grid = document.getElementById('productInventoryGrid');
  if (!grid) return;

  if (window.inventoryData.length === 0) {
    const emptyNotice = document.createElement('div');
    emptyNotice.style.gridColumn = '1 / -1';
    emptyNotice.style.textAlign = 'center';
    emptyNotice.style.padding = '60px 20px';
    emptyNotice.style.color = 'var(--muted)';
    emptyNotice.textContent = 'No products found in the catalog.';
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

    const minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'stock-btn';
    minusBtn.title = 'Deduct 1 unit';
    minusBtn.textContent = '−';
    minusBtn.disabled = prod.stock <= 0;
    minusBtn.addEventListener('click', () => {
      window.quickDeductProduct(prod.id, 1);
    });

    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'stock-btn';
    plusBtn.title = 'Restock 5 units';
    plusBtn.textContent = '+';
    plusBtn.addEventListener('click', () => {
      window.quickRestockProduct(prod.id, 5);
    });

    actions.append(minusBtn, plusBtn);
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
