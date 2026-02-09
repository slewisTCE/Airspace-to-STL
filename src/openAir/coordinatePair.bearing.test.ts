import { describe, it, expect } from 'vitest'
import { CoordinatePair } from './coordinatePair'
import { Coordinate } from './coordinate'

function C(latDeg: number, latDir: 'N'|'S', lonDeg: number, lonDir: 'E'|'W'){
  const lat = new Coordinate({ degrees: Math.abs(latDeg), minutes: 0, seconds: 0, bearing: latDir })
  const lon = new Coordinate({ degrees: Math.abs(lonDeg), minutes: 0, seconds: 0, bearing: lonDir })
  return new CoordinatePair([lat, lon])
}

describe('CoordinatePair.getBearing', () => {
  it('north (0°) from equator to 10N', () => {
    const a = C(0, 'N', 0, 'E')
    const b = C(10, 'N', 0, 'E')
    const bearing = a.getBearing(b)
    expect(Math.abs(bearing - 0)).toBeLessThan(1e-6)
  })

  it('east (90°) from equator to 10E', () => {
    const a = C(0, 'N', 0, 'E')
    const b = C(0, 'N', 10, 'E')
    const bearing = a.getBearing(b)
    expect(Math.abs(bearing - 90)).toBeLessThan(1e-6)
  })

  it('south (180°) from 10N down to equator', () => {
    const a = C(10, 'N', 0, 'E')
    const b = C(0, 'N', 0, 'E')
    const bearing = a.getBearing(b)
    expect(Math.abs(bearing - 180)).toBeLessThan(1e-6)
  })

  it('west (270°) from 0,10E to 0,0', () => {
    const a = C(0, 'N', 10, 'E')
    const b = C(0, 'N', 0, 'E')
    const bearing = a.getBearing(b)
    expect(Math.abs(bearing - 270)).toBeLessThan(1e-6)
  })

  it('diagonal approx (45°) small distance', () => {
    const a = C(0, 'N', 0, 'E')
    const b = C(1, 'N', 1, 'E')
    const bearing = a.getBearing(b)
    expect(Math.abs(bearing - 45)).toBeLessThan(1) // allow ~1° tolerance
  })
})
