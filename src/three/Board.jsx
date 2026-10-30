import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getPieceGeometry, buildRoute } from './trackGeometry.js';
import { clueTexture, starTexture } from './textures.js';
import Train, { TRAIN_LENGTH } from './Train.jsx';
import { SIDE_VEC, pathConnections, stepOnto, dirBetween } from '../game/logic.js';

const TILE_A = '#8ee07a';
const TILE_B = '#7fd46c';
const TILE_PATH = '#f7e1a8';
const TILE_GIVEN = '#ffe27a';
const TILE_WIN = '#b9f6b0';
const SLEEPER = '#a9693a';
const RAIL = '#e9edf5';
const RAIL_WIN = '#7be08f';

function CameraRig({ rows, cols }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const tilt = (16 * Math.PI) / 180;
    const f = Math.tan((camera.fov / 2) * (Math.PI / 180)) * 2;
    const worldW = cols + 2.7;
    const worldH = rows + 2.7;
    const d = Math.max(worldH / f, worldW / (f * aspect)) * 1.04;
    camera.position.set(0, d * Math.cos(tilt), d * Math.sin(tilt));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, rows, cols]);
  return null;
}

function Tile({ x, z, color, pressed }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = pressed ? -0.035 : 0;
    ref.current.position.y += (target - ref.current.position.y) * Math.min(1, dt * 14);
  });
  return (
    <mesh ref={ref} position={[x, 0, z]}>
      <boxGeometry args={[0.93, 0.2, 0.93]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

function PiecePop({ geo, x, z, color, sleeperColor }) {
  const ref = useRef();
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!ref.current || t.current >= 1) return;
    t.current = Math.min(1, t.current + dt * 7);
    const e = 1 - Math.pow(1 - t.current, 3);
    const s = 0.55 + 0.45 * e;
    ref.current.scale.set(s, 0.4 + 0.6 * e, s);
  });
  return (
    <group ref={ref} position={[x, 0, z]} scale={[0.55, 0.4, 0.55]}>
      <mesh geometry={geo.sleepers}>
        <meshLambertMaterial color={sleeperColor} />
      </mesh>
      <mesh geometry={geo.rails}>
        <meshLambertMaterial color={color} />
      </mesh>
    </group>
  );
}

function Gate({ level, which }) {
  const info = which === 'entry' ? level.entry : level.exit;
  const [vx, vz] = SIDE_VEC[info.side];
  const ox = (level.cols - 1) / 2;
  const oz = (level.rows - 1) / 2;
  const ex = info.c - ox + vx * 0.5;
  const ez = info.r - oz + vz * 0.5;
  const geo = useMemo(() => getPieceGeometry(info.side, (info.side + 2) % 4), [info.side]);
  const horizontal = vx !== 0;
  const dirX = which === 'entry' ? -vx : vx;
  const dirZ = which === 'entry' ? -vz : vz;
  const tri = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.17, 0);
    s.lineTo(-0.11, 0.16);
    s.lineTo(-0.11, -0.16);
    s.closePath();
    const g = new THREE.ShapeGeometry(s);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  return (
    <group>
      <group position={[ex + vx * 0.3, 0, ez + vz * 0.3]} scale={horizontal ? [0.6, 1, 1] : [1, 1, 0.6]}>
        <mesh geometry={geo.sleepers}>
          <meshLambertMaterial color={SLEEPER} />
        </mesh>
        <mesh geometry={geo.rails}>
          <meshLambertMaterial color={RAIL} />
        </mesh>
      </group>
      <mesh
        geometry={tri}
        position={[ex + vx * 0.47, 0.25, ez + vz * 0.47]}
        rotation={[0, -Math.atan2(dirZ, dirX), 0]}
      >
        <meshBasicMaterial color={which === 'entry' ? '#2fcf6f' : '#ff5a5a'} />
      </mesh>
    </group>
  );
}

function Clue({ n, state, x, z }) {
  const tex = clueTexture(n, state);
  return (
    <mesh position={[x, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.68, 0.68]} />
      <meshBasicMaterial map={tex} transparent />
    </mesh>
  );
}

function lineState(count, clue) {
  if (count === clue) return 'ok';
  if (count > clue) return 'over';
  return 'normal';
}

function InputPlane({ level, pathRef, onPath, enabled }) {
  const drag = useRef(null);
  const { rows, cols } = level;

  const cellAt = (x, z) => {
    const c = Math.floor(x + cols / 2);
    const r = Math.floor(z + rows / 2);
    if (r < 0 || c < 0 || r >= rows || c >= cols) return -1;
    return r * cols + c;
  };
  const sample = (x, z) => {
    const cell = cellAt(x, z);
    if (cell === -1) return;
    const next = stepOnto(level, pathRef.current, cell);
    if (next !== pathRef.current) {
      pathRef.current = next;
      onPath(next);
    }
  };
  const along = (x0, z0, x1, z1) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.2));
    for (let i = 1; i <= n; i++) sample(x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n);
  };

  return (
    <mesh
      position={[0, 0.3, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={(e) => {
        if (!enabled) return;
        const { x, z } = e.point;
        const cell = cellAt(x, z);
        if (cell === -1) return;
        const p = pathRef.current;
        const head = p[p.length - 1];
        if (!(p.includes(cell) || dirBetween(level, head, cell) !== -1)) return;
        e.target?.setPointerCapture?.(e.pointerId);
        drag.current = { x, z };
        sample(x, z);
      }}
      onPointerMove={(e) => {
        if (!drag.current || !enabled) return;
        const { x, z } = e.point;
        along(drag.current.x, drag.current.z, x, z);
        drag.current = { x, z };
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <planeGeometry args={[cols + 3, rows + 3]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function RunController({ phase, route, runRef, onDone }) {
  const done = useRef(false);
  useEffect(() => {
    if (phase === 'run') {
      runRef.current = { active: true, d: 0 };
      done.current = false;
    } else {
      runRef.current = { active: false, d: 0 };
    }
  }, [phase, runRef]);
  useFrame((_, dt) => {
    const run = runRef.current;
    if (!run.active || done.current) return;
    run.d += Math.min(dt, 0.05) * 11;
    if (run.d > route.total + TRAIN_LENGTH * 0.4) {
      done.current = true;
      onDone();
    }
  });
  return null;
}

function Scene({ level, path, pathRef, evalResult, phase, onPath, onRunDone }) {
  const { rows, cols } = level;
  const ox = (cols - 1) / 2;
  const oz = (rows - 1) / 2;
  const won = phase !== 'play';
  const inPath = useMemo(() => new Set(path), [path]);
  const givenSet = useMemo(() => new Set(level.given), [level]);
  const conns = useMemo(() => pathConnections(level, path), [level, path]);
  const runRef = useRef({ active: false, d: 0 });
  const route = useMemo(() => (won ? buildRoute(level, conns, path) : null), [won, level, conns, path]);
  const star = useMemo(() => starTexture(), []);

  return (
    <>
      <ambientLight intensity={1.9} />
      <directionalLight position={[3, 9, 5]} intensity={1.5} />
      <CameraRig rows={rows} cols={cols} />

      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[cols + 0.34, 0.3, rows + 0.34]} />
        <meshLambertMaterial color="#5a3d26" />
      </mesh>

      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const on = inPath.has(i);
        let color = (r + c) % 2 ? TILE_A : TILE_B;
        if (givenSet.has(i)) color = TILE_GIVEN;
        if (on) color = won ? TILE_WIN : givenSet.has(i) ? '#ffe9a0' : TILE_PATH;
        return <Tile key={i} x={c - ox} z={r - oz} color={color} pressed={on} />;
      })}

      {level.given.map((g) => (
        <mesh
          key={'star' + g}
          position={[(g % cols) - ox, 0.103, Math.floor(g / cols) - oz]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.72, 0.72]} />
          <meshBasicMaterial map={star} transparent polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}

      {path.map((cell, i) => {
        const [a, b] = conns[i];
        const geo = getPieceGeometry(a, b);
        return (
          <PiecePop
            key={cell}
            geo={geo}
            x={(cell % cols) - ox}
            z={Math.floor(cell / cols) - oz}
            color={won ? RAIL_WIN : RAIL}
            sleeperColor={SLEEPER}
          />
        );
      })}

      <Gate level={level} which="entry" />
      <Gate level={level} which="exit" />

      {level.colClues.map((n, c) => (
        <Clue key={'c' + c} n={n} state={lineState(evalResult.counts.cols[c], n)} x={c - ox} z={-rows / 2 - 0.95} />
      ))}
      {level.rowClues.map((n, r) => (
        <Clue key={'r' + r} n={n} state={lineState(evalResult.counts.rows[r], n)} x={cols / 2 + 0.95} z={r - oz} />
      ))}

      <InputPlane level={level} pathRef={pathRef} onPath={onPath} enabled={phase === 'play'} />

      {route && (
        <>
          <Train route={route} runRef={runRef} />
          <RunController phase={phase} route={route} runRef={runRef} onDone={onRunDone} />
        </>
      )}
    </>
  );
}

export default function Board(props) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 40, position: [0, 12, 3], near: 0.1, far: 100 }}
      flat
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: 'none' }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
