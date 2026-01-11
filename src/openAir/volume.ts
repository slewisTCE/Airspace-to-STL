import type { OpenAirAirspace } from "./openAirAirspace"

export class Volume {
  airspace: OpenAirAirspace
  selected: boolean = false

  constructor(airspace: OpenAirAirspace){
    this.airspace = airspace
  }
}