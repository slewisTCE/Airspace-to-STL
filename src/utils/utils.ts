import type { Bounds } from "../types/types";

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

  // Normalize to 500×500 SVG space
export function normalizeToSVG(x: number, y: number, bounds: Bounds, padding=10, size=500): {x: number, y: number} {
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  const maxSpan = Math.max(spanX, spanY);
  const scale = (size - padding * 2) / maxSpan;
  const xScaled = (x - bounds.minX) * scale + padding;
  const yScaled = (y - bounds.minY) * scale + padding;

  return {
    x: xScaled,
    y: size - yScaled // Flip Y for SVG coordinate space
  };
}