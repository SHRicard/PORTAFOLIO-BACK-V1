import bcrypt from "bcryptjs";
import { User } from "./user.model.js";
import { AppError } from "../../utils/AppError.js";
import { signToken } from "../../utils/jwt.js";
import { PREFERENCIAS, preferenciasPorDefecto, type Preferencias } from "./preferences.options.js";
import type { LoginInput, RegisterInput, UpdatePreferencesInput, UpdateProfileInput } from "./user.schema.js";

const SALT_ROUNDS = 12;

// Hash "de mentira" para que el login tarde lo mismo exista o no el correo
// (evita que alguien descubra qué correos están registrados midiendo tiempos)
const DUMMY_HASH = bcrypt.hashSync("dummy-password", SALT_ROUNDS);

/** La lógica de negocio vive acá. El controlador solo recibe y responde. */
export const userService = {
  async register(input: RegisterInput) {
    const exists = await User.exists({ correo: input.correo });
    if (exists) throw AppError.conflict("Ya existe una cuenta con ese correo");

    const password = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await User.create({ ...input, password });

    return { token: signToken(user.id), user: user.toJSON() };
  },

  async login({ correo, password }: LoginInput) {
    const user = await User.findOne({ correo }).select("+password");

    const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
    if (!user || !valid) throw AppError.unauthorized("Correo o contraseña incorrectos");

    return { token: signToken(user.id), user: user.toJSON() };
  },

  async getById(id: string) {
    const user = await User.findById(id);
    if (!user) throw AppError.notFound("Usuario no encontrado");
    return user.toJSON();
  },

  async updateProfile(id: string, input: UpdateProfileInput) {
    if (input.correo) {
      const taken = await User.exists({ correo: input.correo, _id: { $ne: id } });
      if (taken) throw AppError.conflict("Ese correo ya está en uso");
    }

    const user = await User.findByIdAndUpdate(id, input, { new: true, runValidators: true });
    if (!user) throw AppError.notFound("Usuario no encontrado");
    return user.toJSON();
  },

  async getPreferences(id: string) {
    const user = await User.findById(id);
    if (!user) throw AppError.notFound("Usuario no encontrado");
    return user.toJSON().preferencias as Preferencias;
  },

  async updatePreferences(id: string, input: UpdatePreferencesInput) {
    // { tema: { colorPrimario: "#ff0000" } } -> { "preferencias.tema.colorPrimario": "#ff0000" }
    // Con notación de puntos Mongo cambia solo esos campos y no pisa los que no se mandaron
    const cambios: Record<string, unknown> = {};
    for (const [grupo, campos] of Object.entries(input)) {
      for (const [campo, valor] of Object.entries(campos ?? {})) {
        cambios[`preferencias.${grupo}.${campo}`] = valor;
      }
    }

    const user = await User.findByIdAndUpdate(id, { $set: cambios }, { new: true, runValidators: true });
    if (!user) throw AppError.notFound("Usuario no encontrado");
    return user.toJSON().preferencias as Preferencias;
  },

  async resetPreferences(id: string) {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { preferencias: preferenciasPorDefecto() } },
      { new: true, runValidators: true },
    );
    if (!user) throw AppError.notFound("Usuario no encontrado");
    return user.toJSON().preferencias as Preferencias;
  },

  /** Todas las opciones disponibles, en orden, para que el panel arme los selects */
  getPreferenceOptions() {
    const grupos = Object.entries(PREFERENCIAS).map(([clave, { etiqueta, campos }]) => ({
      clave,
      etiqueta,
      campos: Object.entries(campos).map(([campo, def]) => ({ clave: campo, ...def })),
    }));
    return { grupos };
  },
};
