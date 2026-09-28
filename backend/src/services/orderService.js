const db = require('../config/db');
const { randomUUID } = require('crypto');

/**
 * Generate a unique order number
 */
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


/**
 * Calculate delivery fee on the backend.
 */
const calculateDeliveryFee = (deliveryMethod) => {
  if (deliveryMethod === 'express') {
    return 99.00;
  }

  if (deliveryMethod === 'standard') {
    return 59.00;
  }

  return 0.00;
};


/**
 * Create a new pending order.
 */
const createOrder = async ({
  userId,
  items,
  shipping,
  deliveryMethod = 'express'
}) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    /*
     * Verify authenticated user.
     */
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


    /*
     * Validate order items.
     */
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


    /*
     * Get the real products and prices from PostgreSQL.
     */
    const productsResult = await client.query(
      `
      SELECT
        id,
        name,
        price,
        image
      FROM products
      WHERE id = ANY($1::uuid[])
      `,
      [productIds]
    );


    const products = productsResult.rows;


    /*
     * Make sure every product exists.
     */
    if (products.length !== productIds.length) {
      const error = new Error(
        'One or more products could not be found.'
      );

      error.code = 'PRODUCT_NOT_FOUND';

      throw error;
    }


    /*
     * Calculate subtotal using database prices.
     */
    let subtotal = 0;

    const orderItems = items.map((item) => {
      const product = products.find(
        (productRow) =>
          String(productRow.id) ===
          String(item.productId)
      );

      if (!product) {
        const error = new Error(
          `Product ${item.productId} was not found.`
        );

        error.code = 'PRODUCT_NOT_FOUND';

        throw error;
      }


      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        const error = new Error(
          `Invalid quantity for product ${product.name}.`
        );

        error.code = 'INVALID_QUANTITY';

        throw error;
      }


      const unitPrice = Number(product.price);

      subtotal += unitPrice * quantity;


      return {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice,
        size: item.size || null,
        image: product.image || null
      };
    });


    /*
     * Discount is currently zero.
     *
     * This can later be replaced with your
     * coupon/promotion system.
     */
    const discount = 0.00;


    /*
     * Calculate delivery fee.
     */
    const deliveryFee =
      calculateDeliveryFee(deliveryMethod);


    /*
     * Calculate final total.
     */
    const total =
      subtotal -
      discount +
      deliveryFee;


    /*
     * Generate unique order number.
     */
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

      error.code =
        'ORDER_NUMBER_GENERATION_FAILED';

      throw error;
    }


    /*
     * Create order.
     *
     * Payment status stays pending until
     * the payment gateway confirms payment.
     */
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
        shipping.postalCode.trim(),
        shipping.province.trim(),
        deliveryMethod
      ]
    );


    const order = orderResult.rows[0];


    /*
     * Insert order items.
     */
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
          item.productId,
          item.productName,
          item.quantity,
          item.unitPrice,
          item.size,
          item.image
        ]
      );
    }


    /*
     * Commit transaction.
     */
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
    await client.query('ROLLBACK');

    console.error(
      'Order service createOrder error:',
      error
    );

    throw error;

  } finally {
    client.release();
  }
};


/**
 * Get all orders belonging to the authenticated user.
 */
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
        productId: item.product_id,
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


/**
 * Get one order belonging to the authenticated user.
 */
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
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      size: item.size,
      image: item.image,
      createdAt: item.created_at
    }))
  };
};


module.exports = {
  createOrder,
  getOrdersByUserId,
  getOrderByNumberForUser
};

const db = require('../config/db');

