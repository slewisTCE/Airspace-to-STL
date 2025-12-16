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
  radius: number
  angleStart: number
  angleEnd: number
}

export type ArcFromCoordinates = {
  startPoint: CoordinatePair
  endPoint: CoordinatePair
  center: CoordinatePair
  direction: Direction
}

export type Polygon = {
  points: CoordinatePair[]
}

export type Circle = {
  radius: Number
  center: CoordinatePair
}

export type Shape = {
  shape: ArcFromRadiusAngles | ArcFromCoordinates | Polygon | Circle,
  shapeType: "ArcFromRadiusAngles" | "ArcFromCoordinates" | "Polygon" | "Circle"
}