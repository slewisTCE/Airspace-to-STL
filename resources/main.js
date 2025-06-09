import * as THREE from 'three';

import { extractAirspaceClasses, extractAirspaceNames, createSVGPath, getAirspaceDetailsByName } from './handler.js';
import { state } from './state.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SVGLoader } from "three/addons/loaders/SVGLoader";
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

THREE.Cache.enabled = true;

let container;
let infoContainer = null;
let camera, scene, renderer, controls;
let group, bbox, materials;
let settings;
let svgMesh, svgGeometry, exporter;
let shapes = [];
let material = new THREE.MeshPhongMaterial({ color: 0x0094aa, flatShading: true });

const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

fetch(state.datasource)
    .then(response => response.text())
    .then(data => {
        state.content = data;
        state.blocks = state.content.split(/\n\s*\n/);
        init(); // call only after content is ready
        loadSVG();
        animate();
    });

function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild( renderer.domElement );

    // CAMERA
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.set( 0, -250, 250 );

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xe0e0e0 );

    // LIGHTS
    const dirLight = new THREE.DirectionalLight( 0xffffff, 1.0);
    dirLight.position.set( 0, -250, 250 ).normalize();
    dirLight.castShadow = true;
    scene.add( dirLight );
    
    const ambientLight = new THREE.AmbientLight( 0xffffff,0.1);
    scene.add( ambientLight );

    const followLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
    followLight.position.set(40, 40, 0);

    camera.add( followLight );
    scene.add( camera );

    materials = [
        new THREE.MeshPhongMaterial( { color: 0xff4800, flatShading: true } ), // front
        new THREE.MeshPhongMaterial( { color: 0xff4800} ) // side
    ];

    group = new THREE.Group();
    group.position.y = 0;
    group.castShadow = true;
    group.receiveShadow = true;

    scene.add( group );

    const helper = new THREE.GridHelper( 200, 20 );
    helper.position.y = 0;
    helper.material.opacity = 0.8;
    helper.material.transparent = true;
    helper.rotateX(Math.PI / 2);
    scene.add( helper );

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 200;
    controls.maxDistance = 800;
    controls.minAzimuthAngle = -Math.PI / 2;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI;

    // EVENTS
    container.style.touchAction = 'none';

    createGUI();

    window.addEventListener( 'resize', onWindowResize );

    document.getElementById('toggle-info-box').addEventListener('click', () => {
        const box = document.getElementById('airspace-info-box');
        box.classList.toggle('collapsed');
        document.getElementById('toggle-info-box').textContent = box.classList.contains('collapsed') ? 'Show Airspace Data' : 'Hide Airspace Data';
    });
    

}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function loadSVG(svgPath) {
     // Clear previous shapes and mesh
     shapes = [];

     if (svgMesh) {
        group.remove(svgMesh);
        svgMesh.geometry.dispose();
        svgMesh.material.dispose();
        svgMesh = null;
    }

    const svgMarkup  = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                        <g id="LWPOLYLINE">
                            <path d="
                                ${svgPath}
                            " fill="none" stroke="red" stroke-width="1"/>
                        </g>
                    </svg>`
        
    const loader_svg = new SVGLoader();
    const svgData = loader_svg.parse(svgMarkup);

    svgData.paths.forEach((path, i) => {
        shapes = path.toShapes(true);
    });

    shapes.forEach((shape, i) => {
        svgGeometry = new THREE.ExtrudeGeometry(shape, {
            depth: 20,
            bevelEnabled: false
          });
    });

    svgMesh = new THREE.Mesh(svgGeometry, material);
    svgMesh.scale.x = 0.34;
    svgMesh.scale.y = -0.34;
    svgMesh.geometry.center();
    svgMesh.position.z = 10;

    bbox = new THREE.Box3();
    bbox.setFromObject(svgMesh);

    group.add(svgMesh);
}

function animate() {
    requestAnimationFrame( animate );
    controls.update();
    render();
}

function render() {
    renderer.render( scene, camera );
}

function exportBinary() {
    exporter = new STLExporter();
    // Configure export options
    const options = { binary: true }

    // Parse the input and generate the STL encoded output
    const result = exporter.parse( group, options );
    
    const rawName = settings['Airspace Name'] || 'airspace';
    const safeName = rawName.replace(/[<>:"/\\|?*\[\]]+/g, '').trim().replace(/\s+/g, '_');
    saveArrayBuffer(result, `${safeName}_DAH-Vol.stl`);

}

function save( blob, filename ) {
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
}

function saveArrayBuffer( buffer, filename ) {
    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}

function airspaceNameChangeController(airspaceName) {
    const svgPathOutput = createSVGPath(airspaceName);
    loadSVG(svgPathOutput);
    const airspaceInfo = getAirspaceDetailsByName(airspaceName);
    document.getElementById('airspace-info-content').textContent = (airspaceInfo || 'No data available.').replace(/, /g, ',\n\t');
}

function createGUI() {
    const airspaceClassOptions = extractAirspaceClasses();
    const defaultClass = airspaceClassOptions[0] || 'None';
    const airspaceNameOptions = extractAirspaceNames(defaultClass);

    const panel = new GUI();

    const folder1 = panel.addFolder('Airspace Selection');
    const folder2 = panel.addFolder('Airspace Options')
    const folder3 = panel.addFolder('Downloader');

    settings = {
        'Airspace Class': defaultClass,
        'Airspace Name': airspaceNameOptions[0] || 'None',
        'Altitude Floor' : 0,
        'Altitude Ceiling' : 2500,
        'Download STL': exportBinary,
    };

    // Controllers (needed for dynamic updating)
    const airspaceClassController = folder1.add(settings, 'Airspace Class', airspaceClassOptions).name('Class');
    let airspaceNameController = folder1.add(settings, 'Airspace Name', airspaceNameOptions).name('Name');
    let altitudeFloor = folder2.add(settings, 'Altitude Floor', 0, 10000).name('Altitude Floor');
    let altitudeCeiling = folder2.add(settings, 'Altitude Ceiling', 0, 10000).name('Altitude Ceiling');

    // Update "Airspace Name" when "Airspace Class" changes
    airspaceClassController.onChange(function (newClass) {
        const names = extractAirspaceNames(newClass);
        settings['Airspace Name'] = names[0] || 'None';
    
        airspaceNameController.destroy();
        airspaceNameController = folder1.add(settings, 'Airspace Name', names).name('Name');
    
        // Rebind onChange after recreating the controller
        airspaceNameController.onChange(function (newAirspace) {
            airspaceNameChangeController(newAirspace);    
        });
    });

    airspaceNameController.onChange(function (newAirspace) {
        airspaceNameChangeController(newAirspace);
    });

    altitudeCeiling.onChange(function (newCeiling) {
        console.log(newCeiling);
    });

    folder1.open();
    folder2.open();
    folder3.add(settings, 'Download STL');
    folder3.open();
}
