import { describe, it, expect } from 'vitest'
import { Altitude } from './altitude'

describe('Altitude', () => {
  it('parses feet value', () => {
    const a = new Altitude('ALT 1000FT')
    expect(a.raw).toBe('1000FT')
    expect(a.value.feet).toBeCloseTo(1000, 6)
  })

  it('parses surface SFC as 0 feet', () => {
    const a = new Altitude('ALT SFC')
    expect(a.raw).toBe('SFC')
    expect(a.value.feet).toBe(0)
  })

  it('parses unlimited/unl as maxAltitude', () => {
    const a1 = new Altitude('ALT UNL')
    expect(a1.raw).toBe('UNL')
    expect(a1.value.feet).toBeCloseTo(a1.maxAltitude.feet, 6)

    const a2 = new Altitude('ALT UNLIMITED')
    expect(a2.raw).toBe('UNLIMITED')
    expect(a2.value.feet).toBeCloseTo(a2.maxAltitude.feet, 6)
  })

  it('parses flight level FLxxx', () => {
    const a = new Altitude('ALT FL050')
    expect(a.raw).toBe('FL050')
    expect(a.flightLevel).toBe(50)
    expect(a.pressureReference).toBe('ISA')
    expect(a.reference).toBe('MSL')
    expect(a.value.feet).toBeCloseTo(5000, 6)
  })
})
