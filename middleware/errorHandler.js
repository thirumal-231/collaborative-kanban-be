import { AppError } from "../Utils/AppError.js";

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

const sendErrorDev = (err, res) => {
  const cleanError = normalizeError(err);
  res.status(cleanError.statusCode).json({
    status: cleanError.status || "error",
    // error: cleanError,
    message: cleanError.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // operational, means anticipated errors
  const cleanError = normalizeError(err);
  if (cleanError.isOperational) {
    res.status(cleanError.statusCode).json({
      status: cleanError.status,
      message: cleanError.message,
    });
  }
  // programming or other unknown error
  else {
    console.log(`ERROR 💥 `, err);
    res.status(500).json({
      status: "error",
      message: "Something went very wrong.",
    });
  }
};

const handleDBError = (err) => {
  const code = err?.cause?.code;
  switch (code) {
    case "22P02":
      return new AppError("Invalid ID format", 400);
    case "23505":
      return new AppError("Duplicate field value", 409);
    case "23503":
      return new AppError("Invalid reference ID", 400);
    default:
      return err;
  }
};

const handleJWTError = (err) => {
  if (err.name === "JsonWebTokenError") {
    return new AppError("Invalid token. Please login again.", 401);
  }
  if (err.name === "TokenExpiredError") {
    return new AppError("Your token has expired. Please login again.", 401);
  }
  return err;
};

const handleValidationError = (err) => {
  if (err.name === "ZodError") {
    return new AppError(err.errors[0].message, 400);
  }
  return err;
};

const normalizeError = (err) => {
  let error = err;
  error = handleDBError(error);
  error = handleJWTError(error);
  error = handleValidationError(error);
  return error;
};
