import express from "express";
import * as authMiddleWare from "../middleware/authMiddleware.js";
import * as boardController from "../controllers/boardController.js";
import * as listController from "../controllers/listController.js";
export const boardRouter = express.Router();

boardRouter.use(authMiddleWare.protect);

boardRouter
  .route("/")
  .get(boardController.getBoards)
  .post(boardController.createBoard);

boardRouter.post("/:boardId/invite", boardController.inviteMember);

boardRouter
  .route("/:boardId/lists")
  .get(listController.getLists)
  .post(listController.createList);

boardRouter.get("/:boardId/full", boardController.getFullBoard);
