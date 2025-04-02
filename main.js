import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Create scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

// Setup renderer
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a loader and load the model
const loader = new GLTFLoader();
let mixer;
let animations = [];

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

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
