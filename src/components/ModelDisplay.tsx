import { Paper, useMediaQuery } from "@mui/material";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export function ModelDisplay() {
 
  return (
    <Paper sx={{maxHeight: {sm: '800px', lg: '1100px'}, height: 1, width: '1200px', justifyContent: 'flex-start', flexDirection: 'row', display: 'flex', alignItems: 'flex-start'}}>
      <Canvas camera={{ position: [0, -80, 80] }} >
        <gridHelper position={0} rotation-x={Math.PI / 2} args={[200, 20, 0x888888, 0x333333]} />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        {/* <Box position={[-1.2, 0, 0]} />
        <Box position={[1.2, 0, 0]} /> */}
        <OrbitControls />
      </Canvas>
    </Paper>
  )
}