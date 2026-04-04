import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firebaseUid: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      index: true,
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      index: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    platform: {
      type: DataTypes.ENUM("Zomato", "Swiggy", "Zepto", "Blinkit", "Amazon"),
      allowNull: true,
    },
    workerId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM("full-time", "part-time"),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    workingArea: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    workingHoursPerDay: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    avgDailyEarning: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    zone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    coveragePerDay: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    activePlan: {
      type: DataTypes.ENUM("basic", "pro"),
      allowNull: true,
      defaultValue: "basic",
    },
    isProtected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    tableName: "users",
  },
);

export default User;
