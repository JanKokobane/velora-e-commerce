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
  if (totalEl) totalEl.textContent = window.fmtPrice(order.total);

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
  const order = window.ordersData.find(o => o.id === orderId);
  if (!order) return;

  window.renderOrderDrawer(order);

  const drawer = document.getElementById('orderDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) drawer.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
};

window.closeOrderDrawer = function() {
  const drawer = document.getElementById('orderDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
};

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('closeDrawerBtn');
  const backdrop = document.getElementById('drawerBackdrop');

  if (closeBtn) closeBtn.addEventListener('click', window.closeOrderDrawer);
  if (backdrop) backdrop.addEventListener('click', window.closeOrderDrawer);

  const btnTrack = document.getElementById('btnTrackOrder');
  if (btnTrack) {
    btnTrack.addEventListener('click', () => {
      if (!window.currentActiveOrderId) return;
      const order = window.ordersData.find(o => o.id === window.currentActiveOrderId);
      if (!order) return;

      if (order.status === 'Paid') {
        order.status = 'In-Transit';
        window.showToast(`Order ${order.id} marked as In-Transit via Velora Fleet`);
      } else if (order.status === 'In-Transit') {
        order.status = 'Delivered';
        window.showToast(`Order ${order.id} marked as Delivered to recipient`);
      } else {
        window.showToast(`Order ${order.id} tracking status: ${order.status}`);
      }

      window.saveOrders();
      window.renderOrderDrawer(order);
      if (typeof window.renderOrdersTable === 'function') window.renderOrdersTable();
      if (typeof window.renderKPICards === 'function') window.renderKPICards();
      if (typeof window.renderOverviewView === 'function') window.renderOverviewView();
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
});
