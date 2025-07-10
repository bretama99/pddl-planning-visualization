// elevatorSimulatorLogic.js - Complete Fixed Version with TARGETED FIXES ONLY
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

export function useElevatorSimulator(props) {

  console.log('🔧 PDDL+ DIAGNOSTIC - ElevatorSimulator starting...')
  console.log('Props received:', {
    actionsType: typeof props.actions,
    actionsIsArray: Array.isArray(props.actions),
    actionsLength: props.actions?.length,
    pddlType: props.pddlType,
    entities: props.entities,
    actionsPreview: typeof props.actions === 'string' ? props.actions.substring(0, 300) : 'NOT STRING'
  })

  // Check if actions contain the expected content
  if (typeof props.actions === 'string') {
    const hasPersona = props.actions.includes('persona')
    const hasPersonb = props.actions.includes('personb')  
    const hasPersonc = props.actions.includes('personc')
    const hasPersond = props.actions.includes('persond')
    const hasPersone = props.actions.includes('persone')
    
    console.log('🔍 PASSENGER CHECK in raw content:', {
      hasPersona, hasPersonb, hasPersonc, hasPersond, hasPersone
    })
    
    const loadActions = (props.actions.match(/load\s+person/g) || []).length
    console.log('🔍 LOAD ACTIONS found:', loadActions)
  }
  
  
  const isPlaying = ref(false)
  const currentStep = ref(0)
  const playbackSpeed = ref(1)
  const showSuccess = ref(false)
  
  const elevatorLocations = ref({})
  const elevatorDoors = ref({})
  const elevatorMoving = ref({})
  const elevatorSmoothPositions = ref({})
  
  const passengerLocations = ref({})
  const passengerCarrying = ref({})
  const passengerMovement = ref({})
  const passengerMovementProgress = ref({})
  const passengerSmoothPositions = ref({})
  const completedDeliveries = ref(new Set())
  
  let animationFrame = null
  let playInterval = null

  const TIMING = {
    classical: {
      DOOR_OPEN_TIME: 0.6,
      PASSENGER_BOARD_TIME: 0.6,
      DOOR_CLOSE_TIME: 0.6,
      FLOOR_TRAVEL_TIME: 1.5
    },
    temporal: {
      DOOR_OPEN_TIME: 1.0,
      PASSENGER_BOARD_TIME: 1.0,
      DOOR_CLOSE_TIME: 1.0,
      FLOOR_TRAVEL_TIME: 2.0
    },
    numerical: {
      DOOR_OPEN_TIME: 0.6,
      PASSENGER_BOARD_TIME: 0.6,
      DOOR_CLOSE_TIME: 0.6,
      FLOOR_TRAVEL_TIME: 1.5
    },
    'pddl+': {
      DOOR_OPEN_TIME: 0.6,
      PASSENGER_BOARD_TIME: 0.6,
      DOOR_CLOSE_TIME: 0.6,
      FLOOR_TRAVEL_TIME: 1.5
    },
    'pddl_plus': {
      DOOR_OPEN_TIME: 0.6,
      PASSENGER_BOARD_TIME: 0.6,
      DOOR_CLOSE_TIME: 0.6,
      FLOOR_TRAVEL_TIME: 1.5
    }
  }

  const getPDDLCharacteristics = () => {
    if (!parsedActions.value?.length) {
      return {
        name: 'Unknown PDDL Type',
        description: 'No plan data available',
        features: [],
        color: '#666666',
        hasExplicitTiming: false,
        hasExplicitDurations: false,
        hasExplicitFloors: false,
        hasImplicitFloors: false,
        actionPattern: 'unknown',
        stats: {
          totalActions: 0,
          timedActions: 0,
          durationActions: 0,
          moveActions: 0,
          loadActions: 0,
          unloadActions: 0,
          totalDuration: '0.0'
        }
      }
    }

    const actions = parsedActions.value
    
    const hasExplicitDurations = actions.some(a => a.raw && a.raw.includes('[') && a.raw.includes(']'))
    const hasExplicitTiming = actions.some(a => a.hasExplicitTime)
    const hasFloorParameters = actions.some(a => a.fromFloor || a.toFloor)
    const hasImplicitMovement = actions.some(a => a.actionType === 'move' && !a.fromFloor && !a.toFloor)
    const hasReachedActions = actions.some(a => a.actionType === 'reached')
    const hasProcessActionsSpecific = actions.some(a => a.actionType === 'process' || a.name?.startsWith('process-'))
    const hasEventActionsSpecific = actions.some(a => a.actionType === 'event' || a.name?.startsWith('event-'))
    const hasServeActions = actions.some(a => a.actionType === 'serve' || a.name?.includes('serve'))
    
    let characteristics = {}
    
    // Enhanced PDDL+ detection - prioritize if explicitly set or has PDDL+ features
    if (props.pddlType === 'pddl+' || hasProcessActionsSpecific || hasEventActionsSpecific || hasServeActions) {
      characteristics = {
        name: 'PDDL+',
        description: 'Hybrid planning with processes and events',
        features: [
          'Process-driven actions',
          'Event-based responses',
          'Continuous change modeling',
          'Dynamic passenger placement',
          'Serve action support'
        ],
        color: '#9C27B0',
        hasExplicitTiming: hasExplicitTiming,
        hasExplicitDurations: false,
        hasExplicitFloors: false,
        hasImplicitFloors: true,
        actionPattern: 'process-event'
      }
    } else if (hasExplicitDurations && hasExplicitTiming && hasFloorParameters) {
      characteristics = {
        name: 'Temporal PDDL',
        description: 'Planning with explicit time constraints and durations',
        features: [
          'Explicit durations in brackets [X.X]',
          'Time-stamped actions',
          'Concurrent action support',
          'Explicit floor parameters'
        ],
        color: '#4CAF50',
        hasExplicitTiming: true,
        hasExplicitDurations: true,
        hasExplicitFloors: true,
        hasImplicitFloors: false,
        actionPattern: 'temporal-explicit'
      }
    } else if (hasImplicitMovement && hasReachedActions) {
      characteristics = {
        name: 'Numerical PDDL',
        description: 'Planning with numeric variables and cost optimization',
        features: [
          'Implicit floor calculations',
          'Numeric state variables',
          'Cost-based optimization',
          'Reached confirmation actions'
        ],
        color: '#FF9800',
        hasExplicitTiming: hasExplicitTiming,
        hasExplicitDurations: false,
        hasExplicitFloors: false,
        hasImplicitFloors: true,
        actionPattern: 'numerical-implicit'
      }
    } else {
      characteristics = {
        name: 'Classical PDDL',
        description: 'Basic planning with explicit states and actions',
        features: [
          'Explicit state transitions',
          'Simple action sequences',
          'Explicit floor parameters',
          'Sequential execution'
        ],
        color: '#2196F3',
        hasExplicitTiming: hasExplicitTiming,
        hasExplicitDurations: false,
        hasExplicitFloors: hasFloorParameters,
        hasImplicitFloors: false,
        actionPattern: 'classical-sequential'
      }
    }
    
    try {
      characteristics.stats = {
        totalActions: actions.length || 0,
        timedActions: actions.filter(a => a.hasExplicitTime).length || 0,
        durationActions: actions.filter(a => a.raw && a.raw.includes('[')).length || 0,
        moveActions: actions.filter(a => a.actionType === 'move').length || 0,
        loadActions: actions.filter(a => a.actionType === 'load').length || 0,
        unloadActions: actions.filter(a => a.actionType === 'unload').length || 0,
        totalDuration: actions.reduce((sum, a) => sum + (parseFloat(a.duration) || 0), 0).toFixed(1)
      }
    } catch (error) {
      characteristics.stats = {
        totalActions: 0,
        timedActions: 0,
        durationActions: 0,
        moveActions: 0,
        loadActions: 0,
        unloadActions: 0,
        totalDuration: '0.0'
      }
    }
    
    return characteristics
  }

  const parsedActions = computed(() => {
    console.log('🔧 parsedActions computing for PDDL+...')
    
    if (!props.actions) {
      console.log('❌ No props.actions')
      return []
    }
    
    // NEW: Handle pre-parsed actions (from Home.vue PDDL+ processing)
    if (Array.isArray(props.actions)) {
      console.log('📋 Using pre-parsed actions from Home.vue:', props.actions.length)
      
      // DIAGNOSTIC: Check passengers in pre-parsed actions
      const passengersInActions = new Set()
      props.actions.forEach(action => {
        if (action.passenger) passengersInActions.add(action.passenger)
        if (action.parameters) {
          action.parameters.forEach(p => {
            if (p.startsWith('person')) passengersInActions.add(p)
          })
        }
      })
      console.log('👤 DIAGNOSTIC: Passengers in pre-parsed actions:', Array.from(passengersInActions))
      
      return props.actions
    }
    
    // EXISTING: Handle raw content (string)
    if (typeof props.actions === 'string') {
      console.log('📋 Parsing raw content for PDDL+...')
      const actions = parseAllPDDLTypes(props.actions, props.pddlType)
      
      // DIAGNOSTIC: Check passengers in parsed actions  
      const passengersInActions = new Set()
      actions.forEach(action => {
        if (action.passenger) passengersInActions.add(action.passenger)
        if (action.parameters) {
          action.parameters.forEach(p => {
            if (p.startsWith('person')) passengersInActions.add(p)
          })
        }
      })
      console.log('👤 DIAGNOSTIC: Passengers after parsing:', Array.from(passengersInActions))
      
      return actions
    }
    
    console.log('❌ Unknown props.actions type:', typeof props.actions)
    return []
  })

  // CRITICAL FIX: Enhanced line filtering for PDDL+
  function parseAllPDDLTypes(content, pddlType = 'classical') {
    if (!content || content.trim().length === 0) {
      return []
    }

    console.log(`📋 Starting to parse ${pddlType} content...`)
    console.log('Content preview:', content.substring(0, 500))

    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => {
        if (line.length === 0 || 
            line.startsWith(';') ||
            line.startsWith('//') ||
            line.includes('domain parsed') ||
            line.includes('problem parsed') ||
            line.includes('grounding') ||
            line.includes('planning time') ||
            line.includes('plan-length') ||
            line.includes('metric') ||
            line.includes('expanded nodes') ||
            line.includes('found plan:') ||
            line.includes('problem solved') ||
            line.includes('g(n)=') ||
            line.includes('h(n)=') ||
            line.includes('heuristic time') ||
            line.includes('search time') ||
            line.includes('states evaluated') ||
            line.includes('number of dead-ends') ||
            line.includes('number of duplicates') ||
            line.includes('aibr preprocessing') ||
            line.includes('|f|:') ||
            line.includes('|x|:') ||
            line.includes('|a|:') ||
            line.includes('|p|:') ||
            line.includes('|e|:') ||
            line.includes('setup time')) {
          return false
        }
        
        // CRITICAL FIX: For PDDL+, accept lines that match your exact format
        if (pddlType === 'pddl+' || pddlType === 'pddl_plus') {
          const isValidAction = /^\d+(?:\.\d+)?\s*:\s*\([^)]+\)/.test(line)
          if (isValidAction) {
            console.log(`✅ Valid PDDL+ action line: ${line}`)
          }
          return isValidAction
        }
        
        // For other PDDL types, use existing logic
        return line.includes(':') && 
               (line.includes('move') || line.includes('load') || line.includes('unload') || 
                line.includes('up') || line.includes('down') || line.includes('board') || 
                line.includes('depart') || line.includes('reached') || line.includes('serve'))
      })

    console.log(`📋 Filtered ${lines.length} action lines from ${content.split('\n').length} total lines for ${pddlType}`)
    console.log('Sample filtered lines:', lines.slice(0, 5))

    const actions = []
    
    lines.forEach((line, lineIndex) => {
      const action = parseActionByType(line, lineIndex, pddlType)
      if (action) {
        actions.push(action)
        console.log(`✅ Parsed action ${lineIndex + 1}:`, {
          name: action.name,
          type: action.actionType,
          passenger: action.passenger,
          elevator: action.elevator,
          parameters: action.parameters
        })
      } else {
        console.log(`⚠️ Failed to parse line ${lineIndex + 1}: "${line}"`)
      }
    })

    // Sort actions by time for temporal PDDL
    if (pddlType === 'temporal' || pddlType === 'pddl+' || pddlType === 'pddl_plus') {
      actions.sort((a, b) => a.start - b.start)
    }

    console.log(`🎉 Successfully parsed ${actions.length} ${pddlType} actions`)
    
    // DEBUGGING: For PDDL+, log all detected passengers
    if (pddlType === 'pddl+') {
      const detectedPassengers = new Set()
      actions.forEach(action => {
        if (action.passenger) detectedPassengers.add(action.passenger)
        if (action.parameters) {
          action.parameters.forEach(p => {
            if (p.startsWith('person')) detectedPassengers.add(p)
          })
        }
      })
      console.log(`🔍 PDDL+ Detected passengers:`, Array.from(detectedPassengers))
    }
    
    return actions
  }

function parseActionByType(line, index, pddlType) {
  let match
  let timeOrStep = 0
  let actionContent = ''
  let duration = getDurationForType(pddlType, 'default')
  let hasExplicitTime = false
  
  console.log(`🔧 Parsing ${pddlType} line:`, line)
  
  // FIX: For temporal, ALWAYS extract [X.X] duration
  if (pddlType === 'temporal') {
    match = line.match(/^(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)\s*\[(\d+(?:\.\d+)?)\]/)
    if (match) {
      timeOrStep = parseFloat(match[1])
      actionContent = match[2].trim()
      duration = parseFloat(match[3]) // FIX: Use actual duration from plan
      hasExplicitTime = true
      console.log(`⏰ Temporal: time=${timeOrStep}, duration=${duration}, action="${actionContent}"`)
    }
  }
  // Handle other PDDL types (keep existing logic)
  else if (pddlType === 'classical') {
    match = line.match(/^(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)/)
    if (match) {
      timeOrStep = parseFloat(match[1])
      actionContent = match[2].trim()
      hasExplicitTime = true
    }
  }
  else if (pddlType === 'pddl+' || pddlType === 'pddl_plus') {
    match = line.match(/^(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)/)
    if (match) {
      timeOrStep = parseFloat(match[1])
      actionContent = match[2].trim()
      hasExplicitTime = true
    }
  }
  else if (pddlType === 'numerical') {
    match = line.match(/^(?:(\d+(?:\.\d+)?)\s*:\s*)?\(([^)]+)\)/)
    if (match) {
      timeOrStep = match[1] ? parseFloat(match[1]) : index
      actionContent = match[2].trim()
      hasExplicitTime = !!match[1]
    }
  }
  
  if (!actionContent) return null
  
  const parts = actionContent.split(/\s+/).filter(p => p.length > 0)
  if (parts.length === 0) return null
  
  const actionName = parts[0].toLowerCase()
  const parameters = parts.slice(1)
  
  if (!duration || duration === getDurationForType(pddlType, 'default')) {
    duration = getDurationForType(pddlType, actionName)
  }
  
  const action = {
    id: `${pddlType}-action-${index}`,
    name: actionName,
    parameters: parameters,
    step: Math.floor(timeOrStep),
    start: timeOrStep,
    end: timeOrStep + duration,
    duration: duration,
    type: pddlType,
    cost: calculateCostByType(actionName, pddlType),
    raw: line,
    phases: [],
    hasExplicitTime: hasExplicitTime
  }
  
  extractEntitiesByType(action, actionName, parameters, pddlType)
  
  return action
}

  function getDurationForType(pddlType, actionName) {
    const timings = TIMING[pddlType] || TIMING.classical
    
    switch (actionName) {
      case 'move-up':
      case 'move-down':
      case 'up':
      case 'down':
      case 'move':
        return timings.FLOOR_TRAVEL_TIME
        
      case 'load':
      case 'board':
      case 'load-person':
        return timings.DOOR_OPEN_TIME + timings.PASSENGER_BOARD_TIME + timings.DOOR_CLOSE_TIME
        
      case 'unload':
      case 'depart':
      case 'unload-person':
        return timings.DOOR_OPEN_TIME + timings.PASSENGER_BOARD_TIME + timings.DOOR_CLOSE_TIME
        
      case 'serve':
      case 'serve-person':
        return 0.5
        
      case 'reached':
        return 0.5
        
      default:
        return 1.0
    }
  }

  function calculateCostByType(actionName, pddlType) {
    const baseCosts = {
      'up': 3, 'move-up': 3, 'down': 2, 'move-down': 2,
      'load': 2, 'board': 2, 'load-person': 2,
      'unload': 1, 'depart': 1, 'unload-person': 1,
      'serve': 1, 'serve-person': 1, 'reached': 1,
      'default': 2
    }
    
    const cost = baseCosts[actionName] || baseCosts.default
    
    if (pddlType === 'numerical') {
      return cost * 1.5
    }
    
    return cost
  }

  function extractEntitiesByType(action, actionName, parameters, pddlType) {
    action.actionType = 'unknown'
    action.elevator = null
    action.passenger = null
    action.direction = null
    action.fromFloor = null
    action.toFloor = null
    
    console.log(`🔧 extractEntitiesByType called with pddlType: "${pddlType}"`)
    
    switch (pddlType) {
      case 'classical':
        extractClassicalEntities(action, actionName, parameters)
        break
      case 'numerical':
        extractNumericalEntities(action, actionName, parameters)
        break
      case 'pddl+':           // ✅ Handle both variations
      case 'pddl_plus':       // ✅ Handle both variations
        extractPDDLPlusEntities(action, actionName, parameters)
        break
      case 'temporal':
        extractTemporalEntities(action, actionName, parameters)
        break
      default:
        console.log(`❌ Unknown PDDL type: ${pddlType}, defaulting to classical`)
        extractClassicalEntities(action, actionName, parameters)
        break
    }
    
    console.log(`✅ After extraction: type=${action.actionType}, passenger=${action.passenger}, elevator=${action.elevator}`)
  }

  function extractClassicalEntities(action, actionName, parameters) {
    if (actionName === 'move-up' || actionName === 'move-down') {
      action.actionType = 'move'
      action.direction = actionName === 'move-up' ? 'up' : 'down'
      action.elevator = parameters[0] || 'elevatorx'
      action.fromFloor = parameters[1]
      action.toFloor = parameters[2]
    }
    else if (actionName === 'load') {
      action.actionType = 'load'
      action.passenger = parameters[0]
      action.elevator = parameters[1] || 'elevatorx'
      action.fromFloor = parameters[2]
    }
    else if (actionName === 'unload') {
      action.actionType = 'unload'
      action.passenger = parameters[0]
      action.elevator = parameters[1] || 'elevatorx'
      action.toFloor = parameters[2]
    }
  }

  function extractNumericalEntities(action, actionName, parameters) {
    if (actionName === 'move-up' || actionName === 'move-down') {
      action.actionType = 'move'
      action.direction = actionName === 'move-up' ? 'up' : 'down'
      action.elevator = parameters[0] || 'elevatorx'
      action.fromFloor = null
      action.toFloor = null
    }
    else if (actionName === 'load') {
      action.actionType = 'load'
      action.passenger = parameters[0]
      action.elevator = parameters[1] || 'elevatorx'
      action.fromFloor = null
    }
    else if (actionName === 'unload') {
      action.actionType = 'unload'
      action.passenger = parameters[0]
      action.elevator = parameters[1] || 'elevatorx'
      action.toFloor = null
    }
    else if (actionName === 'reached') {
      action.actionType = 'reached'
      action.passenger = parameters[0]
      action.deliveryConfirmed = true
      action.elevator = null
    }
  }

  function extractPDDLPlusEntities(action, actionName, parameters) {
    console.log(`🔧 PDDL+ extracting entities from: ${actionName} [${parameters.join(', ')}]`)
    
    // Movement actions
    if (actionName === 'move-up' || actionName === 'move-down') {
      action.actionType = 'move'
      action.direction = actionName === 'move-up' ? 'up' : 'down'
      action.elevator = parameters[0] || 'elevatorx'
      console.log(`🛗 PDDL+ move: ${action.direction} via ${action.elevator}`)
    }
    // Load actions - SIMPLIFIED
    else if (actionName === 'load') {
      action.actionType = 'load'
      action.passenger = parameters[0]      // ✅ persond, persona, etc.
      action.elevator = parameters[1]       // ✅ elevatorx
      console.log(`👤 PDDL+ load: ${action.passenger} -> ${action.elevator}`)
    }
    // Unload actions - SIMPLIFIED  
    else if (actionName === 'unload') {
      action.actionType = 'unload'
      action.passenger = parameters[0]      // ✅ persond, persona, etc.
      action.elevator = parameters[1]       // ✅ elevatorx
      console.log(`👤 PDDL+ unload: ${action.passenger} from ${action.elevator}`)
    }
    // Reached actions - SIMPLIFIED
    else if (actionName === 'reached') {
      action.actionType = 'reached'
      action.passenger = parameters[0]      // ✅ persond, persona, etc.
      action.deliveryConfirmed = true
      console.log(`🎯 PDDL+ reached: ${action.passenger}`)
    }
    // Unknown actions
    else {
      action.actionType = 'unknown'
      console.log(`❓ PDDL+ unknown action: ${actionName}`)
    }
    
    // Ensure elevator is set for actions that need it
    if ((action.actionType === 'move' || action.actionType === 'load' || action.actionType === 'unload') && !action.elevator) {
      action.elevator = 'elevatorx'
    }
  }

  function extractTemporalEntities(action, actionName, parameters) {
    if (actionName === 'load-person') {
      action.actionType = 'load'
      action.passenger = parameters[0]
      action.elevator = parameters[1]
      action.fromFloor = parameters[2]
    }
    else if (actionName === 'unload-person') {
      action.actionType = 'unload'
      action.passenger = parameters[0]
      action.elevator = parameters[1]
      action.toFloor = parameters[2]
    }
    else if (actionName === 'move-up' || actionName === 'move-down') {
      action.actionType = 'move'
      action.direction = actionName === 'move-up' ? 'up' : 'down'
      action.elevator = parameters[0]
      action.fromFloor = parameters[1]
      action.toFloor = parameters[2]
    }
    else if (actionName === 'serve-person') {
      action.actionType = 'serve'
      action.passenger = parameters[0]
      action.toFloor = parameters[1]
    }
  }

  const planElevators = computed(() => {
    if (!parsedActions.value?.length) return ['elevatorx']
    
    const elevators = new Set()
    parsedActions.value.forEach(action => {
      if (action.elevator) elevators.add(action.elevator)
    })
    
    const result = elevators.size > 0 ? Array.from(elevators) : getDefaultElevators()
    return result
  })

  function getDefaultElevators() {
    switch (props.pddlType) {
      case 'temporal':
        return ['elevator1']
      case 'classical':
      case 'numerical':
      case 'pddl+':
      default:
        return ['elevatorx']
    }
  }

  const planPassengers = computed(() => {
    if (!parsedActions.value?.length) return []
    
    const passengers = new Set()
    
    parsedActions.value.forEach((action) => {
      // Direct passenger property
      if (action.passenger) {
        passengers.add(action.passenger)
      }
      
      // Extract from parameters
      if (action.parameters && Array.isArray(action.parameters)) {
        action.parameters.forEach(param => {
          if (param.startsWith('person') || param.includes('passenger')) {
            passengers.add(param)
          }
        })
      }
      
      // Context-based detection for load/unload/reached actions
      if (action.parameters && action.parameters.length > 0) {
        const firstParam = action.parameters[0]
        if ((action.name === 'load' || action.name === 'unload' || action.name === 'reached' || 
             action.name === 'load-person' || action.name === 'unload-person' || action.name === 'serve-person') && 
            firstParam && !firstParam.includes('elevator') && !firstParam.includes('floor')) {
          passengers.add(firstParam)
        }
      }
    })
    
    return Array.from(passengers)
  })
  const planFloors = computed(() => {
    const pddlType = props.pddlType || 'classical'
    const floors = new Set()
    
    // For temporal - extract floors from explicit parameters
    if (pddlType === 'temporal') {
      parsedActions.value.forEach(action => {
        if (action.parameters) {
          action.parameters.forEach(param => {
            if (param.includes('floor') || /^floor\d+$/i.test(param)) {
              floors.add(param)
            }
          })
        }
      })
      
      if (floors.size === 0) {
        // Fallback for temporal
        for (let i = 0; i <= 4; i++) {
          floors.add(`floor${i}`)
        }
      }
    }
    
    // For classical - extract floors from explicit parameters
    else if (pddlType === 'classical') {
      parsedActions.value.forEach(action => {
        if (action.parameters) {
          action.parameters.forEach(param => {
            if (param.includes('floor') || /^floor\d+$/i.test(param)) {
              floors.add(param)
            }
          })
        }
      })
      
      if (floors.size === 0) {
        // Fallback based on plan analysis
        const maxFloorNum = Math.max(3, Math.ceil(planPassengers.value.length / 2))
        for (let i = 1; i <= maxFloorNum; i++) {
          floors.add(`floor${i}`)
        }
      }
    }
    
    // For numerical and PDDL+ - calculate from movement patterns
    else {
      const moveActions = parsedActions.value?.filter(a => 
        a.actionType === 'move' || a.name?.includes('move')
      ) || []
      
      let maxUpSequence = 0
      let maxDownSequence = 0
      let currentUpSequence = 0
      let currentDownSequence = 0
      
      moveActions.forEach((action) => {
        if (action.direction === 'up' || action.name === 'move-up') {
          currentUpSequence++
          currentDownSequence = 0
          maxUpSequence = Math.max(maxUpSequence, currentUpSequence)
        } else if (action.direction === 'down' || action.name === 'move-down') {
          currentDownSequence++
          currentUpSequence = 0
          maxDownSequence = Math.max(maxDownSequence, currentDownSequence)
        }
      })
      
      const totalFloors = Math.max(4, maxUpSequence + maxDownSequence + 2)
      
      for (let i = 1; i <= totalFloors; i++) {
        floors.add(`Floor${i}`)
      }
    }
    
    const result = Array.from(floors).sort((a, b) => {
      const aNum = parseInt(a.replace(/\D/g, ''))
      const bNum = parseInt(b.replace(/\D/g, ''))
      return aNum - bNum
    })
    
    return result
  })



  const progressPercentage = computed(() => {
    if (!parsedActions.value?.length) return 0
    return (currentStep.value / parsedActions.value.length) * 100
  })

  const currentAction = computed(() => {
    if (!parsedActions.value?.length || currentStep.value >= parsedActions.value.length) return null
    return parsedActions.value[currentStep.value]
  })

  const successMessage = computed(() => {
    if (currentStep.value >= parsedActions.value.length) {
      return 'All passengers delivered successfully!'
    }
    return 'Action completed!'
  })

  const activeFloor = computed(() => {
    const elevator = planElevators.value[0] || 'elevatorx'
    return elevatorLocations.value[elevator] || planFloors.value[0] || 'Floor1'
  })

  const currentPDDLCharacteristics = computed(() => {
    return getPDDLCharacteristics()
  })

  const shouldDisplayTime = computed(() => {
    const characteristics = currentPDDLCharacteristics.value
    return characteristics.hasExplicitTiming
  })

 const shouldDisplayDuration = computed(() => {
  // FIX: Always show duration for temporal
  if (props.pddlType === 'temporal') {
    return true
  }
  
  const characteristics = currentPDDLCharacteristics.value
  return characteristics.hasExplicitDurations
})

  const shouldPrePlacePassengers = computed(() => {
    // ALWAYS place passengers for PDDL+ regardless of action pattern
    if (props.pddlType === 'pddl+') {
      console.log('🎯 PDDL+ forcing passenger pre-placement')
      return true
    }
    
    const characteristics = currentPDDLCharacteristics.value
    return characteristics.actionPattern !== 'process-event'
  })

  const hasElevatorOnFloor = (floor) => {
    return planElevators.value.some(elevator => 
      elevatorLocations.value[elevator] === floor && !elevatorMoving.value[elevator]
    )
  }

  const hasPassengersOnFloor = (floor) => {
    const passengers = planPassengers.value.filter(passenger => 
      passengerLocations.value[passenger] === floor && !isPassengerCarried(passenger)
    )
    
    if (props.pddlType === 'pddl+') {
      console.log(`🔍 Floor ${floor} has ${passengers.length} passengers:`, passengers)
    }
    
    return passengers.length > 0
  }

  const getWaitingPassengers = (floor) => {
    const passengers = planPassengers.value.filter(passenger => 
      passengerLocations.value[passenger] === floor && !isPassengerCarried(passenger)
    )
    
    const result = passengers.map(passenger => ({
      id: passenger,
      name: passenger,
      state: completedDeliveries.value.has(passenger) ? 'delivered' : 'waiting',
      destination: 'Unknown',
      isWaiting: !isPassengerMoving(passenger)
    }))
    
    if (props.pddlType === 'pddl+' && result.length > 0) {
      console.log(`👤 Floor ${floor} waiting passengers:`, result)
    }
    
    return result
  }

  const getRidingPassengers = (elevator) => {
    const passengers = passengerCarrying.value[elevator] || []
    return passengers.map(passenger => ({
      id: passenger,
      name: passenger,
      state: 'riding'
    }))
  }

  const getMovingPassengers = () => {
    const moving = []
    planPassengers.value.forEach(passenger => {
      if (isPassengerMoving(passenger)) {
        const movementData = passengerMovement.value[passenger]
        moving.push({
          id: passenger,
          name: passenger,
          movementType: movementData,
          progress: passengerMovementProgress.value[passenger] || 0
        })
      }
    })
    return moving
  }

  const getElevatorSmoothPosition = (elevator) => {
    // Check if we have a smooth position
    const smoothPosition = elevatorSmoothPositions.value[elevator]
    if (smoothPosition !== undefined && smoothPosition !== null) {
      return smoothPosition
    }
    
    // Fallback to current floor position
    const currentFloor = elevatorLocations.value[elevator] || planFloors.value[0]
    const floorIndex = planFloors.value.indexOf(currentFloor)
    const basePosition = Math.max(0, floorIndex) * 60
    
    // Initialize smooth position for immediate use
    if (elevatorSmoothPositions.value[elevator] === undefined) {
      elevatorSmoothPositions.value = {
        ...elevatorSmoothPositions.value,
        [elevator]: basePosition
      }
    }
    
    return basePosition
  }

  const getCurrentFloor = (elevator) => {
    return elevatorLocations.value[elevator] || planFloors.value[0] || 'Floor1'
  }

  const getMovingPassengerSmoothStyle = (passenger) => {
    const progress = passenger.progress || 0
    const smoothProgress = progress * progress * (3 - 2 * progress)
    
    const elevatorFloor = activeFloor.value
    const floorIndex = planFloors.value.indexOf(elevatorFloor)
    const baseBottom = floorIndex * 60 + 25
    
    if (passenger.movementType === 'boarding') {
      return {
        left: (15 + smoothProgress * 35) + '%',
        bottom: baseBottom + 'px',
        transform: `translateX(${smoothProgress * 60}px) scale(${1 + smoothProgress * 0.1})`,
        opacity: Math.max(0.3, 1 - smoothProgress * 0.4),
        zIndex: 25,
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    } else if (passenger.movementType === 'exiting') {
      return {
        left: (50 - smoothProgress * 35) + '%',
        bottom: baseBottom + 'px',
        transform: `translateX(-${smoothProgress * 60}px) scale(${1.1 - smoothProgress * 0.1})`,
        opacity: Math.max(0.3, 0.7 + smoothProgress * 0.3),
        zIndex: 25,
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
    
    return {
      left: '30%',
      bottom: baseBottom + 'px',
      opacity: 1,
      zIndex: 15,
      transition: 'all 0.15s ease-out'
    }
  }

  const getActionTime = (action) => {
    if (!action) return null
    
    if (action.hasExplicitTime && typeof action.start === 'number') {
      return action.start.toFixed(1)
    }
    
    if (typeof action.step === 'number') {
      return action.step.toString()
    }
    
    return null
  }

const getActionDuration = (action) => {
  if (!action) return null
  
  // FIX: For temporal PDDL, ALWAYS show duration
  if (props.pddlType === 'temporal' && action.duration) {
    return action.duration.toFixed(1) + 's'
  }
  
  // Check if action has explicit duration in brackets [X.X]
  if (action.raw && action.raw.includes('[') && action.raw.includes(']')) {
    const durationMatch = action.raw.match(/\[(\d+(?:\.\d+)?)\]/)
    if (durationMatch) {
      return durationMatch[1] + 's'
    }
  }
  
  // Check if action has duration property
  if (action.duration && typeof action.duration === 'number') {
    return action.duration.toFixed(1) + 's'
  }
  
  return null
}

  const getActionDesc = (action) => {
    if (!action) return 'No action'
    
    let description = ''
    
    if (action.actionType === 'move' || action.name?.includes('move')) {
      const direction = action.direction || (action.name?.includes('up') ? 'up' : 'down')
      const fromFloor = action.fromFloor || ''
      const toFloor = action.toFloor || ''
      const floorInfo = (fromFloor && toFloor) ? ` ${fromFloor}→${toFloor}` : ''
      description = `Move ${direction}${floorInfo} (${action.elevator || 'elevator'})`
    } else if (action.actionType === 'load' || action.name?.includes('load')) {
      const passenger = action.passenger || 'passenger'
      const floor = action.fromFloor || ''
      const floorInfo = floor ? ` from ${floor}` : ''
      description = `Load ${passenger}${floorInfo}`
    } else if (action.actionType === 'unload' || action.name?.includes('unload')) {
      const passenger = action.passenger || 'passenger'
      const floor = action.toFloor || ''
      const floorInfo = floor ? ` to ${floor}` : ''
      description = `Unload ${passenger}${floorInfo}`
    } else if (action.actionType === 'reached' || action.name === 'reached') {
      description = `${action.passenger || 'passenger'} reached destination`
    } else if (action.actionType === 'serve' || action.name?.includes('serve')) {
      const passenger = action.passenger || 'passenger'
      const floor = action.toFloor || ''
      const floorInfo = floor ? ` at ${floor}` : ''
      description = `Serve ${passenger}${floorInfo}`
    } else {
      description = action.name || 'Unknown action'
    }
    
    return description
  }

  const ensurePDDLPlusPassengerVisibility = (action) => {
    if (props.pddlType === 'pddl+' && action.passenger && !passengerLocations.value[action.passenger]) {
      const elevator = action.elevator || planElevators.value[0];
      const currentFloor = elevatorLocations.value[elevator] || planFloors.value[0];
      
      if (action.actionType === 'load') {
        const newLocations = { ...passengerLocations.value };
        newLocations[action.passenger] = currentFloor;
        passengerLocations.value = newLocations;
      }
    }
  }

  const isPassengerCarried = (passenger) => {
    return Object.values(passengerCarrying.value).some(carried => carried.includes(passenger))
  }

  const isElevatorMoving = (elevator) => {
    return elevatorMoving.value[elevator] || false
  }

  const getElevatorDoorState = (elevator) => {
    return elevatorDoors.value[elevator] || 'closed'
  }

  const isPassengerMoving = (passenger) => {
    return !!passengerMovement.value[passenger]
  }

  const getElevatorCarrying = (elevator) => {
    return passengerCarrying.value[elevator] || []
  }

  function startAnimationLoop() {
    if (animationFrame) return // Prevent multiple loops
    
    function animate() {
      let hasActiveAnimations = false
      
      // Update passenger movements
      for (const passenger of Object.keys(passengerMovement.value)) {
        if (passenger.endsWith('_startTime')) continue
        
        const startTime = passengerMovement.value[passenger + '_startTime']
        if (startTime) {
          const elapsed = (Date.now() - startTime) / 1000
          let progress = Math.min(1, elapsed / 0.8)
          progress = progress * progress * (3 - 2 * progress) // Smooth easing
          
          passengerMovementProgress.value[passenger] = progress
          hasActiveAnimations = true
          
          if (progress >= 1) {
            delete passengerMovement.value[passenger]
            delete passengerMovementProgress.value[passenger]
            delete passengerMovement.value[passenger + '_startTime']
          }
        }
      }
      
      // SIMPLE elevator smooth movement
      for (const elevator of Object.keys(elevatorSmoothPositions.value)) {
        const targetFloor = elevatorLocations.value[elevator]
        const targetIndex = planFloors.value.indexOf(targetFloor)
        const targetPosition = targetIndex * 60
        const currentPosition = elevatorSmoothPositions.value[elevator] || 0
        
        const distance = Math.abs(targetPosition - currentPosition)
        
        if (distance > 0.5) {
          // Simple smooth interpolation
          const speed = 0.1 // Fixed speed for all types
          const direction = targetPosition > currentPosition ? 1 : -1
          const moveAmount = Math.min(distance, Math.max(1, distance * speed))
          
          elevatorSmoothPositions.value = {
            ...elevatorSmoothPositions.value,
            [elevator]: currentPosition + (direction * moveAmount)
          }
          hasActiveAnimations = true
        } else {
          elevatorSmoothPositions.value = {
            ...elevatorSmoothPositions.value,
            [elevator]: targetPosition
          }
        }
      }
      
      // Continue animation
      if (hasActiveAnimations || isPlaying.value) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        animationFrame = null
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
  }

  // CRITICAL FIX: Separated movement vs passenger actions with proper door control
  function executeAction(action) {
    if (!action) {
      return
    }
    
    console.log(`⚡ EXECUTING ${props.pddlType.toUpperCase()} ACTION:`, {
      name: action.name,
      actionType: action.actionType,
      passenger: action.passenger,
      elevator: action.elevator,
      direction: action.direction
    })
    
    // For PDDL+, ensure passengers are visible BEFORE any action
    if (props.pddlType === 'pddl+' || props.pddlType === 'pddl_plus') {
      ensurePDDLPlusPassengerVisibility(action)
      
      // Force a reactive update
      nextTick(() => {
        console.log('PDDL+ Passenger locations after placement:', passengerLocations.value)
      })
    }
    
    // CRITICAL FIX: Handle movement by action name if actionType is unknown
    if (action.actionType === 'move' || action.name === 'move-up' || action.name === 'move-down') {
      console.log(`🛗 Executing movement action: ${action.name}`)
      executeMovement(action)
    }
    else if (action.actionType === 'load' || action.name === 'load') {
      console.log(`👤 Executing load action: ${action.name}`)
      executeLoad(action)
    }
    else if (action.actionType === 'unload' || action.name === 'unload') {
      console.log(`👤 Executing unload action: ${action.name}`)
      executeUnload(action)
    }
    else if (action.actionType === 'reached' || action.name === 'reached') {
      console.log(`🎯 Executing reached action: ${action.name}`)
      executeReached(action)
    }
    else if (action.actionType === 'serve' || action.name === 'serve') {
      console.log(`🎯 Executing serve action: ${action.name}`)
      executeServe(action)
    }
    else if (action.actionType === 'process') {
      executeProcess(action)
    }
    else if (action.actionType === 'event') {
      executeEvent(action)
    }
    else {
      console.log(`❓ Unknown action, executing generic: ${action.name}`)
      executeGenericAction(action)
    }
  }
function executeLoad(action) {
  const passenger = action.passenger
  const elevator = action.elevator || 'elevatorx'
  
  console.log(`🎭 ${props.pddlType.toUpperCase()} LOAD START: ${passenger} at ${elevator}`)
  console.log(`🎭 Action duration: ${action.duration}s`)
  console.log(`🎭 Elevator location:`, elevatorLocations.value[elevator])
  console.log(`🎭 Passenger location:`, passengerLocations.value[passenger])
  
  // Check if passenger is already delivered
  if (completedDeliveries.value.has(passenger)) {
    console.log(`⚠️ Passenger ${passenger} already delivered, skipping load`)
    return
  }
  
  // Check if passenger is already in elevator
  const currentlyCarried = passengerCarrying.value[elevator] || []
  if (currentlyCarried.includes(passenger)) {
    console.log(`⚠️ Passenger ${passenger} already in elevator ${elevator}, skipping load`)
    return
  }
  
  const currentFloor = elevatorLocations.value[elevator]
  const passengerFloor = passengerLocations.value[passenger]
  
  // For temporal, use fromFloor from action if passenger not found
  if (!passengerFloor && props.pddlType === 'temporal' && action.fromFloor) {
    console.log(`⏰ TEMPORAL: Placing ${passenger} on ${action.fromFloor} from action`)
    const newLocations = { ...passengerLocations.value }
    newLocations[passenger] = action.fromFloor
    passengerLocations.value = newLocations
  }
  
  if (!passengerLocations.value[passenger]) {
    console.log(`⚠️ Passenger ${passenger} not found anywhere, skipping load`)
    return
  }
  
  // TEMPORAL FIX: Use the actual duration from the plan
  const planDuration = action.duration // This is the [2.0] from the plan
  const loadDuration = planDuration * 1000 // Convert to milliseconds
  
  console.log(`✅ ${props.pddlType.toUpperCase()} LOAD: Proceeding with loading ${passenger} (duration: ${planDuration}s)`)
  
  // Start loading process immediately
  nextTick(() => {
    elevatorDoors.value = { ...elevatorDoors.value, [elevator]: 'opening' }
    console.log(`🚪 TEMPORAL LOAD: Opening doors`)
  })
  
  // For temporal, distribute the load time across the full duration
  const doorOpenTime = loadDuration * 0.2  // 20% for door opening
  const boardingTime = loadDuration * 0.6   // 60% for boarding
  
  // Doors fully open
  setTimeout(() => {
    elevatorDoors.value = { ...elevatorDoors.value, [elevator]: 'open' }
    console.log(`🚪 TEMPORAL LOAD: Doors open`)
  }, doorOpenTime)
  
  // Start passenger boarding animation
  setTimeout(() => {
    // Ensure passenger is on the same floor as elevator
    const passengerCurrentFloor = passengerLocations.value[passenger]
    if (passengerCurrentFloor !== currentFloor) {
      console.log(`⏰ TEMPORAL LOAD: Moving ${passenger} from ${passengerCurrentFloor} to ${currentFloor}`)
      const newLocations = { ...passengerLocations.value }
      newLocations[passenger] = currentFloor
      passengerLocations.value = newLocations
    }
    
    passengerMovement.value = { 
      ...passengerMovement.value, 
      [passenger]: 'boarding',
      [passenger + '_startTime']: Date.now()
    }
    
    console.log(`🏃 TEMPORAL LOAD: ${passenger} starting to board`)
    
    if (!animationFrame) startAnimationLoop()
  }, doorOpenTime)
  
  // Complete the boarding
  setTimeout(() => {
    // Add passenger to elevator
    const newCarrying = { ...passengerCarrying.value }
    if (!newCarrying[elevator]) {
      newCarrying[elevator] = []
    }
    newCarrying[elevator] = [...newCarrying[elevator], passenger]
    passengerCarrying.value = newCarrying
    
    // Remove passenger from floor
    const newLocations = { ...passengerLocations.value }
    delete newLocations[passenger]
    passengerLocations.value = newLocations
    
    console.log(`✅ TEMPORAL LOAD: ${passenger} successfully loaded into ${elevator}`)
    console.log(`⏰ Updated carrying:`, newCarrying[elevator])
  }, doorOpenTime + boardingTime)
  
  // Start closing doors
  setTimeout(() => {
    elevatorDoors.value = { ...elevatorDoors.value, [elevator]: 'closing' }
    console.log(`🚪 TEMPORAL LOAD: Closing doors`)
  }, doorOpenTime + boardingTime)
  
  // Doors fully closed (complete action)
  setTimeout(() => {
    elevatorDoors.value = { ...elevatorDoors.value, [elevator]: 'closed' }
    console.log(`🚪 TEMPORAL LOAD: Doors closed, load complete after ${planDuration}s`)
  }, loadDuration)
}
  
function executeUnload(action) {
  const passenger = action.passenger
  const elevator = action.elevator || 'elevatorx'
  
  console.log(`🎭 ${props.pddlType.toUpperCase()} UNLOAD START: ${passenger} from ${elevator}`)
  console.log(`🎭 Action duration: ${action.duration}s`)
  
  // Check if passenger is actually in the elevator
  const currentlyCarried = passengerCarrying.value[elevator] || []
  if (!currentlyCarried.includes(passenger)) {
    console.log(`⚠️ Passenger ${passenger} not in elevator ${elevator}, skipping unload`)
    console.log(`⚠️ Currently carried:`, currentlyCarried)
    return
  }
  
  const currentFloor = elevatorLocations.value[elevator]
  console.log(`✅ ${props.pddlType.toUpperCase()} UNLOAD: Proceeding to unload ${passenger} at ${currentFloor}`)
  
  // TEMPORAL FIX: Use the actual duration from the plan
  const planDuration = action.duration // This is the [2.0] from the plan
  const unloadDuration = planDuration * 1000 // Convert to milliseconds
  
  // For temporal, distribute the unload time across the full duration
  const doorOpenTime = unloadDuration * 0.2  // 20% for door opening
  const exitingTime = unloadDuration * 0.6   // 60% for exiting
  
  // Open doors
  nextTick(() => {
    elevatorDoors.value = { ...elevatorDoors.value, [elevator]: 'opening' }
    console.log(`🚪 TEMPORAL UNLOAD: Opening doors`)
  })
  
  setTimeout(() => {
    elevatorDoors.value = { ...elevatorDoors.value, [elevator]: 'open' }
    console.log(`🚪 TEMPORAL UNLOAD: Doors open`)
  }, doorOpenTime)
  
  // Start passenger exiting
  setTimeout(() => {
    passengerMovement.value = { 
      ...passengerMovement.value, 
      [passenger]: 'exiting',
      [passenger + '_startTime']: Date.now()
    }
    
    // Remove passenger from elevator immediately
    const newCarrying = { ...passengerCarrying.value }
    if (newCarrying[elevator]) {
      newCarrying[elevator] = newCarrying[elevator].filter(p => p !== passenger)
    }
    passengerCarrying.value = newCarrying
    
    console.log(`🏃 TEMPORAL UNLOAD: ${passenger} exiting elevator`)
    console.log(`⏰ Updated carrying:`, newCarrying[elevator])
    
    if (!animationFrame) startAnimationLoop()
  }, doorOpenTime)
  
  // Complete the unloading
  setTimeout(() => {
    // Place passenger on target floor
    const targetFloor = action.toFloor || currentFloor
    const newLocations = { ...passengerLocations.value }
    newLocations[passenger] = targetFloor
    passengerLocations.value = newLocations
    
    console.log(`✅ TEMPORAL UNLOAD: ${passenger} placed at ${targetFloor}`)
  }, doorOpenTime + exitingTime)
  
  // Close doors
  setTimeout(() => {
    elevatorDoors.value = { ...elevatorDoors.value, [elevator]: 'closing' }
    console.log(`🚪 TEMPORAL UNLOAD: Closing doors`)
  }, doorOpenTime + exitingTime)
  
  setTimeout(() => {
    elevatorDoors.value = { ...elevatorDoors.value, [elevator]: 'closed' }
    console.log(`🚪 TEMPORAL UNLOAD: Doors closed, unload complete after ${planDuration}s`)
  }, unloadDuration)
}

  function executeReached(action) {
    const passenger = action.passenger
    if (passenger) {
      completedDeliveries.value = new Set([...completedDeliveries.value, passenger])
    }
    
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 2000)
  }

function executeServe(action) {
  const passenger = action.passenger
  const floor = action.toFloor || action.fromFloor
  
  console.log(`🎯 TEMPORAL SERVE: ${passenger} at ${floor} (duration: ${action.duration}s)`)
  
  if (passenger) {
    // Mark passenger as delivered after the serve duration
    setTimeout(() => {
      completedDeliveries.value = new Set([...completedDeliveries.value, passenger])
      console.log(`✅ TEMPORAL SERVE: ${passenger} service completed`)
    }, action.duration * 1000)
  }
  
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, action.duration * 1000)
}

  function executeProcess(action) {
    console.log(`⚙️ PDDL+ Process: ${action.processType || action.name}`)
    
    // PDDL+ processes can have continuous effects
    if (action.passenger) {
      // Process might involve passenger movement
      // const passenger = action.passenger
      // const elevator = action.elevator || planElevators.value[0]
      
      // Simulate continuous process
      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
      }, action.duration * 1000)
    }
  }

  function executeEvent(action) {
    console.log(`📡 PDDL+ Event: ${action.eventType || action.name}`)
    
    // PDDL+ events are instantaneous
    if (action.passenger) {
      completedDeliveries.value = new Set([...completedDeliveries.value, action.passenger])
    }
    
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 1000)
  }

  function executeGenericAction() {
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 2000)
  }

  function togglePlayback() {
    isPlaying.value = !isPlaying.value
    
    if (isPlaying.value && !animationFrame) {
      startAnimationLoop()
    }
  }

  function pauseSimulation() {
    isPlaying.value = false
  }

  function resetSimulation() {
    isPlaying.value = false
    currentStep.value = 0
    
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
    
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
    }
    
    elevatorMoving.value = {}
    elevatorDoors.value = {}
    elevatorSmoothPositions.value = {}
    passengerMovement.value = {}
    passengerMovementProgress.value = {}
    passengerSmoothPositions.value = {}
    completedDeliveries.value = new Set()
    
    initializeLocations()
  }

function initializeLocations() {
  if (planFloors.value.length === 0) return

  const newElevatorLocations = {}
  const newElevatorDoors = {}
  const newPassengerCarrying = {}
  const newElevatorSmoothPositions = {}
  
  // Initialize elevators
  planElevators.value.forEach(elevator => {
    let startFloor = planFloors.value[0]
    
    // CLASSICAL FIX: Determine starting floor from first move action's fromFloor
    if (props.pddlType === 'classical') {
      const firstMoveAction = parsedActions.value.find(action => 
        action.elevator === elevator && action.actionType === 'move'
      )
      
      if (firstMoveAction && firstMoveAction.fromFloor) {
        startFloor = firstMoveAction.fromFloor
        console.log(`🎭 CLASSICAL: Elevator ${elevator} starts at ${startFloor} (from first move action)`)
      }
    } else if (props.pddlType === 'temporal') {
      const firstMoveAction = parsedActions.value.find(action => 
        action.elevator === elevator && action.actionType === 'move'
      )
      
      if (firstMoveAction) {
        if (firstMoveAction.fromFloor) {
          startFloor = firstMoveAction.fromFloor
        } else if (firstMoveAction.direction === 'down' || firstMoveAction.name === 'move-down') {
          startFloor = planFloors.value[planFloors.value.length - 1]
        }
      }
    } else {
      const firstMoveAction = parsedActions.value.find(action => 
        action.elevator === elevator && (action.actionType === 'move' || action.name?.includes('move'))
      )
      
      if (firstMoveAction) {
        if (firstMoveAction.direction === 'down' || firstMoveAction.name === 'move-down') {
          startFloor = planFloors.value[planFloors.value.length - 1]
        }
      }
    }
    
    newElevatorLocations[elevator] = startFloor
    newPassengerCarrying[elevator] = []
    newElevatorDoors[elevator] = 'closed'
    
    const floorIndex = planFloors.value.indexOf(startFloor)
    newElevatorSmoothPositions[elevator] = floorIndex * 60
  })
  
  elevatorLocations.value = newElevatorLocations
  passengerCarrying.value = newPassengerCarrying
  elevatorDoors.value = newElevatorDoors
  elevatorSmoothPositions.value = newElevatorSmoothPositions

  // CLASSICAL FIX: Place passengers based on their FIRST load action's fromFloor
  const newPassengerLocations = {}
  
  if (props.pddlType === 'classical') {
    planPassengers.value.forEach(passenger => {
      const firstLoadAction = parsedActions.value.find(action => 
        (action.actionType === 'load' || action.name === 'load') && 
        action.passenger === passenger
      )
      
      if (firstLoadAction && firstLoadAction.fromFloor) {
        newPassengerLocations[passenger] = firstLoadAction.fromFloor
        console.log(`🎭 CLASSICAL: ${passenger} placed on ${firstLoadAction.fromFloor} (from load action)`)
      } else {
        // Fallback: place on first floor
        newPassengerLocations[passenger] = planFloors.value[0]
        console.log(`🎭 CLASSICAL: ${passenger} placed on ${planFloors.value[0]} (fallback)`)
      }
    })
  } else {
    // Keep existing logic for other PDDL types
    planPassengers.value.forEach((passenger, index) => {
      const loadAction = parsedActions.value.find(action => 
        (action.actionType === 'load' || action.name === 'load') && 
        action.passenger === passenger
      )
      
      if (loadAction) {
        if (props.pddlType === 'temporal' && loadAction.fromFloor) {
          newPassengerLocations[passenger] = loadAction.fromFloor
        } else {
          const elevatorFloor = calculateElevatorPositionAtAction(loadAction, newElevatorLocations)
          newPassengerLocations[passenger] = elevatorFloor
        }
      } else {
        const floorIndex = index % planFloors.value.length
        newPassengerLocations[passenger] = planFloors.value[floorIndex]
      }
    })
  }
  
  // Ensure all passengers are placed
  if (Object.keys(newPassengerLocations).length === 0 && planPassengers.value.length > 0) {
    planPassengers.value.forEach((passenger, index) => {
      const floorIndex = index % planFloors.value.length
      newPassengerLocations[passenger] = planFloors.value[floorIndex]
    })
  }
  
  passengerLocations.value = newPassengerLocations
  console.log('🎭 CLASSICAL: Initial passenger locations:', newPassengerLocations)
}

  function calculateElevatorPositionAtAction(targetAction, initialElevatorLocations) {
    const loadActionIndex = parsedActions.value.indexOf(targetAction)
    const elevator = targetAction.elevator
    
    let elevatorFloor = initialElevatorLocations[elevator]
    
    for (let i = 0; i < loadActionIndex; i++) {
      const action = parsedActions.value[i]
      if (action.elevator === elevator && action.actionType === 'move') {
        const currentIndex = planFloors.value.indexOf(elevatorFloor)
        
        if (props.pddlType === 'classical' || props.pddlType === 'temporal') {
          if (action.toFloor) {
            elevatorFloor = action.toFloor
          }
        } else {
          if (action.direction === 'up') {
            elevatorFloor = planFloors.value[Math.min(currentIndex + 1, planFloors.value.length - 1)]
          } else if (action.direction === 'down') {
            elevatorFloor = planFloors.value[Math.max(currentIndex - 1, 0)]
          }
        }
      }
    }
    
    return elevatorFloor
  }

watch([isPlaying, playbackSpeed], ([playing, speed]) => {
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }

  if (playing && currentStep.value < parsedActions.value.length) {
    // TEMPORAL PDDL FIX: Execute actions based on their explicit timing and durations
    if (props.pddlType === 'temporal') {
      executeTemporalTimedPlan(speed)
    }
    // CLASSICAL PDDL FIX: Execute actions based on their explicit timing
    else if (props.pddlType === 'classical') {
      executeClassicalTimedPlan(speed)
    } else {
      // Keep existing logic for other PDDL types
      const executeSteps = () => {
        if (currentStep.value < parsedActions.value.length && isPlaying.value) {
          stepForward()
          
          if (currentStep.value < parsedActions.value.length && isPlaying.value) {
            const nextAction = parsedActions.value[currentStep.value] || { duration: 2 }
            const interval = Math.max(300, (nextAction.duration * 1000) / speed)
            setTimeout(executeSteps, interval)
          } else {
            isPlaying.value = false
          }
        }
      }
      
      executeSteps()
    }
  }
})
function executeTemporalTimedPlan(speed) {
  if (!parsedActions.value?.length) return
  
  console.log('⏰ TEMPORAL: Starting timed plan execution with explicit durations')
  
  let actionIndex = 0
  
  const scheduleNextAction = () => {
    if (actionIndex >= parsedActions.value.length || !isPlaying.value) {
      isPlaying.value = false
      if (actionIndex >= parsedActions.value.length) {
        showSuccess.value = true
        setTimeout(() => {
          showSuccess.value = false
        }, 3000)
      }
      return
    }
    
    const action = parsedActions.value[actionIndex]
    const actionStartTime = action.start || action.step || actionIndex
    
    // Calculate real-world delay based on plan timing and playback speed
    const delayMs = (actionStartTime * 1000) / speed
    
    console.log(`⏰ TEMPORAL: Scheduling action ${actionIndex} "${action.name}" at plan time ${actionStartTime}s, duration ${action.duration}s, real delay ${delayMs}ms`)
    
    setTimeout(() => {
      if (isPlaying.value && actionIndex < parsedActions.value.length) {
        console.log(`⏰ TEMPORAL: Executing action ${actionIndex} "${action.name}" at plan time ${actionStartTime}s`)
        executeAction(parsedActions.value[actionIndex])
        currentStep.value = actionIndex + 1
        
        if (!animationFrame) {
          startAnimationLoop()
        }
        
        actionIndex++
        scheduleNextAction()
      }
    }, delayMs)
  }
  
  scheduleNextAction()
}


// 2. Add this new function for classical PDDL timed execution
function executeClassicalTimedPlan(speed) {
  if (!parsedActions.value?.length) return
  
  console.log('🎭 CLASSICAL: Starting timed plan execution')
  
  // const startTime = Date.now()
  let actionIndex = 0
  
  const scheduleNextAction = () => {
    if (actionIndex >= parsedActions.value.length || !isPlaying.value) {
      isPlaying.value = false
      if (actionIndex >= parsedActions.value.length) {
        showSuccess.value = true
        setTimeout(() => {
          showSuccess.value = false
        }, 300)
      }
      return
    }
    
    const action = parsedActions.value[actionIndex]
    const actionStartTime = action.start || action.step || actionIndex
    
    // Calculate real-world delay based on plan timing and playback speed
    const delayMs = (actionStartTime * 1000) / speed
    
    console.log(`🎭 CLASSICAL: Scheduling action ${actionIndex} at plan time ${actionStartTime}, real delay ${delayMs}ms`)
    
    setTimeout(() => {
      if (isPlaying.value && actionIndex < parsedActions.value.length) {
        console.log(`🎭 CLASSICAL: Executing action ${actionIndex} at plan time ${actionStartTime}`)
        executeAction(parsedActions.value[actionIndex])
        currentStep.value = actionIndex + 1
        
        if (!animationFrame) {
          startAnimationLoop()
        }
        
        actionIndex++
        scheduleNextAction()
      }
    }, delayMs)
  }
  
  scheduleNextAction()
}

// 3. Modify the stepForward function to handle classical timing correctly
function stepForward() {
  if (currentStep.value < parsedActions.value.length) {
    const action = parsedActions.value[currentStep.value]
    
    executeAction(action)
    currentStep.value++
    
    if (!animationFrame) {
      startAnimationLoop()
    }
    
    if (currentStep.value >= parsedActions.value.length) {
      isPlaying.value = false
      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
    }
  } else {
    isPlaying.value = false
  }
}

function executeMovement(action) {
  const elevator = action.elevator || 'elevatorx'
  let targetFloor
  let currentFloor = elevatorLocations.value[elevator]
  
  if (props.pddlType === 'classical' || props.pddlType === 'temporal') {
    currentFloor = action.fromFloor || currentFloor
    targetFloor = action.toFloor
  } else {
    // For numerical/PDDL+, calculate target floor
    const currentIndex = planFloors.value.indexOf(currentFloor)
    if (currentIndex === -1) return
    
    let targetIndex = currentIndex
    if (action.direction === 'up' || action.name === 'move-up') {
      targetIndex = Math.min(currentIndex + 1, planFloors.value.length - 1)
    } else if (action.direction === 'down' || action.name === 'move-down') {
      targetIndex = Math.max(currentIndex - 1, 0)
    }
    
    targetFloor = planFloors.value[targetIndex]
  }
  
  if (!targetFloor || targetFloor === currentFloor) return
  
  // TEMPORAL FIX: Use the actual duration from the plan
  let movementDuration = action.duration
  if (props.pddlType === 'classical') {
    // For classical, the duration is implicitly the time until the next action
    const actionIndex = parsedActions.value.indexOf(action)
    const nextAction = parsedActions.value[actionIndex + 1]
    if (nextAction) {
      const nextTime = nextAction.start || nextAction.step || (actionIndex + 1)
      const currentTime = action.start || action.step || actionIndex
      movementDuration = nextTime - currentTime
    }
  }
  // For temporal, use the explicit duration from [X.X]
  
  console.log(`🛗 ${props.pddlType.toUpperCase()} MOVEMENT: ${currentFloor} → ${targetFloor} (duration: ${movementDuration}s)`)
  
  nextTick(() => {
    elevatorMoving.value = { ...elevatorMoving.value, [elevator]: true }
    elevatorDoors.value = { ...elevatorDoors.value, [elevator]: 'closed' }
    
    // Initialize smooth position if needed
    if (elevatorSmoothPositions.value[elevator] === undefined) {
      const currentIndex = planFloors.value.indexOf(currentFloor)
      elevatorSmoothPositions.value = {
        ...elevatorSmoothPositions.value,
        [elevator]: currentIndex * 60
      }
    }
    
    startAnimationLoop()
    
    // Complete movement after the exact duration from the plan
    setTimeout(() => {
      elevatorLocations.value = { ...elevatorLocations.value, [elevator]: targetFloor }
      elevatorMoving.value = { ...elevatorMoving.value, [elevator]: false }
      console.log(`🛗 ${props.pddlType.toUpperCase()}: Movement completed from ${currentFloor} to ${targetFloor} in ${movementDuration}s`)
    }, movementDuration * 1000)
  })
}
  watch(() => props.actions, () => {
    resetSimulation()
  }, { immediate: true })

  onMounted(() => {
    initializeLocations()
  })

  onUnmounted(() => {
    if (playInterval) {
      clearInterval(playInterval)
    }
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
  })

  return {
    isPlaying,
    currentStep,
    playbackSpeed,
    showSuccess,
    
    progressPercentage,
    currentAction,
    planElevators,
    planPassengers,
    planFloors,
    parsedActions,
    successMessage,
    activeFloor,
    shouldDisplayTime,
    shouldDisplayDuration,
    shouldPrePlacePassengers,
    getActionDuration,
    
    hasElevatorOnFloor,
    hasPassengersOnFloor,
    getWaitingPassengers,
    getRidingPassengers,
    getMovingPassengers,
    isPassengerCarried,
    getElevatorCarrying,
    isElevatorMoving,
    getElevatorDoorState,
    isPassengerMoving,
    getElevatorSmoothPosition,
    getCurrentFloor,
    getMovingPassengerSmoothStyle,
    getActionTime,
    getActionDesc,
    currentPDDLCharacteristics,
    
    togglePlayback,
    pauseSimulation,
    resetSimulation,
    stepForward
  }
}