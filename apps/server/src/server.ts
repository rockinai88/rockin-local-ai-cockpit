import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig } from "./config.ts";
import { OllamaClient } from "./ollama/client.ts";
import { readHardware } from "./hardware/service.ts";
import { buildGraph } from "./graph/service.ts";
import { ChatRequestSchema } from "../../../packages/contracts/src/index.ts";
export async function buildServer(
  env: Record<string, string | undefined> = process.env,
) {
  const cfg = loadConfig(env);
  const app = Fastify({ bodyLimit: 256 * 1024, logger: false });
  await app.register(cors, {
    origin: (origin, cb) => {
      if (
        !origin ||
        origin === `http://${cfg.host}:5173` ||
        origin === `http://${cfg.host}:${cfg.port}`
      )
        cb(null, true);
      else cb(new Error("ORIGIN_DENIED"), false);
    },
  });
  app.addHook("onSend", async (_q, r, p) => {
    r.header("x-content-type-options", "nosniff")
      .header("referrer-policy", "no-referrer")
      .header("cache-control", "no-store");
    return p;
  });
  const ollama = new OllamaClient(cfg.ollamaUrl);
  app.get("/api/v1/health", async () => {
    let state: "online" | "offline" = "offline";
    try {
      await ollama.listModels();
      state = "online";
    } catch {}
    return {
      status: state === "online" ? "online" : "degraded",
      ollama: state,
      version: "0.1.0",
    };
  });
  app.get("/api/v1/models", async (_q, r) => {
    try {
      return { models: await ollama.listModels() };
    } catch {
      return r.code(503).send({ code: "OLLAMA_UNAVAILABLE" });
    }
  });
  app.get("/api/v1/system", async () => readHardware());
  app.get("/api/v1/graph", async () => {
    let models: any[] = [];
    try {
      models = await ollama.listModels();
    } catch {}
    return buildGraph(models, await readHardware());
  });
  app.post("/api/v1/chat", async (q, r) => {
    const parsed = ChatRequestSchema.safeParse(q.body);
    if (!parsed.success) return r.code(400).send({ code: "INVALID_REQUEST" });
    try {
      return await ollama.chat(parsed.data);
    } catch {
      return r.code(503).send({ code: "OLLAMA_UNAVAILABLE" });
    }
  });
  return { app, cfg };
}
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const { app, cfg } = await buildServer();
  await app.listen({ host: cfg.host, port: cfg.port });
  console.log(`RockIn Local AI Cockpit API http://${cfg.host}:${cfg.port}`);
}
