import { Box } from "@mui/material";
import { ModelDisplay } from "./ModelDisplay";
import { Loading } from "./Loading";
import { Volume } from "../openAir";
import { useWindowSize } from "../hooks/windowSize";
import { drawerWidth, topBarHeight } from "../lib/settings";


export function CentralDisplay(props: 
  {
    loading: boolean, 
    volumes: Volume[], 
    rightDrawerOpen: boolean,
    zScale: number,
    autoRotate: boolean,
    handleAutoRotateChange: (autoRotate: boolean) => void,
    focusRequest: number,
    handleClickSelect: (name: string, selected: boolean) => void,
    handleClearSelection: () => void}){
  const { width, height } = useWindowSize();
  
  const padding = 10

  const rightMarginSize = props.rightDrawerOpen ? drawerWidth : padding
  const marginLeft = `${drawerWidth + padding}px`
  const marginRight = `${rightMarginSize}px`
  const marginTop = `${topBarHeight + padding}px`
  const marginBottom = `${padding}px`
  const availableWidth = Math.max(300, width - drawerWidth - rightMarginSize - padding * 2)
  const availableHeight = Math.max(300, height - topBarHeight - padding * 2)
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
        autoRotate={props.autoRotate}
        handleAutoRotateChange={props.handleAutoRotateChange}
        focusRequest={props.focusRequest}
      />
    </Box>
  )
}