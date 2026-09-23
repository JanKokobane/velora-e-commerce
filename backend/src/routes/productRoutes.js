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

router.post(
  "/",
  adminAuthMiddleware,
  createNewProduct
);

router.get(
  "/",
  adminAuthMiddleware,
  getProducts
);

router.get(
  "/:id",
  adminAuthMiddleware,
  getProduct
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