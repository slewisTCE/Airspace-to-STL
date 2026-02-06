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
import type { AlertSeverity } from './types/alertTypes'
import { useMeshesFromVolumes } from './hooks/geometry'
import { type VariantType, useSnackbar } from 'notistack'
import { DisclaimerDialogue } from './components/Disclaimer'

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
  const [openDisclaimer, setOpenDisclaimer] = useState(true)
  const [disclaimerAgree, setDisclaimerAgree] = useState(false)
  
  
  const storageKey = 'dah-volume-modeller-theme-preference'
  const meshes = useMeshesFromVolumes(volumes, zScale, { x: 0, y: 0 }, {depth: 1, curveSegments: 64}, "red")
  const { enqueueSnackbar } = useSnackbar();
  
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

  function handleAlert(message: string, severity: VariantType){
    const baseDurationMs = 3000
    const autoHideDuration = severity === 'warning' ? baseDurationMs * 3 : baseDurationMs
    enqueueSnackbar(message, { variant: severity as AlertSeverity, autoHideDuration })
  }

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

  function getDefaultFloorFeet(volume: Volume): number {
    const ceilingFeet = volume.airspace.ceiling.value.feet
    return Math.max(0, ceilingFeet - 1000)
  }

  function getDefaultCeilingFeet(volume: Volume): number {
    const floorFeet = volume.airspace.floor.value.feet
    return floorFeet + 1000
  }

  function checkVolumeAltitude(volume: Volume): Volume {
    if (volume.airspace.ceiling.value.feet <= volume.airspace.floor.value.feet) {
      if (volume.airspace.ceiling.value.feet === 0) {
        const defaultCeilingFeet = getDefaultCeilingFeet(volume)
        handleAlert(`Adjusted ceiling of "${volume.airspace.name}" volume to ${defaultCeilingFeet} feet. Raw value: ${volume.airspace.ceiling.value.feet}`, 'warning')
        volume.airspace.ceiling.value = new Distance(defaultCeilingFeet, "feet")
      } else {
        const defaultFloorFeet = getDefaultFloorFeet(volume)
        handleAlert(`Adjusted floor of "${volume.airspace.name}" volume to ${defaultFloorFeet} feet. Raw value: ${volume.airspace.floor.value.feet}`, 'warning')
        volume.airspace.floor.value = new Distance(defaultFloorFeet, "feet")
      }
    }
    return volume
  }

  function handleAddVolume(volume: Volume){
    const checkedVolume = checkVolumeAltitude(volume)
    setVolumes((current) => current.concat(checkedVolume))
    handleAlert(`Added "${checkedVolume.airspace.name}" volume`, 'success')
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

  function handleDisclaimerAgree(){
    setDisclaimerAgree(true)
    setOpenDisclaimer(false)
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
        <DisclaimerDialogue open={openDisclaimer} handleAgree={handleDisclaimerAgree} handleDisagree={()=>setOpenDisclaimer(false)} />
        {allAirspacesData? 
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
            disable={!disclaimerAgree}
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
            disable={!disclaimerAgree}
          />       
        </>
        : <></>}

      </Box>
    </ThemeProvider>
  )
}

export default App