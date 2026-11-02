import "dotenv/config";
import { z } from "zod";

/**
 * Todas las variables de entorno se validan acá, una sola vez, al arrancar.
 * Si falta algo o está mal, el servidor no inicia y te dice exactamente qué.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI es obligatoria"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET debe tener al menos 32 caracteres")
    .refine(
      (v) => !v.toLowerCase().startsWith("cambia-esto"),
      "JWT_SECRET sigue con el valor de ejemplo: generá uno propio (ver .env.example)",
    ),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  ALLOW_REGISTRATION: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
  // Único usuario que puede editar el portafolio (perfil, proyectos, experiencia, estudios y archivos)
  ADMIN_CORREO: z
    .string({ error: "ADMIN_CORREO es obligatoria: el correo de tu usuario administrador" })
    .trim()
    .toLowerCase()
    .email("ADMIN_CORREO tiene que ser un correo válido"),
  // Cloudinary (subida de imágenes y PDF). Si faltan, el servicio de archivos responde 503
  CLOUDINARY_CLOUD_NAME: z.string().trim().optional(),
  CLOUDINARY_API_KEY: z.string().trim().optional(),
  CLOUDINARY_API_SECRET: z.string().trim().optional(),
  CLOUDINARY_CARPETA: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/, "CLOUDINARY_CARPETA: solo minúsculas, números, guiones y /")
    .default("portafolio"),
  // Amazon S3 (subida de APK). Si faltan, subir o borrar un APK responde 503. Lo demás sigue funcionando
  AWS_S3_BUCKET: z.string().trim().optional(),
  AWS_S3_REGION: z.string().trim().optional(),
  AWS_ACCESS_KEY_ID: z.string().trim().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().trim().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  corsOrigins: parsed.data.CORS_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};
