import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig, type ServerConfig } from "./config.ts";
import { OllamaClient } from "./ollama/client.ts";
import { readHardware } from "./hardware/service.ts";
import { buildGraph } from "./graph/service.ts";
import {
  ChatRequestSchema,
  type ModelSummary,
} from "../../../packages/contracts/src/index.ts";

function isLoopbackHost(value: string | undefined): boolean {
  if (!value) return false;
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(127\.0\.0\.1|localhost|\[::1\])(?::(\d{1,5}))?$/);
  if (!match) return false;
  if (!match[2]) return true;
  const port = Number(match[2]);
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

function allowedOrigins(cfg: ServerConfig): Set<string> {
  return new Set([
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://[::1]:5173",
    `http://127.0.0.1:${cfg.port}`,
    `http://localhost:${cfg.port}`,
    `http://[::1]:${cfg.port}`,
  ]);
}
export async function buildServer(
  env: Record<string, string | undefined> = process.env,
) {
  const cfg = loadConfig(env);
  const origins = allowedOrigins(cfg);
  const app = Fastify({ bodyLimit: 256 * 1024, logger: false });

  app.addHook("onRequest", async (request, reply) => {
    if (!isLoopbackHost(request.headers.host)) {
      return reply.code(403).send({ code: "HOST_DENIED" });
    }
    const origin = request.headers.origin;
    if (origin && !origins.has(origin)) {
      return reply.code(403).send({ code: "ORIGIN_DENIED" });
    }
  });

  await app.register(cors, {
    origin: (origin, callback) => {
      callback(null, !origin || origins.has(origin));
    },
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    reply
      .header("x-content-type-options", "nosniff")
      .header("referrer-policy", "no-referrer")
      .header("cache-control", "no-store");
    return payload;
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
      version: "0.1.1",
    };
  });

  app.get("/api/v1/models", async (_request, reply) => {
    try {
      return { models: await ollama.listModels() };
    } catch {
      return reply.code(503).send({ code: "OLLAMA_UNAVAILABLE" });
    }
  });

  app.get("/api/v1/system", async (_request, reply) => {
    try {
      return await readHardware();
    } catch {
      return reply.code(503).send({ code: "HARDWARE_UNAVAILABLE" });
    }
  });

  app.get("/api/v1/graph", async (_request, reply) => {
    try {
      let models: ModelSummary[] = [];
      try {
        models = await ollama.listModels();
      } catch {}
      return buildGraph(models, await readHardware());
    } catch {
      return reply.code(503).send({ code: "GRAPH_UNAVAILABLE" });
    }
  });

  app.post("/api/v1/chat", async (request, reply) => {
    const parsed = ChatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ code: "INVALID_REQUEST" });
    }
    try {
      return await ollama.chat(parsed.data);
    } catch {
      return reply.code(503).send({ code: "OLLAMA_UNAVAILABLE" });
    }
  });

  return { app, cfg };
}
