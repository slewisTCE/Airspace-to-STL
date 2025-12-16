import './styles/App.css'
import { useEffect, useState } from 'react'
import airspaceDataRaw from './assets/Australian Airspace 28 November 2024_v1.txt'
import { Box} from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { darkTheme } from './styles/themes'
import { Loading } from './components/Loading'
import { OpenAirAirspace } from './openAir'
import { TopBar } from './components/TopBar'
import { DrawerRight } from './components/DrawerRight'
import { DrawerLeft } from './components/DrawerLeft'
import { CentralDisplay } from './components/CentralDisplay'
import { Error } from './components/Error'
import { splitRawAirspaceData } from './utils/utils'

const drawerWidth = 320;

export function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [airspacesData, setAirspacesData] = useState<OpenAirAirspace[]>([])
  const [airspaceSelect, setAirspaceSelect] = useState<OpenAirAirspace>()
  const [volumes, setVolumes] = useState<OpenAirAirspace[]>([])
  
  useEffect(() => {
    fetch(airspaceDataRaw)
      .then((response) => {
        return response.text()
      })
      .then((data) => {
        const airspaceDataSplit = splitRawAirspaceData(data)
        setAirspacesData(airspaceDataSplit.splice(1).map((airspaceData)=>{
          return new OpenAirAirspace(airspaceData)
        }))
        setError(null)
      })
      .catch((reason)=>{
        setError(reason.message);
        console.error('Error fetching', reason)})
        .finally(()=>setLoading(false))
  }, [])

  useEffect(() => {console.log(airspacesData)},[airspacesData])

  if (loading){
    return (<Loading/>)
  } 
  if (airspacesData.length == 0){
    return (<Loading/>)
  }
  if (error) {
    return (<Error error={error}/>)
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <TopBar drawerWidth={drawerWidth}/>
          <DrawerRight drawerWidth={drawerWidth} airspaceSelect={airspaceSelect}/>
          <DrawerLeft 
            drawerWidth={drawerWidth} 
            airspaces={airspacesData} 
            volumes={volumes} 
            setVolumes={setVolumes} 
            airspaceSelect={airspaceSelect} 
            setAirspaceSelect={setAirspaceSelect}/>
          <CentralDisplay loading={loading}/> 
      </Box>
    </ThemeProvider>
  )
}

export default App