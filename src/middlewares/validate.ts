import type { RequestHandler } from "express";
import type { ZodType } from "zod";

/**
 * Valida (y limpia) el body de la request con un esquema de Zod.
 * Uso:  router.post("/ruta", validateBody(miSchema), controller)
 */
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body); // si falla, lo atrapa el errorHandler
    next();
  };
