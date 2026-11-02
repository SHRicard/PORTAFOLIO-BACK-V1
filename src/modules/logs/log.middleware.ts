import type { RequestHandler } from "express";
import { logService } from "./log.service.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      /** Lo completa `auditar(...)` en cada ruta y lo lee `registrarActividad` al terminar */
      auditoria?: { accion: string; guardar: readonly string[] };
    }
  }
}

// Límites para que nadie llene la base mandando textos o bodies gigantes
const MAX_TEXTO = 300;
const MAX_CAMPOS = 20;

const recortar = (texto: string) => texto.slice(0, MAX_TEXTO);

/**
 * Le pone nombre a la acción de una ruta. Va PRIMERO en la ruta (antes de authenticate,
 * validateBody o el límite de intentos) para que también quede nombrada si la petición falla.
 *
 *   router.post("/login", auditar("usuario.login", { guardar: ["correo"] }), ...)
 *
 * `guardar`: campos del body cuyo VALOR se guarda en el log (solo textos). Nunca poner contraseñas.
 */
export const auditar =
  (accion: string, opciones: { guardar?: readonly string[] } = {}): RequestHandler =>
  (_req, res, next) => {
    res.locals.auditoria = { accion, guardar: opciones.guardar ?? [] };
    next();
  };

/**
 * Registra en la colección `logs` cada petición que pasa por acá, cuando termina la respuesta
 * (no la demora). Se monta una sola vez en src/routes/index.ts.
 */
export const registrarActividad: RequestHandler = (req, res, next) => {
  const inicio = performance.now();

  res.on("finish", () => {
    const ruta = recortar(req.originalUrl.split("?")[0]);
    const { accion, guardar } = res.locals.auditoria ?? { accion: `${req.method} ${ruta}`, guardar: [] };

    // req.body puede no estar validado (si la petición falló antes): se filtra todo
    const body: Record<string, unknown> =
      req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};

    const detalles: Record<string, string> = {};
    for (const campo of guardar) {
      const valor = body[campo];
      if (typeof valor === "string") detalles[campo] = recortar(valor);
    }

    const camposEnviados = Object.keys(body).slice(0, MAX_CAMPOS).map(recortar);
    const userAgent = req.get("user-agent");

    void logService.registrar({
      accion,
      metodo: req.method,
      ruta,
      estado: res.statusCode,
      exito: res.statusCode < 400,
      usuario: req.userId,
      detalles: Object.keys(detalles).length > 0 ? detalles : undefined,
      camposEnviados: camposEnviados.length > 0 ? camposEnviados : undefined,
      ip: req.ip,
      userAgent: userAgent ? recortar(userAgent) : undefined,
      duracionMs: Math.round(performance.now() - inicio),
    });
  });

  next();
};
