import './styles/App.css'
import { useEffect, useState } from 'react'
import airspaceDataRaw from './assets/Australian Airspace 28 November 2024_v1.txt'
import { Box } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, type Theme } from '@mui/material/styles'
import { darkTheme, lightTheme } from './styles/themes'
import { Loading } from './components/Loading'
import { siteLog } from './utils/siteLog'
import { type OpenAirAirspace, OpenAirAirspaces, Volume } from './openAir'
import { TopBar } from './components/TopBar'
import { DrawerRight } from './components/DrawerRight'
import { DrawerLeft } from './components/DrawerLeft'
import { CentralDisplay } from './components/CentralDisplay'
import { Error } from './components/Error'
import type { Envelope } from './openAir/openAirTypes'
import { Distance } from './openAir/distance'
import { AlertWithSeverity } from './components/Alert'
import type { AlertSeverity } from './types/alertTypes'
import { useMeshesFromVolumes } from './hooks/geometry'

export function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [allAirspacesData, setAllAirspacesData] = useState<OpenAirAirspaces>()
  const [airspaceSelect, setAirspaceSelect] = useState<OpenAirAirspace>()
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [rightDrawerOpen, setRightDrawerOpen] = useState(true)
  const [zScale, setZScale] = useState(25)
  const [meshOpacityPercent, setMeshOpacityPercent] = useState(95)
  const [autoRotate, setAutoRotate] = useState(false)
  const [focusRequest, setFocusRequest] = useState(0)
  const [envelope, setEnvelope] = useState<Envelope>({ceiling: 0, floor: 0})
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('')
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>("success")
  
  const storageKey = 'dah-volume-modeller-theme-preference'
  const meshes = useMeshesFromVolumes(volumes, zScale, { x: 0, y: 0 }, {depth: 1, curveSegments: 64}, "red")
  
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

  const [theme, setTheme] = useState<Theme>(lightTheme)
  const [darkModeActive, setDarkModeActive] = useState<boolean>(true)

  useEffect(() => {
    async function determineInitialTheme() {
      const storedTheme = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setDarkModeActive(storedTheme === 'dark')
        return
      }
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setDarkModeActive(prefersDark)
      }
    } 
    determineInitialTheme()
  }, [])
  
  useEffect(()=>{
    async function getPrefersColorScheme(){
      if(darkModeActive){
        setTheme(darkTheme)
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, 'dark')
        }
      } else {
        setTheme(lightTheme)
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, 'light')
        }
      }
    }
    getPrefersColorScheme()
  },[darkModeActive])

  const handleEnvelopeChange = (newEnvelope: Envelope, volumeName: string) => {
    setEnvelope(newEnvelope)
    setVolumes((current) =>
      current.map((volume) => {
        if (volume.airspace.name !== volumeName) {
          return volume
        }

        volume.airspace.ceiling.value = new Distance(newEnvelope.ceiling, "feet")
        volume.airspace.floor.value = new Distance(newEnvelope.floor, "feet")

        return { ...volume, airspace: volume.airspace }
      })
    )
  }

  const handleRemoveVolume = (name: string) => () => {
    try {
      setVolumes(volumes.filter((volume) => {
        return volume.airspace.name != name
      }))
      handleAlert(`Removed "${name}" volume`, 'success')
    } catch (error) {
      console.error('Error removing volume:', error)
      handleAlert(`Error removing "${name}" volume: ${String(error)}`, 'error')
    }
  }

  function handleClearAllVolumes(){
    setVolumes([])
  }

  function handleAddVolume(volume: Volume){
    setVolumes((current) => current.concat(volume))
    handleAlert(`Added "${volume.airspace.name}" volume`, 'success')
  }

  function handleAlert(message: string, severity: AlertSeverity){
    setAlertMessage(message)
    setAlertSeverity(severity)
    setOpenAlert(true)
  }

  function handleClickSelect(name: string, newSelected: boolean){
    const newVolumes = volumes.map((_volume)=>{
      if(_volume.airspace.name === name){
        return {
          selected: newSelected,
          airspace: _volume.airspace,
          originalEnvelope: _volume.originalEnvelope
        }
      }

      return {
        selected: false,
        airspace: _volume.airspace,
        originalEnvelope: _volume.originalEnvelope
      }
    })
    setVolumes(newVolumes)
  }

  function handleClearSelection(){
    setVolumes((current) =>
      current.map((volume) => ({
        selected: false,
        airspace: volume.airspace,
        originalEnvelope: volume.originalEnvelope
      }))
    )
  }

  function handleRightDrawerOpen(open: boolean){
    setRightDrawerOpen(open)
  }

  function handleZScaleChange(newZScale: number){
    const nextValue = Array.isArray(newZScale) ? newZScale[0] : newZScale
    setZScale(Math.min(50, Math.max(1, nextValue)))
  }

  function handleMeshOpacityChange(newOpacityPercent: number){
    const nextValue = Array.isArray(newOpacityPercent) ? newOpacityPercent[0] : newOpacityPercent
    setMeshOpacityPercent(Math.min(100, Math.max(1, nextValue)))
  }

  function handleAutoRotateChange(nextValue: boolean){
    setAutoRotate(nextValue)
  }

  function handleResetView(){
    setFocusRequest((current) => current + 1)
  }



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
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <CssBaseline />
        <TopBar handleRightDrawerOpen={handleRightDrawerOpen} rightDrawerOpen={rightDrawerOpen} setDarkModeActiveAction={setDarkModeActive} darkModeActive={darkModeActive}/>
        {allAirspacesData ? 
        <>
          <DrawerLeft 
            airspaces={allAirspacesData} 
            volumes={volumes}
            envelope={envelope}
            handleClearAllVolumes={handleClearAllVolumes}
            handleEnvelopeChange={handleEnvelopeChange} 
            handleRemoveVolume={handleRemoveVolume}
            handleAddVolume={handleAddVolume}
            airspaceSelect={airspaceSelect} 
            setAirspaceSelect={setAirspaceSelect}
            meshes={meshes}
            zScale={zScale}
            handleZScaleChange={handleZScaleChange}
            meshOpacityPercent={meshOpacityPercent}
            handleMeshOpacityChange={handleMeshOpacityChange}
            autoRotate={autoRotate}
            handleAutoRotateChange={handleAutoRotateChange}
            handleResetView={handleResetView}
            handleAlert={handleAlert}
          />
          <CentralDisplay 
            loading={loading} 
            volumes={volumes} 
            handleClickSelect={handleClickSelect}
            rightDrawerOpen={rightDrawerOpen}
            handleClearSelection={handleClearSelection}
            zScale={zScale}
            meshOpacityPercent={meshOpacityPercent}
            autoRotate={autoRotate}
            handleAutoRotateChange={handleAutoRotateChange}
            focusRequest={focusRequest}
          />
          <DrawerRight 
            volumes={volumes} 
            handleRightDrawerOpen={handleRightDrawerOpen} 
            open={rightDrawerOpen}
          />       
        </>
        : <></>}
      </Box>
      <AlertWithSeverity open={openAlert} setOpen={setOpenAlert} message={alertMessage} severity={alertSeverity}/>
    </ThemeProvider>
  )
}

export default App