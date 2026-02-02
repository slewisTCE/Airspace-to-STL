import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, FormControl, InputLabel, MenuItem, Select, Slider, Stack, Typography, type SelectChangeEvent } from "@mui/material";
import { airspaceClassMap, Volume, type OpenAirAirspace } from "../openAir";
import { ExpandMore } from "@mui/icons-material";
import { useMemo, useState, useEffect } from "react";
import type { ControlPanelProps } from "../types/controlPanelTypes";
import type { OpenAirClassCode } from "../openAir/openAirTypes";
import { airspaceFromName } from "../openAir/utils";

export function ControlPanel(props: ControlPanelProps) {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [airspaceNameSelect, setAirspaceNameSelect] = useState<string>('')
  const [airspaceLocale, setAirspaceLocale] = useState<string>('')
  const [airspaceClassCode, setAirspaceClassCode] = useState<OpenAirClassCode>("A")

  const [volumeNames, setVolumeNames] = useState<string[]>([])
  

  const airspaces = props.airspaces.airspaces
  
  const airspaceLocales = useMemo(() => {
    return Array.from(new Set(airspaces.map((thisAirspace) => thisAirspace.locale))).sort()
  }, [airspaces])

  const airspaceClassCodes = useMemo(() => {
    if (!airspaceLocale) return [] as OpenAirClassCode[]
    return Array.from(
      new Set(
        airspaces
          .filter((thisAirspace) => thisAirspace.locale === airspaceLocale)
          .map((thisAirspace) => thisAirspace.airspaceClass.code)
      )
    ).sort() as OpenAirClassCode[]
  }, [airspaceLocale, airspaces])

  useEffect(()=>{
    async function updateVolumeNames() {
      setVolumeNames(props.volumes.map(volume=>volume.airspace.name))
    }
    updateVolumeNames();
  },[props.volumes])

  const airspaceMenuItems: string[] = []

  const handleAccordian =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const handleClassSelect = (event: SelectChangeEvent) => {
      setAirspaceClassCode(event.target.value as OpenAirClassCode);
      setAirspaceNameSelect('')
      props.setAirspaceSelect(undefined)
    };

  const handleAirspaceNameSelect = (event: SelectChangeEvent) =>{
    const airspaceSelected = airspaceFromName(props.airspaces.airspaces, event.target.value)
    if(airspaceSelected) { 
      props.setAirspaceSelect(airspaceSelected) 
      setAirspaceNameSelect(airspaceSelected.name)
    }
  }

  const handleVolumeAddClick = () => {
    if(props.airspaceSelect){
      props.handleAddVolume(new Volume(props.airspaceSelect))
      props.setAirspaceSelect(undefined)
      props.handleAlert(`Added "${props.airspaceSelect.name}" volume`, 'success')
    } else {
      props.handleAlert(`No airspace selected to add as volume`, 'error')
    }
  }

  const handleLocaleSelect = (event: SelectChangeEvent) => {
    const newLocale = event.target.value
    setAirspaceLocale(newLocale)
    const classCodesForLocale = Array.from(
      new Set(
        airspaces
          .filter((thisAirspace) => thisAirspace.locale === newLocale)
          .map((thisAirspace) => thisAirspace.airspaceClass.code)
      )
    ).sort() as OpenAirClassCode[]
    setAirspaceClassCode(classCodesForLocale[0] ?? "A")
    setAirspaceNameSelect('')
    props.setAirspaceSelect(undefined)
  }

  const classLabel = "airspace-class-label"
  
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
          <Box>
            <Typography gutterBottom>
              Z Scale ({props.zScale}×)
            </Typography>
            <Slider
              value={props.zScale}
              onChange={(_event, value) => {props.handleZScaleChange(value)}}
              min={1}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              aria-label="Z axis scale"
            />
          </Box>
          <FormControl fullWidth>
            <InputLabel id="airspace-locale-label">Locale</InputLabel>
            <Select
              labelId="airspace-locale-label"
              id="airspace-locale-select"
              name="airspace-locale"
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
            <InputLabel id={classLabel}>Class</InputLabel>
            <Select
              labelId={classLabel}
              id="airspace-class-select"
              name="airspace-class"
              value={airspaceClassCode}
              label="Class"
              onChange={handleClassSelect}
              disabled={!airspaceLocale || airspaceClassCodes.length === 0}
            >
              {airspaceClassCodes.map((code, index) => {
                return (
                  <MenuItem key={index} value={code}>
                    {`${code}: ${airspaceClassMap[code].name}`}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="airspace-name-label">Name</InputLabel>
            <Select
              labelId="airspace-name-label"
              id="airspace-name-select"
              name="airspace-name"
              value={volumeNames.includes(airspaceNameSelect) ? '' : airspaceNameSelect}
              label="Name"
              onChange={handleAirspaceNameSelect}
              disabled={!airspaceLocale || !airspaceClassCode}
            >
              <MenuItem>{airspaceMenuItems}</MenuItem>
              {props.airspaces.airspaces.map((thisAirspace: OpenAirAirspace, index: number)=>{
                if (thisAirspace.locale == airspaceLocale && thisAirspace.airspaceClass.code == airspaceClassCode && !volumeNames.includes(thisAirspace.name)){
                  return (<MenuItem key={index} value={thisAirspace.name}>{thisAirspace.name}</MenuItem>)
                }
              }
              )}
            </Select>
          </FormControl>
          <Button onClick={() => handleVolumeAddClick()}>Add Volume</Button>
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}