(function () {
  const slotModes = { 1: 'upload', 2: 'upload', 3: 'upload' };

  function getSlotElements(slot) {
    const urlId = slot === 1 ? 'newProdImage' : `newProdImage${slot}`;
    const fileId = slot === 1 ? 'newProdImageFile' : `newProdImage${slot}File`;

    return {
      urlInput: document.getElementById(urlId),
      fileInput: document.getElementById(fileId),
      uploadView: document.getElementById(`slotUploadView${slot}`),
      urlView: document.getElementById(`slotUrlView${slot}`),
      previewCard: document.getElementById(`slotPreview${slot}`),
      previewImg: document.getElementById(`slotPreviewImg${slot}`),
      previewName: document.getElementById(`slotPreviewName${slot}`),
      previewSub: document.getElementById(`slotPreviewSub${slot}`),
      dropzone: document.getElementById(`dropzoneBox${slot}`),
      btnUpload: document.getElementById(`modeBtnUpload${slot}`),
      btnUrl: document.getElementById(`modeBtnUrl${slot}`)
    };
  }

  window.setProductImageMode = function (slot, mode) {
    slotModes[slot] = mode;

    const el = getSlotElements(slot);

    if (!el.uploadView || !el.urlView) return;

    if (mode === 'upload') {
      el.uploadView.style.display = 'block';
      el.urlView.style.display = 'none';

      if (el.btnUpload) {
        el.btnUpload.classList.add('active');
      }

      if (el.btnUrl) {
        el.btnUrl.classList.remove('active');
      }
    } else {
      el.uploadView.style.display = 'none';
      el.urlView.style.display = 'block';

      if (el.btnUpload) {
        el.btnUpload.classList.remove('active');
      }

      if (el.btnUrl) {
        el.btnUrl.classList.add('active');
      }

      if (el.urlInput) {
        el.urlInput.focus();
      }
    }
  };

  function updateSlotPreview(slot, src, labelText, subText) {
    const el = getSlotElements(slot);

    if (!el.previewCard || !el.previewImg) return;

    el.previewImg.src = src;

    if (el.previewName) {
      el.previewName.textContent = labelText || 'Image Selected';
    }

    if (el.previewSub) {
      el.previewSub.textContent = subText || 'Ready to publish';
    }

    el.previewCard.style.display = 'flex';
  }

  window.applySampleImageUrl = function (slot, url) {
    const el = getSlotElements(slot);

    if (el.urlInput) {
      el.urlInput.value = url;
      el.urlInput.dispatchEvent(new Event('input', { bubbles: true }));
      el.urlInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    updateSlotPreview(slot, url, 'Sample Preset Photo', 'Web Image URL');
  };

  window.triggerSlotChange = function (slot) {
    const el = getSlotElements(slot);

    if (slotModes[slot] === 'upload') {
      if (el.fileInput) {
        el.fileInput.click();
      }
    } else {
      if (el.urlInput) {
        el.urlInput.focus();
        el.urlInput.select();
      }
    }
  };

  window.clearProductSlot = function (slot) {
    const el = getSlotElements(slot);

    if (el.urlInput) {
      el.urlInput.value = '';
      el.urlInput.dispatchEvent(new Event('input', { bubbles: true }));
      el.urlInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (el.fileInput) {
      el.fileInput.value = '';
    }

    if (el.previewCard) {
      el.previewCard.style.display = 'none';
    }
  };

  function setupSlot(slot) {
    const el = getSlotElements(slot);

    if (!el.fileInput || !el.urlInput) return;

    el.fileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
          const dataUrl = e.target.result;

          el.urlInput.value = dataUrl;
          el.urlInput.dispatchEvent(new Event('input', { bubbles: true }));
          el.urlInput.dispatchEvent(new Event('change', { bubbles: true }));

          const sizeKb = Math.round(file.size / 1024);
          const sizeLabel =
            sizeKb > 1024
              ? (sizeKb / 1024).toFixed(1) + ' MB'
              : sizeKb + ' KB';

          updateSlotPreview(
            slot,
            dataUrl,
            file.name,
            `Uploaded file (${sizeLabel})`
          );
        };

        reader.readAsDataURL(file);
      }
    });

    el.urlInput.addEventListener('input', function () {
      const val = this.value.trim();

      if (
        val &&
        (
          val.startsWith('http://') ||
          val.startsWith('https://') ||
          val.startsWith('data:image/')
        )
      ) {
        updateSlotPreview(
          slot,
          val,
          'Web Image URL',
          'Ready to publish'
        );
      } else if (!val) {
        if (el.previewCard) {
          el.previewCard.style.display = 'none';
        }
      }
    });

    if (el.dropzone) {
      ['dragenter', 'dragover'].forEach(evt => {
        el.dropzone.addEventListener(evt, e => {
          e.preventDefault();
          e.stopPropagation();
          el.dropzone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(evt => {
        el.dropzone.addEventListener(evt, e => {
          e.preventDefault();
          e.stopPropagation();
          el.dropzone.classList.remove('drag-over');
        });
      });

      el.dropzone.addEventListener('drop', e => {
        if (
          e.dataTransfer &&
          e.dataTransfer.files &&
          e.dataTransfer.files[0]
        ) {
          const file = e.dataTransfer.files[0];

          if (!file.type.startsWith('image/')) return;

          try {
            const dt = new DataTransfer();
            dt.items.add(file);
            el.fileInput.files = dt.files;
          } catch (err) {}

          const reader = new FileReader();

          reader.onload = ev => {
            const dataUrl = ev.target.result;

            el.urlInput.value = dataUrl;
            el.urlInput.dispatchEvent(
              new Event('input', { bubbles: true })
            );
            el.urlInput.dispatchEvent(
              new Event('change', { bubbles: true })
            );

            updateSlotPreview(
              slot,
              dataUrl,
              file.name,
              'Uploaded file'
            );
          };

          reader.readAsDataURL(file);
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    [1, 2, 3].forEach(setupSlot);
  });

  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  ) {
    [1, 2, 3].forEach(setupSlot);
  }
})();

(function () {
  'use strict';

  const BACKEND_BASE_URL =
    'https://velora-e-commerce-qby7.onrender.com';

  function getAdminToken() {
    try {
      if (
        window.adminAuthApi &&
        typeof window.adminAuthApi.getToken === 'function'
      ) {
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

  function normalizeOptionalString(value) {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = String(value).trim();

    return normalized || null;
  }

  function validateProductData(payload) {
    const {
      title,
      category,
      price,
      stock
    } = payload;

    if (!title || !String(title).trim()) {
      return {
        fieldId: 'newProdTitle',
        message: 'Product title is required.'
      };
    }

    if (!category || !String(category).trim()) {
      return {
        fieldId: 'newProdCategory',
        message: 'Product category is required.'
      };
    }

    if (
      price === undefined ||
      price === null ||
      price === ''
    ) {
      return {
        fieldId: 'newProdPrice',
        message: 'Product price is required.'
      };
    }

    if (Number.isNaN(Number(price))) {
      return {
        fieldId: 'newProdPrice',
        message: 'Product price must be a valid number.'
      };
    }

    if (Number(price) < 0) {
      return {
        fieldId: 'newProdPrice',
        message: 'Product price cannot be negative.'
      };
    }

    if (
      stock === undefined ||
      stock === null ||
      stock === ''
    ) {
      return {
        fieldId: 'newProdStock',
        message: 'Stock quantity is required.'
      };
    }

    if (Number.isNaN(Number(stock))) {
      return {
        fieldId: 'newProdStock',
        message: 'Stock quantity must be a valid number.'
      };
    }

    if (
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      return {
        fieldId: 'newProdStock',
        message:
          'Stock quantity must be a whole number greater than or equal to 0.'
      };
    }

    return null;
  }

  function validateOptionalPrices(payload) {
    const {
      compare_price,
      cost_price
    } = payload;

    if (
      compare_price !== undefined &&
      compare_price !== null &&
      compare_price !== '' &&
      Number.isNaN(Number(compare_price))
    ) {
      return {
        fieldId: 'newProdComparePrice',
        message: 'Compare-at price must be a valid number.'
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
        message: 'Cost price must be a valid number.'
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
        message: 'Compare-at price cannot be negative.'
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
        message: 'Cost price cannot be negative.'
      };
    }

    return null;
  }

  function normalizeStockStatus(status) {
    const valid = [
      'in_stock',
      'low_stock',
      'preorder'
    ];

    const s = String(status || '')
      .trim()
      .toLowerCase();

    return valid.includes(s) ? s : 'in_stock';
  }

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
      compare_price:
        compare_price !== ''
          ? Number(compare_price)
          : null,
      cost_price:
        cost_price !== ''
          ? Number(cost_price)
          : null,
      stock: stock !== '' ? Number(stock) : '',
      stock_status:
        normalizeStockStatus(stock_status),
      sizes: normalizeOptionalString(sizes),
      colors: normalizeOptionalString(colors),
      fit: normalizeOptionalString(fit),
      image_url:
        normalizeOptionalString(image_url),
      image_2_url:
        normalizeOptionalString(image_2_url),
      image_3_url:
        normalizeOptionalString(image_3_url),
      description:
        normalizeOptionalString(description),
      details:
        normalizeOptionalString(details),
      care:
        normalizeOptionalString(care),
      delivery:
        normalizeOptionalString(delivery),
      rating: Number(rating) || 5,
      reviews: Number(reviews) || 0
    };
  }

  function clearFormErrors() {
    const alertBox =
      document.getElementById('productFormAlert');

    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.textContent = '';
      alertBox.className = 'studio-form-alert';
    }

    const invalidInputs =
      document.querySelectorAll(
        '#newProductForm .is-invalid'
      );

    invalidInputs.forEach((el) => {
      el.classList.remove('is-invalid');
    });
  }

  function showFormError(
    message,
    fieldId = null
  ) {
    const alertBox =
      document.getElementById('productFormAlert');

    if (alertBox) {
      alertBox.textContent = message;
      alertBox.className =
        'studio-form-alert is-error';
      alertBox.style.display = 'flex';

      alertBox.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }

    if (fieldId) {
      const field =
        document.getElementById(fieldId);

      if (field) {
        field.classList.add('is-invalid');
        field.focus();
      }
    }

    if (
      typeof window.showToast === 'function'
    ) {
      window.showToast(message, 'error');
    }
  }

  function setSubmittingState(
    isSubmitting,
    isEdit = false
  ) {
    const submitBtn =
      document.getElementById(
        'btnSubmitProduct'
      );

    if (!submitBtn) return;

    submitBtn.disabled = isSubmitting;

    const textSpan =
      submitBtn.querySelector(
        '.studio-btn-text'
      );

    const arrowSpan =
      submitBtn.querySelector(
        '.studio-btn-arrow'
      );

    if (isSubmitting) {
      if (textSpan) {
        textSpan.textContent = isEdit
          ? 'Saving Changes...'
          : 'Saving to Database...';
      }

      if (arrowSpan) {
        arrowSpan.style.display = 'none';
      }

      submitBtn.style.opacity = '0.75';
      submitBtn.style.cursor = 'not-allowed';
    } else {
      if (textSpan) {
        textSpan.textContent = isEdit
          ? 'Save Product Changes'
          : 'Publish Product to Store';
      }

      if (arrowSpan) {
        arrowSpan.style.display =
          'inline-block';
      }

      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
    }
  }

  function resetProductFormToAddMode() {
    const form =
      document.getElementById(
        'newProductForm'
      );

    if (form) {
      delete form.dataset.editId;
      delete form.dataset.editDbId;
      form.reset();
    }

    clearFormErrors();

    [1, 2, 3].forEach((slot) => {
      if (
        typeof window.clearProductSlot ===
        'function'
      ) {
        window.clearProductSlot(slot);
      }
    });

    const titleEl =
      document.getElementById(
        'productModalTitle'
      );

    if (titleEl) {
      titleEl.textContent =
        'Add New Product';
    }

    const subEl =
      document.getElementById(
        'productModalSubheading'
      );

    if (subEl) {
      subEl.textContent =
        'Fill in the details to publish a new piece to your store catalog.';
    }

    const submitBtn =
      document.getElementById(
        'btnSubmitProduct'
      );

    if (submitBtn) {
      const textSpan =
        submitBtn.querySelector(
          '.studio-btn-text'
        );

      if (textSpan) {
        textSpan.textContent =
          'Publish Product to Store';
      }
    }

    const statusEl =
      document.getElementById(
        'studioFooterStatus'
      );

    if (statusEl) {
      statusEl.textContent =
        'Ready to publish to online store';
    }
  }

  function openEditProductModal(prod) {
    if (!prod) return;

    resetProductFormToAddMode();

    const form =
      document.getElementById(
        'newProductForm'
      );

    if (form) {
      form.dataset.editId = prod.id;

      if (prod.dbId) {
        form.dataset.editDbId =
          prod.dbId;
      }
    }

    const titleEl =
      document.getElementById(
        'productModalTitle'
      );

    if (titleEl) {
      titleEl.textContent =
        'Edit Product';
    }

    const subEl =
      document.getElementById(
        'productModalSubheading'
      );

    if (subEl) {
      subEl.textContent =
        `Update specifications for ${prod.title || 'selected item'}`;
    }

    const submitBtn =
      document.getElementById(
        'btnSubmitProduct'
      );

    if (submitBtn) {
      const textSpan =
        submitBtn.querySelector(
          '.studio-btn-text'
        );

      if (textSpan) {
        textSpan.textContent =
          'Save Product Changes';
      }
    }

    const statusEl =
      document.getElementById(
        'studioFooterStatus'
      );

    if (statusEl) {
      statusEl.textContent =
        'Editing existing catalog piece';
    }

    const setVal = (id, val) => {
      const el =
        document.getElementById(id);

      if (el) {
        el.value =
          val !== undefined &&
          val !== null
            ? val
            : '';
      }
    };

    setVal(
      'newProdTitle',
      prod.title || ''
    );

    setVal(
      'newProdEyebrow',
      prod.eyebrow || ''
    );

    setVal(
      'newProdCategory',
      prod.category || 'T-Shirts'
    );

    setVal(
      'newProdPrice',
      prod.price !== undefined
        ? prod.price
        : ''
    );

    setVal(
      'newProdComparePrice',
      prod.compareAtPrice !== undefined
        ? prod.compareAtPrice
        : (prod.compare_price || '')
    );

    setVal(
      'newProdCostPrice',
      prod.costPrice !== undefined
        ? prod.costPrice
        : (prod.cost_price || '')
    );

    setVal(
      'newProdStock',
      prod.stock !== undefined
        ? prod.stock
        : 0
    );

    setVal(
      'newProdStockStatus',
      prod.status ||
      prod.stock_status ||
      'in_stock'
    );

    setVal(
      'newProdSizes',
      prod.sizes || ''
    );

    setVal(
      'newProdColors',
      prod.colors || ''
    );

    setVal(
      'newProdFit',
      prod.fit || ''
    );

    setVal(
      'newProdImage',
      prod.image_url ||
      prod.img ||
      ''
    );

    setVal(
      'newProdImage2',
      prod.image_2_url || ''
    );

    setVal(
      'newProdImage3',
      prod.image_3_url || ''
    );

    setVal(
      'newProdDescription',
      prod.description || ''
    );

    setVal(
      'newProdDetails',
      prod.details || ''
    );

    setVal(
      'newProdCare',
      prod.care || ''
    );

    setVal(
      'newProdDelivery',
      prod.delivery || ''
    );

    setVal(
      'newProdRating',
      prod.rating || 5
    );

    setVal(
      'newProdReviews',
      prod.reviews || 0
    );

    if (
      prod.image_url &&
      typeof window.applySampleImageUrl ===
      'function'
    ) {
      window.applySampleImageUrl(
        1,
        prod.image_url
      );
    }

    if (
      prod.image_2_url &&
      typeof window.applySampleImageUrl ===
      'function'
    ) {
      window.applySampleImageUrl(
        2,
        prod.image_2_url
      );
    }

    if (
      prod.image_3_url &&
      typeof window.applySampleImageUrl ===
      'function'
    ) {
      window.applySampleImageUrl(
        3,
        prod.image_3_url
      );
    }

    if (
      typeof window.openNewProductModal ===
      'function'
    ) {
      window.openNewProductModal(true);
    }
  }

  async function deleteProductHandler(prod, onDone) {
    if (!prod) return;

    let confirmed = false;
    if (typeof window.showConfirmModal === 'function') {
      confirmed = await window.showConfirmModal({
        title: 'Delete Product Piece',
        subtitle: 'This will remove the item from your live catalog.',
        message: `Are you sure you want to permanently delete "${prod.title}"? This action cannot be undone.`,
        confirmText: 'Delete Piece',
        cancelText: 'Keep Piece',
        danger: true,
        item: {
          title: prod.title,
          category: prod.category,
          image: prod.img || prod.image_url || prod.image || '',
          stock: prod.stock,
          price: prod.price
        }
      });
    } else {
      confirmed = window.confirm(
        `Are you sure you want to permanently delete "${prod.title}"? This action cannot be undone.`
      );
    }

    if (!confirmed) return;

    let numericId = null;

    if (
      prod.dbId &&
      Number.isInteger(Number(prod.dbId)) &&
      Number(prod.dbId) > 0
    ) {
      numericId = Number(prod.dbId);
    } else if (
      typeof prod.id === 'string' &&
      prod.id.startsWith('db-')
    ) {
      const parsed =
        Number(
          prod.id.replace('db-', '')
        );

      if (
        Number.isInteger(parsed) &&
        parsed > 0
      ) {
        numericId = parsed;
      }
    } else if (
      typeof prod.id === 'number' &&
      Number.isInteger(prod.id) &&
      prod.id > 0
    ) {
      numericId = prod.id;
    } else if (
      typeof prod.id === 'string' &&
      !isNaN(Number(prod.id)) &&
      Number(prod.id) > 0
    ) {
      numericId = Number(prod.id);
    }

    const token = getAdminToken();

    // If database ID and token exist, attempt deletion on the live backend
    if (numericId && token) {
      try {
        const response =
          await fetch(
            `${BACKEND_BASE_URL}/api/products/${numericId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type':
                  'application/json'
              }
            }
          );

        if (
          !response.ok &&
          response.status !== 404 &&
          response.status !== 401
        ) {
          console.warn('[Velora] Backend delete notice:', response.status);
        }
      } catch (err) {
        console.error(
          '[Velora] Backend delete error:',
          err
        );
      }
    }

    // Always remove from local store catalog
    if (
      Array.isArray(
        window.inventoryData
      )
    ) {
      window.inventoryData =
        window.inventoryData.filter(
          (p) => {
            if (!p) return false;

            if (p === prod) return false;

            if (p.id === prod.id) {
              return false;
            }

            if (
              numericId &&
              (
                p.dbId === numericId ||
                p.id === `db-${numericId}` ||
                p.id === numericId ||
                p.id === String(numericId)
              )
            ) {
              return false;
            }

            return true;
          }
        );
    }

    if (
      typeof window.saveInventory ===
      'function'
    ) {
      window.saveInventory();
    }

    if (
      typeof window.renderInventoryView ===
      'function'
    ) {
      window.renderInventoryView();
    }

    if (
      typeof window.renderOverview ===
      'function'
    ) {
      window.renderOverview();
    }

    // Close view modal if it was open
    if (
      typeof window.closeProductDetailModal ===
      'function'
    ) {
      window.closeProductDetailModal();
    }

    if (typeof onDone === 'function') {
      onDone();
    }

    if (
      typeof window.showToast ===
      'function'
    ) {
      window.showToast(
        `Product "${prod.title}" deleted successfully.`,
        'success'
      );
    }
  }

  async function handleProductFormSubmit(e) {
    if (
      e &&
      typeof e.preventDefault ===
      'function'
    ) {
      e.preventDefault();
    }

    clearFormErrors();

    const rawPayload =
      collectFormData();

    const coreError =
      validateProductData(
        rawPayload
      );

    if (coreError) {
      showFormError(
        coreError.message,
        coreError.fieldId
      );

      return;
    }

    const priceError =
      validateOptionalPrices(
        rawPayload
      );

    if (priceError) {
      showFormError(
        priceError.message,
        priceError.fieldId
      );

      return;
    }

    const token =
      getAdminToken();

    if (!token) {
      showFormError(
        'Authentication required: Please sign in as an admin to save products to the database.'
      );

      if (
        typeof window.openVeloraAuthScreen ===
        'function'
      ) {
        setTimeout(
          () =>
            window.openVeloraAuthScreen(),
          700
        );
      }

      return;
    }

    const form =
      document.getElementById(
        'newProductForm'
      );

    const isEditMode =
      !!(
        form &&
        (
          form.dataset.editId ||
          form.dataset.editDbId
        )
      );

    const editId =
      form
        ? form.dataset.editId
        : null;

    const editDbId =
      form
        ? form.dataset.editDbId
        : null;

    let targetNumericId = null;

    if (
      editDbId &&
      Number.isInteger(Number(editDbId)) &&
      Number(editDbId) > 0
    ) {
      targetNumericId =
        Number(editDbId);
    } else if (
      editId &&
      typeof editId === 'string' &&
      editId.startsWith('db-')
    ) {
      const parsed =
        Number(
          editId.replace('db-', '')
        );

      if (
        Number.isInteger(parsed) &&
        parsed > 0
      ) {
        targetNumericId =
          parsed;
      }
    } else if (
      editId &&
      Number.isInteger(Number(editId)) &&
      Number(editId) > 0
    ) {
      targetNumericId =
        Number(editId);
    }

    const requestBody = {
      title:
        rawPayload.title.trim(),

      eyebrow:
        rawPayload.eyebrow,

      category:
        rawPayload.category.trim(),

      price:
        Number(rawPayload.price),

      compare_price:
        rawPayload.compare_price !== null
          ? Number(
              rawPayload.compare_price
            )
          : null,

      cost_price:
        rawPayload.cost_price !== null
          ? Number(
              rawPayload.cost_price
            )
          : null,

      stock:
        Number(rawPayload.stock),

      stock_status:
        rawPayload.stock_status,

      sizes:
        rawPayload.sizes,

      colors:
        rawPayload.colors,

      fit:
        rawPayload.fit,

      image_url:
        rawPayload.image_url,

      image_2_url:
        rawPayload.image_2_url,

      image_3_url:
        rawPayload.image_3_url,

      description:
        rawPayload.description,

      details:
        rawPayload.details,

      care:
        rawPayload.care,

      delivery:
        rawPayload.delivery,

      rating: 5,

      reviews: 0
    };

    setSubmittingState(
      true,
      isEditMode
    );

    try {
      const endpoint =
        isEditMode &&
        targetNumericId
          ? `${BACKEND_BASE_URL}/api/products/${targetNumericId}`
          : `${BACKEND_BASE_URL}/api/products`;

      const method =
        isEditMode &&
        targetNumericId
          ? 'PUT'
          : 'POST';

      const response =
        await fetch(
          endpoint,
          {
            method,
            headers: {
              'Content-Type':
                'application/json',
              'Authorization':
                `Bearer ${token}`
            },
            body:
              JSON.stringify(
                requestBody
              )
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        if (
          response.status === 401
        ) {
          showFormError(
            'Your admin session has expired or is invalid. Please sign in again.'
          );

          if (
            window.adminAuthApi &&
            typeof window.adminAuthApi.logout ===
              'function'
          ) {
            window.adminAuthApi.logout();
          }

          if (
            typeof window.openVeloraAuthScreen ===
            'function'
          ) {
            window.openVeloraAuthScreen();
          }

          return;
        }

        const errMsg =
          (data &&
            data.message) ||
          `Failed to save product (Error ${response.status})`;

        showFormError(
          errMsg
        );

        return;
      }

      const savedProduct =
        data && data.product
          ? data.product
          : {};

      const successMessage =
        (data && data.message) ||
        (
          isEditMode
            ? 'Product updated successfully.'
            : 'Product created successfully.'
        );

      const formattedItem = {
        id:
          savedProduct.id
            ? `db-${savedProduct.id}`
            : (
                editId ||
                `db-${Date.now()}`
              ),

        dbId:
          savedProduct.id ||
          targetNumericId ||
          null,

        title:
          savedProduct.title ||
          requestBody.title,

        eyebrow:
          savedProduct.eyebrow ||
          requestBody.eyebrow ||
          'Velora Atelier',

        category:
          savedProduct.category ||
          requestBody.category,

        price:
          Number(
            savedProduct.price ||
            requestBody.price
          ),

        compareAtPrice:
          savedProduct.compare_price !==
            null &&
          savedProduct.compare_price !==
            undefined
            ? Number(
                savedProduct.compare_price
              )
            : requestBody.compare_price,

        costPrice:
          savedProduct.cost_price !==
            null &&
          savedProduct.cost_price !==
            undefined
            ? Number(
                savedProduct.cost_price
              )
            : requestBody.cost_price,

        stock:
          Number(
            savedProduct.stock !==
              undefined
              ? savedProduct.stock
              : requestBody.stock
          ),

        status:
          savedProduct.stock_status ||
          requestBody.stock_status,

        stock_status:
          savedProduct.stock_status ||
          requestBody.stock_status,

        img:
          savedProduct.image_url ||
          requestBody.image_url ||
          'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',

        image_url:
          savedProduct.image_url ||
          requestBody.image_url,

        image_2_url:
          savedProduct.image_2_url ||
          requestBody.image_2_url,

        image_3_url:
          savedProduct.image_3_url ||
          requestBody.image_3_url,

        sizes:
          savedProduct.sizes ||
          requestBody.sizes ||
          '',

        colors:
          savedProduct.colors ||
          requestBody.colors ||
          '',

        fit:
          savedProduct.fit ||
          requestBody.fit ||
          '',

        details:
          savedProduct.details ||
          requestBody.details ||
          '',

        description:
          savedProduct.description ||
          requestBody.description ||
          '',

        care:
          savedProduct.care ||
          requestBody.care ||
          '',

        delivery:
          savedProduct.delivery ||
          requestBody.delivery ||
          '',

        rating:
          Number(
            savedProduct.rating
          ) || 5,

        reviews:
          Number(
            savedProduct.reviews
          ) || 0,

        createdAt:
          savedProduct.created_at ||
          new Date().toISOString()
      };

      if (
        !Array.isArray(
          window.inventoryData
        )
      ) {
        window.inventoryData = [];
      }

      if (isEditMode) {
        const idx =
          window.inventoryData.findIndex(
            (p) =>
              p &&
              (
                p.id === editId ||
                (
                  targetNumericId &&
                  p.dbId ===
                    targetNumericId
                ) ||
                (
                  targetNumericId &&
                  p.id ===
                    `db-${targetNumericId}`
                )
              )
          );

        if (idx !== -1) {
          window.inventoryData[idx] = {
            ...window.inventoryData[idx],
            ...formattedItem
          };
        } else {
          window.inventoryData.unshift(
            formattedItem
          );
        }
      } else {
        window.inventoryData.unshift(
          formattedItem
        );
      }

      if (
        typeof window.saveInventory ===
        'function'
      ) {
        window.saveInventory();
      }

      if (
        typeof window.renderInventoryView ===
        'function'
      ) {
        window.renderInventoryView();
      }

      if (
        typeof window.renderOverview ===
        'function'
      ) {
        window.renderOverview();
      }

      if (
        typeof window.showToast ===
        'function'
      ) {
        window.showToast(
          successMessage,
          'success'
        );
      }

      resetProductFormToAddMode();

      if (
        typeof window.closeNewProductModal ===
        'function'
      ) {
        window.closeNewProductModal();
      }
    } catch (err) {
      console.error(
        '[Velora] Error saving product to backend:',
        err
      );

      showFormError(
        'Network error: Unable to reach product server. Please check your internet connection.'
      );
    } finally {
      setSubmittingState(
        false,
        isEditMode
      );
    }
  }

  async function fetchProductsFromDatabase() {
    const token =
      getAdminToken();

    if (!token) return;

    try {
      const response =
        await fetch(
          `${BACKEND_BASE_URL}/api/products`,
          {
            method: 'GET',
            headers: {
              'Authorization':
                `Bearer ${token}`,
              'Content-Type':
                'application/json'
            }
          }
        );

      if (!response.ok) return;

      const data =
        await response
          .json()
          .catch(() => null);

      if (
        data &&
        Array.isArray(data.products)
      ) {
        const dbProducts =
          data.products.map((p) => ({
            id:
              `db-${p.id}`,

            dbId:
              p.id,

            title:
              p.title,

            eyebrow:
              p.eyebrow ||
              'Velora Atelier',

            category:
              p.category,

            price:
              Number(p.price),

            compareAtPrice:
              p.compare_price
                ? Number(
                    p.compare_price
                  )
                : null,

            costPrice:
              p.cost_price
                ? Number(
                    p.cost_price
                  )
                : null,

            stock:
              Number(p.stock),

            status:
              p.stock_status ||
              'in_stock',

            stock_status:
              p.stock_status ||
              'in_stock',

            img:
              p.image_url ||
              'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',

            image_url:
              p.image_url,

            image_2_url:
              p.image_2_url,

            image_3_url:
              p.image_3_url,

            sizes:
              p.sizes || '',

            colors:
              p.colors || '',

            fit:
              p.fit || '',

            details:
              p.details || '',

            description:
              p.description || '',

            care:
              p.care || '',

            delivery:
              p.delivery || '',

            rating:
              Number(p.rating) || 5,

            reviews:
              Number(p.reviews) || 0,

            createdAt:
              p.created_at ||
              new Date().toISOString()
          }));

        window.inventoryData =
          dbProducts;

        if (
          typeof window.saveInventory ===
          'function'
        ) {
          window.saveInventory();
        }

        if (
          typeof window.renderInventoryView ===
          'function'
        ) {
          window.renderInventoryView();
        }

        if (
          typeof window.renderOverview ===
          'function'
        ) {
          window.renderOverview();
        }
      }
    } catch (err) {
      console.warn(
        '[Velora] Note: Could not fetch initial DB products:',
        err
      );
    }
  }

  function initProductLogic() {
    const form =
      document.getElementById(
        'newProductForm'
      );

    if (!form) return;

    if (!form._hasProductLogicBound) {
      form._hasProductLogicBound =
        true;

      form.addEventListener(
        'submit',
        handleProductFormSubmit
      );
    }

    const inputs =
      form.querySelectorAll(
        'input, select, textarea'
      );

    inputs.forEach((input) => {
      input.addEventListener(
        'input',
        () => {
          if (
            input.classList.contains(
              'is-invalid'
            )
          ) {
            input.classList.remove(
              'is-invalid'
            );
          }

          const alertBox =
            document.getElementById(
              'productFormAlert'
            );

          if (
            alertBox &&
            alertBox.style.display !==
              'none'
          ) {
            alertBox.style.display =
              'none';
          }
        }
      );
    });
  }

  window.initProductLogic =
    initProductLogic;

  window.handleProductFormSubmit =
    handleProductFormSubmit;

  window.fetchProductsFromDatabase =
    fetchProductsFromDatabase;

  window.openEditProductModal =
    openEditProductModal;

  window.deleteProductHandler =
    deleteProductHandler;

  window.resetProductFormToAddMode =
    resetProductFormToAddMode;

  window.validateProductData =
    validateProductData;

  window.validateOptionalPrices =
    validateOptionalPrices;

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        initProductLogic();
        fetchProductsFromDatabase();
      }
    );
  } else {
    initProductLogic();
    fetchProductsFromDatabase();
  }
})();