import { AppError } from "../Utils/AppError.js";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { catchAsync } from "../Utils/catchAsync.js";
import { db } from "../db/db.js";
import { users } from "../models/schema.js";
import { eq } from "drizzle-orm";

export const protect = catchAsync(async (req, res, next) => {
  // 1. check headers
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.toLowerCase().startsWith("bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token)
    return next(new AppError("You are not authorized, Login again.", 401));

  // 3. verify token
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );

  // 4. check if user exists
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, decodedPayload.id))
    .limit(1);
  if (!currentUser) return next(new AppError("No user found.", 401));

  // 5. pass the user in req
  req.user = currentUser;
  next();
});
