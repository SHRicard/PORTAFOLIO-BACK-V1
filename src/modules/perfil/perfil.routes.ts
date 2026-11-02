import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import { auditar } from "../logs/log.middleware.js";
import { soloAdmin } from "../users/admin.middleware.js";
import { actualizarPerfil, guardarPerfil, obtenerPerfil, obtenerPerfilAdmin } from "./perfil.controller.js";
import { actualizarPerfilSchema, guardarPerfilSchema } from "./perfil.schema.js";

const router = Router();

// auditar(...) va primero en cada ruta: así la acción queda nombrada en los logs aunque falle

// Pública: lo que muestran los portafolios
router.get("/", auditar("perfil.ver"), obtenerPerfil);

// Panel (solo el administrador)
router.get("/admin", auditar("perfil.ver_admin"), authenticate, soloAdmin, obtenerPerfilAdmin);
router.put("/", auditar("perfil.guardar"), authenticate, soloAdmin, validateBody(guardarPerfilSchema), guardarPerfil);
router.patch(
  "/",
  auditar("perfil.actualizar"),
  authenticate,
  soloAdmin,
  validateBody(actualizarPerfilSchema),
  actualizarPerfil,
);

export default router;
