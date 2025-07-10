/**
 * Scene Manager - Core Three.js scene management and rendering
 * Handles camera, lighting, rendering loop, and scene lifecycle
 */

import * as THREE from 'three';
import { ObjectFactory } from './ObjectFactory';
import { AnimationManager } from './AnimationManager';
import { PDDLDomain, PDDLProblem, Plan, SceneObject } from '../types/pddl';

export interface CameraConfig {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  near: number;
  far: number;
}

export interface LightingConfig {
  ambientColor: number;
  ambientIntensity: number;
  directionalColor: number;
  directionalIntensity: number;
  directionalPosition: THREE.Vector3;
  enableShadows: boolean;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationManager: AnimationManager;
  private controls?: any; // OrbitControls would be imported separately
  
  private sceneObjects: Map<string, THREE.Object3D> = new Map();
  private isRenderingEnabled = true;
  private renderRequested = false;
  
  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e293b); // Match design
    
    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(10, 8, 10);
    this.camera.lookAt(0, 0, 0);
    
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Initialize animation manager
    this.animationManager = new AnimationManager(this.scene);
    
    // Setup default lighting
    this.setupLighting();
    
    // Setup ground plane
    this.setupGround();
    
    // Start render loop
    this.startRenderLoop();
  }

  /**
   * Setup default scene lighting
   */
  private setupLighting(config?: Partial<LightingConfig>): void {
    const defaultConfig: LightingConfig = {
      ambientColor: 0x404040,
      ambientIntensity: 0.4,
      directionalColor: 0xffffff,
      directionalIntensity: 1.0,
      directionalPosition: new THREE.Vector3(5, 10, 5),
      enableShadows: true
    };
    
    const lightConfig = { ...defaultConfig, ...config };
    
    // Clear existing lights
    const existingLights = this.scene.children.filter(child => child instanceof THREE.Light);
    existingLights.forEach(light => this.scene.remove(light));
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      lightConfig.ambientColor,
      lightConfig.ambientIntensity
    );
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(
      lightConfig.directionalColor,
      lightConfig.directionalIntensity
    );
    directionalLight.position.copy(lightConfig.directionalPosition);
    directionalLight.castShadow = lightConfig.enableShadows;
    
    if (lightConfig.enableShadows) {
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      directionalLight.shadow.camera.left = -20;
      directionalLight.shadow.camera.right = 20;
      directionalLight.shadow.camera.top = 20;
      directionalLight.shadow.camera.bottom = -20;
    }
    
    this.scene.add(directionalLight);
    
    // Additional fill lights
    const fillLight = new THREE.DirectionalLight(0x444444, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  /**
   * Setup ground plane
   */
  private setupGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x2d3748,
      transparent: true,
      opacity: 0.8
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    ground.name = 'ground';
    
    this.scene.add(ground);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(50, 50, 0x4a5568, 0x2d3748);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);
  }

  /**
   * Generate scene from PDDL data
   */
  async generateScene(domain: PDDLDomain, problem: PDDLProblem, plan: Plan): Promise<SceneObject[]> {
    console.log('Generating scene from PDDL data...');
    
    // Clear existing scene objects
    this.clearSceneObjects();
    
    const sceneObjects: SceneObject[] = [];
    
    try {
      // Debug: Log all PDDL objects being processed
      console.log('PDDL Objects to create:', problem.objects.map(obj => `${obj.name} (${obj.type})`));
      
      // Create objects from problem definition
      for (const pddlObject of problem.objects) {
        const mesh = ObjectFactory.createObjectMesh(pddlObject, domain.types);
        
        // Add to scene
        this.scene.add(mesh);
        this.sceneObjects.set(pddlObject.name, mesh);
        
        // Create scene object record
        const sceneObject: SceneObject = {
          id: pddlObject.name,
          name: pddlObject.name,
          type: pddlObject.type,
          position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
          rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
          scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
          meshId: mesh.uuid,
          properties: pddlObject.properties || {}
        };
        
        sceneObjects.push(sceneObject);
      }
      
      // Layout objects intelligently
      const meshes = Array.from(this.sceneObjects.values()) as THREE.Group[];
      ObjectFactory.layoutObjects(meshes);
      
      // Position objects based on initial facts
      this.applyInitialState(problem.init);
      
      // Schedule animations from plan
      this.animationManager.scheduleAnimations(plan.actions, plan.processes);
      
      // Position camera to view the scene
      this.focusCamera();
      
      console.log(`Generated scene with ${sceneObjects.length} objects`);
      
    } catch (error) {
      console.error('Error generating scene:', error);
      throw error;
    }
    
    return sceneObjects;
  }

  /**
   * Apply initial state positioning from PDDL facts
   */
  private applyInitialState(initFacts: any[]): void {
    console.log('Applying initial state from facts:', initFacts);
    
    initFacts.forEach(fact => {
      console.log(`Processing fact: ${fact.predicate}(${fact.args.join(', ')})`);
      
      // Handle various location predicates
      if (fact.predicate === 'at-robot' || fact.predicate === 'at' || 
          fact.predicate === 'robot-at' || fact.predicate === 'ball-at' ||
          fact.predicate === 'at-obj' || fact.predicate === 'obj-at' ||
          fact.predicate === 'in' || fact.predicate === 'on') {
        
        const objectName = fact.args[0].toLowerCase();
        const locationName = fact.args[1].toLowerCase();
        
        const object = this.sceneObjects.get(objectName);
        const location = this.sceneObjects.get(locationName);
        
        console.log(`Looking for object '${objectName}' and location '${locationName}'`);
        console.log(`Available objects:`, Array.from(this.sceneObjects.keys()));
        
        if (object && location) {
          console.log(`Positioning ${objectName} at ${locationName}`);
          console.log(`Location position:`, location.position);
          
          // Position object at location
          object.position.copy(location.position);
          
          // Different height offsets based on object type
          if (object.userData.pddlObject?.type === 'obj' || 
              object.userData.pddlObject?.type === 'ball') {
            object.position.y += 0.3; // Balls slightly higher
          } else if (object.userData.pddlObject?.type === 'robot') {
            object.position.y += 0.1; // Robots on ground
          } else {
            object.position.y += 0.1; // Default height
          }
          
          // Add small offset within room boundaries to avoid overlapping
          const hash = this.hashString(objectName);
          const maxOffset = 1.5; // Stay well within room boundaries (room is 4x4)
          object.position.x += ((hash % 100) - 50) * (maxOffset / 50);
          object.position.z += (((hash >> 8) % 100) - 50) * (maxOffset / 50);
          
          // Ensure object stays within room bounds if location has bounds
          if (location.userData.bounds) {
            const bounds = location.userData.bounds;
            object.position.x = Math.max(bounds.minX + 0.5, Math.min(bounds.maxX - 0.5, object.position.x));
            object.position.z = Math.max(bounds.minZ + 0.5, Math.min(bounds.maxZ - 0.5, object.position.z));
          }
          
          console.log(`Final position for ${objectName}:`, object.position);
          
        } else {
          if (!object) console.warn(`Object not found: ${objectName}`);
          if (!location) console.warn(`Location not found: ${locationName}`);
        }
      }
    });
  }

  /**
   * Simple hash function for deterministic positioning
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Clear all scene objects except ground and lights
   */
  private clearSceneObjects(): void {
    const objectsToRemove = Array.from(this.sceneObjects.values());
    objectsToRemove.forEach(obj => {
      this.scene.remove(obj);
      
      // Dispose of geometries and materials
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    });
    
    this.sceneObjects.clear();
  }

  /**
   * Focus camera on the scene optimized for matrix layout
   */
  private focusCamera(): void {
    if (this.sceneObjects.size === 0) return;
    
    // Calculate bounding box of all objects
    const box = new THREE.Box3();
    this.sceneObjects.forEach(obj => {
      box.expandByObject(obj);
    });
    
    if (box.isEmpty()) return;
    
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Optimize camera for matrix layout viewing
    const maxHorizontal = Math.max(size.x, size.z);
    const distance = maxHorizontal * 1.8;
    const height = Math.max(maxHorizontal * 0.8, 20);
    
    this.camera.position.set(
      center.x + distance * 0.4, // Slight angle for depth
      height,
      center.z + distance * 0.8
    );
    this.camera.lookAt(center.x, 0, center.z);
    
    // Update controls target if available
    if (this.controls) {
      this.controls.target.copy(new THREE.Vector3(center.x, 0, center.z));
      this.controls.update();
    }
    
    console.log(`Camera positioned for matrix layout view at (${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)})`);
  }

  /**
   * Update scene for current time
   */
  updateScene(currentTime: number): void {
    this.animationManager.update(currentTime);
    this.requestRender();
  }

  /**
   * Seek animations to specific time
   */
  seekToTime(time: number): void {
    this.animationManager.seekToTime(time);
    this.requestRender();
  }

  /**
   * Get object by name
   */
  getObject(name: string): THREE.Object3D | undefined {
    return this.sceneObjects.get(name);
  }

  /**
   * Add controls (to be called externally with OrbitControls)
   */
  setControls(controls: any): void {
    this.controls = controls;
    
    // Add event listeners for render requests
    controls.addEventListener('change', () => this.requestRender());
  }

  /**
   * Handle window resize
   */
  handleResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.requestRender();
  }

  /**
   * Set camera mode
   */
  setCameraMode(mode: 'perspective' | 'orthographic' | 'top'): void {
    switch (mode) {
      case 'perspective':
        // Already using perspective camera
        break;
        
      case 'orthographic':
        // Would need to switch to orthographic camera
        console.log('Orthographic camera not implemented yet');
        break;
        
      case 'top':
        // Position camera directly above scene
        if (this.sceneObjects.size > 0) {
          const box = new THREE.Box3();
          this.sceneObjects.forEach(obj => box.expandByObject(obj));
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          this.camera.position.set(center.x, center.y + Math.max(size.x, size.z) * 1.5, center.z);
          this.camera.lookAt(center);
          
          if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
          }
        }
        break;
    }
    
    this.requestRender();
  }

  /**
   * Toggle wireframe mode
   */
  setRenderMode(mode: 'realistic' | 'wireframe' | 'points'): void {
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.wireframe = mode === 'wireframe';
          });
        } else {
          child.material.wireframe = mode === 'wireframe';
        }
      }
    });
    
    this.requestRender();
  }

  /**
   * Request render (throttled)
   */
  private requestRender(): void {
    if (!this.renderRequested && this.isRenderingEnabled) {
      this.renderRequested = true;
      requestAnimationFrame(() => {
        this.render();
        this.renderRequested = false;
      });
    }
  }

  /**
   * Render single frame
   */
  private render(): void {
    // Update animations with current playback time
    const currentTime = this.getCurrentPlaybackTime();
    this.animationManager.update(currentTime);
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get current playback time from the plan store
   */
  private getCurrentPlaybackTime(): number {
    // Get current time from the global plan store
    if (typeof window !== 'undefined' && (window as any).planStoreCurrentTime !== undefined) {
      return (window as any).planStoreCurrentTime;
    }
    return 0;
  }

  /**
   * Start continuous render loop
   */
  private startRenderLoop(): void {
    const animate = () => {
      if (this.isRenderingEnabled) {
        this.render();
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  /**
   * Enable/disable rendering
   */
  setRenderingEnabled(enabled: boolean): void {
    this.isRenderingEnabled = enabled;
    if (enabled) {
      this.startRenderLoop();
    }
  }

  /**
   * Get current camera configuration
   */
  getCameraConfig(): CameraConfig {
    return {
      position: this.camera.position.clone(),
      target: this.controls?.target?.clone() || new THREE.Vector3(),
      fov: this.camera.fov,
      near: this.camera.near,
      far: this.camera.far
    };
  }

  /**
   * Export scene as JSON (for saving/loading)
   */
  exportScene(): any {
    return {
      objects: Array.from(this.sceneObjects.entries()).map(([name, obj]) => ({
        name,
        position: obj.position.toArray(),
        rotation: obj.rotation.toArray(),
        scale: obj.scale.toArray(),
        userData: obj.userData
      })),
      camera: this.getCameraConfig(),
      lighting: {
        // Would extract current lighting configuration
      }
    };
  }

  /**
   * Take screenshot of current scene
   */
  takeScreenshot(width = 1920, height = 1080): string {
    // Temporarily resize for screenshot
    const originalSize = this.renderer.getSize(new THREE.Vector2());
    this.renderer.setSize(width, height, false);
    
    this.render();
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    
    // Restore original size
    this.renderer.setSize(originalSize.x, originalSize.y, false);
    
    return dataURL;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.isRenderingEnabled = false;
    
    // Dispose of scene objects
    this.clearSceneObjects();
    
    // Dispose of animation manager
    this.animationManager.dispose();
    
    // Dispose of renderer
    this.renderer.dispose();
    
    // Dispose of object factory caches
    ObjectFactory.dispose();
  }

  // Getters
  get Scene(): THREE.Scene { return this.scene; }
  get Camera(): THREE.Camera { return this.camera; }
  get Renderer(): THREE.WebGLRenderer { return this.renderer; }
  get AnimationManager(): AnimationManager { return this.animationManager; }
}
