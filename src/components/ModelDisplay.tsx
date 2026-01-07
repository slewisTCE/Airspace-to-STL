import { Paper } from "@mui/material";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { OpenAirAirspace } from "../openAir";
import { SVGLoader } from "three/examples/jsm/Addons.js";
import { useMemo } from "react";

export function ModelDisplay(props: {volumes: OpenAirAirspace[], size: {height: number, width: number}}) {
  return (
    <Paper sx={{ justifyContent: 'center', width:1 }}>
      <Canvas camera={{ position: [0, -120, 120] }} style={{width: props.size.width, height: props.size.height}}>
        <gridHelper position={[-33,100,0]} rotation-x={Math.PI / 2} args={[200, 20, 0x888888, 0x333333]} />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        <OrbitControls />
        {
          props.volumes.map((volume, index)=>{
            if (volume.svg){
              return (<MeshFromSvgString key={index} svgString={volume.svgScaled} depth={2} position={[-380,-590,0]} scale={0.4}/>)
            }
          })
        }
      </Canvas>
    </Paper>
  )
}

function MeshFromSvgString(props: {svgString: string, depth: number, position: [number, number, number], scale: number}){
  const loader = new SVGLoader();
  const svgData = loader.parse(props.svgString)
  const shapes = useMemo(() => {
    return svgData.paths.map((path) => path.toShapes(true));
  }, [svgData]);

  return (
    <mesh
      scale={props.scale}
      rotation={[0, 0, 0]}
      position={props.position}
    >
      {shapes.map((s, i) => (
        <extrudeGeometry
          key={i}
          args={[
            s,
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