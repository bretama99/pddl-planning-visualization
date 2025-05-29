## 🗂️ **src/views/ElevatorVisualization.vue**
```vue
<template>
  <div class="elevator-visualization">
    <!-- Navigation Header -->
    <nav class="nav-header">
      <div class="nav-container">
        <router-link to="/" class="nav-logo">
          🛗 PDDL Visualizer
        </router-link>
        
        <div class="nav-tabs">
          <router-link to="/robot" class="nav-tab">
            🤖 Robot
          </router-link>
          <router-link to="/elevator" class="nav-tab active">
            🛗 Elevator
          </router-link>
          <router-link to="/logistics" class="nav-tab">
            🚚 Logistics
          </router-link>
        </div>
        
        <div class="nav-actions">
          <button @click="showHelp = true" class="help-btn">
            ❓ Help
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="main-container">
      <!-- Sidebar Controls -->
      <aside class="sidebar">
        <div class="sidebar-section">
          <h3>📁 Plan Upload</h3>
          <FileUpload 
            @file-uploaded="handleFileUpload"
            :loading="isProcessing"
            accept=".txt,.plan,.pddl"
          />
        </div>

        <div class="sidebar-section" v-if="fileName">
          <h3>⚙️ Configuration</h3>
          <div class="config-form">
            <div class="form-group">
              <label>PDDL Type:</label>
              <select v-model="selectedType" class="form-select">
                <option value="">Select Type</option>
                <option value="classical">Classical</option>
                <option value="numeric">Numeric/Metric</option>
                <option value="temporal">Temporal/Durative</option>
              </select>
            </div>

            <div class="form-group">
              <label>Building Layout:</label>
              <select v-model="buildingType" class="form-select">
                <option value="office">Office Building (5 floors)</option>
                <option value="residential">Residential (10 floors)</option>
                <option value="hospital">Hospital (8 floors)</option>
                <option value="mall">Shopping Mall (4 floors)</option>
                <option value="skyscraper">Skyscraper (20 floors)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Elevator Configuration:</label>
              <select v-model="elevatorConfig" class="form-select">
                <option value="single">Single Elevator</option>
                <option value="dual">Dual Elevators</option>
                <option value="bank">Elevator Bank (4)</option>
                <option value="express">Express + Local</option>
              </select>
            </div>

            <div class="form-group">
              <label>Passenger Load:</label>
              <select v-model="passengerLoad" class="form-select">
                <option value="light">Light Traffic</option>
                <option value="medium">Medium Traffic</option>
                <option value="heavy">Heavy Traffic</option>
                <option value="rush">Rush Hour</option>
              </select>
            </div>

            <button 
              @click="startVisualization"
              :disabled="!canStart"
              class="start-btn"
              :class="{ disabled: !canStart }"
            >
              🚀 Start Simulation
            </button>
          </div>
        </div>

        <div class="sidebar-section" v-if="simulationActive">
          <h3>📊 Live Statistics</h3>
          <div class="stats-panel">
            <div class="stat-item">
              <span class="stat-icon">🛗</span>
              <div class="stat-content">
                <span class="stat-label">Elevators Active</span>
                <span class="stat-value">{{ activeElevators }}</span>
              </div>
            </div>

            <div class="stat-item">
              <span class="stat-icon">👥</span>
              <div class="stat-content">
                <span class="stat-label">Passengers</span>
                <span class="stat-value">{{ passengersTransported }}/{{ totalPassengers }}</span>
              </div>
            </div>

            <div class="stat-item">
              <span class="stat-icon">⏱️</span>
              <div class="stat-content">
                <span class="stat-label">Avg Wait Time</span>
                <span class="stat-value">{{ averageWaitTime.toFixed(1) }}s</span>
              </div>
            </div>

            <div class="stat-item">
              <span class="stat-icon">🏢</span>
              <div class="stat-content">
                <span class="stat-label">Floor Changes</span>
                <span class="stat-value">{{ floorChanges }}</span>
              </div>
            </div>

            <div class="stat-item">
              <span class="stat-icon">⚡</span>
              <div class="stat-content">
                <span class="stat-label">Efficiency</span>
                <span class="stat-value">{{ efficiency.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-section" v-if="simulationActive">
          <h3>🎛️ Live Controls</h3>
          <div class="live-controls">
            <div class="control-group">
              <label>Emergency Stop:</label>
              <button @click="emergencyStop" class="emergency-btn">
                🚨 STOP ALL
              </button>
            </div>

            <div class="control-group">
              <label>Maintenance Mode:</label>
              <select v-model="maintenanceElevator" @change="setMaintenance">
                <option value="">No Maintenance</option>
                <option v-for="i in elevatorCount" :key="i" :value="i">
                  Elevator {{ i }}
                </option>
              </select>
            </div>

            <div class="control-group">
              <label>Speed Multiplier:</label>
              <input 
                type="range" 
                min="0.1" 
                max="3" 
                step="0.1" 
                v-model="speedMultiplier"
                @input="updateSpeed"
                class="speed-slider"
              />
              <span class="speed-value">{{ speedMultiplier }}x</span>
            </div>
          </div>
        </div>

        <div class="sidebar-section" v-if="simulationActive">
          <h3>📈 Performance Monitor</h3>
          <div class="performance-charts">
            <div class="mini-chart">
              <h5>Wait Times</h5>
              <canvas ref="waitTimeChart" width="200" height="100"></canvas>
            </div>
            <div class="mini-chart">
              <h5>Throughput</h5>
              <canvas ref="throughputChart" width="200" height="100"></canvas>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Visualization Area -->
      <main class="visualization-area">
        <div v-if="!simulationActive" class="welcome-screen">
          <div class="welcome-content">
            <div class="welcome-icon">🛗</div>
            <h2>Elevator Domain Visualizer</h2>
            <p>Optimize elevator scheduling and passenger transport with real-time 3D simulation</p>
            
            <div class="welcome-features">
              <div class="feature-item">
                <span class="feature-icon">🏢</span>
                <span class="feature-text">Multi-floor building simulation</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">👥</span>
                <span class="feature-text">Intelligent passenger AI</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <span class="feature-text">Real-time performance metrics</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🎛️</span>
                <span class="feature-text">Live control and monitoring</span>
              </div>
            </div>

            <div class="sample-plans">
              <h4>📄 Try Sample Scenarios:</h4>
              <div class="sample-buttons">
                <button @click="loadSamplePlan('morning-rush')" class="sample-btn">
                  Morning Rush Hour
                </button>
                <button @click="loadSamplePlan('maintenance')" class="sample-btn">
                  Maintenance Schedule
                </button>
                <button @click="loadSamplePlan('emergency')" class="sample-btn">
                  Emergency Evacuation
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="simulation-container">
          <ElevatorSimulator 
            :actions="parsedActions"
            :plan-type="selectedType"
            :building-type="buildingType"
            :elevator-config="elevatorConfig"
            :passenger-load="passengerLoad"
            :speed-multiplier="speedMultiplier"
            @stats-update="updateStats"
            @simulation-complete="onSimulationComplete"
            ref="elevatorSimulator"
          />
        </div>
      </main>
    </div>

    <!-- Error Display -->
    <ErrorMessage 
      v-if="error" 
      :message="error" 
      :severity="errorSeverity"
      @dismiss="error = ''"
    />

    <!-- Help Modal -->
    <div v-if="showHelp" class="modal-overlay" @click="showHelp = false">
      <div class="modal-content help-modal" @click.stop>
        <div class="modal-header">
          <h3>🛗 Elevator Domain Help</h3>
          <button @click="showHelp = false" class="modal-close">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="help-section">
            <h4>📁 Supported Actions</h4>
            <div class="action-examples">
              <div class="action-example">
                <strong>Board Elevator:</strong>
                <code>(board-elevator passenger1 floor3)</code>
              </div>
              <div class="action-example">
                <strong>Move Elevator:</strong>
                <code>(move-elevator floor3 floor7)</code>
              </div>
              <div class="action-example">
                <strong>Leave Elevator:</strong>
                <code>(leave-elevator passenger1 floor7)</code>
              </div>
              <div class="action-example">
                <strong>Temporal Example:</strong>
                <code>0.00: (board-elevator passenger1 floor1) [2.0]</code>
                <code>2.00: (move-elevator floor1 floor5) [8.0]</code>
                <code>10.00: (leave-elevator passenger1 floor5) [2.0]</code>
              </div>
            </div>
          </div>

          <div class="help-section">
            <h4>🏢 Building Types</h4>
            <ul>
              <li><strong>Office:</strong> 5 floors, business hours traffic</li>
              <li><strong>Residential:</strong> 10 floors, varied daily patterns</li>
              <li><strong>Hospital:</strong> 8 floors, 24/7 emergency access</li>
              <li><strong>Mall:</strong> 4 floors, shopping traffic patterns</li>
              <li><strong>Skyscraper:</strong> 20 floors, express/local zones</li>
            </ul>
          </div>

          <div class="help-section">
            <h4>📊 Performance Metrics</h4>
            <ul>
              <li><strong>Wait Time:</strong> Average passenger waiting time</li>
              <li><strong>Throughput:</strong> Passengers transported per minute</li>
              <li><strong>Efficiency:</strong> Optimal vs actual performance</li>
              <li><strong>Energy Usage:</strong> Power consumption tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import ElevatorSimulator from '@/components/visualization/ElevatorSimulator.vue'
import FileUpload from '@/components/ui/FileUpload.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import { parsePlanFile } from '@/services/planParser.js'

export default {
  name: 'ElevatorVisualization',
  components: {
    ElevatorSimulator,
    FileUpload,
    ErrorMessage
  },
  setup() {
    // State
    const fileName = ref('')
    const fileContent = ref('')
    const selectedType = ref('')
    const buildingType = ref('office')
    const elevatorConfig = ref('single')
    const passengerLoad = ref('medium')
    const simulationActive = ref(false)
    const isProcessing = ref(false)
    const error = ref('')
    const errorSeverity = ref('error')
    const showHelp = ref(false)
    const speedMultiplier = ref(1)
    const maintenanceElevator = ref('')
    
    // Refs
    const elevatorSimulator = ref(null)
    const waitTimeChart = ref(null)
    const throughputChart = ref(null)
    
    // Parsed data
    const parsedActions = ref([])
    
    // Statistics
    const activeElevators = ref(0)
    const passengersTransported = ref(0)
    const totalPassengers = ref(0)
    const averageWaitTime = ref(0)
    const floorChanges = ref(0)
    const efficiency = ref(100)
    const elevatorCount = ref(1)
    
    // Computed
    const canStart = computed(() => {
      return fileName.value && selectedType.value && !isProcessing.value
    })
    
    // Methods
    const handleFileUpload = ({ name, content }) => {
      fileName.value = name
      fileContent.value = content
      error.value = ''
    }
    
    const startVisualization = async () => {
      if (!canStart.value) return
      
      isProcessing.value = true
      error.value = ''
      
      try {
        const actions = parsePlanFile(fileContent.value, selectedType.value)
        
        if (actions.length === 0) {
          throw new Error('No valid actions found in the plan file')
        }
        
        parsedActions.value = actions
        simulationActive.value = true
        
        // Set elevator count based on config
        const configCounts = {
          single: 1,
          dual: 2,
          bank: 4,
          express: 3
        }
        elevatorCount.value = configCounts[elevatorConfig.value] || 1
        
        // Reset stats
        activeElevators.value = elevatorCount.value
        passengersTransported.value = 0
        totalPassengers.value = countPassengers(actions)
        averageWaitTime.value = 0
        floorChanges.value = 0
        efficiency.value = 100
        
      } catch (err) {
        error.value = `Error parsing plan: ${err.message}`
        errorSeverity.value = 'error'
      } finally {
        isProcessing.value = false
      }
    }
    
    const countPassengers = (actions) => {
      const passengers = new Set()
      actions.forEach(action => {
        if (action.name.includes('board') || action.name.includes('leave')) {
          const params = action.parameters.split(' ')
          if (params.length > 0) {
            passengers.add(params[0])
          }
        }
      })
      return passengers.size
    }
    
    const updateStats = (stats) => {
      activeElevators.value = stats.activeElevators
      passengersTransported.value = stats.passengersTransported
      averageWaitTime.value = stats.averageWaitTime
      floorChanges.value = stats.floorChanges
      efficiency.value = stats.efficiency
      
      updateCharts(stats)
    }
    
    const updateCharts = (stats) => {
      // Update mini charts with latest data
      if (waitTimeChart.value) {
        drawWaitTimeChart(stats.waitTimeHistory)
      }
      if (throughputChart.value) {
        drawThroughputChart(stats.throughputHistory)
      }
    }
    
    const drawWaitTimeChart = (data) => {
      const canvas = waitTimeChart.value
      const ctx = canvas.getContext('2d')
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (!data || data.length === 0) return
      
      // Draw simple line chart
      ctx.strokeStyle = '#3498db'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      const maxValue = Math.max(...data)
      const stepX = canvas.width / (data.length - 1)
      const stepY = canvas.height / maxValue
      
      data.forEach((value, index) => {
        const x = index * stepX
        const y = canvas.height - (value * stepY)
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.stroke()
    }
    
    const drawThroughputChart = (data) => {
      const canvas = throughputChart.value
      const ctx = canvas.getContext('2d')
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (!data || data.length === 0) return
      
      // Draw bar chart
      ctx.fillStyle = '#27ae60'
      
      const maxValue = Math.max(...data)
      const barWidth = canvas.width / data.length
      
      data.forEach((value, index) => {
        const x = index * barWidth
        const height = (value / maxValue) * canvas.height
        const y = canvas.height - height
        
        ctx.fillRect(x, y, barWidth - 1, height)
      })
    }
    
    const emergencyStop = () => {
      if (elevatorSimulator.value) {
        elevatorSimulator.value.emergencyStop()
      }
    }
    
    const setMaintenance = () => {
      if (elevatorSimulator.value) {
        elevatorSimulator.value.setMaintenanceMode(maintenanceElevator.value)
      }
    }
    
    const updateSpeed = () => {
      if (elevatorSimulator.value) {
        elevatorSimulator.value.setSpeedMultiplier(speedMultiplier.value)
      }
    }
    
    const onSimulationComplete = () => {
      // Handle simulation completion
      console.log('Elevator simulation completed')
    }
    
    const loadSamplePlan = (type) => {
      const samplePlans = {
        'morning-rush': {
          content: `0.00: (board-elevator passenger1 floor1) [2.0]
0.00: (board-elevator passenger2 floor1) [2.0]
2.00: (move-elevator floor1 floor8) [12.0]
14.00: (leave-elevator passenger1 floor8) [2.0]
16.00: (leave-elevator passenger2 floor8) [2.0]
18.00: (move-elevator floor8 floor1) [12.0]
30.00: (board-elevator passenger3 floor1) [2.0]
32.00: (move-elevator floor1 floor5) [8.0]
40.00: (leave-elevator passenger3 floor5) [2.0]`,
          type: 'temporal'
        },
        'maintenance': {
          content: `(move-elevator floor1 floor5)
(maintenance-check elevator1 floor5)
(move-elevator floor5 floor10)
(maintenance-check elevator1 floor10)
(move-elevator floor10 floor1)`,
          type: 'classical'
        },
        'emergency': {
          content: `0.00: (emergency-call floor7) [1.0]
1.00: (move-elevator floor3 floor7) [8.0]
9.00: (board-elevator passenger1 floor7) [1.0]
10.00: (board-elevator passenger2 floor7) [1.0]
11.00: (move-elevator floor7 floor1) [12.0]
23.00: (leave-elevator passenger1 floor1) [1.0]
24.00: (leave-elevator passenger2 floor1) [1.0]`,
          type: 'temporal'
        }
      }
      
      const plan = samplePlans[type]
      if (plan) {
        fileName.value = `sample-${type}.txt`
        fileContent.value = plan.content
        selectedType.value = plan.type
      }
    }
    
    return {
      // State
      fileName,
      selectedType,
      buildingType,
      elevatorConfig,
      passengerLoad,
      simulationActive,
      isProcessing,
      error,
      errorSeverity,
      showHelp,
      speedMultiplier,
      maintenanceElevator,
      
      // Refs
      elevatorSimulator,
      waitTimeChart,
      throughputChart,
      
      // Data
      parsedActions,
      
      // Stats
      activeElevators,
      passengersTransported,
      totalPassengers,
      averageWaitTime,
      floorChanges,
      efficiency,
      elevatorCount,
      
      // Computed
      canStart,
      
      // Methods
      handleFileUpload,
      startVisualization,
      updateStats,
      emergencyStop,
      setMaintenance,
      updateSpeed,
      onSimulationComplete,
      loadSamplePlan
    }
  }
}
</script>

<style scoped>
/* Reuse most styles from RobotVisualization */
.elevator-visualization {
  min-height: 100vh;
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
}

.emergency-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.live-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.speed-slider {
  width: 100%;
  margin: 5px 0;
}

.speed-value {
  text-align: center;
  font-weight: 600;
  color: #3498db;
}

.performance-charts {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.mini-chart {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
}

.mini-chart h5 {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  color: #2c3e50;
}

.mini-chart canvas {
  width: 100%;
  height: 60px;
  border-radius: 4px;
}

.action-examples {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-example {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 3px solid #9b59b6;
}

.action-example strong {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
}

.action-example code {
  display: block;
  background: #e9ecef;
  padding: 5px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #9b59b6;
  margin-bottom: 3px;
  font-size: 0.9rem;
}

/* Copy other styles from RobotVisualization with elevator theme colors */
</style>