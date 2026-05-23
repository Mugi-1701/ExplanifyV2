const { Prisma } = require("@prisma/client");
const { AppError } = require("../utils/AppError");

const errorHandler = () => (err, req, res, next) => {
  let error = err;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      error = new AppError("Duplicate value violates unique constraint", 409, {
        target: err.meta?.target,
      });
    }
  }

  const statusCode = error.statusCode || error.status || 500;
  const payload = {
    message: error.message || "Unexpected error",
    requestId: req.requestId,
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== "production") {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = { errorHandler };
