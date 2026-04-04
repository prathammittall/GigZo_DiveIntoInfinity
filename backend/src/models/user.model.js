import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firebaseUid: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: true,
    },
    phone: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    passwordHash: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    age: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "users",
    underscored: false,
  },
);

export default User;
