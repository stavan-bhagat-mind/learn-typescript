"use strict";

import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from ".";

interface UserAttributes {
  id: number;
  name: string;
  password: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}
// Define the creation attributes (without the 'id' and timestamps)
interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}
interface UserInstance
  extends Model<UserAttributes, UserCreationAttributes>,
    UserAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const User = sequelize.define<UserInstance>(
  "user",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    name: {
      allowNull: true,
      type: DataTypes.TEXT,
    },
    password: {
      allowNull: false,
      type: DataTypes.TEXT,
    },
    email: {
      allowNull: true,
      type: DataTypes.TEXT,
    },
  },
  {
    underscored: true,
    timestamps: true,
    paranoid: true,
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    modelName: "User",
    tableName: "users",
  }
);

export default User;
