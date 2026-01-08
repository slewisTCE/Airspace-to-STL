import { Divider, Drawer, IconButton, Stack, Toolbar } from "@mui/material";
import { AirSpaceInfoBox } from "./AirspaceInfoBox";
import { SvgPreviewBox } from "./SvgPreviewBox";
import { Disclaimer } from "./Disclaimer";
import { GithubLink } from "./GithubLink";
import { Volume } from "../openAir";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function DrawerRight(props: {drawerWidth: number, volumes: Volume[], open: boolean, setOpen: Dispatch<SetStateAction<boolean>>}){
  const [volumesInfo, setVolumesInfo] = useState<Volume[]>([])
  useEffect(()=>{
    const newVolumes = props.volumes.filter(volume=>volume.selected)
    console.log(props.volumes)
    setVolumesInfo(newVolumes)
  },[props.volumes])

  return(
    <Drawer
      sx={{
        width: props.drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: props.drawerWidth,
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
        <Toolbar sx={{py:3, justifyContent: 'left', height: 20}}>
          <IconButton onClick={()=>props.setOpen(false)}>
            <KeyboardDoubleArrowRightIcon />
          </IconButton>
        </Toolbar>
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