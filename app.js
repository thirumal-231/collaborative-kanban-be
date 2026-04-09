import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import { globalErrorHandler } from "./middleware/errorhandler.js";
import { AppError } from "./Utils/AppError.js";
import { boardRouter } from "./routes/board.routes.js";
import { listRouter } from "./routes/list.routes.js";
export const app = express();

app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/boards", boardRouter);
app.use("/api/lists", listRouter);

app.use("/{*splat}", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

app.use(globalErrorHandler);
