// Enhanced Robot Parser with Realistic Movement Timing
// File Path: src/utils/enhancedRobotParser.js

/**
 * Enhanced PDDL Plan Parser specifically optimized for Robot domain with 3D movement
 * Supports Classical, Temporal, Numerical, and PDDL+ plans with realistic timing
 */

export function parseRobotPlanFile(content, pddlType = 'classical') {
  console.log('🤖 Enhanced Robot Parser - Parsing content for 3D movement:', {
    contentLength: content?.length || 0,
    pddlType,
    preview: content?.substring(0, 100) + '...'
  })
  
  if (!content || content.trim().length === 0) {
    console.log('❌ Empty content provided')
    return []
  }

  // Split content into lines and filter for plan actions
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => {
      return line.length > 0 && 
             !line.startsWith(';') &&
             !line.startsWith('//') &&
             !line.startsWith('#') &&
             !line.includes('domain parsed') &&
             !line.includes('problem parsed') &&
             !line.includes('grounding') &&
             !line.includes('planning time') &&
             !line.includes('plan-length') &&
             !line.includes('metric') &&
             !line.includes('expanded nodes') &&
             !line.includes('found plan:') &&
             !line.includes('problem solved') &&
             !line.includes('g(n)=') &&
             !line.includes('h(n)=') &&
             !line.includes('total-cost') &&
             !line.includes('makespan') &&
             (line.includes(':') && (
               line.includes('pick') || 
               line.includes('drop') || 
               line.includes('move') ||
               line.includes('load') ||
               line.includes('unload') ||
               line.includes('drive') ||
               line.includes('startmove') ||
               line.includes('reprise') ||
               line.includes('waiting')
             ))
    })

  console.log(`📋 Filtered ${lines.length} action lines from ${content.split('\n').length} total lines`)

  const actions = []
  
  lines.forEach((line, index) => {
    const action = parseActionLineWithRealisticTiming(line, index, pddlType)
    if (action) {
      actions.push(action)
      console.log(`✅ Parsed action ${index + 1}:`, {
        name: action.name,
        type: action.actionType,
        duration: action.duration,
        cost: action.cost,
        robot: action.robot,
        object: action.object,
        room: action.room || action.toRoom
      })
    } else {
      console.log(`⚠️ Failed to parse line ${index + 1}: "${line}"`)
    }
  })

  console.log(`🎉 Successfully parsed ${actions.length} robot actions for 3D simulation`)
  return actions
}

/**
 * Parse individual action line with realistic timing for 3D movement
 */
function parseActionLineWithRealisticTiming(line, index, pddlType) {
  let match
  let timeOrStep = 0
  let actionContent = ''
  let duration = 1.0
  let isWaiting = false
  let cost = 1
  let isEvent = false
  let isProcess = false
  
  console.log(`🔧 Parsing line for ${pddlType}: "${line}"`)
  
  // Handle PDDL+ specific patterns first
  if (pddlType === 'pddl+') {
    // Handle waiting actions: "0: -----waiting---- [30.0]"
    if (line.includes('-----waiting----')) {
      match = line.match(/(\d+(?:\.\d+)?):\s*-----waiting----\s*\[(\d+(?:\.\d+)?)\]/)
      if (match) {
        return {
          id: `wait-${index}`,
          name: 'waiting',
          actionType: 'wait',
          start: parseFloat(match[1]),
          end: parseFloat(match[1]) + parseFloat(match[2]),
          duration: parseFloat(match[2]),
          isWaiting: true,
          isProcess: false,
          isEvent: false,
          type: pddlType,
          cost: 0,
          raw: line,
          parameters: [] // Add empty parameters array
        }
      }
    }
    
    // Handle process actions
    if (line.includes('start') || line.includes('stop') || line.includes('reprise')) {
      isProcess = true
    } else {
      isEvent = true
    }
  }
  
  // Parse time-based format: "0.0: (action ...)" or "Step 1: (action ...)"
  match = line.match(/^(?:Step\s+)?(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)/)
  if (match) {
    timeOrStep = parseFloat(match[1])
    actionContent = match[2].trim()
  }
  
  // Fallback: try simpler format
  if (!actionContent) {
    match = line.match(/^(?:Step\s+)?(\d+)[:.]?\s*(.+)/)
    if (match) {
      timeOrStep = parseInt(match[1])
      actionContent = match[2].trim().replace(/^\(|\)$/g, '')
    }
  }
  
  if (!actionContent) {
    console.log(`❌ Could not extract action content from: "${line}"`)
    return null
  }
  
  // Split action content into parts
  const parts = actionContent.split(/\s+/).filter(p => p.length > 0)
  if (parts.length === 0) {
    console.log(`❌ No action parts found in: "${actionContent}"`)
    return null
  }
  
  const actionName = parts[0].toLowerCase()
  const parameters = parts.slice(1)
  
  console.log(`🎯 Action: ${actionName}, Parameters: [${parameters.join(', ')}]`)
  
  // Calculate realistic durations for 3D movement
  duration = calculateRealistic3DDuration(actionName, pddlType, parameters)
  cost = calculateActionCost(actionName, pddlType)
  
  // Create base action object
  const action = {
    id: `action-${index}`,
    name: actionName,
    parameters: parameters,
    step: pddlType === 'classical' ? Math.floor(timeOrStep) : index,
    start: timeOrStep,
    end: timeOrStep + duration,
    duration: duration,
    type: pddlType,
    cost: cost,
    raw: line,
    isWaiting: isWaiting,
    isProcess: isProcess,
    isEvent: isEvent
  }
  
  // Extract specific entities and action type based on action name
  extractActionEntities(action, actionName, parameters)
  
  console.log(`✅ Parsed ${pddlType} action:`, {
    name: action.name,
    type: action.actionType,
    duration: action.duration,
    robot: action.robot,
    object: action.object,
    rooms: [action.room, action.fromRoom, action.toRoom].filter(Boolean)
  })
  
  return action
}

/**
 * Calculate realistic durations for 3D robot movement
 */
function calculateRealistic3DDuration(actionName, pddlType) {
  const baseDurations = {
    // Movement actions - longer for realistic 3D movement
    'move': 3.0,              // 3 seconds to walk between rooms
    'drive-truck': 4.0,       // 4 seconds for truck movement
    'drive-between-cities': 6.0, // 6 seconds for city-to-city
    'startmove': 5.0,         // PDDL+ process movement
    'reprisemovement': 3.0,   // Resume movement
    
    // Object manipulation - quick but visible
    'pick': 1.0,              // 1 second to pick up object
    'drop': 1.0,              // 1 second to drop object
    'load-truck': 2.0,        // 2 seconds to load into truck
    'unload-truck': 2.0,      // 2 seconds to unload from truck
    'load': 1.5,              // Generic loading
    'unload': 1.5,            // Generic unloading
    
    // Maintenance actions
    'startcharge': 1.0,       // Start charging quickly
    'stopcharge': 0.5,        // Stop charging instantly
    'refuel': 2.0,            // Refueling takes time
    
    // Default for unknown actions
    'default': 2.0
  }
  
  let baseDuration = baseDurations[actionName] || baseDurations.default
  
  // Adjust duration based on PDDL type
  switch (pddlType) {
    case 'temporal': {
      // Temporal PDDL uses exact durations - keep base duration
      return baseDuration
    }
      
    case 'numerical': {
      // Scale by cost for numerical PDDL
      const cost = calculateActionCost(actionName, pddlType)
      return baseDuration * Math.max(0.5, cost / 3.0) // Scale factor
    }
      
    case 'pddl+': {
      // PDDL+ processes take longer, events are quick
      if (actionName.includes('start') || actionName.includes('reprise')) {
        return baseDuration * 1.5 // Processes take longer
      } else {
        return baseDuration * 0.8 // Events are quicker
      }
    }
      
    case 'classical':
    default: {
      // Classical PDDL - use base durations for realistic 3D movement
      return baseDuration
    }
  }
}

/**
 * Calculate action costs based on PDDL type and action complexity
 */
function calculateActionCost(actionName, pddlType = 'classical') {
  if (pddlType === 'numerical') {
    // Higher costs for numerical PDDL
    switch (actionName) {
      case 'move':
      case 'drive-truck':
      case 'drive-between-cities':
      case 'startmove':
      case 'reprisemovement':
        return 5 // Movement is expensive
        
      case 'pick':
      case 'drop':
      case 'load':
      case 'unload':
      case 'load-truck':
      case 'unload-truck':
        return 2 // Object manipulation has medium cost
        
      case 'startcharge':
      case 'stopcharge':
      case 'refuel':
        return 1 // Maintenance actions are cheap
        
      default:
        return 3 // Default medium cost
    }
  }
  
  // For other PDDL types, use simpler cost model
  switch (actionName) {
    case 'move': 
    case 'drive-truck':
    case 'drive-between-cities':
    case 'startmove':
    case 'reprisemovement':
      return 2 // Movement costs more
      
    case 'pick': 
    case 'drop':
    case 'load':
    case 'unload':
    case 'load-truck':
    case 'unload-truck':
      return 1 // Object manipulation is standard
      
    case 'startcharge':
    case 'stopcharge':
    case 'refuel':
      return 0 // Maintenance actions are free
      
    default: 
      return 1 // Default unit cost
  }
}

/**
 * Extract entities (robot, object, rooms) from action parameters
 */
function extractActionEntities(action, actionName, parameters) {
  // Pick/Load actions: (pick object room robot) or (load-truck object truck location)
  if ((actionName === 'pick' || actionName === 'load' || actionName === 'load-truck') && parameters.length >= 3) {
    action.actionType = 'pick'
    action.object = parameters[0]
    
    if (actionName === 'load-truck') {
      action.truck = parameters[1]
      action.room = parameters[2]
      action.robot = parameters[1] // Truck acts as robot
    } else {
      action.room = parameters[1]
      action.robot = parameters[2]
    }
  }
  
  // Drop/Unload actions: (drop object room robot) or (unload-truck object truck location)
  else if ((actionName === 'drop' || actionName === 'unload' || actionName === 'unload-truck') && parameters.length >= 3) {
    action.actionType = 'drop'
    action.object = parameters[0]
    
    if (actionName === 'unload-truck') {
      action.truck = parameters[1]
      action.room = parameters[2]
      action.robot = parameters[1] // Truck acts as robot
    } else {
      action.room = parameters[1]
      action.robot = parameters[2]
    }
  }
  
  // Movement actions: (move robot from-room to-room) or (drive-truck truck from to)
  else if ((actionName === 'move' || actionName === 'drive-truck' || actionName === 'drive-between-cities') && parameters.length >= 3) {
    action.actionType = 'move'
    action.robot = parameters[0]
    action.fromRoom = parameters[1]
    action.toRoom = parameters[2]
  }
  
  // PDDL+ movement actions: (startmove robot from to) or (reprisemovement robot from to)
  else if ((actionName === 'startmove' || actionName === 'reprisemovement') && parameters.length >= 3) {
    action.actionType = 'move'
    action.robot = parameters[0]
    action.fromRoom = parameters[1]
    action.toRoom = parameters[2]
  }
  
  // Charging actions: (startcharge robot) or (stopcharge robot)
  else if ((actionName === 'startcharge' || actionName === 'stopcharge') && parameters.length >= 1) {
    action.actionType = 'charge'
    action.robot = parameters[0]
  }
  
  // Refuel actions: (refuel robot location)
  else if (actionName === 'refuel' && parameters.length >= 2) {
    action.actionType = 'refuel'
    action.robot = parameters[0]
    action.room = parameters[1]
  }
  
  // Unknown action - try to guess entities
  else {
    action.actionType = 'unknown'
    
    // Try to identify robot (usually first parameter that looks like a robot name)
    for (const param of parameters) {
      if (param.includes('robot') || param === 'wally' || param === 'eve' || 
          param.includes('truck') || param.includes('agent')) {
        action.robot = param
        break
      }
    }
    
    // Try to identify object (parameters with 'ball', 'box', 'package', etc.)
    for (const param of parameters) {
      if (param.includes('ball') || param.includes('box') || param.includes('package') || 
          param.includes('item') || param.includes('obj') || param.includes('crate')) {
        action.object = param
        break
      }
    }
    
    // Try to identify rooms (parameters with 'room', 'location', etc.)
    for (const param of parameters) {
      if (param.includes('room') || param.includes('location') || param.includes('depot') ||
          param.includes('city') || param.includes('warehouse')) {
        if (!action.room) {
          action.room = param
        } else if (!action.fromRoom) {
          action.fromRoom = action.room
          action.toRoom = param
          action.room = null
        }
        break
      }
    }
    
    console.log(`⚠️ Unknown action type for "${actionName}", extracted:`, {
      robot: action.robot,
      object: action.object,
      room: action.room,
      fromRoom: action.fromRoom,
      toRoom: action.toRoom
    })
  }
}

/**
 * Extract all entities from parsed actions for 3D scene setup
 */
export function extractEntitiesFromActions(actions) {
  const robots = new Set()
  const objects = new Set()
  const rooms = new Set()
  
  actions.forEach(action => {
    // Extract robots
    if (action.robot) robots.add(action.robot)
    if (action.truck) robots.add(action.truck) // Trucks act as robots
    
    // Extract objects
    if (action.object) objects.add(action.object)
    
    // Extract rooms
    if (action.room) rooms.add(action.room)
    if (action.fromRoom) rooms.add(action.fromRoom)
    if (action.toRoom) rooms.add(action.toRoom)
    
    // Also check parameters for additional entities
    action.parameters?.forEach(param => {
      if (param.includes('robot') || param === 'wally' || param === 'eve') {
        robots.add(param)
      } else if (param.includes('ball') || param.includes('box') || param.includes('item')) {
        objects.add(param)
      } else if (param.includes('room') || param.includes('location')) {
        rooms.add(param)
      }
    })
  })
  
  const entities = {
    robots: Array.from(robots),
    objects: Array.from(objects),
    rooms: Array.from(rooms)
  }
  
  console.log('🎯 Extracted entities for 3D scene:', entities)
  
  return entities
}

/**
 * Validate parsed actions for 3D simulation requirements
 */
export function validateActionsFor3D(actions) {
  const errors = []
  const warnings = []
  
  if (!actions || actions.length === 0) {
    errors.push('No actions found in plan file')
    return { valid: false, errors, warnings }
  }
  
  const entities = extractEntitiesFromActions(actions)
  
  // Check for minimum requirements
  if (entities.robots.length === 0) {
    errors.push('No robots found in plan - need at least one robot for 3D simulation')
  }
  
  if (entities.rooms.length < 2) {
    warnings.push('Less than 2 rooms found - movement visualization will be limited')
  }
  
  // Check action types
  const actionTypes = new Set(actions.map(a => a.actionType))
  if (!actionTypes.has('move')) {
    warnings.push('No movement actions found - robots will not move between rooms')
  }
  
  // Check for unknown actions
  const unknownActions = actions.filter(a => a.actionType === 'unknown')
  if (unknownActions.length > 0) {
    warnings.push(`${unknownActions.length} unknown action(s) found - may not visualize correctly`)
  }
  
  console.log('✅ Action validation complete:', {
    totalActions: actions.length,
    entities,
    errors: errors.length,
    warnings: warnings.length
  })
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entities,
    stats: {
      totalActions: actions.length,
      actionTypes: Array.from(actionTypes),
      averageDuration: actions.reduce((sum, a) => sum + a.duration, 0) / actions.length
    }
  }
}

// Export default parsing function
export default parseRobotPlanFile