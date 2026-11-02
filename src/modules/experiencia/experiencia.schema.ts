import { z } from "zod";
import { MODALIDADES } from "../perfil/perfil.model.js";
import {
  booleanoQuery,
  conAlMenosUnCampo,
  fechaMes,
  listaTextos,
  paginacionSchema,
  texto,
  textoOpcional,
} from "../../utils/validaciones.js";

const campos = {
  empresa: texto(80),
  puesto: texto(80),
  desde: fechaMes,
  hasta: fechaMes.nullable(),
  ubicacion: textoOpcional(80),
  modalidad: z.enum(MODALIDADES, { message: `Valor inválido. Opciones: ${MODALIDADES.join(", ")}` }),
  descripcion: textoOpcional(2000),
  logros: listaTextos(20, 400),
  tecnologias: listaTextos(60, 60),
  publicado: z.boolean({ error: "publicado tiene que ser true o false" }),
};

/** POST: obligatorios empresa, puesto, desde y modalidad. El resto tiene valor por defecto */
export const crearExperienciaSchema = z.object(campos).partial({
  hasta: true,
  ubicacion: true,
  descripcion: true,
  logros: true,
  tecnologias: true,
  publicado: true,
});

/** PATCH: solo los campos que cambian (cada uno reemplaza su valor completo, incluidas las listas) */
export const actualizarExperienciaSchema = conAlMenosUnCampo(z.object(campos).partial());

export const listarPublicosQuerySchema = paginacionSchema(50);
export const listarAdminQuerySchema = paginacionSchema(50).extend({ publicado: booleanoQuery.optional() });

export type CrearExperienciaInput = z.infer<typeof crearExperienciaSchema>;
export type ActualizarExperienciaInput = z.infer<typeof actualizarExperienciaSchema>;
export type ListarPublicosQuery = z.infer<typeof listarPublicosQuerySchema>;
export type ListarAdminQuery = z.infer<typeof listarAdminQuerySchema>;
