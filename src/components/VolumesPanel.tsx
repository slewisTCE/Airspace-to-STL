import { useEffect, useState, type Dispatch, type SetStateAction, type SyntheticEvent } from "react";
import type { VolumePanelProps } from "../types/volumePanelTypes";
import { Accordion, AccordionDetails, AccordionSummary, Button, IconButton, Stack, Typography } from "@mui/material";
import { ExpandMore, Remove } from "@mui/icons-material";
import { VolumeCeilingFloorPanel } from "./VolumeCeilingFloorPanel";
import type { AlertSeverity } from "../types/alertTypes";
import { AlertWithSeverity } from "./Alert";
import type { Envelope } from "../openAir/openAirTypes";
import type { Volume } from "../openAir";
import { STLExporter } from "three/examples/jsm/Addons.js";
import { downloadBlob } from "../utils/utils";
import { Group } from "three";
import { Distance } from "../openAir/distance";


export function VolumesPanel(props: VolumePanelProps) {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('')
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>("success")
  
  const handleAccordianChange = (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
  }

  function handleDownloadModel(){
    const exporter = new STLExporter();
    const group = new Group();
    props.meshes.map((mesh)=>group.add(mesh))
    const stlString = exporter.parse(group, { binary: false }); 
    const blob = new Blob([stlString], { type: 'text/plain' });
    downloadBlob(blob, 'aispace_model.stl')
  } 

  
  return (
    <Stack direction={"column"} spacing={2}>
      <Accordion expanded={expanded === 'panel1'} onChange={handleAccordianChange('panel1')}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography component="span" sx={{ width: '100%', flexShrink: 0 }}>
            Volumes
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction={"column"} spacing={2}>
            <Stack spacing={1} direction={"column"} >
              {props.volumes.map((volume, index)=>{
                return (
                  <VolumePanelStack 
                    key={`volumepanelstack${index}`} 
                    volume={volume} 
                    index={index} 
                    volumes={props.volumes} 
                    setVolumes={props.setVolumes} 
                    setAlertMessage={setAlertMessage} 
                    setAlertSeverity={setAlertSeverity} 
                    setOpenAlert={setOpenAlert} 
                  />)
              })}
            </Stack>
          </Stack>
        </AccordionDetails>
        <AlertWithSeverity open={openAlert} setOpen={setOpenAlert} message={alertMessage} severity={alertSeverity}/>
      </Accordion>
      <Button variant="outlined" onClick={()=>handleDownloadModel()}>
        Download Model
      </Button>
    </Stack>
  )
}

export function VolumePanelStack(
  props: {
    volume: Volume, 
    index: number, 
    volumes: Volume[], 
    setVolumes: Dispatch<SetStateAction<Volume[]>>, 
    setAlertMessage: Dispatch<SetStateAction<string>>, 
    setAlertSeverity: Dispatch<SetStateAction<AlertSeverity>>, 
    setOpenAlert: Dispatch<SetStateAction<boolean>>
  }){
    const floor = props.volume.airspace.floor.valueFeet ? props.volume.airspace.floor.valueFeet : 0 
    const ceiling = props.volume.airspace.ceiling.valueFeet ? props.volume.airspace.ceiling.valueFeet : 1000 
    const [envelope, setEnvelope] = useState<Envelope>({floor: floor, ceiling: ceiling})

    useEffect(()=>{
      // Build updated volumes immutably and set Altitude.value to new Distance instances
      const newVolumes = props.volumes.map((volume) => {
        if (volume.airspace.name === props.volume.airspace.name){
          return {
            ...volume,
            airspace: {
              ...volume.airspace,
              ceiling: {
                ...volume.airspace.ceiling,
                value: new Distance(envelope.ceiling, "feet")
              },
              floor: {
                ...volume.airspace.floor,
                value: new Distance(envelope.floor, "feet")
              }
            }
          }
        }
        return volume
      })

      props.setVolumes(newVolumes)
    },[envelope])
      
    const handleRemoveVolume = (name: string) => (_event: SyntheticEvent) => {
      props.setVolumes(props.volumes.filter((volume) => {
        return volume.airspace.name != name
      }))
      props.setAlertMessage(`Removed "${name}" volume`)
      props.setAlertSeverity('success')
      props.setOpenAlert(true)
    }

    return(
      <Stack key={`stack${props.index}`} spacing={1} direction={"row"} >
        <IconButton sx={{maxHeight: "40px", alignSelf: "center"}} key={`iconButton${props.index}`} value={props.volume.airspace.name} onClick={handleRemoveVolume(props.volume.airspace.name)}>
          <Remove key={`removeIcon${props.index}`}/>
        </IconButton >
        <VolumeCeilingFloorPanel volumeName={props.volume.airspace.name} envelope={envelope} setEnvelope={setEnvelope} />
      </Stack>)
  }