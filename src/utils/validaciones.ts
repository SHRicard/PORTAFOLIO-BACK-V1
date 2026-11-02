import mongoose from "mongoose";
import { z } from "zod";

/**
 * Validaciones de Zod que se repiten entre módulos (fechas, URLs, ids, paginación).
 * Si un formato cambia, se cambia acá y vale para todos los servicios.
 */

/** Mes en formato AAAA-MM (ej. "2024-07") */
export const FECHA_MES = /^\d{4}-(0[1-9]|1[0-2])$/;
export const fechaMes = z.string().regex(FECHA_MES, "Fecha inválida: usá el formato AAAA-MM");

/** URL pública: solo https */
export const urlHttps = z
  .string()
  .trim()
  .max(500, "La URL es demasiado larga")
  .refine((v) => v.startsWith("https://") && URL.canParse(v), "URL inválida: tiene que empezar con https://");

/** Texto obligatorio con largo máximo */
export const texto = (max: number) =>
  z.string().trim().min(1, "Este campo es obligatorio").max(max, `Máximo ${max} caracteres`);

/** Texto opcional (puede quedar vacío) con largo máximo */
export const textoOpcional = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);

/** Lista de textos (tecnologías, logros...) */
export const listaTextos = (maxItems: number, maxLargo: number) =>
  z.array(texto(maxLargo)).max(maxItems, `Máximo ${maxItems} elementos`);

/** "admin" no puede ser slug: GET /<recurso>/admin es la lista del panel */
export const SLUG_RESERVADO = "admin";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .trim()
  .max(80, "Máximo 80 caracteres")
  .regex(SLUG, "Slug inválido: solo minúsculas, números y guiones (ej. mi-proyecto)")
  .refine((v) => v !== SLUG_RESERVADO, `El slug "${SLUG_RESERVADO}" está reservado`);

export const slugParamSchema = z.object({ slug: z.string().trim().toLowerCase().max(80, "Máximo 80 caracteres") });

/** "Facturación FCT" -> "facturacion-fct" */
export const slugDesde = (titulo: string) =>
  titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");

/** id de MongoDB en la URL (/recurso/:id) */
export const idMongo = z.string().refine((v) => mongoose.isValidObjectId(v), "Id inválido");
export const idParamSchema = z.object({ id: idMongo });

/** page y limit de los listados (limit máximo: 100) */
export const paginacionSchema = (limitPorDefecto = 20) =>
  z.object({
    page: z.coerce
      .number({ error: "page tiene que ser un número" })
      .int("page tiene que ser un número entero")
      .min(1, "page tiene que ser 1 o más")
      .default(1),
    limit: z.coerce
      .number({ error: "limit tiene que ser un número" })
      .int("limit tiene que ser un número entero")
      .min(1, "limit tiene que ser 1 o más")
      .max(100, "limit no puede ser mayor a 100")
      .default(limitPorDefecto),
  });

/** Datos de paginación que acompañan a cada listado */
export const metaPaginacion = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  paginas: Math.ceil(total / limit),
});

/** "true" / "false" de la query string -> boolean */
export const booleanoQuery = z
  .enum(["true", "false"], { message: "Usá true o false" })
  .transform((v) => v === "true");

/** Para los PATCH: todos los campos opcionales, pero al menos uno */
export const conAlMenosUnCampo = <T extends z.ZodObject>(schema: T) =>
  schema.refine((data) => Object.keys(data).length > 0, "Enviá al menos un campo para actualizar");
