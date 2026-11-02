import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import { auditar } from "../logs/log.middleware.js";
import { soloAdmin } from "../users/admin.middleware.js";
import {
  actualizar,
  crear,
  eliminar,
  listarAdmin,
  listarPublicos,
  obtenerAdmin,
  obtenerPublico,
  reordenar,
} from "./proyectos.controller.js";
import { actualizarProyectoSchema, crearProyectoSchema, reordenarSchema } from "./proyectos.schema.js";

const router = Router();

// auditar(...) va primero en cada ruta: así la acción queda nombrada en los logs aunque falle
// Las rutas /admin van antes de /:slug para que "admin" no se tome como un slug

// Panel (solo el administrador): todos los estados
router.get("/admin", auditar("proyectos.listar_admin"), authenticate, soloAdmin, listarAdmin);
router.get("/admin/:id", auditar("proyectos.ver_admin"), authenticate, soloAdmin, obtenerAdmin);

// Públicas: solo proyectos publicados
router.get("/", auditar("proyectos.listar"), listarPublicos);
router.get("/:slug", auditar("proyectos.ver"), obtenerPublico);

// Panel (solo el administrador)
router.post(
  "/",
  auditar("proyectos.crear"), // sin guardar valores: un proyecto puede ser privado
  authenticate,
  soloAdmin,
  validateBody(crearProyectoSchema),
  crear,
);
router.put("/orden", auditar("proyectos.reordenar"), authenticate, soloAdmin, validateBody(reordenarSchema), reordenar);
router.patch(
  "/:id",
  auditar("proyectos.actualizar"),
  authenticate,
  soloAdmin,
  validateBody(actualizarProyectoSchema),
  actualizar,
);
router.delete("/:id", auditar("proyectos.eliminar"), authenticate, soloAdmin, eliminar);

export default router;
