"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

const CAMERA_PRESETS: Record<string, [number, number, number]> = {
  trajectory: [4, 2.5, 5],
  circular: [3, 3, 4],
  vectorfield: [5, 3, 5],
  wave: [3, 2.5, 5],
  shm: [4, 2, 5],
  molecular: [3.5, 2.5, 4],
  barchart: [4, 3, 5],
  coordinate: [4, 3, 5],
  bonding: [3.5, 2.5, 5],
  abstract: [3.5, 2.5, 5],
};

function getCameraPosition(figureType: string, topicTitle: string | undefined): [number, number, number] {
  const key = figureType.toLowerCase();
  const title = (topicTitle ?? "").toLowerCase();

  if (title.includes("projectile")) return [4.5, 1.2, 5];
  if (title.includes("circular") || title.includes("centripetal")) return [0, 2.8, 4.5];
  if (title.includes("electric") || title.includes("magnetic") || title.includes("field")) return [5, 4, 5];
  if (title.includes("superposition") || title.includes("interference")) return [3.5, 2, 5.5];
  if (key === "shm" || title.includes("harmonic")) return [4, 2, 5];
  if (title.includes("vsepr") || title.includes("molecular geometry")) return [3.5, 2.5, 4.5];
  if (title.includes("crystal") || title.includes("lattice")) return [5, 4, 5];
  if (title.includes("orbital") || title.includes("atomic")) return [3, 2.5, 4.5];
  if (title.includes("periodic") || title.includes("trends")) return [4, 3, 5];
  if (key === "bonding" || title.includes("bonding")) return [3.5, 2.5, 5];
  if (title.includes("parabola") || title.includes("conic")) return [4, 2.5, 5];
  if (title.includes("hyperboloid") || title.includes("saddle")) return [3.5, 2.5, 5.5];
  if (title.includes("vector") && key === "barchart") return [4.5, 2.5, 5];
  if (title.includes("spiral") || title.includes("helix")) return [4, 3, 4.5];
  if (key === "coordinate" || title.includes("coordinate") || title.includes("octant")) return [4.5, 3.5, 4.5];

  return CAMERA_PRESETS[key] ?? CAMERA_PRESETS.abstract;
}

function getSceneConfig(figureType: string, topicTitle: string | undefined) {
  const key = figureType.toLowerCase();
  const title = (topicTitle ?? "").toLowerCase();

  if (title.includes("projectile")) return { background: 0x0f172a, autoRotate: false, rotateSpeed: 0 };
  if (title.includes("circular") || title.includes("centripetal")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.4 };
  if (title.includes("electric") || title.includes("magnetic") || title.includes("field")) return { background: 0x020617, autoRotate: true, rotateSpeed: 0.25 };
  if (title.includes("superposition") || title.includes("interference")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.3 };
  if (key === "shm" || title.includes("harmonic") || title.includes("simple harmonic")) return { background: 0x0f172a, autoRotate: false, rotateSpeed: 0 };
  if (title.includes("vsepr") || title.includes("molecular geometry")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.5 };
  if (title.includes("crystal") || title.includes("lattice")) return { background: 0x020617, autoRotate: true, rotateSpeed: 0.35 };
  if (title.includes("orbital") || title.includes("atomic")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.45 };
  if (title.includes("periodic") || title.includes("trends")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.2 };
  if (key === "bonding" || title.includes("bonding")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.4 };
  if (title.includes("parabola") || title.includes("conic")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.35 };
  if (title.includes("hyperboloid") || title.includes("saddle")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.4 };
  if (title.includes("vector") && key === "barchart") return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.3 };
  if (title.includes("spiral") || title.includes("helix")) return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.5 };
  if (key === "coordinate" || title.includes("coordinate") || title.includes("octant")) return { background: 0x020617, autoRotate: true, rotateSpeed: 0.2 };

  if (key === "trajectory") return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.3 };
  if (key === "molecular") return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.5 };
  if (key === "wave") return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.3 };
  if (key === "vectorfield") return { background: 0x020617, autoRotate: true, rotateSpeed: 0.25 };
  if (key === "barchart") return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.2 };
  if (key === "shm") return { background: 0x0f172a, autoRotate: false, rotateSpeed: 0 };
  if (key === "bonding") return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.4 };
  if (key === "coordinate") return { background: 0x020617, autoRotate: true, rotateSpeed: 0.2 };
  return { background: 0x0f172a, autoRotate: true, rotateSpeed: 0.3 };
}

function disposeSafe(obj: { dispose?: () => void } | null | undefined) {
  obj?.dispose?.();
}

function updateSceneLabel(container: HTMLDivElement | null, figureType: string, topicTitle: string | undefined) {
  if (!container) return;
  const title = (topicTitle ?? "").toLowerCase();
  const key = figureType.toLowerCase();
  let text = "";
  let sub = "";

  if (title.includes("projectile")) {
    text = "Projectile motion";
    sub = "Parabolic trajectory • gravity • range";
  } else if (title.includes("circular") || title.includes("centripetal")) {
    text = "Circular motion";
    sub = "Centripetal acceleration • tangential velocity";
  } else if (title.includes("electric")) {
    text = "Electric field";
    sub = "Radial field lines • positive charge";
  } else if (title.includes("magnetic")) {
    text = "Magnetic field";
    sub = "3D helical field lines";
  } else if (title.includes("superposition") || title.includes("interference")) {
    text = "Wave superposition";
    sub = "Constructive / destructive interference";
  } else if (title.includes("harmonic")) {
    text = "Simple harmonic motion";
    sub = "Periodic • restoring force • amplitude";
  } else if (title.includes("vsepr") || title.includes("molecular geometry")) {
    text = "VSEPR geometry";
    sub = "Bond angles • molecular shape";
  } else if (title.includes("crystal") || title.includes("lattice")) {
    text = "Crystal lattice";
    sub = "Unit cells • repeating 3D pattern";
  } else if (title.includes("orbital") || title.includes("atomic")) {
    text = "Atomic orbital";
    sub = "Electron probability cloud";
  } else if (title.includes("periodic") || title.includes("trends")) {
    text = "Periodic trends";
    sub = "Atomic radius • electronegativity • ionization energy";
  } else if (title.includes("bonding")) {
    text = "Chemical bonding";
    sub = "Covalent / ionic bond model";
  } else if (title.includes("parabola") || title.includes("conic")) {
    text = "Conic section";
    sub = "Parabola / ellipse / hyperbola surface";
  } else if (title.includes("hyperboloid") || title.includes("saddle")) {
    text = "Hyperboloid / saddle";
    sub = "Ruled surface • double curvature";
  } else if (key === "barchart" && title.includes("vector")) {
    text = "Vector addition";
    sub = "Tip-to-tail rule • resultant";
  } else if (key === "barchart") {
    text = "Comparison chart";
    sub = "Magnitude comparison across categories";
  } else if (title.includes("spiral") || title.includes("helix")) {
    text = "Helix / spiral";
    sub = "Parametric curve • pitch • radius";
  } else if (title.includes("coordinate") || title.includes("octant")) {
    text = "3D coordinate system";
    sub = "X / Y / Z axes • octants";
  } else if (key === "trajectory") {
    text = "Graph / trajectory";
    sub = "Mathematical curve in 3D space";
  } else if (key === "wave") {
    text = "Wave / oscillation";
    sub = "Amplitude • frequency • phase";
  } else if (key === "vectorfield") {
    text = "Vector field";
    sub = "Direction & magnitude at each point";
  } else if (key === "molecular") {
    text = "Molecular model";
    sub = "Atoms • bonds • 3D structure";
  }

  container.textContent = text || figureType;
  if (sub) {
    container.setAttribute("data-sub", sub);
  } else {
    container.removeAttribute("data-sub");
  }
}

export type SceneParams = {
  velocity?: number;
  angleDeg?: number;
  gravity?: number;
  circularRadius?: number;
  angularSpeed?: number;
  chargeMagnitude?: number;
  fieldLines?: number;
  wave1Freq?: number;
  wave2Freq?: number;
  wavePhase?: number;
  amplitude?: number;
  shmFrequency?: number;
  bondLength?: number;
  rotationSpeed?: number;
  latticeSpacing?: number;
  atomSize?: number;
  saddleCurve?: number;
  helixRadius?: number;
  helixPitch?: number;
  barValues?: number[];
};

export default function ThreeScene({ className, figureType = "abstract", topicTitle, params = {} }: { className?: string; figureType?: string; topicTitle?: string; params?: SceneParams }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const label = labelRef.current;
    if (!mount || !label) return;

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

      updateSceneLabel(label, figureType, topicTitle);

      if (key === "trajectory" || title.includes("projectile") || title.includes("parabola") || title.includes("conic") || title.includes("graph")) {
        buildTrajectoryScene(THREE, scene, title, animatables, params);
      } else if (title.includes("circular") || title.includes("centripetal")) {
        buildCircularScene(THREE, scene, animatables, params);
      } else if (key === "vectorfield" || title.includes("electric") || title.includes("magnetic") || title.includes("field") || title.includes("vector") || title.includes("force")) {
        buildVectorFieldScene(THREE, scene, title, animatables, params);
      } else if (key === "wave" || title.includes("wave") || title.includes("superposition") || title.includes("interference") || title.includes("oscillation") || title.includes("spiral") || title.includes("helix")) {
        buildWaveScene(THREE, scene, title, animatables, params);
      } else if (key === "shm" || title.includes("harmonic") || title.includes("simple harmonic")) {
        buildSHMScene(THREE, scene, animatables, params);
      } else if (key === "molecular" || title.includes("molecular") || title.includes("orbital") || title.includes("vsepr") || title.includes("crystal") || title.includes("lattice") || key === "bonding" || title.includes("bonding")) {
        if (title.includes("vsepr") || title.includes("molecular geometry")) {
          buildVSEPRScene(THREE, scene, animatables, params);
        } else if (title.includes("crystal") || title.includes("lattice")) {
          buildCrystalLatticeScene(THREE, scene, animatables, params);
        } else if (title.includes("orbital") || title.includes("atomic")) {
          buildOrbitalScene(THREE, scene, title, animatables, params);
        } else if (key === "bonding" || title.includes("bonding")) {
          buildBondingScene(THREE, scene, animatables, params);
        } else {
          buildMolecularScene(THREE, scene, animatables, params);
        }
      } else if (key === "barchart" || title.includes("bar") || title.includes("chart") || title.includes("comparison") || title.includes("periodic") || title.includes("trends")) {
        buildComparisonScene(THREE, scene, animatables, params);
      } else if (key === "coordinate" || title.includes("coordinate") || title.includes("octant")) {
        buildCoordinateScene(THREE, scene, params);
      } else if (title.includes("hyperboloid") || title.includes("saddle")) {
        buildHyperboloidScene(THREE, scene, animatables, params);
      } else {
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
  }, [figureType, topicTitle, params]);

  return (
    <div
      ref={mountRef}
      className={className ?? "three-scene"}
      aria-label="Interactive 3D model — drag to rotate, scroll to zoom"
      role="img"
    >
      <div ref={labelRef} className="three-scene-label" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scene builders — each returns an array of { update(t: number): void } objects
// ---------------------------------------------------------------------------

function material(THREE: typeof import("three"), color: number, opts?: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.45, ...opts });
}

// ---------------- trajectory / projectile ----------------
function buildTrajectoryScene(THREE: typeof import("three"), scene: THREE.Scene, title: string, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  const velocity = params.velocity ?? 5.5;
  const angleDeg = params.angleDeg ?? 36;
  const gravity = params.gravity ?? 3.5;
  const angle = (angleDeg * Math.PI) / 180;
  const isProjectile = title.includes("projectile");
  const isParabola = title.includes("parabola") || title.includes("conic");

  if (isProjectile) {
    const range = (velocity * velocity * Math.sin(2 * angle)) / gravity;
    const maxH = (velocity * velocity * Math.sin(angle) * Math.sin(angle)) / (2 * gravity);
    const tFlight = (2 * velocity * Math.sin(angle)) / gravity;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * tFlight;
      const x = velocity * Math.cos(angle) * t;
      const y = velocity * Math.sin(angle) * t - 0.5 * gravity * t * t;
      pts.push(new THREE.Vector3(x - range / 2, Math.max(y, 0), 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x60a5fa, linewidth: 2 });
    scene.add(new THREE.Line(geo, mat));

    const groundGeo = new THREE.PlaneGeometry(range + 2, 0.08);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.7 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    const ballGeo = new THREE.SphereGeometry(0.18, 32, 24);
    const ballMat = material(THREE, 0xfacc15, { emissive: 0x78350f, emissiveIntensity: 0.4 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    scene.add(ball);

    const velocityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      0xf87171,
      0.2,
      0.15,
    );
    scene.add(velocityArrow);

    animatables.push({
      update(t: number) {
        const tt = (t * 0.35) % 1;
        const idx = Math.floor(tt * (pts.length - 1));
        const p = pts[Math.min(idx, pts.length - 1)];
        ball.position.copy(p);

        const t1 = tt * tFlight;
        const vx = velocity * Math.cos(angle);
        const vy = velocity * Math.sin(angle) - gravity * t1;
        const vLen = Math.sqrt(vx * vx + vy * vy);
        if (vLen > 0.01) {
          velocityArrow.position.copy(p);
          velocityArrow.setDirection(new THREE.Vector3(vx / vLen, Math.max(vy / vLen, 0), 0));
          velocityArrow.setLength(Math.min(vLen * 0.4, 1.8), Math.min(vLen * 0.15, 0.4), Math.min(vLen * 0.1, 0.25));
        }
      },
    });
  } else if (isParabola) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * 10 - 5;
      const y = x * x * 0.25;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x60a5fa });
    scene.add(new THREE.Line(geo, mat));

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
  } else {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * 10 - 5;
      const y = Math.sin(x * 1.5) * 1.8 + Math.cos(x * 0.7) * 0.6;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x60a5fa });
    scene.add(new THREE.Line(geo, mat));

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
function buildCircularScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  const radius = params.circularRadius ?? 2;
  const angularSpeed = params.angularSpeed ?? 1.8;
  const ringGeo = new THREE.TorusGeometry(radius, 0.03, 16, 120);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  const centerGeo = new THREE.SphereGeometry(0.25, 32, 24);
  const centerMat = material(THREE, 0xf87171, { emissive: 0x7f1d1d, emissiveIntensity: 0.5 });
  scene.add(new THREE.Mesh(centerGeo, centerMat));

  const ballGeo = new THREE.SphereGeometry(0.22, 32, 24);
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
      const angle = t * angularSpeed;
      ball.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      tangentArrow.position.copy(ball.position);
      tangentArrow.setDirection(new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)));
      radialArrow.position.copy(ball.position);
      radialArrow.setDirection(new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle)));
    },
  });
}

// ---------------- vector field ----------------
function buildVectorFieldScene(THREE: typeof import("three"), scene: THREE.Scene, title: string, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  const isElectric = title.includes("electric");
  const isMagnetic = title.includes("magnetic");
  const magnitude = params.chargeMagnitude ?? 1;
  const lineCount = params.fieldLines ?? 24;

  if (isElectric) {
    const chargeGeo = new THREE.SphereGeometry(0.35, 32, 24);
    const chargeMat = material(THREE, 0xef4444, { emissive: 0x7f1d1d, emissiveIntensity: 0.7 });
    const charge = new THREE.Mesh(chargeGeo, chargeMat);
    scene.add(charge);

    const count = Math.max(8, Math.min(48, lineCount));
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const phi = Math.PI * 0.35 + Math.sin(theta * 3) * 0.25;
      const len = (1.4 + Math.sin(theta * 2) * 0.6) * magnitude;
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      ).normalize();
      const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), len, 0x60a5fa, 0.18, 0.12);
      scene.add(arrow);
      animatables.push({
        update(t: number) {
          const s = 1 + Math.sin(t * 2 + i) * 0.12;
          arrow.setLength(len * s, len * s * 0.13, len * s * 0.09);
        },
      });
    }
  } else if (isMagnetic) {
    const wireGeo = new THREE.CylinderGeometry(0.08, 0.08, 7, 16);
    const wireMat = material(THREE, 0xfacc15, { emissive: 0x78350f, emissiveIntensity: 0.5 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wire);

    for (let i = 0; i < 24; i++) {
      const z = (i / 24) * 7 - 3.5;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 80; j++) {
        const a = (j / 80) * Math.PI * 4;
        const r = 1.6;
        pts.push(new THREE.Vector3(Math.cos(a) * r, z, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.7 });
      scene.add(new THREE.Line(geo, mat));
    }
  } else {
    for (let x = -2; x <= 2; x += 1) {
      for (let y = -2; y <= 2; y += 1) {
        for (let z = -2; z <= 2; z += 1) {
          const len = Math.sqrt(x * x + y * y + z * z) || 1;
          const dir = new THREE.Vector3(x / len, y / len, z / len);
          const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(x, y, z), 0.7 * magnitude, 0x60a5fa, 0.12, 0.08);
          scene.add(arrow);
        }
      }
    }
  }
}

// ---------------- wave / superposition / helix ----------------
function buildWaveScene(THREE: typeof import("three"), scene: THREE.Scene, title: string, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  const isSuperposition = title.includes("superposition") || title.includes("interference");
  const isHelix = title.includes("spiral") || title.includes("helix");
  const freq1 = params.wave1Freq ?? 2.2;
  const freq2 = params.wave2Freq ?? 2.8;
  const phase = params.wavePhase ?? 1.1;
  const amp = params.amplitude ?? 1.1;

  if (isHelix) {
    const radius = params.helixRadius ?? 1.6;
    const pitch = params.helixPitch ?? 7;
    const pts: THREE.Vector3[] = [];
    const N = 400;
    for (let i = 0; i <= N; i++) {
      const frac = i / N;
      const a = frac * Math.PI * 8;
      const y = frac * pitch - pitch / 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, 0.14, 16, false);
    const mat = material(THREE, 0xa78bfa, { emissive: 0x4c1d95, emissiveIntensity: 0.35 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const backbonePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const frac = i / 60;
      const a = frac * Math.PI * 8;
      const y = frac * pitch - pitch / 2;
      backbonePts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
    }
    const backboneGeo = new THREE.BufferGeometry().setFromPoints(backbonePts);
    const backboneMat = new THREE.LineBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.5 });
    const backbone = new THREE.Line(backboneGeo, backboneMat);
    scene.add(backbone);

    animatables.push({
      update(t: number) {
        mesh.rotation.y = t * 0.35;
        backbone.rotation.y = t * 0.35;
      },
    });
  } else if (isSuperposition) {
    const N = 120;
    const pts1: THREE.Vector3[] = [];
    const pts2: THREE.Vector3[] = [];
    const ptsSum: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * 9 - 4.5;
      pts1.push(new THREE.Vector3(x, Math.sin(x * freq1) * amp, 0));
      pts2.push(new THREE.Vector3(x, Math.sin(x * freq2 + phase) * amp, 0));
      ptsSum.push(new THREE.Vector3(x, Math.sin(x * freq1) * amp + Math.sin(x * freq2 + phase) * amp, 0));
    }
    const makeLine = (pts: THREE.Vector3[], color: number, z: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color });
      const line = new THREE.Line(geo, mat);
      line.position.z = z;
      scene.add(line);
      return line;
    };
    const line1 = makeLine(pts1, 0x60a5fa, -0.7);
    const line2 = makeLine(pts2, 0xf87171, 0.7);
    const lineSum = makeLine(ptsSum, 0xfacc15, 0);

    animatables.push({
      update(t: number) {
        const offset = t * 2.2;
        for (let i = 0; i <= N; i++) {
          const x = (i / N) * 9 - 4.5;
          (line1.geometry as THREE.BufferGeometry).attributes.position.setXYZ(i, x, Math.sin(x * freq1 + offset) * amp, -0.7);
          (line2.geometry as THREE.BufferGeometry).attributes.position.setXYZ(i, x, Math.sin(x * freq2 + phase + offset) * amp, 0.7);
          (lineSum.geometry as THREE.BufferGeometry).attributes.position.setXYZ(i, x, Math.sin(x * freq1 + offset) * amp + Math.sin(x * freq2 + phase + offset) * amp, 0);
        }
        (line1.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
        (line2.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
        (lineSum.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
      },
    });
  } else {
    const pts: THREE.Vector3[] = [];
    const N = 240;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * 11 - 5.5;
      pts.push(new THREE.Vector3(x, Math.sin(x * 1.6) * 1.6, 0));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.11, 16, false);
    const mat = material(THREE, 0x34d399, { emissive: 0x064e3b, emissiveIntensity: 0.3 });
    const tube = new THREE.Mesh(geo, mat);
    scene.add(tube);
    animatables.push({
      update(t: number) {
        tube.rotation.x = t * 0.22;
      },
    });
  }
}

// ---------------- simple harmonic motion ----------------
function buildSHMScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  const amplitude = params.amplitude ?? 2;
  const frequency = params.shmFrequency ?? 1.5;
  const anchorGeo = new THREE.SphereGeometry(0.22, 32, 24);
  const anchorMat = material(THREE, 0x94a3b8);
  const anchor = new THREE.Mesh(anchorGeo, anchorMat);
  anchor.position.set(0, 2.6, 0);
  scene.add(anchor);

  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 2.6, 0), new THREE.Vector3(0, -1.6, 0)]);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.7 });
  const line = new THREE.Line(lineGeo, lineMat);
  scene.add(line);

  const bobGeo = new THREE.SphereGeometry(0.38, 32, 24);
  const bobMat = material(THREE, 0xfacc15, { emissive: 0x78350f, emissiveIntensity: 0.4 });
  const bob = new THREE.Mesh(bobGeo, bobMat);
  scene.add(bob);

  const restoringArrow = new THREE.ArrowHelper(
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    0xef4444,
    0.22,
    0.16,
  );
  scene.add(restoringArrow);

  const equilibriumGeo = new THREE.SphereGeometry(0.08, 16, 12);
  const equilibriumMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const equilibrium = new THREE.Mesh(equilibriumGeo, equilibriumMat);
  equilibrium.position.set(0, -1.6, 0);
  scene.add(equilibrium);

  const pathGeo = new THREE.TorusGeometry(amplitude, 0.02, 16, 120);
  const pathMat = new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.35 });
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.rotation.x = Math.PI / 2;
  path.position.y = -1.6;
  scene.add(path);

  animatables.push({
    update(t: number) {
      const angle = Math.sin(t * frequency) * 0.85;
      const x = Math.sin(angle) * amplitude;
      bob.position.set(x, -1.6 + Math.cos(angle) * 0.18, 0);
      restoringArrow.position.set(x, -1.6, 0);
      restoringArrow.setDirection(new THREE.Vector3(-Math.sign(x || 1) * Math.cos(angle), 0, 0));
      restoringArrow.setLength(Math.abs(Math.cos(angle)) * 1.2 || 0.6, Math.abs(Math.cos(angle)) * 0.25 || 0.15, Math.abs(Math.cos(angle)) * 0.16 || 0.1);
    },
  });
}

// ---------------- molecular / VSEPR ----------------
function buildMolecularScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  buildVSEPRScene(THREE, scene, animatables, params);
}

function buildVSEPRScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  const bondLength = params.bondLength ?? 1.35;
  const rotSpeed = params.rotationSpeed ?? 0.55;
  const centerGeo = new THREE.SphereGeometry(0.42, 32, 24);
  const centerMat = material(THREE, 0xfb923c, { emissive: 0x7c2d12, emissiveIntensity: 0.5 });
  const center = new THREE.Mesh(centerGeo, centerMat);
  scene.add(center);

  const bonds: THREE.Mesh[] = [];
  const atoms: THREE.Mesh[] = [];
  const bondCount = 5;
  const angleStep = (Math.PI * 2) / bondCount;

  for (let i = 0; i < bondCount; i++) {
    const angle = i * angleStep;
    const bondGeo = new THREE.CylinderGeometry(0.06, 0.06, bondLength, 12);
    const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
    const bond = new THREE.Mesh(bondGeo, bondMat);
    bond.position.set(Math.cos(angle) * (bondLength / 2), 0, Math.sin(angle) * (bondLength / 2));
    bond.rotation.z = Math.PI / 2;
    bond.rotation.y = -angle;
    scene.add(bond);
    bonds.push(bond);

    const atomGeo = new THREE.SphereGeometry(0.22, 32, 24);
    const atomMat = material(THREE, 0x3b82f6, { emissive: 0x1e3a8a, emissiveIntensity: 0.25 });
    const atom = new THREE.Mesh(atomGeo, atomMat);
    atom.position.set(Math.cos(angle) * bondLength, 0, Math.sin(angle) * bondLength);
    scene.add(atom);
    atoms.push(atom);
  }

  animatables.push({
    update(t: number) {
      center.rotation.y = t * rotSpeed;
      for (let i = 0; i < atoms.length; i++) {
        const angle = i * angleStep + t * rotSpeed;
        atoms[i].position.set(Math.cos(angle) * bondLength, 0, Math.sin(angle) * bondLength);
        bonds[i].position.set(Math.cos(angle) * (bondLength / 2), 0, Math.sin(angle) * (bondLength / 2));
        bonds[i].rotation.z = Math.PI / 2;
        bonds[i].rotation.y = -angle;
      }
    },
  });
}

// ---------------- crystal lattice ----------------
function buildCrystalLatticeScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  const unitCells: THREE.Mesh[] = [];
  const colors = [0x3b82f6, 0x22c55e, 0xf59e0b];
  const spacing = params.latticeSpacing ?? 1.6;
  const size = params.atomSize ?? 0.2;

  const boxGeo = new THREE.BoxGeometry(spacing, spacing, spacing);
  const boxMat = new THREE.MeshBasicMaterial({ color: 0x475569, wireframe: true, transparent: true, opacity: 0.25 });
  const unitBox = new THREE.Mesh(boxGeo, boxMat);
  scene.add(unitBox);

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const color = colors[Math.abs(x + y + z) % colors.length];
        const geo = new THREE.SphereGeometry(size, 24, 18);
        const mat = material(THREE, color, { emissive: color, emissiveIntensity: 0.25 });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.set(x * spacing, y * spacing, z * spacing);
        scene.add(sphere);
        unitCells.push(sphere);
      }
    }
  }

  animatables.push({
    update(t: number) {
      for (let i = 0; i < unitCells.length; i++) {
        const s = 1 + Math.sin(t * 1.6 + i * 0.55) * 0.08;
        unitCells[i].scale.setScalar(s);
      }
    },
  });
}

// ---------------- atomic orbitals ----------------
function buildOrbitalScene(THREE: typeof import("three"), scene: THREE.Scene, title: string, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  const size = params.atomSize ?? 1;

  if (title.includes("d ") || title.includes("d-")) {
    const N = 240;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const theta = (i / N) * Math.PI * 2;
      for (let j = 0; j <= 50; j++) {
        const phi = (j / 50) * Math.PI;
        const r = Math.abs(Math.sin(theta) * Math.sin(theta) * Math.cos(phi) * Math.cos(phi)) * 2.2 * size + 0.03;
        pts.push(new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ));
      }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.045, transparent: true, opacity: 0.85 });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    animatables.push({
      update(t: number) {
        points.rotation.y = t * 0.32;
        points.rotation.x = Math.sin(t * 0.22) * 0.22;
      },
    });
  } else if (title.includes("p ")) {
    for (let axis = 0; axis < 3; axis++) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 140; i++) {
        const t = (i / 140) * 3.2 - 1.6;
        const r = Math.abs(t) * 1.3 * size + 0.03;
        const vec = new THREE.Vector3(
          axis === 0 ? t : (Math.random() - 0.5) * 0.08,
          axis === 1 ? t : (Math.random() - 0.5) * 0.08,
          axis === 2 ? t : (Math.random() - 0.5) * 0.08,
        );
        vec.normalize().multiplyScalar(r);
        pts.push(vec);
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const colors = [0x60a5fa, 0x34d399, 0xf87171];
      const mat = new THREE.PointsMaterial({ color: colors[axis], size: 0.055, transparent: true, opacity: 0.8 });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      animatables.push({
        update(t: number) {
          points.rotation.y = t * 0.28;
        },
      });
    }
  } else {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 180; i++) {
      const theta = (i / 180) * Math.PI * 2;
      const r = 1.7 * size;
      pts.push(new THREE.Vector3(r * Math.sin(theta) * Math.cos(theta), r * Math.cos(theta), r * Math.sin(theta) * Math.sin(theta)));
    }
    const geo = new THREE.TorusGeometry(1.6 * size, 0.18, 32, 140);
    const mat = material(THREE, 0x34d399, { emissive: 0x064e3b, emissiveIntensity: 0.35 });
    const torus = new THREE.Mesh(geo, mat);
    scene.add(torus);
    const nucleusGeo = new THREE.SphereGeometry(0.32, 32, 24);
    const nucleusMat = material(THREE, 0xef4444, { emissive: 0x7f1d1d, emissiveIntensity: 0.6 });
    scene.add(new THREE.Mesh(nucleusGeo, nucleusMat));
    animatables.push({
      update(t: number) {
        torus.rotation.x = t * 0.48;
        torus.rotation.y = t * 0.32;
      },
    });
  }
}

// ---------------- chemical bonding ----------------
function buildBondingScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  const colors = [0x3b82f6, 0x22c55e, 0xf59e0b];
  const atoms: THREE.Mesh[] = [];
  const bonds: THREE.Mesh[] = [];
  const radius = params.bondLength ?? 1.6;

  for (let i = 0; i < 3; i++) {
    const atomGeo = new THREE.SphereGeometry(0.32, 32, 24);
    const atomMat = material(THREE, colors[i], { emissive: colors[i], emissiveIntensity: 0.25 });
    const atom = new THREE.Mesh(atomGeo, atomMat);
    atom.position.set(Math.cos((i / 3) * Math.PI * 2) * radius, 0, Math.sin((i / 3) * Math.PI * 2) * radius);
    scene.add(atom);
    atoms.push(atom);

    const bondGeo = new THREE.CylinderGeometry(0.07, 0.07, radius, 12);
    const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
    const bond = new THREE.Mesh(bondGeo, bondMat);
    bond.position.set(0, 0, 0);
    bond.rotation.z = Math.PI / 2;
    bond.rotation.y = -(i / 3) * Math.PI * 2;
    scene.add(bond);
    bonds.push(bond);
  }

  const nucleusGeo = new THREE.SphereGeometry(0.12, 16, 12);
  const nucleusMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 3; i++) {
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    nucleus.position.set(Math.cos((i / 3) * Math.PI * 2) * radius, 0, Math.sin((i / 3) * Math.PI * 2) * radius);
    scene.add(nucleus);
  }

  animatables.push({
    update(t: number) {
      for (let i = 0; i < atoms.length; i++) {
        const angle = (i / atoms.length) * Math.PI * 2 + t * 0.35;
        atoms[i].position.set(Math.cos(angle) * radius, Math.sin(t + i) * 0.22, Math.sin(angle) * radius);
        bonds[i].rotation.y = -(i / atoms.length) * Math.PI * 2;
        bonds[i].position.copy(atoms[i].position).multiplyScalar(0.5);
      }
    },
  });
}

// ---------------- periodic trends / comparison bars ----------------
function buildComparisonScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  const categories = ["Na", "Mg", "Al", "Si", "P"];
  const values = params.barValues && params.barValues.length >= 5 ? params.barValues.slice(0, 5) : [2.5, 1.8, 3.2, 1.2, 2.1];
  const barColors = [0x3b82f6, 0x22c55e, 0xf59e0b, 0xef4444, 0xa855f7];
  const bars: THREE.Mesh[] = [];
  const labels: THREE.Mesh[] = [];

  for (let i = 0; i < values.length; i++) {
    const height = Math.max(0.2, values[i]);
    const geo = new THREE.BoxGeometry(0.6, height, 0.6);
    const mat = material(THREE, barColors[i], { emissive: barColors[i], emissiveIntensity: 0.2 });
    const bar = new THREE.Mesh(geo, mat);
    bar.position.set((i - 2) * 1.3, height / 2, 0);
    scene.add(bar);
    bars.push(bar);

    const dotGeo = new THREE.SphereGeometry(0.12, 16, 12);
    const dotMat = material(THREE, 0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set((i - 2) * 1.3, height + 0.2, 0);
    scene.add(dot);
    labels.push(dot);
  }

  const groundGeo = new THREE.PlaneGeometry(9, 0.08);
  const groundMat = new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.7 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  animatables.push({
    update(t: number) {
      for (let i = 0; i < bars.length; i++) {
        const base = values[i];
        const h = base + Math.sin(t * 1.8 + i * 1.1) * 0.25;
        bars[i].scale.y = h / base;
        bars[i].position.y = h / 2;
        labels[i].position.y = h + 0.2;
      }
    },
  });
}

// ---------------- coordinate axes / octants ----------------
function buildCoordinateScene(THREE: typeof import("three"), scene: THREE.Scene, params: SceneParams) {
  const axisLength = 4.5;
  const axes = [
    { dir: new THREE.Vector3(1, 0, 0), color: 0xef4444, label: "X" },
    { dir: new THREE.Vector3(0, 1, 0), color: 0x22c55e, label: "Y" },
    { dir: new THREE.Vector3(0, 0, 1), color: 0x3b82f6, label: "Z" },
  ];

  for (const axis of axes) {
    const dir = axis.dir.clone().multiplyScalar(axisLength);
    const origin = new THREE.Vector3(0, 0, 0);
    const arrow = new THREE.ArrowHelper(dir, origin, axisLength, axis.color, 0.35, 0.25);
    scene.add(arrow);
  }

  const boxGeo = new THREE.BoxGeometry(3, 3, 3);
  const boxMat = new THREE.MeshBasicMaterial({ color: 0x475569, wireframe: true, transparent: true, opacity: 0.35 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.set(1.5, 1.5, 1.5);
  scene.add(box);

  const originGeo = new THREE.SphereGeometry(0.1, 16, 12);
  const originMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const origin = new THREE.Mesh(originGeo, originMat);
  scene.add(origin);

  const octantGeo = new THREE.SphereGeometry(0.08, 12, 8);
  const octantMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.6 });
  const octant = new THREE.Mesh(octantGeo, octantMat);
  octant.position.set(1.5, 1.5, 1.5);
  scene.add(octant);
}

// ---------------- hyperboloid / saddle surface ----------------
function buildHyperboloidScene(THREE: typeof import("three"), scene: THREE.Scene, animatables: Array<{ update: (t: number) => void }>, params: SceneParams) {
  const N = 80;
  const size = 3.5;
  const curve = params.saddleCurve ?? 0.35;
  const pts: THREE.Vector3[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const u = (i / N) * size - size / 2;
      const v = (j / N) * size - size / 2;
      const x = u;
      const y = v;
      const z = (u * u - v * v) * curve;
      pts.push(new THREE.Vector3(x, z, y));
      if (i < N && j < N) {
        const a = i * (N + 1) + j;
        const b = a + 1;
        const c = a + N + 1;
        const d = c + 1;
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(pts.length * 3);
  for (let i = 0; i < pts.length; i++) {
    positions[i * 3] = pts[i].x;
    positions[i * 3 + 1] = pts[i].y;
    positions[i * 3 + 2] = pts[i].z;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0xa78bfa,
    emissive: 0x4c1d95,
    emissiveIntensity: 0.25,
    metalness: 0.3,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  const wireGeo = new THREE.WireframeGeometry(geo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.25 });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  scene.add(wire);

  animatables.push({
    update(t: number) {
      mesh.rotation.y = t * 0.25;
      wire.rotation.y = t * 0.25;
    },
  });
}

// ---------------- abstract fallback ----------------
function buildAbstractScene(THREE: typeof import("three"), scene: THREE.Scene) {
  const geo = new THREE.TorusKnotGeometry(1.1, 0.34, 180, 28);
  const mat = material(THREE, 0x3b82f6, { emissive: 0x1e3a8a, emissiveIntensity: 0.25 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xbfdbfe, wireframe: true, transparent: true, opacity: 0.25 });
  const wire = new THREE.Mesh(geo, wireMat);
  scene.add(wire);
}