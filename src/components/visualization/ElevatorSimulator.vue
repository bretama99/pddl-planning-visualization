<template>
  <div class="realistic-elevator-simulator" :data-pddl="pddlType">
    <!-- Success Animation -->
    <transition name="success-popup">
      <div v-if="showSuccess" class="success-message">
        🎉 {{ successMessage }}
      </div>
    </transition>

    <!-- ENHANCED HEADER with PDDL Information -->
    <div class="header-no-overlap">
      <!-- Title Row with Enhanced PDDL Information -->
      <div class="title-row-separated">
        <h3 class="title-fixed">
          <span class="title-icon">🛗</span>
          <span>Realistic Elevator Simulation</span>
          <div class="pddl-info-section">
            <span class="pddl-type-badge" :class="`pddl-${pddlType}`" :style="{ borderColor: currentPDDLCharacteristics?.color || '#666' }">
              {{ pddlType.toUpperCase() }}
            </span>
            <div class="pddl-details">
              <div class="pddl-name">{{ currentPDDLCharacteristics?.name || 'Unknown Type' }}</div>
              <div class="pddl-description">{{ currentPDDLCharacteristics?.description || 'Loading...' }}</div>
              <div class="pddl-features">
                <span v-for="feature in (currentPDDLCharacteristics?.features || [])" :key="feature" class="feature-tag">
                  {{ feature }}
                </span>
              </div>
            </div>
          </div>
        </h3>
      </div>
      
      <!-- Controls Row - Separate row to prevent overlap -->
      <div class="controls-row-separated">
        <button @click="togglePlayback" :disabled="isPlaying" class="btn play-btn">
          {{ isPlaying ? '⏸️ Playing...' : '▶️ Play' }}
        </button>
        <button @click="stepForward" :disabled="isPlaying || currentStep >= parsedActions.length" class="btn step-btn">
          ⏭️ Step
        </button>
        <button @click="pauseSimulation" :disabled="!isPlaying" class="btn pause-btn">⏸️ Pause</button>
        <button @click="resetSimulation" class="btn reset-btn">🔄 Reset</button>
        <div class="speed-control-separated">
          <label>Speed:</label>
          <input type="range" v-model="playbackSpeed" min="0.3" max="2" step="0.1" class="speed-slider">
          <span class="speed-display">{{ playbackSpeed }}x</span>
        </div>
      </div>
    </div>

    <!-- ENHANCED DEBUG with PDDL Information -->
    <div class="debug-no-overlap">
      <div class="debug-item">
        <span class="debug-label">🏢 Floors:</span>
        <span class="debug-value">{{ planFloors.join(', ') }}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">🛗 Elevators:</span>
        <span class="debug-value">{{ planElevators.join(', ') }}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">👥 Passengers:</span>
        <span class="debug-value">{{ planPassengers.join(', ') }}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">📋 Actions:</span>
        <span class="debug-value">{{ parsedActions.length }}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">🎯 Current Step:</span>
        <span class="debug-value">{{ currentStep }}/{{ parsedActions.length }}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">🎭 PDDL Type:</span>
        <span class="debug-value" :style="{ color: currentPDDLCharacteristics?.color || '#4caf50', fontWeight: 'bold' }">
          {{ currentPDDLCharacteristics?.name || 'Unknown' }}
        </span>
      </div>
      <div class="debug-item">
        <span class="debug-label">🎭 Action Pattern:</span>
        <span class="debug-value">{{ currentPDDLCharacteristics?.actionPattern || 'unknown' }}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">🎯 Passenger Placement:</span>
        <span class="debug-value">{{ shouldPrePlacePassengers ? 'Pre-placed' : 'Dynamic' }}</span>
      </div>
    </div>

    <div class="main-content">
      <!-- Building with Enhanced Graphics and PDDL-Specific Visual Differences -->
      <div class="building realistic-building" :data-pddl="pddlType">
        <!-- Floor Structure -->
        <div class="floors-container">
          <div 
            v-for="(floor, index) in planFloors" 
            :key="floor"
            class="floor realistic-floor"
            :data-pddl="pddlType"
            :class="{ 
              active: activeFloor === floor,
              'has-elevator': hasElevatorOnFloor(floor),
              'has-passengers': hasPassengersOnFloor(floor)
            }"
            :style="{ bottom: index * 60 + 'px' }"
          >
            <!-- Floor Structure with PDDL-specific styling -->
            <div class="floor-structure" :data-pddl="pddlType">
              <div class="floor-base"></div>
              <div class="floor-ceiling"></div>
              <div class="floor-walls">
                <div class="wall-left"></div>
                <div class="wall-right"></div>
              </div>
            </div>

            <!-- Floor Label with PDDL type indicator -->
            <div class="floor-label" :data-pddl="pddlType">
              <span class="floor-number">{{ floor }}</span>
              <span v-if="pddlType === 'pddl+'" class="pddl-indicator">⚡</span>
              <span v-else-if="pddlType === 'temporal'" class="pddl-indicator">⏰</span>
              <span v-else-if="pddlType === 'numerical'" class="pddl-indicator">🧮</span>
              <span v-else class="pddl-indicator">📋</span>
            </div>
            
            <!-- Waiting Area for Passengers with PDDL+ dynamic display -->
            <div class="waiting-area" :data-pddl="pddlType">
              <!-- Debug info for PDDL+ -->
              <div v-if="pddlType === 'pddl+'" class="pddl-debug" style="position: absolute; top: -15px; left: 0; font-size: 8px; color: #9C27B0;">
                Passengers on {{ floor }}: {{ getWaitingPassengers(floor).length }}
              </div>
              
              <!-- PDDL+ Dynamic Passenger Notice (only show when no passengers) -->
              <div v-if="pddlType === 'pddl+' && getWaitingPassengers(floor).length === 0" class="pddl-plus-notice">
                <span class="dynamic-notice">⚡ No passengers on this floor</span>
              </div>
              
              <div class="waiting-passengers" :data-pddl="pddlType">
                <div 
                  v-for="passenger in getWaitingPassengers(floor)" 
                  :key="passenger.id"
                  class="passenger-waiting realistic-passenger"
                  :data-pddl="pddlType"
                  :class="{ 
                    'passenger-excited': passenger.state === 'delivered',
                    'passenger-calling': passenger.isWaiting,
                    'pddl-plus-dynamic': pddlType === 'pddl+'
                  }"
                >
                  <!-- Enhanced Passenger Figure with PDDL-specific styling -->
                  <div class="passenger-figure realistic-figure" :class="{ walking: isPassengerMoving(passenger.id) }" :data-pddl="pddlType">
                    <div class="head">
                      <div class="face">{{ passenger.state === 'delivered' ? '😊' : '🙂' }}</div>
                    </div>
                    <div class="body">
                      <div class="torso">
                        <div class="shirt"></div>
                      </div>
                      <div class="arms">
                        <div class="arm left" :class="{ waving: passenger.isWaiting }"></div>
                        <div class="arm right" :class="{ waving: passenger.isWaiting }"></div>
                      </div>
                    </div>
                    <div class="legs">
                      <div class="leg left"></div>
                      <div class="leg right"></div>
                    </div>
                  </div>
                  <div class="passenger-info">
                    <div class="passenger-name">{{ passenger.name }}</div>
                    <div class="passenger-dest" v-if="passenger.destination && passenger.destination !== 'Unknown'">
                      <span class="dest-arrow">→</span>
                      <span>{{ passenger.destination }}</span>
                    </div>
                    <!-- PDDL+ Dynamic indicator -->
                    <div v-if="pddlType === 'pddl+'" class="pddl-plus-badge">⚡ Dynamic</div>
                  </div>
                  <div v-if="passenger.state === 'delivered'" class="delivery-badge">✅</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Elevator Shaft with PDDL-specific visual differences -->
        <div class="elevator-shaft realistic-shaft" :data-pddl="pddlType">
          <div class="shaft-guides">
            <div class="guide-rail left"></div>
            <div class="guide-rail right"></div>
          </div>
          
          <!-- Realistic Elevator Car with PDDL-specific styling -->
          <div 
            v-for="elevator in planElevators"
            :key="elevator"
            class="elevator-car realistic-car"
            :data-pddl="pddlType"
            :class="{ 
              moving: isElevatorMoving(elevator),
              'doors-open': getElevatorDoorState(elevator) === 'open',
              'doors-opening': getElevatorDoorState(elevator) === 'opening',
              'doors-closing': getElevatorDoorState(elevator) === 'closing',
              'has-passengers': getElevatorCarrying(elevator).length > 0
            }"
            :style="{ 
              bottom: getElevatorSmoothPosition(elevator) + 'px',
              transition: isElevatorMoving(elevator) ? 'bottom 0.1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }"
          >
            <!-- Elevator Exterior Structure -->
            <div class="elevator-exterior realistic-exterior">
              <!-- Enhanced Floor Display with PDDL type indicator -->
              <div class="floor-display realistic-display">
                <div class="display-screen">
                  <div class="screen-content">{{ getCurrentFloor(elevator) }}</div>
                  <div class="pddl-type-display">{{ pddlType.charAt(0).toUpperCase() }}</div>
                </div>
              </div>
            </div>

            <!-- Realistic Elevator Interior -->
            <div class="elevator-interior realistic-interior">
              <!-- Passengers Inside Elevator -->
              <div class="inside-passengers realistic-passengers">
                <div 
                  v-for="passenger in getRidingPassengers(elevator)" 
                  :key="passenger.id"
                  class="passenger-inside realistic-inside"
                  :data-pddl="pddlType"
                >
                  <div class="passenger-figure small realistic-small">
                    <div class="head">
                      <div class="face">😊</div>
                    </div>
                    <div class="body">
                      <div class="torso">
                        <div class="shirt"></div>
                      </div>
                    </div>
                  </div>
                  <div class="passenger-name small">{{ passenger.name }}</div>
                </div>
              </div>
            </div>
            
            <!-- Realistic Elevator Doors with Smooth Animations -->
            <div class="doors realistic-doors">
              <div class="door door-left" :class="{ 
                open: getElevatorDoorState(elevator) === 'open',
                opening: getElevatorDoorState(elevator) === 'opening',
                closing: getElevatorDoorState(elevator) === 'closing'
              }" :style="{ 
                transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }">
              </div>
              <div class="door door-right" :class="{ 
                open: getElevatorDoorState(elevator) === 'open',
                opening: getElevatorDoorState(elevator) === 'opening',
                closing: getElevatorDoorState(elevator) === 'closing'
              }" :style="{ 
                transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }">
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Moving Passengers Animation with PDDL-specific styling -->
        <div 
          v-for="passenger in getMovingPassengers()" 
          :key="passenger.id"
          class="moving-passenger realistic-moving"
          :data-pddl="pddlType"
          :class="{ 
            boarding: passenger.movementType === 'boarding',
            exiting: passenger.movementType === 'exiting',
            'pddl-plus-dynamic': pddlType === 'pddl+'
          }"
          :style="getMovingPassengerSmoothStyle(passenger)"
        >
          <div class="passenger-figure realistic-figure walking animated">
            <div class="head">
              <div class="face">😊</div>
            </div>
            <div class="body">
              <div class="torso">
                <div class="shirt"></div>
              </div>
              <div class="arms walking">
                <div class="arm left"></div>
                <div class="arm right"></div>
              </div>
            </div>
            <div class="legs walking">
              <div class="leg left"></div>
              <div class="leg right"></div>
            </div>
          </div>
          <div class="passenger-name">{{ passenger.name }}</div>
          <div class="movement-indicator realistic-indicator" :data-pddl="pddlType">
            <span v-if="passenger.movementType === 'boarding'">➡️ Boarding</span>
            <span v-else>⬅️ Exiting</span>
            <span v-if="pddlType === 'pddl+'" class="dynamic-tag">⚡</span>
          </div>
        </div>
      </div>

      <!-- Enhanced Timeline with Smart Time/Duration Display -->
      <div class="timeline realistic-timeline" :data-pddl="pddlType">
        <h4 class="timeline-title">
          <span>📋 Actions Timeline</span>
          <div class="pddl-timeline-badge" :style="{ backgroundColor: currentPDDLCharacteristics?.color || '#666' }">
            {{ pddlType.toUpperCase() }}
          </div>
          <div class="timeline-progress realistic-progress" :style="{ width: progressPercentage + '%' }"></div>
        </h4>
        <div class="timeline-stats">
          <span>Step: {{ currentStep }}/{{ parsedActions.length }}</span>
          <span>Pattern: {{ currentPDDLCharacteristics?.actionPattern || 'unknown' }}</span>
          <span v-if="shouldDisplayTime">⏱️ Timed</span>
          <span v-if="shouldDisplayDuration">⏰ Durations</span>
          <span v-if="!shouldPrePlacePassengers">👤 Dynamic</span>
        </div>
        <div class="actions realistic-actions">
          <div 
            v-for="(action, index) in parsedActions" 
            :key="index"
            class="action realistic-action"
            :data-pddl="pddlType"
            :class="{ 
              current: index === currentStep,
              completed: index < currentStep,
              upcoming: index > currentStep,
              [`pddl-${pddlType}`]: true
            }"
          >
            <div class="action-content realistic-content">
              <!-- Smart Time Display - Only show if plan has explicit timing -->
              <span v-if="shouldDisplayTime && getActionTime(action)" class="time realistic-time">
              </span>
              <span v-else-if="shouldDisplayTime" class="time-placeholder">—</span>
              
              <span class="desc realistic-desc">{{ getActionDesc(action) }}</span>
              
              <div class="action-meta realistic-meta">
                <!-- Smart Duration Display - Only show if plan has explicit durations -->
                <span v-if="shouldDisplayDuration && getActionDuration(action)" class="duration-info">
                  [{{ getActionDuration(action) }}]
                </span>
                
                <!-- PDDL Type Indicators -->
                <span v-if="shouldDisplayTime && action.hasExplicitTime" class="explicit-time-badge">⏱️</span>
                <span v-if="shouldDisplayDuration && action.duration" class="explicit-duration-badge">⏰</span>
                <span v-if="pddlType === 'pddl+'" class="pddl-plus-indicator">⚡</span>
                <span v-else-if="pddlType === 'temporal'" class="temporal-indicator">🕒</span>
                <span v-else-if="pddlType === 'numerical'" class="numerical-indicator">🧮</span>
                <span v-else class="classical-indicator">📋</span>
              </div>
              
              <div class="action-status realistic-status">
                <div v-if="index === currentStep" class="status-icon current-icon">▶️</div>
                <div v-else-if="index < currentStep" class="status-icon done-icon">✅</div>
                <div v-else class="status-icon upcoming-icon">⏳</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useElevatorSimulator } from './ElevatorSimulator.js'

export default {
  name: 'RealisticElevatorSimulator',
  props: {
    actions: {
      type: [String, Array],
      required: true
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
    // Use the extracted logic from the separate file
    const elevatorLogic = useElevatorSimulator(props)
    
    // Return all the reactive data and methods from the composable
    return {
      ...elevatorLogic
    }
  }
}
</script>
<style scoped>
.realistic-elevator-simulator {
  width: 100%;
  height: 600px !important;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden !important;
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

/* ENHANCED HEADER with PDDL Information */
.header-no-overlap {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 6px 8px !important;
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  border-radius: 8px 8px 0 0;
  height: 80px !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.title-row-separated {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  height: 45px;
  margin-bottom: 2px;
}

.title-fixed {
  margin: 0 !important;
  color: #1a237e;
  font-size: 0.9rem !important;
  font-weight: 700;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  text-align: center;
  flex-direction: column;
}

.title-icon {
  font-size: 1.1rem;
}

/* ENHANCED PDDL TYPE INFORMATION */
.pddl-info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.pddl-type-badge {
  background: linear-gradient(135deg, #3F51B5, #303F9F);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.pddl-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

.pddl-name {
  font-size: 0.65rem;
  font-weight: 600;
  color: #1a237e;
}

.pddl-description {
  font-size: 0.55rem;
  color: #666;
  max-width: 300px;
  line-height: 1.2;
}

.pddl-features {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 2px;
}

.feature-tag {
  background: rgba(63, 81, 181, 0.1);
  color: #3f51b5;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.5rem;
  border: 1px solid rgba(63, 81, 181, 0.2);
}

.controls-row-separated {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 25px;
  gap: 4px;
}

.btn {
  padding: 2px 6px !important;
  border: none;
  border-radius: 3px;
  font-weight: 600;
  cursor: pointer;
  font-size: 7px !important;
  margin: 1px;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.play-btn { background: #4CAF50; color: white; }
.pause-btn { background: #FF9800; color: white; }
.reset-btn { background: #f44336; color: white; }
.step-btn { background: #2196F3; color: white; }

.speed-control-separated {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(255, 255, 255, 0.9);
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 7px;
}

.speed-slider {
  width: 30px !important;
  height: 8px;
}

.speed-display {
  font-weight: bold;
  color: #1976D2;
}

/* ENHANCED DEBUG with PDDL Information */
.debug-no-overlap {
  background: rgba(0, 0, 0, 0.8);
  color: #00ff00;
  padding: 3px 6px !important;
  font-family: 'Courier New', monospace;
  font-size: 7px !important;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
  height: 22px !important;
  align-items: center;
  overflow: hidden;
}

.debug-item {
  display: flex;
  gap: 2px;
  white-space: nowrap;
}

.debug-label {
  color: #ffeb3b;
  font-weight: bold;
}

.debug-value {
  color: #4caf50;
}

/* MAIN CONTENT - Adjusted for new layout */
.main-content {
  display: flex;
  flex: 1;
  gap: 8px;
  padding: 6px !important;
  box-sizing: border-box;
  overflow: hidden;
  height: calc(600px - 80px - 22px - 12px) !important;
  min-height: 0;
}

/* BUILDING - EXACT HEIGHT */
.realistic-building {
  flex: 2;
  position: relative;
  background: linear-gradient(135deg, #263238, #37474f);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 100% !important;
}

/* FLOORS - CALCULATED HEIGHT */
.floors-container {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 4px 0 !important;
  box-sizing: border-box;
}

.realistic-floor {
  position: absolute;
  width: 100%;
  height: 60px !important;
  transition: all 0.3s ease;
  z-index: 2;
}

.floor-structure {
  position: relative;
  width: 100%;
  height: 100%;
}

.floor-base {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(135deg, #546e7a, #455a64);
  border-top: 1px solid #78909c;
}

.floor-ceiling {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(135deg, #37474f, #263238);
}

.floor-walls .wall-left,
.floor-walls .wall-right {
  position: absolute;
  top: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(90deg, #37474f, #455a64);
}

.floor-walls .wall-left { left: 0; }
.floor-walls .wall-right { right: 0; }

.floor-label {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 4px !important;
  border-radius: 3px;
  font-weight: bold;
  color: #1a237e;
  font-size: 0.6rem !important;
  z-index: 10;
}

.floor-number {
  font-size: 0.65rem;
}

/* WAITING AREAS - COMPACT */
.waiting-area {
  position: absolute;
  left: 50px !important;
  top: 8px;
  right: 40px !important;
  bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 5;
}

.waiting-passengers {
  display: flex;
  gap: 4px !important;
  align-items: center;
  z-index: 6;
}

/* PASSENGER FIGURES - Enhanced with smooth animations */
.realistic-passenger {
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 10;
  will-change: transform;
  backface-visibility: hidden;
}

.realistic-figure {
  width: 18px !important;
  height: 28px !important;
  position: relative;
}

.realistic-figure.animated {
  animation: figure-glow 2s ease-in-out infinite alternate;
}

@keyframes figure-glow {
  from { filter: brightness(1); }
  to { filter: brightness(1.1); }
}

.realistic-figure .head {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #ffdbcb;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid #f4a460;
}

.realistic-figure .face {
  font-size: 6px;
  text-align: center;
  line-height: 7px;
}

.realistic-figure .body {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 7px;
  height: 12px;
}

.realistic-figure .torso {
  width: 100%;
  height: 10px;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  border-radius: 3px 3px 1px 1px;
  position: relative;
}

.realistic-figure .shirt {
  position: absolute;
  top: 1px;
  left: 1px;
  right: 1px;
  height: 7px;
  background: linear-gradient(135deg, #4FC3F7, #29B6F6);
  border-radius: 2px 2px 1px 1px;
}

.realistic-figure .arms {
  position: absolute;
  top: 1px;
  left: 50%;
  transform: translateX(-50%);
  width: 11px;
  height: 8px;
}

.realistic-figure .arm {
  position: absolute;
  width: 2px;
  height: 7px;
  background: #ffdbcb;
  border-radius: 1px;
  border: 1px solid #f4a460;
}

.realistic-figure .arm.left {
  left: -2px;
  transform-origin: top center;
}

.realistic-figure .arm.right {
  right: -2px;
  transform-origin: top center;
}

.realistic-figure .legs {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  width: 7px;
  height: 9px;
}

.realistic-figure .leg {
  position: absolute;
  width: 2px;
  height: 8px;
  background: #1565C0;
  border-radius: 1px;
  border: 1px solid #0D47A1;
}

.realistic-figure .leg.left { left: 1px; }
.realistic-figure .leg.right { right: 1px; }

/* PASSENGER INFO - TINY */
.passenger-info {
  text-align: center;
  margin-top: 2px;
}

.passenger-name {
  font-size: 5px !important;
  font-weight: bold;
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
  padding: 1px;
  border-radius: 2px;
}

.passenger-dest {
  font-size: 4px !important;
  color: #FFD700;
  margin-top: 1px;
}

.delivery-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  width: 8px !important;
  height: 8px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5px !important;
}

/* ELEVATOR SHAFT - Enhanced */
.realistic-shaft {
  position: absolute;
  left: 50%;
  top: 0;
  width: 50px !important;
  height: 100%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #1c1c1c, #2a2a2a, #1c1c1c);
  border: 1px solid #444;
  border-radius: 4px;
  z-index: 3;
}

.shaft-guides {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
}

.guide-rail {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(180deg, #666, #444, #666);
  border-radius: 1px;
}

.guide-rail.left { left: 4px; }
.guide-rail.right { right: 4px; }

/* ELEVATOR CAR - Enhanced smooth movement */
.realistic-car {
  position: absolute;
  width: 40px !important;
  height: 45px !important;
  left: 50%;
  transform: translateX(-50%);
  transition: none;
  z-index: 15;
  will-change: transform;
  backface-visibility: hidden;
}

.realistic-car.moving {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* ELEVATOR EXTERIOR - COMPACT */
.realistic-exterior {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #37474f, #263238);
  border-radius: 3px;
  border: 1px solid #546e7a;
}

/* ELEVATOR INTERIOR - COMPACT */
.realistic-interior {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  border-radius: 2px;
  overflow: hidden;
}

/* FLOOR DISPLAY - TINY */
.realistic-display {
  position: absolute;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px !important;
  height: 8px !important;
}

.display-screen {
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 1px;
  position: relative;
  border: 1px solid #333;
}

.screen-content {
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 4px !important;
  font-weight: bold;
  text-align: center;
  line-height: 6px;
}

/* PASSENGERS INSIDE - Enhanced */
.realistic-passengers {
  position: absolute;
  bottom: 4px;
  left: 3px;
  right: 3px;
  height: 16px !important;
  display: flex;
  gap: 1px;
  align-items: flex-end;
  justify-content: center;
  background: rgba(240, 240, 240, 0.9);
  border-radius: 1px;
  padding: 1px;
}

.realistic-small {
  width: 8px !important;
  height: 12px !important;
  transform: scale(0.7);
}

.realistic-small .head {
  width: 6px;
  height: 6px;
  background: #ffdbcb;
  border-radius: 50%;
  margin: 0 auto 1px;
}

.realistic-small .body {
  width: 4px;
  height: 6px;
  margin: 0 auto;
}

.realistic-small .torso {
  width: 100%;
  height: 5px;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  border-radius: 2px;
}

.passenger-name.small {
  font-size: 3px !important;
  margin-top: 1px;
  color: #1976D2;
  font-weight: bold;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 0px;
  border-radius: 1px;
}

/* DOORS - Enhanced smooth animations */
.realistic-doors {
  position: absolute;
  top: 10px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  display: flex;
}

.door {
  flex: 1;
  background: linear-gradient(135deg, #90A4AE, #78909C);
  border: 1px solid #546E7A;
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
  will-change: transform;
  backface-visibility: hidden;
}

.door-left { border-radius: 1px 0 0 1px; }
.door-right { border-radius: 0 1px 1px 0; }

.door.opening.door-left,
.door.open.door-left { 
  transform: translateX(-100%); 
}

.door.opening.door-right,
.door.open.door-right { 
  transform: translateX(100%); 
}

.door.closing.door-left,
.door.closing.door-right { 
  transform: translateX(0%); 
}

/* ENHANCED TIMELINE with PDDL Features */
.realistic-timeline {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 6px !important;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: 100% !important;
}

.timeline-title {
  margin: 0 0 6px 0;
  color: #1a237e;
  font-size: 0.75rem !important;
  font-weight: 600;
  position: relative;
  padding-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pddl-timeline-badge {
  background: rgba(255, 255, 255, 0.9);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.realistic-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(90deg, #4CAF50, #2196F3, #9C27B0);
  border-radius: 1px;
  transition: width 0.5s ease;
}

.timeline-stats {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
  font-size: 6px !important;
  color: #666;
  flex-wrap: wrap;
}

.timeline-stats span {
  background: rgba(63, 81, 181, 0.1);
  padding: 1px 2px;
  border-radius: 2px;
  border: 1px solid rgba(63, 81, 181, 0.2);
}

.realistic-actions {
  display: flex;
  flex-direction: column;
  gap: 2px !important;
  overflow-y: auto;
}

.realistic-action {
  padding: 4px 6px !important;
  border-radius: 3px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  position: relative;
}

.realistic-action.upcoming {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-color: #dee2e6;
}

.realistic-action.current {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-color: #2196F3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.realistic-action.completed {
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  border-color: #4CAF50;
  opacity: 0.8;
}

.realistic-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.realistic-time {
  font-size: 5px !important;
  font-weight: bold;
  color: #666;
}

.time-placeholder {
  font-size: 5px !important;
  color: #ccc;
  font-style: italic;
}

.realistic-desc {
  font-size: 7px !important;
  font-weight: 600;
  color: #2c3e50;
}

.realistic-meta {
  display: flex;
  gap: 3px;
  font-size: 5px !important;
  flex-wrap: wrap;
}

.duration-info {
  background: rgba(33, 150, 243, 0.1);
  color: #1976D2;
  padding: 1px;
  border-radius: 1px;
}

.explicit-time-badge {
  background: rgba(255, 193, 7, 0.2);
  color: #F57F17;
  padding: 1px;
  border-radius: 1px;
}

.explicit-duration-badge {
  background: rgba(76, 175, 80, 0.2);
  color: #388E3C;
  padding: 1px;
  border-radius: 1px;
}

/* PDDL Action Type Indicators */
.pddl-plus-indicator {
  background: rgba(156, 39, 176, 0.2);
  color: #9C27B0;
  padding: 1px 2px;
  border-radius: 1px;
  font-size: 5px;
}

.temporal-indicator {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
  padding: 1px 2px;
  border-radius: 1px;
  font-size: 5px;
}

.numerical-indicator {
  background: rgba(255, 152, 0, 0.2);
  color: #FF9800;
  padding: 1px 2px;
  border-radius: 1px;
  font-size: 5px;
}

.classical-indicator {
  background: rgba(33, 150, 243, 0.2);
  color: #2196F3;
  padding: 1px 2px;
  border-radius: 1px;
  font-size: 5px;
}

.realistic-status {
  position: absolute;
  right: 3px;
  top: 50%;
  transform: translateY(-50%);
}

.status-icon {
  font-size: 6px !important;
}

/* SUCCESS MESSAGE */
.success-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 10px 20px !important;
  border-radius: 8px;
  font-size: 0.9rem !important;
  font-weight: bold;
  z-index: 1000;
  animation: success-fade 3s ease-in-out;
}

@keyframes success-fade {
  0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  20%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* ENHANCED ANIMATIONS */
.realistic-figure .arm.waving {
  animation: arm-wave 1.5s ease-in-out infinite;
}

@keyframes arm-wave {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-15deg); }
}

.realistic-figure.walking .arms {
  animation: arms-swing 0.8s ease-in-out infinite;
}

@keyframes arms-swing {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  50% { transform: translateX(-50%) rotate(2deg); }
}

.realistic-figure.walking .legs .leg.left {
  animation: leg-walk-left 0.8s ease-in-out infinite;
}

.realistic-figure.walking .legs .leg.right {
  animation: leg-walk-right 0.8s ease-in-out infinite;
}

@keyframes leg-walk-left {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-8deg); }
}

@keyframes leg-walk-right {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(8deg); }
}

.realistic-figure.walking {
  animation: walking-bob 0.6s ease-in-out infinite;
}

@keyframes walking-bob {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-1px); }
}

/* SUCCESS POPUP TRANSITION */
.success-popup-enter-active, .success-popup-leave-active {
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.success-popup-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.3);
}

.success-popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.2);
}

/* PDDL TYPE SPECIFIC STYLES */
.pddl-classical { 
  border-left: 4px solid #2196F3; 
}

.pddl-classical .pddl-type-badge {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  border-color: #2196F3;
}

.pddl-temporal { 
  border-left: 4px solid #4CAF50; 
}

.pddl-temporal .pddl-type-badge {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  border-color: #4CAF50;
}

.pddl-numerical { 
  border-left: 4px solid #FF9800; 
}

.pddl-numerical .pddl-type-badge {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  border-color: #FF9800;
}

.pddl-pddl\+ { 
  border-left: 4px solid #9C27B0; 
}

.pddl-pddl\+ .pddl-type-badge {
  background: linear-gradient(135deg, #9C27B0, #7B1FA2);
  border-color: #9C27B0;
}

/* PDDL+ Dynamic Passenger Indicators */
.waiting-passengers[data-pddl="pddl+"] {
  position: relative;
}

.pddl-plus-notice {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(156, 39, 176, 0.1);
  border: 1px dashed #9C27B0;
  border-radius: 4px;
  padding: 2px 4px;
  z-index: 5;
}

.dynamic-notice {
  font-size: 0.5rem;
  color: #9C27B0;
  font-weight: bold;
  white-space: nowrap;
}

/* PDDL+ Dynamic Passenger Styling */
.passenger-waiting[data-pddl="pddl+"] {
  border: 2px solid #9C27B0;
  background: rgba(156, 39, 176, 0.1);
  animation: pddl-plus-glow 2s ease-in-out infinite alternate;
}

@keyframes pddl-plus-glow {
  from { box-shadow: 0 0 5px rgba(156, 39, 176, 0.3); }
  to { box-shadow: 0 0 10px rgba(156, 39, 176, 0.6); }
}

.pddl-plus-badge {
  background: #9C27B0;
  color: white;
  font-size: 0.4rem;
  padding: 1px 2px;
  border-radius: 2px;
  margin-top: 1px;
}

/* PDDL-Specific Elevator Styling */
.realistic-car[data-pddl="pddl+"] {
  border: 2px solid #9C27B0;
}

.realistic-car[data-pddl="temporal"] {
  border: 2px solid #4CAF50;
}

.realistic-car[data-pddl="numerical"] {
  border: 2px solid #FF9800;
}

.realistic-car[data-pddl="classical"] {
  border: 2px solid #2196F3;
}

/* Elevator Display with PDDL Type */
.pddl-type-display {
  position: absolute;
  top: 1px;
  right: 1px;
  font-size: 3px;
  color: #00ff00;
  font-weight: bold;
}

/* PDDL-Specific Timeline Styling */
.realistic-timeline[data-pddl="pddl+"] {
  border-left: 4px solid #9C27B0;
}

.realistic-timeline[data-pddl="temporal"] {
  border-left: 4px solid #4CAF50;
}

.realistic-timeline[data-pddl="numerical"] {
  border-left: 4px solid #FF9800;
}

.realistic-timeline[data-pddl="classical"] {
  border-left: 4px solid #2196F3;
}

/* PDDL-Specific Action Styling */
.realistic-action[data-pddl="pddl+"] {
  border-left: 3px solid #9C27B0;
}

.realistic-action[data-pddl="temporal"] {
  border-left: 3px solid #4CAF50;
}

.realistic-action[data-pddl="numerical"] {
  border-left: 3px solid #FF9800;
}

.realistic-action[data-pddl="classical"] {
  border-left: 3px solid #2196F3;
}

/* PDDL+ Dynamic Movement Indicator */
.dynamic-tag {
  background: #9C27B0;
  color: white;
  font-size: 4px;
  padding: 1px;
  border-radius: 1px;
  margin-left: 2px;
}

/* Moving Passenger PDDL+ Styling */
.realistic-moving[data-pddl="pddl+"] {
  border: 2px solid #9C27B0;
  background: rgba(156, 39, 176, 0.1);
  animation: dynamic-passenger-move 1s ease-in-out infinite alternate;
}

@keyframes dynamic-passenger-move {
  from { transform: scale(1) rotate(0deg); }
  to { transform: scale(1.05) rotate(1deg); }
}

/* Enhanced Floor Structure for Different PDDL Types */
.floor-structure[data-pddl="pddl+"] .floor-base {
  background: linear-gradient(135deg, #9C27B0, #7B1FA2);
  border-top: 2px solid #AD42C6;
}

.floor-structure[data-pddl="temporal"] .floor-base {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  border-top: 2px solid #66BB6A;
}

.floor-structure[data-pddl="numerical"] .floor-base {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  border-top: 2px solid #FFB74D;
}

.floor-structure[data-pddl="classical"] .floor-base {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  border-top: 2px solid #42A5F5;
}

/* Waiting Area PDDL-Specific Styling */
.waiting-area[data-pddl="pddl+"] {
  border: 1px dashed #9C27B0;
  background: rgba(156, 39, 176, 0.05);
}

.waiting-passengers[data-pddl="pddl+"]:empty::after {
  content: "⚡ Passengers appear dynamically";
  color: #9C27B0;
  font-size: 0.5rem;
  opacity: 0.7;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Elevator Shaft PDDL-Specific Styling */
.realistic-shaft[data-pddl="pddl+"] {
  border: 2px solid #9C27B0;
  background: linear-gradient(90deg, #1c1c1c, #3a1a3a, #1c1c1c);
}

.realistic-shaft[data-pddl="temporal"] {
  border: 2px solid #4CAF50;
  background: linear-gradient(90deg, #1c1c1c, #1a3a1a, #1c1c1c);
}

.realistic-shaft[data-pddl="numerical"] {
  border: 2px solid #FF9800;
  background: linear-gradient(90deg, #1c1c1c, #3a2a1a, #1c1c1c);
}

.realistic-shaft[data-pddl="classical"] {
  border: 2px solid #2196F3;
  background: linear-gradient(90deg, #1c1c1c, #1a2a3a, #1c1c1c);
}

/* Enhanced Floor Indicators */
.realistic-floor.active {
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0.1), 
    rgba(255, 255, 255, 0.05), 
    rgba(255, 255, 255, 0.1)
  );
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.2);
}

.realistic-floor.has-elevator {
  border-left: 3px solid #2196F3;
}

.realistic-floor.has-passengers {
  border-right: 3px solid #FF9800;
}

/* Enhanced Elevator States */
.realistic-car.moving {
  animation: elevator-moving 2s ease-in-out infinite;
}

@keyframes elevator-moving {
  0%, 100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); }
  50% { box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4); }
}

.realistic-car.doors-opening,
.realistic-car.doors-open {
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.realistic-car.doors-closing {
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

.realistic-car.has-passengers {
  border: 2px solid rgba(156, 39, 176, 0.5);
}

/* Enhanced Passenger States */
.passenger-excited {
  animation: passenger-bounce 1s ease-in-out infinite;
}

@keyframes passenger-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.passenger-calling .realistic-figure .arm.waving {
  animation: urgent-wave 0.8s ease-in-out infinite;
}

@keyframes urgent-wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-20deg); }
  75% { transform: rotate(-10deg); }
}

/* PREVENT LAYOUT SHIFTS AND BLINKING */
.realistic-passenger,
.realistic-inside,
.realistic-moving,
.realistic-car,
.door,
.realistic-figure {
  will-change: transform, opacity;
  backface-visibility: hidden;
}

/* Enhanced Loading States */
.realistic-moving.boarding {
  animation: boarding-glow 1.5s ease-in-out infinite alternate;
}

.realistic-moving.exiting {
  animation: exiting-glow 1.5s ease-in-out infinite alternate;
}

@keyframes boarding-glow {
  from { filter: brightness(1) hue-rotate(0deg); }
  to { filter: brightness(1.2) hue-rotate(20deg); }
}

@keyframes exiting-glow {
  from { filter: brightness(1) hue-rotate(0deg); }
  to { filter: brightness(1.2) hue-rotate(-20deg); }
}

/* MOVING PASSENGERS - Enhanced smooth movement */
.realistic-moving {
  position: absolute;
  z-index: 25;
  will-change: transform;
  backface-visibility: hidden;
}

.realistic-moving .realistic-figure {
  width: 20px !important;
  height: 32px !important;
}

.realistic-indicator {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #FFD700;
  padding: 1px 3px;
  border-radius: 4px;
  font-size: 5px !important;
  font-weight: bold;
  white-space: nowrap;
}

/* PDDL Type Indicators */
.pddl-indicator {
  font-size: 0.5rem;
  margin-left: 2px;
  opacity: 0.8;
}

/* SCROLLBAR STYLING */
.realistic-timeline::-webkit-scrollbar {
  width: 4px;
}

.realistic-timeline::-webkit-scrollbar-track {
  background: rgba(241, 243, 244, 0.5);
  border-radius: 2px;
}

.realistic-timeline::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #bdc3c7, #95a5a6);
  border-radius: 2px;
}

.realistic-timeline::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
}

/* Responsive Design for Smaller Screens */
@media (max-width: 1200px) {
  .realistic-elevator-simulator {
    height: 550px !important;
  }
  
  .header-no-overlap {
    height: 70px !important;
  }
  
  .main-content {
    height: calc(550px - 70px - 22px - 12px) !important;
  }
}

@media (max-width: 800px) {
  .realistic-elevator-simulator {
    height: 500px !important;
  }
  
  .header-no-overlap {
    height: 60px !important;
  }
  
  .main-content {
    height: calc(500px - 60px - 22px - 12px) !important;
    flex-direction: column;
  }
  
  .realistic-building {
    flex: none;
    height: 60% !important;
  }
  
  .realistic-timeline {
    flex: none;
    height: 40% !important;
  }
  
  .debug-no-overlap {
    height: 20px !important;
    font-size: 5px !important;
  }
  
  .dynamic-notice {
    font-size: 0.4rem;
  }
  
  .pddl-indicator {
    font-size: 0.4rem;
  }
}

/* Enhanced Accessibility */
.realistic-action:focus,
.btn:focus {
  outline: 2px solid #2196F3;
  outline-offset: 2px;
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  .realistic-elevator-simulator {
    background: #000;
    color: #fff;
  }
  
  .header-no-overlap {
    background: #fff;
    color: #000;
  }
  
  .realistic-building {
    border: 2px solid #fff;
  }
  
  .realistic-car {
    border: 2px solid #ffff00;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
/* ADD these CSS rules to your ElevatorSimulator Vue component <style> section */

/* Enhanced Header Controls */
.controls-row-separated {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 35px !important; /* Increased from 25px */
  gap: 6px;
}

.btn {
  padding: 4px 12px !important; /* Increased padding */
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  font-size: 11px !important; /* Increased from 7px */
  margin: 2px;
  transition: all 0.2s ease;
  min-width: 70px; /* Ensure consistent button sizes */
}

/* Enhanced Timeline Title */
.timeline-title {
  margin: 0 0 8px 0;
  color: #1a237e;
  font-size: 1rem !important; /* Increased from 0.75rem */
  font-weight: 700;
  position: relative;
  padding-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pddl-timeline-badge {
  background: rgba(255, 255, 255, 0.9);
  color: white;
  padding: 3px 8px; /* Increased padding */
  border-radius: 5px;
  font-size: 0.8rem; /* Increased from 0.6rem */
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Enhanced Timeline Stats */
.timeline-stats {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 9px !important; /* Increased from 6px */
  color: #666;
  flex-wrap: wrap;
}

.timeline-stats span {
  background: rgba(63, 81, 181, 0.1);
  padding: 2px 4px; /* Increased padding */
  border-radius: 3px;
  border: 1px solid rgba(63, 81, 181, 0.2);
  font-weight: 500;
}

/* Enhanced Action Items */
.realistic-action {
  padding: 6px 8px !important; /* Increased from 4px 6px */
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  margin-bottom: 2px;
}

.realistic-desc {
  font-size: 10px !important; /* Increased from 7px */
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.3;
}

.realistic-time {
  font-size: 8px !important; /* Increased from 5px */
  font-weight: bold;
  color: #666;
  margin-bottom: 2px;
}

.time-placeholder {
  font-size: 8px !important; /* Increased from 5px */
  color: #ccc;
  font-style: italic;
}

.realistic-meta {
  display: flex;
  gap: 4px;
  font-size: 7px !important; /* Increased from 5px */
  flex-wrap: wrap;
  margin-top: 2px;
}

.duration-info {
  background: rgba(33, 150, 243, 0.15);
  color: #1976D2;
  padding: 2px 4px; /* Increased padding */
  border-radius: 2px;
  font-weight: 600;
}

/* Enhanced Action Status Icons */
.status-icon {
  font-size: 9px !important; /* Increased from 6px */
}

/* Enhanced PDDL Type Indicators */
.pddl-plus-indicator,
.temporal-indicator,
.numerical-indicator,
.classical-indicator {
  background: rgba(156, 39, 176, 0.2);
  color: #9C27B0;
  padding: 2px 4px; /* Increased padding */
  border-radius: 2px;
  font-size: 7px !important; /* Increased from 5px */
  font-weight: 600;
}

.temporal-indicator {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.numerical-indicator {
  background: rgba(255, 152, 0, 0.2);
  color: #FF9800;
}

.classical-indicator {
  background: rgba(33, 150, 243, 0.2);
  color: #2196F3;
}

/* Enhanced Header Title */
.title-fixed {
  margin: 0 !important;
  color: #1a237e;
  font-size: 1.1rem !important; /* Increased from 0.9rem */
  font-weight: 700;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  text-align: center;
  flex-direction: column;
}

.title-icon {
  font-size: 1.3rem; /* Increased from 1.1rem */
}

/* Enhanced PDDL Info Section */
.pddl-name {
  font-size: 0.8rem; /* Increased from 0.65rem */
  font-weight: 600;
  color: #1a237e;
}

.pddl-description {
  font-size: 0.7rem; /* Increased from 0.55rem */
  color: #666;
  max-width: 300px;
  line-height: 1.3;
}

.feature-tag {
  background: rgba(63, 81, 181, 0.1);
  color: #3f51b5;
  padding: 2px 6px; /* Increased padding */
  border-radius: 4px;
  font-size: 0.65rem; /* Increased from 0.5rem */
  border: 1px solid rgba(63, 81, 181, 0.2);
  font-weight: 500;
}

/* Enhanced Debug Section */
.debug-no-overlap {
  background: rgba(0, 0, 0, 0.8);
  color: #00ff00;
  padding: 4px 8px !important; /* Increased from 3px 6px */
  font-family: 'Courier New', monospace;
  font-size: 9px !important; /* Increased from 7px */
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
  height: 28px !important; /* Increased from 22px */
  align-items: center;
  overflow: hidden;
}

/* Enhanced Speed Control */
.speed-control-separated {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.9);
  padding: 3px 6px; /* Increased padding */
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 9px; /* Increased from 7px */
}

.speed-slider {
  width: 40px !important; /* Increased from 30px */
  height: 10px; /* Increased from 8px */
}

.speed-display {
  font-weight: bold;
  color: #1976D2;
  font-size: 10px; /* Increased size */
}

/* Enhanced Action Current State */
.realistic-action.current {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-color: #2196F3;
  box-shadow: 0 3px 10px rgba(33, 150, 243, 0.4); /* Enhanced shadow */
  transform: translateY(-1px); /* Subtle lift effect */
}

/* Enhanced Action Hover Effects */
.realistic-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Enhanced Button Hover Effects */
.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.2);
  filter: brightness(1.1);
}

/* Better Responsive Timeline */
@media (max-width: 800px) {
  .realistic-desc {
    font-size: 9px !important;
  }
  
  .realistic-time {
    font-size: 7px !important;
  }
  
  .btn {
    font-size: 10px !important;
    padding: 3px 8px !important;
    min-width: 60px;
  }
}
</style>