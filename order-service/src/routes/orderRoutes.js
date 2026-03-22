// order-service/src/routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrdersByUserId,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  updatePaymentStatusInternal,
} = require("../controllers/orderController");
const authMiddleware = require("../middlewares/auth.js");
const internalAuth = require("../middlewares/internalAuth.js");
const {
  createOrderValidation,
  updateOrderStatusValidation,
  orderIdParamValidation,
  userOrdersValidation,
} = require("../middlewares/validation");

router.post(
  "/internal/payment-status",
  internalAuth,
  updatePaymentStatusInternal,
);

// All order routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Creates a new order after validating products with Product Service and processing payment with Payment Service
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderCreateRequest'
 *           examples:
 *             laptopOrder:
 *               summary: Order laptop
 *               value:
 *                 items:
 *                   - productId: "507f1f77bcf86cd799439012"
 *                     quantity: 2
 *                 shippingAddress:
 *                   street: "123 Main St"
 *                   city: "New York"
 *                   state: "NY"
 *                   zipCode: "10001"
 *                   country: "USA"
 *                 paymentMethod: "card"
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *             example:
 *               success: true
 *               message: Order created successfully
 *               data:
 *                 order:
 *                   _id: 507f1f77bcf86cd799439013
 *                   orderNumber: ORD-240115-1234
 *                   totalAmount: 4999.98
 *                   paymentStatus: completed
 *                 payment:
 *                   success: true
 *                   message: Payment processed successfully
 *                   data:
 *                     paymentId: PAY-123456789-001
 *                     status: completed
 *       400:
 *         description: Bad request - Invalid items or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 */
router.post("/", createOrderValidation, createOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user orders
 *     description: Retrieve all orders for the authenticated user with pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderListResponse'
 *             example:
 *               success: true
 *               count: 2
 *               total: 5
 *               page: 1
 *               pages: 3
 *               data:
 *                 - _id: 507f1f77bcf86cd799439013
 *                   orderNumber: ORD-240115-1234
 *                   totalAmount: 4999.98
 *                   orderStatus: pending
 *                   createdAt: 2024-01-15T10:30:00Z
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 */
router.get("/", getUserOrders);

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     summary: Get orders by user ID
 *     description: Retrieve orders for a specific user (accessible by that user or admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 507f1f77bcf86cd799439011
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: User orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderListResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Server error
 */
router.get("/user/:userId", userOrdersValidation, getOrdersByUserId);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieve a single order by its ID (user must own the order or be admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: 507f1f77bcf86cd799439013
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Server error
 */
router.get("/:id", orderIdParamValidation, getOrderById);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update order status
 *     description: Update order status by order ID (admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: 507f1f77bcf86cd799439013
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderStatus]
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Server error
 */
router.put("/:id", updateOrderStatusValidation, updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete order
 *     description: Delete an order by ID (owner or admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: 507f1f77bcf86cd799439013
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439013
 *                     orderNumber:
 *                       type: string
 *                       example: ORD-240115-1234
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Server error
 */
router.delete("/:id", orderIdParamValidation, deleteOrder);

module.exports = router;
