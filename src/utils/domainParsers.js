// File Path: src/utils/domainParsers.js
// Domain-Specific PDDL Parsers for Robot, Elevator, and Logistics domains
// Each parser handles all PDDL types: classical, temporal, numerical, pddl+

// ============================================================================
// ROBOT DOMAIN PARSER
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

    let inPlanSection = false;

    for (const line of lines) {
      // Detect plan section start
      if (line.includes('found plan:')) {
        inPlanSection = true;
        console.log('📋 Found plan section in robot domain');
        continue;
      }
      
      // Detect plan section end
      if (inPlanSection && (line.includes('plan-length:') || line.includes('metric') || line.includes('planning time'))) {
        inPlanSection = false;
        continue;
      }
      
      // Parse robot actions
      if (inPlanSection) {
        const action = parseRobotAction(line, pddlType);
        if (action) {
          result.actions.push(action);
          extractRobotEntities(action, result.entities);
          console.log(`🤖 Robot action: ${action.type} [${action.params.join(', ')}] at ${action.time}`);
        }
      }
      
      // Parse statistics
      parseStatistics(line, result.metrics);
    }
    
    // Post-process for robot domain
    postProcessRobot(result, pddlType);
    
    console.log('✅ Robot parsing complete:', {
      actions: result.actions.length,
      robots: result.entities.robots.length,
      rooms: result.entities.rooms.length,
      objects: result.entities.objects.length
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

function parseRobotAction(line, pddlType) {
  // Handle different PDDL action formats
  let actionMatch;
  
  // Classical PDDL: "0.0: (move robot1 room1 room2)"
  // Temporal PDDL: "0.000: (move robot1 room1 room2) [1.000]"
  // Numerical PDDL: "0.0: (move robot1 room1 room2) [cost: 5.0]"
  
  if (pddlType === 'temporal' || pddlType === 'pddl_plus') {
    // Temporal format with duration
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, durationStr] = actionMatch;
      return createRobotAction(parseFloat(timeStr), actionStr, parseFloat(durationStr) || 1.0);
    }
  } else if (pddlType === 'numerical') {
    // Numerical format with cost
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[cost:\s*(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, costStr] = actionMatch;
      const action = createRobotAction(parseFloat(timeStr), actionStr);
      action.cost = parseFloat(costStr) || 1.0;
      return action;
    }
  }
  
  // Default classical format
  actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)/);
  if (actionMatch) {
    const [, timeStr, actionStr] = actionMatch;
    return createRobotAction(parseFloat(timeStr), actionStr);
  }
  
  return null;
}

function createRobotAction(time, actionStr, duration = 1.0) {
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

function extractRobotEntities(action, entities) {
  const { type, params } = action;
  
  switch (type) {
    case 'move':
    case 'navigate':
    case 'go':
      // (move robot1 room1 room2)
      if (params[0] && params[0].includes('robot')) {
        addUnique(entities.robots, params[0]);
      }
      if (params[1] && (params[1].includes('room') || params[1].includes('loc'))) {
        addUnique(entities.rooms, params[1]);
        addUnique(entities.locations, params[1]);
      }
      if (params[2] && (params[2].includes('room') || params[2].includes('loc'))) {
        addUnique(entities.rooms, params[2]);
        addUnique(entities.locations, params[2]);
      }
      break;
      
    case 'pick-up':
    case 'pickup':
    case 'take':
    case 'pick':
      // (pick-up robot1 obj1) or (pick obj1 room1 robot1)
      if (params[0] && params[0].includes('robot')) {
        addUnique(entities.robots, params[0]);
      }
      if (params[2] && params[2].includes('robot')) {
        addUnique(entities.robots, params[2]);
      }
      if (params[0] && (params[0].includes('obj') || params[0].includes('ball'))) {
        addUnique(entities.objects, params[0]);
      }
      if (params[1] && (params[1].includes('room') || params[1].includes('loc'))) {
        addUnique(entities.rooms, params[1]);
        addUnique(entities.locations, params[1]);
      }
      break;
      
    case 'put-down':
    case 'putdown':
    case 'drop':
    case 'place':
      // (put-down robot1 obj1) or (drop obj1 room1 robot1)
      if (params[0] && params[0].includes('robot')) {
        addUnique(entities.robots, params[0]);
      }
      if (params[2] && params[2].includes('robot')) {
        addUnique(entities.robots, params[2]);
      }
      if (params[0] && (params[0].includes('obj') || params[0].includes('ball'))) {
        addUnique(entities.objects, params[0]);
      }
      if (params[1] && (params[1].includes('room') || params[1].includes('loc'))) {
        addUnique(entities.rooms, params[1]);
        addUnique(entities.locations, params[1]);
      }
      break;
      
    default:
      // Extract any robot/room/object references
      params.forEach(param => {
        if (param.includes('robot') || param === 'wally' || param === 'eve') {
          addUnique(entities.robots, param);
        } else if (param.includes('room') || param.includes('loc')) {
          addUnique(entities.rooms, param);
          addUnique(entities.locations, param);
        } else if (param.includes('obj') || param.includes('item') || param.includes('box') || param.includes('ball')) {
          addUnique(entities.objects, param);
        }
      });
  }
}

function postProcessRobot(result, pddlType) {
  // Ensure minimum entities for robot domain
  if (result.entities.robots.length === 0) {
    result.entities.robots = ['robot1'];
  }
  
  if (result.entities.rooms.length === 0) {
    result.entities.rooms = ['roomA', 'roomB', 'roomC', 'roomD'];
    result.entities.locations = [...result.entities.rooms];
  }
  
  if (result.entities.objects.length === 0 && result.actions.some(a => a.type.includes('pick') || a.type.includes('drop'))) {
    result.entities.objects = ['obj1', 'obj2', 'obj3'];
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
  
  console.log('🔧 Robot post-processing complete');
}

// ============================================================================
// ELEVATOR DOMAIN PARSER
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
// LOGISTICS DOMAIN PARSER
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

    for (const line of lines) {
      if (line.includes('found plan:')) {
        inPlanSection = true;
        console.log('📋 Found plan section in logistics domain');
        continue;
      }
      
      if (inPlanSection && (line.includes('plan-length:') || line.includes('metric') || line.includes('planning time'))) {
        inPlanSection = false;
        continue;
      }
      
      if (inPlanSection) {
        const action = parseLogisticsAction(line, pddlType);
        if (action) {
          result.actions.push(action);
          extractLogisticsEntities(action, result.entities);
          console.log(`🚚 Logistics action: ${action.type} [${action.params.join(', ')}] at ${action.time}`);
        }
      }
      
      parseStatistics(line, result.metrics);
    }
    
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

function parseLogisticsAction(line, pddlType) {
  let actionMatch;
  
  if (pddlType === 'temporal' || pddlType === 'pddl_plus') {
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, durationStr] = actionMatch;
      return createLogisticsAction(parseFloat(timeStr), actionStr, parseFloat(durationStr) || getDurationByActionType(actionStr));
    }
  } else if (pddlType === 'numerical') {
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[cost:\s*(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, costStr] = actionMatch;
      const action = createLogisticsAction(parseFloat(timeStr), actionStr);
      action.cost = parseFloat(costStr) || getCostByActionType(actionStr);
      return action;
    }
  }
  
  actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)/);
  if (actionMatch) {
    const [, timeStr, actionStr] = actionMatch;
    return createLogisticsAction(parseFloat(timeStr), actionStr);
  }
  
  return null;
}

function createLogisticsAction(time, actionStr, duration = null) {
  const actionParts = actionStr.trim().split(/\s+/);
  const actionType = actionParts[0];
  const params = actionParts.slice(1);
  
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
    originalLine: `${time}: (${actionStr})`
  };
}

function getDurationByActionType(actionStr) {
  const actionType = actionStr.trim().split(/\s+/)[0];
  
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
  const actionType = actionStr.trim().split(/\s+/)[0];
  
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
  
  switch (type) {
    case 'drive-truck':
      // (drive-truck tru1 pos1 apt1 cit1)
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
      // (load-vehicle obj12 tru1 pos1)
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
      // Extract any vehicle/package/location references
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
  // Ensure minimum entities for logistics domain
  if (result.entities.trucks.length === 0 && result.entities.airplanes.length === 0) {
    result.entities.trucks = ['truck1'];
    result.entities.airplanes = ['airplane1'];
    result.entities.vehicles = ['truck1', 'airplane1'];
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
}

// ============================================================================
// SHARED UTILITIES
// ============================================================================
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

// ============================================================================
// EXPORT UTILITIES
// ============================================================================
export {
  addUnique,
  parseStatistics,
  getDurationByActionType,
  getCostByActionType
}