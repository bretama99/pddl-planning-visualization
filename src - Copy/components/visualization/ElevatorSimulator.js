/* eslint-disable no-unused-vars */
// Dynamic Elevator Simulator - Works with ANY Plan (Based on Working Robot Pattern)
// File Path: src/components/visualization/elevatorSimulator.js

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export function createElevatorSimulator(props) {
  console.log('🛗 Creating elevator simulator with props:', {
    actionsType: typeof props.actions,
    actionsLength: typeof props.actions === 'string' ? props.actions.length : props.actions?.length,
    pddlType: props.pddlType || props.entities?.pddlType,
    entities: props.entities
  })
  
  // State variables (EXACT same as working robot)
  const isPlaying = ref(false)
  const currentStep = ref(0)
  const playbackSpeed = ref(1)
  const elevatorLocations = ref({}) // Like robotLocations
  const passengerCarrying = ref({}) // Like robotCarrying  
  const passengerLocations = ref({}) // Like objectLocations
  const activeElevators = ref(new Set()) // Like activeRobots
  const showSuccess = ref(false)
  const particles = ref([])
  
  // Elevator movement state (EXACT same as robot movement)
  const movingElevators = ref(new Set())
  const elevatorMovementProgress = ref({})
  const elevatorTargetFloors = ref({})
  const elevatorStartFloors = ref({})
  const elevatorMovementStartTime = ref({})
  
  // DYNAMIC learning state - learns from the plan
  const actionDurationStats = ref(new Map()) // Learns action durations
  const actionCostStats = ref(new Map()) // Learns action costs
  const entityRelationships = ref(new Map()) // Learns entity relationships
  const actionPatterns = ref(new Map()) // Learns action patterns
  
  // PDDL-specific state
  const currentEnergy = ref(100)
  const maxEnergy = ref(100)
  const currentFuel = ref(100)
  const maxFuel = ref(100)
  const totalCost = ref(0)
  const efficiency = ref(100)
  const isCharging = ref(false)
  const completedDeliveries = ref(new Set())
  const deliveryTargets = ref(new Map())
  const passengerList = ref([])
  
  // Action progress tracking (EXACT same as robot)
  const actionStartTime = ref(0)
  const actionProgress = ref(0)

  // Parse raw content into actions (EXACT same logic as robot - DYNAMIC)
  const parsedActions = computed(() => {
    console.log('🔍 ELEVATOR PARSING - Raw actions from props:', typeof props.actions)
    console.log('📄 Content preview:', typeof props.actions === 'string' ? props.actions.substring(0, 200) + '...' : props.actions)
    
    if (!props.actions) {
      console.log('❌ No actions provided')
      return []
    }
    
    // Handle raw string content (this is what we get from main visualizer)
    if (typeof props.actions === 'string') {
      console.log('📝 PARSING raw string content for elevator')
      const actions = parseDynamicPlanContent(props.actions, props.pddlType || props.entities?.pddlType || 'classical')
      console.log('✅ PARSED ACTIONS:', actions.length, 'actions found')
      if (actions.length > 0) {
        console.log('🎯 First few actions:', actions.slice(0, 3).map(a => ({
          name: a.name,
          actionType: a.actionType,
          elevator: a.elevator,
          passenger: a.passenger,
          direction: a.direction
        })))
      }
      return actions
    }
    
    // Handle pre-parsed array
    if (Array.isArray(props.actions)) {
      console.log('✅ Actions already parsed as array:', props.actions.length)
      return props.actions
    }
    
    console.log('⚠️ Unknown actions format, returning empty array')
    return []
  })

  // DYNAMIC parser - works with ANY plan format
  function parseDynamicPlanContent(content, pddlType = 'classical') {
    console.log('🛗 PARSING ELEVATOR PLAN - Type:', pddlType)
    console.log('📄 Content length:', content.length)
    console.log('📄 Content preview:', content.substring(0, 300))
    
    if (!content || content.trim().length === 0) {
      console.log('❌ Empty content')
      return []
    }

    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => {
        // More specific filtering for elevator plans
        const isValidLine = line.length > 0 && 
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
               line.includes(':') && // Must have a colon
               (line.includes('move') || line.includes('load') || line.includes('unload') || line.includes('reached') || line.includes('up') || line.includes('down'))
        
        if (isValidLine) {
          console.log('✅ Valid line found:', line)
        }
        return isValidLine
      })

    console.log('📋 Filtered lines for parsing:', lines.length)
    lines.forEach((line, i) => console.log(`  ${i + 1}: ${line}`))

    // FIRST PASS: Learn patterns from the plan
    learnFromPlan(lines, pddlType)

    const actions = []
    
    // SECOND PASS: Parse with learned knowledge
    lines.forEach((line, index) => {
      const action = parseDynamicActionLine(line, index, pddlType)
      if (action) {
        actions.push(action)
        console.log(`✅ Successfully parsed action ${index + 1}:`, {
          name: action.name,
          actionType: action.actionType,
          elevator: action.elevator,
          passenger: action.passenger,
          direction: action.direction
        })
      } else {
        console.log(`❌ Failed to parse line ${index + 1}: "${line}"`)
      }
    })

    console.log('🎉 PARSING COMPLETE:', actions.length, 'elevator actions found')
    return actions
  }

  // LEARN from the plan before parsing
  function learnFromPlan(lines, pddlType) {
    console.log('🧠 Learning patterns from plan:', lines.length, 'lines')
    
    const actionFrequency = new Map()
    const durationPatterns = new Map()
    const costPatterns = new Map()
    
    lines.forEach((line, index) => {
      // Extract action names and count frequency
      const actionMatch = line.match(/:\s*(?:\()?(\w+[-\w]*)/)
      if (actionMatch) {
        const actionName = actionMatch[1].toLowerCase()
        actionFrequency.set(actionName, (actionFrequency.get(actionName) || 0) + 1)
        console.log(`📝 Found action: ${actionName} (line ${index + 1})`)
      }
      
      // Extract duration patterns for temporal PDDL
      const durationMatch = line.match(/\[(\d+(?:\.\d+)?)\]/)
      if (durationMatch && actionMatch) {
        const actionName = actionMatch[1].toLowerCase()
        const duration = parseFloat(durationMatch[1])
        if (!durationPatterns.has(actionName)) {
          durationPatterns.set(actionName, [])
        }
        durationPatterns.get(actionName).push(duration)
      }
      
      // Extract cost patterns for numerical PDDL
      const costMatch = line.match(/cost[:\s]*(\d+(?:\.\d+)?)/i)
      if (costMatch && actionMatch) {
        const actionName = actionMatch[1].toLowerCase()
        const cost = parseFloat(costMatch[1])
        if (!costPatterns.has(actionName)) {
          costPatterns.set(actionName, [])
        }
        costPatterns.get(actionName).push(cost)
      }
    })
    
    // Calculate average durations for each action type
    durationPatterns.forEach((durations, actionName) => {
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
      actionDurationStats.value.set(actionName, avgDuration)
      console.log(`⏱️ Learned duration for ${actionName}: ${avgDuration}s`)
    })
    
    // Calculate average costs for each action type
    costPatterns.forEach((costs, actionName) => {
      const avgCost = costs.reduce((sum, c) => sum + c, 0) / costs.length
      actionCostStats.value.set(actionName, avgCost)
      console.log(`💰 Learned cost for ${actionName}: ${avgCost}`)
    })
    
    // Learn action patterns based on frequency
    actionFrequency.forEach((frequency, actionName) => {
      actionPatterns.value.set(actionName, {
        frequency,
        commonality: frequency / lines.length,
        estimatedComplexity: Math.min(frequency / 5, 3) // More frequent = less complex
      })
    })
    
    console.log('🧠 Learning complete:', {
      actionTypes: actionFrequency.size,
      learnedDurations: actionDurationStats.value.size,
      learnedCosts: actionCostStats.value.size,
      totalLines: lines.length
    })
    
    console.log('📊 Found action types:', Array.from(actionFrequency.keys()))
  }

  // DYNAMIC action parsing - detects action type automatically
  function parseDynamicActionLine(line, index, pddlType) {
    let match
    let timeOrStep = 0
    let actionContent = ''
    let duration = 2.0 // Dynamic default
    
    console.log(`🔧 DYNAMIC parsing line:`, line)
    
    // Handle PDDL+ waiting actions
    if (line.includes('waiting')) {
      match = line.match(/(\d+(?:\.\d+)?):\s*.*waiting.*\[?(\d+(?:\.\d+)?)\]?/)
      if (match) {
        return {
          id: `wait-${index}`,
          name: 'waiting',
          actionType: 'wait',
          start: parseFloat(match[1]),
          duration: parseFloat(match[2] || 1),
          isWaiting: true,
          type: pddlType,
          cost: 0,
          raw: line,
          parameters: []
        }
      }
    }
    
    // Parse ANY time-based format: "X.X: (...)" or "X: (...)" or "Step X: ..."
    match = line.match(/^(?:Step\s+)?(\d+(?:\.\d+)?)\s*:\s*(?:\()?([^)]*)\)?(?:\s*\[([^\]]+)\])?/)
    if (match) {
      timeOrStep = parseFloat(match[1])
      actionContent = match[2].trim()
      const durationMatch = match[3]
      if (durationMatch) {
        const durationNum = parseFloat(durationMatch.replace(/[^\d.]/g, ''))
        if (!isNaN(durationNum)) duration = durationNum
      }
    }
    
    if (!actionContent) {
      console.log('❌ Could not parse line:', line)
      return null
    }
    
    // Clean and split action content
    const cleanContent = actionContent.replace(/^\(|\)$/g, '').trim()
    const parts = cleanContent.split(/\s+/).filter(p => p.length > 0)
    if (parts.length === 0) return null
    
    const actionName = parts[0].toLowerCase()
    const parameters = parts.slice(1)
    
    // DYNAMIC duration calculation based on action name
    if (pddlType !== 'temporal') {
      duration = calculateDynamicDuration(actionName, parameters)
    }
    
    const action = {
      id: `action-${index}`,
      name: actionName,
      parameters: parameters,
      step: Math.floor(timeOrStep),
      start: timeOrStep,
      end: timeOrStep + duration,
      duration: duration,
      type: pddlType,
      cost: calculateDynamicCost(actionName, parameters),
      raw: line
    }
    
    // DYNAMIC entity extraction - detects elevator operations automatically
    extractDynamicEntities(action, actionName, parameters)
    
    console.log(`✅ DYNAMIC action created:`, {
      name: action.name,
      type: action.actionType,
      elevator: action.elevator,
      passenger: action.passenger,
      direction: action.direction,
      duration: action.duration
    })
    return action
  }

  // TRULY DYNAMIC duration calculation - learns from the plan itself
  function calculateDynamicDuration(actionName, parameters) {
    // If we have temporal data with explicit durations, use frequency analysis
    if (actionDurationStats.value.has(actionName)) {
      return actionDurationStats.value.get(actionName)
    }
    
    // Analyze action complexity dynamically
    const complexity = analyzeActionComplexity(actionName, parameters)
    
    // Base duration on complexity (1-5 scale)
    return Math.max(0.5, complexity * 0.8 + Math.random() * 0.4)
  }

  // Dynamic complexity analysis based on action structure
  // eslint-disable-next-line no-unused-vars
  function analyzeActionComplexity(actionName, parameters) {
    let complexity = 1.0 // Base complexity
    
    // Longer action names suggest more complex operations
    complexity += Math.min(actionName.length / 10, 2.0)
    
    // More parameters suggest more complex operations  
    complexity += Math.min(parameters.length * 0.3, 1.5)
    
    // Actions with multiple entities are more complex
    const entityCount = countEntitiesInParameters(parameters)
    complexity += entityCount * 0.5
    
    // Sequential numbering suggests workflow complexity
    if (hasSequentialPattern(actionName, parameters)) {
      complexity += 0.5
    }
    
    return Math.min(complexity, 5.0) // Cap at 5 seconds
  }

  // Count different types of entities in parameters
  function countEntitiesInParameters(parameters) {
    const entityTypes = new Set()
    
    parameters.forEach(param => {
      if (findElevatorInParams([param])) entityTypes.add('elevator')
      if (findPassengerInParams([param])) entityTypes.add('passenger')
      if (param.toLowerCase().includes('floor') || param.match(/^\d+$/)) entityTypes.add('floor')
    })
    
    return entityTypes.size
  }

  // Detect sequential patterns in actions
  function hasSequentialPattern(actionName, parameters) {
    return parameters.some(param => /\d+$/.test(param)) || /\d+/.test(actionName)
  }

  // TRULY DYNAMIC cost calculation - learns from plan
  function calculateDynamicCost(actionName, parameters) {
    // Use learned costs if available
    if (actionCostStats.value.has(actionName)) {
      return actionCostStats.value.get(actionName)
    }
    
    // Calculate cost based on action complexity and frequency
    const pattern = actionPatterns.value.get(actionName)
    if (pattern) {
      // Less frequent actions are typically more expensive
      return Math.max(1, Math.round(3 - pattern.commonality * 2))
    }
    
    // Fallback: calculate based on parameter complexity
    const paramComplexity = parameters.length + countEntitiesInParameters(parameters)
    return Math.max(1, Math.min(paramComplexity, 5))
  }

  // TRULY DYNAMIC entity extraction - learns relationships
  function extractDynamicEntities(action, actionName, parameters) {
    console.log(`🎯 DYNAMIC entity extraction for: ${actionName} [${parameters.join(', ')}]`)
    
    // Initialize
    action.actionType = 'unknown'
    action.elevator = null
    action.passenger = null
    action.direction = null
    
    // FIXED: Direct action name matching for elevator operations
    if (actionName === 'move-up' || actionName === 'up') {
      action.actionType = 'move'
      action.direction = 'up'
      action.elevator = parameters[0] || 'elevatorx'
    } 
    else if (actionName === 'move-down' || actionName === 'down') {
      action.actionType = 'move'
      action.direction = 'down'
      action.elevator = parameters[0] || 'elevatorx'
    }
    else if (actionName === 'load') {
      action.actionType = 'load'
      action.passenger = parameters[0] // persond
      action.elevator = parameters[1] || 'elevatorx' // elevatorx
    }
    else if (actionName === 'unload') {
      action.actionType = 'unload'
      action.passenger = parameters[0] // persond
      action.elevator = parameters[1] || 'elevatorx' // elevatorx
    }
    else if (actionName === 'reached') {
      action.actionType = 'reached'
      action.passenger = parameters[0] // persond
    }
    else {
      // Fallback: Learn from parameter patterns and positions
      const entityTypes = analyzeParameterTypes(parameters)
      
      // Use learned relationships to classify action type
      action.actionType = classifyActionType(actionName, entityTypes)
      
      // Extract entities based on learned patterns
      action.elevator = entityTypes.elevators[0] || 'elevatorx'
      action.passenger = entityTypes.passengers[0] || null
      
      // Learn direction from action name or parameters
      action.direction = extractDirection(actionName, parameters)
    }
    
    // Store learned relationship for future use
    storeEntityRelationship(actionName, {
      elevators: action.elevator ? [action.elevator] : [],
      passengers: action.passenger ? [action.passenger] : [],
      floors: []
    }, action.actionType)
    
    console.log(`🎯 DYNAMIC extraction result:`, {
      actionType: action.actionType,
      elevator: action.elevator,
      passenger: action.passenger,
      direction: action.direction
    })
  }

  // Analyze parameter types dynamically
  function analyzeParameterTypes(parameters) {
    const types = {
      elevators: [],
      passengers: [],
      floors: [],
      unknown: []
    }
    
    parameters.forEach(param => {
      if (findElevatorInParams([param])) {
        types.elevators.push(param)
      } else if (findPassengerInParams([param])) {
        types.passengers.push(param)
      } else if (param.toLowerCase().includes('floor') || param.match(/^f?\d+$/)) {
        types.floors.push(param)
      } else {
        types.unknown.push(param)
      }
    })
    
    return types
  }

  // Classify action type based on learned patterns
  function classifyActionType(actionName, entityTypes) {
    // Check learned patterns first
    const storedRelationship = entityRelationships.value.get(actionName)
    if (storedRelationship) {
      return storedRelationship.actionType
    }
    
    // Infer from entity combination
    if (entityTypes.elevators.length > 0) {
      if (entityTypes.passengers.length > 0) {
        // Has both elevator and passenger - likely load/unload
        return Math.random() > 0.5 ? 'load' : 'unload'
      } else {
        // Only elevator - likely movement
        return 'move'
      }
    }
    
    // Fallback classification
    if (entityTypes.passengers.length > 0) {
      return 'reached'
    }
    
    return 'unknown'
  }

  // Extract direction dynamically
  function extractDirection(actionName, parameters) {
    // Check action name for direction hints
    if (actionName.includes('up')) return 'up'
    if (actionName.includes('down')) return 'down'
    
    // Check parameters for direction hints
    const paramStr = parameters.join(' ').toLowerCase()
    if (paramStr.includes('up') || paramStr.includes('ascend') || paramStr.includes('higher')) return 'up'
    if (paramStr.includes('down') || paramStr.includes('descend') || paramStr.includes('lower')) return 'down'
    
    return null
  }

  // Store learned relationships for future use
  function storeEntityRelationship(actionName, entityTypes, actionType) {
    entityRelationships.value.set(actionName, {
      actionType,
      elevatorCount: entityTypes.elevators.length,
      passengerCount: entityTypes.passengers.length,
      floorCount: entityTypes.floors.length
    })
  }

  // Helper functions for DYNAMIC entity detection
  function findElevatorInParams(parameters) {
    return parameters.find(param => 
      param.toLowerCase().includes('elevator') || 
      param.toLowerCase().includes('lift') || 
      param.toLowerCase().includes('fast') || 
      param.toLowerCase().includes('slow') ||
      param.match(/^elevator\w*$/i) ||
      param.match(/^lift\w*$/i)
    )
  }

  function findPassengerInParams(parameters) {
    return parameters.find(param => 
      param.toLowerCase().includes('person') || 
      param.toLowerCase().includes('passenger') || 
      param.toLowerCase().includes('user') ||
      param.match(/^person\w*$/i) ||
      param.match(/^p\d+$/i) ||
      param.match(/^passenger\w*$/i)
    )
  }

  // Extract entities from parsed actions using DYNAMIC detection
  const planElevators = computed(() => {
    if (!parsedActions.value?.length) return ['elevatorx']
    
    const elevators = new Set()
    parsedActions.value.forEach(action => {
      if (action.elevator) elevators.add(action.elevator)
      // Also check parameters for elevator-like names
      action.parameters?.forEach(param => {
        if (param && (param.includes('elevator') || param === 'elevatorx')) {
          elevators.add(param)
        }
      })
    })
    const result = elevators.size > 0 ? Array.from(elevators) : ['elevatorx']
    console.log('🛗 Found elevators:', result)
    return result
  })

  const planPassengers = computed(() => {
    if (!parsedActions.value?.length) return []
    
    const passengers = new Set()
    parsedActions.value.forEach(action => {
      if (action.passenger) passengers.add(action.passenger)
      // Also check parameters for passenger-like names
      action.parameters?.forEach(param => {
        if (param && (param.includes('person') || param.match(/^person[a-z]$/))) {
          passengers.add(param)
        }
      })
    })
    const result = Array.from(passengers)
    console.log('👤 Found passengers:', result)
    return result
  })

  const planFloors = computed(() => {
    // FIXED: Generate floors based on movement actions
    const moveActions = parsedActions.value?.filter(a => a.actionType === 'move') || []
    console.log('🏢 Move actions found:', moveActions.length)
    
    if (moveActions.length === 0) {
      return ['Floor1', 'Floor2', 'Floor3']
    }
    
    // Count total movements to estimate floors needed
    let upMoves = 0
    let downMoves = 0
    
    moveActions.forEach(action => {
      if (action.direction === 'up') upMoves++
      if (action.direction === 'down') downMoves++
    })
    
    // Estimate floor count (start from middle, count max deviation)
    const maxDeviation = Math.max(upMoves, downMoves)
    const floorCount = Math.max(3, maxDeviation + 2)
    
    const floors = []
    for (let i = 1; i <= floorCount; i++) {
      floors.push(`Floor${i}`)
    }
    
    console.log(`🏢 Generated ${floors.length} floors for ${moveActions.length} movements:`, floors)
    return floors
  })

  // Computed properties (EXACT same as robot)
  const progressPercentage = computed(() => {
    if (!parsedActions.value?.length) return 0
    return (currentStep.value / parsedActions.value.length) * 100
  })

  const currentAction = computed(() => {
    if (!parsedActions.value?.length || currentStep.value >= parsedActions.value.length) return null
    return parsedActions.value[currentStep.value]
  })

  const totalDuration = computed(() => {
    if (!parsedActions.value?.length) return 0
    return parsedActions.value.reduce((total, action) => total + (action.duration || 1), 0)
  })

  // Smooth movement animation (EXACT same as robot)
  let animationFrame = null
  
  function startSmoothMovementAnimation() {
    function animate() {
      const now = Date.now()
      
      // Update movement progress for all moving elevators
      for (const elevator of movingElevators.value) {
        const startTime = elevatorMovementStartTime.value[elevator]
        const action = getCurrentMovementAction(elevator)
        
        if (startTime && action) {
          const elapsed = (now - startTime) / 1000
          const duration = action.duration
          const progress = Math.min(1, elapsed / duration)
          
          elevatorMovementProgress.value[elevator] = progress
          
          // Complete movement when progress reaches 100%
          if (progress >= 1) {
            completeElevatorMovement(elevator)
          }
        }
      }
      
      // Update action progress
      if (currentAction.value && actionStartTime.value) {
        const elapsed = (now - actionStartTime.value) / 1000
        actionProgress.value = Math.min(100, (elapsed / currentAction.value.duration) * 100)
      }
      
      // Continue animation if there are moving elevators or playing
      if (movingElevators.value.size > 0 || isPlaying.value) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
  }

  function getCurrentMovementAction(elevator) {
    return parsedActions.value.find(actionItem => 
      actionItem.elevator === elevator && actionItem.actionType === 'move'
    )
  }

  function completeElevatorMovement(elevator) {
    const targetFloor = elevatorTargetFloors.value[elevator]
    if (targetFloor) {
      elevatorLocations.value[elevator] = targetFloor
      console.log(`✅ ${elevator} completed movement to ${targetFloor}`)
    }
    
    // Clean up movement state
    movingElevators.value.delete(elevator)
    delete elevatorMovementProgress.value[elevator]
    delete elevatorTargetFloors.value[elevator]
    delete elevatorStartFloors.value[elevator]
    delete elevatorMovementStartTime.value[elevator]
    
    activeElevators.value.delete(elevator)
  }

  // DYNAMIC action execution - works with any action type
  function executeAction(action) {
    console.log(`⚡ EXECUTING ACTION:`, {
      name: action.name,
      actionType: action.actionType,
      elevator: action.elevator,
      passenger: action.passenger,
      direction: action.direction
    })
    
    if (!action) {
      console.log('❌ No action to execute')
      return
    }
    
    // Handle different action types dynamically
    switch (action.actionType) {
      case 'move':
        console.log('🛗 Executing MOVEMENT action')
        executeDynamicMovement(action)
        break
        
      case 'load':
        console.log('👤 Executing LOAD action')
        executeDynamicLoad(action)
        break
        
      case 'unload':
        console.log('👤 Executing UNLOAD action')
        executeDynamicUnload(action)
        break
        
      case 'reached':
      case 'delivery':
        console.log('🎯 Executing REACHED action')
        executeDynamicReached(action)
        break
        
      case 'wait':
        console.log('⏳ Executing WAIT action')
        executeDynamicWait(action)
        break
        
      default:
        console.log(`🤷 Unknown action type: ${action.actionType}, executing as generic`)
        executeGenericAction(action)
    }

    // Update costs for numerical PDDL
    if (action.type === 'numerical') {
      totalCost.value += action.cost || 1
    }
    
    console.log(`✅ Action execution completed for: ${action.name}`)
  }

  // DYNAMIC movement execution
  function executeDynamicMovement(action) {
    console.log(`🛗 MOVEMENT START: ${action.elevator} direction: ${action.direction}`)
    
    if (!action.elevator || !action.direction) {
      console.log('❌ Missing elevator or direction for movement:', action)
      return
    }
    
    const elevator = action.elevator
    const currentFloor = elevatorLocations.value[elevator]
    const currentIndex = planFloors.value.indexOf(currentFloor)
    
    console.log(`🛗 MOVEMENT: ${elevator} at ${currentFloor} (index ${currentIndex}) moving ${action.direction}`)
    console.log(`🏢 Available floors:`, planFloors.value)
    
    if (currentIndex === -1) {
      console.log(`❌ Current floor ${currentFloor} not found in floors:`, planFloors.value)
      return
    }
    
    let targetIndex = currentIndex
    if (action.direction === 'up') {
      targetIndex = Math.min(currentIndex + 1, planFloors.value.length - 1)
    } else if (action.direction === 'down') {
      targetIndex = Math.max(currentIndex - 1, 0)
    }
    
    const targetFloor = planFloors.value[targetIndex]
    
    console.log(`🛗 MOVEMENT: ${elevator} moving ${action.direction} from ${currentFloor} (${currentIndex}) to ${targetFloor} (${targetIndex})`)
    
    // IMMEDIATE UPDATE - Update location right away for testing
    elevatorLocations.value[elevator] = targetFloor
    console.log(`✅ IMMEDIATE: ${elevator} moved to ${targetFloor}`)
    
    // Also set up animation
    elevatorStartFloors.value[elevator] = currentFloor
    elevatorTargetFloors.value[elevator] = targetFloor
    elevatorMovementProgress.value[elevator] = 0
    elevatorMovementStartTime.value[elevator] = Date.now()
    
    // Add to moving elevators
    movingElevators.value.add(elevator)
    activeElevators.value.add(elevator)
    
    // Start animation if not already running
    if (!animationFrame) {
      console.log('🎬 Starting movement animation')
      startSmoothMovementAnimation()
    }
    
    createActionParticles()
    
    console.log(`🚀 Movement setup complete for ${elevator}`)
    console.log(`📍 Current elevator locations:`, JSON.stringify(elevatorLocations.value))
  }

  // DYNAMIC load execution
  function executeDynamicLoad(action) {
    console.log(`👤 LOAD START: ${action.passenger} boarding ${action.elevator}`)
    
    if (!action.passenger || !action.elevator) {
      console.log('❌ Missing passenger or elevator for load:', action)
      return
    }
    
    const passenger = action.passenger
    const elevator = action.elevator
    const currentFloor = elevatorLocations.value[elevator]
    
    console.log(`👤 LOAD: ${passenger} boarding ${elevator} at ${currentFloor}`)
    console.log(`📍 Before load - Passenger locations:`, JSON.stringify(passengerLocations.value))
    console.log(`🎒 Before load - Elevator carrying:`, JSON.stringify(passengerCarrying.value))
    
    activeElevators.value.add(elevator)
    createActionParticles()
    
    // IMMEDIATE UPDATE - Execute load action right away for testing
    if (!passengerCarrying.value[elevator]) {
      passengerCarrying.value[elevator] = []
    }
    passengerCarrying.value[elevator].push(passenger)
    delete passengerLocations.value[passenger]
    
    console.log(`✅ IMMEDIATE LOAD: ${passenger} boarded ${elevator}`)
    console.log(`📍 After load - Passenger locations:`, JSON.stringify(passengerLocations.value))
    console.log(`🎒 After load - Elevator carrying:`, JSON.stringify(passengerCarrying.value))
    
    activeElevators.value.delete(elevator)
  }

  // DYNAMIC unload execution
  function executeDynamicUnload(action) {
    console.log(`👤 UNLOAD START: ${action.passenger} exiting ${action.elevator}`)
    
    if (!action.passenger || !action.elevator) {
      console.log('❌ Missing passenger or elevator for unload:', action)
      return
    }
    
    const passenger = action.passenger
    const elevator = action.elevator
    const currentFloor = elevatorLocations.value[elevator]
    
    console.log(`👤 UNLOAD: ${passenger} exiting ${elevator} at ${currentFloor}`)
    console.log(`📍 Before unload - Passenger locations:`, JSON.stringify(passengerLocations.value))
    console.log(`🎒 Before unload - Elevator carrying:`, JSON.stringify(passengerCarrying.value))
    
    activeElevators.value.add(elevator)
    createActionParticles()
    
    // IMMEDIATE UPDATE - Execute unload action right away for testing
    if (passengerCarrying.value[elevator]) {
      passengerCarrying.value[elevator] = passengerCarrying.value[elevator].filter(p => p !== passenger)
    }
    passengerLocations.value[passenger] = currentFloor
    completedDeliveries.value.add(passenger)
    
    console.log(`✅ IMMEDIATE UNLOAD: ${passenger} exited at ${currentFloor}`)
    console.log(`📍 After unload - Passenger locations:`, JSON.stringify(passengerLocations.value))
    console.log(`🎒 After unload - Elevator carrying:`, JSON.stringify(passengerCarrying.value))
    
    activeElevators.value.delete(elevator)
  }

  // DYNAMIC reached execution
  function executeDynamicReached(action) {
    const passenger = action.passenger
    if (passenger) {
      completedDeliveries.value.add(passenger)
      console.log(`🎯 DYNAMIC reached: ${passenger} reached destination!`)
    }
    
    createActionParticles()
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  }

  // DYNAMIC wait execution
  function executeDynamicWait(action) {
    console.log(`⏳ DYNAMIC waiting for ${action.duration}s`)
    createActionParticles()
  }

  // Generic action execution for unknown types
  function executeGenericAction(action) {
    console.log(`🎬 DYNAMIC generic action: ${action.name}`)
    createActionParticles()
    
    // Try to make something happen based on parameters
    if (action.elevator) {
      activeElevators.value.add(action.elevator)
      setTimeout(() => {
        activeElevators.value.delete(action.elevator)
      }, action.duration * 1000)
    }
  }

  // Playback control functions (EXACT same as robot)
  function togglePlayback() {
    isPlaying.value = !isPlaying.value
    console.log('▶️ DYNAMIC playback toggled:', isPlaying.value)
    
    if (isPlaying.value && !animationFrame) {
      startSmoothMovementAnimation()
    }
  }

  function stepForward() {
    if (currentStep.value < parsedActions.value.length) {
      const action = parsedActions.value[currentStep.value]
      
      console.log(`🎯 EXECUTING STEP ${currentStep.value + 1}: ${action.name}`)
      console.log(`📋 Action details:`, {
        name: action.name,
        actionType: action.actionType,
        elevator: action.elevator,
        passenger: action.passenger,
        direction: action.direction,
        parameters: action.parameters
      })
      
      // Start action timing
      actionStartTime.value = Date.now()
      actionProgress.value = 0
      
      executeAction(action)
      currentStep.value++
      
      console.log(`📊 DYNAMIC progress: ${currentStep.value}/${parsedActions.value.length}`)
      
      if (currentStep.value >= parsedActions.value.length) {
        showSuccess.value = true
        console.log('🎉 DYNAMIC simulation completed!')
        setTimeout(() => {
          showSuccess.value = false
        }, 3000)
      }
    } else {
      console.log('❌ No more actions to execute')
    }
  }

  function resetSimulation() {
    console.log('🔄 DYNAMIC resetting simulation')
    isPlaying.value = false
    currentStep.value = 0
    
    // Stop animation
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
    
    // Clear movement state
    activeElevators.value.clear()
    movingElevators.value.clear()
    elevatorMovementProgress.value = {}
    elevatorTargetFloors.value = {}
    elevatorStartFloors.value = {}
    elevatorMovementStartTime.value = {}
    
    particles.value = []
    totalCost.value = 0
    completedDeliveries.value.clear()
    initializeDynamicLocations()
  }

  // Auto-play functionality (EXACT same as robot)
  let playInterval = null

  watch([isPlaying, playbackSpeed], ([playing, speed]) => {
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
    }

    if (playing && currentStep.value < parsedActions.value.length) {
      const executeNextStep = () => {
        stepForward()
        
        if (currentStep.value < parsedActions.value.length && isPlaying.value) {
          const action = parsedActions.value[currentStep.value]
          const interval = (action.duration * 1000) / speed
          setTimeout(executeNextStep, interval)
        } else {
          isPlaying.value = false
        }
      }
      
      // Start first step
      const action = parsedActions.value[currentStep.value]
      const interval = (action.duration * 1000) / speed
      setTimeout(executeNextStep, interval)
    }
  })

  // Helper functions for template (EXACT same as robot)
  function getElevatorsOnFloor(floor) {
    return planElevators.value.filter(elevator => {
      if (movingElevators.value.has(elevator)) {
        return false
      }
      return elevatorLocations.value[elevator] === floor
    })
  }

  function getPassengersOnFloor(floor) {
    return planPassengers.value.filter(passenger => passengerLocations.value[passenger] === floor)
  }

  function isPassengerCarried(passenger) {
    return Object.values(passengerCarrying.value).some(carried => carried.includes(passenger))
  }

  function getElevatorCarrying(elevator) {
    return passengerCarrying.value[elevator] || []
  }

  function isElevatorMoving(elevator) {
    return movingElevators.value.has(elevator)
  }

  function getElevatorMovementProgress(elevator) {
    return elevatorMovementProgress.value[elevator] || 0
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

  // Helper functions for PDDL-specific features
  const getTotalMakespan = () => {
    if (!parsedActions.value?.length) return 0
    return Math.max(...parsedActions.value.map(a => a.end || a.start + a.duration))
  }

  const getElapsedTime = () => {
    if (!currentAction.value) return 0
    return currentAction.value.start || 0
  }

  const getEfficiencyScore = () => {
    return efficiency.value
  }

  // DYNAMIC location initialization
  function initializeDynamicLocations() {
    console.log('🏁 DYNAMIC initializing locations...')

    if (planFloors.value.length === 0) {
      console.log('⚠️ No floors found, using defaults')
      return
    }

    console.log('📋 All parsed actions for initialization:', parsedActions.value.map(a => ({
      step: a.step,
      name: a.name,
      type: a.actionType,
      elevator: a.elevator,
      passenger: a.passenger,
      direction: a.direction
    })))

    // FIXED: Initialize elevator locations properly
    planElevators.value.forEach(elevator => {
      // Start elevator at the middle floor to match plan logic
      const middleFloorIndex = Math.floor(planFloors.value.length / 2)
      let startFloor = planFloors.value[middleFloorIndex]
      
      // Trace first few actions to determine correct starting position
      const firstMoveActions = parsedActions.value
        .filter(action => action.elevator === elevator && action.actionType === 'move')
        .slice(0, 3) // Look at first 3 movements
      
      if (firstMoveActions.length > 0) {
        // If first action is move-down, elevator must start higher
        if (firstMoveActions[0].direction === 'down') {
          startFloor = planFloors.value[planFloors.value.length - 1] // Start at top
        } else if (firstMoveActions[0].direction === 'up') {
          startFloor = planFloors.value[0] // Start at bottom
        }
      }
      
      elevatorLocations.value[elevator] = startFloor
      passengerCarrying.value[elevator] = []
      
      console.log(`🛗 DYNAMIC: ${elevator} starts at ${startFloor}`)
    })

    // FIXED: Initialize passenger locations based on load actions
    planPassengers.value.forEach((passenger) => {
      // Find where this passenger gets loaded (picked up)
      const loadAction = parsedActions.value.find(action => 
        action.actionType === 'load' && action.passenger === passenger
      )
      
      if (loadAction) {
        // Trace elevator position at time of load action
        const loadActionIndex = parsedActions.value.indexOf(loadAction)
        const elevator = loadAction.elevator
        
        // Calculate elevator position when this load happens
        let elevatorFloor = elevatorLocations.value[elevator]
        
        for (let i = 0; i < loadActionIndex; i++) {
          const action = parsedActions.value[i]
          if (action.elevator === elevator && action.actionType === 'move') {
            const currentIndex = planFloors.value.indexOf(elevatorFloor)
            if (action.direction === 'up') {
              elevatorFloor = planFloors.value[Math.min(currentIndex + 1, planFloors.value.length - 1)]
            } else if (action.direction === 'down') {
              elevatorFloor = planFloors.value[Math.max(currentIndex - 1, 0)]
            }
          }
        }
        
        passengerLocations.value[passenger] = elevatorFloor
        console.log(`👤 DYNAMIC: ${passenger} starts at ${elevatorFloor} (where they get picked up)`)
      } else {
        // Default to bottom floor
        const defaultFloor = planFloors.value[0]
        passengerLocations.value[passenger] = defaultFloor
        console.log(`👤 DYNAMIC: ${passenger} defaults to ${defaultFloor}`)
      }
    })

    // Update passenger list for template
    passengerList.value = planPassengers.value

    console.log('🏁 DYNAMIC initial state:')
    console.log('🛗 Elevator locations:', JSON.stringify(elevatorLocations.value))
    console.log('👤 Passenger locations:', JSON.stringify(passengerLocations.value))
    console.log('🏢 Available floors:', planFloors.value)
  }

  // Watch for props changes (EXACT same as robot)
  watch(() => props.actions, (newActions) => {
    console.log('👀 DYNAMIC actions prop changed:', typeof newActions, newActions)
    resetSimulation()
  }, { immediate: true })

  // Initialize when component mounts (EXACT same as robot)
  onMounted(() => {
    console.log('🏗️ DYNAMIC elevator simulator mounted')
    initializeDynamicLocations()
  })

  // Cleanup on unmount (EXACT same as robot)
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
    
    // Movement state
    elevatorMovementProgress,
    elevatorTargetFloors,
    elevatorStartFloors,
    
    // Computed
    progressPercentage,
    currentAction,
    planElevators,
    planPassengers,
    planFloors,
    totalDuration,
    
    // Methods
    togglePlayback,
    resetSimulation,
    stepForward,
    getElevatorsOnFloor,
    getPassengersOnFloor,
    isPassengerCarried,
    getElevatorCarrying,
    isElevatorMoving,
    getElevatorMovementProgress,
    
    // Additional state needed by template
    elevatorLocations,
    passengerLocations,
    passengerCarrying,
    activeElevators,
    
    // PDDL helper functions
    currentEnergy,
    maxEnergy,
    currentFuel,
    maxFuel,
    totalCost,
    efficiency,
    isCharging,
    completedDeliveries,
    deliveryTargets,
    passengerList,
    getTotalMakespan,
    getElapsedTime,
    getEfficiencyScore,
    parsedActions
  }
}