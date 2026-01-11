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
    const geometry = new THREE.ExtrudeGeometry(shapesTemp, extrudeSettings);
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