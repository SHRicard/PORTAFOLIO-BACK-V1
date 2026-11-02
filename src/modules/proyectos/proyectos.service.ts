import { Proyecto } from "./proyectos.model.js";
import { AppError } from "../../utils/AppError.js";
import { metaPaginacion, SLUG_RESERVADO, slugDesde } from "../../utils/validaciones.js";
import {
  type ActualizarProyectoInput,
  type CrearProyectoInput,
  type ListarAdminQuery,
  type ListarPublicosQuery,
} from "./proyectos.schema.js";

const NO_ENCONTRADO = "Proyecto no encontrado";

type ProyectoGuardado = InstanceType<typeof Proyecto>;

/** Lo que ve el público: sin imágenes, documentos ni links que todavía no tienen URL */
function vistaPublica(proyecto: ProyectoGuardado) {
  const p = proyecto.toJSON();
  return {
    ...p,
    enlaces: {
      ...p.enlaces,
      tiendas: (p.enlaces?.tiendas ?? []).filter((t) => t.url),
      apkDemo: p.enlaces?.apkDemo?.url ? p.enlaces.apkDemo : null,
    },
    portada: p.portada?.url ? p.portada : null,
    galeria: p.galeria.filter((imagen) => imagen.url),
    documentos: p.documentos.filter((documento) => documento.url),
  };
}

async function validarSlugLibre(slug: string, excepto?: string) {
  const ocupado = await Proyecto.exists({ slug, ...(excepto && { _id: { $ne: excepto } }) });
  if (ocupado) throw AppError.conflict(`Ya existe un proyecto con el slug "${slug}"`);
}

/** La lógica de negocio vive acá. El controlador solo recibe y responde. */
export const proyectosService = {
  /** Solo los publicados, en el orden del portafolio */
  async listarPublicos({ page, limit, destacado }: ListarPublicosQuery) {
    const filtro = { estado: "publicado" as const, ...(destacado !== undefined && { destacado }) };
    const [proyectos, total] = await Promise.all([
      Proyecto.find(filtro)
        .sort({ orden: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Proyecto.countDocuments(filtro),
    ]);
    return { proyectos: proyectos.map(vistaPublica), paginacion: metaPaginacion(page, limit, total) };
  },

  async obtenerPublico(slug: string) {
    const proyecto = await Proyecto.findOne({ slug, estado: "publicado" });
    if (!proyecto) throw AppError.notFound(NO_ENCONTRADO);
    return vistaPublica(proyecto);
  },

  /** Para el panel: todos los estados, tal cual están guardados */
  async listarAdmin({ page, limit, estado }: ListarAdminQuery) {
    const filtro = estado ? { estado } : {};
    const [proyectos, total] = await Promise.all([
      Proyecto.find(filtro)
        .sort({ orden: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Proyecto.countDocuments(filtro),
    ]);
    return { proyectos: proyectos.map((p) => p.toJSON()), paginacion: metaPaginacion(page, limit, total) };
  },

  async obtenerAdmin(id: string) {
    const proyecto = await Proyecto.findById(id);
    if (!proyecto) throw AppError.notFound(NO_ENCONTRADO);
    return proyecto.toJSON();
  },

  async crear(input: CrearProyectoInput) {
    const slug = input.slug ?? slugDesde(input.titulo);
    if (!slug) throw AppError.badRequest("No se pudo armar el slug desde el título: mandá un slug");
    if (slug === SLUG_RESERVADO) throw AppError.badRequest(`El slug "${SLUG_RESERVADO}" está reservado: mandá otro slug`);
    await validarSlugLibre(slug);

    // Sin orden: va al final
    const ultimo = await Proyecto.findOne().sort({ orden: -1 }).select("orden");
    const orden = input.orden ?? (ultimo?.orden ?? 0) + 1;

    const proyecto = await Proyecto.create({ ...input, slug, orden });
    return proyecto.toJSON();
  },

  /** El slug NO cambia solo si cambia el título (así no se rompen los links compartidos) */
  async actualizar(id: string, input: ActualizarProyectoInput) {
    // Primero que exista (404) y después que el slug esté libre (409)
    if (!(await Proyecto.exists({ _id: id }))) throw AppError.notFound(NO_ENCONTRADO);
    if (input.slug) await validarSlugLibre(input.slug, id);

    const proyecto = await Proyecto.findByIdAndUpdate(id, { $set: input }, { returnDocument: "after", runValidators: true });
    if (!proyecto) throw AppError.notFound(NO_ENCONTRADO);
    return proyecto.toJSON();
  },

  /** Recibe TODOS los ids en el orden nuevo y renumera 1, 2, 3... */
  async reordenar(ids: string[]) {
    const [total, encontrados] = await Promise.all([
      Proyecto.countDocuments(),
      Proyecto.countDocuments({ _id: { $in: ids } }),
    ]);
    if (encontrados !== ids.length) throw AppError.badRequest("Hay ids que no corresponden a ningún proyecto");
    if (ids.length !== total) {
      throw AppError.badRequest(`Mandá todos los proyectos en el orden nuevo: son ${total} y llegaron ${ids.length}`);
    }

    await Proyecto.bulkWrite(
      ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { orden: i + 1 } } } })),
    );

    const proyectos = await Proyecto.find().sort({ orden: 1 });
    return proyectos.map((p) => p.toJSON());
  },

  async eliminar(id: string) {
    const proyecto = await Proyecto.findByIdAndDelete(id);
    if (!proyecto) throw AppError.notFound(NO_ENCONTRADO);
  },
};
