// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import App from "./App.tsx";

vi.mock("./features/graph/GraphPanel.tsx", () => ({ GraphPanel: () => null }));
vi.mock("./api.ts", () => ({
  api: {
    health: async () => ({ version: "fixture", ollama: "online" }),
    models: async () => ({ models: [{ name: "fixture" }] }),
    system: async () => ({
      cpu: "Fixture",
      ramUsed: 0,
      ramTotal: 0,
      gpu: null,
      vramUsed: null,
      vramTotal: null,
    }),
    graph: async () => ({ nodes: [], edges: [] }),
  },
  chatErrorMessage: () => "Unknown error",
}));

afterEach(cleanup);

it("shows unavailable RAM as unknown instead of presenting a measured zero", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Demo Mode" }));
  await waitFor(() =>
    expect(screen.getByText("MEMORY").parentElement?.textContent).toBe(
      "MEMORYUnknown",
    ),
  );
});
