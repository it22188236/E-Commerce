// payment-service/src/controllers/notificationController.js
const Notification = require('../models/Notification');

// @desc    Send notification
// @route   POST /api/notifications/send
// @access  Private (Service-to-service)
const sendNotification = async (req, res) => {
  try {
    const { type, userId, email, order, paymentMethod } = req.body;
    
    let subject, content;
    
    switch (type) {
      case 'order_confirmation':
        subject = `Order Confirmation #${order.orderNumber}`;
        content = {
          greeting: `Dear Customer,`,
          message: `Thank you for your order! Your order #${order.orderNumber} has been confirmed.`,
          orderDetails: {
            orderNumber: order.orderNumber,
            items: order.items.map(item => ({
              name: item.productName,
              quantity: item.quantity,
              price: item.price
            })),
            total: order.totalAmount
          },
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString()
        };
        break;
        
      case 'payment_confirmation':
        subject = `Payment Confirmation #${order.orderNumber}`;
        content = {
          message: `Your payment of $${order.totalAmount} for order #${order.orderNumber} has been processed successfully.`,
          paymentMethod
        };
        break;
        
      default:
        subject = 'Notification';
        content = req.body.content;
    }
    
    const notification = await Notification.create({
      userId,
      type,
      recipient: email,
      subject,
      content,
      status: 'sent',
      sentAt: new Date()
    });
    
    // Simulate sending email
    console.log(`
      ===== EMAIL SENT =====
      To: ${email}
      Subject: ${subject}
      Content: ${JSON.stringify(content, null, 2)}
      =====================
    `);
    
    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notificationId: notification._id,
        type: notification.type,
        status: notification.status
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort('-createdAt')
      .limit(50);
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

module.exports = {
  sendNotification,
  getUserNotifications
};