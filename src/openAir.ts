import type { Altitude, ArcFromCoordinates, ArcFromRadiusAngles, ArcFromRadiusAnglesPartial, Circle, CompassPoint, Coordinate, CoordinatePair, Direction, OpenAirAirspaceClass, OpenAirClassName, Polygon, Shape } from "./types/openAirTypes"


export const airspaceClassMap = {
  R: "Restricted",
  Q: "Danger",
  P: "Prohibited",
  A:"Class A",
  B:"Class B",
  C:"Class C",
  D:"Class D",
  E:"Class E",
  F:"Class F",
  G:"Class G",
  GP: "Glider Prohibited",
  CTR: "CTR",
  W: "Wave window",
  RMZ: "Radio Mandatory Zone",
  UNKNOWN: "UNKNOWN"
}

export const commandMap = {
  polygonPoint: "DP",
  arcFromRadiusAngles: "DA",
  arcFromCoordinates: "DB",
  circle: "DC",
  airwaySegment: "DY",
  airspaceClass: "AC",
  airspaceName: "AN",
  airspaceCeiling: "AH",
  airspaceFloor: "AL",
  directionAssignment: "V D=",
  centerAssignment: "V X="
}


export class OpenAirAirspace {
  name: string
  airspaceClass: OpenAirAirspaceClass
  locale?: string
  ceiling: Altitude
  floor: Altitude
  maxAltitude: number
  shapes: Shape[]=[]
  rawText: string

  static currentDirection: Direction

  constructor(airspaceTxt: string){
    this.rawText = airspaceTxt.trim()
    this.maxAltitude = 60000
    this.airspaceClass = {code: "UNKNOWN", name: "UNKNOWN"}
    this.name = 'UNKNOWN'
    this.ceiling = {raw: '', valueFeet: null} 
    this.floor = {raw: '', valueFeet: null} 
    
    const lines = this.trimLines(airspaceTxt.split('\n'))

    // Parse header
    lines.forEach((line: string)=>{
      const words = line.split(' ')
      if(words[0] == "AC") {this.airspaceClass = this.parseAirspaceClass(line)}
      if(words[0] == "AN") {[this.name, this.locale] = this.parseAirspaceName(line)}
      if(words[0] == "AH") {this.ceiling = this.parseAltitude(line, words)}
      if(words[0] == "AL") {this.floor = this.parseAltitude(line, words)} 
    })

    //parse shapes
    const directionIndexes = this.getAllIndexes(lines, commandMap.directionAssignment)
    const centerIndexes = this.getAllIndexes(lines, commandMap.centerAssignment)
    const allPolygonIndexes = this.getAllIndexes(lines, commandMap.polygonPoint + ' ')
    const polygonStartIndexes = this.sanitiseShapeStarts(allPolygonIndexes)
    const arcFromCoordinatesStartIndexes = this.getAllIndexes(lines, commandMap.arcFromCoordinates)
    const arcFromRadiusAnglesStartIndexes = this.getAllIndexes(lines, commandMap.arcFromRadiusAngles)
    const circleStartIndexes = [...this.getAllIndexes(lines, commandMap.circle + ' ')].sort((a, b) => a - b)
    const allAirwaySegmentIndexes = this.getAllIndexes(lines, commandMap.airwaySegment + ' ')
    const airwaySegmentStartIndexes = this.sanitiseShapeStarts(allAirwaySegmentIndexes)
    
    let shapeStartIndexs = [
      ...polygonStartIndexes,
      ...arcFromCoordinatesStartIndexes,
      ...arcFromRadiusAnglesStartIndexes,
      ...circleStartIndexes,
      ...airwaySegmentStartIndexes,
      ...directionIndexes,
      ...centerIndexes
    ].sort((a, b) => a - b)
    
    const shapesRaw: string[][] = this.splitArrayByIndexes(lines, shapeStartIndexs).slice(1)
    
    const polygons: Shape[] = shapesRaw.map((shapeRaw) => {
      if(shapeRaw[0].startsWith(commandMap.polygonPoint + ' ')){
        const points: any[] = []
        shapeRaw.forEach((line) => {
          points.push(this.parseCoordinatePair(line.slice(commandMap.polygonPoint.length + 1)))
        })
        if (points.length>0){
          return {
            shape:{
              points: points
            },
            shapeType: "Polygon"
          } as Shape
        }
      }
    }).filter((polygon)=>{
      return polygon !== undefined
    })
    this.shapes.push(...polygons)

    const arcsFromCoordinates: Shape[] = arcFromCoordinatesStartIndexes.map((value)=>{
      const direction = this.getMatchingDirection(directionIndexes, value, lines)
      const center = this.getMatchingCenter(centerIndexes, value, lines)
      const [startAngle, endAngle] = this.parseArcCoordinates(lines[value])
      return {
        shape: {
          startPoint: startAngle,
          endPoint: endAngle,
          center: center,
          direction: direction
        },
        shapeType: "ArcFromCoordinates"
      } as Shape
    })
    this.shapes.push(...arcsFromCoordinates)

    const arcsFromRadiusAngles: Shape[] = arcFromRadiusAnglesStartIndexes.map((value)=>{
      const direction = this.getMatchingDirection(directionIndexes, value, lines)
      const center = this.getMatchingCenter(centerIndexes, value, lines)
      const arc = this.parseArcRadiusAngles(lines[value])
      return {
        shape: 
        {
          angleStart: arc.angleStart,
          angleEnd: arc.angleEnd,
          radius: arc.radius,
          center: center,
          direction: direction
        },
        shapeType: "ArcFromRadiusAngles"
      } as Shape
    })
    this.shapes.push(...arcsFromRadiusAngles)

    const circles: Shape[] = circleStartIndexes.map((value)=>{
      const center = this.getMatchingCenter(centerIndexes, value, lines)
      const radius = this.parseCircleRadius(lines[value])
      return {
        shape: {
          radius: radius,
          center: center
        },
        shapeType: "Circle"
      } as Shape
    })
    this.shapes.push(...circles)
  }

  private generateSvg(shape: Shape): string | void {
    if (shape.shapeType == "Circle"){
      const circle = shape.shape as Circle
      return (`<circle r=${circle.radius}>`)
    }
    if (shape.shapeType == "ArcFromCoordinates"){
      const arc = shape.shape as ArcFromCoordinates
      const radius  = this.getRadius(arc.startPoint, arc.center)
      const [startX, startY] = this.coordsToSvg(arc.startPoint)
      const [endX, endY] = this.coordsToSvg(arc.endPoint)
      return (`<path d="
        M ${arc.direction == "clockwise" ? startX: endX} ${arc.direction == "clockwise" ? startY: endY}
        A ${radius} ${radius} 0 0 0 ${arc.direction == "clockwise" ? endX: startX} ${arc.direction == "clockwise" ? endY: startY}>`)
    }
    if (shape.shapeType == "ArcFromRadiusAngles"){
      const arc = shape.shape as ArcFromRadiusAngles
      const [startX, startY, endX, endY] = this.angleToSvgCoords(arc)
      return (`<path d="
        M ${arc.direction == "clockwise" ? startX: endX} ${arc.direction == "clockwise" ? startY: endY}
        A ${arc.radius} ${arc.radius} 0 0 0 ${arc.direction == "clockwise" ? endX : startX} ${arc.direction == "clockwise" ? endY: startY}">`)
    }
    if (shape.shapeType == "Polygon"){
      const polygon = shape.shape as Polygon
      const svgPoints = polygon.points.map((pointPair)=>{
        return `${this.coordsToSvg(pointPair)[0]},${this.coordsToSvg(pointPair)[1]}}`
      })
      return `<polygon points="${svgPoints.join(' ')}"`
    }
  }

  private getRadius(startPoint: CoordinatePair, center: CoordinatePair): number{

  }

  private coordsToSvg(coordinatePair: CoordinatePair): [number, number]{}

  private angleToSvgCoords(arc: ArcFromRadiusAngles): [number, number, number, number]{}

  private getMatchingCenter(centerIndexes: number[], valueIndex: number, lines: string[]): CoordinatePair | null {
    const centerIndex = centerIndexes.filter((centerIndex: number) => {
      return centerIndex < valueIndex
    })[0]
    if (centerIndex){
      const center = this.parseCoordinatePair(lines[centerIndex].slice(commandMap.centerAssignment.length + 1))
      return center
    } else {
      return null
    }
  }

  private getMatchingDirection(directionIndexes: number[], valueIndex: number, lines: string[]): Direction{
    const directionIndex = directionIndexes.filter((directionIndex) => {
        return directionIndex < valueIndex
      })[0]
      const direction = this.parseDirection(lines[directionIndex])
      return direction
  }

  private trimLines(lines: string[]): string[]{
    return lines.map((line)=>{
      return line.trim()
    })
  }
  
  private sanitiseShapeStarts(indexArray: number[]): number[]{
    return indexArray.filter((currentValue, index, indexArray) => {
      if (index == 0 ) {return true}
      const previousValue = indexArray[index - 1];
      return previousValue !== currentValue - 1;
    })
  }

  private splitArrayByIndexes(arr: any[], indexes: number[]): any[] {
    const result = [];
    let startIndex = 0;
    // Sort the indexes to ensure proper slicing order
    const sortedIndexes = [...indexes].sort((a, b) => a - b);
    for (const index of sortedIndexes) {
        if (index > startIndex && index <= arr.length) {
            // Extract the chunk from the current start index up to the split index
            result.push(arr.slice(startIndex, index));
            startIndex = index;
        }
    }
    // Add the final remaining chunk from the last index to the end of the array
    if (startIndex < arr.length) {
        result.push(arr.slice(startIndex));
    }
    return result;
  }

  private parseDirection(line: string): Direction {
    const words = line.split(' ')
    if (words[1].trim().endsWith('-')){
      return "anti-clockwise"
    } else {
      return "clockwise"
    }
  }

  private parseCoordinate(coordinateString: string): Coordinate {
    const coordinateParts = coordinateString.trim().split(' ')    
    const dms =  coordinateParts[0].split(':').map((part: string)=>{return Number(part)})
    return {
      measurement: {
        degrees: dms[0],
        minutes: dms[1],
        seconds: dms[2]
      }, 
      direction: coordinateParts[1] as CompassPoint}
  }

  private parseCoordinatePair(line: string): CoordinatePair{
    let latitude: Coordinate
    let longitude: Coordinate
    const pair = line.trim().split('  ')
      .map((coordinateString)=>{
        return this.parseCoordinate(coordinateString)
      })
    if (pair[0].direction.includes("S")){
      latitude = pair[0]
      longitude = pair[1]
    } else if (pair[0].direction.includes("N")){
      latitude = pair[0]
      longitude = pair[1]
    } else {
      latitude = pair[1]
      longitude = pair[0]
    }
    return {latitude: latitude, longitude: longitude}
  }

  private parseArcRadiusAngles(line: string): ArcFromRadiusAnglesPartial{
    const components = line.slice(commandMap.arcFromRadiusAngles.length + 1).split(',')
    
    return {
      radius: Number(components[0]), 
      angleStart: Number(components[1]),
      angleEnd: Number(components[2])
    }
  }

  private parseCircleRadius(line: string): number {
    return Number(line.slice(commandMap.circle.length +1))
  }

  private parseArcCoordinates(line: string){
    const coordinateParts = line.trim().slice(3).split(',')
    return [
      this.parseCoordinatePair(coordinateParts[1]),
      this.parseCoordinatePair(coordinateParts[1])
    ]
  }

  private parseAirspaceName(line: string): [string, string]  {
    const name = line.slice(3).trim()
    let locale = ''
    name.split(' ').forEach((word)=>{
      if (!['CTA','FIR', 'EFREQUENCY', 'FREQUENCY', 'MIL', 'CERT', 'UNCR']
        .includes(word.toUpperCase()) &&  
        !/[^a-zA-Z-]/.test(word) && 
        word.length > 1
      ){ 
        locale += ' ' + word
      }
    })
    return [name, locale.toUpperCase().trim()]
  }

  private parseAirspaceClass(line: string): OpenAirAirspaceClass{
    let code = line.slice(3).trim() as OpenAirClassCode
    let name = airspaceClassMap[code] as OpenAirClassName
    return { name: name, code: code }
  }

  private parseAltitude(line: string, words: string[]): Altitude {
    let altitude: Altitude = {
      valueFeet: null,
      raw: line.slice(3).trim()
    }
    if(words[1].toUpperCase().startsWith("FL")){
      altitude = this.parseFlightLevel(words[1])
    } else if(words[1].toUpperCase().endsWith("FT")) {
      altitude.valueFeet = Number(words[1].slice(0,-2))
    } else if(words[1].toUpperCase().trim() == "SFC"){
      altitude.valueFeet = 0
    } else if(words[1].toUpperCase().trim() == "UNL" || words[1].toUpperCase().trim() == "UNLIMITED"){
      altitude.valueFeet = this.maxAltitude
    }
    return altitude
  }

  private parseFlightLevel(flightLevelRaw: string): Altitude {
    const raw = flightLevelRaw.trim()
    const flightLevel = Number(flightLevelRaw.slice(2).trim())
    return { 
      raw: raw,
      flightLevel: flightLevel,
      pressureReference: "ISA",
      valueFeet: flightLevel * 100,
      reference: "MSL"
    }
  }  

  private getAllIndexes(lines: string[], value: string): number[] {
    let indexes: number[] = []
    lines.map((line, index)=>{
      if (line.startsWith(value)){
        indexes.push(index);
      }
    })
    return indexes;
  }
}