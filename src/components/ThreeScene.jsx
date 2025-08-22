import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import BatteryModel from './BatteryModel'

function ThreeScene() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ 
          position: [0, 0, 5], 
          fov: 75 
        }}
        style={{ background: 'transparent' }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        {/* Bright ambient light plus two boosted point lights */}
        <ambientLight intensity={5.0} />
        <pointLight position={[-10, 10, -10]} intensity={1950.0} color="white" />
        <pointLight position={[-3, 4, 6]} intensity={300.0} color="lightblue" />
        
        {/* No camera controls - battery will move instead */}
        
        {/* Model */}
        <Suspense fallback={null}>
          <BatteryModel />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default ThreeScene
