/*
* UBC CPSC 314
* Assignment 4 Template
*/

import { setup, createScene, loadGLTFAsync, loadOBJAsync } from './js/setup.js';
import * as THREE from './js/three.module.js';
import { SourceLoader } from './js/SourceLoader.js';
import { THREEx } from './js/KeyboardState.js';
import { EXRLoader } from './js/EXRLoader.js';
import { OrbitControls } from './js/OrbitControls.js';

// Setup the renderer and create the scene
// You should look into js/setup.js to see what exactly is done here.
const { renderer, canvas } = setup();
const { scene, renderTarget, camera, shadowCam, worldAxisHelper, addResizeCallback } = createScene(canvas, renderer);

// Set up the shadow scene.
const shadowScene = new THREE.Scene();

// Switch between seeing the scene from light's perspective (1), the depth map (2), the final scene (3)
var sceneHandler = 3;

// For ShadowMap visual
const postCam = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
const postScene = new THREE.Scene();


// Image Based Lighting Scene Setup
const IBLCamera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000.0);
const IBLScene = new THREE.Scene();
IBLCamera.position.set(0.0, 1.5, 4.0);
IBLCamera.lookAt(IBLScene.position);
IBLScene.background = new THREE.Color(0x000000);
let hdrCubeRenderTarget;

const IBLParams = {
  exposure: 1.0,
  hdrToneMapping: 'ACESFilmic'
};

const hdrToneMappingOptions = {
  None: THREE.NoToneMapping,
  Linear: THREE.LinearToneMapping,
  Reinhard: THREE.ReinhardToneMapping,
  Cineon: THREE.CineonToneMapping,
  ACESFilmic: THREE.ACESFilmicToneMapping
};

THREE.DefaultLoadingManager.onLoad = function(){
  pmremGenerator.dispose();
};

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Helmet glTF textures 
function loadTextureForGLTF(path, useForColorData = false)
{
  let texture = new THREE.TextureLoader().load(path);
  // required texture properties:
  if (useForColorData) { texture.colorSpace = THREE.SRGBColorSpace; } // If texture is used for color information, set colorspace.
  texture.flipY = false; // UVs use the convention that (0, 0) corresponds to the upper left corner of a texture.
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // optional texture properties:
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

const helmetAlbedoMap = loadTextureForGLTF('./gltf/DamagedHelmet/Default_albedo.jpg', true);
const helmetNormalMap = loadTextureForGLTF('./gltf/DamagedHelmet/Default_normal.jpg');
const helmetEmissiveMap = loadTextureForGLTF('./gltf/DamagedHelmet/Default_emissive.jpg', true);
const helmetAmbientOcclusionMap = loadTextureForGLTF('./gltf/DamagedHelmet/Default_AO.jpg');
const helmetMetallicAndRoughnessMap = loadTextureForGLTF('./gltf/DamagedHelmet/Default_metalRoughness.jpg');

// This material is already defined for you as it's done in A3
const helmetMaterial = new THREE.MeshStandardMaterial({
  emissive: new THREE.Color(1,1,1),
  metalness: 1.0,
  envMapIntensity: 1.0,

  emissiveMap: helmetEmissiveMap,
  map: helmetAlbedoMap,
  normalMap: helmetNormalMap,
  roughnessMap: helmetMetallicAndRoughnessMap,
  metalnessMap: helmetMetallicAndRoughnessMap,
  aoMap: helmetAmbientOcclusionMap,
});

// Q1e TODO: This ambient light is added for temporary visualization of the helmet. 
// Delete this after added the IBL.
// You need to load the HDR background (./images/rathaus_2k.exr) with the EXRLoader
let ambientLight = new THREE.AmbientLight(0x404040, 10);
IBLScene.add( ambientLight );

const damagedHelmetFilePath = './gltf/DamagedHelmet/DamagedHelmet.gltf';
let damagedHelmetObject;

await loadGLTFAsync([damagedHelmetFilePath], function(models) {
      damagedHelmetObject = models[0].scene;
      damagedHelmetObject.position.set(0, -4.0, -10.0);
      damagedHelmetObject.scale.set(4, 4, 4);
      damagedHelmetObject.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          child.material = helmetMaterial;
        }
      });
      IBLScene.add(damagedHelmetObject);
});

const IBLControls = new OrbitControls(IBLCamera, canvas);
IBLControls.minDistance = 1;
IBLControls.maxDistance = 300;

// Register IBLCamera to update its projection on window resize
if (typeof addResizeCallback === 'function') {
  addResizeCallback(() => {
    IBLCamera.aspect = window.innerWidth / window.innerHeight;
    IBLCamera.updateProjectionMatrix();
  });
}

const IBLGUI = new dat.GUI();
IBLGUI.add( IBLParams, 'hdrToneMapping', Object.keys(hdrToneMappingOptions));
IBLGUI.add( IBLParams, 'exposure', 0, 2, 0.01 );
IBLGUI.open();

// Q1d Replace the light source with the shadow camera, i.e. setup a camera at the light source
shadowCam.position.set(200.0, 200.0, 200.0);
shadowCam.lookAt(scene.position);
shadowScene.add(shadowCam);

const lightDirection = new THREE.Vector3();
lightDirection.copy(shadowCam.position);
lightDirection.sub(scene.position);

// Load floor textures
const floorColorTexture = new THREE.TextureLoader().load('images/color.jpg');
floorColorTexture.minFilter = THREE.LinearFilter;
floorColorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const floorNormalTexture = new THREE.TextureLoader().load('images/normal.png');
floorNormalTexture.minFilter = THREE.LinearFilter;
floorNormalTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

// Load pixel textures
const shayDColorTexture = new THREE.TextureLoader().load( 'images/Pixel_Model_BaseColor.jpg' );
shayDColorTexture.minFilter = THREE.LinearFilter;
shayDColorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const shayDNormalTexture = new THREE.TextureLoader().load('images/Pixel_Model_Normal.jpg');
shayDNormalTexture.minFilter = THREE.LinearFilter;
shayDNormalTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

// Uniforms
const cameraPositionUniform = {type: "v3", value: camera.position}; 
const lightColorUniform = {type: "c", value: new THREE.Vector3(1.0, 1.0, 1.0)};
const ambientColorUniform = {type: "c", value: new THREE.Vector3(1.0, 1.0, 1.0)};
const lightDirectionUniform = {type: "v3", value: lightDirection};
const kAmbientUniform = {type: "f", value: 0.1};
const kDiffuseUniform = {type: "f", value: 0.8};
const kSpecularUniform = {type: "f", value: 0.4};
const shininessUniform = {type: "f", value: 50.0};
const lightPositionUniform = { type: "v3", value: shadowCam.position};
const shayDColorTextureUniform = null; // Q2 TODO make texture uniform
const shayDNormalTextureUniform = null; // Q2 TODO make texture uniform

// Q1b TODO: load the skybox textures
const skyboxCubemap = null;

// Q1c TODO: make uniform for skybox to pass into shaders
const skyboxCubeMapUniform = null; 


// Materials
const postMaterial = new THREE.ShaderMaterial({
  uniforms: {
    lightProjMatrix: {type: "m4", value: shadowCam.projectionMatrix},
    lightViewMatrix: {type: "m4", value: shadowCam.matrixWorldInverse},
    tDiffuse: {type: "t", value: null},
    tDepth: { type: "t", value: null }
  }
});

// Updated to use lighting effects in shader files
const floorMaterial = new THREE.ShaderMaterial({ 
  uniforms: {
    lightProjMatrix: {type: "m4", value: shadowCam.projectionMatrix},
    lightViewMatrix: {type: "m4", value: shadowCam.matrixWorldInverse},
    lightColor: lightColorUniform,
    ambientColor: ambientColorUniform,
    
    kAmbient: kAmbientUniform,
    kDiffuse: kDiffuseUniform,
    kSpecular: kSpecularUniform,
    shininess: shininessUniform,
    
    cameraPos: cameraPositionUniform,
    lightPosition: lightPositionUniform,
    lightDirection: lightDirectionUniform,
    
    colorMap: {type: "t", value: floorColorTexture},
    normalMap: { type: "t", value: floorNormalTexture },
    shadowMap: {type: "t", value: null},
    textureSize: {type: "float", value: null},
  }
});

// Q1a HINT : Pass the uniforms for blinn-phong shading,
// colorMap, normalMap etc to the shaderMaterial
const shayDMaterial = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  uniforms: {
    kAmbient: kAmbientUniform,
    kDiffuse: kDiffuseUniform,
    kSpecular: kSpecularUniform,
    shininess: shininessUniform,
    
    cameraPos: cameraPositionUniform,
    lightPosition: lightPositionUniform,
    lightDirection: lightDirectionUniform,

    // colorMap: TODO:,
    // normalMap: TODO:
  }
});

// Q1d Get Shay depth info for shadow casting
// Needed for Shay depth info.
const shadowMaterial = new THREE.ShaderMaterial({});

// Q1c HINT : Pass the necessary uniforms
const envmapMaterial = new THREE.ShaderMaterial({
  uniforms: {
    // TODO
  }
});

// Load shaders
const shaderFiles = [
  'glsl/envmap.vs.glsl',
  'glsl/envmap.fs.glsl',
  'glsl/shay.vs.glsl',
  'glsl/shay.fs.glsl',
  'glsl/shadow.vs.glsl',
  'glsl/shadow.fs.glsl',
  'glsl/floor.vs.glsl',
  'glsl/floor.fs.glsl',
  'glsl/render.vs.glsl',
  'glsl/render.fs.glsl',
];

new SourceLoader().load(shaderFiles, function(shaders) {
  shayDMaterial.vertexShader = shaders['glsl/shay.vs.glsl'];
  shayDMaterial.fragmentShader = shaders['glsl/shay.fs.glsl'];
  
  envmapMaterial.vertexShader = shaders['glsl/envmap.vs.glsl'];
  envmapMaterial.fragmentShader = shaders['glsl/envmap.fs.glsl'];

  shadowMaterial.vertexShader = shaders['glsl/shadow.vs.glsl'];
  shadowMaterial.fragmentShader = shaders['glsl/shadow.fs.glsl'];

  floorMaterial.vertexShader = shaders['glsl/floor.vs.glsl'];
  floorMaterial.fragmentShader = shaders['glsl/floor.fs.glsl'];

  postMaterial.vertexShader = shaders['glsl/render.vs.glsl'];
  postMaterial.fragmentShader = shaders['glsl/render.fs.glsl'];
});

// Loaders for object geometry
// Load the pixel gltf
const gltfFileName = 'gltf/pixel_v4.glb';
let shayDObject, shayDShadowObject;

await loadGLTFAsync([gltfFileName], function(models) {
  shayDShadowObject = models[0].scene;
  shayDObject = shayDShadowObject.clone();

  shayDShadowObject.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.material = shadowMaterial;
    }
  });
  shayDShadowObject.scale.set(10.0, 10.0, 10.0);
  shayDShadowObject.position.set(0.0, 0.0, -8.0);
  shadowScene.add(shayDShadowObject);

  shayDObject.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.material = shayDMaterial;
    }
  });
  shayDObject.scale.set(10.0, 10.0, 10.0);
  shayDObject.position.set(0.0, 0.0, -8.0);
  scene.add(shayDObject);
});

const terrainGeometry = new THREE.BoxGeometry(50, 50, 5);
const terrain = new THREE.Mesh(terrainGeometry, floorMaterial);
terrain.position.y = -2.4;
terrain.rotation.set(- Math.PI / 2, 0, 0);
scene.add(terrain);

await loadOBJAsync([ 'gltf/armadillo.obj' ], function(models) {
  const armadillo = models[0];
  armadillo.position.set(0.0, 4.0, 6.0);
  armadillo.scale.set(0.075, 0.075, 0.075);
  armadillo.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.material = envmapMaterial;
    }
  });
  scene.add(armadillo);

  const armadilloShadow = armadillo.clone();
  armadilloShadow.position.set(0.0, 4.0, 6.0);
  armadilloShadow.scale.set(0.075, 0.075, 0.075);
  armadilloShadow.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.material = shadowMaterial;
    }
  shadowScene.add(armadilloShadow);
  });
});

// Add a cube to easily see the environment map effect
const cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
const cube = new THREE.Mesh(cubeGeometry, envmapMaterial);
cube.position.set(0.0, 20.0, -2.0);
scene.add(cube);

// Depth Test scene
const postPlane = new THREE.PlaneGeometry( 2, 2 );
const postQuad = new THREE.Mesh( postPlane, postMaterial );
postScene.add( postQuad );


// Listen to keyboard events.
const keyboard = new THREEx.KeyboardState();
function checkKeyboard() {
  if (keyboard.pressed("A"))
  shadowCam.position.x -= 0.2;
  if (keyboard.pressed("D"))
  shadowCam.position.x += 0.2;
  if (keyboard.pressed("W"))
  shadowCam.position.z -= 0.2;
  if (keyboard.pressed("S"))
  shadowCam.position.z += 0.2;
  if (keyboard.pressed("Q"))
  shadowCam.position.y += 0.2;
  if (keyboard.pressed("E"))
  shadowCam.position.y -= 0.2;

  if (keyboard.pressed("1"))
  sceneHandler = 1;
  if (keyboard.pressed("2"))
  sceneHandler = 2;
  if (keyboard.pressed("3"))
  sceneHandler = 3;
  if (keyboard.pressed("4"))
  sceneHandler = 4;
  
  shadowCam.lookAt(scene.position);
  lightDirection.copy(shadowCam.position);
  lightDirection.sub(scene.position);
}



function updateMaterials() {
  envmapMaterial.needsUpdate = true;
  shayDMaterial.needsUpdate = true;
  shadowMaterial.needsUpdate = true;
  floorMaterial.needsUpdate = true;
  postMaterial.needsUpdate = true;
}

// Setup update callback
function update() {
  checkKeyboard();
  updateMaterials();

  cameraPositionUniform.value = camera.position;
  
  requestAnimationFrame(update);
  renderer.getSize(screenSize);
  renderer.setRenderTarget( null );
  renderer.clear();
  
  if (sceneHandler == 1) {
    // Debug, see the scene from the light's perspective
    renderer.render(shadowScene, shadowCam);
  }
  else if (sceneHandler == 2) 
  {
    // Q1d Visualise the shadow map
    // TODO: First pass to get the depth value
    
    // TODO: Second Pass, visualise shadow map to quad
    
  }
  else if (sceneHandler == 3) 
  {
    // Q1d Do the multipass shadowing
    // TODO: First pass
    
    // TODO: True second pass, change below
    renderer.setRenderTarget( null );
    renderer.render( scene, camera );

  } 
  else 
  {
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = hdrToneMappingOptions[ IBLParams.hdrToneMapping ];
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    var prevToneMappingExposure = renderer.toneMappingExposure;
    renderer.toneMappingExposure = IBLParams.exposure;

    renderer.setRenderTarget(null);
    renderer.render(IBLScene, IBLCamera);

    // restore non-IBL renderer properties
    renderer.physicallyCorrectLights = false;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.toneMappingExposure = prevToneMappingExposure;
  }
   
}

var screenSize = new THREE.Vector2();
renderer.getSize(screenSize);

// Start the animation loop.
update();