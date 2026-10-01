/**
 * Order Inspection Drawer Controller (js/order-drawer.js)
 * Pure DOM implementation with NO innerHTML.
 */

window.currentActiveOrderId = null;

window.renderOrderDrawer = function(order) {
  if (!order) return;
  window.currentActiveOrderId = order.id;

  const orderIdEl = document.getElementById('drawerOrderId');
  const statusPill = document.getElementById('drawerStatusPill');
  const dateEl = document.getElementById('drawerOrderDate');
  const avatarEl = document.getElementById('drawerCustomerAvatar');
  const nameEl = document.getElementById('drawerCustomerName');
  const emailLink = document.getElementById('drawerEmailLink');
  const phoneLink = document.getElementById('drawerPhoneLink');
  const trkEl = document.getElementById('drawerTrackingNumber');
  const totalEl = document.getElementById('drawerTotalAmount');
  const trackingLocationEl = document.getElementById('drawerTrackingLocation');
  const deliveryProvinceEl = document.getElementById('drawerDeliveryProvince');
  const assignedDriverEl = document.getElementById('drawerAssignedDriver');
  const driverSelect = document.getElementById('drawerDriverSelect');
  const acceptBtn = document.getElementById('btnTrackOrder');
  const assignBtn = document.getElementById('btnAssignDriver');
  const deliveredBtn = document.getElementById('btnDeliverOrder');

  if (orderIdEl) orderIdEl.textContent = `Order ${order.id}`;
  if (statusPill) {
    statusPill.className = `status-pill ${typeof window.getStatusClass === 'function' ? window.getStatusClass(order.status) : 'status-paid'}`;
    statusPill.textContent = order.status;
  }
  if (dateEl) dateEl.textContent = order.date;
  if (avatarEl) {
    avatarEl.src = order.customer.avatar;
    avatarEl.alt = order.customer.fullName;
    avatarEl.onerror = function() {
      this.onerror = null;
      this.src = (typeof window.createInitialsAvatarSvg === 'function')
        ? window.createInitialsAvatarSvg(order.customer.fullName)
        : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'24\' fill=\'%23232030\'/%3E%3Ctext x=\'24\' y=\'29\' fill=\'%23c9a57a\' font-size=\'16\' text-anchor=\'middle\' font-family=\'sans-serif\'%3EV%3C/text%3E%3C/svg%3E';
    };
  }
  if (nameEl) nameEl.textContent = order.customer.fullName;
  if (emailLink) emailLink.href = `mailto:${order.customer.email}`;
  if (phoneLink) phoneLink.href = `tel:${order.customer.phone}`;
  if (trkEl) trkEl.textContent = order.waybill || 'TRK-ZA-PENDING';
  const trkHeader = document.getElementById('drawerTrackingNumberHeader');
  if (trkHeader) trkHeader.textContent = order.waybill || 'TRK-ZA-PENDING';
  if (totalEl) totalEl.textContent = window.fmtPrice(order.total);

  const subtotalEl = document.getElementById('orderSubtotalAmount');
  const deliveryFeeEl = document.getElementById('orderDeliveryFee');
  if (subtotalEl) {
    const itemsTotal = (order.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1), 0);
    subtotalEl.textContent = window.fmtPrice(itemsTotal || order.total);
  }
  if (deliveryFeeEl) {
    deliveryFeeEl.textContent = (order.shipping && order.shipping.fee > 0)
      ? window.fmtPrice(order.shipping.fee)
      : 'Complimentary';
  }

  const normalizedStatus = String(order.status || '').toLowerCase();
  const province = String(order.shipping?.province || '').trim().toLowerCase();
  const eligibleDrivers = (Array.isArray(window.driversData) ? window.driversData : [])
    .filter(driver => String(driver.province || '').trim().toLowerCase() === province);
  if (trackingLocationEl) {
    trackingLocationEl.textContent = order.trackingLocation ||
      (normalizedStatus === 'accepted at hub'
        ? 'Velora Logistics Hub, Airport Industria'
        : 'Velora Fulfillment Centre');
  }
  if (deliveryProvinceEl) deliveryProvinceEl.textContent = order.shipping?.province || 'Not recorded';
  if (assignedDriverEl) {
    assignedDriverEl.textContent = order.driver
      ? `Assigned driver: ${order.driver.fullName || order.driver.full_name} · ${order.driver.phone || ''}`
      : 'No driver assigned';
  }
  if (driverSelect) {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = province
      ? `Select driver (${order.shipping.province})`
      : 'Customer province unavailable';
    const options = eligibleDrivers.map(driver => {
      const option = document.createElement('option');
      option.value = String(driver.id);
      option.textContent = `${driver.full_name} · ${driver.province}`;
      if (String(order.driver?.id || '') === String(driver.id)) option.selected = true;
      return option;
    });
    driverSelect.replaceChildren(placeholder, ...options);
    driverSelect.disabled = normalizedStatus !== 'accepted at hub' || eligibleDrivers.length === 0;
  }
  if (acceptBtn) {
    acceptBtn.hidden = normalizedStatus !== 'paid';
    acceptBtn.textContent = 'Accept Paid Order';
  }
  if (assignBtn) {
    assignBtn.hidden = normalizedStatus !== 'accepted at hub';
    assignBtn.disabled = eligibleDrivers.length === 0;
  }
  if (deliveredBtn) {
    const assignedAt = order.driverAssignedAt ? new Date(order.driverAssignedAt).getTime() : 0;
    const dispatchWindowPassed = assignedAt > 0 && Date.now() - assignedAt >= 12 * 60 * 60 * 1000;
    deliveredBtn.hidden = normalizedStatus !== 'in-transit' || !order.driver || !dispatchWindowPassed;
  }

  // Render Line Items
  const itemsContainer = document.getElementById('drawerItemsList');
  if (itemsContainer) {
    if (!order.items || order.items.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.style.padding = '16px';
      emptyEl.style.color = 'var(--muted)';
      emptyEl.textContent = 'No item records attached to this order.';
      itemsContainer.replaceChildren(emptyEl);
    } else {
      const itemRows = order.items.map(item => {
        const row = document.createElement('div');
        row.className = 'drawer-item-row';

        const img = document.createElement('img');
        img.className = 'drawer-item-img';
        img.src = item.img;
        img.alt = item.title;
        img.onerror = function() {
          this.onerror = null;
          this.src = (typeof window.createProductFallbackSvg === 'function')
            ? window.createProductFallbackSvg(item.title)
            : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' rx=\'6\' fill=\'%23232030\'/%3E%3Ctext x=\'24\' y=\'29\' fill=\'%23c9a57a\' font-size=\'16\' text-anchor=\'middle\' font-family=\'sans-serif\'%3EV%3C/text%3E%3C/svg%3E';
        };

        const details = document.createElement('div');
        details.className = 'drawer-item-details';

        const title = document.createElement('div');
        title.className = 'drawer-item-title';
        title.textContent = item.title;

        const sub = document.createElement('div');
        sub.className = 'drawer-item-sub';
        sub.textContent = `${item.category} • Qty ${item.qty}`;

        details.append(title, sub);

        const price = document.createElement('div');
        price.className = 'drawer-item-price';
        price.textContent = window.fmtPrice(item.price);

        row.append(img, details, price);
        return row;
      });

      itemsContainer.replaceChildren(...itemRows);
    }
  }

  // Setup WhatsApp quick contact button
  const whatsappBtn = document.getElementById('drawerWhatsappBtn');
  if (whatsappBtn) {
    whatsappBtn.onclick = () => {
      const cleanPhone = order.customer.phone.replace(/[^0-9]/g, '');
      const text = encodeURIComponent(`Hi ${order.customer.fullName}, Velora Studio concierge here regarding Order ${order.id}.`);
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    };
  }
};

window.selectAndOpenOrder = function(orderId) {
  const order = (window.ordersData || []).find(o =>
    o.id === orderId ||
    o.orderNumber === orderId ||
    String(o.id) === String(orderId) ||
    String(o.orderNumber) === String(orderId)
  );
  if (!order) return;

  window.renderOrderDrawer(order);

  const drawer = document.getElementById('orderDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) drawer.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
  if ((!Array.isArray(window.driversData) || window.driversData.length === 0) && typeof window.fetchDriversFromDb === 'function') {
    window.fetchDriversFromDb();
  }
};

window.openOrderDrawer = function(orderId) {
  window.selectAndOpenOrder(orderId);
};

window.closeOrderDrawer = function() {
  const drawer = document.getElementById('orderDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeOrderDrawer();
  }
});

async function submitDispatchAction(order, action, body = {}) {
  const token = window.adminAuthApi?.getToken?.() ||
    localStorage.getItem('velora_admin_token') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token') || '';
  const baseUrl = (window.VELORA_API_URL || window.VELORA_API_BASE_URL || 'https://velora-e-commerce-qby7.onrender.com').replace(/\/+$/, '');
  const response = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(order.orderNumber)}/${action}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    ...(Object.keys(body).length ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `Order update failed (${response.status}).`);

  const refreshedOrders = await window.fetchOrdersFromDb();
  const updatedOrder = (Array.isArray(refreshedOrders) ? refreshedOrders : window.ordersData || [])
    .find(item => String(item.orderNumber) === String(order.orderNumber));
  if (updatedOrder) {
    window.renderOrderDrawer(updatedOrder);
    if (typeof window.renderOverviewView === 'function') window.renderOverviewView();
  }
  return data.order;
}

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('closeDrawerBtn');
  const backdrop = document.getElementById('drawerBackdrop');

  if (closeBtn) closeBtn.addEventListener('click', window.closeOrderDrawer);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) window.closeOrderDrawer();
    });
  }

  const btnTrack = document.getElementById('btnTrackOrder');
  if (btnTrack) {
    btnTrack.addEventListener('click', async () => {
      if (!window.currentActiveOrderId) return;
      const order = window.ordersData.find(o => o.id === window.currentActiveOrderId);
      if (!order) return;

      btnTrack.disabled = true;
      try {
        await submitDispatchAction(order, 'accept');
        window.showToast(`Order ${order.orderNumber} accepted at Velora Logistics Hub, Airport Industria.`);
      } catch (error) {
        window.showToast(error.message || 'Unable to accept order.');
      } finally {
        btnTrack.disabled = false;
      }
    });
  }

  const btnAssignDriver = document.getElementById('btnAssignDriver');
  if (btnAssignDriver) {
    btnAssignDriver.addEventListener('click', async () => {
      const order = window.ordersData.find(item => item.id === window.currentActiveOrderId);
      const driverSelect = document.getElementById('drawerDriverSelect');
      const driverId = Number(driverSelect?.value);
      if (!order || !driverId) return;

      btnAssignDriver.disabled = true;
      try {
        await submitDispatchAction(order, 'assign-driver', { driverId });
        window.showToast(`Driver assigned to order ${order.orderNumber}.`);
      } catch (error) {
        window.showToast(error.message || 'Unable to assign driver.');
      } finally {
        btnAssignDriver.disabled = false;
      }
    });
  }

  const btnDelivered = document.getElementById('btnDeliverOrder');
  if (btnDelivered) {
    btnDelivered.addEventListener('click', async () => {
      const order = window.ordersData.find(item => item.id === window.currentActiveOrderId);
      if (!order) return;
      btnDelivered.disabled = true;
      try {
        await submitDispatchAction(order, 'delivered');
        window.showToast(`Order ${order.orderNumber} marked delivered.`);
      } catch (error) {
        window.showToast(error.message || 'Unable to update delivery status.');
      } finally {
        btnDelivered.disabled = false;
      }
    });
  }

  const btnRefund = document.getElementById('btnRefundOrder');
  if (btnRefund) {
    btnRefund.addEventListener('click', () => {
      if (!window.currentActiveOrderId) return;
      const order = window.ordersData.find(o => o.id === window.currentActiveOrderId);
      if (!order) return;

      if (order.status === 'Cancelled') {
        window.showToast(`Order ${order.id} has already been cancelled and refunded.`);
        return;
      }

      order.status = 'Cancelled';
      window.saveOrders();

      // Check if return record exists, else add
      const existingRet = window.returnsData.find(r => r.orderId === order.id);
      if (!existingRet) {
        window.returnsData.unshift({
          id: `RET-09${Math.floor(Math.random() * 90 + 10)}`,
          orderId: order.id,
          customer: order.customer.fullName,
          reason: 'Client requested cancellation & full refund',
          refundAmount: order.total,
          status: 'Authorised'
        });
        window.saveReturns();
      }

      window.showToast(`Order ${order.id} cancelled. Refund of ${window.fmtPrice(order.total)} queued.`);
      window.renderOrderDrawer(order);
      if (typeof window.renderOrdersTable === 'function') window.renderOrdersTable();
      if (typeof window.renderKPICards === 'function') window.renderKPICards();
      if (typeof window.renderOverviewView === 'function') window.renderOverviewView();
      if (typeof window.renderReturnsView === 'function') window.renderReturnsView();
    });
  }

  const btnDelete = document.getElementById('btnDeleteOrder');
  if (btnDelete) {
    btnDelete.addEventListener('click', async () => {
      if (!window.currentActiveOrderId) return;
      const order = window.ordersData.find(item => item.id === window.currentActiveOrderId);
      if (!order) return;

      btnDelete.disabled = true;
      await window.deleteOrderFromDb(order);
      btnDelete.disabled = false;
    });
  }
});
