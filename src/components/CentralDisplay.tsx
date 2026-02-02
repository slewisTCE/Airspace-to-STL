import { Box } from "@mui/material";
import { ModelDisplay } from "./ModelDisplay";
import { Loading } from "./Loading";
import { Volume } from "../openAir";
import { useWindowSize } from "../hooks/windowSize";


export function CentralDisplay(props: 
  {
    loading: boolean, 
    volumes: Volume[], 
    margins: number, 
    zScale: number,
    handleClickSelect: (name: string, selected: boolean) => void}){
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
      <ModelDisplay volumes={props.volumes} handleClickSelect={props.handleClickSelect} size={modelSize} zScale={props.zScale}/>
    </Box>
  )
}