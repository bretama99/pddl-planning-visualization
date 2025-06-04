<template>
  <div class="elevator-simulator">
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
        <div class="title-glow"></div>
      </h3>
      <div class="controls">
        <button @click="play" :disabled="isPlaying" class="btn play-btn">
          {{ isPlaying ? '⏸️ Playing...' : '▶️ Play' }}
        </button>
        <button @click="pause" :disabled="!isPlaying" class="btn pause-btn">⏸️ Pause</button>
        <button @click="reset" class="btn reset-btn">🔄 Reset</button>
        <div class="speed-control">
          <label>Speed:</label>
          <input type="range" v-model="speed" min="0.5" max="3" step="0.1" class="speed-slider">
          <span class="speed-display">{{speed}}x</span>
        </div>
      </div>
    </div>

    <!-- Debug Panel -->
    <div class="debug">
      <div class="debug-item">
        <span class="debug-label">🏢 Floors:</span>
        <span class="debug-value">{{floors.join(', ')}}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">🛗 Elevators:</span>
        <span class="debug-value">{{elevators.join(', ')}}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">👥 Passengers:</span>
        <span class="debug-value">{{passengerList.join(', ')}}</span>
      </div>
    </div>

    <!-- Building -->
    <div class="building">
      <!-- Building Background Effects -->
      <div class="building-bg-effects">
        <div class="elevator-light-beam" :class="{ active: isMoving }"></div>
        <div class="building-glow" :class="{ active: doorsOpen }"></div>
      </div>
      
      <!-- Floors -->
      <transition-group name="floor-highlight" tag="div">
        <div 
          v-for="(floor, index) in floors" 
          :key="floor"
          class="floor"
          :class="{ 
            active: activeFloor === floor,
            'floor-pulse': activeFloor === floor && (isMoving || doorsOpen)
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
                :class="{ 'passenger-excited': passenger.state === 'delivered' }"
              >
                <div class="passenger-avatar">
                  <span class="avatar-emoji">👤</span>
                  <div class="avatar-glow"></div>
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
      <div class="elevator-shaft">
        <!-- Shaft Background Pattern -->
        <div class="shaft-pattern"></div>
        
        <!-- Elevator Car -->
        <div 
          class="elevator-car"
          :class="{ 
            moving: isMoving,
            'doors-open': doorsOpen,
            'emergency-stop': emergencyStop 
          }"
          :style="{ 
            bottom: elevatorPosition + 'px',
            transition: isMoving ? `bottom ${2/speed}s cubic-bezier(0.4, 0, 0.2, 1)` : 'none'
          }"
        >
          <!-- Elevator Exterior -->
          <div class="elevator-exterior">
            <div class="elevator-buttons">
              <div class="call-button up" :class="{ active: direction === 'up' }">⬆️</div>
              <div class="call-button down" :class="{ active: direction === 'down' }">⬇️</div>
            </div>
          </div>

          <!-- Elevator Interior -->
          <div class="elevator-interior">
            <!-- Floor Display -->
            <div class="floor-display">
              <div class="display-screen">{{currentFloor}}</div>
              <div class="display-glow"></div>
            </div>
            
            <!-- Direction Arrow -->
            <transition name="direction-change">
              <div class="direction" v-if="direction">
                <span class="direction-arrow">{{direction === 'up' ? '⬆️' : '⬇️'}}</span>
                <div class="direction-glow"></div>
              </div>
            </transition>
            
            <!-- Passengers inside elevator -->
            <div class="inside-passengers">
              <transition-group name="passenger-enter" tag="div">
                <div 
                  v-for="passenger in getRidingPassengers()" 
                  :key="passenger.id"
                  class="passenger-inside"
                >
                  <div class="passenger-avatar">
                    <span class="avatar-emoji">👤</span>
                    <div class="riding-glow"></div>
                  </div>
                  <div class="passenger-name">{{passenger.name}}</div>
                </div>
              </transition-group>
            </div>

            <!-- Elevator Interior Lights -->
            <div class="interior-lights">
              <div class="light" :class="{ on: doorsOpen }"></div>
              <div class="light" :class="{ on: isMoving }"></div>
              <div class="light" :class="{ on: getRidingPassengers().length > 0 }"></div>
            </div>
          </div>
          
          <!-- Elevator Doors -->
          <div class="doors">
            <div class="door door-left" :class="{ open: doorsOpen }">
              <div class="door-handle"></div>
              <div class="door-window"></div>
            </div>
            <div class="door door-right" :class="{ open: doorsOpen }">
              <div class="door-handle"></div>
              <div class="door-window"></div>
            </div>
          </div>

          <!-- Door Opening Light Effect -->
          <div class="door-light" :class="{ active: doorsOpen }"></div>
        </div>
      </div>

      <!-- Moving Passenger Animation -->
      <transition name="passenger-move">
        <div 
          v-if="movingPassenger" 
          class="moving-passenger"
          :class="{ 
            boarding: movingPassenger.state === 'boarding',
            exiting: movingPassenger.state === 'exiting'
          }"
          :style="movingPassengerStyle"
        >
          <div class="passenger-avatar">
            <span class="avatar-emoji">👤</span>
            <div class="moving-trail"></div>
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
    <div class="timeline">
      <h4 class="timeline-title">
        <span>📋 Actions Timeline</span>
        <div class="timeline-progress" :style="{ width: (currentStep / actions.length) * 100 + '%' }"></div>
      </h4>
      <div class="actions">
        <transition-group name="action-slide" tag="div">
          <div 
            v-for="(action, index) in actions" 
            :key="index"
            class="action"
            :class="{ 
              current: index === currentStep,
              completed: index < currentStep,
              upcoming: index > currentStep
            }"
          >
            <div class="action-content">
              <span class="time">{{getActionTime(action)}}</span>
              <span class="desc">{{getActionDesc(action)}}</span>
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
import ElevatorSimulatorScript from './ElevatorSimulator.js'

export default ElevatorSimulatorScript
</script>

<style scoped>
@import './ElevatorSimulator.css';
</style>