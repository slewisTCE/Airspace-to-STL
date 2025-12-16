import { AppBar, Toolbar, Typography } from "@mui/material";

export function TopBar(props: {drawerWidth: number}){         
  return (
    <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${props.drawerWidth}px)`, ml: `${props.drawerWidth}px` }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            DAH Volume Modeller
          </Typography>
        </Toolbar>
      </AppBar>
  )}