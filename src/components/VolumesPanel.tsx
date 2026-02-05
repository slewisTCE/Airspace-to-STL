import { useEffect, useState, type SyntheticEvent } from "react";
import type { VolumePanelProps } from "../types/volumePanelTypes";
import { Accordion, AccordionDetails, AccordionSummary, Badge, Button, Stack, Typography, Paper, Tooltip } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { VolumeCeilingFloorPanel } from "./VolumeCeilingFloorPanel";
import type { Envelope } from "../openAir/openAirTypes";
import type { Volume } from "../openAir";
import { STLExporter } from "three/examples/jsm/Addons.js";
import JSZip from "jszip";
import { downloadBlob, formatFeet } from "../utils/utils";
import { Group, Box3, Vector3, Mesh, BufferGeometry } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";
import type { AlertSeverity } from "../types/alertTypes";
import { envelopeDefaults } from "../lib/settings";
import { drawerWidth } from "../lib/settings";


export function VolumesPanel(props: VolumePanelProps) {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleAccordianChange = (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
  }

  async function handleDownloadModel(){
    const exporter = new STLExporter();
    // Build a single merged geometry from all scene meshes as a safe fallback
    if (!props.meshes || props.meshes.length === 0) {
      props.handleAlert('No meshes available to export', 'warning')
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
      props.handleAlert('No valid geometries collected for export', 'warning')
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
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const zScaleValue = Number.isFinite(props.zScale) ? props.zScale : 1
    const baseFileName = `airspace-combined-z${zScaleValue}-${date}`

    const lines: string[] = []
    lines.push(`zScale: ${zScaleValue}`)
    lines.push(`Volumes: ${props.volumes.length}`)
    lines.push('')
    props.volumes.forEach((volume, index) => {
      const classCode = volume.airspace.airspaceClass.code
      const className = volume.airspace.airspaceClass.name
      const originalEnvelope = volume.originalEnvelope ?? {
        floor: volume.airspace.floor?.value?.feet ?? 0,
        ceiling: volume.airspace.ceiling?.value?.feet ?? 0
      }
      const currentEnvelope = {
        floor: volume.airspace.floor?.value?.feet ?? 0,
        ceiling: volume.airspace.ceiling?.value?.feet ?? 0
      }
      const envelopeChanged =
        originalEnvelope.floor !== currentEnvelope.floor ||
        originalEnvelope.ceiling !== currentEnvelope.ceiling

      lines.push(`${index + 1}. ${volume.airspace.name}`)
      lines.push(`   Class: ${classCode} (${className})`)
      lines.push(
        `   Original envelope: floor ${formatFeet(originalEnvelope.floor)}, ceiling ${formatFeet(originalEnvelope.ceiling)}`
      )
      if (envelopeChanged) {
        lines.push(
          `   New envelope: floor ${formatFeet(currentEnvelope.floor)}, ceiling ${formatFeet(currentEnvelope.ceiling)}`
        )
      } else {
        lines.push(`   New envelope: unchanged`)
      }
      lines.push('')
    })
    const zip = new JSZip()
    const stlBytes = new Uint8Array(stlBuffer.buffer, stlBuffer.byteOffset, stlBuffer.byteLength)
    zip.file(`${baseFileName}.stl`, stlBytes, { binary: true })
    zip.file(`${baseFileName}.txt`, lines.join('\n'))
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, `${baseFileName}.zip`)
  } 

  function handleClearAll(){
    if (!props.volumes || props.volumes.length === 0) {
      props.handleAlert('No volumes to clear', 'info')
      return
    }

    props.handleClearAllVolumes()
    props.handleAlert('Cleared all volumes', 'success')
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
            {props.volumes.length > 0 ? (
              <Stack direction={"row"} spacing={1} justifyContent={"center"}>
                <Button variant="contained" color="warning" onClick={handleClearAll}>
                  Clear All
                </Button>
              </Stack>
            ) : null}
            <Paper elevation={8} sx={{padding: "10px"}}>
            <Stack spacing={1} direction={"column"} >
              {props.volumes.map((volume, index)=>{
                return (
                  <VolumePanelStack 
                    key={`volumepanelstack${index}`} 
                    volume={volume} 
                    index={index} 
                    volumes={props.volumes} 
                    handleRemoveVolume={props.handleRemoveVolume}
                    envelope={props.envelope}
                    handleEnvelopeChange={props.handleEnvelopeChange}
                    handleAlert={props.handleAlert} 
                  />)
              })}
            </Stack>
            </Paper>
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Paper elevation={8} sx={{padding: "20px", display: "flex", justifyContent: "center"}}>
        <Button variant="contained" sx={{width: `${drawerWidth-100}px`}} onClick={()=>handleDownloadModel()}>
          Download Model
        </Button>
      </Paper>
    </Stack>
  )
}

export function VolumePanelStack(
  props: {
    volume: Volume, 
    index: number, 
    volumes: Volume[], 
    envelope?: Envelope,
    handleEnvelopeChange: (newEnvelope: Envelope, volumeName: string) => void, 
    handleRemoveVolume: (name: string) => () => void,
    handleAlert: (message: string, severity: AlertSeverity) => void
  }){
    const initialFloor = props.volume.airspace.floor?.value?.feet ?? envelopeDefaults.floor
    const initialCeiling = props.volume.airspace.ceiling?.value?.feet ?? envelopeDefaults.ceiling
    const [initialEnvelope] = useState<Envelope>(() => ({
      floor: initialFloor,
      ceiling: initialCeiling
    }))
    const [localEnvelope, setLocalEnvelope] = useState<Envelope>({
      floor: initialFloor,
      ceiling: initialCeiling
    })

    useEffect(() => {
      async function syncEnvelope() {
        const nextFloor = props.volume.airspace.floor?.value?.feet ?? envelopeDefaults.floor
        const nextCeiling = props.volume.airspace.ceiling?.value?.feet ?? envelopeDefaults.ceiling
        if (localEnvelope.floor !== nextFloor || localEnvelope.ceiling !== nextCeiling) {
          setLocalEnvelope({ floor: nextFloor, ceiling: nextCeiling })
        }
      }
      syncEnvelope();
    }, [props.volume, localEnvelope.floor, localEnvelope.ceiling])

    const handleLocalEnvelopeChange = (newEnvelope: Envelope) => {
      setLocalEnvelope(newEnvelope)
      props.handleEnvelopeChange(newEnvelope, props.volume.airspace.name)
    }
      

    function handleRemove(){
      props.handleRemoveVolume(props.volume.airspace.name)()
      props.handleAlert(`Removed "${props.volume.airspace.name}" volume`, 'success')
    }

    return(
      // <Paper elevation={3} sx={{padding: "10px", flexGrow: 1}}>
      <>
        {/* <Stack key={`stack${props.index}`} spacing={1} direction={"row"} > */}
        <Tooltip title="Remove Volume" placement="top">
          <Badge
            badgeContent={"X"}
            // variant="dot"
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            sx={{
              cursor: "pointer",
              "& .MuiBadge-badge": {
                backgroundColor: "#b71c1c",
                color: "#fff",
                cursor: "pointer",
                transform: "translate(-50%, 0%)"
              }
            }}
            onClick={() => handleRemove()}
          />
          </Tooltip>
          <VolumeCeilingFloorPanel 
            volumeName={props.volume.airspace.name} 
            envelope={localEnvelope} 
            initialEnvelope={initialEnvelope} 
            handleEnvelopeChange={handleLocalEnvelopeChange} 
            floorNotam={props.volume.airspace.floor?.notam ?? false} 
            ceilingNotam={props.volume.airspace.ceiling?.notam ?? false}
            floorRawValue={props.volume.airspace.floor.raw}
            ceilingRawValue={props.volume.airspace.ceiling.raw}
          />
      </>
    )
  }