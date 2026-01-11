import { CoordinatePair } from "./coordinatePair"
import { Geometry } from "./geometry"
import { Shape } from "three"
import type { PathType } from "./openAirTypes"

export class Polygon extends Geometry {
  points: CoordinatePair
  svgPathSegmentScaled?: string
  svgPathSegment: string
  path: PathType = {projection: {value: new Shape()}}
  shape: Shape
  constructor(shape: Shape, points: CoordinatePair){
    super()
    this.shape = shape
    this.points = points
    this.svgPathSegment = this.generateSvgPathSegment()
    if(shape.curves.length == 0){
      this.shape.moveTo(this.points.projection.x, this.points.projection.y)
    } else {
      this.shape.lineTo(this.points.projection.x, this.points.projection.y)       
    }
  }

  public generateSvgPathSegment(scaled=false): string {
    let svgPoints = ""
    if (scaled){
        if (this.points.projection.scaled){
          svgPoints = ' L ' + this.points.projection.scaled.x + ' ' + this.points.projection.scaled.y
        }
    } else {
      svgPoints = ' L ' + this.points.projection.x + ' ' + this.points.projection.y
    }

    if(svgPoints){
      return `${svgPoints.trim()}`
    } else {
      return ""
    }
  }
}