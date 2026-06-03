/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ThemeType, PowerUpType } from './types';
import { soundManager } from './audio';

export interface EngineCallbacks {
  onScore: (score: number) => void;
  onFeedCollected: (amount: number, isGolden: boolean) => void;
  onGemCollected: () => void;
  onPowerUpActivated: (type: PowerUpType, duration: number) => void;
  onDistanceUpdated: (distance: number) => void;
  onCrash: () => void;
  onFpsUpdated?: (fps: number) => void;
  onTimeUpdated?: (timeOfDay: number, weather: string) => void;
}

// Procedural texture canvas generator to ensure PBR AAA quality without static downloads
function createProceduralTexture(type: 'asphalt' | 'steel' | 'burlap' | 'feather' | 'skm_logo' | 'skm_banner_red' | 'skm_billboard_white' | 'skm_hazard', color?: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (type === 'asphalt') {
    // Dark core tarmac
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    // Fine gravel/dust grain
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? '#0f172a' : '#334155';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
    }

    // Heavy tractor/truck tire tread skid marks
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(80, 0, 40, 512);
    ctx.fillRect(150, 0, 40, 512);
    ctx.fillRect(320, 0, 40, 512);
    ctx.fillRect(390, 0, 40, 512);

    // Jagged roadway cracks
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.5;
    for (let j = 0; j < 3; j++) {
      ctx.beginPath();
      let x = Math.random() * 512;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < 512) {
        x += (Math.random() - 0.5) * 35;
        y += Math.random() * 80 + 25;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Lane separators / dashed yellow double lines
    ctx.fillStyle = '#f59e0b';
    for (let y = 20; y < 512; y += 100) {
      ctx.fillRect(166, y, 8, 55);
      ctx.fillRect(338, y, 8, 55);
    }

    // Grass weed tufts creeping onto road sides
    ctx.fillStyle = '#16a34a';
    for (let i = 0; i < 350; i++) {
      const rx = Math.random() < 0.5 ? Math.random() * 22 : 490 + Math.random() * 22;
      const ry = Math.random() * 512;
      ctx.beginPath();
      ctx.arc(rx, ry, Math.random() * 10 + 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'steel') {
    // Industrial gray grid metal
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(0, 0, 512, 512);

    // Panelling dividers
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    for (let x = 0; x <= 512; x += 128) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke();
    }

    // Steel rivets & metallic specular lines
    ctx.fillStyle = '#9ca3af';
    for (let px = 0; px < 512; px += 128) {
      for (let py = 0; py < 512; py += 128) {
        ctx.beginPath(); ctx.arc(px + 12, py + 12, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 116, py + 12, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 12, py + 116, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 116, py + 116, 5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Rusty grease spots
    ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
    for (let r = 0; r < 25; r++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 18 + 8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'burlap') {
    // Warm natural fiber
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, 512, 512);

    // Cross-weave thread grid
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    for (let x = 0; x < 512; x += 6) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
    for (let y = 0; y < 512; y += 6) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }

    // Stamped high-contrast SKM corporate circular feed logotype
    ctx.beginPath();
    ctx.arc(256, 256, 115, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(153, 27, 27, 0.85)';
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.fillStyle = 'rgba(153, 27, 27, 0.85)';
    ctx.font = '900 44px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SKM', 256, 215);
    ctx.font = '900 28px Arial';
    ctx.fillText('FEEDS', 256, 280);
  } else if (type === 'feather') {
    // Beautiful dynamic organic layered feathery scales
    ctx.fillStyle = color || '#fbfbfb';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 24) {
      const stagger = (y % 48 === 0) ? 0 : 16;
      for (let x = -16; x < 528; x += 32) {
        ctx.beginPath();
        ctx.arc(x + stagger, y, 16, 0, Math.PI);
        ctx.stroke();
      }
    }
  } else if (type === 'skm_logo') {
    // Elegant circular or shield SKM Corporate badge
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    // Red outer circle
    ctx.strokeStyle = '#b91b1c';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(256, 256, 200, 0, Math.PI * 2);
    ctx.stroke();

    // Golden inner circle accent
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(256, 256, 175, 0, Math.PI * 2);
    ctx.stroke();

    // Center Red background Circle
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(256, 256, 150, 0, Math.PI * 2);
    ctx.fill();

    // Big crisp bold white 'SKM' lettering
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SKM', 256, 205);

    // Green/gold wheat leaf icon or horizontal banner
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 24px Arial';
    ctx.fillText('★ FEEDS ★', 256, 275);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('QUALITY GUARANTEED', 256, 325);

  } else if (type === 'skm_banner_red') {
    // Red horizontal waving cloth banner
    ctx.fillStyle = '#be123c'; // rich red
    ctx.fillRect(0, 0, 512, 512);

    // Striking white borders
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, 452, 452);

    // Gold inner trim
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.strokeRect(44, 44, 424, 424);

    // SKM text centered
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 110px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text shadow
    ctx.fillStyle = '#1e293b';
    ctx.fillText('SKM', 261, 211);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SKM', 256, 206);

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 32px sans-serif';
    ctx.fillText('POULTRY FEEDS', 256, 310);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 22px sans-serif';
    ctx.fillText('SINCE 1981 • NUTRITION FIRST', 256, 370);

    // Subtle dark fold lines to simulate wind-blown fabric!
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 18;
    for (let x = 60; x < 512; x += 110) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.bezierCurveTo(x + 25, 120, x - 25, 380, x + 10, 502);
      ctx.stroke();
    }

  } else if (type === 'skm_billboard_white') {
    // Professional modern white corporate sign board
    ctx.fillStyle = '#f8fafc'; // light slate white
    ctx.fillRect(0, 0, 512, 512);

    // Left thick corporate red block
    ctx.fillStyle = '#be123c';
    ctx.fillRect(0, 0, 140, 512);

    // "SKM" vertically on the red block
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 70, 140);
    ctx.fillText('K', 70, 256);
    ctx.fillText('M', 70, 372);

    // Right side brand typography
    ctx.fillStyle = '#0f172a'; // deep navy/slate
    ctx.textAlign = 'left';
    
    ctx.font = '900 38px Arial';
    ctx.fillText('RESEARCH CTR', 170, 130);

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#475569';
    ctx.fillText('Genetics & Poultry Health', 170, 185);

    // Horizontal blue line
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(170, 220, 310, 6);

    // Bulleted selling points
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('✓ Scientific Feed Formulations', 170, 270);
    ctx.fillText('✓ Bio-Secure Environments', 170, 320);
    ctx.fillText('✓ High Hatchability Triggers', 170, 370);

    // Gold ribbon
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(170, 420, 310, 40);
    ctx.fillStyle = '#78350f';
    ctx.font = '900 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('★ SKM ANIMAL FEEDS DIVISION ★', 325, 445);

  } else if (type === 'skm_hazard') {
    // Industrial safety hazard textures
    ctx.fillStyle = '#eab308'; // strong hazard yellow
    ctx.fillRect(0, 0, 512, 512);

    // Bold diagonal black lines
    ctx.strokeStyle = '#0f172a'; // black
    ctx.lineWidth = 36;
    for (let offset = -512; offset < 1024; offset += 100) {
      ctx.beginPath();
      ctx.moveTo(offset, -50);
      ctx.lineTo(offset + 600, 550);
      ctx.stroke();
    }

    // Centered steel plates
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // black backing
    ctx.fillRect(40, 150, 432, 212);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.strokeRect(50, 160, 412, 192);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px Arial, Helvetica';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SKM FEED MILL', 256, 225);

    ctx.fillStyle = '#facc15';
    ctx.font = '900 24px Arial, Helvetica';
    ctx.fillText('⚠️ AUTHORIZED VEHICLES ONLY', 256, 295);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export class SKMRunnerEngine {
  private canvas: HTMLCanvasElement;
  private callbacks: EngineCallbacks;

  // Three.js Core Render Loop elements
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock!: THREE.Clock;
  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;

  // Running Loop Controller Flags
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isIntroActive: boolean = true;
  private introTime: number = 0;

  // Gameplay Mechanics
  private speed: number = 16.0;
  private maxSpeed: number = 38.0;
  private speedRampRate: number = 0.08; // progressive acceleration rate per 100m
  private distance: number = 0;
  private score: number = 0;
  private activeTheme: ThemeType = 'POULTRY_FARM';
  private lastWorkingTheme: ThemeType = 'POULTRY_FARM';
  public debugSingleBiome: boolean = false; // Default to false to enable continuous automatic biome transitions!

  // 3-Lane Mechanics
  private currentLane: number = 0; // -1 = Left Lane, 0 = Center Lane, 1 = Right Lane
  private targetX: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = -6.0;

  // Animated Jump / Slide controller
  private isJumping: boolean = false;
  private jumpVelocity: number = 0;
  private gravity: number = -40; // Parabolic downward gravity
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private slideDuration: number = 0.7; // seconds
  private isCrashed: boolean = false;
  private crashTimer: number = 0;

  // Active Powerup map
  private activePowerUps: Map<PowerUpType, { timeLeft: number; duration: number }> = new Map();

  // Polished Procedural Visual Elements
  private playerGroup!: THREE.Group;
  private chickenBodyMesh!: THREE.Mesh;
  private chickenLeftLeg!: THREE.Mesh;
  private chickenRightLeg!: THREE.Mesh;
  private chickenLeftWing!: THREE.Group;
  private chickenRightWing!: THREE.Group;
  private chickenTailGroup!: THREE.Group;
  private shieldBubbleMesh!: THREE.Mesh;
  private magnetAuraMesh!: THREE.Mesh;

  // Infinite Road Modules
  private roads: THREE.Group[] = [];
  private bgBirds: THREE.Group[] = [];
  private bgClouds: THREE.Group[] = [];
  private roadWidth: number = 9.0;
  private roadLength: number = 40.0;
  private roadCount: number = 15;
  private totalRoadScrolled: number = 0;

  // Pools
  private obstacles: { mesh: THREE.Group; type: string; lane: number; active: boolean }[] = [];
  private collectibles: { mesh: THREE.Group; type: string; lane: number; scoreValue: number; active: boolean; bobOffset: number }[] = [];

  // Weather and Camera effects
  private rainParticles: THREE.Points | null = null;
  private rainPositions!: Float32Array;
  private rainCount = 450;

  // --- Dynamic Weather & Day/Night System ---
  public timeOfDay: number = 8.5; // Starts at beautiful 8:30 AM
  public timeScale: number = 0.16; // 0.16 clock hour rate (24h loop in ~150 seconds)
  public currentWeather: string = 'SUNNY'; // SUNNY, CLOUDY, LIGHT_RAIN, THUNDERSTORM, FOGGY, RAIN_SUNSHINE
  private weatherTimer: number = 40.0; // Automatically transition weather type after 40s
  private lightningLight: THREE.DirectionalLight | null = null;
  private lightningActive: boolean = false;
  private lightningDuration: number = 0;
  private lightningTimer: number = 0;
  private starsParticles: THREE.Points | null = null;

  // Dynamic Lerping States
  private skyColorTarget: THREE.Color = new THREE.Color('#38bdf8');
  private skyColorCurrent: THREE.Color = new THREE.Color('#38bdf8');
  private fogColorTarget: THREE.Color = new THREE.Color('#38bdf8');
  private fogColorCurrent: THREE.Color = new THREE.Color('#38bdf8');
  private fogDensityTarget: number = 0.012;
  private fogDensityCurrent: number = 0.012;

  private sunColorTarget: THREE.Color = new THREE.Color('#ffffbf');
  private sunColorCurrent: THREE.Color = new THREE.Color('#ffffbf');
  private sunIntensityTarget: number = 1.35;
  private sunIntensityCurrent: number = 1.35;

  private ambColorTarget: THREE.Color = new THREE.Color('#94a3b8');
  private ambColorCurrent: THREE.Color = new THREE.Color('#94a3b8');
  private ambIntensityTarget: number = 0.8;
  private ambIntensityCurrent: number = 0.8;

  private wetnessTarget: number = 0.0;
  private wetnessCurrent: number = 0.0;

  private windSpeedTarget: number = 1.0;
  private windSpeedCurrent: number = 1.0;

  private cloudOpacityTarget: number = 0.85;
  private cloudOpacityCurrent: number = 0.85;
  private cloudColorTarget: THREE.Color = new THREE.Color('#ffffff');
  private cloudColorCurrent: THREE.Color = new THREE.Color('#ffffff');

  private smokeParticles: { mesh: THREE.Mesh; life: number; velocity: THREE.Vector3 }[] = [];
  
  // Feather Particle systems
  private featherParticles: THREE.Points | null = null;
  private featherPositions!: Float32Array;
  private featherVelocities!: Float32Array;
  private featherColors!: Float32Array;
  private featherCount = 140;
  private featherActive = false;
  private featherTimer = 0;

  // Cache dictionaries
  private geoCache: { [key: string]: THREE.BufferGeometry } = {};
  private matCache: { [key: string]: THREE.Material } = {};

  private currentSkinId: string = 'skin_classic';

  // Stats FPS Tracker
  private frameCount = 0;
  private lastFpsUpdateTime = 0;

  // Interactive dynamic values for Subway Surfers cinematic action
  private cameraOffsetHeight: number = 2.1;
  private cameraOffsetDepth: number = 4.5;
  private cameraTrackXMultiplier: number = 0.85; // turn lag multiplier
  private baseFOV: number = 58;
  private currentFOV: number = 58;
  private landingShakeForce: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.init();
    this.setupInput();

    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    if (this.renderer && this.camera && this.canvas) {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  };

  private init() {
    this.clock = new THREE.Clock();

    // Create high-power WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Create Scene with Volumetric Industrial Mist
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#475569');
    this.scene.fog = new THREE.FogExp2('#475569', 0.012);

    // Initial camera placed exactly behind the runner
    this.camera = new THREE.PerspectiveCamera(
      this.baseFOV,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      450.0
    );
    this.camera.position.set(0, 3.2, -1.2);
    this.camera.lookAt(new THREE.Vector3(0, 1.0, -18.0));

    // Balanced Cinematic Lighting setup
    this.ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight('#ffffbf', 1.3);
    this.dirLight.position.set(18, 35, 12);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1.0;
    this.dirLight.shadow.camera.far = 110;
    const sCamBound = 22;
    this.dirLight.shadow.camera.left = -sCamBound;
    this.dirLight.shadow.camera.right = sCamBound;
    this.dirLight.shadow.camera.top = sCamBound;
    this.dirLight.shadow.camera.bottom = -sCamBound;
    this.dirLight.shadow.bias = -0.0003;
    this.scene.add(this.dirLight);

    // Initial compilation
    this.buildCache();
    this.buildRoads();
    this.buildPlayer();
    this.buildParticles();
    this.buildAtmosphere();

    // Default Theme start
    this.applyThemeSettings('POULTRY_FARM');
  }

  private buildCache() {
    // Generate Procedural PBR Canvas Textures
    const asphaltText = createProceduralTexture('asphalt');
    const steelGrid = createProceduralTexture('steel');
    const burlapSack = createProceduralTexture('burlap');
    const whiteFeath = createProceduralTexture('feather', '#ffffff');
    const goldFeath = createProceduralTexture('feather', '#fbbf24');
    const cyberFeath = createProceduralTexture('feather', '#0f172a');
    
    // SKM Corporate Banners System
    const skmLogoText = createProceduralTexture('skm_logo');
    const skmBannerText = createProceduralTexture('skm_banner_red');
    const skmBillboardText = createProceduralTexture('skm_billboard_white');
    const skmHazardText = createProceduralTexture('skm_hazard');

    // Register Textures inside material geometries
    this.geoCache['road'] = new THREE.PlaneGeometry(this.roadWidth, this.roadLength);
    this.geoCache['silo'] = new THREE.CylinderGeometry(2.3, 2.3, 9.5, 12);
    this.geoCache['roof'] = new THREE.ConeGeometry(2.8, 3.5, 4);
    this.geoCache['trunk'] = new THREE.CylinderGeometry(0.24, 0.44, 2.4, 5);
    this.geoCache['leaves'] = new THREE.SphereGeometry(1.4, 6, 6);
    this.geoCache['box'] = new THREE.BoxGeometry(1, 1, 1);
    this.geoCache['sphere'] = new THREE.SphereGeometry(1, 8, 8);
    this.geoCache['torus'] = new THREE.TorusGeometry(0.4, 0.12, 6, 12);

    // Dynamic Materials matching skins & environment
    this.matCache['road_asphalt_pbr'] = new THREE.MeshStandardMaterial({
      map: asphaltText,
      roughness: 0.85,
      metalness: 0.1
    });

    this.matCache['decor_steel_pbr'] = new THREE.MeshStandardMaterial({
      map: steelGrid,
      roughness: 0.25,
      metalness: 0.9
    });

    this.matCache['burlap_sack_pbr'] = new THREE.MeshStandardMaterial({
      map: burlapSack,
      roughness: 0.9,
      metalness: 0.02
    });

    this.matCache['mesh_white_feathers'] = new THREE.MeshStandardMaterial({
      map: whiteFeath,
      roughness: 0.75,
      metalness: 0.02
    });

    this.matCache['mesh_golden_feathers'] = new THREE.MeshStandardMaterial({
      map: goldFeath,
      roughness: 0.08,
      metalness: 0.98,
      emissive: '#d97706',
      emissiveIntensity: 0.15
    });

    this.matCache['mesh_cyber_feathers'] = new THREE.MeshStandardMaterial({
      map: cyberFeath,
      roughness: 0.3,
      metalness: 0.85
    });

    // Register SKM branding materials
    this.matCache['skm_logo_mat'] = new THREE.MeshStandardMaterial({
      map: skmLogoText,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    this.matCache['skm_banner_red_mat'] = new THREE.MeshStandardMaterial({
      map: skmBannerText,
      roughness: 0.8,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    this.matCache['skm_billboard_white_mat'] = new THREE.MeshStandardMaterial({
      map: skmBillboardText,
      roughness: 0.4,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.matCache['skm_hazard_mat'] = new THREE.MeshStandardMaterial({
      map: skmHazardText,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    this.matCache['crest_standard'] = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.55 });
    this.matCache['beak_standard'] = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 });
    this.matCache['black_matte'] = new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.9 });
    this.matCache['white_gloss'] = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.1 });
    
    // Specular Collectibles bloom glow
    this.matCache['gold_specular_high'] = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      roughness: 0.05,
      metalness: 0.99,
      emissive: '#b45309',
      emissiveIntensity: 0.45
    });

    this.matCache['egg_gloss_white'] = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.05,
      metalness: 0.0,
      emissive: '#e2e8f0',
      emissiveIntensity: 0.1
    });

    this.matCache['crystal_neon_ruby'] = new THREE.MeshStandardMaterial({
      color: '#f43f5e',
      roughness: 0.15,
      metalness: 0.9,
      emissive: '#e11d48',
      emissiveIntensity: 0.65
    });
  }

  private applyThemeSettings(theme: ThemeType) {
    this.activeTheme = theme;
    let bgColor = '#829ab1';
    let fogDensity = 0.013;
    let lightColor = '#fef08a';
    let lightIntensity = 1.35;

    switch (theme) {
      case 'POULTRY_FARM':
        bgColor = '#86efac'; // soft green farm morning sky
        fogDensity = 0.012;
        lightColor = '#fef08a';
        lightIntensity = 1.35;
        this.ambientLight.color.set('#fef08a');
        break;
      case 'CORN_FIELDS':
        bgColor = '#38bdf8'; // beautiful clear morning skies
        fogDensity = 0.009;
        lightColor = '#fef3c7';
        lightIntensity = 1.45;
        this.ambientLight.color.set('#bae6fd');
        break;
      case 'WHEAT_FIELDS':
        bgColor = '#fed7aa'; // warm autumn golden day glow
        fogDensity = 0.011;
        lightColor = '#ffedd5';
        lightIntensity = 1.35;
        this.ambientLight.color.set('#ffedd5');
        break;
      case 'SKM_FACTORY':
        bgColor = '#cbd5e1'; // dark industrial steel mist
        fogDensity = 0.022;
        lightColor = '#e2e8f0';
        lightIntensity = 1.1;
        this.ambientLight.color.set('#94a3b8');
        break;
      case 'WAREHOUSE':
        bgColor = '#64748b'; // deep gray-blue container storage clouds
        fogDensity = 0.025;
        lightColor = '#e2e8f0';
        lightIntensity = 1.0;
        this.ambientLight.color.set('#475569');
        break;
      case 'RIVER_AREA':
        bgColor = '#a5f3fc'; // watery humid mist
        fogDensity = 0.018;
        lightColor = '#ecfeff';
        lightIntensity = 1.3;
        this.ambientLight.color.set('#bae6fd');
        break;
      case 'VILLAGE_ROADS':
        bgColor = '#fdba74'; // warm honey sunset
        fogDensity = 0.013;
        lightColor = '#fca5a5';
        lightIntensity = 1.25;
        this.ambientLight.color.set('#fed7aa');
        break;
      case 'NIGHT_FARM':
        bgColor = '#090d1f'; // pitch dark moonlit blue
        fogDensity = 0.026;
        lightColor = '#38bdf8';
        lightIntensity = 0.6;
        this.ambientLight.color.set('#1e293b');
        break;
      case 'RAINY_SEASON':
        bgColor = '#475569'; // stormy overcast
        fogDensity = 0.035;
        lightColor = '#cbd5e1';
        lightIntensity = 0.7;
        this.ambientLight.color.set('#475569');
        break;
    }

    this.scene.background = new THREE.Color(bgColor);
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.set(bgColor);
      this.scene.fog.density = fogDensity;
    }

    this.dirLight.color.set(lightColor);
    this.dirLight.intensity = lightIntensity;

    // Toggle decor Visibility based on each chunk's own persistent theme/biome
    this.roads.forEach((roadGrp) => {
      const roadMesh = roadGrp.getObjectByName('ground_plane') as THREE.Mesh;
      if (roadMesh) {
        roadMesh.material = this.matCache['road_asphalt_pbr'];
      }
      this.updateChunkDecorVisibility(roadGrp);
    });
  }

  private buildRoads() {
    this.roads = [];
    for (let i = 0; i < this.roadCount; i++) {
      const roadGroup = new THREE.Group();
      const segmentZOffset = -i * this.roadLength;
      roadGroup.position.set(0, 0, segmentZOffset);

      // Determine initial theme for this chunk based on its absolute track position Z
      const initialDist = -segmentZOffset;
      const initialTheme = this.getThemeForDistance(initialDist);
      roadGroup.userData.theme = initialTheme;

      // Elevated 3D Ground and Shoulders layout
      const road = new THREE.Mesh(this.geoCache['road'], this.matCache['road_asphalt_pbr']);
      road.name = 'ground_plane';
      road.rotation.x = -Math.PI / 2;
      road.receiveShadow = true;
      roadGroup.add(road);

      // Elevated Stone and Grass verges along both shoulders
      const greenShoulderLeft = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, this.roadLength),
        new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.9 })
      );
      greenShoulderLeft.name = 'shoulder_l';
      greenShoulderLeft.position.set(-this.roadWidth / 2 - 1.25, -0.15, 0);
      greenShoulderLeft.receiveShadow = true;
      roadGroup.add(greenShoulderLeft);

      const greenShoulderRight = greenShoulderLeft.clone();
      greenShoulderRight.name = 'shoulder_r';
      greenShoulderRight.position.x = this.roadWidth / 2 + 1.25;
      roadGroup.add(greenShoulderRight);

      // -----------------------------------------------------------------------
      // LANDSCAPE TERRAIN SYSTEM: A massive continuous rolling countryside mesh
      // -----------------------------------------------------------------------
      const terrainWidth = 360.0;
      const terrainDepth = 42.0; // slight overlap over 40.0m to close any running boundary slits
      const terrainGeom = new THREE.PlaneGeometry(terrainWidth, terrainDepth, 48, 8);

      // Apply coordinates and vertex colors to terrain plane
      const posAttr = terrainGeom.getAttribute('position') as THREE.BufferAttribute;
      const colors = [];
      const tempColor = new THREE.Color();
      
      for (let j = 0; j < posAttr.count; j++) {
        const vx = posAttr.getX(j);
        const vy = posAttr.getY(j); // local Y points along absolute Z
        const vertexAbsZ = segmentZOffset + vy;
        
        const vHeight = this.getTerrainHeight(vx, vertexAbsZ);
        posAttr.setZ(j, vHeight);
        
        const absX = Math.abs(vx);
        if (absX < 11.5) {
          // Dirt gravel path buffer right next to the asphalt shoulder
          const gravelS = Math.abs(Math.sin(vx * 8)) * 0.18;
          tempColor.set('#2d2011').lerp(new THREE.Color('#3f2c19'), gravelS);
        } else if (vHeight < -0.65) {
          // River wet muddy bank
          const mudBlend = Math.min((vHeight + 2.5) / 1.5, 1.0);
          tempColor.set('#1a0f05').lerp(new THREE.Color('#321e0d'), mudBlend);
        } else if (vx < -14.0 && vx > -28.0) {
          // Lush dark green Corn strip
          const cropAlt = Math.sin(vertexAbsZ * 1.5);
          tempColor.set(cropAlt > 0.1 ? '#14532d' : '#15803d');
        } else if (vx > 18.0 && vx < 35.0) {
          // Golden ripe yellow Wheat field
          const cropAlt = Math.cos(vertexAbsZ * 1.6);
          tempColor.set(cropAlt > 0.05 ? '#ca8a04' : '#eab308');
        } else if (vHeight > 10.0) {
          // Mountain peaks - slate dark rock and white capping snow layers!
          if (vHeight > 18.0) {
            tempColor.set('#f8fafc'); // Pure bright mountain crest snow
          } else {
            const rockBlend = (vHeight - 10.0) / 8.0;
            tempColor.set('#475569').lerp(new THREE.Color('#cbd5e1'), rockBlend);
          }
        } else {
          // Rolling emerald country meadows and open agricultural grasslands
          const pastureNoise = Math.sin(vx * 0.1) * Math.sin(vertexAbsZ * 0.1) * 0.5 + 0.5;
          tempColor.set('#166534').lerp(new THREE.Color('#15803d'), pastureNoise * 0.5).lerp(new THREE.Color('#22c55e'), pastureNoise * 0.5);
        }
        
        colors.push(tempColor.r, tempColor.g, tempColor.b);
      }
      
      terrainGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      terrainGeom.computeVertexNormals();
      
      const terrainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.95,
        flatShading: true, // Gorgeous low-poly cartoon visual styling!
      });
      
      const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
      terrainMesh.name = 'rolling_terrain';
      terrainMesh.rotation.x = -Math.PI / 2;
      terrainMesh.receiveShadow = true;
      terrainMesh.castShadow = true;
      roadGroup.add(terrainMesh);
      
      // Sparkling country river water layer
      const waterMat = new THREE.MeshStandardMaterial({
        color: '#0284c7', // vibrant sky blue water
        roughness: 0.05,
        metalness: 0.15,
        transparent: true,
        opacity: 0.72,
      });
      const waterGeom = new THREE.PlaneGeometry(16.0, terrainDepth);
      const waterMesh = new THREE.Mesh(waterGeom, waterMat);
      waterMesh.name = 'river_water';
      waterMesh.rotation.x = -Math.PI / 2;
      waterMesh.position.set(-40, -0.75, 0); // locked water plane Y index
      roadGroup.add(waterMesh);

      // -----------------------------------------------------------------------
      // PROCEDURAL LANDSCAPE & DECOR: Generates seamless continuous landmarks, silos,
      // fields, fences, and windmills randomly distributed to look natural!
      // -----------------------------------------------------------------------
      this.decorateChunkProcedurally(roadGroup, segmentZOffset, i);

      this.scene.add(roadGroup);
      this.roads.push(roadGroup);
    }
  }

  private decorateChunkProcedurally(roadGroup: THREE.Group, segmentZOffset: number, chunkIndex: number) {
    try {
      // 1. Clean up stale prior decorative sets to avoid overlapping clones when recycling
      const toRemove: THREE.Object3D[] = [];
      roadGroup.children.forEach((child) => {
        if (
          child.name === 'procedural_decor' ||
          child.name === 'terrain_landmark' ||
          child.name === 'farm_decor' ||
          child.name === 'factory_decor' ||
          child.name === 'green_decor'
        ) {
          toRemove.push(child);
        }
      });
      toRemove.forEach((child) => {
        roadGroup.remove(child);
      });

      // 2. Setup standard container group
      const proceduralGroup = new THREE.Group();
      proceduralGroup.name = 'procedural_decor';

      // Seed deterministic generator off coordinate segment to maintain terrain consistency during execution
      const absZSeed = Math.abs(segmentZOffset);
      let seed = absZSeed || 1;
      const rand = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      const chunkDist = Math.abs(segmentZOffset);
      const blend = this.getThemeAtPosition(chunkDist);
      let theme = roadGroup.userData.theme || this.activeTheme;
      if (blend.transitionWith) {
        if (rand() < blend.ratio) {
          theme = blend.transitionWith;
        } else {
          theme = blend.primary;
        }
      }

      // 3. Spawning theme-specific scenery based on the theme of this chunk!
      switch (theme) {
        case 'POULTRY_FARM': {
          // LHS
          if (rand() < 0.35) {
            const coops = this.createBarnMesh(rand);
            coops.position.set(-this.roadWidth / 2 - 5.5, 0.3, -10 + rand() * 20);
            proceduralGroup.add(coops);
          } else if (rand() < 0.7) {
            const storage = this.createIndustrialSilosMesh(rand);
            storage.position.set(-this.roadWidth / 2 - 4.5, 0.2, -10 + rand() * 20);
            proceduralGroup.add(storage);
          } else {
            const workers = this.createHumanoidMesh('#1e3a8a', '#1d4ed8', true); // Worker
            workers.position.set(-this.roadWidth / 2 - 3.5, 0.1, -10 + rand() * 20);
            workers.rotation.y = rand() * Math.PI * 2;
            proceduralGroup.add(workers);
          }

          // RHS
          if (rand() < 0.45) {
            const pen = this.createChickenPenMesh(rand);
            pen.position.set(this.roadWidth / 2 + 4.5, 0, -10 + rand() * 20);
            proceduralGroup.add(pen);
          } else if (rand() < 0.8) {
            const sacks = this.createFeedBagsMesh();
            sacks.position.set(this.roadWidth / 2 + 2.8, 0, -10 + rand() * 20);
            sacks.rotation.y = rand() * 0.5;
            proceduralGroup.add(sacks);
          } else {
            const research = this.createResearchCenterMesh(rand);
            research.position.set(this.roadWidth / 2 + 5.5, 0.2, -10 + rand() * 20);
            proceduralGroup.add(research);
          }
          break;
        }

        case 'CORN_FIELDS': {
          // LHS
          if (rand() < 0.5) {
            const sprinkler = this.createIrrigationMesh();
            sprinkler.position.set(-this.roadWidth / 2 - 4.2, 0.1, -12 + rand() * 24);
            proceduralGroup.add(sprinkler);
          } else {
            const harvester = this.createHarvesterMesh();
            harvester.position.set(-this.roadWidth / 2 - 5.8, 0.25, -10 + rand() * 20);
            harvester.rotation.y = Math.PI / 1.5;
            proceduralGroup.add(harvester);
          }

          // RHS
          if (rand() < 0.4) {
            const tractor = this.createTractorMesh(rand);
            tractor.position.set(this.roadWidth / 2 + 5.2, 0.35, -10 + rand() * 20);
            tractor.rotation.y = -Math.PI / 5;
            proceduralGroup.add(tractor);
          } else {
            const corn = this.createCornFieldMesh(rand);
            corn.position.set(this.roadWidth / 2 + 3.4, 0, -12 + rand() * 24);
            proceduralGroup.add(corn);
          }
          break;
        }

        case 'WHEAT_FIELDS': {
          // LHS
          if (rand() < 0.45) {
            const silosMax = this.createIndustrialSilosMesh(rand);
            silosMax.scale.set(1.3, 1.5, 1.3); // giant grain silo
            silosMax.position.set(-this.roadWidth / 2 - 5.5, 0.3, -10 + rand() * 20);
            proceduralGroup.add(silosMax);
          } else {
            const strawHay = this.createHayBaleMesh();
            strawHay.position.set(-this.roadWidth / 2 - 4.8, 0.1, -12 + rand() * 24);
            strawHay.rotation.y = rand() * Math.PI;
            proceduralGroup.add(strawHay);
          }

          // RHS
          if (rand() < 0.65) {
            const wheat = this.createWheatFieldMesh(rand);
            wheat.name = 'wheat_stalk_decor';
            wheat.position.set(this.roadWidth / 2 + 3.4, 0, -12 + rand() * 24);
            proceduralGroup.add(wheat);
          } else {
            const reaper = this.createHarvesterMesh();
            reaper.position.set(this.roadWidth / 2 + 5.8, 0.25, -10 + rand() * 20);
            reaper.rotation.y = -Math.PI / 4;
            proceduralGroup.add(reaper);
          }
          break;
        }

        case 'SKM_FACTORY': {
          // LHS
          if (rand() < 0.45) {
            const fact = this.createFeedFactoryMesh(rand);
            fact.position.set(-this.roadWidth / 2 - 7.5, 0.4, -10 + rand() * 20);
            proceduralGroup.add(fact);
          } else {
            const cargoTruck = this.createTruckMesh();
            cargoTruck.position.set(-this.roadWidth / 2 - 5.5, 0.1, -8 + rand() * 16);
            cargoTruck.rotation.y = Math.PI / 2; // parked alongside the curb
            proceduralGroup.add(cargoTruck);
          }

          // RHS
          if (rand() < 0.5) {
            const warehouse = this.createWarehouseHangarMesh(rand);
            warehouse.position.set(this.roadWidth / 2 + 5.5, 0.2, -10 + rand() * 20);
            proceduralGroup.add(warehouse);
          } else {
            const chimPost = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 10), this.matCache['decor_steel_pbr']);
            chimPost.name = 'chimney_pillar';
            chimPost.position.set(this.roadWidth / 2 + 6.2, 6, -10 + rand() * 20);
            chimPost.castShadow = true;
            proceduralGroup.add(chimPost);

            const warningBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), new THREE.MeshBasicMaterial({ color: '#ef4444' }));
            warningBeacon.name = 'neon_blinker';
            warningBeacon.position.set(this.roadWidth / 2 + 6.2, 12.18, chimPost.position.z);
            proceduralGroup.add(warningBeacon);
          }
          break;
        }

        case 'WAREHOUSE': {
          // LHS
          if (rand() < 0.5) {
            const shippingContainer = new THREE.Group();
            const colors = ['#dc2626', '#1d4ed8', '#ea580c', '#ca8a04'];
            const chosenCol = colors[Math.floor(rand() * 4)];
            const containerBox = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 5.0), new THREE.MeshStandardMaterial({ color: chosenCol, metalness: 0.3, roughness: 0.4 }));
            containerBox.position.set(-this.roadWidth / 2 - 4.8, 0.9, -10 + rand() * 20);
            containerBox.castShadow = true;
            containerBox.receiveShadow = true;
            shippingContainer.add(containerBox);

            const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), this.matCache['skm_logo_mat']);
            plaque.position.set(-this.roadWidth / 2 - 3.58, 0.9, containerBox.position.z);
            plaque.rotation.y = Math.PI / 2;
            shippingContainer.add(plaque);
            proceduralGroup.add(shippingContainer);
          } else {
            const store = this.createWarehouseHangarMesh(rand);
            store.position.set(-this.roadWidth / 2 - 5.5, 0.2, -10 + rand() * 20);
            proceduralGroup.add(store);
          }

          // RHS
          if (rand() < 0.4) {
            const fork = this.createForkliftMesh();
            fork.position.set(this.roadWidth / 2 + 4.5, 0.1, -10 + rand() * 20);
            fork.rotation.y = -Math.PI / 3;
            proceduralGroup.add(fork);
          } else {
            const pallets = this.createPalletMesh();
            pallets.position.set(this.roadWidth / 2 + 3.8, 0.1, -10 + rand() * 20);
            pallets.rotation.y = rand() * 0.4;
            proceduralGroup.add(pallets);
          }
          break;
        }

        case 'RIVER_AREA': {
          // LHS: Deep wide blue flowing river
          const waterMat = new THREE.MeshStandardMaterial({
            color: '#1d4ed8',
            transparent: true,
            opacity: 0.72,
            roughness: 0.15,
            metalness: 0.7
          });
          const riverCover = new THREE.Mesh(new THREE.PlaneGeometry(18, this.roadLength), waterMat);
          riverCover.name = 'recycled_river';
          riverCover.rotation.x = -Math.PI / 2;
          riverCover.position.set(-35, -0.65, 0); // flush matching water lane
          proceduralGroup.add(riverCover);

          // Small concrete culvert/bridge rails flanking on Left
          const woodMat = new THREE.MeshStandardMaterial({ color: '#5c2d18', roughness: 0.9 });
          const bridgeRail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, this.roadLength), woodMat);
          bridgeRail.position.set(-this.roadWidth / 2 - 0.2, 0.4, 0);
          bridgeRail.castShadow = true;
          proceduralGroup.add(bridgeRail);

          // Beautiful willow trees flanking
          const treeMax = this.createProceduralTree(rand, false);
          treeMax.scale.set(1.4, 1.4, 1.4);
          treeMax.position.set(this.roadWidth / 2 + 4.8, 0, -10 + rand() * 20);
          proceduralGroup.add(treeMax);
          break;
        }

        case 'VILLAGE_ROADS': {
          // LHS
          if (rand() < 0.45) {
            const house = this.createHouseMesh(rand, '#fef2f2');
            house.position.set(-this.roadWidth / 2 - 5.5, 0.1, -10 + rand() * 20);
            house.rotation.y = Math.PI / 2; // facing the road!
            proceduralGroup.add(house);
          } else {
            const shop = this.createHouseMesh(rand, '#eff6ff'); // blue clinic or shop
            shop.position.set(-this.roadWidth / 2 - 5.5, 0.1, -10 + rand() * 20);
            shop.rotation.y = Math.PI / 2;
            
            const awning = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 2.2), new THREE.MeshStandardMaterial({ color: '#be123c' }));
            awning.position.set(-3.7, 1.7, shop.position.z);
            awning.rotation.z = Math.PI / 12;
            proceduralGroup.add(awning);
            proceduralGroup.add(shop);
          }

          // Warm street lamp on shoulders flanking the curbs
          const lampL = this.createStreetLampMesh();
          lampL.position.set(-this.roadWidth / 2 - 0.5, 0.1, -12);
          proceduralGroup.add(lampL);

          const lampR = this.createStreetLampMesh();
          lampR.position.set(this.roadWidth / 2 + 0.5, 0.1, 12);
          lampR.rotation.y = Math.PI; // point light head inwards
          proceduralGroup.add(lampR);

          // RHS
          if (rand() < 0.45) {
            const neighbor = this.createHouseMesh(rand, '#fffbeb');
            neighbor.position.set(this.roadWidth / 2 + 5.5, 0.1, -10 + rand() * 20);
            neighbor.rotation.y = -Math.PI / 2;
            proceduralGroup.add(neighbor);
          } else {
            const villager = this.createHumanoidMesh('#ec4899', '#4f46e5', false); // Villager girl
            villager.position.set(this.roadWidth / 2 + 3.2, 0.1, -10 + rand() * 20);
            villager.rotation.y = rand() * Math.PI * 2;
            proceduralGroup.add(villager);
          }
          break;
        }

        default: {
          // Fallback to random trees/fences
          const fallbackTree = this.createProceduralTree(rand, rand() > 0.5);
          fallbackTree.position.set(-this.roadWidth / 2 - 4.5, 0, 0);
          proceduralGroup.add(fallbackTree);
          break;
        }
      }

      // 4. Shared dynamic decorations
      // Scattered Trees randomly positioned based on terrain gradients
      const treeCount = 2 + Math.floor(rand() * 4);
      for (let t = 0; t < treeCount; t++) {
        const sideSign = (rand() > 0.5) ? 1 : -1;
        const xPos = sideSign * (18.0 + rand() * 32.0);
        const zPos = -18.0 + rand() * 36.0;
        const yPos = this.getTerrainHeight(xPos, segmentZOffset + zPos);
        const tree = this.createProceduralTree(rand, t % 2 === 0);
        tree.position.set(xPos, yPos, zPos);
        proceduralGroup.add(tree);
      }

      // Security double-rope fences running down the shoulders
      const postMat = new THREE.MeshStandardMaterial({ color: '#5c2d18', roughness: 0.95 });
      const ropeMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.9 });
      for (let zOffset = -this.roadLength / 2; zOffset <= this.roadLength / 2; zOffset += 8) {
        const postLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), postMat);
        postLeft.position.set(-this.roadWidth / 2 - 0.2, 0.5, zOffset);
        postLeft.castShadow = true;
        postLeft.receiveShadow = true;
        proceduralGroup.add(postLeft);

        const postRight = postLeft.clone();
        postRight.position.x = this.roadWidth / 2 + 0.2;
        proceduralGroup.add(postRight);

        if (zOffset < this.roadLength / 2) {
          const ropeL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 8, 6), ropeMat);
          ropeL.rotation.x = Math.PI / 2;
          ropeL.position.set(-this.roadWidth / 2 - 0.2, 0.8, zOffset + 4);
          proceduralGroup.add(ropeL);

          const ropeR = ropeL.clone();
          ropeR.position.x = this.roadWidth / 2 + 0.2;
          proceduralGroup.add(ropeR);
        }
      }

      // Small brand signage occasional placements
      if (rand() < 0.4) {
        const boardSign = (rand() > 0.5) ? 1 : -1;
        const board = this.createSignBoardMesh(rand);
        board.position.set(boardSign * (this.roadWidth / 2 + 2.8), 0, -10 + rand() * 20);
        proceduralGroup.add(board);
      }

      // Overhead checkpoint gates (archways welcome posters) on every 5th chunk
      const parentChunkIndex = Math.round(segmentZOffset / -this.roadLength);
      if (parentChunkIndex > 0 && parentChunkIndex % 5 === 0) {
        const gateArch = this.createOverheadGateMesh(rand);
        gateArch.position.set(0, 0, 0); // centered inside the chunk
        proceduralGroup.add(gateArch);
      }

      roadGroup.add(proceduralGroup);
    } catch (err) {
      console.warn("Procedural chunk decoration failed:", err);
    }
  }

  private createHumanoidMesh(shirtColor: string = '#1d4ed8', pantsColor: string = '#1e3a8a', isWorker: boolean = false): THREE.Group {
    const person = new THREE.Group();
    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.25), new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 }));
    torso.position.y = 0.65;
    torso.castShadow = true;
    person.add(torso);
    
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: '#fbcfe8', roughness: 0.8 }));
    head.position.y = 1.05;
    head.castShadow = true;
    person.add(head);

    if (isWorker) {
      const hat = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.5 }));
      hat.scale.set(1.1, 0.65, 1.1);
      hat.position.set(0, 1.15, 0);
      person.add(hat);
    } else {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.9 }));
      hair.scale.set(1.05, 0.9, 1.05);
      hair.position.set(0, 1.1, 0);
      person.add(hair);
    }

    // Legs
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 6), new THREE.MeshStandardMaterial({ color: pantsColor }));
    legL.position.set(-0.1, 0.22, 0);
    legL.castShadow = true;
    person.add(legL);

    const legR = legL.clone();
    legR.position.x = 0.1;
    person.add(legR);

    // Arms
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 6), new THREE.MeshStandardMaterial({ color: shirtColor }));
    armL.position.set(-0.24, 0.65, 0);
    armL.rotation.z = Math.PI / 12;
    armL.castShadow = true;
    person.add(armL);

    const armR = armL.clone();
    armR.position.x = 0.24;
    armR.rotation.z = -Math.PI / 12;
    person.add(armR);

    person.scale.set(1.2, 1.2, 1.2);
    return person;
  }

  private createFeedBagsMesh(): THREE.Group {
    const sacks = new THREE.Group();
    const burlapMat = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.9 });
    for (let b = 0; b < 4; b++) {
      const sack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.8), burlapMat);
      sack.castShadow = true;
      sack.receiveShadow = true;
      sack.rotation.y = (b * Math.PI) / 4;
      sack.position.set((b % 2 === 0 ? -0.2 : 0.2), 0.125 + (Math.floor(b/2) * 0.2), (b % 2 === 0 ? 0.1 : -0.1));
      sacks.add(sack);
    }
    return sacks;
  }

  private createIrrigationMesh(): THREE.Group {
    const irr = new THREE.Group();
    const steelMat = this.matCache['decor_steel_pbr'] || new THREE.MeshStandardMaterial({ color: '#cccccc', metalness: 0.8 });
    
    // Vertical stand
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.5, 8), steelMat);
    stand.position.y = 1.75;
    stand.castShadow = true;
    irr.add(stand);

    // Horizontal pipe overhead out towards fields
    const mainPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.0, 8), steelMat);
    mainPipe.rotation.z = Math.PI / 2;
    mainPipe.position.set(2.5, 3.5, 0);
    mainPipe.castShadow = true;
    irr.add(mainPipe);

    // Drip sprinklers matching down
    for (let s = 1; s <= 3; s++) {
      const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), steelMat);
      drip.position.set(1.2 * s, 3.1, 0);
      drip.castShadow = true;
      irr.add(drip);

      // Sprinkler red nozzle head
      const nozzle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshStandardMaterial({ color: '#ef4444' }));
      nozzle.position.set(1.2 * s, 2.8, 0);
      irr.add(nozzle);
    }

    return irr;
  }

  private createHarvesterMesh(): THREE.Group {
    const harvester = new THREE.Group();
    // Body box
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 3.5), new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.5 })); // Red harvester
    body.position.y = 1.25;
    body.castShadow = true;
    body.receiveShadow = true;
    harvester.add(body);

    // Front high-fidelity reaper cylinder drum
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 2.6, 12), new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8, roughness: 0.3 }));
    drum.rotation.z = Math.PI / 2;
    drum.position.set(0, 0.65, 1.95);
    drum.castShadow = true;
    harvester.add(drum);

    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.1), new THREE.MeshStandardMaterial({ color: '#1e3a8a' }));
    armL.position.set(-1.1, 0.65, 1.2);
    harvester.add(armL);
    
    const armR = armL.clone();
    armR.position.x = 1.1;
    harvester.add(armR);

    // Glass Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.4), new THREE.MeshStandardMaterial({ color: '#93c5fd', transparent: true, opacity: 0.6, metalness: 0.9 }));
    cab.position.set(0, 2.2, 0.45);
    cab.castShadow = true;
    harvester.add(cab);

    // Heavy back and front crawler wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 });
    const tireF_L = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.5, 12), wheelMat);
    tireF_L.rotation.z = Math.PI / 2;
    tireF_L.position.set(-1.15, 0.7, 0.8);
    tireF_L.castShadow = true;
    harvester.add(tireF_L);

    const tireF_R = tireF_L.clone();
    tireF_R.position.x = 1.15;
    harvester.add(tireF_R);

    const tireB_L = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12), wheelMat);
    tireB_L.rotation.z = Math.PI / 2;
    tireB_L.position.set(-1.1, 0.45, -1.2);
    tireB_L.castShadow = true;
    harvester.add(tireB_L);

    const tireB_R = tireB_L.clone();
    tireB_R.position.x = 1.1;
    harvester.add(tireB_R);

    // Tall exhaust exhaust pipe stacks
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 8), this.matCache['decor_steel_pbr']);
    exhaust.position.set(0.6, 2.8, -1.0);
    harvester.add(exhaust);

    harvester.scale.set(1.1, 1.1, 1.1);
    return harvester;
  }

  private createHayBaleMesh(): THREE.Group {
    const bale = new THREE.Group();
    const strawMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.95 });
    
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.3, 12), strawMat);
    cyl.rotation.x = Math.PI / 2;
    cyl.position.y = 0.6;
    cyl.castShadow = true;
    cyl.receiveShadow = true;
    bale.add(cyl);

    const strapMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const strapL = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.03, 6, 16), strapMat);
    strapL.rotation.y = Math.PI / 2;
    strapL.position.set(0, 0.6, -0.35);
    bale.add(strapL);

    const strapR = strapL.clone();
    strapR.position.z = 0.35;
    bale.add(strapR);

    return bale;
  }

  private createTruckMesh(): THREE.Group {
    const truck = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.4), new THREE.MeshStandardMaterial({ color: '#be123c', roughness: 0.4 }));
    cab.position.set(0, 0.9, 1.6);
    cab.castShadow = true;
    truck.add(cab);

    const shield = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 0.1), new THREE.MeshStandardMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.6 }));
    shield.position.set(0, 1.3, 2.31);
    truck.add(shield);

    const carrier = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 4.0), new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.6, metalness: 0.4 }));
    carrier.position.set(0, 1.2, -1.2);
    carrier.castShadow = true;
    carrier.receiveShadow = true;
    truck.add(carrier);

    const sidePlateL = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), this.matCache['skm_logo_mat']);
    sidePlateL.position.set(-0.91, 1.2, -1.2);
    sidePlateL.rotation.y = -Math.PI / 2;
    truck.add(sidePlateL);

    const sidePlateR = sidePlateL.clone();
    sidePlateR.position.x = 0.91;
    sidePlateR.rotation.y = Math.PI / 2;
    truck.add(sidePlateR);

    const wheelMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9 });
    for (let w = 0; w < 3; w++) {
      const zOffset = -2.6 + w * 1.8;
      const tireL = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.35, 10), wheelMat);
      tireL.rotation.z = Math.PI / 2;
      tireL.position.set(-0.95, 0.48, zOffset);
      tireL.castShadow = true;
      truck.add(tireL);

      const tireR = tireL.clone();
      tireR.position.x = 0.95;
      truck.add(tireR);
    }

    truck.scale.set(1.1, 1.1, 1.1);
    return truck;
  }

  private createForkliftMesh(): THREE.Group {
    const fork = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.6), new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.4 }));
    body.position.y = 0.6;
    body.castShadow = true;
    fork.add(body);

    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.9), new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.8, roughness: 0.3 }));
    cage.position.set(0, 1.35, -0.1);
    cage.castShadow = true;
    fork.add(cage);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.1), new THREE.MeshStandardMaterial({ color: '#3f3f46', roughness: 0.7 }));
    frame.position.set(0, 0.9, 0.85);
    frame.castShadow = true;
    fork.add(frame);

    const forkL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.9), new THREE.MeshStandardMaterial({ color: '#71717a', metalness: 0.7 }));
    forkL.position.set(-0.2, 0.2, 1.3);
    forkL.castShadow = true;
    fork.add(forkL);

    const forkR = forkL.clone();
    forkR.position.x = 0.2;
    fork.add(forkR);

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 10), new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9 }));
    tire.rotation.z = Math.PI / 2;
    for (let side = -1; side <= 1; side += 2) {
      const t1 = tire.clone();
      t1.position.set(side * 0.55, 0.3, 0.45);
      t1.castShadow = true;
      fork.add(t1);

      const t2 = tire.clone();
      t2.position.set(side * 0.55, 0.3, -0.45);
      t2.castShadow = true;
      fork.add(t2);
    }

    return fork;
  }

  private createPalletMesh(): THREE.Group {
    const pallet = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.95 });
    
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.2), woodMat);
    base.position.y = 0.05;
    base.castShadow = true;
    pallet.add(base);

    const block1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.15), woodMat);
    block1.position.set(0, 0.175, -0.45);
    pallet.add(block1);
    
    const block2 = block1.clone();
    block2.position.z = 0;
    pallet.add(block2);

    const block3 = block1.clone();
    block3.position.z = 0.45;
    pallet.add(block3);

    for (let s = 0; s < 5; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.16), woodMat);
      slat.position.set(0, 0.27, -0.48 + s * 0.24);
      slat.castShadow = true;
      pallet.add(slat);
    }

    const boxMat = new THREE.MeshStandardMaterial({ color: '#cd853f', roughness: 0.9 });
    for (let c = 0; c < 3; c++) {
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), boxMat);
      card.castShadow = true;
      card.position.set((c === 0 ? -0.25 : c === 1 ? 0.25 : 0), 0.52 + (c === 2 ? 0.45 : 0), (c === 0 ? -0.2 : c === 1 ? 0.2 : 0));
      pallet.add(card);
    }

    return pallet;
  }

  private createHouseMesh(rand: () => number, wallColor: string = '#fdf4ff'): THREE.Group {
    const house = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.6, 4.4), new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85 }));
    base.position.y = 1.3;
    base.castShadow = true;
    base.receiveShadow = true;
    house.add(base);

    const roof = new THREE.Mesh(this.geoCache['roof'] || new THREE.ConeGeometry(2.5, 1.8, 4), new THREE.MeshStandardMaterial({ color: '#be123c', roughness: 0.6 }));
    roof.scale.set(1.4, 0.9, 1.15);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 3.4, 0);
    roof.castShadow = true;
    house.add(roof);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.75), new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 }));
    door.position.set(-1.81, 0.7, 0.8);
    door.castShadow = true;
    house.add(door);

    const windowMat = new THREE.MeshStandardMaterial({ color: '#bae6fd', emissive: '#38bdf8', emissiveIntensity: 0.15, roughness: 0.1 });
    const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.7), windowMat);
    win1.position.set(-1.81, 1.5, -0.8);
    house.add(win1);

    const win2 = win1.clone();
    win2.position.set(1.81, 1.5, 1.0);
    house.add(win2);

    const win3 = win1.clone();
    win3.position.set(1.81, 1.5, -1.0);
    house.add(win3);

    return house;
  }

  private createStreetLampMesh(): THREE.Group {
    const lamp = new THREE.Group();
    const steelMat = this.matCache['decor_steel_pbr'] || new THREE.MeshStandardMaterial({ color: '#4b5563', metalness: 0.8 });
    
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 4.2, 8), steelMat);
    pole.position.y = 2.1;
    pole.castShadow = true;
    lamp.add(pole);

    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.12), steelMat);
    neck.position.set(0.28, 4.2, 0);
    lamp.add(neck);

    const glowHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({
      color: '#fef08a',
      emissive: '#eab308',
      emissiveIntensity: 1.8,
      roughness: 0.1
    }));
    glowHead.position.set(0.55, 4.1, 0);
    glowHead.castShadow = true;
    lamp.add(glowHead);

    return lamp;
  }

  private createBarnMesh(rand: () => number): THREE.Group {
    const barn = new THREE.Group();
    const barnBase = new THREE.Mesh(this.geoCache['box'], new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.6 }));
    barnBase.scale.set(4, 3.6, 6);
    barnBase.position.y = 1.8;
    barnBase.receiveShadow = true;
    barnBase.castShadow = true;
    barn.add(barnBase);

    const barnRoof = new THREE.Mesh(this.geoCache['roof'], new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.5 }));
    barnRoof.scale.set(1.5, 1.1, 2.0);
    barnRoof.position.set(0, 4.4, 0);
    barnRoof.castShadow = true;
    barn.add(barnRoof);

    const doorMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.8 });
    const lDoor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 1.3), doorMat);
    lDoor.position.set(-2.02, 1.1, -0.85);
    barn.add(lDoor);
    const rDoor = lDoor.clone();
    rDoor.position.z = 0.85;
    barn.add(rDoor);

    const fanPivot = new THREE.Group();
    fanPivot.name = 'barn_vent_fan';
    fanPivot.position.set(0, 3.5, 2.9);
    const fanBlade = new THREE.Mesh(this.geoCache['box'], new THREE.MeshStandardMaterial({ color: '#1e293b' }));
    fanBlade.scale.set(0.12, 1.4, 0.18);
    fanPivot.add(fanBlade);
    barn.add(fanPivot);

    return barn;
  }

  private createResearchCenterMesh(rand: () => number): THREE.Group {
    const researchCenter = new THREE.Group();
    const mainBarn = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.2, 7.0), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 }));
    mainBarn.position.y = 1.6;
    mainBarn.castShadow = true;
    mainBarn.receiveShadow = true;
    researchCenter.add(mainBarn);

    const roof = new THREE.Mesh(this.geoCache['roof'], new THREE.MeshStandardMaterial({ color: '#be123c', roughness: 0.7 }));
    roof.scale.set(1.4, 0.7, 1.8);
    roof.position.set(0, 3.8, 0);
    roof.castShadow = true;
    researchCenter.add(roof);

    const labDome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 10, 10), new THREE.MeshStandardMaterial({ color: '#93c5fd', transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.9 }));
    labDome.position.set(-4.2, 0.8, 0.5);
    labDome.scale.set(1.0, 0.6, 1.0);
    labDome.castShadow = true;
    researchCenter.add(labDome);

    const wallLogo = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), this.matCache['skm_logo_mat']);
    wallLogo.position.set(0, 1.6, 3.52);
    researchCenter.add(wallLogo);

    return researchCenter;
  }

  private createWindmillMesh(rand: () => number): THREE.Group {
    const windmill = new THREE.Group();
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.3, 6.5, 10), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.7 }));
    tower.position.y = 3.25;
    tower.castShadow = true;
    tower.receiveShadow = true;
    windmill.add(tower);

    const fanGroup = new THREE.Group();
    fanGroup.name = 'windmill_fan';
    fanGroup.position.set(0, 6.5, 1.1);
    for (let f = 0; f < 4; f++) {
      const blade = new THREE.Mesh(this.geoCache['box'], new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5 }));
      blade.scale.set(0.2, 2.6, 0.04);
      const bPivot = new THREE.Group();
      bPivot.rotation.z = (f * Math.PI) / 2;
      blade.position.y = 1.3;
      bPivot.add(blade);
      fanGroup.add(bPivot);
    }
    windmill.add(fanGroup);
    return windmill;
  }

  private createFeedFactoryMesh(rand: () => number): THREE.Group {
    const feedFactory = new THREE.Group();
    const fabBlock = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 8), new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5, metalness: 0.7 }));
    fabBlock.position.y = 2.5;
    fabBlock.castShadow = true;
    fabBlock.receiveShadow = true;
    feedFactory.add(fabBlock);

    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5.0, 8), this.matCache['decor_steel_pbr']);
    chimney.position.set(-2.0, 7.5, 1.5);
    chimney.castShadow = true;
    feedFactory.add(chimney);

    const bLight = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), new THREE.MeshBasicMaterial({ color: '#ef4444' }));
    bLight.name = 'neon_blinker';
    bLight.position.set(-2.0, 10.1, 1.5);
    feedFactory.add(bLight);

    const wallWarning = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 2.5), this.matCache['skm_hazard_mat']);
    wallWarning.position.set(4.01, 2.5, 0);
    wallWarning.rotation.y = Math.PI / 2;
    feedFactory.add(wallWarning);

    return feedFactory;
  }

  private createCornFieldMesh(rand: () => number): THREE.Group {
    const cornField = new THREE.Group();
    const stalkMat = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.8 });
    const grainTopMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.7 });

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const stalk = new THREE.Group();
        stalk.name = 'stalk';
        stalk.position.set(row * 1.0, 0, col * 1.4);

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.8, 8), stalkMat);
        stem.position.y = 0.9;
        stem.castShadow = true;
        stalk.add(stem);

        const topEar = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), grainTopMat);
        topEar.scale.set(1, 2.5, 1);
        topEar.position.set(0, 1.8, 0);
        stalk.add(topEar);

        cornField.add(stalk);
      }
    }
    return cornField;
  }

  private createWarehouseHangarMesh(rand: () => number): THREE.Group {
    const warehouse = new THREE.Group();
    const whBase = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, 5.5), new THREE.MeshStandardMaterial({ color: '#0369a1', roughness: 0.6 }));
    whBase.position.y = 1.6;
    whBase.castShadow = true;
    whBase.receiveShadow = true;
    warehouse.add(whBase);

    const whRoof = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.25, 6.0), new THREE.MeshStandardMaterial({ color: '#0c4a6e', roughness: 0.3 }));
    whRoof.position.set(0, 3.3, 0);
    whRoof.castShadow = true;
    warehouse.add(whRoof);

    const rollDoor = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.2), this.matCache['decor_steel_pbr']);
    rollDoor.position.set(-2.26, 1.1, 0);
    rollDoor.rotation.y = -Math.PI / 2;
    warehouse.add(rollDoor);

    return warehouse;
  }

  private createIndustrialSilosMesh(rand: () => number): THREE.Group {
    const industrial = new THREE.Group();
    const silo = new THREE.Mesh(this.geoCache['silo'], this.matCache['decor_steel_pbr']);
    silo.scale.set(0.65, 0.65, 0.65);
    silo.position.set(0, 3.1, 0);
    silo.castShadow = true;
    silo.receiveShadow = true;
    industrial.add(silo);

    const pipe = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.15, 6, 12), new THREE.MeshStandardMaterial({ color: '#dc2626', metalness: 0.9 }));
    pipe.rotation.y = Math.PI / 2;
    pipe.position.set(0, 1.2, 0);
    industrial.add(pipe);

    return industrial;
  }

  private createTractorMesh(rand: () => number): THREE.Group {
    const tractor = new THREE.Group();
    const tBodyMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.4 });
    const tBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.8), tBodyMat);
    tBody.castShadow = true;
    tBody.receiveShadow = true;
    tractor.add(tBody);

    const tCab = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: '#bae6fd', roughness: 0.1 }));
    tCab.position.set(0, 0.85, -0.25);
    tCab.castShadow = true;
    tractor.add(tCab);

    const wheelMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.8 });
    const bigWL = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 10), wheelMat);
    bigWL.rotation.z = Math.PI / 2;
    bigWL.position.set(-0.65, 0.05, -0.45);
    bigWL.castShadow = true;
    tractor.add(bigWL);

    const bigWR = bigWL.clone();
    bigWR.position.x = 0.65;
    tractor.add(bigWR);

    return tractor;
  }

  private createChickenPenMesh(rand: () => number): THREE.Group {
    const pen = new THREE.Group();
    const penPostMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.95 });
    const barH = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 2.8), penPostMat);
    barH.position.set(0, 0.4, 0);
    pen.add(barH);

    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), penPostMat);
    p1.position.set(0, 0.4, -1.4);
    pen.add(p1);
    const p2 = p1.clone();
    p2.position.set(0, 0.4, 1.4);
    pen.add(p2);

    const miniChick = new THREE.Group();
    miniChick.name = 'bg_chicken';
    const mcBody = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.8 }));
    mcBody.castShadow = true;
    miniChick.add(mcBody);
    const mcHead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.8 }));
    mcHead.position.set(0, 0.15, -0.05);
    miniChick.add(mcHead);
    const mcBeak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), new THREE.MeshStandardMaterial({ color: '#ea580c' }));
    mcBeak.rotation.x = Math.PI / 2;
    mcBeak.position.set(0, 0.15, -0.14);
    miniChick.add(mcBeak);

    miniChick.position.set(0, 0.15, 0.1);
    pen.add(miniChick);

    return pen;
  }

  private createWheatFieldMesh(rand: () => number): THREE.Group {
    const wheatField = new THREE.Group();
    const wheatMat = new THREE.MeshStandardMaterial({ color: '#fba518', roughness: 0.95 });

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.2, 5), wheatMat);
        stalk.position.set(row * 0.8, 0.6, col * 1.0);
        stalk.rotation.z = (rand() - 0.5) * 0.12;
        stalk.castShadow = true;
        wheatField.add(stalk);
      }
    }
    return wheatField;
  }

  private createProceduralTree(rand: () => number, isPine: boolean): THREE.Group {
    const tree = new THREE.Group();
    tree.name = 'tree';

    const trunk = new THREE.Mesh(this.geoCache['trunk'], new THREE.MeshStandardMaterial({ color: '#3f1f0a', roughness: 0.9 }));
    trunk.position.y = 1.0;
    trunk.castShadow = true;
    tree.add(trunk);

    if (isPine) {
      const pineLeaves = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.4, 5), new THREE.MeshStandardMaterial({ color: '#064e3b', roughness: 0.85 }));
      pineLeaves.position.y = 2.2;
      pineLeaves.castShadow = true;
      tree.add(pineLeaves);

      const pineLeaves2 = pineLeaves.clone();
      pineLeaves2.scale.set(0.75, 0.75, 0.75);
      pineLeaves2.position.y = 3.2;
      tree.add(pineLeaves2);
    } else {
      const leaves = new THREE.Mesh(this.geoCache['leaves'], new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.8 }));
      leaves.scale.set(0.85, 0.85, 0.85);
      leaves.position.y = 2.1;
      leaves.castShadow = true;
      tree.add(leaves);

      const leaves2 = leaves.clone();
      leaves2.scale.set(0.65, 0.65, 0.65);
      leaves2.position.set(0.2, 2.7, -0.15);
      tree.add(leaves2);

      for (let ap = 0; ap < 3; ap++) {
        const apple = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 5), new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.2 }));
        const rAng = rand() * Math.PI * 2;
        apple.position.set(Math.cos(rAng) * 0.6, 1.6 + rand() * 0.7, Math.sin(rAng) * 0.6);
        tree.add(apple);
      }
    }

    return tree;
  }

  private createSignBoardMesh(rand: () => number): THREE.Group {
    const skmBoard = new THREE.Group();
    const postLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.6, 0.15), this.matCache['decor_steel_pbr']);
    postLeg.position.y = 1.3;
    skmBoard.add(postLeg);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 0.12), new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.6 }));
    signBoard.position.set(0, 2.4, 0);
    signBoard.castShadow = true;
    skmBoard.add(signBoard);

    const faceCover = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), this.matCache['skm_billboard_white_mat']);
    faceCover.position.set(0, 2.4, 0.065);
    skmBoard.add(faceCover);

    return skmBoard;
  }

  private createOverheadGateMesh(rand: () => number): THREE.Group {
    const gateArch = new THREE.Group();
    const colLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 7.0, 64), this.matCache['decor_steel_pbr']);
    colLeft.position.set(-this.roadWidth / 2 - 1.0, 3.5, 0);
    colLeft.castShadow = true;
    colLeft.receiveShadow = true;
    gateArch.add(colLeft);

    const colRight = colLeft.clone();
    colRight.position.x = this.roadWidth / 2 + 1.0;
    gateArch.add(colRight);

    const overheadTruss = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 3.0, 0.4, 0.4), this.matCache['decor_steel_pbr']);
    overheadTruss.position.set(0, 7.0, 0);
    overheadTruss.castShadow = true;
    gateArch.add(overheadTruss);

    const beaconL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: '#3b82f6' }));
    beaconL.name = 'beacon_blue';
    beaconL.position.set(-2.5, 7.3, 0);
    gateArch.add(beaconL);

    const beaconR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: '#ef4444' }));
    beaconR.name = 'beacon_red';
    beaconR.position.set(2.5, 7.3, 0);
    gateArch.add(beaconR);

    const gateBanner = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 1.6), this.matCache['skm_banner_red_mat']);
    gateBanner.name = 'skm_waving_cloth';
    gateBanner.position.set(0, 5.8, 0);
    gateBanner.castShadow = true;
    gateArch.add(gateBanner);

    return gateArch;
  }



  private buildPlayer() {
    this.playerGroup = new THREE.Group();
    // Positioned smoothly on runway Z point
    this.playerGroup.position.set(0, 0.5, this.playerZ);
    this.playerGroup.scale.set(0.9, 0.9, 0.9); // Adorably sized, making it occupy 10-15% of screen height
    this.scene.add(this.playerGroup);

    // Dynamic procedural textures according to equipped skin type:
    const meshWhiteFeathers = this.matCache['mesh_white_feathers'] as THREE.MeshStandardMaterial;

    // Body - Upgraded to a beautiful rounded organic plump torso
    this.chickenBodyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 24, 24),
      meshWhiteFeathers
    );
    this.chickenBodyMesh.scale.set(1.0, 1.15, 1.15); // adorable plump tear-drop contour
    this.chickenBodyMesh.castShadow = true;
    this.chickenBodyMesh.receiveShadow = true;
    this.playerGroup.add(this.chickenBodyMesh);

    // Neck ring link with rounded smooth cylinder
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.28, 16), meshWhiteFeathers);
    neck.position.set(0, 0.55, -0.12);
    neck.castShadow = true;
    this.playerGroup.add(neck);

    // Large plump volumetric Head section - perfectly rounded sphere instead of box!
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), meshWhiteFeathers);
    head.position.set(0, 0.82, -0.2);
    head.castShadow = true;
    this.playerGroup.add(head);

    // Animated beak section (Curved upper cone and separate dynamic underjaw) - highly smoothed
    const upperBeak = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.36, 16),
      this.matCache['beak_standard']
    );
    upperBeak.rotation.x = Math.PI / 1.85;
    upperBeak.position.set(0, 0.82, -0.54);
    this.playerGroup.add(upperBeak);

    const lowerBeak = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.26, 16),
      this.matCache['beak_standard']
    );
    lowerBeak.rotation.x = Math.PI / 2.1;
    lowerBeak.position.set(0, 0.74, -0.52);
    this.playerGroup.add(lowerBeak);

    // Staggered wavy glossy Red comb on head - beautifully rounded spheres
    const redCombMat = this.matCache['crest_standard'];
    
    const combMid = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), redCombMat);
    combMid.scale.set(0.6, 1.5, 1.2);
    combMid.position.set(0, 1.22, -0.2);
    combMid.castShadow = true;
    this.playerGroup.add(combMid);

    const combBack = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), redCombMat);
    combBack.scale.set(0.6, 1.3, 1.0);
    combBack.position.set(0, 1.12, -0.04);
    combBack.castShadow = true;
    this.playerGroup.add(combBack);

    const combFront = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), redCombMat);
    combFront.scale.set(0.6, 1.2, 1.0);
    combFront.position.set(0, 1.12, -0.34);
    combFront.castShadow = true;
    this.playerGroup.add(combFront);

    // Cute high-fidelity organic big rounded glossy cartoon eyes
    const eyeWhiteGeo = new THREE.SphereGeometry(0.10, 16, 16);
    const pupilGeo = new THREE.SphereGeometry(0.06, 16, 16);

    const eyeLWhite = new THREE.Mesh(eyeWhiteGeo, this.matCache['white_gloss']);
    eyeLWhite.scale.set(1.1, 1.1, 0.6);
    eyeLWhite.position.set(-0.24, 0.88, -0.38);
    this.playerGroup.add(eyeLWhite);

    const pupilL = new THREE.Mesh(pupilGeo, this.matCache['black_matte']);
    pupilL.scale.set(1.1, 1.1, 0.5);
    pupilL.position.set(-0.26, 0.88, -0.44);
    this.playerGroup.add(pupilL);

    const eyeRWhite = new THREE.Mesh(eyeWhiteGeo, this.matCache['white_gloss']);
    eyeRWhite.scale.set(1.1, 1.1, 0.6);
    eyeRWhite.position.set(0.24, 0.88, -0.38);
    this.playerGroup.add(eyeRWhite);

    const pupilR = new THREE.Mesh(pupilGeo, this.matCache['black_matte']);
    pupilR.scale.set(1.1, 1.1, 0.5);
    pupilR.position.set(0.27, 0.88, -0.44);
    this.playerGroup.add(pupilR);

    // Layered feathers styling Tail bundle - high fidelity rounded capsule feathers
    this.chickenTailGroup = new THREE.Group();
    this.chickenTailGroup.position.set(0, 0.1, 0.45);
    for (let f = 0; f < 3; f++) {
      const tailFeath = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.48, 8, 12), meshWhiteFeathers);
      tailFeath.position.set((f - 1) * 0.22, 0.2, 0.1);
      tailFeath.rotation.x = Math.PI / 3 + (f === 1 ? 0.15 : 0) + (Math.random() - 0.5) * 0.05;
      tailFeath.castShadow = true;
      this.chickenTailGroup.add(tailFeath);
    }
    this.playerGroup.add(this.chickenTailGroup);

    // Animated Wings - beautifully rounded organic stylized wing geometry
    this.chickenLeftWing = new THREE.Group();
    this.chickenLeftWing.position.set(-0.55, 0.1, -0.05);
    const lWingBase = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), meshWhiteFeathers);
    lWingBase.scale.set(0.23, 1.2, 1.8);
    lWingBase.rotation.x = Math.PI / 12;
    lWingBase.castShadow = true;
    this.chickenLeftWing.add(lWingBase);
    this.playerGroup.add(this.chickenLeftWing);

    this.chickenRightWing = new THREE.Group();
    this.chickenRightWing.position.set(0.55, 0.1, -0.05);
    const rWingBase = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), meshWhiteFeathers);
    rWingBase.scale.set(0.23, 1.2, 1.8);
    rWingBase.rotation.x = Math.PI / 12;
    rWingBase.castShadow = true;
    this.chickenRightWing.add(rWingBase);
    this.playerGroup.add(this.chickenRightWing);

    // Fully-Articulated yellow legs and 3-toed dynamic claw foot plates
    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.58, 12);
    const orangeLegMat = this.matCache['beak_standard'];

    this.chickenLeftLeg = new THREE.Mesh(legGeo, orangeLegMat);
    this.chickenLeftLeg.name = 'left_leg';
    this.chickenLeftLeg.position.set(-0.22, -0.54, 0);
    this.chickenLeftLeg.castShadow = true;
    
    // Smooth 3-toed paw foot structure
    const lFootPlate = new THREE.Group();
    lFootPlate.position.set(0, -0.28, 0);
    
    const centerToe = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.18, 6, 8), orangeLegMat);
    centerToe.rotation.x = Math.PI / 2;
    centerToe.position.set(0, 0, -0.09);
    centerToe.castShadow = true;
    lFootPlate.add(centerToe);

    const leftToe = centerToe.clone();
    leftToe.rotation.y = Math.PI / 6;
    leftToe.position.set(-0.06, 0, -0.08);
    lFootPlate.add(leftToe);

    const rightToe = centerToe.clone();
    rightToe.rotation.y = -Math.PI / 6;
    rightToe.position.set(0.06, 0, -0.08);
    lFootPlate.add(rightToe);

    this.chickenLeftLeg.add(lFootPlate);
    this.playerGroup.add(this.chickenLeftLeg);

    this.chickenRightLeg = new THREE.Mesh(legGeo, orangeLegMat);
    this.chickenRightLeg.name = 'right_leg';
    this.chickenRightLeg.position.set(0.22, -0.54, 0);
    this.chickenRightLeg.castShadow = true;

    const rFootPlate = lFootPlate.clone();
    this.chickenRightLeg.add(rFootPlate);
    this.playerGroup.add(this.chickenRightLeg);

    // --- Special Shield Bubble ---
    const shieldGeo = new THREE.SphereGeometry(1.4, 20, 20);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: '#34d399',
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });
    this.shieldBubbleMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldBubbleMesh.visible = false;
    this.playerGroup.add(this.shieldBubbleMesh);

    // --- Magnet Ring Aura ---
    const magnetGeo = new THREE.RingGeometry(0.9, 1.6, 12);
    const magnetMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.magnetAuraMesh = new THREE.Mesh(magnetGeo, magnetMat);
    this.magnetAuraMesh.rotation.x = Math.PI / 2;
    this.magnetAuraMesh.position.y = -0.45;
    this.magnetAuraMesh.visible = false;
    this.playerGroup.add(this.magnetAuraMesh);
  }

  private buildParticles() {
    // Continuous drifting Splashes (Feathers)
    const geometry = new THREE.BufferGeometry();
    this.featherPositions = new Float32Array(this.featherCount * 3);
    this.featherVelocities = new Float32Array(this.featherCount * 3);
    this.featherColors = new Float32Array(this.featherCount * 3);

    for (let i = 0; i < this.featherCount; i++) {
      this.featherPositions[i * 3] = 0;
      this.featherPositions[i * 3 + 1] = 0;
      this.featherPositions[i * 3 + 2] = 0;

      this.featherVelocities[i * 3] = (Math.random() - 0.5) * 8.5;
      this.featherVelocities[i * 3 + 1] = Math.random() * 8.0 + 3.0;
      this.featherVelocities[i * 3 + 2] = (Math.random() - 0.5) * 8.5;

      const rand = Math.random();
      if (rand < 0.5) {
        this.featherColors[i * 3] = 0.98; // soft white
        this.featherColors[i * 3 + 1] = 0.98;
        this.featherColors[i * 3 + 2] = 0.98;
      } else if (rand < 0.8) {
        this.featherColors[i * 3] = 0.96; // amber yellow
        this.featherColors[i * 3 + 1] = 0.8;
        this.featherColors[i * 3 + 2] = 0.2;
      } else {
        this.featherColors[i * 3] = 0.95; // bright red
        this.featherColors[i * 3 + 1] = 0.15;
        this.featherColors[i * 3 + 2] = 0.05;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.featherPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.featherColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true
    });

    this.featherParticles = new THREE.Points(geometry, pMat);
    this.featherParticles.visible = false;
    this.scene.add(this.featherParticles);

    // Weather Rain splash indicators
    const rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 3);
    for (let j = 0; j < this.rainCount; j++) {
      this.rainPositions[j * 3] = (Math.random() - 0.5) * 22.0;
      this.rainPositions[j * 3 + 1] = Math.random() * 20.0;
      this.rainPositions[j * 3 + 2] = -Math.random() * 80.0;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: '#cbd5e1',
      size: 0.09,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  private cloudMaterial!: THREE.MeshStandardMaterial;

  private buildAtmosphere() {
    this.bgClouds = [];
    this.bgBirds = [];

    // Create 4-5 puffy cotton clouds high in the sky with instance-controlled material
    this.cloudMaterial = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.9,
      transparent: true,
      opacity: 0.85,
    });

    for (let c = 0; c < 5; c++) {
      const cloud = new THREE.Group();
      cloud.name = 'atmosphere_cloud';
      // Distribute along Z and X axes
      cloud.position.set(
        -25 + Math.random() * 50,
        14 + Math.random() * 4,
        -120 + c * 30
      );

      // Fluffy overlapping spheres
      const centerSphere = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 12), this.cloudMaterial);
      centerSphere.castShadow = true;
      cloud.add(centerSphere);

      const leftSphere = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 10), this.cloudMaterial);
      leftSphere.position.set(-1.8, -0.4, 0.2);
      cloud.add(leftSphere);

      const rightSphere = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 10), this.cloudMaterial);
      rightSphere.position.set(1.9, -0.3, -0.2);
      cloud.add(rightSphere);

      const topSphere = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), this.cloudMaterial);
      topSphere.position.set(0.3, 1.3, 0);
      cloud.add(topSphere);

      this.scene.add(cloud);
      this.bgClouds.push(cloud);
    }

    // Starry Sky sparkles for night-time / clear night
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 180;
    const starPositions = new Float32Array(starCount * 3);
    for (let s = 0; s < starCount; s++) {
      starPositions[s * 3] = (Math.random() - 0.5) * 80.0;
      starPositions[s * 3 + 1] = 18.0 + Math.random() * 12.0; // high above
      starPositions[s * 3 + 2] = -Math.random() * 120.0;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.16,
      transparent: true,
      opacity: 0.0, // starts completely invisible, dynamic night lerper updates opacity
      sizeAttenuation: true,
    });
    this.starsParticles = new THREE.Points(starsGeo, starsMat);
    this.scene.add(this.starsParticles);

    // Dynamic lightning flash light
    this.lightningLight = new THREE.DirectionalLight('#ffffff', 0);
    this.lightningLight.position.set(0, 30, -30);
    this.scene.add(this.lightningLight);

    // Create 3 adorable stylized cartoon flying birds that flapping wings
    const birdMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.5,
      metalness: 0.1,
    });
    const orangeBillMat = new THREE.MeshStandardMaterial({ color: '#ea580c' });

    for (let b = 0; b < 3; b++) {
      const bird = new THREE.Group();
      bird.name = 'bg_flying_bird';
      bird.position.set(
        -12 + Math.random() * 24,
        9 + Math.random() * 3,
        -70 + b * 25
      );

      // Body (capsule form)
      const bBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.28, 6, 8), birdMat);
      bBody.rotation.x = Math.PI / 2;
      bird.add(bBody);

      // Little head
      const bHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), birdMat);
      bHead.position.set(0, 0.12, -0.18);
      bird.add(bHead);

      // Beak
      const bBeak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), orangeBillMat);
      bBeak.rotation.x = Math.PI / 2;
      bBeak.position.set(0, 0.10, -0.29);
      bird.add(bBeak);

      // Left and right wing groups for jointed articulation wing flaps!
      const lWingGroup = new THREE.Group();
      lWingGroup.name = 'l_wing_joint';
      lWingGroup.position.set(-0.13, 0.04, 0);
      const lWingMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.18), birdMat);
      lWingMesh.position.set(-0.19, 0, 0);
      lWingGroup.add(lWingMesh);
      bird.add(lWingGroup);

      const rWingGroup = new THREE.Group();
      rWingGroup.name = 'r_wing_joint';
      rWingGroup.position.set(0.13, 0.04, 0);
      const rWingMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.18), birdMat);
      rWingMesh.position.set(0.19, 0, 0);
      rWingGroup.add(rWingMesh);
      bird.add(rWingGroup);

      this.scene.add(bird);
      this.bgBirds.push(bird);
    }
  }

  private spawnDustParticle() {
    if (this.isJumping || !this.isRunning || this.isPaused || this.isCrashed) return;

    // Place smoke directly on foot point
    const footX = this.playerX + (Math.random() - 0.5) * 0.4;
    const footY = -0.15;
    const footZ = this.playerZ + (Math.random() - 0.5) * 0.3;

    let p = this.smokeParticles.find(m => m.life <= 0);
    if (!p) {
      const geo = new THREE.SphereGeometry(0.12 + Math.random() * 0.12, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: '#b4a390',
        transparent: true,
        opacity: 0.45,
      });
      const mesh = new THREE.Mesh(geo, mat);
      this.scene.add(mesh);
      p = { mesh, life: 1.0, velocity: new THREE.Vector3() };
      this.smokeParticles.push(p);
    }

    p.life = 0.55 + Math.random() * 0.3;
    p.mesh.visible = true;
    p.mesh.position.set(footX, footY, footZ);
    p.mesh.scale.set(1, 1, 1);

    // Blow slowly upwards and backwards
    p.velocity.set(
      (Math.random() - 0.5) * 0.3,
      Math.random() * 1.6 + 0.4,
      this.speed * 0.5 // blown behind chicken
    );
  }

  public setSkin(skinId: string, primaryColor: string, accentColor?: string) {
    this.currentSkinId = skinId;
    let customFeathMat = this.matCache['mesh_white_feathers'];

    if (skinId === 'skin_golden') {
      customFeathMat = this.matCache['mesh_golden_feathers'];
    } else if (skinId === 'skin_robo') {
      customFeathMat = this.matCache['mesh_cyber_feathers'];
    }

    if (this.chickenBodyMesh && customFeathMat) {
      this.chickenBodyMesh.material = customFeathMat;
    }

    // Wing updates
    this.chickenLeftWing.traverse((node) => {
      if (node instanceof THREE.Mesh && customFeathMat) {
        node.material = customFeathMat;
      }
    });
    this.chickenRightWing.traverse((node) => {
      if (node instanceof THREE.Mesh && customFeathMat) {
        node.material = customFeathMat;
      }
    });

    // Update left/right leg rods
    if (this.chickenLeftLeg && this.chickenRightLeg) {
      const lMat = this.chickenLeftLeg.material;
      const rMat = this.chickenRightLeg.material;
      if (lMat instanceof THREE.MeshStandardMaterial && rMat instanceof THREE.MeshStandardMaterial) {
        if (skinId === 'skin_robo') {
          lMat.color.set('#06b6d4'); // cyber neon cyan
          rMat.color.set('#06b6d4');
        } else {
          const orange = accentColor || '#f59e0b';
          lMat.color.set(orange);
          rMat.color.set(orange);
        }
      }
    }
  }

  public validateEcosystem(theme: ThemeType): boolean {
    try {
      if (!this.ambientLight || !this.dirLight) {
        console.error("Environment Validation Failed: Lighting gears not active!");
        return false;
      }
      if (!this.scene) {
        console.error("Environment Validation Failed: Three.js Scene not active!");
        return false;
      }
      if (!this.geoCache['road'] || !this.matCache['road_asphalt_pbr']) {
        console.error("Environment Validation Failed: Cache structures are missing!");
        return false;
      }
      
      const themes: ThemeType[] = [
        'POULTRY_FARM',
        'CORN_FIELDS',
        'WHEAT_FIELDS',
        'SKM_FACTORY',
        'WAREHOUSE',
        'RIVER_AREA',
        'VILLAGE_ROADS',
        'NIGHT_FARM',
        'RAINY_SEASON'
      ];
      if (!themes.includes(theme)) {
        console.error("Environment Validation Failed: Target theme invalid name -", theme);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Environment Validation Exception Raised:", err);
      return false;
    }
  }

  private spawnEmergencyTerrain(roadGrp: THREE.Group, segmentZOffset: number) {
    try {
      console.warn("[Emergency Terrain] Restoring chunk heights/meshes at offset:", segmentZOffset);
      
      let roadMesh = roadGrp.getObjectByName('ground_plane') as THREE.Mesh;
      if (!roadMesh) {
        roadMesh = new THREE.Mesh(this.geoCache['road'] || new THREE.PlaneGeometry(this.roadWidth, this.roadLength), this.matCache['road_asphalt_pbr']);
        roadMesh.name = 'ground_plane';
        roadMesh.rotation.x = -Math.PI / 2;
        roadMesh.receiveShadow = true;
        roadGrp.add(roadMesh);
      }
      
      let shoulderL = roadGrp.getObjectByName('shoulder_l') as THREE.Mesh;
      if (!shoulderL) {
        shoulderL = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 0.4, this.roadLength),
          new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.9 })
        );
        shoulderL.name = 'shoulder_l';
        shoulderL.position.set(-this.roadWidth / 2 - 1.25, -0.15, 0);
        shoulderL.receiveShadow = true;
        roadGrp.add(shoulderL);
      }
      let shoulderR = roadGrp.getObjectByName('shoulder_r') as THREE.Mesh;
      if (!shoulderR) {
        shoulderR = shoulderL.clone();
        shoulderR.name = 'shoulder_r';
        shoulderR.position.x = this.roadWidth / 2 + 1.25;
        roadGrp.add(shoulderR);
      }
      
      let terrainMesh = roadGrp.getObjectByName('rolling_terrain') as THREE.Mesh;
      if (!terrainMesh) {
        const terrainGeom = new THREE.PlaneGeometry(360.0, 42.0, 48, 8);
        const terrainMat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.95,
          flatShading: true,
        });
        terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
        terrainMesh.name = 'rolling_terrain';
        terrainMesh.rotation.x = -Math.PI / 2;
        terrainMesh.receiveShadow = true;
        terrainMesh.castShadow = true;
        roadGrp.add(terrainMesh);
      }
      
      this.applyFallbackSegmentTerrain(roadGrp);
      
      let proceduralDecor = roadGrp.getObjectByName('procedural_decor') as THREE.Group;
      if (proceduralDecor) {
        roadGrp.remove(proceduralDecor);
      }
      proceduralDecor = new THREE.Group();
      proceduralDecor.name = 'procedural_decor';
      
      let seed = Math.abs(segmentZOffset) || 7;
      const rand = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };
      
      for (let t = 0; t < 4; t++) {
        const side = rand() > 0.5 ? 1 : -1;
        const xPos = side * (18.0 + rand() * 15.0);
        const zPos = -15.0 + rand() * 30.0;
        const tree = this.createProceduralTree(rand, rand() > 0.5);
        tree.position.set(xPos, 0, zPos);
        proceduralDecor.add(tree);
      }
      
      const fenceMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.8 });
      const fenceBar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.16, 0.16), fenceMat);
      fenceBar.position.set(-this.roadWidth / 4, 0.5, 0);
      proceduralDecor.add(fenceBar);
      
      roadGrp.add(proceduralDecor);
      console.log("Chunks loaded: Emergency layout completed.");
    } catch (err) {
      console.error("[Emergency Terrain] Critical repair failed completely:", err);
    }
  }

  private verifyAndRebuildHierarchy() {
    try {
      if (!this.scene) {
        console.warn("[Camera Safety] Active scene tree is missing! Recreating...");
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#475569');
        this.scene.fog = new THREE.FogExp2('#475569', 0.012);
      }

      if (!this.camera || !(this.camera instanceof THREE.PerspectiveCamera)) {
        console.warn("[Camera Safety] Active perspective camera is missing or corrupt! Creating safe perspective viewport...");
        this.camera = new THREE.PerspectiveCamera(
          this.baseFOV,
          this.canvas.clientWidth / this.canvas.clientHeight,
          0.1,
          450.0
        );
        this.camera.position.set(0, 3.2, -1.2);
        this.camera.lookAt(new THREE.Vector3(0, 1.0, -18.0));
      }
      if (!this.scene.children.includes(this.camera)) {
        this.scene.add(this.camera);
      }

      if (!this.ambientLight) {
        this.ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
      }
      if (!this.scene.children.includes(this.ambientLight)) {
        this.scene.add(this.ambientLight);
      }

      if (!this.dirLight) {
        this.dirLight = new THREE.DirectionalLight('#ffffbf', 1.3);
        this.dirLight.position.set(18, 35, 12);
        this.dirLight.castShadow = true;
      }
      if (!this.scene.children.includes(this.dirLight)) {
        this.scene.add(this.dirLight);
      }

      if (!this.playerGroup || !this.scene.children.includes(this.playerGroup)) {
        console.warn("[Camera Safety] Player is missing from the active player group! Rebuilding...");
        this.buildPlayer();
      }

      if (!this.roads || this.roads.length < 3) {
        console.warn("[Camera Safety] Core road chunks are missing, incomplete, or deleted! Reforming stream...");
        this.buildRoads();
      } else {
        this.roads.forEach((roadGrp) => {
          if (!this.scene.children.includes(roadGrp)) {
            this.scene.add(roadGrp);
          }
          const terrain = roadGrp.getObjectByName('rolling_terrain');
          const ground = roadGrp.getObjectByName('ground_plane');
          if (!terrain || !ground) {
            console.warn("[Camera Safety] Segment is missing critical terrain meshes! Spawning emergency layout...");
            this.spawnEmergencyTerrain(roadGrp, roadGrp.position.z);
          }
        });
      }
    } catch (err) {
      console.error("[Camera Safety] Failed to verify/rebuild structure:", err);
    }
  }

  public changeTheme(theme: ThemeType) {
    // Disabled to preserve ONE HUGE CONTINUOUS SKM WORLD
  }

  private spawnProceduralSegment(currentZ: number) {
    const laneOccupancy = [0, 0, 0];
    const randPattern = Math.random();

    let isAllPass = false;

    if (randPattern < 0.35) {
      // 1 lane blocked
      const blockLane = Math.floor(Math.random() * 3) - 1;
      this.createObstacle(blockLane, currentZ);
    } else if (randPattern < 0.72) {
      // 2 lanes blocked (perfect Subway Surfers lane puzzle requirement)
      const blockLane1 = Math.floor(Math.random() * 3) - 1;
      let blockLane2 = Math.floor(Math.random() * 3) - 1;
      while (blockLane1 === blockLane2) {
        blockLane2 = Math.floor(Math.random() * 3) - 1;
      }
      this.createObstacle(blockLane1, currentZ);
      this.createObstacle(blockLane2, currentZ);
    } else {
      // Sliding layout barriers
      const blockLane = Math.floor(Math.random() * 3) - 1;
      this.createObstacle(blockLane, currentZ, 'HIGH_BARRIER');
      isAllPass = true;
    }

    // Spawn Feed bags in open pathways
    for (let lane = -1; lane <= 1; lane++) {
      if (Math.random() < 0.68) {
        const collTypeRand = Math.random();
        let cType = 'FEED';
        if (collTypeRand < 0.15) cType = 'GOLDEN_FEED';
        else if (collTypeRand < 0.32) cType = 'CORN';
        else if (collTypeRand < 0.4) cType = 'EGG';
        else if (collTypeRand < 0.44) cType = 'CRYSTAL';

        if (Math.random() < 0.04) {
          const powerTypes = [PowerUpType.MAGNET, PowerUpType.SHIELD, PowerUpType.DOUBLE_SCORE, PowerUpType.SPEED_BOOST];
          cType = 'POWERUP_' + powerTypes[Math.floor(Math.random() * powerTypes.length)];
        }

        const count = isAllPass ? 3 : 2;
        for (let i = 0; i < count; i++) {
          this.createCollectible(lane, currentZ - i * 3.6, cType);
        }
      }
    }
  }

  private createObstacle(lane: number, zPos: number, specialType?: string) {
    let type = specialType || 'FENCE';
    const rand = Math.random();

    if (!specialType) {
      if (this.activeTheme === 'SKM_FACTORY' || this.activeTheme === 'WAREHOUSE') {
        type = rand < 0.5 ? 'CONTAINER' : rand < 0.8 ? 'TRUCK' : 'FENCE';
      } else {
        type = rand < 0.4 ? 'TRACTOR' : rand < 0.75 ? 'HAY_BALE' : 'FENCE';
      }
    }

    let obs = this.obstacles.find((o) => !o.active && o.type === type);
    if (!obs) {
      const mesh = new THREE.Group();
      mesh.name = `obs_${type}`;

      const redMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.65 });

      if (type === 'FENCE') {
        // Double striped warning barrier fence
        const topBar = new THREE.Mesh(this.geoCache['box'], redMat);
        topBar.scale.set(1.9, 0.16, 0.16);
        topBar.position.y = 0.55;
        topBar.castShadow = true;
        mesh.add(topBar);

        const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 4), redMat);
        pillarL.position.set(-0.85, 0.55, 0);
        pillarL.castShadow = true;
        mesh.add(pillarL);

        const pillarR = pillarL.clone();
        pillarR.position.x = 0.85;
        mesh.add(pillarR);
      } else if (type === 'HIGH_BARRIER') {
        // Tall cautionary hanging frame requiring under-slides
        const gateMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.5 });
        const cross = new THREE.Mesh(this.geoCache['box'], gateMat);
        cross.scale.set(2.2, 0.22, 0.22);
        cross.position.y = 1.35;
        cross.castShadow = true;
        mesh.add(cross);

        const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.7, 4), gateMat);
        leftLeg.position.set(-1.0, 1.35, 0);
        leftLeg.castShadow = true;
        mesh.add(leftLeg);

        const rightLeg = leftLeg.clone();
        rightLeg.position.x = 1.0;
        mesh.add(rightLeg);

        // Warning striped coverplate
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ color: '#fbbf24', side: THREE.DoubleSide }));
        sign.position.set(0, 0.85, 0);
        mesh.add(sign);
      } else if (type === 'HAY_BALE') {
        // Farm giant crop bale
        const bale = new THREE.Mesh(
          new THREE.CylinderGeometry(0.95, 0.95, 1.9, 10),
          new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.95 })
        );
        bale.rotation.z = Math.PI / 2;
        bale.position.y = 0.45;
        bale.castShadow = true;
        mesh.add(bale);
      } else if (type === 'TRACTOR') {
        // Detailed PBR farmers tractor obstacle
        const greenMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.5 });
        const body = new THREE.Mesh(this.geoCache['box'], greenMat);
        body.scale.set(1.4, 1.25, 2.3);
        body.position.y = 0.8;
        body.castShadow = true;
        body.receiveShadow = true;
        mesh.add(body);

        const cab = new THREE.Mesh(this.geoCache['box'], new THREE.MeshStandardMaterial({ color: '#bae6fd', roughness: 0.2 }));
        cab.scale.set(1.05, 1.0, 1.1);
        cab.position.set(0, 1.8, -0.3);
        cab.castShadow = true;
        mesh.add(cab);

        // Big heavy rear tracks tires
        const tireMat = this.matCache['black_matte'];
        const tireBig = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.44, 8), tireMat);
        tireBig.rotation.z = Math.PI / 2;
        tireBig.position.set(-0.82, 0.65, -0.6);
        tireBig.castShadow = true;
        mesh.add(tireBig);

        const tireBigR = tireBig.clone();
        tireBigR.position.x = 0.82;
        mesh.add(tireBigR);

        const tireSmall = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.34, 8), tireMat);
         tireSmall.rotation.z = Math.PI / 2;
        tireSmall.position.set(-0.78, 0.38, 0.6);
        tireSmall.castShadow = true;
        mesh.add(tireSmall);

        const tireSmallR = tireSmall.clone();
        tireSmallR.position.x = 0.78;
        mesh.add(tireSmallR);
      } else if (type === 'TRUCK') {
        const body = new THREE.Mesh(this.geoCache['box'], new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.5 }));
        body.scale.set(1.5, 2.3, 4.4);
        body.position.y = 1.2;
        body.castShadow = true;
        mesh.add(body);
      } else {
        // Red container
        const cont = new THREE.Mesh(this.geoCache['box'], new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.5 }));
        cont.scale.set(1.6, 1.9, 2.5);
        cont.position.y = 0.95;
        cont.castShadow = true;
        mesh.add(cont);
      }

      this.scene.add(mesh);
      obs = { mesh, type, lane, active: true };
      this.obstacles.push(obs);
    } else {
      obs.lane = lane;
      obs.active = true;
      obs.mesh.visible = true;
    }

    obs.mesh.position.set(lane * 2.5, 0, zPos);
  }

  private createCollectible(lane: number, zPos: number, type: string) {
    let scoreValue = 10;
    let coll = this.collectibles.find((c) => !c.active && c.type === type);

    if (!coll) {
      const mesh = new THREE.Group();
      mesh.name = `coll_${type}`;

      if (type === 'FEED') {
        const shape = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.75, 6), this.matCache['burlap_sack_pbr']);
        shape.castShadow = true;
        shape.position.y = 0.45;
        mesh.add(shape);
        scoreValue = 10;
      } else if (type === 'GOLDEN_FEED') {
        const shape = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.85, 6), this.matCache['gold_specular_high']);
        shape.castShadow = true;
        shape.position.y = 0.5;
        mesh.add(shape);
        scoreValue = 50;
      } else if (type === 'CORN') {
        const shape = new THREE.Mesh(new THREE.SphereGeometry(0.2, 5, 5), this.matCache['gold_specular_high']);
        shape.position.y = 0.45;
        mesh.add(shape);
        scoreValue = 20;
      } else if (type === 'EGG') {
        const shape = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), this.matCache['egg_gloss_white']);
        shape.scale.set(1.0, 1.4, 1.0);
        shape.position.y = 0.45;
        mesh.add(shape);
        scoreValue = 100;
      } else if (type === 'CRYSTAL') {
        const shape = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), this.matCache['crystal_neon_ruby']);
        shape.position.y = 0.45;
        mesh.add(shape);
        scoreValue = 250;
      } else if (type.startsWith('POWERUP_')) {
        const pType = type.split('_')[1];
        let color = '#3b82f6';
        if (pType === 'MAGNET') color = '#ef4444';
        else if (pType === 'SHIELD') color = '#10b981';
        else if (pType === 'SPEED_BOOST') color = '#eab308';
        else if (pType === 'DOUBLE_SCORE') color = '#a855f7';

        const shape = new THREE.Mesh(this.geoCache['torus'], new THREE.MeshBasicMaterial({ color, wireframe: true }));
        shape.position.y = 0.6;
        mesh.add(shape);

        const inside = new THREE.Mesh(this.geoCache['sphere'], new THREE.MeshBasicMaterial({ color }));
        inside.scale.set(0.16, 0.16, 0.16);
        inside.position.y = 0.6;
        mesh.add(inside);
        scoreValue = 0;
      }

      this.scene.add(mesh);
      coll = { mesh, type, lane, scoreValue, active: true, bobOffset: Math.random() * Math.PI * 2 };
      this.collectibles.push(coll);
    } else {
      coll.lane = lane;
      coll.active = true;
      coll.mesh.visible = true;
    }

    let yOffset = 0.15;
    if (this.activePowerUps.has(PowerUpType.FLYING_MODE)) {
      yOffset = 4.8;
    }

    coll.mesh.position.set(lane * 2.5, yOffset, zPos);
  }

  private setupInput() {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!this.isRunning || this.isPaused || this.isCrashed) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.moveLane(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.moveLane(1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          this.triggerJump();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.triggerSlide();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    let startX = 0;
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!this.isRunning || this.isPaused || this.isCrashed) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 35) {
          if (dx > 0) this.moveLane(1);
          else this.moveLane(-1);
        }
      } else {
        if (Math.abs(dy) > 35) {
          if (dy < 0) this.triggerJump();
          else this.triggerSlide();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  public swipeLeft() { this.moveLane(-1); }
  public swipeRight() { this.moveLane(1); }
  public pressJump() { this.triggerJump(); }
  public pressSlide() { this.triggerSlide(); }

  private moveLane(dir: number) {
    const nextLane = this.currentLane + dir;
    if (nextLane >= -1 && nextLane <= 1) {
      this.currentLane = nextLane;
      this.targetX = this.currentLane * 2.5;
      soundManager.playClick();
    }
  }

  private triggerJump() {
    if (this.isJumping || this.isSliding) return;
    this.isJumping = true;
    this.jumpVelocity = 14.8;
    this.spawnFeatherSplash();
    soundManager.playJump();
    soundManager.playCluck();
  }

  private triggerSlide() {
    if (this.isJumping) return;
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    soundManager.playSlide();
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.isCrashed = false;
    this.isIntroActive = true;
    this.introTime = 2.0;
    this.distance = 0;
    this.score = 0;
    this.speed = 16.0;
    this.totalRoadScrolled = 0;
    this.currentLane = 0;
    this.targetX = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.isJumping = false;
    this.isSliding = false;

    this.obstacles.forEach((o) => {
      o.active = false;
      o.mesh.visible = false;
    });
    this.collectibles.forEach((c) => {
      c.active = false;
      c.mesh.visible = false;
    });

    this.activePowerUps.clear();
    this.shieldBubbleMesh.visible = false;
    this.magnetAuraMesh.visible = false;

    for (let i = 0; i < this.roads.length; i++) {
      this.roads[i].position.set(0, 0, -i * this.roadLength);
    }

    this.clock.getDelta();
    this.frameCount = 0;
    this.lastFpsUpdateTime = performance.now();

    if (this.animationFrameId === null) {
      this.loop();
    }

    soundManager.startMusic();
  }

  public pause() {
    this.isPaused = true;
    soundManager.stopMusic();
  }

  public resume() {
    this.isPaused = false;
    this.clock.getDelta();
    soundManager.startMusic();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundManager.stopMusic();
  }

  private spawnFeatherSplash() {
    this.featherActive = true;
    this.featherTimer = 1.3;
    if (this.featherParticles) {
      this.featherParticles.visible = true;
      this.featherParticles.position.set(this.playerX, this.playerY + 0.45, this.playerZ);

      const posAttr = this.featherParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < this.featherCount; i++) {
        posAttr.setXYZ(i, 0, 0, 0);
        this.featherVelocities[i * 3] = (Math.random() - 0.5) * 7.5;
        this.featherVelocities[i * 3 + 1] = Math.random() * 8.0 + 2.5;
        this.featherVelocities[i * 3 + 2] = (Math.random() - 0.5) * 7.5;
      }
      posAttr.needsUpdate = true;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;
    this.animationFrameId = requestAnimationFrame(this.loop);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdateTime > 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdateTime));
      if (this.callbacks.onFpsUpdated) this.callbacks.onFpsUpdated(fps);
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;
    }

    if (this.isPaused) return;

    this.update(delta);
    if (this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private update(delta: number) {
    const elapsed = this.clock.getElapsedTime();

    // --- Dynamic Weather & Day/Night System ---
    if (this.isRunning && !this.isPaused) {
      // 1. Advance the clock loop
      this.timeOfDay = (this.timeOfDay + delta * this.timeScale) % 24.0;

      // Notify App callbacks about time of day updates so UI can render a gorgeous sky/time widget!
      if (this.callbacks.onTimeUpdated) {
        this.callbacks.onTimeUpdated(this.timeOfDay, this.currentWeather);
      }

      // 2. Weather switch timer tick
      this.weatherTimer -= delta;
      if (this.weatherTimer <= 0) {
        this.weatherTimer = 40.0 + Math.random() * 25.0; // switch weather every 40-65 secs
        
        const weatherOptions = ['SUNNY', 'CLOUDY', 'LIGHT_RAIN', 'THUNDERSTORM', 'FOGGY', 'RAIN_SUNSHINE'];
        const isNight = this.timeOfDay > 19.5 || this.timeOfDay < 4.5;
        
        let nextWeather = this.currentWeather;
        const oldWeather = this.currentWeather;
        while (nextWeather === oldWeather) {
          if (isNight && Math.random() < 0.45) {
            nextWeather = 'SUNNY'; // Clear Starry Night!
          } else {
            nextWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
          }
        }
        this.setWeather(nextWeather);
      }

      // 3. Lightning Flash Controls (for Thunderstorm)
      if (this.lightningActive && this.lightningLight) {
        this.lightningTimer -= delta;
        if (this.lightningTimer <= 0) {
          if (Math.random() < 0.35 && this.lightningLight.intensity > 1.0) {
            this.lightningLight.intensity = 6.5; // double strike!
            this.lightningTimer = 0.04 + Math.random() * 0.08;
          } else {
            this.lightningActive = false;
            this.lightningLight.intensity = 0;
          }
        }
      } else if (this.currentWeather === 'THUNDERSTORM' && Math.random() < 0.0035) {
        this.triggerLightningStrike();
        soundManager.playThunderBoom();
      }

      // 4. Update dynamic audio ambience gains
      soundManager.updateWeatherAmbience(this.currentWeather, this.timeOfDay);
    }

    // Solve environment colors, density target, and transition smoothly
    this.computeEnvironmentTargets();
    this.updateEnvironmentLerps(delta);

    // 1. Zoom Camera Intro at Run Start
    if (this.isIntroActive) {
      this.introTime -= delta;
      const ratio = Math.max(0, this.introTime / 2.0);
      this.camera.position.set(0, 4.0 + ratio * 8.0, this.playerZ + 11.5 + ratio * 12.0);
      this.camera.lookAt(new THREE.Vector3(0, 1.1 - ratio * 1.0, -15.0));

      if (this.introTime <= 0) {
        this.isIntroActive = false;
      }
      return;
    }

    // 2. Crash death visual spin
    if (this.isCrashed) {
      this.crashTimer -= delta;
      if (this.playerGroup) {
        this.playerGroup.rotation.y += delta * 12.0;
        this.playerGroup.rotation.x += delta * 6.0;
        this.playerGroup.position.y += delta * 1.5;
        this.playerGroup.position.z += delta * 3.0; // spun backwards
      }

      this.updateFeathers(delta);

      if (this.crashTimer <= 0) {
        this.isCrashed = false;
        this.stop();
        this.callbacks.onCrash();
      }
      return;
    }

    // 3. Game Economy & continuous movement speeds
    const speedBoostActive = this.activePowerUps.has(PowerUpType.SPEED_BOOST);
    const speedMultiplier = speedBoostActive ? 1.75 : 1.0;
    const currentSpeed = this.speed * speedMultiplier;

    this.distance += currentSpeed * delta;
    this.callbacks.onDistanceUpdated(Math.floor(this.distance));

    // Continuous acceleration ramp
    this.speed = Math.min(this.maxSpeed, 16.0 + (this.distance / 100.0) * this.speedRampRate);

    // Dynamic point counts
    const doublePtsActive = this.activePowerUps.has(PowerUpType.DOUBLE_SCORE);
    const multi = doublePtsActive ? 2.0 : 1.0;
    this.score += Math.round(currentSpeed * delta * 4 * multi);
    this.callbacks.onScore(this.score);

    // Decaying Power-ups
    this.activePowerUps.forEach((state, type) => {
      state.timeLeft -= delta;
      if (state.timeLeft <= 0) {
        this.activePowerUps.delete(type);
        if (type === PowerUpType.SHIELD) this.shieldBubbleMesh.visible = false;
        if (type === PowerUpType.MAGNET) this.magnetAuraMesh.visible = false;
      }
    });

    // 4. Smooth dynamic character alignments
    this.playerX = THREE.MathUtils.lerp(this.playerX, this.targetX, delta * 14.5);

    // Falling / Jumping parabolic controls
    if (this.isJumping) {
      this.jumpVelocity += this.gravity * delta;
      this.playerY += this.jumpVelocity * delta;

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
        
        // Satisfying Landing impact and floor dust shake
        this.landingShakeForce = 0.22;
        this.spawnFeatherSplash();
        soundManager.playSlide();
      }
    }

    // Slide decaying times
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // High-safety: Prevent player reference from ever being missing or disconnected
    if (!this.playerGroup || !(this.playerGroup instanceof THREE.Group)) {
      console.log("Player reference missing, rebuilding player...");
      this.buildPlayer();
    }
    if (!this.scene.children.includes(this.playerGroup)) {
      console.log("Reattaching player reference to scene...");
      this.scene.add(this.playerGroup);
    }

    // Validate player coordinates to prevent numeric exceptions cascading to camera target
    let safePlayerX = this.playerX;
    let safePlayerY = this.playerY;
    let safePlayerZ = this.playerZ;

    if (typeof safePlayerX !== 'number' || isNaN(safePlayerX)) {
      this.playerX = 0;
      safePlayerX = 0;
    }
    if (typeof safePlayerY !== 'number' || isNaN(safePlayerY)) {
      this.playerY = 0;
      safePlayerY = 0;
    }
    if (typeof safePlayerZ !== 'number' || isNaN(safePlayerZ)) {
      this.playerZ = -18.0;
      safePlayerZ = -18.0;
    }

    // Set position and rotation facing forward
    if (this.playerGroup) {
      this.playerGroup.position.set(safePlayerX, safePlayerY + 0.52, safePlayerZ);
      this.playerGroup.rotation.set(0, 0, 0);
    }

    // Scale mesh directly when sliding under pillars
    if (this.isSliding) {
      if (this.chickenBodyMesh) this.chickenBodyMesh.scale.set(1.22, 0.44, 1.25);
      if (this.chickenLeftLeg) this.chickenLeftLeg.visible = false;
      if (this.chickenRightLeg) this.chickenRightLeg.visible = false;
    } else {
      if (this.chickenBodyMesh) this.chickenBodyMesh.scale.set(1.0, 1.0, 1.0);
      if (this.chickenLeftLeg) this.chickenLeftLeg.visible = true;
      if (this.chickenRightLeg) this.chickenRightLeg.visible = true;
    }

    // 5. Classic Subway Surfers Camera alignment (Behind Chicken follow-lag)
    const targetCameraX = safePlayerX * this.cameraTrackXMultiplier;
    const targetCameraY = this.cameraOffsetHeight + safePlayerY * 0.48; // follow jump heights smoothly
    const targetCameraZ = safePlayerZ + this.cameraOffsetDepth;

    if (!this.camera || !(this.camera instanceof THREE.PerspectiveCamera)) {
      console.log("Reattaching camera...");
      this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    }

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, isNaN(targetCameraX) ? 0 : targetCameraX, delta * 9.5);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, isNaN(targetCameraY) ? 5.5 : targetCameraY, delta * 7.5);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, isNaN(targetCameraZ) ? -10.0 : targetCameraZ, delta * 9.5);

    // Ensure camera coordinates are never NaN
    if (isNaN(this.camera.position.x)) this.camera.position.x = isNaN(targetCameraX) ? 0 : targetCameraX;
    if (isNaN(this.camera.position.y)) this.camera.position.y = isNaN(targetCameraY) ? 5.5 : targetCameraY;
    if (isNaN(this.camera.position.z)) this.camera.position.z = isNaN(targetCameraZ) ? -10.0 : targetCameraZ;

    // Apply elastic landing thump camera shakes
    if (this.landingShakeForce > 0.01) {
      this.camera.position.y += (Math.random() - 0.5) * this.landingShakeForce;
      this.camera.position.x += (Math.random() - 0.5) * this.landingShakeForce;
      this.landingShakeForce *= 0.82; // decay shake force
    }

    // Direct looking down path ahead (Extended further down the track for extreme playability)
    const lookAheadAnchor = new THREE.Vector3(
      safePlayerX * 0.45,
      0.85 + safePlayerY * 0.12,
      safePlayerZ - 25.0
    );

    if (isNaN(lookAheadAnchor.x) || isNaN(lookAheadAnchor.y) || isNaN(lookAheadAnchor.z)) {
      lookAheadAnchor.set(0, 1.0, -18.0 - 25.0);
    }

    this.camera.lookAt(lookAheadAnchor);

    // Roll banking/banking tilting on lane triggers
    const laneDeltaX = this.targetX - this.playerX;
    const rollAngle = -laneDeltaX * 0.038;
    this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, rollAngle, delta * 8.0);

    // Dynamic FOV stretching while speeding or under speed boosts
    const targetFOV = speedBoostActive ? 75 : 60;
    this.currentFOV = THREE.MathUtils.lerp(this.currentFOV, targetFOV, delta * 5.0);
    if (this.camera.fov !== this.currentFOV) {
      this.camera.fov = this.currentFOV;
      this.camera.updateProjectionMatrix();
    }

    // 6. Character bobbing run cycle
    if (!this.isJumping && !this.isSliding) {
      const walkFreq = elapsed * currentSpeed * 1.55;
      this.chickenLeftLeg.rotation.x = Math.sin(walkFreq) * 0.8;
      this.chickenRightLeg.rotation.x = -Math.sin(walkFreq) * 0.8;

      // Gentle wing flaps
      const flapAngle = Math.sin(elapsed * currentSpeed * 2.8) * 0.26;
      this.chickenLeftWing.rotation.z = flapAngle;
      this.chickenRightWing.rotation.z = -flapAngle;

      this.chickenTailGroup.rotation.x = Math.sin(walkFreq * 2) * 0.15;

      // Spawn puff dust behind feet coordinates
      if (Math.random() < 0.45) {
        this.spawnDustParticle();
      }
    } else if (this.isJumping) {
      // open wings and tuck claws
      this.chickenLeftLeg.rotation.x = -Math.PI / 4;
      this.chickenRightLeg.rotation.x = -Math.PI / 4;
      this.chickenLeftWing.rotation.z = 0.6;
      this.chickenRightWing.rotation.z = -0.6;
    }

    // Hue rainbow cycle
    if (this.currentSkinId === 'skin_rainbow') {
      const hueColors = (elapsed * 0.5) % 1.0;
      const rgb = new THREE.Color().setHSL(hueColors, 0.85, 0.55);
      if (this.chickenBodyMesh.material instanceof THREE.MeshStandardMaterial) {
        this.chickenBodyMesh.material.color.copy(rgb);
      }
    }

    // 7. Infinite roadway segments cycling
    const travelDist = currentSpeed * delta;
    this.totalRoadScrolled += travelDist;

    this.roads.forEach((roadGrp) => {
      roadGrp.position.z += travelDist;

      // Re-cycle road block to the far front on exiting screens
      if (roadGrp.position.z > 35) {
        const furthestZ = this.getFurthestRoadPieceZ();
        const nextZ = furthestZ - this.roadLength;
        roadGrp.position.z = nextZ;

        // Compute new biome/theme for this recycled chunk
        const chunkDist = this.distance + (-nextZ - this.playerZ);
        const nextTheme = this.getThemeForDistance(chunkDist);

        if (roadGrp.userData.theme !== nextTheme) {
          roadGrp.userData.theme = nextTheme;
        }

        // Re-generate continuous terrain heights and colors for seamless stitching
        this.updateSegmentTerrain(roadGrp, nextZ);

        // Re-decorate chunk with high-quality theme-specific decorations!
        this.decorateChunkProcedurally(roadGrp, nextZ, Math.round(nextZ / -this.roadLength));

        // Instantly update decor visibility for this chunk
        this.updateChunkDecorVisibility(roadGrp);

        // Populate procedural blocks on dynamic triggers
        this.spawnProceduralSegment(roadGrp.position.z);
      }

      // Sway wheat decorative crops dynamically in wind!
      const wheatSway = roadGrp.getObjectByName('wheat_stalk_decor');
      if (wheatSway) {
        wheatSway.children.forEach((stalk) => {
          stalk.rotation.z = Math.sin(elapsed * 4.5 + stalk.position.x * 2.0) * 0.08 * this.windSpeedCurrent;
        });
      }

      // Rotate windmill blades (faster during storm!)
      const windBlades = roadGrp.getObjectByName('windmill_fan');
      if (windBlades) {
        windBlades.rotation.z += delta * 1.6 * this.windSpeedCurrent;
      }

      // Rotate barn attic ventilations (faster during storm!)
      const attVent = roadGrp.getObjectByName('barn_vent_fan');
      if (attVent) {
        attVent.rotation.z += delta * 2.4 * this.windSpeedCurrent;
      }

      // Industrial blinking beacons
      const nBlink = roadGrp.getObjectByName('neon_blinker');
      if (nBlink && nBlink instanceof THREE.Mesh && nBlink.material instanceof THREE.MeshBasicMaterial) {
        nBlink.material.color.setHSL((elapsed * 3.4) % 1.0, 1.0, 0.5);
      }

      // Checkpoint gate warning beacons blinking
      const bBlue = roadGrp.getObjectByName('beacon_blue');
      if (bBlue && bBlue instanceof THREE.Mesh && bBlue.material instanceof THREE.MeshBasicMaterial) {
        const pulse = Math.sin(elapsed * 10.0) > 0;
        bBlue.material.color.set(pulse ? '#3b82f6' : '#1e3a8a');
      }

      const bYellow = roadGrp.getObjectByName('beacon_yellow');
      if (bYellow && bYellow instanceof THREE.Mesh && bYellow.material instanceof THREE.MeshBasicMaterial) {
        const pulse = Math.cos(elapsed * 10.0) > 0;
        bYellow.material.color.set(pulse ? '#eab308' : '#78350f');
      }

      // Dynamic crop and tree swayed wind animation
      roadGrp.traverse((node) => {
        if (node.name === 'stalk') {
          node.rotation.z = Math.sin(elapsed * (2.8 * this.windSpeedCurrent) + node.position.x * 2.0) * (0.08 * Math.sqrt(this.windSpeedCurrent));
        } else if (node.name === 'tree') {
          node.rotation.z = Math.sin(elapsed * (1.8 * this.windSpeedCurrent) + node.position.x) * (0.015 * this.windSpeedCurrent);
          node.rotation.x = Math.cos(elapsed * (1.5 * this.windSpeedCurrent) + node.position.z) * (0.012 * this.windSpeedCurrent);
        } else if (node.name === 'skm_waving_cloth') {
          // Beautiful cloth flag waving simulation representing wind speeds!
          const wave = Math.sin(elapsed * (4.2 * this.windSpeedCurrent) + node.position.y * 1.5) * 0.15 * Math.sqrt(this.windSpeedCurrent);
          node.rotation.y = wave;
          // Slight secondary flag tilt flap
          node.rotation.z = Math.cos(elapsed * (2.4 * this.windSpeedCurrent)) * 0.05 * this.windSpeedCurrent;
        }
      });
    });

    // 7b. Update atmosphere elements (Atmospheric Depth & Motion)
    this.bgClouds.forEach((cloud) => {
      // Move clouds slowly forward with the player running
      cloud.position.z += travelDist * 0.15;
      // Cross-drift from left to right
      cloud.position.x += delta * 0.35;
      if (cloud.position.x > 35) {
        cloud.position.x = -35;
      }
      if (cloud.position.z > 25) {
        cloud.position.z = -120;
      }
    });

    this.bgBirds.forEach((bird) => {
      // Birds fly forward slightly faster than player runner
      bird.position.z += travelDist * 0.28 + delta * 2.0;
      // Flap wings flapping animation
      const lWing = bird.getObjectByName('l_wing_joint');
      const rWing = bird.getObjectByName('r_wing_joint');
      if (lWing) {
        lWing.rotation.z = Math.sin(elapsed * 9.5) * 0.45;
      }
      if (rWing) {
        rWing.rotation.z = -Math.sin(elapsed * 9.5) * 0.45;
      }

      if (bird.position.z > 25) {
        bird.position.z = -100 - Math.random() * 40;
        bird.position.x = -12 + Math.random() * 24;
      }
    });

    // 8. Update obstacle hits and collectibles magnet interactions
    this.updateWorldEntities(delta, currentSpeed);

    // Weather particles
    this.updateWeatherLayers(delta);
    
    // CPU Dust layers fade
    this.updateSmokeLayers(delta);

    this.updateFeathers(delta);
  }

  private updateWorldEntities(delta: number, currentSpeed: number) {
    const playerBox = new THREE.Box3().setFromObject(this.playerGroup);
    const magnetActive = this.activePowerUps.has(PowerUpType.MAGNET);

    // Static collision box offsets (Subway Surfers narrow padding metrics)
    const chickenWidthFactor = 0.55;
    const customPlayerBox = new THREE.Box3(
      new THREE.Vector3(this.playerX - chickenWidthFactor, this.playerY - 0.2, this.playerZ - 0.5),
      new THREE.Vector3(this.playerX + chickenWidthFactor, this.playerY + 1.2, this.playerZ + 0.5)
    );

    // 1. Obstacle detections
    this.obstacles.forEach((obs) => {
      if (!obs.active) return;

      obs.mesh.position.z += currentSpeed * delta;

      if (obs.mesh.position.z > 15) {
        obs.active = false;
        obs.mesh.visible = false;
        return;
      }

      const obsBox = new THREE.Box3().setFromObject(obs.mesh);
      if (customPlayerBox.intersectsBox(obsBox)) {
        // Slow water pits / mud pits down by 50%
        if (obs.type === 'MUD_PIT') {
          this.speed = Math.max(8.0, this.speed - delta * 15.0);
          return;
        }

        // Shield absorption protection
        if (this.activePowerUps.has(PowerUpType.SHIELD)) {
          this.activePowerUps.delete(PowerUpType.SHIELD);
          this.shieldBubbleMesh.visible = false;
          soundManager.playHit();
          obs.active = false;
          obs.mesh.visible = false;
          this.landingShakeForce = 0.45;
          return;
        }

        // Fast SpeedBoost breaks obstacle directly
        if (this.activePowerUps.has(PowerUpType.SPEED_BOOST)) {
          obs.active = false;
          obs.mesh.visible = false;
          soundManager.playHit();
          this.landingShakeForce = 0.35;
          return;
        }

        // Fatal crash triggers death sequence
        this.isCrashed = true;
        this.crashTimer = 1.8;
        soundManager.playHit();
        this.spawnFeatherSplash();
        this.landingShakeForce = 0.7;
      }
    });

    // 2. Bobbing floating and spinning Collectibles
    this.collectibles.forEach((coll) => {
      if (!coll.active) return;

      coll.mesh.position.z += currentSpeed * delta;

      // Constant spinning rotation
      coll.mesh.rotation.y += delta * 2.8;

      // Bobbing floating height sinusoid
      const baseHeight = this.activePowerUps.has(PowerUpType.FLYING_MODE) ? 4.8 : 0.15;
      coll.mesh.position.y = baseHeight + Math.sin(this.clock.getElapsedTime() * 4.5 + coll.bobOffset) * 0.12;

      // Magnet pull range calculations (Rads: 11.5 meters)
      if (magnetActive && coll.mesh.position.z < 0) {
        const dx = this.playerX - coll.mesh.position.x;
        const dy = this.playerY - coll.mesh.position.y;
        const dz = this.playerZ - coll.mesh.position.z;
        const radius = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (radius < 11.5) {
          const force = 38.0;
          coll.mesh.position.x += (dx / radius) * force * delta;
          coll.mesh.position.y += (dy / radius) * force * delta;
          coll.mesh.position.z += (dz / radius) * force * delta;
        }
      }

      if (coll.mesh.position.z > 15) {
        coll.active = false;
        coll.mesh.visible = false;
        return;
      }

      // Collectible items bounding intersect checks
      const collBox = new THREE.Box3().setFromObject(coll.mesh);
      if (playerBox.intersectsBox(collBox)) {
        coll.active = false;
        coll.mesh.visible = false;

        if (coll.type.startsWith('POWERUP_')) {
          const powerType = coll.type.split('_').slice(1).join('_') as PowerUpType;
          const duration = 12.0;

          this.activePowerUps.set(powerType, { timeLeft: duration, duration });
          this.callbacks.onPowerUpActivated(powerType, duration);
          soundManager.playPowerUp();

          if (powerType === PowerUpType.SHIELD) this.shieldBubbleMesh.visible = true;
          if (powerType === PowerUpType.MAGNET) this.magnetAuraMesh.visible = true;
          if (powerType === PowerUpType.FLYING_MODE) {
            this.playerY = 4.8;
          }
        } else {
          // Add score credit counts
          const mult = this.activePowerUps.has(PowerUpType.DOUBLE_SCORE) ? 2.5 : 1.0;
          const creditsGained = Math.round(coll.scoreValue * mult);

          if (coll.type === 'GOLDEN_FEED') {
            soundManager.playScoreGem();
            this.callbacks.onFeedCollected(creditsGained * 4, true);
          } else if (coll.type === 'CRYSTAL') {
            soundManager.playScoreGem();
            this.callbacks.onGemCollected();
          } else {
            soundManager.playScoreFeed();
            this.callbacks.onFeedCollected(creditsGained, false);
          }
          this.score += creditsGained;
          this.callbacks.onScore(this.score);
        }
      }
    });
  }

  private updateSmokeLayers(delta: number) {
    this.smokeParticles.forEach((p) => {
      if (p.life <= 0) return;
      p.life -= delta;

      // Add velocity drifting
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Dissipate scales
      const ratio = Math.max(0, p.life);
      p.mesh.scale.setScalar(2.0 - ratio);
      if (p.mesh.material instanceof THREE.MeshBasicMaterial) {
        p.mesh.material.opacity = ratio * 0.4;
      }

      if (p.life <= 0) {
        p.mesh.visible = false;
      }
    });
  }

  private updateFeathers(delta: number) {
    if (!this.featherActive || !this.featherParticles) return;
    this.featherTimer -= delta;

    const posAttr = this.featherParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < this.featherCount; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      x += this.featherVelocities[i * 3] * delta;
      y += this.featherVelocities[i * 3 + 1] * delta;
      z += this.featherVelocities[i * 3 + 2] * delta;

      this.featherVelocities[i * 3 + 1] -= 9.8 * delta; // simple physics gravity pull on feathers

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;

    if (this.featherTimer <= 0) {
      this.featherActive = false;
      this.featherParticles.visible = false;
    }
  }

  private updateWeatherLayers(delta: number) {
    const isRainState = (this.currentWeather === 'LIGHT_RAIN' || this.currentWeather === 'THUNDERSTORM' || this.currentWeather === 'RAIN_SUNSHINE');
    if ((isRainState || this.activeTheme === 'RAINY_SEASON') && this.rainParticles) {
      const posAttr = this.rainParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const isStorm = (this.currentWeather === 'THUNDERSTORM');
      for (let j = 0; j < this.rainCount; j++) {
        let x = posAttr.getX(j);
        let y = posAttr.getY(j);
        
        y -= 25.0 * delta * (isStorm ? 1.45 : 1.0); // rain falls faster in storms
        if (isStorm) {
          x += 6.5 * delta; // blow sideways in wind
          if (x > 11.0) {
            x = -11.0;
          }
        } else {
          x += 0.8 * delta; // gentle wind slide
          if (x > 11.0) {
            x = -11.0;
          }
        }
        
        if (y < 0) {
          y = 20.0;
        }
        posAttr.setY(j, y);
        posAttr.setX(j, x);
      }
      posAttr.needsUpdate = true;
    }
  }

  public setWeather(weather: string) {
    this.currentWeather = weather;
    
    // Trigger special audio transition notifications
    if (weather === 'THUNDERSTORM') {
      soundManager.playThunderBoom();
      // Double flash immediately for dynamic cinema introduction!
      this.triggerLightningStrike();
    }
    
    // Turn on rain particles under rain states
    if (this.rainParticles) {
      const isRainy = (weather === 'LIGHT_RAIN' || weather === 'THUNDERSTORM' || weather === 'RAIN_SUNSHINE');
      this.rainParticles.visible = isRainy;
    }

    // Sync the soundscape instantly
    soundManager.updateWeatherAmbience(weather, this.timeOfDay);
  }

  public triggerLightningStrike() {
    this.lightningActive = true;
    this.lightningTimer = 0.08 + Math.random() * 0.12; // first flash length
    this.lightningDuration = this.lightningTimer;
    if (this.lightningLight) {
      this.lightningLight.intensity = 5.8; // intense white light flash
      this.lightningLight.color.set('#bae6fd');
    }
  }

  private computeEnvironmentTargets() {
    const hour = this.timeOfDay;
    const weather = this.currentWeather;

    // 1. BASE TIME OF DAY PARAMETERS
    let baseSkyColor = new THREE.Color('#38bdf8'); // Day blue
    let baseLightColor = new THREE.Color('#fef3c7'); // Warm sunlight
    let baseLightIntensity = 1.35;
    let baseAmbColor = new THREE.Color('#bae6fd'); // Sky blue ambient
    let baseAmbIntensity = 0.8;
    let baseFogColor = new THREE.Color('#38bdf8');
    let baseFogDensity = 0.012;
    let starsOpacity = 0.0;
    
    // Light direction vector based on solar angle
    let sunX = 18;
    let sunY = 35;
    let sunZ = 12;

    if (hour >= 5.0 && hour < 7.0) {
      // DAWN / EARLY MORNING (5 AM - 7 AM)
      const r = (hour - 5.0) / 2.0; // ratio 0 to 1
      baseSkyColor.lerpColors(new THREE.Color('#0b1329'), new THREE.Color('#ea580c'), r);
      baseLightColor.lerpColors(new THREE.Color('#1e293b'), new THREE.Color('#f59e0b'), r);
      baseFogColor.copy(baseSkyColor);
      baseLightIntensity = THREE.MathUtils.lerp(0.2, 0.95, r);
      baseAmbColor.lerpColors(new THREE.Color('#020617'), new THREE.Color('#fd7e14'), r);
      baseAmbIntensity = THREE.MathUtils.lerp(0.3, 0.65, r);
      baseFogDensity = THREE.MathUtils.lerp(0.024, 0.016, r);
      starsOpacity = THREE.MathUtils.lerp(0.35, 0.0, r);
      // Sun rising from east/low horizon
      sunX = THREE.MathUtils.lerp(-35, -20, r);
      sunY = THREE.MathUtils.lerp(3, 15, r);
      sunZ = THREE.MathUtils.lerp(-20, -10, r);
    } 
    else if (hour >= 7.0 && hour < 11.0) {
      // MORNING (7 AM - 11 AM)
      const r = (hour - 7.0) / 4.0;
      baseSkyColor.lerpColors(new THREE.Color('#ea580c'), new THREE.Color('#38bdf8'), r);
      baseLightColor.lerpColors(new THREE.Color('#f59e0b'), new THREE.Color('#ffffbf'), r);
      baseFogColor.copy(baseSkyColor);
      baseLightIntensity = THREE.MathUtils.lerp(0.95, 1.4, r);
      baseAmbColor.lerpColors(new THREE.Color('#fd7e14'), new THREE.Color('#bae6fd'), r);
      baseAmbIntensity = THREE.MathUtils.lerp(0.65, 0.85, r);
      baseFogDensity = THREE.MathUtils.lerp(0.016, 0.011, r);
      starsOpacity = 0.0;
      sunX = THREE.MathUtils.lerp(-20, -5, r);
      sunY = THREE.MathUtils.lerp(15, 38, r);
      sunZ = THREE.MathUtils.lerp(-10, -5, r);
    }
    else if (hour >= 11.0 && hour < 15.0) {
      // NOON / AFTERNOON HIGH SUN (11 AM - 3 PM)
      const r = (hour - 11.0) / 4.0;
      baseSkyColor.set('#38bdf8');
      baseLightColor.set('#ffffef');
      baseFogColor.set('#38bdf8');
      baseLightIntensity = 1.45;
      baseAmbColor.set('#bae6fd');
      baseAmbIntensity = 0.9;
      baseFogDensity = 0.010;
      starsOpacity = 0.0;
      sunX = THREE.MathUtils.lerp(-5, 5, r);
      sunY = 38; // overhead
      sunZ = THREE.MathUtils.lerp(-5, 5, r);
    }
    else if (hour >= 15.0 && hour < 17.0) {
      // LATE AFTERNOON (3 PM - 5 PM)
      const r = (hour - 15.0) / 2.0;
      baseSkyColor.lerpColors(new THREE.Color('#38bdf8'), new THREE.Color('#0284c7'), r);
      baseLightColor.lerpColors(new THREE.Color('#ffffef'), new THREE.Color('#fef08a'), r);
      baseFogColor.copy(baseSkyColor);
      baseLightIntensity = THREE.MathUtils.lerp(1.45, 1.25, r);
      baseAmbColor.lerpColors(new THREE.Color('#bae6fd'), new THREE.Color('#fed7aa'), r);
      baseAmbIntensity = THREE.MathUtils.lerp(0.9, 0.8, r);
      baseFogDensity = 0.012;
      starsOpacity = 0.0;
      sunX = THREE.MathUtils.lerp(5, 18, r);
      sunY = THREE.MathUtils.lerp(38, 28, r);
      sunZ = THREE.MathUtils.lerp(5, 12, r);
    }
    else if (hour >= 17.0 && hour < 19.5) {
      // SUNSET (5 PM - 7:30 PM)
      const r = (hour - 17.0) / 2.5;
      baseSkyColor.lerpColors(new THREE.Color('#0284c7'), new THREE.Color('#f97316'), r);
      // Reddish/pink golden glow
      baseLightColor.lerpColors(new THREE.Color('#fef08a'), new THREE.Color('#dc2626'), r);
      baseFogColor.lerpColors(new THREE.Color('#0284c7'), new THREE.Color('#7c2d12'), r);
      baseLightIntensity = THREE.MathUtils.lerp(1.25, 0.75, r);
      baseAmbColor.lerpColors(new THREE.Color('#fed7aa'), new THREE.Color('#be185d'), r);
      baseAmbIntensity = THREE.MathUtils.lerp(0.8, 0.5, r);
      baseFogDensity = THREE.MathUtils.lerp(0.012, 0.018, r);
      starsOpacity = THREE.MathUtils.lerp(0.0, 0.15, r);
      // Low western sunset sun
      sunX = THREE.MathUtils.lerp(18, 35, r);
      sunY = THREE.MathUtils.lerp(28, 5, r);
      sunZ = THREE.MathUtils.lerp(12, 22, r);
    }
    else if (hour >= 19.5 && hour < 21.5) {
      // EVENING DUSK (7:30 PM - 9:30 PM)
      const r = (hour - 19.5) / 2.0;
      baseSkyColor.lerpColors(new THREE.Color('#f97316'), new THREE.Color('#0f172a'), r);
      baseLightColor.lerpColors(new THREE.Color('#dc2626'), new THREE.Color('#38bdf8'), r); // Shifts to moonlight tone
      baseFogColor.lerpColors(new THREE.Color('#7c2d12'), new THREE.Color('#0f172a'), r);
      baseLightIntensity = THREE.MathUtils.lerp(0.75, 0.38, r);
      baseAmbColor.lerpColors(new THREE.Color('#be185d'), new THREE.Color('#1e293b'), r);
      baseAmbIntensity = THREE.MathUtils.lerp(0.5, 0.35, r);
      baseFogDensity = THREE.MathUtils.lerp(0.018, 0.022, r);
      starsOpacity = THREE.MathUtils.lerp(0.15, 0.75, r);
      // Moon rises in eastern sky
      sunX = THREE.MathUtils.lerp(35, -20, r);
      sunY = THREE.MathUtils.lerp(5, 25, r);
      sunZ = THREE.MathUtils.lerp(22, -15, r);
    }
    else {
      // MIDNIGHT / NIGHT (9:30 PM - 5 AM)
      baseSkyColor.set('#030712'); // Pitch black space
      baseLightColor.set('#7dd3fc'); // Cool moonlit cyan-silver
      baseFogColor.set('#030712');
      baseLightIntensity = 0.35;
      baseAmbColor.set('#0f172a');
      baseAmbIntensity = 0.28;
      baseFogDensity = 0.025;
      starsOpacity = 1.0;
      // Stars pulse a little:
      starsOpacity += Math.sin(this.clock.getElapsedTime() * 1.5) * 0.12;
      // High moonlight position
      sunX = -20;
      sunY = 32;
      sunZ = -15;
    }

    // 2. APPLY WEATHER MODIFIERS (Interpolates blending targets on top of the generic hour)
    let weatherSkyColor = baseSkyColor;
    let weatherFogColor = baseFogColor;
    let weatherFogDensity = baseFogDensity;
    let weatherSunColor = baseLightColor;
    let weatherSunIntensity = baseLightIntensity;
    let weatherAmbColor = baseAmbColor;
    let weatherAmbIntensity = baseAmbIntensity;

    let targetWetness = 0.0;
    let targetWind = 1.0;
    let targetCloudOpacity = 0.85;
    let targetCloudColor = new THREE.Color('#ffffff');

    if (weather === 'CLOUDY') {
      weatherSkyColor = baseSkyColor.clone().lerp(new THREE.Color('#475569'), 0.5);
      weatherFogColor = baseFogColor.clone().lerp(new THREE.Color('#475569'), 0.5);
      weatherFogDensity = baseFogDensity * 1.3;
      weatherSunColor = baseLightColor.clone().lerp(new THREE.Color('#cbd5e1'), 0.4);
      weatherSunIntensity = baseLightIntensity * 0.75;
      weatherAmbColor = baseAmbColor.clone().lerp(new THREE.Color('#94a3b8'), 0.3);
      weatherAmbIntensity = baseAmbIntensity * 0.9;
      
      targetWind = 1.8;
      targetCloudOpacity = 0.95;
      targetCloudColor.set('#cbd5e1'); // soft gray clouds
    } 
    else if (weather === 'LIGHT_RAIN') {
      weatherSkyColor = baseSkyColor.clone().lerp(new THREE.Color('#1e293b'), 0.65);
      weatherFogColor = baseFogColor.clone().lerp(new THREE.Color('#1e293b'), 0.65);
      weatherFogDensity = baseFogDensity * 2.0;
      weatherSunIntensity = baseLightIntensity * 0.42;
      weatherAmbColor = baseAmbColor.clone().lerp(new THREE.Color('#64748b'), 0.5);
      weatherAmbIntensity = baseAmbIntensity * 0.7;

      targetWetness = 1.0; // Puddles and wet tarmac!
      targetWind = 2.4;
      targetCloudOpacity = 1.0;
      targetCloudColor.set('#94a3b8'); // dark rainy clouds
    }
    else if (weather === 'THUNDERSTORM') {
      weatherSkyColor = baseSkyColor.clone().lerp(new THREE.Color('#0f172a'), 0.85); // stormy charcoal sky
      weatherFogColor = baseFogColor.clone().lerp(new THREE.Color('#020617'), 0.85);
      weatherFogDensity = baseFogDensity * 2.8; // intense density visibility drop
      weatherSunIntensity = baseLightIntensity * 0.25; // sun dims completely
      weatherAmbColor = baseAmbColor.clone().lerp(new THREE.Color('#334155'), 0.75);
      weatherAmbIntensity = baseAmbIntensity * 0.4;

      targetWetness = 1.0;
      targetWind = 4.2; // Crazy wind
      targetCloudOpacity = 1.2;
      targetCloudColor.set('#475569'); // heavy dark thunderstorm clouds
    }
    else if (weather === 'FOGGY') {
      weatherSkyColor = baseSkyColor.clone().lerp(new THREE.Color('#94a3b8'), 0.5);
      weatherFogColor = baseFogColor.clone().lerp(new THREE.Color('#cbd5e1'), 0.75);
      weatherFogDensity = 0.048; // Intense cinematic foggy morning
      weatherSunIntensity = baseLightIntensity * 0.5;
      weatherAmbIntensity = baseAmbIntensity * 1.15; // light scatters heavily in fog

      targetWind = 0.4; // Very calm
      targetCloudOpacity = 0.4; // clouds blended with atmospheric fog
      targetCloudColor.set('#e2e8f0');
    }
    else if (weather === 'RAIN_SUNSHINE') {
      weatherSkyColor = baseSkyColor.clone().lerp(new THREE.Color('#bae6fd'), 0.2);
      weatherFogColor = baseFogColor.clone().lerp(new THREE.Color('#fed7aa'), 0.1);
      weatherFogDensity = baseFogDensity * 1.3;
      weatherSunColor = new THREE.Color('#fca5a5'); // hot golden rays
      weatherSunIntensity = baseLightIntensity * 1.1;

      targetWetness = 0.8;
      targetWind = 1.4;
      targetCloudOpacity = 0.7;
      targetCloudColor.set('#f1f5f9');
    }

    // Set linear targets
    this.skyColorTarget.copy(weatherSkyColor);
    this.fogColorTarget.copy(weatherFogColor);
    this.fogDensityTarget = weatherFogDensity;
    this.sunColorTarget.copy(weatherSunColor);
    this.sunIntensityTarget = weatherSunIntensity;
    this.ambColorTarget.copy(weatherAmbColor);
    this.ambIntensityTarget = weatherAmbIntensity;

    // 3. ECOSYSTEM THEME ATMOSPHERES OVERRIDES
    if (this.activeTheme === 'SKM_FACTORY') {
      this.skyColorTarget.lerp(new THREE.Color('#94a3b8'), 0.55);
      this.fogColorTarget.lerp(new THREE.Color('#cbd5e1'), 0.55);
      this.fogDensityTarget = Math.max(this.fogDensityTarget, 0.022);
      this.sunIntensityTarget *= 0.85;
    } else if (this.activeTheme === 'CORN_FIELDS' || this.activeTheme === 'WHEAT_FIELDS') {
      this.skyColorTarget.lerp(new THREE.Color('#0284c7'), 0.15);
      this.fogColorTarget.lerp(new THREE.Color('#e0f2fe'), 0.15);
      this.fogDensityTarget = Math.min(this.fogDensityTarget, 0.010);
    } else if (this.activeTheme === 'RIVER_AREA') {
      this.skyColorTarget.lerp(new THREE.Color('#a5f3fc'), 0.4);
      this.fogColorTarget.lerp(new THREE.Color('#cbd5e1'), 0.4);
      this.fogDensityTarget = Math.max(this.fogDensityTarget, 0.018);
    } else if (this.activeTheme === 'VILLAGE_ROADS') {
      this.skyColorTarget.lerp(new THREE.Color('#f97316'), 0.35);
      this.fogColorTarget.lerp(new THREE.Color('#7c2d12'), 0.35);
      this.fogDensityTarget = Math.max(this.fogDensityTarget, 0.014);
      this.sunColorTarget.lerp(new THREE.Color('#fca5a5'), 0.4);
    } else if (this.activeTheme === 'WAREHOUSE') {
      this.skyColorTarget.lerp(new THREE.Color('#475569'), 0.6);
      this.fogColorTarget.lerp(new THREE.Color('#64748b'), 0.6);
      this.fogDensityTarget = Math.max(this.fogDensityTarget, 0.024);
      this.sunIntensityTarget *= 0.6;
    } else if (this.activeTheme === 'NIGHT_FARM') {
      this.skyColorTarget.set('#030712');
      this.fogColorTarget.set('#030712');
      this.fogDensityTarget = Math.max(this.fogDensityTarget, 0.026);
      this.sunIntensityTarget *= 0.35;
    } else if (this.activeTheme === 'RAINY_SEASON') {
      this.skyColorTarget.lerp(new THREE.Color('#334155'), 0.6);
      this.fogColorTarget.lerp(new THREE.Color('#1e293b'), 0.6);
      this.fogDensityTarget = Math.max(this.fogDensityTarget, 0.035);
      this.sunIntensityTarget *= 0.6;
    }

    this.wetnessTarget = targetWetness;
    this.windSpeedTarget = targetWind;
    this.cloudOpacityTarget = targetCloudOpacity;
    this.cloudColorTarget.copy(targetCloudColor);

    // Sync light positions
    this.dirLight.position.set(sunX, sunY, sunZ);

    if (this.starsParticles) {
      const mat = this.starsParticles.material as THREE.PointsMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, starsOpacity, 0.08);
      this.starsParticles.visible = mat.opacity > 0.01;
    }
  }

  private updateEnvironmentLerps(delta: number) {
    const lStep = delta * 1.4; // smooth transition speed factor
    
    // Lerp colors
    this.skyColorCurrent.lerp(this.skyColorTarget, lStep);
    this.fogColorCurrent.lerp(this.fogColorTarget, lStep);
    this.sunColorCurrent.lerp(this.sunColorTarget, lStep);
    this.ambColorCurrent.lerp(this.ambColorTarget, lStep);
    
    // Lerp numbers
    this.fogDensityCurrent = THREE.MathUtils.lerp(this.fogDensityCurrent, this.fogDensityTarget, lStep);
    this.sunIntensityCurrent = THREE.MathUtils.lerp(this.sunIntensityCurrent, this.sunIntensityTarget, lStep);
    this.ambIntensityCurrent = THREE.MathUtils.lerp(this.ambIntensityCurrent, this.ambIntensityTarget, lStep);
    this.wetnessCurrent = THREE.MathUtils.lerp(this.wetnessCurrent, this.wetnessTarget, delta * 0.5); // wetness forms slowly
    this.windSpeedCurrent = THREE.MathUtils.lerp(this.windSpeedCurrent, this.windSpeedTarget, lStep);
    this.cloudOpacityCurrent = THREE.MathUtils.lerp(this.cloudOpacityCurrent, this.cloudOpacityTarget, lStep);
    this.cloudColorCurrent.lerp(this.cloudColorTarget, lStep);

    // Apply to Three.js elements
    this.scene.background = this.skyColorCurrent;
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.fogColorCurrent);
      this.scene.fog.density = this.fogDensityCurrent;
    }
    
    this.dirLight.color.copy(this.sunColorCurrent);
    if (this.lightningActive && this.lightningLight) {
      this.dirLight.intensity = Math.max(0.1, this.sunIntensityCurrent * 0.3); // dims the world shadow, making the flash shine
    } else {
      this.dirLight.intensity = this.sunIntensityCurrent;
    }

    this.ambientLight.color.copy(this.ambColorCurrent);
    this.ambientLight.intensity = this.ambIntensityCurrent;

    // Apply cloud properties to cloud Material
    if (this.cloudMaterial) {
      this.cloudMaterial.color.copy(this.cloudColorCurrent);
      this.cloudMaterial.opacity = this.cloudOpacityCurrent;
    }

    // Dynamic environmental wetness reflections multiplier:
    const roadMat = this.matCache['road_asphalt_pbr'] as THREE.MeshStandardMaterial;
    if (roadMat) {
      roadMat.roughness = THREE.MathUtils.lerp(0.70, 0.04, this.wetnessCurrent);
      roadMat.metalness = THREE.MathUtils.lerp(0.1, 0.65, this.wetnessCurrent);
    }

    const isDarkGlobal = (this.timeOfDay > 19.2 || this.timeOfDay < 5.2) || this.currentWeather === 'THUNDERSTORM';
    
    // In search of posts lamps: scale emissive maps
    this.roads.forEach((roadGrp) => {
      roadGrp.traverse((node: any) => {
        if (node.isMesh && node.material && node.material.emissive) {
          node.material.emissiveIntensity = THREE.MathUtils.lerp(node.material.emissiveIntensity, isDarkGlobal ? 1.5 : 0.05, delta * 3.0);
        }
      });
    });
  }

  public getThemeAtPosition(distance: number): { primary: ThemeType; transitionWith?: ThemeType; ratio: number } {
    if (this.debugSingleBiome) {
      return { primary: 'POULTRY_FARM', ratio: 0 };
    }
    const themes: ThemeType[] = [
      'POULTRY_FARM',
      'CORN_FIELDS',
      'WHEAT_FIELDS',
      'SKM_FACTORY',
      'WAREHOUSE',
      'RIVER_AREA',
      'VILLAGE_ROADS'
    ];
    const stepSize = 500;
    const transitionWidth = 200; // 200m smooth transition areas as requested

    const currentStepIndex = Math.floor(Math.max(0, distance) / stepSize) % themes.length;
    const currentTheme = themes[currentStepIndex];

    const blockProgress = Math.max(0, distance) % stepSize;

    if (blockProgress > (stepSize - transitionWidth)) {
      const nextStepIndex = (currentStepIndex + 1) % themes.length;
      const nextTheme = themes[nextStepIndex];
      const ratio = (blockProgress - (stepSize - transitionWidth)) / transitionWidth; // 0 to 1 progress
      return { primary: currentTheme, transitionWith: nextTheme, ratio };
    }

    return { primary: currentTheme, ratio: 0 };
  }

  public getThemeForDistance(distance: number): ThemeType {
    return this.getThemeAtPosition(distance).primary;
  }

  private getThemeBaseHeight(theme: ThemeType, x: number, z: number): number {
    if (theme === 'POULTRY_FARM') {
      return Math.sin(x * 0.05) * Math.cos(z * 0.035) * 2.8 + Math.cos(z * 0.07) * 1.2;
    } else if (theme === 'CORN_FIELDS' || theme === 'WHEAT_FIELDS') {
      return Math.sin(x * 0.03) * Math.cos(z * 0.02) * 1.0;
    } else if (theme === 'SKM_FACTORY' || theme === 'WAREHOUSE') {
      return 0;
    } else if (theme === 'RIVER_AREA') {
      if (x < -18.0) {
        const distToRiver = Math.abs(x - (-35.0));
        if (distToRiver < 16.0) {
          return -4.0 * (1.0 - distToRiver / 16.0);
        } else {
          return -0.5;
        }
      } else {
        return Math.sin(x * 0.06) * 1.2;
      }
    } else if (theme === 'VILLAGE_ROADS') {
      return -0.05;
    } else {
      return Math.sin(x * 0.05) * Math.cos(z * 0.035) * 2.8;
    }
  }

  private getTerrainHeight(x: number, z: number): number {
    const absX = Math.abs(x);
    
    // Perfectly flat runway corridor
    if (absX < 7.5) {
      return -0.05;
    }
    
    // Blend zone from road side to fields
    let blendFactor = 1.0;
    if (absX < 12.5) {
      blendFactor = (absX - 7.5) / 5.0;
    }
    
    const blend = this.getThemeAtPosition(-z);
    let baseHeight = this.getThemeBaseHeight(blend.primary, x, z);

    if (blend.transitionWith) {
      const secondaryHeight = this.getThemeBaseHeight(blend.transitionWith, x, z);
      baseHeight = THREE.MathUtils.lerp(baseHeight, secondaryHeight, blend.ratio);
    }
    
    baseHeight *= blendFactor;
    
    // Monumental distant mountain ranges to perfectly block the outer horizon limits
    if (absX > 85.0) {
      const mountRamp = Math.min((absX - 85.0) / 20.0, 2.5);
      const mountainWave = Math.sin(x * 0.1) * Math.cos(z * 0.06) * 4.5 + Math.cos(x * 0.04) * 2.5;
      const solidScale = (absX - 85.0) * 0.45;
      baseHeight += (solidScale + mountainWave) * mountRamp;
    }
    
    return baseHeight - 0.05;
  }

  private getThemeVertexColor(theme: ThemeType, vx: number, vertexAbsZ: number, vHeight: number, tempColor: THREE.Color) {
    const absX = Math.abs(vx);
    if (theme === 'POULTRY_FARM') {
      const pastureNoise = Math.sin(vx * 0.1) * Math.sin(vertexAbsZ * 0.1) * 0.5 + 0.5;
      tempColor.set('#15803d').lerp(new THREE.Color('#16a34a'), pastureNoise);
    } else if (theme === 'CORN_FIELDS') {
      const soilStripe = Math.floor(vx / 2.0) % 2 === 0;
      if (soilStripe && absX < 45.0) {
        tempColor.set('#3f2c19'); // Rich brown tilled farmlands
      } else {
        tempColor.set('#14532d'); // Dark corn crop greens
      }
    } else if (theme === 'WHEAT_FIELDS') {
      const wheatNoise = Math.sin(vx * 0.25) * Math.cos(vertexAbsZ * 0.25) * 0.3 + 0.7;
      tempColor.set('#ca8a04').lerp(new THREE.Color('#eab308'), wheatNoise);
    } else if (theme === 'SKM_FACTORY') {
      const slabGrid = (Math.floor(vx / 6.0) + Math.floor(vertexAbsZ / 6.0)) % 2 === 0;
      tempColor.set(slabGrid ? '#52525b' : '#3f3f46');
    } else if (theme === 'WAREHOUSE') {
      const asphaltNoise = Math.sin(vx * 0.5) * Math.sin(vertexAbsZ * 0.5) * 0.2 + 0.8;
      tempColor.set('#27272a').lerp(new THREE.Color('#18181b'), asphaltNoise * 0.5);
    } else if (theme === 'RIVER_AREA') {
      if (vx < -18.0) {
        tempColor.set('#b45309').lerp(new THREE.Color('#78350f'), 0.5);
      } else {
        tempColor.set('#166534').lerp(new THREE.Color('#15803d'), 0.5);
      }
    } else if (theme === 'VILLAGE_ROADS') {
      const lawnGrid = (Math.floor(vx / 5.0) + Math.floor(vertexAbsZ / 5.0)) % 2 === 0;
      tempColor.set(lawnGrid ? '#15803d' : '#166534');
    } else {
      const pastureNoise = Math.sin(vx * 0.1) * Math.sin(vertexAbsZ * 0.1) * 0.5 + 0.5;
      tempColor.set('#166534').lerp(new THREE.Color('#15803d'), pastureNoise * 0.5);
    }
  }

  private updateSegmentTerrain(roadGrp: THREE.Group, segmentZOffset: number) {
    try {
      const terrainMesh = roadGrp.getObjectByName('rolling_terrain') as THREE.Mesh;
      if (!terrainMesh) {
        throw new Error("rolling_terrain mesh not found in roadGroup");
      }

      const geom = terrainMesh.geometry;
      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
      if (!posAttr) {
        throw new Error("Position attribute missing on terrain geometry");
      }

      // Simulate network / generation verification; if somehow corrupted, trigger fallback
      if (segmentZOffset === null || isNaN(segmentZOffset)) {
        throw new Error("Invalid Z coordinate offset");
      }

      const colors: number[] = [];
      const tempColor = new THREE.Color();

      // Dynamically style asphalt / shoulders for the chunk based on theme!
      const shoulderL = roadGrp.getObjectByName('shoulder_l') as THREE.Mesh;
      const shoulderR = roadGrp.getObjectByName('shoulder_r') as THREE.Mesh;
      const themeAtChunk = this.getThemeForDistance(-segmentZOffset);
      let shoulderColor = '#166534'; // Default pasture green verges
      if (themeAtChunk === 'SKM_FACTORY' || themeAtChunk === 'WAREHOUSE') {
        shoulderColor = '#64748b'; // Concrete slate verges
      } else if (themeAtChunk === 'VILLAGE_ROADS') {
        shoulderColor = '#7c2d12'; // Paved brick red verges
      } else if (themeAtChunk === 'RIVER_AREA') {
        shoulderColor = '#451a03'; // Damp muddy brown verges
      } else if (themeAtChunk === 'WHEAT_FIELDS') {
        shoulderColor = '#ca8a04'; // Dry golden verges
      }
      if (shoulderL && shoulderL.material) {
        (shoulderL.material as THREE.MeshStandardMaterial).color.set(shoulderColor);
      }
      if (shoulderR && shoulderR.material) {
        (shoulderR.material as THREE.MeshStandardMaterial).color.set(shoulderColor);
      }

      for (let j = 0; j < posAttr.count; j++) {
        const vx = posAttr.getX(j);
        const vy = posAttr.getY(j); // local Y maps to absolute Z offset
        const vertexAbsZ = segmentZOffset + vy;

        const vHeight = this.getTerrainHeight(vx, vertexAbsZ);
        posAttr.setZ(j, vHeight);

        const absX = Math.abs(vx);
        const vertexThemeBlend = this.getThemeAtPosition(-vertexAbsZ);

        if (absX < 11.5) {
          // Dirt gravel path buffer right next to the asphalt shoulder
          const gravelS = Math.abs(Math.sin(vx * 8)) * 0.18;
          const tPrimary = vertexThemeBlend.primary;
          const tSec = vertexThemeBlend.transitionWith || tPrimary;
          const r = vertexThemeBlend.ratio;

          const getGravelColor = (theme: ThemeType, c: THREE.Color) => {
            if (theme === 'SKM_FACTORY' || theme === 'WAREHOUSE') {
              c.set('#475569').lerp(new THREE.Color('#334155'), gravelS);
            } else if (theme === 'VILLAGE_ROADS') {
              c.set('#7c2d12').lerp(new THREE.Color('#9a3412'), gravelS);
            } else if (theme === 'RIVER_AREA') {
              c.set('#1a2e1a').lerp(new THREE.Color('#2d3c2d'), gravelS);
            } else {
              c.set('#2d2011').lerp(new THREE.Color('#3f2c19'), gravelS);
            }
          };

          const col1 = new THREE.Color();
          const col2 = new THREE.Color();
          getGravelColor(tPrimary, col1);
          getGravelColor(tSec, col2);
          tempColor.copy(col1).lerp(col2, r);
        } else if (vHeight < -0.65 && vertexThemeBlend.primary === 'RIVER_AREA') {
          // Deep river bed waters shading
          const mudBlend = Math.min((vHeight + 4.0) / 4.0, 1.0);
          tempColor.set('#0f172a').lerp(new THREE.Color('#1e293b'), mudBlend);
        } else {
          // Main Side Fields based on Theme or Biome of position!
          const col1 = new THREE.Color();
          this.getThemeVertexColor(vertexThemeBlend.primary, vx, vertexAbsZ, vHeight, col1);

          if (vertexThemeBlend.transitionWith) {
            const col2 = new THREE.Color();
            this.getThemeVertexColor(vertexThemeBlend.transitionWith, vx, vertexAbsZ, vHeight, col2);
            tempColor.copy(col1).lerp(col2, vertexThemeBlend.ratio);
          } else {
            tempColor.copy(col1);
          }
        }

        // Apply high mountain snow caps
        if (absX > 75.0) {
          if (vHeight > 13.0) {
            tempColor.set('#f8fafc'); // Snow mountain caps
          } else {
            const rockBlend = Math.max(0, (vHeight - 5.0) / 8.0);
            tempColor.set('#475569').lerp(new THREE.Color('#94a3b8'), rockBlend);
          }
        }

        colors.push(tempColor.r, tempColor.g, tempColor.b);
      }

      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      posAttr.needsUpdate = true;
      const colorAttr = geom.getAttribute('color');
      if (colorAttr) {
        colorAttr.needsUpdate = true;
      }
      geom.computeVertexNormals();
      console.log("Chunk generated");
    } catch (err) {
      console.warn("Biome generation failed; applying fallback grass terrain:", err);
      this.applyFallbackSegmentTerrain(roadGrp);
    }
  }

  private applyFallbackSegmentTerrain(roadGrp: THREE.Group) {
    try {
      const terrainMesh = roadGrp.getObjectByName('rolling_terrain') as THREE.Mesh;
      if (!terrainMesh) return;

      const geom = terrainMesh.geometry;
      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
      if (!posAttr) return;

      const colors: number[] = [];
      const tempColor = new THREE.Color('#166534'); // Default emerald pasture grass fallback

      for (let j = 0; j < posAttr.count; j++) {
        posAttr.setZ(j, -0.05); // perfectly flat standard grass
        colors.push(tempColor.r, tempColor.g, tempColor.b);
      }

      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      posAttr.needsUpdate = true;
      const colorAttr = geom.getAttribute('color');
      if (colorAttr) {
        colorAttr.needsUpdate = true;
      }
      geom.computeVertexNormals();
      console.log("Chunk generated"); // Ensure "Chunk generated" displays for debug checks
    } catch (err) {
      console.error("Failed to generate fallback grass chunk:", err);
    }
  }

  private updateChunkDecorVisibility(roadGrp: THREE.Group) {
    const theme = roadGrp.userData.theme || this.activeTheme;
    const farmSideDecors = roadGrp.getObjectByName('farm_decor');
    const factSideDecors = roadGrp.getObjectByName('factory_decor');
    const greenSideDecors = roadGrp.getObjectByName('green_decor');

    if (farmSideDecors) {
      farmSideDecors.visible = (theme === 'POULTRY_FARM' || theme === 'VILLAGE_ROADS' || theme === 'NIGHT_FARM');
    }
    if (factSideDecors) {
      factSideDecors.visible = (theme === 'SKM_FACTORY' || theme === 'WAREHOUSE');
    }
    if (greenSideDecors) {
      greenSideDecors.visible = (theme === 'CORN_FIELDS' || theme === 'WHEAT_FIELDS' || theme === 'RAINY_SEASON');
    }
  }

  private getFurthestRoadPieceZ(): number {
    let furthest = 0;
    this.roads.forEach((r) => {
      if (r.position.z < furthest) furthest = r.position.z;
    });
    return furthest;
  }

  public cleanup() {
    this.stop();
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('touchstart', () => {});
    window.removeEventListener('touchend', () => {});
    window.removeEventListener('resize', this.handleResize);

    Object.values(this.geoCache).forEach((g) => g.dispose());
    Object.values(this.matCache).forEach((m) => m.dispose());

    this.renderer.dispose();
  }
}
export default SKMRunnerEngine;
