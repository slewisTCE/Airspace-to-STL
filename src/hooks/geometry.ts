import { SVGLoader, type SVGResult } from "three/examples/jsm/Addons.js";
import { ExtrudeGeometry, Mesh, MeshBasicMaterial, type ColorRepresentation, type ExtrudeGeometryOptions, type Shape as ThreeShape } from "three";
import { useMemo } from "react";
import { Volume } from "../openAir";
import { modelScale } from "../lib/settings";


export function useMeshFromSvgData(svgString: string, extrudeSettings: ExtrudeGeometryOptions, colour: ColorRepresentation): Mesh | undefined {
  const { depth, curveSegments } = extrudeSettings;
  
  // Rebuild shapes and geometry whenever the source SVG, the extrude depth, or colour change
  const shapes = useMemo(() => {
    const loader = new SVGLoader();
    const svgData: SVGResult = loader.parse(svgString)
    const shapesTemp: ThreeShape[] = []
    svgData.paths.map((path) => shapesTemp.push(...path.toShapes(true)))
    return shapesTemp
  },[svgString])

  const geometry = useMemo(() => {
    const settings = Object.assign({}, {depth, curveSegments}, { bevelEnabled: false })
    const geometry = new ExtrudeGeometry(shapes, settings);
    try {
      geometry.computeBoundingBox()
      const bb = geometry.boundingBox
      if (bb) {
        const minZ = bb.min.z || 0
        if (minZ !== 0) geometry.translate(0, 0, -minZ)
      }
    } catch (error) {
      console.warn('Failed to compute bounding box for geometry', error)
    }
    return geometry
  },[shapes, depth, curveSegments])

  const mesh = useMemo(() => {
    const material = new MeshBasicMaterial({ color: colour });
    const mesh = new Mesh(geometry, material)
    return mesh
  },[colour, geometry])

  return mesh
}

export function useMeshesFromVolumes(
  volumes: Volume[], 
  zScale: number, 
  centroidOffset: {
    x: number;
    y: number;
  }, 
  extrudeSettings: ExtrudeGeometryOptions, 
  colour: ColorRepresentation
): Mesh[] {
    const shapesAllVolumes = useMemo(() => {
      return volumes.map((volume) => {
        const location = Volume.scaleZ(volume, zScale, centroidOffset)
        const svgString = volume.airspace.svg || ''
        const loader = new SVGLoader();
        const svgData: SVGResult = loader.parse(svgString)
        const shapesTemp: ThreeShape[] = []
        svgData.paths.map((path) => shapesTemp.push(...path.toShapes(true)))
        return {shapes: shapesTemp, location: location}
      })
    },[volumes, zScale, centroidOffset])

    const geometryAllVolumes = useMemo(() => {
      return shapesAllVolumes.map((shapesOneVolume)=> {
        const settings = Object.assign({}, {depth: shapesOneVolume.location.depth, curveSegments: extrudeSettings.curveSegments}, { bevelEnabled: false })
        const geometryOneVolume = new ExtrudeGeometry(shapesOneVolume.shapes, settings);
        try {
          geometryOneVolume.computeBoundingBox()
          const bb = geometryOneVolume.boundingBox
          if (bb) {
            const minZ = bb.min.z || 0
            if (minZ !== 0) geometryOneVolume.translate(0, 0, -minZ)
          }
        } catch (error) {
          console.warn('Failed to compute bounding box for geometry', error)
        }
        return {geometry: geometryOneVolume, location: shapesOneVolume.location }
      })
    },[shapesAllVolumes, extrudeSettings.curveSegments])

    const meshes = useMemo(() => {
      return geometryAllVolumes.map((geometryOneVolume)=>{
        const material = new MeshBasicMaterial({ color: colour });
        const mesh = new Mesh(geometryOneVolume.geometry, material)
        mesh.position.set(geometryOneVolume.location.posX, geometryOneVolume.location.posY, geometryOneVolume.location.posZ)
        mesh.scale.set(modelScale, modelScale, modelScale)
        return mesh
      })
    },[colour, geometryAllVolumes])

    return meshes
}