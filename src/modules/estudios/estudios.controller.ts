import type { RequestHandler } from "express";
import { estudiosService } from "./estudios.service.js";
import { listarAdminQuerySchema, listarPublicosQuerySchema } from "./estudios.schema.js";
import { idParamSchema } from "../../utils/validaciones.js";

export const listarPublicos: RequestHandler = async (req, res) => {
  const query = listarPublicosQuerySchema.parse(req.query);
  const data = await estudiosService.listarPublicos(query);
  res.json({ ok: true, data });
};

export const listarAdmin: RequestHandler = async (req, res) => {
  const query = listarAdminQuerySchema.parse(req.query);
  const data = await estudiosService.listarAdmin(query);
  res.json({ ok: true, data });
};

export const crear: RequestHandler = async (req, res) => {
  const estudio = await estudiosService.crear(req.body);
  res.status(201).json({ ok: true, data: { estudio } });
};

export const actualizar: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const estudio = await estudiosService.actualizar(id, req.body);
  res.json({ ok: true, data: { estudio } });
};

export const eliminar: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await estudiosService.eliminar(id);
  res.json({ ok: true, data: { id } });
};
