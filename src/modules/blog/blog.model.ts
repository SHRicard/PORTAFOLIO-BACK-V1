import { Schema, model, type InferSchemaType } from "mongoose";

// borrador: sin terminar, solo se ve en el panel · publicado: lo ve todo el mundo
export const ESTADOS_ENTRADA = ["borrador", "publicado"] as const;

const sinId = { _id: false } as const;
const texto = { type: String, required: true, trim: true } as const;
// url null = todavía no se subió (el público no lo ve)
const urlPendiente = { type: String, default: null } as const;

const imagenSchema = new Schema({ url: urlPendiente, alt: texto }, sinId);
const documentoSchema = new Schema({ url: urlPendiente, titulo: texto }, sinId);

/**
 * Entrada del blog.
 * Para agregar un campo: sumalo acá y en blog.schema.ts.
 */
const entradaSchema = new Schema(
  {
    titulo: texto,
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    resumen: texto,
    contenido: texto, // párrafos separados por una línea en blanco. Es texto: nunca HTML
    portada: { type: imagenSchema, default: null },
    galeria: { type: [imagenSchema], default: [] },
    documentos: { type: [documentoSchema], default: [] },
    etiquetas: { type: [String], default: [] },
    estado: { type: String, enum: ESTADOS_ENTRADA, default: "borrador" },
    publicadoEn: { type: Date, default: null }, // lo pone el backend la primera vez que se publica
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

entradaSchema.index({ estado: 1, publicadoEn: -1 });

export type EntradaDoc = InferSchemaType<typeof entradaSchema>;
export const Entrada = model("Entrada", entradaSchema, "blog");
