import { Link, Paper, Typography } from "@mui/material";

export function Disclaimer() {
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
