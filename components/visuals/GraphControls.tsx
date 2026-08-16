"use client";

import type { SceneParams } from "@/components/visuals/ThreeScene";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function GraphControls({ figureKey, label, params, onChange }: { figureKey: string; label: string; params: SceneParams; onChange: (next: SceneParams) => void }) {
  const set = <K extends keyof SceneParams>(key: K, value: SceneParams[K]) => onChange({ ...params, [key]: value });

  if (figureKey === "trajectory" && (label.toLowerCase().includes("projectile") || label.toLowerCase().includes("circular") === false && label.toLowerCase().includes("motion"))) {
    const isProjectile = label.toLowerCase().includes("projectile");
    if (isProjectile) {
      return (
        <div className="graph-controls">
          <div className="graph-control">
            <label>Velocity (m/s)</label>
            <input type="range" min={5} max={20} step={0.5} value={params.velocity ?? 5.5} onChange={(e) => set("velocity", Number(e.target.value))} />
            <span>{(params.velocity ?? 5.5).toFixed(1)}</span>
          </div>
          <div className="graph-control">
            <label>Launch angle (°)</label>
            <input type="range" min={10} max={80} step={1} value={params.angleDeg ?? 36} onChange={(e) => set("angleDeg", Number(e.target.value))} />
            <span>{(params.angleDeg ?? 36)}°</span>
          </div>
          <div className="graph-control">
            <label>Gravity (m/s²)</label>
            <input type="range" min={1} max={20} step={0.5} value={params.gravity ?? 3.5} onChange={(e) => set("gravity", Number(e.target.value))} />
            <span>{(params.gravity ?? 3.5).toFixed(1)}</span>
          </div>
        </div>
      );
    }
  }

  if (label.toLowerCase().includes("circular") || label.toLowerCase().includes("centripetal")) {
    return (
      <div className="graph-controls">
        <div className="graph-control">
          <label>Radius</label>
          <input type="range" min={1} max={4} step={0.1} value={params.circularRadius ?? 2} onChange={(e) => set("circularRadius", Number(e.target.value))} />
          <span>{(params.circularRadius ?? 2).toFixed(1)}</span>
        </div>
        <div className="graph-control">
          <label>Angular speed</label>
          <input type="range" min={0.5} max={5} step={0.1} value={params.angularSpeed ?? 1.8} onChange={(e) => set("angularSpeed", Number(e.target.value))} />
          <span>{(params.angularSpeed ?? 1.8).toFixed(1)}</span>
        </div>
      </div>
    );
  }

  if (label.toLowerCase().includes("electric") || label.toLowerCase().includes("magnetic")) {
    return (
      <div className="graph-controls">
        <div className="graph-control">
          <label>Charge magnitude</label>
          <input type="range" min={0.5} max={10} step={0.5} value={params.chargeMagnitude ?? 1} onChange={(e) => set("chargeMagnitude", Number(e.target.value))} />
          <span>{(params.chargeMagnitude ?? 1).toFixed(1)}</span>
        </div>
        <div className="graph-control">
          <label>Field lines</label>
          <input type="range" min={8} max={48} step={1} value={params.fieldLines ?? 24} onChange={(e) => set("fieldLines", Number(e.target.value))} />
          <span>{(params.fieldLines ?? 24)}</span>
        </div>
      </div>
    );
  }

  if (label.toLowerCase().includes("superposition") || label.toLowerCase().includes("interference")) {
    return (
      <div className="graph-controls">
        <div className="graph-control">
          <label>Wave 1 frequency</label>
          <input type="range" min={0.5} max={5} step={0.1} value={params.wave1Freq ?? 2.2} onChange={(e) => set("wave1Freq", Number(e.target.value))} />
          <span>{(params.wave1Freq ?? 2.2).toFixed(1)}</span>
        </div>
        <div className="graph-control">
          <label>Wave 2 frequency</label>
          <input type="range" min={0.5} max={5} step={0.1} value={params.wave2Freq ?? 2.8} onChange={(e) => set("wave2Freq", Number(e.target.value))} />
          <span>{(params.wave2Freq ?? 2.8).toFixed(1)}</span>
        </div>
        <div className="graph-control">
          <label>Phase difference</label>
          <input type="range" min={0} max={3} step={0.1} value={params.wavePhase ?? 1.1} onChange={(e) => set("wavePhase", Number(e.target.value))} />
          <span>{(params.wavePhase ?? 1.1).toFixed(1)}</span>
        </div>
        <div className="graph-control">
          <label>Amplitude</label>
          <input type="range" min={0.5} max={2} step={0.1} value={params.amplitude ?? 1.1} onChange={(e) => set("amplitude", Number(e.target.value))} />
          <span>{(params.amplitude ?? 1.1).toFixed(1)}</span>
        </div>
      </div>
    );
  }

  if (figureKey === "shm" || label.toLowerCase().includes("harmonic")) {
    return (
      <div className="graph-controls">
        <div className="graph-control">
          <label>Amplitude</label>
          <input type="range" min={0.5} max={2.5} step={0.1} value={params.amplitude ?? 2} onChange={(e) => set("amplitude", Number(e.target.value))} />
          <span>{(params.amplitude ?? 2).toFixed(1)}</span>
        </div>
        <div className="graph-control">
          <label>Frequency</label>
          <input type="range" min={0.5} max={5} step={0.1} value={params.shmFrequency ?? 1.5} onChange={(e) => set("shmFrequency", Number(e.target.value))} />
          <span>{(params.shmFrequency ?? 1.5).toFixed(1)}</span>
        </div>
      </div>
    );
  }

  if (label.toLowerCase().includes("vsepr") || label.toLowerCase().includes("molecular geometry")) {
    return (
      <div className="graph-controls">
        <div className="graph-control">
          <label>Bond length</label>
          <input type="range" min={1} max={2.2} step={0.05} value={params.bondLength ?? 1.35} onChange={(e) => set("bondLength", Number(e.target.value))} />
          <span>{(params.bondLength ?? 1.35).toFixed(2)}</span>
        </div>
        <div className="graph-control">
          <label>Rotation speed</label>
          <input type="range" min={0} max={2} step={0.1} value={params.rotationSpeed ?? 0.55} onChange={(e) => set("rotationSpeed", Number(e.target.value))} />
          <span>{(params.rotationSpeed ?? 0.55).toFixed(1)}</span>
        </div>
      </div>
    );
  }

  if (label.toLowerCase().includes("crystal") || label.toLowerCase().includes("lattice")) {
    return (
      <div className="graph-controls">
        <div className="graph-control">
          <label>Lattice spacing</label>
          <input type="range" min={1} max={3} step={0.1} value={params.latticeSpacing ?? 1.6} onChange={(e) => set("latticeSpacing", Number(e.target.value))} />
          <span>{(params.latticeSpacing ?? 1.6).toFixed(1)}</span>
        </div>
        <div className="graph-control">
          <label>Atom size</label>
          <input type="range" min={0.1} max={0.4} step={0.01} value={params.atomSize ?? 0.2} onChange={(e) => set("atomSize", Number(e.target.value))} />
          <span>{(params.atomSize ?? 0.2).toFixed(2)}</span>
        </div>
      </div>
    );
  }

  if (label.toLowerCase().includes("atomic orbitals") || label.toLowerCase().includes("orbital")) {
    return (
      <div className="graph-controls">
        <div className="graph-control">
          <label>Orbital size</label>
          <input type="range" min={0.5} max={2} step={0.1} value={params.atomSize ?? 1} onChange={(e) => set("atomSize", Number(e.target.value))} />
          <span>{(params.atomSize ?? 1).toFixed(1)}</span>
        </div>
      </div>
    );
  }

  if (figureKey === "bonding" || label.toLowerCase().includes("chemical bonding")) {
    return (
      <div className="graph-controls">
        <div className="graph-control">
          <label>Bond length</label>
          <input type="range" min={1} max={2.2} step={0.05} value={params.bondLength ?? 1.6} onChange={(e) => set("bondLength", Number(e.target.value))} />
          <span>{(params.bondLength ?? 1.6).toFixed(2)}</span>
        </div>
      </div>
    );
  }

  if (label.toLowerCase().includes("periodic trends") || label.toLowerCase().includes("comparison")) {
    return (
      <div className="graph-controls">
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="graph-control" key={`bar-${i}`}>
            <label>Value {i + 1}</label>
            <input
              type="range"
              min={0.2}
              max={5}
              step={0.1}
              value={(params.barValues?.[i] ?? [2.5, 1.8, 3.2, 1.2, 2.1][i])}
              onChange={(e) => {
                const next = [...(params.barValues ?? [2.5, 1.8, 3.2, 1.2, 2.1])];
                next[i] = Number(e.target.value);
                set("barValues", next);
              }}
            />
            <span>{(params.barValues?.[i] ?? [2.5, 1.8, 3.2, 1.2, 2.1][i]).toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (label.toLowerCase().includes("spiral") || label.toLowerCase().includes("helix")) {
    return (
      <div className="graph-controls">
        <div className="graph-control">
          <label>Radius</label>
          <input type="range" min={1} max={3} step={0.1} value={params.helixRadius ?? 1.6} onChange={(e) => set("helixRadius", Number(e.target.value))} />
          <span>{(params.helixRadius ?? 1.6).toFixed(1)}</span>
        </div>
        <div className="graph-control">
          <label>Pitch</label>
          <input type="range" min={4} max={10} step={0.5} value={params.helixPitch ?? 7} onChange={(e) => set("helixPitch", Number(e.target.value))} />
          <span>{(params.helixPitch ?? 7).toFixed(1)}</span>
        </div>
      </div>
    );
  }

  if (label.toLowerCase().includes("hyperboloid") || label.toLowerCase().includes("saddle")) {
    return (
      <div className="graph-controls">
        <div className="graph-control">
          <label>Curvature</label>
          <input type="range" min={0.1} max={1} step={0.05} value={params.saddleCurve ?? 0.35} onChange={(e) => set("saddleCurve", Number(e.target.value))} />
          <span>{(params.saddleCurve ?? 0.35).toFixed(2)}</span>
        </div>
      </div>
    );
  }

  return null;
}
