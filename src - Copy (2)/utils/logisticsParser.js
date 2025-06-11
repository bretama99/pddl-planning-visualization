// File Path: src/utils/logisticsParser.js
// Enhanced Logistics Domain Parser with Realistic Transportation Timing

/**
 * Enhanced PDDL Plan Parser specifically optimized for Logistics domain
 * Supports Classical, Temporal, Numerical, and PDDL+ plans with realistic transportation timing
 */

export function parseLogisticsPlanFile(content, pddlType = 'classical') {
  console.log('🚚 Enhanced Logistics Parser - Parsing content for transportation:', {
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
               line.includes('load-vehicle') || 
               line.includes('unload-vehicle') || 
               line.includes('drive-truck') ||
               line.includes('fly-airplane') ||
               line.includes('load-truck') ||
               line.includes('unload-truck') ||
               line.includes('drive') ||
               line.includes('fly') ||
               line.includes('load') ||
               line.includes('unload')
             ))
    })

  console.log(`📋 Filtered ${lines.length} action lines from ${content.split('\n').length} total lines`)

  const actions = []
  
  lines.forEach((line, index) => {
    const action = parseActionLineWithTransportationTiming(line, index, pddlType)
    if (action) {
      actions.push(action)
      console.log(`✅ Parsed action ${index + 1}:`, {
        name: action.name,
        type: action.actionType,
        duration: action.duration,
        cost: action.cost,
        vehicle: action.vehicle,
        package: action.package,
        location: action.location || action.toLocation
      })
    } else {
      console.log(`⚠️ Failed to parse line ${index + 1}: "${line}"`)
    }
  })

  console.log(`🎉 Successfully parsed ${actions.length} logistics actions for transportation simulation`)
  return actions
}

/**
 * Parse individual action line with realistic timing for transportation
 */
function parseActionLineWithTransportationTiming(line, index, pddlType) {
  let match
  let timeOrStep = 0
  let actionContent = ''
  let duration = 1.0
  let cost = 1
  
  console.log(`🔧 Parsing line for ${pddlType}: "${line}"`)
  
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
  
  // Calculate realistic durations for transportation
  duration = calculateRealisticTransportationDuration(actionName, pddlType, parameters)
  cost = calculateTransportationCost(actionName, pddlType)
  
  // Create base action object
  const action = {
    id: `logistics-${index}`,
    name: actionName,
    parameters: parameters,
    step: pddlType === 'classical' ? Math.floor(timeOrStep) : index,
    start: timeOrStep,
    end: timeOrStep + duration,
    duration: duration,
    type: pddlType,
    cost: cost,
    raw: line
  }
  
  // Extract specific entities and action type based on action name
  extractLogisticsActionEntities(action, actionName, parameters)
  
  console.log(`✅ Parsed ${pddlType} logistics action:`, {
    name: action.name,
    type: action.actionType,
    duration: action.duration,
    vehicle: action.vehicle,
    package: action.package,
    locations: [action.location, action.fromLocation, action.toLocation].filter(Boolean)
  })
  
  return action
}

/**
 * Calculate realistic durations for transportation actions
 */
function calculateRealisticTransportationDuration(actionName, pddlType) {
  const baseDurations = {
    // Loading/Unloading actions - realistic handling time
    'load-vehicle': 2.0,         // 2 seconds to load package into vehicle
    'load-truck': 2.0,           // 2 seconds to load into truck
    'unload-vehicle': 2.0,       // 2 seconds to unload from vehicle
    'unload-truck': 2.0,         // 2 seconds to unload from truck
    'load': 2.0,                 // Generic loading
    'unload': 2.0,               // Generic unloading
    
    // Transportation actions - realistic travel time
    'drive-truck': 5.0,          // 5 seconds for truck movement between locations
    'fly-airplane': 8.0,         // 8 seconds for airplane flight between airports
    'drive': 5.0,                // Generic driving
    'fly': 8.0,                  // Generic flying
    
    // Default for unknown actions
    'default': 3.0
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
      const cost = calculateTransportationCost(actionName, pddlType)
      return baseDuration * Math.max(0.5, cost / 4.0) // Scale factor
    }
      
    case 'pddl+': {
      // PDDL+ processes take longer, events are quick
      if (actionName.includes('start') || actionName.includes('continuous')) {
        return baseDuration * 1.5 // Processes take longer
      } else {
        return baseDuration * 0.8 // Events are quicker
      }
    }
      
    case 'classical':
    default: {
      // Classical PDDL - use base durations for realistic transportation
      return baseDuration
    }
  }
}

/**
 * Calculate transportation costs based on PDDL type and action complexity
 */
function calculateTransportationCost(actionName, pddlType = 'classical') {
  if (pddlType === 'numerical') {
    // Higher costs for numerical PDDL reflecting fuel consumption
    switch (actionName) {
      case 'fly-airplane':
      case 'fly':
        return 10 // Air transport is most expensive
        
      case 'drive-truck':
      case 'drive':
        return 6 // Ground transport is medium cost
        
      case 'load-vehicle':
      case 'load-truck':
      case 'unload-vehicle':
      case 'unload-truck':
      case 'load':
      case 'unload':
        return 2 // Loading/unloading has low fuel cost
        
      default:
        return 4 // Default medium cost
    }
  }
  
  // For other PDDL types, use simpler cost model
  switch (actionName) {
    case 'fly-airplane':
    case 'fly':
      return 4 // Air transport costs more
      
    case 'drive-truck':
    case 'drive':
      return 3 // Ground transport medium cost
      
    case 'load-vehicle':
    case 'load-truck':
    case 'unload-vehicle':
    case 'unload-truck':
    case 'load':
    case 'unload':
      return 1 // Loading/unloading is standard cost
      
    default: 
      return 2 // Default cost
  }
}

/**
 * Extract entities (vehicles, packages, locations) from action parameters
 */
function extractLogisticsActionEntities(action, actionName, parameters) {
  // Load actions: (load-vehicle package vehicle location) or (load-truck package truck location)
  if ((actionName === 'load-vehicle' || actionName === 'load-truck' || actionName === 'load') && parameters.length >= 3) {
    action.actionType = 'load'
    action.package = parameters[0]     // obj12
    action.vehicle = parameters[1]     // tru1 or apn1
    action.location = parameters[2]    // pos1 or apt1
  }
  
  // Unload actions: (unload-vehicle package vehicle location) or (unload-truck package truck location)
  else if ((actionName === 'unload-vehicle' || actionName === 'unload-truck' || actionName === 'unload') && parameters.length >= 3) {
    action.actionType = 'unload'
    action.package = parameters[0]     // obj12
    action.vehicle = parameters[1]     // tru1 or apn1
    action.location = parameters[2]    // pos1 or apt1
  }
  
  // Drive actions: (drive-truck truck from-location to-location city) 
  else if ((actionName === 'drive-truck' || actionName === 'drive') && parameters.length >= 3) {
    action.actionType = 'drive'
    action.vehicle = parameters[0]     // tru1
    action.fromLocation = parameters[1] // pos1
    action.toLocation = parameters[2]   // apt1
    if (parameters.length >= 4) {
      action.city = parameters[3]      // cit1
    }
  }
  
  // Fly actions: (fly-airplane airplane from-airport to-airport)
  else if ((actionName === 'fly-airplane' || actionName === 'fly') && parameters.length >= 3) {
    action.actionType = 'fly'
    action.vehicle = parameters[0]     // apn1
    action.fromLocation = parameters[1] // apt1
    action.toLocation = parameters[2]   // apt3
  }
  
  // Unknown action - try to guess entities
  else {
    action.actionType = 'unknown'
    
    // Try to identify vehicle (trucks start with 'tru', airplanes with 'apn')
    for (const param of parameters) {
      if (param.includes('tru') || param.includes('apn') || 
          param.includes('truck') || param.includes('plane') || param.includes('airplane')) {
        action.vehicle = param
        break
      }
    }
    
    // Try to identify package (objects start with 'obj' or contain 'package')
    for (const param of parameters) {
      if (param.includes('obj') || param.includes('package') || 
          param.includes('item') || param.includes('cargo')) {
        action.package = param
        break
      }
    }
    
    // Try to identify locations (airports start with 'apt', positions with 'pos')
    for (const param of parameters) {
      if (param.includes('apt') || param.includes('pos') || param.includes('location') ||
          param.includes('city') || param.includes('depot') || param.includes('warehouse')) {
        if (!action.location) {
          action.location = param
        } else if (!action.fromLocation) {
          action.fromLocation = action.location
          action.toLocation = param
          action.location = null
        }
        break
      }
    }
    
    console.log(`⚠️ Unknown action type for "${actionName}", extracted:`, {
      vehicle: action.vehicle,
      package: action.package,
      location: action.location,
      fromLocation: action.fromLocation,
      toLocation: action.toLocation
    })
  }
}

/**
 * Extract all entities from parsed actions for logistics visualization
 */
export function extractLogisticsEntitiesFromActions(actions) {
  const trucks = new Set()
  const airplanes = new Set()
  const packages = new Set()
  const cities = new Set()
  const airports = new Set()
  const positions = new Set()
  const locations = new Set()
  
  actions.forEach(action => {
    // Extract vehicles
    if (action.vehicle) {
      if (action.vehicle.includes('tru')) {
        trucks.add(action.vehicle)
      } else if (action.vehicle.includes('apn')) {
        airplanes.add(action.vehicle)
      }
    }
    
    // Extract packages
    if (action.package) {
      packages.add(action.package)
    }
    
    // Extract locations
    if (action.location) {
      locations.add(action.location)
      if (action.location.includes('apt')) {
        airports.add(action.location)
      } else if (action.location.includes('pos')) {
        positions.add(action.location)
      }
    }
    
    if (action.fromLocation) {
      locations.add(action.fromLocation)
      if (action.fromLocation.includes('apt')) {
        airports.add(action.fromLocation)
      } else if (action.fromLocation.includes('pos')) {
        positions.add(action.fromLocation)
      }
    }
    
    if (action.toLocation) {
      locations.add(action.toLocation)
      if (action.toLocation.includes('apt')) {
        airports.add(action.toLocation)
      } else if (action.toLocation.includes('pos')) {
        positions.add(action.toLocation)
      }
    }
    
    // Extract cities
    if (action.city) {
      cities.add(action.city)
    }
    
    // Also check parameters for additional entities
    action.parameters?.forEach(param => {
      if (param.includes('tru') || param.includes('truck')) {
        trucks.add(param)
      } else if (param.includes('apn') || param.includes('plane')) {
        airplanes.add(param)
      } else if (param.includes('obj') || param.includes('package')) {
        packages.add(param)
      } else if (param.includes('cit') || param.includes('city')) {
        cities.add(param)
      } else if (param.includes('apt') || param.includes('pos') || param.includes('location')) {
        locations.add(param)
        if (param.includes('apt')) {
          airports.add(param)
        } else if (param.includes('pos')) {
          positions.add(param)
        }
      }
    })
  })
  
  const entities = {
    trucks: Array.from(trucks),
    airplanes: Array.from(airplanes),
    vehicles: [...Array.from(trucks), ...Array.from(airplanes)],
    packages: Array.from(packages),
    cities: Array.from(cities),
    airports: Array.from(airports),
    positions: Array.from(positions),
    locations: Array.from(locations)
  }
  
  console.log('🎯 Extracted logistics entities:', entities)
  
  return entities
}

/**
 * Validate parsed actions for logistics simulation requirements
 */
export function validateLogisticsActions(actions) {
  const errors = []
  const warnings = []
  
  if (!actions || actions.length === 0) {
    errors.push('No actions found in plan file')
    return { valid: false, errors, warnings }
  }
  
  const entities = extractLogisticsEntitiesFromActions(actions)
  
  // Check for minimum requirements
  if (entities.vehicles.length === 0) {
    errors.push('No vehicles found in plan - need at least one truck or airplane for logistics simulation')
  }
  
  if (entities.locations.length < 2) {
    warnings.push('Less than 2 locations found - transportation visualization will be limited')
  }
  
  if (entities.packages.length === 0) {
    warnings.push('No packages found - nothing to transport')
  }
  
  // Check action types
  const actionTypes = new Set(actions.map(a => a.actionType))
  if (!actionTypes.has('drive') && !actionTypes.has('fly')) {
    warnings.push('No transportation actions found - vehicles will not move between locations')
  }
  
  if (!actionTypes.has('load') && !actionTypes.has('unload')) {
    warnings.push('No loading/unloading actions found - packages will not be handled')
  }
  
  // Check for unknown actions
  const unknownActions = actions.filter(a => a.actionType === 'unknown')
  if (unknownActions.length > 0) {
    warnings.push(`${unknownActions.length} unknown action(s) found - may not visualize correctly`)
  }
  
  console.log('✅ Logistics action validation complete:', {
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
      averageDuration: actions.reduce((sum, a) => sum + a.duration, 0) / actions.length,
      totalTransportationTime: actions
        .filter(a => a.actionType === 'drive' || a.actionType === 'fly')
        .reduce((sum, a) => sum + a.duration, 0)
    }
  }
}

// Export default parsing function
export default parseLogisticsPlanFile