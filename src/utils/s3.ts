import { createHash, createHmac } from "node:crypto";

export interface CredencialesS3 {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

const ALGORITMO = "AWS4-HMAC-SHA256";

const hmac = (clave: string | Buffer, texto: string) => createHmac("sha256", clave).update(texto).digest();

/**
 * Firma de AWS (Signature Version 4). La clave se deriva del secret y vale para un día,
 * una región y un servicio, así el secret nunca sale del servidor.
 */
function firmar({ secretAccessKey, region }: CredencialesS3, dia: string, texto: string) {
  const claveDia = hmac(`AWS4${secretAccessKey}`, dia);
  const claveRegion = hmac(claveDia, region);
  const claveServicio = hmac(claveRegion, "s3");
  return hmac(hmac(claveServicio, "aws4_request"), texto).toString("hex");
}

/** "2013-05-24T00:00:00.000Z" -> "20130524T000000Z" */
const fechaAws = (fecha: Date) => fecha.toISOString().replace(/[-:]|\.\d{3}/g, "");

const alcance = (dia: string, region: string) => `${dia}/${region}/s3/aws4_request`;

export const urlBucket = ({ bucket, region }: CredencialesS3) => `https://${bucket}.s3.${region}.amazonaws.com`;

/** URL pública del objeto. Las keys las arma el backend: solo llevan minúsculas, números, guiones, puntos y / */
export const urlObjeto = (credenciales: CredencialesS3, key: string) => `${urlBucket(credenciales)}/${key}`;

interface OpcionesFormulario {
  key: string;
  contentType: string;
  /** Con `attachment`, el navegador descarga el archivo en vez de intentar abrirlo */
  contentDisposition: string;
  maxBytes: number;
  expiraEnSegundos?: number;
  ahora?: Date;
}

/**
 * Campos firmados para subir directo desde el navegador (POST multipart al bucket).
 * La política fija la key, el tipo y el tamaño máximo: S3 rechaza cualquier otra cosa.
 */
export function firmarFormularioS3(
  credenciales: CredencialesS3,
  { key, contentType, contentDisposition, maxBytes, expiraEnSegundos = 3600, ahora = new Date() }: OpcionesFormulario,
) {
  const fecha = fechaAws(ahora);
  const dia = fecha.slice(0, 8);
  const campos = {
    key,
    "Content-Type": contentType,
    "Content-Disposition": contentDisposition,
    "x-amz-algorithm": ALGORITMO,
    "x-amz-credential": `${credenciales.accessKeyId}/${alcance(dia, credenciales.region)}`,
    "x-amz-date": fecha,
  };

  const politica = Buffer.from(
    JSON.stringify({
      expiration: new Date(ahora.getTime() + expiraEnSegundos * 1000).toISOString(),
      conditions: [
        { bucket: credenciales.bucket },
        ...Object.entries(campos).map(([campo, valor]) => ({ [campo]: valor })),
        ["content-length-range", 1, maxBytes],
      ],
    }),
  ).toString("base64");

  return { ...campos, policy: politica, "x-amz-signature": firmar(credenciales, dia, politica) };
}

interface OpcionesUrl {
  /** Por defecto, el host del bucket con su región */
  host?: string;
  expiraEnSegundos?: number;
  ahora?: Date;
}

/** URL firmada por poco tiempo para hacer una operación sobre un objeto (ej. DELETE) */
export function urlFirmadaS3(
  credenciales: CredencialesS3,
  metodo: "GET" | "DELETE",
  key: string,
  { host = new URL(urlBucket(credenciales)).host, expiraEnSegundos = 60, ahora = new Date() }: OpcionesUrl = {},
) {
  const fecha = fechaAws(ahora);
  const dia = fecha.slice(0, 8);
  const ambito = alcance(dia, credenciales.region);
  const ruta = `/${key.split("/").map(encodeURIComponent).join("/")}`;
  const query = new URLSearchParams({
    "X-Amz-Algorithm": ALGORITMO,
    "X-Amz-Credential": `${credenciales.accessKeyId}/${ambito}`,
    "X-Amz-Date": fecha,
    "X-Amz-Expires": String(expiraEnSegundos),
    "X-Amz-SignedHeaders": "host",
  }).toString();

  const pedido = [metodo, ruta, query, `host:${host}`, "", "host", "UNSIGNED-PAYLOAD"].join("\n");
  const textoAFirmar = [ALGORITMO, fecha, ambito, createHash("sha256").update(pedido).digest("hex")].join("\n");

  return `https://${host}${ruta}?${query}&X-Amz-Signature=${firmar(credenciales, dia, textoAFirmar)}`;
}
