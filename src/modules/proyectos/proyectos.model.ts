import { Schema, model, type InferSchemaType } from "mongoose";

export const TIPOS_PROYECTO = ["personal", "freelance", "empresa"] as const;
// borrador: sin terminar · publicado: lo ve todo el mundo · privado: terminado pero oculto
export const ESTADOS_PROYECTO = ["borrador", "publicado", "privado"] as const;
export const TIENDAS = ["playStore", "appStore"] as const;

const sinId = { _id: false } as const;
const texto = { type: String, required: true, trim: true } as const;
// url null = todavía no se subió o no se tiene (el público no lo ve)
const urlPendiente = { type: String, default: null } as const;

const imagenSchema = new Schema({ url: urlPendiente, alt: texto }, sinId);
const documentoSchema = new Schema({ url: urlPendiente, titulo: texto }, sinId);

const enlacesSchema = new Schema(
  {
    demo: urlPendiente,
    demoPorSolicitud: { type: Boolean, default: false }, // botón "Pedí una demo por Meet"
    repositorios: { type: [new Schema({ nombre: texto, url: texto }, sinId)], default: [] },
    tiendas: {
      type: [new Schema({ tienda: { type: String, enum: TIENDAS, required: true }, app: texto, url: urlPendiente }, sinId)],
      default: [],
    },
    apkDemo: {
      type: new Schema({ url: urlPendiente, nota: { type: String, trim: true, default: "" } }, sinId),
      default: null,
    },
  },
  sinId,
);

/**
 * Proyecto del portafolio.
 * Para agregar un campo: sumalo acá y en proyectos.schema.ts.
 */
const proyectoSchema = new Schema(
  {
    titulo: texto,
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tipo: { type: String, enum: TIPOS_PROYECTO, required: true },
    rol: texto,
    fecha: texto, // AAAA-MM
    resumen: texto,
    descripcion: texto,
    tecnologias: { type: [String], default: [] },
    enlaces: { type: enlacesSchema, default: () => ({}) },
    portada: { type: imagenSchema, default: null },
    galeria: { type: [imagenSchema], default: [] },
    documentos: { type: [documentoSchema], default: [] },
    destacado: { type: Boolean, default: false },
    estado: { type: String, enum: ESTADOS_PROYECTO, default: "borrador" },
    orden: { type: Number, required: true, min: 1 }, // posición en el portafolio (1 = primero)
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

proyectoSchema.index({ estado: 1, orden: 1 });

export type ProyectoDoc = InferSchemaType<typeof proyectoSchema>;
export const Proyecto = model("Proyecto", proyectoSchema, "proyectos");
