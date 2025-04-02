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

// Create a map to store active animations
let currentAction = null;

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
        
        // Log available animations to help with debugging
        console.log('Available animations:', animations.map(a => a.name));
        
        if (animations.length > 0) {
            // First animation setup
            currentAction = mixer.clipAction(animations[2]);
            currentAction.setLoop(THREE.LoopOnce);
            currentAction.clampWhenFinished = true;
            
            let hipBone;
            model.traverse(node => {
                if (node.isBone && node.name === "mixamorigHips") {
                    hipBone = node;
                }
            });
            
            mixer.addEventListener('finished', function(e) {
                if (e.action === mixer.clipAction(animations[2])) {
                    // Get ending position
                    const worldPos = new THREE.Vector3();
                    hipBone.getWorldPosition(worldPos);
                    
                    // IMMEDIATELY stop the first animation to prevent frames after "finished"
                    currentAction.stop();
                    
                    // Apply position immediately
                    model.position.copy(worldPos);
                    
                    // Setup second animation
                    const secondAction = mixer.clipAction(animations[1]);
                    secondAction.reset();
                    secondAction.setLoop(THREE.LoopOnce);
                    secondAction.clampWhenFinished = true;
                    
                    // Play second animation immediately on next frame
                    requestAnimationFrame(() => {
                        secondAction.play();
                    });
                    
                    currentAction = secondAction;
                }
            });
            
            currentAction.play();
        }
    },
    undefined,
    function (error) {
        console.error('An error occurred loading the model:', error);
    });

// Adjust camera position
camera.position.set(-15, 9, 0);  // Position camera further back, higher up for better view
camera.lookAt(0, 0, 0);  // Make camera look at the center

// Add after setting up the camera and controls
const defaultCameraPosition = new THREE.Vector3(-15, 9, 0);
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

// Add event listener for number keys
window.addEventListener('keydown', (event) => {
    // Only proceed if we have animations and a mixer
    if (!animations.length || !mixer) return;
    
    // Get the animation index based on key pressed (1-5)
    const animationIndex = parseInt(event.key) - 1;
    
    // Check if the key pressed is 1-5 and we have an animation at that index
    if (animationIndex >= 0 && animationIndex < 5 && animationIndex < animations.length) {
        // Stop current animation
        if (currentAction) {
            currentAction.stop();
        }
        
        // Start new animation
        currentAction = mixer.clipAction(animations[animationIndex]);
        currentAction.play();
        
        // Log which animation is playing
        console.log('Playing animation:', animations[animationIndex].name);
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
animate(); //main animation loop

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
