import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { OpenAirAirspaces } from './openAirAirSpaces'

describe('Darwin adjacency (A1 vs C6)', () => {
  it('C6 ceiling equals A1 floor (no vertical gap)', () => {
    const filePath = join(__dirname, '..', 'assets', 'Australian Airspace 28 November 2024_v1.txt')
    const airspaceDataRaw = readFileSync(filePath, 'utf8')
    const all = new OpenAirAirspaces(airspaceDataRaw as unknown as string)
    const a1 = all.airspaces.find(a => a.name.toUpperCase().includes('DARWIN CTA A1'))
    const c6 = all.airspaces.find(a => a.name.toUpperCase().includes('DARWIN CTA C6'))
    expect(a1).toBeDefined()
    expect(c6).toBeDefined()
    if (!a1 || !c6) return

    const a1FloorFeet = a1.floor.value?.feet
    const c6CeilingFeet = c6.ceiling.value?.feet
    expect(typeof a1FloorFeet).toBe('number')
    expect(typeof c6CeilingFeet).toBe('number')
    expect(a1FloorFeet).toBeCloseTo(c6CeilingFeet as number, 6)
  })
})
