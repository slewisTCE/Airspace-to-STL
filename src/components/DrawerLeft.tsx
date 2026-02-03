import { Divider, Drawer, Stack, Toolbar } from "@mui/material";
import { ControlPanel } from "./ControlPanel";
import { VolumesPanel } from "./VolumesPanel";
import EdgyLogo from '../assets/edgy.png'
import type { DrawerLeftProps } from "../types/drawerLeftTypes";
import { drawerWidth, logoBarHeight } from "../lib/settings";


export function DrawerLeft(props: DrawerLeftProps){
  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar sx={{py:3, justifyContent: 'center', height: logoBarHeight}}>
        <img src={EdgyLogo} alt="Edgy Logo"/>
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
          autoRotate={props.autoRotate}
          handleAutoRotateChange={props.handleAutoRotateChange}
          handleResetView={props.handleResetView}
        />
        <VolumesPanel 
          volumes={props.volumes}
          envelope={props.envelope}
          handleEnvelopeChange={props.handleEnvelopeChange} 
          handleRemoveVolume={props.handleRemoveVolume} 
          handleClearAllVolumes={props.handleClearAllVolumes}
          handleAlert={props.handleAlert} 
          meshes={props.meshes}
        /> 
      </Stack>
    </Drawer>
  )
}

