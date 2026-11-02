import type { RequestHandler } from "express";
import { proyectosService } from "./proyectos.service.js";
import { listarAdminQuerySchema, listarPublicosQuerySchema } from "./proyectos.schema.js";
import { idParamSchema, slugParamSchema } from "../../utils/validaciones.js";

export const listarPublicos: RequestHandler = async (req, res) => {
  const query = listarPublicosQuerySchema.parse(req.query);
  const data = await proyectosService.listarPublicos(query);
  res.json({ ok: true, data });
};

export const obtenerPublico: RequestHandler = async (req, res) => {
  const { slug } = slugParamSchema.parse(req.params);
  const proyecto = await proyectosService.obtenerPublico(slug);
  res.json({ ok: true, data: { proyecto } });
};

export const listarAdmin: RequestHandler = async (req, res) => {
  const query = listarAdminQuerySchema.parse(req.query);
  const data = await proyectosService.listarAdmin(query);
  res.json({ ok: true, data });
};

export const obtenerAdmin: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const proyecto = await proyectosService.obtenerAdmin(id);
  res.json({ ok: true, data: { proyecto } });
};

export const crear: RequestHandler = async (req, res) => {
  const proyecto = await proyectosService.crear(req.body);
  res.status(201).json({ ok: true, data: { proyecto } });
};

export const actualizar: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const proyecto = await proyectosService.actualizar(id, req.body);
  res.json({ ok: true, data: { proyecto } });
};

export const reordenar: RequestHandler = async (req, res) => {
  const proyectos = await proyectosService.reordenar(req.body.ids);
  res.json({ ok: true, data: { proyectos } });
};

export const eliminar: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await proyectosService.eliminar(id);
  res.json({ ok: true, data: { id } });
};
