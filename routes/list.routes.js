import express from "express";
import * as authMiddleWare from "../middleware/authMiddleware.js";
import * as listController from "../controllers/listController.js";
export const listRouter = express.Router();

listRouter.use(authMiddleWare.protect);

listRouter.delete("/:listId", listController.deleteList);
