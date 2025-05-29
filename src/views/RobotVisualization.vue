<template>
  <div class="robot-visualization">
    <!-- Navigation Header -->
    <nav class="nav-header">
      <div class="nav-container">
        <div class="nav-logo">
          🤖 PDDL Robot Visualizer
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

            <button 
              @click="startVisualization"
              :disabled="!canStart"
              class="start-btn"
              :class="{ disabled: !canStart }"
            >
              🚀 Start Robot Simulation
            </button>
          </div>
        </div>

        <div class="sidebar-section" v-if="simulationActive && parsedActions.length > 0">
          <h3>📊 Plan Information</h3>
          <div class="plan-info">
            <div class="info-item">
              <span class="info-label">Total Actions:</span>
              <span class="info-value">{{ parsedActions.length }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Plan Duration:</span>
              <span class="info-value">{{ totalDuration.toFixed(1) }}s</span>
            </div>
            <div class="info-item">
              <span class="info-label">PDDL Type:</span>
              <span class="info-value">{{ selectedType }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Domain:</span>
              <span class="info-value">{{ selectedDomain }}</span>
            </div>
          </div>
        </div>

        <div class="sidebar-section" v-if="simulationActive">
          <h3>📊 Live Statistics</h3>
          <div class="stats-panel">
            <div class="stat-item">
              <span class="stat-icon">🎯</span>
              <div class="stat-content">
                <span class="stat-label">Actions</span>
                <span class="stat-value">{{ completedActions }}/{{ totalActions }}</span>
              </div>
            </div>

            <div class="stat-item">
              <span class="stat-icon">📏</span>
              <div class="stat-content">
                <span class="stat-label">Distance</span>
                <span class="stat-value">{{ distanceTraveled.toFixed(1) }}m</span>
              </div>
            </div>

            <div class="stat-item">
              <span class="stat-icon">⏱️</span>
              <div class="stat-content">
                <span class="stat-label">Time</span>
                <span class="stat-value">{{ currentTime.toFixed(1) }}s</span>
              </div>
            </div>

            <div class="stat-item">
              <span class="stat-icon">📦</span>
              <div class="stat-content">
                <span class="stat-label">Objects</span>
                <span class="stat-value">{{ objectsManipulated }}</span>
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
          <h3>🎮 Quick Actions</h3>
          <div class="quick-actions">
            <button @click="resetSimulation" class="quick-btn reset-btn">
              🔄 Reset
            </button>
            <button @click="exportVideo" class="quick-btn export-btn">
              🎥 Export
            </button>
            <button @click="takeScreenshot" class="quick-btn screenshot-btn">
              📸 Screenshot
            </button>
            <button @click="showSettings = true" class="quick-btn settings-btn">
              ⚙️ Settings
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Visualization Area -->
      <main class="visualization-area">
        <div v-if="!simulationActive" class="welcome-screen">
          <div class="welcome-content">
            <div class="welcome-icon">🤖</div>
            <h2>Robot PDDL Plan Visualizer</h2>
            <p>Upload a PDDL plan file to watch robots execute tasks in real-time 3D simulation</p>
            
            <div class="welcome-features">
              <div class="feature-item">
                <span class="feature-icon">🎯</span>
                <span class="feature-text">Real-time action execution</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🎮</span>
                <span class="feature-text">Interactive playback controls</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <span class="feature-text">Live performance analytics</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🎥</span>
                <span class="feature-text">Multiple camera views</span>
              </div>
            </div>

            <div class="sample-plans">
              <h4>📄 Try Sample Plans:</h4>
              <div class="sample-buttons">
                <button @click="loadSamplePlan('simple')" class="sample-btn">
                  Simple Navigation
                </button>
                <button @click="loadSamplePlan('complex')" class="sample-btn">
                  Object Manipulation
                </button>
                <button @click="loadSamplePlan('temporal')" class="sample-btn">
                  Temporal Planning
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="simulation-container">
          <!-- Plan Timeline -->
          <div class="timeline-section">
            <TimelineComponent 
              :actions="parsedActions"
              :current-time="currentTime"
              :total-time="totalDuration"
              :type="selectedType"
              @action-click="jumpToAction"
            />
          </div>

          <!-- Robot Simulator -->
          <div class="robot-section">
            <RobotSimulator 
              :actions="parsedActions"
              :plan-type="selectedType"
              :entities="parsedEntities"
              @stats-update="updateStats"
              @simulation-complete="onSimulationComplete"
              ref="robotSimulator"
            />
          </div>
        </div>
      </main>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message" :class="errorSeverity">
      <div class="error-content">
        <span class="error-icon">{{ errorSeverity === 'warning' ? '⚠️' : '❌' }}</span>
        <span class="error-text">{{ error }}</span>
        <button @click="error = ''" class="error-close">✕</button>
      </div>
    </div>

    <!-- Help Modal -->
    <div v-if="showHelp" class="modal-overlay" @click="showHelp = false">
      <div class="modal-content help-modal" @click.stop>
        <div class="modal-header">
          <h3>🤖 PDDL Plan Visualizer Help</h3>
          <button @click="showHelp = false" class="modal-close">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="help-section">
            <h4>📁 Supported Plan Formats</h4>
            <div class="format-examples">
              <div class="format-example">
                <strong>Classical PDDL:</strong>
                <code>(move robot1 room1 room2)</code>
                <code>(pickup robot1 box1)</code>
                <code>(putdown robot1 box1)</code>
              </div>
              <div class="format-example">
                <strong>Temporal PDDL:</strong>
                <code>0.00: (move robot1 room1 room2) [2.5]</code>
                <code>2.50: (pickup robot1 box1) [1.0]</code>
                <code>3.50: (putdown robot1 box1) [1.0]</code>
              </div>
              <div class="format-example">
                <strong>Numeric PDDL:</strong>
                <code>(move robot1 room1 room2)</code>
                <code>(pickup robot1 box1)</code>
                <span>Actions with cost calculations</span>
              </div>
            </div>
          </div>

          <div class="help-section">
            <h4>🎮 Controls</h4>
            <div class="controls-list">
              <div class="control-item">
                <kbd>Space</kbd> Play/Pause simulation
              </div>
              <div class="control-item">
                <kbd>R</kbd> Reset simulation
              </div>
              <div class="control-item">
                <kbd>←/→</kbd> Step through actions
              </div>
              <div class="control-item">
                <kbd>+/-</kbd> Adjust playback speed
              </div>
              <div class="control-item">
                <kbd>C</kbd> Change camera view
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import RobotSimulator from '@/components/visualization/RobotSimulator.vue'
import TimelineComponent from '@/components/realtime/Timeline.vue'
import FileUpload from '@/components/ui/FileUpload.vue'

// Plan Parser Functions
function parsePlanFile(content, pddlType) {
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith(';'));
  const actions = [];
  
  if (pddlType === 'temporal') {
    // Parse temporal format: "0.00: (move robot1 room1 room2) [2.5]"
    lines.forEach((line, index) => {
      const timeMatch = line.match(/^(\d+\.?\d*)\s*:\s*\(([^)]+)\)\s*\[(\d+\.?\d*)\]/);
      if (timeMatch) {
        const startTime = parseFloat(timeMatch[1]);
        const duration = parseFloat(timeMatch[3]);
        const actionParts = timeMatch[2].trim().split(/\s+/);
        
        actions.push({
          id: `action-${index}`,
          name: actionParts[0],
          parameters: actionParts.slice(1).join(' '),
          start: startTime,
          end: startTime + duration,
          duration: duration,
          type: 'temporal'
        });
      }
    });
  } else if (pddlType === 'numeric') {
    // Parse numeric format
    let currentTime = 0;
    lines.forEach((line, index) => {
      const actionMatch = line.match(/\(([^)]+)\)/);
      if (actionMatch) {
        const actionParts = actionMatch[1].trim().split(/\s+/);
        const actionName = actionParts[0];
        
        // Estimate duration based on action type
        let duration = 2.0;
        if (actionName.includes('move')) duration = 3.0;
        if (actionName.includes('pickup') || actionName.includes('putdown')) duration = 1.5;
        
        actions.push({
          id: `action-${index}`,
          name: actionName,
          parameters: actionParts.slice(1).join(' '),
          start: currentTime,
          end: currentTime + duration,
          duration: duration,
          type: 'numeric'
        });
        
        currentTime += duration;
      }
    });
  } else {
    // Parse classical format: "(move robot1 room1 room2)"
    let currentTime = 0;
    lines.forEach((line, index) => {
      const actionMatch = line.match(/\(([^)]+)\)/);
      if (actionMatch) {
        const actionParts = actionMatch[1].trim().split(/\s+/);
        const duration = 2.0;
        
        actions.push({
          id: `action-${index}`,
          name: actionParts[0],
          parameters: actionParts.slice(1).join(' '),
          start: currentTime,
          end: currentTime + duration,
          duration: duration,
          type: 'classical'
        });
        
        currentTime += duration;
      }
    });
  }
  
  return actions.sort((a, b) => a.start - b.start);
}

export default {
  name: 'RobotVisualization',
  components: {
    RobotSimulator,
    TimelineComponent,
    FileUpload
  },
  setup() {
    const robotSimulator = ref(null)
    
    // State
    const fileName = ref('')
    const fileContent = ref('')
    const selectedType = ref('')
    const selectedDomain = ref('')
    const simulationActive = ref(false)
    const isProcessing = ref(false)
    const error = ref('')
    const errorSeverity = ref('error')
    const showHelp = ref(false)
    const showSettings = ref(false)
    
    // Parsed data
    const parsedActions = ref([])
    const parsedEntities = ref({ rooms: [], objects: [], robots: [] })
    
    // Statistics
    const completedActions = ref(0)
    const totalActions = ref(0)
    const distanceTraveled = ref(0)
    const currentTime = ref(0)
    const objectsManipulated = ref(0)
    const efficiency = ref(100)
    
    // Computed
    const canStart = computed(() => {
      return fileName.value && selectedType.value && !isProcessing.value
    })
    
    const totalDuration = computed(() => {
      if (parsedActions.value.length === 0) return 0
      return Math.max(...parsedActions.value.map(action => action.end))
    })
    
    // Methods
    const handleFileUpload = ({ name, content }) => {
      fileName.value = name
      fileContent.value = content
      error.value = ''
      console.log('File uploaded:', name)
      console.log('Content length:', content.length)
      console.log('First 500 characters:', content.substring(0, 500))
      console.log('Content preview:', content.split('\n').slice(0, 10))
    }
    
    const startVisualization = async () => {
      if (!canStart.value) return
      
      isProcessing.value = true
      error.value = ''
      
      try {
        console.log('=== STARTING VISUALIZATION ===')
        console.log('Selected type:', selectedType.value)
        console.log('File content length:', fileContent.value.length)
        
        const parseResult = parsePlanFile(fileContent.value, selectedType.value)
        
        console.log('Parse result:', parseResult)
        
        let actions, rooms, objects, robots
        
        if (parseResult.actions) {
          // New format with extracted entities
          actions = parseResult.actions
          rooms = parseResult.rooms
          objects = parseResult.objects
          robots = parseResult.robots
        } else {
          // Old format - just actions
          actions = parseResult
          rooms = []
          objects = []
          robots = []
        }
        
        console.log('Actions:', actions)
        console.log('Rooms:', rooms)
        console.log('Objects:', objects)
        console.log('Robots:', robots)
        
        if (actions.length === 0) {
          // Create sample actions that show proper delivery
          console.log('No actions found, creating sample delivery actions...')
          
          const sampleActions = [
            {
              id: 'action-0',
              name: 'move',
              parameters: 'robot1 storage office1',
              start: 0,
              end: 3,
              duration: 3,
              type: selectedType.value
            },
            {
              id: 'action-1',
              name: 'pickup',
              parameters: 'robot1 package1',
              start: 3,
              end: 4,
              duration: 1,
              type: selectedType.value
            },
            {
              id: 'action-2',
              name: 'move',
              parameters: 'robot1 office1 reception',
              start: 4,
              end: 7,
              duration: 3,
              type: selectedType.value
            },
            {
              id: 'action-3',
              name: 'putdown',
              parameters: 'robot1 package1',
              start: 7,
              end: 8,
              duration: 1,
              type: selectedType.value
            }
          ]
          
          parsedActions.value = sampleActions
          error.value = 'Using sample delivery actions because no valid actions were found in your file. Check console for file analysis.'
          errorSeverity.value = 'warning'
        } else {
          parsedActions.value = actions
        }
        
        // Store extracted entities for the simulator
        parsedEntities.value = {
          rooms: rooms.length > 0 ? rooms : ['storage', 'office1', 'office2', 'reception'],
          objects: objects.length > 0 ? objects : ['package1', 'package2'],
          robots: robots.length > 0 ? robots : ['robot1']
        }
        
        totalActions.value = parsedActions.value.length
        simulationActive.value = true
        
        // Reset stats
        completedActions.value = 0
        distanceTraveled.value = 0
        currentTime.value = 0
        objectsManipulated.value = 0
        efficiency.value = 100
        
      } catch (err) {
        console.error('Error in startVisualization:', err)
        error.value = `Error: ${err.message}. Check console for details.`
        errorSeverity.value = 'error'
      } finally {
        isProcessing.value = false
      }
    }
    
    const resetSimulation = () => {
      if (robotSimulator.value) {
        robotSimulator.value.reset()
      }
      
      completedActions.value = 0
      distanceTraveled.value = 0
      currentTime.value = 0
      objectsManipulated.value = 0
      efficiency.value = 100
    }
    
    const updateStats = (stats) => {
      completedActions.value = stats.completedActions || 0
      distanceTraveled.value = stats.distanceTraveled || 0
      currentTime.value = stats.currentTime || 0
      objectsManipulated.value = stats.objectsManipulated || 0
      efficiency.value = stats.efficiency || 100
    }
    
    // (Removed unused updateTotalActions function)
    
    // Update total actions when parsedActions changes
    onMounted(() => {
      // Any initialization code
    })
    
    const onSimulationComplete = () => {
      console.log('Simulation completed')
    }
    
    const jumpToAction = (action) => {
      if (robotSimulator.value) {
        robotSimulator.value.seekToTime(action.start)
      }
    }
    
    const exportVideo = () => {
      if (robotSimulator.value) {
        robotSimulator.value.exportVideo()
      }
    }
    
    const takeScreenshot = () => {
      if (robotSimulator.value) {
        robotSimulator.value.takeScreenshot()
      }
    }
    
    const loadSamplePlan = (type) => {
      const samplePlans = {
        simple: {
          content: `(move robot1 room1 room2)
(pickup robot1 box1)
(move robot1 room2 room3)
(putdown robot1 box1)`,
          type: 'classical',
          domain: 'robot'
        },
        complex: {
          content: `(move robot1 room1 room2)
(pickup robot1 box1)
(move robot1 room2 room3)
(putdown robot1 box1)
(move robot1 room3 room1)
(pickup robot1 box2)
(move robot1 room1 room2)
(putdown robot1 box2)`,
          type: 'classical',
          domain: 'robot'
        },
        temporal: {
          content: `0.00: (move robot1 room1 room2) [2.5]
2.50: (pickup robot1 box1) [1.0]
3.50: (move robot1 room2 room3) [2.5]
6.00: (putdown robot1 box1) [1.0]
7.00: (move robot1 room3 room1) [3.0]
10.00: (pickup robot1 box2) [1.0]
11.00: (move robot1 room1 room2) [2.5]
13.50: (putdown robot1 box2) [1.0]`,
          type: 'temporal',
          domain: 'robot'
        }
      }
      
      const plan = samplePlans[type]
      if (plan) {
        fileName.value = `sample-${type}.txt`
        fileContent.value = plan.content
        selectedType.value = plan.type
        selectedDomain.value = plan.domain
      }
    }
    
    return {
      // State
      fileName,
      selectedDomain,
      selectedType,
      simulationActive,
      isProcessing,
      error,
      errorSeverity,
      showHelp,
      showSettings,
      robotSimulator,
      
      // Data
      parsedActions,
      parsedEntities,
      
      // Stats
      completedActions,
      totalActions,
      distanceTraveled,
      currentTime,
      objectsManipulated,
      efficiency,
      
      // Computed
      canStart,
      totalDuration,
      
      // Methods
      handleFileUpload,
      startVisualization,
      resetSimulation,
      updateStats,
      onSimulationComplete,
      jumpToAction,
      exportVideo,
      takeScreenshot,
      loadSamplePlan
    }
  }
}
</script>

<style scoped>
.robot-visualization {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.nav-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
}

.nav-logo {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
}

.help-btn {
  background: #ecf0f1;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.help-btn:hover {
  background: #bdc3c7;
}

.main-container {
  display: flex;
  min-height: calc(100vh - 70px);
}

.sidebar {
  width: 350px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 25px;
  overflow-y: auto;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.sidebar-section {
  margin-bottom: 30px;
  padding-bottom: 25px;
  border-bottom: 1px solid #eee;
}

.sidebar-section:last-child {
  border-bottom: none;
}

.sidebar-section h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.form-select {
  padding: 10px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
}

.form-select:focus {
  outline: none;
  border-color: #3498db;
}

.start-btn {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  padding: 15px 25px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.4);
}

.start-btn.disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 10px 12px;
  border-radius: 6px;
}

.info-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-weight: 700;
  color: #2c3e50;
}

.stats-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 2px;
}

.stat-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: #2c3e50;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.quick-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.reset-btn {
  background: #e74c3c;
  color: white;
}

.export-btn {
  background: #9b59b6;
  color: white;
}

.screenshot-btn {
  background: #f39c12;
  color: white;
}

.settings-btn {
  background: #34495e;
  color: white;
}

.quick-btn:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.visualization-area {
  flex: 1;
  position: relative;
}

.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
  color: white;
}

.welcome-icon {
  font-size: 5rem;
  margin-bottom: 20px;
}

.welcome-content h2 {
  font-size: 2.5rem;
  margin-bottom: 15px;
  font-weight: 700;
}

.welcome-content p {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
}

.welcome-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
}

.feature-icon {
  font-size: 1.5rem;
}

.feature-text {
  font-weight: 600;
}

.sample-plans {
  background: rgba(255, 255, 255, 0.1);
  padding: 25px;
  border-radius: 15px;
}

.sample-plans h4 {
  margin: 0 0 20px 0;
  font-size: 1.2rem;
}

.sample-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.sample-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.sample-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.simulation-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.timeline-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.robot-section {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.other-domain-placeholder {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.other-domain-placeholder h3 {
  color: #2c3e50;
  font-size: 1.8rem;
  margin-bottom: 15px;
}

.other-domain-placeholder p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.actions-list {
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}

.actions-list h4 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.action-item {
  background: #f8f9fa;
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 3px solid #3498db;
}

.action-item strong {
  color: #2c3e50;
}

.action-time {
  float: right;
  color: #666;
  font-size: 0.85rem;
}

.error-message {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

.error-message.error {
  background: #fee;
  border: 1px solid #fcc;
}

.error-message.warning {
  background: #fff8e1;
  border: 1px solid #ffcc02;
}

.error-content {
  display: flex;
  align-items: center;
  padding: 15px;
  gap: 10px;
}

.error-icon {
  font-size: 1.2rem;
}

.error-text {
  flex: 1;
  font-weight: 600;
}

.error-message.error .error-text {
  color: #e74c3c;
}

.error-message.warning .error-text {
  color: #f39c12;
}

.error-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 2px;
}

.error-message.error .error-close {
  color: #e74c3c;
}

.error-message.warning .error-close {
  color: #f39c12;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 15px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 5px;
}

.modal-close:hover {
  color: #666;
}

.modal-body {
  padding: 20px 30px;
}

.help-section {
  margin-bottom: 25px;
}

.help-section h4 {
  color: #2c3e50;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
}

.format-examples {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.format-example {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 3px solid #3498db;
}

.format-example strong {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
}

.format-example code {
  display: block;
  background: #e9ecef;
  padding: 5px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #e74c3c;
  margin-bottom: 3px;
  font-size: 0.9rem;
}

.controls-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 0;
}

.control-item kbd {
  background: #2c3e50;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    order: 2;
  }
  
  .visualization-area {
    order: 1;
    min-height: 60vh;
  }
  
  .welcome-features {
    grid-template-columns: 1fr;
  }
  
  .sample-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>