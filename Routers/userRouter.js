const userRouter = require("express").Router();
const { getUser } = require("../Controllers/userController");
const loggingMiddleware = require("../Middlewares/middleware");
const apiLimiter = require("../Middlewares/rateLimiterIndividual");

userRouter.get("/list", apiLimiter, loggingMiddleware, getUser);

module.exports = userRouter;
