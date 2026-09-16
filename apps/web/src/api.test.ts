import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, chatErrorMessage } from "./api.ts";

afterEach(() => vi.restoreAllMocks());

describe("web API errors", () => {
  it("preserves bounded server error codes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ code: "MODEL_EMPTY_RESPONSE" }), {
            status: 502,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
    await expect(api.chat("qwen3", "ping")).rejects.toMatchObject({
      status: 502,
      code: "MODEL_EMPTY_RESPONSE",
    });
  });

  it("shows a specific message for an empty model response", () => {
    const message = chatErrorMessage(new ApiError(502, "MODEL_EMPTY_RESPONSE"));
    expect(message).toMatch(/no visible answer/i);
  });

  it("keeps the generic offline message for other failures", () => {
    expect(chatErrorMessage(new Error("network"))).toMatch(
      /Ollama is unavailable/i,
    );
  });
});
