/**
 * Velora Atelier & E-Commerce Admin - Product Logic & Database Integration
 * 
 * Handles client-side validation (matching backend rules without HTML5 native `required`),
 * form data formatting, and authenticated communication with the deployed Render backend:
 * https://velora-e-commerce-qby7.onrender.com/api/products
 * 
 * Capabilities:
 * - Real Data Fetching (populates window.inventoryData directly from DB)
 * - Create Product (POST /api/products)
 * - Edit Product (PUT /api/products/:id)
 * - Delete Product (DELETE /api/products/:id)
 */

(function () {
  'use strict';

  const BACKEND_BASE_URL = 'https://velora-e-commerce-qby7.onrender.com';

  /**
   * Resolve active administrator JWT token from memory or persistent storage
   */
  function getAdminToken() {
    try {
      if (window.adminAuthApi && typeof window.adminAuthApi.getToken === 'function') {
        const token = window.adminAuthApi.getToken();
        if (token) return token;
      }
    } catch (_) {}

    return (
      localStorage.getItem('velora_admin_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('velora_admin_token') ||
      ''
    );
  }

  /**
   * Helper to normalize optional string values (trimming whitespace or returning null)
   */
  function normalizeOptionalString(value) {
    if (value === undefined || value === null) {
      return null;
    }
    const normalized = String(value).trim();
    return normalized || null;
  }

  /**
   * Validate core product fields matching the backend validateProductData controller
   */
  function validateProductData(payload) {
    const { title, category, price, stock } = payload;

    if (!title || !String(title).trim()) {
      return {
        fieldId: 'newProdTitle',
        message: 'Product title is required.',
      };
    }

    if (!category || !String(category).trim()) {
      return {
        fieldId: 'newProdCategory',
        message: 'Product category is required.',
      };
    }

    if (price === undefined || price === null || price === '') {
      return {
        fieldId: 'newProdPrice',
        message: 'Product price is required.',
      };
    }

    if (Number.isNaN(Number(price))) {
      return {
        fieldId: 'newProdPrice',
        message: 'Product price must be a valid number.',
      };
    }

    if (Number(price) < 0) {
      return {
        fieldId: 'newProdPrice',
        message: 'Product price cannot be negative.',
      };
    }

    if (stock === undefined || stock === null || stock === '') {
      return {
        fieldId: 'newProdStock',
        message: 'Stock quantity is required.',
      };
    }

    if (Number.isNaN(Number(stock))) {
      return {
        fieldId: 'newProdStock',
        message: 'Stock quantity must be a valid number.',
      };
    }

    if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
      return {
        fieldId: 'newProdStock',
        message: 'Stock quantity must be a whole number greater than or equal to 0.',
      };
    }

    return null;
  }

  /**
   * Validate optional price fields matching backend validateOptionalPrices
   */
  function validateOptionalPrices(payload) {
    const { compare_price, cost_price } = payload;

    if (
      compare_price !== undefined &&
      compare_price !== null &&
      compare_price !== '' &&
      Number.isNaN(Number(compare_price))
    ) {
      return {
        fieldId: 'newProdComparePrice',
        message: 'Compare-at price must be a valid number.',
      };
    }

    if (
      cost_price !== undefined &&
      cost_price !== null &&
      cost_price !== '' &&
      Number.isNaN(Number(cost_price))
    ) {
      return {
        fieldId: 'newProdCostPrice',
        message: 'Cost price must be a valid number.',
      };
    }

    if (
      compare_price !== undefined &&
      compare_price !== null &&
      compare_price !== '' &&
      Number(compare_price) < 0
    ) {
      return {
        fieldId: 'newProdComparePrice',
        message: 'Compare-at price cannot be negative.',
      };
    }

    if (
      cost_price !== undefined &&
      cost_price !== null &&
      cost_price !== '' &&
      Number(cost_price) < 0
    ) {
      return {
        fieldId: 'newProdCostPrice',
        message: 'Cost price cannot be negative.',
      };
    }

    return null;
  }

  /**
   * Ensure stock status matches backend enum: "in_stock" | "low_stock" | "preorder"
   */
  function normalizeStockStatus(status) {
    const valid = ['in_stock', 'low_stock', 'preorder'];
    const s = String(status || '').trim().toLowerCase();
    return valid.includes(s) ? s : 'in_stock';
  }

  /**
   * Extract and sanitize all input values from the product form
   */
  function collectFormData() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    const title = getVal('newProdTitle');
    const eyebrow = getVal('newProdEyebrow');
    const category = getVal('newProdCategory');
    const price = getVal('newProdPrice');
    const compare_price = getVal('newProdComparePrice');
    const cost_price = getVal('newProdCostPrice');
    const stock = getVal('newProdStock');
    const stock_status = getVal('newProdStockStatus');
    const sizes = getVal('newProdSizes');
    const colors = getVal('newProdColors');
    const fit = getVal('newProdFit');
    const image_url = getVal('newProdImage');
    const image_2_url = getVal('newProdImage2');
    const image_3_url = getVal('newProdImage3');
    const description = getVal('newProdDescription');
    const details = getVal('newProdDetails');
    const care = getVal('newProdCare');
    const delivery = getVal('newProdDelivery');
    const rating = getVal('newProdRating') || '5';
    const reviews = getVal('newProdReviews') || '0';

    return {
      title,
      eyebrow: normalizeOptionalString(eyebrow),
      category,
      price: price !== '' ? Number(price) : '',
      compare_price: compare_price !== '' ? Number(compare_price) : null,
      cost_price: cost_price !== '' ? Number(cost_price) : null,
      stock: stock !== '' ? Number(stock) : '',
      stock_status: normalizeStockStatus(stock_status),
      sizes: normalizeOptionalString(sizes),
      colors: normalizeOptionalString(colors),
      fit: normalizeOptionalString(fit),
      image_url: normalizeOptionalString(image_url),
      image_2_url: normalizeOptionalString(image_2_url),
      image_3_url: normalizeOptionalString(image_3_url),
      description: normalizeOptionalString(description),
      details: normalizeOptionalString(details),
      care: normalizeOptionalString(care),
      delivery: normalizeOptionalString(delivery),
      rating: Number(rating) || 5,
      reviews: Number(reviews) || 0,
    };
  }

  /**
   * Reset field error highlighting and alert banner
   */
  function clearFormErrors() {
    const alertBox = document.getElementById('productFormAlert');
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.textContent = '';
      alertBox.className = 'studio-form-alert';
    }

    const invalidInputs = document.querySelectorAll('#newProductForm .is-invalid');
    invalidInputs.forEach((el) => el.classList.remove('is-invalid'));
  }

  /**
   * Display inline error message in modal and highlight problematic input
   */
  function showFormError(message, fieldId = null) {
    const alertBox = document.getElementById('productFormAlert');
    if (alertBox) {
      alertBox.textContent = message;
      alertBox.className = 'studio-form-alert is-error';
      alertBox.style.display = 'flex';
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (fieldId) {
      const field = document.getElementById(fieldId);
      if (field) {
        field.classList.add('is-invalid');
        field.focus();
      }
    }

    if (typeof window.showToast === 'function') {
      window.showToast(message, 'error');
    }
  }

  /**
   * Set modal submit button loading state
   */
  function setSubmittingState(isSubmitting, isEdit = false) {
    const submitBtn = document.getElementById('btnSubmitProduct');
    if (!submitBtn) return;

    submitBtn.disabled = isSubmitting;
    const textSpan = submitBtn.querySelector('.studio-btn-text');
    const arrowSpan = submitBtn.querySelector('.studio-btn-arrow');

    if (isSubmitting) {
      if (textSpan) textSpan.textContent = isEdit ? 'Saving Changes...' : 'Saving to Database...';
      if (arrowSpan) arrowSpan.style.display = 'none';
      submitBtn.style.opacity = '0.75';
      submitBtn.style.cursor = 'not-allowed';
    } else {
      if (textSpan) textSpan.textContent = isEdit ? 'Save Product Changes' : 'Publish Product to Store';
      if (arrowSpan) arrowSpan.style.display = 'inline-block';
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
    }
  }

  /**
   * Reset the modal form back to "Add New Product" mode
   */
  function resetProductFormToAddMode() {
    const form = document.getElementById('newProductForm');
    if (form) {
      delete form.dataset.editId;
      delete form.dataset.editDbId;
      form.reset();
    }
    clearFormErrors();

    const titleEl = document.getElementById('productModalTitle');
    if (titleEl) titleEl.textContent = 'Add New Product';

    const subEl = document.getElementById('productModalSubheading');
    if (subEl) subEl.textContent = 'Fill in the details to publish a new piece to your store catalog.';

    const submitBtn = document.getElementById('btnSubmitProduct');
    if (submitBtn) {
      const textSpan = submitBtn.querySelector('.studio-btn-text');
      if (textSpan) textSpan.textContent = 'Publish Product to Store';
    }

    const statusEl = document.getElementById('studioFooterStatus');
    if (statusEl) statusEl.textContent = 'Ready to publish to online store';
  }

  /**
   * Open modal in "Edit Product" mode and prepopulate all values
   */
  function openEditProductModal(prod) {
    if (!prod) return;

    resetProductFormToAddMode();

    const form = document.getElementById('newProductForm');
    if (form) {
      form.dataset.editId = prod.id;
      if (prod.dbId) form.dataset.editDbId = prod.dbId;
    }

    // Update titles and buttons
    const titleEl = document.getElementById('productModalTitle');
    if (titleEl) titleEl.textContent = 'Edit Product';

    const subEl = document.getElementById('productModalSubheading');
    if (subEl) subEl.textContent = `Update specifications for ${prod.title || 'selected item'}`;

    const submitBtn = document.getElementById('btnSubmitProduct');
    if (submitBtn) {
      const textSpan = submitBtn.querySelector('.studio-btn-text');
      if (textSpan) textSpan.textContent = 'Save Product Changes';
    }

    const statusEl = document.getElementById('studioFooterStatus');
    if (statusEl) statusEl.textContent = 'Editing existing catalog piece';

    // Populate inputs
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('newProdTitle', prod.title || '');
    setVal('newProdEyebrow', prod.eyebrow || '');
    setVal('newProdCategory', prod.category || 'T-Shirts');
    setVal('newProdPrice', prod.price !== undefined ? prod.price : '');
    setVal('newProdComparePrice', prod.compareAtPrice !== undefined ? prod.compareAtPrice : (prod.compare_price || ''));
    setVal('newProdCostPrice', prod.costPrice !== undefined ? prod.costPrice : (prod.cost_price || ''));
    setVal('newProdStock', prod.stock !== undefined ? prod.stock : 0);
    setVal('newProdStockStatus', prod.status || prod.stock_status || 'in_stock');
    setVal('newProdSizes', prod.sizes || '');
    setVal('newProdColors', prod.colors || '');
    setVal('newProdFit', prod.fit || '');
    setVal('newProdImage', prod.image_url || prod.img || '');
    setVal('newProdImage2', prod.image_2_url || '');
    setVal('newProdImage3', prod.image_3_url || '');
    setVal('newProdDescription', prod.description || '');
    setVal('newProdDetails', prod.details || '');
    setVal('newProdCare', prod.care || '');
    setVal('newProdDelivery', prod.delivery || '');
    setVal('newProdRating', prod.rating || 5);
    setVal('newProdReviews', prod.reviews || 0);

    // Open the modal
    if (typeof window.openNewProductModal === 'function') {
      window.openNewProductModal(true);
    }
  }

  /**
   * Delete product handler (invoked by Delete button in product card)
   */
  async function deleteProductHandler(prod) {
    if (!prod) return;

    const confirmed = window.confirm(`Are you sure you want to delete "${prod.title}" from your catalog? This cannot be undone.`);
    if (!confirmed) return;

    // Check if item has a DB ID
    let numericId = null;
    if (prod.dbId && Number.isInteger(Number(prod.dbId)) && Number(prod.dbId) > 0) {
      numericId = Number(prod.dbId);
    } else if (typeof prod.id === 'string' && prod.id.startsWith('db-')) {
      const parsed = Number(prod.id.replace('db-', ''));
      if (Number.isInteger(parsed) && parsed > 0) numericId = parsed;
    } else if (typeof prod.id === 'number' && Number.isInteger(prod.id) && prod.id > 0) {
      numericId = prod.id;
    }

    const token = getAdminToken();

    // If persisted in backend DB and token available, call DELETE API
    if (numericId && token) {
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/products/${numericId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok && response.status !== 404) {
          const errData = await response.json().catch(() => null);
          const msg = (errData && errData.message) || `Failed to delete product (Status ${response.status})`;
          if (typeof window.showToast === 'function') {
            window.showToast(msg, 'error');
          }
          return;
        }
      } catch (err) {
        console.error('[Velora] Backend delete error:', err);
      }
    }

    // Remove from local inventory state
    if (Array.isArray(window.inventoryData)) {
      window.inventoryData = window.inventoryData.filter((p) => {
        if (!p) return false;
        if (p === prod) return false;
        if (p.id === prod.id) return false;
        if (numericId && (p.dbId === numericId || p.id === `db-${numericId}`)) return false;
        return true;
      });
    }

    if (typeof window.saveInventory === 'function') {
      window.saveInventory();
    }
    if (typeof window.renderInventoryView === 'function') {
      window.renderInventoryView();
    }
    if (typeof window.renderOverview === 'function') {
      window.renderOverview();
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`Product "${prod.title}" deleted successfully.`, 'success');
    }
  }

  /**
   * Core submission handler for adding OR editing products directly in the database
   */
  async function handleProductFormSubmit(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    clearFormErrors();

    // 1. Gather all form inputs
    const rawPayload = collectFormData();

    // 2. Client-side validation matching backend rules
    const coreError = validateProductData(rawPayload);
    if (coreError) {
      showFormError(coreError.message, coreError.fieldId);
      return;
    }

    const priceError = validateOptionalPrices(rawPayload);
    if (priceError) {
      showFormError(priceError.message, priceError.fieldId);
      return;
    }

    // 3. Resolve Admin JWT Authentication Token
    const token = getAdminToken();
    if (!token) {
      showFormError('Authentication required: Please sign in as an admin to save products to the database.');
      if (typeof window.openVeloraAuthScreen === 'function') {
        setTimeout(() => window.openVeloraAuthScreen(), 700);
      }
      return;
    }

    const form = document.getElementById('newProductForm');
    const isEditMode = !!(form && (form.dataset.editId || form.dataset.editDbId));
    const editId = form ? form.dataset.editId : null;
    const editDbId = form ? form.dataset.editDbId : null;

    let targetNumericId = null;
    if (editDbId && Number.isInteger(Number(editDbId)) && Number(editDbId) > 0) {
      targetNumericId = Number(editDbId);
    } else if (editId && typeof editId === 'string' && editId.startsWith('db-')) {
      const parsed = Number(editId.replace('db-', ''));
      if (Number.isInteger(parsed) && parsed > 0) targetNumericId = parsed;
    } else if (editId && Number.isInteger(Number(editId)) && Number(editId) > 0) {
      targetNumericId = Number(editId);
    }

    // 4. Construct payload for backend API
    const requestBody = {
      title: rawPayload.title.trim(),
      eyebrow: rawPayload.eyebrow,
      category: rawPayload.category.trim(),
      price: Number(rawPayload.price),
      compare_price: rawPayload.compare_price !== null ? Number(rawPayload.compare_price) : null,
      cost_price: rawPayload.cost_price !== null ? Number(rawPayload.cost_price) : null,
      stock: Number(rawPayload.stock),
      stock_status: rawPayload.stock_status,
      sizes: rawPayload.sizes,
      colors: rawPayload.colors,
      fit: rawPayload.fit,
      image_url: rawPayload.image_url,
      image_2_url: rawPayload.image_2_url,
      image_3_url: rawPayload.image_3_url,
      description: rawPayload.description,
      details: rawPayload.details,
      care: rawPayload.care,
      delivery: rawPayload.delivery,
      rating: 5,
      reviews: 0,
    };

    setSubmittingState(true, isEditMode);

    try {
      const endpoint = isEditMode && targetNumericId
        ? `${BACKEND_BASE_URL}/api/products/${targetNumericId}`
        : `${BACKEND_BASE_URL}/api/products`;
      const method = isEditMode && targetNumericId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          showFormError('Your admin session has expired or is invalid. Please sign in again.');
          if (window.adminAuthApi && typeof window.adminAuthApi.logout === 'function') {
            window.adminAuthApi.logout();
          }
          if (typeof window.openVeloraAuthScreen === 'function') {
            window.openVeloraAuthScreen();
          }
          return;
        }

        const errMsg = (data && data.message) || `Failed to save product (Error ${response.status})`;
        showFormError(errMsg);
        return;
      }

      // Successful persistence
      const savedProduct = (data && data.product) ? data.product : {};
      const successMessage = (data && data.message) || (isEditMode ? 'Product updated successfully.' : 'Product created successfully.');

      const formattedItem = {
        id: savedProduct.id ? `db-${savedProduct.id}` : (editId || `db-${Date.now()}`),
        dbId: savedProduct.id || targetNumericId || null,
        title: savedProduct.title || requestBody.title,
        eyebrow: savedProduct.eyebrow || requestBody.eyebrow || 'Velora Atelier',
        category: savedProduct.category || requestBody.category,
        price: Number(savedProduct.price || requestBody.price),
        compareAtPrice: savedProduct.compare_price !== null && savedProduct.compare_price !== undefined
          ? Number(savedProduct.compare_price)
          : requestBody.compare_price,
        costPrice: savedProduct.cost_price !== null && savedProduct.cost_price !== undefined
          ? Number(savedProduct.cost_price)
          : requestBody.cost_price,
        stock: Number(savedProduct.stock !== undefined ? savedProduct.stock : requestBody.stock),
        status: savedProduct.stock_status || requestBody.stock_status,
        stock_status: savedProduct.stock_status || requestBody.stock_status,
        img: savedProduct.image_url || requestBody.image_url || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
        image_url: savedProduct.image_url || requestBody.image_url,
        image_2_url: savedProduct.image_2_url || requestBody.image_2_url,
        image_3_url: savedProduct.image_3_url || requestBody.image_3_url,
        sizes: savedProduct.sizes || requestBody.sizes || '',
        colors: savedProduct.colors || requestBody.colors || '',
        fit: savedProduct.fit || requestBody.fit || '',
        details: savedProduct.details || requestBody.details || '',
        description: savedProduct.description || requestBody.description || '',
        care: savedProduct.care || requestBody.care || '',
        delivery: savedProduct.delivery || requestBody.delivery || '',
        rating: Number(savedProduct.rating) || 5,
        reviews: Number(savedProduct.reviews) || 0,
        createdAt: savedProduct.created_at || new Date().toISOString(),
      };

      if (!Array.isArray(window.inventoryData)) {
        window.inventoryData = [];
      }

      if (isEditMode) {
        // Replace updated product in local state
        const idx = window.inventoryData.findIndex(
          (p) => p && (p.id === editId || (targetNumericId && p.dbId === targetNumericId) || (targetNumericId && p.id === `db-${targetNumericId}`))
        );
        if (idx !== -1) {
          window.inventoryData[idx] = { ...window.inventoryData[idx], ...formattedItem };
        } else {
          window.inventoryData.unshift(formattedItem);
        }
      } else {
        // Prepend new product
        window.inventoryData.unshift(formattedItem);
      }

      if (typeof window.saveInventory === 'function') window.saveInventory();
      if (typeof window.renderInventoryView === 'function') window.renderInventoryView();
      if (typeof window.renderOverview === 'function') window.renderOverview();

      if (typeof window.showToast === 'function') {
        window.showToast(successMessage, 'success');
      }

      resetProductFormToAddMode();

      if (typeof window.closeNewProductModal === 'function') {
        window.closeNewProductModal();
      }
    } catch (err) {
      console.error('[Velora] Error saving product to backend:', err);
      showFormError('Network error: Unable to reach product server. Please check your internet connection.');
    } finally {
      setSubmittingState(false, isEditMode);
    }
  }

  /**
   * Fetch all real products from Render backend database.
   * This completely clears out old mock items and shows real database records.
   */
  async function fetchProductsFromDatabase() {
    const token = getAdminToken();
    if (!token) return;

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return;

      const data = await response.json().catch(() => null);
      if (data && Array.isArray(data.products)) {
        const dbProducts = data.products.map((p) => ({
          id: `db-${p.id}`,
          dbId: p.id,
          title: p.title,
          eyebrow: p.eyebrow || 'Velora Atelier',
          category: p.category,
          price: Number(p.price),
          compareAtPrice: p.compare_price ? Number(p.compare_price) : null,
          costPrice: p.cost_price ? Number(p.cost_price) : null,
          stock: Number(p.stock),
          status: p.stock_status || 'in_stock',
          stock_status: p.stock_status || 'in_stock',
          img: p.image_url || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
          image_url: p.image_url,
          image_2_url: p.image_2_url,
          image_3_url: p.image_3_url,
          sizes: p.sizes || '',
          colors: p.colors || '',
          fit: p.fit || '',
          details: p.details || '',
          description: p.description || '',
          care: p.care || '',
          delivery: p.delivery || '',
          rating: Number(p.rating) || 5,
          reviews: Number(p.reviews) || 0,
          createdAt: p.created_at || new Date().toISOString(),
        }));

        // Set real database records directly as the active inventory
        window.inventoryData = dbProducts;

        if (typeof window.saveInventory === 'function') window.saveInventory();
        if (typeof window.renderInventoryView === 'function') window.renderInventoryView();
        if (typeof window.renderOverview === 'function') window.renderOverview();
      }
    } catch (err) {
      console.warn('[Velora] Note: Could not fetch initial DB products:', err);
    }
  }

  /**
   * Bind events to the product modal form
   */
  function initProductLogic() {
    const form = document.getElementById('newProductForm');
    if (!form) return;

    if (!form._hasProductLogicBound) {
      form._hasProductLogicBound = true;
      form.addEventListener('submit', handleProductFormSubmit);
    }

    // Clear input errors on user interaction
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        if (input.classList.contains('is-invalid')) {
          input.classList.remove('is-invalid');
        }
        const alertBox = document.getElementById('productFormAlert');
        if (alertBox && alertBox.style.display !== 'none') {
          alertBox.style.display = 'none';
        }
      });
    });
  }

  // Export globally
  window.initProductLogic = initProductLogic;
  window.handleProductFormSubmit = handleProductFormSubmit;
  window.fetchProductsFromDatabase = fetchProductsFromDatabase;
  window.openEditProductModal = openEditProductModal;
  window.deleteProductHandler = deleteProductHandler;
  window.resetProductFormToAddMode = resetProductFormToAddMode;
  window.validateProductData = validateProductData;
  window.validateOptionalPrices = validateOptionalPrices;

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initProductLogic();
      fetchProductsFromDatabase();
    });
  } else {
    initProductLogic();
    fetchProductsFromDatabase();
  }
})();
