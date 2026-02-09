import { describe, it, expect } from 'vitest'
import { Distance } from './distance'

describe('Distance conversions', () => {
  it('defaults constructor to metres when omitted', () => {
    const d = new Distance(100)
    expect(d.metres).toBe(100)
  })

  it('constructs from metres and computes other units', () => {
    const d = new Distance(1, 'metres')
    expect(d.kiloMetres).toBe(0.001)
    expect(d.feet).toBe(3.28084)
    expect(d.inches).toBe(39.3701)
    expect(d.miles).toBe(1 / 1609.34)
  })

  it('constructs from nautical miles', () => {
    const d = new Distance(1, 'nauticalMiles')
    expect(d.metres).toBe(1852)
    expect(d.nauticalMiles).toBe(1)
  })

  it('constructs from kilometres', () => {
    const d = new Distance(2, 'kiloMetres')
    expect(d.metres).toBe(2000)
    expect(d.kiloMetres).toBe(2)
  })

  it('constructs from feet and round-trips to metres', () => {
    const d = new Distance(10, 'feet')
    expect(d.metres).toBe(10 / 3.28084)
    expect(d.feet).toBe(10)
  })
})
