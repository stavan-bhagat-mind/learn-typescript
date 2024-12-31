// server.js
require("dotenv").config();
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const { Worker } = require("worker_threads");
const express = require("express");
const indexRouter = require("./Routers/indexRoute");
const db = require("./db/index");
const apiLimiter = require("./Middlewares/rateLimiterIndividual");
const { runExamples } = require("./Controllers/streamController");
const path = require("path");

// Create a worker thread for CPU-intensive tasks
function createWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.join(__dirname, "workers", "computeWorker.js")
    );

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
    });

    worker.postMessage(data);
  });
}

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} started`);

  // Run examples
  runExamples();
  // Fork workers equal to CPU cores
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker crashes
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();
  app.use(express.json());

  // Regular route - no worker thread needed
  app.get("/api/simple", (req, res) => {
    res.json({ message: "Simple response" });
  });

  // CPU intensive route - uses worker thread
  app.get("/api/compute/:number", async (req, res) => {
    try {
      const number = parseInt(req.params.number);
      const result = await createWorker({ number });
      process.send({
        type: "computation",
        workerId: cluster.worker.id,
        input: number,
        result,
      });
      res.json({ result });
    } catch (error) {
      console.error(`Computation error:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // I/O operation - no worker thread needed
  app.get("/api/users", async (req, res) => {
    try {
      const users = await db.users.findAll();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const port = 3000 + cluster.worker.id; // Different port for each worker
  app.listen(port, () => {
    console.log(`Worker ${process.pid} started on port ${port}`);
  });
}
