import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { OpenAirAirspaces } from './openAirAirSpaces'

describe('Darwin CTA A1 altitudes', () => {
  it('parses default floor and ceiling correctly from OpenAir file', () => {
    const filePath = join(__dirname, '..', 'assets', 'Australian Airspace 28 November 2024_v1.txt')
    const airspaceDataRaw = readFileSync(filePath, 'utf8')
    const all = new OpenAirAirspaces(airspaceDataRaw as unknown as string)
    const darwin = all.airspaces.find(a => a.name.toUpperCase().includes('DARWIN CTA A1 [H24]'))
    if (!darwin) {
      // Dump first 30 names for debugging
      // eslint-disable-next-line no-console
      console.log('Airspace names (first 30):', all.airspaces.map(a=>a.name).slice(0,30))
    }
    expect(darwin).toBeDefined()
    if (!darwin) return
    expect(darwin.floor.value.feet).toBeCloseTo(18000, 6)
    expect(darwin.ceiling.value.feet).toBeCloseTo(24500, 6)
  })
})
