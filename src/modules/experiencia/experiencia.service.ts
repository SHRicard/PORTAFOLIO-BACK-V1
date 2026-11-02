import { Experiencia } from "./experiencia.model.js";
import { AppError } from "../../utils/AppError.js";
import { metaPaginacion } from "../../utils/validaciones.js";
import type {
  ActualizarExperienciaInput,
  CrearExperienciaInput,
  ListarAdminQuery,
  ListarPublicosQuery,
} from "./experiencia.schema.js";

const NO_ENCONTRADA = "Experiencia no encontrada";

/** Las fechas son AAAA-MM, así que se pueden comparar como texto */
function validarFechas(desde: string, hasta?: string | null) {
  if (hasta && hasta < desde) throw AppError.badRequest("La fecha de fin no puede ser anterior a la de inicio");
}

// Del trabajo más reciente al más viejo
const ORDEN = { desde: -1, _id: 1 } as const;

/** La lógica de negocio vive acá. El controlador solo recibe y responde. */
export const experienciaService = {
  /** Solo los trabajos publicados */
  async listarPublicos({ page, limit }: ListarPublicosQuery) {
    const filtro = { publicado: true };
    const [experiencia, total] = await Promise.all([
      Experiencia.find(filtro)
        .sort(ORDEN)
        .skip((page - 1) * limit)
        .limit(limit),
      Experiencia.countDocuments(filtro),
    ]);
    return { experiencia: experiencia.map((e) => e.toJSON()), paginacion: metaPaginacion(page, limit, total) };
  },

  /** Para el panel: publicados y ocultos */
  async listarAdmin({ page, limit, publicado }: ListarAdminQuery) {
    const filtro = publicado === undefined ? {} : { publicado };
    const [experiencia, total] = await Promise.all([
      Experiencia.find(filtro)
        .sort(ORDEN)
        .skip((page - 1) * limit)
        .limit(limit),
      Experiencia.countDocuments(filtro),
    ]);
    return { experiencia: experiencia.map((e) => e.toJSON()), paginacion: metaPaginacion(page, limit, total) };
  },

  async crear(input: CrearExperienciaInput) {
    validarFechas(input.desde, input.hasta);
    const experiencia = await Experiencia.create(input);
    return experiencia.toJSON();
  },

  async actualizar(id: string, input: ActualizarExperienciaInput) {
    const experiencia = await Experiencia.findById(id);
    if (!experiencia) throw AppError.notFound(NO_ENCONTRADA);

    // Se valida contra lo guardado: el PATCH puede traer solo una de las dos fechas
    validarFechas(input.desde ?? experiencia.desde, input.hasta === undefined ? experiencia.hasta : input.hasta);

    experiencia.set(input);
    await experiencia.save();
    return experiencia.toJSON();
  },

  async eliminar(id: string) {
    const experiencia = await Experiencia.findByIdAndDelete(id);
    if (!experiencia) throw AppError.notFound(NO_ENCONTRADA);
  },
};
