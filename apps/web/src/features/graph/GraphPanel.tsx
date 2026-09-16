import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { GraphSnapshot } from "../../../../../packages/contracts/src/index.ts";
export function GraphPanel({ graph }: { graph: GraphSnapshot }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(55, 2, 0.1, 100);
    camera.position.z = 7;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    ref.current.appendChild(renderer.domElement);
    const group = new THREE.Group();
    scene.add(group);
    graph.nodes.forEach((n, i) => {
      const geo = new THREE.IcosahedronGeometry(
          n.kind === "runtime" ? 0.32 : 0.2,
          1,
        ),
        mat = new THREE.MeshBasicMaterial({
          color:
            n.kind === "runtime"
              ? 0x68e1fd
              : n.kind === "model"
                ? 0x8b5cf6
                : 0x4ade80,
          wireframe: n.kind !== "runtime",
        });
      const m = new THREE.Mesh(geo, mat);
      const a = (i / Math.max(graph.nodes.length, 1)) * Math.PI * 2;
      m.position.set(Math.cos(a) * 2.2, Math.sin(a) * 1.4, 0);
      group.add(m);
    });
    let raf = 0;
    const draw = () => {
      const w = ref.current?.clientWidth ?? 600,
        h = ref.current?.clientHeight ?? 320;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (!reduce) group.rotation.y += 0.003;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      renderer.domElement.remove();
    };
  }, [graph]);
  return (
    <div
      className="graph-canvas"
      ref={ref}
      role="img"
      aria-label={`AI topology with ${graph.nodes.length} nodes`}
    />
  );
}
