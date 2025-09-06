import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import {
    OrbitControls
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import {
    GLTFLoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// --- Scene, Camera, Renderer ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 300, 1200);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 50;
controls.maxDistance = 2000;

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const sunLight = new THREE.PointLight(0xffffff, 2, 5000);
scene.add(sunLight);

// --- Planet Data ---
const planetsData = [{
        name: "Sun",
        file: "sun.glb",
        distance: 0,
        scale: 200
    },
    {
        name: "Mercury",
        file: "mercury.glb",
        distance: 300,
        scale: 8,
        orbitPeriod: 88,
        rotPeriod: 58.6
    },
    {
        name: "Venus",
        file: "venus.glb",
        distance: 400,
        scale: 15,
        orbitPeriod: 225,
        rotPeriod: -243
    },
    {
        name: "Earth",
        file: "earth.glb",
        distance: 500,
        scale: 20,
        orbitPeriod: 365.25,
        rotPeriod: 1
    },
    {
        name: "Mars",
        file: "mars.glb",
        distance: 600,
        scale: 10,
        orbitPeriod: 687,
        rotPeriod: 1.03
    },
    {
        name: "Jupiter",
        file: "jupiter.glb",
        distance: 750,
        scale: 50,
        orbitPeriod: 4333,
        rotPeriod: 0.41
    },
    {
        name: "Saturn",
        file: "saturn.glb",
        distance: 850,
        scale: 60,
        orbitPeriod: 10759,
        rotPeriod: 0.44
    },
    {
        name: "Uranus",
        file: "uranus.glb",
        distance: 950,
        scale: 35,
        orbitPeriod: 30687,
        rotPeriod: -0.72
    },
    {
        name: "Neptune",
        file: "neptune.glb",
        distance: 1050,
        scale: 30,
        orbitPeriod: 60190,
        rotPeriod: 0.67
    },
];

const loader = new GLTFLoader();
const celestialBodies = [];

// --- Stars ---
function createStarTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(0.2, 'white');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}

const starTexture = createStarTexture();
const starsGeo = new THREE.BufferGeometry();
const starVertices = [];
const starColors = [];
const STAR_COUNT = 20000;
const STAR_SPREAD = 3000;

for (let i = 0; i < STAR_COUNT; i++) {
    starVertices.push(
        THREE.MathUtils.randFloatSpread(STAR_SPREAD),
        THREE.MathUtils.randFloatSpread(STAR_SPREAD),
        THREE.MathUtils.randFloatSpread(STAR_SPREAD)
    );
    const colors = [new THREE.Color(1, 1, 1), new THREE.Color(1, 0.3, 0.3), new THREE.Color(0.5, 0.5, 1)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    starColors.push(color.r, color.g, color.b);
}

starsGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3));
starsGeo.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3));
const starsMat = new THREE.PointsMaterial({
    size: 3,
    map: starTexture,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
scene.add(new THREE.Points(starsGeo, starsMat));

// --- Load Planets ---
planetsData.forEach(data => {
    const pivot = new THREE.Object3D();
    scene.add(pivot);

    loader.load(`public/Planets/${data.file}`, gltf => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(data.scale / maxDim);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Position
        model.position.x = data.distance;
        pivot.add(model);

        // Special case: Earth + Moon
        if (data.name === "Earth") {
            model.rotation.z = THREE.MathUtils.degToRad(23.5);
            const moonPivot = new THREE.Object3D();
            model.parent.add(moonPivot);
            const earthWorldPos = new THREE.Vector3();
            model.getWorldPosition(earthWorldPos);
            moonPivot.position.copy(earthWorldPos);

            const moonDistance = 50;
            const moonSegments = 128;
            const moonOrbitPoints = [];
            for (let i = 0; i <= moonSegments; i++) {
                const theta = (i / moonSegments) * 2 * Math.PI;
                moonOrbitPoints.push(new THREE.Vector3(Math.cos(theta) * moonDistance, 0, Math.sin(theta) * moonDistance));
            }
            const moonOrbitGeo = new THREE.BufferGeometry().setFromPoints(moonOrbitPoints);
            const moonOrbitMat = new THREE.LineBasicMaterial({
                color: 0xaaaaaa,
                transparent: true,
                opacity: 0.5
            });
            moonPivot.add(new THREE.LineLoop(moonOrbitGeo, moonOrbitMat));

            loader.load("public/Planets/moon.glb", gltfMoon => {
                const moon = gltfMoon.scene;
                const moonBox = new THREE.Box3().setFromObject(moon);
                const moonSize = new THREE.Vector3();
                moonBox.getSize(moonSize);
                const moonMax = Math.max(moonSize.x, moonSize.y, moonSize.z);
                moon.scale.setScalar(data.scale * 0.3 / moonMax);
                moon.position.sub(moonBox.getCenter(new THREE.Vector3()));
                moon.position.x = moonDistance;
                moonPivot.add(moon);

                celestialBodies.push({
                    pivot: moonPivot,
                    model: moon,
                    data: {
                        name: "Moon",
                        orbitPeriod: 27.3,
                        rotPeriod: 27.3
                    }
                });
            });
        }

        celestialBodies.push({
            pivot,
            model,
            data
        });

        if (data.name !== "Sun") {
            const segments = 256;
            const orbitPoints = [];
            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * 2 * Math.PI;
                orbitPoints.push(new THREE.Vector3(Math.cos(theta) * data.distance, 0, Math.sin(theta) * data.distance));
            }
            scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(orbitPoints), new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5
            })));
        }

        if (data.name === "Sun") {
            const pos = new THREE.Vector3();
            model.getWorldPosition(pos);
            controls.target.copy(pos);
        }
    });
});

// --- Smooth Camera Focus ---
function focusOnPlanet(planetName) {
    const body = celestialBodies.find(b => b.data.name === planetName);
    if (!body) return;

    const pos = new THREE.Vector3();
    body.model.getWorldPosition(pos);

    const offset = planetName === "Sun" ? new THREE.Vector3(600, 300, 600) : new THREE.Vector3(60, 120, 90);
    const startPos = camera.position.clone();
    const endPos = pos.clone().add(offset);
    const startTarget = controls.target.clone();
    const endTarget = pos.clone();

    let t = 0;
    const duration = 60;

    function animateMove() {
        t += 1 / duration;
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        camera.position.lerpVectors(startPos, endPos, ease);
        controls.target.lerpVectors(startTarget, endTarget, ease);
        controls.update();
        if (t < 1) requestAnimationFrame(animateMove);
    }
    animateMove();
}
// --- Time Mode ---
let timeMode = "present"; // "present" or "static"
let staticTime = 0;

const staticViewBtn = document.getElementById("playPauseBtn");
const presentViewBtn = document.getElementById("nowBtn");
const timeDisplay = document.getElementById("timeDisplay");

staticViewBtn.textContent = "Static View";
presentViewBtn.textContent = "Present View";

staticViewBtn.addEventListener("click", () => {
    timeMode = "static";
});
presentViewBtn.addEventListener("click", () => {
    timeMode = "present";
});

// --- Hover Detection ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredPlanet = null;
let mouseScreenX = 0;
let mouseScreenY = 0;

window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouseScreenX = event.clientX;
    mouseScreenY = event.clientY;
});

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
let focusedPlanet = null;

const planetSelect = document.getElementById("planetSelect");
if (planetSelect) {
    planetSelect.addEventListener("change", (e) => {
        focusOnPlanet(e.target.value);
        focusedPlanet = celestialBodies.find(b => b.data.name === e.target.value) || null;
    });
}

// --- Animate ---
function animate() {
    requestAnimationFrame(animate);

    const now = new Date();
    const deltaSeconds = animate.lastTime ? (now - animate.lastTime) / 1000 : 0;
    animate.lastTime = now;

    let daysSinceEpoch;
    if (timeMode === "present") {
        daysSinceEpoch = (now - new Date("2000-01-01T00:00:00Z")) / (1000 * 3600 * 24);
        if (timeDisplay) timeDisplay.textContent = now.toLocaleString();
    } else {
        staticTime += deltaSeconds;
        daysSinceEpoch = staticTime * 10; // orbit speed
        if (timeDisplay) timeDisplay.textContent = "Static View";
    }

    // Rotate and revolve planets
    celestialBodies.forEach(body => {
        const d = body.data;

        if (d.rotPeriod) {
            let rotationDays = daysSinceEpoch;
            if (timeMode === "static" && d.name === "Earth") rotationDays *= 0.2; // slow Earth
            body.model.rotation.y = (rotationDays * 2 * Math.PI) / d.rotPeriod;
        }

        if (d.orbitPeriod) {
            body.pivot.rotation.y = (2 * Math.PI * (daysSinceEpoch % d.orbitPeriod)) / d.orbitPeriod;
        }
    });

    // --- STATIC VIEW CAMERA FOLLOW ---
    if (timeMode === "static" && focusedPlanet) {
        let offset;
        if (focusedPlanet.data.name === "Sun") {
            offset = new THREE.Vector3(300, 200, 300); // larger offset for Sun
        } else {
            offset = new THREE.Vector3(60, 120, 90); // offset for other planets
        }
        const targetPos = new THREE.Vector3();
        focusedPlanet.model.getWorldPosition(targetPos);

        // Smoothly move the camera toward planet + offset
        const desiredPos = targetPos.clone().add(offset);
        camera.position.lerp(desiredPos, 0.02); // smaller factor = slower pull

        // Smoothly move the controls target to the planet
        controls.target.lerp(targetPos, 0.05); // smaller factor = slower follow
    }

    // --- Hover Detection ---
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(celestialBodies.map(b => b.model), true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        const planet = celestialBodies.find(b => b.model === object || b.model.children.includes(object));
        if (planet) {
            if (hoveredPlanet && hoveredPlanet !== planet) hoveredPlanet.model.scale.divideScalar(1.1);
            if (hoveredPlanet !== planet) planet.model.scale.multiplyScalar(1.1);
            hoveredPlanet = planet;
            if (label) {
                label.style.display = "block";
                label.textContent = planet.data.name;
                label.style.left = `${mouseScreenX + 10}px`;
                label.style.top = `${mouseScreenY + 10}px`;
            }
        }
    } else {
        if (hoveredPlanet) hoveredPlanet.model.scale.divideScalar(1.1);
        hoveredPlanet = null;
        if (label) label.style.display = "none";
    }

    controls.update(); // OrbitControls still active
    renderer.render(scene, camera);
}
function checkOrientation() {
    const rotateMsg = document.getElementById("rotateMsg");
    if (window.innerWidth < 768 && window.innerHeight > window.innerWidth) {
        // Portrait mode on small devices
        rotateMsg.style.display = "block";
    } else {
        rotateMsg.style.display = "none";
    }
}

window.addEventListener("resize", checkOrientation);
window.addEventListener("load", checkOrientation);

animate();