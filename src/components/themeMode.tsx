import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { IconButton, Tooltip } from '@mui/material'

export function ThemeModeButton(props: {darkModeActive: boolean, setDarkModeActiveAction: (active: boolean) => void}) {
  return (
    <Tooltip title={props.darkModeActive ? "Change to Light Mode" : "Change to Dark Mode"}>
      {
        props.darkModeActive ?
          <IconButton onClick={() => props.setDarkModeActiveAction(false)}>
            <LightModeIcon />
          </IconButton>
          :
          <IconButton onClick={() => props.setDarkModeActiveAction(true)}>
            <DarkModeIcon />
          </IconButton>
      }
    </Tooltip>
  )
}