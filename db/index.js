"use strict";
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require("../config/config");

const db = {};
const env = process.env.NODE_ENV || "development";

// Create Sequelize instances for each database
const databases = ["development_db1", "development_db2"]; // Explicitly list the databases

databases.forEach((database) => {
  const dbConfig = config[database]; // Access the configuration directly
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
    database === "development_db1"
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

// const fs = require("fs");
// const path = require("path");
// const Sequelize = require("sequelize");
// const config = require("../config/config");

// const db = {};
// const env = process.env.NODE_ENV || "development";
// const databases = Object.keys(config[env].databases);

// // Create Sequelize instances for each database
// databases.forEach((database) => {
//   const dbConfig = config[env].databases[database];
//   const sequelize = new Sequelize(
//     dbConfig.database,
//     dbConfig.username,
//     dbConfig.password,
//     {
//       host: dbConfig.host,
//       port: dbConfig.port,
//       dialect: dbConfig.dialect,
//       logging: console.log,
//       pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000,
//       },
//     }
//   );

//   db[database] = {
//     sequelize,
//     Sequelize,
//     models: {},
//   };

//   // Test the connection
//   sequelize
//     .authenticate()
//     .then(() => {
//       console.log(
//         `Connection to ${database} has been established successfully.`
//       );
//     })
//     .catch((error) => {
//       console.error(`Unable to connect to the database ${database}:`, error);
//     });

//   // Load models for this database
//   const modelsDir =
//     database === "Database1"
//       ? path.join(__dirname, "./database1/models")
//       : path.join(__dirname, "./database2/models");

//   fs.readdirSync(modelsDir)
//     .filter((file) => file.indexOf(".") !== 0 && file.slice(-3) === ".js")
//     .forEach((file) => {
//       const model = require(path.join(modelsDir, file))(sequelize, Sequelize);
//       db[database].models[model.name] = model;
//     });
// });

// // Run associations if they exist
// Object.keys(db).forEach((database) => {
//   if (db[database].models) {
//     Object.values(db[database].models).forEach((model) => {
//       if (model.associate) {
//         model.associate(db[database].models);
//       }
//     });
//   }
// });

// module.exports = db;
