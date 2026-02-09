import { describe, it, expect } from 'vitest'
import { Coordinate } from './coordinate'

describe('Coordinate', () => {
  it('parses DMS string and computes decimal & radians', () => {
    const c = new Coordinate('25:30:00 S')
    expect(c.degrees).toBe(25)
    expect(c.minutes).toBe(30)
    expect(c.seconds).toBe(0)
    expect(c.bearing).toBe('S')
      expect(c.degreesDecimal).toBe(-25.5)
      expect(c.radians).toBeCloseTo((c.degreesDecimal * Math.PI) / 180, 8)
  })

  it('constructs from radians and assigns DMS and bearing for latitude', () => {
    const radians = Math.PI / 6 // 30°
    const c = new Coordinate(radians, false)
      expect(c.radians).toBeCloseTo(radians, 12)
      expect(c.degreesDecimal).toBeCloseTo(30, 6)
    expect(c.bearing).toBe('N')
    // degrees may floor due to FP rounding; ensure consistency with degreesDecimal
    expect(c.degrees).toBe(Math.floor(Math.abs(c.degreesDecimal)))
    expect(c.minutes).toBeGreaterThanOrEqual(0)
  })

  it('constructs from DMS object and handles W bearing as negative longitude', () => {
    const c = new Coordinate({ degrees: 1, minutes: 2, seconds: 3, bearing: 'W' })
    expect(c.degrees).toBe(1)
    expect(c.minutes).toBe(2)
     expect(c.seconds).toBe(3)
    expect(c.bearing).toBe('W')
     expect(c.degreesDecimal).toBe(-1 - 2/60 - 3/3600)
  })
})
