import express from "express";
import * as authMiddleWare from "../middleware/authMiddleware.js";
import * as boardController from "../controllers/boardController.js";
export const boardRouter = express.Router();

boardRouter.use(authMiddleWare.protect);

boardRouter
  .route("/")
  .get(boardController.getBoards)
  .post(boardController.createBoard);
