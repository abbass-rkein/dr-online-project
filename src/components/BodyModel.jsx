import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";

function Heart() {
  const { scene } = useGLTF("/models/upper_body_anatomy.glb");

  return (
    <primitive
      object={scene}
      scale={1.4}
      position={[0, -0.2, 0]} 
      rotation={[0, Math.PI, 0]} 
    />
  );
}

export default function HeartModel() {
  return (
    <div className="w-full h-[450px] rounded-3xl overflow-hidden shadow-lg bg-white">
      <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }} shadows>
        <hemisphereLight
          skyColor="#ffffff"
          groundColor="#b1b1b1"
          intensity={1.2}
        />
        <directionalLight position={[4, 4, 4]} intensity={1.8} />
        <directionalLight position={[-4, 2, 2]} intensity={1.0} />
        <ambientLight intensity={1.4} />

        <Environment preset="city" />

        <Heart />

        <OrbitControls
          enableZoom={true}
          autoRotate
          autoRotateSpeed={1.2}
          target={[0, 0, 0]} 
        />
      </Canvas>
    </div>
  );
}
