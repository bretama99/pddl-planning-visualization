/* eslint-disable no-unused-vars */
// Enhanced Robot Simulator with Dynamic Capabilities Detection
// File Path: src/components/visualization/robotSimulator.js
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { parseRobotPlanFile, extractEntitiesFromActions } from '@/utils/robot/enhancedRobotParser.js'

export function createRobotSimulator(props) {
  console.log('🤖 Creating dynamic robot simulator:', props)
  
  // State variables
  const isPlaying = ref(false)
  const currentStep = ref(0)
  const playbackSpeed = ref(1)
  const objectLocations = ref({})
  const robotLocations = ref({})
  const robotCarrying = ref({})
  const activeRobots = ref(new Set())
  const showSuccess = ref(false)
  const particles = ref([])
  
  // Smooth movement state
  const movingRobots = ref(new Set())
  const robotMovementProgress = ref({})
  const robotTargetRooms = ref({})
  const robotStartRooms = ref({})
  const robotMovementStartTime = ref({})
  
  // Dynamic capabilities state
  const robotCapabilities = ref({})
  const robotEnergy = ref({})
  const robotMaxEnergy = ref({})
  const robotCarryingCapacity = ref({})
  const robotMaxCapacity = ref({})
  const robotIsCharging = ref({})
  const robotMovementSpeeds = ref({})
  const currentTime = ref(0)
  const totalCost = ref(0)
  const activeActions = ref([])
  const completedActions = ref(new Set())
  
  // Universal constraints
  const energyConsumptionRates = ref({})
  const chargingRates = ref({})
  const fuelLevels = ref({}) // For logistics domain
  const passengerCapacity = ref({}) // For elevator domain

  // Parse raw content into actions
  const parsedActions = computed(() => {
    console.log('🔍 Parsing actions with dynamic capability detection:', typeof props.actions, props.actions)
    
    if (!props.actions) return []
    
    if (Array.isArray(props.actions)) {
      console.log('✅ Actions already parsed as array:', props.actions)
      return props.actions
    }
    
    if (typeof props.actions === 'string') {
      console.log('📝 Parsing raw content with dynamic analysis')
      return parseUniversalPlanContent(props.actions, props.pddlType || 'classical')
    }
    
    console.log('⚠️ Unknown actions format, returning empty array')
    return []
  })

  // Universal plan parser that handles all PDDL types and domains
  function parseUniversalPlanContent(content, pddlType = 'classical') {
    console.log('🌐 Parsing universal plan content with dynamic analysis')
    
    if (!content || content.trim().length === 0) {
      console.log('❌ Empty content')
      return []
    }

    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => isValidActionLine(line))

    console.log('📋 Filtered universal plan lines:', lines.length)

    const actions = []
    
    lines.forEach((line, index) => {
      const action = parseUniversalActionLine(line, index, pddlType)
      if (action) {
        actions.push(action)
        console.log(`✅ Parsed universal action ${index}:`, action)
      }
    })

    // Analyze capabilities from parsed actions
    analyzeUniversalCapabilities(actions)

    console.log('🎉 Total parsed universal actions:', actions.length)
    return actions
  }

  function isValidActionLine(line) {
    return line.length > 0 && 
           !line.startsWith(';') &&
           !line.startsWith('//') &&
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
           (line.includes(':') || line.includes('waiting'))
  }

  // Universal action parser for all PDDL types and domains
  function parseUniversalActionLine(line, index, pddlType) {
    let match
    let timeOrStep = 0
    let actionContent = ''
    let duration = null
    let isWaiting = false
    let cost = 1
    let isEvent = false
    let isProcess = false
    
    console.log(`🔧 Parsing universal line for ${pddlType}:`, line)
    
    // Handle PDDL+ waiting actions
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
          type: pddlType,
          cost: 0,
          raw: line,
          parameters: []
        }
      }
    }
    
    // Parse temporal PDDL format: "0.0: (action ...) [duration]"
    if (pddlType === 'temporal' || pddlType === 'pddl+') {
      match = line.match(/^(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)(?:\s*\[(\d+(?:\.\d+)?)\])?/)
      if (match) {
        timeOrStep = parseFloat(match[1])
        actionContent = match[2].trim()
        duration = match[3] ? parseFloat(match[3]) : null
      }
    }
    
    // Parse regular time-based format: "0.0: (action ...)"
    if (!actionContent) {
      match = line.match(/^(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)/)
      if (match) {
        timeOrStep = parseFloat(match[1])
        actionContent = match[2].trim()
      }
    }
    
    // Fallback: try general format
    if (!actionContent) {
      match = line.match(/^(?:Step\s+)?(\d+)[:.]?\s*(.+)/)
      if (match) {
        timeOrStep = parseInt(match[1])
        actionContent = match[2].trim().replace(/^\(|\)$/g, '')
      }
    }
    
    if (!actionContent) {
      console.log('❌ Could not parse line:', line)
      return null
    }
    
    const parts = actionContent.split(/\s+/).filter(p => p.length > 0)
    if (parts.length === 0) return null
    
    const actionName = parts[0].toLowerCase()
    const parameters = parts.slice(1)
    
    // Determine if this is a process or event for PDDL+
    if (pddlType === 'pddl+') {
      if (actionName.includes('start') || actionName.includes('reprise')) {
        isProcess = true
      } else if (actionName.includes('stop')) {
        isEvent = true
      }
    }
    
    // Calculate dynamic duration based on action analysis
    if (duration === null) {
      duration = calculateDynamicDuration(actionName, pddlType, parameters)
    }
    cost = calculateDynamicCost(actionName, pddlType, parameters)
    
    const action = {
      id: `action-${index}`,
      name: actionName,
      parameters: parameters,
      step: Math.floor(timeOrStep),
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
    
    // Extract entities and action type universally
    extractUniversalActionEntities(action, actionName, parameters)
    
    return action
  }

  // Dynamic duration calculation based on action analysis
  function calculateDynamicDuration(actionName, pddlType, parameters) {
    // For PDDL+, analyze waiting patterns to determine realistic durations
    if (pddlType === 'pddl+') {
      return calculatePDDLPlusDuration(actionName, parameters)
    }
    
    // For temporal, use realistic durations
    if (pddlType === 'temporal') {
      return calculateTemporalDuration(actionName, parameters)
    }
    
    // For classical/numerical, use unit durations
    return 1.0
  }

  function calculatePDDLPlusDuration(actionName, parameters) {
    const baseDurations = {
      'pick': 0.1,              // Instant in PDDL+
      'drop': 0.1,              // Instant in PDDL+
      'startmove': 0.1,         // Process initiation
      'reprisemovement': 0.1,   // Process completion
      'startcharge': 0.1,       // Charging initiation
      'stopcharge': 0.1,        // Charging completion
      'load': 0.1,              // Logistics loading
      'unload': 0.1,            // Logistics unloading
      'board': 0.1,             // Elevator boarding
      'depart': 0.1,            // Elevator departing
      'default': 0.1
    }
    
    return baseDurations[actionName] || baseDurations.default
  }

  function calculateTemporalDuration(actionName, parameters) {
    const baseDurations = {
      'move': 3.0,
      'pick': 1.0,
      'drop': 1.0,
      'drive-truck': 5.0,
      'fly-airplane': 8.0,
      'load-truck': 2.0,
      'unload-truck': 2.0,
      'move-up': 3.0,
      'move-down': 3.0,
      'board': 1.5,
      'depart': 1.5,
      'default': 2.0
    }
    
    return baseDurations[actionName] || baseDurations.default
  }

  function calculateDynamicCost(actionName, pddlType, parameters) {
    if (pddlType === 'numerical') {
      // Higher costs for resource-intensive actions
      const costs = {
        'move': 5,
        'drive-truck': 8,
        'fly-airplane': 15,
        'startmove': 10,
        'pick': 2,
        'drop': 2,
        'startcharge': 1,
        'default': 3
      }
      return costs[actionName] || costs.default
    }
    
    // Standard cost for other types
    const costs = {
      'move': 2,
      'drive-truck': 3,
      'fly-airplane': 5,
      'startmove': 3,
      'pick': 1,
      'drop': 1,
      'startcharge': 0,
      'default': 1
    }
    return costs[actionName] || costs.default
  }

  // Universal entity extraction for all domains
  function extractUniversalActionEntities(action, actionName, parameters) {
    // Robot domain actions
    if (actionName === 'pick' && parameters.length >= 3) {
      action.actionType = 'pick'
      action.object = parameters[0]
      action.room = parameters[1]
      action.robot = parameters[2]
    } else if (actionName === 'drop' && parameters.length >= 3) {
      action.actionType = 'drop'
      action.object = parameters[0]
      action.room = parameters[1]
      action.robot = parameters[2]
    } else if (actionName === 'move' && parameters.length >= 3) {
      action.actionType = 'move'
      action.robot = parameters[0]
      action.fromRoom = parameters[1]
      action.toRoom = parameters[2]
    } else if (actionName === 'startmove' && parameters.length >= 3) {
      action.actionType = 'move'
      action.robot = parameters[0]
      action.fromRoom = parameters[1]
      action.toRoom = parameters[2]
      action.isProcess = true
    } else if (actionName === 'reprisemovement' && parameters.length >= 3) {
      action.actionType = 'move_complete'
      action.robot = parameters[0]
      action.fromRoom = parameters[1]
      action.toRoom = parameters[2]
      action.isEvent = true
    } else if (actionName === 'startcharge' && parameters.length >= 1) {
      action.actionType = 'charge'
      action.robot = parameters[0]
      action.isProcess = true
    } else if (actionName === 'stopcharge' && parameters.length >= 1) {
      action.actionType = 'charge_stop'
      action.robot = parameters[0]
      action.isEvent = true
    }
    
    // Logistics domain actions
    else if (actionName === 'drive-truck' && parameters.length >= 3) {
      action.actionType = 'move'
      action.robot = parameters[0] // Truck acts as robot
      action.vehicle = parameters[0]
      action.fromRoom = parameters[1]
      action.toRoom = parameters[2]
    } else if (actionName === 'fly-airplane' && parameters.length >= 3) {
      action.actionType = 'move'
      action.robot = parameters[0] // Airplane acts as robot
      action.vehicle = parameters[0]
      action.fromRoom = parameters[1]
      action.toRoom = parameters[2]
    } else if ((actionName === 'load-truck' || actionName === 'load-vehicle') && parameters.length >= 3) {
      action.actionType = 'pick'
      action.object = parameters[0]
      action.robot = parameters[1] // Vehicle acts as robot
      action.room = parameters[2]
    } else if ((actionName === 'unload-truck' || actionName === 'unload-vehicle') && parameters.length >= 3) {
      action.actionType = 'drop'
      action.object = parameters[0]
      action.robot = parameters[1] // Vehicle acts as robot
      action.room = parameters[2]
    }
    
    // Elevator domain actions
    else if (actionName === 'move-up' && parameters.length >= 1) {
      action.actionType = 'move'
      action.robot = parameters[0] // Elevator acts as robot
      action.direction = 'up'
    } else if (actionName === 'move-down' && parameters.length >= 1) {
      action.actionType = 'move'
      action.robot = parameters[0] // Elevator acts as robot
      action.direction = 'down'
    } else if (actionName === 'board' && parameters.length >= 2) {
      action.actionType = 'pick'
      action.object = parameters[0] // Passenger
      action.robot = parameters[1] // Elevator
    } else if (actionName === 'depart' && parameters.length >= 2) {
      action.actionType = 'drop'
      action.object = parameters[0] // Passenger
      action.robot = parameters[1] // Elevator
    }
    
    // Unknown action - try to guess entities
    else {
      action.actionType = 'unknown'
      
      // Try to identify robot/vehicle/elevator
      for (const param of parameters) {
        if (param.toLowerCase().includes('robot') || param === 'wally' || param === 'eve' ||
            param.toLowerCase().includes('truck') || param.toLowerCase().includes('plane') ||
            param.toLowerCase().includes('elevator') || param.toLowerCase().includes('agent')) {
          action.robot = param
          break
        }
      }
    }
  }

  // Analyze capabilities from all parsed actions
  function analyzeUniversalCapabilities(actions) {
    console.log('🔍 Analyzing universal capabilities from actions:', actions.length)
    
    const capabilities = {}
    const robots = new Set()
    
    // Extract all robots/vehicles/elevators
    actions.forEach(action => {
      if (action.robot) robots.add(action.robot)
    })
    
    // Analyze each robot's capabilities
    robots.forEach(robot => {
      capabilities[robot] = analyzeRobotCapabilities(robot, actions)
    })
    
    robotCapabilities.value = capabilities
    
    // Initialize dynamic state for each robot
    robots.forEach(robot => {
      const caps = capabilities[robot]
      
      // Energy system
      if (caps.hasEnergySystem) {
        robotEnergy.value[robot] = caps.maxEnergy
        robotMaxEnergy.value[robot] = caps.maxEnergy
        robotIsCharging.value[robot] = false
        energyConsumptionRates.value[robot] = caps.energyConsumptionRate
        chargingRates.value[robot] = caps.chargingRate
      }
      
      // Carrying capacity
      robotCarryingCapacity.value[robot] = 0
      robotMaxCapacity.value[robot] = caps.maxCarryingCapacity
      
      // Movement speeds
      robotMovementSpeeds.value[robot] = caps.movementSpeed
      
      // Fuel system (logistics)
      if (caps.hasFuelSystem) {
        fuelLevels.value[robot] = caps.maxFuel
      }
      
      // Passenger capacity (elevator)
      if (caps.hasPassengerCapacity) {
        passengerCapacity.value[robot] = caps.maxPassengerCapacity
      }
    })
    
    console.log('✅ Universal capabilities analyzed:', capabilities)
  }

  function analyzeRobotCapabilities(robot, actions) {
    const robotActions = actions.filter(a => a.robot === robot)
    
    const capabilities = {
      // Energy system analysis
      hasEnergySystem: robotActions.some(a => a.name === 'startcharge' || a.name === 'stopcharge'),
      maxEnergy: 100, // Default
      energyConsumptionRate: 1.0,
      chargingRate: 2.0,
      
      // Movement analysis
      movementSpeed: analyzeMovementSpeed(robotActions),
      canMoveParallel: robotActions.some(a => a.type === 'temporal' || a.type === 'pddl+'),
      
      // Carrying capacity analysis
      maxCarryingCapacity: analyzeCarryingCapacity(robotActions),
      
      // Fuel system (logistics)
      hasFuelSystem: robot.includes('truck') || robot.includes('plane'),
      maxFuel: robot.includes('plane') ? 1000 : 500,
      
      // Passenger capacity (elevator)
      hasPassengerCapacity: robot.includes('elevator'),
      maxPassengerCapacity: 8,
      
      // Action types supported
      supportedActions: [...new Set(robotActions.map(a => a.actionType))],
      
      // PDDL+ specific
      supportsProcesses: robotActions.some(a => a.isProcess),
      supportsEvents: robotActions.some(a => a.isEvent)
    }
    
    // Analyze energy system from charging patterns
    if (capabilities.hasEnergySystem) {
      const chargingActions = robotActions.filter(a => a.name === 'startcharge')
      const waitingActions = actions.filter(a => a.isWaiting)
      
      if (chargingActions.length > 0 && waitingActions.length > 0) {
        // Find waiting periods that correspond to charging
        const chargingDurations = []
        chargingActions.forEach(chargeAction => {
          const nextWaiting = waitingActions.find(w => w.start >= chargeAction.start && w.start <= chargeAction.start + 1)
          if (nextWaiting) {
            chargingDurations.push(nextWaiting.duration)
          }
        })
        
        if (chargingDurations.length > 0) {
          const avgChargingTime = chargingDurations.reduce((a, b) => a + b, 0) / chargingDurations.length
          capabilities.maxEnergy = Math.max(100, avgChargingTime * 2) // Estimate based on charging time
          capabilities.chargingRate = capabilities.maxEnergy / avgChargingTime
        }
      }
    }
    
    return capabilities
  }

  function analyzeMovementSpeed(robotActions) {
    const moveActions = robotActions.filter(a => a.actionType === 'move')
    if (moveActions.length === 0) return 1.0
    
    const durations = moveActions.map(a => a.duration).filter(d => d > 0)
    if (durations.length === 0) return 1.0
    
    // Return average movement duration
    return durations.reduce((a, b) => a + b, 0) / durations.length
  }

  function analyzeCarryingCapacity(robotActions) {
    // Look for simultaneous carrying actions
    const pickActions = robotActions.filter(a => a.actionType === 'pick')
    const dropActions = robotActions.filter(a => a.actionType === 'drop')
    
    let maxSimultaneous = 1
    let currentCarrying = []
    
    // Simulate the actions to find max simultaneous carrying
    const allActions = [...pickActions, ...dropActions].sort((a, b) => a.start - b.start)
    
    allActions.forEach(action => {
      if (action.actionType === 'pick') {
        currentCarrying.push(action.object)
      } else if (action.actionType === 'drop') {
        currentCarrying = currentCarrying.filter(obj => obj !== action.object)
      }
      maxSimultaneous = Math.max(maxSimultaneous, currentCarrying.length)
    })
    
    return maxSimultaneous
  }

  // Extract entities from parsed actions using enhanced parser
  const planRobots = computed(() => {
    if (!parsedActions.value?.length) return []
    
    const entities = extractEntitiesFromActions(parsedActions.value)
    return entities.robots.length > 0 ? entities.robots : []
  })

  const planObjects = computed(() => {
    if (!parsedActions.value?.length) return []
    
    const entities = extractEntitiesFromActions(parsedActions.value)
    return entities.objects
  })

  const planRooms = computed(() => {
    if (!parsedActions.value?.length) return []
    
    const entities = extractEntitiesFromActions(parsedActions.value)
    return entities.rooms.length > 0 ? entities.rooms : []
  })

  // Computed properties
  const progressPercentage = computed(() => {
    if (!parsedActions.value?.length) return 0
    if (props.pddlType === 'classical') {
      return (currentStep.value / parsedActions.value.length) * 100
    } else {
      const totalDuration = Math.max(...parsedActions.value.map(a => a.end))
      return totalDuration > 0 ? (currentTime.value / totalDuration) * 100 : 0
    }
  })

  const currentAction = computed(() => {
    if (!parsedActions.value?.length || currentStep.value >= parsedActions.value.length) return null
    return parsedActions.value[currentStep.value]
  })

  const totalDuration = computed(() => {
    if (!parsedActions.value?.length) return 0
    if (props.pddlType === 'classical') {
      return parsedActions.value.length
    } else {
      return Math.max(...parsedActions.value.map(a => a.end))
    }
  })

  // Enhanced action execution with dynamic capabilities
  function executeAction(action) {
    console.log(`⚡ Executing dynamic action:`, action)
    
    if (!action) return
    
    const robot = action.robot
    const capabilities = robotCapabilities.value[robot] || {}
    
    // Apply universal constraints
    if (!checkUniversalConstraints(action, capabilities)) {
      console.warn(`⚠️ Action blocked by constraints:`, action.name)
      return
    }
    
    // Handle waiting actions for PDDL+
    if (action.isWaiting) {
      console.log(`⏳ Waiting for ${action.duration}s`)
      return
    }
    
    switch (action.actionType) {
      case 'move':
        executeEnhancedMovement(action, capabilities)
        break
        
      case 'pick':
        executeEnhancedPickAction(action, capabilities)
        break
        
      case 'drop':
        executeEnhancedDropAction(action, capabilities)
        break
        
      case 'charge':
        executeEnhancedChargeAction(action, capabilities)
        break
        
      case 'charge_stop':
        executeEnhancedStopChargeAction(action, capabilities)
        break
        
      case 'move_complete':
        executeMovementComplete(action, capabilities)
        break
    }

    // Handle resource consumption
    consumeResources(action, capabilities)
  }

  function checkUniversalConstraints(action, capabilities) {
    const robot = action.robot
    
    // Energy constraints
    if (capabilities.hasEnergySystem) {
      const energyRequired = calculateEnergyRequired(action, capabilities)
      if (robotEnergy.value[robot] < energyRequired) {
        console.warn(`❌ Insufficient energy for ${robot}: ${robotEnergy.value[robot]} < ${energyRequired}`)
        return false
      }
    }
    
    // Carrying capacity constraints
    if (action.actionType === 'pick') {
      const currentCapacity = robotCarryingCapacity.value[robot] || 0
      const maxCapacity = capabilities.maxCarryingCapacity || 1
      if (currentCapacity >= maxCapacity) {
        console.warn(`❌ Carrying capacity exceeded for ${robot}: ${currentCapacity}/${maxCapacity}`)
        return false
      }
    }
    
    // Fuel constraints (logistics)
    if (capabilities.hasFuelSystem) {
      const fuelRequired = calculateFuelRequired(action, capabilities)
      if (fuelLevels.value[robot] < fuelRequired) {
        console.warn(`❌ Insufficient fuel for ${robot}`)
        return false
      }
    }
    
    return true
  }

  function calculateEnergyRequired(action, capabilities) {
    const baseConsumption = {
      'move': capabilities.energyConsumptionRate * 3,
      'pick': capabilities.energyConsumptionRate * 1,
      'drop': capabilities.energyConsumptionRate * 1,
      'default': capabilities.energyConsumptionRate || 1
    }
    
    return baseConsumption[action.actionType] || baseConsumption.default
  }

  function calculateFuelRequired(action, capabilities) {
    if (action.actionType === 'move') {
      return action.duration * 2 // Fuel per time unit
    }
    return 0
  }

  function consumeResources(action, capabilities) {
    const robot = action.robot
    
    // Consume energy
    if (capabilities.hasEnergySystem && !robotIsCharging.value[robot]) {
      const energyRequired = calculateEnergyRequired(action, capabilities)
      robotEnergy.value[robot] = Math.max(0, robotEnergy.value[robot] - energyRequired)
    }
    
    // Consume fuel
    if (capabilities.hasFuelSystem) {
      const fuelRequired = calculateFuelRequired(action, capabilities)
      fuelLevels.value[robot] = Math.max(0, fuelLevels.value[robot] - fuelRequired)
    }
    
    // Update costs
    totalCost.value += action.cost || 1
  }

  // Enhanced movement with dynamic capabilities
  function executeEnhancedMovement(action, capabilities) {
    if (!action.robot || !action.fromRoom || !action.toRoom) return
    
    const robot = action.robot
    const speed = capabilities.movementSpeed || robotMovementSpeeds.value[robot] || 3.0
    
    console.log(`🚶‍♂️ ${robot} enhanced movement: ${action.fromRoom} → ${action.toRoom} (speed: ${speed}s)`)
    
    // Verify robot location
    const currentLocation = robotLocations.value[robot]
    if (currentLocation !== action.fromRoom) {
      console.warn(`⚠️ Robot ${robot} location corrected: ${currentLocation} → ${action.fromRoom}`)
      robotLocations.value[robot] = action.fromRoom
    }
    
    // Set up movement with dynamic speed
    robotStartRooms.value[robot] = action.fromRoom
    robotTargetRooms.value[robot] = action.toRoom
    robotMovementProgress.value[robot] = 0
    robotMovementStartTime.value[robot] = Date.now()
    
    movingRobots.value.add(robot)
    activeRobots.value.add(robot)
    
    // Start animation if not already running
    if (!animationFrame) {
      startSmoothMovementAnimation()
    }
    
    createActionParticles()
  }

  // Enhanced pick action with capacity checking
  function executeEnhancedPickAction(action, capabilities) {
    if (!action.object || !action.robot || !action.room) return
    
    const robot = action.robot
    const maxCapacity = capabilities.maxCarryingCapacity || 1
    
    console.log(`🤏 ${robot} enhanced pick: ${action.object} from ${action.room} (capacity: ${robotCarryingCapacity.value[robot]}/${maxCapacity})`)
    
    // Verify locations
    if (robotLocations.value[robot] !== action.room) {
      robotLocations.value[robot] = action.room
    }
    if (objectLocations.value[action.object] !== action.room) {
      objectLocations.value[action.object] = action.room
    }
    
    activeRobots.value.add(robot)
    createActionParticles()
    
    // Execute pick with capacity management
    setTimeout(() => {
      if (!robotCarrying.value[robot]) {
        robotCarrying.value[robot] = []
      }
      
      // Check capacity before picking
      if (robotCarrying.value[robot].length < maxCapacity) {
        robotCarrying.value[robot].push(action.object)
        robotCarryingCapacity.value[robot] = robotCarrying.value[robot].length
        delete objectLocations.value[action.object]
        
        console.log(`✅ Pick complete: ${robot} now carrying ${action.object}`)
        console.log(`🎒 Robot ${robot} carrying:`, robotCarrying.value[robot])
      } else {
        console.warn(`❌ Cannot pick ${action.object}: ${robot} at capacity (${maxCapacity})`)
      }
      
      activeRobots.value.delete(robot)
    }, action.duration * 1000)
  }

  // Enhanced drop action with capacity management
  function executeEnhancedDropAction(action, capabilities) {
    if (!action.object || !action.room || !action.robot) return
    
    const robot = action.robot
    
    console.log(`📥 ${robot} enhanced drop: ${action.object} in ${action.room}`)
    
    // Verify robot location
    if (robotLocations.value[robot] !== action.room) {
      robotLocations.value[robot] = action.room
    }
    
    // Verify robot is carrying the object
    if (!robotCarrying.value[robot]?.includes(action.object)) {
      console.warn(`⚠️ Robot ${robot} should be carrying ${action.object}`)
      if (!robotCarrying.value[robot]) {
        robotCarrying.value[robot] = []
      }
      robotCarrying.value[robot].push(action.object)
    }
    
    activeRobots.value.add(robot)
    createActionParticles()
    
    // Execute drop with capacity management
    setTimeout(() => {
      if (robotCarrying.value[robot]) {
        robotCarrying.value[robot] = robotCarrying.value[robot].filter(obj => obj !== action.object)
        robotCarryingCapacity.value[robot] = robotCarrying.value[robot].length
      }
      objectLocations.value[action.object] = action.room
      
      console.log(`✅ Drop complete: ${action.object} now in ${action.room}`)
      console.log(`🎒 Robot ${robot} now carrying:`, robotCarrying.value[robot])
      activeRobots.value.delete(robot)
    }, action.duration * 1000)
  }

  // Enhanced charging actions with dynamic energy management
  function executeEnhancedChargeAction(action, capabilities) {
    const robot = action.robot
    const chargingRate = capabilities.chargingRate || 2.0
    
    console.log(`🔋 ${robot} starting enhanced charging (rate: ${chargingRate}/s)`)
    
    robotIsCharging.value[robot] = true
    activeRobots.value.add(robot)
    createActionParticles()
    
    // Start charging process
    const chargingInterval = setInterval(() => {
      if (robotIsCharging.value[robot]) {
        const currentEnergy = robotEnergy.value[robot] || 0
        const maxEnergy = robotMaxEnergy.value[robot] || 100
        
        robotEnergy.value[robot] = Math.min(maxEnergy, currentEnergy + chargingRate)
        
        // Stop charging when full
        if (robotEnergy.value[robot] >= maxEnergy) {
          clearInterval(chargingInterval)
          console.log(`🔋 ${robot} charging complete: ${robotEnergy.value[robot]}/${maxEnergy}`)
        }
      } else {
        clearInterval(chargingInterval)
      }
    }, 1000)
  }

  function executeEnhancedStopChargeAction(action, capabilities) {
    const robot = action.robot
    console.log(`🔋 ${robot} stopped enhanced charging`)
    
    robotIsCharging.value[robot] = false
    activeRobots.value.delete(robot)
  }

  function executeMovementComplete(action, capabilities) {
    const robot = action.robot
    console.log(`✅ ${robot} movement complete: arrived at ${action.toRoom}`)
    
    // Complete any pending movement
    if (movingRobots.value.has(robot)) {
      completeRobotMovement(robot)
    }
  }

  // Smooth movement animation
  let animationFrame = null
  
  function startSmoothMovementAnimation() {
    function animate() {
      const now = Date.now()
      
      // Update movement progress for all moving robots
      for (const robot of movingRobots.value) {
        const startTime = robotMovementStartTime.value[robot]
        const capabilities = robotCapabilities.value[robot] || {}
        const speed = capabilities.movementSpeed || 3.0
        
        if (startTime) {
          const elapsed = (now - startTime) / 1000 // Convert to seconds
          const progress = Math.min(1, elapsed / speed)
          
          // Apply easing for smoother movement
          const easedProgress = easeInOutCubic(progress)
          robotMovementProgress.value[robot] = easedProgress
          
          // Complete movement when progress reaches 100%
          if (progress >= 1) {
            completeRobotMovement(robot)
          }
        }
      }
      
      // Continue animation if there are moving robots or playing
      if (movingRobots.value.size > 0 || isPlaying.value) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
  }

  // Easing function for smooth movement
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  function completeRobotMovement(robot) {
    const targetRoom = robotTargetRooms.value[robot]
    if (targetRoom) {
      robotLocations.value[robot] = targetRoom
      console.log(`✅ ${robot} completed enhanced movement to ${targetRoom}`)
    }
    
    // Clean up movement state
    movingRobots.value.delete(robot)
    delete robotMovementProgress.value[robot]
    delete robotTargetRooms.value[robot]
    delete robotStartRooms.value[robot]
    delete robotMovementStartTime.value[robot]
    
    activeRobots.value.delete(robot)
  }

  // Playback control functions
  function togglePlayback() {
    isPlaying.value = !isPlaying.value
    console.log('▶️ Enhanced playback toggled:', isPlaying.value)
    
    if (isPlaying.value && !animationFrame) {
      startSmoothMovementAnimation()
    }
  }

  function stepForward() {
    if (currentStep.value < parsedActions.value.length) {
      const action = parsedActions.value[currentStep.value]
      
      console.log(`🎯 Executing enhanced step ${currentStep.value + 1}: ${action.name}`)
      
      executeAction(action)
      currentStep.value++
      
      console.log(`📊 Enhanced progress: ${currentStep.value}/${parsedActions.value.length}`)
      
      if (currentStep.value >= parsedActions.value.length) {
        showSuccess.value = true
        console.log('🎉 All enhanced actions completed!')
        setTimeout(() => {
          showSuccess.value = false
        }, 3000)
      }
    }
  }

  function resetSimulation() {
    console.log('🔄 Resetting enhanced simulation')
    isPlaying.value = false
    currentStep.value = 0
    currentTime.value = 0
    
    // Stop animation
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
    
    // Clear movement state
    activeRobots.value.clear()
    movingRobots.value.clear()
    robotMovementProgress.value = {}
    robotTargetRooms.value = {}
    robotStartRooms.value = {}
    robotMovementStartTime.value = {}
    
    particles.value = []
    activeActions.value = []
    completedActions.value.clear()
    totalCost.value = 0
    
    // Reset dynamic capabilities state
    resetDynamicState()
    
    initializeLocations()
  }

  function resetDynamicState() {
    // Reset energy for all robots
    Object.keys(robotCapabilities.value).forEach(robot => {
      const capabilities = robotCapabilities.value[robot]
      
      if (capabilities.hasEnergySystem) {
        robotEnergy.value[robot] = capabilities.maxEnergy
        robotIsCharging.value[robot] = false
      }
      
      if (capabilities.hasFuelSystem) {
        fuelLevels.value[robot] = capabilities.maxFuel
      }
      
      robotCarryingCapacity.value[robot] = 0
      robotCarrying.value[robot] = []
    })
  }

  // Auto-play functionality with enhanced timing
  let playInterval = null

  watch([isPlaying, playbackSpeed], ([playing, speed]) => {
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
    }

    if (playing && currentStep.value < parsedActions.value.length) {
      // Calculate interval based on current action duration and robot capabilities
      const getCurrentInterval = () => {
        const action = parsedActions.value[currentStep.value]
        if (action && action.robot) {
          const capabilities = robotCapabilities.value[action.robot] || {}
          const dynamicDuration = capabilities.movementSpeed || action.duration || 2.0
          return (dynamicDuration * 1000) / speed
        }
        return 2000 / speed // Default 2 seconds
      }
      
      const executeNextStep = () => {
        stepForward()
        
        if (currentStep.value < parsedActions.value.length && isPlaying.value) {
          setTimeout(executeNextStep, getCurrentInterval())
        } else {
          isPlaying.value = false
        }
      }
      
      // Start first step
      setTimeout(executeNextStep, getCurrentInterval())
    }
  })

  // Helper functions for template
  function getRobotsInRoom(room) {
    return planRobots.value.filter(robot => {
      // Don't show robots that are currently moving
      if (movingRobots.value.has(robot)) {
        return false
      }
      return robotLocations.value[robot] === room
    })
  }

  function getObjectsInRoom(room) {
    return planObjects.value.filter(obj => objectLocations.value[obj] === room)
  }

  function isObjectCarried(obj) {
    return Object.values(robotCarrying.value).some(carried => carried.includes(obj))
  }

  function getRobotCarrying(robot) {
    return robotCarrying.value[robot] || []
  }

  function isRobotMoving(robot) {
    return movingRobots.value.has(robot)
  }

  function getRobotMovementProgress(robot) {
    return robotMovementProgress.value[robot] || 0
  }

  function getObjectIcon(objectName) {
    const name = objectName.toLowerCase()
    
    if (name.includes('ball')) return '🏀'
    if (name.includes('box') || name.includes('crate')) return '📦'
    if (name.includes('package') || name.includes('pkg')) return '📮'
    if (name.includes('tool')) return '🔧'
    if (name.includes('food')) return '🍎'
    if (name.includes('book')) return '📚'
    
    return '📦' // Default
  }

  function createActionParticles() {
    for (let i = 0; i < 5; i++) {
      const particle = {
        id: Date.now() + i,
        style: {
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          width: Math.random() * 6 + 4 + 'px',
          height: Math.random() * 6 + 4 + 'px',
          animationDelay: Math.random() * 2 + 's',
          animationDuration: (Math.random() * 3 + 3) + 's'
        }
      }
      particles.value.push(particle)
      
      setTimeout(() => {
        particles.value = particles.value.filter(p => p.id !== particle.id)
      }, 6000)
    }
  }

  // Enhanced helper functions with dynamic capabilities
  const getCurrentActionForRobot = (robot) => {
    return parsedActions.value.find(action => 
      action.robot === robot && 
      action.step === currentStep.value
    ) || parsedActions.value.find(action => action.robot === robot && action.step === currentStep.value)
  }

  const getTotalMakespan = () => {
    if (!parsedActions.value?.length) return 0
    return Math.max(...parsedActions.value.map(action => action.end || action.start + action.duration))
  }

  const getElapsedTime = () => {
    if (!parsedActions.value?.length) return 0
    if (props.pddlType === 'classical') {
      return currentStep.value
    } else {
      return currentTime.value
    }
  }

  const getRobotEnergy = (robot) => {
    return robotEnergy.value[robot] || 100
  }

  const getRobotMaxEnergy = (robot) => {
    return robotMaxEnergy.value[robot] || 100
  }

  const getRobotFuel = (robot) => {
    return fuelLevels.value[robot] || 100
  }

  const getRobotCapacity = (robot) => {
    return robotCarryingCapacity.value[robot] || 0
  }

  const getRobotMaxCapacity = (robot) => {
    return robotMaxCapacity.value[robot] || 1
  }

  const isRobotCharging = (robot) => {
    return robotIsCharging.value[robot] || false
  }

  const getEfficiencyScore = () => {
    if (props.pddlType !== 'numerical' || !totalCost.value || !currentStep.value) return 100
    const avgCost = totalCost.value / Math.max(1, currentStep.value)
    return Math.max(0, Math.round(100 - (avgCost - 1) * 10))
  }

  const getRobotCapabilities = (robot) => {
    return robotCapabilities.value[robot] || {}
  }

  function initializeLocations() {
    console.log('🏁 Initializing enhanced locations with dynamic analysis...')

    if (planRooms.value.length === 0) {
      console.log('⚠️ No rooms found, using defaults')
      return
    }

    // Initialize robot locations based on their first action
    planRobots.value.forEach(robot => {
      let startRoom = planRooms.value[0] // Default fallback
      
      // Find the very first action for this robot
      const robotActions = parsedActions.value
        .filter(action => action.robot === robot)
        .sort((a, b) => a.start - b.start)
      
      if (robotActions.length > 0) {
        const firstAction = robotActions[0]
        
        if (firstAction.actionType === 'pick' && firstAction.room) {
          startRoom = firstAction.room
        } else if (firstAction.actionType === 'move' && firstAction.fromRoom) {
          startRoom = firstAction.fromRoom
        } else if (firstAction.room) {
          startRoom = firstAction.room
        }
      }
      
      robotLocations.value[robot] = startRoom
      robotCarrying.value[robot] = []
      
      console.log(`🤖 Robot ${robot} starts in ${startRoom}`)
    })

    // Initialize object locations based on their first pick actions
    planObjects.value.forEach((obj) => {
      const firstPickAction = parsedActions.value
        .filter(action => action.actionType === 'pick' && action.object === obj)
        .sort((a, b) => a.start - b.start)[0]
      
      if (firstPickAction && firstPickAction.room) {
        objectLocations.value[obj] = firstPickAction.room
        console.log(`📦 Object ${obj} starts in ${firstPickAction.room}`)
      } else {
        const defaultRoom = planRooms.value[0]
        objectLocations.value[obj] = defaultRoom
        console.log(`📦 Object ${obj} defaults to ${defaultRoom}`)
      }
    })

    console.log('🏁 Enhanced initial state:')
    console.log('🤖 Robot locations:', JSON.stringify(robotLocations.value))
    console.log('📦 Object locations:', JSON.stringify(objectLocations.value))
    console.log('⚙️ Robot capabilities:', Object.keys(robotCapabilities.value))
  }

  // Watch for props changes
  watch(() => props.actions, (newActions) => {
    console.log('👀 Enhanced actions prop changed:', typeof newActions, newActions)
    resetSimulation()
  }, { immediate: true })

  // Initialize when component mounts
  onMounted(() => {
    console.log('🏗️ Enhanced robot simulator mounted')
    initializeLocations()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (playInterval) {
      clearInterval(playInterval)
    }
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
  })

  return {
    // State
    isPlaying,
    currentStep,
    playbackSpeed,
    showSuccess,
    particles,
    totalCost,
    activeActions,
    movingRobots,
    currentTime,
    
    // Dynamic capabilities state
    robotCapabilities,
    robotEnergy,
    robotMaxEnergy,
    robotCarryingCapacity,
    robotMaxCapacity,
    robotIsCharging,
    robotMovementSpeeds,
    fuelLevels,
    
    // Movement state
    robotMovementProgress,
    robotTargetRooms,
    robotStartRooms,
    
    // Computed
    progressPercentage,
    currentAction,
    planRobots,
    planObjects,
    planRooms,
    totalDuration,
    
    // Methods
    togglePlayback,
    resetSimulation,
    stepForward,
    getRobotsInRoom,
    getObjectsInRoom,
    isObjectCarried,
    getRobotCarrying,
    isRobotMoving,
    getRobotMovementProgress,
    getObjectIcon,
    
    // Enhanced helper functions
    getCurrentActionForRobot,
    getTotalMakespan,
    getElapsedTime,
    getRobotEnergy,
    getRobotMaxEnergy,
    getRobotFuel,
    getRobotCapacity,
    getRobotMaxCapacity,
    isRobotCharging,
    getEfficiencyScore,
    getRobotCapabilities,
    
    // Additional state needed by template
    robotLocations,
    objectLocations,
    robotCarrying,
    activeRobots,
    
    // For debugging
    parsedActions
  }
}