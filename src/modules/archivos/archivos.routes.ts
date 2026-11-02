import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import { auditar } from "../logs/log.middleware.js";
import { soloAdmin } from "../users/admin.middleware.js";
import { eliminar, firmarSubida, listar, registrar } from "./archivos.controller.js";
import { firmarSubidaSchema, registrarArchivoSchema } from "./archivos.schema.js";

const router = Router();

// auditar(...) va primero en cada ruta: así la acción queda nombrada en los logs aunque falle
// Todo el servicio es del panel (solo el administrador)

router.post(
  "/firma",
  auditar("archivos.firmar", { guardar: ["tipo", "carpeta"] }),
  authenticate,
  soloAdmin,
  validateBody(firmarSubidaSchema),
  firmarSubida,
);
router.post(
  "/",
  auditar("archivos.registrar", { guardar: ["publicId"] }),
  authenticate,
  soloAdmin,
  validateBody(registrarArchivoSchema),
  registrar,
);
router.get("/", auditar("archivos.listar"), authenticate, soloAdmin, listar);
router.delete("/:id", auditar("archivos.eliminar"), authenticate, soloAdmin, eliminar);

export default router;
