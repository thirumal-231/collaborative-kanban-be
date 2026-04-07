import "dotenv/config.js";
import { app } from "./app.js";
import { catchAsync } from "./Utils/catchAsync.js";
import { AppError } from "./Utils/AppError.js";

app.get(
  "/",
  catchAsync(async (req, res, next) => {
    return next(new AppError("Route not found.", 200));
  }),
);

const PORT = process.env.PORT || 8000;
app.listen(8000, () => console.log("Listening on ", PORT));
