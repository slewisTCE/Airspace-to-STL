import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Link, List, ListItem, Paper, Typography } from "@mui/material";

export function Attribution() {
  return (
    <Paper  sx={{ p:2, alignItems: 'flex-end'}}>
      <Typography  sx={{ mx: 'auto', width: 200 }}>
        {"Data source provided by "}
        <Link href="https://xcaustralia.org/download/" target="_blank">XcAustralia</Link> 
        {" using Airspace data valid from 28th November 2024 "}
        <Link href="https://xcaustralia.org/doc/dah/DAH_28NOV2024.pdf" target="_blank">Airservices DAH</Link> &amp; 
        <Link href="https://xcaustralia.org/doc/ersa/ersa_rds_index_28NOV2024.pdf" target="_blank">{" Airservices ERSA"}</Link>
        {"\nFor information on the used syntax, visit:  "}        
          <Link href="https://xcaustralia.org/doc/openair/winpilot_Airspace-OpenAir-Format_2018.htm">{"OpenAir Format Reference"}</Link>
      </Typography>
    </Paper>
  )
}

export function DisclaimerDialogue(props: {open: boolean, handleAgree: () => void, handleDisagree: () => void}) {
  return (
    <Dialog open={props.open} maxWidth="sm" fullWidth>
      <DialogTitle variant="h4">Disclaimer</DialogTitle>
      <DialogTitle variant="h6">Interactive 3D Explorer for OpenAir-Formatted Australian Airspace Data</DialogTitle>
      <DialogContent>
        <Paper sx={{ p:2, alignItems: 'flex-end'}}>
          <Typography>
            {
              `This project provides an interactive tool for exploring Australian airspace geometry in 3D using OpenAir-formatted data.`+
              ` It parses OpenAir-formatted airspace data — specifically the dataset supplied by XcAustralia — and allows users to select, combine, scale, and export airspace volumes with a focus on clarity and spatial accuracy.`
            }
          </Typography>
          <Divider sx={{ my: 2 }}/>
          <Typography>
            Airspace data is provided by <b>XcAustralia</b> and included under their published usage terms. Their dataset is <b>not authoritative</b> and must not be used for navigation.
          </Typography>
          <Divider sx={{ my: 2 }}/>
          <List sx={{ listStyleType: 'disc', pl: 4 }}>
            <ListItem sx={{ display: 'list-item' }}>
              <Typography variant="h6" color="warning">DO NOT rely on this information. Airspace has been simplified and is not correct in all cases</Typography>
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <Typography variant="h6" color="success">ALWAYS use current charts from Airservices Australia</Typography>
            </ListItem>
          </List>
          <Divider sx={{ my: 2 }}/>
          <Typography>
            {
              `For official information, refer to: `
             }
             <Link href="https://www.airservicesaustralia.com/aip/aip.asp">Airservices Australia: Aeronautical Information Package</Link>
          </Typography>
        </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.handleAgree} variant="contained" color="success">OK, Let me in</Button>
          <Button onClick={props.handleDisagree} variant="contained" color="error">Nevermind</Button>
        </DialogActions>
    </Dialog>
  )
}
