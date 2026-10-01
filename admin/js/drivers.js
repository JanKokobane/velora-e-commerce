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
    window.driversLoadError = '';
    window.driversData = Array.isArray(data?.drivers) ? data.drivers : [];
    window.renderDriversView();
    const activeOrder = (window.ordersData || []).find(order => order.id === window.currentActiveOrderId);
    if (activeOrder && typeof window.renderOrderDrawer === 'function') window.renderOrderDrawer(activeOrder);
    return window.driversData;
  } catch (error) {
    console.error('[Velora Admin] Error fetching drivers:', error);
    window.driversLoadError = error.message || 'Unable to load the driver roster.';
    window.renderDriversView();
    const activeOrder = (window.ordersData || []).find(order => order.id === window.currentActiveOrderId);
    if (activeOrder && typeof window.renderOrderDrawer === 'function') window.renderOrderDrawer(activeOrder);
    return window.driversData;
  } finally {
    window._isFetchingDrivers = false;
  }
};

window.driverSearchQuery = '';
window.driverProvinceFilter = 'all';

window.renderDriversView = function() {
  const tbody = document.getElementById('driversTableBody');
  const countEl = document.getElementById('driversCount');
  const drivers = Array.isArray(window.driversData) ? window.driversData : [];
  if (countEl) countEl.textContent = String(drivers.length);
  if (!tbody) return;

  const searchQuery = (window.driverSearchQuery || '').toLowerCase().trim();
  const selectedProvince = (window.driverProvinceFilter || 'all').toLowerCase().trim();

  const filtered = drivers.filter(driver => {
    if (selectedProvince !== 'all' && String(driver.province || '').toLowerCase().trim() !== selectedProvince) {
      return false;
    }
    if (searchQuery) {
      const matchName = String(driver.full_name || '').toLowerCase().includes(searchQuery);
      const matchEmail = String(driver.email || '').toLowerCase().includes(searchQuery);
      const matchPhone = String(driver.phone || '').toLowerCase().includes(searchQuery);
      const matchProvince = String(driver.province || '').toLowerCase().includes(searchQuery);
      if (!matchName && !matchEmail && !matchPhone && !matchProvince) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.style.padding = '36px 20px';
    cell.style.textAlign = 'center';
    cell.style.color = 'var(--muted)';
    cell.textContent = window.driversLoadError || (drivers.length === 0 ? 'No drivers have been added to the logistics roster yet.' : 'No drivers matching search criteria.');
    row.appendChild(cell);
    tbody.replaceChildren(row);
    return;
  }

  const orders = Array.isArray(window.ordersData) ? window.ordersData : [];

  const rows = filtered.map(driver => {
    const row = document.createElement('tr');

    // 1. Driver with Avatar and ID badge
    const driverCell = document.createElement('td');
    const custWrapper = document.createElement('div');
    custWrapper.className = 'customer-cell';

    const avatar = document.createElement('img');
    avatar.className = 'customer-avatar';
    avatar.src = (typeof window.createInitialsAvatarSvg === 'function')
      ? window.createInitialsAvatarSvg(driver.full_name)
      : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23232030\'/%3E%3Ctext x=\'20\' y=\'24\' fill=\'%23c9a57a\' font-size=\'14\' text-anchor=\'middle\' font-family=\'sans-serif\'%3ED%3C/text%3E%3C/svg%3E';
    avatar.alt = driver.full_name;

    const infoWrap = document.createElement('div');
    const nameSpan = document.createElement('div');
    nameSpan.className = 'customer-name';
    nameSpan.style.fontWeight = '700';
    nameSpan.style.color = 'var(--ink)';
    nameSpan.style.fontSize = '13.5px';
    nameSpan.textContent = driver.full_name || 'Unnamed Driver';

    const idSpan = document.createElement('div');
    idSpan.style.fontSize = '11px';
    idSpan.style.color = 'var(--muted)';
    idSpan.textContent = `DRV-${String(driver.id).padStart(4, '0')}`;

    infoWrap.append(nameSpan, idSpan);
    custWrapper.append(avatar, infoWrap);
    driverCell.appendChild(custWrapper);

    // 2. Email
    const emailCell = document.createElement('td');
    if (driver.email) {
      const emailLink = document.createElement('a');
      emailLink.href = `mailto:${driver.email}`;
      emailLink.style.color = 'var(--ink)';
      emailLink.style.textDecoration = 'none';
      emailLink.textContent = driver.email;
      emailCell.appendChild(emailLink);
    } else {
      emailCell.textContent = 'Not recorded';
      emailCell.style.color = 'var(--muted)';
    }

    // 3. Phone
    const phoneCell = document.createElement('td');
    phoneCell.style.fontVariantNumeric = 'tabular-nums';
    if (driver.phone) {
      const phoneLink = document.createElement('a');
      phoneLink.href = `tel:${driver.phone}`;
      phoneLink.style.color = 'var(--ink)';
      phoneLink.style.textDecoration = 'none';
      phoneLink.textContent = driver.phone;
      phoneCell.appendChild(phoneLink);
    } else {
      phoneCell.textContent = 'Not recorded';
      phoneCell.style.color = 'var(--muted)';
    }

    // 4. Province
    const provinceCell = document.createElement('td');
    const provBadge = document.createElement('span');
    provBadge.className = 'dispatch-province-badge';
    provBadge.textContent = driver.province || 'National';
    provinceCell.appendChild(provBadge);

    // 5. Assigned Orders Count
    const assignedCount = orders.filter(o => String(o.driver?.id || o.driver_id || '') === String(driver.id)).length;
    const ordersCell = document.createElement('td');
    ordersCell.style.fontSize = '12.5px';
    ordersCell.style.fontVariantNumeric = 'tabular-nums';
    ordersCell.textContent = assignedCount > 0 ? `${assignedCount} active shipment${assignedCount > 1 ? 's' : ''}` : '0 shipments';

    // 6. Status
    const statusCell = document.createElement('td');
    const statusPill = document.createElement('span');
    statusPill.className = 'status-pill status-paid';
    statusPill.textContent = 'Active';
    statusCell.appendChild(statusPill);

    // 7. Actions
    const actionsCell = document.createElement('td');
    actionsCell.style.textAlign = 'right';
    actionsCell.style.whiteSpace = 'nowrap';

    const actionWrap = document.createElement('div');
    actionWrap.style.display = 'inline-flex';
    actionWrap.style.alignItems = 'center';
    actionWrap.style.gap = '6px';
    actionWrap.style.justifyContent = 'flex-end';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'drawer-btn drawer-btn-dark';
    editBtn.style.padding = '4px 10px';
    editBtn.style.fontSize = '11.5px';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => beginDriverEdit(driver));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'drawer-btn drawer-btn-outline';
    deleteBtn.style.padding = '4px 10px';
    deleteBtn.style.fontSize = '11.5px';
    deleteBtn.style.color = '#b91c1c';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteDriver(driver, deleteBtn));

    actionWrap.append(editBtn, deleteBtn);
    actionsCell.appendChild(actionWrap);

    row.append(driverCell, emailCell, phoneCell, provinceCell, ordersCell, statusCell, actionsCell);
    return row;
  });

  tbody.replaceChildren(...rows);
};

window.openDriverModal = function(isEdit = false) {
  const modal = document.getElementById('driverModal');
  if (!isEdit) {
    resetDriverForm();
  }
  if (modal) {
    modal.classList.add('open');
  }
  const firstInput = document.getElementById('driverFullName');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }
};

window.closeDriverModal = function() {
  const modal = document.getElementById('driverModal');
  if (modal) {
    modal.classList.remove('open');
  }
  resetDriverForm();
};

function beginDriverEdit(driver) {
  const form = document.getElementById('driverCreateForm');
  if (!form) return;
  editingDriverId = String(driver.id);
  form.elements.fullName.value = driver.full_name || '';
  form.elements.email.value = driver.email || '';
  form.elements.phone.value = driver.phone || '';
  form.elements.province.value = driver.province || '';

  const heading = document.getElementById('driverModalHeading');
  const badge = document.getElementById('driverModalBadge');
  const submitText = document.getElementById('driverSubmitBtnText');
  const message = document.getElementById('driverFormMessage');

  if (heading) heading.textContent = `Edit ${driver.full_name}`;
  if (badge) badge.textContent = 'Editing Driver';
  if (submitText) submitText.textContent = 'Save Changes';
  if (message) message.textContent = '';

  window.openDriverModal(true);
}

function resetDriverForm() {
  const form = document.getElementById('driverCreateForm');
  if (!form) return;
  editingDriverId = null;
  form.reset();

  const heading = document.getElementById('driverModalHeading');
  const badge = document.getElementById('driverModalBadge');
  const submitText = document.getElementById('driverSubmitBtnText');
  const message = document.getElementById('driverFormMessage');

  if (heading) heading.textContent = 'Add Courier Driver';
  if (badge) badge.textContent = 'Fleet Operations';
  if (submitText) submitText.textContent = 'Add Driver';
  if (message) message.textContent = '';
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
  const modal = document.getElementById('driverModal');

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) window.closeDriverModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const dModal = document.getElementById('driverModal');
      if (dModal && dModal.classList.contains('open')) {
        window.closeDriverModal();
      }
    }
  });

  const searchInput = document.getElementById('driverSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      window.driverSearchQuery = e.target.value;
      window.renderDriversView();
    });
  }

  const provinceFilter = document.getElementById('driverProvinceFilter');
  if (provinceFilter) {
    provinceFilter.addEventListener('change', (e) => {
      window.driverProvinceFilter = e.target.value;
      window.renderDriversView();
    });
  }

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
        const savedDriverName = data?.driver?.full_name || driver.fullName;
        window.closeDriverModal();
        await window.fetchDriversFromDb();
        if (typeof window.showToast === 'function') {
          window.showToast(`${savedDriverName} ${isEditing ? 'updated' : 'added'} successfully.`);
        }
      } catch (error) {
        if (message) {
          message.textContent = error.message || 'Unable to save driver.';
          message.style.color = '#b91c1c';
        }
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
});
