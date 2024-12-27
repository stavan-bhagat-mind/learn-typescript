// server.js
require("dotenv").config();
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const { Worker } = require("worker_threads");
const Express = require("express");
const indexRouter = require("./Routers/indexRoute");
const db = require("./db/index");
const apiLimiter = require("./Middlewares/rateLimiterIndividual");

// Heavy computation worker
function createComputationWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      `
      const { parentPort } = require('worker_threads');
      
      // Simulate CPU-intensive task
      parentPort.on('message', (data) => {
        // Example: Complex computation
        let result = 0;
        for(let i = 0; i < 1000000; i++) {
          result += Math.sqrt(i);
        }
        parentPort.postMessage(result);
      });
    `,
      { eval: true }
    );

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    worker.postMessage(data);
  });
}

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Fork a new worker if one dies
    cluster.fork();
  });
} else {
  const app = Express();
  const port = process.env.PORT || 3000;

  // Your existing middleware
  app.use(Express.json());
  app.use(Express.urlencoded({ extended: true }));

  // CORS middleware
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    next();
  });

  app.use("/", indexRouter);

  // Example route using worker thread for CPU-intensive task
  // app.get("/heavy-computation", async (req, res) => {
  //   try {
  //     const result = await createComputationWorker(req.query);
  //     res.json({ result });
  //   } catch (error) {
  //     res.status(500).json({ error: "Computation failed" });
  //   }
  // });

  app.get("/heavy", async (req, res) => {
    try {
      let total = 0;
      for (let i = 0; i < 50_000_00; i++) {
        total++;
        // console.log(total);
      }
      res.json({ total });
    } catch (error) {
      res.status(500).json({ error: "Computation failed" });
    }
  });

  // Your existing data route with rate limiting
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
    console.log(`Worker ${process.pid} started on port ${port}`);
  });
}
