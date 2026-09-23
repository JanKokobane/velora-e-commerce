/**
 * Modals & Dialog Controllers (js/modals.js)
 * Pure DOM implementation with NO innerHTML.
 */

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

    // Product Form Submission
    prodForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const titleInput = document.getElementById('newProdTitle');
      const skuInput = document.getElementById('newProdSku');
      const barcodeInput = document.getElementById('newProdBarcode');
      const priceInput = document.getElementById('newProdPrice');
      const comparePriceInput = document.getElementById('newProdComparePrice');
      const costPriceInput = document.getElementById('newProdCostPrice');
      const catInput = document.getElementById('newProdCategory');
      const stockInput = document.getElementById('newProdStock');
      const statusInput = document.getElementById('newProdStatus');
      const imgInput = document.getElementById('newProdImage');
      const eyebrowInput = document.getElementById('newProdEyebrow');
      const descInput = document.getElementById('newProdDescription');
      const sizesInput = document.getElementById('newProdSizes');
      const fitInput = document.getElementById('newProdFit');
      const detailsInput = document.getElementById('newProdDetails');
      const deliveryInput = document.getElementById('newProdDelivery');
      const careInput = document.getElementById('newProdCare');
      const img2Input = document.getElementById('newProdImage2');
      const img3Input = document.getElementById('newProdImage3');

      const title = titleInput ? titleInput.value.trim() : '';
      const price = priceInput ? parseFloat(priceInput.value) : 0;
      const compareAtPrice = comparePriceInput && comparePriceInput.value ? parseFloat(comparePriceInput.value) : null;
      const costPrice = costPriceInput && costPriceInput.value ? parseFloat(costPriceInput.value) : null;
      const category = catInput ? catInput.value : 'T-Shirts';
      const stock = stockInput ? parseInt(stockInput.value, 10) : 10;
      const status = statusInput ? statusInput.value : 'active';
      const sku = (skuInput && skuInput.value.trim()) || `VEL-${category.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const barcode = (barcodeInput && barcodeInput.value.trim()) || '';
      const img = imgInput && imgInput.value.trim()
        ? imgInput.value.trim()
        : 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

      if (!title) {
        if (typeof window.showToast === 'function') window.showToast('Please enter a product title');
        if (titleInput) titleInput.focus();
        return;
      }

      if (isNaN(price) || price < 0) {
        if (typeof window.showToast === 'function') window.showToast('Please enter a valid retail price');
        if (priceInput) priceInput.focus();
        return;
      }

      const submitBtn = document.getElementById('btnSubmitProduct');
      if (submitBtn) {
        submitBtn.disabled = true;
        const textSpan = submitBtn.querySelector('.studio-btn-text');
        if (textSpan) textSpan.textContent = 'Publishing...';
      }

      const newProduct = {
        id: `prod-${Date.now()}`,
        sku,
        barcode,
        title,
        category,
        price,
        compareAtPrice,
        costPrice,
        stock,
        status,
        img,
        eyebrow: (eyebrowInput && eyebrowInput.value.trim()) || 'Core Collection',
        description: (descInput && descInput.value.trim()) || '',
        sizes: (sizesInput && sizesInput.value.trim()) || '',
        fit: (fitInput && fitInput.value.trim()) || '',
        details: (detailsInput && detailsInput.value.trim()) || '',
        delivery: (deliveryInput && deliveryInput.value.trim()) || '',
        care: (careInput && careInput.value.trim()) || '',
        galleryImages: [
          img2Input && img2Input.value.trim(),
          img3Input && img3Input.value.trim()
        ].filter(Boolean),
        rating: 5,
        reviews: 0
      };

      if (!Array.isArray(window.inventoryData)) {
        window.inventoryData = [];
      }

      window.inventoryData.unshift(newProduct);
      if (typeof window.saveInventory === 'function') {
        window.saveInventory();
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          const textSpan = submitBtn.querySelector('.studio-btn-text');
          if (textSpan) textSpan.textContent = 'Publish to Catalog';
        }

        window.closeNewProductModal();
        if (typeof window.showToast === 'function') {
          window.showToast(`Product "${title}" successfully published to catalog.`);
        }

        if (typeof window.renderInventoryView === 'function') {
          window.renderInventoryView();
        }
      }, 250);
    });
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initModals);
} else {
  window.initModals();
}

