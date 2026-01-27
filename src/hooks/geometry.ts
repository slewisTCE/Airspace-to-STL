import { SVGLoader, type SVGResult } from "three/examples/jsm/Addons.js";
import { ExtrudeGeometry, Mesh, MeshBasicMaterial, type ColorRepresentation, type ExtrudeGeometryOptions, type Shape as ThreeShape } from "three";
import { useMemo } from "react";


export function useMeshFromSvgData(svgString: string, extrudeSettings: ExtrudeGeometryOptions, colour: ColorRepresentation): Mesh | undefined {

  // Rebuild shapes and geometry whenever the source SVG, the extrude depth, or colour change
  const shapes = useMemo(() => {
      console.log('Parsing SVG string to shapes');
      const loader = new SVGLoader();
      const svgData: SVGResult = loader.parse(svgString)
      const shapesTemp: ThreeShape[] = []
      svgData.paths.map((path) => shapesTemp.push(...path.toShapes(true)))
      return shapesTemp
  },[svgString])

  const geometry = useMemo(() => {
    console.log('Building geometry from shapes');
    const settings = Object.assign({}, extrudeSettings, { bevelEnabled: false })
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
  },[shapes, extrudeSettings])

  const mesh = useMemo(() => {
    console.log('Creating mesh from geometry');
    const material = new MeshBasicMaterial({ color: colour });
    const mesh = new Mesh(geometry, material)
    return mesh
  },[colour, geometry])

  return mesh
}