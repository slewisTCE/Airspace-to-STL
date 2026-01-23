import { setProjectionCentroid } from "./coordinatePair"
import { OpenAirAirspace } from "./openAirAirspace"

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
      this.airspaces.forEach((airspace)=>{
        airspace.shapes.forEach((shape)=>{
          if (shape.constructor.name === 'Polygon'){
            const poly = shape as any
            poly.points.forEach((p: any)=>{
              if (p && p.latitude && p.longitude && typeof p.latitude.degreesDecimal === 'number'){
                latSum += p.latitude.degreesDecimal
                lonSum += p.longitude.degreesDecimal
                count += 1
              }
            })
          } else if (shape.constructor.name === 'Arc'){
            const arc = shape as any
            const pts = [arc.center, arc.startPoint, arc.endPoint]
            pts.forEach((p: any)=>{
              if (p && p.latitude && p.longitude && typeof p.latitude.degreesDecimal === 'number'){
                latSum += p.latitude.degreesDecimal
                lonSum += p.longitude.degreesDecimal
                count += 1
              }
            })
          } else if (shape.constructor.name === 'Circle'){
            const circle = shape as any
            const p = circle.center
            if (p && p.latitude && p.longitude && typeof p.latitude.degreesDecimal === 'number'){
              latSum += p.latitude.degreesDecimal
              lonSum += p.longitude.degreesDecimal
              count += 1
            }
          }
        })
      })
      if (count > 0){
        const centroidLat = latSum / count
        const centroidLon = lonSum / count
        setProjectionCentroid(centroidLat, centroidLon)
        // Recompute projections for all coordinate pairs so shapes use the new local projection
        this.airspaces.forEach((airspace)=>{
          airspace.shapes.forEach((shape)=>{
            if (shape.constructor.name === 'Polygon'){
              const poly = shape as any
              poly.points.forEach((p: any)=>{ if (p && typeof p.recomputeProjection === 'function') p.recomputeProjection() })
            } else if (shape.constructor.name === 'Arc'){
              const arc = shape as any
              const pts = [arc.center, arc.startPoint, arc.endPoint]
              pts.forEach((p: any)=>{ if (p && typeof p.recomputeProjection === 'function') p.recomputeProjection() })
            } else if (shape.constructor.name === 'Circle'){
              const circle = shape as any
              const p = circle.center
              if (p && typeof p.recomputeProjection === 'function') p.recomputeProjection()
            }
          })
        })
      }
    } catch (e) {
      // if centroid computation fails, fall back to existing projection behavior
      console.warn('Centroid projection computation failed, using default projection', e)
    }

    this.airspaces.map((airspace)=>{
      if(airspace.geometry){
        airspace.geometry = airspace.geometry.scale(0.1, 0.1, 1)
        airspace.geometry.computeBoundingBox()
      }
    })
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