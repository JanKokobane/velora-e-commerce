/**
 * Modals & Dialog Controllers (js/modals.js)
 * Pure DOM implementation with NO innerHTML.
 */

window.openNewProductModal = function() {
  const modal = document.getElementById('newProductModal');
  if (modal) modal.classList.add('open');
};

window.closeNewProductModal = function() {
  const modal = document.getElementById('newProductModal');
  if (modal) modal.classList.remove('open');
};

window.openNewCustomerModal = function() {
  const modal = document.getElementById('newCustomerModal');
  if (modal) modal.classList.add('open');
};

window.closeNewCustomerModal = function() {
  const modal = document.getElementById('newCustomerModal');
  if (modal) modal.classList.remove('open');
};

window.initModals = function() {
  // New Product Form Submission
  const prodForm = document.getElementById('newProductForm');
  if (prodForm && !prodForm._hasModalsSubmitListener) {
    prodForm._hasModalsSubmitListener = true;
    prodForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const titleInput = document.getElementById('newProdTitle');
      const priceInput = document.getElementById('newProdPrice');
      const catInput = document.getElementById('newProdCategory');
      const stockInput = document.getElementById('newProdStock');
      const imgInput = document.getElementById('newProdImage');

      const title = titleInput ? titleInput.value.trim() : '';
      const price = priceInput ? parseFloat(priceInput.value) : 0;
      const category = catInput ? catInput.value : 'Objects';
      const stock = stockInput ? parseInt(stockInput.value, 10) : 10;
      const img = imgInput && imgInput.value.trim()
        ? imgInput.value.trim()
        : 'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=300&w=300';

      if (!title || isNaN(price)) return;

      const newProduct = {
        id: `prod-${Date.now()}`,
        title,
        category,
        price,
        stock,
        img
      };

      window.inventoryData.unshift(newProduct);
      window.saveInventory();

      prodForm.reset();
      window.closeNewProductModal();
      window.showToast(`Product "${title}" added to catalog.`);

      if (typeof window.renderInventoryView === 'function') {
        window.renderInventoryView();
      }
    });
  }

  // New Customer Form Submission
  const custForm = document.getElementById('newCustomerForm');
  if (custForm && !custForm._hasModalsSubmitListener) {
    custForm._hasModalsSubmitListener = true;
    custForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('newCustName');
      const emailInput = document.getElementById('newCustEmail');
      const phoneInput = document.getElementById('newCustPhone');
      const cityInput = document.getElementById('newCustCity');
      const tierInput = document.getElementById('newCustTier');
      const spendInput = document.getElementById('newCustInitialSpend');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const city = cityInput ? cityInput.value.trim() : 'Johannesburg, GP';
      const tier = tierInput ? tierInput.value : 'Standard';
      const spend = spendInput ? parseFloat(spendInput.value) || 0 : 0;

      if (!name || !email) return;

      const newCust = {
        id: `CUST-0${Math.floor(Math.random() * 900 + 100)}`,
        name,
        email,
        phone,
        city,
        tier,
        totalOrders: spend > 0 ? 1 : 0,
        lifetimeSpend: spend,
        lastActive: 'Just now',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&h=150&w=150'
      };

      window.customersData.unshift(newCust);
      window.saveCustomers();

      custForm.reset();
      window.closeNewCustomerModal();
      window.showToast(`Client ${name} registered successfully.`);

      if (typeof window.renderCustomersView === 'function') {
        window.renderCustomersView();
      }
    });
  }

  // Close modals on backdrop click
  document.querySelectorAll('.dash-modal-backdrop').forEach(modalEl => {
    if (!modalEl._hasBackdropClickListener) {
      modalEl._hasBackdropClickListener = true;
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          modalEl.classList.remove('open');
        }
      });
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initModals);
} else {
  window.initModals();
}
