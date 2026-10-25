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
  const samples = await Promise.allSettled([si.cpu(), si.mem(), si.graphics()]);
  if (samples.every((sample) => sample.status === "rejected")) {
    throw new Error("Hardware telemetry unavailable");
  }
  const cpu = samples[0].status === "fulfilled" ? samples[0].value : undefined;
  const mem = samples[1].status === "fulfilled" ? samples[1].value : undefined;
  const gfx = samples[2].status === "fulfilled" ? samples[2].value : undefined;
  const controllers = gfx?.controllers ?? [];
  const g =
    controllers.find((x) => /nvidia/i.test(x.vendor ?? "")) ?? controllers[0];
  const ramTotal = nonnegative(mem?.total);
  const ramUsed =
    ramTotal === 0 ? 0 : Math.min(nonnegative(mem?.active), ramTotal);
  const cpuLabel =
    `${cpu?.manufacturer ?? ""} ${cpu?.brand ?? ""}`.trim() || "Unknown CPU";
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
