import express from "express";
import {
	firebaseLoginController,
	profileController,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/firebase-login", firebaseLoginController);
router.get("/profile", requireAuth, profileController);

export default router;
