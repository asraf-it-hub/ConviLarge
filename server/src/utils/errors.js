export class AppError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
