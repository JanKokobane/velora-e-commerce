window.currentOrderStatusFilter = 'all';
window.orderSearchQuery = '';
window.orderSortMode = 'date-desc';
window.selectedOrderIds = new Set();
window._isFetchingOrders = false;
window.ordersLoadError = '';

function getAdminAuthToken() {
  try {
    if (
      window.adminAuthApi &&
      typeof window.adminAuthApi.getToken === 'function'
    ) {
      const token =
        window.adminAuthApi.getToken();

      if (token) {
        return token;
      }
    }
  } catch (_) {}

  return (
    localStorage.getItem('velora_admin_token') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('velora_admin_token') ||
    sessionStorage.getItem('admin_token') ||
    sessionStorage.getItem('token') ||
    ''
  );
}

function getOrdersApiBaseUrl() {
  if (
    typeof window !== 'undefined'
  ) {
    if (window.VELORA_API_URL) {
      return window.VELORA_API_URL;
    }

    if (window.VELORA_API_BASE_URL) {
      return window.VELORA_API_BASE_URL;
    }
  }

  return 'https://velora-e-commerce-qby7.onrender.com';
}

function getOrdersHeaders() {
  const token =
    getAdminAuthToken();

  return {
    'Content-Type': 'application/json',
    ...(token
      ? {
          Authorization:
            `Bearer ${token}`
        }
      : {})
  };
}

function formatOrderDate(dateString) {
  if (!dateString) {
    return {
      full: 'Recently',
      short: 'Recent'
    };
  }

  const date =
    new Date(dateString);

  if (isNaN(date.getTime())) {
    return {
      full: 'Recently',
      short: 'Recent'
    };
  }

  return {
    full:
      date.toLocaleDateString(
        'en-ZA',
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }
      ),
    short:
      date.toLocaleDateString(
        'en-ZA',
        {
          month: 'short',
          day: 'numeric'
        }
      )
  };
}

function normalizeOrderStatus(order) {
  const paymentStatus =
    String(
      order.paymentStatus ||
      order.payment_status ||
      ''
    ).toLowerCase();

  const orderStatus =
    String(
      order.status ||
      ''
    ).toLowerCase();

  if (paymentStatus === 'refunded' || orderStatus === 'refunded') {
    return 'Refunded';
  }

  if (
    orderStatus ===
    'delivered'
  ) {
    return 'Delivered';
  }

  if (orderStatus === 'accepted') {
    return 'Accepted at Hub';
  }

  if (
    orderStatus ===
      'cancelled'
  ) {
    return 'Cancelled';
  }

  if (
    orderStatus ===
      'in-transit' ||
    orderStatus ===
      'transit' ||
    orderStatus ===
      'shipped'
  ) {
    return 'In-Transit';
  }

  if (
    paymentStatus === 'paid' ||
    paymentStatus ===
      'completed' ||
    paymentStatus ===
      'settled' ||
    orderStatus === 'paid' ||
    orderStatus ===
      'confirmed' ||
    orderStatus ===
      'processing'
  ) {
    return 'Paid';
  }

  if (
    orderStatus ===
    'pending'
  ) {
    return 'Pending';
  }

  return 'Paid';
}

function mapDbOrder(order) {
  const orderNumber =
    order.orderNumber ||
    order.order_number ||
    order.id ||
    'VEL-0000';

  const displayId =
    String(orderNumber)
      .startsWith('#')
      ? String(orderNumber)
      : `#${orderNumber}`;

  const dates =
    formatOrderDate(
      order.createdAt ||
      order.created_at ||
      order.date
    );

  const total =
    Number(
      order.total ||
      order.subtotal ||
      0
    );

  const shipping =
    order.shipping || {};

  const customerName =
    shipping.fullName ||
    order.fullName ||
    order.full_name ||
    order.customer?.fullName ||
    order.customer?.name ||
    'Valued Client';

  const customerEmail =
    shipping.email ||
    order.email ||
    order.customer?.email ||
    '';

  const customerPhone =
    shipping.phone ||
    order.phone ||
    order.customer?.phone ||
    '';

  const rawItems =
    Array.isArray(order.items)
      ? order.items
      : [];

  const items =
    rawItems.map(
      (item, index) => ({
        id:
          item.productId ||
          item.product_id ||
          item.id ||
          index + 1,

        title:
          item.productName ||
          item.product_name ||
          item.title ||
          item.name ||
          'Velora Curated Essential',

        category:
          item.category ||
          'Atelier',

        price:
          Number(
            item.unitPrice ||
            item.unit_price ||
            item.price ||
            0
          ),

        qty:
          Number(
            item.quantity ||
            item.qty ||
            1
          ),

        img:
          item.image ||
          item.image_url ||
          ''
      })
    );

  const avatar =
    typeof window.createInitialsAvatarSvg ===
    'function'
      ? window.createInitialsAvatarSvg(
          customerName
        )
      : '';

  return {
    id: displayId,

    rawId: order.id,

    orderNumber:
      order.orderNumber ||
      order.order_number ||
      orderNumber,

    userId:
      order.userId ||
      order.user_id,

    date: dates.full,

    dateShort:
      dates.short,

    rawDate:
      order.createdAt ||
      order.created_at,

    status:
      normalizeOrderStatus(
        order
      ),

    paymentStatus:
      order.paymentStatus ||
      order.payment_status ||
      'pending',

    subtotal:
      Number(
        order.subtotal ||
        total
      ),

    deliveryFee:
      Number(
        order.deliveryFee ||
        order.delivery_fee ||
        0
      ),

    total,

    customer: {
      fullName:
        customerName,
      email:
        customerEmail,
      phone:
        customerPhone,
      avatar
    },

    shipping: {
      street:
        shipping.street ||
        order.street ||
        '',

      city:
        shipping.city ||
        order.city ||
        '',

      province:
        shipping.province ||
        order.province ||
        '',

      postalCode:
        shipping.postalCode ||
        order.postal_code ||
        ''
    },

    items,

    waybill:
      order.trackingNumber ||
      order.tracking_number ||
      order.waybill ||
      '',

    trackingLocation:
      order.trackingLocation ||
      order.tracking_location ||
      '',

    acceptedAt:
      order.acceptedAt ||
      order.accepted_at ||
      null,

    driverAssignedAt:
      order.driverAssignedAt ||
      order.driver_assigned_at ||
      null,

    driver:
      order.driver ||
      null
  };
}

window.fetchOrdersFromDb =
  async function(
    showToastFeedback = false
  ) {
    if (!getAdminAuthToken()) {
      return [];
    }

    if (
      window._isFetchingOrders
    ) {
      return;
    }

    window._isFetchingOrders =
      true;

  window.refreshOrderByNumberFromDb = async function(orderNumber) {
    const rawOrder = await window.fetchOrderByNumberFromDb(orderNumber);
    if (!rawOrder) return null;

    const updatedOrder = mapDbOrder(rawOrder);
    const orders = Array.isArray(window.ordersData) ? window.ordersData : [];
    const existingIndex = orders.findIndex(order =>
      String(order.orderNumber) === String(updatedOrder.orderNumber)
    );
    if (existingIndex >= 0) orders[existingIndex] = updatedOrder;
    else orders.unshift(updatedOrder);
    window.ordersData = orders;

    window.renderOrdersTable();
    window.renderKPICards();
    if (typeof window.renderOverviewView === 'function') window.renderOverviewView();
    return updatedOrder;
  };

    const refreshBtn =
      document.getElementById(
        'refreshOrdersBtn'
      );

    if (refreshBtn) {
      refreshBtn.disabled =
        true;

      refreshBtn.textContent =
        '↻ Syncing...';
    }

    try {
      const token =
        getAdminAuthToken();

      if (!token) {
        throw new Error(
          'No administrator token found. Please sign in again.'
        );
      }

      const baseUrl =
        getOrdersApiBaseUrl()
          .replace(/\/+$/, '');

      const response =
        await fetch(
          `${baseUrl}/api/orders/all`,
          {
            method: 'GET',
            headers:
              getOrdersHeaders()
          }
        );

      const contentType =
        response.headers.get(
          'content-type'
        ) || '';

      let data;

      if (
        contentType.includes(
          'application/json'
        )
      ) {
        data =
          await response.json();
      } else {
        const responseText =
          await response.text();

        throw new Error(
          `Orders API returned HTTP ${response.status}: ${responseText.substring(0, 200)}`
        );
      }

      if (
        response.status ===
        401
      ) {
        throw new Error(
          'Administrator authentication failed. Please sign in again.'
        );
      }

      if (
        response.status ===
        403
      ) {
        throw new Error(
          'Administrator access is required to view orders.'
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          `Orders API returned HTTP ${response.status}.`
        );
      }

      const rawOrders =
        Array.isArray(
          data?.orders
        )
          ? data.orders
          : Array.isArray(data)
          ? data
          : [];

      window.ordersData =
        rawOrders.map(
          mapDbOrder
        );
      window.ordersLoadError = '';

      window.renderKPICards();
      window.renderOrdersTable();

      if (
        typeof window.saveOrders ===
        'function'
      ) {
        window.saveOrders();
      }

      if (
        typeof window.renderOverviewView ===
        'function'
      ) {
        window.renderOverviewView();
      }

      if (
        typeof window.renderCustomersView ===
        'function'
      ) {
        window.renderCustomersView();
      }

      if (
        showToastFeedback &&
        typeof window.showToast ===
        'function'
      ) {
        window.showToast(
          `Synced ${window.ordersData.length} orders from database.`
        );
      }

      return window.ordersData;
    } catch (error) {
      console.error(
        '[Velora Admin] Error fetching orders:',
        error
      );

      window.ordersLoadError =
        error.message ||
        'Unable to retrieve orders.';

      window.renderKPICards();
      window.renderOrdersTable();

      if (
        showToastFeedback &&
        typeof window.showToast ===
        'function'
      ) {
        window.showToast(
          `Could not sync orders: ${error.message}`
        );
      }

      return [];
    } finally {
      window._isFetchingOrders =
        false;

      if (refreshBtn) {
        refreshBtn.disabled =
          false;

        refreshBtn.textContent =
          '↻ Refresh DB';
      }
    }
  };

window.fetchOrderByNumberFromDb =
  async function(
    orderNumber
  ) {
    const token =
      getAdminAuthToken();

    if (!token) {
      throw new Error(
        'No administrator token found.'
      );
    }

    const baseUrl =
      getOrdersApiBaseUrl()
        .replace(/\/+$/, '');

    const response =
      await fetch(
        `${baseUrl}/api/orders/${encodeURIComponent(orderNumber)}`,
        {
          method: 'GET',
          headers:
            getOrdersHeaders()
        }
      );

    const contentType =
      response.headers.get(
        'content-type'
      ) || '';

    let data;

    if (
      contentType.includes(
        'application/json'
      )
    ) {
      data =
        await response.json();
    } else {
      const responseText =
        await response.text();

      throw new Error(
        `Order API returned HTTP ${response.status}: ${responseText.substring(0, 200)}`
      );
    }

    if (
      response.status ===
      401
    ) {
      throw new Error(
        'Administrator authentication failed.'
      );
    }

    if (
      response.status ===
      403
    ) {
      throw new Error(
        'Administrator access is required.'
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
        `Order API returned HTTP ${response.status}.`
      );
    }

    return (
      data?.order ||
      null
    );
  };

window.deleteOrderFromDb = async function(order) {
  if (!order) return false;

  const confirmed = typeof window.showConfirmModal === 'function'
    ? await window.showConfirmModal({
        title: 'Delete Order',
        subtitle: 'This also permanently removes its payment record.',
        message: `Delete order ${order.orderNumber || order.id} for ${order.customer?.fullName || 'this customer'}? This action cannot be undone.`,
        confirmText: 'Delete Order',
        cancelText: 'Keep Order',
        danger: true
      })
    : window.confirm(`Delete order ${order.orderNumber || order.id} and its payment record? This cannot be undone.`);

  if (!confirmed) return false;

  try {
    const baseUrl = getOrdersApiBaseUrl().replace(/\/+$/, '');
    const response = await fetch(
      `${baseUrl}/api/orders/${encodeURIComponent(order.orderNumber)}`,
      {
        method: 'DELETE',
        headers: getOrdersHeaders()
      }
    );
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `Order deletion failed (${response.status}).`);
    }

    window.selectedOrderIds.delete(order.id);
    if (window.currentActiveOrderId === order.id && typeof window.closeOrderDrawer === 'function') {
      window.closeOrderDrawer();
    }
    await window.fetchOrdersFromDb();
    if (typeof window.showToast === 'function') {
      window.showToast(`Order ${order.orderNumber || order.id} deleted.`);
    }
    return true;
  } catch (error) {
    console.error('[Velora Admin] Error deleting order:', error);
    if (typeof window.showToast === 'function') {
      window.showToast(error.message || 'Unable to delete order.');
    }
    return false;
  }
};

window.getStatusClass =
  function(status) {
    const value =
      String(
        status || ''
      ).toLowerCase();

    if (
      value === 'paid'
    ) {
      return 'status-paid';
    }

    if (
      value ===
        'in-transit' ||
      value === 'transit'
    ) {
      return 'status-transit';
    }

    if (
      value ===
      'delivered'
    ) {
      return 'status-delivered';
    }

    if (
      value ===
      'cancelled'
    ) {
      return 'status-cancelled';
    }

    if (value === 'refunded') {
      return 'status-cancelled';
    }

    if (
      value ===
      'pending'
    ) {
      return 'status-transit';
    }

    return 'status-paid';
  };

window.renderKPICards =
  function() {
    const orders =
      Array.isArray(
        window.ordersData
      )
        ? window.ordersData
        : [];

    const revenueOrders = orders.filter(order => {
      const orderStatus = String(order.status || '').toLowerCase();
      const paymentStatus = String(order.paymentStatus || order.payment_status || '').toLowerCase();
      return !['cancelled', 'canceled', 'refunded'].includes(orderStatus) && paymentStatus !== 'refunded';
    });
    const totalRevenue = revenueOrders.reduce(
      (total, order) => total + (Number(order.total) || 0),
      0
    );

    const totalOrders =
      orders.length;

    const pendingOrders =
      orders.filter(
        order =>
          order.status ===
            'Paid' ||
          order.status ===
            'Pending'
      ).length;

    const averageOrder =
      revenueOrders.length > 0
        ? totalRevenue /
          revenueOrders.length
        : 0;

    const revenueElement =
      document.getElementById(
        'ordersKpiRevenue'
      );

    const countElement =
      document.getElementById(
        'ordersKpiCount'
      );

    const pendingElement =
      document.getElementById(
        'ordersKpiPending'
      );

    const averageElement =
      document.getElementById(
        'ordersKpiAOV'
      );

    if (revenueElement) {
      revenueElement.textContent =
        typeof window.fmtPrice ===
        'function'
          ? window.fmtPrice(
              totalRevenue
            )
          : `R${totalRevenue.toFixed(2)}`;
    }

    if (countElement) {
      countElement.textContent =
        String(totalOrders);
    }

    if (pendingElement) {
      pendingElement.textContent =
        String(pendingOrders);
    }

    if (averageElement) {
      averageElement.textContent =
        typeof window.fmtPrice ===
        'function'
          ? window.fmtPrice(
              averageOrder
            )
          : `R${averageOrder.toFixed(2)}`;
    }

    const ordersBadge =
      document.getElementById(
        'sidebarOrdersBadge'
      );

    if (ordersBadge) {
      ordersBadge.textContent =
        String(totalOrders);
    }
  };

window.renderOrdersTable =
  function() {
    const tbody =
      document.getElementById(
        'ordersTableBody'
      );

    if (!tbody) {
      return;
    }

    const orders =
      Array.isArray(
        window.ordersData
      )
        ? window.ordersData
        : [];

    let filtered =
      orders.filter(
        order => {
          if (
            window.currentOrderStatusFilter !==
            'all'
          ) {
            const status =
              String(
                order.status ||
                ''
              ).toLowerCase();

            if (
              window.currentOrderStatusFilter ===
              'transit'
            ) {
              if (
                status !==
                  'in-transit' &&
                status !==
                  'pending'
              ) {
                return false;
              }
            } else if (
              status !==
              window.currentOrderStatusFilter
            ) {
              return false;
            }
          }

          if (
            window.orderSearchQuery
          ) {
            const query =
              window.orderSearchQuery.toLowerCase();

            const matchesId =
              String(
                order.id || ''
              )
                .toLowerCase()
                .includes(query);

            const matchesName =
              String(
                order.customer?.fullName ||
                ''
              )
                .toLowerCase()
                .includes(query);

            const matchesEmail =
              String(
                order.customer?.email ||
                ''
              )
                .toLowerCase()
                .includes(query);

            if (
              !matchesId &&
              !matchesName &&
              !matchesEmail
            ) {
              return false;
            }
          }

          return true;
        }
      );

    filtered.sort(
      (a, b) => {
        const dateA =
          a.rawDate
            ? new Date(a.rawDate)
            : new Date(a.date);

        const dateB =
          b.rawDate
            ? new Date(b.rawDate)
            : new Date(b.date);

        if (
          window.orderSortMode ===
          'date-desc'
        ) {
          return dateB - dateA;
        }

        if (
          window.orderSortMode ===
          'date-asc'
        ) {
          return dateA - dateB;
        }

        if (
          window.orderSortMode ===
          'total-desc'
        ) {
          return (
            Number(b.total || 0) -
            Number(a.total || 0)
          );
        }

        if (
          window.orderSortMode ===
          'total-asc'
        ) {
          return (
            Number(a.total || 0) -
            Number(b.total || 0)
          );
        }

        return 0;
      }
    );

    if (
      filtered.length ===
      0
    ) {
      const row =
        document.createElement(
          'tr'
        );

      const cell =
        document.createElement(
          'td'
        );

      cell.colSpan = 7;
      cell.style.textAlign =
        'center';
      cell.style.padding =
        '40px';
      cell.style.color =
        'var(--muted)';

      cell.textContent =
        window.ordersLoadError
          ? `Could not load orders: ${window.ordersLoadError}`
          : window._isFetchingOrders
          ? 'Fetching orders from database...'
          : orders.length === 0
          ? 'No orders recorded in the database yet.'
          : 'No orders found matching the filter criteria.';

      row.appendChild(
        cell
      );

      tbody.replaceChildren(
        row
      );

      return;
    }

    const rows =
      filtered.map(
        order => {
          const row =
            document.createElement(
              'tr'
            );

          row.id =
            `order-row-${String(order.id).replace('#', '')}`;

          if (
            window.selectedOrderIds.has(
              order.id
            )
          ) {
            row.classList.add(
              'selected'
            );
          }

          const selectCell =
            document.createElement(
              'td'
            );

          selectCell.className =
            'select-col';

          const checkbox =
            document.createElement(
              'input'
            );

          checkbox.type =
            'checkbox';

          checkbox.className =
            'dash-checkbox';

          checkbox.checked =
            window.selectedOrderIds.has(
              order.id
            );

          checkbox.addEventListener(
            'change',
            event => {
              event.stopPropagation();

              if (
                checkbox.checked
              ) {
                window.selectedOrderIds.add(
                  order.id
                );

                row.classList.add(
                  'selected'
                );
              } else {
                window.selectedOrderIds.delete(
                  order.id
                );

                row.classList.remove(
                  'selected'
                );
              }

              window.updateSelectAllCheckboxState();
            }
          );

          selectCell.appendChild(
            checkbox
          );

          const idCell =
            document.createElement(
              'td'
            );

          idCell.className =
            'order-id-cell';

          idCell.textContent =
            order.id;

          const customerCell =
            document.createElement(
              'td'
            );

          const customerWrapper =
            document.createElement(
              'div'
            );

          customerWrapper.className =
            'customer-cell';

          const avatar =
            document.createElement(
              'img'
            );

          avatar.className =
            'customer-avatar';

          avatar.src =
            order.customer.avatar;

          avatar.alt =
            order.customer.fullName;

          avatar.onerror =
            function() {
              this.onerror =
                null;

              if (
                typeof window.createInitialsAvatarSvg ===
                'function'
              ) {
                this.src =
                  window.createInitialsAvatarSvg(
                    order.customer.fullName
                  );
              }
            };

          const name =
            document.createElement(
              'span'
            );

          name.className =
            'customer-name';

          name.textContent =
            order.customer.fullName;

          customerWrapper.append(
            avatar,
            name
          );

          customerCell.appendChild(
            customerWrapper
          );

          const dateCell =
            document.createElement(
              'td'
            );

          dateCell.className =
            'order-date-cell';

          dateCell.textContent =
            order.dateShort ||
            order.date;

          const totalCell =
            document.createElement(
              'td'
            );

          totalCell.className =
            'order-total-cell';

          totalCell.textContent =
            typeof window.fmtPrice ===
            'function'
              ? window.fmtPrice(
                  order.total
                )
              : `R${Number(order.total || 0).toFixed(2)}`;

          const statusCell =
            document.createElement(
              'td'
            );

          const status =
            document.createElement(
              'span'
            );

          status.className =
            `status-pill ${window.getStatusClass(order.status)}`;

          status.textContent =
            order.status;

          statusCell.appendChild(
            status
          );

          const actionsCell =
            document.createElement(
              'td'
            );
          actionsCell.style.display = 'flex';
          actionsCell.style.alignItems = 'center';
          actionsCell.style.gap = '6px';
          actionsCell.style.whiteSpace = 'nowrap';

          const viewButton =
            document.createElement(
              'button'
            );

          viewButton.type =
            'button';

          viewButton.className =
            'drawer-btn drawer-btn-dark';

          viewButton.style.flex =
            'initial';

          viewButton.style.padding =
            '4px 8px';

          viewButton.style.fontSize =
            '12px';

          viewButton.textContent =
            'View';

          viewButton.addEventListener(
            'click',
            event => {
              event.stopPropagation();

              if (
                typeof window.openOrderDrawer ===
                'function'
              ) {
                window.openOrderDrawer(
                  order.id
                );
              }
            }
          );

          actionsCell.appendChild(
            viewButton
          );

          const deleteButton = document.createElement('button');
          deleteButton.type = 'button';
          deleteButton.className = 'drawer-btn drawer-btn-outline';
          deleteButton.style.flex = 'initial';
          deleteButton.style.padding = '4px 8px';
          deleteButton.style.fontSize = '12px';
          deleteButton.style.color = '#b91c1c';
          deleteButton.textContent = 'Delete';
          deleteButton.hidden = String(order.status || '').toLowerCase() !== 'cancelled';
          deleteButton.addEventListener('click', async event => {
            event.stopPropagation();
            deleteButton.disabled = true;
            await window.deleteOrderFromDb(order);
            deleteButton.disabled = false;
          });
          actionsCell.appendChild(deleteButton);

          row.append(
            selectCell,
            idCell,
            customerCell,
            dateCell,
            totalCell,
            statusCell,
            actionsCell
          );

          row.style.cursor =
            'pointer';

          row.addEventListener(
            'click',
            () => {
              if (
                typeof window.openOrderDrawer ===
                'function'
              ) {
                window.openOrderDrawer(
                  order.id
                );
              }
            }
          );

          return row;
        }
      );

    tbody.replaceChildren(
      ...rows
    );

    window.updateSelectAllCheckboxState();
  };

window.updateSelectAllCheckboxState =
  function() {
    const selectAll =
      document.getElementById(
        'selectAllOrders'
      );

    if (!selectAll) {
      return;
    }

    const orders =
      Array.isArray(
        window.ordersData
      )
        ? window.ordersData
        : [];

    selectAll.checked =
      orders.length > 0 &&
      window.selectedOrderIds.size ===
        orders.length;
  };

window.setOrderStatusFilter =
  function(statusKey) {
    window.currentOrderStatusFilter =
      statusKey;

    window.renderOrdersTable();
  };

document.addEventListener(
  'DOMContentLoaded',
  () => {
    document
      .querySelectorAll(
        '.status-tab-btn[data-status]'
      )
      .forEach(button => {
        button.addEventListener(
          'click',
          () => {
            document
              .querySelectorAll(
                '.status-tab-btn[data-status]'
              )
              .forEach(item =>
                item.classList.remove(
                  'active'
                )
              );

            button.classList.add(
              'active'
            );

            window.setOrderStatusFilter(
              button.getAttribute(
                'data-status'
              )
            );
          }
        );
      });

    const searchInput =
      document.getElementById(
        'orderSearchInput'
      );

    if (searchInput) {
      searchInput.addEventListener(
        'input',
        event => {
          window.orderSearchQuery =
            event.target.value.trim();

          window.renderOrdersTable();
        }
      );
    }

    const sortSelect =
      document.getElementById(
        'sortFilterSelect'
      );

    if (sortSelect) {
      sortSelect.addEventListener(
        'change',
        event => {
          window.orderSortMode =
            event.target.value;

          window.renderOrdersTable();
        }
      );
    }

    const selectAll =
      document.getElementById(
        'selectAllOrders'
      );

    if (selectAll) {
      selectAll.addEventListener(
        'change',
        () => {
          const orders =
            Array.isArray(
              window.ordersData
            )
              ? window.ordersData
              : [];

          if (
            selectAll.checked
          ) {
            orders.forEach(
              order =>
                window.selectedOrderIds.add(
                  order.id
                )
            );
          } else {
            window.selectedOrderIds.clear();
          }

          window.renderOrdersTable();
        }
      );
    }

    window.fetchOrdersFromDb();
  }
);