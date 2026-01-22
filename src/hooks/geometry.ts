import { useState, useEffect } from "react";
import { SVGLoader, type SVGResult } from "three/examples/jsm/Addons.js";
import * as THREE from "three";


export function useMeshFromSvgData(svgString: string, extrudeSettings: THREE.ExtrudeGeometryOptions, colour: THREE.ColorRepresentation): [THREE.Mesh | undefined, THREE.Shape[]] {
  const [mesh, setMesh]= useState<THREE.Mesh>()
  const [shapes, setShapes]= useState<THREE.Shape[]>([])
  const loader = new SVGLoader();

  // Rebuild shapes and geometry whenever the source SVG, the extrude depth, or colour change
  useEffect(()=>{
    const svgData: SVGResult = loader.parse(svgString)
    const shapesTemp: THREE.Shape[] = []
    svgData.paths.map((path) => shapesTemp.push(...path.toShapes(true)))
    setShapes(shapesTemp)
    // Ensure no bevel is applied (bevel adds extra depth unexpectedly)
    const settings = Object.assign({}, extrudeSettings, { bevelEnabled: false })
    const geometry = new THREE.ExtrudeGeometry(shapesTemp, settings);
    // Normalize geometry so its base sits at z=0 (remove negative min.z offsets)
    try {
      geometry.computeBoundingBox()
      const bb = geometry.boundingBox
      if (bb) {
        const minZ = bb.min.z || 0
        if (minZ !== 0) geometry.translate(0, 0, -minZ)
      }
    } catch (e) {
      // ignore
    }
    const material = new THREE.MeshBasicMaterial({ color: colour });
    setMesh(new THREE.Mesh(geometry, material))
    // cleanup: dispose geometry/material when svgString or settings change
    return () => {
      try {
        if (mesh) {
          mesh.geometry.dispose()
          if ((mesh.material as THREE.Material).dispose) (mesh.material as THREE.Material).dispose()
        }
      } catch (e) {
        // ignore disposal errors
      }
    }
  // Note: include depth and colour so changes to sliders rebuild the geometry
  },[svgString, extrudeSettings.depth, colour])

  return [mesh, shapes]
}