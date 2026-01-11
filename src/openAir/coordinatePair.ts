import { Coordinate } from "./coordinate"
import { Geometry } from "./geometry"
import type { CompassPoint, ProjectionPair, XYPair } from "./openAirTypes"
import proj4 from "proj4"

// Using a transverse mercator centred on Australia (lat_0=-25, lon_0=135)
const australianProjection = new proj4.Proj('+proj=tmerc +lat_0=-25 +lon_0=135 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +units=km +no_defs');
const wgs84 = new proj4.Proj('WGS84'); // Standard Lat/Long

export class CoordinatePair extends Geometry {
  latitude: Coordinate
  longitude: Coordinate
  projection: ProjectionPair

  constructor(coordinatePairLine: string)
  constructor([latitude, longitude]: [Coordinate, Coordinate])
  constructor(coordsOrLine: string | [Coordinate, Coordinate]){
    super()
    if(typeof coordsOrLine === "string"){
      const coords = this.parseCoordinatePair(coordsOrLine)
      this.latitude = coords[0]
      this.longitude = coords[1]
    } else {
      this.latitude = coordsOrLine[0]
      this.longitude = coordsOrLine[1]
    }
    const projection = this.projectLatLon()
    this.projection = {x: projection[0], y: projection[1]}
  }

  private parseCoordinatePair(line: string): [Coordinate, Coordinate]{
    let latitude: Coordinate
    let longitude: Coordinate
    const pair = line.trim().split(/\s{2,}/)
      .map((coordinateString)=>{
        return new Coordinate(coordinateString)
      })
    if (pair[0].bearing.includes("S")){
      latitude = pair[0]
      longitude = pair[1]
    } else if (pair[0].bearing.includes("N")){
      latitude = pair[0]
      longitude = pair[1]
    } else {
      latitude = pair[1]
      longitude = pair[0]
    }
    return [latitude, longitude]
    }

  private projectLatLon(): [number, number] {
    if(this.latitude && this.longitude){
      if (!isFinite(this.latitude.degreesDecimal) || !isFinite(this.longitude.degreesDecimal)) {
        throw new Error("Invalid lat/lon for projection")
      }
      try {
        // proj4 expects input as [lon, lat]
        const projection = this.latLonToAustraliaXY(this.latitude.degreesDecimal, this.longitude.degreesDecimal)
        return [projection.x, projection.y]
      } catch (e) {
        throw new Error("proj4 failed");
      }
    } else {
      throw new Error("proj4 failed: latitude and longitude not defined")
    }
  }

// Convenience helper: convert numeric latitude/longitude to Australia-centered X/Y (meters)
// (exported below, outside the class)
    
  public moveNorth(distanceNm: number): CoordinatePair {
    return this.moveNorthSouth(distanceNm, "N")
  }

  public moveSouth(distanceNm: number): CoordinatePair {
    return this.moveNorthSouth(distanceNm, "S")
  }

  private moveNorthSouth(distanceNm: number, bearing: CompassPoint): CoordinatePair {
    function balanceDegreesMinutes(movePoint: CoordinatePair): CoordinatePair {
      while (movePoint.latitude.minutes < 0){
        movePoint.latitude.degrees = movePoint.latitude.degrees - 1
        movePoint.latitude.minutes += 60
      }
      while (movePoint.latitude.minutes >= 60){
        movePoint.latitude.degrees = movePoint.latitude.degrees + 1
        movePoint.latitude.minutes = movePoint.latitude.minutes - 60
      }
      //equator crossing
      if (movePoint.latitude.degrees < 0){
        movePoint.latitude.degrees = Math.abs(movePoint.latitude.degrees)
        movePoint.latitude.bearing = movePoint.latitude.bearing == "N" ? "S" : "N"
      }
      //pole crossing
      if (movePoint.latitude.degrees > 90){
        movePoint.latitude.degrees = 90 - (movePoint.latitude.degrees - 90)
        movePoint.longitude.bearing = movePoint.longitude.bearing == "E" ? "W" : "E"
      }
      return movePoint
    }

    if( this.latitude && this.longitude){
      let minutes

      // Southern hemisphere
      if (this.latitude.bearing == "S"){
        // Moving south
        if(bearing == "S"){
          minutes = this.latitude.minutes + distanceNm
        // Moving North
        } else {
          minutes = this.latitude.minutes - distanceNm
        }
      // Northern hemisphere
      } else {
        // Moving south
        if(bearing == "S"){
          minutes = this.latitude.minutes - distanceNm
        // Moving north
        } else {
          minutes = this.latitude.minutes + distanceNm
        }
      }
      if (minutes != undefined){
        // Build new Coordinate instances so we don't mutate the originals
        const newLat = new Coordinate({
          degrees: this.latitude.degrees,
          minutes: minutes,
          seconds: this.latitude.seconds,
          bearing: this.latitude.bearing
        } as any)
        const newLon = new Coordinate({
          degrees: this.longitude.degrees,
          minutes: this.longitude.minutes,
          seconds: this.longitude.seconds,
          bearing: this.longitude.bearing
        } as any)
        const movePoint = new CoordinatePair([newLat, newLon])

        const balancedMovePoint = balanceDegreesMinutes(movePoint)

        // Ensure latitude/longitude computed fields are consistent by recreating them
        balancedMovePoint.latitude = new Coordinate({
          degrees: balancedMovePoint.latitude.degrees,
          minutes: balancedMovePoint.latitude.minutes,
          seconds: balancedMovePoint.latitude.seconds,
          bearing: balancedMovePoint.latitude.bearing
        } as any)
        balancedMovePoint.longitude = new Coordinate({
          degrees: balancedMovePoint.longitude.degrees,
          minutes: balancedMovePoint.longitude.minutes,
          seconds: balancedMovePoint.longitude.seconds,
          bearing: balancedMovePoint.longitude.bearing
        } as any)

        // Recalculate projection for the moved point
        try {
          const proj = balancedMovePoint.projectLatLon()
          balancedMovePoint.projection = { x: proj[0], y: proj[1] }
        } catch (e) {
          throw new Error("proj4 failed for moved point")
        }

        return balancedMovePoint
      } else {
        throw new Error("Minutes were not redefined not defined")
      }
      } else {
        throw new Error("Coordinates not defined")
      }
    }
  public justifyProjection(offset: XYPair){
    if(this.projection){
      this.projection = {
        x: this.projection.x + offset.x,
        y: this.projection.y + offset.y
      }
    } else {
      throw new Error("Coordinate does not have projection to be offset")
    }
  }
  
  public scaleProjection(scaleFactor: XYPair){
    if(this.projection){
      this.projection.scaled = {
        x: this.projection.x * scaleFactor.x,
        y: this.projection.y * scaleFactor.y
      }
    } else {
      console.error("Coordinate does not have projection to be scaled")
    }
  }

  public getBearing(endPoint: CoordinatePair): number {
    if (endPoint.longitude && endPoint.latitude && this.longitude && this.latitude){
      const deltaLongitude = endPoint.longitude.radians - this.longitude.radians;
      const y = Math.sin(deltaLongitude) * Math.cos(endPoint.latitude.radians)
      const x = Math.cos(this.latitude.radians) * Math.sin(endPoint.latitude.radians) -
        Math.sin(this.latitude.radians) * Math.cos(endPoint.latitude.radians) * Math.cos(deltaLongitude)
      let bearing = Math.atan2(y, x);
      bearing = this.toDegrees(bearing);

      // Normalize to 0-360
      return (bearing + 360) % 360;
    } else {
      throw new Error("Coordinate not defined")
    }
  }

  // Convenience helper: convert numeric latitude/longitude to Australia-centered X/Y (meters)
  private latLonToAustraliaXY(latitude: number, longitude: number) {
    if (!isFinite(latitude) || !isFinite(longitude)) throw new Error('Invalid lat/lon')
    const [x, y] = proj4(wgs84, australianProjection, [longitude, latitude])
    return { x, y }
  }
}

// Convenience helper: convert numeric latitude/longitude to Australia-centered X/Y (meters)
// helper is implemented as a private method on the class below
