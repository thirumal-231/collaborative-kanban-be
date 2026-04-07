import express from "express";

import * as authController from "../controllers/authController.js";

export const authRouter = express.Router();

authRouter.post("/signup", authController.signUp);
authRouter.post("/login", authController.login);
