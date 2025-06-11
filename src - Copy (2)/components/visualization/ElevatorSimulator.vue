<template>
  <div class="elevator-simulator">
    <!-- Emergency Alert System -->
    <transition name="emergency-alert">
      <div v-if="emergencyStop || showOverloadAlert" class="emergency-alert">
        <div class="alert-icon">🚨</div>
        <div class="alert-content">
          <div class="alert-title">EMERGENCY ALERT</div>
          <div class="alert-message">
            {{ emergencyStop ? 'Emergency Stop Activated' : 'Elevator Overload Detected' }}
          </div>
        </div>
        <div class="alert-actions">
          <button @click="resetEmergency" class="reset-btn">Reset</button>
        </div>
      </div>
    </transition>

    <!-- Capacity Warning -->
    <transition name="warning-slide">
      <div v-if="showCapacityWarning" class="capacity-warning">
        <span class="warning-icon">⚠️</span>
        <span>Capacity Warning: {{ capacityUtilization }}% - Approaching Weight Limit</span>
      </div>
    </transition>

    <!-- Success Message -->
    <transition name="success-popup">
      <div v-if="showSuccess" class="success-message">
        🎉 {{ successMessage }}
      </div>
    </transition>

    <!-- Advanced Moving Passenger Animation -->
    <transition name="passenger-move">
      <div 
        v-if="movingPassenger" 
        class="moving-passenger"
        :class="{ 
          boarding: movingPassenger.animationState === 'boarding',
          exiting: movingPassenger.animationState === 'exiting'
        }"
        :style="movingPassengerStyle"
      >
        <div class="passenger-avatar">
          <span class="avatar-emoji">{{ movingPassenger.avatar || '👤' }}</span>
          <div class="passenger-weight">{{ movingPassenger.weight }}kg</div>
        </div>
        <div class="passenger-info">
          <div class="passenger-name">{{ movingPassenger.name }}</div>
          <div class="passenger-status">{{ movingPassenger.mobility }}</div>
        </div>
        <div class="movement-indicator">
          <span v-if="movingPassenger.animationState === 'boarding'">➡️</span>
          <span v-else-if="movingPassenger.animationState === 'exiting'">⬅️</span>
        </div>
      </div>
    </transition>

    <!-- Enhanced Header -->
    <div class="header">
      <h3 class="title">
        <span class="title-icon">🏢</span>
        <span>Advanced Elevator System</span>
        <span class="pddl-badge" :class="pddlType">{{ getPDDLTypeName(pddlType) }}</span>
      </h3>
      
      <!-- Multi-Elevator Selector -->
      <div class="elevator-selector" v-if="elevators.length > 1">
        <label>Active Elevator:</label>
        <select v-model="activeElevatorId" class="elevator-dropdown">
          <option v-for="(elevator, index) in elevators" :key="elevator.id" :value="index">
            {{ elevator.id }} - {{ elevator.status }}
          </option>
        </select>
      </div>

      <!-- Control Panel -->
      <div class="controls">
        <button @click="play" :disabled="isPlaying || emergencyStop" class="btn play-btn">
          {{ isPlaying ? '⏸️ Playing...' : '▶️ Play' }}
        </button>
        <button @click="pause" :disabled="!isPlaying" class="btn pause-btn">⏸️ Pause</button>
        <button @click="reset" class="btn reset-btn">🔄 Reset</button>
        <button @click="toggleEmergency" :class="['btn', emergencyStop ? 'emergency-active' : 'emergency-btn']">
          🚨 Emergency
        </button>
        <div class="speed-control">
          <label>Speed:</label>
          <input type="range" v-model="speed" min="0.5" max="3" step="0.1" class="speed-slider">
          <span class="speed-display">{{ speed }}x</span>
        </div>
      </div>
    </div>

    <!-- Enhanced System Status Dashboard -->
    <div class="system-dashboard">
      <!-- Elevator Status Cards -->
      <div class="elevator-status-grid">
        <div v-for="(elevator, index) in elevators" :key="elevator.id" 
             class="elevator-card"
             :class="{ active: index === activeElevatorId, emergency: elevator.emergency }"
             @click="activeElevatorId = index">
          <div class="elevator-header">
            <span class="elevator-id">{{ elevator.id }}</span>
            <span class="elevator-status" :class="elevator.status">{{ elevator.status.toUpperCase() }}</span>
          </div>
          <div class="elevator-metrics">
            <div class="metric">
              <span class="metric-icon">📍</span>
              <span>Floor {{ elevator.position + 1 }}</span>
            </div>
            <div class="metric">
              <span class="metric-icon">👥</span>
              <span>{{ elevator.passengers.length }}/{{ elevator.maxPassengers }}</span>
            </div>
            <div class="metric">
              <span class="metric-icon">⚖️</span>
              <span>{{ elevator.currentWeight }}/{{ elevator.maxCapacity }}kg</span>
            </div>
            <div class="metric">
              <span class="metric-icon">⚡</span>
              <span>{{ elevator.energyUsed.toFixed(1) }}kWh</span>
            </div>
          </div>
          <div class="capacity-bar">
            <div class="capacity-fill" 
                 :style="{ width: (elevator.currentWeight / elevator.maxCapacity * 100) + '%' }"
                 :class="{ 
                   warning: elevator.currentWeight / elevator.maxCapacity > 0.85,
                   danger: elevator.currentWeight / elevator.maxCapacity > 1.0
                 }">
            </div>
          </div>
        </div>
      </div>

      <!-- Real-time System Metrics -->
      <div class="metrics-panel">
        <div class="metric-card">
          <div class="metric-icon">🏢</div>
          <div class="metric-content">
            <div class="metric-value">{{ elevators.length }}</div>
            <div class="metric-label">Elevators</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">👥</div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.totalPassengersServed }}/{{ passengers.length }}</div>
            <div class="metric-label">Passengers Served</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">⚡</div>
          <div class="metric-content">
            <div class="metric-value">{{ energyRating }}</div>
            <div class="metric-label">Energy Rating</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">🔧</div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.maintenanceAlerts.length }}</div>
            <div class="metric-label">Alerts</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">⏱️</div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.averageJourneyTime.toFixed(1) }}s</div>
            <div class="metric-label">Avg Journey</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">📊</div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.elevatorEfficiency.toFixed(0) }}%</div>
            <div class="metric-label">Efficiency</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content - Enhanced Two Column Layout -->
    <div class="main-content">
      <!-- Left Column - Building Visualization -->
      <div class="building-column">
        <div class="building-header">
          <h4>Building Visualization</h4>
          <div class="building-info">
            <span>{{ floorLabels.length }} Floors • {{ elevators.length }} Elevators</span>
          </div>
        </div>

        <!-- Enhanced Building -->
        <div class="building" v-if="floorLabels.length > 0">
          <!-- Emergency Lighting Effect -->
          <div v-if="emergencyStop" class="emergency-lighting"></div>
          
          <!-- Floors with Enhanced Features -->
          <div 
            v-for="(floorLabel, index) in floorLabels" 
            :key="floorLabel"
            class="floor"
            :class="{ 
              active: currentFloorName === floorLabel,
              'current-floor': currentFloorName === floorLabel,
              'emergency-floor': emergencyStop
            }"
            :style="{ bottom: index * 150 + 'px' }"
          >
            <!-- Floor Information Panel -->
            <div class="floor-label">
              <span class="floor-number">{{ floorLabel }}</span>
              <div v-if="currentFloorName === floorLabel" class="current-floor-marker">
                <span class="elevator-indicator">🛗</span>
                <div class="floor-weight">{{ mainElevator.currentWeight }}kg</div>
              </div>
            </div>
            
            <!-- Enhanced Passengers Waiting -->
            <div class="waiting-passengers">
              <div 
                v-for="passenger in getPassengersAtFloor(getPositionForFloor(index))" 
                :key="passenger.id"
                class="passenger-waiting"
                :class="{ 
                  'passenger-excited': passenger.state === 'delivered',
                  'vip-passenger': passenger.vipStatus,
                  'accessibility-passenger': passenger.accessibilityNeeds
                }"
                :style="{ borderColor: passenger.color }"
              >
                <div class="passenger-avatar">
                  <span class="avatar-emoji">{{ passenger.avatar }}</span>
                  <div v-if="passenger.vipStatus" class="vip-badge">👑</div>
                  <div v-if="passenger.accessibilityNeeds" class="accessibility-badge">♿</div>
                </div>
                <div class="passenger-details">
                  <div class="passenger-name">{{ passenger.name }}</div>
                  <div class="passenger-weight">{{ passenger.weight }}kg</div>
                  <div class="passenger-urgency" :class="passenger.urgency">
                    {{ passenger.urgency.toUpperCase() }}
                  </div>
                </div>
                <div v-if="passenger.state === 'delivered'" class="delivery-badge">✅</div>
                <div v-if="passenger.state === 'waiting'" class="waiting-indicator">
                  <div class="waiting-time">{{ getWaitingTime(passenger) }}s</div>
                </div>
              </div>
            </div>

            <!-- Floor Call Buttons -->
            <div class="floor-controls">
              <button v-if="index > 0" 
                      class="call-button up-button"
                      :class="{ active: hasUpCall(getPositionForFloor(index)) }"
                      @click="callElevator(getPositionForFloor(index), 'up')">
                ⬆️
              </button>
              <button v-if="index < floorLabels.length - 1" 
                      class="call-button down-button"
                      :class="{ active: hasDownCall(getPositionForFloor(index)) }"
                      @click="callElevator(getPositionForFloor(index), 'down')">
                ⬇️
              </button>
            </div>
          </div>

          <!-- Enhanced Multi-Elevator Shafts -->
          <div class="elevator-shafts">
            <div v-for="(elevator, elevatorIndex) in elevators" 
                 :key="elevator.id"
                 class="elevator-shaft"
                 :style="{ left: (50 + elevatorIndex * 15) + '%' }">
              
              <!-- Elevator Car -->
              <div 
                class="elevator-car"
                :class="{ 
                  moving: elevator.isMoving,
                  'doors-open': elevator.doorsOpen,
                  emergency: elevator.emergency,
                  maintenance: maintenanceMode,
                  active: elevatorIndex === activeElevatorId
                }"
                :style="{ 
                  bottom: ((elevator.position - minPosition) * 150 + 20) + 'px',
                  transition: elevator.isMoving ? `bottom ${2/speed}s ease-in-out` : 'none',
                  borderColor: elevator.color
                }"
              >
                <!-- Elevator Interior -->
                <div class="elevator-interior">
                  <!-- Advanced Floor Display -->
                  <div class="floor-display">
                    <div class="display-screen">
                      <div class="floor-text">{{ getFloorName(elevator.position) }}</div>
                      <div class="capacity-display">{{ elevator.currentWeight }}kg</div>
                    </div>
                  </div>
                  
                  <!-- Direction and Status Indicators -->
                  <div class="status-indicators">
                    <div v-if="elevator.direction" class="direction">
                      <span class="direction-arrow">{{ elevator.direction === 'up' ? '⬆️' : '⬇️' }}</span>
                    </div>
                    <div class="elevator-status-indicator" :class="elevator.status">
                      {{ getStatusIcon(elevator.status) }}
                    </div>
                  </div>
                  
                  <!-- Enhanced Passengers Inside -->
                  <div class="inside-passengers">
                    <div 
                      v-for="passenger in elevator.passengers" 
                      :key="passenger.id"
                      class="passenger-inside"
                      :class="{ 
                        'vip-passenger': passenger.vipStatus,
                        'accessibility-passenger': passenger.accessibilityNeeds
                      }"
                    >
                      <div class="passenger-avatar">
                        <span class="avatar-emoji">{{ passenger.avatar }}</span>
                      </div>
                      <div class="passenger-info">
                        <div class="passenger-name">{{ passenger.name }}</div>
                        <div class="passenger-weight">{{ passenger.weight }}kg</div>
                      </div>
                    </div>
                  </div>

                  <!-- Capacity Visualization -->
                  <div class="capacity-indicator">
                    <div class="capacity-bar-small">
                      <div class="capacity-fill-small" 
                           :style="{ height: (elevator.currentWeight / elevator.maxCapacity * 100) + '%' }"
                           :class="{ 
                             warning: elevator.currentWeight / elevator.maxCapacity > 0.85,
                             danger: elevator.currentWeight / elevator.maxCapacity > 1.0
                           }">
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Enhanced Elevator Doors -->
                <div class="doors">
                  <div class="door door-left" :class="{ open: elevator.doorsOpen }">
                    <div class="door-sensor" :class="{ active: elevator.doorsOpen }"></div>
                  </div>
                  <div class="door door-right" :class="{ open: elevator.doorsOpen }">
                    <div class="door-sensor" :class="{ active: elevator.doorsOpen }"></div>
                  </div>
                </div>

                <!-- Elevator ID Badge -->
                <div class="elevator-id-badge" :style="{ backgroundColor: elevator.color }">
                  {{ elevator.id }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column - Enhanced Control Panel and Timeline -->
      <div class="control-column">
        <!-- Advanced System Information -->
        <div class="system-info-panel">
          <h4 class="panel-title">
            <span>🏢 System Status</span>
            <div class="system-health" :class="getSystemHealth()">
              {{ getSystemHealth().toUpperCase() }}
            </div>
          </h4>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">🛗 Main Elevator:</span>
              <span class="info-value">{{ mainElevator.id }} - {{ elevatorStatus }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📍 Current Position:</span>
              <span class="info-value">{{ mainElevator.position }} ({{ currentFloorName }})</span>
            </div>
            <div class="info-item">
              <span class="info-label">👥 Passengers:</span>
              <span class="info-value">{{ passengerCount }}/{{ mainElevator.maxPassengers }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">⚖️ Weight:</span>
              <span class="info-value">{{ mainElevator.currentWeight }}/{{ mainElevator.maxCapacity }}kg</span>
            </div>
            <div class="info-item">
              <span class="info-label">📋 PDDL Type:</span>
              <span class="info-value">{{ getPDDLTypeDescription(pddlType) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">🎬 Step:</span>
              <span class="info-value">{{ currentStep + 1 }} / {{ actions.length }}</span>
            </div>
            <div class="info-item" v-if="showDurationInfo && currentActionDuration">
              <span class="info-label">⏱️ Duration:</span>
              <span class="info-value">{{ (currentActionDuration / 1000).toFixed(1) }}s</span>
            </div>
            <div class="info-item">
              <span class="info-label">⚡ Energy Rating:</span>
              <span class="info-value">{{ energyRating }}</span>
            </div>
          </div>
        </div>

        <!-- Maintenance Alerts Panel -->
        <div v-if="metrics.maintenanceAlerts.length > 0" class="alerts-panel">
          <h4 class="panel-title">
            <span>🔧 Maintenance Alerts</span>
            <div class="alert-count">{{ metrics.maintenanceAlerts.length }}</div>
          </h4>
          <div class="alerts-list">
            <div v-for="(alert, index) in metrics.maintenanceAlerts.slice(-5)" 
                 :key="index" 
                 class="alert-item"
                 :class="alert.type">
              <div class="alert-icon">{{ getAlertIcon(alert.type) }}</div>
              <div class="alert-content">
                <div class="alert-title">{{ alert.type.replace('_', ' ').toUpperCase() }}</div>
                <div class="alert-details">{{ alert.details }}</div>
                <div class="alert-time">{{ formatAlertTime(alert.time) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Smart Scheduling Panel -->
        <div class="scheduling-panel">
          <h4 class="panel-title">
            <span>🧠 Smart Scheduling</span>
            <div class="algorithm-badge">{{ elevatorAlgorithm }}</div>
          </h4>
          <div class="pending-calls">
            <div v-if="pendingCalls.length === 0" class="no-calls">No pending calls</div>
            <div v-for="call in pendingCalls" :key="call.floor + call.elevator" class="call-item">
              <span class="call-floor">Floor {{ call.floor + 1 }}</span>
              <span class="call-elevator">{{ call.elevator }}</span>
              <span class="call-priority">Priority: {{ call.priority }}</span>
            </div>
          </div>
        </div>

        <!-- Enhanced Action Timeline -->
        <div class="timeline">
          <h4 class="timeline-title">
            <span>📋 Actions Timeline</span>
            <div class="timeline-progress" 
                 :style="{ width: actions.length ? (currentStep / actions.length) * 100 + '%' : '0%' }">
            </div>
          </h4>
          <div class="actions">
            <div v-if="!actions.length" class="no-actions">
              No actions defined
            </div>
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
                <span class="time">{{ action.time || action.start || index }}</span>
                <span class="desc">{{ getActionDesc(action) }}</span>
                <div class="action-status">
                  <div v-if="index === currentStep" class="status-icon current-icon">▶️</div>
                  <div v-else-if="index < currentStep" class="status-icon done-icon">✅</div>
                  <div v-else class="status-icon upcoming-icon">⏳</div>
                </div>
              </div>
              
              <!-- Enhanced Action Details -->
              <div v-if="index === currentStep" class="action-details">
                <div v-if="action.params" class="action-params">
                  Parameters: {{ action.params.join(', ') }}
                </div>
                <div v-if="pddlType === 'numerical' && action.cost" class="action-cost">
                  Cost: {{ action.cost }}
                </div>
                <div v-if="pddlType === 'temporal' && action.duration" class="action-duration">
                  Duration: {{ action.duration }}s
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Import the ElevatorSimulator JavaScript logic
import { ref, computed } from 'vue';
import ElevatorSimulatorLogic from './ElevatorSimulator.js';

// Export the complete component with the imported logic
export default {
  name: 'ElevatorSimulator',
  ...ElevatorSimulatorLogic
};
</script>

<style>
/* Import the ElevatorSimulator CSS styles */
@import './ElevatorSimulator.css';
</style>