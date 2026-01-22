import { Paper } from "@mui/material";
import { OrbitControls, Outlines } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { airspaceClassMap, Volume } from "../openAir";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useMeshFromSvgData } from "../hooks/geometry";

export function ModelDisplay(props: {volumes: Volume[], setVolumes: Dispatch<SetStateAction<Volume[]>>, size: {height: number, width: number}, setMeshes: Dispatch<SetStateAction<THREE.Mesh[]>>, meshes: THREE.Mesh[]}) {
  return (
    <Paper sx={{ justifyContent: 'center', width:1 }}>
      <Scene volumes={props.volumes} setVolumes={props.setVolumes} size={props.size} setMeshes={props.setMeshes} meshes={props.meshes}/>
    </Paper>
  )
}

export function Scene(props: {volumes: Volume[], setVolumes: Dispatch<SetStateAction<Volume[]>>, size: {height: number, width: number}, setMeshes: Dispatch<SetStateAction<THREE.Mesh[]>>, meshes: THREE.Mesh[]}){
  const [selected, setSelected] = useState(Array(props.volumes.length).fill(false))
  const modelScale=0.1
  return (
    <Canvas camera={{ position: [0, -120, 120] }} style={{width: props.size.width, height: props.size.height}}>
      <gridHelper position={[0,0,0]} rotation-x={Math.PI / 2} args={[500, 20, 0x888888, 0x333333]} />
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <OrbitControls />
      {
        props.volumes.map((volume, index)=>{
          let depth = 2
          let floor = 0
          let ceiling = 0
          // Ensure kiloMetres are numeric (0 is valid) before using them
          const ceilingKM = volume.airspace.ceiling?.value?.kiloMetres
          const floorKM = volume.airspace.floor?.value?.kiloMetres
          if (typeof ceilingKM === 'number' && typeof floorKM === 'number'){
            floor  = floorKM
            ceiling = ceilingKM
            depth = ceiling - floor
            // [depth, floor] = floorCeilingToDepthFloor({ceiling: volume.airspace.ceiling.value.feet, floor: volume.airspace.floor.value.feet}, modelScale)
          }
          if (volume.airspace.svg){
            // Position must be in the same units as the scaled geometry
            const posX = 0 * modelScale
            const posY = 20 * modelScale
            const posZ = floor * modelScale
            return (
              <MeshFromSvgString 
                key={index} 
                svgString={volume.airspace.svg} 
                depth={depth} 
                position={[posX, posY, posZ]} 
                scale={modelScale} 
                setMeshes={props.setMeshes} 
                meshes={props.meshes} 
                colour={airspaceClassMap[volume.airspace.airspaceClass.code].colour}
                volume={volume}
                volumes={props.volumes}
                setVolumes={props.setVolumes}
                selected={selected}
                setSelected={setSelected}
                index={index}
              />
            )
          }
        })
      }
    </Canvas>
  )
}

function MeshFromSvgString(
  props: {
    svgString: string, 
    depth: number, 
    position: [number, number, number], 
    scale: number, 
    setMeshes: Dispatch<SetStateAction<THREE.Mesh[]>>, 
    meshes: THREE.Mesh[], 
    colour: string, 
    volume: Volume,
    volumes: Volume[],
    setVolumes: Dispatch<SetStateAction<Volume[]>>
    selected: boolean[],
    setSelected: Dispatch<SetStateAction<boolean[]>>,
    index: number
  }){
  const meshRef = useRef<THREE.Mesh | undefined>(undefined)
  const [meshData, _shapes] = useMeshFromSvgData(props.svgString, {depth: props.depth}, props.colour)
  // mesh depth logged previously for debugging; removed to avoid noisy console output
  useEffect(()=>{
    if(meshData){
      // capture meshData for export and for debugging
      // clone meshData and apply the same position/scale used in the scene so exports preserve relative Z
      try {
        const exportClone = meshData.clone(true) as THREE.Mesh
        // apply scene transforms
        exportClone.position.set(props.position[0] ?? 0, props.position[1] ?? 0, props.position[2] ?? 0)
        exportClone.scale.set(props.scale ?? 1, props.scale ?? 1, props.scale ?? 1)
        exportClone.updateMatrixWorld(true)
        props.setMeshes(props.meshes.concat(exportClone))
      } catch (e) {
        // fallback to pushing raw meshData
        props.setMeshes(props.meshes.concat(meshData))
      }
      try {
        meshData.geometry.computeBoundingBox()
        const bb = meshData.geometry.boundingBox
        // compute world-space top Z (position.z + scaled bbox max.z)
        const posZ = props.position && props.position.length > 2 ? props.position[2] : 0
        const worldTopZ = (bb?.max.z || 0) * props.scale + posZ
        const worldBottomZ = (bb?.min.z || 0) * props.scale + posZ
        // eslint-disable-next-line no-console
        console.log(`Mesh ready: ${props.volume.airspace.name} bboxZ:`, bb?.min.z, bb?.max.z, 'depth(km):', props.depth, 'worldBottomZ(km):', worldBottomZ, 'worldTopZ(km):', worldTopZ)
      } catch (e) {
        // ignore
      }
    }
  },[meshData])

  function handleClick(name: string){
    const newSelected = !props.selected[props.index]
    const newArray = Array(props.selected.length).fill(false)
    props.setSelected(newArray)
    newArray[props.index] = newSelected
    props.setSelected(newArray)
    
    const newVolumes = props.volumes.map((_volume)=>{
      if(_volume.airspace.name == name){
        return {
          selected: newSelected,
          airspace: _volume.airspace
        }
      } else {
        return _volume
      }
    })
    props.setVolumes(newVolumes)
  }

  if(!meshData){
    return (<></>)
  }

  return (
    <mesh
      onClick={()=>handleClick(props.volume.airspace.name)}
      ref={meshRef}
      scale={props.scale}
      rotation={[0,0,0]}
      position={props.position}
      geometry={meshData.geometry}
    >
      <meshPhongMaterial
        color={props.selected[props.index] ? "white": props.colour}
        opacity={props.selected[props.index] ? 1 : 0.5}
        side={THREE.DoubleSide}
      />
      {props.selected[props.index] ? 
      <Outlines thickness={0.5}
        color="black"
        screenspace={true}
        opacity={1}
        /> : null}
    </mesh>
  )
}