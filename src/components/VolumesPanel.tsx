import { useEffect, useState, type Dispatch, type SetStateAction, type SyntheticEvent } from "react";
import type { VolumePanelProps } from "../types/volumePanelTypes";
import { Accordion, AccordionDetails, AccordionSummary, Button, IconButton, Stack, Typography } from "@mui/material";
import { ExpandMore, Remove } from "@mui/icons-material";
import { VolumeCeilingFloorPanel } from "./VolumeCeilingFloorPanel";
import type { AlertSeverity } from "../types/alertTypes";
import { AlertWithSeverity } from "./Alert";
import type { Envelope } from "../types/openAirTypes";
import type { OpenAirAirspace } from "../openAir";
import { STLExporter } from "three/examples/jsm/Addons.js";
import { downloadBlob } from "../utils/utils";
import { Group } from "three";


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
    volume: OpenAirAirspace, 
    index: number, 
    volumes: OpenAirAirspace[], 
    setVolumes: Dispatch<SetStateAction<OpenAirAirspace[]>>, 
    setAlertMessage: Dispatch<SetStateAction<string>>, 
    setAlertSeverity: Dispatch<SetStateAction<AlertSeverity>>, 
    setOpenAlert: Dispatch<SetStateAction<boolean>>
  }){
    const floor = props.volume.floor.valueFeet ? props.volume.floor.valueFeet : 0 
    const ceiling = props.volume.ceiling.valueFeet ? props.volume.ceiling.valueFeet : 1000 
    const [envelope, setEnvelope] = useState<Envelope>({floor: floor, ceiling: ceiling})

    useEffect(()=>{
      props.setVolumes(props.volumes.map((volume) => {
        if (volume.name == props.volume.name){
          volume.ceiling.valueFeet = envelope.ceiling
          volume.floor.valueFeet = envelope.floor
        }
        return volume
      }))
    },[envelope])
      
    const handleRemoveVolume = (name: string) => (_event: SyntheticEvent) => {
      props.setVolumes(props.volumes.filter((volume) => {
        return volume.name != name
      }))
      props.setAlertMessage(`Removed "${name}" volume`)
      props.setAlertSeverity('success')
      props.setOpenAlert(true)
    }

    return(
      <Stack key={`stack${props.index}`} spacing={1} direction={"row"} >
        <IconButton sx={{maxHeight: "40px", alignSelf: "center"}} key={`iconButton${props.index}`} value={props.volume.name} onClick={handleRemoveVolume(props.volume.name)}>
          <Remove key={`removeIcon${props.index}`}/>
        </IconButton >
        <VolumeCeilingFloorPanel volumeName={props.volume.name} envelope={envelope} setEnvelope={setEnvelope} />
      </Stack>)
  }