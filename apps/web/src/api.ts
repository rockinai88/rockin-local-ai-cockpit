const API = "http://127.0.0.1:43123/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

async function json(path: string, init?: RequestInit) {
  const response = await fetch(API + path, init);
  let body: any;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (!response.ok) {
    const code =
      typeof body?.code === "string" ? body.code : `API_${response.status}`;
    throw new ApiError(response.status, code);
  }
  return body;
}

export function chatErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === "MODEL_EMPTY_RESPONSE") {
    return "The selected model returned no visible answer. Try again or choose another model.";
  }
  return "Ollama is unavailable. Start Ollama or switch to Demo Mode.";
}

export const api = {
  health: () => json("/health"),
  models: () => json("/models"),
  system: () => json("/system"),
  graph: () => json("/graph"),
  chat: (model: string, message: string) =>
    json("/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, message }),
    }),
};
