import { Divider, Drawer, Stack, Toolbar } from "@mui/material";
import { AirSpaceInfoBox } from "./AirspaceInfoBox";
import { SvgPreviewBox } from "./SvgPreviewBox";
import { Disclaimer } from "./Disclaimer";
import { GithubLink } from "./GithubLink";
import { Volume } from "../openAir";
import { useEffect, useState } from "react";
import { drawerWidth } from "../lib/settings";

export function DrawerRight(props: {volumes: Volume[], open: boolean, handleRightDrawerOpen: ( open: boolean) => void}) {
  const [volumesInfo, setVolumesInfo] = useState<Volume[]>([])
  useEffect(()=>{
    async function updateVolumesInfo() {
      const newVolumes = props.volumes.filter(volume=>volume.selected)
      setVolumesInfo(newVolumes)
    }
    updateVolumesInfo();
  },[props.volumes])

  return(
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
            boxSizing: 'border-box',
            display: 'flex',
          justifyContent: 'space-between',
        },
      }}
      variant="persistent"
      anchor="right"
      open={props.open}
    >
      <Stack
        direction="column"
        spacing={2}
        sx={{
          justifyContent: "space-evenly",
        }}
      >
        <Toolbar sx={{py:3, justifyContent: 'left', height: 20}}></Toolbar>       
        <Divider />
        <AirSpaceInfoBox volumes={volumesInfo}/>
      </Stack>
        <SvgPreviewBox/>
      <Stack>
        <Disclaimer/>
        <Divider/>
        <GithubLink/>
      </Stack>
    </Drawer>
  )
}