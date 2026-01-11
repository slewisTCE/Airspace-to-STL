import { describe, it, expect } from 'vitest'
import { Polygon } from './polygon'
import { Shape } from 'three'

function normalizeSpaces(s: string){ return s.replace(/\s+/g,' ').trim() }

describe.skip('Polygon.generatePolygonSvgPathSegment', () => {
  it('builds unscaled path from point projections', () => {
    const shape = new Shape()
    const points: any[] = [
      { projection: { x: 10, y: 20 } },
      { projection: { x: 30, y: 40 } }
    ]
    const polygon = new Polygon(shape as any, points as any)
    const seg = polygon.generatePolygonSvgPathSegment(polygon, false)
    expect(normalizeSpaces(seg)).toBe(normalizeSpaces('L 10 20 L 30 40'))
  })

  it('builds scaled path from scaled projections', () => {
    const shape = new Shape()
    const points: any[] = [
      { projection: { scaled: { x: 1.5, y: 2.5 } } },
      { projection: { scaled: { x: 3.5, y: 4.5 } } }
    ]
    const polygon = new Polygon(shape as any, points as any)
    const seg = polygon.generatePolygonSvgPathSegment(polygon, true)
    expect(normalizeSpaces(seg)).toBe(normalizeSpaces('L 1.5 2.5 L 3.5 4.5'))
  })
})
