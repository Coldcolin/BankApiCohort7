export class ApiError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function badRequest(message, code) {
  return new ApiError(400, message, code);
}

export function unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
  return new ApiError(401, message, code);
}

export function forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
  return new ApiError(403, message, code);
}

export function notFound(message = 'Not found', code = 'NOT_FOUND') {
  return new ApiError(404, message, code);
}

export function conflict(message, code) {
  return new ApiError(409, message, code);
}
