// enhancedPDDLParser.js - Complete Fixed Version with Safe PDDL+ Handling

export function parsePlanFile(content, pddlType = 'classical') {
  console.log('=== PARSING PLAN FILE (ENHANCED) ===')
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
    .filter(line => isValidPlanLine(line, pddlType))

  console.log('Filtered lines count:', lines.length)

  const actions = []
  const entities = {
    rooms: new Set(),
    objects: new Set(),
    robots: new Set(),
    vehicles: new Set(),
    floors: new Set(),
    elevators: new Set(),
    passengers: new Set(),
    packages: new Set(),
    locations: new Set()
  }

  // Parse actions based on PDDL type with separate handling
  lines.forEach((line, index) => {
    let actionData = null

    switch (pddlType) {
      case 'classical':
        actionData = parseClassicalAction(line, index)
        break
      case 'temporal':
        actionData = parseTemporalAction(line, index)
        break
      case 'numerical':
        actionData = parseNumericalAction(line, index)
        break
      case 'pddl+':
      case 'pddl_plus':
        actionData = parsePDDLPlusAction(line, index)
        break
      default:
        actionData = parseClassicalAction(line, index)
    }

    if (actionData) {
      actions.push(actionData)
      extractEntitiesFromAction(actionData, entities)
    }
  })

  // Convert Sets to Arrays
  const finalEntities = {}
  for (const [key, value] of Object.entries(entities)) {
    finalEntities[key] = Array.from(value)
  }

  const result = {
    actions,
    rooms: finalEntities.rooms,
    objects: finalEntities.objects,
    robots: finalEntities.robots,
    vehicles: finalEntities.vehicles,
    floors: finalEntities.floors,
    elevators: finalEntities.elevators,
    passengers: finalEntities.passengers,
    packages: finalEntities.packages,
    locations: finalEntities.locations,
    pddlType,
    domain: 'generic',
    totalDuration: calculateTotalDuration(actions, pddlType),
    metrics: calculateMetrics(actions, pddlType)
  }

  console.log('=== ENHANCED PARSE RESULT ===')
  console.log('Actions found:', result.actions.length)
  console.log('PDDL Type:', pddlType)
  console.log('Total Duration:', result.totalDuration)
  console.log('Entities found:', {
    rooms: result.rooms.length,
    objects: result.objects.length,
    robots: result.robots.length,
    vehicles: result.vehicles.length,
    elevators: result.elevators.length,
    passengers: result.passengers.length,
    packages: result.packages.length,
    locations: result.locations.length
  })

  return result
}

/**
 * Enhanced line validation with PDDL type awareness - FIXED for your PDDL+ format
 */
function isValidPlanLine(line, pddlType = 'classical') {
  if (line.length === 0) return false
  
  // Filter out all metadata and search statistics
  const lowerLine = line.toLowerCase()
  const metadataKeywords = [
    ';', '//', '*', '#',
    'domain parsed', 'problem parsed', 'grounding', 'planning time',
    'plan-length', 'metric', 'expanded nodes', 'states evaluated',
    'g(n)=', 'h(n)=', 'problem solved', 'found plan:', 'makespan',
    'heuristic time', 'search time', 'number of dead-ends',
    'number of duplicates', 'total-time', 'total-cost',
    '|f|:', '|x|:', '|a|:', '|p|:', '|e|:',
    'aibr preprocessing', 'setup time', 'grounding..'
  ]
  
  for (const keyword of metadataKeywords) {
    if (lowerLine.includes(keyword)) {
      return false
    }
  }

  // FIXED: For PDDL+, accept lines that match your format: "0.0: (action ...)"
  if (pddlType === 'pddl+' || pddlType === 'pddl_plus') {
    return /^\d+(?:\.\d+)?\s*:\s*\([^)]+\)/.test(line.trim())
  }

  // Standard validation for other types
  return (line.includes(':') || line.includes('(')) && 
         (line.includes('move') || line.includes('load') || line.includes('unload') ||
          line.includes('up') || line.includes('down') || line.includes('board') ||
          line.includes('depart') || line.includes('reached') || line.includes('serve') ||
          line.includes('pick') || line.includes('drop') || line.includes('drive') ||
          line.includes('fly') || line.includes('sail'))
}

/**
 * Parse Classical PDDL actions (step-based)
 */
function parseClassicalAction(line, index) {
  // Format variations:
  // "Step 1: (action param1 param2)"
  // "1: (action param1 param2)"
  // "1. action param1 param2"
  
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

    return {
      id: `classical-action-${index}`,
      name: actionName,
      parameters: parameters,
      step: stepNumber,
      start: stepNumber,
      end: stepNumber + 1,
      duration: 1.0,
      type: 'classical',
      cost: calculateActionCost(actionName, 'classical'),
      preconditions: [],
      effects: []
    }
  }
  
  return null
}

/**
 * Parse Temporal PDDL actions (time-based with durations)
 */
function parseTemporalAction(line, index) {
  // Format variations:
  // "0.000: (action param1 param2) [1.000]"
  // "5.5: (action param1 param2) [D:2.5]"
  // "10.0: start-action param1 param2"
  
  let temporalMatch = line.match(/^(\d+(?:\.\d+)?)\s*:\s*(?:\()?([^)]+)\)?(?:\s*\[(?:D:)?(\d+(?:\.\d+)?)\])?/i)
  
  if (temporalMatch) {
    const startTime = parseFloat(temporalMatch[1])
    const actionContent = temporalMatch[2].trim()
    const duration = temporalMatch[3] ? parseFloat(temporalMatch[3]) : calculateActionDuration(actionContent, 'temporal')
    
    const actionParts = actionContent.split(/\s+/).filter(part => part.length > 0)
    if (actionParts.length === 0) return null
    
    let actionName = actionParts[0].toLowerCase()
    let parameters = actionParts.slice(1)
    
    // Handle durative action markers
    if (actionName.startsWith('start-') || actionName.startsWith('end-')) {
      const baseAction = actionName.replace(/^(start-|end-)/, '')
      actionName = baseAction
    }

    return {
      id: `temporal-action-${index}`,
      name: actionName,
      parameters: parameters,
      start: startTime,
      end: startTime + duration,
      duration: duration,
      type: 'temporal',
      cost: duration * calculateActionCost(actionName, 'temporal'),
      preconditions: [],
      effects: []
    }
  }
  
  return null
}

/**
 * Parse Numerical PDDL actions (with numeric effects and preconditions)
 */
function parseNumericalAction(line, index) {
  // Format variations:
  // "0.000: (action param1 param2) [cost: 5.5] [fuel: -2.0]"
  // "1: (move robot1 room1 room2)"
  
  let numericalMatch = line.match(/^(\d+(?:\.\d+)?)\s*:\s*(?:\()?([^)]+)\)?(?:\s*\[(.*?)\])?/i)
  
  if (numericalMatch) {
    const startTime = parseFloat(numericalMatch[1])
    const actionContent = numericalMatch[2].trim()
    const numericalEffectsStr = numericalMatch[3] || ''
    
    const actionParts = actionContent.split(/\s+/).filter(part => part.length > 0)
    if (actionParts.length === 0) return null
    
    const actionName = actionParts[0].toLowerCase()
    const parameters = actionParts.slice(1)

    // Parse numerical effects
    const numericalEffects = parseNumericalEffects(numericalEffectsStr)
    const duration = numericalEffects.find(e => e.variable === 'duration')?.value || calculateActionDuration(actionContent, 'numerical')
    const cost = Math.abs(numericalEffects.find(e => e.variable === 'cost')?.value || calculateActionCost(actionName, 'numerical'))

    return {
      id: `numerical-action-${index}`,
      name: actionName,
      parameters: parameters,
      start: startTime,
      end: startTime + duration,
      duration: duration,
      type: 'numerical',
      cost: cost,
      numericalEffects: numericalEffects,
      preconditions: [],
      effects: []
    }
  }
  
  return null
}

/**
 * Parse PDDL+ actions (hybrid discrete/continuous) - FIXED for your format
 */
function parsePDDLPlusAction(line, index) {
  console.log(`🔧 PDDL+ parsing line: "${line}"`)
  
  let pddlPlusMatch
  let startTime = 0
  let actionContent = ''
  let actionType = 'action'
  
  // FIXED: Pattern for your specific PDDL+ format: "0.0: (move-down elevatorx)"
  pddlPlusMatch = line.match(/^(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)/i)
  if (pddlPlusMatch) {
    startTime = parseFloat(pddlPlusMatch[1])
    actionContent = pddlPlusMatch[2].trim()
    actionType = 'action'
    console.log(`⚡ PDDL+ Pattern matched: time=${startTime}, content="${actionContent}"`)
  } else {
    // Fallback: Simple parentheses format without timestamp
    pddlPlusMatch = line.match(/^\s*\(([^)]+)\)/i)
    if (pddlPlusMatch) {
      startTime = index
      actionContent = pddlPlusMatch[1].trim()
      actionType = 'action'
      console.log(`⚡ PDDL+ Simple format: content="${actionContent}"`)
    } else {
      console.log(`❌ PDDL+ No action content found in: "${line}"`)
      return null
    }
  }
  
  if (!actionContent) {
    console.log(`❌ PDDL+ No action content extracted from: "${line}"`)
    return null
  }
  
  const actionParts = actionContent.split(/\s+/).filter(part => part.length > 0)
  if (actionParts.length === 0) {
    console.log(`❌ PDDL+ No action parts found in: "${actionContent}"`)
    return null
  }
  
  const actionName = actionParts[0].toLowerCase()
  const parameters = actionParts.slice(1)

  // Calculate duration based on action type for PDDL+
  const duration = calculatePDDLPlusDuration(actionName)

  console.log(`✅ PDDL+ parsed: ${actionName}(${parameters.join(', ')}) - time: ${startTime}, duration: ${duration}`)

  return {
    id: `pddl-plus-action-${index}`,
    name: actionName,
    parameters: parameters,
    start: startTime,
    end: startTime + duration,
    duration: duration,
    type: 'pddl+',
    actionType: actionType,
    cost: calculateActionCost(actionName, 'pddl+'),
    continuousEffects: [],
    rate: 1.0,
    preconditions: [],
    effects: []
  }
}

/**
 * Calculate duration for PDDL+ actions based on your format
 */
function calculatePDDLPlusDuration(actionName) {
  const pddlPlusDurations = {
    // Movement actions
    'move-up': 1.0,
    'move-down': 1.0,
    'move': 1.0,
    
    // Passenger actions
    'load': 1.0,
    'unload': 1.0,
    'board': 1.0,
    'depart': 1.0,
    
    // Confirmation actions
    'reached': 0.1,
    'serve': 0.1,
    
    // Default
    'default': 1.0
  }
  
  return pddlPlusDurations[actionName] || pddlPlusDurations.default
}

/**
 * Calculate action duration based on action type and PDDL variant
 */
function calculateActionDuration(actionContent, pddlType) {
  const actionName = actionContent.split(/\s+/)[0]?.toLowerCase() || ''
  
  const durations = {
    classical: {
      move: 1.0, up: 1.0, down: 1.0,
      load: 2.0, unload: 1.5, board: 2.0, depart: 1.5,
      pick: 1.0, drop: 1.0, drive: 3.0, fly: 5.0,
      default: 1.0
    },
    temporal: {
      move: 2.0, up: 2.0, down: 1.8,
      load: 3.0, unload: 2.5, board: 3.0, depart: 2.5,
      pick: 1.5, drop: 1.2, drive: 4.0, fly: 6.0,
      default: 2.0
    },
    numerical: {
      move: 1.5, up: 1.8, down: 1.2,
      load: 2.5, unload: 2.0, board: 2.5, depart: 2.0,
      pick: 1.2, drop: 1.0, drive: 3.5, fly: 5.5,
      default: 1.5
    },
    'pddl+': {
      move: 1.5, up: 1.8, down: 1.2,
      load: 2.5, unload: 2.0, board: 2.5, depart: 2.0,
      serve: 3.0, process: 2.0, event: 0.1,
      pick: 1.2, drop: 1.0, drive: 3.5, fly: 5.5,
      default: 1.5
    }
  }
  
  const actionDurations = durations[pddlType] || durations.classical
  return actionDurations[actionName] || actionDurations.default
}

/**
 * Calculate action cost based on action type and PDDL variant
 */
function calculateActionCost(actionName, pddlType) {
  const costs = {
    classical: {
      move: 1, up: 1, down: 1,
      load: 1, unload: 1, board: 1, depart: 1,
      pick: 1, drop: 1, drive: 2, fly: 3,
      default: 1
    },
    temporal: {
      move: 2, up: 2, down: 2,
      load: 2, unload: 2, board: 2, depart: 2,
      pick: 1, drop: 1, drive: 3, fly: 4,
      default: 2
    },
    numerical: {
      move: 3, up: 4, down: 2,
      load: 3, unload: 2, board: 3, depart: 2,
      pick: 2, drop: 1, drive: 5, fly: 8,
      default: 3
    },
    'pddl+': {
      move: 2, up: 3, down: 2,
      load: 3, unload: 2, board: 3, depart: 2,
      serve: 4, process: 3, event: 1,
      pick: 2, drop: 1, drive: 4, fly: 6,
      default: 2
    }
  }
  
  const actionCosts = costs[pddlType] || costs.classical
  return actionCosts[actionName] || actionCosts.default
}

/**
 * Parse numerical effects from action annotations
 */
function parseNumericalEffects(effectsString) {
  const effects = []
  if (!effectsString) return effects
  
  // Parse patterns like "cost: 5.5", "fuel: -2.0", "distance: +10"
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
 * Parse continuous effects for PDDL+
 */
function parseContinuousEffects(effectsString) {
  const result = {
    effects: [],
    rate: 1.0,
    duration: 1.0
  }
  
  if (!effectsString) return result
  
  // Parse patterns like "rate: 2.5/sec", "duration: 5.0", "fuel-rate: -0.5"
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
 * Enhanced entity extraction with PDDL+ support
 */
function extractEntitiesFromAction(action, entitySets) {
  const { parameters } = action
  
  parameters.forEach((param) => {
    const paramLower = param.toLowerCase()
    
    // Generic entity detection patterns
    if (paramLower.includes('robot') || paramLower.includes('bot') || paramLower.includes('agent')) {
      entitySets.robots.add(param)
    }
    else if (paramLower.includes('room') || paramLower.includes('location') || paramLower.includes('area')) {
      entitySets.rooms.add(param)
    }
    else if (paramLower.includes('ball') || paramLower.includes('box') || paramLower.includes('item') || paramLower.includes('object')) {
      entitySets.objects.add(param)
    }
    else if (paramLower.includes('elevator') || paramLower.includes('lift')) {
      entitySets.elevators.add(param)
    }
    else if (paramLower.includes('floor') || /^f\d+$/.test(paramLower) || /^floor\d+$/i.test(param)) {
      entitySets.floors.add(param)
    }
    else if (paramLower.includes('person') || paramLower.includes('passenger') || /^person[a-z]$/i.test(param)) {
      entitySets.passengers.add(param)
    }
    else if (paramLower.includes('truck') || paramLower.includes('plane') || paramLower.includes('vehicle')) {
      entitySets.vehicles.add(param)
    }
    else if (paramLower.includes('package') || paramLower.includes('cargo')) {
      entitySets.packages.add(param)
    }
    else if (paramLower.includes('city') || paramLower.includes('airport') || paramLower.includes('depot')) {
      entitySets.locations.add(param)
    }
  })
}

/**
 * FIXED: Enhanced total duration calculation with safe handling for PDDL+
 */
export function calculateTotalDuration(actions, pddlType) {
  // CRITICAL FIX: Comprehensive safety checks
  if (!actions) {
    console.log('⚠️ calculateTotalDuration: actions is null/undefined')
    return 0
  }
  
  if (!Array.isArray(actions)) {
    console.log('⚠️ calculateTotalDuration: actions is not an array:', typeof actions)
    return 0
  }
  
  if (actions.length === 0) {
    console.log('⚠️ calculateTotalDuration: actions array is empty')
    return 0
  }
  
  console.log(`🔧 Calculating total duration for ${pddlType} with ${actions.length} actions`)
  
  try {
    switch (pddlType) {
      case 'classical': {
        return actions.length
      }
        
      case 'temporal': {
        const validActions = actions.filter(a => a && (typeof a.end === 'number' || (typeof a.start === 'number' && typeof a.duration === 'number')))
        if (validActions.length === 0) return 0
        
        const endTimes = validActions.map(a => {
          if (typeof a.end === 'number' && !isNaN(a.end)) return a.end
          if (typeof a.start === 'number' && typeof a.duration === 'number') {
            return a.start + a.duration
          }
          return 0
        }).filter(time => typeof time === 'number' && !isNaN(time))
        
        return endTimes.length > 0 ? Math.max(...endTimes) : 0
      }
        
      case 'numerical': {
        const validActions = actions.filter(a => a && (typeof a.end === 'number' || (typeof a.start === 'number' && typeof a.duration === 'number')))
        if (validActions.length === 0) return 0
        
        const endTimes = validActions.map(a => {
          if (typeof a.end === 'number' && !isNaN(a.end)) return a.end
          if (typeof a.start === 'number' && typeof a.duration === 'number') {
            return a.start + a.duration
          }
          return 0
        }).filter(time => typeof time === 'number' && !isNaN(time))
        
        const maxTime = endTimes.length > 0 ? Math.max(...endTimes) : 0
        
        // Calculate cost-weighted time
        let totalCostWeightedTime = 0
        let validCostActions = 0
        
        validActions.forEach(action => {
          const actionDuration = action.end ? (action.end - action.start) : (action.duration || 1)
          const actionCost = action.cost || 1
          if (typeof actionDuration === 'number' && typeof actionCost === 'number' && 
              !isNaN(actionDuration) && !isNaN(actionCost)) {
            totalCostWeightedTime += (actionDuration * actionCost)
            validCostActions++
          }
        })
        
        const avgCostWeightedTime = validCostActions > 0 ? totalCostWeightedTime / validCostActions : 0
        return Math.max(maxTime, avgCostWeightedTime)
      }
        
      case 'pddl+':
      case 'pddl_plus': {
        console.log('🔧 PDDL+ duration calculation - analyzing actions...')
        
        // FIXED: Safe PDDL+ calculation with comprehensive validation
        const validActions = actions.filter(a => {
          if (!a || typeof a !== 'object') return false
          return true // Accept any valid action object
        })
        
        if (validActions.length === 0) {
          console.log('⚠️ No valid PDDL+ actions found')
          return 0
        }
        
        console.log(`🔧 Processing ${validActions.length} valid PDDL+ actions`)
        
        // Calculate duration based on available time information
        let maxTime = 0
        let totalSequentialTime = 0
        
        validActions.forEach((action, index) => {
          let actionEndTime = 0
          
          // Method 1: Use explicit end time
          if (typeof action.end === 'number' && !isNaN(action.end)) {
            actionEndTime = action.end
          }
          // Method 2: Calculate from start + duration
          else if (typeof action.start === 'number' && typeof action.duration === 'number' && 
                   !isNaN(action.start) && !isNaN(action.duration)) {
            actionEndTime = action.start + action.duration
          }
          // Method 3: Use just duration with sequential timing
          else if (typeof action.duration === 'number' && !isNaN(action.duration)) {
            actionEndTime = totalSequentialTime + action.duration
            totalSequentialTime = actionEndTime
          }
          // Method 4: Default duration
          else {
            const defaultDuration = 1.5 // Default PDDL+ action duration
            actionEndTime = totalSequentialTime + defaultDuration
            totalSequentialTime = actionEndTime
          }
          
          // Update maximum time
          if (typeof actionEndTime === 'number' && !isNaN(actionEndTime)) {
            maxTime = Math.max(maxTime, actionEndTime)
          }
          
          console.log(`  Action ${index}: ${action.name} - End time: ${actionEndTime}`)
        })
        
        // PDDL+ minimum duration should be reasonable
        const result = Math.max(maxTime, totalSequentialTime, validActions.length * 1.5)
        
        console.log(`🎉 PDDL+ total duration calculated: ${result}`)
        return result
      }
        
      default: {
        console.log(`⚠️ Unknown PDDL type: ${pddlType}, defaulting to action count`)
        return actions.length
      }
    }
  } catch (error) {
    console.error('❌ Error in calculateTotalDuration:', error)
    console.error('Actions causing error:', actions)
    
    // SAFE FALLBACK: Return a reasonable default based on action count
    return actions.length * 2 // Assume 2 time units per action as safe fallback
  }
}

/**
 * FIXED: Enhanced metrics calculation with safe PDDL+ handling
 */
export function calculateMetrics(actions, pddlType) {
  // Safety check
  if (!actions || !Array.isArray(actions)) {
    return {
      totalActions: 0,
      totalCost: 0,
      parallelActions: 0,
      averageDuration: 0,
      actionBreakdown: {},
      executionModel: 'sequential'
    }
  }

  const metrics = {
    totalActions: actions.length,
    totalCost: 0,
    parallelActions: 0,
    averageDuration: 0,
    actionBreakdown: {},
    executionModel: 'sequential'
  }
  
  // Safe total cost calculation
  try {
    metrics.totalCost = actions.reduce((sum, action) => {
      const cost = action && typeof action.cost === 'number' && !isNaN(action.cost) ? action.cost : 1
      return sum + cost
    }, 0)
  } catch (error) {
    console.error('Error calculating total cost:', error)
    metrics.totalCost = actions.length // Fallback
  }
  
  // Safe average duration calculation
  try {
    if (actions.length > 0) {
      const totalDuration = actions.reduce((sum, action) => {
        const duration = action && typeof action.duration === 'number' && !isNaN(action.duration) ? action.duration : 1
        return sum + duration
      }, 0)
      metrics.averageDuration = totalDuration / actions.length
    }
  } catch (error) {
    console.error('Error calculating average duration:', error)
    metrics.averageDuration = 1 // Safe fallback
  }
  
  // PDDL type specific metrics with enhanced safety
  try {
    switch (pddlType) {
      case 'classical': {
        metrics.executionModel = 'sequential'
        metrics.stepBased = true
        metrics.actionBreakdown = getActionTypeBreakdown(actions)
        break
      }
        
      case 'temporal': {
        // Calculate parallel actions (overlapping in time)
        const timeSlots = new Map()
        actions.forEach(action => {
          if (action && typeof action.start === 'number' && typeof action.end === 'number') {
            for (let t = Math.floor(action.start); t < Math.ceil(action.end); t++) {
              if (!timeSlots.has(t)) timeSlots.set(t, 0)
              timeSlots.set(t, timeSlots.get(t) + 1)
            }
          }
        })
        metrics.parallelActions = timeSlots.size > 0 ? Math.max(...Array.from(timeSlots.values())) : 0
        metrics.executionModel = 'parallel'
        metrics.temporalOverlap = calculateTemporalOverlap(actions)
        break
      }
        
      case 'numerical': {
        // Calculate resource consumption and efficiency
        const numericalEffects = actions.flatMap(a => a && a.numericalEffects ? a.numericalEffects : [])
        metrics.numericalChanges = numericalEffects.length
        metrics.resourceConsumption = numericalEffects
          .filter(e => e && typeof e.value === 'number' && e.value < 0)
          .reduce((sum, e) => sum + Math.abs(e.value), 0)
        metrics.costEfficiency = metrics.totalCost / Math.max(1, actions.length)
        metrics.executionModel = 'cost-optimized'
        break
      }
        
      case 'pddl+':
      case 'pddl_plus': {
        // ENHANCED PDDL+ metrics with safety checks
        const processActions = actions.filter(a => a && (a.actionType === 'process' || (a.name && a.name.includes('process'))))
        const eventActions = actions.filter(a => a && (a.actionType === 'event' || (a.name && a.name.includes('event'))))
        const regularActions = actions.filter(a => a && a.actionType !== 'process' && a.actionType !== 'event')
        
        metrics.actionBreakdown = {
          processes: processActions.length,
          events: eventActions.length,
          regular: regularActions.length
        }
        
        // Calculate continuous vs discrete actions
        const continuousActions = actions.filter(a => 
          a && (a.actionType === 'process' || a.rate || a.continuousEffects)
        )
        metrics.continuousActionRatio = actions.length > 0 ? continuousActions.length / actions.length : 0
        metrics.executionModel = 'hybrid'
        metrics.hybridComplexity = calculateHybridComplexity(actions)
        break
      }
    }
  } catch (error) {
    console.error('Error calculating PDDL-specific metrics:', error)
    // Continue with basic metrics
  }
  
  return metrics
}

/**
 * Get breakdown of action types for analysis with safety checks
 */
function getActionTypeBreakdown(actions) {
  const breakdown = {}
  try {
    actions.forEach(action => {
      if (action && action.name) {
        const type = action.name
        breakdown[type] = (breakdown[type] || 0) + 1
      }
    })
  } catch (error) {
    console.error('Error in getActionTypeBreakdown:', error)
  }
  return breakdown
}

/**
 * Calculate temporal overlap for parallel execution analysis with safety
 */
function calculateTemporalOverlap(actions) {
  const overlaps = []
  try {
    for (let i = 0; i < actions.length; i++) {
      for (let j = i + 1; j < actions.length; j++) {
        const a1 = actions[i]
        const a2 = actions[j]
        if (a1 && a2 && 
            typeof a1.start === 'number' && typeof a1.end === 'number' &&
            typeof a2.start === 'number' && typeof a2.end === 'number' &&
            a1.start < a2.end && a2.start < a1.end) {
          overlaps.push({
            action1: a1.name || 'unknown',
            action2: a2.name || 'unknown',
            overlapStart: Math.max(a1.start, a2.start),
            overlapEnd: Math.min(a1.end, a2.end)
          })
        }
      }
    }
  } catch (error) {
    console.error('Error calculating temporal overlap:', error)
  }
  return overlaps
}

/**
 * Calculate hybrid complexity for PDDL+ plans with safety checks
 */
function calculateHybridComplexity(actions) {
  try {
    const processCount = actions.filter(a => a && a.actionType === 'process').length
    const eventCount = actions.filter(a => a && a.actionType === 'event').length
    const regularCount = actions.length - processCount - eventCount
    
    // Complexity score based on variety and interaction of action types
    const varietyScore = (processCount > 0 ? 1 : 0) + (eventCount > 0 ? 1 : 0) + (regularCount > 0 ? 1 : 0)
    const distributionScore = actions.length > 0 ? 1 - Math.abs(processCount - eventCount - regularCount) / actions.length : 0
    
    return {
      varietyScore,
      distributionScore,
      totalComplexity: varietyScore * distributionScore,
      breakdown: { processCount, eventCount, regularCount }
    }
  } catch (error) {
    console.error('Error calculating hybrid complexity:', error)
    return {
      varietyScore: 0,
      distributionScore: 0,
      totalComplexity: 0,
      breakdown: { processCount: 0, eventCount: 0, regularCount: 0 }
    }
  }
}

/**
 * Export utility functions for use in domain-specific parsers
 */
export {
  parseClassicalAction,
  parseTemporalAction,
  parseNumericalAction,
  parsePDDLPlusAction,
  parseNumericalEffects,
  parseContinuousEffects,
  extractEntitiesFromAction,
  isValidPlanLine,
  calculateActionDuration,
  calculateActionCost
}