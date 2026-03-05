export function notFoundApi(req, res) {
  return res.status(404).json({
    error: "NOT_FOUND",
    message: `No route: ${req.method} ${req.originalUrl}`,
  });
}