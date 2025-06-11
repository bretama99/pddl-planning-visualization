// Common Enhanced PDDL Parser - Complete Version with ALL Domains
// File: src/utils/enhancedPDDLParser.js
// This is the base parser used by all domains (Robot, Elevator, Logistics)

/**
 * Enhanced PDDL Plan Parser with support for Classical, Temporal, Numerical, and PDDL+ plans
 * This is a generic parser that can handle basic parsing for any domain
 */
export function parsePlanFile(content, pddlType = 'classical') {
  console.log('=== PARSING PLAN FILE (COMMON) ===')
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
    robots: new Set(),
    vehicles: new Set(),
    floors: new Set(),
    elevators: new Set(),
    passengers: new Set(),
    packages: new Set(),
    locations: new Set()
  }

  // Parse actions based on PDDL type
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

  console.log('=== COMMON PARSE RESULT ===')
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
         (line.includes(':') || line.includes('('))
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
      id: `action-${index}`,
      name: actionName,
      parameters: parameters,
      step: stepNumber,
      start: stepNumber,
      end: stepNumber + 1,
      duration: 1.0,
      type: 'classical',
      cost: 1,
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
    const duration = temporalMatch[3] ? parseFloat(temporalMatch[3]) : 1.0
    
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
      id: `temporal-${index}`,
      name: actionName,
      parameters: parameters,
      start: startTime,
      end: startTime + duration,
      duration: duration,
      type: 'temporal',
      cost: duration,
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
    const duration = numericalEffects.find(e => e.variable === 'duration')?.value || 1.0
    const cost = Math.abs(numericalEffects.find(e => e.variable === 'cost')?.value || 1.0)

    return {
      id: `numerical-${index}`,
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
 * Parse PDDL+ actions (hybrid discrete/continuous)
 */
function parsePDDLPlusAction(line, index) {
  // Format variations:
  // "0.000: (action param1 param2) {action} [rate: 1.5/sec]"
  // "5.0: (process param1) {process} [rate: 2.0]"
  // "10.0: (event param1) {event}"
  
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

    // Parse continuous effects and rates
    const continuousEffects = parseContinuousEffects(additionalInfo)
    const duration = actionType === 'event' ? 0 : (continuousEffects.duration || 1.0)

    return {
      id: `pddl-plus-${index}`,
      name: actionName,
      parameters: parameters,
      start: startTime,
      end: startTime + duration,
      duration: duration,
      type: 'pddl-plus',
      actionType: actionType, // event, process, or action
      cost: 1.0,
      continuousEffects: continuousEffects.effects,
      rate: continuousEffects.rate,
      preconditions: [],
      effects: []
    }
  }
  
  return null
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
 * Generic entity extraction (basic patterns for all domains)
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
    else if (paramLower.includes('floor') || /^f\d+$/.test(paramLower)) {
      entitySets.floors.add(param)
    }
    else if (paramLower.includes('person') || paramLower.includes('passenger')) {
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
 * Calculate total plan duration based on PDDL type
 */
export function calculateTotalDuration(actions, pddlType) {
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
 * Calculate plan metrics based on PDDL type
 */
export function calculateMetrics(actions, pddlType) {
  const metrics = {
    totalActions: actions.length,
    totalCost: 0,
    parallelActions: 0,
    averageDuration: 0
  }
  
  metrics.totalCost = actions.reduce((sum, action) => sum + (action.cost || 1), 0)
  
  if (actions.length > 0) {
    metrics.averageDuration = actions.reduce((sum, action) => sum + (action.duration || 1), 0) / actions.length
  }
  
  if (pddlType === 'temporal' || pddlType === 'pddl_plus') {
    // Calculate parallel actions (overlapping in time)
    const timeSlots = new Map()
    actions.forEach(action => {
      for (let t = Math.floor(action.start); t < Math.ceil(action.end || action.start + 1); t++) {
        if (!timeSlots.has(t)) timeSlots.set(t, 0)
        timeSlots.set(t, timeSlots.get(t) + 1)
      }
    })
    
    if (timeSlots.size > 0) {
      metrics.parallelActions = Math.max(...Array.from(timeSlots.values()))
    }
  }
  
  if (pddlType === 'numerical') {
    // Calculate numerical metrics
    const numericalEffects = actions.flatMap(a => a.numericalEffects || [])
    metrics.totalNumericalChanges = numericalEffects.length
    metrics.resourceConsumption = numericalEffects
      .filter(e => e.value < 0)
      .reduce((sum, e) => sum + Math.abs(e.value), 0)
  }
  
  return metrics
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
  isValidPlanLine
}