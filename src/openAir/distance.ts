export class Distance {
  metres: number
  nauticalMiles: number
  kiloMetres: number
  centimetres: number
  millimetres: number
  miles: number
  feet: number
  inches: number

  constructor(value: number, constructorType: "metres" | "nauticalMiles" | "kiloMetres" | "centiMetres" | "milliMetres" | "miles" | "feet" | "inches"="metres"){
    if(constructorType === "metres"){
      this.metres = value
    } else if(constructorType === "kiloMetres"){
      this.kiloMetres = value
      this.metres = value * 1000
    } else if(constructorType === "centiMetres"){
      this.centimetres = value
      this.metres = value / 100
    } else if(constructorType === "milliMetres"){
      this.millimetres = value
      this.metres = value / 1000
    } else if(constructorType === "nauticalMiles"){
      this.nauticalMiles = value
      this.metres = this.nauticalMilesToMetres(this.nauticalMiles)
    } else if(constructorType === "feet"){
      this.feet = value
      this.metres = this.feetToMetres(this.feet)
    } else if(constructorType === "miles"){
      this.miles = value
      this.metres = this.milesToMetres(this.miles)
    } else if(constructorType === "inches"){
      this.inches = value
      this.metres = this.inchesToMetres(this.inches)
    } else {
      throw new Error("Invalid constructor type")
    }

    this.kiloMetres = this.metres / 1000
    this.centimetres = this.metres * 100
    this.millimetres = this.metres * 1000
    this.nauticalMiles = this.metresToNauticalMiles(this.metres)
    this.inches = this.metresToInches(this.metres)
    this.feet = this.metresToFeet(this.metres)
    this.miles = this.metresToMiles(this.metres)
  }

  private metresToInches(metres: number){
    return metres * 39.3701
  }

  private inchesToMetres(inches: number){
    return inches / 39.3701
  }

  private metresToMiles(metres: number){
    return metres / 1609.34
  }

  private milesToMetres(miles: number){
    return miles * 1609.34
  }

  private metresToFeet(metres: number){
    return metres * 3.28084
  }

  private feetToMetres(feet: number){
    return feet / 3.28084
  }

  private nauticalMilesToMetres(nauticalMiles: number): number {
    return nauticalMiles * 1852
  }

  private metresToNauticalMiles(metres: number): number {
    return metres / 1852
  }
}