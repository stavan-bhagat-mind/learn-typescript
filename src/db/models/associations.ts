import Book from "./book";
import User from "./user";

User.hasMany(Book, {
  foreignKey: "user_id",
  as: "userBooks",
});

Book.belongsTo(User, {
  foreignKey: "user_id",
  as: "userBooks",
});
