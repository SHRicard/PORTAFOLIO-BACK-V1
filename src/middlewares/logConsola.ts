import type { RequestHandler } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      /** Lo completa el errorHandler y lo lee logConsola para mostrar el motivo */
      errorConsola?: { message: string; details?: unknown };
    }
  }
}

const MAX_MOTIVO = 300;

const icono = (estado: number) => (estado >= 500 ? "💥" : estado >= 400 ? "❌" : "✅");

/** El mensaje con sus campos. Los `details` de las validaciones son textos fijos: nunca traen lo que mandó el usuario */
function motivo({ message, details }: NonNullable<Express.Locals["errorConsola"]>) {
  const campos = Array.isArray(details)
    ? details.map((d: { campo: string; mensaje: string }) => `${d.campo}: ${d.mensaje}`).join(" · ")
    : "";
  return (campos ? `${message} (${campos})` : message).slice(0, MAX_MOTIVO);
}

/**
 * Muestra en la consola una línea por cada petición, cuando termina:
 *
 *   12:31:05 ✅ 200 GET /api/proyectos · proyectos.listar · 12ms
 *   12:31:08 ❌ 400 POST /api/proyectos · proyectos.crear · 3ms · Datos inválidos (titulo: Este campo es obligatorio)
 *
 * Va antes que express.json en app.ts: así también se ve lo que falla antes de llegar a las rutas.
 * Nunca muestra el body ni la query string, para que no aparezcan contraseñas ni tokens.
 */
export const logConsola: RequestHandler = (req, res, next) => {
  const ruta = req.originalUrl.split("?")[0];
  // Igual que en la auditoría: los monitores del hosting lo llaman todo el tiempo
  if (ruta === "/api/health") {
    next();
    return;
  }

  const inicio = performance.now();

  res.on("finish", () => {
    const estado = res.statusCode;
    const { auditoria, errorConsola } = res.locals;
    const partes = [
      `${req.method} ${ruta}`,
      auditoria?.accion,
      `${Math.round(performance.now() - inicio)}ms`,
      errorConsola && motivo(errorConsola),
    ].filter(Boolean);

    const linea = `${new Date().toTimeString().slice(0, 8)} ${icono(estado)} ${estado} ${partes.join(" · ")}`;
    if (estado >= 400) console.error(linea);
    else console.log(linea);
  });

  next();
};
