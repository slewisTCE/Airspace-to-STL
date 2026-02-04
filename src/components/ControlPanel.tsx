import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, FormControl, FormControlLabel, InputLabel, MenuItem, Paper, Select, Slider, Stack, Switch, Tooltip, Typography, type SelectChangeEvent } from "@mui/material";
import { airspaceClassMap, Volume, type OpenAirAirspace } from "../openAir";
import { ExpandMore } from "@mui/icons-material";
import { useMemo, useState, useEffect } from "react";
import type { ControlPanelProps } from "../types/controlPanelTypes";
import type { OpenAirClassCode } from "../openAir/openAirTypes";
import { airspaceFromName } from "../openAir/utils";
import { australianStates, localeStateMap, type AustralianState } from "../assets/stateMap";

export function ControlPanel(props: ControlPanelProps) {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [airspaceNameSelect, setAirspaceNameSelect] = useState<string>('')
  const [airspaceState, setAirspaceState] = useState<AustralianState | "">("")
  const [airspaceLocale, setAirspaceLocale] = useState<string>('')
  const [airspaceClassCode, setAirspaceClassCode] = useState<OpenAirClassCode>("A")

  const [volumeNames, setVolumeNames] = useState<string[]>([])
  

  const airspaces = props.airspaces.airspaces
  
  const airspaceLocales = useMemo(() => {
    return Array.from(new Set(airspaces.map((thisAirspace) => thisAirspace.locale))).sort()
  }, [airspaces])

  const availableStates = useMemo(() => {
    const localeToState = new Map<string, AustralianState>(
      localeStateMap.map((entry) => [entry.locale, entry.state as AustralianState])
    )

    const knownStates = new Set<AustralianState>(australianStates)
    const statesWithAddable = new Set<AustralianState>()

    airspaces.forEach((thisAirspace) => {
      if (volumeNames.includes(thisAirspace.name)) return
      const state = localeToState.get(thisAirspace.locale)
      if (state && knownStates.has(state)) {
        statesWithAddable.add(state)
      } else if (!state || !knownStates.has(state)) {
        statesWithAddable.add("UNKNOWN")
      }
    })

    return Array.from(statesWithAddable).sort() as (AustralianState | "")[]
  }, [airspaces, volumeNames])

  const localesForState = useMemo(() => {
    if (!airspaceState) return []
    const localeToState = new Map<string, AustralianState>(
      localeStateMap.map((entry) => [entry.locale, entry.state as AustralianState])
    )
    const knownStates = new Set<AustralianState>(australianStates)
    if (airspaceState === "UNKNOWN") {
      return airspaceLocales.filter((locale) => {
        const state = localeToState.get(locale)
        const isUnknownState = !state || !knownStates.has(state)
        if (!isUnknownState) return false
        return airspaces.some((thisAirspace) =>
          thisAirspace.locale === locale &&
          !volumeNames.includes(thisAirspace.name)
        )
      })
    }
    const localesInState = new Set(
      localeStateMap
        .filter((entry) => entry.state === airspaceState)
        .map((entry) => entry.locale)
    )
    return airspaceLocales.filter((locale) => {
      if (!localesInState.has(locale)) return false
      return airspaces.some((thisAirspace) =>
        thisAirspace.locale === locale &&
        !volumeNames.includes(thisAirspace.name)
      )
    })
  }, [airspaceState, airspaceLocales, airspaces, volumeNames])

  const airspaceClassCodes = useMemo(() => {
    if (!airspaceLocale) return [] as OpenAirClassCode[]
    return Array.from(
      new Set(
        airspaces
          .filter((thisAirspace) =>
            thisAirspace.locale === airspaceLocale &&
            !volumeNames.includes(thisAirspace.name)
          )
          .map((thisAirspace) => thisAirspace.airspaceClass.code)
      )
    ).sort() as OpenAirClassCode[]
  }, [airspaceLocale, airspaces, volumeNames])

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
    const selectedAirspace = props.airspaceSelect
      ?? (airspaceNameSelect ? airspaceFromName(props.airspaces.airspaces, airspaceNameSelect) : undefined)

    if (selectedAirspace && addableNames.some((airspace) => airspace.name === selectedAirspace.name)) {
      props.handleAddVolume(new Volume(selectedAirspace))
      props.setAirspaceSelect(undefined)
      props.handleAlert(`Added "${selectedAirspace.name}" volume`, 'success')
      return
    }

    if (selectedAirspace) {
      props.handleAlert(`Selected airspace is not available to add`, 'error')
    } else {
      props.handleAlert(`No airspace selected to add as volume`, 'error')
    }
  }

  const handleAddClassVolumes = () => {
    if (!airspaceLocale || !airspaceClassCode) {
      props.handleAlert('Select a locale and class first', 'error')
      return
    }

    const toAdd = airspaces.filter((thisAirspace) =>
      thisAirspace.locale === airspaceLocale &&
      thisAirspace.airspaceClass.code === airspaceClassCode &&
      !volumeNames.includes(thisAirspace.name)
    )

    if (toAdd.length === 0) {
      props.handleAlert('No additional airspaces to add for this class', 'warning')
      return
    }

    toAdd.forEach((thisAirspace) => props.handleAddVolume(new Volume(thisAirspace)))
    props.setAirspaceSelect(undefined)
  }

  const canAddClassVolumes = airspaceLocale && airspaceClassCode
    ? airspaces.some((thisAirspace) =>
        thisAirspace.locale === airspaceLocale &&
        thisAirspace.airspaceClass.code === airspaceClassCode &&
        !volumeNames.includes(thisAirspace.name)
      )
    : false

  const addableClassCount = airspaceLocale && airspaceClassCode
    ? airspaces.filter((thisAirspace) =>
        thisAirspace.locale === airspaceLocale &&
        thisAirspace.airspaceClass.code === airspaceClassCode &&
        !volumeNames.includes(thisAirspace.name)
      ).length
    : 0

  const addableNames = (!airspaceLocale || !airspaceClassCode)
    ? [] as OpenAirAirspace[]
    : airspaces.filter((thisAirspace) =>
        thisAirspace.locale === airspaceLocale &&
        thisAirspace.airspaceClass.code === airspaceClassCode &&
        !volumeNames.includes(thisAirspace.name)
      )

  const safeAirspaceState = availableStates.includes(airspaceState) ? airspaceState : ""
  const safeAirspaceLocale = localesForState.includes(airspaceLocale) ? airspaceLocale : ""
  const safeAirspaceClassCode = airspaceClassCodes.includes(airspaceClassCode)
    ? airspaceClassCode
    : ("" as OpenAirClassCode | "")
  const safeAirspaceNameSelect = addableNames.some((airspace) => airspace.name === airspaceNameSelect)
    ? airspaceNameSelect
    : ''

  const handleStateSelect = (event: SelectChangeEvent) => {
    const newState = event.target.value as AustralianState
    setAirspaceState(newState)
    setAirspaceLocale('')
    setAirspaceClassCode("A")
    setAirspaceNameSelect('')
    props.setAirspaceSelect(undefined)
  }

  const handleLocaleSelect = (event: SelectChangeEvent) => {
    const newLocale = event.target.value
    setAirspaceLocale(newLocale)
    const classCodesForLocale = Array.from(
      new Set(
        airspaces
          .filter((thisAirspace) =>
            thisAirspace.locale === newLocale &&
            !volumeNames.includes(thisAirspace.name)
          )
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
        <Paper elevation={8} sx={{p:2}}>
        <Stack spacing={2}>
          <Box>
            <Tooltip title="Airspaces are often relatively flat (small Z) compared to their other dimensions (X and Y). Use this slider to scale the Z axis of the 3D model to assist with visibility.">
              <Typography gutterBottom>
                Z Scale
              </Typography>
            </Tooltip>
            <Slider
              value={props.zScale}
              onChange={(_event, value) => {props.handleZScaleChange(value)}}
              min={1}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              aria-label="Z axis scale"
              marks={[{value:1, label:'1x'}, {value:12, label:'12x'}, {value:25, label:'25x'}, {value:36, label:'36x'}, {value:50, label:'50x'}]}
            />
          </Box>
          <Box>
            <Tooltip title="Adjust the opacity of the airspace meshes in the 3D view.">
              <Typography gutterBottom>
                Mesh Opacity
              </Typography>
            </Tooltip>
            <Slider
              value={props.meshOpacityPercent}
              onChange={(_event, value) => {props.handleMeshOpacityChange(value)}}
              min={1}
              max={100}
              step={1}
              valueLabelDisplay="auto"
              aria-label="Mesh opacity percentage"
              marks={[{value:1, label:'1%'}, {value:50, label:'50%'}, {value:100, label:'100%'}]}
            />
          </Box>
          <Box>
            <Tooltip title="Automatically rotate the 3D view.">
              <FormControlLabel
                control={
                  <Switch
                    checked={props.autoRotate}
                    onChange={(_event, checked) => props.handleAutoRotateChange(checked)}
                    inputProps={{ "aria-label": "Auto-rotate camera" }}
                  />
                }
                label="Auto-rotate"
              />
            </Tooltip>
          </Box>
          <Box>
            <Button variant="contained" fullWidth onClick={props.handleResetView}>
              Reset view
            </Button>
          </Box>
          </Stack>
        </Paper>
        <Divider sx={{my:2}}/>
        <Paper elevation={8} sx={{p:2}}>
          <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="airspace-state-label">State</InputLabel>
            <Select
              labelId="airspace-state-label"
              id="airspace-state-select"
              name="airspace-state"
              value={safeAirspaceState}
              label="State"
              onChange={handleStateSelect}
            >
              {availableStates.filter((state) => state).map((state, index) => {
                return (
                  <MenuItem key={index} value={state}>
                    {state}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="airspace-locale-label">Locale</InputLabel>
            <Select
              labelId="airspace-locale-label"
              id="airspace-locale-select"
              name="airspace-locale"
              value={safeAirspaceLocale}
              label="Locale"
              onChange={handleLocaleSelect}
              disabled={!airspaceState || localesForState.length === 0}
            >
              { 
                localesForState.map((locale: string, index: number) => {
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
              value={safeAirspaceClassCode}
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
          {canAddClassVolumes ? (
            <Button variant="contained" onClick={() => handleAddClassVolumes()}>
              Add All {addableClassCount} in Class
            </Button>
          ) : null}
          <FormControl fullWidth>
            <InputLabel id="airspace-name-label">Name</InputLabel>
            <Select
              labelId="airspace-name-label"
              id="airspace-name-select"
              name="airspace-name"
              value={safeAirspaceNameSelect}
              label="Name"
              onChange={handleAirspaceNameSelect}
              disabled={!airspaceLocale || !airspaceClassCode || addableNames.length === 0}
            >
              <MenuItem>{airspaceMenuItems}</MenuItem>
              {addableNames.map((thisAirspace, index) => (
                <MenuItem key={index} value={thisAirspace.name}>
                  {thisAirspace.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => handleVolumeAddClick()}>Add Volume</Button>
        </Stack>
        </Paper>
      </AccordionDetails>
    </Accordion>
  )
}