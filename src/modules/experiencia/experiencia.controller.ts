import type { RequestHandler } from "express";
import { experienciaService } from "./experiencia.service.js";
import { listarAdminQuerySchema, listarPublicosQuerySchema } from "./experiencia.schema.js";
import { idParamSchema } from "../../utils/validaciones.js";

export const listarPublicos: RequestHandler = async (req, res) => {
  const query = listarPublicosQuerySchema.parse(req.query);
  const data = await experienciaService.listarPublicos(query);
  res.json({ ok: true, data });
};

export const listarAdmin: RequestHandler = async (req, res) => {
  const query = listarAdminQuerySchema.parse(req.query);
  const data = await experienciaService.listarAdmin(query);
  res.json({ ok: true, data });
};

export const crear: RequestHandler = async (req, res) => {
  const experiencia = await experienciaService.crear(req.body);
  res.status(201).json({ ok: true, data: { experiencia } });
};

export const actualizar: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const experiencia = await experienciaService.actualizar(id, req.body);
  res.json({ ok: true, data: { experiencia } });
};

export const eliminar: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await experienciaService.eliminar(id);
  res.json({ ok: true, data: { id } });
};
