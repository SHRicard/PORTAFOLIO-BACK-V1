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
  listarPublicas,
  obtenerAdmin,
  obtenerPublica,
} from "./blog.controller.js";
import { actualizarEntradaSchema, crearEntradaSchema } from "./blog.schema.js";

const router = Router();

// auditar(...) va primero en cada ruta: así la acción queda nombrada en los logs aunque falle
// Las rutas /admin van antes de /:slug para que "admin" no se tome como un slug

// Panel (solo el administrador): todos los estados
router.get("/admin", auditar("blog.listar_admin"), authenticate, soloAdmin, listarAdmin);
router.get("/admin/:id", auditar("blog.ver_admin"), authenticate, soloAdmin, obtenerAdmin);

// Públicas: solo entradas publicadas
router.get("/", auditar("blog.listar"), listarPublicas);
router.get("/:slug", auditar("blog.ver"), obtenerPublica);

// Panel (solo el administrador)
router.post(
  "/",
  auditar("blog.crear"), // sin guardar valores: una entrada puede ser un borrador
  authenticate,
  soloAdmin,
  validateBody(crearEntradaSchema),
  crear,
);
router.patch(
  "/:id",
  auditar("blog.actualizar"),
  authenticate,
  soloAdmin,
  validateBody(actualizarEntradaSchema),
  actualizar,
);
router.delete("/:id", auditar("blog.eliminar"), authenticate, soloAdmin, eliminar);

export default router;
