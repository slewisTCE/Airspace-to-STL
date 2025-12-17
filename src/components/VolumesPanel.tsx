import { useState, type SyntheticEvent } from "react";
import type { VolumePanelProps } from "../types/volumePanelTypes";
import { Accordion, AccordionDetails, AccordionSummary, IconButton, Stack, Typography } from "@mui/material";
import { ExpandMore, Remove } from "@mui/icons-material";
import { VolumeCeilingFloorPanel } from "./VolumeCeilingFloorPanel";

export function VolumesPanel(props: VolumePanelProps) {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleAccordianChange = (panel: string) => (event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
  }

  const handleRemoveVolume = (name: string) => (event: SyntheticEvent) => {
    console.log(name)
    props.setVolumes(props.volumes.filter((volume) => {
      return volume.name != name
    }))
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
              <>
                <Stack key={`stack${index}`} spacing={1} direction={"row"} >
                  <IconButton value={volume.name} onClick={handleRemoveVolume(volume.name)}>
                    <Remove/>
                  </IconButton >
                  <VolumeCeilingFloorPanel volumeName={volume.name} />
                </Stack>
              </>)
            })}
            
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}