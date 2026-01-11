import { Path, type CircleGeometry } from "three"
import type { Arc } from "./arc"
import type { Circle } from "./circle"
import type { CoordinatePair } from "./coordinatePair"
import type { Polygon } from "./polygon"
import type { Angle } from "./angle"
import * as THREE from "three"

export type OpenAirClassCode = "R" | "Q" | "P" | "A" | "B" | "C" | "D" | "GP" | "CTR" | "W" | "UNKNOWN"
export type OpenAirClassName = 
  "Restricted" | 
  "Danger" | 
  "Prohibited" | 
  "Class A" | 
  "Class B" | 
  "Class C" | 
  "Class D" | 
  "Class E" | 
  "Class F" | 
  "Class G" | 
  "Glider prohibited" | 
  "CTR" | 
  "Wave window" | 
  "UNKNOWN"

export type OpenAirAirspaceClass = {
  code: OpenAirClassCode
  name: OpenAirClassName
  description?: string
}

export type AltitudeReference = "MSL" | "AGL" | "SFC" | "GND" | "UNL" | "UNLIMITED" | "NOTAM" | "BCTA" | "NONE"

export type Altitude = {
  raw: string
  valueFeet: number | null
  reference?: AltitudeReference
  flightLevel?: number | null
  pressureReference?: "QNH" | "ISA"
}

export type Envelope = {
  floor: number,
  ceiling: number
}

export type CompassPoint = "N" | "E" | "S" | "W"

export type DMSBearing = {
  degrees: number,
  minutes: number,
  seconds: number,
  bearing: CompassPoint
}

export type ProjectionPair = {
  x: number,
  y: number,
  scaled?: XYPair
}
export type Projection = {
  value: number,
  scaled?: number
}
export type XYPair = {
  x: number,
  y: number
}

export type Direction = "clockwise" | "anti-clockwise"

export type ArcFromRadiusAngles = {
  radius: number
  angleStart: number
  angleEnd: number
  center: CoordinatePair
  direction: Direction
}

export type ArcFromRadiusAnglesPartial = {
  radius: { original: number, scaled: number }
  angleStart: number
  angleEnd: number
}

export type ArcFromCoordinates = {
  startPoint: CoordinatePair
  endPoint: CoordinatePair
  center: CoordinatePair
  direction: Direction
  angles?: {
    startAngle: number,
    endAngle: number,
    arcAngle: number,
    largeArc: boolean
  }
}

export type CircleGeometryType = {
  value: CircleGeometry
  projection: {
    value: CircleGeometry, 
    scaled?: CircleGeometry 
  }
}

export type ParseArcRadiusAnglesResult = {
  radius: number
  startAngle: number
  endAngle: number
}

export type ParseArcCoordinatesResult = {
  startPoint: CoordinatePair
  endPoint: CoordinatePair
}

export type PathType = {
  projection: {
    value: THREE.Shape, 
    scaled?: THREE.Shape 
  }
} 

export type ArcAngles = {
  startAngle: Angle,
  endAngle: Angle
}

export type ShapesType = (Arc | Circle | Polygon)

export type ShapeIndexes = {
    directionIndexes: number[];
    centerIndexes: number[];
    allPolygonIndexes: number[];
    polygonStartIndexes: number[];
    arcFromCoordinatesStartIndexes: number[];
    arcFromRadiusAnglesStartIndexes: number[];
    circleStartIndexes: number[];
    allAirwaySegmentIndexes: number[];
    airwaySegmentStartIndexes: number[];
}

export type AltitudeValues = {
  raw: string
  flightLevel?: number
  pressureReference?: PressureReference
  valueFeet: number
  reference?: AltitudeReference
}

export type PressureReference = "ISA"