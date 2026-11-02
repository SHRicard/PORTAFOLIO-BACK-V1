import { Schema, model, type InferSchemaType } from "mongoose";

export const TIPOS_ESTUDIO = ["carrera", "curso", "certificacion"] as const;

const texto = { type: String, required: true, trim: true } as const;

/**
 * Estudio de la sección "Formación".
 * Para agregar un campo: sumalo acá y en estudios.schema.ts.
 */
const estudioSchema = new Schema(
  {
    tipo: { type: String, enum: TIPOS_ESTUDIO, required: true },
    institucion: texto,
    titulo: texto,
    desde: texto, // AAAA-MM
    hasta: { type: String, default: null }, // AAAA-MM · null = en curso
    finalizado: { type: Boolean, default: false }, // false con fecha de fin = no se terminó
    descripcion: { type: String, trim: true, default: "" },
    urlVerificacion: { type: String, default: null },
    // url null = el certificado existe pero todavía no se subió (el público no lo ve)
    certificado: { type: new Schema({ url: { type: String, default: null } }, { _id: false }), default: null },
    publicado: { type: Boolean, default: true }, // false = oculto: solo se ve en el panel
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

estudioSchema.index({ publicado: 1, desde: -1 });

export type EstudioDoc = InferSchemaType<typeof estudioSchema>;
export const Estudio = model("Estudio", estudioSchema, "estudios");
