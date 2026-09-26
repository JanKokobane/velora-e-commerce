const express = require("express");

const {
  createNewProduct,
  getProducts,
  getProduct,
  editProduct,
  removeProduct,
} = require("../controllers/productController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get(
  "/",
  getProducts
);

router.get(
  "/:id",
  getProduct
);

router.post(
  "/",
  adminAuthMiddleware,
  createNewProduct
);

router.put(
  "/:id",
  adminAuthMiddleware,
  editProduct
);

router.delete(
  "/:id",
  adminAuthMiddleware,
  removeProduct
);

module.exports = router;

