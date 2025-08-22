import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function BatteryModel() {
  const meshRef = useRef()
  const { scene } = useGLTF('/glbBattery2.glb')
  const { camera, size, gl } = useThree()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [batteryRotation, setBatteryRotation] = useState({ x: 0, y: -Math.PI / 4, z: 0 })


  

  
  // Calculate responsive position and scale based on screen size
  const { position, scale } = useMemo(() => {
    const aspect = size.width / size.height
    const fov = camera.fov * (Math.PI / 180) // Convert to radians
    const distance = 5 // Camera Z position
    
    // Calculate visible dimensions at the battery's Z position (0)
    const visibleHeight = 2 * Math.tan(fov / 2) * distance
    const visibleWidth = visibleHeight * aspect
    const smallestDimension = Math.min(visibleWidth, visibleHeight)
    
    // Responsive scaling based on screen size - smaller base scaling
    let scaleFactor
    if (smallestDimension < 3) {
      // Mobile phones - keep very small for safety
      scaleFactor = smallestDimension * 0.10 // 10% of smallest dimension
    } else if (smallestDimension < 6) {
      // Tablets/small laptops - moderate scaling
      scaleFactor = smallestDimension * 0.13 // 13% of smallest dimension
    } else if (smallestDimension < 10) {
      // Laptops - bigger but controlled
      scaleFactor = smallestDimension * 0.16 // 16% of smallest dimension
    } else {
      // Large screens/desktop - allow bigger with reasonable max
      scaleFactor = Math.min(smallestDimension * 0.20, 2.0) // 20% but cap at 2.0
    }
    
    const batteryScale = scaleFactor
    
    // Center the battery horizontally, scale-dependent Y position
    const xPosition = 0
    // Larger batteries need to be positioned much lower
    const yPosition = -0.5 - (batteryScale * 0.8) // Base position + aggressive scale-based offset
    
    return {
      position: [xPosition, yPosition, 0],
      scale: batteryScale
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
  
  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (event) => {
      // Convert screen coordinates to normalized device coordinates (-1 to +1)
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -(event.clientY / window.innerHeight) * 2 + 1
      setMousePosition({ x, y })
    }
    
    const handleMouseDown = (event) => {
      setIsDragging(true)
      setDragStart({ x: event.clientX, y: event.clientY })
      
      // Capture current visual rotation as the new base rotation
      if (meshRef.current) {
        setBatteryRotation({
          x: meshRef.current.rotation.x,
          y: meshRef.current.rotation.y,
          z: meshRef.current.rotation.z
        })
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    

    
    const handleMouseDrag = (event) => {
      if (isDragging) {
        const deltaX = event.clientX - dragStart.x
        const deltaY = event.clientY - dragStart.y
        
        setBatteryRotation(prev => ({
          x: prev.x + deltaY * 0.003,
          y: prev.y + deltaX * 0.003,
          z: prev.z
        }))
        
        setDragStart({ x: event.clientX, y: event.clientY })
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousemove', handleMouseDrag)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousemove', handleMouseDrag)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  // Make battery follow cursor or use drag rotation
  useFrame(() => {
    if (meshRef.current) {
      // Define pivot point higher than the battery's center
      const pivotOffset = 1.5 // How much higher the pivot should be
      
      if (!isDragging) {
        // Follow cursor with gentle, molasses-like delay
        const targetRotationY = mousePosition.x * 0.2 + batteryRotation.y // Reduced from 0.5 to 0.2
        const targetRotationX = -mousePosition.y * 0.15 + batteryRotation.x // Reduced from 0.3 to 0.15
        
        // Apply rotation around higher pivot point with molasses-like delay
        const currentRotY = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotationY, 0.03)
        const currentRotX = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotationX, 0.03)
        
        // Set rotation
        meshRef.current.rotation.y = currentRotY
        meshRef.current.rotation.x = currentRotX
        
        // Adjust position to rotate around higher pivot
        const offsetZ = -Math.sin(currentRotX) * pivotOffset
        const offsetY = (1 - Math.cos(currentRotX)) * pivotOffset
        
        meshRef.current.position.y = position[1] + offsetY
        meshRef.current.position.z = position[2] + offsetZ
        meshRef.current.position.x = position[0]
        
      } else {
        // Use drag rotation when dragging
        meshRef.current.rotation.x = batteryRotation.x
        meshRef.current.rotation.y = batteryRotation.y
        meshRef.current.rotation.z = batteryRotation.z
        
        // Apply same pivot offset for drag mode
        const offsetZ = -Math.sin(batteryRotation.x) * pivotOffset
        const offsetY = (1 - Math.cos(batteryRotation.x)) * pivotOffset
        
        meshRef.current.position.y = position[1] + offsetY
        meshRef.current.position.z = position[2] + offsetZ
        meshRef.current.position.x = position[0]
      }
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
