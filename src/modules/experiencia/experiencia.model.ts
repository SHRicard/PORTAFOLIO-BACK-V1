import { Schema, model, type InferSchemaType } from "mongoose";
import { MODALIDADES } from "../perfil/perfil.model.js";

const texto = { type: String, required: true, trim: true } as const;

/**
 * Trabajo de la sección "Experiencia".
 * Para agregar un campo: sumalo acá y en experiencia.schema.ts.
 */
const experienciaSchema = new Schema(
  {
    empresa: texto,
    puesto: texto,
    desde: texto, // AAAA-MM
    hasta: { type: String, default: null }, // AAAA-MM · null = trabajo actual
    ubicacion: { type: String, trim: true, default: "" },
    modalidad: { type: String, enum: MODALIDADES, required: true },
    descripcion: { type: String, trim: true, default: "" },
    logros: { type: [String], default: [] },
    tecnologias: { type: [String], default: [] },
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

experienciaSchema.index({ publicado: 1, desde: -1 });

export type ExperienciaDoc = InferSchemaType<typeof experienciaSchema>;
export const Experiencia = model("Experiencia", experienciaSchema, "experiencia");
