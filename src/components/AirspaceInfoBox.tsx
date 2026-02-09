import { useEffect, useState, type SyntheticEvent } from "react";
import type { Volume } from "../openAir";
import { Accordion, AccordionDetails, AccordionSummary, Divider, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

export function AirSpaceInfoBox(props: {volumes: Volume[], disable: boolean}) {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange =
    (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  useEffect(() => {
    async function updateExpanded() {
      if (props.volumes.length > 0) {
        setExpanded('panel1')
      }
    }
    updateExpanded();
  }, [props.volumes])

  return (
      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')} disabled={props.disable}>
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
          <Divider sx={{ mb: 3 }}/>
          {
            props.volumes.length == 0 ? 
              <Typography>Select an airspace...</Typography> :
              props.volumes.map((volume, index, arr)=>{
                return (
                  <div key={index}>
                    <Typography variant="h6">{volume.airspace.name}</Typography>
                    <Typography variant="subtitle1"sx={{ mb: 3 }}>Raw data:</Typography>
                    {volume.airspace.rawLines.map((line, index)=>{
                      return(<Typography key={index} variant="body1">{line}</Typography>)
                    })}
                    {index +1 == arr.length ? <></> : <Divider/>}
                  </div>
                )
              })
          }
        </AccordionDetails>
      
      </Accordion>

  )
}