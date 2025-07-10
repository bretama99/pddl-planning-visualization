export function parseElevatorPlanFile(content, pddlType = 'classical') {
  console.log('🛗 Enhanced Elevator Parser - Parsing content:', {
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
               line.includes('up') || 
               line.includes('down') || 
               line.includes('board') ||
               line.includes('depart') ||
               line.includes('move') ||
               line.includes('load') ||
               line.includes('unload') ||
               line.includes('serve') ||
               line.includes('lift') ||
               line.includes('waiting') ||
               line.includes('charge') ||
               line.includes('start') ||
               line.includes('stop') ||
               line.includes('process')
             ))
    })

  console.log(`📋 Filtered ${lines.length} action lines from ${content.split('\n').length} total lines`)

  const actions = []
  
  lines.forEach((line, index) => {
    const action = parseElevatorActionLine(line, index, pddlType)
    if (action) {
      actions.push(action)
      console.log(`✅ Parsed action ${index + 1}:`, {
        name: action.name,
        type: action.actionType,
        duration: action.duration,
        cost: action.cost,
        elevator: action.elevator,
        passenger: action.passenger,
        floor: action.floor
      })
    } else {
      console.log(`⚠️ Failed to parse line ${index + 1}: "${line}"`)
    }
  })

  // Sort actions by time for temporal PDDL
  if (pddlType === 'temporal') {
    actions.sort((a, b) => a.start - b.start)
  }

  console.log(`🎉 Successfully parsed ${actions.length} elevator actions`)
  return actions
}

/**
 * Parse individual elevator action line with realistic timing
 */
function parseElevatorActionLine(line, index, pddlType) {
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
          parameters: []
        }
      }
    }
    
    // Handle process actions
    if (line.includes('start') || line.includes('stop') || line.includes('begin') || line.includes('end')) {
      if (line.includes('start') || line.includes('begin')) {
        isProcess = true
      } else {
        isEvent = true
      }
    }
  }
  
  // Parse temporal PDDL format: "0.000: (move-up fast0) [2.000]"
  if (pddlType === 'temporal') {
    match = line.match(/^(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)\s*\[(\d+(?:\.\d+)?)\]/)
    if (match) {
      timeOrStep = parseFloat(match[1])
      actionContent = match[2].trim()
      duration = parseFloat(match[3])
    }
  }
  
  // Parse time-based format: "0.000: (action ...)" 
  if (!actionContent) {
    match = line.match(/^(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)/)
    if (match) {
      timeOrStep = parseFloat(match[1])
      actionContent = match[2].trim()
    }
  }
  
  // Parse step format: "Step 1: action ..." or "1: action ..."
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
  
  // Calculate realistic durations for elevator movement
  duration = calculateElevatorDuration(actionName, pddlType)
  cost = calculateElevatorCost(actionName, pddlType)
  
  // Create base action object
  const action = {
    id: `action-${index}`,
    name: actionName,
    parameters: parameters,
    step: pddlType === 'classical' ? Math.floor(timeOrStep) : index,
    start: timeOrStep,
    end: timeOrStep + duration,
    duration: duration,
    time: timeOrStep,
    type: pddlType,
    cost: cost,
    raw: line,
    isWaiting: isWaiting,
    isProcess: isProcess,
    isEvent: isEvent
  }
  
  // Extract specific entities and action type based on action name
  extractElevatorEntities(action, actionName, parameters)
  
  console.log(`✅ Parsed ${pddlType} elevator action:`, {
    name: action.name,
    type: action.actionType,
    duration: action.duration,
    elevator: action.elevator,
    passenger: action.passenger,
    floor: action.floor
  })
  
  return action
}

/**
 * Calculate realistic durations for elevator operations
 */
function calculateElevatorDuration(actionName, pddlType) {
  const baseDurations = {
    // Movement actions - realistic elevator speeds
    'up': 3.0,                // 3 seconds to move up one floor
    'down': 2.5,              // 2.5 seconds to move down (gravity assist)
    'move-up': 3.0,
    'move-down': 2.5,
    'move': 3.0,
    
    // Passenger actions - door operations + boarding time
    'board': 2.0,             // 2 seconds for passenger to board
    'depart': 1.5,            // 1.5 seconds for passenger to exit
    'load': 2.0,              // Loading passenger
    'unload': 1.5,            // Unloading passenger
    'enter': 2.0,
    'exit': 1.5,
    
    // Service actions - complete passenger journey
    'serve': 8.0,             // Complete service (board + move + depart)
    'deliver': 8.0,
    
    // Maintenance actions
    'charge': 4.0,            // Charging time
    'start-charge': 0.5,      // Quick start
    'stop-charge': 0.3,       // Quick stop
    'waiting': 1.0,           // Default waiting time
    
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
      // Scale by cost and efficiency for numerical PDDL
      const cost = calculateElevatorCost(actionName, pddlType)
      return baseDuration * Math.max(0.5, cost / 3.0)
    }
      
    case 'pddl+': {
      // PDDL+ processes take longer, events are quick
      const isProcessAction = actionName.includes('start') || actionName.includes('begin')
      const isEventAction = actionName.includes('stop') || actionName.includes('end')
      
      if (isProcessAction) {
        return baseDuration * 1.5 // Processes take longer
      } else if (isEventAction) {
        return baseDuration * 0.3 // Events are quicker
      }
      return baseDuration
    }
      
    case 'classical':
    default: {
      // Classical PDDL - use base durations
      return baseDuration
    }
  }
}

/**
 * Calculate action costs based on PDDL type and action complexity
 */
function calculateElevatorCost(actionName, pddlType = 'classical') {
  if (pddlType === 'numerical') {
    // Higher costs for numerical PDDL
    switch (actionName) {
      case 'up':
      case 'move-up':
        return 8 // Moving up costs more (against gravity)
        
      case 'down':
      case 'move-down':
        return 5 // Moving down costs less (gravity assist)
        
      case 'board':
      case 'load':
      case 'enter':
        return 3 // Boarding operations
        
      case 'depart':
      case 'unload':
      case 'exit':
        return 2 // Exiting operations
        
      case 'serve':
      case 'deliver':
        return 12 // Complete service is expensive
        
      case 'charge':
      case 'start-charge':
      case 'stop-charge':
        return 1 // Maintenance actions
        
      case 'waiting':
        return 1 // Waiting has minimal cost
        
      default:
        return 4 // Default medium cost
    }
  }
  
  // For other PDDL types, use simpler cost model
  switch (actionName) {
    case 'up': 
    case 'move-up':
    case 'down':
    case 'move-down':
    case 'move':
      return 2 // Movement costs more
      
    case 'board': 
    case 'depart':
    case 'load':
    case 'unload':
    case 'enter':
    case 'exit':
      return 1 // Passenger operations are standard
      
    case 'serve':
    case 'deliver':
      return 3 // Service actions cost more
      
    case 'charge':
    case 'start-charge':
    case 'stop-charge':
      return 0 // Maintenance actions are free
      
    case 'waiting':
      return 0 // Waiting is free
      
    default: 
      return 1 // Default unit cost
  }
}

/**
 * Extract entities (elevator, passenger, floors) from action parameters
 */
function extractElevatorEntities(action, actionName, parameters) {
  // Movement actions: (move-up elevatorx) or (move-down elevatorx)
  if (actionName === 'move-up' || actionName === 'move-down') {
    action.actionType = 'move'
    action.elevator = parameters[0] || 'elevator1'
    action.direction = actionName === 'move-up' ? 'up' : 'down'
  }
  
  // Passenger loading: (load passenger elevator)
  else if (actionName === 'load') {
    action.actionType = 'load'
    action.passenger = parameters[0]
    action.elevator = parameters[1] || 'elevator1'
  }
  
  // Passenger unloading: (unload passenger elevator)
  else if (actionName === 'unload') {
    action.actionType = 'unload'
    action.passenger = parameters[0]
    action.elevator = parameters[1] || 'elevator1'
  }
  
  // Reached action: (reached passenger) - delivery confirmation
  else if (actionName === 'reached') {
    action.actionType = 'reached'
    action.passenger = parameters[0]
  }
  
  // Passenger boarding variants: (board passenger floor elevator)
  else if (actionName === 'board' || actionName === 'enter') {
    action.actionType = 'load'
    action.passenger = parameters[0]
    
    if (parameters.length >= 3) {
      action.floor = parameters[1]
      action.elevator = parameters[2]
    } else if (parameters.length >= 2) {
      action.elevator = parameters[1]
    } else {
      action.elevator = 'elevator1'
    }
  }
  
  // Passenger departing variants: (depart passenger floor elevator)
  else if (actionName === 'depart' || actionName === 'exit') {
    action.actionType = 'unload'
    action.passenger = parameters[0]
    
    if (parameters.length >= 3) {
      action.floor = parameters[1]
      action.elevator = parameters[2]
    } else if (parameters.length >= 2) {
      action.elevator = parameters[1]
    } else {
      action.elevator = 'elevator1'
    }
  }
  
  // Service actions: (serve passenger floor1 floor3) - complete journey
  else if (actionName === 'serve' || actionName === 'deliver') {
    action.actionType = 'delivery'
    action.passenger = parameters[0]
    action.origin = parameters[1]
    action.destination = parameters[2]
    action.elevator = parameters[3] || 'elevator1'
  }
  
  // Maintenance actions: (charge elevator) or (start-charge elevator)
  else if (actionName === 'charge' || actionName === 'start-charge' || actionName === 'stop-charge') {
    action.actionType = 'charge'
    action.elevator = parameters[0] || 'elevator1'
  }
  
  // Waiting actions: (waiting) - system synchronization
  else if (actionName === 'waiting') {
    action.actionType = 'wait'
    // No specific entities needed for waiting
  }
  
  // Unknown action - try to guess entities
  else {
    action.actionType = 'unknown'
    
    // Try to identify elevator (usually contains 'elevator', 'lift', or specific names like 'elevatorx')
    for (const param of parameters) {
      if (param.includes('elevator') || param.includes('lift') || param === 'elevatorx' ||
          param.includes('fast') || param.includes('slow') || param.match(/^elevator\w*$/)) {
        action.elevator = param
        break
      }
    }
    
    // Try to identify passenger (usually contains 'person', specific names like 'persona', 'personb')
    for (const param of parameters) {
      if (param.includes('person') || param.includes('passenger') ||
          param.match(/^person[a-z]$/) || param.match(/^p\d+$/)) {
        action.passenger = param
        break
      }
    }
    
    // Try to identify floors (usually contains 'floor', 'f', or is a number)
    for (const param of parameters) {
      if (param.includes('floor') || param.includes('f') || param.match(/^\d+$/) ||
          param.match(/^f\d+$/)) {
        if (!action.floor) {
          action.floor = param
        } else if (!action.origin) {
          action.origin = action.floor
          action.destination = param
          action.floor = null
        }
        break
      }
    }
    
    console.log(`⚠️ Unknown action type for "${actionName}", extracted:`, {
      elevator: action.elevator,
      passenger: action.passenger,
      floor: action.floor,
      origin: action.origin,
      destination: action.destination
    })
  }
  
  // Ensure we always have an elevator
  if (!action.elevator && (action.actionType === 'move' || action.actionType === 'load' || action.actionType === 'unload')) {
    action.elevator = 'elevator1'
  }
}

/**
 * Extract all entities from parsed actions for simulation setup
 */
export function extractEntitiesFromElevatorActions(actions) {
  const elevators = new Set()
  const passengers = new Set()
  const floors = new Set()
  
  actions.forEach(action => {
    // Extract elevators
    if (action.elevator) elevators.add(action.elevator)
    
    // Extract passengers
    if (action.passenger) passengers.add(action.passenger)
    
    // Extract floors
    if (action.floor) floors.add(action.floor)
    if (action.origin) floors.add(action.origin)
    if (action.destination) floors.add(action.destination)
    
    // Also check parameters for additional entities
    action.parameters?.forEach(param => {
      if (param.includes('elevator') || param.includes('lift') || param.includes('fast')) {
        elevators.add(param)
      } else if (param.includes('passenger') || param.includes('person') || param.match(/^p\d+$/)) {
        passengers.add(param)
      } else if (param.includes('floor') || param.match(/^f?\d+$/)) {
        floors.add(param)
      }
    })
  })
  
  // Generate floors if none found - analyze movement patterns
  if (floors.size === 0) {
    const moveActions = actions.filter(a => a.actionType === 'move')
    const floorCount = Math.max(3, moveActions.length + 1)
    
    for (let i = 1; i <= floorCount; i++) {
      floors.add(`Floor${i}`)
    }
  }
  
  const entities = {
    elevators: Array.from(elevators),
    passengers: Array.from(passengers),
    floors: Array.from(floors).sort((a, b) => {
      // Sort floors numerically if possible
      const aNum = parseInt(a.replace(/\D/g, ''))
      const bNum = parseInt(b.replace(/\D/g, ''))
      return aNum - bNum
    })
  }
  
  console.log('🎯 Extracted entities for elevator simulation:', entities)
  
  return entities
}

/**
 * Validate parsed actions for elevator simulation requirements
 */
export function validateElevatorActions(actions) {
  const errors = []
  const warnings = []
  
  if (!actions || actions.length === 0) {
    errors.push('No actions found in plan file')
    return { valid: false, errors, warnings }
  }
  
  const entities = extractEntitiesFromElevatorActions(actions)
  
  // Check for minimum requirements
  if (entities.elevators.length === 0) {
    warnings.push('No elevators found - using default elevator')
  }
  
  if (entities.floors.length < 2) {
    warnings.push('Less than 2 floors found - generating default floors')
  }
  
  // Check action types
  const actionTypes = new Set(actions.map(a => a.actionType))
  if (!actionTypes.has('move')) {
    warnings.push('No movement actions found - elevator will not move between floors')
  }
  
  if (!actionTypes.has('load') && !actionTypes.has('unload')) {
    warnings.push('No passenger actions found - simulation will only show elevator movement')
  }
  
  // Check for unknown actions
  const unknownActions = actions.filter(a => a.actionType === 'unknown')
  if (unknownActions.length > 0) {
    warnings.push(`${unknownActions.length} unknown action(s) found - may not simulate correctly`)
  }
  
  console.log('✅ Elevator action validation complete:', {
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
export default parseElevatorPlanFile