
import type { Direction, OpenAirAirspaceClass, OpenAirClassCode, OpenAirClassName } from "./openAirTypes"
import { airspaceClassMap, commandMap } from "./data";
import { CoordinatePair } from "./coordinatePair";
import { Altitude } from "./altitude";
import { Polygon } from "./polygon";
import { Arc } from "./arc";
import { Circle } from "./circle";
import {Shape as ThreeShape } from "three";
import { Distance } from "./distance";


export class OpenAirAirspace {
  name: string
  airspaceClass: OpenAirAirspaceClass
  locale: string = ""
  ceiling: Altitude = {
    maxAltitude: new Distance(60000, "feet"),
    raw: "",
    value: new Distance(60000, "feet")
  } as Altitude
  floor: Altitude = {
    maxAltitude: new Distance(60000, "feet"),
    raw: "",
    value: new Distance(0, "feet")
  } as Altitude
  maxAltitude: Altitude = {
    maxAltitude: new Distance(60000, "feet"),
    raw: "",
    value: new Distance(60000, "feet")
  } as Altitude
  shapes: (Arc | Circle | Polygon)[]=[]
  rawText: string
  rawLines: string[]
  svg: string
  svgScaled: string
  shape: ThreeShape
  shapeInstructions:string[] = []

  static currentDirection: Direction
  maxProjection: number
  minProjection: number
  geometry: any;

  constructor(airspaceTxt: string){
    this.shape = new ThreeShape
    this.rawText = airspaceTxt.trim()
    this.rawLines = []
    this.maxAltitude = {
      maxAltitude: new Distance(60000, "feet"),
      raw: "",
      value: new Distance(0, "feet")
    } as Altitude
    this.airspaceClass = {code: "UNKNOWN", name: "UNKNOWN"}
    this.name = 'UNKNOWN'
    this.maxProjection = 0
    this.minProjection = 0
    this.svgScaled = ""
    this.rawLines = this.trimLines(airspaceTxt.split('\n'))
    this.shape.autoClose = true
    this.procesRawLines()
    this.svg = this.compileShapestoSingleSvg(this.shapes)
  }

  public isValidSVG(svgString: any): boolean {
  if (!svgString || typeof svgString !== 'string') return false;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');

  // Check if the browser's parser generated an error element
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) return false;

  // Ensure the root element is actually an <svg> tag
  return doc.documentElement.nodeName === 'svg';
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
      if(command == commandMap.airspaceCeiling){this.ceiling = new Altitude(line)} else
      if(command == commandMap.airspaceFloor){this.floor = new Altitude(line)} else
      // Process variables
      if(command == commandMap.variable){
        if(line.startsWith(commandMap.directionAssignment)){lastDirection = this.parseDirection(line)} else
        if(line.startsWith(commandMap.centerAssignment)){lastCenter = this.parseCenter(line)} else {
          console.warn("Unsupported variable in line: ", line)
        }
      }
      // Process shapes
       else if(command == commandMap.polygonPoint){
        this.shapeInstructions.push("lineTo")
        if(this.name !="ADELAIDE CTA A [H24]"){
        const polygon = new Polygon(this.shape, new CoordinatePair(line.slice(3)))
        this.shape = polygon.shape
        this.shapes.push(polygon)
        }
      } 
      if (lastCenter){
        if(command == commandMap.arcFromCoordinates || command == commandMap.arcFromRadiusAngles){
          this.shapeInstructions.push("lineTo")
          this.shapeInstructions.push("absArc")
          const arc = new Arc(this.shape, line, lastDirection, lastCenter)
          this.shape = arc.shape
          this.shapes.push(arc)
        } else if(command == commandMap.circle){
          this.shapeInstructions.push("abcArc")
          const circle = new Circle(this.shape, line, lastCenter)
          if(circle.shape){
            this.shape = circle.shape
            this.shapes.push(circle)
          }
        } else { unreconisedCommand = true}
      } else if (unreconisedCommand){
        console.warn(`Did not recognise command "${command}" when parsing line "${line}"`)
      }
    })
  }

  public scaleProjection(projection: number, offset: number, scalingFactor: number): number {
    return (projection + offset) * scalingFactor
  }

  public scaleDistance(projection: number, scalingFactor: number): number {
    return projection * scalingFactor
  }

 
  public compileShapestoSingleSvg(shapes: (Arc | Circle | Polygon)[], scaled=false): string {
    const svgHeader = `<svg viewBox="0 0 2000 2000" xmlns="http://www.w3.org/2000/svg"><g id="LWPOLYLINE"><path d="`
    const svgFooter = `" fill="#6abfff" stroke="#6abfff" stroke-width="1"></path></g></svg>`
    let allShapesSvg = svgHeader
    shapes.forEach((shape, index)=>{
      let svgPathSegment
      if (scaled){
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
        console.warn(`Warning: ${shape} missing svg`)
      }
    })
    allShapesSvg = allShapesSvg.concat(svgFooter)
    return allShapesSvg
  }

  private trimLines(lines: string[]): string[]{
    return lines.map((line)=>{
      return line.trim()
    })
  }

  private parseCenter(line: string): CoordinatePair {
    return(new CoordinatePair(line.slice(commandMap.centerAssignment.length)))
  }

  private parseDirection(line: string): Direction {
    const words = line.split(' ')
    if (words[1].trim().endsWith('-')){
      return "anti-clockwise"
    } else {
      return "clockwise"
    }
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
}
 









