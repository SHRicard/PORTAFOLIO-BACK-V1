import { Schema, model, type InferSchemaType } from "mongoose";

export const MODALIDADES = ["remoto", "hibrido", "presencial"] as const;
export const REDES = ["github", "linkedin", "behance", "dribbble", "instagram", "x", "youtube", "sitio", "otra"] as const;
export const CATEGORIAS_HABILIDAD = [
  "front",
  "back",
  "mobile",
  "base-de-datos",
  "diseno",
  "herramientas",
  "otra",
] as const;
export const NIVELES_IDIOMA = ["basico", "intermedio", "avanzado", "nativo"] as const;
export const TIPOS_DATO_CURIOSO = ["profesional", "personal"] as const;

/** El perfil es uno solo: este valor fijo (con índice único) impide que se cree un segundo documento */
export const CLAVE_PERFIL = "principal";

const sinId = { _id: false } as const;

const texto = { type: String, required: true, trim: true } as const;

/**
 * Perfil público del portafolio (documento único).
 * Para agregar un campo: sumalo acá y en perfil.schema.ts.
 */
const perfilSchema = new Schema(
  {
    clave: { type: String, default: CLAVE_PERFIL, unique: true, immutable: true },
    nombreVisible: texto,
    rol: texto,
    frase: texto,
    ubicacion: { type: new Schema({ ciudad: texto, pais: texto }, sinId), required: true },
    modalidad: { type: String, enum: MODALIDADES, required: true },
    disponibilidad: {
      type: new Schema(
        { disponible: { type: Boolean, required: true }, texto: { type: String, trim: true, default: "" } },
        sinId,
      ),
      required: true,
    },
    bioCorta: texto,
    bioLarga: texto,
    correoContacto: { type: String, required: true, lowercase: true, trim: true },
    redes: {
      type: [new Schema({ tipo: { type: String, enum: REDES, required: true }, url: texto }, sinId)],
      default: [],
    },
    habilidades: {
      type: [new Schema({ nombre: texto, categoria: { type: String, enum: CATEGORIAS_HABILIDAD, required: true } }, sinId)],
      default: [],
    },
    idiomas: {
      type: [new Schema({ idioma: texto, nivel: { type: String, enum: NIVELES_IDIOMA, required: true } }, sinId)],
      default: [],
    },
    datosCuriosos: {
      type: [
        new Schema(
          { titulo: texto, valor: texto, tipo: { type: String, enum: TIPOS_DATO_CURIOSO, required: true } },
          sinId,
        ),
      ],
      default: [],
    },
    // url null = la imagen o el PDF todavía no se subió (el público no lo ve)
    foto: { type: new Schema({ url: { type: String, default: null }, alt: texto }, sinId), default: null },
    cv: { type: new Schema({ url: { type: String, default: null } }, sinId), default: null },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.clave; // detalle interno
        return ret;
      },
    },
  },
);

export type PerfilDoc = InferSchemaType<typeof perfilSchema>;
export const Perfil = model("Perfil", perfilSchema, "perfil");
