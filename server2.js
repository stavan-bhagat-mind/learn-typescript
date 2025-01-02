require("dotenv").config();
const { Worker } = require("worker_threads");
const express = require("express");
const indexRouter = require("./Routers/indexRoute");
const db = require("./db/index");
const apiLimiter = require("./Middlewares/rateLimiterIndividual");
const { runExamples } = require("./Controllers/streamController");
const path = require("path");
const Queue = require("bull");

// Determine the number of CPU cores
const numCPUs = require("os").cpus().length;

// Thread pool implementation
const workerPool = [];
const maxWorkers = numCPUs; // Set maxWorkers to the number of CPU cores

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

const app = express();
app.use(express.json());

// Regular route - no worker thread needed
app.get("/api/simple", (req, res) => {
  res.json({
    message: "Simple response",
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
      pid: process.pid,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(MAIN_PORT, () => {
  console.log(`Server started and listening on port ${MAIN_PORT}`);
});

// -------------------------------------

// require("dotenv").config();
// const express = require("express");
// const indexRouter = require("./Routers/indexRoute");
// const db = require("./db/index");
// const apiLimiter = require("./Middlewares/rateLimiterIndividual");
// const { runExamples } = require("./Controllers/streamController");
// const path = require("path");
// const Queue = require("bull");

// // Create a Bull queue
// const computeQueue = new Queue("compute");

// computeQueue.process(async (job, done) => {
//   try {
//     const result = performCalculation(job.data.number);
//     done(null, result);
//   } catch (error) {
//     done(error);
//   }
// });

// function performCalculation(number) {
//   let result = 0;
//   for (let i = 0; i < number; i++) {
//     result += Math.sqrt(i);
//   }
//   return result;
// }

// const MAIN_PORT = process.env.PORT || 3000;

// const app = express();
// app.use(express.json());

// // Regular route - no worker thread needed
// app.get("/api/simple", (req, res) => {
//   res.json({
//     message: "Simple response",
//     pid: process.pid,
//   });
// });

// // CPU intensive route - handled directly in the main thread
// app.get("/api/compute/:number", async (req, res) => {
//   try {
//     const number = parseInt(req.params.number);
//     const job = await computeQueue.add({ number });
//     const result = await job.finished();
//     res.json({
//       result,
//       pid: process.pid,
//     });
//   } catch (error) {
//     console.error(`Computation error:`, error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // I/O operation - no worker thread needed
// app.get("/api/users", async (req, res) => {
//   try {
//     const users = await db.users.findAll();
//     res.json({
//       users,
//       pid: process.pid,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.listen(MAIN_PORT, () => {
//   console.log(`Server started and listening on port ${MAIN_PORT}`);
// });

// /--------------------------------------------
// require("dotenv").config();
// const express = require("express");
// const indexRouter = require("./Routers/indexRoute");
// const db = require("./db/index");
// const apiLimiter = require("./Middlewares/rateLimiterIndividual");
// const { runExamples } = require("./Controllers/streamController");
// const path = require("path");

// function performCalculation(number) {
//   let result = 0;
//   for (let i = 0; i < number; i++) {
//     result += Math.sqrt(i);
//   }
//   return result;
// }

// const MAIN_PORT = process.env.PORT || 3000;

// const app = express();
// app.use(express.json());

// // Regular route - no worker thread needed
// app.get("/api/simple", (req, res) => {
//   res.json({
//     message: "Simple response",
//     pid: process.pid,
//   });
// });

// // CPU intensive route - handled directly in the main thread
// app.get("/api/compute/:number", (req, res) => {
//   try {
//     const number = parseInt(req.params.number);
//     const result = performCalculation(number);
//     res.json({
//       result,
//       pid: process.pid,
//     });
//   } catch (error) {
//     console.error(`Computation error:`, error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // I/O operation - no worker thread needed
// app.get("/api/users", async (req, res) => {
//   try {
//     const users = await db.users.findAll();
//     res.json({
//       users,
//       pid: process.pid,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.listen(MAIN_PORT, () => {
//   console.log(`Server started and listening on port ${MAIN_PORT}`);
// });
