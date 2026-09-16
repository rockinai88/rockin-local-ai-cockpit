import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root = process.cwd();
const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
const forbidden = [
  /RockIn-Dual-AI-Terminal/i,
  /PromptVoice-Agnes/i,
  /\bAGNES\b/i,
  /hermes-agent/i,
  /C:\\Users\\rocki/i,
  /F:\\RockInApps\\RockIn-Dual/i,
  /sk-[A-Za-z0-9_-]{20,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
];
const hits = [];
for (const f of files) {
  if (f.startsWith("docs/superpowers/") || f === "scripts/clean-room-scan.mjs")
    continue;
  const p = path.join(root, f);
  if (!fs.existsSync(p) || fs.statSync(p).size > 2_000_000) continue;
  let t;
  try {
    t = fs.readFileSync(p, "utf8");
  } catch {
    continue;
  }
  for (const rx of forbidden) if (rx.test(t)) hits.push(`${f}: ${rx}`);
}
if (hits.length) {
  console.error(hits.join("\n"));
  process.exit(1);
}
console.log(`clean-room scan PASS (${files.length} tracked files)`);
