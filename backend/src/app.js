import express from "express";
import cors from "cors";
const app = express();
 
app.use(cors());
app.use(express.json());

import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

export default app;