import { describe, it, expect } from 'vitest'
import { OpenAirAirspace } from './openAirAirspace'

describe('OpenAirAirspace', () => {
  const airspaceString = 
    `AC RMZƒ
    AN ADELAIDE/PARAFIELD 118.7 *TWR HRS-SEE ERSA* SA (YPPF) CERT
    AL SFC
    AH UNL
    V X=34:47:36 S  138:37:59 E
    DC 10`
  const airspace = new OpenAirAirspace(airspaceString)
  // console.warn('airspace', airspace)
  it('parses airspace locale from line starting with "AN"', () => {
    expect(airspace.locale).toBe('ADELAIDE/PARAFIELD')
  })
  it('parses airspace class from line starting with "AC"', () => {
    expect(airspace.airspaceClass.code).toBe('UNKNOWN')
    expect(airspace.airspaceClass.name).toBe('UNKNOWN')
  })
  it('parses airspace state from line starting with "AN"', () => {
    expect(airspace.state).toBe('SA')
  })
})