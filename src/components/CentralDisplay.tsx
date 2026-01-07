import { Box } from "@mui/material";
import { ModelDisplay } from "./ModelDisplay";
import { Loading } from "./Loading";
import type { OpenAirAirspace, OpenAirAirspaces } from "../openAir";
import { useWindowSize } from "../hooks/windowSize";


export function CentralDisplay(props: {loading: boolean, volumes: OpenAirAirspace[], airspaces: OpenAirAirspaces, margins: number}){
  const { width } = useWindowSize();
  

  const padding = 30
  const drawerWidth = props.margins + padding
  const marginLeft = `${drawerWidth-10}px`
  const drawersWidth = (props.margins + padding)*2
  const marginRight = `${width - drawerWidth- padding}px`
  const modelWidth = width - drawersWidth

  const modelSize = {width: 2500, height: 2500 }

  props.volumes.map((volume)=>{
     props.airspaces.scaleProjection(volume, modelWidth)
  })

  const volumesScaled = props.airspaces.airspaces.filter((airspace)=>{
    return props.volumes.some(volume => volume.name === airspace.name)
  })

  return (
    <Box
      component="main"
      sx={{ ml: marginLeft, mr: marginRight, marginTop: `64px`, marginBottom: `${padding}px` }}
    >
        {props.loading ? <Loading />:''}
      <ModelDisplay volumes={volumesScaled} size={modelSize}/>
    </Box>
  )
}