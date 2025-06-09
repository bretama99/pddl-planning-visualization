// Robot-Specific PDDL Parser - src/utils/robotPDDLParser.js

/**
 * Enhanced PDDL Plan Parser specifically optimized for Robot domain
 * Supports Classical, Temporal, Numerical, and PDDL+ plans
 */

export function parseRobotPlanFile(content, pddlType = 'classical') {
  console.log('=== PARSING ROBOT PLAN FILE ===')
  console.log('PDDL Type:', pddlType)
  console.log('Content preview:', content.substring(0, 500))
  
  // Validate input
  if (!content || content.trim().length === 0) {
    return {
      actions: [],
      entities: {},
      error: 'Empty or invalid plan file content'
    }
  }

  // Check if this is a domain/problem file instead of a plan
  if (content.includes('(define (domain') || content.includes('(define (problem')) {
    return {
      actions: [],
      entities: {},
      error: 'This appears to be a domain/problem file, not a plan. Please upload the generated plan file.'
    }
  }
  
  // Clean and filter plan content
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => isValidPlanLine(line))

  console.log('Filtered lines count:', lines.length)

  const actions = []
  const entities = {
    rooms: new Set(),
    objects: new Set(),
    robots: new Set()
  }

  // Parse actions based on PDDL type
  lines.forEach((line, index) => {
    let actionData = null

    switch (pddlType) {
      case 'classical':
        actionData = parseClassicalRobotAction(line, index)
        break
      case 'temporal':
        actionData = parseTemporalRobotAction(line, index)
        break
      case 'numerical':
        actionData = parseNumericalRobotAction(line, index)
        break
      case 'pddl_plus':
        actionData = parsePDDLPlusRobotAction(line, index)
        break
      default:
        actionData = parseClassicalRobotAction(line, index)
    }

    if (actionData) {
      actions.push(actionData)
      extractRobotEntities(actionData, entities)
    }
  })

  // Post-process and validate entities
  validateAndEnhanceRobotEntities(entities, actions)

  const result = {
    actions,
    rooms: Array.from(entities.rooms),
    objects: Array.from(entities.objects),
    robots: Array.from(entities.robots),
    pddlType,
    domain: 'robot',
    totalDuration: calculateRobotPlanDuration(actions, pddlType),
    metrics: calculateRobotPlanMetrics(actions, pddlType),
    initialState: analyzeRobotInitialState(actions, entities)
  }

  console.log('=== ROBOT PLAN PARSE RESULT ===')
  console.log('Actions found:', result.actions.length)
  console.log('Rooms found:', result.rooms)
  console.log('Objects found:', result.objects)
  console.log('Robots found:', result.robots)
  console.log('Total Duration:', result.totalDuration)
  console.log('Plan Metrics:', result.metrics)

  return result
}

/**
 * Check if a line is a valid plan action line
 */
function isValidPlanLine(line) {
  return line.length > 0 && 
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
         !line.includes('g(n)=') &&
         !line.includes('h(n)=') &&
         !line.includes('problem solved') &&
         !line.includes('found plan:') &&
         !line.includes('heuristic time') &&
         !line.includes('search time') &&
         !line.includes('states evaluated') &&
         (line.includes(':') || line.includes('(')) &&
         (line.includes('pick') || line.includes('drop') || line.includes('move') || 
          line.includes('go') || line.includes('navigate') || line.includes('charge') ||
          line.includes('wait') || line.includes('noop') || line.includes('('))
}

/**
 * Parse Classical PDDL robot actions (step-based)
 */
function parseClassicalRobotAction(line, index) {
  // Format variations:
  // "Step 1: (pick ball1 room1 robot1)"
  // "1: (pick ball1 room1 robot1)"
  // "1. pick ball1 room1 robot1"
  
  let stepMatch = line.match(/^(?:Step\s+)?(\d+)[:.]?\s*(?:\()?([^)]*)\)?/i)
  
  if (stepMatch) {
    const stepNumber = parseInt(stepMatch[1])
    const actionContent = stepMatch[2].trim()
    
    // Handle both parentheses and non-parentheses formats
    const cleanAction = actionContent.replace(/^\(|\)$/g, '')
    const actionParts = cleanAction.split(/\s+/).filter(part => part.length > 0)
    
    if (actionParts.length === 0) return null
    
    const actionName = actionParts[0].toLowerCase()
    const parameters = actionParts.slice(1)

    // Validate robot-specific actions
    if (!isValidRobotAction(actionName)) {
      console.warn(`❓ Unknown robot action: ${actionName}`)
      return null
    }

    return {
      id: `robot-action-${index}`,
      name: actionName,
      parameters: parameters,
      step: stepNumber,
      start: stepNumber,
      end: stepNumber + 1,
      duration: 1.0,
      type: 'classical',
      cost: calculateRobotActionCost(actionName, parameters),
      preconditions: inferRobotPreconditions(actionName, parameters),
      effects: inferRobotEffects(actionName, parameters)
    }
  }
  
  return null
}

/**
 * Parse Temporal PDDL robot actions (time-based with durations)
 */
function parseTemporalRobotAction(line, index) {
  // Format variations:
  // "0.000: (pick ball1 room1 robot1) [1.000]"
  // "5.5: (move robot1 room1 room2) [D:2.5]"
  // "10.0: start-move robot1 room1 room2"
  
  let temporalMatch = line.match(/^(\d+(?:\.\d+)?)\s*:\s*(?:\()?([^)]+)\)?(?:\s*\[(?:D:)?(\d+(?:\.\d+)?)\])?/i)
  
  if (temporalMatch) {
    const startTime = parseFloat(temporalMatch[1])
    const actionContent = temporalMatch[2].trim()
    const duration = temporalMatch[3] ? parseFloat(temporalMatch[3]) : estimateRobotActionDuration(actionContent)
    
    const actionParts = actionContent.split(/\s+/).filter(part => part.length > 0)
    if (actionParts.length === 0) return null
    
    let actionName = actionParts[0].toLowerCase()
    let parameters = actionParts.slice(1)
    
    // Handle durative action markers
    if (actionName.startsWith('start-') || actionName.startsWith('end-')) {
      const baseAction = actionName.replace(/^(start-|end-)/, '')
      actionName = baseAction
    }

    if (!isValidRobotAction(actionName)) return null

    return {
      id: `robot-temporal-${index}`,
      name: actionName,
      parameters: parameters,
      start: startTime,
      end: startTime + duration,
      duration: duration,
      type: 'temporal',
      cost: calculateRobotActionCost(actionName, parameters) * duration,
      preconditions: inferRobotPreconditions(actionName, parameters),
      effects: inferRobotEffects(actionName, parameters),
      parallel: false // Will be determined later
    }
  }
  
  return null
}

/**
 * Parse Numerical PDDL robot actions (with numeric effects and preconditions)
 */
function parseNumericalRobotAction(line, index) {
  // Format variations:
  // "0.000: (move robot1 room1 room2) [fuel: -2.5] [distance: +5.0]"
  // "5.0: (pick ball1 room1 robot1) [energy: -1.0] [load: +1]"
  
  let numericalMatch = line.match(/^(\d+(?:\.\d+)?)\s*:\s*(?:\()?([^)]+)\)?(?:\s*\[(.*?)\])?/i)
  
  if (numericalMatch) {
    const startTime = parseFloat(numericalMatch[1])
    const actionContent = numericalMatch[2].trim()
    const numericalEffectsStr = numericalMatch[3] || ''
    
    const actionParts = actionContent.split(/\s+/).filter(part => part.length > 0)
    if (actionParts.length === 0) return null
    
    const actionName = actionParts[0].toLowerCase()
    const parameters = actionParts.slice(1)

    if (!isValidRobotAction(actionName)) return null

    // Parse numerical effects
    const numericalEffects = parseRobotNumericalEffects(numericalEffectsStr)
    const duration = numericalEffects.find(e => e.variable === 'duration')?.value || 
                    estimateRobotActionDuration(actionContent)
    const cost = Math.abs(numericalEffects.find(e => e.variable === 'cost')?.value || 
                         calculateRobotActionCost(actionName, parameters))

    return {
      id: `robot-numerical-${index}`,
      name: actionName,
      parameters: parameters,
      start: startTime,
      end: startTime + duration,
      duration: duration,
      type: 'numerical',
      cost: cost,
      numericalEffects: numericalEffects,
      preconditions: inferRobotPreconditions(actionName, parameters),
      effects: inferRobotEffects(actionName, parameters),
      resourceRequirements: calculateRobotResourceRequirements(actionName, parameters)
    }
  }
  
  return null
}

/**
 * Parse PDDL+ robot actions (hybrid discrete/continuous)
 */
function parsePDDLPlusRobotAction(line, index) {
  // Format variations:
  // "0.000: (move robot1 room1 room2) {action} [rate: 1.5/sec]"
  // "5.0: (charge robot1) {process} [energy-rate: +2.0]"
  // "10.0: (collision-detected robot1) {event}"
  
  let pddlPlusMatch = line.match(/^(\d+(?:\.\d+)?)\s*:\s*(?:\()?([^)]+)\)?(?:\s*\{(event|process|action)\})?(?:\s*\[(.*?)\])?/i)
  
  if (pddlPlusMatch) {
    const startTime = parseFloat(pddlPlusMatch[1])
    const actionContent = pddlPlusMatch[2].trim()
    const actionType = pddlPlusMatch[3] || 'action'
    const additionalInfo = pddlPlusMatch[4] || ''
    
    const actionParts = actionContent.split(/\s+/).filter(part => part.length > 0)
    if (actionParts.length === 0) return null
    
    const actionName = actionParts[0].toLowerCase()
    const parameters = actionParts.slice(1)

    // Enhanced validation for PDDL+ robot actions
    if (!isValidRobotAction(actionName) && !isValidRobotEvent(actionName)) return null

    // Parse continuous effects and rates
    const continuousEffects = parseRobotContinuousEffects(additionalInfo)
    const duration = actionType === 'event' ? 0 : (continuousEffects.duration || 
                    estimateRobotActionDuration(actionContent))

    return {
      id: `robot-pddl-plus-${index}`,
      name: actionName,
      parameters: parameters,
      start: startTime,
      end: startTime + duration,
      duration: duration,
      type: 'pddl-plus',
      actionType: actionType, // event, process, or action
      cost: calculateRobotActionCost(actionName, parameters),
      continuousEffects: continuousEffects.effects,
      rate: continuousEffects.rate,
      preconditions: inferRobotPreconditions(actionName, parameters),
      effects: inferRobotEffects(actionName, parameters)
    }
  }
  
  return null
}

/**
 * Check if an action is valid for robot domain
 */
function isValidRobotAction(actionName) {
  const validActions = [
    'pick', 'pickup', 'grasp', 'take',
    'drop', 'putdown', 'place', 'release',
    'move', 'go', 'navigate', 'travel',
    'charge', 'startcharge', 'stopcharge', 'endcharge',
    'wait', 'noop', 'idle', 'pause'
  ]
  return validActions.includes(actionName.toLowerCase())
}

/**
 * Check if an event is valid for robot domain (PDDL+)
 */
function isValidRobotEvent(eventName) {
  const validEvents = [
    'collision-detected', 'battery-low', 'obstacle-detected',
    'task-completed', 'emergency-stop', 'sensor-triggered'
  ]
  return validEvents.includes(eventName.toLowerCase())
}

/**
 * Estimate duration for robot actions (when not specified)
 */
function estimateRobotActionDuration(actionContent) {
  const actionName = actionContent.split(/\s+/)[0].toLowerCase()
  
  switch (actionName) {
    case 'pick':
    case 'pickup':
    case 'drop':
    case 'putdown':
      return 1.0 // Quick manipulation actions
    case 'move':
    case 'go':
    case 'navigate':
      return 3.0 // Movement takes longer
    case 'charge':
    case 'startcharge':
      return 5.0 // Charging is slow
    case 'wait':
    case 'noop':
      return 0.5 // Brief pauses
    default:
      return 1.0 // Default duration
  }
}

/**
 * Calculate cost for robot actions
 */
function calculateRobotActionCost(actionName) {
  switch (actionName.toLowerCase()) {
    case 'move':
    case 'go':
    case 'navigate':
      return 2.0 // Movement is expensive
    case 'pick':
    case 'pickup':
    case 'drop':
    case 'putdown':
      return 1.0 // Manipulation has moderate cost
    case 'charge':
    case 'startcharge':
      return 0.5 // Charging is low cost action itself
    case 'wait':
    case 'noop':
      return 0.1 // Waiting is nearly free
    default:
      return 1.0 // Default cost
  }
}

/**
 * Parse numerical effects specific to robot domain
 */
function parseRobotNumericalEffects(effectsString) {
  const effects = []
  if (!effectsString) return effects
  
  // Parse patterns like "fuel: -2.5", "energy: -1.0", "load: +1"
  const effectMatches = effectsString.match(/(\w+):\s*([+-]?\d+(?:\.\d+)?)/g)
  
  if (effectMatches) {
    effectMatches.forEach(match => {
      const [variable, valueStr] = match.split(':').map(s => s.trim())
      const value = parseFloat(valueStr)
      
      effects.push({
        variable: variable.toLowerCase(),
        value: value,
        operator: value >= 0 ? 'increase' : 'decrease'
      })
    })
  }
  
  return effects
}

/**
 * Parse continuous effects for PDDL+ robot domain
 */
function parseRobotContinuousEffects(effectsString) {
  const result = {
    effects: [],
    rate: 1.0,
    duration: 1.0
  }
  
  if (!effectsString) return result
  
  // Parse patterns like "rate: 2.5/sec", "energy-rate: +2.0", "fuel-rate: -0.5"
  const rateMatch = effectsString.match(/rate:\s*(\d+(?:\.\d+)?)(?:\/sec)?/i)
  if (rateMatch) {
    result.rate = parseFloat(rateMatch[1])
  }
  
  const durationMatch = effectsString.match(/duration:\s*(\d+(?:\.\d+)?)/i)
  if (durationMatch) {
    result.duration = parseFloat(durationMatch[1])
  }
  
  // Parse continuous variable effects
  const effectMatches = effectsString.match(/(\w+)-rate:\s*([+-]?\d+(?:\.\d+)?)/g)
  if (effectMatches) {
    effectMatches.forEach(match => {
      const [variable, rateStr] = match.replace('-rate', '').split(':').map(s => s.trim())
      const rate = parseFloat(rateStr)
      
      result.effects.push({
        variable: variable.toLowerCase(),
        rate: rate,
        type: 'continuous'
      })
    })
  }
  
  return result
}

/**
 * Extract entities specific to robot domain
 */
function extractRobotEntities(action, entitySets) {
  const { name, parameters } = action
  const actionName = name.toLowerCase()
  
  // Robot domain specific entity extraction
  parameters.forEach((param) => {
    const paramLower = param.toLowerCase()
    
    // Identify robots
    if (paramLower.includes('robot') || paramLower.includes('bot') || 
        paramLower.includes('agent') || paramLower.includes('wally') || 
        paramLower.includes('eve')) {
      entitySets.robots.add(param)
    }
    // Identify rooms/locations
    else if (paramLower.includes('room') || paramLower.includes('location') || 
             paramLower.includes('area') || paramLower.includes('zone') ||
             paramLower.includes('space') || paramLower.includes('chamber')) {
      entitySets.rooms.add(param)
    }
    // Identify objects
    else if (paramLower.includes('ball') || paramLower.includes('box') || 
             paramLower.includes('item') || paramLower.includes('object') ||
             paramLower.includes('package') || paramLower.includes('cargo') ||
             paramLower.includes('tool') || paramLower.includes('part')) {
      entitySets.objects.add(param)
    }
  })
  
  // Action-specific entity extraction for robot domain
  switch (actionName) {
    case 'pick':
    case 'pickup':
    case 'drop':
    case 'putdown':
      // Format: pick object room robot
      if (parameters.length >= 3) {
        entitySets.objects.add(parameters[0])
        entitySets.rooms.add(parameters[1])
        entitySets.robots.add(parameters[2])
      }
      break
      
    case 'move':
    case 'go':
    case 'navigate':
      // Format: move robot from_room to_room
      if (parameters.length >= 3) {
        entitySets.robots.add(parameters[0])
        entitySets.rooms.add(parameters[1])
        entitySets.rooms.add(parameters[2])
      }
      break
      
    case 'charge':
    case 'startcharge':
    case 'stopcharge':
      // Format: charge robot [location]
      if (parameters.length >= 1) {
        entitySets.robots.add(parameters[0])
        if (parameters.length >= 2) {
          entitySets.rooms.add(parameters[1])
        }
      }
      break
  }
}

/**
 * Validate and enhance robot entities with defaults
 */
function validateAndEnhanceRobotEntities(entities, actions) {
  // Ensure we have at least some entities for visualization
  if (entities.robots.size === 0) {
    entities.robots.add('robot1')
    console.warn('⚠️ No robots found, adding default robot1')
  }
  
  if (entities.rooms.size === 0) {
    ['roomA', 'roomB', 'roomC'].forEach(room => entities.rooms.add(room))
    console.warn('⚠️ No rooms found, adding default rooms')
  }
  
  if (entities.objects.size === 0 && actions.some(a => ['pick', 'drop'].includes(a.name))) {
    ['ball1', 'ball2', 'box1'].forEach(obj => entities.objects.add(obj))
    console.warn('⚠️ No objects found but pick/drop actions exist, adding default objects')
  }
}

/**
 * Calculate total duration for robot plan
 */
function calculateRobotPlanDuration(actions, pddlType) {
  if (actions.length === 0) return 0
  
  switch (pddlType) {
    case 'classical':
      return actions.length // Each step = 1 unit
      
    case 'temporal':
    case 'numerical':
    case 'pddl_plus':
      return Math.max(...actions.map(a => a.end || a.start + a.duration))
      
    default:
      return actions.length
  }
}

/**
 * Calculate robot-specific plan metrics
 */
function calculateRobotPlanMetrics(actions, pddlType) {
  const metrics = {
    totalActions: actions.length,
    totalCost: 0,
    parallelActions: 0,
    averageDuration: 0,
    pickActions: 0,
    dropActions: 0,
    moveActions: 0,
    chargeActions: 0,
    totalDistance: 0,
    energyConsumption: 0
  }
  
  // Count action types
  actions.forEach(action => {
    metrics.totalCost += action.cost || 1
    
    switch (action.name.toLowerCase()) {
      case 'pick':
      case 'pickup':
        metrics.pickActions++
        break
      case 'drop':
      case 'putdown':
        metrics.dropActions++
        break
      case 'move':
      case 'go':
      case 'navigate':
        metrics.moveActions++
        metrics.totalDistance += action.cost || 2
        break
      case 'charge':
      case 'startcharge':
        metrics.chargeActions++
        break
    }
    
    // Calculate energy consumption for numerical plans
    if (action.numericalEffects) {
      const energyEffect = action.numericalEffects.find(e => e.variable === 'energy')
      if (energyEffect && energyEffect.value < 0) {
        metrics.energyConsumption += Math.abs(energyEffect.value)
      }
    }
  })
  
  metrics.averageDuration = actions.reduce((sum, action) => sum + action.duration, 0) / actions.length
  
  // Calculate parallel actions for temporal plans
  if (pddlType === 'temporal' || pddlType === 'pddl_plus') {
    const timeSlots = new Map()
    actions.forEach(action => {
      for (let t = Math.floor(action.start); t < Math.ceil(action.end); t++) {
        if (!timeSlots.has(t)) timeSlots.set(t, 0)
        timeSlots.set(t, timeSlots.get(t) + 1)
      }
    })
    
    if (timeSlots.size > 0) {
      metrics.parallelActions = Math.max(...Array.from(timeSlots.values()))
    }
  }
  
  return metrics
}

/**
 * Analyze initial state for robot domain
 */
function analyzeRobotInitialState(actions, entities) {
  const initialState = {
    robotLocations: new Map(),
    objectLocations: new Map(),
    robotCarrying: new Map()
  }
  
  // Infer initial robot positions from first move actions
  entities.robots.forEach(robot => {
    const firstMoveAction = actions.find(action => 
      ['move', 'go', 'navigate'].includes(action.name.toLowerCase()) && 
      action.parameters.includes(robot)
    )
    
    if (firstMoveAction && firstMoveAction.parameters.length >= 2) {
      const fromRoom = firstMoveAction.parameters[1]
      initialState.robotLocations.set(robot, fromRoom)
    } else {
      // Default to first room
      const firstRoom = Array.from(entities.rooms)[0]
      if (firstRoom) {
        initialState.robotLocations.set(robot, firstRoom)
      }
    }
  })
  
  // Infer initial object locations from first pick actions
  entities.objects.forEach(obj => {
    const firstPickAction = actions.find(action => 
      ['pick', 'pickup'].includes(action.name.toLowerCase()) && 
      action.parameters.includes(obj)
    )
    
    if (firstPickAction && firstPickAction.parameters.length >= 2) {
      const fromRoom = firstPickAction.parameters[1]
      initialState.objectLocations.set(obj, fromRoom)
    } else {
      // Default to random room
      const rooms = Array.from(entities.rooms)
      const randomRoom = rooms[Math.floor(Math.random() * rooms.length)]
      if (randomRoom) {
        initialState.objectLocations.set(randomRoom, obj)
      }
    }
  })
  
  // Initialize robot carrying status (empty initially)
  entities.robots.forEach(robot => {
    initialState.robotCarrying.set(robot, [])
  })
  
  return initialState
}

/**
 * Infer preconditions for robot actions
 */
function inferRobotPreconditions(actionName, parameters) {
  const preconditions = []
  
  switch (actionName.toLowerCase()) {
    case 'pick':
    case 'pickup':
      if (parameters.length >= 3) {
        const obj = parameters[0]
        const room = parameters[1]
        const robot = parameters[2]
        preconditions.push(`(at ${obj} ${room})`)
        preconditions.push(`(at ${robot} ${room})`)
        preconditions.push(`(empty-handed ${robot})`)
      }
      break
      
    case 'drop':
    case 'putdown':
      if (parameters.length >= 3) {
        const obj = parameters[0]
        const room = parameters[1]
        const robot = parameters[2]
        preconditions.push(`(carrying ${robot} ${obj})`)
        preconditions.push(`(at ${robot} ${room})`)
      }
      break
      
    case 'move':
    case 'go':
    case 'navigate':
      if (parameters.length >= 3) {
        const robot = parameters[0]
        const fromRoom = parameters[1]
        preconditions.push(`(at ${robot} ${fromRoom})`)
      }
      break
  }
  
  return preconditions
}

/**
 * Infer effects for robot actions
 */
function inferRobotEffects(actionName, parameters) {
  const effects = []
  
  switch (actionName.toLowerCase()) {
    case 'pick':
    case 'pickup':
      if (parameters.length >= 3) {
        const obj = parameters[0]
        const room = parameters[1]
        const robot = parameters[2]
        effects.push(`(not (at ${obj} ${room}))`)
        effects.push(`(carrying ${robot} ${obj})`)
        effects.push(`(not (empty-handed ${robot}))`)
      }
      break
      
    case 'drop':
    case 'putdown':
      if (parameters.length >= 3) {
        const obj = parameters[0]
        const room = parameters[1]
        const robot = parameters[2]
        effects.push(`(at ${obj} ${room})`)
        effects.push(`(not (carrying ${robot} ${obj}))`)
        effects.push(`(empty-handed ${robot})`)
      }
      break
      
    case 'move':
    case 'go':
    case 'navigate':
      if (parameters.length >= 3) {
        const robot = parameters[0]
        const fromRoom = parameters[1]
        const toRoom = parameters[2]
        effects.push(`(not (at ${robot} ${fromRoom}))`)
        effects.push(`(at ${robot} ${toRoom})`)
      }
      break
      
    case 'charge':
    case 'startcharge':
      if (parameters.length >= 1) {
        const robot = parameters[0]
        effects.push(`(charging ${robot})`)
      }
      break
      
    case 'stopcharge':
      if (parameters.length >= 1) {
        const robot = parameters[0]
        effects.push(`(not (charging ${robot}))`)
        effects.push(`(full-battery ${robot})`)
      }
      break
  }
  
  return effects
}

/**
 * Calculate resource requirements for robot actions
 */
function calculateRobotResourceRequirements(actionName) {
  const requirements = {}
  
  switch (actionName.toLowerCase()) {
    case 'move':
    case 'go':
    case 'navigate':
      requirements.energy = 5.0
      requirements.fuel = 2.0
      break
      
    case 'pick':
    case 'pickup':
    case 'drop':
    case 'putdown':
      requirements.energy = 1.0
      break
      
    case 'charge':
      requirements.energy = -10.0 // Charging restores energy
      break
      
    default:
      requirements.energy = 0.5
  }
  
  return requirements
}

/**
 * Validate robot plan consistency
 */
function validateRobotPlan(planData) {
  const issues = []
  
  // Check for basic plan structure
  if (!planData.actions || planData.actions.length === 0) {
    issues.push('No actions found in plan')
    return { valid: false, issues }
  }
  
  // Check for required entities
  if (!planData.robots || planData.robots.length === 0) {
    issues.push('No robots found in plan')
  }
  
  // Validate action sequences for robot domain
  const robotStates = new Map()
  
  planData.actions.forEach((action, index) => {
    const actionName = action.name.toLowerCase()
    
    // Validate pick/drop sequences
    if (['pick', 'pickup'].includes(actionName) && action.parameters.length >= 3) {
      const robot = action.parameters[2]
      const obj = action.parameters[0]
      
      if (!robotStates.has(robot)) {
        robotStates.set(robot, { carrying: [], location: null })
      }
      
      const robotState = robotStates.get(robot)
      
      if (robotState.carrying.includes(obj)) {
        issues.push(`Action ${index}: Robot ${robot} already carrying ${obj}`)
      }
      
      robotState.carrying.push(obj)
    }
    
    if (['drop', 'putdown'].includes(actionName) && action.parameters.length >= 3) {
      const robot = action.parameters[2]
      const obj = action.parameters[0]
      
      if (!robotStates.has(robot)) {
        robotStates.set(robot, { carrying: [], location: null })
      }
      
      const robotState = robotStates.get(robot)
      
      if (!robotState.carrying.includes(obj)) {
        issues.push(`Action ${index}: Robot ${robot} not carrying ${obj}`)
      }
      
      robotState.carrying = robotState.carrying.filter(item => item !== obj)
    }
  })
  
  return {
    valid: issues.length === 0,
    issues: issues,
    warnings: issues.length > 0 ? ['Plan has consistency issues but may still be visualizable'] : []
  }
}

/**
 * Export utility functions
 */
export {
  parseClassicalRobotAction,
  parseTemporalRobotAction,
  parseNumericalRobotAction,
  parsePDDLPlusRobotAction,
  extractRobotEntities,
  calculateRobotPlanDuration,
  calculateRobotPlanMetrics,
  analyzeRobotInitialState,
  validateRobotPlan,
  isValidRobotAction,
  estimateRobotActionDuration,
  calculateRobotActionCost
}