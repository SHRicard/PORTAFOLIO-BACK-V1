import type { ErrorRequestHandler, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

/** Ruta que no existe -> 404 en JSON */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

/** Responde con el formato de siempre y deja el motivo para la línea de la consola */
function responderError(res: Response, estado: number, cuerpo: { message: string; details?: unknown; stack?: string }) {
  res.locals.errorConsola = { message: cuerpo.message, details: cuerpo.details };
  res.status(estado).json({ ok: false, ...cuerpo });
}

/** Manejo centralizado de errores: toda respuesta de error sale con el mismo formato */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    responderError(res, err.statusCode, { message: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    responderError(res, 400, {
      message: "Datos inválidos",
      details: err.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })),
    });
    return;
  }

  // Duplicados de MongoDB (índice unique)
  if (err?.code === 11000) {
    const campo = Object.keys(err.keyPattern ?? {})[0] ?? "campo";
    responderError(res, 409, { message: `Ya existe un registro con ese ${campo}` });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    responderError(res, 400, { message: "Datos inválidos", details: err.message });
    return;
  }

  // JSON mal formado en el body
  if (err?.type === "entity.parse.failed") {
    responderError(res, 400, { message: "JSON mal formado" });
    return;
  }

  console.error("💥 Error no controlado:", err);
  responderError(res, 500, {
    message: "Error interno del servidor",
    ...(env.isProduction ? {} : { stack: err?.stack }),
  });
};
