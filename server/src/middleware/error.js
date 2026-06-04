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
  const rawMessage = error.message || "";
  const lowerMessage = rawMessage.toLowerCase();
  let message = status === 500 ? "Something went wrong while processing your request" : rawMessage;

  if (lowerMessage.includes("incorrect") || lowerMessage.includes("not password protected") || lowerMessage.includes("confirmation")) {
    message = rawMessage;
  } else if (lowerMessage.includes("encrypted") || lowerMessage.includes("decrypt")) {
    message = "This PDF appears to be encrypted. Unlock it first, then try again.";
  } else if (lowerMessage.includes("no pdf header") || lowerMessage.includes("invalid pdf")) {
    message = "This file does not look like a valid PDF. Please upload a different PDF.";
  } else if (lowerMessage.includes("page range")) {
    message = rawMessage;
  }

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({
    message,
    details: error.details || undefined
  });
}
