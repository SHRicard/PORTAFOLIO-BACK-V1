/**
 * OPCIONES DE PREFERENCIAS DEL FRONT
 * ----------------------------------
 * Única fuente de verdad de las preferencias visuales del usuario. De acá salen:
 *   - el modelo de Mongoose (user.model.ts)
 *   - la validación con Zod (user.schema.ts)
 *   - los valores por defecto y el reset
 *   - el endpoint GET /api/users/preferences/options (lo que usa el panel para armar los selects)
 *
 * Para agregar algo nuevo, se toca SOLO este archivo:
 *   - Un valor (una fuente, un tipo de card): sumalo a su lista.
 *   - Un campo: agregalo a su grupo con opcion(...) o color(...).
 *   - Un grupo entero: agregá una clave nueva en PREFERENCIAS con su etiqueta y sus campos.
 *
 * Los usuarios que ya existen reciben el valor por defecto de lo nuevo al leerlos.
 * Si quitás un valor de una lista, los usuarios que lo tenían guardado van a fallar la
 * validación al actualizar: conviene migrarlos antes.
 */

type ValorOpcion = string | number;

/** Campo que se elige de una lista cerrada (un select en el panel) */
export interface CampoOpcion<V extends ValorOpcion = ValorOpcion> {
  tipo: "opcion";
  etiqueta: string;
  valores: readonly V[];
  porDefecto: V;
}

/** Campo de color en formato #RRGGBB (un color picker en el panel) */
export interface CampoColor {
  tipo: "color";
  etiqueta: string;
  porDefecto: string;
}

export type CampoPreferencia = CampoOpcion | CampoColor;

export interface GrupoPreferencias {
  etiqueta: string;
  campos: Record<string, CampoPreferencia>;
}

/** Formato de color aceptado: #RRGGBB */
export const COLOR_HEX = /^#[0-9a-fA-F]{6}$/;

// `porDefecto` tiene que ser uno de los `valores`: si no, no compila
const opcion = <const V extends ValorOpcion>(
  etiqueta: string,
  valores: readonly V[],
  porDefecto: NoInfer<V>,
): CampoOpcion<V> => ({ tipo: "opcion", etiqueta, valores, porDefecto });

const color = (etiqueta: string, porDefecto: string): CampoColor => ({ tipo: "color", etiqueta, porDefecto });

// Listas compartidas por varios campos
export const FUENTES = [
  "Inter",
  "Poppins",
  "Roboto",
  "Montserrat",
  "Playfair Display",
  "Lora",
  "Space Grotesk",
  "System",
] as const;
const RADIOS = ["ninguno", "sm", "md", "lg", "completo"] as const;

export const PREFERENCIAS = {
  tema: {
    etiqueta: "Tema",
    campos: {
      modo: opcion("Modo", ["claro", "oscuro", "sistema"], "sistema"),
      colorPrimario: color("Color primario", "#4f46e5"),
      colorSecundario: color("Color secundario", "#0ea5e9"),
      colorFondo: color("Color de fondo", "#ffffff"),
      colorTexto: color("Color del texto", "#111827"),
    },
  },
  tipografia: {
    etiqueta: "Tipografía",
    campos: {
      fuenteTitulo: opcion("Fuente de los títulos", FUENTES, "Poppins"),
      tamanoTitulo: opcion("Tamaño de los títulos", ["sm", "md", "lg", "xl"], "lg"),
      pesoTitulo: opcion("Peso de los títulos", ["normal", "medio", "negrita"], "negrita"),
      fuenteSubtitulo: opcion("Fuente de los subtítulos", FUENTES, "Inter"),
      tamanoSubtitulo: opcion("Tamaño de los subtítulos", ["sm", "md", "lg"], "md"),
      fuenteTexto: opcion("Fuente del texto", FUENTES, "Inter"),
      tamanoTexto: opcion("Tamaño del texto", ["sm", "md", "lg"], "md"),
    },
  },
  cards: {
    etiqueta: "Cards",
    campos: {
      tipo: opcion("Tipo", ["simple", "borde", "sombra", "vidrio", "minimal"], "sombra"),
      radioBordes: opcion("Radio de los bordes", RADIOS, "md"),
      sombra: opcion("Sombra", ["ninguna", "suave", "media", "fuerte"], "suave"),
      espaciado: opcion("Espaciado", ["compacto", "normal", "amplio"], "normal"),
      columnas: opcion("Columnas", [1, 2, 3, 4], 3),
    },
  },
  botones: {
    etiqueta: "Botones",
    campos: {
      estilo: opcion("Estilo", ["solido", "contorno", "texto"], "solido"),
      radioBordes: opcion("Radio de los bordes", RADIOS, "md"),
    },
  },
  layout: {
    etiqueta: "Layout",
    campos: {
      anchoMaximo: opcion("Ancho máximo", ["angosto", "normal", "ancho", "completo"], "normal"),
      densidad: opcion("Densidad", ["compacta", "normal", "comoda"], "normal"),
      navegacion: opcion("Navegación", ["superior", "lateral"], "superior"),
    },
  },
} satisfies Record<string, GrupoPreferencias>;

// ---------------------------------------------------------------------------
// Todo lo de abajo se deriva de PREFERENCIAS: no hace falta tocarlo
// ---------------------------------------------------------------------------

type Grupos = typeof PREFERENCIAS;
type ValorDe<C> = C extends CampoOpcion<infer V> ? V : string;

/** Forma completa de las preferencias de un usuario */
export type Preferencias = {
  [G in keyof Grupos]: { [C in keyof Grupos[G]["campos"]]: ValorDe<Grupos[G]["campos"][C]> };
};

/** Actualización parcial: cualquier grupo y cualquier campo dentro de él */
export type PreferenciasParciales = { [G in keyof Preferencias]?: Partial<Preferencias[G]> };

/**
 * Arma un objeto con la misma forma que PREFERENCIAS ({ grupo: { campo } }):
 * `campo` convierte cada campo y `grupo` envuelve los campos ya convertidos de cada grupo.
 * Lo usan el modelo (subesquemas de Mongoose) y la validación (objetos de Zod).
 */
export function mapearPreferencias<C, G>(
  campo: (def: CampoPreferencia) => C,
  grupo: (campos: Record<string, C>) => G,
): Record<string, G> {
  const grupos: Record<string, GrupoPreferencias> = PREFERENCIAS;
  return Object.fromEntries(
    Object.entries(grupos).map(([clave, { campos }]) => [
      clave,
      grupo(Object.fromEntries(Object.entries(campos).map(([nombre, def]) => [nombre, campo(def)]))),
    ]),
  );
}

/** Preferencias por defecto (objeto nuevo en cada llamada, para que nadie modifique el original) */
export function preferenciasPorDefecto(): Preferencias {
  return mapearPreferencias(
    (def) => def.porDefecto,
    (campos) => campos,
  ) as Preferencias;
}
