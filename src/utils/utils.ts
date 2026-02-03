import type { Envelope } from "../openAir/openAirTypes";
import type { Bounds } from "../types/types";

export function removeHeader(airspaceText: string): string {
  const splitText = airspaceText.split(/\n\s*\n/)
  return splitText[-1]
}

export function formatFeet(value: number): string {
  return `${Math.round(value)} ft`;
}

  // Normalize to 500×500 SVG space
export function normaliseToSVG(x: number, y: number, bounds: Bounds, padding=10): {x: number, y: number} {
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY
  const size = Math.max(x, y)
  const maxSpan = Math.max(spanX, spanY);
  const scale = (size - padding * 2.0) / maxSpan;
  const xScaled = x  / scale - padding;
  const yScaled = y / scale - padding;

  return {
    x: xScaled,
    y: -1 * yScaled // Flip Y for SVG coordinate space
  };
}



export function feetToNauticalMiles(feet: number): number {
  return feet / 6076.12
}

export function floorCeilingToDepthFloor(envelope: Envelope, scalingFactor: number): [number, number] {
   const depth = feetToNauticalMiles((envelope.ceiling*scalingFactor) - (envelope.floor*scalingFactor))
   const floor = feetToNauticalMiles(envelope.floor*scalingFactor)
   return [depth, floor]
}


export function downloadBlob(blob: Blob, fileName: string){
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.href = URL.createObjectURL(blob);
    link.download = fileName
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
