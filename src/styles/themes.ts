import { createTheme } from "@mui/material";

const components = {
  MuiUseMediaQuery: {
    defaultProps: {
      noSsr: true,
    }
  }
}
export const darkTheme = createTheme({ components: components, palette: { mode: 'dark' } });
export const lightTheme = createTheme({ components: components, palette: { mode: 'light' } });