import { Schema, model, type InferSchemaType } from "mongoose";
import { COLOR_HEX, mapearPreferencias, type CampoPreferencia } from "./preferences.options.js";

export const SEXOS = ["masculino", "femenino", "otro", "prefiero_no_decir"] as const;

/** Traduce un campo de preferences.options.ts a su definición de Mongoose */
const campoMongoose = (def: CampoPreferencia) =>
  def.tipo === "color"
    ? { type: String, match: COLOR_HEX, lowercase: true, default: def.porDefecto }
    : { type: typeof def.porDefecto === "number" ? Number : String, enum: def.valores, default: def.porDefecto };

/**
 * Preferencias visuales del front. Se arman solas desde preferences.options.ts:
 * un subesquema por grupo, sin _id y con valores por defecto en cada nivel.
 * Los defaults se aplican también al leer usuarios viejos que no tienen el campo guardado.
 */
const preferenciasSchema = new Schema(
  mapearPreferencias(campoMongoose, (campos) => ({
    type: new Schema(campos, { _id: false }),
    default: () => ({}),
  })),
  { _id: false },
);

/**
 * Modelo de usuario.
 * Para agregar un campo nuevo al perfil: sumalo acá y en user.schema.ts. Nada más.
 */
const userSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    pais: { type: String, required: true, trim: true },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sexo: { type: String, enum: SEXOS, required: true },
    // select:false -> la contraseña NUNCA sale en las consultas salvo que se pida explícitamente
    password: { type: String, required: true, select: false },
    preferencias: { type: preferenciasSchema, default: () => ({}) },
  },
  {
    timestamps: true, // createdAt y updatedAt automáticos
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.password; // seguridad extra: jamás se serializa
        return ret;
      },
    },
  },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
