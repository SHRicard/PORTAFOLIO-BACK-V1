import type { RequestHandler } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** id del usuario autenticado (lo completa el middleware `authenticate`) */
      userId?: string;
    }
  }
}

/**
 * Protege una ruta: exige el header  Authorization: Bearer <token>
 * Uso:  router.get("/privada", authenticate, controller)
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw AppError.unauthorized("Falta el token de autenticación");
  }

  try {
    req.userId = verifyToken(header.slice(7)).sub;
    next();
  } catch {
    throw AppError.unauthorized("Token inválido o expirado");
  }
};
