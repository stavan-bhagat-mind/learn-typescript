const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require("../config/config");

const db = {};
const env = process.env.NODE_ENV || "development";
const databases = Object.keys(config[env].databases);

// Create Sequelize instances for each database
databases.forEach((database) => {
  const dbConfig = config[env].databases[database];
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: console.log,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );

  db[database] = {
    sequelize,
    Sequelize,
    models: {},
  };

  // Test the connection
  sequelize
    .authenticate()
    .then(() => {
      console.log(
        `Connection to ${database} has been established successfully.`
      );
    })
    .catch((error) => {
      console.error(`Unable to connect to the database ${database}:`, error);
    });

  // Load models for this database
  const modelsDir =
    database === "Database1"
      ? path.join(__dirname, "./database1/models")
      : path.join(__dirname, "./database2/models");

  fs.readdirSync(modelsDir)
    .filter((file) => file.indexOf(".") !== 0 && file.slice(-3) === ".js")
    .forEach((file) => {
      const model = require(path.join(modelsDir, file))(sequelize, Sequelize);
      db[database].models[model.name] = model;
    });
});

// Run associations if they exist
Object.keys(db).forEach((database) => {
  if (db[database].models) {
    Object.values(db[database].models).forEach((model) => {
      if (model.associate) {
        model.associate(db[database].models);
      }
    });
  }
});

module.exports = db;

// "use strict";

// const fs = require("fs");
// const path = require("path");
// const Sequelize = require("sequelize");
// const process = require("process");
// const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || "development";
// const config = require(__dirname + "/../config/config.json")[env];
// const db = {};

// //Extract the database information into an array
// const databases = Object.keys(config.databases);

// //Loop over the array and create a new Sequelize instance for every database from config.js
// for (let i = 0; i < databases.length; ++i) {
//   let database = databases[i];
//   let dbPath = config.databases[database];
//   //Store the database connection in our db object
//   db[database] = new Sequelize(
//     dbPath.database,
//     dbPath.username,
//     dbPath.password,
//     dbPath
//   );
// }

// // let sequelize;
// // if (config.use_env_variable) {
// //   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// // } else {
// //   sequelize = new Sequelize(
// //     config.database,
// //     config.username,
// //     config.password,
// //     config
// //   );
// // }

// /**Add the Database Models**/
// //Add models from database1 folder
// fs.readdirSync(__dirname + "/database1")
//   .filter(
//     (file) =>
//       file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
//   )
//   .forEach((file) => {
//     const model = db.Database1.import(
//       path.join(__dirname + "/database1", file)
//     );
//     db[model.name] = model;
//   });

// // Add models from database2 folder

// fs.readdirSync(__dirname + "/database2")
//   .filter(
//     (file) =>
//       file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
//   )
//   .forEach((file) => {
//     const model = db.Database2.import(
//       path.join(__dirname + "/database2", file)
//     );
//     db[model.name] = model;
//   });

// Object.keys(db).forEach((modelName) => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

// // db.sequelize = sequelize;
// // db.Sequelize = Sequelize;

// module.exports = db;
