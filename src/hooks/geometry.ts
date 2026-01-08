import { useState } from "react";
import { SVGLoader, type SVGResult } from "three/examples/jsm/Addons.js";
import * as THREE from "three";
import { useMemo } from "react";


export function useMeshFromSvgData(svgString: string, extrudeSettings: THREE.ExtrudeGeometryOptions, colour: THREE.ColorRepresentation): [THREE.Mesh | undefined, THREE.Shape[]] {
  const [mesh, setMesh]= useState<THREE.Mesh>()
  const [shapes, setShapes]= useState<THREE.Shape[]>([])
  const loader = new SVGLoader();

  useMemo(()=>{
    const svgData: SVGResult = loader.parse(svgString)
    const shapesTemp: THREE.Shape[] = []
    svgData.paths.map((path) => shapesTemp.push(...path.toShapes(true)))
    setShapes(shapesTemp)
    const geometry = new THREE.ExtrudeGeometry(shapesTemp, extrudeSettings);
    const material = new THREE.MeshBasicMaterial({ color: colour });
    setMesh(new THREE.Mesh(geometry, material))
  },[svgString])

  return [mesh, shapes]
}