// payment-service/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { sendNotification, getUserNotifications } = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Send a notification
 *     description: Send order confirmation or other notifications. This is an internal service-to-service endpoint.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationRequest'
 *           examples:
 *             orderConfirmation:
 *               summary: Send order confirmation
 *               value:
 *                 type: "order_confirmation"
 *                 userId: "507f1f77bcf86cd799439011"
 *                 email: "john@example.com"
 *                 order:
 *                   orderNumber: "ORD-240115-1234"
 *                   items:
 *                     - productName: "MacBook Pro 16\""
 *                       quantity: 2
 *                       price: 2499.99
 *                   totalAmount: 4999.98
 *                 paymentMethod: "card"
 *     responses:
 *       200:
 *         description: Notification sent successfully
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
 *                   example: Notification sent successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     notificationId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439015
 *                     type:
 *                       type: string
 *                       example: order_confirmation
 *                     status:
 *                       type: string
 *                       example: sent
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 */
router.post('/send', authMiddleware, sendNotification);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieve all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 *             example:
 *               success: true
 *               count: 2
 *               data:
 *                 - _id: 507f1f77bcf86cd799439015
 *                   type: order_confirmation
 *                   subject: Order Confirmation #ORD-240115-1234
 *                   status: sent
 *                   sentAt: 2024-01-15T10:30:00Z
 *                 - _id: 507f1f77bcf86cd799439016
 *                   type: payment_confirmation
 *                   subject: Payment Confirmation #ORD-240115-1234
 *                   status: sent
 *                   sentAt: 2024-01-15T10:31:00Z
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, getUserNotifications);

module.exports = router;