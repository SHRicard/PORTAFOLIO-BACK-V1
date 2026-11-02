import type { RequestHandler } from "express";
import { blogService } from "./blog.service.js";
import { listarAdminQuerySchema, listarPublicasQuerySchema } from "./blog.schema.js";
import { idParamSchema, slugParamSchema } from "../../utils/validaciones.js";

export const listarPublicas: RequestHandler = async (req, res) => {
  const query = listarPublicasQuerySchema.parse(req.query);
  const data = await blogService.listarPublicas(query);
  res.json({ ok: true, data });
};

export const obtenerPublica: RequestHandler = async (req, res) => {
  const { slug } = slugParamSchema.parse(req.params);
  const entrada = await blogService.obtenerPublica(slug);
  res.json({ ok: true, data: { entrada } });
};

export const listarAdmin: RequestHandler = async (req, res) => {
  const query = listarAdminQuerySchema.parse(req.query);
  const data = await blogService.listarAdmin(query);
  res.json({ ok: true, data });
};

export const obtenerAdmin: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const entrada = await blogService.obtenerAdmin(id);
  res.json({ ok: true, data: { entrada } });
};

export const crear: RequestHandler = async (req, res) => {
  const entrada = await blogService.crear(req.body);
  res.status(201).json({ ok: true, data: { entrada } });
};

export const actualizar: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const entrada = await blogService.actualizar(id, req.body);
  res.json({ ok: true, data: { entrada } });
};

export const eliminar: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await blogService.eliminar(id);
  res.json({ ok: true, data: { id } });
};
