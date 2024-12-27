const redis = require("redis");

// Create a Redis client
const client = redis.createClient({
  host: "192.168.1.194",
  port: 6379,
});

// Handle Redis connection errors
client.on("error", (err) => {
  console.error("Error connecting to Redis:", err);
});

// Connect to Redis
client.connect().then(() => {
  console.log("Connected to Redis server");
});

module.exports = client;
