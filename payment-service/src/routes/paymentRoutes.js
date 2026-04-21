// payment-service/src/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const {
  processPayment,
  getPaymentDetails,
  notifyPayment,
  createOrder,
  captureOrder,
  getPayPalConfig,
} = require("../controllers/paymentController");
const authMiddleware = require("../middlewares/auth");

router.get("/paypal/config", authMiddleware, getPayPalConfig);
router.post("/orders", authMiddleware, createOrder);
router.post("/orders/:id/capture", authMiddleware, captureOrder);

/**
 * @swagger
 * /api/payments/notify:
 *   post:
 *     summary: PayPal notification callback
 *     description: Public callback endpoint used by payment gateway to confirm payment status and trigger internal order payment-status sync.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/PayPalNotifyRequest'
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayPalNotifyRequest'
 *     responses:
 *       200:
 *         description: Notification accepted
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: OK
 *       400:
 *         description: Invalid callback payload or signature
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Invalid signature
 *       404:
 *         description: Payment not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Payment not found
 *       500:
 *         description: Server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.post("/notify", notifyPayment);

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process a payment
 *     description: Process payment for an order. This is an internal service-to-service endpoint.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *           examples:
 *             cardPayment:
 *               summary: Process card payment
 *               value:
 *                 orderId: "507f1f77bcf86cd799439013"
 *                 orderNumber: "ORD-240115-1234"
 *                 amount: 4999.98
 *                 paymentMethod: "card"
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *             example:
 *               success: true
 *               message: Payment processed successfully
 *               data:
 *                 paymentId: PAY-1705325400123-456
 *                 status: completed
 *                 amount: 4999.98
 *                 orderNumber: ORD-240115-1234
 *       400:
 *         description: Payment failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Payment failed
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: failed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 */
router.post("/process", authMiddleware, processPayment);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     description: Retrieve payment details by payment ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *         example: PAY-1705325400123-456
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Server error
 */
router.get("/:paymentId", authMiddleware, getPaymentDetails);

module.exports = router;
