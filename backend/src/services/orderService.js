const db = require('../config/db');
const { randomUUID } = require('crypto');

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
      items: orderItems
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
  const orderResult = await db.query(
    `
    SELECT id, status, payment_status
    FROM orders
    WHERE order_number = $1 AND user_id = $2
    LIMIT 1
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

  const paymentResult = await db.query(
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

  const result = await db.query(
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

  return result.rows[0];
};

module.exports = {
  createOrder,
  getOrdersByUserId,
  getOrderByNumberForUser,
  getAllOrders,
  cancelOrderForUser
};
