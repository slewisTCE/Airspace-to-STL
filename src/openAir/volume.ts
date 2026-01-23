import type { OpenAirAirspace } from "./openAirAirspace"
import { Arc } from "./arc"
import { Circle } from "./circle"
import { Polygon } from "./polygon"
import type { CoordinatePair } from "./coordinatePair"

export type VolumeCentroid = { lat: number, lon: number }
export type VolumeProjectedCentroid = { x: number, y: number }

export class Volume {
  airspace: OpenAirAirspace
  selected: boolean = false

  constructor(airspace: OpenAirAirspace){
    this.airspace = airspace
  }

  private static addLatLon(point: CoordinatePair | undefined, accumulator: { latSum: number, lonSum: number, count: number }){
    if (point && point.latitude && point.longitude && typeof point.latitude.degreesDecimal === 'number'){
      accumulator.latSum += point.latitude.degreesDecimal
      accumulator.lonSum += point.longitude.degreesDecimal
      accumulator.count += 1
    }
  }

  private static addProjection(point: CoordinatePair | undefined, accumulator: { xSum: number, ySum: number, count: number }){
    if (point && point.projection && typeof point.projection.x === 'number' && typeof point.projection.y === 'number'){
      accumulator.xSum += point.projection.x
      accumulator.ySum += point.projection.y
      accumulator.count += 1
    }
  }

  private static getVolumeCentroid(volume: Volume): VolumeCentroid | undefined {
    const accumulator = { latSum: 0, lonSum: 0, count: 0 }

    for (const shape of volume.airspace.shapes) {
      if (shape instanceof Polygon) {
        Volume.addLatLon(shape.points, accumulator)
      } else if (shape instanceof Arc) {
        const points = [shape.center, shape.startPoint, shape.endPoint]
        for (const point of points) {
          Volume.addLatLon(point, accumulator)
        }
      } else if (shape instanceof Circle) {
        Volume.addLatLon(shape.center, accumulator)
      }
    }

    if (accumulator.count === 0) return undefined
    return { lat: accumulator.latSum / accumulator.count, lon: accumulator.lonSum / accumulator.count }
  }

  private static getVolumeProjectedCentroid(volume: Volume): VolumeProjectedCentroid | undefined {
    const accumulator = { xSum: 0, ySum: 0, count: 0 }

    for (const shape of volume.airspace.shapes) {
      if (shape instanceof Polygon) {
        Volume.addProjection(shape.points, accumulator)
      } else if (shape instanceof Arc) {
        const points = [shape.center, shape.startPoint, shape.endPoint]
        for (const point of points) {
          Volume.addProjection(point, accumulator)
        }
      } else if (shape instanceof Circle) {
        Volume.addProjection(shape.center, accumulator)
      }
    }

    if (accumulator.count === 0) return undefined
    return { x: accumulator.xSum / accumulator.count, y: accumulator.ySum / accumulator.count }
  }

  public static getCombinedCentroid(volumes: Volume[]): VolumeCentroid | undefined {
    let latSum = 0
    let lonSum = 0
    let count = 0

    for (const volume of volumes) {
      const centroid = Volume.getVolumeCentroid(volume)
      if (centroid) {
        latSum += centroid.lat
        lonSum += centroid.lon
        count += 1
      }
    }

    if (count === 0) return undefined
    return { lat: latSum / count, lon: lonSum / count }
  }

  public static getCombinedProjectedCentroid(volumes: Volume[]): VolumeProjectedCentroid | undefined {
    let xSum = 0
    let ySum = 0
    let count = 0

    for (const volume of volumes) {
      const centroid = Volume.getVolumeProjectedCentroid(volume)
      if (centroid) {
        xSum += centroid.x
        ySum += centroid.y
        count += 1
      }
    }

    if (count === 0) return undefined
    return { x: xSum / count, y: ySum / count }
  }
}