import { Shape } from "three";
import { CoordinatePair } from "./coordinatePair";
import { commandMap } from "./data";
import { Geometry } from "./geometry";
import { type ArcAngles, type Direction, type ParseArcCoordinatesResult, type ParseArcRadiusAnglesResult, type ProjectionPair, type XYPair } from "./openAirTypes";
import { Radius } from "./radius"
import { Angle } from "./angle";
import { Coordinate } from "./coordinate";
import { Distance } from "./distance";

export class Arc extends Geometry {
  startPoint: CoordinatePair
  endPoint: CoordinatePair
  direction: Direction
  center: CoordinatePair
  startAngle: Angle
  endAngle: Angle
  angleDelta: Angle
  largeArc: boolean
  svgPathSegment: string 
  svgPathSegmentScaled?: string 
  radius: Radius
  shape: Shape
  earthRadius = new Radius(6378000, "metres")
  rawLine = ""

  constructor(shape: Shape, line: string, direction: Direction, center: CoordinatePair)
  constructor(shape: Shape, arcPoints: [CoordinatePair, CoordinatePair], direction: Direction, center: CoordinatePair,)
  constructor(shape: Shape, lineOrPoints: string | [CoordinatePair, CoordinatePair], direction: Direction, center: CoordinatePair)
  {
    super()
    this.direction = direction
    this.center = center
    if (typeof lineOrPoints === "string"){
    this.rawLine = lineOrPoints
      const command = lineOrPoints.split(' ')[0]
      if(command == commandMap.arcFromCoordinates){
        const arcCoords = this.parseArcCoordinates(lineOrPoints)
        this.startPoint = arcCoords.startPoint
        this.endPoint = arcCoords.endPoint
        this.startAngle = new Angle(this.startPoint.getBearing(this.center), "degrees")
        this.endAngle = new Angle(this.endPoint.getBearing(this.center), "degrees")
        this.radius = new Radius(this.haversineDistance(this.startPoint, this.center))
      } else if(command == commandMap.arcFromRadiusAngles){
        const arcComponents = this.parseArcRadiusAngles(lineOrPoints)
        this.radius = new Radius(arcComponents.radius, "nauticalMiles")
        this.startAngle = new Angle(arcComponents.startAngle, "degrees")
        this.endAngle = new Angle(arcComponents.endAngle, "degrees")
        this.startPoint = this.pointFromOriginAngleAndDistance(this.center, this.startAngle, this.radius.value)
        this.endPoint = this.pointFromOriginAngleAndDistance(this.center, this.endAngle, this.radius.value)
      } else {
        throw new Error("Command incompatible with Arc class")
      }
    } else {
      this.startPoint = lineOrPoints[0]
      this.endPoint = lineOrPoints[1]
      this.startAngle = new Angle(this.center.getBearing(this.startPoint), "degrees")
      this.endAngle = new Angle(this.center.getBearing(this.endPoint), "degrees")
      this.radius = new Radius(this.haversineDistance(this.startPoint, this.endPoint))
    }
    this.angleDelta = this.getAnglesDelta(
      {startAngle: this.startAngle, endAngle: this.endAngle}, 
      this.direction
    )
    this.largeArc = Math.abs(this.angleDelta.degrees) > 180
    this.shape = this.drawPath(shape, false)
    this.svgPathSegment = this.generateSvgPathSegment()
  }

  public drawPath(shape: Shape, scaled=false): Shape {
    if (scaled){
      if(this.center.projection.scaled && this.radius.scaled){
        if(shape.curves.length == 0){
          shape.moveTo(this.startPoint.projection.x, this.startPoint.projection.y)
        } else {
          shape.lineTo(this.startPoint.projection.x, this.startPoint.projection.y)
        }
        shape.absarc(
          this.center.projection.scaled.x, 
          this.center.projection.scaled.y,
          this.radius.scaled.kiloMetres,
          this.startAngle.radians,
          this.endAngle.radians,
          this.direction == "clockwise"
        )
      } else {
        throw new Error("Scaled values do not exist")
      }
    } else {
      if(shape.curves.length == 0){
        shape.moveTo(this.startPoint.projection.x, this.startPoint.projection.y)
      } else {
        shape.lineTo(this.startPoint.projection.x, this.startPoint.projection.y)
      }
      shape.absarc(
        this.center.projection.x, 
        this.center.projection.y,
        this.radius.value.kiloMetres,
        this.startAngle.radians,
        this.endAngle.radians,
        this.direction == "clockwise"
      )
    }
    return shape
  }

  public generateSvgPathSegment(scaled=false): string {
    let startPointProjection: ProjectionPair | XYPair | undefined
    let endPointProjection: ProjectionPair | XYPair | undefined
    
    const sweepFlag = this.direction == "clockwise" ? 0 : 1
    const largeArcFlag = this.largeArc ? 1 : 0
    if (this.startPoint && this.endPoint){
      if (this.startPoint.projection && this.endPoint.projection){
        if(scaled){
          startPointProjection = this.startPoint.projection.scaled
          endPointProjection = this.endPoint.projection.scaled
        } else {
          startPointProjection = this.startPoint.projection
          endPointProjection = this.endPoint.projection
        }
        if (startPointProjection && endPointProjection && this.radius){
          return (`L ${startPointProjection.x} ${startPointProjection.y} A ${this.radius.value.kiloMetres} ${this.radius.value.kiloMetres} 0 ${largeArcFlag} ${sweepFlag} ${endPointProjection.x} ${endPointProjection.y}`)
        } else {
          console.error("Error generating svg segment path for ArcFromCoordinates")
          return ""
        }
      } else {
        console.error("Error generating svg segment path for ArcFromCoordinates")
        return ""
      }
   }
   return ""
  }

  private getAnglesDelta(arcAngles: ArcAngles, direction: Direction): Angle {
    let delta = arcAngles.endAngle.degrees - arcAngles.startAngle.degrees
    if (direction === "clockwise" && delta < 0) delta += 360
    if (direction === "anti-clockwise" && delta > 0) delta -= 360
    return new Angle(delta, "degrees")
  }

  private parseArcCoordinates(line: string): ParseArcCoordinatesResult {
    const coordinateParts = line.trim().slice(3).split(',')
    const startPoint = new CoordinatePair(coordinateParts[0])
    const endPoint = new CoordinatePair(coordinateParts[1])
    return {startPoint: startPoint, endPoint: endPoint}
  }

  private parseArcRadiusAngles(line: string): ParseArcRadiusAnglesResult{
    const components = line.slice(commandMap.arcFromRadiusAngles.length + 1).split(',')
    const radius = Number(components[0])
    const angleStart = Number(components[1])
    const angleEnd = Number(components[2])
    return {radius: radius, startAngle: angleStart, endAngle: angleEnd}
  }

  public generateArcFromRadiusAnglesSvgPathSegment(_scaled=true): string {
    throw new Error("Not yet implemented")
  }

  private pointFromOriginAngleAndDistance(origin: CoordinatePair, bearing: Angle, distance: Distance){
    const destinationLatitude = new Coordinate(
      Math.asin(
        Math.sin(origin.latitude.radians) * Math.cos(distance.metres / this.earthRadius.value.metres) +
        Math.cos(origin.latitude.radians) * Math.sin(distance.metres / this.earthRadius.value.metres) * Math.cos(bearing.radians)
      ), 
      false
    )
    const destinationLongitude = new Coordinate(
      origin.longitude.radians + Math.atan2(
        Math.sin(bearing.radians) * Math.sin(distance.metres / this.earthRadius.value.metres) * Math.cos(origin.latitude.radians),
        Math.cos(distance.metres / this.earthRadius.value.metres) - Math.sin(origin.latitude.radians) * Math.sin(destinationLatitude.radians)
      ), 
      true
    )
    return new CoordinatePair([destinationLatitude, destinationLongitude])
  }

  private haversineDistance(origin: CoordinatePair, destination: CoordinatePair) {
    const deltaLatitude = destination.latitude.radians - origin.latitude.radians
    const deltaLongitude = destination.longitude.radians - origin.longitude.radians
    const a = Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
      Math.cos(origin.latitude.radians) * Math.cos(destination.latitude.radians) *
      Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.earthRadius.value.metres * c
    return new Distance(distance, "metres");
  }
}


