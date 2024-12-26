const rateLimit = require("express-rate-limit");
require("dotenv").config();

const apiLimiter = rateLimit({
  windowMs: process.env.TIME_FRAME || 5 * 60 * 1000,
  max: process.env.RATE_LIMIT || 20,
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests, please try again later.",
      statusCode: 429,
    });
  },
});

module.exports = apiLimiter;
