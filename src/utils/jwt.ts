import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface TokenPayload {
  sub: string; // id del usuario
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies TokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    throw new Error("Token inválido");
  }
  return { sub: decoded.sub };
}
