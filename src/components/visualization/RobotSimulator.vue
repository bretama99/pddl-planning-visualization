<template>
  <div class="robot-simulator">
    <!-- Controls -->
    <div class="controls">
      <button @click="playPlan" :disabled="isPlaying" class="btn play-btn">
        ▶️ Play Plan
      </button>
      <button @click="stopPlan" class="btn stop-btn">
        ⏹️ Stop
      </button>
      <button @click="resetPlan" class="btn reset-btn">
        🔄 Reset
      </button>
      <div class="speed-control">
        <label>Speed:</label>
        <input type="range" v-model="playbackSpeed" min="0.5" max="3" step="0.5" />
        <span>{{ playbackSpeed }}x</span>
      </div>
    </div>

    <!-- Plan Info -->
    <div class="plan-info">
      <div><strong>Actions:</strong> {{ actions.length }}</div>
      <div><strong>Step:</strong> {{ currentStep + 1 }} / {{ actions.length }}</div>
      <div><strong>Rooms:</strong> {{ planRooms.join(', ') }}</div>
      <div><strong>Objects:</strong> {{ planObjects.join(', ') }}</div>
      <div><strong>Robots:</strong> {{ planRobots.join(', ') }}</div>
      <div v-if="currentAction" class="current-action">
        <strong>Current:</strong> {{ currentAction.start }}s - {{ currentAction.name }} {{ currentAction.parameters }}
      </div>
    </div>

    <!-- Simulation Area -->
    <div class="simulation-area">
      <!-- Rooms -->
      <div 
        v-for="room in planRooms" 
        :key="room"
        class="room"
        :class="{ active: activeRoom === room }"
        :style="getRoomPosition(room)"
      >
        <div class="room-title">🏢 {{ room }}</div>
        
        <!-- Objects in this room -->
        <div class="room-objects">
          <div 
            v-for="obj in getObjectsInRoom(room)" 
            :key="obj"
            class="object"
          >
            ⚽ {{ obj }}
          </div>
        </div>
      </div>

      <!-- Robot -->
      <div 
        v-if="robotPosition.room"
        class="robot"
        :style="getRobotPosition()"
      >
        <div class="robot-icon">🤖</div>
        <div class="robot-name">{{ currentRobot }}</div>
        
        <!-- Carrying objects -->
        <div v-if="robotCarrying.length > 0" class="carrying">
          <div v-for="obj in robotCarrying" :key="obj" class="carried-object">
            ⚽ {{ obj }}
          </div>
        </div>
      </div>

      <!-- Movement trail -->
      <svg class="movement-trail" width="100%" height="100%">
        <path 
          v-if="movementTrail.length > 1"
          :d="getTrailPath()"
          stroke="#3498db"
          stroke-width="3"
          stroke-dasharray="5,5"
          fill="none"
          opacity="0.6"
        />
      </svg>
    </div>

    <!-- Action List -->
    <div class="action-list">
      <h4>📋 Plan Actions</h4>
      <div class="actions-container">
        <div 
          v-for="(action, index) in actions" 
          :key="index"
          class="action-item"
          :class="{ 
            current: index === currentStep,
            done: index < currentStep 
          }"
        >
          <span class="time">{{ action.start }}s</span>
          <span class="action">{{ action.name.toUpperCase() }}</span>
          <span class="params">{{ action.parameters }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'

export default {
  name: 'RobotSimulator',
  props: {
    actions: { 
      type: Array, 
      default: () => [] 
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
        
        // Remove from room location
        delete objectLocations.value[obj]
        
        // Add to robot's carrying list
        if (!robotCarrying.value.includes(obj)) {
          robotCarrying.value.push(obj)
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
        
        // Update robot position
        robotPosition.value.room = toRoom
        activeRoom.value = toRoom
        
        // Add to movement trail
        const newPos = getRobotPosition()
        movementTrail.value.push({
          x: parseInt(newPos.left),
          y: parseInt(newPos.top)
        })
        
        // Keep trail reasonable length
        if (movementTrail.value.length > 10) {
          movementTrail.value.shift()
        }
        
        // Movement animation delay
        await new Promise(resolve => setTimeout(resolve, 1200 / playbackSpeed.value))
      }
    }

    const executeDrop = async (params) => {
      // Format: drop object room robot
      const obj = params[0] // Object is first parameter
      const room = params[1] // Room is second parameter
      const robot = params[2] // Robot is third parameter
      
      if (obj && planObjects.value.includes(obj)) {
        console.log(`📤 ${robot} dropping ${obj} in ${room}`)
        
        // Remove from robot's carrying list
        const index = robotCarrying.value.indexOf(obj)
        if (index > -1) {
          robotCarrying.value.splice(index, 1)
        }
        
        // Place in target room
        objectLocations.value[obj] = room
        
        console.log(`✅ ${obj} delivered to ${room}`)
        
        // Visual feedback delay
        await new Promise(resolve => setTimeout(resolve, 800 / playbackSpeed.value))
      }
    }

    const executeCharge = async (params, type) => {
      const robot = params[0] || currentRobot.value
      console.log(`🔋 ${robot} ${type} charging`)
      
      // Visual indication of charging (could show battery icon)
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
      
      while (currentStep.value < props.actions.length && isPlaying.value) {
        await executeAction(props.actions[currentStep.value])
        currentStep.value++
        
        // Delay between actions
        await new Promise(resolve => setTimeout(resolve, 600 / playbackSpeed.value))
      }
      
      isPlaying.value = false
      console.log('🏁 Plan execution completed!')
    }

    const stopPlan = () => {
      isPlaying.value = false
      console.log('⏹️ Plan execution stopped')
    }

    const resetPlan = () => {
      isPlaying.value = false
      console.log('🔄 Resetting plan...')
      initializePlan()
    }

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

    onMounted(() => {
      console.log('🏗️ RobotSimulator mounted')
      if (props.actions.length > 0) {
        initializePlan()
      }
    })

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
      
      // Methods
      getRoomPosition,
      getRobotPosition,
      getObjectsInRoom,
      getTrailPath,
      playPlan,
      stopPlan,
      resetPlan
    }
  }
}
</script>

<style scoped>
.robot-simulator {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  background: white;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.play-btn { 
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
}

.stop-btn { 
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.reset-btn { 
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  padding-left: 20px;
  border-left: 2px solid #ecf0f1;
}

.speed-control label {
  font-weight: bold;
  color: #2c3e50;
}

.speed-control input {
  width: 100px;
}

.speed-control span {
  font-weight: bold;
  color: #3498db;
  min-width: 30px;
}

.plan-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  font-size: 14px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.current-action {
  grid-column: 1 / -1;
  background: rgba(255,255,255,0.2);
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
}

.simulation-area {
  position: relative;
  background: linear-gradient(45deg, #ecf0f1 25%, transparent 25%),
              linear-gradient(-45deg, #ecf0f1 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #ecf0f1 75%),
              linear-gradient(-45deg, transparent 75%, #ecf0f1 75%);
  background-size: 30px 30px;
  border: 4px solid #34495e;
  border-radius: 16px;
  min-height: 500px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: inset 0 4px 15px rgba(0,0,0,0.1);
}

.room {
  position: absolute;
  width: 220px;
  height: 160px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 4px solid #2c3e50;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.room.active {
  border-color: #e74c3c;
  background: linear-gradient(135deg, #ffe6e6 0%, #ffcccc 100%);
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
  z-index: 10;
}

.room-title {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 15px;
  text-align: center;
  color: #2c3e50;
  background: linear-gradient(135deg, #ecf0f1, #bdc3c7);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.room-objects {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 80px;
  overflow-y: auto;
}

.object {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  padding: 10px 15px;
  border-radius: 10px;
  font-weight: bold;
  text-align: center;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
  transition: all 0.3s ease;
}

.object:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(39, 174, 96, 0.4);
}

.robot {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
}

.robot-icon {
  font-size: 70px;
  filter: drop-shadow(0 6px 15px rgba(0,0,0,0.4));
  animation: robotBob 2s ease-in-out infinite;
}

@keyframes robotBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.robot-name {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 6px 16px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 14px;
  margin-top: 8px;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.carrying {
  position: absolute;
  top: -40px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 110;
  align-items: center;
}

.carried-object {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.4);
  border: 2px solid rgba(255,255,255,0.3);
  animation: carryFloat 1.5s ease-in-out infinite alternate;
}

@keyframes carryFloat {
  0% { transform: translateY(0); }
  100% { transform: translateY(-5px); }
}

.movement-trail {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 50;
}

.action-list {
  background: white;
  border-radius: 12px;
  padding: 25px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.action-list h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 10px;
}

.actions-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  gap: 15px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  border: 2px solid transparent;
}

.action-item.current {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  transform: translateX(15px) scale(1.02);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
  border-color: #2980b9;
}

.action-item.done {
  background: linear-gradient(135deg, #ecf0f1, #bdc3c7);
  opacity: 0.8;
  color: #7f8c8d;
}

.time {
  font-weight: bold;
  min-width: 40px;
  color: #e74c3c;
}

.action-item.current .time {
  color: #ecf0f1;
}

.action {
  font-weight: bold;
  min-width: 60px;
  text-transform: uppercase;
  color: #2c3e50;
}

.action-item.current .action {
  color: white;
}

.params {
  color: #7f8c8d;
  flex: 1;
}

.action-item.current .params {
  color: rgba(255,255,255,0.9);
}

/* Scrollbar styling */
.actions-container::-webkit-scrollbar {
  width: 8px;
}

.actions-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.actions-container::-webkit-scrollbar-thumb {
  background: #bdc3c7;
  border-radius: 4px;
}

.actions-container::-webkit-scrollbar-thumb:hover {
  background: #95a5a6;
}
</style>