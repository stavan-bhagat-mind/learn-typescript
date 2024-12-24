const userRouter = require("express").Router();
const { getUser } = require("../Controllers/userController");
const loggingMiddleware = require("../Middlewares/middleware");

userRouter.get("/list", loggingMiddleware, getUser);

module.exports = userRouter;
