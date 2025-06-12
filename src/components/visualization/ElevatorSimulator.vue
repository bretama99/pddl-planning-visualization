<!-- File: src/components/visualization/ElevatorSimulator.vue -->
<!-- 100% Dynamic Elevator Simulator - NO HARDCODED VALUES -->
<!-- Everything based on plan file content only -->

<template>
  <div class="elevator-simulator">
    <!-- Emergency Alert System (only if plan supports emergency) -->
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

    <!-- Capacity Warning (only if plan has capacity data) -->
    <transition name="warning-slide">
      <div v-if="showCapacityWarning && availableFeatures.showCapacity" class="capacity-warning">
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

    <!-- Moving Passenger Animation -->
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
          <div v-if="availableFeatures.showWeight && movingPassenger.weight" class="passenger-weight">
            {{ movingPassenger.weight }}kg
          </div>
        </div>
        <div class="passenger-info">
          <div class="passenger-name">{{ movingPassenger.name }}</div>
        </div>
        <div class="movement-indicator">
          <span v-if="movingPassenger.animationState === 'boarding'">➡️</span>
          <span v-else-if="movingPassenger.animationState === 'exiting'">⬅️</span>
        </div>
      </div>
    </transition>

    <!-- HEADER with Dynamic Control Panel -->
    <div class="header">
      <h3 class="title">
        <span class="title-icon">🏢</span>
        <span>Dynamic Elevator System</span>
        <span class="pddl-badge" :class="pddlType">{{ getPDDLTypeName(pddlType) }}</span>
        <span v-if="!actions.length" class="no-data-badge">NO PLAN DATA</span>
      </h3>
      
      <!-- Multi-Elevator Selector (only if multiple elevators detected) -->
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
        <button @click="play" :disabled="isPlaying || emergencyStop || !actions.length" class="btn play-btn">
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

    <!-- MAIN CONTENT: Building Visualization and Actions Timeline -->
    <div class="main-content">
      <!-- Left Column - Dynamic Building Visualization -->
      <div class="building-column">
        <div class="building-header">
          <h4>Building Visualization</h4>
          <div class="building-info">
            <span>{{ floorLabels.length }} Floors • {{ elevators.length }} Elevators</span>
            <div v-if="Object.keys(availableFeatures).some(key => availableFeatures[key])" class="features-available">
              <span v-if="availableFeatures.showCapacity" class="feature-tag">📊 Capacity</span>
              <span v-if="availableFeatures.showWeight" class="feature-tag">⚖️ Weight</span>
              <span v-if="availableFeatures.showSpeed" class="feature-tag">⚡ Speed</span>
              <span v-if="availableFeatures.showEnergy" class="feature-tag">🔋 Energy</span>
              <span v-if="availableFeatures.showTime" class="feature-tag">⏱️ Time</span>
              <span v-if="availableFeatures.showCost" class="feature-tag">💰 Cost</span>
            </div>
          </div>
        </div>

        <!-- Dynamic Building -->
        <div class="building" v-if="floorLabels.length > 0">
          <!-- Emergency Lighting Effect -->
          <div v-if="emergencyStop" class="emergency-lighting"></div>
          
          <!-- Floors with Dynamic Features -->
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
            <!-- Dynamic Floor Information Panel -->
            <div class="floor-label">
              <span class="floor-number">{{ floorLabel }}</span>
              <div v-if="currentFloorName === floorLabel" class="current-floor-marker">
                <span class="elevator-indicator">🛗</span>
                <div v-if="availableFeatures.showWeight" class="floor-weight">
                  {{ mainElevator.currentWeight }}kg
                </div>
              </div>
            </div>
            
            <!-- Dynamic Passengers Waiting -->
            <div class="waiting-passengers">
              <div 
                v-for="passenger in getPassengersAtFloor(getPositionForFloor(index))" 
                :key="passenger.id"
                class="passenger-waiting"
                :class="{ 
                  'passenger-excited': passenger.state === 'delivered'
                }"
                :style="{ borderColor: passenger.color }"
              >
                <div class="passenger-avatar">
                  <span class="avatar-emoji">{{ passenger.avatar }}</span>
                </div>
                <div class="passenger-details">
                  <div class="passenger-name">{{ passenger.name }}</div>
                  <div v-if="availableFeatures.showWeight && passenger.weight" class="passenger-weight">
                    {{ passenger.weight }}kg
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
                      @click="callElevator(getPositionForFloor(index), 'up')">
                ⬆️
              </button>
              <button v-if="index < floorLabels.length - 1" 
                      class="call-button down-button"
                      @click="callElevator(getPositionForFloor(index), 'down')">
                ⬇️
              </button>
            </div>
          </div>

          <!-- Dynamic Multi-Elevator Shafts -->
          <div class="elevator-shafts">
            <div v-for="(elevator, elevatorIndex) in elevators" 
                 :key="elevator.id"
                 class="elevator-shaft"
                 :style="{ left: (50 + elevatorIndex * 15) + '%' }">
              
              <!-- Dynamic Elevator Car -->
              <div 
                class="elevator-car"
                :class="{ 
                  moving: elevator.isMoving,
                  'doors-open': elevator.doorsOpen,
                  emergency: emergencyStop,
                  active: elevatorIndex === activeElevatorId
                }"
                :style="{ 
                  bottom: ((elevator.position - minPosition) * 150 + 20) + 'px',
                  transition: elevator.isMoving ? `bottom ${2/speed}s ease-in-out` : 'none',
                  borderColor: elevator.color
                }"
              >
                <!-- Dynamic Elevator Interior -->
                <div class="elevator-interior">
                  <!-- Dynamic Floor Display -->
                  <div class="floor-display">
                    <div class="display-screen">
                      <div class="floor-text">{{ getFloorName(elevator.position) }}</div>
                      <div v-if="availableFeatures.showCapacity" class="capacity-display">
                        {{ elevator.currentWeight }}kg
                      </div>
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
                  
                  <!-- Dynamic Passengers Inside -->
                  <div class="inside-passengers">
                    <div 
                      v-for="passenger in elevator.passengers" 
                      :key="passenger.id"
                      class="passenger-inside"
                    >
                      <div class="passenger-avatar">
                        <span class="avatar-emoji">{{ passenger.avatar }}</span>
                      </div>
                      <div class="passenger-info">
                        <div class="passenger-name">{{ passenger.name }}</div>
                        <div v-if="availableFeatures.showWeight && passenger.weight" class="passenger-weight">
                          {{ passenger.weight }}kg
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Dynamic Capacity Visualization (only if plan has capacity data) -->
                  <div v-if="availableFeatures.showCapacity && elevator.maxCapacity" class="capacity-indicator">
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
                
                <!-- Elevator Doors -->
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

        <!-- No Data Message -->
        <div v-else class="no-building-data">
          <div class="no-data-icon">🏢</div>
          <div class="no-data-message">
            <h4>No Building Data Available</h4>
            <p>Upload a plan file with elevator actions to see the building visualization.</p>
          </div>
        </div>
      </div>

      <!-- Right Column - Actions Timeline -->
      <div class="timeline-column">
        <div class="timeline">
          <h4 class="timeline-title">
            <span>📋 Actions Timeline</span>
            <div v-if="actions.length" class="timeline-progress" 
                 :style="{ width: (currentStep / actions.length) * 100 + '%' }">
            </div>
          </h4>
          <div class="actions">
            <div v-if="!actions.length" class="no-actions">
              <div class="no-actions-icon">📋</div>
              <div class="no-actions-message">
                <h4>No Actions Defined</h4>
                <p>Upload a plan file to see the action sequence.</p>
              </div>
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
                <span v-if="availableFeatures.showTime" class="time">
                  {{ action.time || action.start || index }}
                </span>
                <span class="desc">{{ getActionDesc(action) }}</span>
                <div class="action-status">
                  <div v-if="index === currentStep" class="status-icon current-icon">▶️</div>
                  <div v-else-if="index < currentStep" class="status-icon done-icon">✅</div>
                  <div v-else class="status-icon upcoming-icon">⏳</div>
                </div>
              </div>
              
              <!-- Dynamic Action Details (only show available data) -->
              <div v-if="index === currentStep" class="action-details">
                <div v-if="action.params" class="action-params">
                  Parameters: {{ action.params.join(', ') }}
                </div>
                <div v-if="availableFeatures.showCost && action.cost" class="action-cost">
                  Cost: {{ action.cost }}
                </div>
                <div v-if="availableFeatures.showTime && action.duration" class="action-duration">
                  Duration: {{ action.duration }}s
                </div>
                <div v-if="availableFeatures.showEnergy && action.energyCost" class="action-energy">
                  Energy: {{ action.energyCost }}kWh
                </div>
                <div v-if="availableFeatures.showWeight && action.passengerWeight" class="action-weight">
                  Weight: {{ action.passengerWeight }}kg
                </div>
                <div v-if="availableFeatures.showSpeed && action.elevatorSpeed" class="action-speed">
                  Speed: {{ action.elevatorSpeed }}m/s
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DASHBOARD: Dynamic System Status and Metrics -->
    <div class="system-dashboard">
      <!-- Dynamic System Information Panel -->
      <div class="control-panels-row">
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
              <span class="info-value">{{ passengerCount }}</span>
            </div>
            <!-- Only show weight if plan has weight data -->
            <div v-if="availableFeatures.showWeight" class="info-item">
              <span class="info-label">⚖️ Weight:</span>
              <span class="info-value">{{ mainElevator.currentWeight }}kg</span>
            </div>
            <!-- Only show capacity if plan has capacity data -->
            <div v-if="availableFeatures.showCapacity && mainElevator.maxCapacity" class="info-item">
              <span class="info-label">📊 Capacity:</span>
              <span class="info-value">{{ mainElevator.currentWeight }}/{{ mainElevator.maxCapacity }}kg</span>
            </div>
            <!-- Only show speed if plan has speed data -->
            <div v-if="availableFeatures.showSpeed && mainElevator.speed" class="info-item">
              <span class="info-label">⚡ Speed:</span>
              <span class="info-value">{{ mainElevator.speed }}m/s</span>
            </div>
            <div class="info-item">
              <span class="info-label">📋 PDDL Type:</span>
              <span class="info-value">{{ getPDDLTypeDescription(pddlType) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">🎬 Step:</span>
              <span class="info-value">{{ currentStep + 1 }} / {{ actions.length || 0 }}</span>
            </div>
            <!-- Only show duration if plan has time data -->
            <div v-if="availableFeatures.showTime && showDurationInfo && currentActionDuration" class="info-item">
              <span class="info-label">⏱️ Duration:</span>
              <span class="info-value">{{ (currentActionDuration / 1000).toFixed(1) }}s</span>
            </div>
            <!-- Only show energy rating if plan has energy data -->
            <div v-if="availableFeatures.showEnergy && energyRating" class="info-item">
              <span class="info-label">⚡ Energy Rating:</span>
              <span class="info-value">{{ energyRating }}</span>
            </div>
          </div>
        </div>

        <!-- Available Features Panel -->
        <div class="features-panel">
          <h4 class="panel-title">
            <span>🔍 Available Features</span>
            <div class="features-count">
              {{ Object.values(availableFeatures).filter(Boolean).length }}/{{ Object.keys(availableFeatures).length }}
            </div>
          </h4>
          <div class="features-grid">
            <div v-for="(enabled, feature) in availableFeatures" :key="feature" 
                 class="feature-item" :class="{ enabled }">
              <span class="feature-icon">{{ enabled ? '✅' : '❌' }}</span>
              <span class="feature-name">{{ formatFeatureName(feature) }}</span>
            </div>
          </div>
        </div>

        <!-- Smart Scheduling Panel (only if multiple elevators) -->
        <div v-if="elevators.length > 1" class="scheduling-panel">
          <h4 class="panel-title">
            <span>🧠 Smart Scheduling</span>
            <div v-if="elevatorAlgorithm" class="algorithm-badge">{{ elevatorAlgorithm }}</div>
          </h4>
          <div class="pending-calls">
            <div v-if="pendingCalls.length === 0" class="no-calls">No pending calls</div>
            <div v-for="call in pendingCalls" :key="call.floor + call.elevator" class="call-item">
              <span class="call-floor">Floor {{ call.floor + 1 }}</span>
              <span class="call-elevator">{{ call.elevator }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dynamic Elevator Status Cards -->
      <div class="elevator-status-grid">
        <div v-for="(elevator, index) in elevators" :key="elevator.id" 
             class="elevator-card"
             :class="{ active: index === activeElevatorId, emergency: emergencyStop }"
             @click="activeElevatorId = index">
          <div class="elevator-header">
            <span class="elevator-id">{{ elevator.id }}</span>
            <span class="elevator-status" :class="elevator.status">{{ elevator.status.toUpperCase() }}</span>
          </div>
          <div class="elevator-metrics">
            <div class="metric">
              <span class="metric-icon">📍</span>
              <span>{{ getFloorName(elevator.position) }}</span>
            </div>
            <div class="metric">
              <span class="metric-icon">👥</span>
              <span>{{ elevator.passengers.length }}</span>
            </div>
            <!-- Only show weight if available -->
            <div v-if="availableFeatures.showWeight" class="metric">
              <span class="metric-icon">⚖️</span>
              <span>{{ elevator.currentWeight }}kg</span>
            </div>
            <!-- Only show capacity if available -->
            <div v-if="availableFeatures.showCapacity && elevator.maxCapacity" class="metric">
              <span class="metric-icon">📊</span>
              <span>{{ elevator.currentWeight }}/{{ elevator.maxCapacity }}kg</span>
            </div>
            <!-- Only show energy if available -->
            <div v-if="availableFeatures.showEnergy && elevator.energyUsed !== undefined" class="metric">
              <span class="metric-icon">⚡</span>
              <span>{{ elevator.energyUsed.toFixed(1) }}kWh</span>
            </div>
            <!-- Only show speed if available -->
            <div v-if="availableFeatures.showSpeed && elevator.speed" class="metric">
              <span class="metric-icon">🚀</span>
              <span>{{ elevator.speed }}m/s</span>
            </div>
          </div>
          
          <!-- Dynamic Capacity Bar (only if plan has capacity data) -->
          <div v-if="availableFeatures.showCapacity && elevator.maxCapacity" class="capacity-bar">
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

      <!-- Dynamic Real-time System Metrics (only show available data) -->
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
            <div class="metric-value">{{ passengers.filter(p => p.state === 'delivered').length }}/{{ passengers.length }}</div>
            <div class="metric-label">Passengers Served</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">📋</div>
          <div class="metric-content">
            <div class="metric-value">{{ actions.length }}</div>
            <div class="metric-label">Total Actions</div>
          </div>
        </div>
        <!-- Only show energy metrics if plan has energy data -->
        <div v-if="availableFeatures.showEnergy && energyRating" class="metric-card">
          <div class="metric-icon">⚡</div>
          <div class="metric-content">
            <div class="metric-value">{{ energyRating }}</div>
            <div class="metric-label">Energy Rating</div>
          </div>
        </div>
        <!-- Only show time metrics if plan has time data -->
        <div v-if="availableFeatures.showTime && metrics.hasTimeMetrics" class="metric-card">
          <div class="metric-icon">⏱️</div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.totalDuration?.toFixed(1) || 'N/A' }}s</div>
            <div class="metric-label">Total Duration</div>
          </div>
        </div>
        <!-- Only show cost metrics if plan has cost data -->
        <div v-if="availableFeatures.showCost && metrics.hasCostMetrics" class="metric-card">
          <div class="metric-icon">💰</div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.totalCost?.toFixed(1) || 'N/A' }}</div>
            <div class="metric-label">Total Cost</div>
          </div>
        </div>
        <!-- Only show capacity metrics if plan has capacity data -->
        <div v-if="availableFeatures.showCapacity && metrics.hasCapacityMetrics" class="metric-card">
          <div class="metric-icon">📊</div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.averageCapacityUtilization?.toFixed(0) || 'N/A' }}%</div>
            <div class="metric-label">Avg Capacity</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Import the 100% Dynamic ElevatorSimulator JavaScript logic
import DynamicElevatorSimulatorLogic from './ElevatorSimulator.js';

// Export the complete component with the imported dynamic logic
export default {
  name: 'ElevatorSimulator',
  ...DynamicElevatorSimulatorLogic,
  methods: {
    ...DynamicElevatorSimulatorLogic.methods,
    
    // Additional method for formatting feature names
    formatFeatureName(feature) {
      const names = {
        showCapacity: 'Capacity',
        showWeight: 'Weight',
        showSpeed: 'Speed', 
        showEnergy: 'Energy',
        showTime: 'Time',
        showCost: 'Cost',
        showParallel: 'Parallel',
        showContinuous: 'Continuous',
        showEvents: 'Events'
      };
      return names[feature] || feature;
    }
  }
};
</script>

<style>
/* Import the existing ElevatorSimulator CSS styles */
@import './ElevatorSimulator.css';

/* Additional styles for dynamic features */
.no-data-badge {
  background: #e74c3c;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7em;
  margin-left: 8px;
}

.features-available {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.feature-tag {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.7em;
  border: 1px solid rgba(52, 152, 219, 0.3);
}

.no-building-data,
.no-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: #7f8c8d;
  background: rgba(236, 240, 241, 0.5);
  border-radius: 8px;
  margin: 20px;
}

.no-data-icon,
.no-actions-icon {
  font-size: 3em;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-data-message h4,
.no-actions-message h4 {
  margin: 0 0 8px 0;
  color: #34495e;
}

.no-data-message p,
.no-actions-message p {
  margin: 0;
  font-size: 0.9em;
}

.features-panel {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 4px;
  font-size: 0.85em;
}

.feature-item.enabled {
  background: rgba(46, 204, 113, 0.1);
  color: #27ae60;
}

.feature-item:not(.enabled) {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.features-count {
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
}
</style>