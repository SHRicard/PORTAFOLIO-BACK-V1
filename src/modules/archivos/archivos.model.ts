import { Schema, model, type InferSchemaType } from "mongoose";

export const TIPOS_ARCHIVO = ["imagen", "documento", "apk"] as const;
export type TipoArchivo = (typeof TIPOS_ARCHIVO)[number];

const MB = 1024 * 1024;

/**
 * Formatos y tamaño máximo por tipo. Nunca SVG ni HTML (pueden ejecutar código en el navegador).
 * Los PDF se suben como "image": el plan gratuito de Cloudinary no acepta más de 10 MB por archivo.
 * Los APK van a S3: Cloudinary rechaza esa extensión.
 */
export const REGLAS_ARCHIVO = {
  imagen: { formatos: ["jpg", "png", "webp"], maxBytes: 5 * MB },
  documento: { formatos: ["pdf"], maxBytes: 10 * MB },
  apk: { formatos: ["apk"], maxBytes: 200 * MB },
} as const satisfies Record<TipoArchivo, { formatos: readonly string[]; maxBytes: number }>;

/**
 * Registro de un archivo ya subido a Cloudinary (la "biblioteca" del panel).
 * El archivo en sí vive en Cloudinary; acá se guarda su URL y sus datos.
 */
const archivoSchema = new Schema(
  {
    publicId: { type: String, required: true, unique: true, trim: true }, // id en Cloudinary, o key en S3 si es un APK
    url: { type: String, required: true },
    tipo: { type: String, enum: TIPOS_ARCHIVO, required: true },
    formato: { type: String, required: true, lowercase: true, trim: true },
    bytes: { type: Number, required: true, min: 1 },
    ancho: { type: Number, default: null }, // en px (en los PDF, el tamaño de la página)
    alto: { type: Number, default: null },
    nombreOriginal: { type: String, trim: true, default: null },
  },
  {
    timestamps: true,
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

archivoSchema.index({ tipo: 1, createdAt: -1 });

export type ArchivoDoc = InferSchemaType<typeof archivoSchema>;
export const Archivo = model("Archivo", archivoSchema, "archivos");
