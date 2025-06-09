<template>
  <div class="robot-simulator" :data-pddl="pddlType">
    <!-- Success Message -->
    <transition name="success-popup">
      <div v-if="showSuccess" class="success-message">
        🎉 Task Completed Successfully!
      </div>
    </transition>

    <!-- Particle System -->
    <div class="particle-container">
      <div 
        v-for="particle in particles" 
        :key="particle.id"
        class="particle"
        :style="particle.style"
      ></div>
    </div>

    <!-- Control Panel -->
    <div class="control-panel">
      <div class="panel-header">
        <h2 class="panel-title">
          <span class="title-icon">🤖</span>
          Robot Control Center
          <span class="pddl-type-badge" :class="`pddl-${pddlType || 'classical'}`">{{ (pddlType || 'classical').toUpperCase() }}</span>
        </h2>
      </div>

      <!-- Playback Controls -->
      <div class="playback-controls">
        <button 
          @click="togglePlayback" 
          class="control-btn primary"
          :disabled="!parsedActions?.length"
        >
          <span v-if="isPlaying">⏸️</span>
          <span v-else>▶️</span>
          {{ isPlaying ? 'Pause' : 'Play' }}
        </button>
        
        <button @click="resetSimulation" class="control-btn secondary">
          🔄 Reset
        </button>
        
        <button @click="stepForward" class="control-btn secondary" :disabled="isPlaying">
          ⏭️ Step
        </button>
      </div>

      <!-- Progress Section -->
      <div class="progress-section">
        <div class="progress-info">
          <span class="step-counter">Step {{ currentStep }} of {{ parsedActions?.length || 0 }}</span>
          <span class="duration-info" v-if="totalDuration && totalDuration > 0">
            Duration: {{ totalDuration.toFixed(1) }}s
          </span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Speed Control -->
      <div class="speed-control">
        <label class="speed-label">⏱️ Speed:</label>
        <input 
          v-model="playbackSpeed" 
          type="range" 
          min="0.5" 
          max="3" 
          step="0.5" 
          class="speed-slider"
        >
        <span class="speed-value">{{ playbackSpeed }}x</span>
      </div>

      <!-- Current Action -->
      <div v-if="currentAction" class="current-action-panel">
        <div class="action-header">
          <span class="action-icon">⚡</span>
          <span class="action-name">{{ (currentAction.name || '').toUpperCase() }}</span>
          <span class="action-timing">
            <template v-if="pddlType === 'temporal'">
              Duration: {{ currentAction.duration?.toFixed(1) || '1.0' }}s
            </template>
            <template v-else-if="pddlType === 'pddl+' && currentAction.isWaiting">
              Waiting: {{ currentAction.duration?.toFixed(1) || '1.0' }}s
            </template>
            <template v-else-if="pddlType === 'pddl+' && currentAction.isProcess">
              Process: {{ currentAction.duration?.toFixed(1) || '1.0' }}s
            </template>
            <template v-else-if="pddlType === 'numerical'">
              Cost: {{ currentAction.cost || 1 }} | {{ currentAction.duration?.toFixed(1) || '1.0' }}s
            </template>
            <template v-else>
              {{ currentAction.duration?.toFixed(1) || '1.0' }}s
            </template>
          </span>
        </div>
        
        <div class="action-details">
          <div class="action-description">{{ currentAction.raw || currentAction.name || '' }}</div>
          
          <!-- Show PDDL-specific information -->
          <div v-if="pddlType === 'pddl+' && currentAction.isWaiting" class="pddl-info waiting-info">
            ⏳ Waiting Phase - Robot paused for {{ currentAction.duration }}s
          </div>
          <div v-else-if="pddlType === 'temporal'" class="pddl-info temporal-info">
            ⏱️ Temporal Action - Start: {{ currentAction.start }}s, End: {{ currentAction.end }}s
          </div>
          <div v-else-if="pddlType === 'numerical'" class="pddl-info numerical-info">
            💰 Cost: {{ currentAction.cost }} | 🚀 Step: {{ currentAction.step }}
          </div>
          
          <div class="action-progress-container">
            <div class="action-progress-bar">
              <div 
                class="action-progress-fill" 
                :style="{ width: `${actionProgress}%` }"
              ></div>
            </div>
            <span class="progress-text">{{ actionProgress?.toFixed(0) || '0' }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Visualization Area -->
    <div class="visualization-area">
      <!-- No Actions Message -->
      <div v-if="!parsedActions?.length" class="no-actions-message">
        <div class="message-icon">🤖</div>
        <h3>No Robot Actions Found</h3>
        <p>Please check that your plan file contains valid robot actions like:</p>
        <ul>
          <li><code>pick ball1 rooma wally</code></li>
          <li><code>move wally rooma roomb</code></li>
          <li><code>drop ball1 roomb wally</code></li>
        </ul>
      </div>

      <!-- Room Grid with Movement Visualization -->
      <div v-if="parsedActions?.length" class="room-grid-container">
        <div class="room-grid">
          <div 
            v-for="room in planRooms" 
            :key="room"
            class="room-cell"
            :class="{ 
              'active': getRobotsInRoom(room).length > 0,
              'has-moving-robot': hasMovingRobotInRoom(room)
            }"
            :ref="`room-${room}`"
          >
            <div class="room-header">
              <h3 class="room-name">🏠 {{ (room || '').toUpperCase() }}</h3>
            </div>
            
            <!-- Objects in Room -->
            <div class="room-objects">
              <div 
                v-for="obj in getObjectsInRoom(room)" 
                :key="obj"
                class="object-item"
                :class="{ 'carried': isObjectCarried(obj) }"
              >
                <span class="object-icon">{{ getObjectIcon(obj) }}</span>
                <span class="object-name">{{ obj || '' }}</span>
              </div>
            </div>

            <!-- Robots in Room (only show if not moving) -->
            <div class="room-robots">
              <div 
                v-for="robot in getRobotsInRoom(room)" 
                :key="`${robot}-${room}`"
                v-show="!isRobotMoving(robot)"
                class="robot-container"
              >
                <!-- Robot Figure -->
                <div class="robot-figure" 
                     :class="{ 
                       'holding': getRobotCarrying(robot).length > 0
                     }">
                  
                  <!-- Robot Head -->
                  <div class="robot-head">
                    <div class="robot-eyes"></div>
                  </div>
                  
                  <!-- Robot Body -->
                  <div class="robot-body">
                    <div class="activity-light"></div>
                  </div>
                  
                  <!-- Robot Arms -->
                  <div class="robot-arm left"></div>
                  <div class="robot-arm right"></div>
                  
                  <!-- Robot Legs -->
                  <div class="robot-leg left"></div>
                  <div class="robot-leg right"></div>
                  
                  <!-- Carried Objects in Robot's Hands -->
                  <div v-if="getRobotCarrying(robot).length > 0" class="robot-hands">
                    <div class="hand left-hand">
                      <div v-if="getRobotCarrying(robot)[0]" class="carried-object-in-hand">
                        <span class="object-icon">{{ getObjectIcon(getRobotCarrying(robot)[0]) }}</span>
                      </div>
                    </div>
                    <div class="hand right-hand">
                      <div v-if="getRobotCarrying(robot)[1]" class="carried-object-in-hand">
                        <span class="object-icon">{{ getObjectIcon(getRobotCarrying(robot)[1]) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Robot Info -->
                <div class="robot-info">
                  <div class="robot-name">{{ (robot || '').toUpperCase() }}</div>
                  <div class="robot-status">
                    <div v-if="getRobotCarrying(robot).length > 0" class="status-carrying">
                      🤏 Carrying: {{ getRobotCarrying(robot).join(', ') }}
                    </div>
                    <div v-else class="status-idle">
                      😴 Waiting
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Moving Robots Overlay -->
        <div class="moving-robots-overlay">
          <div 
            v-for="robot in getMovingRobots()" 
            :key="`moving-${robot}`"
            class="moving-robot"
            :style="getMovingRobotStyle(robot)"
          >
            <div class="robot-figure moving-figure" 
                 :class="{ 
                   'holding': getRobotCarrying(robot).length > 0,
                   'walking': true
                 }">
              
              <!-- Robot Head -->
              <div class="robot-head">
                <div class="robot-eyes eyes-focused"></div>
                <div class="movement-indicator">
                  <div class="movement-arrow">➡️</div>
                </div>
              </div>
              
              <!-- Robot Body -->
              <div class="robot-body">
                <div class="activity-light active"></div>
              </div>
              
              <!-- Robot Arms -->
              <div class="robot-arm left arm-swinging"></div>
              <div class="robot-arm right arm-swinging"></div>
              
              <!-- Robot Legs -->
              <div class="robot-leg left leg-walking"></div>
              <div class="robot-leg right leg-walking"></div>
              
              <!-- Carried Objects in Moving Robot's Hands -->
              <div v-if="getRobotCarrying(robot).length > 0" class="robot-hands">
                <div class="hand left-hand moving-hand">
                  <div v-if="getRobotCarrying(robot)[0]" class="carried-object-in-hand moving-object">
                    <span class="object-icon">{{ getObjectIcon(getRobotCarrying(robot)[0]) }}</span>
                  </div>
                </div>
                <div class="hand right-hand moving-hand">
                  <div v-if="getRobotCarrying(robot)[1]" class="carried-object-in-hand moving-object">
                    <span class="object-icon">{{ getObjectIcon(getRobotCarrying(robot)[1]) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Movement Progress Bar with PDDL-specific information -->
              <div v-if="isRobotMoving(robot)" class="movement-progress-bar">
                <div class="movement-progress-fill" 
                     :style="{ width: `${getRobotMovementProgress(robot) * 100}%` }"></div>
              </div>
              
              <!-- PDDL-specific delivery time information -->
              <div v-if="isRobotMoving(robot)" class="delivery-time-info" 
                   :class="`delivery-${pddlType}`">
                <template v-if="pddlType === 'temporal'">
                  <div class="temporal-timing">
                    ⏱️ Delivery Time: {{ getCurrentActionForRobot(robot)?.duration?.toFixed(1) || '1.0' }}s
                    <div class="temporal-schedule">
                      Start: {{ getCurrentActionForRobot(robot)?.start?.toFixed(1) || '0.0' }}s | 
                      End: {{ getCurrentActionForRobot(robot)?.end?.toFixed(1) || '1.0' }}s
                    </div>
                  </div>
                </template>
                
                <template v-else-if="pddlType === 'pddl+'">
                  <div class="pddl-plus-timing">
                    <div v-if="getCurrentActionForRobot(robot)?.isProcess">
                      🔄 Process: {{ getCurrentActionForRobot(robot)?.duration?.toFixed(1) || '1.0' }}s
                    </div>
                    <div v-else-if="getCurrentActionForRobot(robot)?.isWaiting">
                      ⏳ Waiting: {{ getCurrentActionForRobot(robot)?.duration?.toFixed(1) || '1.0' }}s
                    </div>
                    <div v-else>
                      ⚡ Event: {{ getCurrentActionForRobot(robot)?.duration?.toFixed(1) || '1.0' }}s
                    </div>
                  </div>
                </template>
                
                <template v-else-if="pddlType === 'numerical'">
                  <div class="numerical-timing">
                    💰 Cost: {{ getCurrentActionForRobot(robot)?.cost || 1 }}
                    <div class="fuel-indicator">
                      ⛽ Fuel: {{ getRobotFuel(robot) }}%
                    </div>
                  </div>
                </template>
                
                <template v-else>
                  <div class="classical-timing">
                    🚀 Moving: {{ getCurrentActionForRobot(robot)?.duration?.toFixed(1) || '1.0' }}s
                  </div>
                </template>
              </div>
            </div>
            
            <!-- Moving Robot Info -->
            <div class="moving-robot-info">
              <div class="robot-name-moving">{{ (robot || '').toUpperCase() }}</div>
              <div class="movement-status">
                🚶‍♂️ Moving to {{ robotTargetRooms[robot] || 'Unknown' }}... 
                {{ Math.round((getRobotMovementProgress(robot) || 0) * 100) }}%
              </div>
              
              <!-- PDDL-specific status information -->
              <div class="pddl-status" :class="`status-${pddlType}`">
                <template v-if="pddlType === 'temporal'">
                  <div class="temporal-status">
                    ⏰ Scheduled Action | Makespan: {{ getTotalMakespan() }}s
                  </div>
                </template>
                
                <template v-else-if="pddlType === 'pddl+'">
                  <div class="pddl-plus-status">
                    🔄 Continuous Process | Elapsed: {{ getElapsedTime() }}s
                  </div>
                </template>
                
                <template v-else-if="pddlType === 'numerical'">
                  <div class="numerical-status">
                    📊 Efficiency: {{ getEfficiencyScore() }}% | Total Cost: {{ totalCost }}
                  </div>
                </template>
                
                <template v-else>
                  <div class="classical-status">
                    📝 Step {{ currentStep }} of {{ parsedActions?.length || 0 }}
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Panel -->
    <div class="stats-panel">
      <h3 class="stats-title">📊 Simulation Statistics</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Total Actions:</span>
          <span class="stat-value">{{ parsedActions?.length || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Completed:</span>
          <span class="stat-value">{{ currentStep }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Robots:</span>
          <span class="stat-value">{{ planRobots?.length || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Objects:</span>
          <span class="stat-value">{{ planObjects?.length || 0 }}</span>
        </div>
        <div v-if="totalCost > 0" class="stat-item">
          <span class="stat-label">Total Cost:</span>
          <span class="stat-value">{{ totalCost }}</span>
        </div>
        <div v-if="totalDuration && totalDuration > 0" class="stat-item">
          <span class="stat-label">Duration:</span>
          <span class="stat-value">{{ totalDuration.toFixed(1) }}s</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Import the robot simulator logic
import { createRobotSimulator } from './robotSimulator.js'

export default {
  name: 'RobotSimulator',
  props: {
    actions: {
      type: [Array, String],
      default: () => []
    },
    entities: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const pddlType = props.entities?.pddlType || 'classical'
    
    console.log('🚀 RobotSimulator setup:', {
      actionsType: typeof props.actions,
      actionsLength: Array.isArray(props.actions) ? props.actions.length : 'string length: ' + (typeof props.actions === 'string' ? props.actions.length : 'unknown'),
      pddlType,
      entities: props.entities
    })
    
    const simulatorProps = {
      ...props,
      pddlType
    }
    
    const simulator = createRobotSimulator(simulatorProps)
    
    // Helper functions for smooth movement visualization
    const hasMovingRobotInRoom = (room) => {
      return simulator.planRobots.value.some(robot => {
        if (simulator.isRobotMoving(robot)) {
          const targetRoom = simulator.robotTargetRooms?.value[robot]
          const startRoom = simulator.robotStartRooms?.value[robot]
          return room === targetRoom || room === startRoom
        }
        return false
      })
    }
    
    // Get robots that are currently moving
    const getMovingRobots = () => {
      return simulator.planRobots.value.filter(robot => simulator.isRobotMoving(robot))
    }
    
    // Calculate position for moving robot based on progress between rooms
    const getMovingRobotStyle = (robot) => {
      if (!simulator.isRobotMoving(robot)) {
        return { display: 'none' }
      }
      
      const progress = simulator.getRobotMovementProgress(robot)
      const startRoom = simulator.robotStartRooms?.value[robot]
      const targetRoom = simulator.robotTargetRooms?.value[robot]
      
      if (!startRoom || !targetRoom) {
        return { display: 'none' }
      }
      
      console.log(`🎯 Moving ${robot}: ${startRoom} → ${targetRoom} (${Math.round(progress * 100)}%)`)
      
      // Get room positions based on actual room layout (adjust based on your grid)
      const roomPositions = {}
      const rooms = simulator.planRooms.value
      
      // Calculate positions dynamically based on room grid
      rooms.forEach((room, index) => {
        const roomsPerRow = Math.min(3, rooms.length) // Max 3 rooms per row
        const row = Math.floor(index / roomsPerRow)
        const col = index % roomsPerRow
        
        roomPositions[room] = {
          x: 20 + (col * 30), // Spread rooms horizontally
          y: 20 + (row * 40)  // Stack rows vertically
        }
      })
      
      console.log(`📍 Room positions:`, roomPositions)
      console.log(`🚀 ${robot} moving from ${startRoom} (${roomPositions[startRoom]?.x}, ${roomPositions[startRoom]?.y}) to ${targetRoom} (${roomPositions[targetRoom]?.x}, ${roomPositions[targetRoom]?.y})`)
      
      const startPos = roomPositions[startRoom] || { x: 20, y: 20 }
      const targetPos = roomPositions[targetRoom] || { x: 80, y: 20 }
      
      // Calculate interpolated position
      const currentX = startPos.x + (targetPos.x - startPos.x) * progress
      const currentY = startPos.y + (targetPos.y - startPos.y) * progress
      
      console.log(`📐 Calculated position: (${currentX}, ${currentY})`)
      
      return {
        position: 'absolute',
        left: `${currentX}%`,
        top: `${currentY}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        transition: 'none' // We're manually animating
      }
    }
    
    return {
      ...simulator,
      pddlType,
      hasMovingRobotInRoom,
      getMovingRobots,
      getMovingRobotStyle
    }
  }
}
</script>

<style src="./robotSimulator.css" scoped></style>