/**
 * Error "esperado" de la app (credenciales malas, no encontrado, etc.).
 * Lo lanzás con throw y el errorHandler lo convierte en una respuesta JSON.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message = "Solicitud inválida", details?: unknown) {
    return new AppError(400, message, details);
  }
  static unauthorized(message = "No autorizado") {
    return new AppError(401, message);
  }
  static forbidden(message = "Acceso denegado") {
    return new AppError(403, message);
  }
  static notFound(message = "No encontrado") {
    return new AppError(404, message);
  }
  static conflict(message = "Conflicto") {
    return new AppError(409, message);
  }
}
