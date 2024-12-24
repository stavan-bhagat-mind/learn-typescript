module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define("Product", {
    name: DataTypes.STRING,
    price: DataTypes.DECIMAL,
  });

  return Product;
};
