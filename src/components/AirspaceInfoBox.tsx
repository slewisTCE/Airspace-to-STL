import { useState, type SyntheticEvent } from "react";
import type { OpenAirAirspace } from "../openAir";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

export function AirSpaceInfoBox(props: {airspaceSelect: OpenAirAirspace | undefined}) {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange =
    (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography component="span" sx={{ width: '100%', flexShrink: 0 }}>
            Airspace Info
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {props.airspaceSelect ? JSON.stringify(props.airspaceSelect) : "Select an airspace..."}
          </Typography>
        </AccordionDetails>
      
      </Accordion>

  )
}