import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function BatteryModel() {
  const meshRef = useRef()
  const { scene } = useGLTF('/glbBattery2.glb')
  const { camera, size } = useThree()

  
  // Calculate smaller battery position and scale
  const { position, scale } = useMemo(() => {
    const aspect = size.width / size.height
    const fov = camera.fov * (Math.PI / 180) // Convert to radians
    const distance = 5 // Camera Z position
    
    // Calculate visible dimensions at the battery's Z position (0)
    const visibleHeight = 2 * Math.tan(fov / 2) * distance
    const visibleWidth = visibleHeight * aspect
    const smallestDimension = Math.min(visibleWidth, visibleHeight)
    
    // A little smaller scale factor and a little lower position
    const scaleFactor = smallestDimension * 0.15 // Reduced from 0.16 to 0.15 for just a little smaller
    
    return {
      position: [0, -0.9, 0], // A little lower position on screen
      scale: scaleFactor
    }
  }, [camera.fov, size.width, size.height])
  
  // Apply material modifications
  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Fix transparency issues for ALL materials while preserving their original properties
        const fixMaterial = (mat, meshName) => {
          // Only fix transparency/opacity - preserve everything else
          mat.opacity = 1.0 // Fully opaque
          mat.transparent = false // No transparency
          mat.alphaTest = 0 // No alpha testing
          mat.depthWrite = true // Enable depth writing
          mat.depthTest = true // Enable depth testing
          mat.side = THREE.DoubleSide // Render both sides
          mat.needsUpdate = true
          
          // Moderate matte finish - somewhere between shiny and completely flat
          if (mat.name === 'BATTERY BODY' || mat.name === 'Material.005' || mat.name === 'Material.006') {
            // Create a new Standard material with moderate matte settings
            const newMaterial = new THREE.MeshStandardMaterial({
              color: 0x100f0f, // Dark reddish-brown color
              metalness: 0, // Non-metallic
              roughness: 0.8, // High roughness but not maximum
              transparent: false,
              opacity: 1.0,
              side: THREE.DoubleSide
            })
            
            // Replace the material completely
            if (Array.isArray(child.material)) {
              const index = child.material.indexOf(mat)
              if (index !== -1) child.material[index] = newMaterial
            } else {
              child.material = newMaterial
            }
            
            // Scale down textures to make them much finer grained
            if (mat.map) {
              mat.map.repeat.set(5, 5) // Make texture 5x finer
              mat.map.wrapS = THREE.RepeatWrapping
              mat.map.wrapT = THREE.RepeatWrapping
            }
            if (mat.normalMap) {
              mat.normalMap.repeat.set(5, 5) // Make normal map 5x finer
              mat.normalMap.wrapS = THREE.RepeatWrapping
              mat.normalMap.wrapT = THREE.RepeatWrapping
            }
            if (mat.roughnessMap) {
              mat.roughnessMap.repeat.set(5, 5) // Make roughness map 5x finer
              mat.roughnessMap.wrapS = THREE.RepeatWrapping
              mat.roughnessMap.wrapT = THREE.RepeatWrapping
            }

          }
          
          // Make Logo materials white - target all possible logo references
          if (mat.name === 'Logo' || 
              child.name === 'LOGO_LEFT' || 
              child.name === 'LOGO_RIGHT' ||
              child.name.includes('logo') ||
              child.name.includes('Logo')) {
            // Completely replace material properties
            mat.color.setHex(0xffffff) // Pure white
            mat.emissive.setHex(0xaaaaaa) // Much brighter emissive white
            mat.metalness = 0
            mat.roughness = 0.3
            mat.transparent = false
            mat.opacity = 1.0
            // Remove all texture maps that could be blue
            mat.map = null
            mat.emissiveMap = null
            mat.normalMap = null
            mat.roughnessMap = null
            mat.metalnessMap = null
            mat.aoMap = null
            mat.needsUpdate = true
          }
        }
        
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => fixMaterial(mat, child.name))
        } else {
          fixMaterial(child.material, child.name)
        }
      }
    })

  }, [scene])
  


  // Auto-spinning animation
  useFrame((state) => {
    if (meshRef.current) {
      // Continuous rotation around Y axis
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 // Adjust speed by changing multiplier
      
      // Set position to center
      meshRef.current.position.set(...position)
    }
  })

  return (
    <primitive 
      ref={meshRef}
      object={scene} 
      scale={scale}
      position={position}
    />
  )
}

// Preload the model
useGLTF.preload('/glbBattery2.glb')

export default BatteryModel
