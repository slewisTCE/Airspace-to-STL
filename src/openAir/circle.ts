import type { CoordinatePair } from "./coordinatePair";
import { commandMap } from "./data";
import { Geometry } from "./geometry";
import { Shape } from "three"
import { Radius } from "./radius";

export class Circle extends Geometry {
  radius: Radius
  arcStartPoint:  CoordinatePair
  arcEndPoint:  CoordinatePair
  center: CoordinatePair
  svgPathSegment: string
  svgPathSegmentScaled?: string
  shape?: Shape
  segments: number = 32

  constructor(shape: Shape, line: string, center: CoordinatePair){
    super()
    this.center = center
    const radius = this.parseCircleRadius(line)
    this.arcStartPoint = this.center.moveNorth(radius)
    this.arcEndPoint = this.center.moveSouth(radius)
    this.radius = new Radius(radius, "nauticalMiles")
    this.svgPathSegment = this.generateSvgPathSegment()
    this.shape = this.drawPath(shape)
  }

  public drawPath(shape: Shape, scaled=false): Shape {
    if (scaled){
      if(this.center.projection.scaled && this.radius.scaled){
        shape.absarc(
          this.center.projection.scaled.x, 
          this.center.projection.scaled.y,
          this.radius.scaled.kiloMetres,
          0,
          Math.PI*2,
          false
        )
      } else {
        throw new Error("Scaled values do not exist")
      }
    } else {
      shape.absarc(
        this.center.projection.x, 
        this.center.projection.y,
        this.radius.value.kiloMetres,
        0,
        Math.PI*2,
        false
      )
    }
    return shape
  }

  private parseCircleRadius(line: string): number {
    return Number(line.slice(commandMap.circle.length +1))
  }

  public generateSvgPathSegment(scaled=false): string {
    let center
    let radius
    if (scaled){
      center = this.center.projection.scaled
      radius = this.radius.scaled
    } else {
      center = this.center.projection
      radius = this.radius.value
    }
    if (center && radius){
      const startX = center.x + radius.kiloMetres
      const startY = center.y
      const endX = center.x - radius.kiloMetres
      const endY = center.y
      const svgPathSegment = " " + [
        `L ${startX} ${startY}`,
        `A ${radius.kiloMetres} ${radius.kiloMetres} 0 1 0 ${endX} ${endY}`,
        `A ${radius.kiloMetres} ${radius.kiloMetres} 0 1 0 ${startX} ${startY}`
      ].join(' ').trim()
      return svgPathSegment
    } else {
      throw new Error("Can't generate svg path segments until scaled projection's are defined");
    }
  }
}