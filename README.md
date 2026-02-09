# DAH Volume Modeller Tool

### (An Australian Airspace Visualiser)
Interactive 3D & SVG Explorer for OpenAir-Formatted Airspace Data

This project provides an interactive tool for exploring Australian airspace geometry in both 2D (SVG) and 3D (Three.js).

It parses OpenAir-formatted airspace data — specifically the dataset supplied by XcAustralia — and allows users to select, combine, scale, and export airspace volumes with a focus on clarity and spatial accuracy.

The application runs entirely client-side and is suitable for static hosting platforms such as GitHub Pages.


## Table of Contents
*   [Getting Started](#getting-started)
*   [Features](#features)
*   [Architecture](#architecture)
*   [Project Structure](#project-structure)
*   [License](#license)

## Getting Started

These instructions will get your project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js 18+ (recommended)
- npm
## Features

### **Airspace Loading & Parsing**
- Reads Australian airspace data directly from the included OpenAir-style text file  
  (`src/assets/Australian Airspace 28 November 2024_v1.txt`).  
- Supports AL (floor) and AH (ceiling) interpretation across feet, AGL, and flight levels.  
- Converts geographic coordinates (lat/lon) into projected XY space using Proj4.

### **3D Visualisation**
- Renders airspaces as extruded volumes using Three.js.  
- Multiple volumes can be added simultaneously, each with independent floor/ceiling adjustment.  
- True-to-scale XY geometry, with an optional global Z-exaggeration slider (1×–10×).  
- Global normalisation ensures all added volumes remain correctly positioned relative to each other.

### **2D SVG Output**
- Generates clean SVG paths for each airspace footprint.  
- Preview panel shows the combined footprint of all added volumes.  
- SVG suitable for export, documentation, GIS preprocessing, or 3D printing workflows.

### **User Controls**
- Add/remove airspace volumes dynamically.  
- Adjust individual altitude ranges.  
- Apply global height exaggeration without causing overlaps or distortions.  
- Automatic recomputation of shared bounds whenever volumes change.

### **Information Panel**
- Displays basic metadata for each selected airspace (class, name, altitude limits, etc.).  
- When multiple volumes are added, the panel appends each entry separated by a dashed divider for readability.

### **Architecture**
<div style="text-align: center;">
  <img src="https://vite.dev/logo.svg" alt="Vite" width="200">
  <img src="https://react.dev/images/brand/logo_dark.svg" alt="React" width="200">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/1024px-Typescript_logo_2020.svg.png" alt="Typescript" width="200">
</div>


### **Project Structure**
- `index.html` — App entry HTML
- `vite.config.ts` — Vite config
- `package.json` — Scripts and dependencies
- `public/` — Static assets (favicon, etc.)
- `src/main.tsx` — App bootstrap
- `src/App.tsx` — App shell and state management
- `src/assets/` — Airspace dataset + images
- `src/components/` — UI and scene components
- `src/hooks/` — Shared hooks
- `src/openAir/` — OpenAir parsing, geometry, and domain logic
- `src/styles/` — Theme and CSS
- `src/types/` — TypeScript types
- `src/utils/` — Utility helpers



---

### **Data Source & Disclaimer**

Airspace data is provided by **XcAustralia** and included under their published usage terms.  
Their dataset is *not authoritative* and must not be used for navigation.

> “Do not rely on this information. Airspace has been simplified and is not correct in all cases.  
> ALWAYS use current charts from Airservices Australia.”

For official information, refer to:  
https://www.airservicesaustralia.com/aip/aip.asp

---

### **Running the Application**

1. Install: `npm i` 
2. Run development environment: `npm run dev`  
3. Select an airspace from the dropdown.  
4. Add volumes, adjust altitudes, combine shapes, and export STL.

All computation runs in-browser.

---

### **Known Limitations**

- Dataset geometry reflects XcAustralia simplifications, not official boundaries.  
- Some airspaces contain arcs or directional bearings that rely on approximations.  
- Extremely large combinations may reduce performance on low-end devices.

---

### **Future Enhancements**

- Improved tolerance handling for complex arc sequences  
- Global coverage
- Optional terrain intersection modelling  
- Colour-coded visualisation based on airspace class  
- Altitude slicing (“cross-section mode”)

---
