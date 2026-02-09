import { describe, it, expect } from 'vitest'
import { Radius } from './radius'
import { Distance } from './distance'

describe('Radius', () => {
  it('constructs from nautical miles number', () => {
    const r = new Radius(1, 'nauticalMiles')
    expect(r.value).toBeInstanceOf(Distance)
    // 1 nautical mile = 1852 metres
    expect(r.value.metres).toBe(1852)
  })

  it('constructs from metres number', () => {
    const r = new Radius(1000, 'metres')
    expect(r.value.metres).toBe(1000)
    expect(r.value.kiloMetres).toBe(1)
  })

  it('constructs from an existing Distance', () => {
    const d = new Distance(2, 'kiloMetres')
    const r = new Radius(d)
    expect(r.value.kiloMetres).toBe(2)
    expect(r.value.metres).toBe(2000)
  })
})
