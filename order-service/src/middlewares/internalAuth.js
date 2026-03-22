const internalAuth = (req, res, next) => {
  const serviceKey = req.headers["x-service-key"];
  const expectedKey = process.env.INTERNAL_SERVICE_KEY;

  if (!expectedKey || !serviceKey || serviceKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized internal request",
    });
  }

  return next();
};

module.exports = internalAuth;
