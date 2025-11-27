import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';

function Model({ url, onHover, onClick }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Clone the scene to avoid modifying the original
  const clonedScene = scene.clone();

  useFrame((state) => {
    if (modelRef.current && !hovered && !clicked) {
      // Gentle floating animation
      modelRef.current.rotation.y += 0.005;
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
    onHover?.(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
    onHover?.(false);
  };

  const handleClick = () => {
    setClicked(!clicked);
    onClick?.(!clicked);
  };

  return (
    <primitive
      ref={modelRef}
      object={clonedScene}
      scale={hovered ? 1.1 : clicked ? 1.2 : 1}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="loading-3d">
        <div className="spinner"></div>
        <p>Loading 3D Magic...</p>
      </div>
    </Html>
  );
}


const Interactive3D = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const hasWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
    } catch (e) {
      return false;
    }
  })();

  if (!hasWebGL) {
    return (
      <div className="landing-interactive-3d-fallback">
        <h2>🎄 3D Gift Explorer</h2>
        <p>Your browser doesn't support WebGL. Here's a festive fallback!</p>
        <div className="fallback-content">
          <div className="gift-icon">🎁</div>
          <p>Imagine rotating Christmas gifts in 3D space!</p>
          <button className="fallback-button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to Magic
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-interactive-3d">
      <div className="section-header">
        <h2>🎄 Explore 3D Gifts</h2>
        <p>Interact with magical Christmas gifts in 3D space</p>
      </div>

      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          onCreated={({ gl }) => {
            gl.setClearColor('#0f0f23');
          }}
        >
          {/* Enhanced lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff6b6b" />
          <spotLight
            position={[0, 10, 0]}
            angle={0.3}
            penumbra={1}
            intensity={0.5}
            color="#4ecdc4"
            castShadow
          />

          {/* Environment */}
          <fog attach="fog" args={['#0f0f23', 5, 15]} />

          <Suspense fallback={<LoadingFallback />}>
            <Model
              url="/api/assets/3d/christmas_gifts.glb"
              onHover={setIsHovered}
              onClick={setIsClicked}
            />
          </Suspense>

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
            autoRotate={!isHovered && !isClicked}
            autoRotateSpeed={0.5}
          />
        </Canvas>

        <div className="controls-info">
          <div className="control-item">
            <span className="control-icon">🖱️</span>
            <span>Click & drag to rotate</span>
          </div>
          <div className="control-item">
            <span className="control-icon">🔍</span>
            <span>Scroll to zoom</span>
          </div>
          <div className="control-item">
            <span className="control-icon">✨</span>
            <span>Hover for magic effects</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interactive3D;