import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";

const WorkerProfile = sequelize.define(
  "WorkerProfile",
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
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
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM("full-time", "part-time"),
      allowNull: true,
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    zone: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pincode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    workingArea: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    workingHoursPerDay: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    avgDailyEarning: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    riskScore: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    isProtected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    activePlan: {
      type: DataTypes.ENUM("basic", "pro"),
      allowNull: true,
      defaultValue: "basic",
    },
    coveragePerDay: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    deviceFingerprint: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    lastLocation: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    tableName: "worker_profiles",
    underscored: false,
  },
);

export default WorkerProfile;
