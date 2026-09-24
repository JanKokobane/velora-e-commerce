window.openNewProductModal = function() {
  const modal = document.getElementById('newProductModal');
  if (modal) {
    modal.classList.add('open');
  }
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

// Safe fallback for any external calls
window.updateStudioProductPreview = function() {};

window.initModals = function() {
  // 1. Product Form Elements & Bindings
  const prodForm = document.getElementById('newProductForm');
  if (prodForm && !prodForm._hasStudioInitialized) {
    prodForm._hasStudioInitialized = true;

    // Quick Category Chips
    const catChips = document.querySelectorAll('.studio-cat-chip');
    const catSelect = document.getElementById('newProdCategory');
    if (catChips.length && catSelect) {
      catChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const selectedCat = chip.getAttribute('data-cat');
          if (selectedCat) {
            catSelect.value = selectedCat;
            catChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
          }
        });
      });

      catSelect.addEventListener('change', () => {
        const val = catSelect.value;
        catChips.forEach(chip => {
          if (chip.getAttribute('data-cat') === val) {
            chip.classList.add('active');
          } else {
            chip.classList.remove('active');
          }
        });
      });
    }

    // Quick Sizing Preset Chips (Apparel & Denim)
    const sizeChips = document.querySelectorAll('.studio-size-chip');
    const sizesInput = document.getElementById('newProdSizes');
    if (sizeChips.length && sizesInput) {
      sizeChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const val = chip.getAttribute('data-size');
          if (!val) return;

          let currentSizes = sizesInput.value
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

          if (currentSizes.includes(val)) {
            // Unselect / remove size
            currentSizes = currentSizes.filter(s => s !== val);
            chip.classList.remove('active');
          } else {
            // Select / add size
            currentSizes.push(val);
            chip.classList.add('active');
          }

          sizesInput.value = currentSizes.join(', ');
        });
      });
    }

    // Stock Stepper buttons
    const stepBtns = document.querySelectorAll('.studio-stock-step-btn');
    const stockInput = document.getElementById('newProdStock');
    if (stepBtns.length && stockInput) {
      stepBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const delta = parseInt(btn.getAttribute('data-step'), 10) || 0;
          const current = parseInt(stockInput.value, 10) || 0;
          stockInput.value = Math.max(0, current + delta);
        });
      });
    }

    // Image Input Mode Toggles (URL vs File Upload)
    const tabUrl = document.getElementById('tabModeUrl');
    const tabUpload = document.getElementById('tabModeUpload');
    const boxUrl = document.getElementById('boxMainImageUrl');
    const boxUpload = document.getElementById('boxMainImageUpload');

    if (tabUrl && tabUpload && boxUrl && boxUpload) {
      tabUrl.addEventListener('click', () => {
        tabUrl.classList.add('active');
        tabUpload.classList.remove('active');
        boxUrl.style.display = 'block';
        boxUpload.style.display = 'none';
      });

      tabUpload.addEventListener('click', () => {
        tabUpload.classList.add('active');
        tabUrl.classList.remove('active');
        boxUrl.style.display = 'none';
        boxUpload.style.display = 'block';
      });
    }

    // Main Image File Reader & Drag-and-Drop
    const mainFile = document.getElementById('newProdImageFile');
    const mainImgUrl = document.getElementById('newProdImage');
    const dropzonePrompt = document.getElementById('dropzonePrompt');

    function handleSelectedFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        if (mainImgUrl) {
          mainImgUrl.value = evt.target.result;
        }
        if (dropzonePrompt) {
          dropzonePrompt.textContent = `Attached: ${file.name}`;
        }
        if (typeof window.showToast === 'function') {
          window.showToast(`Loaded ${file.name} for product imagery.`);
        }
      };
      reader.readAsDataURL(file);
    }

    if (mainFile) {
      mainFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        handleSelectedFile(file);
      });
    }

    if (boxUpload) {
      ['dragenter', 'dragover'].forEach(evtName => {
        boxUpload.addEventListener(evtName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          boxUpload.style.borderColor = '#c9a57a';
          boxUpload.style.background = '#fefdfa';
        }, false);
      });

      ['dragleave', 'drop'].forEach(evtName => {
        boxUpload.addEventListener(evtName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          boxUpload.style.borderColor = 'rgba(201, 165, 122, 0.5)';
          boxUpload.style.background = '#faf8f5';
        }, false);
      });

      boxUpload.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt && dt.files && dt.files[0];
        handleSelectedFile(file);
      });
    }

    // Secondary Gallery File Readers
    const file2 = document.getElementById('newProdImage2File');
    const input2 = document.getElementById('newProdImage2');
    if (file2 && input2) {
      file2.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            input2.value = evt.target.result;
            if (typeof window.showToast === 'function') window.showToast('Gallery image 2 loaded');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const file3 = document.getElementById('newProdImage3File');
    const input3 = document.getElementById('newProdImage3');
    if (file3 && input3) {
      file3.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            input3.value = evt.target.result;
            if (typeof window.showToast === 'function') window.showToast('Gallery image 3 loaded');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Lookbook Preset Chips
    const presetChips = document.querySelectorAll('.studio-preset-chip');
    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const img = chip.getAttribute('data-img');
        const title = chip.getAttribute('data-title');
        const cat = chip.getAttribute('data-cat');
        const price = chip.getAttribute('data-price');

        if (mainImgUrl && img) mainImgUrl.value = img;
        const titleEl = document.getElementById('newProdTitle');
        if (titleEl && title) titleEl.value = title;
        if (catSelect && cat) {
          catSelect.value = cat;
          catChips.forEach(c => {
            if (c.getAttribute('data-cat') === cat) c.classList.add('active');
            else c.classList.remove('active');
          });
        }
        const priceEl = document.getElementById('newProdPrice');
        if (priceEl && price) priceEl.value = price;

        if (typeof window.showToast === 'function') {
          window.showToast(`Applied preset: ${title}`);
        }
      });
    });

    // Sample Autofill Trigger (E-commerce ready)
    const btnSample = document.getElementById('btnFillSampleProduct');
    if (btnSample) {
      btnSample.addEventListener('click', () => {
        const samplePiece = {
          title: 'Heavyweight Boxy Vintage Tee',
          sku: 'VEL-TEE-9021',
          barcode: '6009876543210',
          eyebrow: 'Core Streetwear Essentials',
          category: 'T-Shirts',
          price: '550',
          comparePrice: '690',
          costPrice: '180',
          stock: '45',
          status: 'active',
          img: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
          description: 'Constructed from premium 280 GSM combed organic cotton with a dry hand feel. Features drop shoulders, tight ribbed crew collar, and blind-stitch hems tailored for a relaxed architectural drape.',
          sizes: 'S, M, L, XL',
          fit: 'Relaxed Oversized Boxy',
          details: '100% Combed Organic Cotton, 280 GSM Heavyweight Jersey, Pre-shrunk, Silicone garment wash',
          delivery: 'Nationwide 2-4 business day courier across South Africa. Free delivery on orders over R800.',
          care: 'Machine wash cold inside out with like colours. Hang dry in shade. Do not iron directly on graphics.'
        };

        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.value = val;
        };

        setVal('newProdTitle', samplePiece.title);
        setVal('newProdSku', samplePiece.sku);
        setVal('newProdBarcode', samplePiece.barcode);
        setVal('newProdEyebrow', samplePiece.eyebrow);
        setVal('newProdCategory', samplePiece.category);
        setVal('newProdPrice', samplePiece.price);
        setVal('newProdComparePrice', samplePiece.comparePrice);
        setVal('newProdCostPrice', samplePiece.costPrice);
        setVal('newProdStock', samplePiece.stock);
        setVal('newProdStatus', samplePiece.status);
        setVal('newProdImage', samplePiece.img);
        setVal('newProdDescription', samplePiece.description);
        setVal('newProdSizes', samplePiece.sizes);
        setVal('newProdFit', samplePiece.fit);
        setVal('newProdDetails', samplePiece.details);
        setVal('newProdDelivery', samplePiece.delivery);
        setVal('newProdCare', samplePiece.care);

        // Update category chip active state
        catChips.forEach(c => {
          if (c.getAttribute('data-cat') === samplePiece.category) c.classList.add('active');
          else c.classList.remove('active');
        });

        // Update size chips active state
        const sampleSizes = samplePiece.sizes.split(',').map(s => s.trim());
        sizeChips.forEach(chip => {
          if (sampleSizes.includes(chip.getAttribute('data-size'))) {
            chip.classList.add('active');
          } else {
            chip.classList.remove('active');
          }
        });

        if (typeof window.showToast === 'function') {
          window.showToast('Autofilled sample T-Shirt product.');
        }
      });
    }

    // Product Form Submission & Database Integration is managed by js/productLogic.js
    if (typeof window.initProductLogic === 'function') {
      window.initProductLogic();
    }
  }

  // 2. New Customer Form Submission
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

      if (!Array.isArray(window.customersData)) {
        window.customersData = [];
      }

      window.customersData.unshift(newCust);
      if (typeof window.saveCustomers === 'function') {
        window.saveCustomers();
      }

      custForm.reset();
      window.closeNewCustomerModal();
      if (typeof window.showToast === 'function') {
        window.showToast(`Client ${name} registered successfully.`);
      }

      if (typeof window.renderCustomersView === 'function') {
        window.renderCustomersView();
      }
    });
  }

  // 3. Close modals on backdrop click
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

/**
 * Global Studio Confirmation Modal
 * Returns a Promise<boolean> that resolves to true if confirmed, false if cancelled.
 */
window.showConfirmModal = function({
  title = 'Confirm Action',
  subtitle = 'Please verify before proceeding.',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
  item = null
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('veloraConfirmModal');
    if (!modal) {
      const fallback = window.confirm(`${title}\n\n${message}`);
      resolve(fallback);
      return;
    }

    const titleEl = document.getElementById('confirmModalTitle');
    const subtitleEl = document.getElementById('confirmModalSubtitle');
    const msgEl = document.getElementById('confirmModalMessage');
    const cancelBtn = document.getElementById('confirmModalCancelBtn');
    const actionBtn = document.getElementById('confirmModalActionBtn');
    const closeBtn = document.getElementById('confirmModalCloseBtn');
    const previewEl = document.getElementById('confirmItemPreview');

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    if (msgEl) msgEl.textContent = message;
    if (cancelBtn) cancelBtn.textContent = cancelText;

    if (actionBtn) {
      actionBtn.textContent = confirmText;
      actionBtn.className = danger ? 'confirm-btn-action is-danger' : 'confirm-btn-action';
    }

    if (previewEl) {
      if (item && (item.title || item.image)) {
        previewEl.style.display = 'flex';
        const imgEl = document.getElementById('confirmItemImg');
        const catEl = document.getElementById('confirmItemCat');
        const titEl = document.getElementById('confirmItemTitle');
        const metaEl = document.getElementById('confirmItemMeta');

        if (imgEl) {
          imgEl.src = item.image || 'https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=150&w=150';
          imgEl.alt = item.title || 'Product';
        }
        if (catEl) catEl.textContent = item.category || 'Piece';
        if (titEl) titEl.textContent = item.title || '';
        if (metaEl) {
          const parts = [];
          if (item.stock !== undefined) parts.push(`${item.stock} in stock`);
          if (item.price !== undefined) {
            parts.push(typeof window.fmtPrice === 'function' ? window.fmtPrice(item.price) : `R${item.price}`);
          }
          metaEl.textContent = parts.join(' · ') || '';
        }
      } else {
        previewEl.style.display = 'none';
      }
    }

    let settled = false;

    const cleanup = (result) => {
      if (settled) return;
      settled = true;
      modal.classList.remove('open');
      if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
      if (actionBtn) actionBtn.removeEventListener('click', onConfirm);
      if (closeBtn) closeBtn.removeEventListener('click', onCancel);
      window.removeEventListener('keydown', onKeyDown);
      modal.removeEventListener('click', onBackdropClick);
      resolve(result);
    };

    const onCancel = (e) => {
      if (e) e.preventDefault();
      cleanup(false);
    };

    const onConfirm = (e) => {
      if (e) e.preventDefault();
      cleanup(true);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel(e);
      } else if (e.key === 'Enter') {
        onConfirm(e);
      }
    };

    const onBackdropClick = (e) => {
      if (e.target === modal) {
        onCancel(e);
      }
    };

    if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
    if (actionBtn) actionBtn.addEventListener('click', onConfirm);
    if (closeBtn) closeBtn.addEventListener('click', onCancel);
    window.addEventListener('keydown', onKeyDown);
    modal.addEventListener('click', onBackdropClick);

    modal.classList.add('open');
    if (actionBtn) actionBtn.focus();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initModals);
} else {
  window.initModals();
}

