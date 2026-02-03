import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import { drawerWidth, topBarHeight } from '../lib/settings'

export function TopBar(props: {handleRightDrawerOpen: (open: boolean) => void}){         
  return (
    <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
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
          <IconButton onClick={()=>props.handleRightDrawerOpen(true)}>
            <KeyboardDoubleArrowLeftIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
  )}