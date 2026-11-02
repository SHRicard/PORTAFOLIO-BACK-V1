import { z } from "zod";
import { ESTADOS_ENTRADA } from "./blog.model.js";
import {
  conAlMenosUnCampo,
  listaTextos,
  paginacionSchema,
  slugSchema,
  texto,
  urlHttps,
} from "../../utils/validaciones.js";

const opcionesEstado = { message: `Valor inválido. Opciones: ${ESTADOS_ENTRADA.join(", ")}` };

const imagen = z.object({ url: urlHttps.nullable().default(null), alt: texto(200) });
const documento = z.object({ url: urlHttps.nullable().default(null), titulo: texto(120) });

const campos = {
  titulo: texto(120),
  slug: slugSchema,
  resumen: texto(200),
  contenido: texto(20000),
  portada: imagen.nullable(),
  galeria: z.array(imagen).max(20, "Máximo 20 imágenes en la galería"),
  documentos: z.array(documento).max(10, "Máximo 10 documentos"),
  etiquetas: listaTextos(10, 30),
  estado: z.enum(ESTADOS_ENTRADA, opcionesEstado),
};

/** POST: obligatorios titulo, resumen y contenido. El resto tiene valor por defecto */
export const crearEntradaSchema = z.object(campos).partial({
  slug: true,
  portada: true,
  galeria: true,
  documentos: true,
  etiquetas: true,
  estado: true,
});

/** PATCH: solo los campos que cambian (cada uno reemplaza su valor completo) */
export const actualizarEntradaSchema = conAlMenosUnCampo(z.object(campos).partial());

export const listarPublicasQuerySchema = paginacionSchema(20);
export const listarAdminQuerySchema = paginacionSchema(50).extend({ estado: z.enum(ESTADOS_ENTRADA, opcionesEstado).optional() });

export type CrearEntradaInput = z.infer<typeof crearEntradaSchema>;
export type ActualizarEntradaInput = z.infer<typeof actualizarEntradaSchema>;
export type ListarPublicasQuery = z.infer<typeof listarPublicasQuerySchema>;
export type ListarAdminQuery = z.infer<typeof listarAdminQuerySchema>;
