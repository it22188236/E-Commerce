const axios = require("axios");
const Order = require("../models/Order");

const validateAndBuildOrderItems = async (items, productServiceUrl) => {
  const validatedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    try {
      const productResponse = await axios.get(
        `${productServiceUrl}/api/products/${item.productId}`,
      );

      const product = productResponse.data.data;

      if (product.stock < item.quantity) {
        const error = new Error(
          `Insufficient stock for product: ${product.name}`,
        );
        error.statusCode = 400;
        throw error;
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      validatedItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal,
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        const notFoundError = new Error(`Product not found: ${item.productId}`);
        notFoundError.statusCode = 400;
        throw notFoundError;
      }
      throw error;
    }
  }

  return { validatedItems, totalAmount };
};

const createOrderRecord = async ({
  user,
  items,
  totalAmount,
  shippingAddress,
}) => {
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  return Order.create({
    orderNumber,
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
    },
    items,
    totalAmount,
    shippingAddress,
  });
};

const processPayment = async ({
  paymentServiceUrl,
  order,
  totalAmount,
  paymentMethod,
  customer,
  authHeader,
}) => {
  const paymentResponse = await axios.post(
    `${paymentServiceUrl}/api/payments/process`,
    {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: totalAmount,
      paymentMethod,
      customer,
    },
    {
      headers: {
        Authorization: authHeader,
      },
    },
  );

  return paymentResponse.data;
};

const sendOrderNotification = async ({
  paymentServiceUrl,
  order,
  user,
  authHeader,
}) => {
  await axios.post(
    `${paymentServiceUrl}/api/notifications/send`,
    {
      type: "order_confirmation",
      userId: user.userId,
      email: user.email,
      order: {
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount,
      },
    },
    {
      headers: {
        Authorization: authHeader,
      },
    },
  );
};

const fetchOrders = async ({ user, page = 1, limit = 10 }) => {
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const filter = user.role === "admin" ? {} : { "user.userId": user.userId };

  const orders = await Order.find(filter)
    .skip(skip)
    .limit(parseInt(limit, 10))
    .sort("-createdAt");

  const total = await Order.countDocuments(filter);

  return {
    orders,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
  };
};

const fetchOrdersByUserId = async ({
  requester,
  targetUserId,
  page = 1,
  limit = 10,
}) => {
  if (requester.role !== "admin" && requester.userId !== targetUserId) {
    const error = new Error("Access denied");
    error.statusCode = 403;
    throw error;
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const filter = { "user.userId": targetUserId };

  const orders = await Order.find(filter)
    .skip(skip)
    .limit(parseInt(limit, 10))
    .sort("-createdAt");

  const total = await Order.countDocuments(filter);

  return {
    orders,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
  };
};

const fetchOrderById = async (id) => Order.findById(id);

const updateOrderStatusById = async ({ id, orderStatus }) => {
  const order = await Order.findById(id);
  if (!order) {
    return null;
  }

  order.orderStatus = orderStatus;
  order.updatedAt = Date.now();
  await order.save();
  return order;
};

const deleteOrderById = async ({ id, requester }) => {
  const order = await Order.findById(id);
  if (!order) {
    return null;
  }

  if (requester.role !== "admin" && order.user.userId !== requester.userId) {
    const error = new Error("Access denied");
    error.statusCode = 403;
    throw error;
  }

  await Order.deleteOne({ _id: id });
  return order;
};

const updateOrderPaymentStatus = async ({
  orderId,
  paymentId,
  paymentStatus,
}) => {
  const order = await Order.findById(orderId);
  if (!order) {
    return null;
  }

  order.paymentStatus = paymentStatus;
  if (paymentId) {
    order.paymentId = paymentId;
  }
  await order.save();

  return order;
};

module.exports = {
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
};
