/**
 * Customers Section Controller (js/customers.js)
 * Fetches real registered clients from the Velora database via /api/users
 * Pure DOM implementation with NO innerHTML.
 */

(function () {
  window.customerSearchQuery = '';
  window.customerTierFilter = 'all';
  window._isFetchingCustomers = false;
  window._customersFetchedOnce = false;

  if (typeof window.FALLBACK_ADMIN_TOKEN === 'undefined') {
    window.FALLBACK_ADMIN_TOKEN =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6OCwiZW1haWwiOiJ0ZXN0YWRtaW4xMjM0QHZlbG9yYS5jby56YSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc5MDYwNDQxNCwiZXhwIjoxNzkxMjA5MjE0fQ.Vjjvxk5_6XNwplbw21MDDLXM9KSF3sfBYJOuA2QYzug';
  }

  function getAdminAuthToken() {
    try {
      if (
        window.adminAuthApi &&
        typeof window.adminAuthApi.getToken === 'function'
      ) {
        const token = window.adminAuthApi.getToken();
        if (token) return token;
      }
    } catch (_) {}

    return (
      localStorage.getItem('velora_admin_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('velora_admin_token') ||
      window.FALLBACK_ADMIN_TOKEN
    );
  }

  function getCustomersApiBaseUrl() {
    if (typeof window !== 'undefined') {
      if (window.VELORA_API_URL) return window.VELORA_API_URL;
      if (window.VELORA_API_BASE_URL) return window.VELORA_API_BASE_URL;
    }
    return 'https://velora-e-commerce-qby7.onrender.com';
  }

  function formatCustomerDate(dateString) {
    if (!dateString) return 'Recently';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (_) {
      return 'Recently';
    }
  }

  /**
   * Fetch registered users directly from the database
   */
  window.fetchCustomersFromDb = async function(showToastFeedback = false) {
    if (window._isFetchingCustomers) return;
    window._isFetchingCustomers = true;

    const refreshBtn = document.getElementById('refreshCustomersBtn');
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '↻ Syncing...';
    }

    const tbody = document.getElementById('customersTableBody');
    if (tbody && (!window.customersData || window.customersData.length === 0)) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 8;
      td.style.textAlign = 'center';
      td.style.padding = '40px';
      td.style.color = 'var(--muted)';
      td.textContent = 'Connecting to database & fetching registered clients...';
      tr.appendChild(td);
      tbody.replaceChildren(tr);
    }

    const token = getAdminAuthToken();
    const baseUrl = getCustomersApiBaseUrl();

    try {
      let response = await fetch(`${baseUrl}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      // If initial token was rejected, retry with fallback token
      if (response.status === 401 && token !== window.FALLBACK_ADMIN_TOKEN) {
        response = await fetch(`${baseUrl}/api/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${window.FALLBACK_ADMIN_TOKEN}`
          }
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch users from database (HTTP ${response.status})`);
      }

      const data = await response.json();
      const rawUsers = Array.isArray(data.users)
        ? data.users
        : Array.isArray(data)
        ? data
        : [];

      const realCustomers = rawUsers.map((u) => {
        const rawId = String(u.id || '');
        const displayId =
          rawId.length > 12
            ? `CUST-${rawId.slice(0, 8).toUpperCase()}`
            : rawId
            ? `CUST-${rawId}`
            : 'CUST-000';

        const userEmail = (u.email || '').toLowerCase().trim();
        const userOrders = (
          Array.isArray(window.ordersData) ? window.ordersData : []
        ).filter((o) => {
          const orderEmail = (o?.customer?.email || o?.email || '')
            .toLowerCase()
            .trim();
          return (
            (orderEmail && userEmail && orderEmail === userEmail) ||
            (o?.user_id && String(o.user_id) === rawId)
          );
        });

        const totalOrders = Number(
          u.total_orders || u.totalOrders || userOrders.length || 0
        );
        const lifetimeSpend = Number(
          u.lifetime_spend ||
            u.lifetimeSpend ||
            userOrders.reduce(
              (sum, o) => sum + (parseFloat(o.total) || 0),
              0
            )
        );

        const locationParts = [u.city, u.province].filter(Boolean);
        const location =
          locationParts.length > 0 ? locationParts.join(', ') : 'South Africa';

        return {
          id: displayId,
          fullId: rawId,
          name: u.full_name || 'Client',
          email: u.email || '—',
          phone: u.phone || '—',
          city: location,
          tier: u.member_tier || 'Velora Client',
          totalOrders: totalOrders,
          lifetimeSpend: lifetimeSpend,
          lastActive: formatCustomerDate(u.updated_at || u.created_at),
          avatar:
            typeof window.createInitialsAvatarSvg === 'function'
              ? window.createInitialsAvatarSvg(u.full_name || 'V')
              : '',
          sms_email_consent: Boolean(u.sms_email_consent),
          created_at: u.created_at
        };
      });

      window.customersData = realCustomers;
      window._customersFetchedOnce = true;

      if (typeof window.saveCustomers === 'function') {
        window.saveCustomers();
      }

      window.renderCustomersView();

      if (showToastFeedback && typeof window.showToast === 'function') {
        window.showToast(`Synced ${realCustomers.length} clients from database.`);
      }
    } catch (err) {
      console.error('[Velora Admin] Error fetching users from database:', err);
      if (showToastFeedback && typeof window.showToast === 'function') {
        window.showToast('Could not sync with database: ' + err.message);
      }
      // Still render any existing state
      window.renderCustomersView();
    } finally {
      window._isFetchingCustomers = false;
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '↻ Refresh DB';
      }
    }
  };

  window.renderCustomersView = function() {
    const customers = Array.isArray(window.customersData)
      ? window.customersData
      : [];

    const totalClients = customers.length;
    const vipClients = customers.filter(
      (c) => c.tier === 'VIP Privilege' || c.tier === 'Gold Member'
    ).length;
    const totalLifetimeSpend = customers.reduce(
      (acc, c) => acc + (c.lifetimeSpend || 0),
      0
    );
    const avgLifetimeVal = totalClients ? totalLifetimeSpend / totalClients : 0;

    const totalEl = document.getElementById('customersKpiTotalCount');
    const vipEl = document.getElementById('customersKpiVipCount');
    const ltvEl = document.getElementById('customersKpiAvgLtv');

    if (totalEl) totalEl.textContent = totalClients.toString();
    if (vipEl) vipEl.textContent = vipClients.toString();
    if (ltvEl) {
      ltvEl.textContent =
        typeof window.fmtPrice === 'function'
          ? window.fmtPrice(avgLifetimeVal)
          : `R${avgLifetimeVal.toFixed(2)}`;
    }

    const sidebarBadge = document.getElementById('sidebarCustomersBadge');
    if (sidebarBadge) sidebarBadge.textContent = totalClients.toString();

    // Populate dynamic tiers in the filter select
    const tierSelect = document.getElementById('customerTierFilter');
    if (tierSelect) {
      const existingValues = Array.from(tierSelect.options).map((o) => o.value);
      const uniqueTiers = [
        ...new Set(customers.map((c) => c.tier).filter(Boolean))
      ];
      uniqueTiers.forEach((tier) => {
        if (!existingValues.includes(tier)) {
          const opt = document.createElement('option');
          opt.value = tier;
          opt.textContent = tier;
          tierSelect.appendChild(opt);
        }
      });
    }

    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    const filtered = customers.filter((cust) => {
      if (
        window.customerTierFilter !== 'all' &&
        cust.tier !== window.customerTierFilter
      ) {
        return false;
      }
      if (window.customerSearchQuery) {
        const q = window.customerSearchQuery.toLowerCase();
        const matchName = (cust.name || '').toLowerCase().includes(q);
        const matchEmail = (cust.email || '').toLowerCase().includes(q);
        const matchCity = (cust.city || '').toLowerCase().includes(q);
        const matchPhone = (cust.phone || '').toLowerCase().includes(q);
        const matchId = (cust.id || '').toLowerCase().includes(q);
        const matchTier = (cust.tier || '').toLowerCase().includes(q);
        if (
          !matchName &&
          !matchEmail &&
          !matchCity &&
          !matchPhone &&
          !matchId &&
          !matchTier
        ) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 8;
      td.style.textAlign = 'center';
      td.style.padding = '40px';
      td.style.color = 'var(--muted)';
      td.textContent = window._isFetchingCustomers
        ? 'Fetching clients from database...'
        : totalClients === 0
        ? 'No registered clients found in database.'
        : 'No clients match the current filter.';
      tr.appendChild(td);
      tbody.replaceChildren(tr);
      return;
    }

    const rows = filtered.map((cust) => {
      const tr = document.createElement('tr');

      // 1. Client cell with avatar, name and ID
      const tdClient = document.createElement('td');
      const custCell = document.createElement('div');
      custCell.className = 'customer-cell';

      const avatar = document.createElement('img');
      avatar.className = 'customer-avatar';
      avatar.src =
        cust.avatar ||
        (typeof window.createInitialsAvatarSvg === 'function'
          ? window.createInitialsAvatarSvg(cust.name)
          : '');
      avatar.alt = cust.name;
      avatar.onerror = function () {
        this.onerror = null;
        this.src =
          typeof window.createInitialsAvatarSvg === 'function'
            ? window.createInitialsAvatarSvg(cust.name)
            : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23232030\'/%3E%3Ctext x=\'20\' y=\'24\' fill=\'%23c9a57a\' font-size=\'14\' text-anchor=\'middle\' font-family=\'sans-serif\'%3EV%3C/text%3E%3C/svg%3E';
      };

      const infoWrap = document.createElement('div');
      const nameEl = document.createElement('div');
      nameEl.style.fontWeight = '700';
      nameEl.style.color = 'var(--ink)';
      nameEl.style.fontSize = '13.5px';
      nameEl.textContent = cust.name;

      const idEl = document.createElement('div');
      idEl.style.fontSize = '11px';
      idEl.style.color = 'var(--muted)';
      idEl.title = cust.fullId || cust.id;
      idEl.textContent = cust.id;

      infoWrap.append(nameEl, idEl);
      custCell.append(avatar, infoWrap);
      tdClient.appendChild(custCell);

      // 2. Contact details
      const tdContact = document.createElement('td');
      const emailEl = document.createElement('div');
      emailEl.style.fontSize = '13px';
      emailEl.style.fontWeight = '500';
      emailEl.textContent = cust.email;

      const phoneEl = document.createElement('div');
      phoneEl.style.fontSize = '11.5px';
      phoneEl.style.color = 'var(--muted)';
      phoneEl.style.display = 'flex';
      phoneEl.style.alignItems = 'center';
      phoneEl.style.gap = '6px';

      const phoneText = document.createElement('span');
      phoneText.textContent = cust.phone;
      phoneEl.appendChild(phoneText);

      if (cust.sms_email_consent) {
        const consentBadge = document.createElement('span');
        consentBadge.style.fontSize = '9.5px';
        consentBadge.style.padding = '1px 5px';
        consentBadge.style.borderRadius = '3px';
        consentBadge.style.background = 'rgba(85, 117, 91, 0.12)';
        consentBadge.style.color = '#55755b';
        consentBadge.style.fontWeight = '600';
        consentBadge.title = 'Client opted in for SMS and email notifications';
        consentBadge.textContent = 'Opted-in';
        phoneEl.appendChild(consentBadge);
      }

      tdContact.append(emailEl, phoneEl);

      // 3. City
      const tdCity = document.createElement('td');
      tdCity.style.fontSize = '13px';
      tdCity.textContent = cust.city;

      // 4. Tier
      const tdTier = document.createElement('td');
      const tierTag = document.createElement('span');
      let tierClass = 'tier-member';
      if (cust.tier === 'VIP Privilege') tierClass = 'tier-vip';
      else if (cust.tier === 'Gold Member') tierClass = 'tier-gold';

      tierTag.className = `tier-tag ${tierClass}`;
      tierTag.textContent = `${
        cust.tier === 'VIP Privilege' ? '★ ' : ''
      }${cust.tier}`;
      tdTier.appendChild(tierTag);

      // 5. Total Orders
      const tdOrders = document.createElement('td');
      tdOrders.style.fontWeight = '600';
      tdOrders.style.fontSize = '13.5px';
      tdOrders.textContent = `${cust.totalOrders} order${
        cust.totalOrders === 1 ? '' : 's'
      }`;

      // 6. Lifetime spend
      const tdSpend = document.createElement('td');
      tdSpend.style.fontWeight = '700';
      tdSpend.style.color = 'var(--ink)';
      tdSpend.style.fontSize = '13.5px';
      tdSpend.textContent =
        typeof window.fmtPrice === 'function'
          ? window.fmtPrice(cust.lifetimeSpend)
          : `R${(cust.lifetimeSpend || 0).toFixed(2)}`;

      // 7. Last Active
      const tdActive = document.createElement('td');
      tdActive.style.fontSize = '12.5px';
      tdActive.style.color = 'var(--muted)';
      tdActive.textContent = cust.lastActive;

      // 8. Action button
      const tdAction = document.createElement('td');
      const viewBtn = document.createElement('button');
      viewBtn.type = 'button';
      viewBtn.className = 'drawer-btn drawer-btn-dark';
      viewBtn.style.flex = 'initial';
      viewBtn.style.padding = '5px 10px';
      viewBtn.style.fontSize = '11.5px';
      viewBtn.textContent = 'Orders';
      viewBtn.addEventListener('click', () => {
        window.viewCustomerOrders(cust.name);
      });
      tdAction.appendChild(viewBtn);

      tr.append(
        tdClient,
        tdContact,
        tdCity,
        tdTier,
        tdOrders,
        tdSpend,
        tdActive,
        tdAction
      );
      return tr;
    });

    tbody.replaceChildren(...rows);
  };

  window.viewCustomerOrders = function(customerName) {
    if (typeof window.switchTab === 'function') {
      window.switchTab('orders');
    }
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput) {
      searchInput.value = customerName;
      window.orderSearchQuery = customerName;
      if (typeof window.renderOrdersTable === 'function') {
        window.renderOrdersTable();
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('customerSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        window.customerSearchQuery = e.target.value.trim();
        window.renderCustomersView();
      });
    }

    const tierSelect = document.getElementById('customerTierFilter');
    if (tierSelect) {
      tierSelect.addEventListener('change', (e) => {
        window.customerTierFilter = e.target.value;
        window.renderCustomersView();
      });
    }

    // Fetch real users from DB on initial load
    window.fetchCustomersFromDb();
  });
})();