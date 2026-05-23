const { ZodError } = require("zod");
const { AppError } = require("../utils/AppError");

const formatZodError = (error) =>
  error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

const validate = (schema, location = "body") => (req, res, next) => {
  try {
    const result = schema.parse(req[location]);
    req[location] = result;
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new AppError("Validation failed", 400, { issues: formatZodError(error) }));
    }
    return next(error);
  }
};

module.exports = { validate };
