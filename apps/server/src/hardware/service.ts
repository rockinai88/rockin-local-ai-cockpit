import si from "systeminformation";
import {
  HardwareSnapshotSchema,
  type HardwareSnapshot,
} from "../../../../packages/contracts/src/index.ts";

let cached: { at: number; value: HardwareSnapshot } | undefined;
let inFlight: Promise<HardwareSnapshot> | undefined;

function nonnegative(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export async function readHardware(): Promise<HardwareSnapshot> {
  if (cached && Date.now() - cached.at < 2000) return cached.value;
  if (!inFlight) {
    inFlight = collectHardware().finally(() => {
      inFlight = undefined;
    });
  }
  return inFlight;
}

async function collectHardware(): Promise<HardwareSnapshot> {
  const [cpu, mem, gfx] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.graphics(),
  ]);
  const g =
    gfx.controllers.find((x) => /nvidia/i.test(x.vendor ?? "")) ??
    gfx.controllers[0];
  const ramTotal = nonnegative(mem.total);
  const ramUsed =
    ramTotal === 0 ? 0 : Math.min(nonnegative(mem.active), ramTotal);
  const cpuLabel =
    `${cpu.manufacturer ?? ""} ${cpu.brand ?? ""}`.trim() || "Unknown CPU";
  const gpuLabel = g?.model?.trim() || null;
  const vramMb = Number(g?.vram);
  const value = HardwareSnapshotSchema.parse({
    cpu: cpuLabel.slice(0, 200),
    ramUsed,
    ramTotal,
    gpu: gpuLabel?.slice(0, 200) ?? null,
    vramUsed: null,
    vramTotal:
      Number.isFinite(vramMb) && vramMb > 0 ? vramMb * 1024 * 1024 : null,
  });
  cached = { at: Date.now(), value };
  return value;
}
