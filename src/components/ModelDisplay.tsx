import { Paper } from "@mui/material";
import { OrbitControls, Outlines } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { airspaceClassMap, Volume } from "../openAir";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useMeshFromSvgData } from "../hooks/geometry";

export function ModelDisplay(props: {volumes: Volume[], setVolumes: Dispatch<SetStateAction<Volume[]>>, size: {height: number, width: number}, setMeshes: Dispatch<SetStateAction<THREE.Mesh[]>>, meshes: THREE.Mesh[], zScale: number}) {
  return (
    <Paper sx={{ justifyContent: 'center', width:1 }}>
      <Scene volumes={props.volumes} setVolumes={props.setVolumes} size={props.size} setMeshes={props.setMeshes} meshes={props.meshes} zScale={props.zScale}/>
    </Paper>
  )
}

export function Scene(props: {volumes: Volume[], setVolumes: Dispatch<SetStateAction<Volume[]>>, size: {height: number, width: number}, setMeshes: Dispatch<SetStateAction<THREE.Mesh[]>>, meshes: THREE.Mesh[], zScale: number}){
  const [selected, setSelected] = useState(Array(props.volumes.length).fill(false))
  const modelScale=0.1
  const [centroidOffset, setCentroidOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    async function fetchProjections() {
      const projectedCentroid = Volume.getCombinedProjectedCentroid(props.volumes)
      if (projectedCentroid) {
        setCentroidOffset({
          x: -projectedCentroid.x * modelScale,
          y: -projectedCentroid.y * modelScale
        })
      } else {
        setCentroidOffset({ x: 0, y: 0 })
      }
    }
    fetchProjections()
  }, [props.volumes, modelScale])
  // Re-center camera and controls to fit all meshes when meshes change


  return (
    <Canvas frameloop="demand" camera={{ position: [0, -120, 120] }} style={{width: props.size.width, height: props.size.height}}>
      <gridHelper position={[0,0,0]} rotation-x={Math.PI / 2} args={[500, 20, 0x888888, 0x333333]} />
      <ambientLight intensity={1} color={0xffffff} />
      <directionalLight position={[0, -250, 250]} intensity={1} color={0xffffff} />
      {/* <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} /> */}
      <OrbitControls enableDamping={false}/>
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
            depth = (ceiling - floor) * props.zScale
            // [depth, floor] = floorCeilingToDepthFloor({ceiling: volume.airspace.ceiling.value.feet, floor: volume.airspace.floor.value.feet}, modelScale)
          }
          if (volume.airspace.svg){
            // Position must be in the same units as the scaled geometry
            const posX = centroidOffset.x
            const posY = centroidOffset.y  * modelScale
            const posZ = floor * modelScale * props.zScale
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
  // const meshRef = useRef<THREE.Mesh | undefined>(undefined)
  const meshData = useMeshFromSvgData(props.svgString, {depth: props.depth, curveSegments: 64}, props.colour)
  

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
      scale={props.scale}
      rotation={[0,0,0]}
      position={props.position}
      geometry={meshData.geometry}
    >
      <meshPhongMaterial
        transparent={true}
        flatShading={false}
        color={props.selected[props.index] ? "white": props.colour}
        opacity={props.volumes.length > 1 ? 0.75 : 1}
      />
      {props.selected[props.index] ? 
      <Outlines thickness={0.5}
        color="black"
        screenspace={true}
        opacity={1}
        /> : 
      <Outlines thickness={0.2}
        color="black"
        screenspace={true}
        opacity={1}
      />}
    </mesh>
  )
}