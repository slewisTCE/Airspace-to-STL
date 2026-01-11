import { Distance } from "./distance"
import type { AltitudeReference, AltitudeValues, PressureReference } from "./openAirTypes"

export class Altitude {
  maxAltitude: Distance = new Distance(60000, "feet")
  raw: string
  flightLevel?: number
  pressureReference?: PressureReference
  value: Distance
  reference?: AltitudeReference

  constructor(line: string){
    const altitude = this.parseAltitude(line)
    this.raw = altitude.raw
    this.value = new Distance(altitude.valueFeet, "feet")
    if (altitude.flightLevel){this.flightLevel = altitude.flightLevel}
    if (altitude.pressureReference){this.pressureReference = altitude.pressureReference}
    if (altitude.reference){this.reference = altitude.reference}
  }

  private parseAltitude(line: string): AltitudeValues {
    const words = line.split(' ') 
    let altitude = {
      valueFeet: 0,
      raw: line.slice(3).trim()
    }
    if(words[1].toUpperCase().startsWith("FL")){
      altitude = this.parseFlightLevel(words[1])
    } else if(words[1].toUpperCase().endsWith("FT")) {
      altitude.valueFeet = Number(words[1].slice(0,-2))
    } else if(words[1].toUpperCase().trim() == "SFC"){
      altitude.valueFeet = 0
    } else if(words[1].toUpperCase().trim() == "UNL" || words[1].toUpperCase().trim() == "UNLIMITED"){
      altitude.valueFeet = this.maxAltitude.feet
    }
    return altitude
  }

  private parseFlightLevel(flightLevelRaw: string): AltitudeValues {
    const raw = flightLevelRaw.trim()
    const flightLevel = Number(flightLevelRaw.slice(2).trim())
    return {
      raw: raw,
      flightLevel: flightLevel,
      pressureReference: "ISA",
      valueFeet: flightLevel * 100,
      reference: "MSL"
    }
  }  
}

