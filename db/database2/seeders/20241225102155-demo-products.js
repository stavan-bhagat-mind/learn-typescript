"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Products",
      [
        {
          name: "Product A",
          price: 19.99,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Product B",
          price: 29.99,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Product C",
          price: 39.99,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Products", null, {});
  },
};
