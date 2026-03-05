export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({
    error: "SERVER_ERROR",
    message: err?.message || "Something went wrong",
  });
}