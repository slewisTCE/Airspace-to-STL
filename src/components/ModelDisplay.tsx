import { Paper } from "@mui/material";
import { OrbitControls, Outlines } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { airspaceClassMap, Volume } from "../openAir";
import { useEffect, useRef, useState } from "react";
import { useMeshFromSvgData } from "../hooks/geometry";
import { modelScale } from "../lib/settings";
import { Arc } from "../openAir/arc";
import { Circle } from "../openAir/circle";
import { Polygon } from "../openAir/polygon";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export function ModelDisplay(props: 
  {
    volumes: Volume[],
    size: {height: number, width: number}, 
    zScale: number, 
    handleClickSelect: (name: string, selected: boolean) => void,
    handleClearSelection: () => void
  }) {
  return (
    <Paper sx={{ justifyContent: 'center', width:1 }}>
      <Scene 
        volumes={props.volumes} 
        size={props.size} 
        zScale={props.zScale} 
        handleClickSelect={props.handleClickSelect}
        handleClearSelection={props.handleClearSelection}/>
    </Paper>
  )
}

export function Scene(props: 
  {
    volumes: Volume[], 
    size: {height: number, width: number}, 
    zScale: number,
    handleClickSelect: (name: string, selected: boolean) => void,
    handleClearSelection: () => void
  }){
  
  const [centroidOffset, setCentroidOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const [gridSize, setGridSize] = useState(500)
  const [gridDivisions, setGridDivisions] = useState(20)
  const [gridCenter, setGridCenter] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const prevVolumeCount = useRef(0)

  const getProjectedBounds = (volumes: Volume[]) => {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const expand = (x: number, y: number) => {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }

    volumes.forEach((volume) => {
      volume.airspace.shapes.forEach((shape) => {
        if (shape instanceof Polygon) {
          expand(shape.points.projection.x, shape.points.projection.y)
        } else if (shape instanceof Circle) {
          const radius = shape.radius.value.kiloMetres
          const cx = shape.center.projection.x
          const cy = shape.center.projection.y
          expand(cx - radius, cy - radius)
          expand(cx + radius, cy + radius)
        } else if (shape instanceof Arc) {
          const radius = shape.radius.value.kiloMetres
          const cx = shape.center.projection.x
          const cy = shape.center.projection.y
          expand(cx - radius, cy - radius)
          expand(cx + radius, cy + radius)
        }
      })
    })

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return undefined
    return { minX, minY, maxX, maxY }
  }

  useEffect(() => {
    async function fetchProjections() {
      const projectedCentroid = Volume.getCombinedProjectedCentroid(props.volumes)
      if (projectedCentroid) {
        setCentroidOffset({
          x: -projectedCentroid.x,
          y: -projectedCentroid.y
        })
      } else {
        setCentroidOffset({ x: 0, y: 0 })
      }
    }
    fetchProjections()
  }, [props.volumes])
  // Re-center camera and controls to fit all meshes when meshes change

  useEffect(() => {
    const bounds = getProjectedBounds(props.volumes)
    if (!bounds) {
      setGridSize(500)
      setGridDivisions(20)
      return
    }

    const minX = (bounds.minX + centroidOffset.x) * modelScale
    const maxX = (bounds.maxX + centroidOffset.x) * modelScale
    const minY = (bounds.minY + centroidOffset.y) * modelScale
    const maxY = (bounds.maxY + centroidOffset.y) * modelScale
    const spanX = Math.abs(maxX - minX)
    const spanY = Math.abs(maxY - minY)
    const maxSpan = Math.max(spanX, spanY)
    const padded = Math.max(100, maxSpan * 1.2)
    setGridSize(padded)
    setGridDivisions(Math.max(10, Math.round(padded / 10)))
    setGridCenter({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 })
  }, [props.volumes, centroidOffset])



  return (
    <Canvas 
      frameloop="demand" 
      camera={{ position: [0, -120, 120] }} 
      style={{width: props.size.width, height: props.size.height}}
      onPointerMissed={() => props.handleClearSelection()}
    >
      <gridHelper position={[gridCenter.x, gridCenter.y, 0]} rotation-x={Math.PI / 2} args={[gridSize, gridDivisions, 0x888888, 0x333333]} />
      <ambientLight intensity={1} color={0xffffff} />
      <hemisphereLight intensity={0.6} color={0xffffff} groundColor={0x444444} />
      <directionalLight position={[0, -250, 250]} intensity={1} color={0xffffff} />
      <OrbitControls ref={controlsRef} enableDamping={false}/>
      <CameraFocus
        volumes={props.volumes}
        zScale={props.zScale}
        centroidOffset={centroidOffset}
        controlsRef={controlsRef}
        prevVolumeCountRef={prevVolumeCount}
      />
      <group>
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
      </group>
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
  const depth = props.depth
  const meshData = useMeshFromSvgData(props.svgString, {depth: depth, curveSegments: 128}, props.colour)
  
  function handleClick(name: string){
    const newSelected = !props.volume.selected
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
      <meshStandardMaterial
        transparent={true}
        color={props.volume.selected ? "white": props.colour}
        opacity={props.volumes.length > 1 ? 0.95 : 1}
        roughness={1}
        metalness={0}
      />
      {props.volume.selected ? 
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

function CameraFocus(props: {
  volumes: Volume[]
  zScale: number
  centroidOffset: { x: number; y: number }
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>
  prevVolumeCountRef: React.MutableRefObject<number>
}){
  const { camera } = useThree()
  const defaultCameraPosition = new Vector3(0, -120, 120)
  const defaultTarget = new Vector3(0, 0, 0)

  const getProjectedBoundsForVolume = (volume: Volume) => {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const expand = (x: number, y: number) => {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }

    volume.airspace.shapes.forEach((shape) => {
      if (shape instanceof Polygon) {
        expand(shape.points.projection.x, shape.points.projection.y)
      } else if (shape instanceof Circle) {
        const radius = shape.radius.value.kiloMetres
        const cx = shape.center.projection.x
        const cy = shape.center.projection.y
        expand(cx - radius, cy - radius)
        expand(cx + radius, cy + radius)
      } else if (shape instanceof Arc) {
        const radius = shape.radius.value.kiloMetres
        const cx = shape.center.projection.x
        const cy = shape.center.projection.y
        expand(cx - radius, cy - radius)
        expand(cx + radius, cy + radius)
      }
    })

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return undefined
    return { minX, minY, maxX, maxY }
  }

  useEffect(() => {
    const nextCount = props.volumes.length
    if (nextCount === 0) {
      camera.position.copy(defaultCameraPosition)
      camera.lookAt(defaultTarget)
      props.controlsRef.current?.target.copy(defaultTarget)
      props.controlsRef.current?.update()
      props.prevVolumeCountRef.current = nextCount
      return
    }
    if (nextCount <= props.prevVolumeCountRef.current) {
      props.prevVolumeCountRef.current = nextCount
      return
    }

    const latestVolume = props.volumes[nextCount - 1]
    const location = Volume.scaleZ(latestVolume, props.zScale, props.centroidOffset)
    const bounds = getProjectedBoundsForVolume(latestVolume)
    const depthWorld = location.depth * modelScale
    let target = new Vector3(location.posX, location.posY, location.posZ + depthWorld / 2)
    let distance = Math.max(80, Math.max(depthWorld, 20) * 3)

    if (bounds) {
      const minX = (bounds.minX + props.centroidOffset.x) * modelScale
      const maxX = (bounds.maxX + props.centroidOffset.x) * modelScale
      const minY = (bounds.minY + props.centroidOffset.y) * modelScale
      const maxY = (bounds.maxY + props.centroidOffset.y) * modelScale
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const spanX = Math.abs(maxX - minX)
      const spanY = Math.abs(maxY - minY)
      const maxSpan = Math.max(spanX, spanY, depthWorld)
      target = new Vector3(centerX, centerY, location.posZ + depthWorld / 2)
      distance = Math.max(20, maxSpan * 1.1)
    }

    const newCameraPos = new Vector3(target.x, target.y - distance, target.z + distance)
    camera.position.copy(newCameraPos)
    camera.lookAt(target)
    props.controlsRef.current?.target.copy(target)
    props.controlsRef.current?.update()
    props.prevVolumeCountRef.current = nextCount
  }, [props.volumes, props.zScale, props.centroidOffset, props.prevVolumeCountRef, props.controlsRef, camera])

  return null
}