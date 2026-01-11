import { CircularProgress, Paper, Typography, Box, List, ListItem, useTheme } from "@mui/material";
import { getSiteLog } from "../utils/siteLog";
import EdgyLogo from '../assets/edgy.png'

export function Loading(props: { message?: string }) {
  const log = getSiteLog()
  const theme = useTheme()
  const bg = theme.palette.background.paper
  const text = theme.palette.text.primary

  return (
    <Box sx={{position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300}}>
      <Paper elevation={8} sx={{p:2, width: 560, maxHeight: '70vh', overflow: 'auto', bgcolor: bg, color: text}}>
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
          <Box component="img" src={EdgyLogo} alt="logo" sx={{height: 64}}/>
          <CircularProgress sx={{color: theme.palette.primary.main}} size={64} />
          <Box sx={{textAlign: 'center'}}>
            <Typography variant="h6">{props.message ?? 'Loading…'}</Typography>
            <Typography variant="caption" color="text.secondary">Please wait — preparing site</Typography>
          </Box>
        </Box>

        <Box sx={{mt:2}}>
          <Typography variant="subtitle2">Site log</Typography>
          <List dense sx={{maxHeight: 220, overflow: 'auto'}}>
            {log.length === 0 ? (
              <ListItem>no log entries</ListItem>
            ) : (
              log.slice().reverse().map((l, i) => <ListItem key={i}><Typography variant="body2" sx={{fontFamily: 'monospace'}}>{l}</Typography></ListItem>)
            )}
          </List>
        </Box>
      </Paper>
    </Box>
  )
}

export default Loading