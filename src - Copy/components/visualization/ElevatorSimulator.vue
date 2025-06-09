<!-- File Path: src/components/visualization/ElevatorSimulator.vue -->
<template>
  <div class="elevator-simulator" :data-pddl="pddlType">
    <!-- Floating Success Message -->
    <transition name="success-popup">
      <div v-if="showSuccess" class="success-message">
        🎉 {{ successMessage }}
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

    <!-- Background Floating Elements -->
    <div class="floating-elements">
      <div class="floating-icon" style="--delay: 0s; --duration: 8s;">🏢</div>
      <div class="floating-icon" style="--delay: 2s; --duration: 12s;">🌟</div>
      <div class="floating-icon" style="--delay: 4s; --duration: 10s;">✨</div>
      <div class="floating-icon" style="--delay: 6s; --duration: 14s;">🔔</div>
    </div>

    <!-- Header -->
    <div class="header">
      <h3 class="title">
        <span class="title-icon">🛗</span>
        <span>Elevator Simulation</span>
        <span class="pddl-type-badge" :class="`pddl-${pddlType}`">{{ pddlType.toUpperCase() }}</span>
        <div class="title-glow"></div>
      </h3>
      <div class="controls">
        <button @click="togglePlayback" :disabled="isPlaying" class="btn play-btn">
          {{ isPlaying ? '⏸️ Playing...' : '▶️ Play' }}
        </button>
        <button @click="isPlaying = false" :disabled="!isPlaying" class="btn pause-btn">⏸️ Pause</button>
        <button @click="resetSimulation" class="btn reset-btn">🔄 Reset</button>
        <div class="speed-control">
          <label>Speed:</label>
          <input type="range" v-model="playbackSpeed" min="0.5" max="3" step="0.1" class="speed-slider">
          <span class="speed-display">{{playbackSpeed}}x</span>
        </div>
      </div>
    </div>

    <!-- Debug Panel -->
    <div class="debug">
      <div class="debug-item">
        <span class="debug-label">🏢 Floors:</span>
        <span class="debug-value">{{planFloors.join(', ')}}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">🛗 Elevators:</span>
        <span class="debug-value">{{planElevators.join(', ')}}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">👥 Passengers:</span>
        <span class="debug-value">{{planPassengers.join(', ')}}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">📋 Total Actions:</span>
        <span class="debug-value">{{parsedActions.length}}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">🎯 PDDL Type:</span>
        <span class="debug-value">{{pddlType}}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">🏃 Current Step:</span>
        <span class="debug-value">{{currentStep}}/{{parsedActions.length}}</span>
      </div>
    </div>

    <!-- Building -->
    <div class="building" :class="`building-${pddlType}`">
      <!-- Building Background Effects -->
      <div class="building-bg-effects">
        <div class="elevator-light-beam" :class="{ active: isMoving }"></div>
        <div class="building-glow" :class="{ active: doorsOpen }"></div>
        
        <!-- PDDL-specific effects -->
        <div v-if="pddlType === 'pddl+' && isCharging" class="charging-effect"></div>
        <div v-if="pddlType === 'numerical'" class="efficiency-indicator" :class="getEfficiencyClass()"></div>
        <div v-if="pddlType === 'temporal'" class="temporal-grid"></div>
      </div>
      
      <!-- Floors -->
      <transition-group name="floor-highlight" tag="div">
        <div 
          v-for="(floor, index) in planFloors" 
          :key="floor"
          class="floor"
          :class="{ 
            active: activeFloor === floor,
            'floor-pulse': activeFloor === floor && (isMoving || doorsOpen),
            [`floor-${pddlType}`]: true
          }"
          :style="{ bottom: index * 150 + 'px' }"
        >
          <div class="floor-label">
            <span class="floor-number">{{floor}}</span>
            <div v-if="activeFloor === floor" class="floor-indicator">
              <div class="indicator-ring"></div>
              <div class="indicator-ring delay-1"></div>
              <div class="indicator-ring delay-2"></div>
            </div>
          </div>
          
          <!-- Passengers waiting on floor -->
          <div class="waiting-passengers">
            <transition-group name="passenger-bounce" tag="div">
              <div 
                v-for="passenger in getWaitingPassengers(floor)" 
                :key="passenger.id"
                class="passenger-waiting"
                :class="{ 
                  'passenger-excited': passenger.state === 'delivered',
                  [`passenger-${pddlType}`]: true
                }"
              >
                <div class="passenger-avatar">
                  <span class="avatar-emoji">👤</span>
                  <div class="avatar-glow" :class="`glow-${pddlType}`"></div>
                </div>
                <div class="passenger-name">{{passenger.name}}</div>
                <div class="passenger-dest" v-if="passenger.destination">
                  <span class="dest-arrow">→</span>
                  <span>{{passenger.destination}}</span>
                </div>
                <div v-if="passenger.state === 'delivered'" class="delivery-badge">✅</div>
              </div>
            </transition-group>
          </div>
        </div>
      </transition-group>

      <!-- Elevator Shaft -->
      <div class="elevator-shaft" :class="`shaft-${pddlType}`">
        <!-- Shaft Background Pattern -->
        <div class="shaft-pattern" :class="`pattern-${pddlType}`"></div>
        
        <!-- Elevator Car -->
        <div 
          class="elevator-car"
          :class="{ 
            moving: isMoving,
            'doors-open': doorsOpen,
            'emergency-stop': emergencyStop,
            charging: isCharging,
            [`elevator-${pddlType}`]: true
          }"
          :style="{ 
            bottom: elevatorPosition + 'px',
            transition: isMoving ? `bottom ${2/playbackSpeed}s cubic-bezier(0.4, 0, 0.2, 1)` : 'none'
          }"
        >
          <!-- Elevator Exterior -->
          <div class="elevator-exterior">
            <div class="elevator-buttons">
              <div class="call-button up" :class="{ active: direction === 'up' }">⬆️</div>
              <div class="call-button down" :class="{ active: direction === 'down' }">⬇️</div>
            </div>
            
            <!-- PDDL-specific exterior indicators -->
            <div v-if="pddlType === 'numerical'" class="energy-indicator" :class="getEnergyClass()">
              ⚡ {{ currentEnergy }}%
            </div>
            <div v-if="pddlType === 'pddl+' && isCharging" class="charging-indicator">
              🔋 Charging...
            </div>
          </div>

          <!-- Elevator Interior -->
          <div class="elevator-interior" :class="`interior-${pddlType}`">
            <!-- Floor Display -->
            <div class="floor-display" :class="`display-${pddlType}`">
              <div class="display-screen">{{currentFloor}}</div>
              <div class="display-glow"></div>
              
              <!-- PDDL-specific display info -->
              <div v-if="pddlType === 'temporal' && currentAction" class="temporal-info">
                T: {{ currentAction.start?.toFixed(1) || '0.0' }}s
              </div>
              <div v-if="pddlType === 'numerical'" class="cost-display">
                ${{ totalCost }}
              </div>
            </div>
            
            <!-- Direction Arrow -->
            <transition name="direction-change">
              <div class="direction" v-if="direction">
                <span class="direction-arrow">{{direction === 'up' ? '⬆️' : '⬇️'}}</span>
                <div class="direction-glow" :class="`direction-${pddlType}`"></div>
              </div>
            </transition>
            
            <!-- Passengers inside elevator -->
            <div class="inside-passengers">
              <transition-group name="passenger-enter" tag="div">
                <div 
                  v-for="passenger in getRidingPassengers()" 
                  :key="passenger.id"
                  class="passenger-inside"
                  :class="`passenger-${pddlType}`"
                >
                  <div class="passenger-avatar">
                    <span class="avatar-emoji">👤</span>
                    <div class="riding-glow" :class="`riding-${pddlType}`"></div>
                  </div>
                  <div class="passenger-name">{{passenger.name}}</div>
                </div>
              </transition-group>
            </div>

            <!-- Elevator Interior Lights -->
            <div class="interior-lights">
              <div class="light" :class="{ on: doorsOpen, [`light-${pddlType}`]: true }"></div>
              <div class="light" :class="{ on: isMoving, [`light-${pddlType}`]: true }"></div>
              <div class="light" :class="{ on: getRidingPassengers().length > 0, [`light-${pddlType}`]: true }"></div>
              <div v-if="pddlType === 'pddl+'" class="light" :class="{ on: isCharging, [`light-${pddlType}`]: true }"></div>
            </div>
          </div>
          
          <!-- Elevator Doors -->
          <div class="doors">
            <div class="door door-left" :class="{ open: doorsOpen, [`door-${pddlType}`]: true }">
              <div class="door-handle"></div>
              <div class="door-window"></div>
            </div>
            <div class="door door-right" :class="{ open: doorsOpen, [`door-${pddlType}`]: true }">
              <div class="door-handle"></div>
              <div class="door-window"></div>
            </div>
          </div>

          <!-- Door Opening Light Effect -->
          <div class="door-light" :class="{ active: doorsOpen, [`door-light-${pddlType}`]: true }"></div>
        </div>
      </div>

      <!-- Moving Passenger Animation -->
      <transition name="passenger-move">
        <div 
          v-if="movingPassenger" 
          class="moving-passenger"
          :class="{ 
            boarding: movingPassenger.state === 'boarding',
            exiting: movingPassenger.state === 'exiting',
            [`moving-${pddlType}`]: true
          }"
          :style="movingPassengerStyle"
        >
          <div class="passenger-avatar">
            <span class="avatar-emoji">👤</span>
            <div class="moving-trail" :class="`trail-${pddlType}`"></div>
          </div>
          <div class="passenger-name">{{movingPassenger.name}}</div>
          <div class="movement-indicator">
            <span v-if="movingPassenger.state === 'boarding'">➡️</span>
            <span v-else>⬅️</span>
          </div>
        </div>
      </transition>
    </div>

    <!-- Action Timeline -->
    <div class="timeline" :class="`timeline-${pddlType}`">
      <h4 class="timeline-title">
        <span>📋 Actions Timeline ({{ pddlType.toUpperCase() }})</span>
        <div class="timeline-progress" :class="`progress-${pddlType}`" :style="{ width: progressPercentage + '%' }"></div>
      </h4>
      <div class="actions">
        <transition-group name="action-slide" tag="div">
          <div 
            v-for="(action, index) in parsedActions" 
            :key="index"
            class="action"
            :class="{ 
              current: index === currentStep,
              completed: index < currentStep,
              upcoming: index > currentStep,
              [`action-${pddlType}`]: true
            }"
          >
            <div class="action-content">
              <span class="time">{{getActionTime(action)}}</span>
              <span class="desc">{{getActionDesc(action)}}</span>
              
              <!-- PDDL-specific action info -->
              <div class="action-meta" :class="`meta-${pddlType}`">
                <template v-if="pddlType === 'temporal'">
                  <span class="duration-info">[{{ action.duration?.toFixed(1) || '1.0' }}s]</span>
                </template>
                <template v-else-if="pddlType === 'numerical'">
                  <span class="cost-info">💰{{ action.cost || 1 }}</span>
                </template>
                <template v-else-if="pddlType === 'pddl+' && action.isWaiting">
                  <span class="waiting-info">⏳{{ action.duration?.toFixed(1) || '1.0' }}s</span>
                </template>
              </div>
              
              <div class="action-status">
                <div v-if="index === currentStep" class="status-icon current-icon">▶️</div>
                <div v-else-if="index < currentStep" class="status-icon done-icon">✅</div>
                <div v-else class="status-icon upcoming-icon">⏳</div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { createElevatorSimulator } from './ElevatorSimulator.js'

export default {
  name: 'ElevatorSimulator',
  props: {
    actions: {
      type: [String, Array],
      required: true
    },
    pddlType: {
      type: String,
      default: 'classical'
    }
  },
  setup(props) {
    const simulator = createElevatorSimulator(props)
    
    // Additional computed properties for the template
    const successMessage = computed(() => {
      if (simulator.currentStep.value >= simulator.parsedActions.value.length) {
        return 'All passengers delivered successfully!'
      }
      return 'Action completed!'
    })
    
    const energyPercentage = computed(() => {
      return (simulator.currentEnergy.value / simulator.maxEnergy.value) * 100
    })
    
    const fuelPercentage = computed(() => {
      return (simulator.currentFuel.value / simulator.maxFuel.value) * 100
    })
    
    const currentFloor = computed(() => {
      const elevator = simulator.planElevators.value[0] || 'elevatorx'
      return simulator.elevatorLocations.value[elevator] || simulator.planFloors.value[0] || 'Floor1'
    })
    
    const elevatorPosition = computed(() => {
      const elevator = simulator.planElevators.value[0] || 'elevatorx'
      const currentFloor = simulator.elevatorLocations.value[elevator] || simulator.planFloors.value[0]
      const floorIndex = simulator.planFloors.value.indexOf(currentFloor)
      return floorIndex * 150 // 150px per floor
    })
    
    const isMoving = computed(() => {
      const elevator = simulator.planElevators.value[0] || 'elevatorx'
      return simulator.isElevatorMoving(elevator)
    })
    
    const doorsOpen = computed(() => {
      return simulator.activeElevators.value.size > 0 && !isMoving.value
    })
    
    const direction = computed(() => {
      if (!simulator.currentAction.value) return null
      return simulator.currentAction.value.direction
    })
    
    const activeFloor = computed(() => {
      return currentFloor.value
    })
    
    // Helper methods for template
    const getParticleStyle = (particle) => {
      return particle.style
    }
    
    const getTotalMakespan = () => {
      if (!simulator.parsedActions.value.length) return 0
      return Math.max(...simulator.parsedActions.value.map(a => a.end || a.start + a.duration))
    }
    
    const getElapsedTime = () => {
      if (!simulator.currentAction.value) return 0
      return simulator.currentAction.value.start || 0
    }
    
    const getEfficiencyScore = () => {
      return simulator.efficiency.value
    }
    
    const getEfficiencyClass = () => {
      const score = simulator.efficiency.value
      if (score >= 80) return 'efficiency-excellent'
      if (score >= 60) return 'efficiency-good'
      return 'efficiency-poor'
    }
    
    const getEnergyClass = () => {
      const energy = simulator.currentEnergy.value
      if (energy >= 70) return 'energy-high'
      if (energy >= 30) return 'energy-medium'
      return 'energy-low'
    }
    
    const getWaitingPassengers = (floor) => {
      return simulator.getPassengersOnFloor(floor).map(passenger => {
        return {
          id: passenger,
          name: passenger,
          state: simulator.completedDeliveries.value.has(passenger) ? 'delivered' : 'waiting',
          destination: simulator.deliveryTargets.value.get(passenger)
        }
      })
    }
    
    const getRidingPassengers = () => {
      const elevator = simulator.planElevators.value[0] || 'elevatorx'
      return simulator.getElevatorCarrying(elevator).map(passenger => {
        return {
          id: passenger,
          name: passenger,
          state: 'riding'
        }
      })
    }
    
    const isPassengerDelivered = (passenger) => {
      return simulator.completedDeliveries.value.has(passenger)
    }
    
    const getPassengerDestination = (passenger) => {
      return simulator.deliveryTargets.value.get(passenger)
    }
    
    const getActionTime = (action) => {
      return action.start?.toFixed(1) || action.step?.toString() || '0.0'
    }
    
    const getActionDesc = (action) => {
      if (action.actionType === 'move') {
        return `Move ${action.direction} (${action.elevator})`
      } else if (action.actionType === 'load') {
        return `Load ${action.passenger} into ${action.elevator}`
      } else if (action.actionType === 'unload') {
        return `Unload ${action.passenger} from ${action.elevator}`
      } else if (action.actionType === 'reached') {
        return `${action.passenger} reached destination`
      }
      return action.name || 'Unknown action'
    }
    
    return {
      ...simulator,
      successMessage,
      energyPercentage,
      fuelPercentage,
      currentFloor,
      elevatorPosition,
      isMoving,
      doorsOpen,
      direction,
      activeFloor,
      getParticleStyle,
      getTotalMakespan,
      getElapsedTime,
      getEfficiencyScore,
      getEfficiencyClass,
      getEnergyClass,
      getWaitingPassengers,
      getRidingPassengers,
      isPassengerDelivered,
      getPassengerDestination,
      getActionTime,
      getActionDesc,
      // Additional state
      emergencyStop: ref(false),
      movingPassenger: ref(null),
      movingPassengerStyle: ref({})
    }
  }
}
</script>

<style scoped>
@import './ElevatorSimulator.css';
</style>