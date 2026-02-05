import { Box, FormControl, Grid, IconButton, Input, InputAdornment, InputLabel, Slider, Stack, Typography, Tooltip } from "@mui/material"
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { formatFeet } from "../utils/utils";
import type { Envelope } from "../openAir/openAirTypes";

export function SliderControl(props: 
  {
    envelope: Envelope, initialEnvelope: Envelope, handleEnvelopeChange: (next: Envelope) => void, floorNotam: boolean, ceilingNotam: boolean, floorRawValue: string, ceilingRawValue: string}) {
  const minDistance = 100
  const minAlt = 0
  const maxAlt = 60000
  const stepSize = 1000
  const majorStep1 = Math.floor(((maxAlt-minAlt)*(1/3)) / 1000) * 1000
  const majorStep2 = Math.floor(((maxAlt-minAlt)*(2/3)) / 1000) * 1000
  const displayFloor = Math.round(props.envelope.floor)
  const displayCeiling = Math.round(props.envelope.ceiling)
  const isDirty = props.envelope.floor !== props.initialEnvelope.floor || props.envelope.ceiling !== props.initialEnvelope.ceiling

  const handleChange = (_event: Event, newValue: number | number[]) => {
    const vals = Array.isArray(newValue) ? newValue : [props.envelope.floor, props.envelope.ceiling]
    const newFloor = vals[0]
    const newCeiling = vals[1]

    const floor = Math.min(newFloor, newCeiling - minDistance)
    const ceiling = Math.max(newCeiling, newFloor + minDistance)

    props.handleEnvelopeChange({ floor, ceiling })
  }

  return (
    <>
      <Grid container>
        <Grid>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography id="input-slider" gutterBottom>
              Set Floor & Ceiling
            </Typography>
            <Tooltip title="Reset to initial values">
              <span>
              <IconButton
                size="small"
                aria-label="Reset floor and ceiling"
                onClick={() => props.handleEnvelopeChange(props.initialEnvelope)}
                disabled={!isDirty}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Grid>
      <Grid>
        <Box sx={{ '& > :not(style)': { m: 1 } }}>
          <FormControl variant="standard">
            <InputLabel htmlFor="input-label-airspace-ceiling">
              Airspace Ceiling
            </InputLabel>
            <Input
              id="input-airspace-ceiling"
              startAdornment={
                props.ceilingNotam ?
                <Tooltip title={`Adjusted ceiling to be visible as original values are: F:${props.floorRawValue}, C:${props.ceilingRawValue}. Please check value.`}>
                  <InputAdornment position="start">
                    <CloudDownloadIcon color="warning"/>
                  </InputAdornment>
                </Tooltip> :
                <InputAdornment position="start">
                  <CloudDownloadIcon />
                </InputAdornment>
              }
              endAdornment={<InputAdornment position="end">ft</InputAdornment>}
              value={displayCeiling}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                props.handleEnvelopeChange({floor: props.envelope.floor, ceiling: Number(event.target.value)});
              }}
            />
          </FormControl>
        </Box>
        </Grid>
          <Grid>
          <Box sx={{ '& > :not(style)': { m: 1 } }}>
            <FormControl variant="standard">
              <InputLabel htmlFor="input-label-airspace-floor">
                Airspace Floor
              </InputLabel>
              <Input
                id="input-airspace-floor"
                startAdornment={
                  props.floorNotam ?
                  <Tooltip title={`Adjusted floor to be visible as original values are: F:${props.floorRawValue}, C:${props.ceilingRawValue}. Please check value.`}>
                    <InputAdornment position="start">
                      <CloudUploadIcon color="warning"/>
                    </InputAdornment>
                  </Tooltip> :
                  <InputAdornment position="start">
                    <CloudUploadIcon />
                  </InputAdornment>
                }
                endAdornment={<InputAdornment position="end">ft</InputAdornment>}
                value={displayFloor}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  props.handleEnvelopeChange({floor: Number(event.target.value), ceiling: props.envelope.ceiling});
                }}
              />
            </FormControl>
          </Box>
        </Grid>
        <Grid>
          <Box sx={{px:8, py:2, height: 300, width: 100, alignItems: "center",}}>
            <Slider
              step={stepSize}
              min={minAlt}
              max={maxAlt}
              orientation="vertical"
              getAriaLabel={() => 'Minimum distance'}
              getAriaValueText={formatFeet}
              value={[props.envelope.floor, props.envelope.ceiling]}
              onChange={handleChange}
              valueLabelDisplay="auto"
              // getAriaValueText={"valuetext"}
              disableSwap
              marks={
                [
                  {
                    value: minAlt,
                    label: `${minAlt} ft`,
                  },
                  {
                    value: majorStep1,
                    label: `${majorStep1} ft`,
                  },
                  {
                    value: majorStep2,
                    label: `${majorStep2} ft`,
                  },
                  {
                    value: maxAlt,
                    label: `${maxAlt} ft`,
                  },
                ]
              }
            />
          </Box>
        </Grid>
      </Grid>
    </>
  );
}