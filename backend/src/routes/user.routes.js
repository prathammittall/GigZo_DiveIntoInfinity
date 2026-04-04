import express from "express";
const router = express.Router();

import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

router.get("/me", requireAuth, getMyProfile);
router.put("/me", requireAuth, updateMyProfile);

export default router;
