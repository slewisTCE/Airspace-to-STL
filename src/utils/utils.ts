import type { OpenAirAirspace } from "../openAir";

export function airspaceFromName(airspaces: OpenAirAirspace[], name: string): OpenAirAirspace | undefined {
  return airspaces.find((airspace: OpenAirAirspace) => airspace.name === name)
}

export function removeHeader(airspaceText: string): string {
  console.log(airspaceText)
  const splitText = airspaceText.split(/\n\s*\n/)
  console.log(splitText)
  return splitText[-1]
}

export function formatFeet(value: number): string {
  return `${value} ft`;
}

export function splitRawAirspaceData(airspaceData: string): string[] {
  return airspaceData.split(/\n\s*\n/)
}