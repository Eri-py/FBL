import { Router } from "express";
import * as authController from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/refresh-token", authController.refreshToken);
router.get("/me", authenticateToken, authController.getMe);
router.post("/logout", authController.logout);

export default router;
