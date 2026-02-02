import { Divider, Drawer, Stack, Toolbar } from "@mui/material";
import { ControlPanel } from "./ControlPanel";
import { VolumesPanel } from "./VolumesPanel";
import EdgyLogo from '../assets/edgy.png'
import type { DrawerLeftProps } from "../types/drawerLeftTypes";


export function DrawerLeft(props: DrawerLeftProps){
  return (
    <Drawer
      sx={{
        width: props.drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: props.drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar sx={{py:3, justifyContent: 'center', height: 140}}>
        <img src={EdgyLogo}/>
      </Toolbar>
      <Divider />
      <Stack
        direction="column"
        spacing={2}
        sx={{
          justifyContent: "space-evenly",
        }}
      >
        <ControlPanel 
          airspaces={props.airspaces} 
          airspaceSelect={props.airspaceSelect} 
          setAirspaceSelect={props.setAirspaceSelect} 
          volumes={props.volumes} 
          handleAddVolume={props.handleAddVolume}
          handleAlert={props.handleAlert}
          zScale={props.zScale} 
          handleZScaleChange={props.handleZScaleChange}
        />
        <VolumesPanel 
          volumes={props.volumes}
          envelope={props.envelope}
          handleEnvelopeChange={props.handleEnvelopeChange} 
          handleRemoveVolume={props.handleRemoveVolume} 
          handleAlert={props.handleAlert} 
          meshes={props.meshes}
        /> 
      </Stack>
    </Drawer>
  )
}

