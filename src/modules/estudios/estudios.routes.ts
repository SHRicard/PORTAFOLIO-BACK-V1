import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import { auditar } from "../logs/log.middleware.js";
import { soloAdmin } from "../users/admin.middleware.js";
import { actualizar, crear, eliminar, listarAdmin, listarPublicos } from "./estudios.controller.js";
import { actualizarEstudioSchema, crearEstudioSchema } from "./estudios.schema.js";

const router = Router();

// auditar(...) va primero en cada ruta: así la acción queda nombrada en los logs aunque falle

// Pública: solo estudios publicados
router.get("/", auditar("estudios.listar"), listarPublicos);

// Panel (solo el administrador)
router.get("/admin", auditar("estudios.listar_admin"), authenticate, soloAdmin, listarAdmin);
router.post(
  "/",
  auditar("estudios.crear"), // sin guardar valores: un estudio puede ser oculto
  authenticate,
  soloAdmin,
  validateBody(crearEstudioSchema),
  crear,
);
router.patch(
  "/:id",
  auditar("estudios.actualizar"),
  authenticate,
  soloAdmin,
  validateBody(actualizarEstudioSchema),
  actualizar,
);
router.delete("/:id", auditar("estudios.eliminar"), authenticate, soloAdmin, eliminar);

export default router;
