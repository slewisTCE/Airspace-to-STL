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



  // Normalize to 500×500 SVG space
export function normaliseToSVG(x: number, y: number, bounds: Bounds, padding=10): {x: number, y: number} {
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY
  const size = Math.max(x, y)
  const maxSpan = Math.max(spanX, spanY);
  const scale = (size - padding * 2.0) / maxSpan;
  // console.log(x, y, scale)
  const xScaled = x  / scale - padding;
  const yScaled = y / scale - padding;

  return {
    x: xScaled,
    y: -1 * yScaled // Flip Y for SVG coordinate space
  };
}