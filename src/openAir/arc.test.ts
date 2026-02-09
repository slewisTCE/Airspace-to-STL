import { describe, it, expect } from 'vitest'
import { Arc } from './arc'
import { Coordinate } from './coordinate'
import { CoordinatePair } from './coordinatePair'

describe('Arc', () => {
  it('calls shape.absarc with expected args when constructed from points', () => {
    const centerLat = new Coordinate({ degrees: 25, minutes: 0, seconds: 0, bearing: 'S' })
    const centerLon = new Coordinate({ degrees: 135, minutes: 0, seconds: 0, bearing: 'E' })
    const center = new CoordinatePair([centerLat, centerLon])

    const startLat = new Coordinate({ degrees: 25.1, minutes: 0, seconds: 0, bearing: 'S' })
    const startLon = new Coordinate({ degrees: 135, minutes: 0, seconds: 0, bearing: 'E' })
    const start = new CoordinatePair([startLat, startLon])

    const endLat = new Coordinate({ degrees: 25, minutes: 0, seconds: 0, bearing: 'S' })
    const endLon = new Coordinate({ degrees: 135.1, minutes: 0, seconds: 0, bearing: 'E' })
    const end = new CoordinatePair([endLat, endLon])

    const calls: any[] = []
    const fakeShape: any = {
      curves: [],
      moveTo: (...args: any[]) => { calls.push(['moveTo', ...args]); return fakeShape },
      lineTo: (...args: any[]) => { calls.push(['lineTo', ...args]); return fakeShape },
      absarc: (...args: any[]) => { calls.push(['absarc', ...args]); return fakeShape }
    }

    const arc = new Arc(fakeShape as any, [start, end], 'clockwise', center)
    // explicitly draw path to exercise shape methods
    arc.drawPath(fakeShape as any, false)
    expect(calls.length).toBeGreaterThan(0)
    // find the absarc call
    const absarcCall = calls.find((c) => c[0] === 'absarc')
    expect(absarcCall).toBeDefined()
    const args = absarcCall!.slice(1)
    // center projection should be used as first two args
      expect(args[0]).toBe(center.projection.x)
      expect(args[1]).toBe(center.projection.y)
      expect(args[2]).toBe(arc.radius.value.kiloMetres)
      expect(args[3]).toBe(arc.startAngle.radians)
      expect(args[4]).toBe(arc.endAngle.radians)
  })
})
