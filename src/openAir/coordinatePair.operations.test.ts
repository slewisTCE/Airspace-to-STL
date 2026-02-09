import { describe, it, expect } from 'vitest'
import { CoordinatePair } from './coordinatePair'
import { Coordinate } from './coordinate'

describe('CoordinatePair operations', () => {
  it('moveNorth updates latitude minutes and returns a new CoordinatePair', () => {
    const lat = new Coordinate({ degrees: 0, minutes: 0, seconds: 0, bearing: 'N' })
    const lon = new Coordinate({ degrees: 0, minutes: 0, seconds: 0, bearing: 'E' })
    const pair = new CoordinatePair([lat, lon])
    const moved = pair.moveNorth(10)
    expect(moved).not.toBe(pair)
    expect(moved.latitude.degrees).toBe(0)
    expect(moved.latitude.minutes).toBe(10)
    // original unchanged
    expect(pair.latitude.minutes).toBe(0)
  })

  it('justifyProjection and scaleProjection modify projection correctly', () => {
    const lat = new Coordinate({ degrees: 25, minutes: 0, seconds: 0, bearing: 'S' })
    const lon = new Coordinate({ degrees: 135, minutes: 0, seconds: 0, bearing: 'E' })
    const pair = new CoordinatePair([lat, lon])

    // start near origin (projection approx 0,0)
    pair.justifyProjection({ x: 10, y: 20 })
    expect(pair.projection.x).toBe(10)
    expect(pair.projection.y).toBe(20)

    pair.scaleProjection({ x: 2, y: 3 })
    expect(pair.projection.scaled?.x).toBe(20)
    expect(pair.projection.scaled?.y).toBe(60)
  })
})
