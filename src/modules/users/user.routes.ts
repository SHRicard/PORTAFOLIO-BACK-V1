import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import { auditar } from "../logs/log.middleware.js";
import {
  getMe,
  getMyPreferences,
  getPreferenceOptions,
  login,
  register,
  resetMyPreferences,
  updateMe,
  updateMyPreferences,
} from "./user.controller.js";
import { loginSchema, registerSchema, updatePreferencesSchema, updateProfileSchema } from "./user.schema.js";

const router = Router();

// Máximo 10 intentos de login/registro cada 15 minutos por IP (anti fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Demasiados intentos. Probá de nuevo en unos minutos." },
});

// auditar(...) va primero en cada ruta: así la acción queda nombrada en los logs aunque falle

// Públicas (en los logs se guarda el correo, para poder rastrear intentos fallidos)
router.post(
  "/register",
  auditar("usuario.registro", { guardar: ["correo"] }),
  authLimiter,
  validateBody(registerSchema),
  register,
);
router.post(
  "/login",
  auditar("usuario.login", { guardar: ["correo"] }),
  authLimiter,
  validateBody(loginSchema),
  login,
);

// Privadas (requieren token)
router.get("/me", auditar("usuario.ver_perfil"), authenticate, getMe);
router.put("/me", auditar("usuario.actualizar_perfil"), authenticate, validateBody(updateProfileSchema), updateMe);

// Preferencias visuales del front (privadas)
router.get("/me/preferences", auditar("preferencias.ver"), authenticate, getMyPreferences);
router.put(
  "/me/preferences",
  auditar("preferencias.actualizar"),
  authenticate,
  validateBody(updatePreferencesSchema),
  updateMyPreferences,
);
router.post("/me/preferences/reset", auditar("preferencias.restablecer"), authenticate, resetMyPreferences);
router.get("/preferences/options", auditar("preferencias.ver_opciones"), authenticate, getPreferenceOptions);

export default router;
