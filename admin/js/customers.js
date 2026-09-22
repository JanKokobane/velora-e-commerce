/**
 * Customers Section Controller (js/customers.js)
 * Pure DOM implementation with NO innerHTML.
 */

window.customerSearchQuery = '';
window.customerTierFilter = 'all';

window.renderCustomersView = function() {
  const totalClients = window.customersData.length;
  const vipClients = window.customersData.filter(c => c.tier === 'VIP Privilege').length;
  const totalLifetimeSpend = window.customersData.reduce((acc, c) => acc + (c.lifetimeSpend || 0), 0);
  const avgLifetimeVal = totalClients ? totalLifetimeSpend / totalClients : 0;

  const totalEl = document.getElementById('customersKpiTotalCount');
  const vipEl = document.getElementById('customersKpiVipCount');
  const ltvEl = document.getElementById('customersKpiAvgLtv');

  if (totalEl) totalEl.textContent = totalClients.toString();
  if (vipEl) vipEl.textContent = vipClients.toString();
  if (ltvEl) ltvEl.textContent = window.fmtPrice(avgLifetimeVal);

  const sidebarBadge = document.getElementById('sidebarCustomersBadge');
  if (sidebarBadge) sidebarBadge.textContent = totalClients.toString();

  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  const filtered = window.customersData.filter(cust => {
    if (window.customerTierFilter !== 'all' && cust.tier !== window.customerTierFilter) return false;
    if (window.customerSearchQuery) {
      const q = window.customerSearchQuery.toLowerCase();
      const matchName = cust.name.toLowerCase().includes(q);
      const matchEmail = cust.email.toLowerCase().includes(q);
      const matchCity = cust.city.toLowerCase().includes(q);
      const matchPhone = cust.phone.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCity && !matchPhone) return false;
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
    td.textContent = 'No clients match the current filter.';
    tr.appendChild(td);
    tbody.replaceChildren(tr);
    return;
  }

  const rows = filtered.map(cust => {
    const tr = document.createElement('tr');

    // 1. Client cell with avatar and ID
    const tdClient = document.createElement('td');
    const custCell = document.createElement('div');
    custCell.className = 'customer-cell';

    const avatar = document.createElement('img');
    avatar.className = 'customer-avatar';
    avatar.src = cust.avatar;
    avatar.alt = cust.name;
    avatar.onerror = function() {
      this.onerror = null;
      this.src = (typeof window.createInitialsAvatarSvg === 'function')
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
    phoneEl.textContent = cust.phone;

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
    tierTag.textContent = `${cust.tier === 'VIP Privilege' ? '★ ' : ''}${cust.tier}`;
    tdTier.appendChild(tierTag);

    // 5. Total Orders
    const tdOrders = document.createElement('td');
    tdOrders.style.fontWeight = '600';
    tdOrders.style.fontSize = '13.5px';
    tdOrders.textContent = `${cust.totalOrders} orders`;

    // 6. Lifetime spend
    const tdSpend = document.createElement('td');
    tdSpend.style.fontWeight = '700';
    tdSpend.style.color = 'var(--ink)';
    tdSpend.style.fontSize = '13.5px';
    tdSpend.textContent = window.fmtPrice(cust.lifetimeSpend);

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
    viewBtn.textContent = 'Orders ↗';
    viewBtn.addEventListener('click', () => {
      window.viewCustomerOrders(cust.name);
    });
    tdAction.appendChild(viewBtn);

    tr.append(tdClient, tdContact, tdCity, tdTier, tdOrders, tdSpend, tdActive, tdAction);
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
});
