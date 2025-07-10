/**
 * Object Factory - Creates 3D objects based on PDDL types
 * Generates realistic meshes for robots, rooms, and other domain objects
 */

import * as THREE from 'three';
import { PDDLObject, PDDLType } from '../types/pddl';

export interface ObjectMeshConfig {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  scale: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  animations?: THREE.AnimationClip[];
}

export class ObjectFactory {
  private static materialCache = new Map<string, THREE.Material>();
  private static geometryCache = new Map<string, THREE.BufferGeometry>();
  
  /**
   * Create a 3D mesh for a PDDL object based on its type
   */
  static createObjectMesh(object: PDDLObject, types: PDDLType[]): THREE.Group {
    const group = new THREE.Group();
    group.name = object.name;
    group.userData = { pddlObject: object };

    // Determine object configuration based on type hierarchy
    const hierarchy = this.getTypeHierarchy(object.type, types);
    
    console.log(`Creating object: ${object.name} (${object.type}), hierarchy: [${hierarchy.join(', ')}]`);
    
    // Create appropriate mesh based on type
    if (this.isRobotType(hierarchy)) {
      console.log(`Creating robot: ${object.name}`);
      this.createHumanoidRobot(group, object.type);
    } else if (object.name.includes('garden') || this.isGardenType(hierarchy)) {
      console.log(`Creating garden: ${object.name}`);
      this.createGarden(group, object.type);
    } else if (this.isRoomType(hierarchy)) {
      console.log(`Creating room: ${object.name}`);
      this.createArchitecturalRoom(group, object.type);
    } else if (this.isBallType(hierarchy)) {
      console.log(`Creating ball: ${object.name}`);
      this.createBall(group, object.type);
    } else if (this.isBoxType(hierarchy)) {
      console.log(`Creating box: ${object.name}`);
      this.createBox(group, object.type);
    } else if (ObjectFactory.isAirplaneType(hierarchy)) {
      console.log(`Creating airplane: ${object.name}`);
      ObjectFactory.createAirplane(group, object.type);
    } else if (ObjectFactory.isTruckType(hierarchy)) {
      console.log(`Creating truck: ${object.name}`);
      ObjectFactory.createTruck(group, object.type);
    } else if (ObjectFactory.isPackageType(hierarchy)) {
      console.log(`Creating package: ${object.name}`);
      ObjectFactory.createPackage(group, object.type);
    } else if (ObjectFactory.isAirportType(hierarchy)) {
      console.log(`Creating airport: ${object.name}`);
      ObjectFactory.createAirport(group, object.type);
    } else if (ObjectFactory.isLocationTypeLogistics(hierarchy)) {
      console.log(`Creating location: ${object.name}`);
      ObjectFactory.createLocation(group, object.type);
    } else if (ObjectFactory.isCityType(hierarchy)) {
      console.log(`Creating city: ${object.name}`);
      ObjectFactory.createCity(group, object.type);
    } else {
      console.log(`Creating generic object: ${object.name}`);
      this.createGenericObject(group, object.type);
    }
    
    // Add shadows
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    return group;
  }

  /**
   * Create detailed humanoid robot
   */
  private static createHumanoidRobot(group: THREE.Group, type: string): void {
    const robotColor = type.toLowerCase().includes('eve') ? 0xE8E8E8 : 0x4A90E2;
    const material = new THREE.MeshPhongMaterial({ color: robotColor });

    // Head
    const headGeometry = new THREE.SphereGeometry(0.15, 16, 12);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, 1.7, 0);
    head.name = 'head';
    group.add(head);

    // Torso
    const torsoGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.25);
    const torso = new THREE.Mesh(torsoGeometry, material);
    torso.position.set(0, 1.0, 0);
    torso.name = 'torso';
    group.add(torso);

    // Create articulated arms with proper joint hierarchy
    this.createArticulatedArm(group, material, 'left', -0.25);
    this.createArticulatedArm(group, material, 'right', 0.25);

    // Left leg
    const legGeometry = new THREE.CapsuleGeometry(0.08, 0.7, 4, 8);
    const leftLeg = new THREE.Mesh(legGeometry, material);
    leftLeg.position.set(-0.12, 0.25, 0);
    leftLeg.name = 'leftLeg';
    group.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, material);
    rightLeg.position.set(0.12, 0.25, 0);
    rightLeg.name = 'rightLeg';
    group.add(rightLeg);

    // Eyes for character
    const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 6);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.05, 1.72, 0.12);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.05, 1.72, 0.12);
    group.add(rightEye);

    // Add robot label
    ObjectFactory.addObjectLabel(group, group.userData.pddlObject?.name || type, 2.2);
  }

  /**
   * Create garden location object
   */
  private static createGarden(group: THREE.Group, type: string): void {
    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const pathMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const flowerMaterial = new THREE.MeshPhongMaterial({ color: 0xFF69B4 });
    const treeMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
    
    // Grass base
    const grassGeometry = new THREE.PlaneGeometry(8, 8);
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = 0;
    group.add(grass);

    // Garden path
    const pathGeometry = new THREE.PlaneGeometry(2, 8);
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.01;
    group.add(path);

    // Add some trees
    for (let i = 0; i < 3; i++) {
      const treeX = (Math.random() - 0.5) * 6;
      const treeZ = (Math.random() - 0.5) * 6;
      
      // Tree trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.5);
      const trunk = new THREE.Mesh(trunkGeometry, treeMaterial);
      trunk.position.set(treeX, 0.75, treeZ);
      group.add(trunk);
      
      // Tree leaves
      const leavesGeometry = new THREE.SphereGeometry(0.8);
      const leaves = new THREE.Mesh(leavesGeometry, leafMaterial);
      leaves.position.set(treeX, 2.0, treeZ);
      group.add(leaves);
    }

    // Add flower patches
    for (let i = 0; i < 5; i++) {
      const flowerX = (Math.random() - 0.5) * 4;
      const flowerZ = (Math.random() - 0.5) * 4;
      
      const flowerGeometry = new THREE.SphereGeometry(0.1);
      const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      flower.position.set(flowerX, 0.1, flowerZ);
      group.add(flower);
    }

    // Add garden label
    ObjectFactory.addObjectLabel(group, group.userData.pddlObject?.name || type, 3.5);
  }

  /**
   * Create architectural room
   */
  private static createArchitecturalRoom(group: THREE.Group, type: string): void {
    const wallMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xCCCCCC,
      transparent: true,
      opacity: 0.8
    });
    
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B9DC3 });

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(4, 4);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.name = 'floor';
    group.add(floor);

    // Walls
    const wallHeight = 2.5;
    const wallThickness = 0.1;

    // Front wall
    const frontWallGeometry = new THREE.BoxGeometry(4, wallHeight, wallThickness);
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.set(0, wallHeight/2, 2);
    group.add(frontWall);

    // Back wall
    const backWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    backWall.position.set(0, wallHeight/2, -2);
    group.add(backWall);

    // Left wall
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 4);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-2, wallHeight/2, 0);
    group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(2, wallHeight/2, 0);
    group.add(rightWall);

    // Room label
    this.addRoomLabel(group, type);
  }

  /**
   * Create ball object
   */
  private static createBall(group: THREE.Group, type: string): void {
    // Different colors for different ball objects
    const ballColor = type.toLowerCase().includes('1') || type.toLowerCase().includes('ball1') ? 0xE74C3C : 0x4A90E2;
    const geometry = new THREE.SphereGeometry(0.2, 20, 16);
    const material = new THREE.MeshPhongMaterial({ 
      color: ballColor,
      shininess: 100,
      specular: 0x222222
    });
    const ball = new THREE.Mesh(geometry, material);
    ball.position.set(0, 0.2, 0); // Position above ground
    ball.name = 'ball_mesh';
    group.add(ball);
    
    // Add object label
    ObjectFactory.addObjectLabel(group, group.userData.pddlObject?.name || type, 0.8);
    
    console.log(`Ball created with color: ${ballColor.toString(16)}`);
  }

  /**
   * Create box object
   */
  private static createBox(group: THREE.Group, type: string): void {
    const boxColor = 0x8B4513;
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const material = new THREE.MeshLambertMaterial({ color: boxColor });
    const box = new THREE.Mesh(geometry, material);
    box.position.y = 0.15;
    group.add(box);
  }

  /**
   * Create generic object
   */
  private static createGenericObject(group: THREE.Group, type: string): void {
    const geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0x95A5A6 });
    const object = new THREE.Mesh(geometry, material);
    object.position.y = 0.15;
    group.add(object);
  }

  /**
   * Logistics Domain Object Creation Functions
   */

  /**
   * Create airplane object
   */
  private static createAirplane(group: THREE.Group, type: string): void {
    const airplaneColor = 0x4A90E2;
    const material = new THREE.MeshPhongMaterial({ color: airplaneColor, shininess: 100 });
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB });

    // Fuselage (main body) - larger and more detailed
    const fuselageGeometry = new THREE.CylinderGeometry(0.4, 0.3, 3.0, 16);
    const fuselage = new THREE.Mesh(fuselageGeometry, material);
    fuselage.rotation.z = Math.PI / 2;
    fuselage.position.set(0, 0.5, 0);
    group.add(fuselage);

    // Wings - larger and more realistic
    const wingGeometry = new THREE.BoxGeometry(4.0, 0.15, 1.2);
    const wings = new THREE.Mesh(wingGeometry, material);
    wings.position.set(0, 0.5, 0);
    group.add(wings);

    // Tail wing
    const tailWingGeometry = new THREE.BoxGeometry(0.15, 1.2, 0.6);
    const tailWing = new THREE.Mesh(tailWingGeometry, material);
    tailWing.position.set(-1.2, 0.8, 0);
    group.add(tailWing);

    // Nose cone
    const noseGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const nose = new THREE.Mesh(noseGeometry, material);
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(1.9, 0.5, 0);
    group.add(nose);

    // Windows
    const windowGeometry = new THREE.PlaneGeometry(0.8, 0.2);
    for (let i = 0; i < 4; i++) {
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(0.5 - i * 0.4, 0.7, 0.35);
      group.add(window);
    }

    // Add airplane label
    ObjectFactory.addObjectLabel(group, group.userData.pddlObject?.name || type, 1.8);
  }

  /**
   * Create truck object
   */
  private static createTruck(group: THREE.Group, type: string): void {
    const truckColor = 0xE74C3C;
    const material = new THREE.MeshPhongMaterial({ color: truckColor, shininess: 100 });
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.7 });

    // Cab - larger and more detailed
    const cabGeometry = new THREE.BoxGeometry(1.0, 0.8, 0.8);
    const cab = new THREE.Mesh(cabGeometry, material);
    cab.position.set(0.6, 0.4, 0);
    group.add(cab);

    // Cargo area - larger
    const cargoGeometry = new THREE.BoxGeometry(1.6, 1.0, 1.0);
    const cargo = new THREE.Mesh(cargoGeometry, material);
    cargo.position.set(-0.4, 0.5, 0);
    group.add(cargo);

    // Windshield
    const windshieldGeometry = new THREE.PlaneGeometry(0.6, 0.6);
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.position.set(1.05, 0.4, 0);
    windshield.rotation.y = Math.PI / 2;
    group.add(windshield);

    // Wheels - larger and more detailed
    const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 12);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x2C3E50 });
    
    const positions = [
      [0.8, 0.2, 0.5], [0.8, 0.2, -0.5],
      [-0.8, 0.2, 0.5], [-0.8, 0.2, -0.5],
      [-0.2, 0.2, 0.5], [-0.2, 0.2, -0.5]
    ];
    
    positions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      group.add(wheel);
    });

    // Cargo door
    const doorGeometry = new THREE.PlaneGeometry(0.8, 0.8);
    const doorMaterial = new THREE.MeshPhongMaterial({ color: 0xC0392B });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-1.2, 0.4, 0);
    door.rotation.y = Math.PI / 2;
    group.add(door);

    // Brake lights
    const brakeLightGeometry = new THREE.SphereGeometry(0.05);
    const brakeLightMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x220000,
      emissive: 0x110000
    });
    
    const leftBrakeLight = new THREE.Mesh(brakeLightGeometry, brakeLightMaterial);
    leftBrakeLight.position.set(-1.25, 0.3, 0.3);
    leftBrakeLight.name = 'brake_light_left';
    leftBrakeLight.userData.isBrakeLight = true;
    group.add(leftBrakeLight);
    
    const rightBrakeLight = new THREE.Mesh(brakeLightGeometry, brakeLightMaterial);
    rightBrakeLight.position.set(-1.25, 0.3, -0.3);
    rightBrakeLight.name = 'brake_light_right';
    rightBrakeLight.userData.isBrakeLight = true;
    group.add(rightBrakeLight);

    // Add truck label
    ObjectFactory.addObjectLabel(group, group.userData.pddlObject?.name || type, 1.3);
  }

  /**
   * Create package object
   */
  private static createPackage(group: THREE.Group, type: string): void {
    const packageColor = 0x8B4513;
    const material = new THREE.MeshLambertMaterial({ color: packageColor });
    const tapeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    
    // Box shape - larger and more detailed
    const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const packageBox = new THREE.Mesh(geometry, material);
    packageBox.position.y = 0.2;
    group.add(packageBox);

    // Tape strips
    const tapeGeometry = new THREE.PlaneGeometry(0.42, 0.05);
    const tape1 = new THREE.Mesh(tapeGeometry, tapeMaterial);
    tape1.position.set(0, 0.4, 0.201);
    group.add(tape1);

    const tape2 = new THREE.Mesh(tapeGeometry, tapeMaterial);
    tape2.position.set(0, 0.4, -0.201);
    group.add(tape2);

    // Add package label
    ObjectFactory.addObjectLabel(group, group.userData.pddlObject?.name || type, 0.8);
  }

  /**
   * Create airport object
   */
  private static createAirport(group: THREE.Group, type: string): void {
    // Ground platform - larger
    const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x5D6D7E });
    const platformGeometry = new THREE.BoxGeometry(8, 0.3, 8);
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.15;
    group.add(platform);

    // Main runway
    const runwayMaterial = new THREE.MeshBasicMaterial({ color: 0x2C3E50 });
    const runwayGeometry = new THREE.PlaneGeometry(7, 1.5);
    const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
    runway.rotation.x = -Math.PI / 2;
    runway.position.y = 0.31;
    group.add(runway);

    // Runway centerline
    const centerlineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const centerlineGeometry = new THREE.PlaneGeometry(6, 0.1);
    const centerline = new THREE.Mesh(centerlineGeometry, centerlineMaterial);
    centerline.rotation.x = -Math.PI / 2;
    centerline.position.y = 0.32;
    group.add(centerline);

    // Terminal building
    const terminalMaterial = new THREE.MeshPhongMaterial({ color: 0x34495E });
    const terminalGeometry = new THREE.BoxGeometry(2.5, 1.5, 1.5);
    const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
    terminal.position.set(2.5, 0.75, 2.5);
    group.add(terminal);

    // Control tower
    const towerMaterial = new THREE.MeshPhongMaterial({ color: 0x566573 });
    const towerGeometry = new THREE.BoxGeometry(0.6, 3.0, 0.6);
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(-2.5, 1.5, -2.5);
    group.add(tower);

    // Tower top
    const towerTopGeometry = new THREE.BoxGeometry(1.0, 0.5, 1.0);
    const towerTop = new THREE.Mesh(towerTopGeometry, towerMaterial);
    towerTop.position.set(-2.5, 3.25, -2.5);
    group.add(towerTop);

    // Add airport label
    ObjectFactory.addObjectLabel(group, group.userData.pddlObject?.name || type, 4.0);
  }

  /**
   * Create location object
   */
  private static createLocation(group: THREE.Group, type: string): void {
    // Simple platform to represent a location
    const locationMaterial = new THREE.MeshLambertMaterial({ color: 0x27AE60 });
    const locationGeometry = new THREE.BoxGeometry(4, 0.1, 4);
    const location = new THREE.Mesh(locationGeometry, locationMaterial);
    location.position.y = 0.05;
    group.add(location);

    // Add some buildings/structures
    const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0x7F8C8D });
    const buildingGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
    
    const buildingPositions = [
      [1.2, 0.75, 1.2], [-1.2, 0.75, 1.2], 
      [1.2, 0.75, -1.2], [-1.2, 0.75, -1.2]
    ];
    
    buildingPositions.forEach(pos => {
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(pos[0], pos[1], pos[2]);
      group.add(building);
    });

    // Add location label
    ObjectFactory.addObjectLabel(group, group.userData.pddlObject?.name || type, 2.0);
  }

  /**
   * Create city object (visual representation)
   */
  private static createCity(group: THREE.Group, type: string): void {
    // Large platform representing city area
    const cityMaterial = new THREE.MeshLambertMaterial({ color: 0x85929E });
    const cityGeometry = new THREE.BoxGeometry(8, 0.2, 8);
    const city = new THREE.Mesh(cityGeometry, cityMaterial);
    city.position.y = 0.1;
    group.add(city);

    // Multiple buildings to represent cityscape
    const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0x566573 });
    
    for (let i = 0; i < 8; i++) {
      const height = 1.0 + Math.random() * 2.0;
      const buildingGeometry = new THREE.BoxGeometry(0.6, height, 0.6);
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      
      const angle = (i / 8) * Math.PI * 2;
      const radius = 2.5;
      building.position.set(
        Math.cos(angle) * radius,
        height / 2,
        Math.sin(angle) * radius
      );
      group.add(building);
    }

    // Add city label
    ObjectFactory.addObjectLabel(group, group.userData.pddlObject?.name || type, 3.5);
  }

  /**
   * Add room label with bold, clear text and transparent background
   */
  private static addRoomLabel(group: THREE.Group, type: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    
    const context = canvas.getContext('2d')!;
    
    // Clear background (transparent)
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add black outline for better visibility
    context.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    context.lineWidth = 8;
    context.font = 'bold 56px Arial';
    context.textAlign = 'center';
    context.strokeText(type.toUpperCase(), canvas.width/2, canvas.height/2 + 20);
    
    // Main text - bold and white
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 56px Arial';
    context.textAlign = 'center';
    context.fillText(type.toUpperCase(), canvas.width/2, canvas.height/2 + 20);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
      alphaTest: 0.1
    });
    const labelGeometry = new THREE.PlaneGeometry(3.0, 0.8);
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, 3.5, 0);
    label.name = 'room_label';
    group.add(label);
  }

  /**
   * Add object label with bold, clear text and transparent background
   */
  private static addObjectLabel(group: THREE.Group, objectName: string, height: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    
    const context = canvas.getContext('2d')!;
    
    // Clear background (transparent)
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add black outline for better visibility
    context.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    context.lineWidth = 4;
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.strokeText(objectName.toUpperCase(), canvas.width/2, canvas.height/2 + 8);
    
    // Main text - bold and white
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.fillText(objectName.toUpperCase(), canvas.width/2, canvas.height/2 + 8);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
      alphaTest: 0.1
    });
    const labelGeometry = new THREE.PlaneGeometry(1.5, 0.4);
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, height, 0);
    label.name = 'object_label';
    group.add(label);
  }

  /**
   * Layout logistics domain objects in organized 3D space
   */
  private static layoutLogisticsDomain(
    airports: THREE.Group[], 
    locations: THREE.Group[], 
    cities: THREE.Group[], 
    vehicles: THREE.Group[], 
    packages: THREE.Group[]
  ): void {
    const spacing = 15;
    
    // Position cities first (largest objects)
    cities.forEach((city, index) => {
      city.position.set(
        index * spacing - (cities.length - 1) * spacing / 2,
        0,
        -20
      );
      console.log(`Positioned city ${city.userData.pddlObject.name} at (${city.position.x}, ${city.position.y}, ${city.position.z})`);
    });

    // Position airports in a line
    airports.forEach((airport, index) => {
      airport.position.set(
        index * spacing - (airports.length - 1) * spacing / 2,
        0,
        0
      );
      console.log(`Positioned airport ${airport.userData.pddlObject.name} at (${airport.position.x}, ${airport.position.y}, ${airport.position.z})`);
    });

    // Position locations in a line
    locations.forEach((location, index) => {
      location.position.set(
        index * spacing - (locations.length - 1) * spacing / 2,
        0,
        20
      );
      console.log(`Positioned location ${location.userData.pddlObject.name} at (${location.position.x}, ${location.position.y}, ${location.position.z})`);
    });

    // Position vehicles near their respective locations
    vehicles.forEach((vehicle, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      vehicle.position.set(
        col * 8 - 8,
        0,
        40 + row * 6
      );
      console.log(`Positioned vehicle ${vehicle.userData.pddlObject.name} at (${vehicle.position.x}, ${vehicle.position.y}, ${vehicle.position.z})`);
    });

    // Position packages in grid formation
    packages.forEach((pkg, index) => {
      const col = index % 6;
      const row = Math.floor(index / 6);
      pkg.position.set(
        col * 2 - 5,
        0,
        60 + row * 2
      );
      console.log(`Positioned package ${pkg.userData.pddlObject.name} at (${pkg.position.x}, ${pkg.position.y}, ${pkg.position.z})`);
    });
  }

  /**
   * Get type hierarchy for a given type
   */
  private static getTypeHierarchy(type: string, types: PDDLType[]): string[] {
    const hierarchy: string[] = [type];
    let currentType = type;
    
    while (currentType) {
      const typeObj = types.find(t => t.name === currentType);
      if (typeObj?.parent && typeObj.parent !== 'object') {
        hierarchy.push(typeObj.parent);
        currentType = typeObj.parent;
      } else {
        break;
      }
    }
    
    return hierarchy;
  }

  /**
   * Type checking methods - more dynamic type detection
   */
  private static isRobotType(hierarchy: string[]): boolean {
    const robotTypes = ['robot', 'agent', 'humanoid', 'eve', 'wally'];
    return hierarchy.some(t => robotTypes.includes(t.toLowerCase()));
  }

  private static isRoomType(hierarchy: string[]): boolean {
    const roomTypes = ['room', 'area', 'garden', 'location', 'place'];
    return hierarchy.some(t => roomTypes.includes(t.toLowerCase()));
  }

  private static isGardenType(hierarchy: string[]): boolean {
    const gardenTypes = ['garden', 'location', 'place'];
    return hierarchy.some(t => gardenTypes.includes(t.toLowerCase()));
  }

  private static isBallType(hierarchy: string[]): boolean {
    const ballTypes = ['ball', 'sphere', 'obj'];
    return hierarchy.some(t => ballTypes.includes(t.toLowerCase()));
  }

  private static isBoxType(hierarchy: string[]): boolean {
    const boxTypes = ['box', 'cube', 'container'];
    return hierarchy.some(t => boxTypes.includes(t.toLowerCase()));
  }

  // Logistics domain type checking methods
  private static isAirplaneType(hierarchy: string[]): boolean {
    const airplaneTypes = ['airplane', 'plane', 'aircraft', 'vehicle'];
    return hierarchy.some(t => airplaneTypes.includes(t.toLowerCase()));
  }

  private static isTruckType(hierarchy: string[]): boolean {
    const truckTypes = ['truck', 'vehicle'];
    return hierarchy.some(t => truckTypes.includes(t.toLowerCase()));
  }

  private static isPackageType(hierarchy: string[]): boolean {
    const packageTypes = ['package', 'physobj'];
    return hierarchy.some(t => packageTypes.includes(t.toLowerCase()));
  }

  private static isAirportType(hierarchy: string[]): boolean {
    const airportTypes = ['airport', 'place'];
    return hierarchy.some(t => airportTypes.includes(t.toLowerCase()));
  }

  private static isLocationTypeLogistics(hierarchy: string[]): boolean {
    const locationTypes = ['location'];
    return hierarchy.some(t => locationTypes.includes(t.toLowerCase()));
  }

  private static isCityType(hierarchy: string[]): boolean {
    const cityTypes = ['city'];
    return hierarchy.some(t => cityTypes.includes(t.toLowerCase()));
  }

  /**
   * Layout objects in a grid with proper room labels and organized arrangement
   */
  static layoutObjects(objects: THREE.Group[], roomSize: number = 4): void {
    // Categorize objects by domain type
    const robots = objects.filter(obj => obj.userData.pddlObject && 
      this.isRobotType(this.getTypeHierarchy(obj.userData.pddlObject.type, [])));
    
    const rooms = objects.filter(obj => obj.userData.pddlObject && 
      this.isRoomType(this.getTypeHierarchy(obj.userData.pddlObject.type, [])));
    
    // Logistics domain objects
    const airports = objects.filter(obj => obj.userData.pddlObject && 
      this.isAirportType(this.getTypeHierarchy(obj.userData.pddlObject.type, [])));
    
    const locations = objects.filter(obj => obj.userData.pddlObject && 
      this.isLocationTypeLogistics(this.getTypeHierarchy(obj.userData.pddlObject.type, [])));
    
    const cities = objects.filter(obj => obj.userData.pddlObject && 
      this.isCityType(this.getTypeHierarchy(obj.userData.pddlObject.type, [])));
    
    const vehicles = objects.filter(obj => obj.userData.pddlObject && 
      (this.isAirplaneType(this.getTypeHierarchy(obj.userData.pddlObject.type, [])) ||
       this.isTruckType(this.getTypeHierarchy(obj.userData.pddlObject.type, []))));
    
    const packages = objects.filter(obj => obj.userData.pddlObject && 
      this.isPackageType(this.getTypeHierarchy(obj.userData.pddlObject.type, [])));
    
    const items = objects.filter(obj => !robots.includes(obj) && !rooms.includes(obj) && 
      !airports.includes(obj) && !locations.includes(obj) && !cities.includes(obj) && 
      !vehicles.includes(obj) && !packages.includes(obj));

    console.log(`Laying out ${rooms.length} rooms, ${robots.length} robots, ${items.length} items, ${airports.length} airports, ${locations.length} locations, ${cities.length} cities, ${vehicles.length} vehicles, ${packages.length} packages`);

    // Handle logistics domain layout
    if (airports.length > 0 || locations.length > 0 || cities.length > 0) {
      ObjectFactory.layoutLogisticsDomain(airports, locations, cities, vehicles, packages);
      return;
    }

    // Robot domain layout
    rooms.sort((a, b) => a.userData.pddlObject.name.localeCompare(b.userData.pddlObject.name));

    const roomGridCols = Math.ceil(Math.sqrt(rooms.length));
    const roomGridRows = Math.ceil(rooms.length / roomGridCols);
    const roomSpacing = 12;
    
    rooms.forEach((room, index) => {
      // Calculate grid position
      const col = index % roomGridCols;
      const row = Math.floor(index / roomGridCols);
      
      // Center the grid
      const offsetX = -(roomGridCols - 1) * roomSpacing / 2;
      const offsetZ = -(roomGridRows - 1) * roomSpacing / 2;
      
      room.position.x = offsetX + col * roomSpacing;
      room.position.y = 0;
      room.position.z = offsetZ + row * roomSpacing;
      
      console.log(`Positioned room ${room.userData.pddlObject.name} at grid [${row},${col}] = (${room.position.x}, ${room.position.y}, ${room.position.z})`);
      
      // Store room boundaries for later use
      room.userData.bounds = {
        minX: room.position.x - 2.5,
        maxX: room.position.x + 2.5,
        minZ: room.position.z - 2.5,
        maxZ: room.position.z + 2.5
      };

      // Update room label to show the actual room name
      this.updateRoomLabel(room, room.userData.pddlObject.name.toUpperCase());
    });

    // Create organized matrix layout for robots and items when not positioned by PDDL facts
    const objectSpacing = 3.0;
    
    // Position robots in a matrix grid
    if (robots.length > 0) {
      const robotGridCols = Math.ceil(Math.sqrt(robots.length));
      const robotGridRows = Math.ceil(robots.length / robotGridCols);
      const robotOffsetX = -(robotGridCols - 1) * objectSpacing / 2;
      const robotOffsetZ = -(robotGridRows - 1) * objectSpacing / 2;
      const robotBaseZ = (roomGridRows * roomSpacing / 2) + 8; // Position below room grid
      
      robots.forEach((robot, index) => {
        const col = index % robotGridCols;
        const row = Math.floor(index / robotGridCols);
        
        robot.position.set(
          robotOffsetX + col * objectSpacing,
          0,
          robotBaseZ + robotOffsetZ + row * objectSpacing
        );
        console.log(`Positioned robot ${robot.userData.pddlObject.name} in matrix [${row},${col}] at (${robot.position.x}, ${robot.position.y}, ${robot.position.z})`);
      });
    }

    // Position items in a matrix grid
    if (items.length > 0) {
      const itemGridCols = Math.ceil(Math.sqrt(items.length));
      const itemGridRows = Math.ceil(items.length / itemGridCols);
      const itemOffsetX = -(itemGridCols - 1) * objectSpacing / 2;
      const itemOffsetZ = -(itemGridRows - 1) * objectSpacing / 2;
      const itemBaseZ = (roomGridRows * roomSpacing / 2) + 15; // Position further below robots
      
      items.forEach((item, index) => {
        const col = index % itemGridCols;
        const row = Math.floor(index / itemGridCols);
        
        item.position.set(
          itemOffsetX + col * objectSpacing,
          0.3, // Slightly elevated for visibility
          itemBaseZ + itemOffsetZ + row * objectSpacing
        );
        console.log(`Positioned item ${item.userData.pddlObject.name} in matrix [${row},${col}] at (${item.position.x}, ${item.position.y}, ${item.position.z})`);
      });
    }
  }

  /**
   * Update room label with the actual room name
   */
  static updateRoomLabel(group: THREE.Group, roomName: string): void {
    // Remove existing label if any
    const existingLabel = group.getObjectByName('room_label');
    if (existingLabel) {
      group.remove(existingLabel);
    }

    // Create new label
    this.addRoomLabel(group, roomName);
  }

  /**
   * Create articulated arm with proper joint hierarchy for IK
   */
  static createArticulatedArm(group: THREE.Group, material: THREE.Material, side: 'left' | 'right', xOffset: number): void {
    const sideMultiplier = side === 'left' ? -1 : 1;
    
    // Shoulder joint (root of the arm chain)
    const shoulderGeometry = new THREE.SphereGeometry(0.08, 12, 8);
    const shoulder = new THREE.Mesh(shoulderGeometry, material);
    shoulder.position.set(xOffset, 1.3, 0);
    shoulder.name = `${side}_shoulder`;
    group.add(shoulder);

    // Upper arm (child of shoulder)
    const upperArmGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12);
    const upperArm = new THREE.Mesh(upperArmGeometry, material);
    upperArm.position.set(0, -0.15, 0); // Relative to shoulder
    upperArm.name = `${side}_upper_arm`;
    shoulder.add(upperArm);

    // Elbow joint (child of upper arm)
    const elbowGeometry = new THREE.SphereGeometry(0.06, 12, 8);
    const elbow = new THREE.Mesh(elbowGeometry, material);
    elbow.position.set(0, -0.15, 0); // Relative to upper arm
    elbow.name = `${side}_elbow`;
    upperArm.add(elbow);

    // Lower arm (child of elbow)
    const lowerArmGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 12);
    const lowerArm = new THREE.Mesh(lowerArmGeometry, material);
    lowerArm.position.set(0, -0.125, 0); // Relative to elbow
    lowerArm.name = `${side}_lower_arm`;
    elbow.add(lowerArm);

    // Hand (child of lower arm)
    const handGeometry = new THREE.SphereGeometry(0.06, 12, 8);
    const hand = new THREE.Mesh(handGeometry, material);
    hand.position.set(0, -0.125, 0); // Relative to lower arm
    hand.name = `${side}_hand`;
    lowerArm.add(hand);

    // Set initial arm pose (natural hanging position)
    shoulder.rotation.z = sideMultiplier * Math.PI / 8;
    elbow.rotation.z = sideMultiplier * Math.PI / 6;
  }

  /**
   * Clean up cached resources
   */
  static dispose(): void {
    this.materialCache.forEach(material => material.dispose());
    this.geometryCache.forEach(geometry => geometry.dispose());
    this.materialCache.clear();
    this.geometryCache.clear();
  }
}