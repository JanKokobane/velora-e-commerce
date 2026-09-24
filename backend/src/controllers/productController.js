const {
  createProduct,
  getProducts: getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../services/productService");

const {
  createNotification,
} = require("../services/notificationService");

const getAdminId = (req) => {
  return req.admin?.admin_id;
};

const isValidProductId = (id) => {
  const productId = Number(id);

  return (
    Number.isInteger(productId) &&
    productId > 0
  );
};

const normalizeOptionalString = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized || null;
};

const validateProductData = (body) => {
  const {
    title,
    category,
    price,
    stock,
  } = body;

  if (
    !title ||
    !String(title).trim()
  ) {
    return "Product title is required.";
  }

  if (
    !category ||
    !String(category).trim()
  ) {
    return "Product category is required.";
  }

  if (
    price === undefined ||
    price === null ||
    price === ""
  ) {
    return "Product price is required.";
  }

  if (Number.isNaN(Number(price))) {
    return "Product price must be a valid number.";
  }

  if (Number(price) < 0) {
    return "Product price cannot be negative.";
  }

  if (
    stock === undefined ||
    stock === null ||
    stock === ""
  ) {
    return "Stock quantity is required.";
  }

  if (Number.isNaN(Number(stock))) {
    return "Stock quantity must be a valid number.";
  }

  if (
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0
  ) {
    return "Stock quantity must be a whole number greater than or equal to 0.";
  }

  return null;
};

const validateOptionalPrices = ({
  compare_price,
  cost_price,
}) => {
  if (
    compare_price !== undefined &&
    compare_price !== null &&
    compare_price !== "" &&
    Number.isNaN(Number(compare_price))
  ) {
    return "Compare-at price must be a valid number.";
  }

  if (
    cost_price !== undefined &&
    cost_price !== null &&
    cost_price !== "" &&
    Number.isNaN(Number(cost_price))
  ) {
    return "Cost price must be a valid number.";
  }

  if (
    compare_price !== undefined &&
    compare_price !== null &&
    compare_price !== "" &&
    Number(compare_price) < 0
  ) {
    return "Compare-at price cannot be negative.";
  }

  if (
    cost_price !== undefined &&
    cost_price !== null &&
    cost_price !== "" &&
    Number(cost_price) < 0
  ) {
    return "Cost price cannot be negative.";
  }

  return null;
};

const normalizeStockStatus = (stock_status) => {
  const status =
    normalizeOptionalString(
      stock_status
    );

  if (!status) {
    return "in_stock";
  }

  const allowedStatuses = [
    "in_stock",
    "low_stock",
    "preorder",
  ];

  if (!allowedStatuses.includes(status)) {
    return null;
  }

  return status;
};

const normalizeRating = (rating) => {
  if (
    rating === undefined ||
    rating === null ||
    rating === ""
  ) {
    return 5;
  }

  const normalizedRating = Number(rating);

  if (
    Number.isNaN(normalizedRating) ||
    normalizedRating < 0 ||
    normalizedRating > 5
  ) {
    return null;
  }

  return normalizedRating;
};

const normalizeReviews = (reviews) => {
  if (
    reviews === undefined ||
    reviews === null ||
    reviews === ""
  ) {
    return 0;
  }

  const normalizedReviews = Number(reviews);

  if (
    !Number.isInteger(normalizedReviews) ||
    normalizedReviews < 0
  ) {
    return null;
  }

  return normalizedReviews;
};

const buildProductData = (body) => {
  const {
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
  } = body;

  return {
    title: String(title).trim(),

    eyebrow:
      normalizeOptionalString(
        eyebrow
      ),

    category:
      String(category).trim(),

    price: Number(price),

    compare_price:
      compare_price === undefined ||
      compare_price === null ||
      compare_price === ""
        ? null
        : Number(compare_price),

    cost_price:
      cost_price === undefined ||
      cost_price === null ||
      cost_price === ""
        ? null
        : Number(cost_price),

    stock: Number(stock),

    stock_status:
      normalizeStockStatus(
        stock_status
      ),

    sizes:
      normalizeOptionalString(
        sizes
      ),

    colors:
      normalizeOptionalString(
        colors
      ),

    fit:
      normalizeOptionalString(
        fit
      ),

    image_url:
      normalizeOptionalString(
        image_url
      ),

    image_2_url:
      normalizeOptionalString(
        image_2_url
      ),

    image_3_url:
      normalizeOptionalString(
        image_3_url
      ),

    description:
      normalizeOptionalString(
        description
      ),

    details:
      normalizeOptionalString(
        details
      ),

    care:
      normalizeOptionalString(
        care
      ),

    delivery:
      normalizeOptionalString(
        delivery
      ),

    rating:
      normalizeRating(rating),

    reviews:
      normalizeReviews(reviews),
  };
};

const createNewProduct = async (req, res) => {
  try {
    const adminId = getAdminId(req);

    if (!adminId) {
      return res.status(401).json({
        message:
          "Authenticated admin could not be identified.",
      });
    }

    const validationError =
      validateProductData(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const priceValidation =
      validateOptionalPrices(
        req.body
      );

    if (priceValidation) {
      return res.status(400).json({
        message: priceValidation,
      });
    }

    const productData =
      buildProductData(req.body);

    if (!productData.stock_status) {
      return res.status(400).json({
        message:
          "Invalid stock status. Allowed values are in_stock, low_stock, or preorder.",
      });
    }

    if (productData.rating === null) {
      return res.status(400).json({
        message:
          "Rating must be between 0 and 5.",
      });
    }

    if (productData.reviews === null) {
      return res.status(400).json({
        message:
          "Reviews must be a whole number greater than or equal to 0.",
      });
    }

    const product =
      await createProduct({
        admin_id: adminId,
        ...productData,
      });

    try {
      await createNotification({
        type: "product_created",
        category: "inventory",
        title: "New Product Added",
        message:
          `${product.title} was added to the product catalogue.`,
        entityType: "product",
        entityId: product.id,
        actionUrl: `/products/${product.id}`,
        isActionable: false,
      });
    } catch (notificationError) {
      console.error(
        "Create product notification error:",
        notificationError
      );
    }

    return res.status(201).json({
      message:
        "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Create product error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create product.",
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const adminId = getAdminId(req);

    if (!adminId) {
      return res.status(401).json({
        message:
          "Authenticated admin could not be identified.",
      });
    }

    const products =
      await getAllProducts();

    return res.status(200).json({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch products.",
    });
  }
};

const getProduct = async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const { id } = req.params;

    if (!adminId) {
      return res.status(401).json({
        message:
          "Authenticated admin could not be identified.",
      });
    }

    if (!isValidProductId(id)) {
      return res.status(400).json({
        message:
          "Invalid product ID.",
      });
    }

    const product =
      await getProductById(
        Number(id)
      );

    if (!product) {
      return res.status(404).json({
        message:
          "Product not found.",
      });
    }

    return res.status(200).json({
      product,
    });
  } catch (error) {
    console.error(
      "Get product error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch product.",
    });
  }
};

const editProduct = async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const { id } = req.params;

    if (!adminId) {
      return res.status(401).json({
        message:
          "Authenticated admin could not be identified.",
      });
    }

    if (!isValidProductId(id)) {
      return res.status(400).json({
        message:
          "Invalid product ID.",
      });
    }

    const existingProduct =
      await getProductById(
        Number(id)
      );

    if (!existingProduct) {
      return res.status(404).json({
        message:
          "Product not found.",
      });
    }

    const validationError =
      validateProductData(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const priceValidation =
      validateOptionalPrices(
        req.body
      );

    if (priceValidation) {
      return res.status(400).json({
        message: priceValidation,
      });
    }

    const productData =
      buildProductData(req.body);

    if (!productData.stock_status) {
      return res.status(400).json({
        message:
          "Invalid stock status. Allowed values are in_stock, low_stock, or preorder.",
      });
    }

    if (productData.rating === null) {
      return res.status(400).json({
        message:
          "Rating must be between 0 and 5.",
      });
    }

    if (productData.reviews === null) {
      return res.status(400).json({
        message:
          "Reviews must be a whole number greater than or equal to 0.",
      });
    }

    const product =
      await updateProduct(
        Number(id),
        productData
      );

    if (!product) {
      return res.status(404).json({
        message:
          "Product not found.",
      });
    }

    try {
      await createNotification({
        type: "product_updated",
        category: "inventory",
        title: "Product Updated",
        message:
          `${product.title} was updated.`,
        entityType: "product",
        entityId: product.id,
        actionUrl: `/products/${product.id}`,
        isActionable: false,
      });
    } catch (notificationError) {
      console.error(
        "Update product notification error:",
        notificationError
      );
    }

    return res.status(200).json({
      message:
        "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Update product error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update product.",
    });
  }
};

const removeProduct = async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const { id } = req.params;

    if (!adminId) {
      return res.status(401).json({
        message:
          "Authenticated admin could not be identified.",
      });
    }

    if (!isValidProductId(id)) {
      return res.status(400).json({
        message:
          "Invalid product ID.",
      });
    }

    const product =
      await deleteProduct(
        Number(id)
      );

    if (!product) {
      return res.status(404).json({
        message:
          "Product not found.",
      });
    }

    try {
      await createNotification({
        type: "product_deleted",
        category: "inventory",
        title: "Product Deleted",
        message:
          `${product.title} was removed from the product catalogue.`,
        entityType: "product",
        entityId: product.id,
        actionUrl: null,
        isActionable: false,
      });
    } catch (notificationError) {
      console.error(
        "Delete product notification error:",
        notificationError
      );
    }

    return res.status(200).json({
      message:
        "Product deleted successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Delete product error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to delete product.",
    });
  }
};

module.exports = {
  createNewProduct,
  getProducts,
  getProduct,
  editProduct,
  removeProduct,
};

