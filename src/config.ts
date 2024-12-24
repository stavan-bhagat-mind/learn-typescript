const config = {
  development: {
    username: "postgres",
    password: "mind",
    database: "demo",
    host: "192.168.1.194",
    dialect: "postgres",
  },
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

module.exports = config;
