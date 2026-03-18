const crypto = require("crypto");
const axios = require("axios");
const Payment = require("../models/Payment");

const md5 = (value) =>
  crypto.createHash("md5").update(String(value)).digest("hex").toUpperCase();
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

const resolveMerchantSecret = () => {
  const rawSecret = normalizeEnvValue(
    process.env.PAYHERE_MERCHANT_SECRET || "",
  );
  const isBase64Secret = parseBoolean(
    process.env.PAYHERE_MERCHANT_SECRET_IS_BASE64 || "false",
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

const buildPayHereHash = ({
  merchantId,
  merchantSecret,
  orderId,
  amount,
  currency,
}) => {
  const secretHash = md5(merchantSecret);
  return md5(`${merchantId}${orderId}${amount}${currency}${secretHash}`);
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

    const merchantId = normalizeEnvValue(process.env.PAYHERE_MERCHANT_ID || "");
    const merchantSecret = resolveMerchantSecret();

    if (
      !merchantId ||
      !merchantSecret ||
      merchantSecret === "replace-with-your-payhere-secret" ||
      merchantSecret.toLowerCase().includes("replace-with-your")
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Invalid PayHere credentials. Set PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET in payment-service.",
      });
    }

    const normalizedAmount = formatAmount(amount);
    const currency = normalizeEnvValue(process.env.PAYHERE_CURRENCY || "LKR");

    const payment = await Payment.create({
      orderId,
      orderNumber,
      userId: req.user.userId,
      amount: Number(normalizedAmount),
      paymentMethod,
      status: "pending",
      transactionDetails: {
        processor: "payhere",
        initiatedAt: new Date().toISOString(),
      },
    });

    const firstName =
      customer.firstName || req.user.name?.split(" ")?.[0] || "Customer";
    const lastName =
      customer.lastName ||
      req.user.name?.split(" ")?.slice(1).join(" ") ||
      "User";
    const email = customer.email || req.user.email;

    const checkoutData = {
      sandbox: parseBoolean(process.env.PAYHERE_SANDBOX || "true"),
      merchant_id: merchantId,
      return_url:
        normalizeEnvValue(process.env.PAYHERE_RETURN_URL) ||
        "http://localhost/checkout?payment=success",
      cancel_url:
        normalizeEnvValue(process.env.PAYHERE_CANCEL_URL) ||
        "http://localhost/checkout?payment=cancelled",
      notify_url:
        normalizeEnvValue(process.env.PAYHERE_NOTIFY_URL) ||
        "http://localhost/api/payments/notify",
      order_id: payment.paymentId,
      items: `Order ${orderNumber}`,
      amount: normalizedAmount,
      currency,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: customer.phone || "0770000000",
      address: customer.address || "N/A",
      city: customer.city || "Colombo",
      country: customer.country || "Sri Lanka",
      hash: buildPayHereHash({
        merchantId,
        merchantSecret,
        orderId: payment.paymentId,
        amount: normalizedAmount,
        currency,
      }),
      custom_1: orderId,
      custom_2: orderNumber,
    };

    return res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        paymentId: payment.paymentId,
        status: payment.status,
        amount: payment.amount,
        orderNumber: payment.orderNumber,
        paymentGateway: "payhere",
        checkoutData,
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
    const {
      merchant_id: merchantId,
      order_id: paymentId,
      payhere_amount: paidAmount,
      payhere_currency: paidCurrency,
      status_code: statusCode,
      md5sig,
      payment_id: gatewayPaymentId,
    } = req.body;

    if (!paymentId || !statusCode) {
      return res.status(400).send("Invalid notification payload");
    }

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).send("Payment not found");
    }

    const merchantSecret = resolveMerchantSecret();
    if (merchantSecret && merchantId && paidAmount && paidCurrency && md5sig) {
      const localSig = md5(
        `${merchantId}${paymentId}${paidAmount}${paidCurrency}${statusCode}${md5(merchantSecret)}`,
      );
      if (localSig !== String(md5sig).toUpperCase()) {
        return res.status(400).send("Invalid signature");
      }
    }

    payment.status = String(statusCode) === "2" ? "completed" : "failed";
    payment.transactionDetails = {
      ...(payment.transactionDetails || {}),
      gatewayPaymentId,
      statusCode,
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
};
