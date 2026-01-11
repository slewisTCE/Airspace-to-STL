import { describe, it, expect } from 'vitest'
import { Circle } from './circle'
import { Coordinate } from './coordinate'
import { CoordinatePair } from './coordinatePair'

describe('Circle', () => {
  it('calls shape.absarc with center projection and radius', () => {
    const centerLat = new Coordinate({ degrees: 25, minutes: 0, seconds: 0, bearing: 'S' })
    const centerLon = new Coordinate({ degrees: 135, minutes: 0, seconds: 0, bearing: 'E' })
    const center = new CoordinatePair([centerLat, centerLon])

    const calls: any[] = []
    const fakeShape: any = {
      absarc: (...args: any[]) => { calls.push(args); return fakeShape }
    }

    const circle = new Circle(fakeShape as any, 'DC 10', center)
    // explicitly draw path to exercise shape.absarc
    circle.drawPath(fakeShape as any, false)
    expect(calls.length).toBeGreaterThan(0)
    const args = calls[0]
    // start & end angles
      expect(args[0]).toBe(center.projection.x)
      expect(args[1]).toBe(center.projection.y)
      expect(args[2]).toBe(circle.radius.value.kiloMetres)
      expect(args[3]).toBe(0)
      expect(args[4]).toBe(Math.PI * 2)
    expect(args[5]).toBe(false)
  })
})
