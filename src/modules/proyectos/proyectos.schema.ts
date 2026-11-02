import { z } from "zod";
import { ESTADOS_PROYECTO, TIENDAS, TIPOS_PROYECTO } from "./proyectos.model.js";
import {
  booleanoQuery,
  conAlMenosUnCampo,
  fechaMes,
  idMongo,
  listaTextos,
  paginacionSchema,
  slugSchema,
  texto,
  textoOpcional,
  urlHttps,
} from "../../utils/validaciones.js";

const opciones = (valores: readonly string[]) => ({ message: `Valor inválido. Opciones: ${valores.join(", ")}` });

const imagen = z.object({ url: urlHttps.nullable().default(null), alt: texto(200) });
const documento = z.object({ url: urlHttps.nullable().default(null), titulo: texto(120) });

/** Los enlaces se guardan completos: lo que no se manda vuelve a su valor por defecto */
const enlaces = z.object({
  demo: urlHttps.nullable().default(null),
  demoPorSolicitud: z.boolean({ error: "demoPorSolicitud tiene que ser true o false" }).default(false),
  repositorios: z
    .array(z.object({ nombre: texto(60), url: urlHttps }))
    .max(10, "Máximo 10 repositorios")
    .default([]),
  tiendas: z
    .array(z.object({ tienda: z.enum(TIENDAS, opciones(TIENDAS)), app: texto(60), url: urlHttps.nullable().default(null) }))
    .max(10, "Máximo 10 tiendas")
    .default([]),
  apkDemo: z
    .object({ url: urlHttps.nullable().default(null), nota: textoOpcional(500).default("") })
    .nullable()
    .default(null),
});

const campos = {
  titulo: texto(80),
  slug: slugSchema,
  tipo: z.enum(TIPOS_PROYECTO, opciones(TIPOS_PROYECTO)),
  rol: texto(80),
  fecha: fechaMes,
  resumen: texto(160),
  descripcion: texto(5000),
  tecnologias: listaTextos(60, 60),
  enlaces,
  portada: imagen.nullable(),
  galeria: z.array(imagen).max(20, "Máximo 20 imágenes en la galería"),
  documentos: z.array(documento).max(10, "Máximo 10 documentos"),
  destacado: z.boolean({ error: "destacado tiene que ser true o false" }),
  estado: z.enum(ESTADOS_PROYECTO, opciones(ESTADOS_PROYECTO)),
  orden: z.number({ error: "orden tiene que ser un número" }).int().min(1, "orden tiene que ser 1 o más"),
};

/** POST: obligatorios titulo, tipo, rol, fecha, resumen y descripcion. El resto tiene valor por defecto */
export const crearProyectoSchema = z.object(campos).partial({
  slug: true,
  tecnologias: true,
  enlaces: true,
  portada: true,
  galeria: true,
  documentos: true,
  destacado: true,
  estado: true,
  orden: true,
});

/** PATCH: solo los campos que cambian (cada uno reemplaza su valor completo, incluidas listas y objetos) */
export const actualizarProyectoSchema = conAlMenosUnCampo(z.object(campos).partial());

/** PUT /orden: todos los ids de los proyectos, en el orden nuevo */
export const reordenarSchema = z.object({
  ids: z
    .array(idMongo)
    .min(1, "Mandá al menos un id")
    .max(200, "Máximo 200 ids")
    .refine((ids) => new Set(ids).size === ids.length, "Hay ids repetidos"),
});

export const listarPublicosQuerySchema = paginacionSchema(50).extend({ destacado: booleanoQuery.optional() });
export const listarAdminQuerySchema = paginacionSchema(50).extend({
  estado: z.enum(ESTADOS_PROYECTO, opciones(ESTADOS_PROYECTO)).optional(),
});

export type CrearProyectoInput = z.infer<typeof crearProyectoSchema>;
export type ActualizarProyectoInput = z.infer<typeof actualizarProyectoSchema>;
export type ListarPublicosQuery = z.infer<typeof listarPublicosQuerySchema>;
export type ListarAdminQuery = z.infer<typeof listarAdminQuerySchema>;
