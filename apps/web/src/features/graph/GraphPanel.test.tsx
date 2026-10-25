// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GraphPanel } from "./GraphPanel.tsx";
import { demoData } from "../../demo/fixtures.ts";

const renderers = vi.hoisted(
  () =>
    [] as Array<{
      render: ReturnType<typeof vi.fn>;
      dispose: ReturnType<typeof vi.fn>;
    }>,
);

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  return {
    ...actual,
    WebGLRenderer: class {
      domElement = document.createElement("canvas");
      setPixelRatio = vi.fn();
      setSize = vi.fn();
      render = vi.fn();
      dispose = vi.fn();
      constructor() {
        renderers.push(this);
      }
    },
  };
});

beforeEach(() => {
  renderers.length = 0;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 7),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("devicePixelRatio", 1);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("topology accessibility", () => {
  it("labels the static graph without adding a keyboard focus trap", () => {
    render(<GraphPanel graph={demoData.graph} />);
    const graph = screen.getByRole("img", {
      name: `AI topology with ${demoData.graph.nodes.length} nodes`,
    });
    expect(graph.hasAttribute("tabindex")).toBe(false);
    expect(
      graph.querySelectorAll("button, input, select, a[href]"),
    ).toHaveLength(0);
  });

  it("renders reduced motion once, redraws on resize and releases resources", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );
    const { unmount } = render(<GraphPanel graph={demoData.graph} />);
    const renderer = renderers[0];
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("resize"));
    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    unmount();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event("resize"));
    expect(renderer.render).toHaveBeenCalledTimes(2);
  });

  it("keeps normal animation and cancels its pending frame on unmount", () => {
    const { unmount } = render(<GraphPanel graph={demoData.graph} />);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(7);
    expect(renderers[0].dispose).toHaveBeenCalledTimes(1);
  });
});
