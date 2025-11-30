import { Router } from "express";
import * as teamController from "../controllers/teamController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All team routes require authentication
router.get("/players", teamController.getAllPlayers);
router.get("/me", authenticateToken, teamController.getMyTeam);
router.post("/", authenticateToken, teamController.saveTeam);

export default router;
