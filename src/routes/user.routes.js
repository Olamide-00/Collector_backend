import { Router } from "express";
import { restrictTo } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { ROLES } from "../constants/roles.js";
import { assignLogin, getLogin } from "../controllers/user.controller.js";
import { assignLoginSchema } from "../validations/user.validation.js";

const router = Router({ mergeParams: true });

router.get("/", restrictTo(ROLES.ADMIN), getLogin);
router.post(
  "/",
  restrictTo(ROLES.ADMIN),
  validate(assignLoginSchema),
  assignLogin
);

export default router;
