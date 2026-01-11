import type { OpenAirAirspace } from "./openAirAirspace";

export function airspaceFromName(airspaces: OpenAirAirspace[], name: string): OpenAirAirspace | undefined {
  return airspaces.find((airspace: OpenAirAirspace) => airspace.name === name)
}



