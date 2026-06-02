/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { 
  ChevronDown, 
  ShoppingCart, 
  Wind, 
  Leaf, 
  Zap, 
  X, 
  Plus, 
  Minus, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Sparkles, 
  Award, 
  Flame, 
  Calendar,
  Globe,
  Droplet
} from 'lucide-react';
import * as THREE from 'three';

// Procedural audio pop generator utilizing the Web Audio API
const triggerAudioPop = (frequency = 180, isMuted = false) => {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 5, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Suppress errors from user interaction restrictions
  }
};

// 3D Visualizer Component utilizing standard canvas textures and geometric lathe/cylinder meshes
const ThreeBackground = ({ 
  frameUrl, 
  scrollProgress,
  sweetness,
  tanginess,
  pulpDensity
}: { 
  frameUrl: string | null; 
  scrollProgress: number; 
  sweetness: number;
  tanginess: number;
  pulpDensity: number;
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const bgMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const bottleGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const localProgressRef = useRef(0);

  const sweetnessRef = useRef(sweetness);
  const tanginessRef = useRef(tanginess);
  const pulpDensityRef = useRef(pulpDensity);
  const sloshImpulseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    localProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    sweetnessRef.current = sweetness;
  }, [sweetness]);

  useEffect(() => {
    tanginessRef.current = tanginess;
  }, [tanginess]);

  useEffect(() => {
    pulpDensityRef.current = pulpDensity;
  }, [pulpDensity]);

  const prevSweetness = useRef(sweetness);
  const prevTanginess = useRef(tanginess);
  const prevPulpDensity = useRef(pulpDensity);

  useEffect(() => {
    if (
      sweetness !== prevSweetness.current ||
      tanginess !== prevTanginess.current ||
      pulpDensity !== prevPulpDensity.current
    ) {
      prevSweetness.current = sweetness;
      prevTanginess.current = tanginess;
      prevPulpDensity.current = pulpDensity;
      
      if (sloshImpulseRef.current) {
        sloshImpulseRef.current();
      }
    }
  }, [sweetness, tanginess, pulpDensity]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene & Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.012);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.z = 6.2;

    // High performance renderer with safe devicePixelRatio limiter
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Static ambient plane to render user dynamic sequence (if frames available)
    const bgGeometry = new THREE.PlaneGeometry(16, 9);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x111111,
      transparent: true,
      opacity: frameUrl ? 0.6 : 0.15 
    });
    bgMaterialRef.current = bgMaterial;
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.z = -5;
    scene.add(bgMesh);

    // Group for the 3D bottle
    const bottleGroup = new THREE.Group();
    scene.add(bottleGroup);
    bottleGroupRef.current = bottleGroup;

    // Beautiful plastic/glass material for bottle body
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.05,
      metalness: 0.05,
      transmission: 0.65,
      ior: 1.35,
      thickness: 0.15,
      specularIntensity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02
    });

    // Radiant mango nectar juice material (Warm, saturated, cartoonish yellow-orange)
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      emissive: 0xcc4400,
      roughness: 0.15,
      metalness: 0.02,
      transparent: true,
      opacity: 0.96
    });

    // 1. CAP MESH (Cute vibrant green screw cap with bold cartoon ridges, slimmer and taller)
    const capGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.35, 64, 1);
    const capPos = capGeo.attributes.position;
    for (let i = 0; i < capPos.count; i++) {
       const x = capPos.getX(i);
       const z = capPos.getZ(i);
       const theta = Math.atan2(z, x);
       // 16 bold classic cartoon ridges
       const r_factor = 1.0 + 0.05 * Math.cos(16 * theta); 
       capPos.setX(i, x * r_factor);
       capPos.setZ(i, z * r_factor);
    }
    capGeo.computeVertexNormals();

    const capMat = new THREE.MeshStandardMaterial({
      color: 0x1faf40, // Vibrant friendly cartoon leaf green
      roughness: 0.15,
      metalness: 0.05
    });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = 1.35;
    bottleGroup.add(capMesh);

    // 2. SEAL COLLAR (Vibrant green ring under the cap, slimmer)
    const collarGeo = new THREE.CylinderGeometry(0.165, 0.165, 0.07, 32, 1);
    const collarMesh = new THREE.Mesh(collarGeo, capMat);
    collarMesh.position.y = 1.15;
    bottleGroup.add(collarMesh);

    // 3. UNIFIED PROFILE BOTTLE SHELL (Slim, elegant champagne champagne-like silhouette)
    const bottleGeo = new THREE.CylinderGeometry(0.44, 0.44, 2.4, 64, 64);
    const bottlePos = bottleGeo.attributes.position;
    for (let i = 0; i < bottlePos.count; i++) {
      const x = bottlePos.getX(i);
      const y = bottlePos.getY(i); // ranges from -1.2 to 1.2
      const z = bottlePos.getZ(i);
      const theta = Math.atan2(z, x);
      const t = (y + 1.2) / 2.4; // [0, 1] from bottom to top

      let r_base = 0.44;
      if (t < 0.12) {
        // Bottom rounded/chamfered base
        const factor = t / 0.12; // 0 to 1
        r_base = 0.33 + 0.11 * Math.sin(factor * Math.PI / 2);
      } else if (t < 0.55) {
        // Straight main body
        r_base = 0.44;
      } else if (t < 0.85) {
        // Smooth cartoon transition S-curve - Graceful taper from wide body to neck
        const factor = (t - 0.55) / 0.3; // 0 to 1
        const cosFactor = (1.0 - Math.cos(factor * Math.PI)) / 2.0;
        r_base = 0.44 - (0.44 - 0.15) * cosFactor;
      } else {
        // Sleek neck
        r_base = 0.15;
      }

      bottlePos.setX(i, r_base * Math.cos(theta));
      bottlePos.setZ(i, r_base * Math.sin(theta));
    }
    bottleGeo.computeVertexNormals();
    const bottleMesh = new THREE.Mesh(bottleGeo, glassMat);
    bottleMesh.position.y = 0.0;
    bottleGroup.add(bottleMesh);

    // 4. UNIFIED PROFILE JUICY LIQUID CORE (Slimmer and nested perfectly inside the slim sheel)
    const liquidGeo = new THREE.CylinderGeometry(0.40, 0.40, 2.11, 64, 64);
    const liquidPos = liquidGeo.attributes.position;
    for (let i = 0; i < liquidPos.count; i++) {
      const x = liquidPos.getX(i);
      const y = liquidPos.getY(i); // ranges from -1.055 to 1.055
      const z = liquidPos.getZ(i);
      const theta = Math.atan2(z, x);

      const y_world = y - 0.04; 
      const t = Math.max(0, Math.min(1, (y_world + 1.2) / 2.4));

      let r_base = 0.40;
      if (t < 0.12) {
        const factor = t / 0.12;
        r_base = 0.29 + 0.11 * Math.sin(factor * Math.PI / 2);
      } else if (t < 0.55) {
        r_base = 0.40;
      } else if (t < 0.85) {
        const factor = (t - 0.55) / 0.3;
        const cosFactor = (1.0 - Math.cos(factor * Math.PI)) / 2.0;
        r_base = 0.40 - (0.40 - 0.125) * cosFactor;
      } else {
        r_base = 0.125;
      }

      liquidPos.setX(i, r_base * Math.cos(theta));
      liquidPos.setZ(i, r_base * Math.sin(theta));
    }
    liquidGeo.computeVertexNormals();
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = -0.04;
    bottleGroup.add(liquidMesh);

    // 5. CUTE CARTOON MASCOT PRODUCT LABEL (Bright and minimal)
    const createLabelCanvasTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Beautiful diagonal linear gradient background (green and yellow)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
        bgGrad.addColorStop(0, '#1faf40'); 
        bgGrad.addColorStop(0.35, '#2bd150');
        bgGrad.addColorStop(0.7, '#fff200'); 
        bgGrad.addColorStop(1, '#ffc400');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 512, 512);

        // Playful white polka dots pattern
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        for (let i = 0; i < 8; i++) {
          const px = 50 + (i * 70) % 480;
          const py = 120 + (i * 90) % 350;
          ctx.beginPath();
          ctx.arc(px, py, 14 + (i % 3) * 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Thick organic creamy ribbon waves
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(0, 240);
        ctx.bezierCurveTo(128, 180, 384, 300, 512, 240);
        ctx.stroke();

        ctx.strokeStyle = '#ff6a00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 248);
        ctx.bezierCurveTo(128, 188, 384, 308, 512, 248);
        ctx.stroke();

        // Big bubble branding title: "FROOTO"
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;

        ctx.font = '900 90px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 20;
        ctx.lineJoin = 'round';
        ctx.strokeText('FROOTO', 256, 110);
        ctx.fillText('FROOTO', 256, 110);

        const textGrad = ctx.createLinearGradient(0, 80, 0, 160);
        textGrad.addColorStop(0, '#ff3300');
        textGrad.addColorStop(1, '#ff8400');
        ctx.fillStyle = textGrad;
        ctx.fillText('FROOTO', 256, 110);
        ctx.restore();

        // Large cute cartoon mascot mango
        const mx = 256;
        const my = 310;
        
        // Shadow under mascot
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(mx, my + 72, 60, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stem and Leaf
        ctx.save();
        ctx.strokeStyle = '#623506';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(mx, my - 60);
        ctx.quadraticCurveTo(mx + 10, my - 85, mx + 20, my - 90);
        ctx.stroke();

        ctx.fillStyle = '#179b30';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(mx + 22, my - 90, 24, 12, -Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Mango main body
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.lineJoin = 'round';

        const mangoGrad = ctx.createRadialGradient(mx - 20, my - 20, 10, mx, my, 80);
        mangoGrad.addColorStop(0, '#ffe500'); 
        mangoGrad.addColorStop(0.6, '#ffa200'); 
        mangoGrad.addColorStop(1, '#ff3c00'); 
        ctx.fillStyle = mangoGrad;

        ctx.beginPath();
        ctx.ellipse(mx, my, 65, 78, Math.PI / 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Kawaii Eyes
        const eyeOffset = 22;
        const drawEye = (ex: number, ey: number) => {
          ctx.fillStyle = '#102518';
          ctx.beginPath();
          ctx.arc(ex, ey, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex - 4, ey - 4, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(ex + 3, ey + 3, 1.8, 0, Math.PI * 2);
          ctx.fill();
        };

        drawEye(mx - eyeOffset, my - 12);
        drawEye(mx + eyeOffset, my - 12);

        // Blushing pink cheeks
        ctx.fillStyle = 'rgba(255, 60, 100, 0.55)';
        ctx.beginPath();
        ctx.arc(mx - eyeOffset - 12, my + 2, 9, 0, Math.PI * 2);
        ctx.arc(mx + eyeOffset + 12, my + 2, 9, 0, Math.PI * 2);
        ctx.fill();

        // Joyful open smiling mouth
        ctx.save();
        ctx.fillStyle = '#220000';
        ctx.beginPath();
        ctx.arc(mx, my + 10, 12, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ff6b8b';
        ctx.beginPath();
        ctx.arc(mx, my + 16, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Glossy bubble accent
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.beginPath();
        ctx.ellipse(mx - 24, my - 38, 14, 6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Lower Playful bubble ribbon banner
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = '#ffcc00';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        
        const rx = 106;
        const ry = 422;
        const rw = 300;
        const rh = 40;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(rx, ry, rw, rh, 12) : ctx.rect(rx, ry, rw, rh);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff3300';
        ctx.font = '900 20px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★ 100% PURE MANGO ★', 256, 448);
        ctx.restore();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const labelTex = createLabelCanvasTexture();
    const labelGeo = new THREE.CylinderGeometry(0.444, 0.444, 1.02, 64, 1, true, -Math.PI / 1.7, Math.PI * 1.18);
    const labelMat = new THREE.MeshBasicMaterial({
      map: labelTex,
      transparent: true,
      side: THREE.DoubleSide
    });
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.y = -0.396;
    bottleGroup.add(labelMesh);



    // Floating structural pulp stars (glowing orbits)
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      speeds.push(0.008 + Math.random() * 0.015);
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const createPulpTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(8, 8, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcf4d';
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const partMat = new THREE.PointsMaterial({
      size: 0.14,
      map: createPulpTexture(),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, partMat);
    scene.add(particles);
    particlesRef.current = particles;

    // Advanced Studio Lighting grid
    const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(4, 5, 3);
    scene.add(dirLight1);

    // Rim backdrop highlight
    const pinkRim = new THREE.PointLight(0xff4500, 4.5, 12);
    pinkRim.position.set(-3, 2, -2);
    scene.add(pinkRim);

    // Soft overhead capsular highlight
    const overheadLight = new THREE.DirectionalLight(0xffffff, 0.6);
    overheadLight.position.set(0, 5, 0);
    scene.add(overheadLight);

    // Setup linear interpolations for smooth gliding
    let curX = 0, curY = 0, curZ = 0;
    let curRX = 0, curRY = 0, curRZ = 0;
    let curScale = 1.0;
    let time = 0;

    // Sloshing physics variables
    let sloshX = 0;       // rotation around X-axis (forward/backward)
    let sloshZ = 0;       // rotation around Z-axis (left/right)
    let sloshVelX = 0;
    let sloshVelZ = 0;
    let lastProgress = 0;
    let lastBottleX = 0;
    let lastBottleY = 0;

    // Connect the interactive React state modifier jiggles directly to render thread
    sloshImpulseRef.current = () => {
      // Add sudden velocity to simulate a live mixing shake!
      sloshVelX += (Math.random() - 0.5) * 1.5;
      sloshVelZ += (Math.random() - 0.5) * 1.5;
    };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Central frame rendering sequence
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.006;

      const p = localProgressRef.current;
      let state = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1.1 };

      // Keyframes representing coordinates relative to scroll regions
      if (p <= 0.25) {
        const t = p / 0.25;
        state = {
          x: THREE.MathUtils.lerp(0, -1.3, t),
          y: THREE.MathUtils.lerp(0, 0.2, t),
          z: THREE.MathUtils.lerp(0, 0.6, t),
          rotX: THREE.MathUtils.lerp(0, 0.1, t),
          rotY: THREE.MathUtils.lerp(0.3, Math.PI * 1.5, t),
          rotZ: THREE.MathUtils.lerp(0, -0.12, t),
          scale: THREE.MathUtils.lerp(1.15, 1.25, t)
        };
      } else if (p <= 0.6) {
        const t = (p - 0.25) / 0.35;
        state = {
          x: THREE.MathUtils.lerp(-1.3, 1.3, t),
          y: THREE.MathUtils.lerp(0.2, -0.12, t),
          z: THREE.MathUtils.lerp(0.6, 0.15, t),
          rotX: THREE.MathUtils.lerp(0.1, -0.3, t),
          rotY: THREE.MathUtils.lerp(Math.PI * 1.5, Math.PI * 3.3, t),
          rotZ: THREE.MathUtils.lerp(-0.12, 0.22, t),
          scale: THREE.MathUtils.lerp(1.25, 0.95, t)
        };
      } else if (p <= 0.82) {
        const t = (p - 0.6) / 0.22;
        state = {
          x: THREE.MathUtils.lerp(1.3, 0, t),
          y: THREE.MathUtils.lerp(-0.12, 0.15, t),
          z: THREE.MathUtils.lerp(0.15, 1.8, t),
          rotX: THREE.MathUtils.lerp(-0.3, 0.15, t),
          rotY: THREE.MathUtils.lerp(Math.PI * 3.3, Math.PI * 4.8, t),
          rotZ: THREE.MathUtils.lerp(0.22, 0.0, t),
          scale: THREE.MathUtils.lerp(0.95, 1.35, t)
        };
      } else {
        const t = (p - 0.82) / 0.18;
        state = {
          x: THREE.MathUtils.lerp(0, 0, t),
          y: THREE.MathUtils.lerp(0.15, 0, t),
          z: THREE.MathUtils.lerp(1.8, 2.1, t),
          rotX: THREE.MathUtils.lerp(0.15, 0.0, t),
          rotY: THREE.MathUtils.lerp(Math.PI * 4.8, Math.PI * 6.5, t),
          rotZ: THREE.MathUtils.lerp(0.0, 0.0, t),
          scale: THREE.MathUtils.lerp(1.35, 1.5, t)
        };
      }

      const isMobileSize = window.innerWidth < 768;
      const xFactor = isMobileSize ? 0.0 : 1.0;
      const scaleFactor = isMobileSize ? 0.72 : 1.0;

      // Track last positions to obtain instantaneous velocities
      const prevX = curX;
      const prevY = curY;
      const prevZ = curZ;

      curX = THREE.MathUtils.lerp(curX, state.x * xFactor, 0.08);
      curY = THREE.MathUtils.lerp(curY, state.y, 0.08);
      curZ = THREE.MathUtils.lerp(curZ, state.z, 0.08);
      curRX = THREE.MathUtils.lerp(curRX, state.rotX, 0.08);
      curRY = THREE.MathUtils.lerp(curRY, state.rotY, 0.08);
      curRZ = THREE.MathUtils.lerp(curRZ, state.rotZ, 0.08);
      curScale = THREE.MathUtils.lerp(curScale, state.scale * scaleFactor, 0.08);

      // Micro-floating physical mechanics
      const floatVal = Math.sin(time * 2.2) * 0.08;
      const tiltValX = Math.sin(time) * 0.04;
      const tiltValZ = Math.cos(time * 1.5) * 0.03;

      bottleGroup.position.set(curX, curY + floatVal, curZ);
      bottleGroup.rotation.set(curRX + tiltValX, curRY, curRZ + tiltValZ);
      bottleGroup.scale.setScalar(curScale);

      // --- ADVANCED SLOSHING ENGINE ---
      const dProgress = p - lastProgress;
      lastProgress = p;

      // Inertia from parent bottle motion steps
      const bottleVelX = curX - prevX;
      const bottleVelY = curY - prevY;
      const bottleVelZ = curZ - prevZ;

      // Dynamic physical forces
      const forceX = -bottleVelZ * 8.0 - dProgress * 5.0; // forward/scroll drag
      const forceZ = -bottleVelX * 8.0;                   // sideways drag

      // Oscillator constants
      const springK = 7.5;
      const decay = 0.88;

      sloshVelX += (-springK * sloshX + forceX) * 0.016;
      sloshVelZ += (-springK * sloshZ + forceZ) * 0.016;

      sloshVelX *= decay;
      sloshVelZ *= decay;

      sloshX += sloshVelX;
      sloshZ += sloshVelZ;

      // Restrict range to fit comfortably within the glass shell contours
      const LIMIT = 0.12;
      sloshX = THREE.MathUtils.clamp(sloshX, -LIMIT, LIMIT);
      sloshZ = THREE.MathUtils.clamp(sloshZ, -LIMIT, LIMIT);

      // Align liquid mesh reversely and apply dimensional offsetting
      liquidMesh.rotation.x = sloshX - tiltValX * 0.65;
      liquidMesh.rotation.z = sloshZ - tiltValZ * 0.65;
      liquidMesh.position.x = -sloshZ * 0.15;
      liquidMesh.position.z = -sloshX * 0.15;

      // --- DYNAMIC JUICE CALIBRATION COMPOSITION ---
      // Map tanginess (10% to 80%) to standard lerping ranges 0 to 1
      const pctTanginess = (tanginessRef.current - 10) / 70;
      const sweetColor = new THREE.Color(0xff8c00); // deep alfonso sweet orange
      const sourColor = new THREE.Color(0xffcf00);  // tangy citrus yellow
      const finalColor = sweetColor.clone().lerp(sourColor, pctTanginess);
      liquidMat.color.copy(finalColor);

      const sweetEmissive = new THREE.Color(0xcc2900);
      const sourEmissive = new THREE.Color(0xaa4c00);
      const finalEmissive = sweetEmissive.clone().lerp(sourEmissive, pctTanginess);
      liquidMat.emissive.copy(finalEmissive);

      // Density shifts: higher pulp = more opaque & rough
      const pctDensity = (pulpDensityRef.current - 30) / 60; // 30-90 range mapped to 0-1
      liquidMat.opacity = 0.90 + pctDensity * 0.08;
      liquidMat.roughness = 0.08 + pctDensity * 0.22;

      // Floating particles orbit loop
      const positionsAttr = particles.geometry.attributes.position;
      const movementDelta = Math.max(0.05, Math.abs(curY - state.y) * 2.8);

      // Pulp sizes scales dynamically based on sieving density
      partMat.size = 0.06 + pctDensity * 0.14;

      for (let i = 0; i < particleCount; i++) {
        let py = positionsAttr.getY(i);
        const pulpSpeedMultiplier = 1.0 + pctDensity * 1.5;
        py += speeds[i] * (1.0 + movementDelta * 6.0) * pulpSpeedMultiplier;
        if (py > 4) {
          py = -4;
        }
        positionsAttr.setY(i, py);
      }
      positionsAttr.needsUpdate = true;
      particles.rotation.y += 0.001;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      bgGeometry.dispose();
      bgMaterial.dispose();
      capGeo.dispose();
      capMat.dispose();
      collarGeo.dispose();
      bottleGeo.dispose();
      liquidGeo.dispose();
      labelGeo.dispose();
      labelMat.dispose();
      labelTex.dispose();
      glassMat.dispose();
      liquidMat.dispose();
      partMat.dispose();
      particleGeo.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [frameUrl]);

  // Load new sequential images from server dynamically
  useEffect(() => {
    if (!frameUrl || !bgMaterialRef.current) {
      if (bgMaterialRef.current) {
        bgMaterialRef.current.opacity = 0.15;
      }
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(frameUrl, (texture) => {
      if (textureRef.current) textureRef.current.dispose();
      textureRef.current = texture;

      bgMaterialRef.current!.map = texture;
      bgMaterialRef.current!.opacity = 0.85;
      bgMaterialRef.current!.needsUpdate = true;
    }, undefined, (err) => {
      console.warn("Dynamic video frame could not be fetched. Continuing with procedural background stream.", err);
    });
  }, [frameUrl]);

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" id="three-bg" />;
};

export default function App() {
  const [frames, setFrames] = useState<string[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Taste mixer customizable state
  const [sweetness, setSweetness] = useState(85);
  const [tanginess, setTanginess] = useState(45);
  const [pulpDensity, setPulpDensity] = useState(65);

  // Simple cart structural state
  const [cartItems, setCartItems] = useState([
    { id: 'frooto-classic', name: 'Frooto Original Alfonso', price: 6.50, qty: 1 }
  ]);

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001
  });

  const [currentScrollVal, setCurrentScrollVal] = useState(0);

  // Fetch real frames from local public assets folder
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const response = await fetch('/api/frames');
        const data = await response.json();
        if (data.frames && data.frames.length > 0) {
          setFrames(data.frames);
        }
      } catch (error) {
        console.error("Error fetching video frame files:", error);
      }
    };
    fetchFrames();

    const checkInterval = setInterval(fetchFrames, 6000);
    return () => clearInterval(checkInterval);
  }, []);

  // Update indices based on fluid scroll values
  useEffect(() => {
    return smoothProgress.on("change", (latest) => {
      setCurrentScrollVal(latest);
      if (frames.length > 0) {
        const index = Math.floor(latest * (frames.length - 1));
        setCurrentFrameIndex(index);
      }
    });
  }, [frames, smoothProgress]);

  const activeFrameUrl = frames.length > 0 ? frames[currentFrameIndex] : null;

  // Compute stats based on taste profile settings
  const kcalComputed = Math.floor(120 + sweetness * 0.4 - tanginess * 0.1);
  const vitCPercent = Math.floor(80 + tanginess * 1.1 + pulpDensity * 0.3);

  const cartCount = cartItems.reduce((acc, curr) => acc + curr.qty, 0);
  const subtotal = cartItems.reduce((acc, curr) => acc + curr.qty * curr.price, 0);

  const updateQuantity = (id: string, delta: number) => {
    triggerAudioPop(350, isMuted);
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const addToCart = () => {
    triggerAudioPop(480, isMuted);
    setCartItems(prev => {
      const exists = prev.find(item => item.id === 'frooto-classic');
      if (exists) {
        return prev.map(item => item.id === 'frooto-classic' ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id: 'frooto-classic', name: 'Frooto Original Alfonso', price: 6.50, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  return (
    <div className="relative min-h-[500vh] bg-[#000000] text-white selection:bg-[#ffbf1a] selection:text-black font-sans overflow-x-hidden" id="viewport-root">
      
      {/* ThreeJS Procedural Backdrop and Fluid Scroll-playback sequence */}
      <ThreeBackground 
        frameUrl={activeFrameUrl} 
        scrollProgress={currentScrollVal} 
        sweetness={sweetness}
        tanginess={tanginess}
        pulpDensity={pulpDensity}
      />

      {/* Decorative ambient visual lighting panels */}
      <div className="fixed inset-0 pointer-events-none bg-radial-gradient from-transparent via-black/10 to-black/70 z-5" />

      {/* Primary Header Navigation */}
      <header className="fixed top-0 left-0 w-full z-40 px-6 py-5 md:px-12 md:py-8 flex justify-between items-center transition-all bg-gradient-to-b from-black/80 to-transparent" id="main-header">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => triggerAudioPop(180, isMuted)} id="branding-logo">
          <span className="text-2xl md:text-3xl font-black tracking-tight text-white select-none">FROOTÔ</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffbf1a]" />
        </div>

        <div className="hidden md:flex gap-10 text-xs font-semibold uppercase tracking-[0.25em] text-white/70" id="nav-hyperlinks">
          <a href="#hero-section" className="hover:text-[#ffbf1a] transition-all" onClick={() => triggerAudioPop(220, isMuted)}>Origin</a>
          <a href="#benefits-section" className="hover:text-[#ffbf1a] transition-all" onClick={() => triggerAudioPop(220, isMuted)}>Benefits</a>
          <a href="#taste-section" className="hover:text-[#ffbf1a] transition-all" onClick={() => triggerAudioPop(220, isMuted)}>Mixer</a>
          <a href="#process-section" className="hover:text-[#ffbf1a] transition-all" onClick={() => triggerAudioPop(220, isMuted)}>Craft</a>
        </div>

        <div className="flex items-center gap-4" id="header-actions">
          <button 
            type="button" 
            onClick={() => setIsMuted(!isMuted)} 
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/15 transition-all"
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
            id="sound-control-btn"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button 
            type="button" 
            onClick={() => { triggerAudioPop(250, isMuted); setIsCartOpen(true); }} 
            className="relative bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#ffbf1a] transition-all flex items-center gap-2 shadow-lg shadow-white/5 group"
            id="cart-cta-btn"
          >
            <ShoppingCart size={14} className="group-hover:rotate-12 transition-all" /> 
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#ffbf1a] text-black text-[10px] font-black flex items-center justify-center border-2 border-black animate-pulse" id="cart-item-badge">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Floating sound notification hints */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:block">
        <div className="px-4 py-2 border border-white/10 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono tracking-widest text-[#ffbf1a] flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </span>
          <span>AUDIO ENGINE ENABLED</span>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="sticky top-0 h-screen flex flex-col justify-center px-6 md:px-20 overflow-hidden" id="hero-section">
        <div className="max-w-4xl space-y-5 md:space-y-6" id="hero-heading-container">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffbf1a]/10 border border-[#ffbf1a]/25" id="hero-pill">
            <Sparkles size={11} className="text-[#ffbf1a]" />
            <span className="text-[10px] font-black tracking-[0.25em] uppercase text-[#ffbf1a]">Cold-Pressed Essence</span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-[8.5rem] font-extrabold tracking-tighter leading-[0.9] text-white" id="landing-title">
            THE CRADLE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-[#ffbf1a]">OF MANGO.</span>
          </h1>

          <p className="max-w-xl text-sm md:text-lg text-neutral-400 leading-relaxed font-medium" id="hero-pcopy">
            Behold the exotic flavor landscape of pure Alfonso mango pulp, pressure-rested at sub-zero cycles to lock in rich tactile nutrients and sunset gold glow.
          </p>

          <div className="pt-4 flex flex-wrap gap-4" id="hero-ctas">
            <button 
              type="button" 
              onClick={addToCart} 
              className="bg-[#ffbf1a] hover:bg-[#e6a800] active:scale-95 text-black px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-[#ffbf1a]/20"
              id="hero-buy-btn"
            >
              Order Bottle • $6.50
            </button>
            <a 
              href="#benefits-section"
              className="px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 text-white text-xs font-black uppercase tracking-widest transition-all inline-block text-center"
              onClick={() => triggerAudioPop(200, isMuted)}
              id="hero-scrolldown-btn"
            >
              Discover Origin
            </a>
          </div>
        </div>

        {/* Floating guidance hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 flex flex-col items-center gap-1 cursor-pointer" onClick={() => triggerAudioPop(120, isMuted)} id="guide-pulser">
          <span className="text-[9px] uppercase tracking-[0.4em] font-black">Scroll Scroll</span>
          <ChevronDown size={14} className="animate-bounce" />
        </div>
      </section>

      {/* BENEFITS CONTENT LAYOUT OVERLAY */}
      <div className="relative z-10 w-full" id="scrollable-content-track">
        
        {/* BENEFITS SECTION */}
        <section className="min-h-screen py-32 px-6 md:px-20 flex flex-col justify-center" id="benefits-section">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Dark visual placeholder matching ThreeJS leftward transition */}
            <div className="h-48 lg:h-96 pointer-events-none" id="visual-offset-spacer-one" />

            <div className="space-y-10" id="benefits-info">
              <div className="space-y-4">
                <span className="text-xs font-mono tracking-[0.3em] uppercase text-[#ffbf1a]" id="benefits-pretext">Uncompromised Philosophy</span>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight" id="benefits-main-title">
                  Cold-Pressed to <br />
                  <span className="italic text-[#ffbf1a]">Preserve Majesty.</span>
                </h2>
                <p className="text-neutral-400 font-medium leading-relaxed max-w-lg" id="benefits-lead-p">
                  We harvest each fruit at perfect solar maturity, cold-pressing every cell cluster within 90 minutes to capture pristine dietary purity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4" id="benefits-pillars">
                {[
                  { icon: Leaf, label: "Zero Additives", detail: "Naturally sweet Alfonso harvest. No preservatives or synthetic sugars added." },
                  { icon: Wind, label: "Cold Carbonated", detail: "Sub-zero extraction retains optimal vitamin profiles and enzymes intact." },
                  { icon: Zap, label: "Insta-Vitality", detail: "Absorb rich immune minerals instantly for highly sustained natural lift." },
                  { icon: Droplet, label: "Silky Viscosity", detail: "Triple-sieved velvet texture that slides gracefully past the palate." }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3" id={`pillar-card-${idx}`}>
                    <div className="h-10 w-10 rounded-xl bg-[#ffbf1a]/10 border border-[#ffbf1a]/25 flex items-center justify-center text-[#ffbf1a]" id={`pillar-icon-${idx}`}>
                      <item.icon size={18} />
                    </div>
                    <h3 className="text-base font-bold text-white">{item.label}</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-medium">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE EXPERIENCE TASTE MIXER SECTION */}
        <section className="min-h-screen py-32 px-6 md:px-20 bg-gradient-to-b from-transparent to-black/90 flex flex-col justify-center" id="taste-section">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-8" id="taste-mixer-container">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] tracking-widest font-black uppercase" id="mixer-badge">
                  <Sliders size={10} /> Live Calibration
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight" id="mixer-title">
                  Calibrate Your <br/>
                  <span className="text-[#ffbf1a] uppercase italic">Pulp Blend.</span>
                </h2>
                <p className="text-[#999] text-xs md:text-sm font-medium leading-relaxed" id="mixer-intro">
                  Slide or configure parameters to customize Frooto's sensory formula. View calculated chemical analytics dynamically on the digital readout panel.
                </p>
              </div>

              {/* Parameter sliders */}
              <div className="space-y-6 pt-2" id="mixer-input-sliders">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-neutral-300">Alfonso Sweetness</span>
                    <span className="text-[#ffbf1a] font-mono text-sm">{sweetness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    value={sweetness} 
                    onChange={(e) => {
                      triggerAudioPop(300 + sweetness, isMuted);
                      setSweetness(Number(e.target.value));
                    }}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-ew-resize accent-[#ffbf1a]"
                    id="slider-sweetness"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>Mild Nectar</span>
                    <span>Intense Richness</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-neutral-300">Himalayan Tangy Sensation</span>
                    <span className="text-[#ffbf1a] font-mono text-sm">{tanginess}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="80" 
                    value={tanginess} 
                    onChange={(e) => {
                      triggerAudioPop(250 + tanginess * 2, isMuted);
                      setTanginess(Number(e.target.value));
                    }}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-ew-resize accent-[#ffbf1a]"
                    id="slider-tanginess"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>Creamy Smooth</span>
                    <span>Vibrant Citrus</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-neutral-300">Pulp Sieving Density</span>
                    <span className="text-[#ffbf1a] font-mono text-sm">{pulpDensity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="90" 
                    value={pulpDensity} 
                    onChange={(e) => {
                      triggerAudioPop(180 + pulpDensity * 2, isMuted);
                      setPulpDensity(Number(e.target.value));
                    }}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-ew-resize accent-[#ffbf1a]"
                    id="slider-pulp"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>Clear Filtration</span>
                    <span>Thick Velvet Texture</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer matching background bottle placement */}
            <div className="lg:col-span-3 h-24 lg:h-96 pointer-events-none" id="visual-offset-spacer-two" />

            {/* Simulated Live Diagnostic readout board */}
            <div className="lg:col-span-4 bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md" id="diagnostic-readout">
              <div className="flex justify-between items-center border-b border-white/10 pb-4" id="readout-header">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#ffbf1a]">Diagnostic Board</h4>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">System: Live Formula Spec</span>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-4" id="readout-metrics">
                <div className="space-y-1" id="metric-kcal">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Energy Value</span>
                  <p className="text-2xl font-bold font-mono text-white">{kcalComputed} <span className="text-xs text-neutral-400">kcal</span></p>
                </div>
                <div className="space-y-1" id="metric-vitC">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Vitamin C Daily</span>
                  <p className="text-2xl font-bold font-mono text-white">+{vitCPercent}%</p>
                </div>
                <div className="space-y-1" id="metric-pulp">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Pulp Solids</span>
                  <p className="text-2xl font-bold font-mono text-white">{(pulpDensity * 0.15).toFixed(1)}g</p>
                </div>
                <div className="space-y-1" id="metric-antioxidants">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Antioxidants</span>
                  <p className="text-2xl font-bold font-mono text-white">125 <span className="text-xs text-neutral-400">mg</span></p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-2 text-xs font-medium" id="readout-evaluation">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#ffbf1a] flex items-center gap-1.5">
                  <Award size={10} /> Flavor Profile Evaluation
                </span>
                <p className="text-neutral-400 leading-relaxed">
                  {sweetness > 85 ? "Exceptionally sweet, reminiscent of midday Alfonso orchards. Perfectly balanced." : "Bright and refreshing focus, ideal for early morning physical rehydration."}
                </p>
              </div>

              <button 
                type="button" 
                onClick={addToCart} 
                className="w-full bg-white text-black py-4 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#ffbf1a] transition-all flex items-center justify-center gap-2"
                id="mixer-add-cart-btn"
              >
                <span>Save & Add Bottle to Cart</span>
              </button>
            </div>

          </div>
        </section>

        {/* METICULOUS PROCESS TIMELINE */}
        <section className="min-h-screen py-32 px-6 md:px-20 flex flex-col justify-center" id="process-section">
          <div className="max-w-2xl space-y-4 mb-16" id="process-headings">
            <span className="text-xs font-mono tracking-[0.3em] uppercase text-[#ffbf1a]" id="process-pretext">Tracing the Journey</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight" id="process-main-title">
              Crafted with <br />
              <span className="italic text-[#ffbf1a]">Extreme Precision.</span>
            </h2>
            <p className="text-neutral-400 leading-relaxed font-medium" id="process-lead-p">
              The cycle from unblemished branch cultivation to pristine bottle sealing takes single-minded dedication. Here is how we ensure maximum golden fruit integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8" id="process-steps-grid">
            {[
              { step: "01", name: "Solar Harvest", detail: "Orchardists hand-select individual fruits that hit optimal color saturation levels.", icon: Calendar },
              { step: "02", name: "Sieving", detail: "Flesh is separated from pulp fibers using custom microscopic satin nets.", icon: Flame },
              { step: "03", name: "Pressure Set", detail: "Sub-zero cold pressing encapsulates vitamins preventing early decay.", icon: Globe },
              { step: "04", name: "Sub-Zero Fill", detail: "Bottles are sterilized on-site and filled under light nitrogen shield layers.", icon: Droplet }
            ].map((st, i) => (
              <div key={i} className="relative p-6 rounded-2xl bg-[#ffffff]/[0.02] border border-white/5 space-y-4" id={`process-card-${i}`}>
                <div className="text-4xl font-extrabold text-white/5 absolute top-4 right-4">{st.step}</div>
                <div className="w-9 h-9 rounded-xl bg-[#ffbf1a]/10 border border-[#ffbf1a]/25 flex items-center justify-center text-[#ffbf1a]">
                  <st.icon size={16} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold text-white">{st.name}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium">{st.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HERO CALL TO ACTION FOR THE WORLD COLD PRESSED ELIXIRS */}
        <section className="min-h-screen py-32 px-6 md:px-20 flex flex-col items-center justify-center text-center bg-gradient-to-t from-black to-transparent" id="cta-section">
          <div className="max-w-4xl space-y-10" id="cta-headings">
            <h2 className="text-5xl sm:text-7xl md:text-[8rem] font-black tracking-tighter text-white" id="cta-ultimate-title">
              TASTE THE <br />
              <span className="text-[#ffbf1a] border-y-2 border-[#ffbf1a]/20 px-4 inline-block my-2">ALTITUDE.</span>
            </h2>

            <p className="max-w-lg mx-auto text-sm md:text-lg text-neutral-400 leading-relaxed font-semibold" id="cta-description">
              No artificial flavor overlays. No synthetic coloring additives. Just volcanic soil warmth in every concentrated golden droplet.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center" id="cta-action-row">
              <button 
                type="button" 
                onClick={addToCart} 
                className="bg-[#ffbf1a] hover:bg-[#e6a800] text-black px-12 py-5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-[#ffbf1a]/25"
                id="cta-delivery-btn"
              >
                Order Direct Delivery
              </button>
              <button 
                type="button" 
                onClick={() => { triggerAudioPop(250, isMuted); }} 
                className="bg-white/5 border border-white/10 text-white hover:bg-white/10 px-12 py-5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                id="cta-locator-btn"
              >
                Find Retails Nearby
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* FOOTER LAYOUT SECTION */}
      <footer className="relative z-10 bg-[#020202] border-t border-white/5 py-12 px-6 md:px-20 flex flex-col md:flex-row justify-between items-center gap-8" id="main-footer">
        <div className="flex items-center gap-2" id="footer-branding">
          <span className="text-xl font-black tracking-tight">FROOTÔ</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffbf1a]" />
        </div>

        <div className="flex gap-8 text-neutral-500 text-[10px] font-bold uppercase tracking-widest" id="footer-socials">
          <a href="#" className="hover:text-white transition-colors">Instagram</a>
          <a href="#" className="hover:text-white transition-colors">TikTok</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
        </div>

        <div className="text-neutral-600 font-mono text-[9px] text-center md:text-right" id="footer-copyright">
          © 2026 FROOTÔ BEVERAGES CO. ALL INTENTIONAL RIGHTS RESERVED.
        </div>
      </footer>

      {/* SIDECAR SLIDE-OUT CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" id="cart-drawer-wrapper">
          
          {/* Backdrop mask */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => { triggerAudioPop(120, isMuted); setIsCartOpen(false); }} 
            id="cart-mask-backdrop"
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-md h-full bg-[#080808] border-l border-white/10 flex flex-col p-6 shadow-2xl z-10" id="cart-body-drawer">
            
            <div className="flex justify-between items-center border-b border-white/10 pb-5" id="cart-drawer-header">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-[#ffbf1a]" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Your Pulp Elixir</h3>
              </div>
              <button 
                type="button" 
                onClick={() => { triggerAudioPop(120, isMuted); setIsCartOpen(false); }} 
                className="p-2 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white transition-all"
                id="cart-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Shopping List Frame */}
            <div className="flex-1 overflow-y-auto py-6 space-y-4" id="cart-items-container">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3" id="cart-empty-message">
                  <div className="text-[#ffbf1a] opacity-40">
                    <ShoppingCart size={42} />
                  </div>
                  <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Your Cart is Empty</p>
                  <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                    Adjust the live taste parameters in the mixer or select our Original Alfonso Elixir.
                  </p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-4 items-center justify-between" id={`cart-row-${idx}`}>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">{item.name}</h4>
                      <p className="text-xs text-[#ffbf1a] font-mono">${item.price.toFixed(2)} / unit</p>
                      
                      {/* Configuration status list */}
                      <div className="flex gap-2 text-[9px] font-mono text-neutral-500">
                        <span>S:{sweetness}%</span>
                        <span>•</span>
                        <span>T:{tanginess}%</span>
                        <span>•</span>
                        <span>P:{pulpDensity}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        type="button" 
                        onClick={() => updateQuantity(item.id, -1)} 
                        className="p-1.5 rounded-md bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10"
                        id="cart-qty-minus"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-mono font-bold w-4 text-center">{item.qty}</span>
                      <button 
                        type="button" 
                        onClick={() => updateQuantity(item.id, 1)} 
                        className="p-1.5 rounded-md bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10"
                        id="cart-qty-plus"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Billing totals panel */}
            {cartItems.length > 0 && (
              <div className="border-t border-white/10 pt-6 space-y-5" id="cart-summary-totals">
                <div className="space-y-2 font-medium" id="totals-block">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-white text-sm">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Premium Ice Cooler Pack</span>
                    <span className="font-mono text-green-400 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Carbon Hydro-Shipping</span>
                    <span className="font-mono text-white text-sm">$4.90</span>
                  </div>
                  <div className="border-t border-white/5 my-2 pt-2 flex justify-between text-base font-bold">
                    <span>Total Bill</span>
                    <span className="font-mono text-[#ffbf1a]">${(subtotal + 4.90).toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => {
                    triggerAudioPop(650, isMuted);
                    alert("Order processed successfully under standard carbon hydroship channel (Simulation). Perfect harvest choices!");
                    setCartItems([]);
                    setIsCartOpen(false);
                  }}
                  className="w-full bg-[#ffbf1a] hover:bg-[#e6a800] text-black py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  id="checkout-trigger-btn"
                >
                  Confirm & Secure Checkout
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
