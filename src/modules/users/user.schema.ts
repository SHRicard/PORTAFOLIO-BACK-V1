import { z } from "zod";
import { SEXOS } from "./user.model.js";
import {
  COLOR_HEX,
  mapearPreferencias,
  type CampoPreferencia,
  type PreferenciasParciales,
} from "./preferences.options.js";

/** Campos del perfil (sin credenciales) */
const profileFields = {
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(60),
  apellido: z.string().trim().min(1, "El apellido es obligatorio").max(60),
  telefono: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{6,20}$/, "Teléfono inválido"),
  pais: z.string().trim().min(2, "El país es obligatorio").max(60),
  sexo: z.enum(SEXOS, { message: `El sexo debe ser: ${SEXOS.join(", ")}` }),
};

export const registerSchema = z.object({
  ...profileFields,
  correo: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña es demasiado larga"),
});

export const loginSchema = z.object({
  correo: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

/** Para actualizar el perfil: todos los campos son opcionales, pero al menos uno */
export const updateProfileSchema = z
  .object({
    ...profileFields,
    correo: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Enviá al menos un campo para actualizar");

/* ---------- Preferencias (se arman solas desde preferences.options.ts) ---------- */

const MENSAJE_COLOR = "Color inválido: usá el formato #RRGGBB";

/** Objeto que rechaza campos desconocidos, con mensajes en español */
const objetoEstricto = <T extends z.ZodRawShape>(shape: T) =>
  z.strictObject(shape, {
    error: (issue) =>
      issue.code === "unrecognized_keys" ? `Campo desconocido: ${issue.keys.join(", ")}` : "Debe ser un objeto",
  });

/** Traduce un campo de preferences.options.ts a su validación de Zod */
const campoZod = (def: CampoPreferencia) =>
  def.tipo === "color"
    ? z.string({ error: MENSAJE_COLOR }).regex(COLOR_HEX, MENSAJE_COLOR).toLowerCase()
    : z.literal(def.valores, { error: `Valor inválido. Opciones: ${def.valores.join(", ")}` });

/**
 * Para actualizar preferencias: parcial a cualquier nivel (grupos y campos opcionales),
 * pero con al menos un campo. Ej: { tema: { colorPrimario: "#ff0000" } }
 */
export const updatePreferencesSchema = objetoEstricto(
  mapearPreferencias(campoZod, (campos) => objetoEstricto(campos).partial().optional()),
).refine(
  (data) => Object.values(data).some((grupo) => grupo && Object.keys(grupo).length > 0),
  "Enviá al menos una preferencia para actualizar",
);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = PreferenciasParciales;
