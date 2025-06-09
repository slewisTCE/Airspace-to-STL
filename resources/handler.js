import { state } from './state.js';

import proj4 from 'proj4';

// // Define coordinate systems
// proj4.defs("WGS84", "+proj=longlat +datum=WGS84 +no_defs");
// proj4.defs("UTM50S", "+proj=utm +zone=50 +south +datum=WGS84");

// proj4.defs("GDA94", "+proj=aea +lat_1=-18 +lat_2=-36 +lat_0=0 +lon_0=135 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs");
// proj4.defs("EPSG:3577", "+proj=aea +lat_1=-18 +lat_2=-36 +lat_0=0 +lon_0=132 +x_0=0 +y_0=0 +datum=GDA94 +units=m +no_defs");

proj4.defs("CustomUTM", "+proj=tmerc +lat_0=0 +lon_0=153 +k=0.9996 +x_0=500000 +y_0=10000000 +datum=WGS84 +units=m +no_defs");




export function extractAirspaceClasses() {
    if (!state.content) return [];
    const airspaceClasses = new Set(
        state.content
            .split("\n")
            .filter(line => line.startsWith("AC "))
            .map(line => line.slice(3).trim())
    );
    return Array.from(airspaceClasses);
}

export function extractAirspaceNames(filterClass = null) {
    const airspaceNames = [];

    state.blocks.forEach(block => {
        const lines = block.trim().split("\n");
        const nameLine = lines.find(line => line.startsWith("AN "));
        const classLine = lines.find(line => line.startsWith("AC "));

        if (nameLine) {
            const name = nameLine.slice(3).trim();
            const airspaceClass = classLine ? classLine.slice(3).trim() : null;

            if (!filterClass || airspaceClass === filterClass) {
                airspaceNames.push(name);
            }
        }
    });

    return airspaceNames;
}

// Helper to convert DMS to decimal
function dmsToDecimal(dmsStr) {
    const match = dmsStr.match(/(\d+):(\d+):([\d.]+) ([NSWE])/);
    if (!match) return null;

    let [, deg, min, sec, dir] = match;
    let decimal = (+deg) + (+min) / 60 + (+sec) / 3600;
    if (dir === 'S' || dir === 'W') decimal *= -1;
    return decimal;
}

function projectLatLon(latDMS, lonDMS) {
    const lat = dmsToDecimal(latDMS);
    const lon = dmsToDecimal(lonDMS);
  
    if (!isFinite(lat) || !isFinite(lon)) {
      console.warn("Invalid lat/lon for projection:", { latDMS, lonDMS, lat, lon });
      return null;
    }
  
    try {
      // const [x, y] = proj4("WGS84", "UTM50S", [lon, lat]);
      // const [x, y] = proj4("WGS84", "EPSG:3577", [lon, lat]);
      const [x, y] = proj4("WGS84", "CustomUTM", [lon, lat]);
      return `${x.toFixed(2)} ${y.toFixed(2)}`;
    } catch (e) {
      console.error("proj4 failed:", e, { lat, lon });
      return null;
    }
  }

function parseAirspaceToSegments(finalOutput) {
    const lines = finalOutput.split('\n');
    const segments = [];

    let currentDirection = null;
    let currentCenter = null;

    for (const line of lines) {
        if (line.startsWith('V D=')) {
            currentDirection = line.includes('+') ? 1 : 0;
        } else if (line.startsWith('V X=')) {
            const [x, y] = line.slice(4).trim().split(/\s+/).map(Number);

            currentCenter = { cx: x, cy: y };
        } else if (line.startsWith('DP ')) {
            const [x, y] = line.slice(3).trim().split(/\s+/).map(Number);

            segments.push({ type: 'point', x, y });
        } else if (line.startsWith('DC ')) {
            const [r] = line.slice(3).trim().split(/\s+/).map(Number);

            segments.push({
                type: 'circle',
                cx: currentCenter && currentCenter.cx,
                cy: currentCenter && currentCenter.cy,
                r
            });
        } else if (line.startsWith('DB ')) {
            const parts = line.slice(3).split(',');
            const [x1, y1] = parts[0].trim().split(/\s+/).map(Number);
            const [x2, y2] = parts[1].trim().split(/\s+/).map(Number);
            segments.push({
                type: 'arc',
                x1, y1, x2, y2,
                cx: currentCenter && currentCenter.cx,
                cy: currentCenter && currentCenter.cy,
                direction: currentDirection
            });
        }
    }

    return segments;
}

function getBoundingBox(segments) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const seg of segments) {
        if (seg.type === 'point') {
            minX = Math.min(minX, seg.x);
            maxX = Math.max(maxX, seg.x);
            minY = Math.min(minY, seg.y);
            maxY = Math.max(maxY, seg.y);

        } else if (seg.type === 'arc') {
            const r = Math.hypot(seg.cx - seg.x1, seg.cy - seg.y1);
            minX = Math.min(minX, seg.cx - r, seg.x1, seg.x2);
            maxX = Math.max(maxX, seg.cx + r, seg.x1, seg.x2);
            minY = Math.min(minY, seg.cy - r, seg.y1, seg.y2);
            maxY = Math.max(maxY, seg.cy + r, seg.y1, seg.y2);

        } else if (seg.type === 'circle') {
            const { cx, cy, r } = seg;
            minX = Math.min(minX, cx - r);
            maxX = Math.max(maxX, cx + r);
            minY = Math.min(minY, cy - r);
            maxY = Math.max(maxY, cy + r);
        }
    }

    return { minX, maxX, minY, maxY };
} 

function normalizeToSVG(x, y, bounds) {
    const spanX = bounds.maxX - bounds.minX;
    const spanY = bounds.maxY - bounds.minY;
    const maxSpan = Math.max(spanX, spanY);
    const padding = 0; // or set to something like 10 for breathing room
    const size = 500;

    const scale = (size - padding * 2) / maxSpan;

    const xScaled = (x - bounds.minX) * scale + padding;
    const yScaled = (y - bounds.minY) * scale + padding;

    return {
        x: xScaled,
        y: size - yScaled // Flip Y for SVG coordinate space
    };
}
  
function normalizeSegments(segments, bounds) {
    return segments.map(seg => {
      if (seg.type === 'point') {
        const { x, y } = normalizeToSVG(seg.x, seg.y, bounds);
        return { type: 'point', x, y };
      }
  
      if (seg.type === 'arc') {
        const start = normalizeToSVG(seg.x1, seg.y1, bounds);
        const end = normalizeToSVG(seg.x2, seg.y2, bounds);
        const center = (seg.cx != null && seg.cy != null)
          ? normalizeToSVG(seg.cx, seg.cy, bounds)
          : { x: null, y: null };
  
        return {
          type: 'arc',
          x1: start.x,
          y1: start.y,
          x2: end.x,
          y2: end.y,
          cx: center.x,
          cy: center.y,
          direction: seg.direction
        };
      }

      if (seg.type === 'circle') {
        const { x, y } = normalizeToSVG(seg.cx, seg.cy, bounds);
        return { 
            type: 'circle', 
            cx: x,
            cy: y,
            r: seg.r
        };
      }
  
      return seg; // fallback, should not happen
    });
}

function segmentsToSVGPath(segments) {
    if (!segments.length) return '';
  
    let path = '';
    let hasMoved = false;
  
    for (const seg of segments) {
      if (seg.type === 'point') {
        if (!hasMoved) {
          path += `M ${seg.x} ${seg.y} `;
          hasMoved = true;
        } else {
          path += `L ${seg.x} ${seg.y} `;
        }
  
      } else if (seg.type === 'arc') {
        const { x1, y1, x2, y2, cx, cy, direction } = seg;
      
        const rx = Math.hypot(x1 - cx, y1 - cy);
        const ry = rx;
      
        const angle1 = Math.atan2(y1 - cy, x1 - cx);
        const angle2 = Math.atan2(y2 - cy, x2 - cx);
      
        let delta = angle2 - angle1;
        if (direction === 1 && delta < 0) delta += 2 * Math.PI;
        if (direction === 0 && delta > 0) delta -= 2 * Math.PI;
      
        const largeArcFlag = Math.abs(delta) > Math.PI ? 1 : 0;
        const sweepFlag = direction;
      
        path += `L ${x1} ${y1} `;
        path += `A ${rx} ${ry} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2} `;
      } else if (seg.type === 'circle') {
        const { cx, cy, r } = seg;
        const startX = cx + r;
        const startY = cy;
  
        return `
          M ${startX} ${startY}
          A ${r} ${r} 0 1 0 ${cx - r} ${cy}
          A ${r} ${r} 0 1 0 ${startX} ${startY}
        `;
      }
    }
  
    return path.trim();
  }
  

// Main function
export function getAirspaceDetailsByName(name) {
    const block = state.blocks.find(block => {
        const lines = block.trim().split("\n");
        const nameLine = lines.find(line => line.startsWith("AN "));
        return nameLine && nameLine.slice(3).trim() === name;
    });

    if (!block) {
        console.log(`No airspace found with the name "${name}".`);
        return;
    }

    const lines = block.trim().split("\n").map(line => {
        const dpMatch = line.match(/DP (.+?) ([NS])\s+(.+?) ([EW])/);
        const dbMatch = line.match(/DB (.+?) ([NS])\s+(.+?) ([EW]),\s+(.+?) ([NS])\s+(.+?) ([EW])/);
        const dcMatch = line.match(/DC\s+([\d.]+)/);
        const vxMatch = line.match(/V X=(.+?) ([NS])\s+(.+?) ([EW])/);

        if (dpMatch) {
            const projected = projectLatLon(`${dpMatch[1]} ${dpMatch[2]}`, `${dpMatch[3]} ${dpMatch[4]}`);
            return projected ? `DP ${projected}` : line;
        } else if (dbMatch) {
            const start = projectLatLon(`${dbMatch[1]} ${dbMatch[2]}`, `${dbMatch[3]} ${dbMatch[4]}`);
            const end = projectLatLon(`${dbMatch[5]} ${dbMatch[6]}`, `${dbMatch[7]} ${dbMatch[8]}`);
            return (start && end) ? `DB ${start}, ${end}` : line;
        } else if (dcMatch) {
            return `DC ${dcMatch[1]}`;
        } else if (vxMatch) {
            const projected = projectLatLon(`${vxMatch[1]} ${vxMatch[2]}`, `${vxMatch[3]} ${vxMatch[4]}`);
            return projected ? `V X=${projected}` : line;
        }

        return line;
    });

    const finalOutput = lines.join("\n");
    return finalOutput;
}

export function getBasicDetails(name) {
  const block = state.blocks.find(block => {
      const lines = block.trim().split("\n");
      const nameLine = lines.find(line => line.startsWith("AN "));
      return nameLine && nameLine.slice(3).trim() === name;
  });

  if (!block) {
      console.log(`No airspace found with the name "${name}".`);
      return;
  }

  return block;
}

export function createSVGPath(param){
    const rawDetails = getAirspaceDetailsByName(param);
    const rawSegments = parseAirspaceToSegments(rawDetails);
    const bounds = getBoundingBox(rawSegments);
    const segments = normalizeSegments(rawSegments, bounds);
    const svgoutput = segmentsToSVGPath(segments);
    console.log(svgoutput);
    return svgoutput;
}