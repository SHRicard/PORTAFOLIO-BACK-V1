# Portafolio · Backend

Este es mi portafolio: el lugar donde va a estar toda mi identidad digital. Acá reúno quién soy, mis proyectos, mi experiencia, mis estudios, mis pasatiempos y lo que voy escribiendo, todo en un solo sitio y administrado por mí.

Este repositorio es la **lógica**: la API que guarda el contenido y se lo entrega al front. El **front** lo estoy construyendo ahora en [PORTAFOLIO-FRONT-V1](https://github.com/SHRicard/PORTAFOLIO-FRONT-V1).

## Qué contiene el portafolio

| Sección | Qué muestra | Servicio |
|---|---|---|
| Sobre mí | Nombre, rol, bio, ubicación, disponibilidad, foto y CV | Perfil |
| Habilidades e idiomas | Habilidades por categoría (front, back, mobile, base de datos, diseño, herramientas) e idiomas con su nivel | Perfil |
| Pasatiempos y datos curiosos | Lo que hago en mi tiempo libre y datos personales o profesionales sobre mí | Perfil (`datosCuriosos`) |
| Proyectos | Rol, tecnologías, enlaces, galería y documentos de cada proyecto, con destacados y orden propio | Proyectos |
| Experiencia | Mis trabajos, del más reciente al más viejo | Experiencia |
| Estudios | Mi formación, del más reciente al más viejo | Estudios |
| Blog | Publicaciones con fotos y archivos adjuntos | Blog |
| Contacto y redes | Correo de contacto y enlaces a GitHub, LinkedIn y otras redes | Perfil |

## Cómo funciona

Hay un solo contenido y dos formas de usarlo:

| Quién | Qué hace | Acceso |
|---|---|---|
| Visitantes | Ven el portafolio. Puede tener varios diseños (mini-portafolios) que leen los mismos datos | Público, solo lectura |
| Yo | Cargo y edito todo desde un panel de administración: contenido, imágenes, PDF, APK y orden de los proyectos | Token de la cuenta de `ADMIN_CORREO` |

Lo que no está publicado, como borradores, elementos ocultos o archivos pendientes, no llega a la vista pública.

## Tecnologías

### Backend (este repositorio)

| Tecnología | Para qué la uso |
|---|---|
| Node.js 20+ y TypeScript 7 | Entorno de ejecución y lenguaje |
| Express 5 | Servidor y API REST |
| MongoDB y Mongoose 9 | Base de datos y modelos |
| Zod 4 | Validación de lo que entra por la API y de las variables de entorno |
| JSON Web Tokens y bcryptjs | Sesión y contraseñas |
| helmet, cors y express-rate-limit | Cabeceras de seguridad, orígenes permitidos y límite de intentos |
| Cloudinary | Imágenes y PDF |
| Amazon S3 | APK de los proyectos |
| dotenv y tsx | Variables de entorno y desarrollo con recarga |

Cloudinary y S3 se usan sin SDK: el backend firma las subidas con `node:crypto` y el panel sube directo a cada servicio.

### Frontend (en desarrollo)

| Tecnología | Para qué la uso |
|---|---|
| React 19 y TypeScript 7 | Interfaz y lenguaje |
| Vite 8 | Servidor de desarrollo y compilación |
| Tailwind CSS 4 | Estilos |
| Redux Toolkit 2 (RTK Query) | Estado y llamadas a la API |
| React Router 8 | Navegación |
| React Hook Form 7 y Zod 4 | Formularios y validación |
| lucide-react | Íconos |
| Vitest 5 | Tests |

## Puesta en marcha

Requisitos: Node.js 20 o superior y una base MongoDB, local o en Atlas.

```bash
npm install
cp .env.example .env      # completar MONGODB_URI, JWT_SECRET y ADMIN_CORREO (Cloudinary y S3 para subir archivos)
npm run dev               # http://localhost:4000/api
```

Generar un `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Scripts: `dev` (desarrollo) · `build` (compila a `dist/`) · `start` (corre lo compilado) · `typecheck` · `seed:portafolio` (carga `seed/portafolio.json` en la base).

### Cargar el contenido

```bash
npm run seed:portafolio -- --simular   # muestra qué haría, sin escribir nada
npm run seed:portafolio                # carga: crea lo que falta y actualiza lo que cambió
```

Se puede correr varias veces sin duplicar, nunca borra nada y no toca `users` ni `logs`. **El JSON manda**: si lo corrés después de editar desde el panel, pisa esos cambios (incluidas las URLs de las imágenes).

`seed/` guarda mis datos personales y no se sube al repositorio. Sin `seed/portafolio.json` el comando termina con error.

## Servicios

> Las reglas del proyecto ([`CLAUDE.md`](./CLAUDE.md)) y la documentación de cada servicio (`docs/`) son locales y no se suben al repositorio: estos enlaces solo abren en mi copia.

| Servicio | Módulo | Rutas base | Documentación |
|---|---|---|---|
| Login (registro, login y perfil) | `src/modules/users` | `/api/users` | [docs/LOGIN.md](./docs/LOGIN.md) |
| Preferencias (apariencia del front) | `src/modules/users` | `/api/users/me/preferences` · `/api/users/preferences/options` | [docs/PREFERENCES.md](./docs/PREFERENCES.md) |
| Logs (auditoría de cada petición) | `src/modules/logs` | — (solo registra, sin endpoints todavía) | [docs/LOGS.md](./docs/LOGS.md) |
| Perfil (datos públicos del portafolio, documento único) | `src/modules/perfil` | `/api/perfil` | [docs/PERFIL.md](./docs/PERFIL.md) |
| Proyectos (con estados, orden y vista pública) | `src/modules/proyectos` | `/api/proyectos` | [docs/PROYECTOS.md](./docs/PROYECTOS.md) |
| Experiencia (trabajos, con opción de ocultar) | `src/modules/experiencia` | `/api/experiencia` | [docs/EXPERIENCIA.md](./docs/EXPERIENCIA.md) |
| Estudios (formación, con opción de ocultar) | `src/modules/estudios` | `/api/estudios` | [docs/ESTUDIOS.md](./docs/ESTUDIOS.md) |
| Archivos (subida firmada a Cloudinary y a S3, y biblioteca) | `src/modules/archivos` | `/api/archivos` | [docs/ARCHIVOS.md](./docs/ARCHIVOS.md) |
| Blog (publicaciones con fotos y archivos adjuntos) | `src/modules/blog` | `/api/blog` | [docs/BLOG.md](./docs/BLOG.md) |

> Cada servicio nuevo se agrega a esta tabla junto con su documento `docs/<SERVICIO>.md`.
> Guía general del portafolio para el front (qué consume cada mini-portafolio y qué usa el panel): [docs/PORTAFOLIO.md](./docs/PORTAFOLIO.md).
> Implementación mínima de la lectura pública en React, todo como texto y sin estilos: [docs/IMPLEMENTACION_ME.md](./docs/IMPLEMENTACION_ME.md).
> Opciones de preferencias (fuentes, tipos de card, grupos nuevos): se editan **solo** en `src/modules/users/preferences.options.ts`.

## Endpoints (resumen)

Base: `http://localhost:4000/api`

| Método | Ruta | Auth | Servicio | Descripción |
|---|---|---|---|---|
| GET | `/health` | no | núcleo | Estado del servidor |
| POST | `/users/register` | no | Login | Crea cuenta y devuelve token |
| POST | `/users/login` | no | Login | Inicia sesión (token + usuario) |
| GET | `/users/me` | Bearer | Login | Perfil del usuario logueado (incluye preferencias) |
| PUT | `/users/me` | Bearer | Login | Actualiza el perfil (parcial) |
| GET | `/users/me/preferences` | Bearer | Preferencias | Mis preferencias completas |
| PUT | `/users/me/preferences` | Bearer | Preferencias | Actualiza preferencias (parcial, sin pisar lo no enviado) |
| POST | `/users/me/preferences/reset` | Bearer | Preferencias | Vuelve a los valores por defecto |
| GET | `/users/preferences/options` | Bearer | Preferencias | Opciones disponibles para armar el panel |
| GET | `/perfil` | no | Perfil | Perfil público (sin foto ni CV pendientes) |
| GET | `/perfil/admin` | Admin | Perfil | Perfil tal cual está guardado |
| PUT | `/perfil` | Admin | Perfil | Crea o reemplaza el perfil completo |
| PATCH | `/perfil` | Admin | Perfil | Actualiza campos sueltos del perfil |
| GET | `/proyectos` | no | Proyectos | Proyectos publicados, en orden (`?destacado=`, paginado) |
| GET | `/proyectos/:slug` | no | Proyectos | Un proyecto publicado |
| GET | `/proyectos/admin` | Admin | Proyectos | Todos los proyectos, cualquier estado (`?estado=`) |
| GET | `/proyectos/admin/:id` | Admin | Proyectos | Un proyecto, cualquier estado |
| POST | `/proyectos` | Admin | Proyectos | Crea un proyecto (slug y orden automáticos) |
| PUT | `/proyectos/orden` | Admin | Proyectos | Reordena todos los proyectos (drag & drop) |
| PATCH | `/proyectos/:id` | Admin | Proyectos | Actualiza un proyecto |
| DELETE | `/proyectos/:id` | Admin | Proyectos | Borra un proyecto |
| GET | `/experiencia` | no | Experiencia | Trabajos publicados, del más reciente al más viejo |
| GET | `/experiencia/admin` | Admin | Experiencia | Todos los trabajos (`?publicado=`) |
| POST | `/experiencia` | Admin | Experiencia | Crea un trabajo |
| PATCH | `/experiencia/:id` | Admin | Experiencia | Actualiza un trabajo |
| DELETE | `/experiencia/:id` | Admin | Experiencia | Borra un trabajo |
| GET | `/estudios` | no | Estudios | Estudios publicados, del más reciente al más viejo |
| GET | `/estudios/admin` | Admin | Estudios | Todos los estudios (`?publicado=`) |
| POST | `/estudios` | Admin | Estudios | Crea un estudio |
| PATCH | `/estudios/:id` | Admin | Estudios | Actualiza un estudio |
| DELETE | `/estudios/:id` | Admin | Estudios | Borra un estudio |
| POST | `/archivos/firma` | Admin | Archivos | Firma una subida directa a Cloudinary o, si es un APK, a S3 |
| POST | `/archivos` | Admin | Archivos | Registra en la biblioteca un archivo ya subido |
| GET | `/archivos` | Admin | Archivos | Biblioteca de archivos (`?tipo=`, paginado) |
| DELETE | `/archivos/:id` | Admin | Archivos | Borra el archivo de Cloudinary o de S3, y de la biblioteca |
| GET | `/blog` | no | Blog | Entradas publicadas, de la más nueva a la más vieja (paginado) |
| GET | `/blog/:slug` | no | Blog | Una entrada publicada, con su contenido |
| GET | `/blog/admin` | Admin | Blog | Todas las entradas, cualquier estado (`?estado=`) |
| GET | `/blog/admin/:id` | Admin | Blog | Una entrada, cualquier estado |
| POST | `/blog` | Admin | Blog | Crea una entrada (slug automático) |
| PATCH | `/blog/:id` | Admin | Blog | Actualiza una entrada |
| DELETE | `/blog/:id` | Admin | Blog | Borra una entrada |

> **Admin** = `Authorization: Bearer <token>` de un usuario cuyo correo sea `ADMIN_CORREO`. Cualquier otro usuario recibe `403`.
> Todas las peticiones a `/api` (salvo `/health`) quedan registradas en la colección `logs` y muestran una línea en la consola, con su resultado y el motivo si fallaron. Ver [docs/LOGS.md](./docs/LOGS.md).

Ejemplo con curl (cambiar solo el color primario y las columnas de las cards):

```bash
curl -X PUT http://localhost:4000/api/users/me/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "tema": { "colorPrimario": "#ff0000" }, "cards": { "columnas": 2 } }'
# -> { "ok": true, "data": { "preferencias": { ...todas, con esos dos campos cambiados } } }
```

## Estructura

```
├── CLAUDE.md             reglas y arquitectura del proyecto (local, no se sube)
├── MANUAL/               manuales de usuario de los proyectos (local, no se sube)
├── .claude/skills/       new-service, security-review y docs-sync (local, no se sube)
├── docs/                 un .md por servicio + _TEMPLATE.md (local, no se sube)
├── seed/                 contenido inicial del portafolio (local, no se sube)
└── src/
    ├── config/           env.ts (variables validadas) y database.ts
    ├── middlewares/      auth, validate, errorHandler, logConsola
    ├── modules/          un módulo por servicio (model, schema, service, controller, routes)
    │                     users/admin.middleware.ts: soloAdmin (edición del portafolio)
    ├── routes/index.ts   registro de módulos
    ├── scripts/          seed-portafolio.ts (carga el contenido en la base)
    ├── utils/            AppError, jwt, s3, validaciones (fechas, URLs, ids y paginación compartidas)
    ├── app.ts            configuración de Express
    └── server.ts         arranque
```

## Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `NODE_ENV` | `development`, `production` o `test` | `development` |
| `PORT` | Puerto del servidor | `4000` |
| `MONGODB_URI` | Cadena de conexión a MongoDB | obligatoria |
| `JWT_SECRET` | Clave para firmar tokens (mín. 32 caracteres, no puede ser el valor de ejemplo) | obligatoria |
| `JWT_EXPIRES_IN` | Vencimiento del token | `7d` |
| `CORS_ORIGIN` | URLs del front permitidas, separadas por coma | `http://localhost:5173` |
| `ALLOW_REGISTRATION` | `true`/`false`: abrir o cerrar el registro | `true` |
| `LOG_RETENTION_DAYS` | Días que se guardan los logs de auditoría antes de borrarse solos | `90` |
| `ADMIN_CORREO` | Correo del único usuario que puede editar el portafolio | obligatoria |
| `CLOUDINARY_CLOUD_NAME` | Cloud name de Cloudinary (subida de imágenes y PDF) | vacía → firmar, registrar y borrar esos archivos responden `503` |
| `CLOUDINARY_API_KEY` | API key de Cloudinary | vacía → `503` |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary (nunca sale del servidor) | vacía → `503` |
| `CLOUDINARY_CARPETA` | Carpeta base en Cloudinary | `portafolio` |
| `AWS_S3_BUCKET` | Bucket de S3 (subida de APK, ver [docs/ARCHIVOS.md](./docs/ARCHIVOS.md)) | vacía → subir o borrar un APK responde `503` |
| `AWS_S3_REGION` | Región del bucket (ej. `sa-east-1`) | vacía → `503` |
| `AWS_ACCESS_KEY_ID` | Access key del usuario de IAM | vacía → `503` |
| `AWS_SECRET_ACCESS_KEY` | Secret de esa access key (nunca sale del servidor) | vacía → `503` |

## Convenciones

- Éxito: `{ "ok": true, "data": ... }` · Error: `{ "ok": false, "message": "...", "details": ... }`
- Rutas privadas: header `Authorization: Bearer <token>`
- Todo el body se valida con Zod antes de llegar al controller

## Seguridad incluida

- Contraseñas con bcrypt, nunca se devuelven
- JWT con vencimiento · límite de intentos en login y registro
- `helmet` y CORS restringido a los orígenes configurados
- `ALLOW_REGISTRATION=false` cierra el registro (útil para un panel privado)
- Edición del portafolio solo para `ADMIN_CORREO` (`soloAdmin`): aunque alguien se registre, recibe `403`
- Vista pública filtrada: solo proyectos y entradas del blog en estado `publicado`, experiencia y estudios con `publicado: true`, y sin imágenes ni links pendientes (URL en `null`)
- Archivos: subida firmada a Cloudinary y a S3 (los secretos nunca salen del servidor), solo JPG, PNG, WebP, PDF y APK (nunca SVG ni HTML)
- Auditoría: cada petición queda registrada (nunca contraseñas; del body solo los valores que cada ruta declara, ver [docs/LOGS.md](./docs/LOGS.md)) y se borra sola a los `LOG_RETENTION_DAYS` días

## Producción

- `NODE_ENV=production`, `JWT_SECRET` largo y único, `CORS_ORIGIN` con el dominio real del front
- `npm run build && npm start`
- Detrás de un proxy (Render, Railway, etc.), agregar `app.set("trust proxy", 1)` en `src/app.ts` para que el límite de intentos y los logs vean la IP real
