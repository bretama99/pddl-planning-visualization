// File Path: src/utils/domainParsers.js
// Domain-Specific PDDL Parsers for Robot, Elevator, and Logistics domains
// Each parser handles all PDDL types: classical, temporal, numerical, pddl+

// ============================================================================
// ROBOT DOMAIN PARSER - UNCHANGED - PRESERVED EXACTLY AS IS
// ============================================================================
export function parseRobotDomain(rawContent, pddlType = 'classical') {
  console.log('🤖 Robot Domain Parser started...', { pddlType, contentLength: rawContent.length });
  
  try {
    const lines = rawContent.split('\n').map(line => line.trim()).filter(line => line);
    const result = {
      actions: [],
      entities: {
        robots: [],
        rooms: [],
        objects: [],
        locations: []
      },
      metrics: {},
      pddlType: pddlType,
      domain: 'robot',
      error: null
    };

    let actionIndex = 0;

    for (const line of lines) {
      // Skip empty lines, comments, and planner output
      if (!line || line.startsWith(';') || line.startsWith('#') ||
          line.includes('domain parsed') || line.includes('problem parsed') ||
          line.includes('grounding') || line.includes('planning time') ||
          line.includes('plan-length') || line.includes('metric') ||
          line.includes('expanded nodes') || line.includes('found plan:') ||
          line.includes('problem solved') || line.includes('g(n)=') ||
          line.includes('h(n)=') || line.includes('search time') ||
          line.includes('states evaluated')) {
        continue;
      }
      
      // Parse any line that looks like an action
      if (line.includes('(') || line.match(/^\d+/) || 
          line.includes('pick') || line.includes('drop') || line.includes('move')) {
        const action = parseRobotAction(line, pddlType, actionIndex);
        if (action) {
          result.actions.push(action);
          extractRobotEntities(action, result.entities);
          console.log(`🤖 Parsed: ${action.name} -> actionType: ${action.actionType}, robot: ${action.robot}`);
          actionIndex++;
        }
      }
      
      // Parse statistics
      parseStatistics(line, result.metrics);
    }
    
    // Ensure we have minimum entities if none were found
    if (result.entities.robots.length === 0 && result.actions.length > 0) {
      // Extract from actions instead of hardcoding
      result.actions.forEach(action => {
        if (action.robot && !result.entities.robots.includes(action.robot)) {
          result.entities.robots.push(action.robot);
        }
      });
    }
    
    if (result.entities.rooms.length === 0 && result.actions.length > 0) {
      // Extract from actions instead of hardcoding
      result.actions.forEach(action => {
        if (action.room && !result.entities.rooms.includes(action.room)) {
          result.entities.rooms.push(action.room);
        }
        if (action.fromRoom && !result.entities.rooms.includes(action.fromRoom)) {
          result.entities.rooms.push(action.fromRoom);
        }
        if (action.toRoom && !result.entities.rooms.includes(action.toRoom)) {
          result.entities.rooms.push(action.toRoom);
        }
      });
    }
    
    if (result.entities.objects.length === 0 && result.actions.length > 0) {
      // Extract from actions instead of hardcoding
      result.actions.forEach(action => {
        if (action.object && !result.entities.objects.includes(action.object)) {
          result.entities.objects.push(action.object);
        }
      });
    }
    
    result.entities.locations = [...result.entities.rooms];
    
    // Calculate total duration based on PDDL type
    if (result.actions.length > 0) {
      const lastAction = result.actions[result.actions.length - 1];
      switch (pddlType) {
        case 'temporal':
        case 'pddl_plus':
          result.totalDuration = Math.max(...result.actions.map(a => a.end || a.time + 1));
          break;
        case 'numerical':
          result.totalCost = result.actions.reduce((sum, a) => sum + (a.cost || 1), 0);
          result.totalDuration = lastAction.time || result.actions.length;
          break;
        default:
          result.totalDuration = lastAction.time || result.actions.length;
      }
    }
    
    console.log('✅ Robot parsing complete:', {
      actions: result.actions.length,
      robots: result.entities.robots,
      rooms: result.entities.rooms,
      objects: result.entities.objects
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Robot parsing error:', error);
    return {
      actions: [],
      entities: { robots: [], rooms: [], objects: [], locations: [] },
      metrics: {},
      pddlType,
      domain: 'robot',
      error: `Robot parser error: ${error.message}`
    };
  }
}

function parseRobotAction(line, pddlType, index) {
  let actionMatch;
  
  console.log(`🔍 Parsing robot line: "${line}"`);
  
  // Try different parsing patterns
  // Pattern 1: "0.000: (action param1 param2) [duration]"
  actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[(?:D:)?(\d+(?:\.\d+)?)\])?/);
  if (actionMatch) {
    const [, timeStr, actionStr, durationStr] = actionMatch;
    return createRobotAction(parseFloat(timeStr), actionStr, parseFloat(durationStr) || null, index);
  }
  
  // Pattern 2: "0: (action param1 param2)"
  actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)/);
  if (actionMatch) {
    const [, timeStr, actionStr] = actionMatch;
    return createRobotAction(parseFloat(timeStr), actionStr, null, index);
  }
  
  // Pattern 3: "step 1: action param1 param2"
  actionMatch = line.match(/^(?:step\s+)?(\d+):\s*([^(].*?)$/i);
  if (actionMatch) {
    const [, stepStr, actionStr] = actionMatch;
    return createRobotAction(parseFloat(stepStr), actionStr, null, index);
  }
  
  // Pattern 4: "(action param1 param2)"
  actionMatch = line.match(/^\(([^)]+)\)$/);
  if (actionMatch) {
    const [, actionStr] = actionMatch;
    return createRobotAction(index, actionStr, null, index);
  }
  
  return null;
}

function createRobotAction(time, actionStr, duration = null, index = 0) {
  const actionParts = actionStr.trim().split(/\s+/);
  const actionName = actionParts[0].toLowerCase();
  const params = actionParts.slice(1);
  
  // Calculate duration if not provided
  if (duration === null) {
    duration = getDefaultRobotDuration(actionName);
  }
  
  const action = {
    time: time,
    start: time,
    end: time + duration,
    duration: duration,
    name: actionName,
    parameters: params,
    step: Math.floor(time),
    cost: getDefaultRobotCost(actionName),
    type: 'robot',
    index: index
  };

  // CRITICAL: Set actionType and extract entities
  setRobotActionType(action, actionName, params);
  
  console.log(`✅ Created robot action: ${action.name} -> actionType: ${action.actionType}`);
  
  return action;
}

function setRobotActionType(action, actionName, params) {
  // MOVE actions: (move robot fromRoom toRoom)
  if (actionName === 'move' && params.length >= 3) {
    action.actionType = 'move';
    action.robot = params[0];
    action.fromRoom = params[1];
    action.toRoom = params[2];
    return;
  }
  
  // PICK actions: (pick object room robot)
  if ((actionName === 'pick' || actionName === 'pickup' || actionName === 'pick-up') && params.length >= 3) {
    action.actionType = 'pick';
    action.object = params[0];
    action.room = params[1];
    action.robot = params[2];
    return;
  }
  
  // DROP actions: (drop object room robot)
  if ((actionName === 'drop' || actionName === 'putdown' || actionName === 'put-down') && params.length >= 3) {
    action.actionType = 'drop';
    action.object = params[0];
    action.room = params[1];
    action.robot = params[2];
    return;
  }
  
  // Fallback: try to guess from parameters
  action.actionType = 'unknown';
  
  // Look for robot in parameters
  for (const param of params) {
    if (param.toLowerCase().includes('robot') || param === 'wally' || param === 'eve') {
      action.robot = param;
      break;
    }
  }
}

function extractRobotEntities(action, entities) {
  // Extract robots
  if (action.robot && !entities.robots.includes(action.robot)) {
    entities.robots.push(action.robot);
  }
  
  // Extract rooms
  if (action.room && !entities.rooms.includes(action.room)) {
    entities.rooms.push(action.room);
  }
  if (action.fromRoom && !entities.rooms.includes(action.fromRoom)) {
    entities.rooms.push(action.fromRoom);
  }
  if (action.toRoom && !entities.rooms.includes(action.toRoom)) {
    entities.rooms.push(action.toRoom);
  }
  
  // Extract objects
  if (action.object && !entities.objects.includes(action.object)) {
    entities.objects.push(action.object);
  }
}

function getDefaultRobotDuration(actionName) {
  switch (actionName) {
    case 'move': return 3.0;
    case 'pick': 
    case 'pickup': 
    case 'pick-up': return 1.5;
    case 'drop': 
    case 'putdown': 
    case 'put-down': return 1.5;
    default: return 2.0;
  }
}

function getDefaultRobotCost(actionName) {
  switch (actionName) {
    case 'move': return 2;
    case 'pick': 
    case 'pickup': 
    case 'pick-up': 
    case 'drop': 
    case 'putdown': 
    case 'put-down': return 1;
    default: return 1;
  }
}

// ============================================================================
// LOGISTICS DOMAIN PARSER - UNCHANGED - PRESERVED EXACTLY AS IS
// ============================================================================
export function parseLogisticsDomain(rawContent, pddlType = 'classical') {
  console.log('🚚 Logistics Domain Parser started...', { pddlType, contentLength: rawContent.length });
  
  try {
    const lines = rawContent.split('\n').map(line => line.trim()).filter(line => line);
    const result = {
      actions: [],
      entities: {
        trucks: [],
        airplanes: [],
        packages: [],
        locations: [],
        cities: [],
        airports: []
      },
      metrics: {},
      pddlType: pddlType,
      domain: 'logistics',
      error: null
    };

    let actionIndex = 0;

    for (const line of lines) {
      // Skip empty lines, comments, and planner output
      if (!line || line.startsWith(';') || line.startsWith('#') ||
          line.includes('domain parsed') || line.includes('problem parsed') ||
          line.includes('grounding') || line.includes('planning time') ||
          line.includes('plan-length') || line.includes('metric') ||
          line.includes('expanded nodes') || line.includes('found plan:') ||
          line.includes('problem solved') || line.includes('g(n)=') ||
          line.includes('h(n)=') || line.includes('search time') ||
          line.includes('states evaluated')) {
        continue;
      }
      
      // Parse any line that looks like an action
      if (line.includes('(') || line.match(/^\d+/) || 
          line.includes('load') || line.includes('unload') || line.includes('drive') || line.includes('fly')) {
        const action = parseLogisticsAction(line, pddlType, actionIndex);
        if (action) {
          result.actions.push(action);
          extractLogisticsEntities(action, result.entities);
          console.log(`🚚 Parsed: ${action.name} -> actionType: ${action.actionType}, vehicle: ${action.vehicle}`);
          actionIndex++;
        }
      }
      
      // Parse statistics
      parseStatistics(line, result.metrics);
    }
    
    // Ensure we have minimum entities if none were found
    if (result.entities.trucks.length === 0 && result.actions.length > 0) {
      result.actions.forEach(action => {
        if (action.vehicle && action.vehicle.includes('truck') && !result.entities.trucks.includes(action.vehicle)) {
          result.entities.trucks.push(action.vehicle);
        }
      });
    }
    
    if (result.entities.airplanes.length === 0 && result.actions.length > 0) {
      result.actions.forEach(action => {
        if (action.vehicle && action.vehicle.includes('plane') && !result.entities.airplanes.includes(action.vehicle)) {
          result.entities.airplanes.push(action.vehicle);
        }
      });
    }
    
    if (result.entities.packages.length === 0 && result.actions.length > 0) {
      result.actions.forEach(action => {
        if (action.package && !result.entities.packages.includes(action.package)) {
          result.entities.packages.push(action.package);
        }
      });
    }
    
    if (result.entities.locations.length === 0 && result.actions.length > 0) {
      result.actions.forEach(action => {
        if (action.location && !result.entities.locations.includes(action.location)) {
          result.entities.locations.push(action.location);
        }
        if (action.fromLocation && !result.entities.locations.includes(action.fromLocation)) {
          result.entities.locations.push(action.fromLocation);
        }
        if (action.toLocation && !result.entities.locations.includes(action.toLocation)) {
          result.entities.locations.push(action.toLocation);
        }
      });
    }
    
    // Calculate total duration based on PDDL type
    if (result.actions.length > 0) {
      const lastAction = result.actions[result.actions.length - 1];
      switch (pddlType) {
        case 'temporal':
        case 'pddl_plus':
          result.totalDuration = Math.max(...result.actions.map(a => a.end || a.time + 1));
          break;
        case 'numerical':
          result.totalCost = result.actions.reduce((sum, a) => sum + (a.cost || 1), 0);
          result.totalDuration = lastAction.time || result.actions.length;
          break;
        default:
          result.totalDuration = lastAction.time || result.actions.length;
      }
    }
    
    console.log('✅ Logistics parsing complete:', {
      actions: result.actions.length,
      trucks: result.entities.trucks,
      airplanes: result.entities.airplanes,
      packages: result.entities.packages,
      locations: result.entities.locations
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Logistics parsing error:', error);
    return {
      actions: [],
      entities: { trucks: [], airplanes: [], packages: [], locations: [], cities: [], airports: [] },
      metrics: {},
      pddlType,
      domain: 'logistics',
      error: `Logistics parser error: ${error.message}`
    };
  }
}

function parseLogisticsAction(line, pddlType, index) {
  let actionMatch;
  
  console.log(`🔍 Parsing logistics line: "${line}"`);
  
  // Try different parsing patterns
  // Pattern 1: "0.000: (action param1 param2) [duration]"
  actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[(?:D:)?(\d+(?:\.\d+)?)\])?/);
  if (actionMatch) {
    const [, timeStr, actionStr, durationStr] = actionMatch;
    return createLogisticsAction(parseFloat(timeStr), actionStr, parseFloat(durationStr) || null, index);
  }
  
  // Pattern 2: "0: (action param1 param2)"
  actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)/);
  if (actionMatch) {
    const [, timeStr, actionStr] = actionMatch;
    return createLogisticsAction(parseFloat(timeStr), actionStr, null, index);
  }
  
  // Pattern 3: "step 1: action param1 param2"
  actionMatch = line.match(/^(?:step\s+)?(\d+):\s*([^(].*?)$/i);
  if (actionMatch) {
    const [, stepStr, actionStr] = actionMatch;
    return createLogisticsAction(parseFloat(stepStr), actionStr, null, index);
  }
  
  // Pattern 4: "(action param1 param2)"
  actionMatch = line.match(/^\(([^)]+)\)$/);
  if (actionMatch) {
    const [, actionStr] = actionMatch;
    return createLogisticsAction(index, actionStr, null, index);
  }
  
  return null;
}

function createLogisticsAction(time, actionStr, duration = null, index = 0) {
  const actionParts = actionStr.trim().split(/\s+/);
  const actionName = actionParts[0].toLowerCase();
  const params = actionParts.slice(1);
  
  // Calculate duration if not provided
  if (duration === null) {
    duration = getDefaultLogisticsDuration(actionName);
  }
  
  const action = {
    time: time,
    start: time,
    end: time + duration,
    duration: duration,
    name: actionName,
    parameters: params,
    step: Math.floor(time),
    cost: getDefaultLogisticsCost(actionName),
    type: 'logistics',
    index: index
  };

  // Set actionType and extract entities
  setLogisticsActionType(action, actionName, params);
  
  console.log(`✅ Created logistics action: ${action.name} -> actionType: ${action.actionType}`);
  
  return action;
}

function setLogisticsActionType(action, actionName, params) {
  // LOAD actions: (load package vehicle location)
  if ((actionName === 'load' || actionName === 'load-truck' || actionName === 'load-airplane') && params.length >= 3) {
    action.actionType = 'load';
    action.package = params[0];
    action.vehicle = params[1];
    action.location = params[2];
    return;
  }
  
  // UNLOAD actions: (unload package vehicle location)
  if ((actionName === 'unload' || actionName === 'unload-truck' || actionName === 'unload-airplane') && params.length >= 3) {
    action.actionType = 'unload';
    action.package = params[0];
    action.vehicle = params[1];
    action.location = params[2];
    return;
  }
  
  // DRIVE actions: (drive truck fromLocation toLocation)
  if (actionName === 'drive-truck' || actionName === 'drive' && params.length >= 3) {
    action.actionType = 'drive';
    action.vehicle = params[0];
    action.fromLocation = params[1];
    action.toLocation = params[2];
    return;
  }
  
  // FLY actions: (fly airplane fromAirport toAirport)
  if (actionName === 'fly-airplane' || actionName === 'fly' && params.length >= 3) {
    action.actionType = 'fly';
    action.vehicle = params[0];
    action.fromLocation = params[1];
    action.toLocation = params[2];
    return;
  }
  
  // Fallback
  action.actionType = 'unknown';
}

function extractLogisticsEntities(action, entities) {
  // Extract vehicles
  if (action.vehicle) {
    if (action.vehicle.includes('truck') && !entities.trucks.includes(action.vehicle)) {
      entities.trucks.push(action.vehicle);
    } else if (action.vehicle.includes('plane') && !entities.airplanes.includes(action.vehicle)) {
      entities.airplanes.push(action.vehicle);
    }
  }
  
  // Extract packages
  if (action.package && !entities.packages.includes(action.package)) {
    entities.packages.push(action.package);
  }
  
  // Extract locations
  if (action.location && !entities.locations.includes(action.location)) {
    entities.locations.push(action.location);
  }
  if (action.fromLocation && !entities.locations.includes(action.fromLocation)) {
    entities.locations.push(action.fromLocation);
  }
  if (action.toLocation && !entities.locations.includes(action.toLocation)) {
    entities.locations.push(action.toLocation);
  }
}

function getDefaultLogisticsDuration(actionName) {
  switch (actionName) {
    case 'drive':
    case 'drive-truck': return 5.0;
    case 'fly':
    case 'fly-airplane': return 8.0;
    case 'load':
    case 'load-truck':
    case 'load-airplane': return 2.0;
    case 'unload':
    case 'unload-truck':
    case 'unload-airplane': return 2.0;
    default: return 3.0;
  }
}

function getDefaultLogisticsCost(actionName) {
  switch (actionName) {
    case 'drive':
    case 'drive-truck': return 4;
    case 'fly':
    case 'fly-airplane': return 8;
    case 'load':
    case 'load-truck':
    case 'load-airplane': return 1;
    case 'unload':
    case 'unload-truck':
    case 'unload-airplane': return 1;
    default: return 2;
  }
}

// ============================================================================
// ENHANCED ELEVATOR DOMAIN PARSER - NEW ADVANCED FEATURES
// ============================================================================
export function parseElevatorDomain(rawContent, pddlType = 'classical') {
  console.log('🛗 Enhanced Elevator Domain Parser started...', { pddlType, contentLength: rawContent.length });
  
  try {
    const lines = rawContent.split('\n').map(line => line.trim()).filter(line => line);
    const result = {
      actions: [],
      entities: {
        elevators: [],
        passengers: [],
        floors: [],
        locations: [],
        // Enhanced elevator-specific entities
        elevatorSpecs: {},
        passengerProfiles: {},
        floorInformation: {}
      },
      metrics: {},
      pddlType: pddlType,
      domain: 'elevator',
      error: null,
      // Advanced elevator features
      multiElevatorSupport: false,
      capacityManagement: true,
      smartScheduling: true,
      emergencyProtocols: true
    };

    let inPlanSection = false;
    let maxCapacityDetected = 1000; // Default capacity in kg

    // Enhanced parsing with multi-elevator support
    for (const line of lines) {
      // Detect plan section
      if (line.includes('found plan:') || line.includes('plan found')) {
        inPlanSection = true;
        console.log('📋 Found plan section in elevator domain');
        continue;
      }
      
      // Stop at metrics
      if (inPlanSection && (line.includes('plan-length:') || line.includes('metric') || line.includes('planning time'))) {
        inPlanSection = false;
        continue;
      }
      
      // Parse domain specifications (if present)
      if (line.includes('elevator-capacity')) {
        maxCapacityDetected = parseInt(line.match(/\d+/)?.[0]) || 1000;
        console.log(`🏋️ Detected elevator capacity: ${maxCapacityDetected}kg`);
      }
      
      // Parse multi-elevator indicators
      if (line.includes('elevator') && (line.includes('elevator1') || line.includes('elevator2'))) {
        result.multiElevatorSupport = true;
      }
      
      if (inPlanSection) {
        const action = parseAdvancedElevatorAction(line, pddlType);
        if (action) {
          result.actions.push(action);
          extractAdvancedElevatorEntities(action, result.entities);
          console.log(`🛗 Enhanced elevator action: ${action.type} [${action.params.join(', ')}] at ${action.time}`);
        }
      }
      
      parseStatistics(line, result.metrics);
    }
    
    // Post-process with advanced features
    postProcessAdvancedElevator(result, pddlType, maxCapacityDetected);
    
    console.log('✅ Enhanced elevator parsing complete:', {
      actions: result.actions.length,
      elevators: result.entities.elevators.length,
      passengers: result.entities.passengers.length,
      floors: result.entities.floors.length,
      multiElevator: result.multiElevatorSupport,
      maxCapacity: maxCapacityDetected
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Enhanced elevator parsing error:', error);
    return {
      actions: [],
      entities: { elevators: [], passengers: [], floors: [], locations: [] },
      metrics: {},
      pddlType,
      domain: 'elevator',
      error: `Enhanced elevator parser error: ${error.message}`
    };
  }
}

function parseAdvancedElevatorAction(line, pddlType) {
  let actionMatch;
  
  // Enhanced pattern matching for different PDDL types
  if (pddlType === 'temporal' || pddlType === 'pddl_plus') {
    // Temporal format with duration
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[(?:D:)?(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, durationStr] = actionMatch;
      return createAdvancedElevatorAction(parseFloat(timeStr), actionStr, parseFloat(durationStr) || null, pddlType);
    }
  } else if (pddlType === 'numerical') {
    // Numerical format with costs/resources
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[cost:\s*(\d+(?:\.\d+)?)\])?(?:\s*\[weight:\s*(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, costStr, weightStr] = actionMatch;
      const action = createAdvancedElevatorAction(parseFloat(timeStr), actionStr, null, pddlType);
      action.cost = parseFloat(costStr) || getDefaultElevatorActionCost(action.type);
      action.weight = parseFloat(weightStr) || 0;
      return action;
    }
  }
  
  // Standard format
  actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)/);
  if (actionMatch) {
    const [, timeStr, actionStr] = actionMatch;
    return createAdvancedElevatorAction(parseFloat(timeStr), actionStr, null, pddlType);
  }
  
  return null;
}

function createAdvancedElevatorAction(time, actionStr, duration = null, pddlType = 'classical') {
  const actionParts = actionStr.trim().split(/\s+/);
  const actionType = actionParts[0];
  const params = actionParts.slice(1);
  
  // Calculate realistic duration based on action type
  if (duration === null) {
    duration = calculateRealisticElevatorDuration(actionType, pddlType, params);
  }
  
  const action = {
    time: time,
    start: time,
    end: time + duration,
    duration: duration,
    type: actionType,
    params: params,
    description: actionStr,
    originalLine: `${time}: (${actionStr})`,
    
    // Enhanced elevator properties
    elevatorId: extractElevatorId(actionType, params),
    passengerId: extractPassengerId(actionType, params),
    weight: extractPassengerWeight(actionType, params),
    priority: calculateElevatorActionPriority(actionType, params),
    energyCost: calculateElevatorEnergyCost(actionType, params),
    safetyLevel: assessElevatorSafetyLevel(actionType, params)
  };
  
  return action;
}

function calculateRealisticElevatorDuration(actionType, pddlType, params) {
  const baseDurations = {
    'move-up': 3.5,         // Realistic elevator movement time
    'move-down': 3.2,       // Slightly faster going down
    'load': 4.5,            // Door operation + passenger boarding
    'unload': 4.0,          // Door operation + passenger exiting
    'emergency-stop': 0.5,  // Immediate stop
    'maintenance': 30.0,    // Maintenance operations
    'door-open': 2.5,       // Door opening sequence
    'door-close': 2.0       // Door closing sequence
  };
  
  let baseDuration = baseDurations[actionType] || 3.0;
  
  // Adjust for PDDL type characteristics
  switch (pddlType) {
    case 'temporal':
      return baseDuration;
      
    case 'numerical': {
      const elevatorId = extractElevatorId(actionType, params);
      const capacity = getElevatorCapacity(elevatorId);
      return baseDuration * (1 + capacity / 2000);
    }
      
    case 'pddl_plus':
      if (actionType.includes('move')) {
        return baseDuration * 1.3; // Continuous movement takes longer
      }
      return baseDuration;
      
    default:
      return baseDuration;
  }
}

function extractElevatorId(actionType, params) {
  for (const param of params) {
    if (param.includes('elevator') || param.includes('lift')) {
      return param;
    }
  }
  
  if (actionType === 'move-up' || actionType === 'move-down') {
    return params[0] || 'elevator1';
  }
  
  if (actionType === 'load' || actionType === 'unload') {
    return params[1] || 'elevator1';
  }
  
  return 'elevator1';
}

function extractPassengerId(actionType, params) {
  if (actionType === 'load' || actionType === 'unload') {
    return params[0] || null;
  }
  return null;
}

function extractPassengerWeight(actionType, params) {
  for (const param of params) {
    if (param.includes('kg') || param.includes('weight')) {
      const weight = parseInt(param.match(/\d+/)?.[0]);
      if (weight) return weight;
    }
  }
  
  if (actionType === 'load' || actionType === 'unload') {
    return generateRealisticPassengerWeight();
  }
  
  return 0;
}

function generateRealisticPassengerWeight() {
  const mean = 75;
  const stdDev = 15;
  let weight = mean + stdDev * (Math.random() + Math.random() - 1);
  return Math.max(45, Math.min(120, Math.round(weight)));
}

function calculateElevatorActionPriority(actionType) {
  switch (actionType) {
    case 'emergency-stop':
      return 10;
    case 'unload':
      return 8;
    case 'load':
      return 7;
    case 'move-up':
    case 'move-down':
      return 5;
    default:
      return 3;
  }
}

function calculateElevatorEnergyCost(actionType) {
  switch (actionType) {
    case 'move-up':
      return 0.05;
    case 'move-down':
      return 0.02;
    case 'load':
    case 'unload':
      return 0.01;
    case 'emergency-stop':
      return 0.03;
    default:
      return 0.01;
  }
}

function assessElevatorSafetyLevel(actionType) {
  switch (actionType) {
    case 'emergency-stop':
      return 10;
    case 'load':
    case 'unload':
      return 8;
    case 'move-up':
    case 'move-down':
      return 7;
    default:
      return 9;
  }
}

function getElevatorCapacity(elevatorId) {
  if (elevatorId.includes('freight')) return 2000;
  if (elevatorId.includes('passenger')) return 1000;
  if (elevatorId.includes('service')) return 800;
  return 1000;
}

function getDefaultElevatorActionCost(actionType) {
  switch (actionType) {
    case 'move-up': return 3;
    case 'move-down': return 2;
    case 'load': return 1;
    case 'unload': return 1;
    case 'emergency-stop': return 5;
    default: return 2;
  }
}

function extractAdvancedElevatorEntities(action, entities) {
  const { elevatorId, passengerId, weight } = action;
  
  // Extract elevators with specifications
  if (elevatorId && !entities.elevators.find(e => e.id === elevatorId)) {
    entities.elevators.push({
      id: elevatorId,
      type: determineElevatorType(elevatorId),
      capacity: getElevatorCapacity(elevatorId),
      maxPassengers: getMaxPassengers(elevatorId),
      speed: getElevatorSpeed(elevatorId),
      floors: []
    });
  }
  
  // Extract passengers with profiles
  if (passengerId && !entities.passengers.find(p => p.id === passengerId)) {
    entities.passengers.push({
      id: passengerId,
      weight: weight || generateRealisticPassengerWeight(),
      mobility: generateMobilityProfile(),
      priority: generatePassengerPriority(),
      accessibilityNeeds: Math.random() > 0.9,
      vipStatus: Math.random() > 0.95
    });
  }
}

function determineElevatorType(elevatorId) {
  if (elevatorId.includes('freight')) return 'freight';
  if (elevatorId.includes('service')) return 'service';
  if (elevatorId.includes('express')) return 'express';
  return 'passenger';
}

function getMaxPassengers(elevatorId) {
  const capacity = getElevatorCapacity(elevatorId);
  return Math.floor(capacity / 75);
}

function getElevatorSpeed(elevatorId) {
  const type = determineElevatorType(elevatorId);
  switch (type) {
    case 'express': return 3.5;
    case 'freight': return 1.5;
    case 'service': return 2.0;
    default: return 2.5;
  }
}

function generateMobilityProfile() {
  const profiles = ['normal', 'elderly', 'wheelchair', 'pregnant', 'child'];
  return profiles[Math.floor(Math.random() * profiles.length)];
}

function generatePassengerPriority() {
  const priorities = ['low', 'normal', 'high', 'urgent'];
  const weights = [0.3, 0.5, 0.15, 0.05];
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return priorities[i];
    }
  }
  
  return 'normal';
}

function postProcessAdvancedElevator(result, pddlType, maxCapacity) {
  // Ensure minimum elevator configuration
  if (result.entities.elevators.length === 0) {
    result.entities.elevators = [
      {
        id: 'elevator1',
        type: 'passenger',
        capacity: maxCapacity,
        maxPassengers: Math.floor(maxCapacity / 75),
        speed: 2.5,
        floors: []
      }
    ];
  }
  
  // Generate realistic floor system based on movement actions
  const moveActions = result.actions.filter(a => a.type === 'move-up' || a.type === 'move-down');
  let floorCount = Math.max(3, Math.min(20, moveActions.length + 2));
  
  // Detect building height from actions
  let currentFloor = 0;
  let minFloor = 0;
  let maxFloor = 0;
  
  result.actions.forEach(action => {
    if (action.type === 'move-up') {
      currentFloor++;
      maxFloor = Math.max(maxFloor, currentFloor);
    } else if (action.type === 'move-down') {
      currentFloor--;
      minFloor = Math.min(minFloor, currentFloor);
    }
  });
  
  floorCount = Math.max(3, maxFloor - minFloor + 1);
  
  // Generate floor information
  result.entities.floors = [];
  result.entities.floorInformation = {};
  
  for (let i = 0; i < floorCount; i++) {
    const floorName = `Floor${i + 1}`;
    result.entities.floors.push(floorName);
    
    result.entities.floorInformation[floorName] = {
      level: i,
      height: i * 3.5,
      type: determineFloorType(i, floorCount),
      capacity: 100,
      emergencyExit: i === 0 || i === floorCount - 1,
      accessibility: Math.random() > 0.2
    };
  }
  
  // Set elevator specifications based on detected features
  result.entities.elevatorSpecs = {
    defaultCapacity: maxCapacity,
    maxSpeed: 2.5,
    acceleration: 1.0,
    doorTiming: {
      openTime: 2.5,
      closeTime: 2.0,
      holdTime: 5.0
    },
    safety: {
      overloadThreshold: maxCapacity * 1.1,
      emergencyStop: true,
      fireService: true,
      seismicSensors: floorCount > 10
    },
    smartFeatures: {
      destinationDispatch: result.entities.elevators.length > 1,
      predictiveScheduling: true,
      energyOptimization: pddlType === 'numerical',
      loadBalancing: result.entities.elevators.length > 1
    }
  };
  
  // Generate passenger profiles for enhanced simulation
  result.entities.passengerProfiles = {};
  result.entities.passengers.forEach(passenger => {
    result.entities.passengerProfiles[passenger.id] = {
      ...passenger,
      behaviorPattern: generateBehaviorPattern(),
      satisfactionFactors: generateSatisfactionFactors(),
      journeyHistory: []
    };
  });
  
  // Calculate total duration and metrics
  if (result.actions.length > 0) {
    const lastAction = result.actions[result.actions.length - 1];
    
    switch (pddlType) {
      case 'temporal':
      case 'pddl_plus':
        result.totalDuration = Math.max(...result.actions.map(a => a.end || a.time + a.duration));
        result.metrics.parallelActions = calculateElevatorParallelActions(result.actions);
        break;
        
      case 'numerical':
        result.totalCost = result.actions.reduce((sum, a) => sum + (a.cost || 1), 0);
        result.totalEnergyConsumption = result.actions.reduce((sum, a) => sum + (a.energyCost || 0), 0);
        result.totalDuration = lastAction.time || result.actions.length;
        break;
        
      default:
        result.totalDuration = lastAction.time || result.actions.length;
    }
    
    // Advanced elevator metrics
    result.metrics.safetyScore = calculateElevatorSafetyScore(result.actions);
    result.metrics.efficiencyRating = calculateElevatorEfficiencyRating(result.actions, result.entities.elevators.length);
    result.metrics.passengerSatisfaction = calculateElevatorPassengerSatisfaction(result.actions, result.entities.passengers);
    result.metrics.energyRating = calculateElevatorEnergyRating(result.actions, pddlType);
  }
  
  // Set locations for compatibility
  result.entities.locations = [...result.entities.floors];
  
  console.log('🔧 Advanced elevator post-processing complete');
}

function determineFloorType(floorIndex, totalFloors) {
  if (floorIndex === 0) return 'ground';
  if (floorIndex === totalFloors - 1) return 'top';
  if (floorIndex === 1) return 'mezzanine';
  if (floorIndex > totalFloors * 0.8) return 'upper';
  if (floorIndex < totalFloors * 0.3) return 'lower';
  return 'middle';
}

function generateBehaviorPattern() {
  const patterns = ['patient', 'impatient', 'efficient', 'social', 'quiet'];
  return patterns[Math.floor(Math.random() * patterns.length)];
}

function generateSatisfactionFactors() {
  return {
    waitTime: Math.random() * 0.4 + 0.3,
    journeyTime: Math.random() * 0.3 + 0.2,
    comfort: Math.random() * 0.2 + 0.1,
    safety: Math.random() * 0.3 + 0.4
  };
}

function calculateElevatorParallelActions(actions) {
  let maxParallel = 0;
  const timeSlots = {};
  
  actions.forEach(action => {
    if (action.start !== undefined && action.end !== undefined) {
      for (let t = Math.floor(action.start); t < Math.ceil(action.end); t++) {
        timeSlots[t] = (timeSlots[t] || 0) + 1;
        maxParallel = Math.max(maxParallel, timeSlots[t]);
      }
    }
  });
  
  return maxParallel;
}

function calculateElevatorSafetyScore(actions) {
  if (actions.length === 0) return 100;
  
  const totalSafety = actions.reduce((sum, action) => sum + (action.safetyLevel || 5), 0);
  return Math.round((totalSafety / (actions.length * 10)) * 100);
}

function calculateElevatorEfficiencyRating(actions, elevatorCount) {
  if (actions.length === 0) return 100;
  
  const moveActions = actions.filter(a => a.type === 'move-up' || a.type === 'move-down');
  const passengerActions = actions.filter(a => a.type === 'load' || a.type === 'unload');
  
  if (passengerActions.length === 0) return 50;
  
  const moveToPassengerRatio = moveActions.length / passengerActions.length;
  const idealRatio = 1.5;
  
  let efficiency = 100 - Math.abs(moveToPassengerRatio - idealRatio) * 20;
  
  if (elevatorCount > 1) {
    efficiency += 10;
  }
  
  return Math.max(0, Math.min(100, Math.round(efficiency)));
}

function calculateElevatorPassengerSatisfaction(actions, passengers) {
  if (passengers.length === 0) return 100;
  
  const actionsPerPassenger = actions.length / passengers.length;
  let satisfaction = Math.max(60, 100 - actionsPerPassenger * 5);
  
  const loadActions = actions.filter(a => a.type === 'load').length;
  const unloadActions = actions.filter(a => a.type === 'unload').length;
  
  if (loadActions === unloadActions) {
    satisfaction += 10;
  }
  
  return Math.round(satisfaction);
}

function calculateElevatorEnergyRating(actions, pddlType) {
  if (pddlType !== 'numerical') return 'A';
  
  const totalEnergy = actions.reduce((sum, a) => sum + (a.energyCost || 0), 0);
  const actionCount = actions.length;
  
  if (actionCount === 0) return 'A+';
  
  const energyPerAction = totalEnergy / actionCount;
  
  if (energyPerAction < 0.02) return 'A+';
  if (energyPerAction < 0.03) return 'A';
  if (energyPerAction < 0.04) return 'B';
  if (energyPerAction < 0.05) return 'C';
  return 'D';
}

// ============================================================================
// SHARED UTILITY FUNCTIONS - USED BY ALL DOMAIN PARSERS
// ============================================================================
function parseStatistics(line, metrics) {
  if (line.includes('plan-length:')) {
    metrics.planLength = parseInt(line.split(':')[1]);
  } else if (line.includes('planning time (msec):')) {
    metrics.planningTime = parseInt(line.split(':')[1]);
  } else if (line.includes('search time (msec):')) {
    metrics.searchTime = parseInt(line.split(':')[1]);
  } else if (line.includes('expanded nodes:')) {
    metrics.expandedNodes = parseInt(line.split(':')[1]);
  } else if (line.includes('states evaluated:')) {
    metrics.statesEvaluated = parseInt(line.split(':')[1]);
  } else if (line.includes('metric (search):')) {
    metrics.totalCost = parseFloat(line.split(':')[1]);
  }
}