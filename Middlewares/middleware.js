require("dotenv").config();

const loggingMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  count = 0;
  if (req) {
    count++;
    console.log("count", count);
  }
  count === process.env.REQUEST_COUNT
    ? res.status(400).json({
        error: {
          message: "Max count reached",
          code: 400,
          details: "The number of requests has exceeded the allowed limit.",
        },
      })
    : console.log();
};

module.exports = loggingMiddleware;
