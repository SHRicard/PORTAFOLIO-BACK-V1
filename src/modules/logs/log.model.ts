import { Schema, model, type InferSchemaType } from "mongoose";
import { env } from "../../config/env.js";

/**
 * Registro de auditoría: un documento por cada petición a la API.
 * Lo escribe el middleware `registrarActividad` (log.middleware.ts); nadie más lo modifica.
 */
const logSchema = new Schema(
  {
    // Nombre legible de la acción ("usuario.login"). Si la ruta no declaró una: "MÉTODO /ruta"
    accion: { type: String, required: true },
    metodo: { type: String, required: true },
    ruta: { type: String, required: true }, // URL real, sin query string
    estado: { type: Number, required: true }, // código HTTP de la respuesta
    exito: { type: Boolean, required: true }, // estado < 400
    usuario: { type: Schema.Types.ObjectId, ref: "User" }, // solo si la petición venía con token válido
    // Valores del body que la ruta pidió guardar explícitamente (ej. el correo en login). Nunca contraseñas
    detalles: { type: Map, of: String, default: undefined },
    camposEnviados: { type: [String], default: undefined }, // solo los nombres, nunca los valores
    ip: { type: String },
    userAgent: { type: String },
    duracionMs: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // un log no se edita
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

// MongoDB borra solo los logs más viejos que LOG_RETENTION_DAYS
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: env.LOG_RETENTION_DAYS * 24 * 60 * 60 });

export type LogDoc = InferSchemaType<typeof logSchema>;
export const Log = model("Log", logSchema);

// Si LOG_RETENTION_DAYS cambió, MongoDB rechaza el índice nuevo y se queda con el viejo sin avisar:
// en ese caso se recrea el índice con el valor actual
Log.init().catch(async (err: { codeName?: string }) => {
  try {
    if (err?.codeName !== "IndexOptionsConflict") throw err;
    await Log.syncIndexes();
    console.log(`🗂️  Retención de logs actualizada a ${env.LOG_RETENTION_DAYS} días`);
  } catch (error) {
    console.error("⚠️  No se pudieron preparar los índices de los logs:", error);
  }
});
