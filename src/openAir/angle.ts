import { Geometry } from "./geometry"

export class Angle extends Geometry{
  degrees: number
  radians: number


  constructor(degreesOrRadians: number, constructionType: ("degrees" | "radians")="degrees"){
    super()
    if(constructionType === "degrees"){
      this.degrees = degreesOrRadians
      this.radians = this.toRadians(this.degrees)
    } else if(constructionType === "radians"){
      this.radians = degreesOrRadians
      this.degrees = this.toDegrees(this.radians)
    } else {
      throw new Error("Incompatible construction type")
    }
  }

}