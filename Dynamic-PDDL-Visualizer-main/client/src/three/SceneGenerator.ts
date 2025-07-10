/**
 * Scene Generator - High-level scene generation from PDDL data
 * Orchestrates the creation of complete 3D scenes from parsed PDDL files
 */

import { PDDLDomain, PDDLProblem, Plan, SceneObject } from '../types/pddl';
import { ObjectFactory } from './ObjectFactory';

export class SceneGenerator {
  /**
   * Generate complete scene objects from PDDL data
   */
  static async generateScene(
    domain: PDDLDomain, 
    problem: PDDLProblem, 
    plan: Plan
  ): Promise<SceneObject[]> {
    console.log('SceneGenerator: Analyzing PDDL problem structure...');
    
    // Analyze problem type from domain requirements
    const requirements = domain.requirements || [];
    let problemType = 'classical';
    
    if (requirements.includes(':durative-actions') || requirements.includes(':duration-inequalities')) {
      problemType = 'temporal';
    }
    if (requirements.includes(':numeric-fluents') || requirements.includes(':fluents')) {
      problemType = 'numerical';
    }
    if (requirements.includes(':continuous-effects') || requirements.includes(':time')) {
      problemType = 'pddl+';
    }
    
    console.log(`Detected PDDL problem type: ${problemType}`);
    console.log('Domain requirements:', requirements);
    console.log('Domain types:', domain.types?.map(t => `${t.name}${t.parent ? ` -> ${t.parent}` : ''}`));
    
    // Analyze object types and predicates
    const objects = problem.objects || [];
    const predicates = domain.predicates || [];
    const actions = domain.actions || [];
    
    console.log('PDDL Objects to create:', objects.map(obj => `${obj.name} (${obj.type})`));
    console.log('Domain predicates:', predicates.map(p => p.name));
    console.log('Domain actions:', actions.map(a => a.name));
    
    // Determine domain category from object types and actions
    let domainCategory = 'unknown';
    const objectTypes = new Set(objects.map(obj => obj.type.toLowerCase()));
    const actionNames = actions.map(a => a.name.toLowerCase());
    
    // Check for robot manipulation domain
    if (objectTypes.has('robot') || objectTypes.has('agent') || 
        actionNames.some(a => a.includes('pick') || a.includes('drop') || a.includes('move'))) {
      domainCategory = 'robot-manipulation';
    }
    
    // Check for logistics domain
    if (objectTypes.has('truck') || objectTypes.has('airplane') || objectTypes.has('package') ||
        objectTypes.has('airport') || objectTypes.has('city') ||
        actionNames.some(a => a.includes('load') || a.includes('fly') || a.includes('drive'))) {
      domainCategory = 'logistics';
    }
    
    // Check for garden/location domain (PDDL+ temporal robot)
    if (objects.some(obj => obj.name.includes('garden')) ||
        actionNames.some(a => a.includes('charge') || a.includes('startmove')) ||
        predicates.some(p => p.name.includes('path') || p.name.includes('free'))) {
      domainCategory = 'robot-garden';
    }
    
    console.log(`Detected domain category: ${domainCategory}`);
    console.log('Domain name:', domain.name);
    console.log('Problem name:', problem.name);
    
    const sceneObjects: SceneObject[] = [];
    
    try {
      // Create 3D objects for each PDDL object based on detected domain
      for (const pddlObject of objects) {
        console.log(`Creating object: ${pddlObject.name} (${pddlObject.type}), hierarchy: ${this.getTypeHierarchy(pddlObject.type, domain.types)}`);
        
        const mesh = ObjectFactory.createObjectMesh(pddlObject, domain.types);
        
        // Create scene object record
        const sceneObject: SceneObject = {
          id: pddlObject.name,
          name: pddlObject.name,
          type: pddlObject.type,
          position: { 
            x: mesh.position.x, 
            y: mesh.position.y, 
            z: mesh.position.z 
          },
          rotation: { 
            x: mesh.rotation.x, 
            y: mesh.rotation.y, 
            z: mesh.rotation.z 
          },
          scale: { 
            x: mesh.scale.x, 
            y: mesh.scale.y, 
            z: mesh.scale.z 
          },
          meshId: mesh.uuid,
          properties: { 
            ...pddlObject.properties || {},
            domainCategory,
            problemType
          }
        };
        
        sceneObjects.push(sceneObject);
      }
      
      // Apply domain-specific layout
      this.layoutSceneObjects(sceneObjects, domain.types, domainCategory);
      
      // Position objects based on initial facts
      this.applyInitialPositioning(sceneObjects, problem.init);
      
      console.log(`SceneGenerator: Successfully generated ${sceneObjects.length} scene objects`);
      
    } catch (error) {
      console.error('SceneGenerator: Error generating scene:', error);
      throw new Error(`Failed to generate scene: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return sceneObjects;
  }
  
  /**
   * Apply intelligent layout to scene objects based on domain category
   */
  private static layoutSceneObjects(sceneObjects: SceneObject[], types: any[], domainCategory: string): void {
    console.log(`Laying out ${sceneObjects.length} objects for ${domainCategory} domain`);
    
    // Domain-specific layout strategies
    switch (domainCategory) {
      case 'robot-garden':
        this.layoutGardenDomain(sceneObjects);
        break;
      case 'logistics':
        this.layoutLogisticsDomain(sceneObjects);
        break;
      case 'robot-manipulation':
        this.layoutRobotManipulationDomain(sceneObjects);
        break;
      default:
        this.layoutGenericDomain(sceneObjects);
        break;
    }
  }

  /**
   * Layout garden domain objects (gardens, robots, objects)
   */
  private static layoutGardenDomain(sceneObjects: SceneObject[]): void {
    const gardens = sceneObjects.filter(obj => obj.name.includes('garden'));
    const robots = sceneObjects.filter(obj => obj.type.toLowerCase().includes('robot'));
    const objects = sceneObjects.filter(obj => !gardens.includes(obj) && !robots.includes(obj));
    
    console.log(`Garden layout: ${gardens.length} gardens, ${robots.length} robots, ${objects.length} objects`);
    
    // Position gardens side by side
    gardens.forEach((garden, index) => {
      garden.position.x = index * 12 - (gardens.length - 1) * 6; // Center gardens
      garden.position.y = 0;
      garden.position.z = 0;
      console.log(`Positioned garden ${garden.name} at (${garden.position.x}, ${garden.position.y}, ${garden.position.z})`);
    });

    // Position robots near first garden initially
    robots.forEach((robot, index) => {
      robot.position.x = gardens.length > 0 ? gardens[0].position.x : 0; // Start at first garden
      robot.position.y = 0;
      robot.position.z = 3 + index * 2;
      console.log(`Positioned robot ${robot.name} at (${robot.position.x}, ${robot.position.y}, ${robot.position.z})`);
    });

    // Position objects in gardens
    objects.forEach((object, index) => {
      const gardenIndex = index % Math.max(gardens.length, 1);
      object.position.x = gardens[gardenIndex]?.position.x || 0;
      object.position.y = 0.3; // Slightly above ground
      object.position.z = (index - gardenIndex) * 0.5; // Spread within garden
      console.log(`Positioned object ${object.name} at (${object.position.x}, ${object.position.y}, ${object.position.z})`);
    });
  }

  /**
   * Layout logistics domain objects with roads and flight paths
   */
  private static layoutLogisticsDomain(sceneObjects: SceneObject[]): void {
    const airports = sceneObjects.filter(obj => obj.type.toLowerCase().includes('airport'));
    const cities = sceneObjects.filter(obj => obj.type.toLowerCase().includes('city'));
    const trucks = sceneObjects.filter(obj => obj.type.toLowerCase().includes('truck'));
    const airplanes = sceneObjects.filter(obj => obj.type.toLowerCase().includes('airplane'));
    const packages = sceneObjects.filter(obj => obj.type.toLowerCase().includes('package'));
    const locations = sceneObjects.filter(obj => 
      !airports.includes(obj) && !cities.includes(obj) && 
      !trucks.includes(obj) && !airplanes.includes(obj) && !packages.includes(obj)
    );
    
    console.log(`Logistics layout: ${cities.length} cities, ${airports.length} airports, ${locations.length} locations, ${trucks.length} trucks, ${airplanes.length} airplanes`);
    
    const spacing = 25; // Increased spacing for roads
    
    // Position cities in a line
    cities.forEach((city, index) => {
      city.position.x = index * spacing - (cities.length - 1) * spacing / 2;
      city.position.z = -25;
      city.position.y = 0;
      console.log(`Positioned city ${city.name} at (${city.position.x}, ${city.position.y}, ${city.position.z})`);
    });

    // Position airports parallel to cities
    airports.forEach((airport, index) => {
      airport.position.x = index * spacing - (airports.length - 1) * spacing / 2;
      airport.position.z = 0;
      airport.position.y = 0;
      console.log(`Positioned airport ${airport.name} at (${airport.position.x}, ${airport.position.y}, ${airport.position.z})`);
    });

    // Position locations (pos1, pos2, etc.) in cities
    locations.forEach((location, index) => {
      const cityIndex = index % cities.length;
      const city = cities[cityIndex];
      if (city) {
        location.position.x = city.position.x + (index - cityIndex) * 3; // Offset within city
        location.position.z = city.position.z + 8; // Slightly forward from city
        location.position.y = 0;
        console.log(`Positioned location ${location.name} at (${location.position.x}, ${location.position.y}, ${location.position.z})`);
      }
    });

    // Position airplanes at airports initially
    airplanes.forEach((airplane, index) => {
      const airportIndex = index % airports.length;
      const airport = airports[airportIndex];
      if (airport) {
        airplane.position.x = airport.position.x + (index - airportIndex) * 4;
        airplane.position.z = airport.position.z - 3; // On runway
        airplane.position.y = 0.5; // Slightly elevated
        console.log(`Positioned airplane ${airplane.name} at (${airplane.position.x}, ${airplane.position.y}, ${airplane.position.z})`);
      }
    });

    // Position trucks at locations initially
    trucks.forEach((truck, index) => {
      const locationIndex = index % locations.length;
      const location = locations[locationIndex] || cities[index % cities.length];
      if (location) {
        truck.position.x = location.position.x + (index - locationIndex) * 2;
        truck.position.z = location.position.z + 2;
        truck.position.y = 0;
        console.log(`Positioned truck ${truck.name} at (${truck.position.x}, ${truck.position.y}, ${truck.position.z})`);
      }
    });

    // Position packages at locations
    packages.forEach((pkg, index) => {
      const locationIndex = index % locations.length;
      const location = locations[locationIndex] || cities[index % cities.length];
      if (location) {
        pkg.position.x = location.position.x + (index % 3 - 1) * 0.5;
        pkg.position.z = location.position.z + 1;
        pkg.position.y = 0.2;
        console.log(`Positioned package ${pkg.name} at (${pkg.position.x}, ${pkg.position.y}, ${pkg.position.z})`);
      }
    });

    // Create road network connecting cities and airports
    this.createRoadNetwork(cities, airports, locations);
  }

  /**
   * Create road network connecting logistics locations
   */
  private static createRoadNetwork(cities: SceneObject[], airports: SceneObject[], locations: SceneObject[]): void {
    console.log('Creating road network...');
    
    // This will be handled by the SceneManager to add road meshes to the scene
    // Store road data for later rendering
    const roadSegments: Array<{from: SceneObject, to: SceneObject}> = [];
    
    // Connect each city to its corresponding airport
    cities.forEach((city, index) => {
      if (airports[index]) {
        roadSegments.push({from: city, to: airports[index]});
      }
    });
    
    // Connect locations to their cities
    locations.forEach((location, index) => {
      const cityIndex = index % cities.length;
      if (cities[cityIndex]) {
        roadSegments.push({from: location, to: cities[cityIndex]});
      }
    });
    
    // Store road data for SceneManager to render
    (window as any).logisticsRoadSegments = roadSegments;
    console.log(`Created ${roadSegments.length} road segments`);
  }

  /**
   * Layout robot manipulation domain objects
   */
  private static layoutRobotManipulationDomain(sceneObjects: SceneObject[]): void {
    const rooms = sceneObjects.filter(obj => obj.type.toLowerCase().includes('room'));
    const robots = sceneObjects.filter(obj => obj.type.toLowerCase().includes('robot'));
    const objects = sceneObjects.filter(obj => !rooms.includes(obj) && !robots.includes(obj));
    
    // Grid layout for rooms
    const roomGridCols = Math.ceil(Math.sqrt(rooms.length));
    const roomSpacing = 12;
    
    rooms.forEach((room, index) => {
      const col = index % roomGridCols;
      const row = Math.floor(index / roomGridCols);
      room.position.x = col * roomSpacing - (roomGridCols - 1) * roomSpacing / 2;
      room.position.z = row * roomSpacing;
    });

    robots.forEach((robot, index) => {
      robot.position.x = index * 3;
      robot.position.z = (rooms.length > 0 ? roomGridCols * roomSpacing : 0) + 8;
    });

    objects.forEach((object, index) => {
      object.position.x = (index % 5) * 2 - 4;
      object.position.z = (rooms.length > 0 ? roomGridCols * roomSpacing : 0) + 15 + Math.floor(index / 5) * 2;
    });
  }

  /**
   * Layout generic domain objects
   */
  private static layoutGenericDomain(sceneObjects: SceneObject[]): void {
    // Simple grid layout
    const cols = Math.ceil(Math.sqrt(sceneObjects.length));
    sceneObjects.forEach((obj, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      obj.position.x = col * 4 - (cols - 1) * 2;
      obj.position.z = row * 4;
    });
  }
  
  /**
   * Layout rooms in an intelligent grid pattern
   */
  private static layoutRooms(rooms: SceneObject[]): void {
    if (rooms.length === 0) return;
    
    const gridSize = Math.ceil(Math.sqrt(rooms.length));
    const spacing = 6; // Distance between room centers
    
    rooms.forEach((room, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      
      // Center the grid
      const offsetX = (gridSize - 1) * spacing / 2;
      const offsetZ = (gridSize - 1) * spacing / 2;
      
      room.position.x = col * spacing - offsetX;
      room.position.y = 0;
      room.position.z = row * spacing - offsetZ;
    });
  }
  
  /**
   * Apply initial positioning based on PDDL facts
   */
  private static applyInitialPositioning(sceneObjects: SceneObject[], initFacts: any[]): void {
    console.log('Applying initial positioning from facts:', initFacts);
    
    // Create lookup map for quick object access
    const objectMap = new Map<string, SceneObject>();
    sceneObjects.forEach(obj => objectMap.set(obj.name, obj));
    
    console.log('Available objects:', Array.from(objectMap.keys()));
    
    // Process position facts
    initFacts.forEach(fact => {
      console.log('Processing fact:', fact);
      
      if (fact.predicate === 'at-robot' || fact.predicate === 'at' || fact.predicate === 'at-obj') {
        const objectName = fact.args[0];
        const locationName = fact.args[1];
        
        const object = objectMap.get(objectName);
        const location = objectMap.get(locationName);
        
        console.log(`Looking for object: ${objectName}, location: ${locationName}`);
        console.log(`Found object: ${!!object}, found location: ${!!location}`);
        
        if (object && location) {
          // Position object at location with small random offset
          const offsetX = (Math.random() - 0.5) * 1.0;
          const offsetZ = (Math.random() - 0.5) * 1.0;
          
          object.position.x = location.position.x + offsetX;
          object.position.z = location.position.z + offsetZ;
          object.position.y = location.position.y + 0.2; // Slightly above ground
          
          console.log(`Successfully positioned ${objectName} at ${locationName} (${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)})`);
        } else {
          console.warn(`Failed to position ${objectName} at ${locationName} - object: ${!!object}, location: ${!!location}`);
        }
      }
    });
  }
  
  /**
   * Check if type is a room type
   */
  private static isRoomType(type: string, types: any[]): boolean {
    const typeHierarchy = this.getTypeHierarchy(type, types);
    return typeHierarchy.some(t => ['room', 'location', 'place', 'area'].includes(t.toLowerCase()));
  }
  
  /**
   * Check if type is a robot type
   */
  private static isRobotType(type: string, types: any[]): boolean {
    const typeHierarchy = this.getTypeHierarchy(type, types);
    return typeHierarchy.some(t => ['robot', 'agent', 'humanoid'].includes(t.toLowerCase()));
  }
  
  /**
   * Get type hierarchy for a given type
   */
  private static getTypeHierarchy(type: string, types: any[]): string[] {
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
   * Validate scene generation requirements
   */
  static validateGenerationRequirements(
    domain: PDDLDomain, 
    problem: PDDLProblem, 
    plan: Plan
  ): string[] {
    const errors: string[] = [];
    
    if (!domain) {
      errors.push('Domain is required for scene generation');
    }
    
    if (!problem) {
      errors.push('Problem is required for scene generation');
    }
    
    if (!plan) {
      errors.push('Plan is required for scene generation');
    }
    
    if (problem && problem.objects.length === 0) {
      errors.push('Problem must contain objects to generate scene');
    }
    
    if (domain && problem) {
      // Check for unknown object types
      const domainTypes = new Set(domain.types.map(t => t.name));
      domainTypes.add('object'); // Built-in type
      
      problem.objects.forEach(obj => {
        if (!domainTypes.has(obj.type)) {
          errors.push(`Unknown object type: ${obj.type} for object ${obj.name}`);
        }
      });
    }
    
    return errors;
  }
  
  /**
   * Generate scene statistics
   */
  static generateSceneStats(sceneObjects: SceneObject[]): Record<string, any> {
    const typeGroups: Record<string, number> = {};
    
    sceneObjects.forEach(obj => {
      typeGroups[obj.type] = (typeGroups[obj.type] || 0) + 1;
    });
    
    return {
      totalObjects: sceneObjects.length,
      typeDistribution: typeGroups,
      boundingBox: this.calculateBoundingBox(sceneObjects)
    };
  }
  
  /**
   * Calculate bounding box of all scene objects
   */
  private static calculateBoundingBox(sceneObjects: SceneObject[]): {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  } {
    if (sceneObjects.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 }
      };
    }
    
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    sceneObjects.forEach(obj => {
      minX = Math.min(minX, obj.position.x);
      minY = Math.min(minY, obj.position.y);
      minZ = Math.min(minZ, obj.position.z);
      maxX = Math.max(maxX, obj.position.x);
      maxY = Math.max(maxY, obj.position.y);
      maxZ = Math.max(maxZ, obj.position.z);
    });
    
    return {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ }
    };
  }
}
