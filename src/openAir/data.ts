export const airspaceClassMap = {
  R: {name: "Restricted", colour: "#2596be"},
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
  CTR: {name: "CTR", colour: "#f2ff61"},
  W: {name: "Wave window", colour: "#b7f2aa"},
  RMZ: {name: "Radio Mandatory Zone", colour: "#307800"},
  UNKNOWN: {name: "UNKNOWN", colour: "#9b5a00"}
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