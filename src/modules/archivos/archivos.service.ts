import { createHash, randomBytes } from "node:crypto";
import { Archivo, REGLAS_ARCHIVO } from "./archivos.model.js";
import { AppError } from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import { firmarFormularioS3, urlBucket, urlFirmadaS3, urlObjeto, type CredencialesS3 } from "../../utils/s3.js";
import { metaPaginacion, slugDesde } from "../../utils/validaciones.js";
import type { FirmarSubidaInput, ListarArchivosQuery, RegistrarArchivoInput } from "./archivos.schema.js";

const API_CLOUDINARY = "https://api.cloudinary.com/v1_1";
const TIPO_APK = "application/vnd.android.package-archive";
const CARPETA_APK = "apk";

/** Credenciales de Cloudinary. Si faltan en el .env, el servicio responde 503 */
function cloudinary() {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = env;
  if (!cloudName || !apiKey || !apiSecret) throw new AppError(503, "Cloudinary no está configurado en el servidor");
  return { cloudName, apiKey, apiSecret };
}

/** Credenciales de S3. Si faltan en el .env, los APK responden 503 */
function s3(): CredencialesS3 {
  const {
    AWS_S3_BUCKET: bucket,
    AWS_S3_REGION: region,
    AWS_ACCESS_KEY_ID: accessKeyId,
    AWS_SECRET_ACCESS_KEY: secretAccessKey,
  } = env;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new AppError(503, "S3 no está configurado en el servidor");
  }
  return { bucket, region, accessKeyId, secretAccessKey };
}

/**
 * Firma de Cloudinary: los parámetros ordenados por nombre ("a=1&b=2"), seguidos del API secret, en SHA-1.
 * El secret nunca sale del servidor: el panel solo recibe la firma.
 */
export function firmarParametros(parametros: Record<string, string | number>, apiSecret: string) {
  const cadena = Object.keys(parametros)
    .sort()
    .map((clave) => `${clave}=${parametros[clave]}`)
    .join("&");
  return createHash("sha1").update(cadena + apiSecret).digest("hex");
}

const ahora = () => Math.floor(Date.now() / 1000);

/**
 * Firma la subida directa de un APK a S3. La key la elige el backend y siempre queda dentro de apk/.
 * S3 no responde nada al subir: `destino` es lo que el panel registra después.
 */
function firmarApk(carpeta: string | undefined, nombre = "") {
  const credenciales = s3();
  const { formatos, maxBytes } = REGLAS_ARCHIVO.apk;
  const base = slugDesde(nombre.replace(/\.apk$/i, "")) || "app";
  const archivo = `${base}-${randomBytes(3).toString("hex")}.apk`; // sin el sufijo, una versión nueva pisaría la anterior
  const key = `${carpeta?.startsWith(`${CARPETA_APK}/`) ? carpeta : CARPETA_APK}/${archivo}`;

  return {
    urlSubida: urlBucket(credenciales),
    campos: firmarFormularioS3(credenciales, {
      key,
      contentType: TIPO_APK,
      contentDisposition: `attachment; filename="${archivo}"`,
      maxBytes,
    }),
    formatos,
    maxBytes,
    destino: { publicId: key, url: urlObjeto(credenciales, key) },
  };
}

/** Que la URL sea de nuestra cuenta y corresponda al publicId: si no, un DELETE podría borrar otro archivo */
function validarUbicacion({ tipo, publicId, url, formato }: RegistrarArchivoInput) {
  if (tipo === "apk") {
    if (!publicId.startsWith(`${CARPETA_APK}/`) || url !== urlObjeto(s3(), publicId)) {
      throw AppError.badRequest("La URL no pertenece al bucket de S3 del portafolio");
    }
    return;
  }

  const { cloudName } = cloudinary();
  if (!url.startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
    throw AppError.badRequest("La URL no pertenece a la cuenta de Cloudinary del portafolio");
  }
  // La URL de Cloudinary termina en "/<publicId>.<formato>"
  if (!url.endsWith(`/${publicId}.${formato}`)) {
    throw AppError.badRequest("El publicId y el formato no coinciden con la URL");
  }
}

async function borrarDeCloudinary(publicId: string) {
  const { cloudName, apiKey, apiSecret } = cloudinary();
  const parametros = { invalidate: "true", public_id: publicId, timestamp: ahora() };
  const respuesta = await fetch(`${API_CLOUDINARY}/${cloudName}/image/destroy`, {
    method: "POST",
    body: new URLSearchParams({
      ...parametros,
      timestamp: String(parametros.timestamp),
      api_key: apiKey,
      signature: firmarParametros(parametros, apiSecret),
    }),
    signal: AbortSignal.timeout(10_000), // si Cloudinary no responde en 10 s, se corta y responde 502
  }).catch(() => null);

  const resultado = (await respuesta?.json().catch(() => null)) as { result?: string } | null;
  // "not found": ya no estaba en Cloudinary, igual se limpia la biblioteca
  if (resultado?.result !== "ok" && resultado?.result !== "not found") {
    throw new AppError(502, "Cloudinary no pudo borrar el archivo. Probá de nuevo en unos minutos");
  }
}

async function borrarDeS3(key: string) {
  // S3 responde 204 aunque ya no estuviera: igual se limpia la biblioteca
  const respuesta = await fetch(urlFirmadaS3(s3(), "DELETE", key), {
    method: "DELETE",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!respuesta?.ok) throw new AppError(502, "S3 no pudo borrar el archivo. Probá de nuevo en unos minutos");
}

/** La lógica de negocio vive acá. El controlador solo recibe y responde. */
export const archivosService = {
  /**
   * Firma una subida directa del panel a Cloudinary. La firma fija la carpeta y los formatos permitidos,
   * y vence a la hora (regla de Cloudinary).
   */
  firmarSubida({ tipo, carpeta, nombre }: FirmarSubidaInput) {
    if (tipo === "apk") return firmarApk(carpeta, nombre);

    const { cloudName, apiKey, apiSecret } = cloudinary();
    const reglas = REGLAS_ARCHIVO[tipo];
    const parametros = {
      allowed_formats: reglas.formatos.join(","),
      folder: carpeta ? `${env.CLOUDINARY_CARPETA}/${carpeta}` : env.CLOUDINARY_CARPETA,
      timestamp: ahora(),
    };

    return {
      // Las imágenes y los PDF se suben como "image" (así Cloudinary también puede mostrar los PDF)
      urlSubida: `${API_CLOUDINARY}/${cloudName}/image/upload`,
      campos: { ...parametros, api_key: apiKey, signature: firmarParametros(parametros, apiSecret) },
      formatos: reglas.formatos,
      maxBytes: reglas.maxBytes,
    };
  },

  /** Guarda en la biblioteca un archivo que el panel ya subió a Cloudinary o a S3 */
  async registrar(input: RegistrarArchivoInput) {
    validarUbicacion(input);
    const archivo = await Archivo.create(input);
    return archivo.toJSON();
  },

  async listar({ page, limit, tipo }: ListarArchivosQuery) {
    const filtro = tipo ? { tipo } : {};
    const [archivos, total] = await Promise.all([
      Archivo.find(filtro)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Archivo.countDocuments(filtro),
    ]);
    return { archivos: archivos.map((a) => a.toJSON()), paginacion: metaPaginacion(page, limit, total) };
  },

  /** Lo borra de donde esté guardado y de la biblioteca. NO quita su URL de los recursos que la usen */
  async eliminar(id: string) {
    const archivo = await Archivo.findById(id);
    if (!archivo) throw AppError.notFound("Archivo no encontrado");

    if (archivo.tipo === "apk") await borrarDeS3(archivo.publicId);
    else await borrarDeCloudinary(archivo.publicId);

    await archivo.deleteOne();
  },
};
