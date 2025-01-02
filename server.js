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
const Queue = require("bull");

// Thread pool implementation
const workerPool = [];
const maxWorkers = 4;

for (let i = 0; i < maxWorkers; i++) {
  workerPool.push(
    new Worker(path.join(__dirname, "workers", "computeWorker.js"))
  );
}

// Create a Bull queue
const computeQueue = new Queue("compute");
computeQueue.process(async (job, done) => {
  try {
    const result = await createWorker(job.data);
    done(null, result);
  } catch (error) {
    done(error);
  }
});

function createWorker(data) {
  return new Promise((resolve, reject) => {
    if (workerPool.length === 0) {
      return reject(new Error("No available workers"));
    }

    const worker = workerPool.pop();

    worker.once("message", (result) => {
      workerPool.push(worker);
      resolve(result);
    });

    worker.once("error", (err) => {
      workerPool.push(worker);
      reject(err);
    });

    worker.postMessage(data);
  });
}

const MAIN_PORT = process.env.PORT || 3000;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} started`);

  // Run examples only once in master process
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
    res.json({
      message: "Simple response",
      workerId: cluster.worker.id,
      pid: process.pid,
    });
  });

  // CPU intensive route - uses worker thread
  app.get("/api/compute/:number", async (req, res) => {
    try {
      const number = parseInt(req.params.number);
      const job = await computeQueue.add({ number });
      const result = await job.finished();
      res.json({
        result,
        workerId: cluster.worker.id,
        pid: process.pid,
      });
    } catch (error) {
      console.error(`Computation error:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // I/O operation - no worker thread needed
  app.get("/api/users", async (req, res) => {
    try {
      const users = await db.users.findAll();
      res.json({
        users,
        workerId: cluster.worker.id,
        pid: process.pid,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(MAIN_PORT, () => {
    console.log(
      `Worker ${process.pid} started and listening on port ${MAIN_PORT}`
    );
  });
}
