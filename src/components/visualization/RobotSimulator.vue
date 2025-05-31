<template>
  <div class="robot-simulator">
    <!-- Floating Success Message -->
    <transition name="success-popup">
      <div v-if="showSuccess" class="success-message">
        🎉 Task Completed Successfully!
      </div>
    </transition>

    <!-- Particle System -->
    <div class="particles-container">
      <div 
        v-for="particle in particles" 
        :key="particle.id"
        class="particle"
        :class="particle.type"
        :style="getParticleStyle(particle)"
      />
    </div>

    <!-- Controls -->
    <div class="controls">
      <button @click="playPlan" :disabled="isPlaying" class="btn play-btn">
        {{ isPlaying ? '⏸️ Playing...' : '▶️ Play Plan' }}
      </button>
      <button @click="stopPlan" class="btn stop-btn">
        ⏹️ Stop
      </button>
      <button @click="resetPlan" class="btn reset-btn">
        🔄 Reset
      </button>
      <div class="speed-control">
        <label>Speed:</label>
        <input type="range" v-model="playbackSpeed" min="0.5" max="3" step="0.5" class="speed-slider" />
        <span>{{ playbackSpeed }}x</span>
      </div>
    </div>

    <!-- Plan Info -->
    <div class="plan-info">
      <div class="info-card">
        <div class="info-number">{{ actions.length }}</div>
        <div class="info-label">Actions</div>
      </div>
      <div class="info-card">
        <div class="info-number">{{ currentStep + 1 }} / {{ actions.length }}</div>
        <div class="info-label">Step</div>
      </div>
      <div class="info-card">
        <div class="info-number">{{ planRooms.length }}</div>
        <div class="info-label">Rooms</div>
      </div>
      <div class="info-card">
        <div class="info-number">{{ planObjects.length }}</div>
        <div class="info-label">Objects</div>
      </div>
      <div class="info-card">
        <div class="info-number">{{ planRobots.length }}</div>
        <div class="info-label">Robots</div>
      </div>
      
      <div v-if="currentAction" class="current-action">
        <div class="action-header">🎯 Current Action:</div>
        <div class="action-details">
          {{ currentAction.start }}s - {{ currentAction.name.toUpperCase() }} {{ currentAction.parameters }}
        </div>
      </div>
    </div>

    <!-- Simulation Area -->
    <div class="simulation-area">
      <!-- Background Effects -->
      <div class="background-effects">
        <div class="floating-orb" style="--delay: 0s; --duration: 8s;" />
        <div class="floating-orb" style="--delay: 2s; --duration: 12s;" />
        <div class="floating-orb" style="--delay: 4s; --duration: 10s;" />
      </div>

      <!-- Rooms -->
      <div 
        v-for="room in planRooms" 
        :key="room"
        class="room"
        :class="{ 
          active: activeRoom === room,
          'room-pulse': activeRoom === room && isPlaying
        }"
        :style="getRoomPosition(room)"
      >
        <div class="room-title">
          <span class="room-icon">🏢</span>
          <span>{{ room }}</span>
          <div v-if="activeRoom === room" class="active-indicator">
            <div class="pulse-ring"></div>
            <div class="pulse-ring delay-1"></div>
            <div class="pulse-ring delay-2"></div>
          </div>
        </div>
        
        <!-- Objects in this room -->
        <div class="room-objects">
          <transition-group name="object-move" tag="div">
            <div 
              v-for="obj in getObjectsInRoom(room)" 
              :key="obj"
              class="object object-bounce"
            >
              <span class="object-icon">{{ getObjectIcon(obj) }}</span>
              <span>{{ obj }}</span>
            </div>
          </transition-group>
        </div>
      </div>

      <!-- Robot -->
      <transition name="robot-move">
        <div 
          v-if="robotPosition.room"
          class="robot"
          :class="{ 
            'robot-charging': isCharging,
            'robot-moving': isMoving 
          }"
          :style="getRobotPosition()"
        >
          <div class="robot-icon">
            🤖
            <div v-if="isCharging" class="charging-bolt">⚡</div>
            <div class="robot-glow"></div>
          </div>
          
          <div class="robot-name">{{ currentRobot }}</div>
          
          <!-- Carrying objects -->
          <transition-group name="carry-float" tag="div" class="carrying">
            <div 
              v-for="(obj, index) in robotCarrying" 
              :key="obj" 
              class="carried-object"
              :style="{ '--delay': index * 0.2 + 's' }"
            >
              <span class="carry-icon">{{ getObjectIcon(obj) }}</span>
              <span>{{ obj }}</span>
            </div>
          </transition-group>
        </div>
      </transition>

      <!-- Movement trail -->
      <svg class="movement-trail" width="100%" height="100%">
        <defs>
          <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3498db" />
            <stop offset="50%" stop-color="#9b59b6" />
            <stop offset="100%" stop-color="#e74c3c" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path 
          v-if="movementTrail.length > 1"
          :d="getTrailPath()"
          stroke="url(#trailGradient)"
          stroke-width="4"
          stroke-dasharray="8,4"
          fill="none"
          opacity="0.8"
          filter="url(#glow)"
          class="trail-animation"
        />
      </svg>
    </div>

    <!-- Action List -->
    <div class="action-list">
      <h4 class="action-list-title">
        <span>📋 Plan Actions</span>
        <div class="title-underline"></div>
      </h4>
      <div class="actions-container">
        <transition-group name="action-slide" tag="div">
          <div 
            v-for="(action, index) in actions" 
            :key="index"
            class="action-item"
            :class="{ 
              current: index === currentStep,
              done: index < currentStep,
              upcoming: index > currentStep
            }"
          >
            <span class="time">{{ action.start }}s</span>
            <span class="action">{{ action.name.toUpperCase() }}</span>
            <span class="params">{{ action.parameters }}</span>
            <div class="action-status">
              <div v-if="index === currentStep" class="status-icon current-icon">▶️</div>
              <div v-else-if="index < currentStep" class="status-icon done-icon">✅</div>
              <div v-else class="status-icon upcoming-icon">⏳</div>
            </div>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export default {
  name: 'RobotSimulator',
  props: {
    actions: { 
      type: Array, 
      default: () => [
        { start: 0.0, name: 'pick', parameters: 'box1 roomA robot1' },
        { start: 2.5, name: 'move', parameters: 'robot1 roomA roomB' },
        { start: 5.0, name: 'drop', parameters: 'box1 roomB robot1' },
        { start: 7.0, name: 'pick', parameters: 'box2 roomB robot1' },
        { start: 9.5, name: 'move', parameters: 'robot1 roomB roomC' },
        { start: 12.0, name: 'drop', parameters: 'box2 roomC robot1' },
        { start: 14.0, name: 'startcharge', parameters: 'robot1' },
        { start: 16.0, name: 'stopcharge', parameters: 'robot1' }
      ]
    },
    entities: { 
      type: Object, 
      default: () => ({ rooms: [], objects: [], robots: [] }) 
    }
  },
  setup(props) {
    // State variables
    const isPlaying = ref(false)
    const currentStep = ref(0)
    const playbackSpeed = ref(1)
    const objectLocations = ref({}) // obj -> room mapping
    const robotPosition = ref({ room: '', x: 0, y: 0 })
    const robotCarrying = ref([])
    const currentRobot = ref('')
    const activeRoom = ref('')
    const movementTrail = ref([])
    const particles = ref([])
    const isCharging = ref(false)
    const isMoving = ref(false)
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

    // Particle system
    const generateParticles = (type, count = 10) => {
      const newParticles = []
      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: Math.random() + Date.now(),
          type,
          x: Math.random() * 100,
          y: Math.random() * 100,
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

    // Position calculations
    const getRoomPosition = (roomName) => {
      const index = planRooms.value.indexOf(roomName)
      const cols = Math.ceil(Math.sqrt(planRooms.value.length))
      const row = Math.floor(index / cols)
      const col = index % cols
      
      return {
        left: (80 + col * 280) + 'px',
        top: (80 + row * 200) + 'px'
      }
    }

    const getRobotPosition = () => {
      if (!robotPosition.value.room) return { left: '0px', top: '0px' }
      
      const roomPos = getRoomPosition(robotPosition.value.room)
      return {
        left: (parseInt(roomPos.left) + 120) + 'px',
        top: (parseInt(roomPos.top) + 90) + 'px'
      }
    }

    const getObjectsInRoom = (roomName) => {
      return Object.keys(objectLocations.value).filter(
        obj => objectLocations.value[obj] === roomName
      )
    }

    const getTrailPath = () => {
      if (movementTrail.value.length < 2) return ''
      
      let path = `M ${movementTrail.value[0].x} ${movementTrail.value[0].y}`
      for (let i = 1; i < movementTrail.value.length; i++) {
        path += ` L ${movementTrail.value[i].x} ${movementTrail.value[i].y}`
      }
      return path
    }

    // Initialize simulation based on plan
    const initializePlan = () => {
      console.log('🚀 Initializing plan with actions:', props.actions.length)
      
      if (props.actions.length === 0) {
        console.warn('❌ No actions provided')
        return
      }

      // Reset state
      currentStep.value = 0
      objectLocations.value = {}
      robotCarrying.value = []
      activeRoom.value = ''
      movementTrail.value = []
      particles.value = []
      isCharging.value = false
      isMoving.value = false
      showSuccess.value = false

      console.log('🏢 Available rooms:', planRooms.value)
      console.log('⚽ Available objects:', planObjects.value)
      console.log('🤖 Available robots:', planRobots.value)

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

      // Position robot at first action location
      if (planRobots.value.length > 0) {
        currentRobot.value = planRobots.value[0]
        
        // Find robot's starting room from first action
        if (props.actions.length > 0) {
          const firstAction = props.actions[0]
          const params = firstAction.parameters.split(' ')
          const startRoom = params.find(p => planRooms.value.includes(p))
          
          if (startRoom) {
            robotPosition.value.room = startRoom
            activeRoom.value = startRoom
            console.log(`🤖 ${currentRobot.value} starts in ${startRoom}`)
            
            // Add initial position to trail
            const pos = getRobotPosition()
            movementTrail.value.push({
              x: parseInt(pos.left),
              y: parseInt(pos.top)
            })
          }
        }
      }
    }

    // Action execution functions
    const executeAction = async (action) => {
      console.log(`🎬 Executing: ${action.name} ${action.parameters}`)
      
      const params = action.parameters.split(' ')
      
      // Update current robot from action parameters
      const robot = params.find(p => planRobots.value.includes(p))
      if (robot) {
        currentRobot.value = robot
      }

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
      
      if (obj && planObjects.value.includes(obj)) {
        console.log(`📦 ${robot} picking ${obj} from ${room}`)
        
        // Generate pickup particles
        generateParticles('pickup', 12)
        
        // Remove from room location
        const newLocations = { ...objectLocations.value }
        delete newLocations[obj]
        objectLocations.value = newLocations
        
        // Add to robot's carrying list
        if (!robotCarrying.value.includes(obj)) {
          robotCarrying.value = [...robotCarrying.value, obj]
        }
        
        // Visual feedback delay
        await new Promise(resolve => setTimeout(resolve, 800 / playbackSpeed.value))
      }
    }

    const executeMove = async (params) => {
      // Format: move/startmove robot fromRoom toRoom
      const robot = params[0] // Robot is first parameter
      const fromRoom = params[1] // Source room
      const toRoom = params[2] // Target room
      
      if (robot && fromRoom && toRoom && planRooms.value.includes(toRoom)) {
        console.log(`🚶 ${robot} moving from ${fromRoom} to ${toRoom}`)
        
        // Generate movement particles
        generateParticles('movement', 15)
        isMoving.value = true
        
        // Update robot position
        robotPosition.value.room = toRoom
        activeRoom.value = toRoom
        
        // Add to movement trail
        const newPos = getRobotPosition()
        movementTrail.value = [...movementTrail.value, {
          x: parseInt(newPos.left),
          y: parseInt(newPos.top)
        }]
        
        // Keep trail reasonable length
        if (movementTrail.value.length > 10) {
          movementTrail.value = movementTrail.value.slice(-10)
        }
        
        // Movement animation delay
        await new Promise(resolve => setTimeout(resolve, 1200 / playbackSpeed.value))
        isMoving.value = false
      }
    }

    const executeDrop = async (params) => {
      // Format: drop object room robot
      const obj = params[0] // Object is first parameter
      const room = params[1] // Room is second parameter
      const robot = params[2] // Robot is third parameter
      
      if (obj && planObjects.value.includes(obj)) {
        console.log(`📤 ${robot} dropping ${obj} in ${room}`)
        
        // Generate success particles
        generateParticles('success', 20)
        showSuccess.value = true
        setTimeout(() => {
          showSuccess.value = false
        }, 2000)
        
        // Remove from robot's carrying list
        robotCarrying.value = robotCarrying.value.filter(item => item !== obj)
        
        // Place in target room
        objectLocations.value = { ...objectLocations.value, [obj]: room }
        
        console.log(`✅ ${obj} delivered to ${room}`)
        
        // Visual feedback delay
        await new Promise(resolve => setTimeout(resolve, 800 / playbackSpeed.value))
      }
    }

    const executeCharge = async (params, type) => {
      const robot = params[0] || currentRobot.value
      console.log(`🔋 ${robot} ${type} charging`)
      
      if (type === 'start') {
        isCharging.value = true
        generateParticles('energy', 15)
      } else {
        isCharging.value = false
      }
      
      // Visual indication of charging
      await new Promise(resolve => setTimeout(resolve, 500 / playbackSpeed.value))
    }

    const executeRepriseMovement = async (params) => {
      // Continue movement that was interrupted
      const robot = params[0]
      const fromRoom = params[1]
      const toRoom = params[2]
      
      console.log(`🔄 ${robot} resuming movement from ${fromRoom} to ${toRoom}`)
      
      if (toRoom && planRooms.value.includes(toRoom)) {
        robotPosition.value.room = toRoom
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
      currentRobot,
      robotCarrying,
      robotPosition,
      movementTrail,
      particles,
      isCharging,
      isMoving,
      showSuccess,
      
      // Methods
      getRoomPosition,
      getRobotPosition,
      getObjectsInRoom,
      getTrailPath,
      getParticleStyle,
      getObjectIcon,
      playPlan,
      stopPlan,
      resetPlan
    }
  }
}
</script>

<style scoped>
.robot-simulator {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
  color: white;
  overflow-x: auto;
}

/* Success Message */
.success-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(45deg, #4CAF50, #8BC34A);
  padding: 20px 40px;
  border-radius: 15px;
  font-size: 24px;
  font-weight: bold;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  z-index: 1000;
  animation: successBounce 0.6s ease-out;
}

.success-popup-enter-active, .success-popup-leave-active {
  transition: all 0.5s ease;
}

.success-popup-enter-from, .success-popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

@keyframes successBounce {
  0% { transform: translate(-50%, -50%) scale(0.3); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

/* Particle System */
.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.particle.pickup {
  background: radial-gradient(circle, #FFD700, #FFA500);
  box-shadow: 0 0 10px #FFD700;
}

.particle.movement {
  background: radial-gradient(circle, #00BFFF, #1E90FF);
  box-shadow: 0 0 8px #00BFFF;
}

.particle.success {
  background: radial-gradient(circle, #32CD32, #228B22);
  box-shadow: 0 0 12px #32CD32;
}

.particle.energy {
  background: radial-gradient(circle, #FF69B4, #FF1493);
  box-shadow: 0 0 15px #FF69B4;
}

/* Controls */
.controls {
  display: flex;
  gap: 15px;
  margin: 20px 0;
  align-items: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.play-btn {
  background: linear-gradient(45deg, #4CAF50, #8BC34A);
  color: white;
}

.play-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, #45a049, #7cb342);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.play-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.stop-btn {
  background: linear-gradient(45deg, #f44336, #e57373);
  color: white;
}

.stop-btn:hover {
  background: linear-gradient(45deg, #da190b, #ef5350);
  transform: translateY(-2px);
}

.reset-btn {
  background: linear-gradient(45deg, #2196F3, #64B5F6);
  color: white;
}

.reset-btn:hover {
  background: linear-gradient(45deg, #0b7dda, #42A5F5);
  transform: translateY(-2px);
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.1);
  padding: 10px 15px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.speed-slider {
  width: 100px;
}

/* Plan Info */
.plan-info {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.info-card {
  background: rgba(255,255,255,0.1);
  padding: 15px 20px;
  border-radius: 15px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  min-width: 80px;
}

.info-number {
  font-size: 24px;
  font-weight: bold;
  color: #FFD700;
}

.info-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 5px;
}

.current-action {
  background: rgba(255,215,0,0.2);
  padding: 15px 20px;
  border-radius: 15px;
  flex: 1;
  min-width: 300px;
}

.action-header {
  font-weight: bold;
  margin-bottom: 5px;
}

.action-details {
  font-family: 'Courier New', monospace;
  background: rgba(0,0,0,0.2);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
}

/* Simulation Area */
.simulation-area {
  position: relative;
  background: rgba(255,255,255,0.05);
  border-radius: 20px;
  padding: 40px;
  margin: 20px 0;
  min-height: 600px;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255,255,255,0.1);
  overflow: hidden;
}

/* Background Effects */
.background-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-orb {
  position: absolute;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(255,255,255,0.1), transparent);
  border-radius: 50%;
  animation: float var(--duration, 10s) ease-in-out infinite;
  animation-delay: var(--delay, 0s);
}

.floating-orb:nth-child(1) { top: 10%; left: 20%; }
.floating-orb:nth-child(2) { top: 60%; right: 15%; }
.floating-orb:nth-child(3) { bottom: 20%; left: 70%; }

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* Rooms */
.room {
  position: absolute;
  width: 240px;
  height: 160px;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 15px;
  padding: 15px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.room.active {
  border-color: #FFD700;
  box-shadow: 0 0 20px rgba(255,215,0,0.4);
  background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1));
}

.room-pulse {
  animation: roomPulse 2s ease-in-out infinite;
}

@keyframes roomPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.room-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  margin-bottom: 10px;
  position: relative;
}

.room-icon {
  font-size: 20px;
}

.active-indicator {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.pulse-ring {
  width: 20px;
  height: 20px;
  border: 2px solid #FFD700;
  border-radius: 50%;
  position: absolute;
  animation: pulse 2s ease-out infinite;
}

.pulse-ring.delay-1 { animation-delay: 0.5s; }
.pulse-ring.delay-2 { animation-delay: 1s; }

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.room-objects {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 100px;
  overflow-y: auto;
}

.object {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.1);
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.object-bounce {
  animation: objectBounce 3s ease-in-out infinite;
}

@keyframes objectBounce {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}

.object-icon {
  font-size: 18px;
}

.object-move-enter-active, .object-move-leave-active {
  transition: all 0.5s ease;
}

.object-move-enter-from, .object-move-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Robot */
.robot {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 1s ease;
  z-index: 100;
}

.robot-icon {
  font-size: 40px;
  position: relative;
  animation: robotIdle 3s ease-in-out infinite;
}

.robot-charging .robot-icon {
  animation: robotCharge 1s ease-in-out infinite;
}

.robot-moving .robot-icon {
  animation: robotMove 0.5s ease-in-out infinite;
}

@keyframes robotIdle {
  0%, 100% { transform: translateY(0px) rotate(-2deg); }
  50% { transform: translateY(-5px) rotate(2deg); }
}

@keyframes robotCharge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes robotMove {
  0%, 100% { transform: translateX(0px); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.robot-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(0,191,255,0.3), transparent);
  border-radius: 50%;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
}

.charging-bolt {
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 20px;
  animation: chargeBolt 0.5s ease-in-out infinite;
}

@keyframes chargeBolt {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.2) rotate(10deg); }
}

.robot-name {
  font-size: 12px;
  font-weight: bold;
  margin-top: 5px;
  background: rgba(0,0,0,0.3);
  padding: 4px 8px;
  border-radius: 10px;
}

.carrying {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
}

.carried-object {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255,215,0,0.8);
  color: #333;
  padding: 4px 8px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  animation: carryFloat 2s ease-in-out infinite;
  animation-delay: var(--delay, 0s);
}

@keyframes carryFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

.carry-icon {
  font-size: 14px;
}

.carry-float-enter-active, .carry-float-leave-active {
  transition: all 0.4s ease;
}

.carry-float-enter-from, .carry-float-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.8);
}

.robot-move-enter-active, .robot-move-leave-active {
  transition: all 0.8s ease;
}

.robot-move-enter-from, .robot-move-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Movement Trail */
.movement-trail {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 50;
}

.trail-animation {
  animation: trailDash 2s linear infinite;
}

@keyframes trailDash {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 24; }
}

/* Action List */
.action-list {
  background: rgba(255,255,255,0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
}

.action-list-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  position: relative;
}

.title-underline {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, #FFD700, transparent);
  border-radius: 1px;
}

.actions-container {
  max-height: 300px;
  overflow-y: auto;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  margin: 5px 0;
  border-radius: 10px;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.05);
}

.action-item.current {
  background: linear-gradient(90deg, rgba(255,215,0,0.3), rgba(255,215,0,0.1));
  border-left: 4px solid #FFD700;
  transform: translateX(5px);
}

.action-item.done {
  background: linear-gradient(90deg, rgba(76,175,80,0.2), rgba(76,175,80,0.1));
  border-left: 4px solid #4CAF50;
  opacity: 0.8;
}

.action-item.upcoming {
  opacity: 0.6;
}

.time {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #FFD700;
  min-width: 50px;
}

.action {
  font-weight: bold;
  color: #00BFFF;
  min-width: 80px;
}

.params {
  font-family: 'Courier New', monospace;
  flex: 1;
  color: rgba(255,255,255,0.8);
}

.action-status {
  display: flex;
  align-items: center;
}

.status-icon {
  font-size: 16px;
}

.current-icon {
  animation: statusPulse 1s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.action-slide-enter-active, .action-slide-leave-active {
  transition: all 0.3s ease;
}

.action-slide-enter-from, .action-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .robot-simulator {
    padding: 10px;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .plan-info {
    flex-direction: column;
  }
  
  .simulation-area {
    padding: 20px;
    min-height: 400px;
  }
  
  .room {
    width: 200px;
    height: 140px;
  }
  
  .action-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
.robot-simulator {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
  overflow-x: auto;
}

/* Success Message */
.success-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  padding: 15px 25px;
  border-radius: 15px;
  font-weight: bold;
  z-index: 1000;
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.4);
  border: 3px solid rgba(255,255,255,0.3);
}

.success-popup-enter-active, .success-popup-leave-active {
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.success-popup-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.8);
}

.success-popup-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.8);
}

/* Particle System */
.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  transition: all 0.1s ease-out;
}

.particle.pickup {
  background: radial-gradient(circle, #f1c40f, #f39c12);
  box-shadow: 0 0 15px rgba(241, 196, 15, 0.6);
}

.particle.movement {
  background: radial-gradient(circle, #3498db, #2980b9);
  box-shadow: 0 0 15px rgba(52, 152, 219, 0.6);
}

.particle.success {
  background: radial-gradient(circle, #27ae60, #2ecc71);
  box-shadow: 0 0 15px rgba(39, 174, 96, 0.6);
}

.particle.energy {
  background: radial-gradient(circle, #9b59b6, #8e44ad);
  box-shadow: 0 0 20px rgba(155, 89, 182, 0.8);
}

/* Controls */
.controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.18);
}

.btn {
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 16px;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s;
}

.btn:hover:not(:disabled)::before {
  left: 100%;
}

.play-btn { 
  background: linear-gradient(135deg, #27ae60, #2ecc71, #58d68d);
  color: white;
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
}

.stop-btn { 
  background: linear-gradient(135deg, #e74c3c, #c0392b, #ec7063);
  color: white;
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.reset-btn { 
  background: linear-gradient(135deg, #f39c12, #e67e22, #f8c471);
  color: white;
  box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
}

.btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 25px rgba(0,0,0,0.25);
}

.btn:active:not(:disabled) {
  transform: translateY(-1px) scale(1.02);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-left: auto;
  padding-left: 25px;
  border-left: 3px solid rgba(102, 126, 234, 0.3);
}

.speed-control label {
  font-weight: bold;
  color: #2c3e50;
  font-size: 16px;
}

.speed-slider {
  width: 120px;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #667eea, #764ba2);
  outline: none;
  appearance: none;
  cursor: pointer;
}

.speed-slider::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  border: 3px solid white;
  transition: all 0.3s ease;
}

.speed-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.speed-control span {
  font-weight: bold;
  color: #667eea;
  min-width: 40px;
  font-size: 18px;
}

/* Plan Info */
.plan-info {
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85));
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 25px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.18);
}

.info-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.info-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: rotate(45deg);
  transition: all 0.6s;
  opacity: 0;
}

.info-card:hover::before {
  opacity: 1;
  top: -20%;
  left: -20%;
}

.info-card:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.info-number {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.info-label {
  font-size: 14px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.current-action {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  padding: 20px;
  border-radius: 15px;
  margin-top: 10px;
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { 
    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);
  }
  50% { 
    box-shadow: 0 6px 25px rgba(231, 76, 60, 0.5);
    transform: scale(1.02);
  }
}

.action-header {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.action-details {
  font-size: 16px;
  opacity: 0.95;
  font-family: 'Courier New', monospace;
}

/* Simulation Area */
.simulation-area {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 3px solid rgba(255,255,255,0.2);
  border-radius: 25px;
  min-height: 600px;
  margin-bottom: 25px;
  overflow: hidden;
  box-shadow: inset 0 4px 15px rgba(0,0,0,0.1);
}

/* Background Effects */
.background-effects {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.floating-orb {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  animation: float-orb var(--duration, 10s) ease-in-out infinite;
  animation-delay: var(--delay, 0s);
}

.floating-orb:nth-child(1) {
  top: 10%;
  left: 20%;
  width: 80px;
  height: 80px;
}

.floating-orb:nth-child(2) {
  top: 60%;
  right: 15%;
  width: 120px;
  height: 120px;
}

.floating-orb:nth-child(3) {
  bottom: 20%;
  left: 50%;
  width: 60px;
  height: 60px;
}

@keyframes float-orb {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.3;
  }
  25% {
    transform: translateY(-20px) rotate(90deg);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-40px) rotate(180deg);
    opacity: 0.7;
  }
  75% {
    transform: translateY(-20px) rotate(270deg);
    opacity: 0.5;
  }
}

/* Rooms */
.room {
  position: absolute;
  width: 240px;
  height: 180px;
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85));
  backdrop-filter: blur(20px);
  border: 3px solid rgba(52, 73, 94, 0.3);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.room::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  animation: rotate-bg 10s linear infinite;
  opacity: 0;
  transition: opacity 0.5s;
}

.room.active::before {
  opacity: 1;
}

@keyframes rotate-bg {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.room.active {
  border-color: #e74c3c;
  background: linear-gradient(135deg, rgba(255,230,230,0.95), rgba(255,204,204,0.85));
  transform: scale(1.08);
  box-shadow: 0 12px 40px rgba(231, 76, 60, 0.3);
  z-index: 10;
}

.room-pulse {
  animation: room-pulse 1.5s ease-in-out infinite;
}

@keyframes room-pulse {
  0%, 100% { 
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  }
  50% { 
    box-shadow: 0 8px 32px rgba(231, 76, 60, 0.4);
  }
}

.room-title {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 15px;
  text-align: center;
  color: #2c3e50;
  background: linear-gradient(135deg, rgba(236, 240, 241, 0.8), rgba(189, 195, 199, 0.8));
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.room-icon {
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.active-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
}

.pulse-ring {
  position: absolute;
  border: 2px solid #e74c3c;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: pulse-ring 1.5s ease-out infinite;
}

.pulse-ring.delay-1 {
  animation-delay: 0.5s;
}

.pulse-ring.delay-2 {
  animation-delay: 1s;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

.room-objects {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 100px;
  overflow-y: auto;
}

/* Object Transitions */
.object-move-enter-active, .object-move-leave-active {
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.object-move-enter-from {
  opacity: 0;
  transform: translateY(-30px) scale(0.8);
}

.object-move-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.8);
}

.object-move-move {
  transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.object {
  background: linear-gradient(135deg, #27ae60, #2ecc71, #58d68d);
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: bold;
  text-align: center;
  font-size: 14px;
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px solid rgba(255,255,255,0.3);
}

.object:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.4);
}

.object-bounce {
  animation: object-bounce 2s ease-in-out infinite;
}

@keyframes object-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.object-icon {
  font-size: 16px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

/* Robot */
.robot-move-enter-active, .robot-move-leave-active {
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.robot-move-enter-from, .robot-move-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(180deg);
}

.robot {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  transform: translate(-50%, -50%);
}

.robot-icon {
  position: relative;
  font-size: 80px;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,0.4));
  animation: robot-idle 3s ease-in-out infinite;
}

.robot-charging .robot-icon {
  animation: robot-charging 1s ease-in-out infinite;
}

.robot-moving .robot-icon {
  animation: robot-moving 0.5s ease-in-out infinite;
}

@keyframes robot-idle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
}

@keyframes robot-charging {
  0%, 100% { 
    transform: translateY(0) scale(1);
    filter: drop-shadow(0 8px 20px rgba(155, 89, 182, 0.4));
  }
  50% { 
    transform: translateY(-5px) scale(1.1);
    filter: drop-shadow(0 12px 30px rgba(155, 89, 182, 0.8));
  }
}

@keyframes robot-moving {
  0%, 100% { transform: translateY(0) rotateX(0deg); }
  25% { transform: translateY(-8px) rotateX(10deg); }
  75% { transform: translateY(-8px) rotateX(-10deg); }
}

.charging-bolt {
  position: absolute;
  top: -20px;
  right: -20px;
  font-size: 40px;
  animation: bolt-spin 1s linear infinite;
  filter: drop-shadow(0 0 10px rgba(241, 196, 15, 0.8));
}

@keyframes bolt-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.robot-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.2), transparent);
  animation: glow-pulse 2s ease-in-out infinite;
  z-index: -1;
}

@keyframes glow-pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.6;
  }
}

.robot-name {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 8px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 16px;
  margin-top: 10px;
  border: 3px solid rgba(255,255,255,0.3);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

/* Carrying Objects */
.carry-float-enter-active, .carry-float-leave-active {
  transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.carry-float-enter-from {
  opacity: 0;
  transform: translateY(50px) scale(0.5) rotate(180deg);
}

.carry-float-leave-to {
  opacity: 0;
  transform: translateY(-50px) scale(0.5) rotate(-180deg);
}

.carry-float-move {
  transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.carrying {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 110;
  align-items: center;
}

.carried-object {
  background: linear-gradient(135deg, #f39c12, #e67e22, #f8c471);
  color: white;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
  border: 2px solid rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  gap: 6px;
  animation: carry-float 2s ease-in-out infinite;
  animation-delay: var(--delay, 0s);
}

@keyframes carry-float {
  0%, 100% { 
    transform: translateY(0) rotate(0deg);
  }
  50% { 
    transform: translateY(-8px) rotate(2deg);
  }
}

.carry-icon {
  font-size: 16px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

/* Movement Trail */
.movement-trail {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 50;
}

.trail-animation {
  stroke-dashoffset: 20;
  animation: trail-dash 2s linear infinite;
}

@keyframes trail-dash {
  to {
    stroke-dashoffset: 0;
  }
}

/* Action List */
.action-list {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  max-height: 500px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.18);
}

.action-list-title {
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 24px;
  display: flex;
  align-items: center;
  gap: 15px;
  font-weight: bold;
}

.title-underline {
  flex: 1;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.title-underline::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  animation: shine 2s ease-in-out infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.actions-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Action Transitions */
.action-slide-enter-active, .action-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-slide-enter-from {
  opacity: 0;
  transform: translateX(-50px) scale(0.9);
}

.action-slide-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}

.action-slide-move {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  border-radius: 15px;
  margin-bottom: 5px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.action-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.6s;
}

.action-item.current::before {
  left: 100%;
}

.action-item.current {
  background: linear-gradient(135deg, #3498db, #2980b9, #5dade2);
  color: white;
  transform: translateX(20px) scale(1.03);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
  border-color: #2980b9;
  z-index: 2;
}

.action-item.done {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  opacity: 0.7;
  color: white;
  transform: scale(0.98);
}

.action-item.upcoming {
  background: linear-gradient(135deg, #ecf0f1, #bdc3c7);
  color: #2c3e50;
  border-color: rgba(189, 195, 199, 0.3);
}

.action-item.upcoming:hover {
  background: linear-gradient(135deg, #d5dbdb, #aeb6bf);
  transform: translateX(5px) scale(1.01);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.time {
  font-weight: bold;
  min-width: 60px;
  color: #e74c3c;
  text-align: right;
  font-size: 16px;
}

.action-item.current .time {
  color: #ecf0f1;
}

.action-item.done .time {
  color: rgba(255,255,255,0.8);
}

.action {
  font-weight: bold;
  min-width: 100px;
  text-transform: uppercase;
  color: #2c3e50;
  font-size: 16px;
  letter-spacing: 1px;
}

.action-item.current .action {
  color: white;
}

.action-item.done .action {
  color: rgba(255,255,255,0.9);
}

.params {
  color: #7f8c8d;
  flex: 1;
  font-size: 14px;
}

.action-item.current .params {
  color: rgba(255,255,255,0.9);
}

.action-item.done .params {
  color: rgba(255,255,255,0.7);
}

.action-status {
  min-width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.status-icon {
  font-size: 20px;
  transition: all 0.3s ease;
}

.current-icon {
  animation: pulse-icon 1.5s ease-in-out infinite;
}

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.done-icon {
  animation: check-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes check-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.upcoming-icon {
  opacity: 0.5;
  animation: pending-spin 3s linear infinite;
}

@keyframes pending-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Scrollbar styling */
.actions-container::-webkit-scrollbar {
  width: 12px;
}

.actions-container::-webkit-scrollbar-track {
  background: rgba(241, 241, 241, 0.5);
  border-radius: 6px;
}

.actions-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #bdc3c7, #95a5a6);
  border-radius: 6px;
  border: 2px solid rgba(255,255,255,0.3);
}

.actions-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
}

/* Responsive Design */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .speed-control {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    border-top: 2px solid rgba(102, 126, 234, 0.3);
    padding-top: 15px;
  }
  
  .plan-info {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
  
  .room {
    width: 200px;
    height: 150px;
    padding: 15px;
  }
  
  .action-item {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}
</style>