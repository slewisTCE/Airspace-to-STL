import { Box } from "@mui/material";
import { ModelDisplay } from "./ModelDisplay";
import { Loading } from "./Loading";
import { type Mesh } from "three";
import { Volume, type OpenAirAirspaces } from "../openAir";
import { useWindowSize } from "../hooks/windowSize";
import type { Dispatch, SetStateAction } from "react";


export function CentralDisplay(props: {loading: boolean, volumes: Volume[], setVolumes: Dispatch<SetStateAction<Volume[]>>, airspaces: OpenAirAirspaces, margins: number, setMeshes: Dispatch<SetStateAction<Mesh[]>>, meshes: Mesh[], zScale: number}){
  const { width } = useWindowSize();
  
  const padding = 30
  const drawerWidth = props.margins + padding
  const marginLeft = `${drawerWidth-10}px`
  const marginRight = `${width - drawerWidth- padding}px`
  const modelSize = {width: 2500, height: 2500 }

  return (
    <Box
      component="main"
      sx={{ ml: marginLeft, mr: marginRight, marginTop: `64px`, marginBottom: `${padding}px` }}
    >
        {props.loading ? <Loading />:''}
      <ModelDisplay volumes={props.volumes} setVolumes={props.setVolumes} size={modelSize} setMeshes={props.setMeshes} meshes={props.meshes} zScale={props.zScale}/>
    </Box>
  )
}