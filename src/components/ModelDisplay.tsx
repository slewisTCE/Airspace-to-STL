import { Paper } from "@mui/material";
import { OrbitControls, Outlines } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { airspaceClassMap, Volume, type OpenAirAirspace } from "../openAir";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { feetToNauticalMiles, floorCeilingToDepthFloor } from "../utils/utils";
import { useMeshFromSvgData } from "../hooks/geometry";

export function ModelDisplay(props: {volumes: Volume[], setVolumes: Dispatch<SetStateAction<Volume[]>>, size: {height: number, width: number}, setMeshes: Dispatch<SetStateAction<THREE.Mesh[]>>, meshes: THREE.Mesh[]}) {
  return (
    <Paper sx={{ justifyContent: 'center', width:1 }}>
      <Scene volumes={props.volumes} setVolumes={props.setVolumes} size={props.size} setMeshes={props.setMeshes} meshes={props.meshes}/>
    </Paper>
  )
}

export function Scene(props: {volumes: Volume[], setVolumes: Dispatch<SetStateAction<Volume[]>>, size: {height: number, width: number}, setMeshes: Dispatch<SetStateAction<THREE.Mesh[]>>, meshes: THREE.Mesh[]}){
  const modelScale=0.4
  return (
    <Canvas camera={{ position: [0, -120, 120] }} style={{width: props.size.width, height: props.size.height}}>
      <gridHelper position={[0,0,0]} rotation-x={Math.PI / 2} args={[200, 20, 0x888888, 0x333333]} />
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <OrbitControls />
      {
        props.volumes.map((volume, index)=>{
          let depth = 2
          let floor = 0
          if (volume.airspace.ceiling.valueFeet && volume.airspace.floor.valueFeet != undefined){
            [depth, floor] = floorCeilingToDepthFloor({ceiling: volume.airspace.ceiling.valueFeet, floor: volume.airspace.floor.valueFeet}, modelScale)
          }
          if (volume.airspace.svg){
            return (
              <MeshFromSvgString 
                key={index} 
                svgString={volume.airspace.svgScaled} 
                depth={depth} 
                position={[-350,-690, floor]} 
                scale={modelScale} 
                setMeshes={props.setMeshes} 
                meshes={props.meshes} 
                colour={airspaceClassMap[volume.airspace.airspaceClass.code].colour}
                volume={volume}
                volumes={props.volumes}
                setVolumes={props.setVolumes}
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
  }){
  const meshRef = useRef<THREE.Mesh | undefined>(undefined)
  const [meshData, shapes] = useMeshFromSvgData(props.svgString, {depth: props.depth}, props.colour)
  const [selected, setSelected] = useState(false)
  useEffect(()=>{
    if(meshData){
      props.setMeshes(props.meshes.concat(meshData))
    }
  },[meshData])

  function clearAllSelections(){
    props.setVolumes(props.volumes.map((_volume)=>{
      _volume.selected = false
      return _volume
    }))
  }

  function handleClick(volume: Volume){
    props.volumes.map((_volume)=>{
      if(_volume.airspace.name == volume.airspace.name){
        _volume.selected = !volume.selected
      }
      return _volume
    })
  }

  if(!meshData){
    return (<></>)
  } 
  return (
    <mesh
      onClick={()=>handleClick(props.volume)}
      ref={meshRef}
      scale={props.scale}
      rotation={[0,0,0]}
      position={props.position}
      geometry={meshData.geometry}
    >
      {shapes.map((shape, index) => (
        <extrudeGeometry
          key={index}
          args={[
            shape,
            {
              depth: props.depth,
              bevelEnabled: false,
              steps: 30,
            },
          ]}
        />
      ))}
      <meshPhongMaterial
        color={selected ? "white": props.colour}
        opacity={selected ? 1 : 0.5}
        side={THREE.DoubleSide}
      />
      {selected ? 
      <Outlines thickness={0.5}
        color="black"
        screenspace={true}
        opacity={1}
        /> : 
        <></>}
    </mesh>
  )
}