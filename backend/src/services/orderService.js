const db = require('../config/db');
const { ensureReturnsTable } = require('./returnService');
const { ensureDriverSchema } = require('./driverService');
const { randomUUID } = require('crypto');

const getTrackingLocation = (status, shipping = {}) => {
  const normalizedStatus = String(status || '').toLowerCase();
  if (normalizedStatus === 'accepted') return 'Velora Logistics Hub, Airport Industria';
  if (['in-transit', 'transit', 'shipped'].includes(normalizedStatus)) return 'Velora Logistics Hub, Airport Industria';
  if (normalizedStatus === 'delivered') {
    return [shipping.street, shipping.city, shipping.province].filter(Boolean).join(', ') || 'Delivered';
  }
  return 'Velora Fulfillment Centre';
};

const getOrderDriver = (order) => order.driver_id
  ? {
      id: order.driver_id,
      fullName: order.driver_name,
      email: order.driver_email,
      phone: order.driver_phone,
      province: order.driver_province
    }
  : null;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ensures a product ID is a valid UUID if the PostgreSQL column requires UUID
 * Encodes integer IDs like 6 into 00000000-0000-0000-0000-000000000006
 */
const toValidUuid = (val) => {
  if (!val) return '00000000-0000-0000-0000-000000000000';
  const str = String(val).trim();
  if (UUID_REGEX.test(str)) return str;

  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 0) {
    const hex = num.toString(16).padStart(12, '0');
    return `00000000-0000-0000-0000-${hex}`;
  }

  let hex = '';
  for (let i = 0; i < str.length && hex.length < 12; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  hex = hex.padEnd(12, '0').slice(0, 12);
  return `00000000-0000-0000-0000-${hex}`;
};

/**
 * Restores original integer ID if it was stored as 00000000-0000-0000-0000-000000000006
 */
const parseStoredProductId = (val) => {
  if (!val) return val;
  const str = String(val);
  const match = str.match(/^00000000-0000-0000-0000-([0-9a-f]{12})$/i);
  if (match) {
    const num = parseInt(match[1], 16);
    if (!isNaN(num) && num > 0) return num;
  }
  return val;
};

const generateOrderNumber = () => {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  const randomPart = randomUUID()
    .replace(/-/g, '')
    .slice(0, 6)
    .toUpperCase();

  return `VEL-${date}-${randomPart}`;
};

const calculateDeliveryFee = (deliveryMethod) => {
  if (deliveryMethod === 'express') {
    return 99.00;
  }

  if (deliveryMethod === 'standard') {
    return 59.00;
  }

  return 0.00;
};

const createOrder = async ({
  userId,
  items,
  shipping,
  deliveryMethod = 'express'
}) => {
  const client = await db.connect();

  try {
    // 1. Verify authenticated user exists (before transaction)
    const userResult = await client.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      const error = new Error('User not found.');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const productIds = items.map(
      (item) => item.productId
    );

    if (productIds.some((id) => !id)) {
      const error = new Error(
        'Every order item must contain a productId.'
      );
      error.code = 'INVALID_ORDER_ITEM';
      throw error;
    }

    // 2. Fetch products safely without assuming specific column names (title vs name, image_url vs image)
    let products = [];
    if (productIds.length > 0) {
      const placeholders = productIds.map((_, i) => `$${i + 1}`).join(', ');
      const productsResult = await client.query(
        `SELECT * FROM products WHERE id::text IN (${placeholders})`,
        productIds.map(String)
      );
      products = productsResult.rows || [];
    }

    // 3. Compute totals and line items
    let subtotal = 0;

    const orderItems = items.map((item) => {
      const product = products.find(
        (productRow) =>
          String(productRow.id) === String(item.productId)
      );

      if (!product) {
        const error = new Error(
          `Product ${item.productId} is no longer available.`
        );
        error.code = 'PRODUCT_NOT_FOUND';
        throw error;
      }

      const productName =
        product?.title ||
        product?.name ||
        item.title ||
        item.productName ||
        `Product #${item.productId}`;

      const unitPrice = product
        ? Number(product.price)
        : Number(item.price || item.unitPrice || 0);

      const productImage =
        product?.image_url ||
        product?.image ||
        item.image ||
        null;

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        const error = new Error(
          `Invalid quantity for product ${productName}.`
        );
        error.code = 'INVALID_QUANTITY';
        throw error;
      }

      if (isNaN(unitPrice) || unitPrice <= 0) {
        const error = new Error(
          `Product ${item.productId} was not found.`
        );
        error.code = 'PRODUCT_NOT_FOUND';
        throw error;
      }

      subtotal += unitPrice * quantity;

      return {
        productId: product ? product.id : (Number(item.productId) || 1),
        productName,
        quantity,
        unitPrice,
        size: item.size || null,
        image: productImage
      };
    });

    const discount = 0.00;
    const deliveryFee = calculateDeliveryFee(deliveryMethod);
    const total = subtotal - discount + deliveryFee;

    // 4. Generate unique order number
    let orderNumber;
    let orderCreated = false;

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateOrderNumber();

      const existingOrder = await client.query(
        `
        SELECT id
        FROM orders
        WHERE order_number = $1
        `,
        [candidate]
      );

      if (existingOrder.rows.length === 0) {
        orderNumber = candidate;
        orderCreated = true;
        break;
      }
    }

    if (!orderCreated) {
      const error = new Error(
        'Unable to generate a unique order number.'
      );
      error.code = 'ORDER_NUMBER_GENERATION_FAILED';
      throw error;
    }

    // 5. Begin transaction only for INSERT operations
    try {
      await client.query('ALTER TABLE order_items ALTER COLUMN product_id TYPE VARCHAR(255) USING product_id::text');
    } catch (_) {
      // Column may already be varchar/text or user has no DDL permissions
    }

    await client.query('BEGIN');

    const depletedProducts = [];

    for (const item of orderItems) {
      const stockResult = await client.query(
        `
        UPDATE products
        SET stock = stock - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id::text = $2
          AND stock >= $1
        RETURNING id, title, stock
        `,
        [item.quantity, String(item.productId)]
      );

      if (stockResult.rows.length === 0) {
        const error = new Error(
          `There is not enough stock for ${item.productName}. Refresh your cart and try again.`
        );
        error.code = 'INSUFFICIENT_STOCK';
        throw error;
      }

      const updatedProduct = stockResult.rows[0];
      if (Number(updatedProduct.stock) === 0) {
        depletedProducts.push({
          id: updatedProduct.id,
          title: updatedProduct.title || item.productName
        });
      }
    }

    const orderResult = await client.query(
      `
      INSERT INTO orders (
        order_number,
        user_id,
        status,
        payment_status,
        subtotal,
        discount,
        delivery_fee,
        total,
        full_name,
        email,
        phone,
        street,
        apartment,
        city,
        postal_code,
        province,
        delivery_method
      )
      VALUES (
        $1,
        $2,
        'pending',
        'pending',
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15
      )
      RETURNING *
      `,
      [
        orderNumber,
        userId,
        subtotal,
        discount,
        deliveryFee,
        total,
        shipping.fullName.trim(),
        shipping.email.trim(),
        shipping.phone.trim(),
        shipping.street.trim(),
        shipping.apartment
          ? shipping.apartment.trim()
          : null,
        shipping.city.trim(),
        (shipping.postalCode || shipping.postal || '').trim(),
        shipping.province.trim(),
        deliveryMethod
      ]
    );

    const order = orderResult.rows[0];

    for (const item of orderItems) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          size,
          image
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        `,
        [
          order.id,
          toValidUuid(item.productId),
          item.productName,
          item.quantity,
          item.unitPrice,
          item.size,
          item.image
        ]
      );
    }

    await client.query('COMMIT');

    return {
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      deliveryFee: Number(order.delivery_fee),
      total: Number(order.total),
      shipping: {
        fullName: order.full_name,
        email: order.email,
        phone: order.phone,
        street: order.street,
        apartment: order.apartment,
        city: order.city,
        postalCode: order.postal_code,
        province: order.province
      },
      deliveryMethod: order.delivery_method,
      trackingNumber: order.tracking_number,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: orderItems,
      depletedProducts
    };

  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // Ignore rollback errors if no transaction was started
    }

    console.error(
      'Order service createOrder error:',
      error
    );

    throw error;

  } finally {
    client.release();
  }
};

const getOrdersByUserId = async (userId) => {
  await ensureDriverSchema();
  const ordersResult = await db.query(
    `
    SELECT
      id,
      order_number,
      status,
      payment_status,
      subtotal,
      discount,
      delivery_fee,
      total,
      full_name,
      email,
      phone,
      street,
      apartment,
      city,
      postal_code,
      province,
      delivery_method,
      tracking_number,
      accepted_at,
      driver_assigned_at,
      driver_id,
      (SELECT full_name FROM drivers WHERE id = orders.driver_id) AS driver_name,
      (SELECT email FROM drivers WHERE id = orders.driver_id) AS driver_email,
      (SELECT phone FROM drivers WHERE id = orders.driver_id) AS driver_phone,
      (SELECT province FROM drivers WHERE id = orders.driver_id) AS driver_province,
      created_at,
      updated_at
    FROM orders
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  const orders = [];

  for (const order of ordersResult.rows) {
    const itemsResult = await db.query(
      `
      SELECT
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        size,
        image,
        created_at
      FROM order_items
      WHERE order_id = $1
      ORDER BY created_at ASC
      `,
      [order.id]
    );

    orders.push({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      deliveryFee: Number(order.delivery_fee),
      total: Number(order.total),
      shipping: {
        fullName: order.full_name,
        email: order.email,
        phone: order.phone,
        street: order.street,
        apartment: order.apartment,
        city: order.city,
        postalCode: order.postal_code,
        province: order.province
      },
      deliveryMethod: order.delivery_method,
      trackingNumber: order.tracking_number,
      acceptedAt: order.accepted_at,
      driverAssignedAt: order.driver_assigned_at,
      trackingLocation: getTrackingLocation(order.status, {
        street: order.street,
        city: order.city,
        province: order.province
      }),
      driver: getOrderDriver(order),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: itemsResult.rows.map((item) => ({
        id: item.id,
        productId: parseStoredProductId(item.product_id),
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        size: item.size,
        image: item.image,
        createdAt: item.created_at
      }))
    });
  }

  return orders;
};

const getOrderByNumberForUser = async (
  orderNumber,
  userId
) => {
  await ensureDriverSchema();
  const orderResult = await db.query(
    `
    SELECT
      id,
      order_number,
      user_id,
      status,
      payment_status,
      subtotal,
      discount,
      delivery_fee,
      total,
      full_name,
      email,
      phone,
      street,
      apartment,
      city,
      postal_code,
      province,
      delivery_method,
      tracking_number,
      accepted_at,
      driver_assigned_at,
      driver_id,
      (SELECT full_name FROM drivers WHERE id = orders.driver_id) AS driver_name,
      (SELECT email FROM drivers WHERE id = orders.driver_id) AS driver_email,
      (SELECT phone FROM drivers WHERE id = orders.driver_id) AS driver_phone,
      (SELECT province FROM drivers WHERE id = orders.driver_id) AS driver_province,
      created_at,
      updated_at
    FROM orders
    WHERE order_number = $1
      AND user_id = $2
    LIMIT 1
    `,
    [
      orderNumber,
      userId
    ]
  );

  if (orderResult.rows.length === 0) {
    return null;
  }

  const order = orderResult.rows[0];

  const itemsResult = await db.query(
    `
    SELECT
      id,
      product_id,
      product_name,
      quantity,
      unit_price,
      size,
      image,
      created_at
    FROM order_items
    WHERE order_id = $1
    ORDER BY created_at ASC
    `,
    [order.id]
  );

  return {
    id: order.id,
    orderNumber: order.order_number,
    userId: order.user_id,
    status: order.status,
    paymentStatus: order.payment_status,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    deliveryFee: Number(order.delivery_fee),
    total: Number(order.total),
    shipping: {
      fullName: order.full_name,
      email: order.email,
      phone: order.phone,
      street: order.street,
      apartment: order.apartment,
      city: order.city,
      postalCode: order.postal_code,
      province: order.province
    },
    deliveryMethod: order.delivery_method,
    trackingNumber: order.tracking_number,
    acceptedAt: order.accepted_at,
    driverAssignedAt: order.driver_assigned_at,
    trackingLocation: getTrackingLocation(order.status, {
      street: order.street,
      city: order.city,
      province: order.province
    }),
    driver: getOrderDriver(order),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: itemsResult.rows.map((item) => ({
      id: item.id,
      productId: parseStoredProductId(item.product_id),
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      size: item.size,
      image: item.image,
      createdAt: item.created_at
    }))
  };
};

const getAllOrders = async () => {
  await ensureDriverSchema();
  const ordersResult = await db.query(
    `
    SELECT
      id,
      order_number,
      user_id,
      status,
      payment_status,
      subtotal,
      discount,
      delivery_fee,
      total,
      full_name,
      email,
      phone,
      street,
      apartment,
      city,
      postal_code,
      province,
      delivery_method,
      tracking_number,
      accepted_at,
      driver_assigned_at,
      driver_id,
      (SELECT full_name FROM drivers WHERE id = orders.driver_id) AS driver_name,
      (SELECT email FROM drivers WHERE id = orders.driver_id) AS driver_email,
      (SELECT phone FROM drivers WHERE id = orders.driver_id) AS driver_phone,
      (SELECT province FROM drivers WHERE id = orders.driver_id) AS driver_province,
      created_at,
      updated_at
    FROM orders
    ORDER BY created_at DESC
    `
  );

  const orders = [];

  for (const order of ordersResult.rows) {
    const itemsResult = await db.query(
      `
      SELECT
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        size,
        image,
        created_at
      FROM order_items
      WHERE order_id = $1
      ORDER BY created_at ASC
      `,
      [order.id]
    );

    orders.push({
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      deliveryFee: Number(order.delivery_fee),
      total: Number(order.total),
      shipping: {
        fullName: order.full_name,
        email: order.email,
        phone: order.phone,
        street: order.street,
        apartment: order.apartment,
        city: order.city,
        postalCode: order.postal_code,
        province: order.province
      },
      deliveryMethod: order.delivery_method,
      trackingNumber: order.tracking_number,
      acceptedAt: order.accepted_at,
      driverAssignedAt: order.driver_assigned_at,
      trackingLocation: getTrackingLocation(order.status, {
        street: order.street,
        city: order.city,
        province: order.province
      }),
      driver: getOrderDriver(order),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: itemsResult.rows.map((item) => ({
        id: item.id,
        productId: parseStoredProductId(item.product_id),
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        size: item.size,
        image: item.image,
        createdAt: item.created_at
      }))
    });
  }

  return orders;
};

const cancelOrderForUser = async (orderNumber, userId) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `
      SELECT id, status, payment_status
      FROM orders
      WHERE order_number = $1 AND user_id = $2
      LIMIT 1
      FOR UPDATE
      `,
      [orderNumber, userId]
    );

    const order = orderResult.rows[0];
    if (!order) {
      const error = new Error('Order not found.');
      error.code = 'ORDER_NOT_FOUND';
      throw error;
    }

    if (String(order.status).toLowerCase() !== 'pending' || String(order.payment_status).toLowerCase() === 'paid') {
      const error = new Error('Only unpaid pending orders can be cancelled.');
      error.code = 'ORDER_NOT_CANCELLABLE';
      throw error;
    }

    const paymentResult = await client.query(
      `
      SELECT id
      FROM payments
      WHERE order_id = $1
        AND payment_status IN ('pending', 'processing')
      LIMIT 1
      `,
      [order.id]
    );
    if (paymentResult.rows.length > 0) {
      const error = new Error('An order with an active payment cannot be cancelled.');
      error.code = 'ORDER_NOT_CANCELLABLE';
      throw error;
    }

    const result = await client.query(
      `
      UPDATE orders
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'pending' AND payment_status <> 'paid'
      RETURNING id, order_number, status
      `,
      [order.id]
    );

    if (!result.rows[0]) {
      const error = new Error('This order can no longer be cancelled.');
      error.code = 'ORDER_NOT_CANCELLABLE';
      throw error;
    }

    const itemsResult = await client.query(
      `
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = $1
      `,
      [order.id]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        `
        UPDATE products
        SET stock = stock + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id::text = $2
        `,
        [item.quantity, String(parseStoredProductId(item.product_id))]
      );
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
    }
    throw error;
  } finally {
    client.release();
  }
};

const deleteOrder = async (orderNumber) => {
  await ensureReturnsTable();
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `
      SELECT id, order_number, status
      FROM orders
      WHERE order_number = $1
      LIMIT 1
      FOR UPDATE
      `,
      [orderNumber]
    );

    const order = orderResult.rows[0];
    if (!order) {
      const error = new Error('Order not found.');
      error.code = 'ORDER_NOT_FOUND';
      throw error;
    }

    const itemsResult = await client.query(
      `
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = $1
      `,
      [order.id]
    );

    const orderStatus = String(order.status || '').toLowerCase();
    const restockStatuses = ['cancelled', 'refunded', 'delivered', 'shipped', 'in-transit', 'transit'];
    if (!restockStatuses.includes(orderStatus)) {
      for (const item of itemsResult.rows) {
        await client.query(
          `
          UPDATE products
          SET stock = stock + $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id::text = $2
          `,
          [item.quantity, String(parseStoredProductId(item.product_id))]
        );
      }
    }

    await client.query(
      'DELETE FROM order_returns WHERE order_id = $1',
      [String(order.id)]
    );
    await client.query(
      'DELETE FROM payments WHERE order_id = $1',
      [order.id]
    );
    await client.query(
      'DELETE FROM order_items WHERE order_id = $1',
      [order.id]
    );

    const deletedOrderResult = await client.query(
      `
      DELETE FROM orders
      WHERE id = $1
      RETURNING id, order_number
      `,
      [order.id]
    );

    await client.query('COMMIT');
    return deletedOrderResult.rows[0];
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // Ignore rollback errors when the transaction cannot be rolled back.
    }
    throw error;
  } finally {
    client.release();
  }
};

const acceptPaidOrder = async (orderNumber) => {
  await ensureDriverSchema();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const orderResult = await client.query(`
      SELECT id, order_number, status, payment_status, tracking_number, accepted_at
      FROM orders
      WHERE order_number = $1
      LIMIT 1
      FOR UPDATE
    `, [orderNumber]);
    const order = orderResult.rows[0];
    if (!order) {
      const error = new Error('Order not found.');
      error.code = 'ORDER_NOT_FOUND';
      throw error;
    }
    if (String(order.payment_status).toLowerCase() !== 'paid') {
      const error = new Error('Only paid orders can be accepted for fulfillment.');
      error.code = 'ORDER_NOT_PAID';
      throw error;
    }
    if (['cancelled', 'refunded', 'delivered'].includes(String(order.status).toLowerCase())) {
      const error = new Error('This order cannot be accepted.');
      error.code = 'ORDER_NOT_ACCEPTABLE';
      throw error;
    }

    const result = await client.query(`
      UPDATE orders
      SET status = 'accepted',
          accepted_at = COALESCE(accepted_at, CURRENT_TIMESTAMP),
          tracking_number = COALESCE(NULLIF(tracking_number, ''), $2),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, order_number, status, payment_status, tracking_number, accepted_at
    `, [order.id, `VEL-TRK-${randomUUID().slice(0, 8).toUpperCase()}`]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
};

const assignDriverToOrder = async (orderNumber, driverId) => {
  await ensureDriverSchema();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const orderResult = await client.query(`
      SELECT id, order_number, status, payment_status, province, driver_id
      FROM orders
      WHERE order_number = $1
      LIMIT 1
      FOR UPDATE
    `, [orderNumber]);
    const order = orderResult.rows[0];
    if (!order) {
      const error = new Error('Order not found.');
      error.code = 'ORDER_NOT_FOUND';
      throw error;
    }
    if (String(order.payment_status).toLowerCase() !== 'paid' || String(order.status).toLowerCase() !== 'accepted') {
      const error = new Error('Accept this paid order before assigning a driver.');
      error.code = 'ORDER_NOT_ACCEPTED';
      throw error;
    }

    const driverResult = await client.query(`
      SELECT id, full_name, email, phone, province
      FROM drivers
      WHERE id = $1
      LIMIT 1
    `, [driverId]);
    const driver = driverResult.rows[0];
    if (!driver) {
      const error = new Error('Driver not found.');
      error.code = 'DRIVER_NOT_FOUND';
      throw error;
    }
    if (String(driver.province).trim().toLowerCase() !== String(order.province).trim().toLowerCase()) {
      const error = new Error('Choose a driver who serves the customer province.');
      error.code = 'DRIVER_PROVINCE_MISMATCH';
      throw error;
    }

    const result = await client.query(`
      UPDATE orders
      SET driver_id = $1,
          status = 'in-transit',
          driver_assigned_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        RETURNING id, order_number, status, payment_status, tracking_number, accepted_at, driver_assigned_at, driver_id
    `, [driver.id, order.id]);
    await client.query('COMMIT');
    return { ...result.rows[0], driver };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
};

const markOrderDelivered = async (orderNumber) => {
  const result = await db.query(`
    UPDATE orders
    SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
    WHERE order_number = $1
      AND status = 'in-transit'
      AND driver_id IS NOT NULL
      AND driver_assigned_at <= CURRENT_TIMESTAMP - INTERVAL '12 hours'
    RETURNING id, order_number, status, payment_status, tracking_number, driver_id, driver_assigned_at, updated_at
  `, [orderNumber]);
  if (!result.rows[0]) {
    const error = new Error('A parcel can be marked delivered only after 12 hours in transit with an assigned driver.');
    error.code = 'ORDER_NOT_DELIVERABLE';
    throw error;
  }
  return result.rows[0];
};

const deliverOrdersAfterDispatchWindow = async () => {
  await ensureDriverSchema();
  const result = await db.query(`
    UPDATE orders
    SET status = 'delivered',
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'in-transit'
      AND driver_id IS NOT NULL
      AND driver_assigned_at <= CURRENT_TIMESTAMP - INTERVAL '12 hours'
    RETURNING id, order_number, user_id, driver_id, updated_at
  `);
  return result.rows;
};

module.exports = {
  createOrder,
  getOrdersByUserId,
  getOrderByNumberForUser,
  getAllOrders,
  cancelOrderForUser,
  deleteOrder,
  acceptPaidOrder,
  assignDriverToOrder,
  markOrderDelivered,
  deliverOrdersAfterDispatchWindow
};
