import { describe, it, expect } from 'vitest'
import { Angle } from './angle'

describe('Angle', () => {
  it('constructs from degrees and exposes radians', () => {
    const a = new Angle(180, 'degrees')
    expect(a.degrees).toBe(180)
    expect(a.radians).toBeCloseTo(Math.PI, 8)
  })

  it('constructs from radians and exposes degrees', () => {
    const a = new Angle(Math.PI/2, 'radians')
    expect(a.radians).toBe(Math.PI/2)
    expect(a.degrees).toBeCloseTo(90, 8)
  })

  it('defaults to degrees when constructionType omitted', () => {
    const a = new Angle(45)
    expect(a.degrees).toBe(45)
    expect(a.radians).toBeCloseTo(Math.PI * 45 / 180, 8)
  })
})
