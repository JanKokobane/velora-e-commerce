window.driversData = Array.isArray(window.driversData) ? window.driversData : [];
window._isFetchingDrivers = false;
let editingDriverId = null;

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
    cell.colSpan = 5;
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

    const actions = document.createElement('td');
    actions.style.display = 'flex';
    actions.style.alignItems = 'center';
    actions.style.gap = '8px';
    actions.style.whiteSpace = 'nowrap';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'drawer-btn drawer-btn-dark';
    editButton.style.flex = 'initial';
    editButton.style.padding = '5px 10px';
    editButton.style.fontSize = '11.5px';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => beginDriverEdit(driver));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'drawer-btn drawer-btn-outline';
    deleteButton.style.flex = 'initial';
    deleteButton.style.padding = '5px 10px';
    deleteButton.style.fontSize = '11.5px';
    deleteButton.style.color = '#b91c1c';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteDriver(driver, deleteButton));

    actions.append(editButton, deleteButton);
    row.appendChild(actions);
    return row;
  });
  tbody.replaceChildren(...rows);
};

function beginDriverEdit(driver) {
  const form = document.getElementById('driverCreateForm');
  if (!form) return;
  editingDriverId = String(driver.id);
  form.elements.fullName.value = driver.full_name || '';
  form.elements.email.value = driver.email || '';
  form.elements.phone.value = driver.phone || '';
  form.elements.province.value = driver.province || '';
  const title = document.getElementById('driverFormTitle');
  const submitButton = form.querySelector('button[type="submit"]');
  const cancelButton = document.getElementById('cancelDriverEditBtn');
  if (title) title.textContent = `Edit ${driver.full_name}`;
  if (submitButton) {
    submitButton.textContent = 'Save Changes';
    submitButton.style.backgroundColor = '#2f5d50';
  }
  if (cancelButton) cancelButton.hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetDriverForm() {
  const form = document.getElementById('driverCreateForm');
  if (!form) return;
  editingDriverId = null;
  form.reset();
  const title = document.getElementById('driverFormTitle');
  const submitButton = form.querySelector('button[type="submit"]');
  const cancelButton = document.getElementById('cancelDriverEditBtn');
  if (title) title.textContent = 'Add Driver';
  if (submitButton) {
    submitButton.textContent = 'Add Driver';
    submitButton.style.backgroundColor = '';
  }
  if (cancelButton) cancelButton.hidden = true;
}

async function deleteDriver(driver, button) {
  const confirmed = typeof window.showConfirmModal === 'function'
    ? await window.showConfirmModal({
        title: 'Delete Driver',
        subtitle: 'This permanently removes the driver from the roster.',
        message: `Delete ${driver.full_name} (${driver.email})? Active shipments assigned to this driver will return to the logistics hub for reassignment.`,
        confirmText: 'Delete Driver',
        cancelText: 'Keep Driver',
        danger: true
      })
    : window.confirm(`Delete ${driver.full_name}? Active shipments will return to the hub for reassignment.`);
  if (!confirmed) return;

  button.disabled = true;
  try {
    const response = await fetch(`${getDriversApiBaseUrl()}/api/drivers/${encodeURIComponent(driver.id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getDriversAdminToken()}` }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `Driver deletion failed (${response.status}).`);
    if (editingDriverId === String(driver.id)) resetDriverForm();
    await window.fetchDriversFromDb();
    if (typeof window.fetchOrdersFromDb === 'function') await window.fetchOrdersFromDb();
    if (typeof window.showToast === 'function') window.showToast(`${driver.full_name} deleted.`);
  } catch (error) {
    if (typeof window.showToast === 'function') window.showToast(error.message || 'Unable to delete driver.');
  } finally {
    button.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('driverCreateForm');
  const message = document.getElementById('driverFormMessage');
  if (form) {
    const cancelButton = document.getElementById('cancelDriverEditBtn');
    if (cancelButton) cancelButton.addEventListener('click', resetDriverForm);

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
        const isEditing = editingDriverId !== null;
        const response = await fetch(`${getDriversApiBaseUrl()}/api/drivers${isEditing ? `/${encodeURIComponent(editingDriverId)}` : ''}`, {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getDriversAdminToken()}`
          },
          body: JSON.stringify(driver)
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || `Driver save failed (${response.status}).`);
        resetDriverForm();
        await window.fetchDriversFromDb();
        if (message) {
          message.textContent = `${data.driver.full_name} ${isEditing ? 'updated' : 'added'} for ${data.driver.province}.`;
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
