const rateLimiter = require("express-rate-limit");
require("dotenv").config();

const limiter = rateLimiter({
  windowMs: process.env.GLOBAL_TIME_FRAME || 5 * 60 * 1000,
  max: process.env.GLOBAL_RATE_LIMIT || 100,
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req, res) => {
    res.status(429).json({
      error:
        "You’ve exceeded the 300 request/min rate limit,please try again later.",
      statusCode: 429,
    });
  },
});

module.exports = limiter;
