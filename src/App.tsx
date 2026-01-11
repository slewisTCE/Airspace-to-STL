import './styles/App.css'
import { useEffect, useState } from 'react'
import airspaceDataRaw from './assets/Australian Airspace 28 November 2024_v1.txt'
import { Box } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { darkTheme } from './styles/themes'
import { Loading } from './components/Loading'
import { siteLog } from './utils/siteLog'
import { type OpenAirAirspace, OpenAirAirspaces, Volume } from './openAir'
import { TopBar } from './components/TopBar'
import { DrawerRight } from './components/DrawerRight'
import { DrawerLeft } from './components/DrawerLeft'
import { CentralDisplay } from './components/CentralDisplay'
import { Error } from './components/Error'
import type { Mesh } from 'three'

const drawerWidth = 320;

export function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [allAirspacesData, setAllAirspacesData] = useState<OpenAirAirspaces>()
  const [airspaceSelect, setAirspaceSelect] = useState<OpenAirAirspace>()
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [meshes, setMeshes] = useState<Mesh[]>([])
  const [rightDrawerOpen, setRightDrawerOpen] = useState(true)
  
  useEffect(() => {
    siteLog('fetch: start')
    fetch(airspaceDataRaw)
      .then((response) => response.text())
      .then((data) => {
        siteLog('fetch: parsed data, constructing OpenAirAirspaces')
        setAllAirspacesData(new OpenAirAirspaces(data))
        setError(null)
        siteLog('OpenAirAirspaces constructed')
      })
      .catch((reason)=>{
        setError(reason.message);
        siteLog('Error fetching: ' + String(reason))
        console.error('Error fetching', reason)
      })
      .finally(()=>{ siteLog('fetch: finished'); setLoading(false) })
  }, [])

  useEffect(() => {allAirspacesData ? console.log(allAirspacesData) : null},[allAirspacesData])

  if (loading){
    return (<Loading/>)
  } 
  if (allAirspacesData?.airspaces.length == 0){
    return (<Loading/>)
  }
  if (error) {
    return (<Error error={error}/>)
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ flexGrow: 1 }}>
        <CssBaseline />
        <TopBar drawerWidth={drawerWidth} setRightDrawerOpen={setRightDrawerOpen}/>
        {allAirspacesData ? 
        <>
        <DrawerLeft 
          drawerWidth={drawerWidth} 
          airspaces={allAirspacesData} 
          volumes={volumes} 
          setVolumes={setVolumes} 
          airspaceSelect={airspaceSelect} 
          setAirspaceSelect={setAirspaceSelect}
          meshes={meshes}
          
          />
        <CentralDisplay loading={loading} volumes={volumes} setVolumes={setVolumes} airspaces={allAirspacesData} margins={drawerWidth} meshes={meshes} setMeshes={setMeshes}/> 
        <DrawerRight drawerWidth={drawerWidth} volumes={volumes} setOpen={setRightDrawerOpen} open={rightDrawerOpen}/>       
        </>
        : <></>}
      </Box>
    </ThemeProvider>
  )
}

export default App