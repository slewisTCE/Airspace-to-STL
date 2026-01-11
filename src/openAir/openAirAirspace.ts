
import type { Direction, OpenAirAirspaceClass, OpenAirClassCode, OpenAirClassName, XYPair, ShapesType } from "./openAirTypes"
import { airspaceClassMap, commandMap } from "./data";
import { CoordinatePair } from "./coordinatePair";
import { Altitude } from "./altitude";
import { Polygon, Polygon as PolygonPoint } from "./polygon";
import { Arc } from "./arc";
import { Circle } from "./circle";
import { BufferGeometry, ExtrudeGeometry, Shape as ThreeShape, ShapeGeometry, ShapePath } from "three";
import { Distance } from "./distance";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";


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
  geometry: BufferGeometry
  shapeInstructions:string[] = []

  static currentDirection: Direction
  maxProjection: number
  minProjection: number

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

    // if ( this.shape.curves.length > 0){
    //   this.shape.closePath()
    // }
    
    // this.geometry = new ExtrudeGeometry(this.shape, {depth: this.ceiling.value.kiloMetres - this.floor.value.kiloMetres})
    // this.geometry = this.geometry.scale(0.001, 0.001, 1)
    // this.geometry.computeBoundingBox()
    // const newPath = this.joinPaths(this.shapes, false)
    // if (newPath){
    //   this.shapePath = newPath
    //   this.geometry = new ExtrudeGeometry(newPath, {
    //     steps: 100, // Number of segments along the path
    //     bevelEnabled: false // Or true for bevels
    // });
    // }
    // // this.shapesThree = this.shapePath.toShapes(true)
    // const geometries = this.shapesThree.map((shape)=>{
    //   return new ShapeGeometry(shape)
    // })
    // if(geometries.length > 0){
    //   this.geometry = BufferGeometryUtils.mergeGeometries(geometries)
    // }
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

  private joinPaths(shapes: (Arc | Circle | Polygon)[], scaled=false): Shape | undefined {
    let path = new Shape()
    let pathScaled = new Shape()
    if(shapes[0]){
      path = shapes[0].path.projection.value
      pathScaled = shapes[0].path.projection.scaled
      shapes.forEach((shape, index)=>{
        if(scaled){
          if(shape.path.projection.scaled && pathScaled){
            if (index>0){
              pathScaled.add(shape.path.projection.scaled)
            } 
          }else {
            throw new Error("Path has not been scaled")
          }
        } else {
          if (index>0){
            path.add(shape.path.projection.value)
          }
        }
      })
      return path
    }
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
          this.shape = circle.shape
          this.shapes.push(circle)
        } else { unreconisedCommand = true}
      } else if (unreconisedCommand){
        console.warn(`Did not recognise command "${command}" when parsing line "${line}"`)
      }
    })
  }

  public scaleShapes(shapes: Shape[], offset: number, scalingFactor: number){
    shapes.map(shape => this.scaleShape(shape, offset, scalingFactor))
  }

  public scaleShape(shape: (Arc | Circle | Polygon), offset: number, scalingFactor: number) {
    let thisShape
    if(shape.constructor.name == "Circle"){
      thisShape = shape as Circle
      if(thisShape.radius.value){
      if (thisShape.center.projection && thisShape.arcStartPoint?.projection && thisShape.arcEndPoint?.projection && thisShape.radius.value){
        thisShape.center.projection.scaled = this.scaleProjectionPair(thisShape.center.projection, offset, scalingFactor)
        thisShape.arcStartPoint.projection.scaled = this.scaleProjectionPair(thisShape.arcStartPoint.projection, offset, scalingFactor)
        thisShape.arcEndPoint.projection.scaled = this.scaleProjectionPair(thisShape.arcEndPoint.projection, offset, scalingFactor)
        thisShape.radius.scaled = new Distance(this.scaleDistance(thisShape.radius.value.metres, scalingFactor), "metres")
      }
    }
    }
    else if(shape.constructor.name == "Polygon"){
      thisShape = shape as Polygon
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
    } else if (shape.constructor.name== "Arc"){
      thisShape = shape as Arc
      if(thisShape.center && thisShape.endPoint && thisShape.startPoint){
        if (thisShape.center.projection && thisShape.endPoint.projection && thisShape.startPoint.projection){
          thisShape.center.projection.scaled = this.scaleProjectionPair(thisShape.center.projection, offset, scalingFactor)
          thisShape.startPoint.projection.scaled = this.scaleProjectionPair(thisShape.startPoint.projection, offset, scalingFactor)
          thisShape.endPoint.projection.scaled = this.scaleProjectionPair(thisShape.endPoint.projection, offset, scalingFactor)
        }
      }
    }

    
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


  private updateMinMaxProjections(projections: Array<number | undefined>): void {
    const safeProjections =  projections.filter(projection => projection !== undefined)
    this.maxProjection = Math.max(...[this.maxProjection, ...safeProjections])
    this.minProjection = Math.min(...[this.minProjection, ...safeProjections])
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

 
  public generateShapeSvgPath(shape: Shape, scaled=true): string | undefined {
    if (shape.constructor.name == "Circle"){
      shape = shape as Circle
      return shape.generateCircleSvgPathSegment(shape as Circle, scaled)
    }
    else if (shape.constructor.name == "Arc"){
      try {
        shape = shape as Arc
        return shape.generateSvgPathSegment(scaled)
      } catch {
        console.error(shape)
      }
    }
    else if (shape.constructor.name == "Arc"){
      
      const arc = shape as Arc
      const [startX, startY, endX, endY] = arc.generateArcFromRadiusAnglesSvgPathSegment(scaled)
      return (`
        ${arc.direction == "clockwise" ? startX: endX} ${arc.direction == "clockwise" ? startY: endY}
        A ${arc.radius} ${arc.radius} 0 0 0 ${arc.direction == "clockwise" ? endX : startX} ${arc.direction == "clockwise" ? endY: startY}`)
    }
    else if (shape.constructor.name == "Polygon"){
      shape = shape as Polygon
      return shape.generatePolygonSvgPathSegment(shape as PolygonPoint, scaled)
    }
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
 









