import type { RequestHandler } from "express";
import { archivosService } from "./archivos.service.js";
import { listarArchivosQuerySchema } from "./archivos.schema.js";
import { idParamSchema } from "../../utils/validaciones.js";

export const firmarSubida: RequestHandler = async (req, res) => {
  const firma = archivosService.firmarSubida(req.body);
  res.json({ ok: true, data: { firma } });
};

export const registrar: RequestHandler = async (req, res) => {
  const archivo = await archivosService.registrar(req.body);
  res.status(201).json({ ok: true, data: { archivo } });
};

export const listar: RequestHandler = async (req, res) => {
  const query = listarArchivosQuerySchema.parse(req.query);
  const data = await archivosService.listar(query);
  res.json({ ok: true, data });
};

export const eliminar: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await archivosService.eliminar(id);
  res.json({ ok: true, data: { id } });
};
