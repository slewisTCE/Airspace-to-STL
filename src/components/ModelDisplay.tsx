import { Paper } from "@mui/material";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { OpenAirAirspace } from "../openAir";
import { SVGLoader } from "three/examples/jsm/Addons.js";
import { useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from "react";
import { feetToNauticalMiles, floorCeilingToDepthFloor } from "../utils/utils";
import { useMeshFromSvgData } from "../hooks/geometry";

export function ModelDisplay(props: {volumes: OpenAirAirspace[], size: {height: number, width: number}, setMeshes: Dispatch<SetStateAction<THREE.Mesh[]>>, meshes: THREE.Mesh[]}) {
  return (
    <Paper sx={{ justifyContent: 'center', width:1 }}>
      <Scene volumes={props.volumes} size={props.size} setMeshes={props.setMeshes} meshes={props.meshes}/>
    </Paper>
  )
}

export function Scene(props: {volumes: OpenAirAirspace[], size: {height: number, width: number}, setMeshes: Dispatch<SetStateAction<THREE.Mesh[]>>, meshes: THREE.Mesh[]}){
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
          if (volume.ceiling.valueFeet && volume.floor.valueFeet != undefined){
            [depth, floor] = floorCeilingToDepthFloor({ceiling: volume.ceiling.valueFeet, floor: volume.floor.valueFeet}, modelScale)
          }
          if (volume.svg){
            return (<MeshFromSvgString key={index} svgString={volume.svgScaled} depth={depth} position={[-350,-690, floor]} scale={modelScale} setMeshes={props.setMeshes} meshes={props.meshes}/>)
          }
        })
      }
    </Canvas>
  )
}

function MeshFromSvgString(props: {svgString: string, depth: number, position: [number, number, number], scale: number, setMeshes: Dispatch<SetStateAction<THREE.Mesh[]>>, meshes: THREE.Mesh[]}){
  const meshRef = useRef<THREE.Mesh | undefined>(undefined)
  const [meshData, shapes] = useMeshFromSvgData(props.svgString, {depth: props.depth}, "0xff0000")
  useEffect(()=>{
    if(meshData){

      props.setMeshes(props.meshes.concat(meshData))
    }
  },[meshData])

  console.log(shapes)
  if(!meshData){
    return (<></>)
  } 
  return (
    <mesh
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
        color={0x4de7ff}
        opacity={0.75}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}