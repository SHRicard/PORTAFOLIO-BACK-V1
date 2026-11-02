import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { createApp } from "./app.js";

async function main() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, (error) => {
    // Express también llama acá si no pudo abrir el puerto: sin esto diría que la API está lista cuando no lo está
    if (error) {
      const enUso = (error as NodeJS.ErrnoException).code === "EADDRINUSE";
      console.error(
        enUso
          ? `❌ El puerto ${env.PORT} ya está en uso: fijate si tenés otro "npm run dev" abierto o suspendido`
          : `❌ No se pudo abrir el puerto ${env.PORT}: ${error.message}`,
      );
      process.exit(1);
    }
    console.log(`🚀 API lista en http://localhost:${env.PORT}/api  (${env.NODE_ENV})`);
  });

  // Cierre ordenado (Ctrl+C o cuando el hosting reinicia el servicio)
  const shutdown = (signal: string) => {
    console.log(`\n${signal} recibido, cerrando...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("❌ No se pudo iniciar el servidor:", err);
  process.exit(1);
});
