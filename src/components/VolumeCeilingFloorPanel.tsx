import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
import { useState, type FC } from "react";
import { SliderControl } from "./SliderControl";

export const VolumeCeilingFloorPanel: FC<{volumeName: string}> = ({volumeName})=>{
  const [expanded, setExpanded] = useState<string | false>(false);
  
  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    }
  
    return (
    <Accordion expanded={expanded === volumeName} onChange={handleChange(volumeName)}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls={`${volumeName}-content`}
        id={`${volumeName}-header`}
      >
        <Typography component="span" sx={{ width: '100%', flexShrink: 0 }}>
          {volumeName}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack direction={"column"}>
          <SliderControl/>
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}