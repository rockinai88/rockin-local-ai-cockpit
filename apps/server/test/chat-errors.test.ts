import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.ts";

async function emptyChatServer() {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ model: "qwen3", message: { content: "" } }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("TEST_SERVER_FAILED");
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

describe("chat error boundary", () => {
  it("maps an empty model response to a bounded 502", async () => {
    const fake = await emptyChatServer();
    const { app } = await buildServer({ OLLAMA_URL: fake.url });
    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/chat",
        headers: { host: "127.0.0.1:43123" },
        payload: { model: "qwen3", message: "ping" },
      });
      expect(response.statusCode).toBe(502);
      expect(response.json()).toEqual({ code: "MODEL_EMPTY_RESPONSE" });
    } finally {
      await app.close();
      await fake.close();
    }
  });
});
