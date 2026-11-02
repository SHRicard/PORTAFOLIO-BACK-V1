import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { logConsola } from "./middlewares/logConsola.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins, // solo tu front puede llamar a la API desde el navegador
      credentials: true,
    }),
  );
  app.use(logConsola); // después de cors: las verificaciones previas del navegador (OPTIONS) no se muestran
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
