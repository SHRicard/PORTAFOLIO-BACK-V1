import { z } from "zod";
import { REGLAS_ARCHIVO, TIPOS_ARCHIVO } from "./archivos.model.js";
import { paginacionSchema, texto, urlHttps } from "../../utils/validaciones.js";

const tipo = z.enum(TIPOS_ARCHIVO, { message: `Valor inválido. Opciones: ${TIPOS_ARCHIVO.join(", ")}` });

/** POST /firma: qué se va a subir y en qué subcarpeta (opcional). `nombre` solo se usa en los APK */
export const firmarSubidaSchema = z.object({
  tipo,
  nombre: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
  carpeta: z
    .string()
    .trim()
    .toLowerCase()
    .max(100, "Máximo 100 caracteres")
    .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/, "Carpeta inválida: solo minúsculas, números, guiones y / (ej. proyectos/rest911)")
    .optional(),
});

/** POST /: los datos que devolvió Cloudinary después de subir */
export const registrarArchivoSchema = z
  .object({
    publicId: texto(300),
    url: urlHttps,
    tipo,
    formato: z.string().trim().toLowerCase().min(1, "Este campo es obligatorio").max(10, "Máximo 10 caracteres"),
    bytes: z
      .number({ error: "bytes tiene que ser un número" })
      .int("bytes tiene que ser un número entero")
      .min(1, "bytes tiene que ser 1 o más"),
    ancho: z
      .number({ error: "ancho tiene que ser un número" })
      .int("ancho tiene que ser un número entero")
      .positive("ancho tiene que ser mayor que 0")
      .nullable()
      .optional(),
    alto: z
      .number({ error: "alto tiene que ser un número" })
      .int("alto tiene que ser un número entero")
      .positive("alto tiene que ser mayor que 0")
      .nullable()
      .optional(),
    nombreOriginal: z.string().trim().max(200, "Máximo 200 caracteres").nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const reglas = REGLAS_ARCHIVO[data.tipo];
    if (!(reglas.formatos as readonly string[]).includes(data.formato)) {
      ctx.addIssue({
        code: "custom",
        path: ["formato"],
        message: `Formato no permitido para ${data.tipo}: usá ${reglas.formatos.join(", ")}`,
      });
    }
    if (data.bytes > reglas.maxBytes) {
      ctx.addIssue({
        code: "custom",
        path: ["bytes"],
        message: `El archivo supera el máximo de ${reglas.maxBytes / (1024 * 1024)} MB para ${data.tipo}`,
      });
    }
  });

export const listarArchivosQuerySchema = paginacionSchema(30).extend({ tipo: tipo.optional() });

export type FirmarSubidaInput = z.infer<typeof firmarSubidaSchema>;
export type RegistrarArchivoInput = z.infer<typeof registrarArchivoSchema>;
export type ListarArchivosQuery = z.infer<typeof listarArchivosQuerySchema>;
