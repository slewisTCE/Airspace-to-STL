export class Geometry {
  public toDegrees = (radians: number) => radians * 180 / Math.PI
  
  public toRadians = (degreesDecimal: number) => degreesDecimal * Math.PI / 180

  public distanceBetweenTwoPoints(x1: number, y1: number, x2: number, y2: number): number {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    return Math.hypot(deltaX, deltaY);
  }
}