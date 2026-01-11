import { ShapeGeometry } from "three"
import { OpenAirAirspace } from "./openAirAirspace"
import type { Polygon } from "./polygon"

export class OpenAirAirspaces {
  airspaces: OpenAirAirspace[]
  maxProjection: number = 0
  minProjection: number = 0
  offset: number = 0
  scalingFactor: number = 1

  constructor(airspacesText: string){
    const airspaceDataSplit = this.splitRawAirspaceData(airspacesText)
    this.airspaces = airspaceDataSplit.splice(1).map((airspaceData)=>{
      const airspace = new OpenAirAirspace(airspaceData)
      this.maxProjection = Math.max(this.maxProjection, airspace.maxProjection)
      this.minProjection = Math.min(this.minProjection, airspace.minProjection)
      return airspace
    })

    this.airspaces.map((airspace)=>{
      if(airspace.geometry){
        airspace.geometry = airspace.geometry.scale(0.1, 0.1, 1)
        airspace.geometry
        airspace.geometry.computeBoundingBox()
      }
    })
    this.offset = Math.abs(this.minProjection)
    this.scalingFactor = 2000.0 / (this.offset + this.maxProjection)
    // this.scaleAirspaces(this.airspaces, this.offset, this.scalingFactor)

  }

  // private scaleProjection(airspace: OpenAirAirspace, projectedAbsMaxPixels: number){
  //   airspace.shapes.map((shape)=>{
  //     if (shape.constructor.name == "Polygon"){
  //       const polygon = shape as Polygon
  //       polygon.points.map((point)=>{
  //         if (point.projection){
  //           point.projection.scaled = {
  //             x: (point.projection?.x / this.maxProjection) * projectedAbsMaxPixels,
  //             y: (point.projection?.y / this.maxProjection) * projectedAbsMaxPixels
  //           }
  //         }
  //       })
  //     }
  //   })
  // }

  private splitRawAirspaceData(airspaceData: string): string[] {
    return airspaceData.split(/\n\s*\n/)
  }

  public scaleAirspaces(airspaces: OpenAirAirspace[], offset: number, scalingFactor: number){
    airspaces.map((airspace)=>{
      // airspace.scaleShapes(airspace.shapes, offset, scalingFactor)
      airspace.shapes.map((shape)=>{
        // shape.svgPathSegmentScaled = airspace.generateShapeSvgPath(shape, true)
        // shape.svgPathSegment = airspace.generateShapeSvgPath(shape, false)
        return shape
      })
    
      airspace.svgScaled = airspace.compileShapestoSingleSvg(airspace.shapes, true)
      airspace.svg = airspace.compileShapestoSingleSvg(airspace.shapes, false)

    })
  }

  public airspaceFromName(name: string): OpenAirAirspace | undefined {
    return this.airspaces.find((airspace: OpenAirAirspace) => airspace.name === name)
  }

}