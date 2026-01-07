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

export type CompassPoint = "N" | "E" | "S" | "W"

export type Coordinate = {
  direction: CompassPoint
  measurement: {
    degrees: number
    minutes: number
    seconds: number
  }
}

export type CoordinatePair = {
  latitude: Coordinate
  longitude: Coordinate
  projection?: ProjectionPair
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

export type ArcAngles = {
  startAngle: number,
  endAngle: number
}

export type Polygon = {
  points: CoordinatePair[]
}

export type Circle = {
  radius: { 
    value: number,
    projection: {
      value?: number, 
      scaled?: number 
    }
  }
  center: CoordinatePair
  arcStartPoint?: CoordinatePair
  arcEndPoint?: CoordinatePair
}

export type Shape = {
  shape: ArcFromRadiusAngles | ArcFromCoordinates | Polygon | Circle,
  svgPathSegment?: string,
  svgPathSegmentScaled?: string,
  shapeType: "ArcFromRadiusAngles" | "ArcFromCoordinates" | "Polygon" | "Circle"
}

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