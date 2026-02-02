import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';

export function TopBar(props: {drawerWidth: number, handleRightDrawerOpen: (open: boolean) => void}){         
  return (
    <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${props.drawerWidth}px)`, ml: `${props.drawerWidth}px` }}
      >
        <Toolbar  
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: 1,
          m: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
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