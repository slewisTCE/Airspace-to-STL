import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
import { SliderControl } from "./SliderControl";
import type { Envelope } from "../openAir/openAirTypes";

export function VolumeCeilingFloorPanel(props: 
  {
    volumeName: string, 
    envelope: Envelope, 
    initialEnvelope: Envelope, 
    handleEnvelopeChange: (newEnvelope: Envelope, volumeName: string) => void
    expanded: boolean,
    handleExpandedChange: (expanded: boolean) => void,
    floorNotam: boolean,
    ceilingNotam: boolean,
    floorRawValue: string,
    ceilingRawValue: string
   }
  ){
    return (
      <Accordion
        expanded={props.expanded}
        onChange={(_event, isExpanded) => props.handleExpandedChange(isExpanded)}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls={`${props.volumeName}-content`}
          id={`${props.volumeName}-header`}
        >
          <Typography variant="body2" component="span" sx={{ width: '100%', flexShrink: 0 }}>
            {props.volumeName}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction={"column"}>
            <SliderControl 
              envelope={props.envelope} 
              initialEnvelope={props.initialEnvelope} 
              handleEnvelopeChange={(newEnvelope) => props.handleEnvelopeChange(newEnvelope, props.volumeName)} 
              floorNotam={props.floorNotam} 
              ceilingNotam={props.ceilingNotam} 
              floorRawValue={props.floorRawValue}
              ceilingRawValue={props.ceilingRawValue}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    )
}