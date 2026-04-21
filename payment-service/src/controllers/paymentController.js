const axios = require("axios");
const {
  Client,
  Environment,
  OrdersController,
} = require("@paypal/paypal-server-sdk");
const Payment = require("../models/Payment");

const formatAmount = (value) => Number(value).toFixed(2);

const normalizeEnvValue = (value = "") => {
  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const parseBoolean = (value) =>
  ["true", "1", "yes", "y"].includes(normalizeEnvValue(value).toLowerCase());

const getPayPalClientId = () =>
  normalizeEnvValue(process.env.PAYPAL_CLIENT_ID || "");

const resolveMerchantId = () =>
  normalizeEnvValue(
    process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_MERCHANT_ID || "",
  );

const resolveMerchantSecret = () => {
  const rawSecret = normalizeEnvValue(
    process.env.PAYPAL_SECRECT_KEY ||
      process.env.PAYPAL_SECRET_KEY ||
      process.env.PAYPAL_MERCHANT_SECRET ||
      "",
  );
  const isBase64Secret = parseBoolean(
    process.env.PAYPAL_MERCHANT_SECRET_IS_BASE64 || "false",
  );

  if (!isBase64Secret) {
    return rawSecret;
  }

  try {
    return Buffer.from(rawSecret, "base64").toString("utf8").trim();
  } catch {
    return rawSecret;
  }
};

const getPayPalClient = () =>
  new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: getPayPalClientId(),
      oAuthClientSecret: resolveMerchantSecret(),
    },
    environment: Environment.Sandbox,
    timeout: 0,
  });

const getPayPalOrdersController = () => new OrdersController(getPayPalClient());

const extractPayPalResult = (response) =>
  response?.result || response?.body || response?.data || response;

const getPaymentProvider = () =>
  normalizeEnvValue(process.env.PAYMENT_PROVIDER || "auto").toLowerCase();

const isInvalidPayPalSecret = (merchantSecret) =>
  !merchantSecret ||
  merchantSecret === "replace-with-your-paypal-secret" ||
  merchantSecret.toLowerCase().includes("replace-with-your");

const shouldUseMockProvider = ({ merchantId, merchantSecret }) => {
  const paymentProvider = getPaymentProvider();
  if (paymentProvider === "mock") {
    return true;
  }
  if (paymentProvider === "paypal") {
    return false;
  }
  return !merchantId || isInvalidPayPalSecret(merchantSecret);
};

const processPayment = async (req, res) => {
  try {
    const {
      orderId,
      orderNumber,
      amount,
      paymentMethod,
      customer = {},
    } = req.body;

    if (!orderId || !orderNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: "orderId, orderNumber and amount are required",
      });
    }

    const merchantId = resolveMerchantId();
    const merchantSecret = resolveMerchantSecret();
    const paymentProvider = getPaymentProvider();
    const normalizedAmount = formatAmount(amount);
    const currency = normalizeEnvValue(process.env.PAYPAL_CURRENCY || "LKR");
    const useMockProvider = shouldUseMockProvider({
      merchantId,
      merchantSecret,
    });

    if (
      paymentProvider === "paypal" &&
      (!merchantId || isInvalidPayPalSecret(merchantSecret))
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Invalid PayPal credentials. Set PAYPAL_CLIENT_ID and PAYPAL_SECRECT_KEY (or PAYPAL_MERCHANT_ID and PAYPAL_MERCHANT_SECRET) in payment-service.",
      });
    }

    const payment = await Payment.create({
      orderId,
      orderNumber,
      userId: req.user.userId,
      amount: Number(normalizedAmount),
      currency,
      paymentMethod,
      status: "pending",
      transactionDetails: {
        processor: useMockProvider ? "sandbox-mock" : "paypal",
        initiatedAt: new Date().toISOString(),
        mode: "sandbox",
      },
    });

    if (useMockProvider) {
      payment.status = "completed";
      payment.transactionDetails = {
        ...(payment.transactionDetails || {}),
        transactionId: `mock_${Date.now()}`,
        mode: "sandbox",
        completedAt: new Date().toISOString(),
      };
      await payment.save();

      return res.status(200).json({
        success: true,
        message: "Sandbox payment completed successfully",
        data: {
          paymentId: payment.paymentId,
          status: payment.status,
          amount: payment.amount,
          orderNumber: payment.orderNumber,
          paymentGateway: "mock",
          checkoutData: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        paymentId: payment.paymentId,
        status: payment.status,
        amount: payment.amount,
        orderNumber: payment.orderNumber,
        paymentGateway: "paypal",
        checkoutData: {
          paymentId: payment.paymentId,
          amount: normalizedAmount,
          currency,
          mode: "sandbox",
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Payment processing failed",
      error: error.message,
    });
  }
};

const notifyPayment = async (req, res) => {
  try {
    const { paymentId, paypalOrderId, status, paidAmount, paidCurrency } =
      req.body;

    if (!paymentId || !status) {
      return res.status(400).send("Invalid notification payload");
    }

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).send("Payment not found");
    }

    payment.status =
      String(status).toUpperCase() === "COMPLETED" ? "completed" : "failed";
    payment.transactionDetails = {
      ...(payment.transactionDetails || {}),
      paypalOrderId,
      status,
      paidAmount,
      paidCurrency,
      notifiedAt: new Date().toISOString(),
    };
    await payment.save();

    if (process.env.ORDER_SERVICE_URL && process.env.INTERNAL_SERVICE_KEY) {
      try {
        await axios.post(
          `${process.env.ORDER_SERVICE_URL}/api/orders/internal/payment-status`,
          {
            orderId: payment.orderId,
            paymentId: payment.paymentId,
            paymentStatus: payment.status,
          },
          {
            headers: {
              "x-service-key": process.env.INTERNAL_SERVICE_KEY,
            },
          },
        );
      } catch (updateError) {
        console.error(
          "Failed to update order payment status:",
          updateError.message,
        );
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

const createOrder = async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "paymentId is required",
      });
    }

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const ordersController = getPayPalOrdersController();
    const response = await ordersController.createOrder({
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: payment.paymentId,
            description: `Order ${payment.orderNumber}`,
            amount: {
              currency_code: String(payment.currency || "USD").toUpperCase(),
              value: formatAmount(payment.amount),
            },
          },
        ],
      },
      prefer: "return=representation",
    });

    const order = extractPayPalResult(response);

    payment.transactionDetails = {
      ...(payment.transactionDetails || {}),
      paypalOrderId: order?.id,
      createdAt: new Date().toISOString(),
    };
    await payment.save();

    return res.status(200).json({
      id: order?.id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create PayPal order",
      error: error.message,
    });
  }
};

const captureOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "PayPal order id is required",
      });
    }

    const payment = await Payment.findOne(
      paymentId
        ? { paymentId }
        : {
            "transactionDetails.paypalOrderId": id,
          },
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const ordersController = getPayPalOrdersController();
    const response = await ordersController.captureOrder({
      id,
      prefer: "return=representation",
    });

    const capturedOrder = extractPayPalResult(response);
    const captureStatus = String(capturedOrder?.status || "").toUpperCase();

    payment.status = captureStatus === "COMPLETED" ? "completed" : "failed";
    payment.transactionDetails = {
      ...(payment.transactionDetails || {}),
      paypalOrderId: id,
      captureStatus,
      captureResponse: capturedOrder,
      capturedAt: new Date().toISOString(),
    };
    await payment.save();

    if (process.env.ORDER_SERVICE_URL && process.env.INTERNAL_SERVICE_KEY) {
      try {
        await axios.post(
          `${process.env.ORDER_SERVICE_URL}/api/orders/internal/payment-status`,
          {
            orderId: payment.orderId,
            paymentId: payment.paymentId,
            paymentStatus: payment.status,
          },
          {
            headers: {
              "x-service-key": process.env.INTERNAL_SERVICE_KEY,
            },
          },
        );
      } catch (updateError) {
        console.error(
          "Failed to update order payment status:",
          updateError.message,
        );
      }
    }

    return res.status(200).json(capturedOrder);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to capture PayPal order",
      error: error.message,
    });
  }
};

const getPayPalConfig = async (req, res) => {
  try {
    const clientId = getPayPalClientId();
    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: "PAYPAL_CLIENT_ID is not configured",
      });
    }

    return res.status(200).json({
      clientId,
      currency: normalizeEnvValue(process.env.PAYPAL_CURRENCY || "USD"),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch PayPal config",
      error: error.message,
    });
  }
};

const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findOne({ paymentId: req.params.paymentId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
};

module.exports = {
  processPayment,
  notifyPayment,
  getPaymentDetails,
  createOrder,
  captureOrder,
  getPayPalConfig,
};
