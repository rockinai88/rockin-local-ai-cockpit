import { describe, expect, it } from "vitest";
import {
  ChatRequestSchema,
  HealthSnapshotSchema,
  ModelSummarySchema,
} from "./index.ts";

describe("public API contracts", () => {
  it("accepts a bounded health snapshot", () => {
    expect(
      HealthSnapshotSchema.parse({
        status: "online",
        ollama: "offline",
        version: "0.1.0",
      }).status,
    ).toBe("online");
  });
  it("rejects empty model names", () =>
    expect(() => ModelSummarySchema.parse({ name: "", size: 1 })).toThrow());
  it("rejects oversized chat messages", () =>
    expect(() =>
      ChatRequestSchema.parse({ model: "qwen", message: "x".repeat(20001) }),
    ).toThrow());
});
