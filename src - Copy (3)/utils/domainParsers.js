// File Path: src/utils/domainParsers.js
// Domain-Specific PDDL Parsers for Robot, Elevator, and Logistics domains
// Each parser handles all PDDL types: classical, temporal, numerical, pddl+

// ============================================================================
// ROBOT DOMAIN PARSER - FIXED FOR DYNAMIC PLANS
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
    duration = getDefaultDuration(actionName);
  }
  
  const action = {
    time: time,
    start: time,
    end: time + duration,
    duration: duration,
    name: actionName,
    parameters: params,
    step: Math.floor(time),
    cost: getDefaultCost(actionName),
    type: 'robot',
    index: index
  };

  // CRITICAL: Set actionType and extract entities
  setRobotActionType(action, actionName, params);
  
  console.log(`✅ Created action: ${action.name} -> actionType: ${action.actionType}`);
  
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

function getDefaultDuration(actionName) {
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

function getDefaultCost(actionName) {
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
// ELEVATOR DOMAIN PARSER - UNCHANGED
// ============================================================================
export function parseElevatorDomain(rawContent, pddlType = 'classical') {
  console.log('🛗 Elevator Domain Parser started...', { pddlType, contentLength: rawContent.length });
  
  try {
    const lines = rawContent.split('\n').map(line => line.trim()).filter(line => line);
    const result = {
      actions: [],
      entities: {
        elevators: [],
        passengers: [],
        floors: [],
        locations: []
      },
      metrics: {},
      pddlType: pddlType,
      domain: 'elevator',
      error: null
    };

    let inPlanSection = false;

    for (const line of lines) {
      if (line.includes('found plan:')) {
        inPlanSection = true;
        console.log('📋 Found plan section in elevator domain');
        continue;
      }
      
      if (inPlanSection && (line.includes('plan-length:') || line.includes('metric') || line.includes('planning time'))) {
        inPlanSection = false;
        continue;
      }
      
      if (inPlanSection) {
        const action = parseElevatorAction(line, pddlType);
        if (action) {
          result.actions.push(action);
          extractElevatorEntities(action, result.entities);
          console.log(`🛗 Elevator action: ${action.type} [${action.params.join(', ')}] at ${action.time}`);
        }
      }
      
      parseStatistics(line, result.metrics);
    }
    
    postProcessElevator(result, pddlType);
    
    console.log('✅ Elevator parsing complete:', {
      actions: result.actions.length,
      elevators: result.entities.elevators.length,
      passengers: result.entities.passengers.length,
      floors: result.entities.floors.length
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Elevator parsing error:', error);
    return {
      actions: [],
      entities: { elevators: [], passengers: [], floors: [], locations: [] },
      metrics: {},
      pddlType,
      domain: 'elevator',
      error: `Elevator parser error: ${error.message}`
    };
  }
}

function parseElevatorAction(line, pddlType) {
  let actionMatch;
  
  if (pddlType === 'temporal' || pddlType === 'pddl_plus') {
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, durationStr] = actionMatch;
      return createElevatorAction(parseFloat(timeStr), actionStr, parseFloat(durationStr) || 2.0);
    }
  } else if (pddlType === 'numerical') {
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[cost:\s*(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, costStr] = actionMatch;
      const action = createElevatorAction(parseFloat(timeStr), actionStr);
      action.cost = parseFloat(costStr) || 1.0;
      return action;
    }
  }
  
  actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)/);
  if (actionMatch) {
    const [, timeStr, actionStr] = actionMatch;
    return createElevatorAction(parseFloat(timeStr), actionStr);
  }
  
  return null;
}

function createElevatorAction(time, actionStr, duration = 2.0) {
  const actionParts = actionStr.trim().split(/\s+/);
  const actionType = actionParts[0];
  const params = actionParts.slice(1);
  
  return {
    time: time,
    start: time,
    end: time + duration,
    duration: duration,
    type: actionType,
    params: params,
    description: actionStr,
    originalLine: `${time}: (${actionStr})`
  };
}

function extractElevatorEntities(action, entities) {
  const { type, params } = action;
  
  switch (type) {
    case 'move-up':
    case 'move-down':
      if (params[0] && params[0].includes('elevator')) {
        addUnique(entities.elevators, params[0]);
      }
      break;
      
    case 'load':
    case 'unload':
      if (params[0] && params[0].includes('person')) {
        addUnique(entities.passengers, params[0]);
      }
      if (params[1] && params[1].includes('elevator')) {
        addUnique(entities.elevators, params[1]);
      }
      break;
      
    case 'reached':
      if (params[0] && params[0].includes('person')) {
        addUnique(entities.passengers, params[0]);
      }
      break;
  }
}

function postProcessElevator(result, pddlType) {
  if (result.entities.elevators.length === 0) {
    result.entities.elevators = ['elevator1'];
  }
  
  // Generate floors based on move actions
  const moveActions = result.actions.filter(a => a.type === 'move-up' || a.type === 'move-down');
  const floorCount = Math.max(3, Math.min(8, moveActions.length + 2));
  
  if (result.entities.floors.length === 0) {
    for (let i = 1; i <= floorCount; i++) {
      result.entities.floors.push(`Floor${i}`);
    }
  }
  
  result.entities.locations = [...result.entities.floors];
  
  if (result.actions.length > 0) {
    const lastAction = result.actions[result.actions.length - 1];
    switch (pddlType) {
      case 'temporal':
      case 'pddl_plus':
        result.totalDuration = Math.max(...result.actions.map(a => a.end || a.time + 2));
        break;
      case 'numerical':
        result.totalCost = result.actions.reduce((sum, a) => sum + (a.cost || 1), 0);
        result.totalDuration = lastAction.time || result.actions.length;
        break;
      default:
        result.totalDuration = lastAction.time || result.actions.length;
    }
  }
  
  console.log('🔧 Elevator post-processing complete');
}

// ============================================================================
// LOGISTICS DOMAIN PARSER - UNCHANGED
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
        vehicles: [],
        packages: [],
        locations: [],
        cities: [],
        airports: [],
        positions: []
      },
      metrics: {},
      pddlType: pddlType,
      domain: 'logistics',
      error: null
    };

    let inPlanSection = false;
    let actionIndex = 0;

    for (const line of lines) {
      // Skip planner output lines
      if (line.includes('found plan:') || line.includes('plan found') || 
          line.includes('problem solved') || line.includes('solution found')) {
        inPlanSection = true;
        console.log('📋 Found plan section in logistics domain');
        continue;
      }
      
      // Stop parsing at metrics or statistics
      if (inPlanSection && (line.includes('plan-length:') || line.includes('metric') || 
          line.includes('planning time') || line.includes('search time') ||
          line.includes('states evaluated') || line.includes('expanded nodes'))) {
        inPlanSection = false;
        continue;
      }
      
      // Skip empty lines and comments
      if (!line || line.startsWith(';') || line.startsWith('#')) {
        continue;
      }
      
      // Always try to parse action lines that look like actions
      if (line.includes('(') || line.match(/^\d+/)) {
        const action = parseLogisticsAction(line, pddlType, actionIndex);
        if (action) {
          result.actions.push(action);
          extractLogisticsEntities(action, result.entities);
          console.log(`🚚 Logistics action: ${action.type} [${action.params.join(', ')}] at ${action.time}`);
          actionIndex++;
        }
      }
      
      // Parse statistics
      parseStatistics(line, result.metrics);
    }
    
    // Post-process to ensure we have proper entities
    postProcessLogistics(result, pddlType);
    
    console.log('✅ Logistics parsing complete:', {
      actions: result.actions.length,
      trucks: result.entities.trucks.length,
      airplanes: result.entities.airplanes.length,
      packages: result.entities.packages.length,
      locations: result.entities.locations.length
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Logistics parsing error:', error);
    return {
      actions: [],
      entities: { 
        trucks: [], 
        airplanes: [], 
        vehicles: [],
        packages: [], 
        locations: [], 
        cities: [], 
        airports: [],
        positions: []
      },
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
  
  // Enhanced pattern matching for logistics actions
  if (pddlType === 'temporal' || pddlType === 'pddl_plus') {
    // Temporal format: "0.000: (action param1 param2) [duration]"
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[(?:D:)?(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, durationStr] = actionMatch;
      return createLogisticsAction(parseFloat(timeStr), actionStr, parseFloat(durationStr) || getDurationByActionType(actionStr), index);
    }
  } else if (pddlType === 'numerical') {
    // Numerical format: "0.000: (action param1 param2) [cost: X]"
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[cost:\s*(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, costStr] = actionMatch;
      const action = createLogisticsAction(parseFloat(timeStr), actionStr, null, index);
      action.cost = parseFloat(costStr) || getCostByActionType(actionStr);
      return action;
    }
  }
  
  // Classical format: "0.000: (action param1 param2)" or "0: (action param1 param2)"
  actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)/);
  if (actionMatch) {
    const [, timeStr, actionStr] = actionMatch;
    return createLogisticsAction(parseFloat(timeStr), actionStr, null, index);
  }
  
  // Try step-based format: "step 1: action param1 param2"
  actionMatch = line.match(/^(?:step\s+)?(\d+):\s*([^(].*?)$/i);
  if (actionMatch) {
    const [, stepStr, actionStr] = actionMatch;
    return createLogisticsAction(parseFloat(stepStr), actionStr, null, index);
  }
  
  // Try action without time: "(action param1 param2)"
  actionMatch = line.match(/^\(([^)]+)\)$/);
  if (actionMatch) {
    const [, actionStr] = actionMatch;
    return createLogisticsAction(index, actionStr, null, index);
  }
  
  console.log(`⚠️ Could not parse logistics line: "${line}"`);
  return null;
}

function createLogisticsAction(time, actionStr, duration = null, index = 0) {
  const actionParts = actionStr.trim().split(/\s+/);
  const actionType = actionParts[0];
  const params = actionParts.slice(1);
  
  console.log(`🔧 Creating logistics action: ${actionType} with params:`, params);
  
  // Set realistic durations based on action type
  if (duration === null) {
    duration = getDurationByActionType(actionStr);
  }
  
  return {
    time: time,
    start: time,
    end: time + duration,
    duration: duration,
    type: actionType,
    params: params,
    description: actionStr,
    originalLine: `${time}: (${actionStr})`,
    index: index
  };
}

function getDurationByActionType(actionStr) {
  const actionType = actionStr.trim().split(/\s+/)[0].toLowerCase();
  
  switch (actionType) {
    case 'load-vehicle':
    case 'load-truck':
    case 'unload-vehicle':
    case 'unload-truck':
      return 2.0; // 2 seconds for loading/unloading
    case 'drive-truck':
      return 4.0; // 4 seconds for truck driving
    case 'fly-airplane':
      return 6.0; // 6 seconds for airplane flying
    default:
      return 3.0; // Default duration
  }
}

function getCostByActionType(actionStr) {
  const actionType = actionStr.trim().split(/\s+/)[0].toLowerCase();
  
  switch (actionType) {
    case 'fly-airplane':
      return 8; // Flying is most expensive
    case 'drive-truck':
      return 5; // Driving is medium cost
    case 'load-vehicle':
    case 'load-truck':
    case 'unload-vehicle':
    case 'unload-truck':
      return 2; // Loading/unloading is cheap
    default:
      return 3; // Default cost
  }
}

function extractLogisticsEntities(action, entities) {
  const { type, params } = action;
  
  console.log(`🔍 Extracting entities from action: ${type} with params:`, params);
  
  switch (type) {
    case 'drive-truck':
      // (drive-truck tru1 pos1 apt1 cit1) or (drive-truck tru1 pos1 apt1)
      if (params[0] && params[0].includes('tru')) {
        addUnique(entities.trucks, params[0]);
        addUnique(entities.vehicles, params[0]);
      }
      if (params[1]) {
        addUnique(entities.locations, params[1]);
        if (params[1].includes('pos')) addUnique(entities.positions, params[1]);
        if (params[1].includes('apt')) addUnique(entities.airports, params[1]);
      }
      if (params[2]) {
        addUnique(entities.locations, params[2]);
        if (params[2].includes('pos')) addUnique(entities.positions, params[2]);
        if (params[2].includes('apt')) addUnique(entities.airports, params[2]);
      }
      if (params[3] && params[3].includes('cit')) {
        addUnique(entities.cities, params[3]);
      }
      break;
      
    case 'fly-airplane':
      // (fly-airplane apn1 apt1 apt3)
      if (params[0] && params[0].includes('apn')) {
        addUnique(entities.airplanes, params[0]);
        addUnique(entities.vehicles, params[0]);
      }
      if (params[1] && params[1].includes('apt')) {
        addUnique(entities.airports, params[1]);
        addUnique(entities.locations, params[1]);
      }
      if (params[2] && params[2].includes('apt')) {
        addUnique(entities.airports, params[2]);
        addUnique(entities.locations, params[2]);
      }
      break;
      
    case 'load-vehicle':
    case 'load-truck':
    case 'unload-vehicle':
    case 'unload-truck':
      // (load-vehicle obj12 tru1 pos1) or (unload-vehicle obj12 tru1 pos1)
      if (params[0] && params[0].includes('obj')) {
        addUnique(entities.packages, params[0]);
      }
      if (params[1]) {
        if (params[1].includes('tru')) {
          addUnique(entities.trucks, params[1]);
          addUnique(entities.vehicles, params[1]);
        } else if (params[1].includes('apn')) {
          addUnique(entities.airplanes, params[1]);
          addUnique(entities.vehicles, params[1]);
        }
      }
      if (params[2]) {
        addUnique(entities.locations, params[2]);
        if (params[2].includes('pos')) addUnique(entities.positions, params[2]);
        if (params[2].includes('apt')) addUnique(entities.airports, params[2]);
      }
      break;
      
    default:
      // Extract any vehicle/package/location references from any unknown action
      params.forEach(param => {
        if (param.includes('tru') || param.includes('truck')) {
          addUnique(entities.trucks, param);
          addUnique(entities.vehicles, param);
        } else if (param.includes('apn') || param.includes('plane') || param.includes('airplane')) {
          addUnique(entities.airplanes, param);
          addUnique(entities.vehicles, param);
        } else if (param.includes('obj') || param.includes('package') || param.includes('cargo')) {
          addUnique(entities.packages, param);
        } else if (param.includes('cit') || param.includes('city')) {
          addUnique(entities.cities, param);
        } else if (param.includes('apt') || param.includes('airport')) {
          addUnique(entities.airports, param);
          addUnique(entities.locations, param);
        } else if (param.includes('pos') || param.includes('location')) {
          addUnique(entities.positions, param);
          addUnique(entities.locations, param);
        }
      });
  }
}

function postProcessLogistics(result, pddlType) {
  // Ensure we have minimum entities for logistics domain
  if (result.entities.trucks.length === 0 && result.entities.airplanes.length === 0) {
    result.entities.trucks = ['tru1', 'tru2'];
    result.entities.airplanes = ['apn1', 'apn2'];
    result.entities.vehicles = ['tru1', 'tru2', 'apn1', 'apn2'];
  }
  
  // Combine all vehicles
  result.entities.vehicles = [...result.entities.trucks, ...result.entities.airplanes];
  
  if (result.entities.locations.length === 0) {
    result.entities.positions = ['pos1', 'pos2', 'pos3', 'pos4'];
    result.entities.airports = ['apt1', 'apt2', 'apt3', 'apt4'];
    result.entities.cities = ['cit1', 'cit2', 'cit3', 'cit4'];
    result.entities.locations = [...result.entities.positions, ...result.entities.airports];
  }
  
  if (result.entities.packages.length === 0 && result.actions.some(a => a.type.includes('load') || a.type.includes('unload'))) {
    result.entities.packages = ['obj11', 'obj12', 'obj21', 'obj22', 'obj23'];
  }
  
  // Calculate total duration based on PDDL type
  if (result.actions.length > 0) {
    const lastAction = result.actions[result.actions.length - 1];
    switch (pddlType) {
      case 'temporal':
      case 'pddl_plus':
        result.totalDuration = Math.max(...result.actions.map(a => a.end || a.time + 3));
        break;
      case 'numerical':
        result.totalCost = result.actions.reduce((sum, a) => sum + (a.cost || 3), 0);
        result.totalDuration = lastAction.time || result.actions.length;
        break;
      default:
        result.totalDuration = lastAction.time || result.actions.length;
    }
  }
  
  console.log('🔧 Logistics post-processing complete');
  console.log('📊 Final entities:', {
    trucks: result.entities.trucks,
    airplanes: result.entities.airplanes,
    vehicles: result.entities.vehicles,
    packages: result.entities.packages,
    locations: result.entities.locations,
    cities: result.entities.cities,
    airports: result.entities.airports,
    positions: result.entities.positions
  });
}

// Helper function
function addUnique(array, item) {
  if (item && !array.includes(item)) {
    array.push(item);
  }
}

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
  } else if (line.includes('grounding time:')) {
    metrics.groundingTime = parseInt(line.split(':')[1]);
  }
}

// ============================================================================
// DOMAIN AUTO-DETECTION
// ============================================================================
export function detectDomain(content) {
  if (!content || typeof content !== 'string') {
    return 'unknown';
  }
  
  const lowerContent = content.toLowerCase();
  
  // Count domain-specific keywords
  const robotKeywords = ['robot', 'pick', 'drop', 'move', 'room', 'ball', 'box', 'wally', 'eve'];
  const logisticsKeywords = ['truck', 'airplane', 'load-vehicle', 'unload-vehicle', 'drive-truck', 'fly-airplane', 'package', 'cargo', 'city', 'airport', 'tru1', 'apn1', 'obj', 'pos', 'apt', 'cit'];
  const elevatorKeywords = ['elevator', 'floor', 'passenger', 'up', 'down', 'board', 'depart'];
  
  const robotScore = robotKeywords.reduce((score, keyword) => {
    return score + (lowerContent.includes(keyword) ? 1 : 0);
  }, 0);
  
  const logisticsScore = logisticsKeywords.reduce((score, keyword) => {
    return score + (lowerContent.includes(keyword) ? 1 : 0);
  }, 0);
  
  const elevatorScore = elevatorKeywords.reduce((score, keyword) => {
    return score + (lowerContent.includes(keyword) ? 1 : 0);
  }, 0);
  
  console.log('🔍 Domain detection scores:', {
    robot: robotScore,
    logistics: logisticsScore,
    elevator: elevatorScore
  });
  
  // Return domain with highest score
  if (logisticsScore > robotScore && logisticsScore > elevatorScore) {
    return 'logistics';
  } else if (elevatorScore > robotScore && elevatorScore > logisticsScore) {
    return 'elevator';
  } else if (robotScore > 0) {
    return 'robot';
  } else {
    return 'unknown';
  }
}

// ============================================================================
// GENERIC DOMAIN PARSER
// ============================================================================
export function parseAnyDomain(content, pddlType = 'classical', forceDomain = null) {
  const domain = forceDomain || detectDomain(content);
  
  console.log(`🎯 Parsing as ${domain} domain (PDDL: ${pddlType})`);
  
  switch (domain) {
    case 'robot':
      return parseRobotDomain(content, pddlType);
    case 'logistics':
      return parseLogisticsDomain(content, pddlType);
    case 'elevator':
      return parseElevatorDomain(content, pddlType);
    default:
      return {
        error: `Unknown or unsupported domain: ${domain}`,
        actions: [],
        entities: {},
        domain: domain,
        pddlType
      };
  }
}