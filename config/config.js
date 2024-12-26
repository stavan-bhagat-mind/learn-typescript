"use strict";
require("dotenv").config();

module.exports = {
  development_db1: {
    username: process.env.RDS_USERNAME1,
    password: process.env.RDS_PASSWORD1,
    database: process.env.RDS_DATABASE1,
    host: process.env.RDS_HOSTNAME1,
    port: process.env.RDS_PORT1,
    dialect: "postgres",
  },
  development_db2: {
    username: process.env.RDS_USERNAME2,
    password: process.env.RDS_PASSWORD2,
    database: process.env.RDS_DATABASE2,
    host: process.env.RDS_HOSTNAME2,
    port: process.env.RDS_PORT2,
    dialect: "postgres",
  },
  // development: {
  //   databases: {
  //     Database1: {
  //       database: process.env.RDS_DATABASE1,
  //       username: process.env.RDS_USERNAME1,
  //       password: process.env.RDS_PASSWORD1,
  //       host: process.env.RDS_HOSTNAME1,
  //       port: process.env.RDS_PORT1,
  //       dialect: "postgres",
  //     },
  //     Database2: {
  //       database: process.env.RDS_DATABASE2,
  //       username: process.env.RDS_USERNAME2,
  //       password: process.env.RDS_PASSWORD2,
  //       host: process.env.RDS_HOSTNAME2,
  //       port: process.env.RDS_PORT2,
  //       dialect: "postgres",
  //     },
  //   },
  // },
  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: "root",
    password: null,
    database: "database_production",
    host: "127.0.0.1",
    dialect: "mysql",
  },
};
