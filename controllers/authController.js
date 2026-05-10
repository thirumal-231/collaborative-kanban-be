//#region IMPORTS
import "dotenv/config.js";
import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { users } from "../models/schema.js";
import { AppError } from "../Utils/AppError.js";
import { catchAsync } from "../Utils/catchAsync.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { date } from "drizzle-orm/mysql-core";
//#endregion

export const signUp = catchAsync(async (req, res, next) => {
  // 1. get name, email, password from body
  const { name, email, password } = req.body;

  // 2. validate if all exists
  if (!name || !email || !password)
    return next(new AppError("Name, Email or Password is missing!", 400));

  // 3. validate if email is unique
  const [foundUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (foundUser)
    return next(new AppError("User already exists, Please login.", 409));

  // 4. hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 5. create the user
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
    })
    .returning();

  // 6. send response
  res.status(201).json({
    status: "success",
    message: "signup successful.",
    data: newUser.id,
  });
});

export const login = catchAsync(async (req, res, next) => {
  // 1. deconstruct email and password
  const { email, password } = req.body;

  // 2. throw error if any one is missing
  if (!email || !password)
    return next(new AppError("Please provide all the required fields.", 400));

  // 3. check if user exists
  const [foundUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // 4. check if password is correct
  if (!foundUser || !(await bcrypt.compare(password, foundUser.password)))
    return next(new AppError("Incorrect email or password.", 401));

  // 5. sign a token with payload
  const payload = {
    id: foundUser.id,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "21d" });

  const cookieOptions = {
    expires: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };

  res.cookie("jwt", token, cookieOptions);
  foundUser.password = undefined;

  // 6. send response
  res.status(200).json({
    status: "success",
    message: "login successful.",
    token,
    data: foundUser,
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;
  next();
});

export const getUser = catchAsync(async (req, res, next) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.params.id));

  if (!user) return next(new AppError("User not found", 404));

  res.status(200).json({
    status: "success",
    data: user.id,
  });
});
