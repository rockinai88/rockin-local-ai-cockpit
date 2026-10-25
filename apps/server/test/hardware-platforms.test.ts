import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("systeminformation");
});

describe("partial hardware telemetry (synthetic Linux/macOS fixtures)", () => {
  it.each([
    { os: "Linux", cpu: { manufacturer: "AMD", brand: "Fixture" }, gpu: [] },
    {
      os: "macOS",
      cpu: { manufacturer: "Apple", brand: "Fixture" },
      gpu: [{ model: "Integrated Fixture", vendor: "Apple", vram: 0 }],
    },
  ])(
    "normalizes $os without exposing collector details",
    async ({ cpu, gpu }) => {
      vi.resetModules();
      vi.doMock("systeminformation", () => ({
        default: {
          cpu: async () => cpu,
          mem: async () => ({
            active: 12,
            total: 32,
            privatePath: "/fixture/private",
          }),
          graphics: async () => ({ controllers: gpu }),
        },
      }));
      const { readHardware } = await import("../src/hardware/service.ts");
      const result = await readHardware();
      expect(result.cpu).toBe(`${cpu.manufacturer} ${cpu.brand}`);
      expect(result.ramUsed).toBe(12);
      expect(result.ramTotal).toBe(32);
      expect(result.vramTotal).toBeNull();
      expect(JSON.stringify(result)).not.toContain("/fixture/");
    },
  );

  it.each(["cpu", "mem", "graphics"])(
    "retains available collectors when %s fails",
    async (failed) => {
      vi.resetModules();
      const source = {
        cpu: vi.fn(async () => ({ manufacturer: "AMD", brand: "Fixture" })),
        mem: vi.fn(async () => ({ active: 12, total: 32 })),
        graphics: vi.fn(async () => ({
          controllers: [{ model: "Fixture GPU", vendor: "NVIDIA", vram: 8 }],
        })),
      };
      source[failed as keyof typeof source].mockRejectedValue(
        new Error("private collector path"),
      );
      vi.doMock("systeminformation", () => ({ default: source }));
      const { readHardware } = await import("../src/hardware/service.ts");
      const first = await readHardware();
      expect(first.cpu).toBe(failed === "cpu" ? "Unknown CPU" : "AMD Fixture");
      expect(first.ramTotal).toBe(failed === "mem" ? 0 : 32);
      expect(first.ramUsed).toBe(failed === "mem" ? 0 : 12);
      expect(first.gpu).toBe(failed === "graphics" ? null : "Fixture GPU");
      expect(first.vramTotal).toBe(
        failed === "graphics" ? null : 8 * 1024 * 1024,
      );
      expect(JSON.stringify(first)).not.toContain("private collector path");
      expect(await readHardware()).toBe(first);
      for (const collector of Object.values(source))
        expect(collector).toHaveBeenCalledTimes(1);
    },
  );

  it("rejects total collector failure and permits a later retry", async () => {
    vi.resetModules();
    const failure = new Error("private collector path");
    const source = {
      cpu: vi.fn(async () => ({ manufacturer: "AMD", brand: "Recovered" })),
      mem: vi.fn(async () => ({ active: 12, total: 32 })),
      graphics: vi.fn(async () => ({ controllers: [] })),
    };
    for (const collector of Object.values(source))
      collector.mockRejectedValueOnce(failure);
    vi.doMock("systeminformation", () => ({ default: source }));
    const { readHardware } = await import("../src/hardware/service.ts");
    await expect(readHardware()).rejects.toThrow(
      "Hardware telemetry unavailable",
    );
    expect((await readHardware()).cpu).toBe("AMD Recovered");
  });
});
