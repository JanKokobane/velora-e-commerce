const { query } = require("../config/db");

const createProduct = async ({
  admin_id,
  title,
  eyebrow,
  category,
  price,
  compare_price,
  cost_price,
  stock,
  stock_status,
  sizes,
  colors,
  fit,
  image_url,
  image_2_url,
  image_3_url,
  description,
  details,
  care,
  delivery,
  rating,
  reviews,
}) => {
  const result = await query(
    `
      INSERT INTO products (
        admin_id,
        title,
        eyebrow,
        category,
        price,
        compare_price,
        cost_price,
        stock,
        stock_status,
        sizes,
        colors,
        fit,
        image_url,
        image_2_url,
        image_3_url,
        description,
        details,
        care,
        delivery,
        rating,
        reviews
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21
      )
      RETURNING
        id,
        admin_id,
        title,
        eyebrow,
        category,
        price,
        compare_price,
        cost_price,
        stock,
        stock_status,
        sizes,
        colors,
        fit,
        image_url,
        image_2_url,
        image_3_url,
        description,
        details,
        care,
        delivery,
        rating,
        reviews,
        created_at,
        updated_at
    `,
    [
      admin_id,
      title,
      eyebrow,
      category,
      price,
      compare_price,
      cost_price,
      stock,
      stock_status,
      sizes,
      colors,
      fit,
      image_url,
      image_2_url,
      image_3_url,
      description,
      details,
      care,
      delivery,
      rating,
      reviews,
    ]
  );

  return result.rows[0];
};

const getProductsByAdminId = async (admin_id) => {
  const result = await query(
    `
      SELECT
        id,
        admin_id,
        title,
        eyebrow,
        category,
        price,
        compare_price,
        cost_price,
        stock,
        stock_status,
        sizes,
        colors,
        fit,
        image_url,
        image_2_url,
        image_3_url,
        description,
        details,
        care,
        delivery,
        rating,
        reviews,
        created_at,
        updated_at
      FROM products
      WHERE admin_id = $1
      ORDER BY created_at DESC
    `,
    [admin_id]
  );

  return result.rows;
};

const getProductById = async (
  id,
  admin_id
) => {
  const result = await query(
    `
      SELECT
        id,
        admin_id,
        title,
        eyebrow,
        category,
        price,
        compare_price,
        cost_price,
        stock,
        stock_status,
        sizes,
        colors,
        fit,
        image_url,
        image_2_url,
        image_3_url,
        description,
        details,
        care,
        delivery,
        rating,
        reviews,
        created_at,
        updated_at
      FROM products
      WHERE id = $1
        AND admin_id = $2
      LIMIT 1
    `,
    [id, admin_id]
  );

  return result.rows[0] || null;
};

const updateProduct = async (
  id,
  admin_id,
  {
    title,
    eyebrow,
    category,
    price,
    compare_price,
    cost_price,
    stock,
    stock_status,
    sizes,
    colors,
    fit,
    image_url,
    image_2_url,
    image_3_url,
    description,
    details,
    care,
    delivery,
    rating,
    reviews,
  }
) => {
  const result = await query(
    `
      UPDATE products
      SET
        title = $1,
        eyebrow = $2,
        category = $3,
        price = $4,
        compare_price = $5,
        cost_price = $6,
        stock = $7,
        stock_status = $8,
        sizes = $9,
        colors = $10,
        fit = $11,
        image_url = $12,
        image_2_url = $13,
        image_3_url = $14,
        description = $15,
        details = $16,
        care = $17,
        delivery = $18,
        rating = $19,
        reviews = $20,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $21
        AND admin_id = $22
      RETURNING
        id,
        admin_id,
        title,
        eyebrow,
        category,
        price,
        compare_price,
        cost_price,
        stock,
        stock_status,
        sizes,
        colors,
        fit,
        image_url,
        image_2_url,
        image_3_url,
        description,
        details,
        care,
        delivery,
        rating,
        reviews,
        created_at,
        updated_at
    `,
    [
      title,
      eyebrow,
      category,
      price,
      compare_price,
      cost_price,
      stock,
      stock_status,
      sizes,
      colors,
      fit,
      image_url,
      image_2_url,
      image_3_url,
      description,
      details,
      care,
      delivery,
      rating,
      reviews,
      id,
      admin_id,
    ]
  );

  return result.rows[0] || null;
};

const deleteProduct = async (
  id,
  admin_id
) => {
  const result = await query(
    `
      DELETE FROM products
      WHERE id = $1
        AND admin_id = $2
      RETURNING
        id,
        admin_id,
        title,
        category
    `,
    [id, admin_id]
  );

  return result.rows[0] || null;
};

module.exports = {
  createProduct,
  getProductsByAdminId,
  getProductById,
  updateProduct,
  deleteProduct,
};

