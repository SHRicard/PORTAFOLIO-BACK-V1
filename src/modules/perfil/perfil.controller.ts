import type { RequestHandler } from "express";
import { perfilService } from "./perfil.service.js";

export const obtenerPerfil: RequestHandler = async (_req, res) => {
  const perfil = await perfilService.obtenerPublico();
  res.json({ ok: true, data: { perfil } });
};

export const obtenerPerfilAdmin: RequestHandler = async (_req, res) => {
  const perfil = await perfilService.obtenerAdmin();
  res.json({ ok: true, data: { perfil } });
};

export const guardarPerfil: RequestHandler = async (req, res) => {
  const perfil = await perfilService.guardar(req.body);
  res.json({ ok: true, data: { perfil } });
};

export const actualizarPerfil: RequestHandler = async (req, res) => {
  const perfil = await perfilService.actualizar(req.body);
  res.json({ ok: true, data: { perfil } });
};
