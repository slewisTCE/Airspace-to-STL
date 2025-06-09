import * as THREE from 'three';

import { extractAirspaceClasses, extractAirspaceNames, createSVGPath } from './handler.js';
import { state } from './state.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SVGLoader } from "three/addons/loaders/SVGLoader";
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

THREE.Cache.enabled = true;

let container;
let camera, scene, renderer, controls;
let group, bbox, materials;
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
    // const svgPath = `M 48.89287729989707 183.89045650444473 L 48.192839163873145 132.891603577414 L 48.192839163873145 132.891603577414 A 36.26304372260307 36.26304372260307 0 0 1 24.596857037053844 70.13744666665025 L 24.596857037053844 70.13744666665025 A 35.994866379133406 35.994866379133406 0 1 1 60.96008380000639 62.286616644805974 L 60.96008380000639 62.286616644805974 A 36.34036915444785 36.34036915444785 0 0 1 84.00552382653574 107.35963107342576 L 96.51501296702304 118.6277598027653 L 104.25477089631438 142.9671952790087 L 154.74770344827112 291.3841233865955 L 154.74770344827112 291.3841233865955 A 37.73028147731745 37.73028147731745 0 0 1 175.93175894690881 334.56990357954857 L 175.93175894690881 334.56990357954857 A 37.915965367627344 37.915965367627344 0 0 1 132.75894491358198 384.1470859784639 L 119.40812127081179 406.1101984522771 L 78.7360412043435 448.62065863185455 L 78.7360412043435 448.62065863185455 A 36.43288855809996 36.43288855809996 0 0 1 60.64609102112087 496.56090804577224 L 52.909768192349965 480.110820673215 L 52.909768192349965 480.110820673215 A 18.12314701081391 18.12314701081391 0 1 0 37.54730895547068 447.3466801353407 L 24.347355004403063 422.2846266928632 L 26.67923303175599 421.451080723863 L 53.01567226454507 418.0855640433955 L 55.40740711058519 408.4881391027152 L 59.515416541897274 401.061196258451 L 59.515416541897274 401.061196258451 A 6.0766055122185385 6.0766055122185385 0 0 1 64.42125880821999 390.0014348093898 L 68.43180014406227 381.1612785469042 L 89.20762045837459 360.0779956028499 L 98.3036167829386 354.14638006458165 L 98.3036167829386 354.14638006458165 A 49.710457366294904 49.710457366294904 0 0 1 99.63144835701767 295.43025297861186 L 69.97533989276447 209.25704851458806 L 75.09526692211097 201.38690469770387 L 55.98066544608381 198.95750286016352 L 48.89287729989707 183.89045650444473`;

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

function save( blob, filename ) {
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
}

function saveArrayBuffer( buffer, filename ) {
    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}

function createGUI() {
    const airspaceClassOptions = extractAirspaceClasses();
    const defaultClass = airspaceClassOptions[0] || 'None';
    const airspaceNameOptions = extractAirspaceNames(defaultClass);

    const panel = new GUI();

    const folder1 = panel.addFolder('Airspace Selection');
    const folder2 = panel.addFolder('Airspace Options')
    const folder3 = panel.addFolder('Downloader');
    const folder4 = panel.addFolder('Test Area');

    const settings = {
        'Airspace Class': defaultClass,
        'Airspace Name': airspaceNameOptions[0] || 'None',
        'Altitude Floor' : 0,
        'Altitude Ceiling' : 2500,
        'Download STL': exportBinary,
        'Test Drop': 'bop'
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
    });

    airspaceNameController.onChange(function (newAirspace) {
        const svgPathOutput = createSVGPath(newAirspace);
        loadSVG(svgPathOutput);
    });

    altitudeCeiling.onChange(function (newCeiling) {
        console.log(newCeiling);
    });
    

    folder1.open();
    folder2.open();
    folder3.add(settings, 'Download STL');
    folder3.open();
    folder4.add(settings, 'Test Drop');
    folder4.open();
}







