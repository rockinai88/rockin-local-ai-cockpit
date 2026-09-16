import {
  ChatResponseSchema,
  ModelSummarySchema,
  type ChatRequest,
  type ChatResponse,
  type ModelSummary,
} from "../../../../packages/contracts/src/index.ts";

type OllamaThink = false | "low";

function chatThinkMode(model: string): OllamaThink {
  return /^gpt-oss(?::|$)/i.test(model.trim()) ? "low" : false;
}

export class OllamaClient {
  constructor(private readonly baseUrl = "http://127.0.0.1:11434") {
    const u = new URL(baseUrl);
    if (
      u.protocol !== "http:" ||
      !["127.0.0.1", "localhost", "[::1]"].includes(u.hostname)
    ) {
      throw new Error("Ollama endpoint must be local HTTP");
    }
  }

  private async request(path: string, init?: RequestInit) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(this.baseUrl + path, {
        ...init,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`OLLAMA_HTTP_${response.status}`);
      return response;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("OLLAMA_HTTP_")) {
        throw error;
      }
      throw new Error("OLLAMA_UNAVAILABLE", { cause: error });
    } finally {
      clearTimeout(timer);
    }
  }

  async listModels(): Promise<ModelSummary[]> {
    const response = await this.request("/api/tags");
    const body = (await response.json()) as { models?: unknown[] };
    return (body.models ?? []).slice(0, 128).map((model: any) =>
      ModelSummarySchema.parse({
        name: model.name,
        size: model.size ?? 0,
        parameterSize: model.details?.parameter_size,
        quantization: model.details?.quantization_level,
      }),
    );
  }

  async chat(input: ChatRequest): Promise<ChatResponse> {
    const response = await this.request("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: input.model,
        messages: [{ role: "user", content: input.message }],
        stream: false,
        think: chatThinkMode(input.model),
      }),
    });
    const body = (await response.json()) as any;
    const content = body.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new Error("OLLAMA_EMPTY_RESPONSE");
    }
    return ChatResponseSchema.parse({
      model: body.model ?? input.model,
      message: content,
    });
  }
}
