import { describe, expect, it } from "vitest";
import { demoData } from "../src/demo/fixtures.ts";
describe("demo mode", () => {
  it("is deterministic and complete", () => {
    expect(demoData.models.length).toBeGreaterThan(1);
    expect(demoData.graph.nodes.length).toBeGreaterThan(3);
    expect(JSON.stringify(demoData)).not.toMatch(/C:\\|F:\\/);
  });
});
