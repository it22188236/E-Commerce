const {
  validateAndBuildOrderItems,
  createOrderRecord,
  processPayment,
  sendOrderNotification,
  fetchOrders,
  fetchOrdersByUserId,
  fetchOrderById,
  updateOrderStatusById,
  deleteOrderById,
  updateOrderPaymentStatus,
} = require("../services/orderService");

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, customer = {} } = req.body;
    const { validatedItems, totalAmount } = await validateAndBuildOrderItems(
      items,
      process.env.PRODUCT_SERVICE_URL,
    );

    const order = await createOrderRecord({
      user: req.user,
      items: validatedItems,
      totalAmount,
      shippingAddress,
    });

    // Call Payment Service to process payment
    let paymentResult;
    try {
      paymentResult = await processPayment({
        paymentServiceUrl: process.env.PAYMENT_SERVICE_URL,
        order,
        totalAmount,
        paymentMethod: req.body.paymentMethod || "card",
        customer,
        authHeader: req.headers.authorization,
      });

      // Update order with payment info
      order.paymentStatus = paymentResult.data.status;
      order.paymentId = paymentResult.data.paymentId;
      await order.save();
    } catch (error) {
      console.error("Payment processing failed:", error.message);
      order.paymentStatus = "failed";
      await order.save();
    }

    // Send notification
    try {
      await sendOrderNotification({
        paymentServiceUrl: process.env.PAYMENT_SERVICE_URL,
        order,
        user: req.user,
        authHeader: req.headers.authorization,
      });
    } catch (error) {
      console.error("Notification failed:", error.message);
      // Don't fail the order if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order,
        payment: paymentResult,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to create order",
      error: error.message,
    });
  }
};

const updatePaymentStatusInternal = async (req, res) => {
  try {
    const { orderId, paymentId, paymentStatus } = req.body;

    if (!orderId || !paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "orderId and paymentStatus are required",
      });
    }

    const order = await updateOrderPaymentStatus({
      orderId,
      paymentId,
      paymentStatus,
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order payment status updated",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: error.message,
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await fetchOrders({ user: req.user, page, limit });

    res.status(200).json({
      success: true,
      count: result.orders.length,
      total: result.total,
      page: result.page,
      pages: result.pages,
      data: result.orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await fetchOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user owns the order or is admin
    if (order.user.userId !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// @desc    Get orders by user id
// @route   GET /api/orders/user/:userId
// @access  Private (Admin or owner)
const getOrdersByUserId = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await fetchOrdersByUserId({
      requester: req.user,
      targetUserId: req.params.userId,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      count: result.orders.length,
      total: result.total,
      page: result.page,
      pages: result.pages,
      data: result.orders,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500 ? "Failed to fetch user orders" : error.message,
      error: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { orderStatus } = req.body;
    const order = await updateOrderStatusById({
      id: req.params.id,
      orderStatus,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Admin or owner)
const deleteOrder = async (req, res) => {
  try {
    const order = await deleteOrderById({
      id: req.params.id,
      requester: req.user,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? "Failed to delete order" : error.message,
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrdersByUserId,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  updatePaymentStatusInternal,
};
