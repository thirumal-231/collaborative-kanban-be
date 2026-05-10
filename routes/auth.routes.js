import express from "express";

import * as authController from "../controllers/authController.js";
import * as authMiddleWare from "../middleware/authMiddleware.js";

export const authRouter = express.Router();

authRouter.post("/signup", authController.signUp);
authRouter.post("/login", authController.login);

authRouter.use(authMiddleWare.protect);

authRouter.get("/me", authController.getMe, authController.getUser);
