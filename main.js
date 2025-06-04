
import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SVGLoader } from "three/addons/loaders/SVGLoader";
import { STLExporter } from 'three/addons/exporters/STLExporter.js';


THREE.Cache.enabled = true;

let container;
let camera, scene, renderer, controls;
let group, materials, bbox;
let svgMesh, svgGeometry, exporter;
let shapes = [];
let material = new THREE.MeshPhongMaterial({ color: 0x0094aa, flatShading: true });

let content = '';
let blocks = [];

let panel, airspaceClassController, airspaceNameController;
const settings = {
    airspaceClass: null,
    airspaceName: null,
    'Download STL': exportBinary,
    'Test Drop': 'None'
};


fetch("Australian Airspace 28 November 2024_v1.txt")
    .then(response => response.text())
    .then(data => {
        content = data;
        blocks = content.split(/\n\s*\n/);
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
    // dirLight.position.set( -20, 400, 0 ).normalize();
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

    // loadFont();
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

}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function loadSVG() {

    const svgMarkup  = `<svg viewBox="100 -20 420 320" xmlns="http://www.w3.org/2000/svg">
                            <g id="LWPOLYLINE">
                                <path d="
                                    M 139.9163599	195.9916708
                                    L 222.5671548	7.663962821
                                    A 529.1913639	595.3459271
                                    0 0 1 478.742263	125.1521297
                                    L 489.8863223	157.201366
                                    L 313.1045957	280.677387
                                    A 369.5982691	323.5254546
                                    1 0 0 139.9163599	195.9916708
                                " stroke="red" stroke-width="1" fill="none"
                                />
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
    svgMesh.scale.y = -0.5;
    svgMesh.geometry.center();
    svgMesh.position.z = 10;

    bbox = new THREE.Box3();
    bbox.setFromObject(svgMesh);
    console.log("Bounding box details are:");
    console.log(bbox.min);
    console.log(bbox.max);

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
    saveArrayBuffer( result, text + ' DAH-Vol.stl' );
}

const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

function save( blob, filename ) {
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
}

function saveArrayBuffer( buffer, filename ) {
    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}

function extractAirspaceClasses() {
    if (!content) return [];
    const airspaceClasses = new Set(
        content
            .split("\n")
            .filter(line => line.startsWith("AC "))
            .map(line => line.slice(3).trim())
    );
    return Array.from(airspaceClasses);
}

function extractAirspaceNames(filterClass = null) {
    const airspaceNames = [];

    blocks.forEach(block => {
        const lines = block.trim().split("\n");
        const nameLine = lines.find(line => line.startsWith("AN "));
        const classLine = lines.find(line => line.startsWith("AC "));

        if (nameLine) {
            const name = nameLine.slice(3).trim();
            const airspaceClass = classLine ? classLine.slice(3).trim() : null;

            if (!filterClass || airspaceClass === filterClass) {
                airspaceNames.push(name);
            }
        }
    });

    return airspaceNames;
}

function createGUI() {
    const airspaceClassOptions = extractAirspaceClasses();
    const defaultClass = airspaceClassOptions[0] || 'None';
    const airspaceNameOptions = extractAirspaceNames(defaultClass);

    const panel = new GUI();

    const folder1 = panel.addFolder('Airspace Details');
    const folder2 = panel.addFolder('Downloader');
    const folder3 = panel.addFolder('Test Area');

    const settings = {
        'Airspace Class': defaultClass,
        'Airspace Name': airspaceNameOptions[0] || 'None',
        'Download STL': exportBinary,
        'Test Drop': defaultClass
    };

    // Controllers (needed for dynamic updating)
    const airspaceClassController = folder1.add(settings, 'Airspace Class', airspaceClassOptions).name('Class');
    let airspaceNameController = folder1.add(settings, 'Airspace Name', airspaceNameOptions).name('Name');

    // Update "Airspace Name" when "Airspace Class" changes
    airspaceClassController.onChange(function (newClass) {
        const names = extractAirspaceNames(newClass);
        settings['Airspace Name'] = names[0] || 'None';
    
        airspaceNameController.destroy(); 
        airspaceNameController = folder1.add(settings, 'Airspace Name', names).name('Name');
    });
    

    folder1.open();
    folder2.add(settings, 'Download STL');
    folder2.open();
    folder3.add(settings, 'Test Drop', airspaceClassOptions).name('Test Drop');
    folder3.open();
}







