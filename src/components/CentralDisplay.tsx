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
    rightDrawerOpen: boolean,
    zScale: number,
    handleClickSelect: (name: string, selected: boolean) => void,
    handleClearSelection: () => void}){
  const { width, height } = useWindowSize();
  
  const padding = 10
  const drawerWidth = 320
  const toolbarHeight = 80

  const rightMarginSize = props.rightDrawerOpen ? drawerWidth : padding
  const marginLeft = `${drawerWidth + padding}px`
  const marginRight = `${rightMarginSize}px`
  const marginTop = `${toolbarHeight + padding}px`
  const marginBottom = `${padding}px`
  const availableWidth = Math.max(300, width - drawerWidth - rightMarginSize - padding * 2)
  const availableHeight = Math.max(300, height - toolbarHeight - padding * 2)
  const modelSize = { width: availableWidth, height: availableHeight }

  return (
    <Box
      component="main"
      sx={{ ml: marginLeft, mr: marginRight, marginTop: marginTop, marginBottom: marginBottom }}
    >
        {props.loading ? <Loading />:''}
      <ModelDisplay
        volumes={props.volumes}
        handleClickSelect={props.handleClickSelect}
        handleClearSelection={props.handleClearSelection}
        size={modelSize}
        zScale={props.zScale}
      />
    </Box>
  )
}