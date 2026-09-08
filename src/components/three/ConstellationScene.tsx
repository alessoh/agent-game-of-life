"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { WorldEvent } from "@/lib/types";
import { buildLayout, nodeLightness, nodeOffset, MAX_NODES, NODE_SATURATION, type LayoutBounds, type SceneAgent } from "./layout";

/** On desktop the whole constellation sits this far right of centre, clear of the headline. */
const X_SHIFT = 1.5;

export interface ScenePointer {
  x: number;
  y: number;
}

export interface ConstellationSceneProps {
  agents: SceneAgent[];
  /** Events observed since page load, newest first (from `useWorld().liveEvents`). */
  events: WorldEvent[];
  /** Normalised pointer position (-1..1) tracked by the hero, for parallax. */
  pointer: RefObject<ScenePointer>;
  /** Where the constellation sits inside the canvas. */
  align: "right" | "center";
  /** Node budget (lower on mobile). */
  maxCount: number;
  onReady?: () => void;
}

const PAPER = "#fbfaf7";
const FOV = 32;
const CAM_Y = 2.3;
const CAM_Z = 7.8;
const HALF_H = Math.tan(((FOV / 2) * Math.PI) / 180) * Math.hypot(CAM_Y, CAM_Z);
const MAX_PULSES = 24;
const SPAWN_S = 0.9;
const FLASH_S = 1.8;
const PULSE_S = 1.15;

const GOLD = new THREE.Color("#b8860b");
const ROSE = new THREE.Color("#e0335a");
const IDENTITY = new THREE.Quaternion();
const tmpMat = new THREE.Matrix4();
const tmpScale = new THREE.Vector3();
const tmpColor = new THREE.Color();
const tmpVec = new THREE.Vector3();
const tmpDir = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const MAX_TETHERS = MAX_NODES / 2;
/** Radius of the gold thread between spouses (about 2px at the reference plane). */
const TETHER_R = 0.011;

function easeOutBack(p: number): number {
  const c = 1.70158;
  const q = p - 1;
  return 1 + q * q * ((c + 1) * q + c);
}

function easeInOut(p: number): number {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

interface NodeState {
  pos: THREE.Vector3;
  color: THREE.Color;
  spawnAt: number;
}

interface Pulse {
  from: string;
  to: string;
  start: number;
  color: THREE.Color;
}

interface SimState {
  groupPos: Map<string, THREE.Vector3>;
  nodes: Map<string, NodeState>;
  flashes: Map<string, number>;
  pulses: Pulse[];
  seenSeq: number;
  mountedAt: number;
  ready: boolean;
  colorsDirty: boolean;
  pointer: THREE.Vector2;
}

/** The living constellation: one instanced mesh for every agent, golden tethers for couples. */
export function ConstellationScene(props: ConstellationSceneProps) {
  // Only ever mounted on the client (next/dynamic, ssr: false). Rendering pauses while the tab is hidden.
  const [frameloop, setFrameloop] = useState<"always" | "never">(() =>
    typeof document !== "undefined" && document.visibilityState !== "visible" ? "never" : "always",
  );
  useEffect(() => {
    const sync = () => setFrameloop(document.visibilityState === "visible" ? "always" : "never");
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.75]}
      flat
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: FOV, near: 0.5, far: 40, position: [0, CAM_Y, CAM_Z] }}
      style={{ background: "transparent" }}
      resize={{ debounce: 120 }}
    >
      <Scene {...props} />
    </Canvas>
  );
}

export default ConstellationScene;

function Scene({ agents, events, pointer, align, maxCount, onReady }: ConstellationSceneProps) {
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const halfW = Math.max(1.4, Math.round(HALF_H * aspect * 4) / 4);

  const shift = align === "right" ? X_SHIFT : 0;
  const bounds = useMemo<LayoutBounds>(() => {
    // A wide, shallow field: little vertical spread, most of the composition in x and depth.
    // x is laid out in the reference plane (z = 0) and scaled by depth per group in the frame loop.
    const xMin = align === "right" ? -0.04 * halfW : -0.86 * halfW;
    const xMax = (align === "right" ? 0.96 * halfW : 0.86 * halfW) - shift;
    return { xMin, xMax: Math.max(xMin + 1.2, xMax), yMin: -0.4, yMax: 0.55, zMin: -3.2, zMax: 1.5 };
  }, [halfW, align, shift]);

  const layout = useMemo(() => buildLayout(agents, bounds, maxCount), [agents, bounds, maxCount]);

  const orbs = useRef<THREE.InstancedMesh>(null);
  const auras = useRef<THREE.InstancedMesh>(null);
  const pulses = useRef<THREE.InstancedMesh>(null);
  const tethers = useRef<THREE.InstancedMesh>(null);

  const resources = useMemo(() => {
    const orbGeo = new THREE.SphereGeometry(1, 36, 24);
    const auraGeo = new THREE.SphereGeometry(1, 20, 14);
    const pulseGeo = new THREE.SphereGeometry(1, 12, 8);
    const orbMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.42, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.35 });
    const auraMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.1, depthWrite: false });
    const pulseMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    // Couples are tied by a fine gold thread: one thin open cylinder per pair (a 1px GL line vanishes on dense displays).
    const tetherGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
    const tetherMat = new THREE.MeshBasicMaterial({ color: "#b8860b", transparent: true, opacity: 0.8, depthWrite: false });
    return { orbGeo, auraGeo, pulseGeo, orbMat, auraMat, pulseMat, tetherGeo, tetherMat };
  }, []);
  useEffect(
    () => () => {
      for (const r of Object.values(resources)) r.dispose();
    },
    [resources],
  );

  const stateRef = useRef<SimState | null>(null);
  const getState = (): SimState => {
    if (!stateRef.current) {
      stateRef.current = {
        groupPos: new Map(),
        nodes: new Map(),
        flashes: new Map(),
        pulses: [],
        seenSeq: -1,
        mountedAt: -1,
        ready: false,
        colorsDirty: true,
        pointer: new THREE.Vector2(),
      };
    }
    return stateRef.current;
  };

  // Layout changed: register new nodes (they pop in), forget departed ones, refresh base colours.
  useEffect(() => {
    const state = getState();
    const now = performance.now() / 1000;
    const first = state.mountedAt < 0;
    if (first) state.mountedAt = now;
    const live = new Set<string>();
    layout.nodes.forEach((n, i) => {
      live.add(n.id);
      let s = state.nodes.get(n.id);
      if (!s) {
        s = {
          pos: new THREE.Vector3(),
          color: new THREE.Color(),
          spawnAt: first ? now + 0.1 + n.seed * 0.7 + (i / Math.max(1, layout.nodes.length)) * 0.5 : now + 0.05,
        };
        state.nodes.set(n.id, s);
      }
      // THREE.Color cannot parse the CSS `hsl(h s% l%)` form, so build the colour from components (in sRGB, like the CSS).
      s.color.setHSL(n.hue / 360, NODE_SATURATION, nodeLightness(n.kind), THREE.SRGBColorSpace);
    });
    for (const id of [...state.nodes.keys()]) if (!live.has(id)) state.nodes.delete(id);
    const liveGroups = new Set(layout.groups.map((g) => g.id));
    for (const id of [...state.groupPos.keys()]) if (!liveGroups.has(id)) state.groupPos.delete(id);
    state.colorsDirty = true;
    if (orbs.current) orbs.current.count = layout.nodes.length;
    if (auras.current) auras.current.count = layout.nodes.length;
  }, [layout]);

  // Realtime reactions: marriages flash gold, births flash the parents, winks send a pulse.
  useEffect(() => {
    const state = getState();
    const now = performance.now() / 1000;
    const wall = Date.now();
    const fresh = events.filter((e) => e.seq > state.seenSeq).sort((a, b) => a.seq - b.seq);
    const firstRun = state.seenSeq < 0;
    for (const ev of fresh) {
      state.seenSeq = Math.max(state.seenSeq, ev.seq);
      if (firstRun && wall - ev.at > 6000) continue;
      if (ev.type === "marriage.licensed") {
        for (const id of ev.actors.slice(0, 2)) state.flashes.set(id, now);
      } else if (ev.type === "birth.certified") {
        for (const id of ev.actors.slice(1, 3)) state.flashes.set(id, now);
      } else if (ev.type === "post.winked" && ev.actors.length >= 2) {
        state.pulses.push({ from: ev.actors[0], to: ev.actors[1], start: now, color: ROSE });
      } else if (ev.type === "proposal.sent" && ev.actors.length >= 2) {
        state.pulses.push({ from: ev.actors[0], to: ev.actors[1], start: now, color: GOLD });
      }
    }
    if (state.seenSeq < 0) state.seenSeq = 0;
    if (state.pulses.length > MAX_PULSES) state.pulses.splice(0, state.pulses.length - MAX_PULSES);
  }, [events]);

  useFrame(({ camera, clock }, delta) => {
    const orbMesh = orbs.current;
    const auraMesh = auras.current;
    const pulseMesh = pulses.current;
    const tetherMesh = tethers.current;
    if (!orbMesh || !auraMesh || !pulseMesh || !tetherMesh) return;
    const state = getState();
    const t = clock.elapsedTime;
    const now = performance.now() / 1000;
    const dt = Math.min(delta, 0.1);

    // Camera: slow idle drift plus a light pointer parallax.
    const p = pointer.current;
    state.pointer.x += (p.x - state.pointer.x) * Math.min(1, dt * 3);
    state.pointer.y += (p.y - state.pointer.y) * Math.min(1, dt * 3);
    camera.position.set(
      Math.sin(t * 0.09) * 0.3 + state.pointer.x * 0.4,
      CAM_Y + Math.sin(t * 0.13) * 0.14 - state.pointer.y * 0.25,
      CAM_Z + Math.cos(t * 0.07) * 0.22,
    );
    camera.lookAt(0, -0.1, 0);

    // Group centres ease towards their layout targets so re-layouts glide rather than jump.
    const k = 1 - Math.exp(-dt * 2.2);
    const centers: THREE.Vector3[] = new Array(layout.groups.length);
    for (let i = 0; i < layout.groups.length; i++) {
      const g = layout.groups[i];
      // Layout x lives in the reference plane; scaling it by depth keeps the field filling the frustum at every z.
      const gx = (g.x + shift) * ((CAM_Z - g.z) / CAM_Z);
      let c = state.groupPos.get(g.id);
      if (!c) {
        c = new THREE.Vector3(gx, g.y, g.z);
        state.groupPos.set(g.id, c);
      } else {
        c.x += (gx - c.x) * k;
        c.y += (g.y - c.y) * k;
        c.z += (g.z - c.z) * k;
      }
      centers[i] = c;
    }

    // Orbs.
    let colorsDirty = state.colorsDirty;
    const refreshAll = state.colorsDirty;
    state.colorsDirty = false;
    const off = { x: 0, y: 0, z: 0 };
    const nodes = layout.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const s = state.nodes.get(n.id);
      if (!s) continue;
      const c = centers[n.group];
      nodeOffset(n, t, off);
      s.pos.set(c.x + off.x, c.y + off.y, c.z + off.z);

      let scale = n.radius;
      const sp = (now - s.spawnAt) / SPAWN_S;
      if (sp <= 0) scale = 0;
      else if (sp < 1) scale *= easeOutBack(sp);

      const flashAt = state.flashes.get(n.id);
      if (flashAt !== undefined) {
        const f = (now - flashAt) / FLASH_S;
        if (f >= 1) {
          state.flashes.delete(n.id);
          orbMesh.setColorAt(i, s.color);
          auraMesh.setColorAt(i, s.color);
        } else {
          const amt = Math.sin(f * Math.PI);
          scale *= 1 + 0.4 * amt;
          tmpColor.copy(s.color).lerp(GOLD, amt * 0.9);
          orbMesh.setColorAt(i, tmpColor);
          auraMesh.setColorAt(i, tmpColor);
        }
        colorsDirty = true;
      } else if (refreshAll) {
        orbMesh.setColorAt(i, s.color);
        auraMesh.setColorAt(i, s.color);
      }

      tmpMat.compose(s.pos, IDENTITY, tmpScale.setScalar(scale));
      orbMesh.setMatrixAt(i, tmpMat);
      tmpMat.compose(s.pos, IDENTITY, tmpScale.setScalar(scale * 1.5));
      auraMesh.setMatrixAt(i, tmpMat);
    }
    orbMesh.count = nodes.length;
    auraMesh.count = nodes.length;
    orbMesh.instanceMatrix.needsUpdate = true;
    auraMesh.instanceMatrix.needsUpdate = true;
    if (colorsDirty) {
      if (orbMesh.instanceColor) orbMesh.instanceColor.needsUpdate = true;
      if (auraMesh.instanceColor) auraMesh.instanceColor.needsUpdate = true;
    }

    // Golden tethers between spouses.
    let ti = 0;
    for (const [a, b] of layout.pairs) {
      const pa = state.nodes.get(nodes[a].id);
      const pb = state.nodes.get(nodes[b].id);
      if (!pa || !pb || now < pa.spawnAt || now < pb.spawnAt || ti >= MAX_TETHERS) continue;
      tmpDir.copy(pb.pos).sub(pa.pos);
      const len = tmpDir.length();
      if (len < 1e-4) continue;
      tmpQuat.setFromUnitVectors(Y_AXIS, tmpDir.divideScalar(len));
      tmpVec.copy(pa.pos).add(pb.pos).multiplyScalar(0.5);
      tmpMat.compose(tmpVec, tmpQuat, tmpScale.set(TETHER_R, len, TETHER_R));
      tetherMesh.setMatrixAt(ti++, tmpMat);
    }
    tetherMesh.count = ti;
    tetherMesh.instanceMatrix.needsUpdate = true;

    // Wink and proposal pulses travelling from one orb to another.
    if (state.pulses.length) {
      state.pulses = state.pulses.filter((pl) => now - pl.start < PULSE_S && state.nodes.has(pl.from) && state.nodes.has(pl.to));
    }
    for (let i = 0; i < MAX_PULSES; i++) {
      const pl = state.pulses[i];
      if (!pl) {
        tmpMat.compose(tmpVec.set(0, -50, 0), IDENTITY, tmpScale.setScalar(0));
        pulseMesh.setMatrixAt(i, tmpMat);
        continue;
      }
      const f = (now - pl.start) / PULSE_S;
      const from = state.nodes.get(pl.from)!.pos;
      const to = state.nodes.get(pl.to)!.pos;
      tmpVec.copy(from).lerp(to, easeInOut(f));
      tmpVec.y += Math.sin(f * Math.PI) * 0.35;
      tmpMat.compose(tmpVec, IDENTITY, tmpScale.setScalar(0.012 + Math.sin(f * Math.PI) * 0.05));
      pulseMesh.setMatrixAt(i, tmpMat);
      pulseMesh.setColorAt(i, pl.color);
    }
    pulseMesh.count = MAX_PULSES;
    pulseMesh.instanceMatrix.needsUpdate = true;
    if (pulseMesh.instanceColor) pulseMesh.instanceColor.needsUpdate = true;

    if (!state.ready) {
      state.ready = true;
      onReady?.();
    }
  });

  return (
    <>
      <fog attach="fog" args={[PAPER, 7.2, 13.5]} />
      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#ffffff", "#ece7da", 0.9]} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} color="#fff7ea" />
      <directionalLight position={[-6, 3, -4]} intensity={1.4} color="#dde6ff" />

      <instancedMesh ref={orbs} args={[resources.orbGeo, resources.orbMat, MAX_NODES]} frustumCulled={false} />
      <instancedMesh ref={auras} args={[resources.auraGeo, resources.auraMat, MAX_NODES]} frustumCulled={false} />
      <instancedMesh ref={tethers} args={[resources.tetherGeo, resources.tetherMat, MAX_TETHERS]} frustumCulled={false} />
      <instancedMesh ref={pulses} args={[resources.pulseGeo, resources.pulseMat, MAX_PULSES]} frustumCulled={false} />

      <ContactShadows position={[0, -1.35, 0]} opacity={0.3} scale={18} blur={2.8} far={2.8} resolution={512} frames={Infinity} color="#141416" />
    </>
  );
}
