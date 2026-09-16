export type ServerConfig = {
  host: "127.0.0.1" | "::1";
  port: number;
  ollamaUrl: string;
};
export function loadConfig(
  env: Record<string, string | undefined>,
): ServerConfig {
  const host = env.HOST ?? "127.0.0.1";
  if (host !== "127.0.0.1" && host !== "::1")
    throw new Error("Server host must be loopback only");
  const port = Number(env.PORT ?? 43123);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Invalid port");
  const ollamaUrl = env.OLLAMA_URL ?? "http://127.0.0.1:11434";
  const u = new URL(ollamaUrl);
  if (
    u.protocol !== "http:" ||
    (u.hostname !== "127.0.0.1" &&
      u.hostname !== "localhost" &&
      u.hostname !== "[::1]")
  )
    throw new Error("Ollama URL must be local HTTP");
  return { host, port, ollamaUrl };
}
