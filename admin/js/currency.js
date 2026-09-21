/**
 * Currency & Country Forex Engine (js/currency.js)
 * Supports multi-currency display with ZAR base currency.
 * Pure DOM implementation with NO innerHTML.
 */

window.SUPPORTED_COUNTRIES = [
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', flag: '🇿🇦', rate: 1.0000, locale: 'en-ZA' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸', rate: 0.0540, locale: 'en-US' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧', rate: 0.0425, locale: 'en-GB' },
  { code: 'EU', name: 'European Union', currency: 'EUR', symbol: '€', flag: '🇪🇺', rate: 0.0498, locale: 'de-DE' },
  { code: 'NA', name: 'Namibia', currency: 'NAD', symbol: 'N$', flag: '🇳🇦', rate: 1.0000, locale: 'en-NA' },
  { code: 'BW', name: 'Botswana', currency: 'BWP', symbol: 'P', flag: '🇧🇼', rate: 0.7420, locale: 'en-BW' },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$', flag: '🇦🇺', rate: 0.0825, locale: 'en-AU' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', symbol: 'AED', flag: '🇦🇪', rate: 0.1980, locale: 'ar-AE' }
];

// Initialize country from localStorage or default to ZA
const savedCountryCode = localStorage.getItem(window.STORAGE_KEYS.COUNTRY) || 'ZA';
window.currentCountry = window.SUPPORTED_COUNTRIES.find(c => c.code === savedCountryCode) || window.SUPPORTED_COUNTRIES[0];

/**
 * Format price in current currency
 */
window.fmtPrice = function(valZar) {
  if (typeof valZar !== 'number' || isNaN(valZar)) return `${window.currentCountry.symbol}0.00`;
  const converted = valZar * window.currentCountry.rate;
  const formatted = converted.toLocaleString(window.currentCountry.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${window.currentCountry.symbol}${formatted}`;
};

/**
 * Render the Country & Currency dropdown list using DOM methods (NO innerHTML)
 */
window.renderCountryDropdownList = function(filterQuery = '') {
  const listEl = document.getElementById('countryDropdownList');
  if (!listEl) return;

  const query = (filterQuery || '').trim().toLowerCase();
  const filtered = window.SUPPORTED_COUNTRIES.filter(c => {
    if (!query) return true;
    return c.name.toLowerCase().includes(query) ||
           c.currency.toLowerCase().includes(query) ||
           c.symbol.toLowerCase().includes(query) ||
           c.code.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    const emptyNotice = document.createElement('div');
    emptyNotice.style.padding = '16px';
    emptyNotice.style.textAlign = 'center';
    emptyNotice.style.color = 'var(--muted)';
    emptyNotice.style.fontSize = '12.5px';
    emptyNotice.textContent = 'No matching countries found';
    listEl.replaceChildren(emptyNotice);
    return;
  }

  const items = filtered.map(c => {
    const isSelected = c.code === window.currentCountry.code;

    const itemEl = document.createElement('div');
    itemEl.className = `country-option-item${isSelected ? ' selected' : ''}`;
    itemEl.setAttribute('role', 'option');
    itemEl.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    itemEl.addEventListener('click', () => {
      window.selectCountryByCode(c.code);
    });

    const leftEl = document.createElement('div');
    leftEl.className = 'country-option-left';

    const flagEl = document.createElement('span');
    flagEl.className = 'country-option-flag';
    flagEl.textContent = c.flag;

    const nameEl = document.createElement('span');
    nameEl.className = 'country-option-name';
    nameEl.textContent = c.name;

    leftEl.append(flagEl, nameEl);

    const rightEl = document.createElement('div');
    rightEl.className = 'country-option-right';

    const currEl = document.createElement('span');
    currEl.className = 'country-option-curr';
    currEl.textContent = `${c.currency} (${c.symbol})`;

    // SVG checkmark
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('class', 'country-option-check');
    svgEl.setAttribute('width', '14');
    svgEl.setAttribute('height', '14');
    svgEl.setAttribute('viewBox', '0 0 24 24');
    svgEl.setAttribute('fill', 'none');
    svgEl.setAttribute('stroke', 'currentColor');
    svgEl.setAttribute('stroke-width', '2.5');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '20 6 9 17 4 12');
    svgEl.appendChild(polyline);

    rightEl.append(currEl, svgEl);
    itemEl.append(leftEl, rightEl);

    return itemEl;
  });

  listEl.replaceChildren(...items);
};

window.applyCountryCurrency = function(country, showToastAlert = true) {
  if (!country) return;
  window.currentCountry = country;
  try {
    localStorage.setItem(window.STORAGE_KEYS.COUNTRY, country.code);
  } catch (e) {
    console.warn(e);
  }

  // Synchronize Settings state and form element
  if (window.settingsData) {
    window.settingsData.currency = country.currency;
    if (typeof window.saveSettings === 'function') {
      window.saveSettings();
    }
  }
  const settingCurrEl = document.getElementById('settingCurrency');
  if (settingCurrEl) {
    settingCurrEl.value = country.currency;
  }

  // Update topbar trigger button
  const flagEl = document.getElementById('headerSelectedFlag');
  const codeEl = document.getElementById('headerSelectedCode');
  if (flagEl) flagEl.textContent = country.flag;
  if (codeEl) codeEl.textContent = country.currency;

  // Update all dynamic currency code and symbol spans across views & modals
  document.querySelectorAll('.current-curr-code').forEach(el => {
    el.textContent = country.currency;
  });
  document.querySelectorAll('.current-curr-symbol').forEach(el => {
    el.textContent = country.symbol;
  });

  // Update footer active currency indicator
  const footerCurrLabel = document.getElementById('footerCurrencyLabel');
  if (footerCurrLabel) {
    footerCurrLabel.textContent = `${country.name} (${country.currency})`;
  }

  // Update any static elements with data-base-price
  document.querySelectorAll('.currency-converted-price[data-base-price]').forEach(el => {
    const base = parseFloat(el.getAttribute('data-base-price') || '0');
    el.textContent = window.fmtPrice(base);
  });

  // Re-render current active view to recalculate & convert all prices
  if (typeof window.refreshCurrentView === 'function') {
    window.refreshCurrentView();
  }

  // Re-render open side drawers if active
  const orderDrawer = document.getElementById('orderDetailsDrawer');
  if (orderDrawer && (orderDrawer.classList.contains('open') || orderDrawer.style.display === 'block')) {
    if (window.currentOrder && typeof window.renderOrderDrawerDetails === 'function') {
      window.renderOrderDrawerDetails(window.currentOrder);
    }
  }

  const paymentDrawer = document.getElementById('paymentDetailsDrawer');
  if (paymentDrawer && (paymentDrawer.classList.contains('open') || paymentDrawer.style.display === 'block')) {
    if (window.currentPayment && typeof window.renderPaymentDetailsDrawer === 'function') {
      window.renderPaymentDetailsDrawer(window.currentPayment);
    }
  }

  // Re-render dropdown list if open to update active checkmark
  const panel = document.getElementById('countryCurrencyDropdown');
  if (panel && (panel.style.display === 'flex' || panel.style.display === 'block')) {
    const searchInput = document.getElementById('countrySearchInput');
    window.renderCountryDropdownList(searchInput ? searchInput.value : '');
  }

  if (showToastAlert && typeof window.showToast === 'function') {
    window.showToast(`Currency updated to ${country.name} (${country.currency})`);
  }
};

window.setCurrencyByCode = function(codeOrCurrency, showToast = true) {
  if (!codeOrCurrency) return;
  const target = String(codeOrCurrency).trim().toUpperCase();
  const country = window.SUPPORTED_COUNTRIES.find(c => c.currency.toUpperCase() === target) ||
                  window.SUPPORTED_COUNTRIES.find(c => c.code.toUpperCase() === target) ||
                  window.SUPPORTED_COUNTRIES[0];
  window.applyCountryCurrency(country, showToast);
};

window.selectCountryByCode = function(code) {
  const country = window.SUPPORTED_COUNTRIES.find(c => c.code === code);
  if (country) {
    window.applyCountryCurrency(country, true);
    window.toggleCountryDropdown(false);
  }
};

window.toggleCountryDropdown = function(forceState) {
  const panel = document.getElementById('countryCurrencyDropdown');
  const btn = document.getElementById('countryCurrencyBtn');
  if (!panel) return;

  const isOpen = panel.style.display === 'flex' || panel.style.display === 'block';
  const nextState = forceState !== undefined ? forceState : !isOpen;

  if (nextState) {
    panel.style.display = 'flex';
    if (btn) btn.setAttribute('aria-expanded', 'true');
    window.renderCountryDropdownList('');
    const searchInput = document.getElementById('countrySearchInput');
    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 50);
    }
  } else {
    panel.style.display = 'none';
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
};

// Initialize event listeners for country search input
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('countrySearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      window.renderCountryDropdownList(e.target.value);
    });
  }

  const pickerBtn = document.getElementById('countryCurrencyBtn');
  if (pickerBtn) {
    pickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.toggleCountryDropdown();
    });
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const container = document.getElementById('countryCurrencyPickerContainer');
    if (container && !container.contains(e.target)) {
      window.toggleCountryDropdown(false);
    }
  });

  // Apply initial country
  window.applyCountryCurrency(window.currentCountry, false);
});
