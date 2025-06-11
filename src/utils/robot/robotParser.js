// File: src/utils/robot/robotParser.js
// Robot Domain-Specific PDDL Parser
// Handles all PDDL types: classical, temporal, numerical, pddl+

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
      result.actions.forEach(action => {
        if (action.robot && !result.entities.robots.includes(action.robot)) {
          result.entities.robots.push(action.robot);
        }
      });
    }
    
    if (result.entities.rooms.length === 0 && result.actions.length > 0) {
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

// Shared utility function
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