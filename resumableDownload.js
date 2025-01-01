const express = require("express");
const Bull = require("bull");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(express.json());

const downloadQueue = new Bull("resumable-download-queue");

// Store download progress in memory (use Redis/DB in production)
const downloadProgress = new Map();

// Process download jobs
downloadQueue.process(async (job) => {
  const { url, fileName, startByte = 0 } = job.data;
  const downloadPath = path.join(__dirname, "downloads", fileName);

  try {
    const headers = {
      Range: `bytes=${startByte}-`,
    };

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      headers,
    });

    const totalLength =
      parseInt(response.headers["content-length"]) + startByte;
    let downloadedLength = startByte;

    // Create or append to file
    const writer = fs.createWriteStream(downloadPath, {
      flags: startByte > 0 ? "a" : "w",
    });

    response.data.on("data", (chunk) => {
      downloadedLength += chunk.length;
      const progress = Math.round((downloadedLength / totalLength) * 100);

      downloadProgress.set(job.id, {
        progress,
        downloadedBytes: downloadedLength,
        totalBytes: totalLength,
        status: "downloading",
      });

      job.progress(progress);
    });

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        downloadProgress.set(job.id, {
          progress: 100,
          downloadedBytes: totalLength,
          totalBytes: totalLength,
          status: "completed",
        });
        resolve();
      });

      writer.on("error", reject);
      response.data.pipe(writer);
    });
  } catch (error) {
    downloadProgress.set(job.id, {
      status: "failed",
      error: error.message,
    });
    throw error;
  }
});

// API Endpoints
app.post("/download", async (req, res) => {
  const { url } = req.body;
  const fileName = path.basename(url);

  const job = await downloadQueue.add({ url, fileName });

  downloadProgress.set(job.id, {
    progress: 0,
    downloadedBytes: 0,
    status: "queued",
  });

  res.json({ jobId: job.id });
});

app.post("/resume/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const progress = downloadProgress.get(jobId);

  if (!progress) {
    return res.status(404).json({ error: "Download not found" });
  }

  const job = await downloadQueue.getJob(jobId);
  const { url, fileName } = job.data;

  // Create new job with startByte
  const newJob = await downloadQueue.add({
    url,
    fileName,
    startByte: progress.downloadedBytes,
  });

  res.json({ jobId: newJob.id });
});

app.get("/status/:jobId", (req, res) => {
  const status = downloadProgress.get(req.params.jobId);
  res.json(status || { status: "not_found" });
});
