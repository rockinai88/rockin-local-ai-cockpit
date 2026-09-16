import { afterEach, describe, expect, it, vi } from "vitest";

const hardwareModule = "../src/hardware/service.ts";

async function freshServer(readHardware?: () => Promise<never>) {
  vi.resetModules();
  if (readHardware) {
    vi.doMock(hardwareModule, () => ({ readHardware }));
  } else {
    vi.doUnmock(hardwareModule);
  }
  const { buildServer } = await import("../src/server.ts");
  return buildServer({});
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock(hardwareModule);
});

describe("local HTTP security boundary", () => {
  it("rejects a foreign Host header before route handling", async () => {
    const { app } = await freshServer();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/system",
      headers: { host: "evil.example" },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ code: "HOST_DENIED" });
    await app.close();
  });

  it("rejects a foreign Origin with a bounded response", async () => {
    const { app } = await freshServer();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/system",
      headers: {
        host: "127.0.0.1:43123",
        origin: "https://evil.example",
      },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ code: "ORIGIN_DENIED" });
    await app.close();
  });

  it("maps hardware failures to a path-free 503", async () => {
    const { app } = await freshServer(async () => {
      throw new Error("C:\\Users\\secret\\hardware.txt");
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/system",
      headers: { host: "127.0.0.1:43123" },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ code: "HARDWARE_UNAVAILABLE" });
    expect(response.body).not.toContain("secret");
    await app.close();
  });

  it("maps graph hardware failures to a path-free 503", async () => {
    const { app } = await freshServer(async () => {
      throw new Error("C:\\Users\\secret\\graph.txt");
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/graph",
      headers: { host: "127.0.0.1:43123" },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ code: "GRAPH_UNAVAILABLE" });
    expect(response.body).not.toContain("secret");
    await app.close();
  });
});
