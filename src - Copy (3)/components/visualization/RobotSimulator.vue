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
            Duration: {{ totalDuration.toFixed(1) }}{{ pddlType === 'classical' ? ' steps' : 's' }}
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
        </div>
      </div>

      <!-- Robot Status Panel - NEW! -->
      <div v-if="planRobots?.length" class="robot-status-panel">
        <h3 class="status-title">
          <span class="status-icon">🤖</span>
          Robot Status
        </h3>
        <div class="robots-status-grid">
          <div 
            v-for="robot in planRobots" 
            :key="robot"
            class="robot-status-card"
            :class="{ 
              'active': activeRobots.has(robot),
              'moving': isRobotMoving(robot),
              'charging': isRobotCharging(robot)
            }"
          >
            <div class="robot-status-header">
              <span class="robot-status-name">{{ robot.toUpperCase() }}</span>
              <span class="robot-status-state">
                <span v-if="isRobotCharging(robot)" class="status-charging">🔋 Charging</span>
                <span v-else-if="isRobotMoving(robot)" class="status-moving">🚶‍♂️ Moving</span>
                <span v-else-if="activeRobots.has(robot)" class="status-working">⚙️ Working</span>
                <span v-else class="status-idle">😴 Idle</span>
              </span>
            </div>

            <!-- Energy System Display -->
            <div v-if="getRobotCapabilities(robot).hasEnergySystem" class="energy-system">
              <div class="energy-header">
                <span class="energy-label">🔋 Energy</span>
                <span class="energy-value">{{ getRobotEnergy(robot).toFixed(0) }}/{{ getRobotMaxEnergy(robot) }}</span>
              </div>
              <div class="energy-bar">
                <div 
                  class="energy-fill" 
                  :class="{ 
                    'low-energy': getRobotEnergy(robot) < getRobotMaxEnergy(robot) * 0.3,
                    'charging': isRobotCharging(robot)
                  }"
                  :style="{ width: `${(getRobotEnergy(robot) / getRobotMaxEnergy(robot)) * 100}%` }"
                ></div>
              </div>
            </div>

            <!-- Fuel System Display (Logistics) -->
            <div v-if="getRobotCapabilities(robot).hasFuelSystem" class="fuel-system">
              <div class="fuel-header">
                <span class="fuel-label">⛽ Fuel</span>
                <span class="fuel-value">{{ getRobotFuel(robot).toFixed(0) }}</span>
              </div>
              <div class="fuel-bar">
                <div 
                  class="fuel-fill" 
                  :class="{ 'low-fuel': getRobotFuel(robot) < 100 }"
                  :style="{ width: `${Math.min(100, getRobotFuel(robot))}%` }"
                ></div>
              </div>
            </div>

            <!-- Carrying Capacity Display -->
            <div class="capacity-system">
              <div class="capacity-header">
                <span class="capacity-label">🎒 Capacity</span>
                <span class="capacity-value">{{ getRobotCapacity(robot) }}/{{ getRobotMaxCapacity(robot) }}</span>
              </div>
              <div class="capacity-bar">
                <div 
                  class="capacity-fill" 
                  :class="{ 'full-capacity': getRobotCapacity(robot) >= getRobotMaxCapacity(robot) }"
                  :style="{ width: `${(getRobotCapacity(robot) / getRobotMaxCapacity(robot)) * 100}%` }"
                ></div>
              </div>
              <div v-if="getRobotCarrying(robot).length > 0" class="carrying-items">
                <span 
                  v-for="item in getRobotCarrying(robot)" 
                  :key="item"
                  class="carrying-item"
                >
                  {{ getObjectIcon(item) }} {{ item }}
                </span>
              </div>
            </div>

            <!-- Movement Speed Display -->
            <div class="speed-system">
              <div class="speed-header">
                <span class="speed-label">🏃‍♂️ Speed</span>
                <span class="speed-value">{{ getRobotCapabilities(robot).movementSpeed?.toFixed(1) || '1.0' }}s/move</span>
              </div>
              <div v-if="isRobotMoving(robot)" class="movement-progress">
                <div class="movement-bar">
                  <div 
                    class="movement-fill" 
                    :style="{ width: `${getRobotMovementProgress(robot) * 100}%` }"
                  ></div>
                </div>
                <span class="movement-text">
                  {{ robotStartRooms[robot] }} → {{ robotTargetRooms[robot] }}
                  ({{ Math.round(getRobotMovementProgress(robot) * 100) }}%)
                </span>
              </div>
            </div>

            <!-- Capabilities Summary -->
            <div class="capabilities-summary">
              <span v-if="getRobotCapabilities(robot).hasEnergySystem" class="capability-badge energy">🔋 Energy</span>
              <span v-if="getRobotCapabilities(robot).hasFuelSystem" class="capability-badge fuel">⛽ Fuel</span>
              <span v-if="getRobotCapabilities(robot).maxCarryingCapacity > 1" class="capability-badge multi-carry">🎒 Multi-carry</span>
              <span v-if="getRobotCapabilities(robot).supportsProcesses" class="capability-badge processes">🔄 Processes</span>
              <span v-if="getRobotCapabilities(robot).canMoveParallel" class="capability-badge parallel">⚡ Parallel</span>
            </div>
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

      <!-- Room Grid with Enhanced Movement Visualization -->
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

            <!-- Enhanced Robots in Room -->
            <div class="room-robots">
              <div 
                v-for="robot in getRobotsInRoom(room)" 
                :key="`${robot}-${room}`"
                v-show="!isRobotMoving(robot)"
                class="robot-container"
              >
                <!-- Enhanced Robot Figure with Status Indicators -->
                <div class="robot-figure" 
                     :class="{ 
                       'holding': getRobotCarrying(robot).length > 0,
                       'low-energy': getRobotCapabilities(robot).hasEnergySystem && getRobotEnergy(robot) < getRobotMaxEnergy(robot) * 0.3,
                       'charging': isRobotCharging(robot),
                       'overloaded': getRobotCapacity(robot) >= getRobotMaxCapacity(robot)
                     }">
                  
                  <!-- Robot Head with Status Indicators -->
                  <div class="robot-head">
                    <div class="robot-eyes" :class="{ 'low-energy-eyes': getRobotCapabilities(robot).hasEnergySystem && getRobotEnergy(robot) < 30 }"></div>
                    
                    <!-- Energy Indicator -->
                    <div v-if="getRobotCapabilities(robot).hasEnergySystem" class="energy-indicator">
                      <div class="energy-level" :style="{ width: `${(getRobotEnergy(robot) / getRobotMaxEnergy(robot)) * 100}%` }"></div>
                    </div>
                    
                    <!-- Charging Indicator -->
                    <div v-if="isRobotCharging(robot)" class="charging-indicator">⚡</div>
                  </div>
                  
                  <!-- Robot Body with Capacity Indicator -->
                  <div class="robot-body">
                    <div class="activity-light" :class="{ 'active': activeRobots.has(robot) }"></div>
                    
                    <!-- Capacity Indicator -->
                    <div v-if="getRobotMaxCapacity(robot) > 1" class="capacity-indicator">
                      <div class="capacity-dots">
                        <div 
                          v-for="n in getRobotMaxCapacity(robot)" 
                          :key="n"
                          class="capacity-dot"
                          :class="{ 'filled': n <= getRobotCapacity(robot) }"
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Robot Arms -->
                  <div class="robot-arm left"></div>
                  <div class="robot-arm right"></div>
                  
                  <!-- Robot Legs -->
                  <div class="robot-leg left"></div>
                  <div class="robot-leg right"></div>
                  
                  <!-- Enhanced Carried Objects Display -->
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
                    <!-- Additional objects indicator -->
                    <div v-if="getRobotCarrying(robot).length > 2" class="additional-objects">
                      +{{ getRobotCarrying(robot).length - 2 }}
                    </div>
                  </div>
                </div>
                
                <!-- Enhanced Robot Info with Dynamic Data -->
                <div class="robot-info">
                  <div class="robot-name">{{ (robot || '').toUpperCase() }}</div>
                  <div class="robot-status">
                    <div v-if="isRobotCharging(robot)" class="status-charging">
                      🔋 Charging ({{ getRobotEnergy(robot).toFixed(0) }}/{{ getRobotMaxEnergy(robot) }})
                    </div>
                    <div v-else-if="getRobotCarrying(robot).length > 0" class="status-carrying">
                      🤏 Carrying: {{ getRobotCarrying(robot).join(', ') }}
                      <div class="capacity-info">({{ getRobotCapacity(robot) }}/{{ getRobotMaxCapacity(robot) }})</div>
                    </div>
                    <div v-else class="status-idle">
                      😴 Waiting
                    </div>
                  </div>
                  
                  <!-- Speed Indicator -->
                  <div class="speed-info">
                    🏃‍♂️ Speed: {{ getRobotCapabilities(robot).movementSpeed?.toFixed(1) || '1.0' }}s
                  </div>
                  
                  <!-- Warning Messages -->
                  <div v-if="getRobotCapabilities(robot).hasEnergySystem && getRobotEnergy(robot) < 20" class="warning-message energy-warning">
                    ⚠️ Low Energy!
                  </div>
                  <div v-if="getRobotCapacity(robot) >= getRobotMaxCapacity(robot)" class="warning-message capacity-warning">
                    ⚠️ At Capacity!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Moving Robots Overlay with Speed Differences -->
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
                   'walking': true,
                   'fast-robot': getRobotCapabilities(robot).movementSpeed < 2.0,
                   'slow-robot': getRobotCapabilities(robot).movementSpeed > 4.0,
                   'low-energy': getRobotCapabilities(robot).hasEnergySystem && getRobotEnergy(robot) < 30
                 }">
              
              <!-- Enhanced Robot Head with Movement Indicators -->
              <div class="robot-head">
                <div class="robot-eyes eyes-focused" :class="{ 'low-energy-eyes': getRobotEnergy(robot) < 30 }"></div>
                <div class="movement-indicator">
                  <div class="movement-arrow">➡️</div>
                </div>
                
                <!-- Speed-based Movement Trail -->
                <div class="speed-trail" :class="{
                  'fast-trail': getRobotCapabilities(robot).movementSpeed < 2.0,
                  'normal-trail': getRobotCapabilities(robot).movementSpeed >= 2.0 && getRobotCapabilities(robot).movementSpeed <= 4.0,
                  'slow-trail': getRobotCapabilities(robot).movementSpeed > 4.0
                }"></div>
              </div>
              
              <!-- Robot Body with Dynamic Activity -->
              <div class="robot-body">
                <div class="activity-light active" :class="{
                  'fast-activity': getRobotCapabilities(robot).movementSpeed < 2.0,
                  'slow-activity': getRobotCapabilities(robot).movementSpeed > 4.0
                }"></div>
              </div>
              
              <!-- Speed-adjusted Robot Arms -->
              <div class="robot-arm left arm-swinging" :style="{
                'animation-duration': getRobotCapabilities(robot).movementSpeed + 's'
              }"></div>
              <div class="robot-arm right arm-swinging" :style="{
                'animation-duration': getRobotCapabilities(robot).movementSpeed + 's'
              }"></div>
              
              <!-- Speed-adjusted Robot Legs -->
              <div class="robot-leg left leg-walking" :style="{
                'animation-duration': getRobotCapabilities(robot).movementSpeed + 's'
              }"></div>
              <div class="robot-leg right leg-walking" :style="{
                'animation-duration': getRobotCapabilities(robot).movementSpeed + 's'
              }"></div>
              
              <!-- Enhanced Carried Objects in Movement -->
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
              
              <!-- Dynamic Movement Progress Bar -->
              <div v-if="isRobotMoving(robot)" class="movement-progress-bar">
                <div class="movement-progress-fill" 
                     :style="{ width: `${getRobotMovementProgress(robot) * 100}%` }"
                     :class="{
                       'fast-progress': getRobotCapabilities(robot).movementSpeed < 2.0,
                       'slow-progress': getRobotCapabilities(robot).movementSpeed > 4.0
                     }"></div>
              </div>
              
              <!-- Enhanced Movement Information with Real Capabilities -->
              <div v-if="isRobotMoving(robot)" class="delivery-time-info" 
                   :class="`delivery-${pddlType}`">
                <template v-if="pddlType === 'temporal'">
                  <div class="temporal-timing">
                    ⏱️ Move Time: {{ getRobotCapabilities(robot).movementSpeed?.toFixed(1) || '1.0' }}s
                    <div class="temporal-schedule">
                      Speed Rating: {{ getSpeedRating(getRobotCapabilities(robot).movementSpeed) }}
                    </div>
                  </div>
                </template>
                
                <template v-else-if="pddlType === 'pddl+'">
                  <div class="pddl-plus-timing">
                    <div class="process-info">
                      🔄 Process: {{ getRobotCapabilities(robot).movementSpeed?.toFixed(1) || '1.0' }}s
                    </div>
                    <div v-if="getRobotCapabilities(robot).hasEnergySystem" class="energy-consumption">
                      ⚡ Energy: {{ getRobotEnergy(robot).toFixed(0) }}/{{ getRobotMaxEnergy(robot) }}
                    </div>
                  </div>
                </template>
                
                <template v-else-if="pddlType === 'numerical'">
                  <div class="numerical-timing">
                    💰 Cost: {{ getCurrentActionForRobot(robot)?.cost || 1 }}
                    <div v-if="getRobotCapabilities(robot).hasFuelSystem" class="fuel-indicator">
                      ⛽ Fuel: {{ getRobotFuel(robot).toFixed(0) }}
                    </div>
                  </div>
                </template>
                
                <template v-else>
                  <div class="classical-timing">
                    🚀 Moving: {{ getRobotCapabilities(robot).movementSpeed?.toFixed(1) || '1.0' }}s
                  </div>
                </template>
              </div>
            </div>
            
            <!-- Enhanced Moving Robot Info with Capabilities -->
            <div class="moving-robot-info">
              <div class="robot-name-moving">{{ (robot || '').toUpperCase() }}</div>
              <div class="movement-status">
                🚶‍♂️ {{ robotStartRooms[robot] }} → {{ robotTargetRooms[robot] }}
                ({{ Math.round((getRobotMovementProgress(robot) || 0) * 100) }}%)
              </div>
              
              <!-- Real-time Capability Display -->
              <div class="capability-status" :class="`status-${pddlType}`">
                <div class="capability-row">
                  <span class="capability-label">Speed:</span>
                  <span class="capability-value">{{ getRobotCapabilities(robot).movementSpeed?.toFixed(1) || '1.0' }}s</span>
                </div>
                
                <div v-if="getRobotCapabilities(robot).hasEnergySystem" class="capability-row">
                  <span class="capability-label">Energy:</span>
                  <span class="capability-value">{{ getRobotEnergy(robot).toFixed(0) }}/{{ getRobotMaxEnergy(robot) }}</span>
                </div>
                
                <div v-if="getRobotCapabilities(robot).hasFuelSystem" class="capability-row">
                  <span class="capability-label">Fuel:</span>
                  <span class="capability-value">{{ getRobotFuel(robot).toFixed(0) }}</span>
                </div>
                
                <div class="capability-row">
                  <span class="capability-label">Load:</span>
                  <span class="capability-value">{{ getRobotCapacity(robot) }}/{{ getRobotMaxCapacity(robot) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Statistics Panel with Dynamic Capabilities -->
    <div class="stats-panel">
      <h3 class="stats-title">📊 Advanced Simulation Statistics</h3>
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
          <span class="stat-value">{{ totalDuration.toFixed(1) }}{{ pddlType === 'classical' ? ' steps' : 's' }}</span>
        </div>
        
        <!-- Dynamic Capability Statistics -->
        <div v-if="getEnergyEnabledRobots().length > 0" class="stat-item energy-stat">
          <span class="stat-label">Energy Systems:</span>
          <span class="stat-value">{{ getEnergyEnabledRobots().length }}/{{ planRobots?.length || 0 }}</span>
        </div>
        
        <div v-if="getFuelEnabledRobots().length > 0" class="stat-item fuel-stat">
          <span class="stat-label">Fuel Systems:</span>
          <span class="stat-value">{{ getFuelEnabledRobots().length }}/{{ planRobots?.length || 0 }}</span>
        </div>
        
        <div class="stat-item speed-stat">
          <span class="stat-label">Avg Speed:</span>
          <span class="stat-value">{{ getAverageSpeed().toFixed(1) }}s</span>
        </div>
        
        <div class="stat-item capacity-stat">
          <span class="stat-label">Total Capacity:</span>
          <span class="stat-value">{{ getTotalCapacity() }}</span>
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
    },
    pddlType: {
      type: String,
      default: 'classical'
    }
  },
  setup(props) {
    const pddlType = props.pddlType || 'classical'
    
    console.log('🚀 Enhanced RobotSimulator setup with dynamic capabilities:', {
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
    
    // Helper functions for enhanced movement visualization
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
    
    // Calculate position for moving robot based on progress and speed
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
      
      // Get room positions based on actual room layout
      const roomPositions = {}
      const rooms = simulator.planRooms.value
      
      // Calculate positions dynamically based on room grid
      rooms.forEach((room, index) => {
        const roomsPerRow = Math.min(3, rooms.length)
        const row = Math.floor(index / roomsPerRow)
        const col = index % roomsPerRow
        
        roomPositions[room] = {
          x: 20 + (col * 30),
          y: 20 + (row * 40)
        }
      })
      
      const startPos = roomPositions[startRoom] || { x: 20, y: 20 }
      const targetPos = roomPositions[targetRoom] || { x: 80, y: 20 }
      
      // Calculate interpolated position with speed-based adjustments
      const currentX = startPos.x + (targetPos.x - startPos.x) * progress
      const currentY = startPos.y + (targetPos.y - startPos.y) * progress
      
      return {
        position: 'absolute',
        left: `${currentX}%`,
        top: `${currentY}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        transition: 'none'
      }
    }
    
    // Helper functions for dynamic capabilities display
    const getEnergyEnabledRobots = () => {
      return simulator.planRobots.value.filter(robot => 
        simulator.getRobotCapabilities(robot).hasEnergySystem
      )
    }
    
    const getFuelEnabledRobots = () => {
      return simulator.planRobots.value.filter(robot => 
        simulator.getRobotCapabilities(robot).hasFuelSystem
      )
    }
    
    const getAverageSpeed = () => {
      const speeds = simulator.planRobots.value.map(robot => 
        simulator.getRobotCapabilities(robot).movementSpeed || 1.0
      )
      return speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 1.0
    }
    
    const getTotalCapacity = () => {
      return simulator.planRobots.value.reduce((total, robot) => 
        total + (simulator.getRobotMaxCapacity(robot) || 1), 0
      )
    }
    
    const getSpeedRating = (speed) => {
      if (speed < 2.0) return 'Fast ⚡'
      if (speed > 4.0) return 'Slow 🐌'
      return 'Normal 🚶‍♂️'
    }
    
    return {
      ...simulator,
      hasMovingRobotInRoom,
      getMovingRobots,
      getMovingRobotStyle,
      getEnergyEnabledRobots,
      getFuelEnabledRobots,
      getAverageSpeed,
      getTotalCapacity,
      getSpeedRating
    }
  }
}
</script>

<style src="./robotSimulator.css" scoped></style>