import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import { auditar } from "../logs/log.middleware.js";
import { soloAdmin } from "../users/admin.middleware.js";
import { actualizar, crear, eliminar, listarAdmin, listarPublicos } from "./experiencia.controller.js";
import { actualizarExperienciaSchema, crearExperienciaSchema } from "./experiencia.schema.js";

const router = Router();

// auditar(...) va primero en cada ruta: así la acción queda nombrada en los logs aunque falle

// Pública: solo trabajos publicados
router.get("/", auditar("experiencia.listar"), listarPublicos);

// Panel (solo el administrador)
router.get("/admin", auditar("experiencia.listar_admin"), authenticate, soloAdmin, listarAdmin);
router.post(
  "/",
  auditar("experiencia.crear"), // sin guardar valores: un trabajo puede ser oculto
  authenticate,
  soloAdmin,
  validateBody(crearExperienciaSchema),
  crear,
);
router.patch(
  "/:id",
  auditar("experiencia.actualizar"),
  authenticate,
  soloAdmin,
  validateBody(actualizarExperienciaSchema),
  actualizar,
);
router.delete("/:id", auditar("experiencia.eliminar"), authenticate, soloAdmin, eliminar);

export default router;
