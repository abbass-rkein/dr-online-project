export function notFound(_req, res) {
  res.status(404).json({ ok: false, error: "Route not found" });
}

export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const code = err.statusCode || 500;
  res.status(code).json({
    ok: false,
    error: err.publicMessage || "Server error",
  });
}
