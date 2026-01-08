import './styles/App.css'
import { useEffect, useState } from 'react'
import airspaceDataRaw from './assets/Australian Airspace 28 November 2024_v1.txt'
import { Box } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { darkTheme } from './styles/themes'
import { Loading } from './components/Loading'
import { OpenAirAirspace, OpenAirAirspaces } from './openAir'
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
  const [volumes, setVolumes] = useState<OpenAirAirspace[]>([])
  const [meshes, setMeshes] = useState<Mesh[]>([])
  
  useEffect(() => {
    fetch(airspaceDataRaw)
      .then((response) => {
        return response.text()
      })
      .then((data) => {
        setAllAirspacesData(new OpenAirAirspaces(data))
        setError(null)
      })
      .catch((reason)=>{
        setError(reason.message);
        console.error('Error fetching', reason)})
        .finally(()=>setLoading(false))
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
        <TopBar drawerWidth={drawerWidth}/>
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
        <CentralDisplay loading={loading} volumes={volumes} airspaces={allAirspacesData} margins={drawerWidth} meshes={meshes} setMeshes={setMeshes}/> 
        <DrawerRight drawerWidth={drawerWidth} airspaceSelect={airspaceSelect}/>       
        </>
        : <></>}
      </Box>
    </ThemeProvider>
  )
}

export default App