import User from "./user.model.js";
import WorkerProfile from "./workerProfile.model.js";

// Define associations
User.hasOne(WorkerProfile, {
  foreignKey: "userId",
  as: "workerProfile",
});

WorkerProfile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

export { User, WorkerProfile };
