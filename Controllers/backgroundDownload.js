const express = require("express");
const Bull = require("bull");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Initialize Express app
const app = express();
app.use(express.json());

// Create a Bull queue for downloads
const downloadQueue = new Bull("download-queue", {
  redis: {
    host: "localhost",
    port: 6379,
  },
});

// Track download progress
const downloadStatus = new Map();

// Process download jobs
downloadQueue.process(async (job) => {
  const { url, fileName } = job.data;
  const downloadPath = path.join(__dirname, "downloads", fileName);

  try {
    // Create downloads directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, "downloads"))) {
      fs.mkdirSync(path.join(__dirname, "downloads"));
    }

    // Download file with progress tracking
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    const totalLength = response.headers["content-length"];
    let downloadedLength = 0;

    const writer = fs.createWriteStream(downloadPath);

    response.data.on("data", (chunk) => {
      downloadedLength += chunk.length;
      const progress = Math.round((downloadedLength / totalLength) * 100);
      job.progress(progress);
      downloadStatus.set(job.id, {
        progress,
        status: "downloading",
      });
    });

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        downloadStatus.set(job.id, {
          progress: 100,
          status: "completed",
        });
        resolve({ fileName, path: downloadPath });
      });

      writer.on("error", (err) => {
        downloadStatus.set(job.id, {
          progress: 0,
          status: "failed",
          error: err.message,
        });
        reject(err);
      });

      response.data.pipe(writer);
    });
  } catch (error) {
    downloadStatus.set(job.id, {
      progress: 0,
      status: "failed",
      error: error.message,
    });
    throw error;
  }
});

// API endpoints
app.post("/download", async (req, res) => {
  const { url } = req.body;
  const fileName = path.basename(url);

  try {
    const job = await downloadQueue.add({
      url,
      fileName,
    });

    downloadStatus.set(job.id, {
      progress: 0,
      status: "queued",
    });

    res.json({
      jobId: job.id,
      message: "Download queued successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to queue download",
    });
  }
});

app.get("/status/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const status = downloadStatus.get(jobId) || {
    status: "not_found",
  };
  res.json(status);
});

// Error handling
downloadQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
  downloadStatus.set(job.id, {
    progress: 0,
    status: "failed",
    error: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//
// This implementation creates a background download system using Bull queue and Express. Here's how it works:

// Setup:

// Uses Bull queue for managing download jobs
// Requires Redis for Bull queue management
// Creates an Express server for the API endpoints

// Core Features:

// Queues downloads asynchronously
// Tracks download progress in real-time
// Supports multiple concurrent downloads
// Saves files to a local 'downloads' directory
// Provides status updates via API

// API Endpoints:

// POST /download: Queue a new download
// GET /status/:jobId: Check download progress

// To use this system:

// Install dependencies:

// bashCopynpm install express bull axios

// Make sure Redis is running on your system
// Make a download request:

// bashCopycurl -X POST http://localhost:3000/download \
//   -H "Content-Type: application/json" \
//   -d '{"url": "https://example.com/largefile.zip"}'

// Check download status:

// bashCopycurl http://localhost:3000/status/[jobId]
// Would you like me to add any additional features like:

// File validation
// Download retry logic
// Cleanup of completed downloads
// Rate limiting
// Authentication for the API endpoints
