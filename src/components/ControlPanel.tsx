import { Accordion, AccordionDetails, AccordionSummary, Button, Divider, FormControl, InputLabel, MenuItem, Select, Stack, Typography, type SelectChangeEvent } from "@mui/material";
import { airspaceClassMap, type OpenAirAirspace } from "../openAir";
import { ExpandMore } from "@mui/icons-material";
import { useEffect, useState } from "react";
import type { ControlPanelProps } from "../types/controlPanelTypes";
import type { OpenAirClassCode } from "../types/openAirTypes";
import { airspaceFromName } from "../openAir"
import type { AlertSeverity } from "../types/alertTypes";
import { AlertWithSeverity } from "./Alert";


export function ControlPanel(props: ControlPanelProps) {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [airspaceNameSelect, setAirspaceNameSelect] = useState<string>('')
  const [airspaceClassCode, setAirspaceClassCode] = useState<OpenAirClassCode>("A")
  const [airspaceLocale, setAirspaceLocale] = useState<string>('')
  const [airspaceLocales, setAirspaceLocales] = useState<string[]>([])

  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('')
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>("success")
  
  useEffect(()=>{
    const localesFiltered = props.airspaces.map((thisAirspace, index)=>{
      if (thisAirspace.airspaceClass.code == airspaceClassCode){
        return thisAirspace.locale
      }
    })
    const uniqueLocales = Array.from(new Set(localesFiltered)).sort()
    if (uniqueLocales) {
      setAirspaceLocales(uniqueLocales as string[])
    }
  },[airspaceClassCode])

  let airspaceMenuItems: string[] = []

  const handleAccordian =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const handleClassSelect = (event: SelectChangeEvent) => {
      setAirspaceClassCode(event.target.value as OpenAirClassCode);
    };

  const handleAirspaceNameSelect = (event: SelectChangeEvent) =>{
    const airspaceSelected = airspaceFromName(props.airspaces, event.target.value)
    console.log(airspaceSelected)
    if(airspaceSelected) { 
      props.setAirspaceSelect(airspaceSelected) 
      setAirspaceNameSelect(airspaceSelected.name)
    }
  }

  const handleVolumeAddClick = () => {
    console.log(props.airspaceSelect)
    if(props.airspaceSelect){
      props.setVolumes(props.volumes.concat(props.airspaceSelect))
      setAlertMessage(`Added "${props.airspaceSelect.name}" volume`)
      setAlertSeverity("success")
      setOpenAlert(true)
    }
  }

  const handleLocaleSelect = (event: SelectChangeEvent) => {
    console.log(event)
    setAirspaceLocale(event.target.value)
  }
  
  return (
      <Accordion expanded={expanded === 'controlsPanel'} onChange={handleAccordian('controlsPanel')}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="controlsPanel-content"
          id="controlsPanel-header"
        >
          <Typography component="span" sx={{ width: '100%', flexShrink: 0 }}>
            Controls
          </Typography>
          <Divider/>
        </AccordionSummary>
        <AccordionDetails sx={{py:3}}>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="airspace-class-label">Class</InputLabel>
              <Select
                labelId="airspace-class-label"
                id="airspace-class-select"
                value={airspaceClassCode}
                label="Class"
                onChange={handleClassSelect}
              >
                {Array.from(new Set(props.airspaces.map((airspace: OpenAirAirspace) => airspace.airspaceClass.code))).sort().map((airspaceClassCode)=>{
                  return (<MenuItem value={airspaceClassCode}>{`${airspaceClassCode}: ${airspaceClassMap[airspaceClassCode]}`}</MenuItem>)
                })}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="airspace-locale-label">Locale</InputLabel>
              <Select
                labelId="airspace-locale-label"
                id="airspace-locale-select"
                value={airspaceLocale}
                label="locale"
                onChange={handleLocaleSelect}
              >
                { 
                  airspaceLocales.map((locale: string, index: number) => {
                    return (<MenuItem key={index} value={locale}>{locale}</MenuItem>)
                  })
                }
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="airspace-name-label">Name</InputLabel>
              <Select
                labelId="airspace-name-label"
                id="airspace-name-select"
                value={airspaceNameSelect}
                label="Name"
                onChange={handleAirspaceNameSelect}
              >
                <MenuItem>{airspaceMenuItems}</MenuItem>

                {props.airspaces.map((thisAirspace: OpenAirAirspace, index: number)=>{
                  if (thisAirspace.locale == airspaceLocale && thisAirspace.airspaceClass.code == airspaceClassCode){
                    return (<MenuItem key={index} value={thisAirspace.name}>{thisAirspace.name}</MenuItem>)
                  }
                }
                )}
              </Select>
            </FormControl>
            <Button onClick={handleVolumeAddClick}>Add Volume</Button>
            <AlertWithSeverity open={openAlert} setOpen={setOpenAlert} message={alertMessage} severity={alertSeverity}/>
          </Stack>
        </AccordionDetails>
      </Accordion>
  )
}