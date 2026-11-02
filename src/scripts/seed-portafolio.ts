import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ZodType } from "zod";
import { env } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { CLAVE_PERFIL, Perfil } from "../modules/perfil/perfil.model.js";
import { guardarPerfilSchema } from "../modules/perfil/perfil.schema.js";
import { Proyecto } from "../modules/proyectos/proyectos.model.js";
import { crearProyectoSchema } from "../modules/proyectos/proyectos.schema.js";
import { Experiencia } from "../modules/experiencia/experiencia.model.js";
import { crearExperienciaSchema } from "../modules/experiencia/experiencia.schema.js";
import { Estudio } from "../modules/estudios/estudios.model.js";
import { crearEstudioSchema } from "../modules/estudios/estudios.schema.js";

/**
 * CARGA DEL PORTAFOLIO
 * --------------------
 * Pasa seed/portafolio.json a la base. Se puede correr más de una vez: lo que ya existe se
 * actualiza y lo que no cambió se deja como está.
 *
 *   npm run seed:portafolio                 carga los datos
 *   npm run seed:portafolio -- --simular    muestra qué haría, sin escribir nada
 *
 * Cómo reconoce lo que ya existe: perfil (documento único), proyectos por slug,
 * experiencia por empresa + puesto + desde, estudios por institución + título.
 *
 * Importante:
 *   - Nunca borra nada y nunca toca las colecciones users ni logs.
 *   - El JSON manda: si después de editar desde el panel volvés a correrlo, pisa esos
 *     cambios (incluidas las URLs de las imágenes que hayas cargado).
 */

const SIMULAR = process.argv.includes("--simular");
const RUTA_SEED = resolve(process.cwd(), "seed/portafolio.json");

interface Documento {
  set(datos: object): unknown;
  isModified(): boolean;
  save(): Promise<unknown>;
}

/** Cómo se carga cada bloque del JSON */
interface Bloque<D> {
  titulo: string;
  items: unknown[];
  schema: ZodType<D>;
  nombre: (item: D) => string;
  buscar: (item: D) => PromiseLike<Documento | null>;
  crear: (item: D) => Promise<unknown>;
}

const totales = { creados: 0, actualizados: 0, sinCambios: 0, errores: 0 };

function reportarError(nombre: string, detalle: string) {
  totales.errores++;
  console.error(`  ✗ ${nombre}: ${detalle}`);
}

async function cargarBloque<D extends object>({ titulo, items, schema, nombre, buscar, crear }: Bloque<D>) {
  console.log(`\n${titulo} (${items.length})`);

  for (const [i, item] of items.entries()) {
    const validacion = schema.safeParse(item);
    if (!validacion.success) {
      const detalle = validacion.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      reportarError(`${titulo}[${i}]`, detalle);
      continue;
    }

    const datos = validacion.data;
    try {
      const existente = await buscar(datos);

      if (!existente) {
        if (!SIMULAR) await crear(datos);
        totales.creados++;
        console.log(`  + ${nombre(datos)}`);
        continue;
      }

      existente.set(datos);
      if (!existente.isModified()) {
        totales.sinCambios++;
        console.log(`  = ${nombre(datos)}`);
        continue;
      }

      if (!SIMULAR) await existente.save();
      totales.actualizados++;
      console.log(`  ~ ${nombre(datos)}`);
    } catch (err) {
      reportarError(nombre(datos), err instanceof Error ? err.message : String(err));
    }
  }
}

function leerSeed() {
  try {
    return JSON.parse(readFileSync(RUTA_SEED, "utf8"));
  } catch (err) {
    throw new Error(`No se pudo leer ${RUTA_SEED}: ${err instanceof Error ? err.message : err}`);
  }
}

/** Host y base de la conexión, sin usuario ni contraseña */
const destino = () =>
  env.MONGODB_URI.replace(/^mongodb(\+srv)?:\/\//, "")
    .replace(/^.*@/, "")
    .split("?")[0];

async function main() {
  const seed = leerSeed();

  console.log(`Base: ${destino()}`);
  console.log(SIMULAR ? "Modo simulación: no se escribe nada" : "Cargando datos...");

  await connectDatabase();

  try {
    await cargarBloque({
      titulo: "Perfil",
      items: [seed.perfil],
      schema: guardarPerfilSchema,
      nombre: (p) => p.nombreVisible,
      buscar: () => Perfil.findOne({ clave: CLAVE_PERFIL }),
      crear: (p) => Perfil.create(p),
    });

    await cargarBloque({
      titulo: "Proyectos",
      items: seed.proyectos ?? [],
      schema: crearProyectoSchema,
      nombre: (p) => p.titulo,
      buscar: (p) => Proyecto.findOne({ slug: p.slug }),
      crear: (p) => Proyecto.create(p),
    });

    await cargarBloque({
      titulo: "Experiencia",
      items: seed.experiencia ?? [],
      schema: crearExperienciaSchema,
      nombre: (e) => `${e.puesto} en ${e.empresa}`,
      buscar: (e) => Experiencia.findOne({ empresa: e.empresa, puesto: e.puesto, desde: e.desde }),
      crear: (e) => Experiencia.create(e),
    });

    await cargarBloque({
      titulo: "Estudios",
      items: seed.estudios ?? [],
      schema: crearEstudioSchema,
      nombre: (e) => `${e.titulo} (${e.institucion})`,
      buscar: (e) => Estudio.findOne({ institucion: e.institucion, titulo: e.titulo }),
      crear: (e) => Estudio.create(e),
    });
  } finally {
    await disconnectDatabase();
  }

  const verbo = SIMULAR ? "Se crearían" : "Creados";
  console.log(
    `\n${verbo}: ${totales.creados} · ${SIMULAR ? "Se actualizarían" : "Actualizados"}: ${totales.actualizados}` +
      ` · Sin cambios: ${totales.sinCambios} · Errores: ${totales.errores}`,
  );
  if (totales.errores > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("❌ No se pudo completar la carga:", err instanceof Error ? err.message : err);
  process.exit(1);
});
