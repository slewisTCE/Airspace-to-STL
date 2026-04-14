# DAH Volume Modeller (Airspace‑to‑STL)
## Interactive 3D & SVG Explorer for OpenAir‑Formatted Australian Airspace

This tool visualises Australian airspace boundaries defined in the OpenAir specification. It parses the text‑based dataset, converts geographic coordinates into a projected plane using Proj4 and extrudes the resulting shapes into 3D volumes. Users can explore, combine and export these volumes through an intuitive web interface. Both 3D views (powered by Three.js) and 2D SVG footprints are provided, and the application runs completely in the browser, making it suitable for static hosting platforms such as GitHub Pages.

## Key Features
### Airspace Loading & Parsing

- **OpenAir data ingestion** – The application reads Australian airspace from an OpenAir‑style text file. You can specify the file to load via the `VITE_OPENAIR_SOURCE_FILE` variable in `.env`, allowing datasets to be swapped without recompiling. The parser understands AL (floor) and AH (ceiling) records across feet, AGL and flight levels, and uses Proj4 to project latitude/longitude pairs into a local XY coordinate system.
- **Rich domain model** – Each airspace is represented by a set of polygons, arcs and circles defined by OpenAir commands. Classes map codes such as `AC`, `AN`, `AL` and `AH` to colour and metadata using `airspaceClassMap`. A combined centroid is computed to centre the projection, and a `Volume` class stores original floor/ceiling values and computes vertical scaling.

### 3D Visualisation
- **Extruded volumes** – Footprints are converted into SVG paths and extruded into Three.js meshes using `ExtrudeGeometry`. True‑to‑scale geometry is preserved in the XY plane, while a global Z‑exaggeration slider (1×–50×) lets you emphasise altitude differences.
- **Multiple volumes** – You can add several airspaces simultaneously; each retains its own floor and ceiling and can be shown or hidden individually. Global normalisation ensures that all added volumes remain correctly positioned relative to each other.
- **3D controls** – The embedded Three.js canvas supports orbit controls, autorotation, adjustable opacity and vertical scaling. A grid helper and gizmo assist with orientation.

### 2D SVG Output
- **Clean footprints** – For each airspace, the tool generates a tidy SVG path representing its 2D footprint. A preview panel shows the combined footprint of all added volumes.
- **Export ready** – SVG output is suitable for documentation, GIS preprocessing or 3D printing workflows. Export the footprint or combine with the STL export functions built into the 3D viewer.

### User Controls & Information Panel
- **Dynamic volume management** – Add or remove volumes at any time, adjust individual floor and ceiling heights and apply global height exaggeration without overlapping shapes. The interface automatically recomputes bounds whenever volumes change.
- **Information panel** – Displays the class, name and altitude limits for each selected airspace. When multiple volumes are selected, entries are separated by a dashed divider for readability.
- **Theme switching** – Toggle between light and dark modes; the preference is saved locally and re‑applied on load.
- **Alerts and notifications** – Notistack provides contextual snack‑bar messages when volumes are added, modified or removed.


### **Data Source & Disclaimer**

Airspace data is provided by **XcAustralia** and included under their published usage terms.  
Their dataset is *not authoritative* and must not be used for navigation.
 - [XcAustralia - 2D Utiliy](https://xcaustralia.org/aircheck/aircheck.php)
 - [XcAustralia - Resource Download](https://xcaustralia.org/download/)

> [!IMPORTANT]
> “Do not rely on this information. Airspace has been simplified and is not correct in all cases.  
> ALWAYS use current charts from Airservices Australia.” For official information consult the Aeronautical Information Publication (AIP) from Airservices Australia.

For official information, refer to:  
https://www.airservicesaustralia.com/aip/aip.asp


### Technical Specifications

| Area                      | Details                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Languages**             | TypeScript for application code and tests; CSS for styling.                                                                                                                                                                                                                                                                                                                      |
| **Frameworks/Libraries**  | React 19 and React DOM; Vite is used as the build tool and dev server with scripts `npm run dev`, `npm run build`, `npm run preview` and `npm run test`.  Material‑UI (`@mui/material`, `@mui/icons-material`) provides UI components; `@emotion/react` and `@emotion/styled` supply styling helpers; `react‑three/fiber` and `@react-three/drei` integrate Three.js into React. |
| **3D & SVG Rendering**    | Three.js (`three`) for geometry and materials; SVG paths are parsed and extruded via `three/examples/jsm/Addons.js` and `ExtrudeGeometry`.                                                                                                                                                                                                                                       |
| **OpenAir Parsing**       | Custom classes (`OpenAirAirspace`, `OpenAirAirspaces`, `Volume`, `Altitude`, `Arc`, `Circle`, `Polygon`) decode OpenAir commands (AC/AN/AL/AH) and geometric primitives; classes map codes to names and colours via `airspaceClassMap`.                                                                                                                                          |
| **State Management**      | React hooks (`useState`, `useEffect`, `useMemo`) manage volumes, themes, loading/error state and user preferences.  Notistack is used for snack‑bar notifications.                                                                                                                                                                                                               |
| **Environment Variables** | Data source is configured through `.env` via `VITE_OPENAIR_SOURCE_FILE`.  The default `.env` file points to a sample dataset under `public/airspaces`.                                                                                                                                                                                                                           |


### Project Structure
```
Airspace-to-STL/
├── public/               # Static assets and sample airspace data
│   └── airspaces/        # Example OpenAir files (e.g. Australian Airspace 27 Nov 2025)
├── src/
│   ├── App.tsx          # Application shell and state management
│   ├── main.tsx         # App bootstrap
│   ├── components/       # UI components and 3D scene definitions
│   ├── hooks/            # Shared hooks for geometry generation and window sizing
│   ├── openAir/          # Parsing, geometry and domain logic
│   ├── assets/           # Static images and data
│   ├── styles/           # Theme definitions and CSS
│   └── utils/            # Utility helpers
├── vite.config.*         # Vite configuration
├── package.json          # Scripts and dependencies
├── .env                  # Environment variables
└── index.html            # Application entry point
```

## Getting Started
### Prerequisites
- **Node.js 18+** – Install Node.js (version 18 or later)
- **npm**
- **Git** – Clone the repository locally

### Installation & Running

1. **Clone the repository**
```bash
git clone https://github.com/slewisTCE/Airspace-to-STL.git
cd Airspace-to-STL
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure the data source** – Copy `.env` to your working directory and set `VITE_OPENAIR_SOURCE_FILE` to your desired OpenAir file path. The repository includes sample datasets under `public/airspaces`.

4. **Run development server**
```bash
npm run dev
```

Vite will provide a local URL (e.g. `http://localhost:5173`). Open it in your browser. Select an airspace, add volumes, adjust altitudes, combine shapes and export STL.

5. **Build for production**

```bash
npm run build
npm run preview
```

The app can be deployed as static files on any hosting service.

6. **Run tests**

```bash
npm run test
```

---

## How to use
When opening the utility, read and address the disclaimer.

## Exploring the utility
The utility will present you with 3 main areas. From left to right;

### A. Control Pane ###
First you will find the **Controls** drop down where you can:
- **Z-Scale** - Adjusting this will decrease and increase the scale of the altitude for better visibility.
- **Mesh Opacity** - Adjusting this will manipulate the transperancy of the added volumes.
- **Auto-rotate** - toggling this will animate a rotation of the added volumes.
- **Reset View** - This returns all changes to default.
- **Volume Selector** - This allows you to filter the volumes through **State > Locale > Class > Name** before using the Add **'Volume button'**. *Note - you can add all volumes applicable to the a specific **Class** filter*.

The second drop down **Volumes** populates with the added airspace volumes as drop downs and allows you to:
- Manage their individual **Airspace Ceiling** and **Airspace Floor**
- Delete a specific Volume - this will remove the volume from the Mesh, but will become available in the Volume Selector again.
- Toggle a Volumes visibility - this will hide the volumes in the **'Viewport'**, but will be part of the exported mesh regardless of the toggles setting.
-  Clear All - this button found at the top of the volumes will allow you to remove all applied volumes from the mesh.

The last item found in the Control Pane is the **'Download Model'** button. This will package the volume into a ZIP file titled `airspace-combined-zX-YYYYMMDD.zip`. The contents of which are;
- A stereolithography (STL) file of the combined airspace volumes. You can use this file in any standard 3D printing slicer software. The individual airspace volumes can be split for multi-colour printing if your hardware is capable.
- A text file containing specific information about what airspace volumes were used in your combined mesh.

### B. Viewport Pane ###
The viewport is a standard 3D model visualiser, to navigate use the following controls;
- `Mousewheel`: zoom in and out
- `Left Click`: orbit the X and Y axes while anchored to the center of the mesh.
- `Right Click`: pan the X and Y axes

> You can achieve different results with the addition of holding Ctrl or Shift, but they're all variations of these 3 controls.

Selecting a volume in the viewport will highlight the selected item, open focus to its own controls in the Volume Manager and populate the 'Airspace Info Pane' with applicable data.

### C. Airspace Info Pane ###

This pane displays OpenAir data translation of the DAH inline with which airspace volume is selected.
 
---

### Known Limitations
- The dataset reflects simplifications made by XcAustralia and may not match official boundaries.
- Some airspaces contain arcs or directional bearings that rely on approximations.
- Extremely large combinations of volumes may reduce performance on low‑end devices.

### Future Enhancements

For intended improvements, please see this repositries issue log.
- https://github.com/slewisTCE/Airspace-to-STL/issues

### License

This project utilises an MIT licence

https://github.com/slewisTCE/Airspace-to-STL/blob/main/LICENCE
