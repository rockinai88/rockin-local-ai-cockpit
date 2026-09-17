import { describe, expect, it } from "vitest";
import {
  ChatRequestSchema,
  ChatResponseSchema,
  HardwareSnapshotSchema,
  HealthSnapshotSchema,
  ModelSummarySchema,
} from "./index.ts";

describe("public API contracts", () => {
  it("accepts a bounded health snapshot", () => {
    expect(
      HealthSnapshotSchema.parse({
        status: "online",
        ollama: "offline",
        version: "0.1.3",
      }).status,
    ).toBe("online");
  });
  it("accepts zero RAM total as an unknown hardware fallback", () => {
    expect(
      HardwareSnapshotSchema.parse({
        cpu: "Unknown CPU",
        ramUsed: 0,
        ramTotal: 0,
        gpu: null,
        vramUsed: null,
        vramTotal: null,
      }).ramTotal,
    ).toBe(0);
  });
  it("rejects empty model names", () =>
    expect(() => ModelSummarySchema.parse({ name: "", size: 1 })).toThrow());
  it("rejects oversized chat messages", () =>
    expect(() =>
      ChatRequestSchema.parse({ model: "qwen", message: "x".repeat(20001) }),
    ).toThrow());
  it("rejects empty chat responses", () =>
    expect(() =>
      ChatResponseSchema.parse({ model: "qwen", message: "" }),
    ).toThrow());
});
