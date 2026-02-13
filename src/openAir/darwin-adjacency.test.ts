import { describe, it, expect } from 'vitest'

import { OpenAirAirspaces } from './openAirAirSpaces'

describe('Darwin adjacency (A1 vs C6)', () => {
  it('C6 ceiling equals A1 floor (no vertical gap)', () => {
   
    const a1 = `AC A
AN DARWIN CTA A1 [H24]
AL FL180
AH FL245
V X=12:25:24 S  130:54:23 E
DC 90.00`
    const c6 = `AC C
AN DARWIN CTA C6 [H24]
AL FL125
AH FL180
V X=12:25:24 S  130:54:23 E
DC 65.00`
    const all = new OpenAirAirspaces(`${a1}\n\n${c6}`)
    console.log(`\n${a1}\n\n${c6}`)
    console.log(all)
    const a1Airspace = all.airspaces.find(a => a.name.toUpperCase().includes('DARWIN CTA A1 [H24]'))
    const c6Airspace = all.airspaces.find(a => a.name.toUpperCase().includes('DARWIN CTA C6 [H24]'))
    expect(a1Airspace).toBeDefined()
    expect(c6Airspace).toBeDefined()
    if (!a1Airspace || !c6Airspace) return

    const a1FloorFeet = a1Airspace.floor.value?.feet
    const c6CeilingFeet = c6Airspace.ceiling.value?.feet
    expect(typeof a1FloorFeet).toBe('number')
    expect(typeof c6CeilingFeet).toBe('number')
    expect(a1FloorFeet).toBeCloseTo(c6CeilingFeet as number, 6)
  })
})
