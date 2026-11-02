import { CLAVE_PERFIL, Perfil } from "./perfil.model.js";
import { AppError } from "../../utils/AppError.js";
import type { ActualizarPerfilInput, GuardarPerfilInput } from "./perfil.schema.js";

const SIN_PERFIL = "El perfil todavía no está cargado";

type ConArchivos = { foto?: { url?: string | null } | null; cv?: { url?: string | null } | null };

/** Lo que ve el público: sin foto ni CV mientras no tengan URL */
const vistaPublica = <T extends ConArchivos>(perfil: T) => ({
  ...perfil,
  foto: perfil.foto?.url ? perfil.foto : null,
  cv: perfil.cv?.url ? perfil.cv : null,
});

/** La lógica de negocio vive acá. El controlador solo recibe y responde. */
export const perfilService = {
  async obtenerPublico() {
    const perfil = await Perfil.findOne({ clave: CLAVE_PERFIL });
    if (!perfil) throw AppError.notFound(SIN_PERFIL);
    return vistaPublica(perfil.toJSON());
  },

  /** Para el panel: tal cual está guardado, incluidos foto y CV sin URL */
  async obtenerAdmin() {
    const perfil = await Perfil.findOne({ clave: CLAVE_PERFIL });
    if (!perfil) throw AppError.notFound(SIN_PERFIL);
    return perfil.toJSON();
  },

  /** Crea el perfil o lo reemplaza entero (el input ya trae todos los campos) */
  async guardar(input: GuardarPerfilInput) {
    const perfil = await Perfil.findOneAndUpdate(
      { clave: CLAVE_PERFIL },
      { $set: input },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
    if (!perfil) throw AppError.notFound(SIN_PERFIL);
    return perfil.toJSON();
  },

  async actualizar(input: ActualizarPerfilInput) {
    const perfil = await Perfil.findOneAndUpdate(
      { clave: CLAVE_PERFIL },
      { $set: input },
      { returnDocument: "after", runValidators: true },
    );
    if (!perfil) throw AppError.notFound(`${SIN_PERFIL}: crealo primero con PUT /perfil`);
    return perfil.toJSON();
  },
};
