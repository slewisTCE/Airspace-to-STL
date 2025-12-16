import { Box, FormControl, Grid, Input, InputAdornment, InputLabel, Slider, Typography } from "@mui/material"
import { useState } from "react"
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { formatFeet } from "../utils/utils";

export function SliderControl() {
  const minDistance = 100
  const minAlt = 0
  const maxAlt = 10000
  const stepSize = 100
  const majorStep1 = Math.floor(((maxAlt-minAlt)*(1/3)) / 1000) * 1000
  const majorStep2 = Math.floor(((maxAlt-minAlt)*(2/3)) / 1000) * 1000
  const [value, setValue] = useState(30);

  const handleSliderChange = (event: Event, newValue: number) => {
    setValue(newValue);
  };

  const handleBlur = () => {
    if (value < minAlt) {
      setValue(minAlt);
    } else if (value > maxAlt) {
      setValue(maxAlt);
    }
  };

  const [envelope, setEnvelope] = useState<number[]>([majorStep1, majorStep2]);

  const handleChange = (event: Event, newValue: number[], activeThumb: number) => {
    if (activeThumb === 0) {
      setEnvelope([Math.min(newValue[0], envelope[1] - minDistance), envelope[1]]);
    } else {
      setEnvelope([envelope[0], Math.max(newValue[1], envelope[0] + minDistance)]);
    }
  };

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
              value={envelope[1]}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setEnvelope([envelope[0], Number(event.target.value)]);
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
                value={envelope[0]}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setEnvelope([Number(event.target.value), envelope[1]]);
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
              value={envelope}
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