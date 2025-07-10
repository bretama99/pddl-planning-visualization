// services/planParser.js
export function parsePlanFile(content, pddlType) {
  console.log('=== PARSING PLAN FILE ===');
  console.log('PDDL Type:', pddlType);
  
  // Check if this is a domain/problem file instead of a plan
  if (content.includes('(define (domain') || content.includes('(define (problem')) {
    return {
      actions: [],
      entities: {},
      error: 'This appears to be a domain/problem file, not a plan. Please upload the generated plan file.'
    };
  }
  
  // Clean content - remove planner output noise
  const cleanLines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => 
      line.length > 0 && 
      !line.startsWith(';') && 
      !line.startsWith('//') && 
      !line.startsWith('*') &&
      !line.startsWith('#') &&
      !line.includes('domain parsed') &&
      !line.includes('problem parsed') &&
      !line.includes('grounding') &&
      !line.includes('planning time') &&
      !line.includes('plan-length') &&
      !line.includes('metric') &&
      !line.includes('expanded nodes') &&
      !line.includes('|f|') &&
      !line.includes('g(n)=') &&
      !line.includes('h(n)=') &&
      !line.includes('problem solved') &&
      !line.includes('found plan:') &&
      !line.includes('heuristic time') &&
      !line.includes('search time') &&
      !line.includes('states evaluated') &&
      !line.includes('dead-ends detected') &&
      !line.includes('duplicates detected')
    );
  
  const actions = [];
  const entities = {
    robots: new Set(),
    rooms: new Set(), 
    floors: new Set(),
    objects: new Set(),
    packages: new Set(),
    passengers: new Set(),
    elevators: new Set(),
    vehicles: new Set(),
    locations: new Set()
  };
  
  // Parse actions in format: "0.0: (action-name param1 param2 ...)"
  cleanLines.forEach((line) => {
    const match = line.match(/^(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)/);
    
    if (match) {
      const time = parseFloat(match[1]);
      const actionContent = match[2].trim();
      const parts = actionContent.split(/\s+/);
      
      if (parts.length > 0) {
        const actionType = parts[0];
        const params = parts.slice(1);
        
        // Create action object
        const action = {
          time: time,
          type: actionType,
          params: params,
          raw: actionContent
        };
        
        actions.push(action);
        
        // Extract entities dynamically based on action patterns
        extractEntitiesFromAction(action, entities);
      }
    }
  });
  
  // Convert Sets to Arrays for final result
  const finalEntities = {};
  for (const [key, value] of Object.entries(entities)) {
    finalEntities[key] = Array.from(value);
  }
  
  console.log('=== PARSING COMPLETE ===');
  console.log('Actions found:', actions.length);
  console.log('Entities found:', finalEntities);
  
  return {
    actions,
    entities: finalEntities
  };
}

function extractEntitiesFromAction(action, entities) {
  const { type, params } = action;
  const actionType = type.toLowerCase();
  
  // Dynamic entity extraction based on action patterns
  params.forEach((param) => {
    const paramLower = param.toLowerCase();
    
    // Detect entity types by naming patterns
    if (paramLower.includes('robot') || paramLower.includes('wally') || paramLower.includes('eve')) {
      entities.robots.add(param);
    }
    else if (paramLower.includes('elevator') || paramLower.includes('lift')) {
      entities.elevators.add(param);
    }
    else if (paramLower.includes('person') || paramLower.includes('passenger')) {
      entities.passengers.add(param);
    }
    else if (paramLower.includes('floor') || paramLower.includes('f') && /f\d+/.test(paramLower)) {
      entities.floors.add(param);
    }
    else if (paramLower.includes('room')) {
      entities.rooms.add(param);
    }
    else if (paramLower.includes('ball') || paramLower.includes('box') || paramLower.includes('item')) {
      entities.objects.add(param);
    }
    else if (paramLower.includes('package') || paramLower.includes('cargo')) {
      entities.packages.add(param);
    }
    else if (paramLower.includes('truck') || paramLower.includes('plane') || paramLower.includes('ship') || paramLower.includes('vehicle')) {
      entities.vehicles.add(param);
    }
    else if (paramLower.includes('city') || paramLower.includes('location') || paramLower.includes('warehouse') || paramLower.includes('airport')) {
      entities.locations.add(param);
    }
  });
  
  // Action-specific entity extraction patterns
  switch (actionType) {
    // Robot actions
    case 'pick':
    case 'drop':
      if (params[0]) entities.objects.add(params[0]);
      if (params[1]) entities.rooms.add(params[1]);
      if (params[2]) entities.robots.add(params[2]);
      break;
      
    case 'move':
      if (actionType === 'move' && params.length >= 3) {
        // Could be robot move or elevator move
        if (params[0] && params[0].toLowerCase().includes('elevator')) {
          entities.elevators.add(params[0]);
        } else {
          entities.robots.add(params[0]);
          entities.rooms.add(params[1]);
          entities.rooms.add(params[2]);
        }
      }
      break;
      
    // Elevator actions  
    case 'move-up':
    case 'move-down':
      if (params[0]) entities.elevators.add(params[0]);
      break;
    case 'load':
    case 'unload':
      if (params[0] && params[0].toLowerCase().includes('person')) {
        entities.passengers.add(params[0]);
        if (params[1]) entities.elevators.add(params[1]);
      } else {
        // Logistics load/unload
        if (params[0]) entities.packages.add(params[0]);
        if (params[1]) entities.vehicles.add(params[1]);
        if (params[2]) entities.locations.add(params[2]);
      }
      break;
      
    case 'board':
    case 'enter':
      if (params[0]) entities.passengers.add(params[0]);
      if (params[1]) entities.elevators.add(params[1]);
      if (params[2]) entities.floors.add(params[2]);
      break;
      
    case 'leave':
    case 'exit':
      if (params[0]) entities.passengers.add(params[0]);
      if (params[1]) entities.elevators.add(params[1]);
      if (params[2]) entities.floors.add(params[2]);
      break;
      
    case 'reached':
      if (params[0]) entities.passengers.add(params[0]);
      break;
      
    // Logistics actions
    case 'drive':
    case 'fly':
      if (params[0]) entities.vehicles.add(params[0]);
      if (params[1]) entities.locations.add(params[1]);
      if (params[2]) entities.locations.add(params[2]);
      break;
  }
}

// Analyze initial state for any domain
export function analyzeInitialState(actions, entities) {
  console.log('=== ANALYZING INITIAL STATE ===');
  
  const initialState = {
    objectLocations: new Map(),
    passengerLocations: new Map(),
    packageLocations: new Map(),
    vehicleLocations: new Map(),
    elevatorPositions: new Map()
  };
  
  // Find initial object locations from first pick actions
  entities.objects?.forEach(objectId => {
    const firstPickAction = actions.find(action => 
      action.type === 'pick' && action.params.includes(objectId)
    );
    if (firstPickAction && firstPickAction.params[1]) {
      initialState.objectLocations.set(objectId, firstPickAction.params[1]);
    }
  });
  
  // Find initial passenger locations from first load actions
  entities.passengers?.forEach(passengerId => {
    const firstLoadAction = actions.find(action => 
      action.type === 'load' && action.params[0] === passengerId
    );
    if (firstLoadAction) {
      // For elevator: passenger starts at current elevator position
      // We'll determine this from move actions before the load
      initialState.passengerLocations.set(passengerId, 'ground-floor');
    }
  });
  
  // Find initial package locations
  entities.packages?.forEach(packageId => {
    const firstLoadAction = actions.find(action => 
      action.type === 'load' && action.params[0] === packageId
    );
    if (firstLoadAction && firstLoadAction.params[2]) {
      initialState.packageLocations.set(packageId, firstLoadAction.params[2]);
    }
  });
  
  // Set initial elevator positions
  entities.elevators?.forEach(elevatorId => {
    initialState.elevatorPositions.set(elevatorId, entities.floors?.[0] || 'floor-1');
  });
  
  // Set initial vehicle positions  
  entities.vehicles?.forEach(vehicleId => {
    initialState.vehicleLocations.set(vehicleId, entities.locations?.[0] || 'location-1');
  });
  
  console.log('Initial state analysis complete:', initialState);
  return initialState;
}

// Get domain type from actions
export function detectDomainType(actions, entities) {
  const actionTypes = new Set(actions.map(a => a.type.toLowerCase()));
  
  if (actionTypes.has('move-up') || actionTypes.has('move-down') || entities.elevators?.length > 0) {
    return 'elevator';
  } else if (actionTypes.has('drive') || actionTypes.has('fly') || entities.vehicles?.length > 0) {
    return 'logistics';
  } else if (actionTypes.has('pick') || actionTypes.has('drop') || entities.robots?.length > 0) {
    return 'robot';
  }
  
  return 'unknown';
}