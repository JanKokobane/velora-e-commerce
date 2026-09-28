
const db = require('../config/db');

/**
 * Create a payment for an order.
 *
 * The order amount comes from PostgreSQL.
 * The frontend cannot decide the payment amount.
 */
const createPayment = async ({
  userId,
  orderNumber,
  paymentMethod
}) => {

  /*
   * Find the authenticated user's order.
   */
  const orderResult = await db.query(
    `
    SELECT
      id,
      order_number,
      user_id,
      total,
      status,
      payment_status
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
    const error = new Error(
      'Order not found.'
    );

    error.code = 'ORDER_NOT_FOUND';

    throw error;
  }


  const order = orderResult.rows[0];


  /*
   * Prevent paying an already-paid order.
   */
  if (order.payment_status === 'paid') {
    const error = new Error(
      'This order has already been paid.'
    );

    error.code = 'ORDER_NOT_PAYABLE';

    throw error;
  }


  /*
   * Prevent payment for cancelled/refunded orders.
   */
  if (
    order.status === 'cancelled' ||
    order.status === 'refunded'
  ) {
    const error = new Error(
      'This order cannot be paid.'
    );

    error.code = 'ORDER_NOT_PAYABLE';

    throw error;
  }


  /*
   * Check whether an active payment already exists.
   */
  const existingPaymentResult = await db.query(
    `
    SELECT
      id,
      amount,
      payment_method,
      payment_status,
      transaction_reference,
      gateway_reference,
      created_at,
      updated_at
    FROM payments
    WHERE order_id = $1
      AND payment_status IN (
        'pending',
        'processing'
      )
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [order.id]
  );


  if (existingPaymentResult.rows.length > 0) {
    const existingPayment =
      existingPaymentResult.rows[0];


    return {
      id: existingPayment.id,

      orderId: order.id,

      orderNumber: order.order_number,

      amount: Number(
        existingPayment.amount
      ),

      paymentMethod:
        existingPayment.payment_method,

      paymentStatus:
        existingPayment.payment_status,

      transactionReference:
        existingPayment.transaction_reference,

      gatewayReference:
        existingPayment.gateway_reference,

      createdAt:
        existingPayment.created_at,

      updatedAt:
        existingPayment.updated_at
    };
  }


  /*
   * Create an internal transaction reference.
   */
  const transactionReference =
    `VEL-TXN-${Date.now()}-${Math.floor(
      Math.random() * 1000000
    )}`;


  /*
   * Create payment record.
   *
   * Amount comes from order.total.
   */
  const paymentResult = await db.query(
    `
    INSERT INTO payments (
      order_id,
      user_id,
      amount,
      payment_method,
      payment_status,
      transaction_reference
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      'pending',
      $5
    )
    RETURNING
      id,
      order_id,
      user_id,
      amount,
      payment_method,
      payment_status,
      transaction_reference,
      gateway_reference,
      created_at,
      updated_at
    `,
    [
      order.id,
      userId,
      Number(order.total),
      paymentMethod,
      transactionReference
    ]
  );


  const payment =
    paymentResult.rows[0];


  return {
    id: payment.id,

    orderId: payment.order_id,

    orderNumber: order.order_number,

    amount: Number(payment.amount),

    paymentMethod:
      payment.payment_method,

    paymentStatus:
      payment.payment_status,

    transactionReference:
      payment.transaction_reference,

    gatewayReference:
      payment.gateway_reference,

    createdAt:
      payment.created_at,

    updatedAt:
      payment.updated_at
  };
};


/**
 * Get payment information for an order.
 */
const getPaymentByOrderNumber = async ({
  userId,
  orderNumber
}) => {

  const result = await db.query(
    `
    SELECT
      p.id,
      p.order_id,
      p.user_id,
      p.amount,
      p.payment_method,
      p.payment_status,
      p.transaction_reference,
      p.gateway_reference,
      p.created_at,
      p.updated_at,
      o.order_number
    FROM payments p
    INNER JOIN orders o
      ON o.id = p.order_id
    WHERE o.order_number = $1
      AND p.user_id = $2
    ORDER BY p.created_at DESC
    LIMIT 1
    `,
    [
      orderNumber,
      userId
    ]
  );


  if (result.rows.length === 0) {
    return null;
  }


  const payment =
    result.rows[0];


  return {
    id: payment.id,

    orderId: payment.order_id,

    orderNumber:
      payment.order_number,

    amount:
      Number(payment.amount),

    paymentMethod:
      payment.payment_method,

    paymentStatus:
      payment.payment_status,

    transactionReference:
      payment.transaction_reference,

    gatewayReference:
      payment.gateway_reference,

    createdAt:
      payment.created_at,

    updatedAt:
      payment.updated_at
  };
};


/**
 * Payment gateway webhook.
 *
 * This will be completed once the actual gateway
 * is selected and its webhook/signature rules are known.
 */
const handlePaymentWebhook = async (
  payload
) => {

  console.log(
    'Payment webhook received:',
    payload
  );


  return {
    received: true,
    processed: false,
    message:
      'Payment gateway webhook handler is awaiting gateway integration.'
  };
};


module.exports = {
  createPayment,
  getPaymentByOrderNumber,
  handlePaymentWebhook
};
