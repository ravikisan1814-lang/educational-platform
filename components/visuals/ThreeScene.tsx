"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

const CAMERA_PRESETS: Record<string, [number, number, number]> = {
  trajectory: [4, 2.5, 5],
  circular: [3, 3, 4],
  vectorfield: [5, 3, 5],
  wave: [3, 2.5, 5],
  abstract: [3.5, 2.5, 5],
  molecular: [3.5, 2.5, 4],
  barchart: [4, 3, 5],
  coordinate: [4, 3, 5],
};

function getCameraPosition(figureType: string, topicTitle: string | undefined): [number, number, number] {
  const key = figureType.toLowerCase();
  const title = (topicTitle ?? "").toLowerCase();

  if (title.includes("projectile")) return [4.5, 1.2, 5];
  if (title.includes("circular") || title.includes("centripetal")) return [0, 2.8, 4.5];
  if (title.includes("electric") || title.includes("magnetic") || title.includes("field")) return [5, 4, 5];
  if (title.includes("superposition") || title.includes("interference")) return [3.5, 2, 5.5];
  if (title.includes("harmonic")) return [4, 2, 5];
  if (title.includes("vsepr") || title.includes("molecular geometry")) return [3.5, 2.5, 4.5];
  if (title.includes("crystal") || title.includes("lattice")) return [5, 4, 5];
  if (title.includes("orbital") || title.includes("atomic")) return [3, 2.5, 4.5];
  if (title.includes("periodic") || title.includes("trends")) return [4, 3, 5];
  if (title.includes("bonding")) return [3.5, 2.5, 5];
  if (title.includes("parabola") || title.includes("conic")) return [4, 2.5, 5];
  if (title.includes("hyperboloid") || title.includes("saddle")) return [3.5, 2.5, 5.5];
  if (title.includes("vector") && key === "barchart") return [4.5, 2.5, 5];
  if (title.includes("spiral") || title.includes("helix")) return [4, 3, 4.5];
  if (title.includes("coordinate") || title.includes("octant")) return [4.5, 3.5, 4.5];

  return CAMERA_PRESETS[key] ?? CAMERA_PRESETS.abstract;
}

function getSceneConfig(figureType: string, topicTitle: string | undefined) {
  const key = figureType.toLowerCase();
  const title = (topicTitle ?? "").toLowerCase();

  if (title.includes("projectile")) return { background: 0x0f172a, autoRotate: false, rotateSpeed: 0 };
  if (title.includes("circular") || title.includes("centripetal")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.4 };
  if (title.includes("electric") || title.includes("magnetic") || title.includes("field")) return { background: 0x020617, autoRotate: true, rotateSpeed: 0.25 };
  if (title.includes("superposition") || title.includes("interference")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.3 };
  if (title.includes("harmonic")) return { background: 0x0f172a, autoRotate: false, rotateSpeed: 0 };
  if (title.includes("vsepr") || title.includes("molecular geometry")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.5 };
  if (title.includes("crystal") || title.includes("lattice")) return { background: 0x020617, autoRotate: true, rotateSpeed: 0.35 };
  if (title.includes("orbital") || title.includes("atomic")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.45 };
  if (title.includes("periodic") || title.includes("trends")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.2 };
  if (title.includes("bonding")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.4 };
  if (title.includes("parabola") || title.includes("conic")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.35 };
  if (title.includes("hyperboloid") || title.includes("saddle")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.4 };
  if (title.includes("vector") && key === "barchart") return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.3 };
  if (title.includes("spiral") || title.includes("helix")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.5 };
  if (title.includes("coordinate") || title.includes("octant")) return { background: 0x020617, autoRotate: true, rotateSpeed: 0.2 };

  if (key === "trajectory") return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.3 };
  if (key === "molecular") return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.5 };
  if (key === "wave") return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.3 };
  if (key === "vectorfield") return { background: 0x020617, autoRotate: true, rotateSpeed: 0.25 };
  return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.3 };
}

function disposeSafe(obj: { dispose?: () => void } | null | undefined) {
  obj?.dispose?.();
}

export default function ThreeScene({ className, figureType = "abstract", topicTitle }: { className?: string; figureType?: string; topicTitle?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (cancelled || !mount || mount.clientWidth === 0) return;

      const scene = new THREE.Scene();
      const config = getSceneConfig(figureType, topicTitle);
      scene.background = new THREE.Color(config.background);

      const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 200);
      const [cx, cy, cz] = getCameraPosition(figureType, topicTitle);
      camera.position.set(cx, cy, cz);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      mount.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = config.autoRotate;
      controls.autoRotateSpeed = config.rotateSpeed;
      controls.minDistance = 2;
      controls.maxDistance = 20;

      const ambient = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambient);
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
      keyLight.position.set(4, 6, 3);
      scene.add(keyLight);
      const fillLight = new THREE.PointLight(0x60a5fa, 0.5);
      fillLight.position.set(-4, -1, -3);
      scene.add(fillLight);

      const animatables: Array<{ update: (t: number) => void }> = [];

      const addAnimatables = (objs: Array<{ update: (t: number) => void }> | { update: (t: number) => void }) => {
        if (Array.isArray(objs)) animatables.push(...objs);
        else animatables.push(objs);
      };

      const grid = new THREE.GridHelper(12, 24, 0x334155, 0x1e293b);
      grid.position.y = -2.5;
      scene.add(grid);

      const key = figureType.toLowerCase();
      const title = (topicTitle ?? "").toLowerCase();

      // ---------------- trajectory ----------------
      if (key === "trajectory" || title.includes("trajectory") || title.includes("projectile") || title.includes("parabola") || title.includes("graph")) {
        buildTrajectoryScene(THREE, scene, title, animatables);
      }
      // ---------------- circular ----------------
      else if (title.includes("circular") || title.includes("centripetal")) {
        buildCircularScene(THREE, scene, animatables);
      }
      // ---------------- vectorfield ----------------
      else if (key === "vectorfield" || title.includes("electric") || title.includes("magnetic") || title.includes("field") || title.includes("vector") || title.includes("force")) {
        buildVectorFieldScene(THREE, scene, title, animatables);
      }
      // ---------------- wave ----------------
      else if (key === "wave" || title.includes("wave") || title.includes("superposition") || title.includes("interference") || title.includes("oscillation") || title.includes("spiral") || title.includes("helix")) {
        buildWaveScene(THREE, scene, title, animatables);
      }
      // ---------------- simple harmonic motion ----------------
      else if (title.includes("harmonic") || title.includes("simple harmonic")) {
        buildSHMScene(THREE, scene, animatables);
      }
      // ---------------- molecular ----------------
      else if (key === "molecular" || title.includes("molecular") || title.includes("orbital") || title.includes("vsepr") || title.includes("crystal") || title.includes("lattice") || title.includes("bonding")) {
        if (title.includes("vsepr") || title.includes("molecular geometry")) {
          buildVSEPRScene(THREE, scene, animatables);
        } else if (title.includes("crystal") || title.includes("lattice")) {
          buildCrystalLatticeScene(THREE, scene, animatables);
        } else if (title.includes("orbital") || title.includes("atomic")) {
          buildOrbitalScene(THREE, scene, title, animatables);
        } else if (title.includes("bonding")) {
          buildBondingScene(THREE, scene, animatables);
        } else {
          buildMolecularScene(THREE, scene, animatables);
        }
      }
      // ---------------- barchart / comparison ----------------
      else if (key === "barchart" || title.includes("bar") || title.includes("chart") || title.includes("comparison") || title.includes("periodic") || title.includes("trends")) {
        buildComparisonScene(THREE, scene, animatables);
      }
      // ---------------- coordinate / octant ----------------
      else if (title.includes("coordinate") || title.includes("octant")) {
        buildCoordinateScene(THREE, scene);
      }
      // ---------------- hyperboloid / saddle ----------------
      else if (title.includes("hyperboloid") || title.includes("saddle")) {
        buildHyperboloidScene(THREE, scene, animatables);
      }
      // ---------------- abstract fallback ----------------
      else {
        buildAbstractScene(THREE, scene);
      }

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

      const clock = new THREE.Clock();
      let frame = 0;
      const animate = () => {
        frame = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        for (const obj of animatables) obj.update(t);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            disposeSafe(obj.geometry as THREE.BufferGeometry);
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                for (const m of obj.material) disposeSafe(m);
              } else {
                disposeSafe(obj.material);
              }
            }
          }
          if (obj instanceof THREE.Points) {
            disposeSafe(obj.geometry as THREE.BufferGeometry);
            disposeSafe(obj.material as THREE.PointsMaterial);
          }
          if (obj instanceof THREE.Line) {
            disposeSafe(obj.geometry as THREE.BufferGeometry);
            disposeSafe(obj.material as THREE.LineBasicMaterial);
          }
        });
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
  }, [figureType, topicTitle]);

  return (
    <div
      ref={mountRef}
      className={className ?? "three-scene"}
      aria-label="Interactive 3D model — drag to rotate, scroll to zoom"
      role="img"
    />
  );
}

// ---------------------------------------------------------------------------
// Scene builders — each returns an array of { update(t: number): void } objects
// ---------------------------------------------------------------------------

function material(THREE: typeof import("three"), color: number, opts?: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.45, ...opts });
}

// ---------------- trajectory / projectile ----------------
function buildTrajectoryScene(THREE: typeof import("three"), scene: THREE.Scene, title: string, animatables: Array<{ update: (t: number) => void }>) {
  const isProjectile = title.includes("projectile");
  const isParabola = title.includes("parabola") || title.includes("conic");

  if (isProjectile) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-3, 0, 0),
      new THREE.Vector3(0, 3.5, 0.5),
      new THREE.Vector3(3, 0, 0),
    );
    const points = curve.getPoints(120);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x60a5fa, linewidth: 2 });
    scene.add(new THREE.Line(lineGeo, lineMat));

    const ballGeo = new THREE.SphereGeometry(0.18, 32, 24);
    const ballMat = material(THREE, 0xfacc15);
    const ball = new THREE.Mesh(ballGeo, ballMat);
    scene.add(ball);

    const groundGeo = new THREE.PlaneGeometry(8, 0.05);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.6 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    animatables.push({
      update(t: number) {
        const p = curve.getPoint((t * 0.35) % 1);
        ball.position.copy(p);
      },
    });
  } else {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * 10 - 5;
      const y = Math.sin(x * 1.5) * 1.8 + Math.cos(x * 0.7) * 0.6;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x60a5fa });
    scene.add(new THREE.Line(lineGeo, lineMat));

    const dotGeo = new THREE.SphereGeometry(0.08, 16, 12);
    const dotMat = material(THREE, 0xfacc15);
    const dot = new THREE.Mesh(dotGeo, dotMat);
    scene.add(dot);

    animatables.push({
      update(t: number) {
        const idx = Math.floor(((t * 0.2) % 1) * pts.length);
        dot.position.copy(pts[Math.min(idx, pts.length - 1)]);
      },
    });
  }
}

// ---------------- circular motion ----------------
function buildCircularScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>) {
  const ringGeo = new THREE.TorusGeometry(2, 0.03, 16, 120);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  const centerGeo = new THREE.SphereGeometry(0.25, 32, 24);
  const centerMat = material(THREE, 0xf87171, { emissive: 0x7f1d1d, emissiveIntensity: 0.5 });
  scene.add(new THREE.Mesh(centerGeo, centerMat));

  const ballGeo = new THREE.SphereGeometry(0.2, 32, 24);
  const ballMat = material(THREE, 0x60a5fa, { emissive: 0x1e3a8a, emissiveIntensity: 0.4 });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  scene.add(ball);

  const tangentArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1.2,
    0xfacc15,
    0.3,
    0.2,
  );
  scene.add(tangentArrow);

  const radialArrow = new THREE.ArrowHelper(
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    0xf87171,
    0.25,
    0.18,
  );
  scene.add(radialArrow);

  animatables.push({
    update(t: number) {
      const angle = t * 1.8;
      ball.position.set(Math.cos(angle) * 2, 0, Math.sin(angle) * 2);
      tangentArrow.position.copy(ball.position);
      tangentArrow.setDirection(new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)));
      radialArrow.position.copy(ball.position);
      radialArrow.setDirection(new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle)));
    },
  });
}

// ---------------- vector field ----------------
function buildVectorFieldScene(THREE: typeof import("three"), scene: THREE.Scene, title: string, animatables: Array<{ update: (t: number) => void }>) {
  const isElectric = title.includes("electric");
  const isMagnetic = title.includes("magnetic");

  if (isElectric) {
    const chargeGeo = new THREE.SphereGeometry(0.3, 32, 24);
    const chargeMat = material(THREE, 0xef4444, { emissive: 0x7f1d1d, emissiveIntensity: 0.6 });
    const charge = new THREE.Mesh(chargeGeo, chargeMat);
    scene.add(charge);

    for (let i = 0; i < 24; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const len = 1.2 + Math.random() * 2.5;
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      ).normalize();
      const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), len, 0x60a5fa, 0.15, 0.1);
      scene.add(arrow);
      animatables.push({
        update(t: number) {
          const s = 1 + Math.sin(t * 2 + i) * 0.15;
          arrow.setLength(len * s, len * s * 0.12, len * s * 0.08);
        },
      });
    }
  } else if (isMagnetic) {
    for (let i = 0; i < 20; i++) {
      const z = (i / 20) * 8 - 4;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 80; j++) {
        const a = (j / 80) * Math.PI * 4;
        const r = 1.8;
        pts.push(new THREE.Vector3(Math.cos(a) * r, z, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.6 });
      scene.add(new THREE.Line(geo, mat));
    }
  } else {
    for (let x = -2; x <= 2; x += 1) {
      for (let y = -2; y <= 2; y += 1) {
        for (let z = -2; z <= 2; z += 1) {
          const len = Math.sqrt(x * x + y * y + z * z) || 1;
          const dir = new THREE.Vector3(x / len, y / len, z / len);
          const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(x, y, z), 0.7, 0x60a5fa, 0.1, 0.07);
          scene.add(arrow);
        }
      }
    }
  }
}

// ---------------- wave / superposition / helix ----------------
function buildWaveScene(THREE: typeof import("three"), scene: THREE.Scene, title: string, animatables: Array<{ update: (t: number) => void }>) {
  const isSuperposition = title.includes("superposition") || title.includes("interference");
  const isHelix = title.includes("spiral") || title.includes("helix");

  if (isHelix) {
    const pts: THREE.Vector3[] = [];
    const N = 300;
    for (let i = 0; i <= N; i++) {
      const frac = i / N;
      const a = frac * Math.PI * 8;
      const y = frac * 6 - 3;
      pts.push(new THREE.Vector3(Math.cos(a) * 1.5, y, Math.sin(a) * 1.5));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.12, 16, false);
    const mat = material(THREE, 0xa78bfa, { emissive: 0x4c1d95, emissiveIntensity: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    animatables.push({
      update(t: number) {
        mesh.rotation.y = t * 0.4;
      },
    });
  } else if (isSuperposition) {
    const N = 100;
    const pts1: THREE.Vector3[] = [];
    const pts2: THREE.Vector3[] = [];
    const ptsSum: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * 8 - 4;
      pts1.push(new THREE.Vector3(x, Math.sin(x * 2 + 0) * 1, 0));
      pts2.push(new THREE.Vector3(x, Math.sin(x * 2.8 + 1.2) * 1, 0));
      ptsSum.push(new THREE.Vector3(x, Math.sin(x * 2 + 0) * 1 + Math.sin(x * 2.8 + 1.2) * 1, 0));
    }
    const makeLine = (pts: THREE.Vector3[], color: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color });
      const line = new THREE.Line(geo, mat);
      line.position.z = -0.6;
      scene.add(line);
      return line;
    };
    const line1 = makeLine(pts1, 0x60a5fa);
    const line2 = makeLine(pts2, 0xf87171);
    const lineSum = makeLine(ptsSum, 0xfacc15);

    animatables.push({
      update(t: number) {
        const offset = t * 2;
        for (let i = 0; i <= N; i++) {
          const x = (i / N) * 8 - 4;
          (line1.geometry as THREE.BufferGeometry).attributes.position.setXYZ(i, x, Math.sin(x * 2 + offset) * 1, -0.6);
          (line2.geometry as THREE.BufferGeometry).attributes.position.setXYZ(i, x, Math.sin(x * 2.8 + 1.2 + offset) * 1, -0.6);
          (lineSum.geometry as THREE.BufferGeometry).attributes.position.setXYZ(i, x, Math.sin(x * 2 + offset) * 1 + Math.sin(x * 2.8 + 1.2 + offset) * 1, -0.6);
        }
        (line1.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
        (line2.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
        (lineSum.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
      },
    });
  } else {
    const pts: THREE.Vector3[] = [];
    const N = 200;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * 10 - 5;
      pts.push(new THREE.Vector3(x, Math.sin(x * 1.5) * 1.5, 0));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.1, 16, false);
    const mat = material(THREE, 0x34d399, { emissive: 0x064e3b, emissiveIntensity: 0.25 });
    const tube = new THREE.Mesh(geo, mat);
    scene.add(tube);
    animatables.push({
      update(t: number) {
        tube.rotation.x = t * 0.25;
      },
    });
  }
}

// ---------------- simple harmonic motion ----------------
function buildSHMScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>) {
  const anchorGeo = new THREE.SphereGeometry(0.2, 32, 24);
  const anchorMat = material(THREE, 0x94a3b8);
  const anchor = new THREE.Mesh(anchorGeo, anchorMat);
  anchor.position.set(0, 2.5, 0);
  scene.add(anchor);

  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 2.5, 0), new THREE.Vector3(0, -1.5, 0)]);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.6 });
  const line = new THREE.Line(lineGeo, lineMat);
  scene.add(line);

  const bobGeo = new THREE.SphereGeometry(0.35, 32, 24);
  const bobMat = material(THREE, 0xfacc15, { emissive: 0x78350f, emissiveIntensity: 0.35 });
  const bob = new THREE.Mesh(bobGeo, bobMat);
  scene.add(bob);

  const arrowGeo = new THREE.ConeGeometry(0.12, 0.4, 12, 1);
  const arrowMat = material(THREE, 0xf87171);
  const arrow = new THREE.Mesh(arrowGeo, arrowMat);
  scene.add(arrow);

  const pathGeo = new THREE.TorusGeometry(2, 0.02, 16, 120);
  const pathMat = new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.4 });
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.rotation.x = Math.PI / 2;
  path.position.y = -1.5;
  scene.add(path);

  animatables.push({
    update(t: number) {
      const angle = Math.sin(t * 1.5) * 0.9;
      bob.position.set(Math.sin(angle) * 2, -1.5 + Math.cos(angle) * 0.15, 0);
      arrow.position.set(Math.sin(angle) * 2 + Math.sin(angle) * 0.8, -1.5, 0);
      arrow.rotation.z = -angle;
    },
  });
}

// ---------------- molecular / VSEPR ----------------
function buildMolecularScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>) {
  buildVSEPRScene(THREE, scene, animatables);
}

function buildVSEPRScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>) {
  const centerGeo = new THREE.SphereGeometry(0.4, 32, 24);
  const centerMat = material(THREE, 0xfb923c, { emissive: 0x7c2d12, emissiveIntensity: 0.4 });
  const center = new THREE.Mesh(centerGeo, centerMat);
  scene.add(center);

  const bonds: THREE.Mesh[] = [];
  const atoms: THREE.Mesh[] = [];
  const atomColors = [0x3b82f6, 0x22c55e, 0xef4444, 0xeab308, 0xa855f7];

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const bondGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 12);
    const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const bond = new THREE.Mesh(bondGeo, bondMat);
    bond.position.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6);
    bond.rotation.z = Math.PI / 2;
    bond.rotation.y = -angle;
    scene.add(bond);
    bonds.push(bond);

    const atomGeo = new THREE.SphereGeometry(0.2, 32, 24);
    const atomMat = material(THREE, atomColors[i % atomColors.length]);
    const atom = new THREE.Mesh(atomGeo, atomMat);
    atom.position.set(Math.cos(angle) * 1.2, 0, Math.sin(angle) * 1.2);
    scene.add(atom);
    atoms.push(atom);
  }

  animatables.push({
    update(t: number) {
      center.rotation.y = t * 0.6;
      for (let i = 0; i < atoms.length; i++) {
        const angle = (i / atoms.length) * Math.PI * 2 + t * 0.6;
        atoms[i].position.set(Math.cos(angle) * 1.2, 0, Math.sin(angle) * 1.2);
        bonds[i].position.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6);
        bonds[i].rotation.z = Math.PI / 2;
        bonds[i].rotation.y = -angle;
      }
    },
  });
}

// ---------------- crystal lattice ----------------
function buildCrystalLatticeScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>) {
  const unitCells: THREE.Mesh[] = [];
  const colors = [0x3b82f6, 0x22c55e, 0xf59e0b];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const color = colors[Math.abs(x + y + z) % colors.length];
        const geo = new THREE.SphereGeometry(0.18, 24, 18);
        const mat = material(THREE, color, { emissive: color, emissiveIntensity: 0.2 });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.set(x * 1.5, y * 1.5, z * 1.5);
        scene.add(sphere);
        unitCells.push(sphere);

        for (let dx = 0; dx <= 1; dx++) {
          for (let dy = 0; dy <= 1; dy++) {
            for (let dz = 0; dz <= 1; dz++) {
              if (dx === 0 && dy === 0 && dz === 0) continue;
              const lineGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x * 1.5, y * 1.5, z * 1.5),
                new THREE.Vector3((x + dx) * 1.5, (y + dy) * 1.5, (z + dz) * 1.5),
              ]);
              const lineMat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.4 });
              scene.add(new THREE.Line(lineGeo, lineMat));
            }
          }
        }
      }
    }
  }

  animatables.push({
    update(t: number) {
      for (let i = 0; i < unitCells.length; i++) {
        const s = 1 + Math.sin(t * 1.5 + i * 0.5) * 0.1;
        unitCells[i].scale.setScalar(s);
      }
    },
  });
}

// ---------------- atomic orbitals ----------------
function buildOrbitalScene(THREE: typeof import("three"), scene: THREE.Scene, title: string, animatables: Array<{ update: (t: number) => void }>) {
  if (title.includes("d ") || title.includes("d-")) {
    const N = 200;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const theta = (i / N) * Math.PI * 2;
      for (let j = 0; j <= 40; j++) {
        const phi = (j / 40) * Math.PI;
        const r = Math.abs(Math.sin(theta) * Math.sin(theta) * Math.cos(phi) * Math.cos(phi)) * 2 + 0.02;
        pts.push(new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ));
      }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.04, transparent: true, opacity: 0.8 });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    animatables.push({
      update(t: number) {
        points.rotation.y = t * 0.35;
        points.rotation.x = Math.sin(t * 0.2) * 0.2;
      },
    });
  } else if (title.includes("p ")) {
    for (let axis = 0; axis < 3; axis++) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 100; i++) {
        const t = (i / 100) * 3 - 1.5;
        const r = Math.abs(t) * 1.2 + 0.02;
        const vec = new THREE.Vector3(
          axis === 0 ? t : (Math.random() - 0.5) * 0.1,
          axis === 1 ? t : (Math.random() - 0.5) * 0.1,
          axis === 2 ? t : (Math.random() - 0.5) * 0.1,
        );
        vec.normalize().multiplyScalar(r);
        pts.push(vec);
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const colors = [0x60a5fa, 0x34d399, 0xf87171];
      const mat = new THREE.PointsMaterial({ color: colors[axis], size: 0.05, transparent: true, opacity: 0.75 });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      animatables.push({
        update(t: number) {
          points.rotation.y = t * 0.3;
        },
      });
    }
  } else {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 150; i++) {
      const theta = (i / 150) * Math.PI * 2;
      const r = 1.6;
      pts.push(new THREE.Vector3(r * Math.sin(theta) * Math.cos(theta), r * Math.cos(theta), r * Math.sin(theta) * Math.sin(theta)));
    }
    const geo = new THREE.TorusGeometry(1.5, 0.15, 32, 120);
    const mat = material(THREE, 0x34d399, { emissive: 0x064e3b, emissiveIntensity: 0.3 });
    const torus = new THREE.Mesh(geo, mat);
    scene.add(torus);
    const nucleusGeo = new THREE.SphereGeometry(0.3, 32, 24);
    const nucleusMat = material(THREE, 0xef4444, { emissive: 0x7f1d1d, emissiveIntensity: 0.5 });
    scene.add(new THREE.Mesh(nucleusGeo, nucleusMat));
    animatables.push({
      update(t: number) {
        torus.rotation.x = t * 0.5;
        torus.rotation.y = t * 0.35;
      },
    });
  }
}

// ---------------- chemical bonding ----------------
function buildBondingScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>) {
  const colors = [0x3b82f6, 0x22c55e, 0xf59e0b];
  const atoms: THREE.Mesh[] = [];
  const bonds: THREE.Mesh[] = [];

  for (let i = 0; i < 3; i++) {
    const atomGeo = new THREE.SphereGeometry(0.3, 32, 24);
    const atomMat = material(THREE, colors[i], { emissive: colors[i], emissiveIntensity: 0.2 });
    const atom = new THREE.Mesh(atomGeo, atomMat);
    atom.position.set(Math.cos((i / 3) * Math.PI * 2) * 1.5, 0, Math.sin((i / 3) * Math.PI * 2) * 1.5);
    scene.add(atom);
    atoms.push(atom);

    const bondGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5, 12);
    const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const bond = new THREE.Mesh(bondGeo, bondMat);
    bond.position.set(0, 0, 0);
    bond.rotation.z = Math.PI / 2;
    bond.rotation.y = -(i / 3) * Math.PI * 2;
    scene.add(bond);
    bonds.push(bond);
  }

  animatables.push({
    update(t: number) {
      for (let i = 0; i < atoms.length; i++) {
        const angle = (i / atoms.length) * Math.PI * 2 + t * 0.4;
        atoms[i].position.set(Math.cos(angle) * 1.5, Math.sin(t + i) * 0.2, Math.sin(angle) * 1.5);
        bonds[i].rotation.y = -(i / atoms.length) * Math.PI * 2;
        bonds[i].position.copy(atoms[i].position).multiplyScalar(0.5);
      }
    },
  });
}

// ---------------- periodic trends / comparison bars ----------------
function buildComparisonScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>) {
  const barColors = [0x3b82f6, 0x22c55e, 0xf59e0b, 0xef4444, 0xa855f7];
  const barHeights = [2.5, 1.8, 3.2, 1.2, 2.1];
  const bars: THREE.Mesh[] = [];

  for (let i = 0; i < barHeights.length; i++) {
    const geo = new THREE.BoxGeometry(0.5, barHeights[i], 0.5);
    const mat = material(THREE, barColors[i], { emissive: barColors[i], emissiveIntensity: 0.15 });
    const bar = new THREE.Mesh(geo, mat);
    bar.position.set((i - 2) * 1.2, barHeights[i] / 2, 0);
    scene.add(bar);
    bars.push(bar);

    const valueGeo = new THREE.SphereGeometry(0.1, 16, 12);
    const valueMat = material(THREE, 0xffffff);
    const dot = new THREE.Mesh(valueGeo, valueMat);
    dot.position.set((i - 2) * 1.2, barHeights[i] + 0.15, 0);
    scene.add(dot);
  }

  animatables.push({
    update(t: number) {
      for (let i = 0; i < bars.length; i++) {
        const base = barHeights[i];
        const h = base + Math.sin(t * 1.8 + i * 1.1) * 0.2;
        bars[i].scale.y = h / base;
        bars[i].position.y = h / 2;
      }
    },
  });
}

// ---------------- coordinate axes / octants ----------------
function buildCoordinateScene(THREE: typeof import("three"), scene: THREE.Scene) {
  const axes = [
    { dir: new THREE.Vector3(1, 0, 0), color: 0xef4444, label: "X" },
    { dir: new THREE.Vector3(0, 1, 0), color: 0x22c55e, label: "Y" },
    { dir: new THREE.Vector3(0, 0, 1), color: 0x3b82f6, label: "Z" },
  ];

  for (const axis of axes) {
    const dir = axis.dir.clone().multiplyScalar(4);
    const origin = new THREE.Vector3(0, 0, 0);
    const arrow = new THREE.ArrowHelper(dir, origin, 4, axis.color, 0.3, 0.2);
    scene.add(arrow);
  }

  const boxGeo = new THREE.BoxGeometry(3, 3, 3);
  const boxMat = new THREE.MeshBasicMaterial({ color: 0x475569, wireframe: true, transparent: true, opacity: 0.3 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.set(1.5, 1.5, 1.5);
  scene.add(box);
}

// ---------------- hyperboloid / saddle surface ----------------
function buildHyperboloidScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>) {
  const geo = new THREE.TorusKnotGeometry(1.4, 0.45, 200, 32);
  const mat = material(THREE, 0xa78bfa, { emissive: 0x4c1d95, emissiveIntensity: 0.25 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  animatables.push({
    update(t: number) {
      mesh.rotation.x = t * 0.3;
      mesh.rotation.y = t * 0.45;
    },
  });
}

// ---------------- abstract fallback ----------------
function buildAbstractScene(THREE: typeof import("three"), scene: THREE.Scene) {
  const geo = new THREE.TorusKnotGeometry(1, 0.32, 160, 24);
  const mat = material(THREE, 0x3b82f6, { emissive: 0x1e3a8a, emissiveIntensity: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xbfdbfe, wireframe: true, transparent: true, opacity: 0.2 });
  const wire = new THREE.Mesh(geo, wireMat);
  scene.add(wire);
}