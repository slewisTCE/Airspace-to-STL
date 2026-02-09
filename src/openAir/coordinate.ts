import { Geometry } from "./geometry"
import type { CompassPoint, DMSBearing } from "./openAirTypes"

export class Coordinate extends Geometry {
  bearing: CompassPoint = "N"
  degrees: number = 0
  minutes: number = 0
  seconds: number = 0
  degreesDecimal: number = 0
  radians: number = 0

  constructor(coordinateString: string)
  constructor(coordinateAndBearing: DMSBearing)
  constructor(radians: number, isLongitude: boolean)
  constructor(coordinate: string| DMSBearing | number, isLongitude?: boolean){
    super()
    if (typeof coordinate === "string"){
      this.parse(coordinate)
      this.degreesDecimal = this.coordinateToDecimal()
      this.radians = this.toRadians(this.degreesDecimal)
    } else if (typeof coordinate === "number"){
      this.radians = coordinate
      this.degreesDecimal = this.toDegrees(this.radians)
      const dmsBearing = this.degreesDecimalToDMS(this.degreesDecimal, isLongitude)
      this.bearing = dmsBearing.bearing
      this.degrees = dmsBearing.degrees
      this.minutes = dmsBearing.minutes
      this.seconds = dmsBearing.seconds
    
    } else {
      this.degrees = coordinate.degrees
      this.minutes = coordinate.minutes
      this.seconds = coordinate.seconds
      this.bearing = coordinate.bearing
      this.degreesDecimal = this.coordinateToDecimal()
      this.radians = this.toRadians(this.degreesDecimal)
    }
  }
  
  public parse(coordinateString: string){
    const parsed = this.parseCoordinate(coordinateString)
    this.degrees = parsed.degrees
    this.minutes = parsed.minutes
    this.seconds = parsed.seconds
    this.bearing = parsed.bearing
  }

  private parseCoordinate(coordinateString: string) {
    const coordinateParts = coordinateString.trim().split(' ')    
    const dms = coordinateParts[0].split(':').map((part: string)=>{return Number(part)})
    return {
      degrees: dms[0],
      minutes: dms[1],
      seconds: dms[2],
      bearing: coordinateParts[1] as CompassPoint
    }
  }

  private coordinateToDecimal(): number {
    let decimal = (this.degrees) 
      + (this.minutes) / 60.0 
      + (this.seconds) / 3600.0
    if (this.bearing === 'S' || this.bearing === 'W'){
      decimal *= -1.0;
    }
    return decimal
  }

  private degreesDecimalToDMS(degreesDecimal: number, isLongitude: boolean | undefined): DMSBearing {
    const absolute = Math.abs(degreesDecimal);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = (minutesNotTruncated - minutes) * 60

    let bearing: CompassPoint
    if (isLongitude) {
      bearing = degreesDecimal >= 0 ? "E" : "W";
    } else {
      bearing = degreesDecimal >= 0 ? "N" : "S";
    }
    return {degrees: degrees, minutes: minutes, seconds: seconds, bearing: bearing}
  }
} 