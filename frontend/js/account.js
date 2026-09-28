import {
  getCurrentUser,
  getUserOrders,
  logoutUser,
  updateGlobalHeaderUser
} from './auth.js';


// ============================================================
// INITIALIZE ACCOUNT PAGE
// ============================================================

export function initAccountPage() {

  const guestView =
    document.getElementById('accountGuestView');

  const dashboardView =
    document.getElementById('accountDashboardView');


  if (!guestView || !dashboardView) {
    return;
  }


  const currentUser =
    getCurrentUser();


  // ==========================================================
  // GUEST VIEW
  // ==========================================================

  if (!currentUser) {

    guestView.style.display = 'grid';
    dashboardView.style.display = 'none';


    // --------------------------------------------------------
    // Guest login button
    //
    // There is NO demo user anymore.
    // The user must sign in through auth.html.
    // --------------------------------------------------------

    const guestLoginBtn =
      document.getElementById('guestDemoLoginBtn');


    if (guestLoginBtn) {

      guestLoginBtn.onclick = () => {

        window.location.href =
          'auth.html?return=account';

      };

    }


    // --------------------------------------------------------
    // Guest tracking form
    // --------------------------------------------------------

    const trackForm =
      document.getElementById('guestTrackForm');


    if (trackForm) {

      trackForm.onsubmit = (e) => {

        e.preventDefault();


        const input =
          document.getElementById(
            'guestTrackInput'
          );


        const code =
          input
            ? input.value.trim()
            : '';


        if (code) {

          window.location.href =
            `orders.html?orderId=${encodeURIComponent(code)}`;

        }

      };

    }


    return;
  }


  // ==========================================================
  // USER IS LOGGED IN
  // ==========================================================

  guestView.style.display = 'none';
  dashboardView.style.display = 'grid';


  // ==========================================================
  // SIDEBAR PROFILE INFORMATION
  // ==========================================================

  const sidebarAvatar =
    document.getElementById(
      'sidebarAvatar'
    );

  const sidebarFullName =
    document.getElementById(
      'sidebarFullName'
    );

  const sidebarEmail =
    document.getElementById(
      'sidebarEmail'
    );

  const sidebarMemberTier =
    document.getElementById(
      'sidebarMemberTier'
    );


  if (sidebarAvatar) {

    sidebarAvatar.textContent =
      currentUser.fullName
        ? currentUser.fullName
            .charAt(0)
            .toUpperCase()
        : 'V';

  }


  if (sidebarFullName) {

    sidebarFullName.textContent =
      currentUser.fullName ||
      'Valued Client';

  }


  if (sidebarEmail) {

    sidebarEmail.textContent =
      currentUser.email ||
      '';

  }


  if (sidebarMemberTier) {

    sidebarMemberTier.textContent =
      currentUser.memberTier ||
      'Velora Client';

  }


  // ==========================================================
  // SIDEBAR ADDRESS
  // ==========================================================

  const addrName =
    document.getElementById(
      'sidebarAddressName'
    );

  const addrPhone =
    document.getElementById(
      'sidebarAddressPhone'
    );

  const addrStreet =
    document.getElementById(
      'sidebarAddressStreet'
    );

  const addrCity =
    document.getElementById(
      'sidebarAddressCity'
    );


  if (addrName) {

    addrName.textContent =
      currentUser.fullName ||
      'Valued Client';

  }


  if (addrPhone) {

    addrPhone.textContent =
      currentUser.phone ||
      '';

  }


  if (addrStreet) {

    addrStreet.textContent =
      currentUser.street ||
      '';

  }


  if (addrCity) {

    const city =
      currentUser.city ||
      '';

    const province =
      currentUser.province ||
      '';


    if (city && province) {

      addrCity.textContent =
        `${city}, ${province}`;

    } else {

      addrCity.textContent =
        city || province || '';

    }

  }


  // ==========================================================
  // PROFILE FORM
  // ==========================================================

  const profFullName =
    document.getElementById(
      'profFullName'
    );

  const profEmail =
    document.getElementById(
      'profEmail'
    );

  const profPhone =
    document.getElementById(
      'profPhone'
    );

  const profStreet =
    document.getElementById(
      'profStreet'
    );

  const profCity =
    document.getElementById(
      'profCity'
    );

  const profProvince =
    document.getElementById(
      'profProvince'
    );


  if (profFullName) {

    profFullName.value =
      currentUser.fullName ||
      '';

  }


  if (profEmail) {

    profEmail.value =
      currentUser.email ||
      '';

    // Email comes from the backend account.
    // Keep it read-only unless your backend
    // explicitly supports changing email.

    profEmail.readOnly = true;

  }


  if (profPhone) {

    profPhone.value =
      currentUser.phone ||
      '';

  }


  if (profStreet) {

    profStreet.value =
      currentUser.street ||
      '';

  }


  if (profCity) {

    profCity.value =
      currentUser.city ||
      '';

  }


  if (profProvince) {

    profProvince.value =
      currentUser.province ||
      '';

  }


  // ==========================================================
  // TAB SWITCHING
  // ==========================================================

  const navOrdersTab =
    document.getElementById(
      'navOrdersTab'
    );

  const navProfileTab =
    document.getElementById(
      'navProfileTab'
    );

  const paneOrders =
    document.getElementById(
      'paneOrders'
    );

  const paneProfile =
    document.getElementById(
      'paneProfile'
    );


  if (
    navOrdersTab &&
    navProfileTab &&
    paneOrders &&
    paneProfile
  ) {

    navOrdersTab.onclick = () => {

      navOrdersTab.classList.add(
        'active'
      );

      navProfileTab.classList.remove(
        'active'
      );

      paneOrders.style.display =
        'block';

      paneProfile.style.display =
        'none';

    };


    navProfileTab.onclick = () => {

      navProfileTab.classList.add(
        'active'
      );

      navOrdersTab.classList.remove(
        'active'
      );

      paneProfile.style.display =
        'block';

      paneOrders.style.display =
        'none';

    };

  }


  // ==========================================================
  // UPDATE PROFILE
  // ==========================================================
  //
  // IMPORTANT:
  // The previous version only changed localStorage.
  //
  // Your backend is now the source of truth.
  //
  // Therefore this form sends the update to:
  //
  // PUT /api/users/:id
  //
  // through the authenticated auth.js API helper.
  //
  // ==========================================================

  const updateProfileForm =
    document.getElementById(
      'updateProfileForm'
    );


  if (updateProfileForm) {

    updateProfileForm.onsubmit =
      async (e) => {

        e.preventDefault();


        try {

          const token =
            localStorage.getItem(
              'velora_auth_token'
            );


          if (!token) {

            window.location.href =
              'auth.html?return=account';

            return;

          }


          const userId =
            currentUser.id;


          if (!userId) {

            throw new Error(
              'Your account ID could not be found.'
            );

          }


          const updatedData = {

            fullName:
              profFullName
                ? profFullName.value.trim()
                : currentUser.fullName,

            phone:
              profPhone
                ? profPhone.value.trim()
                : currentUser.phone,

            street:
              profStreet
                ? profStreet.value.trim()
                : currentUser.street,

            city:
              profCity
                ? profCity.value.trim()
                : currentUser.city,

            province:
              profProvince
                ? profProvince.value.trim()
                : currentUser.province

          };


          const response =
            await fetch(
              `https://velora-e-commerce-qby7.onrender.com/api/users/${encodeURIComponent(userId)}`,
              {
                method: 'PUT',

                headers: {

                  'Content-Type':
                    'application/json',

                  Authorization:
                    `Bearer ${token}`

                },

                body:
                  JSON.stringify(
                    updatedData
                  )

              }
            );


          let data = null;


          try {

            data =
              await response.json();

          } catch (error) {

            data = null;

          }


          if (!response.ok) {

            throw new Error(
              data?.message ||
              data?.error ||
              `Profile update failed with status ${response.status}.`
            );

          }


          // --------------------------------------------------
          // Use the user returned by the backend.
          // --------------------------------------------------

          const updatedUser =
            data?.user ||
            data?.data?.user ||
            data?.data;


          if (updatedUser) {

            currentUser.fullName =
              updatedUser.fullName ??
              updatedUser.full_name ??
              currentUser.fullName;

            currentUser.phone =
              updatedUser.phone ??
              currentUser.phone;

            currentUser.street =
              updatedUser.street ??
              currentUser.street;

            currentUser.city =
              updatedUser.city ??
              currentUser.city;

            currentUser.province =
              updatedUser.province ??
              currentUser.province;

          } else {

            // Fallback to the submitted values
            // if the backend does not return
            // the updated user object.

            currentUser.fullName =
              updatedData.fullName;

            currentUser.phone =
              updatedData.phone;

            currentUser.street =
              updatedData.street;

            currentUser.city =
              updatedData.city;

            currentUser.province =
              updatedData.province;

          }


          // --------------------------------------------------
          // Update local authenticated user cache.
          //
          // This is NOT authentication.
          // The backend remains the source of truth.
          // --------------------------------------------------

          localStorage.setItem(
            'velora_current_user',
            JSON.stringify(currentUser)
          );


          // --------------------------------------------------
          // Refresh sidebar
          // --------------------------------------------------

          if (sidebarFullName) {

            sidebarFullName.textContent =
              currentUser.fullName ||
              'Valued Client';

          }


          if (addrName) {

            addrName.textContent =
              currentUser.fullName ||
              'Valued Client';

          }


          if (addrPhone) {

            addrPhone.textContent =
              currentUser.phone ||
              '';

          }


          if (addrStreet) {

            addrStreet.textContent =
              currentUser.street ||
              '';

          }


          if (addrCity) {

            const city =
              currentUser.city ||
              '';

            const province =
              currentUser.province ||
              '';


            addrCity.textContent =
              city && province
                ? `${city}, ${province}`
                : city || province || '';

          }


          updateGlobalHeaderUser();


          // --------------------------------------------------
          // Success message
          // --------------------------------------------------

          const msg =
            document.getElementById(
              'saveProfileMsg'
            );


          if (msg) {

            msg.textContent =
              'Profile updated successfully.';

            msg.style.display =
              'inline';


            setTimeout(() => {

              msg.style.display =
                'none';

            }, 3000);

          }

        } catch (error) {

          console.error(
            'Profile update error:',
            error
          );


          const msg =
            document.getElementById(
              'saveProfileMsg'
            );


          if (msg) {

            msg.textContent =
              error?.message ||
              'Unable to update your profile.';

            msg.style.display =
              'inline';


            setTimeout(() => {

              msg.style.display =
                'none';

            }, 5000);

          }

        }

      };

  }


  // ==========================================================
  // SIGN OUT
  // ==========================================================

  const signOutBtn =
    document.getElementById(
      'dashboardSignOutBtn'
    );


  if (signOutBtn) {

    signOutBtn.onclick = () => {

      logoutUser();

      window.location.href =
        'auth.html';

    };

  }


  // ==========================================================
  // SIDEBAR QUICK TRACK FORM
  // ==========================================================

  const sidebarTrackForm =
    document.getElementById(
      'sidebarQuickTrackForm'
    );


  if (sidebarTrackForm) {

    sidebarTrackForm.onsubmit =
      (e) => {

        e.preventDefault();


        const input =
          document.getElementById(
            'sidebarQuickTrackInput'
          );


        const val =
          input
            ? input.value.trim()
            : '';


        if (val) {

          window.location.href =
            `orders.html?orderId=${encodeURIComponent(val)}`;

        }

      };

  }


  // ==========================================================
  // RENDER ORDERS
  // ==========================================================

  renderOrders(
    currentUser.email
  );

}


// ============================================================
// RENDER USER ORDERS
// ============================================================

function renderOrders(userEmail) {

  const container =
    document.getElementById(
      'ordersListContainer'
    );

  const emptyState =
    document.getElementById(
      'ordersEmptyState'
    );

  const cardTemplate =
    document.getElementById(
      'orderCardTemplate'
    );

  const itemRowTemplate =
    document.getElementById(
      'orderItemRowTemplate'
    );

  const badge =
    document.getElementById(
      'navOrdersBadge'
    );

  const summaryCount =
    document.getElementById(
      'ordersSummaryCount'
    );


  if (
    !container ||
    !cardTemplate ||
    !itemRowTemplate
  ) {

    return;

  }


  const orders =
    getUserOrders(userEmail);


  // ==========================================================
  // ORDER COUNT
  // ==========================================================

  if (badge) {

    badge.textContent =
      String(orders.length);

  }


  if (summaryCount) {

    summaryCount.textContent =
      `${orders.length} active parcel${
        orders.length === 1
          ? ''
          : 's'
      }`;

  }


  // ==========================================================
  // CLEAR EXISTING ORDERS
  // ==========================================================

  container.replaceChildren();


  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (orders.length === 0) {

    if (emptyState) {

      emptyState.style.display =
        'block';

    }

    return;

  }


  if (emptyState) {

    emptyState.style.display =
      'none';

  }


  // ==========================================================
  // RENDER EACH ORDER
  // ==========================================================

  orders.forEach(
    (order) => {

      const cardClone =
        cardTemplate.content.cloneNode(
          true
        );


      const orderIdEl =
        cardClone.querySelector(
          '.card-order-id'
        );

      const orderDateEl =
        cardClone.querySelector(
          '.card-order-date'
        );

      const trackingEl =
        cardClone.querySelector(
          '.card-order-tracking'
        );

      const statusTextEl =
        cardClone.querySelector(
          '.card-status-text'
        );

      const courierEl =
        cardClone.querySelector(
          '.card-courier-name'
        );

      const estDeliveryEl =
        cardClone.querySelector(
          '.card-est-delivery'
        );

      const totalEl =
        cardClone.querySelector(
          '.card-order-total'
        );

      const trackBtnEl =
        cardClone.querySelector(
          '.card-track-btn'
        );

      const itemsListEl =
        cardClone.querySelector(
          '.card-items-list'
        );


      // ======================================================
      // ORDER INFORMATION
      // ======================================================

      if (orderIdEl) {

        orderIdEl.textContent =
          `#${order.id}`;

      }


      if (orderDateEl) {

        orderDateEl.textContent =
          order.date || '';

      }


      if (trackingEl) {

        trackingEl.textContent =
          order.trackingNumber ||
          `TRK-ZA-${order.id}`;

      }


      if (statusTextEl) {

        statusTextEl.textContent =
          order.status ||
          'Processing';

      }


      if (courierEl) {

        courierEl.textContent =
          order.courier ||
          'Velora Express Courier';

      }


      if (estDeliveryEl) {

        estDeliveryEl.textContent =
          order.estimatedDelivery ||
          'In 2-3 Business Days';

      }


      if (totalEl) {

        const total =
          Number(order.total) || 0;


        totalEl.textContent =
          `R ${total.toLocaleString(
            'en-ZA'
          )}`;

      }


      if (trackBtnEl) {

        trackBtnEl.href =
          `orders.html?orderId=${encodeURIComponent(
            order.id
          )}`;

      }


      // ======================================================
      // ORDER ITEMS
      // ======================================================

      if (
        itemsListEl &&
        Array.isArray(order.items)
      ) {

        order.items.forEach(
          (item) => {

            const itemRowClone =
              itemRowTemplate.content.cloneNode(
                true
              );


            const thumb =
              itemRowClone.querySelector(
                '.order-item-thumb'
              );

            const title =
              itemRowClone.querySelector(
                '.card-item-title'
              );

            const meta =
              itemRowClone.querySelector(
                '.card-item-meta'
              );

            const price =
              itemRowClone.querySelector(
                '.card-item-price'
              );


            if (thumb) {

              thumb.src =
                item.image || '';

              thumb.alt =
                item.title ||
                'Product item';

            }


            if (title) {

              title.textContent =
                item.title ||
                'Artisan item';

            }


            if (meta) {

              const quantity =
                Number(item.quantity) || 1;

              const size =
                item.size ||
                'Standard';


              meta.textContent =
                `Qty: ${quantity} • ${size}`;

            }


            if (price) {

              const itemPrice =
                Number(item.price) || 0;


              price.textContent =
                `R ${itemPrice.toLocaleString(
                  'en-ZA'
                )}`;

            }


            itemsListEl.appendChild(
              itemRowClone
            );

          }
        );

      }


      container.appendChild(
        cardClone
      );

    }
  );

}


// ============================================================
// AUTO-RUN
// ============================================================

if (
  typeof document !== 'undefined'
) {

  document.addEventListener(
    'DOMContentLoaded',
    () => {

      initAccountPage();

      updateGlobalHeaderUser();

    }
  );

}