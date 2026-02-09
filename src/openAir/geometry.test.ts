import { describe, it, expect } from 'vitest'
import { Geometry } from './geometry'

describe('Geometry utilities', () => {
  const g = new Geometry()

  it('converts radians to degrees', () => {
    expect(g.toDegrees(Math.PI)).toBe(180)
    expect(g.toDegrees(Math.PI/2)).toBe(90)
  })

  it('converts degrees to radians', () => {
    expect(g.toRadians(180)).toBe(Math.PI)
    expect(g.toRadians(90)).toBe(Math.PI/2)
  })

  it('computes Euclidean distance', () => {
    expect(g.distanceBetweenTwoPoints(0,0,3,4)).toBe(5)
    expect(g.distanceBetweenTwoPoints(1,1,4,5)).toBe(5)
  })
})
