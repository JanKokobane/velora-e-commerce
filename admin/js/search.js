/**
 * Velora Unified Global Search Controller (js/search.js)
 * Implements real-time instant search across Orders, Catalog, Customers, Payments, and Pages.
 * Pure DOM implementation with NO innerHTML.
 */

(function() {
  'use strict';

  let currentSearchQuery = '';
  let activeCategory = 'all';
  let activeItemIndex = -1;
  let flattenedResultItems = [];

  const NAVIGATION_TARGETS = [
    {
      id: 'nav-dashboard',
      type: 'page',
      title: 'Store Overview / Dashboard',
      subtitle: 'Real-time sales KPI metrics, orders activity, revenue breakdown',
      icon: '📊',
      tab: 'dashboard'
    },
    {
      id: 'nav-orders',
      type: 'page',
      title: 'Orders Management',
      subtitle: 'Customer purchases, courier waybills, dispatch & fulfillment statuses',
      icon: '📦',
      tab: 'orders'
    },
    {
      id: 'nav-returns',
      type: 'page',
      title: 'Returns & Exchanges (RMA)',
      subtitle: 'Customer return requests, inspection states, and refund authorizations',
      icon: '↶',
      tab: 'returns'
    },
    {
      id: 'nav-inventory',
      type: 'page',
      title: 'Catalog & Stock Inventory',
      subtitle: 'Products catalog, SKU inventory, unit restocking & deduplication',
      icon: '🏷️',
      tab: 'inventory'
    },
    {
      id: 'nav-customers',
      type: 'page',
      title: 'Client Registry (Customers)',
      subtitle: 'VIP tiers, lifetime spend, purchase history and buyer directory',
      icon: '👤',
      tab: 'customers'
    },
    {
      id: 'nav-payments',
      type: 'page',
      title: 'Payments & Settlements',
      subtitle: 'Ozow Instant EFT, SnapScan, Visa/Mastercard transaction logs',
      icon: '💳',
      tab: 'payments'
    },
    {
      id: 'nav-notifications',
      type: 'page',
      title: 'Notifications Center',
      subtitle: 'Store order alerts, logistics dispatches, low stock warnings',
      icon: '🔔',
      tab: 'notifications'
    },
    {
      id: 'nav-settings',
      type: 'page',
      title: 'Operations & Currency Settings',
      subtitle: 'Country currency rates, tax VAT, courier shipping tiers, and store profile',
      icon: '⚙️',
      tab: 'settings'
    },
    {
      id: 'act-new-product',
      type: 'action',
      title: 'Add New Product',
      subtitle: 'Publish a new item with price, stock, category & photography',
      icon: '➕',
      action: () => {
        if (typeof window.openNewProductModal === 'function') {
          window.openNewProductModal();
        }
      }
    },
    {
      id: 'act-new-customer',
      type: 'action',
      title: 'Register New Client',
      subtitle: 'Create a new customer profile with initial order records',
      icon: '👥',
      action: () => {
        if (typeof window.openNewCustomerModal === 'function') {
          window.openNewCustomerModal();
        }
      }
    }
  ];

  const QUICK_SUGGESTIONS = [
    { label: 'Paid Orders', query: 'Paid' },
    { label: 'In-Transit Orders', query: 'Transit' },
    { label: 'Leather Bags', query: 'leather' },
    { label: 'Low Stock Items', query: 'stock' },
    { label: 'VIP Clients', query: 'VIP' },
    { label: 'Ozow Payments', query: 'Ozow' }
  ];

  // Helper: Create highlighted text span without innerHTML
  function createHighlightedFragment(text, query) {
    const container = document.createDocumentFragment();
    if (!query || !query.trim()) {
      container.appendChild(document.createTextNode(text || ''));
      return container;
    }

    const str = String(text || '');
    const q = query.trim().toLowerCase();
    let lowerStr = str.toLowerCase();
    let startIdx = 0;
    let matchIdx = lowerStr.indexOf(q, startIdx);

    if (matchIdx === -1) {
      container.appendChild(document.createTextNode(str));
      return container;
    }

    while (matchIdx !== -1) {
      if (matchIdx > startIdx) {
        container.appendChild(document.createTextNode(str.substring(startIdx, matchIdx)));
      }

      const mark = document.createElement('mark');
      mark.className = 'search-highlight';
      mark.textContent = str.substring(matchIdx, matchIdx + q.length);
      container.appendChild(mark);

      startIdx = matchIdx + q.length;
      matchIdx = lowerStr.indexOf(q, startIdx);
    }

    if (startIdx < str.length) {
      container.appendChild(document.createTextNode(str.substring(startIdx)));
    }

    return container;
  }

  // Search in Orders
  function searchOrders(q) {
    const orders = window.ordersData || [];
    if (!q) return [];
    const query = q.toLowerCase();

    return orders.filter(order => {
      const matchId = (order.id || '').toLowerCase().includes(query);
      const matchName = (order.customer?.fullName || '').toLowerCase().includes(query);
      const matchEmail = (order.customer?.email || '').toLowerCase().includes(query);
      const matchPhone = (order.customer?.phone || '').toLowerCase().includes(query);
      const matchWaybill = (order.waybill || '').toLowerCase().includes(query);
      const matchStatus = (order.status || '').toLowerCase().includes(query);
      const matchItems = (order.items || []).some(item => (item.title || '').toLowerCase().includes(query));

      return matchId || matchName || matchEmail || matchPhone || matchWaybill || matchStatus || matchItems;
    });
  }

  // Search in Catalog / Inventory
  function searchProducts(q) {
    const products = window.inventoryData || [];
    if (!q) return [];
    const query = q.toLowerCase();

    return products.filter(prod => {
      const matchTitle = (prod.title || '').toLowerCase().includes(query);
      const matchCategory = (prod.category || '').toLowerCase().includes(query);
      const matchSku = (prod.sku || '').toLowerCase().includes(query);
      const matchPrice = String(prod.price || '').includes(query);

      return matchTitle || matchCategory || matchSku || matchPrice;
    });
  }

  // Search in Customers
  function searchCustomers(q) {
    const customers = window.customersData || [];
    if (!q) return [];
    const query = q.toLowerCase();

    return customers.filter(cust => {
      const matchName = (cust.name || '').toLowerCase().includes(query);
      const matchEmail = (cust.email || '').toLowerCase().includes(query);
      const matchPhone = (cust.phone || '').toLowerCase().includes(query);
      const matchCity = (cust.city || '').toLowerCase().includes(query);
      const matchTier = (cust.tier || '').toLowerCase().includes(query);

      return matchName || matchEmail || matchPhone || matchCity || matchTier;
    });
  }

  // Search in Payments
  function searchPayments(q) {
    const payments = window.paymentsData || [];
    if (!q) return [];
    const query = q.toLowerCase();

    return payments.filter(pay => {
      const matchRef = (pay.ref || '').toLowerCase().includes(query);
      const matchOrder = (pay.orderId || '').toLowerCase().includes(query);
      const matchCust = (pay.customer || '').toLowerCase().includes(query);
      const matchGateway = (pay.gateway || '').toLowerCase().includes(query);
      const matchStatus = (pay.status || '').toLowerCase().includes(query);
      const matchBank = (pay.bank || '').toLowerCase().includes(query);

      return matchRef || matchOrder || matchCust || matchGateway || matchStatus || matchBank;
    });
  }

  // Search in Navigation / Pages
  function searchPages(q) {
    if (!q) return NAVIGATION_TARGETS;
    const query = q.toLowerCase();

    return NAVIGATION_TARGETS.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchSub = item.subtitle.toLowerCase().includes(query);
      return matchTitle || matchSub;
    });
  }

  // Public Search Modal Open/Close Methods
  window.openHeaderSearch = function() {
    const popover = document.getElementById('headerSearchPopover');
    const searchBox = document.getElementById('headerSearchBox');
    const input = document.getElementById('headerGlobalSearchInput');
    const container = document.getElementById('topbarSearchContainer');

    if (popover) popover.style.display = 'flex';
    if (searchBox) searchBox.classList.add('focused');
    if (container && window.innerWidth <= 768) {
      container.classList.add('mobile-active');
    }
    if (input) {
      input.focus();
      currentSearchQuery = input.value.trim();
    }

    renderSearchResults();
  };

  window.closeHeaderSearch = function() {
    const popover = document.getElementById('headerSearchPopover');
    const searchBox = document.getElementById('headerSearchBox');
    const container = document.getElementById('topbarSearchContainer');
    const input = document.getElementById('headerGlobalSearchInput');

    if (popover) popover.style.display = 'none';
    if (searchBox) searchBox.classList.remove('focused');
    if (container) container.classList.remove('mobile-active');
    if (input) input.blur();

    activeItemIndex = -1;
    flattenedResultItems = [];
  };

  // Switch Category Tab
  function setCategoryTab(tab) {
    activeCategory = tab;
    document.querySelectorAll('.search-tab-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-search-tab') === tab);
    });
    activeItemIndex = -1;
    renderSearchResults();
  }

  // Build Results Viewport
  function renderSearchResults() {
    const viewport = document.getElementById('searchResultsViewport');
    if (!viewport) return;

    viewport.replaceChildren();
    flattenedResultItems = [];

    const query = currentSearchQuery;

    // Get matches
    const orderResults = searchOrders(query);
    const productResults = searchProducts(query);
    const customerResults = searchCustomers(query);
    const paymentResults = searchPayments(query);
    const pageResults = searchPages(query);

    // Update Tab Counts
    const totalMatches = orderResults.length + productResults.length + customerResults.length + paymentResults.length + (query ? pageResults.length : 0);

    updateCountBadge('searchCountAll', totalMatches);
    updateCountBadge('searchCountOrders', orderResults.length);
    updateCountBadge('searchCountProducts', productResults.length);
    updateCountBadge('searchCountCustomers', customerResults.length);
    updateCountBadge('searchCountPayments', paymentResults.length);

    // If query is empty, render Quick Navigation & Suggestions
    if (!query) {
      renderEmptyStateSuggestions(viewport, pageResults);
      updateActiveHighlight();
      return;
    }

    // Check if totally empty results
    let hasAnyResults = false;
    if (activeCategory === 'all') {
      hasAnyResults = totalMatches > 0;
    } else if (activeCategory === 'orders') {
      hasAnyResults = orderResults.length > 0;
    } else if (activeCategory === 'products') {
      hasAnyResults = productResults.length > 0;
    } else if (activeCategory === 'customers') {
      hasAnyResults = customerResults.length > 0;
    } else if (activeCategory === 'payments') {
      hasAnyResults = paymentResults.length > 0;
    } else if (activeCategory === 'pages') {
      hasAnyResults = pageResults.length > 0;
    }

    if (!hasAnyResults) {
      renderZeroResults(viewport, query);
      return;
    }

    // Render grouped categories
    if ((activeCategory === 'all' || activeCategory === 'orders') && orderResults.length > 0) {
      renderGroupHeader(viewport, 'Orders', orderResults.length);
      orderResults.forEach(order => {
        const itemEl = createOrderItem(order, query);
        viewport.appendChild(itemEl);
        flattenedResultItems.push({
          el: itemEl,
          action: () => {
            if (typeof window.switchTab === 'function') window.switchTab('orders');
            if (typeof window.selectAndOpenOrder === 'function') {
              setTimeout(() => window.selectAndOpenOrder(order.id), 50);
            }
            window.closeHeaderSearch();
          }
        });
      });
    }

    if ((activeCategory === 'all' || activeCategory === 'products') && productResults.length > 0) {
      renderGroupHeader(viewport, 'Catalog & Stock', productResults.length);
      productResults.forEach(prod => {
        const itemEl = createProductItem(prod, query);
        viewport.appendChild(itemEl);
        flattenedResultItems.push({
          el: itemEl,
          action: () => {
            if (typeof window.switchTab === 'function') window.switchTab('inventory');
            window.closeHeaderSearch();
          }
        });
      });
    }

    if ((activeCategory === 'all' || activeCategory === 'customers') && customerResults.length > 0) {
      renderGroupHeader(viewport, 'Customers Registry', customerResults.length);
      customerResults.forEach(cust => {
        const itemEl = createCustomerItem(cust, query);
        viewport.appendChild(itemEl);
        flattenedResultItems.push({
          el: itemEl,
          action: () => {
            if (typeof window.switchTab === 'function') window.switchTab('customers');
            window.closeHeaderSearch();
          }
        });
      });
    }

    if ((activeCategory === 'all' || activeCategory === 'payments') && paymentResults.length > 0) {
      renderGroupHeader(viewport, 'Payments & Settlements', paymentResults.length);
      paymentResults.forEach(pay => {
        const itemEl = createPaymentItem(pay, query);
        viewport.appendChild(itemEl);
        flattenedResultItems.push({
          el: itemEl,
          action: () => {
            if (typeof window.switchTab === 'function') window.switchTab('payments');
            window.closeHeaderSearch();
          }
        });
      });
    }

    if ((activeCategory === 'all' || activeCategory === 'pages') && pageResults.length > 0) {
      renderGroupHeader(viewport, 'Navigation & Quick Actions', pageResults.length);
      pageResults.forEach(page => {
        const itemEl = createNavigationItem(page, query);
        viewport.appendChild(itemEl);
        flattenedResultItems.push({
          el: itemEl,
          action: () => {
            if (page.action) {
              page.action();
            } else if (page.tab && typeof window.switchTab === 'function') {
              window.switchTab(page.tab);
            }
            window.closeHeaderSearch();
          }
        });
      });
    }

    updateActiveHighlight();
  }

  function updateCountBadge(id, count) {
    const el = document.getElementById(id);
    if (el) el.textContent = count.toString();
  }

  function renderGroupHeader(container, title, count) {
    const header = document.createElement('div');
    header.className = 'search-group-header';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;

    const countSpan = document.createElement('span');
    countSpan.className = 'group-count';
    countSpan.textContent = `${count} result${count !== 1 ? 's' : ''}`;

    header.append(titleSpan, countSpan);
    container.appendChild(header);
  }

  // 1. Order Item
  function createOrderItem(order, query) {
    const item = document.createElement('div');
    item.className = 'search-result-item';

    const iconBox = document.createElement('div');
    iconBox.className = 'search-item-avatar';
    iconBox.textContent = '📦';

    const info = document.createElement('div');
    info.className = 'search-item-info';

    const titleRow = document.createElement('div');
    titleRow.className = 'search-item-title-row';

    const title = document.createElement('div');
    title.className = 'search-item-title';
    title.appendChild(createHighlightedFragment(`${order.id} — ${order.customer?.fullName || 'Client'}`, query));

    titleRow.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'search-item-subtitle';
    const itemsCount = (order.items || []).length;
    sub.appendChild(createHighlightedFragment(`${itemsCount} item${itemsCount !== 1 ? 's' : ''} • Waybill: ${order.waybill || 'N/A'} • ${order.dateShort || order.date}`, query));

    info.append(titleRow, sub);

    const badge = document.createElement('div');
    badge.className = 'search-item-badge';

    const price = document.createElement('span');
    price.className = 'badge-price';
    price.textContent = window.fmtPrice ? window.fmtPrice(order.total) : `R${order.total.toFixed(2)}`;

    const statusPill = document.createElement('span');
    const sLower = (order.status || 'Paid').toLowerCase();
    let statusClass = 'status-paid';
    if (sLower.includes('transit')) statusClass = 'status-transit';
    if (sLower.includes('delivered')) statusClass = 'status-delivered';
    if (sLower.includes('cancelled')) statusClass = 'status-cancelled';

    statusPill.className = `badge-pill ${statusClass}`;
    statusPill.textContent = order.status || 'Paid';

    badge.append(price, statusPill);
    item.append(iconBox, info, badge);

    item.addEventListener('click', () => {
      if (typeof window.switchTab === 'function') window.switchTab('orders');
      if (typeof window.selectAndOpenOrder === 'function') {
        setTimeout(() => window.selectAndOpenOrder(order.id), 50);
      }
      window.closeHeaderSearch();
    });

    return item;
  }

  // 2. Product Item
  function createProductItem(prod, query) {
    const item = document.createElement('div');
    item.className = 'search-result-item';

    const img = document.createElement('img');
    img.className = 'search-item-avatar';
    img.src = prod.img;
    img.alt = prod.title;
    img.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'search-item-info';

    const title = document.createElement('div');
    title.className = 'search-item-title';
    title.appendChild(createHighlightedFragment(prod.title, query));

    const sub = document.createElement('div');
    sub.className = 'search-item-subtitle';
    sub.appendChild(createHighlightedFragment(`Category: ${prod.category} • SKU: ${prod.sku || `VEL-PROD-0${prod.id}`}`, query));

    info.append(title, sub);

    const badge = document.createElement('div');
    badge.className = 'search-item-badge';

    const price = document.createElement('span');
    price.className = 'badge-price';
    price.textContent = window.fmtPrice ? window.fmtPrice(prod.price) : `R${prod.price.toFixed(2)}`;

    const stockPill = document.createElement('span');
    stockPill.className = 'badge-pill';
    if (prod.stock <= 0) {
      stockPill.classList.add('status-cancelled');
      stockPill.textContent = 'Sold Out';
    } else if (prod.stock <= 5) {
      stockPill.classList.add('status-transit');
      stockPill.textContent = `${prod.stock} low stock`;
    } else {
      stockPill.classList.add('status-paid');
      stockPill.textContent = `${prod.stock} in stock`;
    }

    badge.append(price, stockPill);
    item.append(img, info, badge);

    item.addEventListener('click', () => {
      if (typeof window.switchTab === 'function') window.switchTab('inventory');
      window.closeHeaderSearch();
    });

    return item;
  }

  // 3. Customer Item
  function createCustomerItem(cust, query) {
    const item = document.createElement('div');
    item.className = 'search-result-item';

    const img = document.createElement('img');
    img.className = 'search-item-avatar';
    img.src = cust.avatar;
    img.alt = cust.name;
    img.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'search-item-info';

    const title = document.createElement('div');
    title.className = 'search-item-title';
    title.appendChild(createHighlightedFragment(cust.name, query));

    const sub = document.createElement('div');
    sub.className = 'search-item-subtitle';
    sub.appendChild(createHighlightedFragment(`${cust.email} • ${cust.city}`, query));

    info.append(title, sub);

    const badge = document.createElement('div');
    badge.className = 'search-item-badge';

    const spend = document.createElement('span');
    spend.className = 'badge-price';
    spend.textContent = window.fmtPrice ? window.fmtPrice(cust.lifetimeSpend || 0) : `R${(cust.lifetimeSpend || 0).toFixed(2)}`;

    const tierPill = document.createElement('span');
    tierPill.className = 'badge-pill';
    tierPill.textContent = cust.tier || 'Standard';

    badge.append(spend, tierPill);
    item.append(img, info, badge);

    item.addEventListener('click', () => {
      if (typeof window.switchTab === 'function') window.switchTab('customers');
      window.closeHeaderSearch();
    });

    return item;
  }

  // 4. Payment Item
  function createPaymentItem(pay, query) {
    const item = document.createElement('div');
    item.className = 'search-result-item';

    const iconBox = document.createElement('div');
    iconBox.className = 'search-item-avatar';
    iconBox.textContent = '💳';

    const info = document.createElement('div');
    info.className = 'search-item-info';

    const title = document.createElement('div');
    title.className = 'search-item-title';
    title.appendChild(createHighlightedFragment(`${pay.ref} — ${pay.customer}`, query));

    const sub = document.createElement('div');
    sub.className = 'search-item-subtitle';
    sub.appendChild(createHighlightedFragment(`${pay.gateway} • ${pay.bank || 'Bank Transfer'} • Order ${pay.orderId}`, query));

    info.append(title, sub);

    const badge = document.createElement('div');
    badge.className = 'search-item-badge';

    const amount = document.createElement('span');
    amount.className = 'badge-price';
    amount.textContent = window.fmtPrice ? window.fmtPrice(pay.grossAmount || 0) : `R${(pay.grossAmount || 0).toFixed(2)}`;

    const statusPill = document.createElement('span');
    statusPill.className = `badge-pill ${pay.status === 'Settled' ? 'status-paid' : 'status-cancelled'}`;
    statusPill.textContent = pay.status || 'Settled';

    badge.append(amount, statusPill);
    item.append(iconBox, info, badge);

    item.addEventListener('click', () => {
      if (typeof window.switchTab === 'function') window.switchTab('payments');
      window.closeHeaderSearch();
    });

    return item;
  }

  // 5. Navigation & Action Item
  function createNavigationItem(nav, query) {
    const item = document.createElement('div');
    item.className = 'search-result-item';

    const iconBox = document.createElement('div');
    iconBox.className = 'search-item-avatar';
    iconBox.textContent = nav.icon;

    const info = document.createElement('div');
    info.className = 'search-item-info';

    const title = document.createElement('div');
    title.className = 'search-item-title';
    title.appendChild(createHighlightedFragment(nav.title, query));

    const sub = document.createElement('div');
    sub.className = 'search-item-subtitle';
    sub.appendChild(createHighlightedFragment(nav.subtitle, query));

    info.append(title, sub);

    const badge = document.createElement('div');
    badge.className = 'search-item-badge';

    const pill = document.createElement('span');
    pill.className = 'badge-pill';
    pill.textContent = nav.type === 'action' ? 'Action' : 'Jump';

    badge.appendChild(pill);
    item.append(iconBox, info, badge);

    item.addEventListener('click', () => {
      if (nav.action) {
        nav.action();
      } else if (nav.tab && typeof window.switchTab === 'function') {
        window.switchTab(nav.tab);
      }
      window.closeHeaderSearch();
    });

    return item;
  }

  // Empty State with Suggestions when user hasn't typed yet
  function renderEmptyStateSuggestions(container, pages) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-suggestions-container';

    // 1. Quick Suggestions Chips
    const suggTitle = document.createElement('div');
    suggTitle.className = 'search-suggestions-title';
    suggTitle.textContent = 'Suggested Quick Searches';
    wrapper.appendChild(suggTitle);

    const chipsContainer = document.createElement('div');
    chipsContainer.className = 'search-suggestions-chips';

    QUICK_SUGGESTIONS.forEach(s => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'search-suggestion-chip';
      chip.textContent = s.label;
      chip.addEventListener('click', () => {
        const input = document.getElementById('headerGlobalSearchInput');
        if (input) {
          input.value = s.query;
          currentSearchQuery = s.query;
          updateClearBtn();
          renderSearchResults();
        }
      });
      chipsContainer.appendChild(chip);
    });

    wrapper.appendChild(chipsContainer);

    // 2. Quick Navigation Shortcuts
    renderGroupHeader(wrapper, 'Quick Workspace Navigation', pages.length);

    pages.forEach(page => {
      const itemEl = createNavigationItem(page, '');
      wrapper.appendChild(itemEl);
      flattenedResultItems.push({
        el: itemEl,
        action: () => {
          if (page.action) {
            page.action();
          } else if (page.tab && typeof window.switchTab === 'function') {
            window.switchTab(page.tab);
          }
          window.closeHeaderSearch();
        }
      });
    });

    container.appendChild(wrapper);
  }

  // Zero Results Message
  function renderZeroResults(container, query) {
    const empty = document.createElement('div');
    empty.className = 'search-empty-state';

    const icon = document.createElement('div');
    icon.className = 'search-empty-icon';
    icon.textContent = '🔍';

    const title = document.createElement('div');
    title.className = 'search-empty-title';
    title.textContent = `No matches found for "${query}"`;

    const desc = document.createElement('div');
    desc.className = 'search-empty-desc';
    desc.textContent = 'Try checking order IDs, customer names, SKUs, or switch the filter tab above.';

    empty.append(icon, title, desc);
    container.appendChild(empty);
  }

  // Keyboard navigation highlight
  function updateActiveHighlight() {
    flattenedResultItems.forEach((item, idx) => {
      if (item.el) {
        item.el.classList.toggle('active-result', idx === activeItemIndex);
        if (idx === activeItemIndex) {
          item.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    });
  }

  function updateClearBtn() {
    const clearBtn = document.getElementById('headerSearchClearBtn');
    if (clearBtn) {
      clearBtn.style.display = currentSearchQuery ? 'flex' : 'none';
    }
  }

  // Initialization
  window.initSearch = function() {
    const searchInput = document.getElementById('headerGlobalSearchInput');
    const searchBox = document.getElementById('headerSearchBox');
    const clearBtn = document.getElementById('headerSearchClearBtn');
    const mobileToggleBtn = document.getElementById('mobileSearchToggleBtn');
    const categoryTabs = document.getElementById('searchCategoryTabs');

    // Input Events
    if (searchInput && !searchInput._hasSearchInputListener) {
      searchInput._hasSearchInputListener = true;
      searchInput.addEventListener('focus', () => {
        window.openHeaderSearch();
      });

      searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim();
        updateClearBtn();
        activeItemIndex = -1;
        renderSearchResults();
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (flattenedResultItems.length > 0) {
            activeItemIndex = (activeItemIndex + 1) % flattenedResultItems.length;
            updateActiveHighlight();
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (flattenedResultItems.length > 0) {
            activeItemIndex = (activeItemIndex - 1 + flattenedResultItems.length) % flattenedResultItems.length;
            updateActiveHighlight();
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (activeItemIndex >= 0 && flattenedResultItems[activeItemIndex]) {
            flattenedResultItems[activeItemIndex].action();
          } else if (flattenedResultItems.length > 0) {
            flattenedResultItems[0].action();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          window.closeHeaderSearch();
        }
      });
    }

    // Clear Button
    if (clearBtn && !clearBtn._hasClearClickListener) {
      clearBtn._hasClearClickListener = true;
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (searchInput) {
          searchInput.value = '';
          currentSearchQuery = '';
          searchInput.focus();
        }
        updateClearBtn();
        renderSearchResults();
      });
    }

    // Category Tabs Click
    if (categoryTabs && !categoryTabs._hasTabClickListener) {
      categoryTabs._hasTabClickListener = true;
      categoryTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.search-tab-pill');
        if (btn) {
          const tab = btn.getAttribute('data-search-tab');
          if (tab) setCategoryTab(tab);
        }
      });
    }

    // Mobile Search Toggle Button
    if (mobileToggleBtn && !mobileToggleBtn._hasToggleClickListener) {
      mobileToggleBtn._hasToggleClickListener = true;
      mobileToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.openHeaderSearch();
      });
    }
  };

  // Global Shortcut: Cmd+K or Ctrl+K or '/'
  document.addEventListener('keydown', (e) => {
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      window.openHeaderSearch();
    } else if (e.key === '/' && !isInput) {
      e.preventDefault();
      window.openHeaderSearch();
    } else if (e.key === 'Escape') {
      const popover = document.getElementById('headerSearchPopover');
      if (popover && popover.style.display !== 'none') {
        window.closeHeaderSearch();
      }
    }
  });

  // Close on Click Outside
  document.addEventListener('click', (e) => {
    const container = document.getElementById('topbarSearchContainer');
    const popover = document.getElementById('headerSearchPopover');
    const mobileBtn = document.getElementById('mobileSearchToggleBtn');

    if (popover && popover.style.display !== 'none') {
      if (container && !container.contains(e.target) && (!mobileBtn || !mobileBtn.contains(e.target))) {
        window.closeHeaderSearch();
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initSearch);
  } else {
    window.initSearch();
  }

})();
