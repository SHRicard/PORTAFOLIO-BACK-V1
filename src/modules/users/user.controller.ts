import type { RequestHandler } from "express";
import { userService } from "./user.service.js";
import { AppError } from "../../utils/AppError.js";
import { env } from "../../config/env.js";

export const register: RequestHandler = async (req, res) => {
  if (!env.ALLOW_REGISTRATION) throw AppError.forbidden("El registro está deshabilitado");
  const data = await userService.register(req.body);
  res.status(201).json({ ok: true, data });
};

export const login: RequestHandler = async (req, res) => {
  const data = await userService.login(req.body);
  res.json({ ok: true, data });
};

export const getMe: RequestHandler = async (req, res) => {
  const user = await userService.getById(req.userId!);
  res.json({ ok: true, data: { user } });
};

export const updateMe: RequestHandler = async (req, res) => {
  const user = await userService.updateProfile(req.userId!, req.body);
  res.json({ ok: true, data: { user } });
};

export const getMyPreferences: RequestHandler = async (req, res) => {
  const preferencias = await userService.getPreferences(req.userId!);
  res.json({ ok: true, data: { preferencias } });
};

export const updateMyPreferences: RequestHandler = async (req, res) => {
  const preferencias = await userService.updatePreferences(req.userId!, req.body);
  res.json({ ok: true, data: { preferencias } });
};

export const resetMyPreferences: RequestHandler = async (req, res) => {
  const preferencias = await userService.resetPreferences(req.userId!);
  res.json({ ok: true, data: { preferencias } });
};

export const getPreferenceOptions: RequestHandler = async (_req, res) => {
  res.json({ ok: true, data: userService.getPreferenceOptions() });
};
