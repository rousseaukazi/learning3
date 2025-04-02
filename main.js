import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Create scene, camera and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);  // Sky blue
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

// Setup renderer with better quality
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Sharper rendering
renderer.shadowMap.enabled = true;  // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
document.body.appendChild(renderer.domElement);

// Create a loader and load the model
const loader = new GLTFLoader();
let mixer;
let animations = [];

// Enhance lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Increased intensity
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Increased intensity
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true; // Enable shadow casting
directionalLight.shadow.mapSize.width = 2048;  // Higher quality shadows
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Add a nice floor
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x91B496,  // Soft green
    roughness: 0.8,
    metalness: 0.2
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
floor.position.y = -0.01; // Slightly below the model to prevent z-fighting
floor.receiveShadow = true; // Floor can receive shadows
scene.add(floor);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 10;

loader.load(
    './models/pig.glb',
    function (gltf) {
        const model = gltf.scene;
        
        // Center the model
        model.position.set(0, 0, 0);
        
        // You might need to scale the model if it's too big or small
        model.scale.set(1, 1, 1);  // Adjust these values as needed
        
        // Enable shadows for the model
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                // Improve material quality
                if (node.material) {
                    node.material.roughness = 0.5;
                    node.material.metalness = 0.2;
                }
            }
        });
        
        scene.add(model);
        
        // Store all animations
        animations = gltf.animations;
        
        // Create an AnimationMixer
        mixer = new THREE.AnimationMixer(model);
        
        // Find and play the "stand" animation
        const standAnim = animations.find(anim => anim.name === "stand");
        if (standAnim) {
            const action = mixer.clipAction(standAnim);
            action.play();
        } else {
            console.log('Available animations:', animations.map(a => a.name));
        }
    },
    undefined,
    function (error) {
        console.error('An error occurred loading the model:', error);
    }
);

// Adjust camera position
camera.position.set(0, 2, 5);  // Move camera up slightly and back
camera.lookAt(0, 0, 0);  // Make camera look at the center

// Add after setting up the camera and controls
const defaultCameraPosition = new THREE.Vector3(0, 2, 5);
const defaultLookAt = new THREE.Vector3(0, 0, 0);

// Add event listener for spacebar
window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        // Reset camera position and rotation
        camera.position.copy(defaultCameraPosition);
        camera.lookAt(defaultLookAt);
        
        // Reset controls target and update
        controls.target.copy(defaultLookAt);
        controls.update();
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update the controls
    controls.update();

    // Update the mixer on each frame
    if (mixer) {
        mixer.update(0.016);
    }

    renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
