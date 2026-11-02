import type { RequestHandler } from "express";
import { User } from "./user.model.js";
import { AppError } from "../../utils/AppError.js";
import { env } from "../../config/env.js";

/**
 * Deja pasar solo al administrador del portafolio: el usuario cuyo correo es ADMIN_CORREO.
 * Va DESPUÉS de authenticate:
 *
 *   router.post("/", auditar("proyectos.crear"), authenticate, soloAdmin, validateBody(...), crear)
 *
 * Así, aunque el registro quede abierto, ningún otro usuario puede editar el portafolio.
 */
export const soloAdmin: RequestHandler = async (req, _res, next) => {
  const usuario = await User.findById(req.userId).select("correo").lean();
  if (usuario?.correo !== env.ADMIN_CORREO) throw AppError.forbidden("Solo el administrador puede hacer esto");
  next();
};
