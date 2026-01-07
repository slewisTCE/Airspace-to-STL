import { useState, type SyntheticEvent } from "react";
import type { VolumePanelProps } from "../types/volumePanelTypes";
import { Accordion, AccordionDetails, AccordionSummary, IconButton, Stack, Typography } from "@mui/material";
import { ExpandMore, Remove } from "@mui/icons-material";
import { VolumeCeilingFloorPanel } from "./VolumeCeilingFloorPanel";
import type { AlertSeverity } from "../types/alertTypes";
import { AlertWithSeverity } from "./Alert";

export function VolumesPanel(props: VolumePanelProps) {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('')
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>("success")

  const handleAccordianChange = (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
  }

  const handleRemoveVolume = (name: string) => (_event: SyntheticEvent) => {
    props.setVolumes(props.volumes.filter((volume) => {
      return volume.name != name
    }))
    setAlertMessage(`Removed "${name}" volume`)
    setAlertSeverity('success')
    setOpenAlert(true)
  }
  
  return (
    <Accordion expanded={expanded === 'panel1'} onChange={handleAccordianChange('panel1')}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="panel1bh-content"
        id="panel1bh-header"
      >
        <Typography component="span" sx={{ width: '100%', flexShrink: 0 }}>
          Volumes
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack direction={"column"} spacing={2}>
          <Stack spacing={1} direction={"column"} >
            {props.volumes.map((volume, index)=>{
              return(
                <Stack key={`stack${index}`} spacing={1} direction={"row"} >
                  <IconButton sx={{maxHeight: "40px", alignSelf: "center"}} key={`iconButton${index}`} value={volume.name} onClick={handleRemoveVolume(volume.name)}>
                    <Remove key={`removeIcon${index}`}/>
                  </IconButton >
                  <VolumeCeilingFloorPanel volumeName={volume.name} />
                </Stack>)
            })}
          </Stack>
        </Stack>
      </AccordionDetails>
      <AlertWithSeverity open={openAlert} setOpen={setOpenAlert} message={alertMessage} severity={alertSeverity}/>
    </Accordion>
  )
}