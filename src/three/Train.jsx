import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { sampleRoute } from './trackGeometry.js';

const CAR_GAP = 0.78;
const COLORS = ['#4dabf7', '#ffd43b', '#69db7c'];

function Wheel({ x, z }) {
  return (
    <mesh position={[x, 0.09, z]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.09, 0.09, 0.06, 12]} />
      <meshLambertMaterial color="#3b3b4f" />
    </mesh>
  );
}

function Engine() {
  return (
    <group>
      <mesh position={[0, 0.27, 0]}>
        <boxGeometry args={[0.5, 0.26, 0.34]} />
        <meshLambertMaterial color="#ff6b6b" />
      </mesh>
      <mesh position={[0.2, 0.43, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.16, 12]} />
        <meshLambertMaterial color="#ffd43b" />
      </mesh>
      <mesh position={[-0.12, 0.47, 0]}>
        <boxGeometry args={[0.24, 0.16, 0.3]} />
        <meshLambertMaterial color="#ff8787" />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0.255, 0.3, 0.085 * s]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshLambertMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.292, 0.3, 0.085 * s]}>
            <sphereGeometry args={[0.026, 8, 8]} />
            <meshLambertMaterial color="#222" />
          </mesh>
        </group>
      ))}
      <mesh position={[0.26, 0.2, 0]}>
        <boxGeometry args={[0.02, 0.03, 0.12]} />
        <meshLambertMaterial color="#c92a2a" />
      </mesh>
      {[-0.16, 0.16].map((x) => [-0.18, 0.18].map((z) => <Wheel key={x + ':' + z} x={x} z={z} />))}
    </group>
  );
}

function Wagon({ color }) {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.56, 0.22, 0.34]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.3]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      {[-0.17, 0.17].map((x) => [-0.18, 0.18].map((z) => <Wheel key={x + ':' + z} x={x} z={z} />))}
    </group>
  );
}

/**
 * Runs along `route`. `run` is a ref-like { active, d } driven by the parent.
 * Cars are shown only while on the route.
 */
export default function Train({ route, runRef }) {
  const refs = useRef([]);
  const cars = useMemo(() => ['engine', ...COLORS], []);

  useFrame(() => {
    const run = runRef.current;
    cars.forEach((_, i) => {
      const node = refs.current[i];
      if (!node) return;
      if (!run.active) {
        node.visible = false;
        return;
      }
      const d = run.d - i * CAR_GAP;
      if (d < 0 || d > route.total - 0.05) {
        node.visible = false;
        return;
      }
      const s = sampleRoute(route, d);
      node.visible = true;
      node.position.set(s.x, 0.1, s.z);
      node.rotation.y = -s.ang;
    });
  });

  return (
    <group>
      {cars.map((c, i) => (
        <group key={c} ref={(n) => (refs.current[i] = n)} visible={false}>
          {i === 0 ? <Engine /> : <Wagon color={c} />}
        </group>
      ))}
    </group>
  );
}

export const TRAIN_LENGTH = CAR_GAP * 4;
