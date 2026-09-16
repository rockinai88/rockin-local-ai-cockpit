import fs from "node:fs";
const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const allowed = new Set([
  "MIT",
  "MIT-0",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "BlueOak-1.0.0",
  "CC0-1.0",
  "MPL-2.0",
]);
const bad = [];
for (const [name, p] of Object.entries(lock.packages)) {
  if (p.license && !allowed.has(p.license)) bad.push(`${name}: ${p.license}`);
}
if (bad.length) {
  console.error("Unreviewed licenses:\n" + bad.join("\n"));
  process.exit(1);
}
console.log("license audit PASS");
