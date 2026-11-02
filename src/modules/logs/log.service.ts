import { Log } from "./log.model.js";

export interface NuevoLog {
  accion: string;
  metodo: string;
  ruta: string;
  estado: number;
  exito: boolean;
  usuario?: string;
  detalles?: Record<string, string>;
  camposEnviados?: string[];
  ip?: string;
  userAgent?: string;
  duracionMs: number;
}

export const logService = {
  /**
   * Guarda un log. Nunca lanza: si la base falla, se avisa por consola y la app sigue.
   * (Se llama después de responder, así que un error acá no puede romper la petición)
   */
  async registrar(entrada: NuevoLog) {
    try {
      await Log.create(entrada);
    } catch (err) {
      console.error("⚠️  No se pudo guardar el log de auditoría:", err);
    }
  },
};
