/**
 * Settings Page Controller (js/settings.js)
 * Pure DOM implementation with NO innerHTML.
 */

window.renderSettingsView = function() {
  const s = window.settingsData;
  if (!s) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  const setChecked = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(val);
  };

  setVal('settingStoreName', s.storeName);
  setVal('settingSupportEmail', s.supportEmail);
  setVal('settingPhone', s.phone);
  setVal('settingAddress', s.address);

  // Synchronize currency selector with active header/current country
  const activeCurrency = (window.currentCountry && window.currentCountry.currency) || s.currency || 'ZAR';
  setVal('settingCurrency', activeCurrency);
  s.currency = activeCurrency;

  // Bind change handler on settingCurrency to immediately sync with header and whole app
  const currSelect = document.getElementById('settingCurrency');
  if (currSelect && !currSelect._hasSyncCurrencyListener) {
    currSelect._hasSyncCurrencyListener = true;
    currSelect.addEventListener('change', (e) => {
      const selectedCurr = e.target.value;
      if (typeof window.setCurrencyByCode === 'function') {
        window.setCurrencyByCode(selectedCurr, true);
      }
    });
  }

  setVal('settingVatRate', s.vatRate);
  setVal('settingVatNumber', s.vatNumber);
  setVal('settingInvoicePrefix', s.invoicePrefix);
  setChecked('settingVatInclusive', s.vatInclusive);

  setChecked('settingGatewayOzow', s.gatewayOzow);
  setChecked('settingGatewaySnapScan', s.gatewaySnapScan);
  setChecked('settingGatewayCards', s.gatewayCards);
  setChecked('settingGatewayApplePay', s.gatewayApplePay);

  setVal('settingCourierPartner', s.courierPartner);
  setVal('settingStandardShipping', s.standardShipping);
  setVal('settingExpressShipping', s.expressShipping);
  setVal('settingFreeShippingThreshold', s.freeShippingThreshold);

  setVal('settingLowStockThreshold', s.lowStockThreshold);
  setVal('settingAutoDraftWaybill', s.autoDraftWaybill);
  setVal('settingSessionTimeout', s.sessionTimeout);
};

window.saveStudioSettings = function() {
  const getVal = (id, defaultVal) => {
    const el = document.getElementById(id);
    return el ? el.value : defaultVal;
  };

  const getChecked = (id, defaultVal) => {
    const el = document.getElementById(id);
    return el ? el.checked : defaultVal;
  };

  const selectedCurrency = getVal('settingCurrency', (window.currentCountry && window.currentCountry.currency) || 'ZAR');
  if (window.currentCountry && window.currentCountry.currency !== selectedCurrency) {
    if (typeof window.setCurrencyByCode === 'function') {
      window.setCurrencyByCode(selectedCurrency, false);
    }
  }

  window.settingsData = {
    storeName: getVal('settingStoreName', 'VELORA E-Commerce Studio'),
    supportEmail: getVal('settingSupportEmail', 'studio@velora.co.za'),
    phone: getVal('settingPhone', '+27 11 883 0000'),
    address: getVal('settingAddress', 'Nelson Mandela Square, Sandton, Johannesburg, 2196, South Africa'),
    currency: selectedCurrency,
    vatRate: parseFloat(getVal('settingVatRate', '15')) || 15,
    vatNumber: getVal('settingVatNumber', '4890284910'),
    invoicePrefix: getVal('settingInvoicePrefix', 'VEL-ZA-'),
    vatInclusive: getChecked('settingVatInclusive', true),
    gatewayOzow: getChecked('settingGatewayOzow', true),
    gatewaySnapScan: getChecked('settingGatewaySnapScan', true),
    gatewayCards: getChecked('settingGatewayCards', true),
    gatewayApplePay: getChecked('settingGatewayApplePay', true),
    courierPartner: getVal('settingCourierPartner', 'The Courier Guy'),
    standardShipping: parseFloat(getVal('settingStandardShipping', '150')) || 150,
    expressShipping: parseFloat(getVal('settingExpressShipping', '280')) || 280,
    freeShippingThreshold: parseFloat(getVal('settingFreeShippingThreshold', '1500')) || 1500,
    lowStockThreshold: parseInt(getVal('settingLowStockThreshold', '5'), 10) || 5,
    autoDraftWaybill: getVal('settingAutoDraftWaybill', 'enabled'),
    sessionTimeout: getVal('settingSessionTimeout', '60')
  };

  window.saveSettings();
  if (typeof window.showToast === 'function') {
    window.showToast('Studio operational settings saved successfully');
  }
};

window.resetSettingsDefaults = function() {
  window.settingsData = {
    storeName: 'VELORA E-Commerce Studio',
    supportEmail: 'studio@velora.co.za',
    phone: '+27 11 883 0000',
    address: 'Nelson Mandela Square, Sandton, Johannesburg, 2196, South Africa',
    currency: 'ZAR',
    vatRate: 15,
    vatNumber: '4890284910',
    invoicePrefix: 'VEL-ZA-',
    vatInclusive: true,
    gatewayOzow: true,
    gatewaySnapScan: true,
    gatewayCards: true,
    gatewayApplePay: true,
    courierPartner: 'The Courier Guy',
    standardShipping: 150,
    expressShipping: 280,
    freeShippingThreshold: 1500,
    lowStockThreshold: 5,
    autoDraftWaybill: 'enabled',
    sessionTimeout: '60'
  };

  if (typeof window.setCurrencyByCode === 'function') {
    window.setCurrencyByCode('ZAR', false);
  }

  window.saveSettings();
  window.renderSettingsView();
  if (typeof window.showToast === 'function') {
    window.showToast('Settings reset to studio factory defaults');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.renderSettingsView();
});
