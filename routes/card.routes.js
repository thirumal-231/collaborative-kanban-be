import express from "express";
import * as authMiddleWare from "../middleware/authMiddleware.js";
import * as cardController from "../controllers/cardController.js";
export const cardRouter = express.Router();

cardRouter.use(authMiddleWare.protect);

cardRouter.delete("/:cardId", cardController.deleteCard);
