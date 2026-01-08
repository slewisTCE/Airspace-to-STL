import proj4 from "proj4"
import type { Altitude, ArcAngles, ArcFromCoordinates, ArcFromRadiusAngles, ArcFromRadiusAnglesPartial, Circle, CompassPoint, Coordinate, CoordinatePair, Direction, OpenAirAirspaceClass, OpenAirClassCode, OpenAirClassName, Polygon, ProjectionPair, Shape, XYPair } from "./types/openAirTypes"
import { distanceBetweenTwoPoints,  } from "./utils/utils";

// Projection definition
proj4.defs(
  "CustomUTM",
  "+proj=tmerc +lat_0=0 +lon_0=153 +k=0.9996 +x_0=500000 +y_0=10000000 +datum=WGS84 +units=m +no_defs"
);


export const airspaceClassMap = {
  R: {name: "Restricted", colour: "#f2ff61"},
  Q: {name: "Danger", colour: "#ff6b61"},
  P: {name: "Prohibited", colour: "#ffd261"},
  A: {name: "Class A", colour: "#61ffdf"},
  B: {name: "Class B", colour: "#61a3ff"},
  C: {name: "Class C", colour: "#6461ff"},
  D: {name: "Class D", colour: "#ca61ff"},
  E: {name: "Class E", colour: "#ff61cd"},
  F: {name: "Class F", colour: "#b5ff61"},
  G: {name: "Class G", colour: "#6176ff"},
  GP: {name: "Glider Prohibited", colour: "#6176ff"},
  CTR: {name: "CTR", colour: ""},
  W: {name: "Wave window", colour: "#b7f2aa"},
  RMZ: {name: "Radio Mandatory Zone", colour: "#aacaf2"},
  UNKNOWN: {name: "UNKNOWN", colour: "#f2f3f5"}
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
  centerAssignment: "V X=",
  variable: "V"
}

export function airspaceFromName(airspaces: OpenAirAirspace[], name: string): OpenAirAirspace | undefined {
  return airspaces.find((airspace: OpenAirAirspace) => airspace.name === name)
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
  rawLines: string[]
  svg: string
  svgScaled: string

  static currentDirection: Direction
  maxProjection: number
  minProjection: number

  constructor(airspaceTxt: string){
    this.rawText = airspaceTxt.trim()
    this.rawLines = []
    this.maxAltitude = 60000
    this.airspaceClass = {code: "UNKNOWN", name: "UNKNOWN"}
    this.name = 'UNKNOWN'
    this.ceiling = {raw: '', valueFeet: null} 
    this.floor = {raw: '', valueFeet: null} 
    this.maxProjection = 0
    this.minProjection = 0
    this.svg = ""
    this.svgScaled = ""
    this.rawLines = this.trimLines(airspaceTxt.split('\n'))
    this.procesRawLines()
  }

  public procesRawLines(){
    let lastDirection: Direction = "clockwise"
    let lastCenter: CoordinatePair | undefined 

    this.rawLines.forEach((line: string)=>{
      let unreconisedCommand = false
      const command = line.split(' ')[0]
      // Process headers
      if(command == commandMap.airspaceClass){this.airspaceClass = this.parseAirspaceClass(line)} else
      if(command == commandMap.airspaceName){[this.name, this.locale] = this.parseAirspaceName(line)} else 
      if(command == commandMap.airspaceCeiling){this.ceiling = this.parseAltitude(line)} else
      if(command == commandMap.airspaceFloor){this.floor = this.parseAltitude(line)} else
      // Process variables
      if(command == commandMap.variable){
        if(line.startsWith(commandMap.directionAssignment)){lastDirection = this.parseDirection(line)} else
        if(line.startsWith(commandMap.centerAssignment)){lastCenter = this.parseCenter(line)} else {
          console.warn("Unsupported variable in line: ", line)
        }
      }
      // Process shapes
       else if(command == commandMap.polygonPoint){
        const shape = this.processPolygon(line)
        this.shapes.push(shape)
      } 
      if (lastCenter){
        if(command == commandMap.arcFromCoordinates){
          const shape = this.processArcFromCoordinates(line, lastDirection, lastCenter)
          this.shapes.push(shape)
        } else if(command == commandMap.arcFromRadiusAngles){
          const shape = this.processArcFromRadiusAngles(line, lastDirection, lastCenter)
          this.shapes.push(shape)
        }
        else if(command == commandMap.circle){
          const shape = this.processCircle(line, lastCenter)
          this.shapes.push(shape)
        } else { unreconisedCommand = true}
      } else if (unreconisedCommand){
        console.warn(`Did not recognise command "${command}" when parsing line "${line}"`)
      }
    })
  }

  public scaleShapes(shapes: Shape[], offset: number, scalingFactor: number): Shape[] {
    return shapes.map(shape => this.scaleShape(shape, offset, scalingFactor))
  }

  public scaleShape(shape: Shape, offset: number, scalingFactor: number): Shape {
    let thisShape
    if(shape.shapeType == "Circle"){
      thisShape = shape.shape as Circle
      if (thisShape.center.projection && thisShape.arcStartPoint?.projection && thisShape.arcEndPoint?.projection && thisShape.radius.projection.value){
        thisShape.center.projection.scaled = this.scaleProjectionPair(thisShape.center.projection, offset, scalingFactor)
        thisShape.arcStartPoint.projection.scaled = this.scaleProjectionPair(thisShape.arcStartPoint.projection, offset, scalingFactor)
        thisShape.arcEndPoint.projection.scaled = this.scaleProjectionPair(thisShape.arcEndPoint.projection, offset, scalingFactor)
        thisShape.radius.projection.scaled = this.scaleDistance(thisShape.radius.projection.value, scalingFactor)
      }
    }
    else if(shape.shapeType == "Polygon"){
      thisShape = shape.shape as Polygon
      const points = thisShape.points.map((point)=>{
        if (point.projection){
          point.projection.scaled = this.scaleProjectionPair(point.projection, offset, scalingFactor)
          return {
            ...point,
            projection:{
              ...point.projection,
              scaled: this.scaleProjectionPair(point.projection, offset, scalingFactor)
            }
          }
        }
      })
      thisShape.points = points as CoordinatePair[]
    } else if (shape.shapeType == "ArcFromCoordinates"){
      thisShape = shape.shape as ArcFromCoordinates
      if (thisShape.center.projection && thisShape.endPoint.projection && thisShape.startPoint.projection){
        thisShape.center.projection.scaled = this.scaleProjectionPair(thisShape.center.projection, offset, scalingFactor)
        thisShape.startPoint.projection.scaled = this.scaleProjectionPair(thisShape.startPoint.projection, offset, scalingFactor)
        thisShape.endPoint.projection.scaled = this.scaleProjectionPair(thisShape.endPoint.projection, offset, scalingFactor)
      }

    }
    return {
      shape: thisShape,
      shapeType: shape.shapeType
    } as Shape
  }
  private scaleProjectionPair(pair: {x: number, y: number}, offset: number, scalingFactor: number): XYPair {
    return {
        x: this.scaleProjection(pair.x, offset, scalingFactor),
        y: this.scaleProjection(pair.y, offset, scalingFactor)
    }
  }

  public scaleProjection(projection: number, offset: number, scalingFactor: number): number {
    return (projection + offset) * scalingFactor
  }

  public scaleDistance(projection: number, scalingFactor: number): number {
    return projection * scalingFactor
  }

  private processPolygon(rawTextLine: string): Shape {
    const coordinatePair = this.parseCoordinatePair(rawTextLine.slice(commandMap.polygonPoint.length + 1))
    const x = coordinatePair.projection ? coordinatePair.projection.x : 0
    const y = coordinatePair.projection ? coordinatePair.projection.y : 0
    this.maxProjection = Math.max(this.maxProjection, x, y)
    this.minProjection = Math.min(this.minProjection, x, y)
    
    const polygon: Polygon = {
      points: [coordinatePair]
    }
    return {
      shape: polygon,
      shapeType: "Polygon"
    } as Shape
  }

  private processArcFromCoordinates(rawTextLine: string, direction: Direction, center: CoordinatePair): Shape {
    const [startPoint, endPoint] = this.parseArcCoordinates(rawTextLine)
    const startAngle = this.getBearing(startPoint, center)
    const endAngle = this.getBearing(endPoint, center)
    const arcDelta = this.getArcAnglesDelta({startAngle: startAngle, endAngle: endAngle}, direction)
    const largeArc = Math.abs(arcDelta) > 180

    let arc: ArcFromCoordinates = {
      startPoint: startPoint,
      endPoint: endPoint,
      center: center,
      direction: direction,
    }

    this.updateMinMaxProjections(
      [
        arc.startPoint.projection?.x, 
        arc.startPoint.projection?.y, 
        arc.endPoint.projection?.x, 
        arc.endPoint.projection?.y
      ]
    )

      arc.angles = {
        arcAngle: arcDelta,
        startAngle: startAngle,
        endAngle: endAngle,
        largeArc: largeArc
      }
      return {
        shape: arc,
        shapeType: "ArcFromCoordinates"
      } as Shape
  }

  private updateMinMaxProjections(projections: Array<number | undefined>): void {
    const safeProjections =  projections.filter(projection => projection !== undefined)
    this.maxProjection = Math.max(...[this.maxProjection, ...safeProjections])
    this.minProjection = Math.min(...[this.minProjection, ...safeProjections])
  }

  private processArcFromRadiusAngles(rawTextLine: string, direction: Direction, center: CoordinatePair): Shape {
    const angles = this.parseArcRadiusAngles(rawTextLine)
    const arc: ArcFromRadiusAngles = {
      angleStart: angles.angleStart,
      angleEnd: angles.angleEnd,
      radius: angles.radius.original,
      center: center,
      direction: direction
    }
        this.updateMinMaxProjections(
      [
        arc.center.projection?.x, 
        arc.center.projection?.y, 
      ]
    )
    return {
      shape: arc,
      shapeType: "ArcFromRadiusAngles"
    } as Shape
  }

  private processCircle(rawTextLine: string, center: CoordinatePair): Shape {
    const radius = this.parseCircleRadius(rawTextLine)
    let radiusProjection
    let [arcStartPoint, arcEndPoint]  = this.getCircleArcStartEndPoint(radius, center)
    const arcStartProjection = this.projectLatLon(arcStartPoint)
    const arcEndProjection = this.projectLatLon(arcEndPoint)
    if (arcStartProjection && arcEndProjection){
      arcStartPoint.projection = {
        x: arcStartProjection[0],
        y: arcStartProjection[1]
      }
      arcEndPoint.projection = {
        x: arcEndProjection[0],
        y: arcEndProjection[1]
      }
    }

    const centerProjection = this.projectLatLon(center)
    if (centerProjection){
      center.projection = {
        x: centerProjection[0],
        y: centerProjection[1]
      }
    }

    if(center.projection && arcStartPoint.projection){
      radiusProjection = Math.abs(arcStartPoint.projection.y - center.projection.y)
    }

    const circle: Circle = {
      radius: {
        value: radius,
        projection:{
          value: radiusProjection
        }
      },
      center: {
        latitude: center.latitude,
        longitude: center.longitude,
        projection: center.projection,
      },
      arcStartPoint: arcStartPoint,
      arcEndPoint: arcEndPoint
    }
    return {
      shape: circle,
      shapeType: "Circle"
    } as Shape
  }

  private moveNorth(startPoint: CoordinatePair, distanceNm: number): CoordinatePair {
    let degrees = startPoint.latitude.measurement.degrees
    let minutes = startPoint.latitude.measurement.minutes 
    let latitudeDirection = startPoint.latitude.direction
    let longitudeDirection = startPoint.longitude.direction

    // Southern hemisphere
    if (latitudeDirection == "S"){
      minutes -= distanceNm
      while (minutes < 0){
        degrees -= 1
        minutes += 60
      }
      if (degrees < 0){
        degrees = Math.abs(degrees)
        latitudeDirection = "N"
      }
    // Northern hemisphere
    } else {
      minutes += distanceNm
      while (minutes >= 60){
        degrees += 1
        minutes -= 60
      }
      if (degrees > 90){
        degrees -= 90
        if (longitudeDirection == "E"){
          longitudeDirection = "W"
        } else {
          longitudeDirection = "E"
        }
      }
      
    }
    return {
      longitude: {...startPoint.longitude, direction: longitudeDirection},
      latitude: { 
        measurement: {
          degrees: degrees,
          minutes: minutes,
          seconds: startPoint.latitude.measurement.seconds
        },
        direction: latitudeDirection
      }
    }
  }

  private getCircleArcStartEndPoint(radius: number, center: CoordinatePair): [CoordinatePair, CoordinatePair] {
    return [this.moveNorth(center, radius),this.moveNorth(center, -radius)] 
  }

  public compileShapestoSingleSvg(shapes: Shape[], scaled=true): string {
    const svgHeader = `<svg viewBox="800 1500 500 500" xmlns="http://www.w3.org/2000/svg"><g id="LWPOLYLINE"><path d="`
    const svgFooter = `" fill="#6abfff" stroke="#6abfff" stroke-width="1"></path></g></svg>`
    let allShapesSvg = svgHeader
    shapes.forEach((shape, index)=>{
      let svgPathSegment
      if(scaled){
        svgPathSegment = shape.svgPathSegmentScaled
      } else {
        svgPathSegment = shape.svgPathSegment
      }
      if(svgPathSegment){
        if(index == 0){
          allShapesSvg = allShapesSvg.concat(`${svgPathSegment.trim().replace("L", "M")}`)
        } else {
          allShapesSvg = allShapesSvg.concat(` ${svgPathSegment}`)
        }
      } else {
        console.warn(`Warning: ${shape.shapeType} missing svg`)
      }
    })
    allShapesSvg = allShapesSvg.concat(svgFooter)
    return allShapesSvg
  }

  private generatePolygonSvgPathSegment(polygon: Polygon, scaled=true): string {
    let svgPoints 
    if (scaled){
      svgPoints = polygon.points.map((pointPair)=>{
        if (pointPair.projection?.scaled){
          return ' L ' + pointPair.projection?.scaled.x + ' ' + pointPair.projection?.scaled.y
        }
      })
    } else {
      svgPoints = polygon.points.map((pointPair)=>{
        if (pointPair.projection){
          return ' L ' + pointPair.projection?.x + ' ' + pointPair.projection?.y
        }
      })
    }

    if(svgPoints){
      return `${svgPoints.join(' ').trim()}`
    } else {
      return ""
    }
  }

  private generateCircleSvgPathSegment(shape: Circle, scaled=true): string {
    let center
    let radius
    let arcStartPoint
    let arcEndPoint
    if (scaled){
      center = shape.center.projection?.scaled
      radius = shape.radius.projection.scaled
      arcStartPoint = shape.arcStartPoint?.projection?.scaled
      arcEndPoint = shape.arcEndPoint?.projection?.scaled
    } else {
      center = shape.center.projection
      radius = shape.radius.projection.value
      arcStartPoint = shape.arcStartPoint?.projection
      arcEndPoint = shape.arcEndPoint?.projection
    }
    if (center && arcStartPoint && arcEndPoint){
        const svgPathSegment = " " + [
          `L ${arcStartPoint.x} ${arcStartPoint.y}`,
          `A ${radius} ${radius} 0 1 0 ${arcEndPoint.x} ${arcEndPoint.y}`,
          `A ${radius} ${radius} 0 1 0 ${arcStartPoint.x} ${arcStartPoint.y}`
        ].join(' ').trim()
          return svgPathSegment
    } else {
      throw new Error("Can't generate svg path segments until scaled projection's are defined");
    }
  }

  private generateArcFromCoordinatesSvgPathSegment(arc: ArcFromCoordinates, scaled=true): string {
    const radius = this.getRadius(arc.startPoint, arc.center)
    let startPointProjection: ProjectionPair | XYPair | undefined
    let endPointProjection: ProjectionPair | XYPair | undefined
    
    const sweepFlag = arc.direction == "clockwise" ? 0 : 1
    const largeArcFlag = arc.angles?.largeArc ? 1 : 0

    if (arc.startPoint.projection && arc.endPoint.projection){
      if(scaled){
        startPointProjection = arc.startPoint.projection.scaled
        endPointProjection = arc.endPoint.projection.scaled
      } else {
        startPointProjection = arc.startPoint.projection
        endPointProjection = arc.endPoint.projection
      }
      if (startPointProjection && endPointProjection && radius){
        return (`L ${startPointProjection.x} ${startPointProjection.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endPointProjection.x} ${endPointProjection.y}`)
      } else {
        console.error("Error generating svg segment path for ArcFromCoordinates")
        return ""
      }
    } else {
      console.error("Error generating svg segment path for ArcFromCoordinates")
      return ""
    }
  }

  private getArcAngles(arc: ArcFromCoordinates): ArcAngles | void{
    if(arc.startPoint.projection &&  arc.center.projection && arc.endPoint.projection){
      const startAngle = this.getArcAngle(arc.center.projection, arc.startPoint.projection)
      const endAngle = this.getArcAngle(arc.center.projection, arc.endPoint.projection)
      return {startAngle: startAngle, endAngle: endAngle}
    }
  }

  private getArcAngle(center: ProjectionPair, point: ProjectionPair): number {
    let angle = Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI)
    if (angle < 0) {
        angle += 360;
    }
    return angle;
  }

  private getArcAnglesDelta(arcAngles: ArcAngles, direction: Direction): number {
    let delta = arcAngles.endAngle - arcAngles.startAngle
    if (direction === "clockwise" && delta < 0) delta += 360
    if (direction === "anti-clockwise" && delta > 0) delta -= 360
    return delta
  }

  private getBearing(startPoint: CoordinatePair, endPoint: CoordinatePair) {
    // Convert degrees to radians
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;

    const startLat = toRad(this.coordinateToDecimal(startPoint.latitude))
    const startLon = toRad(this.coordinateToDecimal(startPoint.longitude))
    const destLat = toRad(this.coordinateToDecimal(endPoint.latitude))
    const destLon = toRad(this.coordinateToDecimal(endPoint.longitude))

    const dLon = destLon - startLon;

    const y = Math.sin(dLon) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) -
              Math.sin(startLat) * Math.cos(destLat) * Math.cos(dLon);

    let bearing = Math.atan2(y, x);
    bearing = toDeg(bearing);

    // Normalize to 0-360
    return (bearing + 360) % 360;
  }
  
  private generateArcFromRadiusAnglesSvgPathSegment(arc: ArcFromRadiusAngles, scaled=true): string {
    throw new Error("Not yet implemented")
  }

  public generateShapeSvgPath(shape: Shape, scaled=true): string | undefined {
    if (shape.shapeType == "Circle"){
      return this.generateCircleSvgPathSegment(shape.shape as Circle, scaled)
    }
    else if (shape.shapeType == "ArcFromCoordinates"){
      try {
        return this.generateArcFromCoordinatesSvgPathSegment(shape.shape as ArcFromCoordinates)
      } catch {
        console.error(shape)
      }
    }
    else if (shape.shapeType == "ArcFromRadiusAngles"){
      
      const arc = shape.shape as ArcFromRadiusAngles
      const [startX, startY, endX, endY] = this.generateArcFromRadiusAnglesSvgPathSegment(arc, scaled)
      return (`
        ${arc.direction == "clockwise" ? startX: endX} ${arc.direction == "clockwise" ? startY: endY}
        A ${arc.radius} ${arc.radius} 0 0 0 ${arc.direction == "clockwise" ? endX : startX} ${arc.direction == "clockwise" ? endY: startY}`)
    }
    else if (shape.shapeType == "Polygon"){
      return this.generatePolygonSvgPathSegment(shape.shape as Polygon, scaled)
    }
  }

  private coordinateToDecimal(coordinate: Coordinate): number {
    let decimal = (coordinate.measurement.degrees) 
      + (coordinate.measurement.minutes) / 60.0 
      + (+coordinate.measurement.seconds) / 3600.0
    if (coordinate.direction === 'S' || coordinate.direction === 'W'){
      decimal *= -1.0;
    }
    return decimal
  }

  private projectLatLon(coordinates: CoordinatePair): [number, number] | null{
    const latitudeDecimal = this.coordinateToDecimal(coordinates.latitude);
    const longitudeDecimal = this.coordinateToDecimal(coordinates.longitude);

    if (!isFinite(latitudeDecimal) || !isFinite(longitudeDecimal)) {
      console.warn("Invalid lat/lon for projection:", { coordinates });
      return null;
    }
    try {
      const [x, y] = proj4("WGS84", "CustomUTM", [longitudeDecimal, latitudeDecimal]);
      return [x, y]
    } catch (e) {
      console.error("proj4 failed:", e, { coordinates});
      return null;
    }
  }

  private getRadius(startPoint: CoordinatePair, center: CoordinatePair): number | void {
    if (startPoint.projection?.scaled && center.projection?.scaled){
      const radius = distanceBetweenTwoPoints(startPoint.projection.scaled.x, startPoint.projection.scaled.y, center.projection.scaled.x, center.projection.scaled.y)
      return radius
    }
  }

  private trimLines(lines: string[]): string[]{
    return lines.map((line)=>{
      return line.trim()
    })
  }

  private parseCenter(line: string): CoordinatePair {
    return(this.parseCoordinatePair(line.slice(commandMap.centerAssignment.length)))
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
    let coordinatePair: CoordinatePair = {latitude: latitude, longitude: longitude}
    const projection = this.projectLatLon(coordinatePair)
    if (projection){
      coordinatePair.projection = {x: projection[0], y: projection[1]} 
    }
    return coordinatePair
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

  private parseArcCoordinates(line: string):[CoordinatePair, CoordinatePair]{
    const coordinateParts = line.trim().slice(3).split(',')
    return [
      this.parseCoordinatePair(coordinateParts[0]),
      this.parseCoordinatePair(coordinateParts[1])
    ]
  }

  private parseAirspaceName(line: string): [string, string]  {
    const name = line.slice(3).trim()
    let locale = ''
    name.split(' ').forEach((word)=>{
      if (!['CTA','FIR', 'EFREQUENCY', 'FREQUENCY', 'MIL', 'CERT', 'UNCR', 'CONTROL', 'ZONE']
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
    let name = airspaceClassMap[code].name as OpenAirClassName
    return { name: name, code: code }
  }

  private parseAltitude(line: string): Altitude {
    const words = line.split(' ') 
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
}

export class OpenAirAirspaces {
  airspaces: OpenAirAirspace[]
  maxProjection: number = 0
  minProjection: number = 0
  offset: number = 0
  scalingFactor: number = 1

  constructor(airspacesText: string){
    const airspaceDataSplit = this.splitRawAirspaceData(airspacesText)
    this.airspaces = airspaceDataSplit.splice(1).map((airspaceData)=>{
      const airspace = new OpenAirAirspace(airspaceData)
      this.maxProjection = Math.max(this.maxProjection, airspace.maxProjection)
      this.minProjection = Math.max(this.minProjection, airspace.minProjection)
      return airspace
    })
    this.offset = this.maxProjection - this.minProjection
    this.scalingFactor = 2000.0 / (this.offset + this.maxProjection)
    this.scaleAirspaces(this.airspaces, this.offset, this.scalingFactor)
  }

  public scaleProjection(airspace: OpenAirAirspace, projectedAbsMaxPixels: number){
    airspace.shapes.map((shape)=>{
      if (shape.shapeType == "Polygon"){
        const polygon = shape.shape as Polygon
        polygon.points.map((point)=>{
          if (point.projection){
            point.projection.scaled = {
              x: (point.projection?.x / this.maxProjection) * projectedAbsMaxPixels,
              y: (point.projection?.y / this.maxProjection) * projectedAbsMaxPixels
            }
          }
        })
      }
    })
  }

  private splitRawAirspaceData(airspaceData: string): string[] {
    return airspaceData.split(/\n\s*\n/)
  }

  public scaleAirspaces(airspaces: OpenAirAirspace[], offset: number, scalingFactor: number): OpenAirAirspace[]{
    return airspaces.map((airspace)=>{
      airspace.shapes = airspace.scaleShapes(airspace.shapes, offset, scalingFactor)
      airspace.shapes.map((shape)=>{
        shape.svgPathSegmentScaled = airspace.generateShapeSvgPath(shape, true)
        shape.svgPathSegment = airspace.generateShapeSvgPath(shape, false)
        return shape
      })
      airspace.svgScaled = airspace.compileShapestoSingleSvg(airspace.shapes, true)
      airspace.svg = airspace.compileShapestoSingleSvg(airspace.shapes, false)
      return airspace
    })
  }
}

export class Volume {
  airspace: OpenAirAirspace
  selected: boolean = false

  constructor(airspace: OpenAirAirspace){
    this.airspace = airspace
  }
}