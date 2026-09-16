export const demoData = {
  health: {
    status: "online" as const,
    ollama: "online" as const,
    version: "0.1.1",
  },
  models: [
    {
      name: "qwen3.5:9b",
      size: 6100000000,
      parameterSize: "9.7B",
      quantization: "Q4_K_M",
    },
    {
      name: "gemma3:4b",
      size: 3300000000,
      parameterSize: "4.3B",
      quantization: "Q4_K_M",
    },
  ],
  hardware: {
    cpu: "Demo 8-Core CPU",
    ramUsed: 12e9,
    ramTotal: 32e9,
    gpu: "Demo RTX GPU",
    vramUsed: 4e9,
    vramTotal: 8e9,
  },
  graph: {
    nodes: [
      { id: "runtime:ollama", kind: "runtime" as const, label: "Ollama" },
      { id: "hardware:cpu", kind: "cpu" as const, label: "Demo CPU" },
      { id: "hardware:gpu", kind: "gpu" as const, label: "Demo GPU" },
      { id: "model:qwen", kind: "model" as const, label: "qwen3.5:9b" },
      { id: "model:gemma", kind: "model" as const, label: "gemma3:4b" },
    ],
    edges: [
      { source: "runtime:ollama", target: "model:qwen" },
      { source: "runtime:ollama", target: "model:gemma" },
    ],
  },
};
