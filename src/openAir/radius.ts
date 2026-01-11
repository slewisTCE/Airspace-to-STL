import { Distance } from "./distance"

export class Radius  {
  value: Distance
  scaled?: Distance 
  
  constructor(value: number, constructionType: "nauticalMiles" | "metres")
  constructor(distance: Distance)
  constructor(valueOrDistance: number | Distance, constructionType: "nauticalMiles" | "metres"="nauticalMiles")
  {
    if(typeof valueOrDistance === "number"){
      if(constructionType){
        this.value = new Distance(valueOrDistance, constructionType)
      } else {
        throw new Error("Must specify a construction type")
      }
    } else {
      this.value = valueOrDistance
    }
  }
}