/**
 * Error de aplicación controlado. Permite lanzar errores con un código
 * HTTP asociado y un mensaje amigable, distinguiéndolos de errores
 * inesperados del sistema.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado.`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado.') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción.') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe.') {
    super(message, 409);
  }
}
