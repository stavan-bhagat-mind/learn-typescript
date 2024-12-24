"use strict";

import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from ".";

interface BookAttributes {
  id: string;
  title: string;
  numberOfPages: number;
  user_id: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}
// Define the creation attributes (without the 'id' and timestamps)
interface BookCreationAttributes extends Optional<BookAttributes, "id"> {}
interface BookInstance
  extends Model<BookAttributes, BookCreationAttributes>,
    BookAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const Book = sequelize.define<BookInstance>(
  "Book",
  {
    id: {
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      type: DataTypes.UUID,
      unique: true,
    },
    title: {
      allowNull: false,
      type: DataTypes.TEXT,
    },
    numberOfPages: {
      allowNull: true,
      type: DataTypes.INTEGER,
    },
    user_id: {
      allowNull: false,
      type: DataTypes.UUID,
    },
  },
  {
    underscored: true,
    timestamps: true,
    paranoid: true,
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    modelName: "Book",
    tableName: "books",
  }
);

export default Book;
