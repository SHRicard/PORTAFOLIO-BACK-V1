import { Estudio } from "./estudios.model.js";
import { AppError } from "../../utils/AppError.js";
import { metaPaginacion } from "../../utils/validaciones.js";
import type {
  ActualizarEstudioInput,
  CrearEstudioInput,
  ListarAdminQuery,
  ListarPublicosQuery,
} from "./estudios.schema.js";

const NO_ENCONTRADO = "Estudio no encontrado";

/** Las fechas son AAAA-MM, así que se pueden comparar como texto */
function validarFechas(desde: string, hasta?: string | null, finalizado?: boolean) {
  if (hasta && hasta < desde) throw AppError.badRequest("La fecha de fin no puede ser anterior a la de inicio");
  // hasta null = en curso: no puede estar terminado a la vez
  if (finalizado && !hasta) throw AppError.badRequest("Un estudio finalizado necesita fecha de fin");
}

// Del estudio más reciente al más viejo
const ORDEN = { desde: -1, _id: 1 } as const;

type EstudioGuardado = InstanceType<typeof Estudio>;

/** Lo que ve el público: sin certificado mientras no tenga URL */
function vistaPublica(estudio: EstudioGuardado) {
  const e = estudio.toJSON();
  return { ...e, certificado: e.certificado?.url ? e.certificado : null };
}

/** La lógica de negocio vive acá. El controlador solo recibe y responde. */
export const estudiosService = {
  /** Solo los estudios publicados */
  async listarPublicos({ page, limit }: ListarPublicosQuery) {
    const filtro = { publicado: true };
    const [estudios, total] = await Promise.all([
      Estudio.find(filtro)
        .sort(ORDEN)
        .skip((page - 1) * limit)
        .limit(limit),
      Estudio.countDocuments(filtro),
    ]);
    return { estudios: estudios.map(vistaPublica), paginacion: metaPaginacion(page, limit, total) };
  },

  /** Para el panel: publicados y ocultos, tal cual están guardados */
  async listarAdmin({ page, limit, publicado }: ListarAdminQuery) {
    const filtro = publicado === undefined ? {} : { publicado };
    const [estudios, total] = await Promise.all([
      Estudio.find(filtro)
        .sort(ORDEN)
        .skip((page - 1) * limit)
        .limit(limit),
      Estudio.countDocuments(filtro),
    ]);
    return { estudios: estudios.map((e) => e.toJSON()), paginacion: metaPaginacion(page, limit, total) };
  },

  async crear(input: CrearEstudioInput) {
    validarFechas(input.desde, input.hasta, input.finalizado);
    const estudio = await Estudio.create(input);
    return estudio.toJSON();
  },

  async actualizar(id: string, input: ActualizarEstudioInput) {
    const estudio = await Estudio.findById(id);
    if (!estudio) throw AppError.notFound(NO_ENCONTRADO);

    // Se valida contra lo guardado: el PATCH puede traer solo algunos de estos campos
    validarFechas(
      input.desde ?? estudio.desde,
      input.hasta === undefined ? estudio.hasta : input.hasta,
      input.finalizado ?? estudio.finalizado,
    );

    estudio.set(input);
    await estudio.save();
    return estudio.toJSON();
  },

  async eliminar(id: string) {
    const estudio = await Estudio.findByIdAndDelete(id);
    if (!estudio) throw AppError.notFound(NO_ENCONTRADO);
  },
};
