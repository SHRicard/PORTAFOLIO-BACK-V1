import { z } from "zod";
import {
  CATEGORIAS_HABILIDAD,
  MODALIDADES,
  NIVELES_IDIOMA,
  REDES,
  TIPOS_DATO_CURIOSO,
} from "./perfil.model.js";
import { conAlMenosUnCampo, texto, textoOpcional, urlHttps } from "../../utils/validaciones.js";

const opciones = (valores: readonly string[]) => ({ message: `Valor inválido. Opciones: ${valores.join(", ")}` });

/** Campos del perfil, sin valores por defecto (los usan PUT y PATCH) */
const campos = {
  nombreVisible: texto(80),
  rol: texto(80),
  frase: texto(100),
  ubicacion: z.object({ ciudad: texto(80), pais: texto(80) }),
  modalidad: z.enum(MODALIDADES, opciones(MODALIDADES)),
  disponibilidad: z.object({
    disponible: z.boolean({ error: "disponible tiene que ser true o false" }),
    texto: textoOpcional(160).default(""),
  }),
  bioCorta: texto(280),
  bioLarga: texto(2000),
  correoContacto: z.string().trim().toLowerCase().max(120, "Máximo 120 caracteres").email("Correo electrónico inválido"),
  redes: z
    .array(z.object({ tipo: z.enum(REDES, opciones(REDES)), url: urlHttps }))
    .max(20, "Máximo 20 redes"),
  habilidades: z
    .array(z.object({ nombre: texto(50), categoria: z.enum(CATEGORIAS_HABILIDAD, opciones(CATEGORIAS_HABILIDAD)) }))
    .max(100, "Máximo 100 habilidades"),
  idiomas: z
    .array(z.object({ idioma: texto(40), nivel: z.enum(NIVELES_IDIOMA, opciones(NIVELES_IDIOMA)) }))
    .max(20, "Máximo 20 idiomas"),
  datosCuriosos: z
    .array(
      z.object({ titulo: texto(60), valor: texto(100), tipo: z.enum(TIPOS_DATO_CURIOSO, opciones(TIPOS_DATO_CURIOSO)) }),
    )
    .max(30, "Máximo 30 datos curiosos"),
  foto: z.object({ url: urlHttps.nullable().default(null), alt: texto(200) }).nullable(),
  cv: z.object({ url: urlHttps.nullable().default(null) }).nullable(),
};

/**
 * PUT: el perfil completo. Crea el perfil si no existe o lo reemplaza entero.
 * Las listas que no se manden quedan vacías y foto/cv quedan en null.
 */
export const guardarPerfilSchema = z.object({
  ...campos,
  redes: campos.redes.default([]),
  habilidades: campos.habilidades.default([]),
  idiomas: campos.idiomas.default([]),
  datosCuriosos: campos.datosCuriosos.default([]),
  foto: campos.foto.default(null),
  cv: campos.cv.default(null),
});

/** PATCH: solo los campos que cambian (cada uno reemplaza su valor completo, incluidas listas y objetos) */
export const actualizarPerfilSchema = conAlMenosUnCampo(z.object(campos).partial());

export type GuardarPerfilInput = z.infer<typeof guardarPerfilSchema>;
export type ActualizarPerfilInput = z.infer<typeof actualizarPerfilSchema>;
