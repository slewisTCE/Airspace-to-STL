import { AppBar, Box, IconButton, Toolbar, Tooltip, Typography } from "@mui/material";
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { drawerWidth, topBarHeight } from '../lib/settings'
import { ThemeModeButton } from "./themeMode";

export function TopBar(props: {handleRightDrawerOpen: (open: boolean) => void, rightDrawerOpen: boolean, setDarkModeActiveAction: (active: boolean) => void, darkModeActive: boolean})  {         
  return (
    <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, mr: props.rightDrawerOpen ? `${drawerWidth-10}px` : `${10}px` }}
      >
        <Toolbar  
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 1,
            m: 1,
            bgcolor: 'background.paper',
            borderRadius: 1,
            height: topBarHeight
          }}>
          <Typography variant="h6" noWrap component="div">
            DAH Volume Modeller
          </Typography>
          <Box>
            <Tooltip title={props.darkModeActive ? "Change to Light Mode" : "Change to Dark Mode"}>
              <ThemeModeButton darkModeActive={props.darkModeActive} setDarkModeActiveAction={props.setDarkModeActiveAction}/>
            </Tooltip>
            {!props.rightDrawerOpen ?
            <IconButton onClick={()=>props.handleRightDrawerOpen(true)}>
              <KeyboardDoubleArrowLeftIcon />
            </IconButton> : 
             <IconButton onClick={()=>props.handleRightDrawerOpen(false)}>
              <KeyboardDoubleArrowRightIcon />
            </IconButton>
            }
          </Box>
        </Toolbar>
      </AppBar>
  )}