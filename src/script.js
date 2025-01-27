import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

const clock = new THREE.Clock();
const tickFunctions = []; // Array to hold all animation functions

/**
 * Textures
 */
const loadingManager = new THREE.LoadingManager();
loadingManager.onStart = () => {
  console.log("loadingManager: loading started");
};
loadingManager.onLoad = () => {
  console.log("loadingManager: loading finished");
};
loadingManager.onProgress = () => {
  console.log("loadingManager: loading progressing");
};
loadingManager.onError = () => {
  console.log("loadingManager: loading error");
};

const textureLoader = new THREE.TextureLoader(loadingManager);

// Generic function to load textures
const loadTexture = (path) => {
  const texture = textureLoader.load(
    path,
    () => {
      console.log(`Texture loaded: ${path}`);
    },
    () => {
      console.log(`Texture loading progressing: ${path}`);
    },
    () => {
      console.log(`Texture loading error: ${path}`);
    }
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  return texture;
};

// Load specific textures
const sunTexture = loadTexture("/textures/solarSystem/sun.png");
const earthTexture = loadTexture("/textures/solarSystem/earth.png");
const mercuryTexture = loadTexture("/textures/solarSystem/mercury.png");
const venusTexture = loadTexture("/textures/solarSystem/venus.png");
const marsTexture = loadTexture("/textures/solarSystem/mars.png");
const jupiterTexture = loadTexture("/textures/solarSystem/jupiter.png");
const saturnTexture = loadTexture("/textures/solarSystem/saturn.png");
const uranusTexture = loadTexture("/textures/solarSystem/uranus.png");
const neptuneTexture = loadTexture("/textures/solarSystem/neptune.png");

/**
 * Sun
 */
const sunGeometry = new THREE.SphereGeometry(0.5, 32, 32); // Radius: 0.5, 32 segments
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture }); // White color (doesn't require lights)
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

/**
 * Planet data (realistic ratios scaled down for visualization)
 * Source: NASA
 */
const planets = [
  {
    name: "Mercury",
    texture: mercuryTexture,
    size: 0.034, // Scaled relative to Sun's radius
    distance: 0.7, // Distance from Sun
    speed: 0.24, // Orbital speed factor
  },
  {
    name: "Venus",
    texture: venusTexture,
    size: 0.087,
    distance: 1,
    speed: 0.19,
  },
  {
    name: "Earth",
    texture: earthTexture,
    size: 0.091,
    distance: 1.5,
    speed: 0.17,
  },
  {
    name: "Mars",
    texture: marsTexture,
    size: 0.049,
    distance: 2.3,
    speed: 0.13,
  },
  {
    name: "Jupiter",
    texture: jupiterTexture,
    size: 1.0,
    distance: 7.8,
    speed: 0.08,
  },
  {
    name: "Saturn",
    texture: saturnTexture,
    size: 0.83,
    distance: 14.3,
    speed: 0.06,
  },
  {
    name: "Uranus",
    texture: uranusTexture,
    size: 0.36,
    distance: 28.7,
    speed: 0.04,
  },
  {
    name: "Neptune",
    texture: neptuneTexture,
    size: 0.35,
    distance: 45,
    speed: 0.03,
  },
];

// Add planets and their orbits to the scene
planets.forEach((planet) => {
  const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
  const material = new THREE.MeshBasicMaterial({ map: planet.texture });
  const mesh = new THREE.Mesh(geometry, material);

  // Orbit group for revolution
  const orbitGroup = new THREE.Group();
  orbitGroup.add(mesh);
  scene.add(orbitGroup);

  // Position planet
  mesh.position.x = planet.distance * 1.2;

  // Create circular orbit
  const orbitSegments = 128; // Number of segments for smoothness
  const orbitGeometry = new THREE.BufferGeometry();
  const orbitVertices = [];
  for (let i = 0; i <= orbitSegments; i++) {
    const angle = (i / orbitSegments) * Math.PI * 2;
    const x = Math.cos(angle) * planet.distance * 1.2;
    const z = Math.sin(angle) * planet.distance * 1.2;
    orbitVertices.push(x, 0, z);
  }
  orbitGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(orbitVertices, 3)
  );

  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
  scene.add(orbit);

  // Animate planet revolution
  const animatePlanet = (elapsedTime) => {
    orbitGroup.rotation.y = elapsedTime * planet.speed;
    mesh.rotation.y += 0.02; // Rotation on its own axis
  };

  // Add animation to tick function
  tickFunctions.push(animatePlanet);

  // Animate Sun rotation
  const rotateSun = (elapsedTime) => {
    sun.rotation.y = elapsedTime * 0.1; // Adjust rotation speed as needed
  };

  // Add Sun rotation to tick functions
  tickFunctions.push(rotateSun);
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Call each animation function
  tickFunctions.forEach((fn) => fn(elapsedTime));

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
