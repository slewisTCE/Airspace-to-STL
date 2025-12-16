import { Box, Toolbar } from "@mui/material";
import { ModelDisplay } from "./ModelDisplay";
import { Loading } from "./Loading";

export function CentralDisplay(props: {loading: boolean}){
  return (
    <Box
      component="main"
      // sx={{ justifyContent: 'flex-start', flexGrow: 1, bgcolor: 'background.default', p: 3 }}
    >
      <Toolbar />
        {props.loading ? <Loading />:''}
      <ModelDisplay/>
    </Box>
  )
}