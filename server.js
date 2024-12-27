require("dotenv").config();
const indexRouter = require("./Routers/indexRoute");
const Express = require("express");
const db = require("./db/index");
const apiLimiter = require("./Middlewares/rateLimiterIndividual");
const app = Express();
const port = process.env.PORT || 3000;

// For parsing the express payloads
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

// CORS permission
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  next();
});
// app.use(limiter);
app.use("/", indexRouter);

app.get("/data", apiLimiter, async (req, res) => {
  try {
    const users = await db.development_db1.models.User.findAll();
    const products = await db.development_db2.models.Product.findAll();

    res.json({
      users,
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.listen(port, () => {
  console.log("Server started on port ", port);
  // console.log("DB connected to ", process.env.DEV_HOST);
});
