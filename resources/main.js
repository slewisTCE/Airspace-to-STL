import * as THREE from 'three';

import {
    extractAirspaceClasses,
    extractAirspaceNames,
    createSVGPath,
    getBasicDetails,
    getBoundsForAirspace,
    getAltitudeInfo
} from './handler.js';

import { state } from './state.js';

import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

THREE.Cache.enabled = true;

const MIN_ALT_FT = 0;   // or whatever floor you like
const MAX_ALT_FT = 150000;  // give yourself room above FL600

// Three.js core
let camera, scene, renderer, controls;
let group, container, settings;
let exporter;

// SVG → Shape buffer
let shapes = [];

// Multi-volume management
const BASE_EXTRUDE_DEPTH = 20;  // original extrude depth
const FT_TO_METRES = 0.3048;

// SVG normalisation (must match handler.js)
const SVG_SIZE = 500;
const SVG_PADDING = 10;

// Keep XY & Z scaling coherent
const MESH_XY_SCALE = 0.34;     // the factor used on mesh.scale.x / y

let ALTITUDE_SCALE = 1;         // will be set from globalBounds so Z scales like X/Y
// Global vertical exaggeration (multiplier)
let zScaleFactor = 1;           // 1x .. 10x

let volumes = [];
let nextVolumeId = 1;
let folderVolumes;

// Shared XY normalization across all volumes
let globalBounds = null;        // { minX, maxX, minY, maxY }

// Download link
const link = document.createElement('a');
link.style.display = 'none';
document.body.appendChild(link);

// Load OpenAir data, then init Three.js & GUI
fetch(state.datasource)
    .then(response => response.text())
    .then(data => {
        state.content = data;
        state.blocks = state.content.split(/\n\s*\n/);
        init();
        animate();
    });

// Window resize handling
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Camera
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(0, -400, 400);

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e1e);

    // Lights
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(0, -250, 250).normalize();
    dirLight.castShadow = true;
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const followLight = new THREE.DirectionalLight(0xffffff, 0.8);
    followLight.position.set(40, 40, 0);
    camera.add(followLight);
    scene.add(camera);

    // Group for all volumes
    group = new THREE.Group();
    group.position.y = 0;
    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);

    // Grid helper
    const helper = new THREE.GridHelper(200, 20, 0x888888, 0x333333);
    helper.position.y = 0;
    helper.rotateX(Math.PI / 2);
    scene.add(helper);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 200;
    controls.maxDistance = 800;
    controls.minAzimuthAngle = -Math.PI / 2;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI;

    // Other events
    container.style.touchAction = 'none';
    window.addEventListener('resize', onWindowResize);

    // Info box toggle
    const toggleBtn = document.getElementById('toggle-info-box');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const box = document.getElementById('airspace-info-box');
            if (!box) return;

            box.classList.toggle('collapsed');
            toggleBtn.textContent = box.classList.contains('collapsed')
                ? 'Show Airspace Data'
                : 'Hide Airspace Data';
        });
    }

    createGUI();
}

function centerGroupXY() {
    if (!group || group.children.length === 0) return;

    const oldZ = group.position.z;
    group.position.set(0, 0, oldZ);

    const bbox = new THREE.Box3().setFromObject(group);
    const center = bbox.getCenter(new THREE.Vector3());

    group.position.x = -center.x;
    group.position.y = -center.y;
}

/**
 * Build a mesh + edges from an SVG path string.
 */
function buildMeshFromSVGPath(svgPath) {
    shapes = [];

    const svgMarkup = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <g id="LWPOLYLINE">
            <path d="${svgPath}" fill="none" stroke="red" stroke-width="1"/>
        </g>
    </svg>`;

    const loader_svg = new SVGLoader();
    const svgData = loader_svg.parse(svgMarkup);

    svgData.paths.forEach((path) => {
        shapes = path.toShapes(true, 64);
    });

    if (!shapes.length) {
        console.warn('No valid shapes extracted from SVG path.');
        return null;
    }

    const geometry = new THREE.ExtrudeGeometry(shapes[0], {
        depth: BASE_EXTRUDE_DEPTH,
        bevelEnabled: false,
        curveSegments: 64
    });

    const material = new THREE.MeshPhongMaterial({
        color: 0x0094aa,
        flatShading: true,
        transparent: true,
        opacity: 0.75
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Keep existing XY behaviour
    mesh.scale.x = MESH_XY_SCALE;
    mesh.scale.y = -MESH_XY_SCALE;
    mesh.position.z = 0;

    // Outline edges
    const edgeGeometry = new THREE.EdgesGeometry(geometry, 20);
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x005390,
        transparent: true,
        opacity: 0.8
    });

    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.scale.copy(mesh.scale);
    edges.position.copy(mesh.position);
    edges.rotation.copy(mesh.rotation);

    return { geometry, mesh, edges };
}

/**
 * Recompute globalBounds as the union of all current volumes' raw projected bounds.
 */
function recalcGlobalBounds() {
    globalBounds = null;
    for (const v of volumes) {
        const b = getBoundsForAirspace(v.name);
        if (!b) continue;

        if (!globalBounds) {
            globalBounds = { ...b };
        } else {
            globalBounds.minX = Math.min(globalBounds.minX, b.minX);
            globalBounds.maxX = Math.max(globalBounds.maxX, b.maxX);
            globalBounds.minY = Math.min(globalBounds.minY, b.minY);
            globalBounds.maxY = Math.max(globalBounds.maxY, b.maxY);
        }
    }

    // 🔧 Derive altitude scale so 1m vertically ≈ 1m horizontally in the scene
    if (globalBounds) {
        const spanX = globalBounds.maxX - globalBounds.minX;
        const spanY = globalBounds.maxY - globalBounds.minY;
        const maxSpan = Math.max(spanX, spanY) || 1;

        // This matches handler.js normalisation: (SVG_SIZE - 2 * SVG_PADDING) / maxSpan
        const svgScale = (SVG_SIZE - 2 * SVG_PADDING) / maxSpan;

        // Horizontal scene-units per metre is svgScale * MESH_XY_SCALE,
        // so we use the same for vertical metres:
        ALTITUDE_SCALE = svgScale * MESH_XY_SCALE;
    }

}

/**
 * Rebuild the geometry of all volumes so they share the same normalization (globalBounds).
 */
function rebuildAllVolumesGeometry() {
    // Remove existing meshes/edges from scene and dispose them
    for (const v of volumes) {
        if (v.mesh) {
            group.remove(v.mesh);
            v.mesh.geometry.dispose();
            v.mesh.material.dispose();
            v.mesh = null;
        }
        if (v.edges) {
            group.remove(v.edges);
            v.edges.geometry.dispose();
            v.edges.material.dispose();
            v.edges = null;
        }
    }

    if (!globalBounds) {
        return; // nothing to build
    }

    for (const v of volumes) {
        const svgPath = createSVGPath(v.name, globalBounds);
        if (!svgPath) continue;

        const built = buildMeshFromSVGPath(svgPath);
        if (!built) continue;

        v.mesh = built.mesh;
        v.edges = built.edges;

        group.add(v.mesh);
        group.add(v.edges);

        updateVolumeTransform(v);
    }

    centerGroupXY();   // ✅ center the combined set, not each mesh
}

/**
 * Apply floor/ceiling → Z scaling + positioning to a given volume.
 * Floor/Ceiling are stored in FEET; they’re converted to metres and then
 * scaled with ALTITUDE_SCALE so Z matches X/Y rate.
 */
function updateVolumeTransform(volume) {
    if (!volume.mesh && !volume.edges) return;

    // Floor/Ceiling in feet from GUI
    const floorFt = typeof volume.floor === 'number' ? volume.floor : 0;
    const ceilingFt = typeof volume.ceiling === 'number'
        ? volume.ceiling
        : floorFt + 1000;

    // Convert to metres
    const floorM   = floorFt   * FT_TO_METRES;
    const ceilingM = ceilingFt * FT_TO_METRES;

    // Scene Z for floor & ceiling, both scaled by zScaleFactor
    const floorScene = floorM   * ALTITUDE_SCALE * zScaleFactor;
    const ceilScene  = ceilingM * ALTITUDE_SCALE * zScaleFactor;

    // Avoid zero-thickness
    const sceneHeight = Math.max(ceilScene - floorScene, ALTITUDE_SCALE);

    // Extrude geometry has fixed depth (BASE_EXTRUDE_DEPTH),
    // so we stretch it to the desired sceneHeight.
    const scaleZ = sceneHeight / BASE_EXTRUDE_DEPTH;

    if (volume.mesh)  volume.mesh.scale.z  = scaleZ;
    if (volume.edges) volume.edges.scale.z = scaleZ;

    // 🔧 Anchor local z=0 at the (scaled) floor altitude
    if (volume.mesh)  volume.mesh.position.z  = floorScene;
    if (volume.edges) volume.edges.position.z = floorScene;
}



/**
 * Remove a volume from scene, memory, GUI, and rescale remaining volumes.
 */
function removeVolume(volume) {
    if (volume.mesh) {
        group.remove(volume.mesh);
        volume.mesh.geometry.dispose();
        volume.mesh.material.dispose();
    }
    if (volume.edges) {
        group.remove(volume.edges);
        volume.edges.geometry.dispose();
        volume.edges.material.dispose();
    }

    volumes = volumes.filter(v => v.id !== volume.id);

    if (volume.folder && typeof volume.folder.destroy === 'function') {
        volume.folder.destroy();
    }

    recalcGlobalBounds();
    rebuildAllVolumesGeometry();
    refreshInfoAndPreviewFromVolumes();

}

/**
 * Create a new volume record for the given airspace and rebuild everything.
 */
function createVolume(airspaceName, airspaceClass) {
    // Quick sanity check that this airspace is valid & has bounds
    const b = getBoundsForAirspace(airspaceName);
    if (!b) {
        console.warn('No bounds for airspace:', airspaceName);
        return;
    }

    // Default values (in feet) from GUI
    let floorFt = settings ? settings['Default Floor'] : 0;
    let ceilingFt = settings ? settings['Default Ceiling'] : 2500;

    // Try to auto-parse AL / AH from the OpenAir block
    const altInfo = getAltitudeInfo(airspaceName);
    if (altInfo && altInfo.floorFt != null && altInfo.ceilingFt != null) {
        floorFt = altInfo.floorFt;
        ceilingFt = altInfo.ceilingFt;
    }

    const volume = {
        id: nextVolumeId++,
        name: airspaceName,
        airspaceClass,
        floor: floorFt,        // stored in feet, for the GUI
        ceiling: ceilingFt,    // stored in feet, for the GUI
        mesh: null,
        edges: null,
        folder: null
    };

    volumes.push(volume);

// GUI folder per volume
    if (folderVolumes) {
        const volFolder = folderVolumes.addFolder(airspaceName);
        volume.folder = volFolder;

        const floorCtrl = volFolder
            .add(volume, 'floor', MIN_ALT_FT, MAX_ALT_FT)
            .name('Floor (ft)');
        const ceilCtrl  = volFolder
            .add(volume, 'ceiling', MIN_ALT_FT, MAX_ALT_FT)
            .name('Ceiling (ft)');

        const update = () => updateVolumeTransform(volume);
        floorCtrl.onChange(update);
        ceilCtrl.onChange(update);

        volFolder.add({ remove: () => removeVolume(volume) }, 'remove').name('Remove');
        volFolder.open();
    }


    // Update global bounding box & rebuild all geometries
    recalcGlobalBounds();
    rebuildAllVolumesGeometry();
    refreshInfoAndPreviewFromVolumes();

}

function refreshInfoAndPreviewFromVolumes() {
    const infoEl = document.getElementById('airspace-info-content');
    const previewPath = document.getElementById('svg-preview-path');

    // No volumes → clear preview and show hint
    if (!volumes.length) {
        if (previewPath) previewPath.setAttribute('d', '');
        if (infoEl) infoEl.textContent = 'No volumes added...';
        return;
    }

    // Ensure we have global bounds so all SVGs share the same normalisation
    if (!globalBounds) {
        recalcGlobalBounds();
    }
    const bounds = globalBounds;

    const pathParts = [];
    const infoParts = [];

    for (const v of volumes) {
        // SVG path for this volume
        const svgPath = bounds
            ? createSVGPath(v.name, bounds)
            : createSVGPath(v.name);
        if (svgPath) {
            pathParts.push(svgPath);
        }

        // Info block for this volume
        const airspaceInfo = getBasicDetails(v.name);
        if (airspaceInfo) {
            infoParts.push(
                airspaceInfo.replace(/, /g, ',\n  ')
            );
        } else {
            infoParts.push(`No data available for ${v.name}`);
        }
    }

    // Combined SVG path
    if (previewPath) {
        previewPath.setAttribute('d', pathParts.join(' '));
    }

    // Combined info, separated by dashed bars
    if (infoEl) {
        const separator = '\n\n------------------------------\n\n';
        infoEl.textContent = infoParts.join(separator);
    }
}


/**
 * Update info box + 2D preview SVG when airspace name changes.
 * Uses shared globalBounds if present (so preview matches the 3D scale).
 */
function airspaceNameChangeController(airspaceName) {
    const infoEl = document.getElementById('airspace-info-content');

    // Before any volumes are added, keep the old “single selection” behaviour.
    if (!volumes.length) {
        const previewPath = document.getElementById('svg-preview-path');

        if (!airspaceName || airspaceName === 'None') {
            if (infoEl) infoEl.textContent = 'Select an airspace...';
            if (previewPath) previewPath.setAttribute('d', '');
            return;
        }

        const svgPathOutput = globalBounds
            ? createSVGPath(airspaceName, globalBounds)
            : createSVGPath(airspaceName);

        const airspaceInfo = getBasicDetails(airspaceName);

        if (infoEl) {
            infoEl.textContent = (airspaceInfo || 'No data available.').replace(/, /g, ',\n  ');
        }

        if (previewPath) {
            previewPath.setAttribute('d', svgPathOutput || '');
        }

        return;
    }

    // Once volumes exist, sidebar reflects the volumes, not the selection
    refreshInfoAndPreviewFromVolumes();
}


function createGUI() {
    const airspaceClassOptions = extractAirspaceClasses();
    const defaultClass = airspaceClassOptions[0] || 'None';
    const airspaceNameOptions = extractAirspaceNames(defaultClass);

    const panel = new GUI({ autoPlace: false });
    const guiContainer = document.createElement('div');
    guiContainer.classList.add('custom-lil-gui');
    guiContainer.appendChild(panel.domElement);
    document.body.appendChild(guiContainer);

    const folder1 = panel.addFolder('Airspace Selection');
    const folder3 = panel.addFolder('Altitude Scaler');
    const folder4 = panel.addFolder('Downloader');
    folderVolumes = panel.addFolder('Volumes');

    settings = {
        'Airspace Class': defaultClass,
        'Airspace Name': 'None',
        'Default Floor': 0,
        'Default Ceiling': 2500,
        'Z Scale': 1,
        'Add Volume': () => {
            const cls = settings['Airspace Class'];
            const name = settings['Airspace Name'];
            if (!name || name === 'None') {
                console.warn('No airspace name selected.');
                return;
            }
            // Floor/Ceiling now auto-pop from AL/AH with fallback to defaults
            createVolume(name, cls);
        },
        'Download STL': exportBinary
    };

    const airspaceClassController = folder1.add(settings, 'Airspace Class', airspaceClassOptions).name('Class');
    let airspaceNameController = folder1.add(settings, 'Airspace Name', airspaceNameOptions).name('Name');
    let addVolumeController = folder1.add(settings, 'Add Volume').name('Add Volume');

    airspaceClassController.onChange(function (newClass) {
        const names = extractAirspaceNames(newClass);
        const options = names.length ? names : ['None'];
        const first = options[0];

        settings['Airspace Name'] = first;

        // 🔧 Rebuild BOTH Name and Add Volume in the correct order:
        airspaceNameController.destroy();
        addVolumeController.destroy();

        airspaceNameController = folder1.add(settings, 'Airspace Name', options).name('Name');
        airspaceNameController.onChange(airspaceNameChangeController);

        addVolumeController = folder1.add(settings, 'Add Volume').name('Add Volume');

        if (first && first !== 'None') {
            airspaceNameChangeController(first);
        } else {
            airspaceNameChangeController(null);
        }
    });

    airspaceNameController.onChange(airspaceNameChangeController);

    const zScaleController = folder3.add(settings, 'Z Scale', 1, 50, 1).name('Z Scale (x)');
    zScaleController.onChange((val) => {
        zScaleFactor = val;
        // Re-apply transforms with new exaggeration
        volumes.forEach(v => updateVolumeTransform(v));
    });

    folder1.open();
    folderVolumes.open();

    folder4.add(settings, 'Download STL');
    folder4.open();

}


/**
 * Export all volumes in `group` as a single STL.
 */
function exportBinary() {
    if (!group || group.children.length === 0) {
        console.warn('No geometry to export.');
        return;
    }

    exporter = new STLExporter();
    const options = { binary: true };
    const result = exporter.parse(group, options);

    let filename = 'airspace.stl';
    if (volumes.length === 1) {
        const safeName = volumes[0].name
            .replace(/[<>:"/\\|?*\[\]]+/g, '')
            .trim()
            .replace(/\s+/g, '_');
        filename = `${safeName}_DAH-Vol.stl`;
    } else if (volumes.length > 1) {
        filename = 'airspace_multi_DAH-Vol.stl';
    }

    saveArrayBuffer(result, filename);
}

function saveArrayBuffer(buffer, filename) {
    save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
}

function save(blob, filename) {
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() {
    renderer.render(scene, camera);
}
