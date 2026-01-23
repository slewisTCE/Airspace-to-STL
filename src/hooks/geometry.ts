import { SVGLoader, type SVGResult } from "three/examples/jsm/Addons.js";
import * as THREE from "three";
import { useMemo } from "react";


export function useMeshFromSvgData(svgString: string, extrudeSettings: THREE.ExtrudeGeometryOptions, colour: THREE.ColorRepresentation): THREE.Mesh | undefined {

  // Rebuild shapes and geometry whenever the source SVG, the extrude depth, or colour change
  const shapes = useMemo(() => {
      console.log('Parsing SVG string to shapes');
      const loader = new SVGLoader();
      const svgData: SVGResult = loader.parse(svgString)
      const shapesTemp: THREE.Shape[] = []
      svgData.paths.map((path) => shapesTemp.push(...path.toShapes(true)))
      return shapesTemp
  },[svgString])

  const geometry = useMemo(() => {
    console.log('Building geometry from shapes');
    const settings = Object.assign({}, extrudeSettings, { bevelEnabled: false })
    const geometry = new THREE.ExtrudeGeometry(shapes, settings);
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
  },[shapes, extrudeSettings])

  const mesh = useMemo(() => {
    console.log('Creating mesh from geometry');
    const material = new THREE.MeshBasicMaterial({ color: colour });
    const mesh = new THREE.Mesh(geometry, material)
    return mesh
  },[colour, geometry])

  return mesh
}

// mesh depth logged previously for debugging; removed to avoid noisy console output
  // useEffect(()=>{
  //   if(typeof meshData !== 'undefined'){
  //     console.log(meshData)
  //     // capture meshData for export and for debugging
  //     // clone meshData and apply the same position/scale used in the scene so exports preserve relative Z
  //     try {
  //       const exportClone = meshData.clone(true) as THREE.Mesh
  //       // apply scene transforms
  //       exportClone.position.set(props.position[0] ?? 0, props.position[1] ?? 0, props.position[2] ?? 0)
  //       exportClone.scale.set(props.scale ?? 1, props.scale ?? 1, props.scale ?? 1)
  //       exportClone.updateMatrixWorld(true)
  //       props.setMeshes(props.meshes.concat(exportClone))
  //     } catch (error) {
  //       props.setMeshes(props.meshes.concat(meshData))
  //       console.warn('Failed to clone mesh for export with transforms, using untransformed mesh', error)
  //     }
  //     // try {
  //     //   meshData.geometry.computeBoundingBox()
  //     // } catch (error) {
  //     //   console.warn('Failed to compute bounding box for mesh', error)
  //     // }
  //   }
  // },[meshData, props])