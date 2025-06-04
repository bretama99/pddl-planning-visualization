import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export function createRobotSimulator(props) {
  // State variables - UPDATED FOR MULTIPLE ROBOTS
  const isPlaying = ref(false)
  const currentStep = ref(0)
  const playbackSpeed = ref(1)
  const objectLocations = ref({}) // obj -> room mapping
  const robotPositions = ref({}) // robot -> {room, x, y} mapping
  const robotCarrying = ref({}) // robot -> [objects] mapping
  const robotCharging = ref({}) // robot -> boolean mapping
  const robotMoving = ref({}) // robot -> boolean mapping
  const activeRoom = ref('')
  const movementTrails = ref({}) // robot -> [positions] mapping
  const particles = ref([])
  const showSuccess = ref(false)
  
  // Animation intervals
  const particleInterval = ref(null)
  const playInterval = ref(null)

  // Object icon mapping function
  const getObjectIcon = (objectName) => {
    const name = objectName.toLowerCase()
    
    // Ball/sphere objects
    if (name.includes('ball') || name.includes('sphere')) {
      if (name.includes('football') || name.includes('soccer')) return '⚽'
      if (name.includes('basketball')) return '🏀'
      if (name.includes('tennis')) return '🎾'
      if (name.includes('ping') || name.includes('pong')) return '🏓'
      if (name.includes('golf')) return '🏌️'
      if (name.includes('baseball')) return '⚾'
      if (name.includes('volleyball')) return '🏐'
      return '⚽' // Default ball
    }
    
    // Box/container objects
    if (name.includes('box') || name.includes('container') || name.includes('package')) {
      if (name.includes('gift') || name.includes('present')) return '🎁'
      return '📦'
    }
    
    // Book objects
    if (name.includes('book') || name.includes('manual') || name.includes('guide')) {
      return '📚'
    }
    
    // Tool objects
    if (name.includes('tool') || name.includes('hammer') || name.includes('wrench')) {
      if (name.includes('hammer')) return '🔨'
      if (name.includes('wrench')) return '🔧'
      if (name.includes('screwdriver')) return '🪛'
      return '🔧'
    }
    
    // Food objects
    if (name.includes('apple')) return '🍎'
    if (name.includes('banana')) return '🍌'
    if (name.includes('orange')) return '🍊'
    if (name.includes('pizza')) return '🍕'
    if (name.includes('burger')) return '🍔'
    if (name.includes('coffee')) return '☕'
    if (name.includes('water') || name.includes('bottle')) return '💧'
    
    // Electronics
    if (name.includes('phone') || name.includes('mobile')) return '📱'
    if (name.includes('laptop') || name.includes('computer')) return '💻'
    if (name.includes('tablet')) return '📱'
    if (name.includes('camera')) return '📷'
    if (name.includes('battery')) return '🔋'
    
    // Clothing
    if (name.includes('shirt') || name.includes('clothes')) return '👕'
    if (name.includes('shoe') || name.includes('boot')) return '👟'
    if (name.includes('hat') || name.includes('cap')) return '🧢'
    
    // Furniture/household
    if (name.includes('chair')) return '🪑'
    if (name.includes('table')) return '🪑'
    if (name.includes('lamp')) return '💡'
    if (name.includes('clock')) return '🕐'
    if (name.includes('key')) return '🔑'
    if (name.includes('pen') || name.includes('pencil')) return '✏️'
    
    // Vehicles/transport
    if (name.includes('car')) return '🚗'
    if (name.includes('bike') || name.includes('bicycle')) return '🚴'
    if (name.includes('plane')) return '✈️'
    
    // Shapes/geometric
    if (name.includes('cube')) return '🧊'
    if (name.includes('cylinder')) return '🥫'
    if (name.includes('pyramid')) return '🔺'
    
    // Medical/health
    if (name.includes('medicine') || name.includes('pill')) return '💊'
    if (name.includes('bandage')) return '🩹'
    
    // Art/creative
    if (name.includes('paint') || name.includes('brush')) return '🎨'
    if (name.includes('music') || name.includes('instrument')) return '🎵'
    
    // Nature
    if (name.includes('flower')) return '🌸'
    if (name.includes('tree')) return '🌳'
    if (name.includes('stone') || name.includes('rock')) return '🪨'
    
    // Generic objects by common prefixes/suffixes
    if (name.startsWith('item') || name.startsWith('obj')) return '🔘'
    if (name.includes('part')) return '⚙️'
    if (name.includes('piece')) return '🧩'
    
    // Default fallback based on common naming patterns
    if (/\d/.test(name)) { // Contains numbers
      if (name.includes('box')) return '📦'
      if (name.includes('ball')) return '⚽'
      return '🔘'
    }
    
    // Final fallback
    return '📦'
  }

  const getLeftHandObjects = (robotName) => {
    const objects = robotCarrying.value[robotName] || []
    // Left hand gets every other object starting from index 0
    return objects.filter((_, index) => index % 2 === 0)
  }

  const getRightHandObjects = (robotName) => {
    const objects = robotCarrying.value[robotName] || []
    // Right hand gets every other object starting from index 1
    return objects.filter((_, index) => index % 2 === 1)
  }

  // NEW: Robot icon mapping function
  const getRobotIcon = (robotName) => {
    const name = robotName.toLowerCase()
    
    if (name.includes('1') || name.includes('alpha') || name.includes('first')) return '🤖'
    if (name.includes('2') || name.includes('beta') || name.includes('second')) return '🦾'
    if (name.includes('3') || name.includes('gamma') || name.includes('third')) return '🦿'
    if (name.includes('4') || name.includes('delta') || name.includes('fourth')) return '🛸'
    if (name.includes('5') || name.includes('epsilon') || name.includes('fifth')) return '🚁'
    
    // Fallback based on robot name hash for consistent colors
    const hash = robotName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const icons = ['🤖', '🦾', '🦿', '🛸', '🚁', '🤵', '👨‍🔬', '👩‍🔬', '🧙‍♂️', '🧙‍♀️']
    return icons[Math.abs(hash) % icons.length]
  }

  // NEW: Robot color mapping function
  const getRobotColor = (robotName) => {
    const hash = robotName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const colors = [
      { primary: '#3498db', secondary: '#2980b9' },
      { primary: '#e74c3c', secondary: '#c0392b' },
      { primary: '#2ecc71', secondary: '#27ae60' },
      { primary: '#f39c12', secondary: '#e67e22' },
      { primary: '#9b59b6', secondary: '#8e44ad' },
      { primary: '#1abc9c', secondary: '#16a085' },
      { primary: '#e67e22', secondary: '#d35400' },
      { primary: '#34495e', secondary: '#2c3e50' }
    ]
    
    return colors[Math.abs(hash) % colors.length]
  }

  // Dynamically extract entities from plan actions
  const planRooms = computed(() => {
    const rooms = new Set()
    const robots = new Set()
    const objects = new Set()
    
    // First pass: identify robots from pick/drop actions
    props.actions.forEach(action => {
      if (['pick', 'drop'].includes(action.name.toLowerCase())) {
        const params = action.parameters.split(' ')
        if (params.length >= 3) {
          robots.add(params[2]) // Robot is usually 3rd parameter in pick/drop
        }
      }
    })
    
    // Second pass: identify objects from pick/drop actions  
    props.actions.forEach(action => {
      if (['pick', 'drop'].includes(action.name.toLowerCase())) {
        const params = action.parameters.split(' ')
        if (params.length >= 1) {
          objects.add(params[0]) // Object is usually 1st parameter
        }
      }
    })
    
    // Third pass: identify rooms (parameters that aren't robots or objects)
    props.actions.forEach(action => {
      const params = action.parameters.split(' ')
      params.forEach(param => {
        if (param && 
            !robots.has(param) && 
            !objects.has(param) &&
            param !== '----waiting----' &&
            !param.startsWith('[') &&
            !param.endsWith(']')) {
          rooms.add(param)
        }
      })
    })
    
    console.log('🏢 Rooms found:', Array.from(rooms))
    return Array.from(rooms)
  })

  const planObjects = computed(() => {
    const objects = new Set()
    
    // Extract objects from pick/drop actions
    props.actions.forEach(action => {
      if (['pick', 'drop'].includes(action.name.toLowerCase())) {
        const params = action.parameters.split(' ')
        if (params.length >= 1) {
          objects.add(params[0]) // Object is first parameter
        }
      }
    })
    
    console.log('⚽ Objects found:', Array.from(objects))
    return Array.from(objects)
  })

  const planRobots = computed(() => {
    const robots = new Set()
    
    // Extract robots from pick/drop actions
    props.actions.forEach(action => {
      if (['pick', 'drop'].includes(action.name.toLowerCase())) {
        const params = action.parameters.split(' ')
        if (params.length >= 3) {
          robots.add(params[2]) // Robot is third parameter
        }
      }
    })
    
    // Also check move actions for robots
    props.actions.forEach(action => {
      if (['move', 'startmove'].includes(action.name.toLowerCase())) {
        const params = action.parameters.split(' ')
        if (params.length >= 1) {
          robots.add(params[0]) // Robot is first parameter in move
        }
      }
    })
    
    console.log('🤖 Robots found:', Array.from(robots))
    return Array.from(robots)
  })

  const currentAction = computed(() => {
    return props.actions[currentStep.value] || null
  })

  const robotsWithTrails = computed(() => {
    return planRobots.value.filter(robot => 
      movementTrails.value[robot] && movementTrails.value[robot].length > 1
    )
  })

  // Particle system
  const generateParticles = (type, count = 10, position = null) => {
    const newParticles = []
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random() + Date.now(),
        type,
        x: position ? position.x + (Math.random() - 0.5) * 40 : Math.random() * 100,
        y: position ? position.y + (Math.random() - 0.5) * 40 : Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360
      })
    }
    particles.value.push(...newParticles)
  }

  const updateParticles = () => {
    particles.value = particles.value
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        life: particle.life - 0.02,
        size: particle.size * 0.98,
        rotation: particle.rotation + 2
      }))
      .filter(particle => particle.life > 0)
  }

  const getParticleStyle = (particle) => {
    return {
      left: particle.x + '%',
      top: particle.y + '%',
      width: particle.size + 'px',
      height: particle.size + 'px',
      opacity: particle.life,
      transform: `rotate(${particle.rotation}deg)`
    }
  }

  // UPDATED: Position calculations with 4-column layout
  const getRoomPosition = (roomName) => {
    const index = planRooms.value.indexOf(roomName)
    const cols = 4 // FIXED 4 COLUMNS
    const row = Math.floor(index / cols)
    const col = index % cols
    
    const roomWidth = 280
    const roomHeight = 200
    const padding = 40
    
    return {
      left: (padding + col * (roomWidth + 20)) + 'px',
      top: (padding + row * (roomHeight + 20)) + 'px'
    }
  }

  // UPDATED: Robot position calculation for multiple robots
  const getRobotPosition = (robotName) => {
    const robotPos = robotPositions.value[robotName]
    if (!robotPos || !robotPos.room) return { left: '0px', top: '0px' }
    
    const roomPos = getRoomPosition(robotPos.room)
    
    // Calculate robot offset within room based on number of robots in same room
    const robotsInRoom = Object.keys(robotPositions.value).filter(
      robot => robotPositions.value[robot].room === robotPos.room
    )
    const robotIndex = robotsInRoom.indexOf(robotName)
    const offsetX = (robotIndex % 2) * 60 - 30 // Spread robots horizontally
    const offsetY = Math.floor(robotIndex / 2) * 40 - 20 // Stack vertically if needed
    
    return {
      left: (parseInt(roomPos.left) + 140 + offsetX) + 'px',
      top: (parseInt(roomPos.top) + 90 + offsetY) + 'px'
    }
  }

  const getObjectsInRoom = (roomName) => {
    return Object.keys(objectLocations.value).filter(
      obj => objectLocations.value[obj] === roomName
    )
  }

  // UPDATED: Trail path for specific robot
  const getTrailPath = (robotName) => {
    const trail = movementTrails.value[robotName] || []
    if (trail.length < 2) return ''
    
    let path = `M ${trail[0].x} ${trail[0].y}`
    for (let i = 1; i < trail.length; i++) {
      path += ` L ${trail[i].x} ${trail[i].y}`
    }
    return path
  }

  // UPDATED: Initialize simulation for multiple robots
  const initializePlan = () => {
    console.log('🚀 Initializing plan with actions:', props.actions.length)
    
    if (props.actions.length === 0) {
      console.warn('❌ No actions provided')
      return
    }

    // Reset state
    currentStep.value = 0
    objectLocations.value = {}
    robotPositions.value = {}
    robotCarrying.value = {}
    robotCharging.value = {}
    robotMoving.value = {}
    activeRoom.value = ''
    movementTrails.value = {}
    particles.value = []
    showSuccess.value = false

    console.log('🏢 Available rooms:', planRooms.value)
    console.log('⚽ Available objects:', planObjects.value)
    console.log('🤖 Available robots:', planRobots.value)

    // Initialize robot states
    planRobots.value.forEach(robot => {
      robotCarrying.value[robot] = []
      robotCharging.value[robot] = false
      robotMoving.value[robot] = false
      movementTrails.value[robot] = []
    })

    // Find initial object locations from first PICK actions
    planObjects.value.forEach(obj => {
      const pickAction = props.actions.find(action => 
        action.name.toLowerCase() === 'pick' && action.parameters.includes(obj)
      )
      if (pickAction) {
        const params = pickAction.parameters.split(' ')
        const room = params.find(p => planRooms.value.includes(p))
        if (room) {
          objectLocations.value[obj] = room
          console.log(`📦 ${obj} starts in ${room}`)
        }
      }
    })

    // Position robots at their first action locations
    planRobots.value.forEach(robot => {
      const firstAction = props.actions.find(action => 
        action.parameters.includes(robot)
      )
      
      if (firstAction) {
        const params = firstAction.parameters.split(' ')
        const startRoom = params.find(p => planRooms.value.includes(p))
        
        if (startRoom) {
          robotPositions.value[robot] = { room: startRoom, x: 0, y: 0 }
          console.log(`🤖 ${robot} starts in ${startRoom}`)
          
          // Add initial position to trail
          const pos = getRobotPosition(robot)
          movementTrails.value[robot] = [{
            x: parseInt(pos.left),
            y: parseInt(pos.top)
          }]
        }
      }
    })
  }

  // UPDATED: Action execution functions for multiple robots
  const executeAction = async (action) => {
    console.log(`🎬 Executing: ${action.name} ${action.parameters}`)
    
    const params = action.parameters.split(' ')
    
    switch (action.name.toLowerCase()) {
      case 'pick':
        await executePick(params)
        break
      case 'drop':
        await executeDrop(params)
        break
      case 'move':
      case 'startmove':
        await executeMove(params)
        break
      case 'startcharge':
        await executeCharge(params, 'start')
        break
      case 'stopcharge':
        await executeCharge(params, 'stop')
        break
      case 'reprisemovement':
        await executeRepriseMovement(params)
        break
      case '-----waiting----':
        await executeWaiting(params)
        break
      default:
        console.log(`❓ Unknown action: ${action.name}`)
        await new Promise(resolve => setTimeout(resolve, 300 / playbackSpeed.value))
    }
  }

  const executePick = async (params) => {
    // Format: pick object room robot
    const obj = params[0] // Object is first parameter
    const room = params[1] // Room is second parameter
    const robot = params[2] // Robot is third parameter
    
    if (obj && planObjects.value.includes(obj) && robot && planRobots.value.includes(robot)) {
      console.log(`📦 ${robot} picking ${obj} from ${room}`)
      
      // Generate pickup particles at robot position
      const robotPos = getRobotPosition(robot)
      generateParticles('pickup', 12, {
        x: parseInt(robotPos.left) / window.innerWidth * 100,
        y: parseInt(robotPos.top) / window.innerHeight * 100
      })
      
      // Remove from room location
      const newLocations = { ...objectLocations.value }
      delete newLocations[obj]
      objectLocations.value = newLocations
      
      // Add to robot's carrying list
      if (!robotCarrying.value[robot].includes(obj)) {
        robotCarrying.value[robot] = [...robotCarrying.value[robot], obj]
      }
      
      // Set active room
      activeRoom.value = room
      
      // Visual feedback delay
      await new Promise(resolve => setTimeout(resolve, 800 / playbackSpeed.value))
    }
  }

  const executeMove = async (params) => {
    // Format: move/startmove robot fromRoom toRoom
    const robot = params[0] // Robot is first parameter
    const fromRoom = params[1] // Source room
    const toRoom = params[2] // Target room
    
    if (robot && fromRoom && toRoom && planRooms.value.includes(toRoom) && planRobots.value.includes(robot)) {
      console.log(`🚶 ${robot} moving from ${fromRoom} to ${toRoom}`)
      
      // Generate movement particles at robot position
      const robotPos = getRobotPosition(robot)
      generateParticles('movement', 15, {
        x: parseInt(robotPos.left) / window.innerWidth * 100,
        y: parseInt(robotPos.top) / window.innerHeight * 100
      })
      
      robotMoving.value[robot] = true
      
      // Update robot position
      robotPositions.value[robot] = { room: toRoom, x: 0, y: 0 }
      activeRoom.value = toRoom
      
      // Add to movement trail
      const newPos = getRobotPosition(robot)
      if (!movementTrails.value[robot]) {
        movementTrails.value[robot] = []
      }
      movementTrails.value[robot] = [...movementTrails.value[robot], {
        x: parseInt(newPos.left),
        y: parseInt(newPos.top)
      }]
      
      // Keep trail reasonable length
      if (movementTrails.value[robot].length > 8) {
        movementTrails.value[robot] = movementTrails.value[robot].slice(-8)
      }
      
      // Movement animation delay
      await new Promise(resolve => setTimeout(resolve, 1200 / playbackSpeed.value))
      robotMoving.value[robot] = false
    }
  }

  const executeDrop = async (params) => {
    // Format: drop object room robot
    const obj = params[0] // Object is first parameter
    const room = params[1] // Room is second parameter
    const robot = params[2] // Robot is third parameter
    
    if (obj && planObjects.value.includes(obj) && robot && planRobots.value.includes(robot)) {
      console.log(`📤 ${robot} dropping ${obj} in ${room}`)
      
      // Generate success particles at robot position
      const robotPos = getRobotPosition(robot)
      generateParticles('success', 20, {
        x: parseInt(robotPos.left) / window.innerWidth * 100,
        y: parseInt(robotPos.top) / window.innerHeight * 100
      })
      
      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
      }, 2000)
      
      // Remove from robot's carrying list
      robotCarrying.value[robot] = robotCarrying.value[robot].filter(item => item !== obj)
      
      // Place in target room
      objectLocations.value = { ...objectLocations.value, [obj]: room }
      
      // Set active room
      activeRoom.value = room
      
      console.log(`✅ ${obj} delivered to ${room}`)
      
      // Visual feedback delay
      await new Promise(resolve => setTimeout(resolve, 800 / playbackSpeed.value))
    }
  }

  const executeCharge = async (params, type) => {
    const robot = params[0]
    if (!robot || !planRobots.value.includes(robot)) return
    
    console.log(`🔋 ${robot} ${type} charging`)
    
    if (type === 'start') {
      robotCharging.value[robot] = true
      const robotPos = getRobotPosition(robot)
      generateParticles('energy', 15, {
        x: parseInt(robotPos.left) / window.innerWidth * 100,
        y: parseInt(robotPos.top) / window.innerHeight * 100
      })
    } else {
      robotCharging.value[robot] = false
    }
    
    // Visual indication of charging
    await new Promise(resolve => setTimeout(resolve, 500 / playbackSpeed.value))
  }

  const executeRepriseMovement = async (params) => {
    // Continue movement that was interrupted
    const robot = params[0]
    const fromRoom = params[1]
    const toRoom = params[2]
    
    if (!robot || !planRobots.value.includes(robot)) return
    
    console.log(`🔄 ${robot} resuming movement from ${fromRoom} to ${toRoom}`)
    
    if (toRoom && planRooms.value.includes(toRoom)) {
      robotPositions.value[robot] = { room: toRoom, x: 0, y: 0 }
      activeRoom.value = toRoom
      
      await new Promise(resolve => setTimeout(resolve, 800 / playbackSpeed.value))
    }
  }

  const executeWaiting = async (params) => {
    // Extract duration from [30.0] format
    const durationMatch = params.join(' ').match(/\[(\d+(?:\.\d+)?)\]/)
    const duration = durationMatch ? parseFloat(durationMatch[1]) : 1.0
    
    console.log(`⏳ Waiting ${duration} time units`)
    
    // Scale waiting time for visualization (don't wait the full duration)
    const visualDuration = Math.min(duration * 50, 2000) / playbackSpeed.value
    await new Promise(resolve => setTimeout(resolve, visualDuration))
  }

  // Control functions
  const playPlan = async () => {
    if (props.actions.length === 0) {
      console.warn('❌ No actions to execute')
      return
    }
    
    isPlaying.value = true
    console.log('▶️ Starting plan execution...')
    
    playInterval.value = setInterval(async () => {
      if (currentStep.value < props.actions.length && isPlaying.value) {
        await executeAction(props.actions[currentStep.value])
        currentStep.value++
      } else {
        isPlaying.value = false
        if (playInterval.value) {
          clearInterval(playInterval.value)
        }
        console.log('🏁 Plan execution completed!')
      }
    }, 1500 / playbackSpeed.value)
  }

  const stopPlan = () => {
    isPlaying.value = false
    if (playInterval.value) {
      clearInterval(playInterval.value)
    }
    console.log('⏹️ Plan execution stopped')
  }

  const resetPlan = () => {
    stopPlan()
    console.log('🔄 Resetting plan...')
    initializePlan()
  }

  // Setup particle animation
  onMounted(() => {
    console.log('🏗️ RobotSimulator mounted')
    
    // Start particle animation
    particleInterval.value = setInterval(updateParticles, 50)
    
    if (props.actions.length > 0) {
      initializePlan()
    }
  })

  onUnmounted(() => {
    if (particleInterval.value) {
      clearInterval(particleInterval.value)
    }
    if (playInterval.value) {
      clearInterval(playInterval.value)
    }
  })

  // Watch for plan changes
  watch(() => props.actions, (newActions) => {
    console.log('📊 Actions changed, count:', newActions.length)
    if (newActions.length > 0) {
      initializePlan()
    }
  }, { immediate: true })

  watch(() => props.entities, (newEntities) => {
    console.log('🔍 Entities changed:', newEntities)
  }, { deep: true })

  return {
    // State
    isPlaying,
    currentStep,
    playbackSpeed,
    currentAction,
    planRooms,
    planObjects,
    planRobots,
    activeRoom,
    robotPositions,
    robotCarrying,
    robotCharging,
    robotMoving,
    movementTrails,
    particles,
    showSuccess,
    robotsWithTrails,
    
    // Methods
    getLeftHandObjects, 
    getRightHandObjects,
    getRoomPosition,
    getRobotPosition,
    getObjectsInRoom,
    getTrailPath,
    getParticleStyle,
    getObjectIcon,
    getRobotIcon,
    getRobotColor,
    playPlan,
    stopPlan,
    resetPlan
  }
}