import { Box, FormControl, Grid, Input, InputAdornment, InputLabel, Slider, Typography } from "@mui/material"
import { type Dispatch, type SetStateAction } from "react"
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { formatFeet } from "../utils/utils";
import type { Envelope } from "../types/openAirTypes";

export function SliderControl(props: {envelope: Envelope, setEnvelope: Dispatch<SetStateAction<Envelope>>}) {
  const minDistance = 100
  const minAlt = 0
  const maxAlt = 60000
  const stepSize = 1000
  const majorStep1 = Math.floor(((maxAlt-minAlt)*(1/3)) / 1000) * 1000
  const majorStep2 = Math.floor(((maxAlt-minAlt)*(2/3)) / 1000) * 1000

  const handleChange = (_event: Event, newValue: number[], activeThumb: number) => {
    if (activeThumb === 0) {
      props.setEnvelope(
        {
          floor: Math.min(newValue[0], props.envelope.ceiling - minDistance), 
          ceiling: props.envelope.ceiling
        }
      )
    } else {
      props.setEnvelope(
        {
          floor: props.envelope.floor, 
          ceiling: Math.max(newValue[1], props.envelope.floor + minDistance)
        }
      )
    }
  }

  return (
    <>
      <Grid container>
        <Grid>
          <Typography id="input-slider" gutterBottom>
            Set Floor & Ceiling
          </Typography>
        </Grid>
      <Grid>
        <Box sx={{ '& > :not(style)': { m: 1 } }}>
          <FormControl variant="standard">
            <InputLabel htmlFor="input-with-icon-adornment">
              Airspace Ceiling
            </InputLabel>
            <Input
              id="input-with-icon-adornment"
              startAdornment={
                <InputAdornment position="start">
                  <CloudDownloadIcon />
                </InputAdornment>
              }
              endAdornment={<InputAdornment position="end">ft</InputAdornment>}
              value={props.envelope.ceiling}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                props.setEnvelope({floor: props.envelope.floor, ceiling: Number(event.target.value)});
              }}
            />
          </FormControl>
        </Box>
        </Grid>
          <Grid>
          <Box sx={{ '& > :not(style)': { m: 1 } }}>
            <FormControl variant="standard">
              <InputLabel htmlFor="input-with-icon-adornment">
                Airspace Floor
              </InputLabel>
              <Input
                id="input-with-icon-adornment"
                startAdornment={
                  <InputAdornment position="start">
                    <CloudUploadIcon />
                  </InputAdornment>
                }
                endAdornment={<InputAdornment position="end">ft</InputAdornment>}
                value={props.envelope.floor}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  props.setEnvelope({floor: Number(event.target.value), ceiling: props.envelope.ceiling});
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