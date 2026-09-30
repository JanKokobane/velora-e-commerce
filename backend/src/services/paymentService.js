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
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
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
    FOR UPDATE
    `,
    [
      orderNumber,
      userId
    ]
  );


    if (orderResult.rows.length === 0) {
      const error = new Error('Order not found.');
      error.code = 'ORDER_NOT_FOUND';
      throw error;
    }

    const order = orderResult.rows[0];

    if (order.payment_status === 'paid') {
      const error = new Error('This order has already been paid.');
      error.code = 'ORDER_NOT_PAYABLE';
      throw error;
    }

    if (order.status === 'cancelled' || order.status === 'refunded') {
      const error = new Error('This order cannot be paid.');
      error.code = 'ORDER_NOT_PAYABLE';
      throw error;
    }

    await client.query(
      `
      UPDATE orders
      SET payment_status = 'paid',
          status = CASE WHEN status = 'pending' THEN 'processing' ELSE status END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [order.id]
    );

    const existingPaymentResult = await client.query(
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
        AND payment_status IN ('pending', 'processing')
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
      `,
      [order.id]
    );

    let payment;

    if (existingPaymentResult.rows.length > 0) {
      const existingPayment = existingPaymentResult.rows[0];
      const updatedPaymentResult = await client.query(
        `
        UPDATE payments
        SET payment_status = 'paid',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
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
        [existingPayment.id]
      );
      payment = updatedPaymentResult.rows[0];
    } else {
      const transactionReference =
        `VEL-TXN-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

      const paymentResult = await client.query(
        `
        INSERT INTO payments (
          order_id,
          user_id,
          amount,
          payment_method,
          payment_status,
          transaction_reference
        )
        VALUES ($1, $2, $3, $4, 'paid', $5)
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
        [order.id, userId, Number(order.total), paymentMethod, transactionReference]
      );
      payment = paymentResult.rows[0];
    }

    await client.query('COMMIT');

    return {
      id: payment.id,
      orderId: order.id,
      orderNumber: order.order_number,
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method,
      paymentStatus: payment.payment_status,
      transactionReference: payment.transaction_reference,
      gatewayReference: payment.gateway_reference,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // Ignore rollback errors if the transaction did not start.
    }
    throw error;
  } finally {
    client.release();
  }
};


/**
 * Get payment information for an order.
 *
 * Customer endpoint.
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
 * Get all payments.
 *
 * Admin endpoint.
 *
 * Returns payment information together with
 * customer and order information.
 */
const getAllPayments = async () => {

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
      COALESCE(
        to_jsonb(p)->>'net_amount',
        to_jsonb(p)->>'netAmount'
      ) AS net_amount,
      COALESCE(
        to_jsonb(p)->>'fee',
        to_jsonb(p)->>'gateway_fee',
        to_jsonb(p)->>'fee_amount'
      ) AS fee,
      p.created_at,
      p.updated_at,

      o.order_number,
      o.status AS order_status,
      o.payment_status AS order_payment_status,

      u.full_name,
      u.email,
      u.phone

    FROM payments p

    INNER JOIN orders o
      ON o.id = p.order_id

    INNER JOIN users u
      ON u.id = p.user_id

    ORDER BY p.created_at DESC
    `
  );


  return result.rows.map((payment) => {

    return {
      id: payment.id,

      orderId: payment.order_id,

      orderNumber:
        payment.order_number,

      userId:
        payment.user_id,

      customer: {
        fullName:
          payment.full_name,

        email:
          payment.email,

        phone:
          payment.phone
      },

      amount:
        Number(payment.amount),

      paymentMethod:
        payment.payment_method,

      paymentStatus:
        payment.payment_status,

      orderStatus:
        payment.order_status,

      orderPaymentStatus:
        payment.order_payment_status,

      transactionReference:
        payment.transaction_reference,

      gatewayReference:
        payment.gateway_reference,

      netAmount:
        payment.net_amount == null
          ? null
          : Number(payment.net_amount),

      fee:
        payment.fee == null
          ? null
          : Number(payment.fee),

      createdAt:
        payment.created_at,

      updatedAt:
        payment.updated_at
    };

  });
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

  getAllPayments,

  handlePaymentWebhook
};

