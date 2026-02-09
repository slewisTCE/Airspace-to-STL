import { createTheme } from "@mui/material";

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    xxl: true;
  }
}

const typography = {
  fontFamily: "var(--font-arvo)"
}

const components = {
  MuiUseMediaQuery: {
    defaultProps: {
      noSsr: true,
    }
  }
}


const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
    xxl: 2200
  },
}

export const darkTheme = createTheme(
  { 
    components: {
      ...components,
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.primary.contrastText,
          })
        }
      },
      MuiSlider: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.primary.main
          })
        }
      }
    }, 
    breakpoints: breakpoints,
    typography: typography,
    palette: { 
      mode: 'dark',
      primary: {
        main: '#2596be',
        contrastText: '#0b1f27',
      },
      secondary: {
        main: '#2596be',
        contrastText: '#0b1f27',
      },
      text: {
        primary: '#ffffff',
      },
    } 
  }
)
export const lightTheme = createTheme(
  { 
    components: {
      ...components,
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.primary.contrastText
          })
        }
      }
    },
    breakpoints: breakpoints,
    typography: typography,
    palette: { 
      mode: 'light', 
      primary: {
        main: '#2596be',
        contrastText: '#ffffff',
      },
      secondary: {
        main:  '#1c7da2',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f8fbfd',
        paper: '#ffffff',
      },
      text: {
        primary: '#17313d',
      },
    } 
  }
)