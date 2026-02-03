import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
import { useState} from "react";
import { SliderControl } from "./SliderControl";
import type { Envelope } from "../openAir/openAirTypes";

export function VolumeCeilingFloorPanel(props: {volumeName: string, envelope: Envelope, initialEnvelope: Envelope, handleEnvelopeChange: (newEnvelope: Envelope, volumeName: string) => void}){
  const [expanded, setExpanded] = useState<string | false>(false);
  
  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    }

    return (
      <Accordion expanded={expanded === props.volumeName} onChange={handleChange(props.volumeName)}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls={`${props.volumeName}-content`}
          id={`${props.volumeName}-header`}
        >
          <Typography component="span" sx={{ width: '100%', flexShrink: 0 }}>
            {props.volumeName}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction={"column"}>
            <SliderControl envelope={props.envelope} initialEnvelope={props.initialEnvelope} handleEnvelopeChange={(newEnvelope) => props.handleEnvelopeChange(newEnvelope, props.volumeName)}/>
          </Stack>
        </AccordionDetails>
      </Accordion>
    )
}