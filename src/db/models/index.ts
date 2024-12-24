import { Sequelize } from "sequelize";

const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../../config.js")[env];

const sequelize = config.url
  ? new Sequelize(config.url, config)
  : new Sequelize(config.database, config.username, config.password, config);

export { Sequelize, sequelize };

// src/db/models/index.ts
// import { Sequelize } from 'sequelize-typescript';
// import config from '../../config/database';

// const env = process.env.NODE_ENV || 'development';
// const dbConfig = config[env];

// const sequelize = new Sequelize({
//   database: dbConfig.database,
//   dialect: dbConfig.dialect,
//   username: dbConfig.username,
//   password: dbConfig.password,
//   host: dbConfig.host,
//   models: [__dirname + '/**/*.model.ts'],
// });

// export default sequelize;