import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { describe, expect, it } from "vitest";
import { OllamaClient } from "../src/ollama/client.ts";

async function fakeOllama(
  respond: (body: any, response: ServerResponse) => void,
): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer(async (request: IncomingMessage, response) => {
    let raw = "";
    for await (const chunk of request) raw += String(chunk);
    respond(raw ? JSON.parse(raw) : {}, response);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("TEST_SERVER_FAILED");
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      ),
  };
}

describe("OllamaClient", () => {
  it("rejects nonlocal endpoints", () =>
    expect(() => new OllamaClient("https://example.com")).toThrow(/local/i));

  it("maps offline to stable error", async () => {
    const client = new OllamaClient("http://127.0.0.1:9");
    await expect(client.listModels()).rejects.toThrow(/OLLAMA_UNAVAILABLE/);
  });

  it("disables thinking for normal chat models", async () => {
    let requestBody: any;
    const fake = await fakeOllama((body, response) => {
      requestBody = body;
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({ model: body.model, message: { content: "LOCAL_OK" } }),
      );
    });
    try {
      const result = await new OllamaClient(fake.url).chat({
        model: "qwen3.5:0.8b",
        message: "ping",
      });
      expect(requestBody.think).toBe(false);
      expect(result.message).toBe("LOCAL_OK");
    } finally {
      await fake.close();
    }
  });

  it("uses low thinking for GPT-OSS models", async () => {
    let requestBody: any;
    const fake = await fakeOllama((body, response) => {
      requestBody = body;
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({ model: body.model, message: { content: "OK" } }),
      );
    });
    try {
      await new OllamaClient(fake.url).chat({
        model: "gpt-oss:20b",
        message: "ping",
      });
      expect(requestBody.think).toBe("low");
    } finally {
      await fake.close();
    }
  });

  it("rejects an empty visible response", async () => {
    const fake = await fakeOllama((_body, response) => {
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({
          model: "qwen3",
          message: { content: "", thinking: "hidden" },
        }),
      );
    });
    try {
      const client = new OllamaClient(fake.url);
      await expect(
        client.chat({ model: "qwen3", message: "ping" }),
      ).rejects.toThrow(/OLLAMA_EMPTY_RESPONSE/);
    } finally {
      await fake.close();
    }
  });
});
