// fileStreams.js
const fs = require("fs");
const path = require("path");
const { Transform, pipeline } = require("stream");

// Create a read stream
function createReadStream(filePath) {
  const readStream = fs.createReadStream(filePath, {
    highWaterMark: 64 * 1024, // 64KB chunks
    encoding: "utf8",
  });

  readStream.on("error", (error) => {
    console.error("Read Error:", error);
  });

  return readStream;
}

// Create a write stream
function createWriteStream(filePath) {
  const writeStream = fs.createWriteStream(filePath, {
    flags: "a", // append mode
  });

  writeStream.on("error", (error) => {
    console.error("Write Error:", error);
  });

  return writeStream;
}

// Create a transform stream for data processing
function createTransformStream(operation) {
  return new Transform({
    transform(chunk, encoding, callback) {
      let transformedData;

      switch (operation) {
        case "uppercase":
          transformedData = chunk.toString().toUpperCase();
          break;
        case "lowercase":
          transformedData = chunk.toString().toLowerCase();
          break;
        case "removeSpaces":
          transformedData = chunk.toString().replace(/\s+/g, " ").trim();
          break;
        default:
          transformedData = chunk;
      }

      callback(null, transformedData);
    },
  });
}

// Function to copy file using streams
function copyFile(source, destination, callback) {
  const readStream = createReadStream(source);
  const writeStream = createWriteStream(destination);

  pipeline(readStream, writeStream, (error) => {
    if (error) {
      console.error("Pipeline failed:", error);
      callback && callback(error);
    } else {
      console.log("File copied successfully!");
      callback && callback(null);
    }
  });
}

// Function to transform file content
function transformFile(source, destination, operation, callback) {
  const readStream = createReadStream(source);
  const transformStream = createTransformStream(operation);
  const writeStream = createWriteStream(destination);

  pipeline(readStream, transformStream, writeStream, (error) => {
    if (error) {
      console.error("Pipeline failed:", error);
      callback && callback(error);
    } else {
      console.log("File transformed successfully!");
      callback && callback(null);
    }
  });
}

// Function to read file in chunks
function readFileInChunks(filePath, chunkCallback) {
  const readStream = createReadStream(filePath);
  let dataChunks = [];

  readStream.on("data", (chunk) => {
    dataChunks.push(chunk);
    if (chunkCallback) {
      chunkCallback(chunk);
    }
  });

  readStream.on("end", () => {
    console.log("Finished reading all chunks");
    console.log("Total chunks:", dataChunks.length);
  });
}

// Function to merge multiple files
function mergeFiles(sourceFiles, destinationFile, callback) {
  const writeStream = createWriteStream(destinationFile);
  let currentFileIndex = 0;

  function processNextFile() {
    if (currentFileIndex >= sourceFiles.length) {
      console.log("Files merged successfully!");
      callback && callback(null);
      return;
    }

    const readStream = createReadStream(sourceFiles[currentFileIndex]);

    pipeline(readStream, writeStream, (error) => {
      if (error) {
        console.error("Merge failed:", error);
        callback && callback(error);
        return;
      }
      currentFileIndex++;
      processNextFile();
    });
  }

  processNextFile();
}

// Example usage
function runExamples() {
  fs.writeFileSync(
    "input.txt",
    "This is a sample text file.\nIt has multiple lines.\nWe will process it using streams."
  );
  copyFile("input.txt", "copied.txt", (error) => {
    if (error) {
      console.error("Copy failed:", error);
      return;
    }
    transformFile("input.txt", "uppercase.txt", "uppercase", (error) => {
      if (error) {
        console.error("Transform failed:", error);
        return;
      }
      readFileInChunks("input.txt", (chunk) => {
        console.log("Received chunk:", chunk.length, "bytes");
      });
      mergeFiles(["input.txt", "copied.txt"], "merged.txt", (error) => {
        if (error) {
          console.error("Merge failed:", error);
        }
      });
    });
  });
}

module.exports = {
  copyFile,
  transformFile,
  readFileInChunks,
  mergeFiles,
  runExamples,
};
