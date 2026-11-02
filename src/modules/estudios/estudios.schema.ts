import { z } from "zod";
import { TIPOS_ESTUDIO } from "./estudios.model.js";
import {
  booleanoQuery,
  conAlMenosUnCampo,
  fechaMes,
  paginacionSchema,
  texto,
  textoOpcional,
  urlHttps,
} from "../../utils/validaciones.js";

const campos = {
  tipo: z.enum(TIPOS_ESTUDIO, { message: `Valor inválido. Opciones: ${TIPOS_ESTUDIO.join(", ")}` }),
  institucion: texto(120),
  titulo: texto(120),
  desde: fechaMes,
  hasta: fechaMes.nullable(),
  finalizado: z.boolean({ error: "finalizado tiene que ser true o false" }),
  descripcion: textoOpcional(2000),
  urlVerificacion: urlHttps.nullable(),
  certificado: z.object({ url: urlHttps.nullable().default(null) }).nullable(),
  publicado: z.boolean({ error: "publicado tiene que ser true o false" }),
};

/** POST: obligatorios tipo, institucion, titulo y desde. El resto tiene valor por defecto */
export const crearEstudioSchema = z.object(campos).partial({
  hasta: true,
  finalizado: true,
  descripcion: true,
  urlVerificacion: true,
  certificado: true,
  publicado: true,
});

/** PATCH: solo los campos que cambian */
export const actualizarEstudioSchema = conAlMenosUnCampo(z.object(campos).partial());

export const listarPublicosQuerySchema = paginacionSchema(50);
export const listarAdminQuerySchema = paginacionSchema(50).extend({ publicado: booleanoQuery.optional() });

export type CrearEstudioInput = z.infer<typeof crearEstudioSchema>;
export type ActualizarEstudioInput = z.infer<typeof actualizarEstudioSchema>;
export type ListarPublicosQuery = z.infer<typeof listarPublicosQuerySchema>;
export type ListarAdminQuery = z.infer<typeof listarAdminQuerySchema>;
