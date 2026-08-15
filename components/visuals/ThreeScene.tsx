"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

/**
 * Interactive 3D demo scene powered by three.js (MIT).
 *
 * - three.js (~650 KB min, ~150 KB gzip) is imported lazily inside an effect
 *   and the whole scene is only mounted once the parent panel is opened.
 * - Canvas is transparent (alpha: true) so the page theme shows through;
 *   a torus knot with a wireframe overlay auto-rotates, with OrbitControls
 *   for drag/zoom.
 * - All GPU/GL resources (geometry, materials, renderer, animation frame,
 *   ResizeObserver) are disposed on unmount.
 */
export default function ThreeScene({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import(
        "three/examples/jsm/controls/OrbitControls.js"
      );
      if (cancelled || !mount || mount.clientWidth === 0) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        60,
        mount.clientWidth / mount.clientHeight,
        0.1,
        100
      );
      camera.position.set(3, 2.4, 4.8);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      mount.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.6;
      controls.minDistance = 2;
      controls.maxDistance = 10;

      const geometry = new THREE.TorusKnotGeometry(1, 0.32, 160, 24);
      const smooth = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.55,
        roughness: 0.3,
      });
      const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0xbfdbfe,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const knot = new THREE.Mesh(geometry, smooth);
      const wire = new THREE.Mesh(geometry, wireMaterial);
      scene.add(knot, wire);

      const grid = new THREE.GridHelper(8, 20, 0x64748b, 0x334155);
      grid.position.y = -2.2;
      scene.add(grid);

      const ambient = new THREE.AmbientLight(0xffffff, 0.55);
      scene.add(ambient);
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
      keyLight.position.set(3, 5, 2);
      scene.add(keyLight);
      const fillLight = new THREE.PointLight(0x60a5fa, 0.6);
      fillLight.position.set(-3, -1, -2);
      scene.add(fillLight);

      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(mount);

      let frame = 0;
      const animate = () => {
        frame = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        geometry.dispose();
        smooth.dispose();
        wireMaterial.dispose();
        (grid.geometry as THREE.BufferGeometry).dispose();
        ((grid.material as THREE.Material) ?? []).dispose?.();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    })().catch(() => {
      if (mountRef.current && !cancelled) {
        mountRef.current.textContent = "3D view failed to load.";
      }
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={className ?? "three-scene"}
      aria-label="Interactive 3D model — drag to rotate, scroll to zoom"
      role="img"
    />
  );
}