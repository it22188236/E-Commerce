const { body, param, query, validationResult } = require("express-validator");

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

const createOrderValidation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("items must be a non-empty array"),
  body("items.*.productId").notEmpty().withMessage("productId is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("quantity must be an integer greater than 0"),
  body("paymentMethod")
    .isIn(["card", "cash", "bank_transfer"])
    .withMessage("invalid payment method"),
  body("shippingAddress.street")
    .notEmpty()
    .withMessage("shippingAddress.street is required"),
  body("shippingAddress.city")
    .notEmpty()
    .withMessage("shippingAddress.city is required"),
  body("shippingAddress.zipCode")
    .notEmpty()
    .withMessage("shippingAddress.zipCode is required"),
  body("shippingAddress.country")
    .notEmpty()
    .withMessage("shippingAddress.country is required"),
  handleValidation,
];

const updateOrderStatusValidation = [
  param("id").isMongoId().withMessage("invalid order id"),
  body("orderStatus")
    .isIn([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ])
    .withMessage("invalid order status"),
  handleValidation,
];

const orderIdParamValidation = [
  param("id").isMongoId().withMessage("invalid order id"),
  handleValidation,
];

const userOrdersValidation = [
  param("userId").notEmpty().withMessage("userId is required"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
  handleValidation,
];

module.exports = {
  createOrderValidation,
  updateOrderStatusValidation,
  orderIdParamValidation,
  userOrdersValidation,
};
