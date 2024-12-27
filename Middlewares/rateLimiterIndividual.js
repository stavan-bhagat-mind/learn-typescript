const rateLimit = require("express-rate-limit");
require("dotenv").config();
const redisClient = require("../config/redisConfig");

// 1. Simple Fixed Window Implementation

const apiLimiter = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip;
    const key = `rateLimit:${userId}:${req.path}`;

    // Get current count for this user and endpoint
    const currentCount = await redisClient.get(key);

    // If key doesn't exist, create it with count 1 and TTL
    if (!currentCount) {
      const timeFrameInSeconds = parseInt(process.env.TIME_FRAME) * 60;
      await redisClient.set(key, 1, { EX: timeFrameInSeconds });
      return next();
    }

    // If count exists but under limit, increment it
    if (parseInt(currentCount) < process.env.REQUEST_LIMIT) {
      await redisClient.incr(key);
      return next();
    }

    // Rate limit exceeded
    res.status(429).json({
      error: "request limit exceeded",
      message: "Too many requests, please try again later.",
    });
  } catch (error) {
    console.error("Rate limiter error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = apiLimiter;
