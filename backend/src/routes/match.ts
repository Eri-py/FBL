import { Router } from "express";
import * as matchController from "../controllers/matchController";

const router = Router();

router.get("/", matchController.getAllMatches);
router.post("/", matchController.createMatch);
router.get("/:id", matchController.getMatch);

export default router;
