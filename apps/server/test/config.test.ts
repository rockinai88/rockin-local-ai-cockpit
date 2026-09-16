import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
describe("server config", () => {
  it("defaults to loopback", () =>
    expect(loadConfig({}).host).toBe("127.0.0.1"));
  it("rejects non-loopback bind", () =>
    expect(() => loadConfig({ HOST: "0.0.0.0" })).toThrow(/loopback/i));
  it("accepts a safe port", () =>
    expect(loadConfig({ PORT: "43123" }).port).toBe(43123));
});
