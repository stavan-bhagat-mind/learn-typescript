const db = require("../db/index");
const redisClient = require("../config/redisConfig");

module.exports.getUser = async (req, res) => {
  try {
    const users = await db.development_db1.models.User.findAll();
    res.json({
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
