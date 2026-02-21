import { Router } from "express";
import { create, getAll } from "../controllers/decision.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post('/', requireAuth, create);
router.get('/', requireAuth, getAll);
export default router;