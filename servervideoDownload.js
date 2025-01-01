const express = require("express");
const Bull = require("bull");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const upload = multer({ dest: "uploads/" });

// Queue for video processing
const videoQueue = new Bull("video-processing-queue");

// Store video metadata in memory
const videoMetadata = new Map();
// Path for metadata file
const metadataFilePath = path.join(__dirname, "videoMetadata.json");

// Save video metadata to file
function saveMetadata() {
  let existingData = {};
  if (fs.existsSync(metadataFilePath)) {
    const data = fs.readFileSync(metadataFilePath);
    existingData = JSON.parse(data);
  }

  // Merge existing data with current in-memory data
  const dataToSave = { ...existingData, ...Object.fromEntries(videoMetadata) };

  fs.writeFileSync(metadataFilePath, JSON.stringify(dataToSave, null, 2));
}

// Configure storage
const storage = {
  baseDir: path.join(__dirname, "videos"),
  chunksDir: path.join(__dirname, "videos", "chunks"),
};
// Ensure directories exist
fs.mkdirSync(storage.baseDir, { recursive: true });
fs.mkdirSync(storage.chunksDir, { recursive: true });

// Process uploaded videos
videoQueue.process(async (job) => {
  const { originalPath, videoId, fileName } = job.data;
  const finalPath = path.join(storage.baseDir, `${videoId}-${fileName}`);

  try {
    // Move file to final location
    await fs.promises.rename(originalPath, finalPath);

    // Create chunks for efficient streaming
    const chunkSize = 1024 * 1024; // 1MB chunks
    const fileHandle = await fs.promises.open(finalPath, "r");
    const fileStats = await fs.promises.stat(finalPath);
    const totalChunks = Math.ceil(fileStats.size / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const buffer = Buffer.alloc(
        Math.min(chunkSize, fileStats.size - i * chunkSize)
      );
      const position = i * chunkSize;
      await fileHandle.read(buffer, 0, buffer.length, position);

      const chunkPath = path.join(storage.chunksDir, `${videoId}-chunk-${i}`);
      await fs.promises.writeFile(chunkPath, buffer);

      job.progress(Math.round(((i + 1) / totalChunks) * 100));
    }

    await fileHandle.close();

    // Update metadata
    videoMetadata.set(videoId, {
      fileName,
      size: fileStats.size,
      chunks: totalChunks,
      status: "ready",
    });
    saveMetadata(); // Save metadata after processing

    return { videoId, status: "processed" };
  } catch (error) {
    videoMetadata.set(videoId, {
      status: "failed",
      error: error.message,
    });
    saveMetadata(); // Save metadata after failure
    throw error;
  }
});

// API Endpoints
app.post("/upload", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file provided" });
  }

  const videoId = crypto.randomUUID();

  const job = await videoQueue.add({
    originalPath: req.file.path,
    videoId,
    fileName: req.file.originalname,
  });

  // Initialize metadata for the new video
  videoMetadata.set(videoId, {
    status: "processing",
    progress: 0,
  });
  saveMetadata(); // Save metadata after adding the job

  res.json({ videoId, jobId: job.id });
});

// Get video status
app.get("/video/:videoId/status", (req, res) => {
  const { videoId } = req.params;
  const metadata = videoMetadata.get(videoId);

  if (!metadata) {
    return res.status(404).json({ error: "Video not found" });
  }

  res.json(metadata);
});

// Stream video
app.get("/video/:videoId", async (req, res) => {
  const { videoId } = req.params;
  const metadata = videoMetadata.get(videoId);

  if (!metadata || metadata.status !== "ready") {
    return res.status(404).json({ error: "Video not found or not ready" });
  }

  const videoSize = metadata.size;
  const range = req.headers.range;

  // If no range header, send entire file
  if (!range) {
    res.writeHead(200, {
      "Content-Length": videoSize,
      "Content-Type": "video/mp4",
    });
    const readStream = fs.createReadStream(
      path.join(storage.baseDir, `${videoId}-${metadata.fileName}`)
    );
    readStream.pipe(res);
  } else {
    // Parse range header
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = Math.min(start + 1024 * 1024 - 1, videoSize - 1); // 1MB chunks

    const contentLength = end - start + 1;
    const readStream = fs.createReadStream(
      path.join(storage.baseDir, `${videoId}-${metadata.fileName}`),
      { start, end }
    );

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    });
    readStream.pipe(res);
  }
});

app.get("/video/:videoId/download", async (req, res) => {
  const { videoId } = req.params;
  const metadata = videoMetadata.get(videoId);

  if (!metadata || metadata.status !== "ready") {
    return res.status(404).json({ error: "Video not found or not ready" });
  }

  const videoPath = path.join(
    storage.baseDir,
    `${videoId}-${metadata.fileName}`
  );

  res.download(videoPath, metadata.fileName, (err) => {
    if (err) {
      res.status(500).json({ error: "Error downloading the video" });
    }
  });
});

// Get all videos from memory
app.get("/videos", (req, res) => {
  const videos = Array.from(videoMetadata.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));
  res.json(videos);
});

// Get all videos from file
app.get("/videos-from-file", (req, res) => {
  if (fs.existsSync(metadataFilePath)) {
    const data = fs.readFileSync(metadataFilePath);
    const existingData = JSON.parse(data);
    res.json(existingData);
  } else {
    res.status(404).json({ error: "No video metadata found" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
