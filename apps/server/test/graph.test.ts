import { describe,expect,it } from "vitest"; import { buildGraph } from "../src/graph/service.ts";
describe("graph",()=>it("is bounded and stable",()=>{const g=buildGraph([{name:"qwen",size:1}],{cpu:"CPU",ramUsed:1,ramTotal:2,gpu:"GPU",vramUsed:1,vramTotal:2}); expect(g.nodes.length).toBeLessThanOrEqual(128); expect(g.nodes.map(n=>n.id)).toContain("runtime:ollama");}));
