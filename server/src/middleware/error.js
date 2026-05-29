export function notFound(_req, res) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(error, _req, res, _next) {
  if (error.name === "ZodError") {
    return res.status(422).json({
      message: "Please check the form fields",
      details: error.errors
    });
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File is larger than the configured upload limit" });
  }

  const status = error.status || 500;
  const message = status === 500 ? "Something went wrong while processing your request" : error.message;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({
    message,
    details: error.details || undefined
  });
}
