import { Divider, Drawer, Stack, Toolbar } from "@mui/material";
import { AirSpaceInfoBox } from "./AirspaceInfoBox";
import { SvgPreviewBox } from "./SvgPreviewBox";
import { Disclaimer } from "./Disclaimer";
import { GithubLink } from "./GithubLink";
import type { OpenAirAirspace } from "../openAir";

export function DrawerRight(props: {drawerWidth: number, airspaceSelect: OpenAirAirspace | undefined}){
  return(
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
      anchor="right"
    >
      <Toolbar sx={{py:3, justifyContent: 'center', height: 20}}>
      </Toolbar>
      <Divider />
      <Stack
        direction="column"
        spacing={2}
        sx={{
          justifyContent: "space-evenly",
        }}
      >
        <AirSpaceInfoBox airspaceSelect={props.airspaceSelect}/>
        <SvgPreviewBox/>
        <Disclaimer/>
        <GithubLink/>
      </Stack>
    </Drawer>
  )
}