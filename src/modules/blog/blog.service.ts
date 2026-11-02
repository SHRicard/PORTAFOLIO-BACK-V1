import { Entrada } from "./blog.model.js";
import { AppError } from "../../utils/AppError.js";
import { metaPaginacion, SLUG_RESERVADO, slugDesde } from "../../utils/validaciones.js";
import type {
  ActualizarEntradaInput,
  CrearEntradaInput,
  ListarAdminQuery,
  ListarPublicasQuery,
} from "./blog.schema.js";

const NO_ENCONTRADA = "Entrada no encontrada";

type EntradaGuardada = InstanceType<typeof Entrada>;

/** Lo que ve el público: sin imágenes ni documentos que todavía no tienen URL */
function vistaPublica(entrada: EntradaGuardada) {
  const e = entrada.toJSON();
  return {
    ...e,
    portada: e.portada?.url ? e.portada : null,
    galeria: e.galeria.filter((imagen) => imagen.url),
    documentos: e.documentos.filter((documento) => documento.url),
  };
}

async function validarSlugLibre(slug: string, excepto?: string) {
  const ocupado = await Entrada.exists({ slug, ...(excepto && { _id: { $ne: excepto } }) });
  if (ocupado) throw AppError.conflict(`Ya existe una entrada con el slug "${slug}"`);
}

/** La lógica de negocio vive acá. El controlador solo recibe y responde. */
export const blogService = {
  /** Solo las publicadas, de la más nueva a la más vieja. Sin `contenido`: se pide al abrir cada entrada */
  async listarPublicas({ page, limit }: ListarPublicasQuery) {
    const filtro = { estado: "publicado" as const };
    const [entradas, total] = await Promise.all([
      Entrada.find(filtro)
        .select("-contenido")
        .sort({ publicadoEn: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Entrada.countDocuments(filtro),
    ]);
    return { entradas: entradas.map(vistaPublica), paginacion: metaPaginacion(page, limit, total) };
  },

  async obtenerPublica(slug: string) {
    const entrada = await Entrada.findOne({ slug, estado: "publicado" });
    if (!entrada) throw AppError.notFound(NO_ENCONTRADA);
    return vistaPublica(entrada);
  },

  /** Para el panel: todos los estados, de la creada más recientemente a la más vieja */
  async listarAdmin({ page, limit, estado }: ListarAdminQuery) {
    const filtro = estado ? { estado } : {};
    const [entradas, total] = await Promise.all([
      Entrada.find(filtro)
        .select("-contenido")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Entrada.countDocuments(filtro),
    ]);
    return { entradas: entradas.map((e) => e.toJSON()), paginacion: metaPaginacion(page, limit, total) };
  },

  async obtenerAdmin(id: string) {
    const entrada = await Entrada.findById(id);
    if (!entrada) throw AppError.notFound(NO_ENCONTRADA);
    return entrada.toJSON();
  },

  async crear(input: CrearEntradaInput) {
    const slug = input.slug ?? slugDesde(input.titulo);
    if (!slug) throw AppError.badRequest("No se pudo armar el slug desde el título: mandá un slug");
    if (slug === SLUG_RESERVADO) throw AppError.badRequest(`El slug "${SLUG_RESERVADO}" está reservado: mandá otro slug`);
    await validarSlugLibre(slug);

    const publicadoEn = input.estado === "publicado" ? new Date() : null;
    const entrada = await Entrada.create({ ...input, slug, publicadoEn });
    return entrada.toJSON();
  },

  /**
   * El slug NO cambia solo si cambia el título (así no se rompen los links compartidos).
   * `publicadoEn` es la primera publicación: despublicar y volver a publicar no la cambia.
   */
  async actualizar(id: string, input: ActualizarEntradaInput) {
    // Primero que exista (404) y después que el slug esté libre (409)
    const entrada = await Entrada.findById(id);
    if (!entrada) throw AppError.notFound(NO_ENCONTRADA);
    if (input.slug) await validarSlugLibre(input.slug, id);

    entrada.set(input);
    if (entrada.estado === "publicado" && !entrada.publicadoEn) entrada.publicadoEn = new Date();
    await entrada.save();
    return entrada.toJSON();
  },

  async eliminar(id: string) {
    const entrada = await Entrada.findByIdAndDelete(id);
    if (!entrada) throw AppError.notFound(NO_ENCONTRADA);
  },
};
