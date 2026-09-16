import { afterEach, describe, expect, it, vi } from "vitest";

function collectors() {
  return {
    cpu: vi.fn(async () => ({ manufacturer: "AMD", brand: "Fixture" })),
    mem: vi.fn(async () => ({ active: 12, total: 32 })),
    graphics: vi.fn(async () => ({
      controllers: [{ vendor: "NVIDIA", model: "Fixture GPU", vram: 8 }],
    })),
  };
}

async function loadReader(source: ReturnType<typeof collectors>) {
  vi.resetModules();
  vi.doMock("systeminformation", () => ({ default: source }));
  return (await import("../src/hardware/service.ts")).readHardware;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("systeminformation");
});

describe("concurrent hardware sampling (synthetic fixtures)", () => {
  it.each(["cold", "expired"])(
    "shares one collection for simultaneous %s-cache requests",
    async (cacheState) => {
      const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
      const source = collectors();
      const readHardware = await loadReader(source);
      if (cacheState === "expired") {
        await readHardware();
        clock.mockReturnValue(3000);
        vi.clearAllMocks();
      }
      let release!: (value: { manufacturer: string; brand: string }) => void;
      const pendingCpu = new Promise<{ manufacturer: string; brand: string }>(
        (resolve) => {
          release = resolve;
        },
      );
      source.cpu.mockImplementation(() => pendingCpu);
      const first = readHardware();
      const second = readHardware();
      // The sample stays pending while time advances: cache age starts at completion.
      clock.mockReturnValue(10000);
      release({ manufacturer: "AMD", brand: "Fixture" });
      const [a, b] = await Promise.all([first, second]);
      expect(a).toBe(b);
      for (const collector of Object.values(source)) {
        expect(collector).toHaveBeenCalledTimes(1);
      }
      clock.mockReturnValue(11999);
      expect(await readHardware()).toBe(a);
      expect(source.cpu).toHaveBeenCalledTimes(1);
      clock.mockReturnValue(12000);
      await readHardware();
      for (const collector of Object.values(source)) {
        expect(collector).toHaveBeenCalledTimes(2);
      }
    },
  );

  it("shares a failed sample and allows a later retry", async () => {
    const source = collectors();
    const failure = new Error("fixture graphics unavailable");
    source.graphics.mockRejectedValueOnce(failure);
    const readHardware = await loadReader(source);
    const results = await Promise.allSettled([readHardware(), readHardware()]);
    expect(results).toEqual([
      { status: "rejected", reason: failure },
      { status: "rejected", reason: failure },
    ]);
    for (const collector of Object.values(source)) {
      expect(collector).toHaveBeenCalledTimes(1);
    }
    const recovered = await readHardware();
    expect(recovered.cpu).toBe("AMD Fixture");
    expect(recovered.vramTotal).toBe(8 * 1024 * 1024);
    expect(await readHardware()).toBe(recovered);
    for (const collector of Object.values(source)) {
      expect(collector).toHaveBeenCalledTimes(2);
    }
  });
});
