require("dotenv").config();
const IndexRoute = require("./Routers/indexRoute");
const Express = require("express");
const db = require("./db/index");
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

app.use("/", IndexRoute);

app.get("/data", async (req, res) => {
  try {
    const users = await db.Database1.models.User.findAll();
    const products = await db.Database2.models.Product.findAll();

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
