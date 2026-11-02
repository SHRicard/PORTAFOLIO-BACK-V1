import { Router } from "express";
import userRoutes from "../modules/users/user.routes.js";
import perfilRoutes from "../modules/perfil/perfil.routes.js";
import proyectosRoutes from "../modules/proyectos/proyectos.routes.js";
import experienciaRoutes from "../modules/experiencia/experiencia.routes.js";
import estudiosRoutes from "../modules/estudios/estudios.routes.js";
import archivosRoutes from "../modules/archivos/archivos.routes.js";
import blogRoutes from "../modules/blog/blog.routes.js";
import { registrarActividad } from "../modules/logs/log.middleware.js";

/**
 * REGISTRO DE MÓDULOS
 * -------------------
 * Cada módulo (users, projects, posts...) es una carpeta en src/modules/
 * con su propio model, schema, service, controller y routes.
 *
 * Para sumar un módulo nuevo:
 *   1. Copiá la carpeta src/modules/users como base y renombrala
 *   2. Importá su router acá y agregá una línea  router.use("/ruta", suRouter)
 *   3. En sus rutas, poné auditar("modulo.accion") primero para nombrar la acción en los logs
 */
const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, status: "up", timestamp: new Date().toISOString() });
});

// Auditoría: todo lo que está debajo de esta línea queda registrado en la colección `logs`
// (/health queda afuera a propósito: los monitores del hosting lo llaman todo el tiempo)
router.use(registrarActividad);

router.use("/users", userRoutes);

// Portafolio: lectura pública y edición solo para el administrador (ADMIN_CORREO)
router.use("/perfil", perfilRoutes);
router.use("/proyectos", proyectosRoutes);
router.use("/experiencia", experienciaRoutes);
router.use("/estudios", estudiosRoutes);
router.use("/archivos", archivosRoutes);
router.use("/blog", blogRoutes);

export default router;
