/* eslint-disable no-unused-vars */
// Enhanced Robot Simulator with Smooth Movement Between Rooms
// File Path: src/components/visualization/robotSimulator.js
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { parseRobotPlanFile, extractEntitiesFromActions } from '@/utils/robot/enhancedRobotParser.js'

export function createRobotSimulator(props) {
  console.log('🤖 Creating robot simulator with smooth movement:', props)
  
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
  const robotMovementProgress = ref({}) // Track movement progress per robot (0-1)
  const robotTargetRooms = ref({}) // Where robots are moving to
  const robotStartRooms = ref({}) // Where robots started moving from
  const robotMovementStartTime = ref({}) // When movement started
  
  // PDDL Type specific state
  const currentFuel = ref(100)
  const maxFuel = ref(100)
  const currentEnergy = ref(100)
  const maxEnergy = ref(100)
  const totalCost = ref(0)
  const activeActions = ref([])
  const robotFuel = ref({})
  const robotEnergy = ref({})

  // Action progress tracking
  const actionStartTime = ref(0)
  const actionProgress = ref(0)

  // Parse raw content into actions
  const parsedActions = computed(() => {
    console.log('🔍 Parsing actions from props:', typeof props.actions, props.actions)
    
    if (!props.actions) return []
    
    if (Array.isArray(props.actions)) {
      console.log('✅ Actions already parsed as array:', props.actions)
      return props.actions
    }
    
    if (typeof props.actions === 'string') {
      console.log('📝 Parsing raw string content')
      return parseRobotPlanContent(props.actions, props.pddlType || 'classical')
    }
    
    console.log('⚠️ Unknown actions format, returning empty array')
    return []
  })

  // Parse robot plan content with enhanced timing
  function parseRobotPlanContent(content, pddlType = 'classical') {
    console.log('🤖 Parsing robot plan content with smooth timing')
    
    if (!content || content.trim().length === 0) {
      console.log('❌ Empty content')
      return []
    }

    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => {
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
               (line.includes(':') && (line.includes('pick') || line.includes('drop') || line.includes('move')))
      })

    console.log('📋 Filtered plan lines:', lines)

    const actions = []
    
    lines.forEach((line, index) => {
      const action = parseActionLineWithTiming(line, index, pddlType)
      if (action) {
        actions.push(action)
        console.log(`✅ Parsed action ${index}:`, action)
      }
    })

    console.log('🎉 Total parsed actions:', actions.length)
    return actions
  }

  // Enhanced action parsing with proper PDDL timing
  function parseActionLineWithTiming(line, index, pddlType) {
    let match
    let timeOrStep = 0
    let actionContent = ''
    let duration = 1.0
    let isWaiting = false
    let cost = 1
    let isEvent = false
    let isProcess = false
    
    console.log(`🔧 Parsing line for ${pddlType}:`, line)
    
    // Handle PDDL+ waiting actions first
    if (pddlType === 'pddl+' && line.includes('-----waiting----')) {
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
    if (pddlType === 'temporal') {
      match = line.match(/^(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)\s*\[(\d+(?:\.\d+)?)\]/)
      if (match) {
        timeOrStep = parseFloat(match[1])
        actionContent = match[2].trim()
        duration = parseFloat(match[3])
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
    
    // Use parsed duration for temporal, calculate for others
    if (pddlType !== 'temporal') {
      duration = calculateSmoothDuration(actionName, pddlType)
    }
    cost = calculateActionCost(actionName, pddlType)
    
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
    
    // Extract specific entities based on action type with correct parameter order
    if (actionName === 'pick' && parameters.length >= 3) {
      action.actionType = 'pick'
      action.object = parameters[0]   // ball1
      action.room = parameters[1]     // rooma  
      action.robot = parameters[2]    // wally
    } else if (actionName === 'drop' && parameters.length >= 3) {
      action.actionType = 'drop'
      action.object = parameters[0]   // ball1
      action.room = parameters[1]     // roomb
      action.robot = parameters[2]    // wally
    } else if (actionName === 'move' && parameters.length >= 3) {
      action.actionType = 'move'
      action.robot = parameters[0]    // wally
      action.fromRoom = parameters[1] // rooma
      action.toRoom = parameters[2]   // roomb
    } else if (actionName === 'startmove' && parameters.length >= 3) {
      action.actionType = 'move'
      action.robot = parameters[0]    // wally
      action.fromRoom = parameters[1] // gardena
      action.toRoom = parameters[2]   // gardenb
      action.isProcess = true
    } else if (actionName === 'reprisemovement' && parameters.length >= 3) {
      action.actionType = 'move'
      action.robot = parameters[0]    // wally
      action.fromRoom = parameters[1] // gardenb
      action.toRoom = parameters[2]   // gardena
      action.isProcess = true
    } else if (actionName === 'startcharge' && parameters.length >= 1) {
      action.actionType = 'charge'
      action.robot = parameters[0]
      action.isProcess = true
    } else if (actionName === 'stopcharge' && parameters.length >= 1) {
      action.actionType = 'charge_stop'
      action.robot = parameters[0]
      action.isEvent = true
    }
    
    console.log(`✅ Parsed ${pddlType} action:`, {
      step: action.step,
      name: action.name,
      type: action.actionType,
      duration: action.duration,
      robot: action.robot,
      object: action.object,
      from: action.fromRoom,
      to: action.toRoom,
      room: action.room,
      raw: action.raw
    })
    return action
  }

  // Calculate smooth durations for better visualization
  function calculateSmoothDuration(actionName, pddlType) {
    const baseDurations = {
      'move': 4.0,        // 4 seconds for smooth room-to-room movement
      'pick': 1.5,        // 1.5 seconds to pick up and show in hands
      'drop': 1.5,        // 1.5 seconds to drop from hands
      'load-truck': 2.0,  // 2 seconds to load
      'unload-truck': 2.0, // 2 seconds to unload
      'drive-truck': 5.0,  // 5 seconds for truck movement
      'default': 2.0
    }
    
    let duration = baseDurations[actionName] || baseDurations.default
    
    // Adjust based on PDDL type
    if (pddlType === 'temporal') {
      return duration
    } else if (pddlType === 'numerical') {
      const cost = calculateActionCost(actionName, pddlType)
      return duration * (cost / 2)
    } else if (pddlType === 'pddl+') {
      return duration * 1.5
    } else {
      return duration
    }
  }

  // Calculate action costs
  function calculateActionCost(actionName, pddlType = 'classical') {
    if (pddlType === 'numerical') {
      switch (actionName) {
        case 'move':
        case 'drive-truck':
          return 5
        case 'pick':
        case 'drop':
        case 'load-truck':
        case 'unload-truck':
          return 2
        default:
          return 3
      }
    }
    
    switch (actionName) {
      case 'move': 
      case 'drive-truck':
        return 2
      case 'pick': 
      case 'drop':
      case 'load-truck':
      case 'unload-truck':
        return 1
      default: 
        return 1
    }
  }

  // Extract entities from parsed actions using enhanced parser
  const planRobots = computed(() => {
    if (!parsedActions.value?.length) return ['robot1']
    
    const entities = extractEntitiesFromActions(parsedActions.value)
    return entities.robots.length > 0 ? entities.robots : ['robot1']
  })

  const planObjects = computed(() => {
    if (!parsedActions.value?.length) return []
    
    const entities = extractEntitiesFromActions(parsedActions.value)
    return entities.objects
  })

  const planRooms = computed(() => {
    if (!parsedActions.value?.length) return ['roomA', 'roomB', 'roomC']
    
    const entities = extractEntitiesFromActions(parsedActions.value)
    return entities.rooms.length > 0 ? entities.rooms : ['roomA', 'roomB', 'roomC']
  })

  // Computed properties
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

  // Smooth movement animation
  let animationFrame = null
  
  function startSmoothMovementAnimation() {
    function animate() {
      const now = Date.now()
      
      // Update movement progress for all moving robots
      for (const robot of movingRobots.value) {
        const startTime = robotMovementStartTime.value[robot]
        const action = getCurrentMovementAction(robot)
        
        if (startTime && action) {
          const elapsed = (now - startTime) / 1000 // Convert to seconds
          const duration = action.duration
          const progress = Math.min(1, elapsed / duration)
          
          robotMovementProgress.value[robot] = progress
          
          // Apply easing for smoother movement
          const easedProgress = easeInOutCubic(progress)
          robotMovementProgress.value[robot] = easedProgress
          
          // Complete movement when progress reaches 100%
          if (progress >= 1) {
            completeRobotMovement(robot)
          }
        }
      }
      
      // Update action progress
      if (currentAction.value && actionStartTime.value) {
        const elapsed = (now - actionStartTime.value) / 1000
        actionProgress.value = Math.min(100, (elapsed / currentAction.value.duration) * 100)
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

  function getCurrentMovementAction(robot) {
    return parsedActions.value.find(actionItem => 
      actionItem.robot === robot && actionItem.actionType === 'move'
    )
  }

  function completeRobotMovement(robot) {
    const targetRoom = robotTargetRooms.value[robot]
    if (targetRoom) {
      robotLocations.value[robot] = targetRoom
      console.log(`✅ ${robot} completed smooth movement to ${targetRoom}`)
    }
    
    // Clean up movement state
    movingRobots.value.delete(robot)
    delete robotMovementProgress.value[robot]
    delete robotTargetRooms.value[robot]
    delete robotStartRooms.value[robot]
    delete robotMovementStartTime.value[robot]
    
    activeRobots.value.delete(robot)
  }

  // Enhanced action execution with correct robot positioning
  function executeAction(action) {
    console.log(`⚡ Executing action:`, action)
    
    if (!action) return
    
    // Handle waiting actions for PDDL+
    if (action.isWaiting) {
      console.log(`⏳ Waiting for ${action.duration}s`)
      return
    }
    
    switch (action.actionType) {
      case 'move':
        executeCorrectMovement(action)
        break
        
      case 'pick':
        executeCorrectPickAction(action)
        break
        
      case 'drop':
        executeCorrectDropAction(action)
        break
        
      case 'charge':
        executeChargeAction(action)
        break
        
      case 'charge_stop':
        executeStopChargeAction(action)
        break
    }

    // Handle resources for numerical PDDL
    if (action.type === 'numerical') {
      totalCost.value += action.cost || 1
      currentFuel.value = Math.max(0, currentFuel.value - (action.cost || 1))
      currentEnergy.value = Math.max(0, currentEnergy.value - (action.cost || 1))
    }
  }

  // Correct movement execution with proper start/end positions
  function executeCorrectMovement(action) {
    if (!action.robot || !action.fromRoom || !action.toRoom) return
    
    const robot = action.robot
    
    console.log(`🚶‍♂️ ${robot} moving from ${action.fromRoom} to ${action.toRoom} (${action.duration}s)`)
    
    // Verify robot is actually in the fromRoom
    const currentLocation = robotLocations.value[robot]
    if (currentLocation !== action.fromRoom) {
      console.warn(`⚠️ Robot ${robot} is in ${currentLocation} but trying to move from ${action.fromRoom}`)
      // Force correct the location
      robotLocations.value[robot] = action.fromRoom
    }
    
    // Set up movement state
    robotStartRooms.value[robot] = action.fromRoom
    robotTargetRooms.value[robot] = action.toRoom
    robotMovementProgress.value[robot] = 0
    robotMovementStartTime.value[robot] = Date.now()
    
    // Add to moving robots
    movingRobots.value.add(robot)
    activeRobots.value.add(robot)
    
    // Start animation if not already running
    if (!animationFrame) {
      startSmoothMovementAnimation()
    }
    
    createActionParticles()
  }

  // FIXED: Correct pick action execution with proper location checking
  function executeCorrectPickAction(action) {
    if (!action.object || !action.robot || !action.room) return
    
    const robot = action.robot
    
    console.log(`🤏 STARTING pick: ${robot} picking up ${action.object} from ${action.room}`)
    console.log(`📍 Robot current location: ${robotLocations.value[robot]}`)
    console.log(`📦 Object current location: ${objectLocations.value[action.object]}`)
    
    // Verify and correct robot location
    if (robotLocations.value[robot] !== action.room) {
      console.warn(`⚠️ CORRECTING: Robot ${robot} was in ${robotLocations.value[robot]}, should be in ${action.room}`)
      robotLocations.value[robot] = action.room
    }
    
    // Verify and correct object location
    if (objectLocations.value[action.object] !== action.room) {
      console.warn(`⚠️ CORRECTING: Object ${action.object} was in ${objectLocations.value[action.object]}, should be in ${action.room}`)
      objectLocations.value[action.object] = action.room
    }
    
    activeRobots.value.add(robot)
    createActionParticles()
    
    // Execute pick action
    setTimeout(() => {
      if (!robotCarrying.value[robot]) {
        robotCarrying.value[robot] = []
      }
      robotCarrying.value[robot].push(action.object)
      delete objectLocations.value[action.object]
      
      console.log(`✅ Pick complete: ${robot} now carrying ${action.object}`)
      console.log(`🎒 Robot ${robot} carrying:`, robotCarrying.value[robot])
      activeRobots.value.delete(robot)
    }, action.duration * 1000)
  }

  // FIXED: Correct drop action execution with proper location checking
  function executeCorrectDropAction(action) {
    if (!action.object || !action.room || !action.robot) return
    
    const robot = action.robot
    
    console.log(`📥 STARTING drop: ${robot} dropping ${action.object} in ${action.room}`)
    console.log(`📍 Robot current location: ${robotLocations.value[robot]}`)
    console.log(`🎒 Robot currently carrying:`, robotCarrying.value[robot])
    
    // Verify and correct robot location
    if (robotLocations.value[robot] !== action.room) {
      console.warn(`⚠️ CORRECTING: Robot ${robot} was in ${robotLocations.value[robot]}, should be in ${action.room}`)
      robotLocations.value[robot] = action.room
    }
    
    // Verify robot is carrying the object
    if (!robotCarrying.value[robot]?.includes(action.object)) {
      console.warn(`⚠️ CORRECTING: Robot ${robot} should be carrying ${action.object}`)
      if (!robotCarrying.value[robot]) {
        robotCarrying.value[robot] = []
      }
      robotCarrying.value[robot].push(action.object)
    }
    
    activeRobots.value.add(robot)
    createActionParticles()
    
    // Execute drop action
    setTimeout(() => {
      if (robotCarrying.value[robot]) {
        robotCarrying.value[robot] = robotCarrying.value[robot].filter(obj => obj !== action.object)
      }
      objectLocations.value[action.object] = action.room
      
      console.log(`✅ Drop complete: ${action.object} now in ${action.room}`)
      console.log(`🎒 Robot ${robot} now carrying:`, robotCarrying.value[robot])
      activeRobots.value.delete(robot)
    }, action.duration * 1000)
  }

  // Handle charging actions for PDDL+
  function executeChargeAction(action) {
    const robot = action.robot
    console.log(`🔋 ${robot} starting to charge`)
    activeRobots.value.add(robot)
    createActionParticles()
  }

  function executeStopChargeAction(action) {
    const robot = action.robot
    console.log(`🔋 ${robot} stopped charging`)
    activeRobots.value.delete(robot)
  }

  // Playback control functions
  function togglePlayback() {
    isPlaying.value = !isPlaying.value
    console.log('▶️ Playback toggled:', isPlaying.value)
    
    if (isPlaying.value && !animationFrame) {
      startSmoothMovementAnimation()
    }
  }

  function stepForward() {
    if (currentStep.value < parsedActions.value.length) {
      const action = parsedActions.value[currentStep.value]
      
      console.log(`🎯 Executing step ${currentStep.value + 1}: ${action.name}`)
      
      // Start action timing
      actionStartTime.value = Date.now()
      actionProgress.value = 0
      
      executeAction(action)
      currentStep.value++
      
      console.log(`📊 Progress: ${currentStep.value}/${parsedActions.value.length}`)
      
      if (currentStep.value >= parsedActions.value.length) {
        showSuccess.value = true
        console.log('🎉 All actions completed!')
        setTimeout(() => {
          showSuccess.value = false
        }, 3000)
      }
    }
  }

  function resetSimulation() {
    console.log('🔄 Resetting simulation')
    isPlaying.value = false
    currentStep.value = 0
    
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
    currentFuel.value = maxFuel.value
    currentEnergy.value = maxEnergy.value
    totalCost.value = 0
    initializeLocations()
  }

  // Auto-play functionality with smooth timing
  let playInterval = null

  watch([isPlaying, playbackSpeed], ([playing, speed]) => {
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
    }

    if (playing && currentStep.value < parsedActions.value.length) {
      // Calculate interval based on current action duration
      const getCurrentInterval = () => {
        const action = parsedActions.value[currentStep.value]
        if (action) {
          // Use action duration scaled by playback speed
          return (action.duration * 1000) / speed // Convert to milliseconds
        }
        return 2000 / speed // Default 2 seconds
      }
      
      const executeNextStep = () => {
        stepForward()
        
        if (currentStep.value < parsedActions.value.length && isPlaying.value) {
          // Schedule next step based on current action duration
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

  // Helper functions for PDDL-specific features
  const getCurrentActionForRobot = (robot) => {
    return parsedActions.value.find(action => 
      action.robot === robot && 
      (action.actionType === 'move' || action.actionType === 'pick' || action.actionType === 'drop') &&
      action.step === currentStep.value
    ) || parsedActions.value.find(action => action.robot === robot && action.step === currentStep.value)
  }

  const getTotalMakespan = () => {
    if (!parsedActions.value?.length) return 0
    return Math.max(...parsedActions.value.map(action => action.end || action.start + action.duration))
  }

  const getElapsedTime = () => {
    if (!parsedActions.value?.length) return 0
    const startTime = Math.min(...parsedActions.value.map(action => action.start))
    const currentTime = parsedActions.value[currentStep.value]?.start || 0
    return currentTime - startTime
  }

  const getRobotFuel = (robot) => {
    return robotFuel.value[robot] || 100
  }

  const getRobotEnergy = (robot) => {
    return robotEnergy.value[robot] || 100
  }

  const getEfficiencyScore = () => {
    if (props.pddlType !== 'numerical' || !totalCost.value || !currentStep.value) return 100
    const avgCost = totalCost.value / Math.max(1, currentStep.value)
    return Math.max(0, Math.round(100 - (avgCost - 1) * 10))
  }

  function initializeLocations() {
    console.log('🏁 Initializing locations with correct robot positions...')

    if (planRooms.value.length === 0) {
      console.log('⚠️ No rooms found, using defaults')
      return
    }

    console.log('📋 All parsed actions:', parsedActions.value.map(a => ({
      step: a.step,
      name: a.name,
      robot: a.robot,
      object: a.object,
      room: a.room,
      fromRoom: a.fromRoom,
      toRoom: a.toRoom
    })))

    // Initialize robot locations based on their VERY FIRST action
    planRobots.value.forEach(robot => {
      let startRoom = planRooms.value[0] // Default fallback
      
      // Find the very first action (lowest step/start time) for this robot
      const robotActions = parsedActions.value
        .filter(action => action.robot === robot)
        .sort((a, b) => a.start - b.start) // Sort by start time
      
      console.log(`🤖 Actions for ${robot}:`, robotActions.map(a => ({
        step: a.step,
        start: a.start,
        name: a.name,
        room: a.room,
        fromRoom: a.fromRoom,
        toRoom: a.toRoom
      })))
      
      if (robotActions.length > 0) {
        const firstAction = robotActions[0]
        
        if (firstAction.actionType === 'pick' && firstAction.room) {
          // Robot's first action is pick, so it starts in that room
          startRoom = firstAction.room
        } else if (firstAction.actionType === 'move' && firstAction.fromRoom) {
          // Robot's first action is move, so it starts in the fromRoom
          startRoom = firstAction.fromRoom
        } else if (firstAction.room) {
          // Fallback to any room mentioned in first action
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
        .sort((a, b) => a.start - b.start)[0] // Get earliest pick action
      
      if (firstPickAction && firstPickAction.room) {
        objectLocations.value[obj] = firstPickAction.room
        console.log(`📦 Object ${obj} starts in ${firstPickAction.room}`)
      } else {
        // Default to first room if no pick action found
        const defaultRoom = planRooms.value[0]
        objectLocations.value[obj] = defaultRoom
        console.log(`📦 Object ${obj} defaults to ${defaultRoom}`)
      }
    })

    console.log('🏁 Initial state:')
    console.log('🤖 Robot locations:', JSON.stringify(robotLocations.value))
    console.log('📦 Object locations:', JSON.stringify(objectLocations.value))
  }

  // Watch for props changes
  watch(() => props.actions, (newActions) => {
    console.log('👀 Actions prop changed:', typeof newActions, newActions)
    resetSimulation()
  }, { immediate: true })

  // Initialize when component mounts
  onMounted(() => {
    console.log('🏗️ Smooth robot simulator mounted')
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
    currentFuel,
    maxFuel,
    currentEnergy,
    maxEnergy,
    totalCost,
    activeActions,
    movingRobots,
    robotFuel,
    robotEnergy,
    actionProgress,
    
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
    
    // PDDL-specific helper functions
    getCurrentActionForRobot,
    getTotalMakespan,
    getElapsedTime,
    getRobotFuel,
    getRobotEnergy,
    getEfficiencyScore,
    
    // Additional state needed by template
    robotLocations,
    objectLocations,
    robotCarrying,
    activeRobots,
    
    // For debugging
    parsedActions
  }
}