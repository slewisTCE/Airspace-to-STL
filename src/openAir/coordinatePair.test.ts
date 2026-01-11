import { describe, it, expect } from 'vitest'
import { CoordinatePair } from './coordinatePair'
import { Coordinate } from './coordinate'

describe('CoordinatePair projection', () => {
  it('projects center -25,135 to approximately 0,0', () => {
    const lat = new Coordinate({ degrees: 25, minutes: 0, seconds: 0, bearing: 'S' })
    const lon = new Coordinate({ degrees: 135, minutes: 0, seconds: 0, bearing: 'E' })
    const pair = new CoordinatePair([lat, lon])
    expect(Math.abs(pair.projection.x)).toBeLessThan(1e-6)
    expect(Math.abs(pair.projection.y)).toBeLessThan(1e-6)
  })
})
