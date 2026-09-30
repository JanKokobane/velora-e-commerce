window.driversData = Array.isArray(window.driversData) ? window.driversData : [];
window._isFetchingDrivers = false;

function getDriversApiBaseUrl() {
  return (window.VELORA_API_URL || window.VELORA_API_BASE_URL || 'https://velora-e-commerce-qby7.onrender.com').replace(/\/+$/, '');
}

function getDriversAdminToken() {
  return window.adminAuthApi?.getToken?.() ||
    localStorage.getItem('velora_admin_token') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token') || '';
}

window.fetchDriversFromDb = async function() {
  if (window._isFetchingDrivers) return window.driversData;
  window._isFetchingDrivers = true;
  try {
    const response = await fetch(`${getDriversApiBaseUrl()}/api/drivers`, {
      headers: { Authorization: `Bearer ${getDriversAdminToken()}` }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `Drivers API returned HTTP ${response.status}.`);
    window.driversData = Array.isArray(data?.drivers) ? data.drivers : [];
    window.renderDriversView();
    const activeOrder = (window.ordersData || []).find(order => order.id === window.currentActiveOrderId);
    if (activeOrder && typeof window.renderOrderDrawer === 'function') window.renderOrderDrawer(activeOrder);
    return window.driversData;
  } catch (error) {
    console.error('[Velora Admin] Error fetching drivers:', error);
    window.driversLoadError = error.message || 'Unable to load drivers.';
    window.renderDriversView();
    return [];
  } finally {
    window._isFetchingDrivers = false;
  }
};

window.renderDriversView = function() {
  const tbody = document.getElementById('driversTableBody');
  const countEl = document.getElementById('driversCount');
  if (countEl) countEl.textContent = String(window.driversData.length);
  if (!tbody) return;

  if (window.driversData.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.style.padding = '32px';
    cell.style.textAlign = 'center';
    cell.style.color = 'var(--muted)';
    cell.textContent = window.driversLoadError || 'No drivers have been added yet.';
    row.appendChild(cell);
    tbody.replaceChildren(row);
    return;
  }

  const rows = window.driversData.map(driver => {
    const row = document.createElement('tr');
    [driver.full_name, driver.email, driver.phone, driver.province].forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value || 'Not recorded';
      row.appendChild(cell);
    });
    return row;
  });
  tbody.replaceChildren(...rows);
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('driverCreateForm');
  const message = document.getElementById('driverFormMessage');
  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);
      const driver = {
        fullName: String(formData.get('fullName') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        province: String(formData.get('province') || '').trim()
      };
      if (submitButton) submitButton.disabled = true;
      if (message) message.textContent = '';

      try {
        const response = await fetch(`${getDriversApiBaseUrl()}/api/drivers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getDriversAdminToken()}`
          },
          body: JSON.stringify(driver)
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || `Driver save failed (${response.status}).`);
        form.reset();
        await window.fetchDriversFromDb();
        if (message) {
          message.textContent = `${data.driver.full_name} added for ${data.driver.province}.`;
          message.style.color = '#166534';
        }
      } catch (error) {
        if (message) {
          message.textContent = error.message || 'Unable to add driver.';
          message.style.color = '#b91c1c';
        }
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
});
