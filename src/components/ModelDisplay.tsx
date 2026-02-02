import { Paper } from "@mui/material";
import { OrbitControls, Outlines } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { airspaceClassMap, Volume } from "../openAir";
import { useEffect, useRef, useState } from "react";
import { useMeshFromSvgData } from "../hooks/geometry";
import { modelScale } from "../lib/settings";

export function ModelDisplay(props: 
  {
    volumes: Volume[],
    size: {height: number, width: number}, 
    zScale: number, 
    handleClickSelect: (name: string, selected: boolean) => void
  }) {
  return (
    <Paper sx={{ justifyContent: 'center', width:1 }}>
      <Scene 
        volumes={props.volumes} 
        size={props.size} 
        zScale={props.zScale} 
        handleClickSelect={props.handleClickSelect}/>
    </Paper>
  )
}

export function Scene(props: 
  {
    volumes: Volume[], 
    size: {height: number, width: number}, 
    zScale: number,
    handleClickSelect: (name: string, selected: boolean) => void
  }){
  
  const [centroidOffset, setCentroidOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 })

  const volumes = useRef(Array.from(props.volumes))

  useEffect(() => {
    async function fetchProjections() {
      console.log('Calculating projected centroid for volumes', volumes.current);
      const projectedCentroid = Volume.getCombinedProjectedCentroid(volumes.current)
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
  }, [volumes])
  // Re-center camera and controls to fit all meshes when meshes change


  return (
    <Canvas frameloop="demand" camera={{ position: [0, -120, 120] }} style={{width: props.size.width, height: props.size.height}}>
      <gridHelper position={[0,0,0]} rotation-x={Math.PI / 2} args={[500, 20, 0x888888, 0x333333]} />
      <ambientLight intensity={1} color={0xffffff} />
      <directionalLight position={[0, -250, 250]} intensity={1} color={0xffffff} />
      <OrbitControls enableDamping={false}/>
      {
        props.volumes.map((volume, index)=>{

          const location = Volume.scaleZ(volume, props.zScale, centroidOffset)
          if (volume.airspace.svg){
            return (
              <MeshFromSvgString 
                key={index} 
                svgString={volume.airspace.svg} 
                depth={location.depth} 
                position={[location.posX, location.posY, location.posZ]} 
                colour={airspaceClassMap[volume.airspace.airspaceClass.code].colour}
                volume={volume}
                volumes={props.volumes}
                index={index}
                handleClickSelect={props.handleClickSelect}
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
    colour: string, 
    volume: Volume,
    volumes: Volume[],
    handleClickSelect: (name: string, selected: boolean) => void,
    index: number
  }){
  const [selected, setSelected] = useState(Array(props.volumes.length).fill(false))
  const depth = props.depth
  const meshData = useMeshFromSvgData(props.svgString, {depth: depth, curveSegments: 64}, props.colour)
  
  function handleClick(name: string){
    const newSelected = !selected[props.index]
    const newArray = Array(selected.length).fill(false)
    setSelected(newArray)
    newArray[props.index] = newSelected
    setSelected(newArray)
    props.handleClickSelect(name, newSelected)
  }

  if(!meshData){
    return (<></>)
  }
  return (
    <mesh
      onClick={()=>handleClick(props.volume.airspace.name)}
      scale={modelScale}
      rotation={[0,0,0]}
      position={props.position}
      geometry={meshData.geometry}
    >
      <meshPhongMaterial
        transparent={true}
        flatShading={false}
        color={selected[props.index] ? "white": props.colour}
        opacity={props.volumes.length > 1 ? 0.75 : 1}
      />
      {selected[props.index] ? 
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