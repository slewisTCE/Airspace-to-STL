import { Paper } from "@mui/material";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { OpenAirAirspace, OpenAirAirspaces } from "../openAir";

export function ModelDisplay(props: {volumes: OpenAirAirspace[], airspaces: OpenAirAirspaces, size: {height: number, width: number}}) {
  return (
    <Paper sx={{ justifyContent: 'center', width:1 }}>
      <Canvas camera={{ position: [0, -120, 120] }} style={{width: props.size.width, height: props.size.height}}>
        <gridHelper position={0} rotation-x={Math.PI / 2} args={[200, 20, 0x888888, 0x333333]} />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        <OrbitControls />
      </Canvas>
    </Paper>
  )
}