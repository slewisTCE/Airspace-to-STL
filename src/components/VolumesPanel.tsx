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
import { Group, Box3, Vector3, Mesh, BufferGeometry } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";
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
    // Build a single merged geometry from all scene meshes as a safe fallback
    if (!props.meshes || props.meshes.length === 0) {
      setAlertMessage('No meshes available to export')
      setAlertSeverity('warning')
      setOpenAlert(true)
      return
    }

    const geometries: BufferGeometry[] = []
    props.meshes.forEach((m)=>{
      try {
        const clone = m.clone(true) as Mesh
        clone.updateMatrixWorld(true)
        if (!clone.geometry) return
        const geom = (clone.geometry as BufferGeometry).clone()
        geom.applyMatrix4(clone.matrixWorld)
        if (geom.index) {
          // convert to non-indexed for merging
          const nonIndexed = geom.toNonIndexed() as BufferGeometry
          geometries.push(nonIndexed)
        } else {
          geometries.push(geom)
        }
      } catch (e) {
        console.warn('Failed to collect geometry for merging', e)
      }
    })

    let exportTarget: Group | Mesh
    if (geometries.length === 0){
      setAlertMessage('No valid geometries collected for export')
      setAlertSeverity('warning')
      setOpenAlert(true)
      return
    }
    try {
      const merged = BufferGeometryUtils.mergeGeometries(geometries, false) as BufferGeometry
      const material = (props.meshes[0] && props.meshes[0].material) ? props.meshes[0].material : undefined
      const mergedMesh = new Mesh(merged, material)
      exportTarget = mergedMesh
    } catch (e) {
      console.warn('Merging geometries failed, falling back to grouped export', e)
      const g = new Group()
      props.meshes.forEach((m) => g.add(m.clone(true)))
      exportTarget = g
    }

    // Compute bounding box of the export group and scale to fit within 300mm cube
    // Compute bounding box of the export target and scale to fit within 300mm cube
    exportTarget.updateMatrixWorld(true);
    const box = new Box3().setFromObject(exportTarget);
    const size = new Vector3();
    box.getSize(size);
    const currentMax = Math.max(size.x, size.y, size.z) || 1;
    const targetMm = 200; // 300 mm cube
    // Geometry coordinates are in kilometres (proj4 uses +units=km).
    // Scale so the largest dimension becomes targetMm (units in STL are interpreted as mm).
    const scaleFactor = currentMax > 0 ? targetMm / currentMax : 1;
    exportTarget.scale.multiplyScalar(scaleFactor);
    exportTarget.updateMatrixWorld(true);

    // Export as binary STL for smaller files and compatibility with slicers
    const stlBuffer = exporter.parse(exportTarget, { binary: true }) as DataView<ArrayBuffer>;
    const blob = new Blob([stlBuffer], { type: 'application/octet-stream' });
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
    downloadBlob(blob, `airspace-combined-${date}.stl`)
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
    const floor = props.volume.airspace.floor?.value?.feet ?? 0
    const ceiling = props.volume.airspace.ceiling?.value?.feet ?? 1000

    const [envelope, setEnvelope] = useState<Envelope>({floor: floor, ceiling: ceiling})
    const volumeName = props.volume.airspace.name

    const handleEnvelopeChange = (next: Envelope) => {
      setEnvelope(next)
      props.setVolumes((current) =>
        current.map((volume) => {
          if (volume.airspace.name !== volumeName) {
            return volume
          }

          volume.airspace.ceiling.value = new Distance(next.ceiling, "feet")
          volume.airspace.floor.value = new Distance(next.floor, "feet")

          return { ...volume, airspace: volume.airspace }
        })
      )
    }

    useEffect(() => {
      async function updateEnvelopeFromProps() {
        if (envelope.floor !== floor || envelope.ceiling !== ceiling) {
          setEnvelope({ floor, ceiling })
        }
      }
      updateEnvelopeFromProps()
    }, [floor, ceiling, envelope.floor, envelope.ceiling])
      
    const handleRemoveVolume = (name: string) => () => {
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
        <VolumeCeilingFloorPanel volumeName={props.volume.airspace.name} envelope={envelope} handleEnvelopeChange={handleEnvelopeChange} />
      </Stack>)
  }