// Validates request parts against the provided Zod schemas and replaces the
// request values with the parsed (coerced) output. ZodErrors are forwarded to
// the central error handler.
export const validate = (schemas = {}) => (req, res, next) => {
  try {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.query = schemas.query.parse(req.query);
    if (schemas.body) req.body = schemas.body.parse(req.body);
    return next();
  } catch (err) {
    return next(err);
  }
};
