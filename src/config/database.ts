import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on("disconnected", () => console.warn("⚠️  MongoDB desconectado"));
  mongoose.connection.on("error", (err) => console.error("❌ Error de MongoDB:", err));

  await mongoose.connect(env.MONGODB_URI);
  console.log("✅ MongoDB conectado");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
