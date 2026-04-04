import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

dotenv.config({ path: envPath, override: true });

import app from "./app.js";
import { sequelize } from "./db/index.js";

// Import models to register associations before sync
import "./models/index.js";

const PORT = process.env.PORT || 5000;

// Sync database and start server
sequelize
  .authenticate()
  .then(() => {
    console.log("PostgreSQL Connected");
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });
