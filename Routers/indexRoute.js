const indexController = require("express").Router();
const userRouter = require("./userRouter");

indexController.use("/user", userRouter);

module.exports = indexController;


// API rate limit (User can hit a particular API x amount of time in T duration. e.g UserA can hit an API (/login) 20 times max within 5 min timeframe,
// if exceeded, reject the request)
// Server needs to communicate with 2 different databases. How can we implement this with sequelize.