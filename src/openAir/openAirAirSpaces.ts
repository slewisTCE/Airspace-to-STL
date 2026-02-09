import { setProjectionCentroid } from "./coordinatePair"
import { OpenAirAirspace } from "./openAirAirspace"

type Degrees = { degreesDecimal?: number }
type ProjectionPoint = {
  latitude?: Degrees
  longitude?: Degrees
  recomputeProjection?: () => void
}

type ShapeWithConstructor = { constructor?: { name?: string } }

function isProjectionPoint(value: unknown): value is ProjectionPoint {
  return typeof value === "object" && value !== null
}

function hasLatLon(point: ProjectionPoint): point is ProjectionPoint & { latitude: { degreesDecimal: number }, longitude: { degreesDecimal: number } } {
  return typeof point.latitude?.degreesDecimal === "number" && typeof point.longitude?.degreesDecimal === "number"
}

function getConstructorName(shape: unknown): string {
  const candidate = shape as ShapeWithConstructor
  return typeof candidate?.constructor?.name === "string" ? candidate.constructor.name : ""
}

function getProjectionPoints(shape: unknown): ProjectionPoint[] {
  const shapeName = getConstructorName(shape)
  if (shapeName === "Polygon") {
    const points = (shape as { points?: unknown }).points
    if (Array.isArray(points)) {
      return points.filter(isProjectionPoint)
    }
    if (isProjectionPoint(points)) {
      return [points]
    }
    return []
  }

  if (shapeName === "Arc") {
    const arc = shape as { center?: unknown, startPoint?: unknown, endPoint?: unknown }
    return [arc.center, arc.startPoint, arc.endPoint].filter(isProjectionPoint)
  }

  if (shapeName === "Circle") {
    const circle = shape as { center?: unknown }
    return circle.center && isProjectionPoint(circle.center) ? [circle.center] : []
  }

  return []
}

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

    // Compute centroid (lat/lon) of all coordinate pairs and switch to a local equirectangular projection
    try {
      let latSum = 0
      let lonSum = 0
      let count = 0
      for (const airspace of this.airspaces) {
        for (const shape of airspace.shapes) {
          const points = getProjectionPoints(shape)
          for (const point of points) {
            if (hasLatLon(point)) {
              latSum += point.latitude.degreesDecimal
              lonSum += point.longitude.degreesDecimal
              count += 1
            }
          }
        }
      }
      if (count > 0){
        const centroidLat = latSum / count
        const centroidLon = lonSum / count
        setProjectionCentroid(centroidLat, centroidLon)
        // Recompute projections for all coordinate pairs so shapes use the new local projection
        for (const airspace of this.airspaces) {
          for (const shape of airspace.shapes) {
            const points = getProjectionPoints(shape)
            for (const point of points) {
              if (typeof point.recomputeProjection === "function") {
                point.recomputeProjection()
              }
            }
          }
        }
      }
    } catch (e) {
      // if centroid computation fails, fall back to existing projection behavior
      console.warn('Centroid projection computation failed, using default projection', e)
    }

    for (const airspace of this.airspaces) {
      if (airspace.geometry) {
        airspace.geometry = airspace.geometry.scale(0.1, 0.1, 1)
        airspace.geometry.computeBoundingBox()
      }
    }
    this.offset = Math.abs(this.minProjection)
    this.scalingFactor = 2000.0 / (this.offset + this.maxProjection)

  }

  private splitRawAirspaceData(airspaceData: string): string[] {
    return airspaceData.split(/\n\s*\n/)
  }


  public airspaceFromName(name: string): OpenAirAirspace | undefined {
    return this.airspaces.find((airspace: OpenAirAirspace) => airspace.name === name)
  }

}