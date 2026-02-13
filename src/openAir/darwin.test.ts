import { describe, it, expect } from 'vitest'

import { OpenAirAirspace } from './openAirAirspace'

describe('Darwin CTA A1 altitudes', () => {
  it('parses default floor and ceiling correctly from OpenAir file', () => {
    const airspaceDataRaw = `AC A
                            AN DARWIN CTA A1 [H24]
                            AL FL180
                            AH FL245
                            V X=12:25:24 S  130:54:23 E
                            DC 90.00`
    const darwin = new OpenAirAirspace(airspaceDataRaw as unknown as string)
    
    expect(darwin).toBeDefined()
    if (!darwin) return
    expect(darwin.floor.value.feet).toBeCloseTo(18000, 6)
    expect(darwin.ceiling.value.feet).toBeCloseTo(24500, 6)
  })
})
