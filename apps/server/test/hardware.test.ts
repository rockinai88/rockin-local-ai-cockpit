import { afterEach, describe, expect, it, vi } from "vitest";

async function loadReader(source: Record<string, unknown>) {
  vi.resetModules();
  vi.doMock("systeminformation", () => ({ default: source }));
  const module = await import("../src/hardware/service.ts");
  return module.readHardware;
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("systeminformation");
});

describe("hardware telemetry", () => {
  it("uses safe fallbacks and clamps invalid counters", async () => {
    const readHardware = await loadReader({
      cpu: async () => ({ manufacturer: "", brand: "" }),
      mem: async () => ({ active: -10, total: 0 }),
      graphics: async () => ({ controllers: [{}] }),
    });
    const value = await readHardware();
    expect(value).toEqual({
      cpu: "Unknown CPU",
      ramUsed: 0,
      ramTotal: 0,
      gpu: null,
      vramUsed: null,
      vramTotal: null,
    });
  });
  it("caches the expensive hardware sample for two seconds", async () => {
    const calls = { cpu: 0, mem: 0, graphics: 0 };
    const readHardware = await loadReader({
      cpu: async () => {
        calls.cpu += 1;
        return { manufacturer: "AMD", brand: "Ryzen Test" };
      },
      mem: async () => {
        calls.mem += 1;
        return { active: 12, total: 32 };
      },
      graphics: async () => {
        calls.graphics += 1;
        return {
          controllers: [{ vendor: "NVIDIA", model: "RTX Test", vram: 8 }],
        };
      },
    });
    const first = await readHardware();
    const second = await readHardware();
    expect(second).toEqual(first);
    expect(calls).toEqual({ cpu: 1, mem: 1, graphics: 1 });
  });
});
