<template>
  <div class="pddl-visualizer">
    <!-- Header with Navigation -->
    <div class="header">
      <div class="header-content">
        <h1>🤖 PDDL Domain Visualizer</h1>
        <nav class="navigation">
          <button 
            @click="selectDomain('robot')" 
            :class="{ active: selectedDomain === 'robot' }"
            class="nav-btn"
          >
            🤖 Robot
          </button>
          <button 
            @click="selectDomain('elevator')" 
            :class="{ active: selectedDomain === 'elevator' }"
            class="nav-btn"
          >
            🛗 Elevator
          </button>
          <button 
            @click="selectDomain('logistics')" 
            :class="{ active: selectedDomain === 'logistics' }"
            class="nav-btn"
          >
            🚚 Logistics
          </button>
        </nav>
      </div>
    </div>

    <div class="main-content">
      <!-- Common Sidebar -->
      <div class="sidebar">
        <!-- File Upload Section -->
        <div class="section">
          <h3>📁 Upload Plan File</h3>
          <div class="upload-zone" :class="{ 'has-file': fileName }" @click="$refs.fileInput.click()">
            <input ref="fileInput" type="file" accept=".txt,.plan,.pddl" @change="handleFileUpload" style="display: none;">
            <div class="upload-content">
              <div class="upload-icon">{{ fileName ? '✅' : '📁' }}</div>
              <div class="upload-text">{{ fileName || 'Drop plan file here' }}</div>
            </div>
          </div>
        </div>

        <!-- Domain Selection -->
        <div class="section" v-if="fileName">
          <h3>🎯 Selected Domain</h3>
          <div class="domain-display">
            <div class="domain-icon">
              {{ getDomainIcon(selectedDomain) }}
            </div>
            <div class="domain-name">
              {{ getDomainName(selectedDomain) }}
            </div>
          </div>
        </div>

        <!-- PDDL Type Configuration -->
        <div class="section" v-if="fileName && selectedDomain">
          <h3>⚙️ PDDL Type</h3>
          <div class="form-group">
            <select v-model="selectedType" class="type-select">
              <option value="">Select PDDL Type</option>
              <option value="classical">Classical PDDL</option>
              <option value="temporal">Temporal/Durative PDDL</option>
              <option value="numeric">Numeric/Metric PDDL</option>
            </select>
          </div>
          <button @click="startVisualization" :disabled="!canStart" class="start-btn">
            🚀 Start {{ getDomainName(selectedDomain) }} Visualization
          </button>
        </div>

        <!-- Plan Info -->
        <div class="section" v-if="simulationActive && parsedActions.length > 0">
          <h3>📊 Plan Statistics</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Domain:</span>
              <span class="value">{{ getDomainName(selectedDomain) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Type:</span>
              <span class="value">{{ selectedType }}</span>
            </div>
            <div class="info-item">
              <span class="label">Actions:</span>
              <span class="value">{{ parsedActions.length }}</span>
            </div>
            <div class="info-item">
              <span class="label">Duration:</span>
              <span class="value">{{ totalDuration.toFixed(1) }}s</span>
            </div>
            <div class="info-item">
              <span class="label">Entities:</span>
              <span class="value">{{ getTotalEntities() }}</span>
            </div>
          </div>
        </div>

        <!-- Sample Plans -->
        <!-- <div class="section">
          <h3>📄 Sample Plans</h3>
          <div class="sample-buttons">
            <button @click="loadSamplePlan('robot')" class="sample-btn robot">
              🤖 Robot Sample
            </button>
            <button @click="loadSamplePlan('elevator')" class="sample-btn elevator">
              🛗 Elevator Sample
            </button>
            <button @click="loadSamplePlan('logistics')" class="sample-btn logistics">
              🚚 Logistics Sample
            </button>
          </div>
        </div> -->
      </div>

      <!-- Main Visualization Area -->
      <div class="main-area">
        <div v-if="!simulationActive" class="welcome-screen">
          <div class="welcome-content">
            <div class="welcome-icon">{{ getDomainIcon(selectedDomain) }}</div>
            <h2>{{ getDomainName(selectedDomain) }} PDDL Visualizer</h2>
            <p>{{ getDomainDescription(selectedDomain) }}</p>
            
            <div class="getting-started">
              <h4>🚀 Getting Started:</h4>
              <ol>
                <li>Upload your PDDL plan file using the sidebar</li>
                <li>Select the PDDL type (Classical/Temporal/Numeric)</li>
                <li>Click "Start Visualization" to see your plan in action</li>
                <li>Or try a sample plan to see how it works</li>
              </ol>
            </div>
          </div>
        </div>

        <div v-else class="simulation-container">
          <!-- Robot Domain -->
          <RobotSimulator 
            v-if="selectedDomain === 'robot'"
            :actions="parsedActions" 
            :entities="parsedEntities" 
          />
          
          <!-- Elevator Domain -->
          <ElevatorSimulator 
            v-else-if="selectedDomain === 'elevator'"
            :actions="parsedActions" 
            :entities="parsedEntities"
          />
          
          <!-- Logistics Domain -->
          <LogisticsSimulator 
            v-else-if="selectedDomain === 'logistics'"
            :actions="parsedActions" 
            :entities="parsedEntities"
          />
        </div>
      </div>
    </div>

    <!-- Error/Status Messages -->
    <div v-if="error" class="error-toast" @click="error = ''">
      <span>⚠️ {{ error }}</span>
      <button class="close-btn">✕</button>
    </div>

    <div v-if="successMessage" class="success-toast" @click="successMessage = ''">
      <span>✅ {{ successMessage }}</span>
      <button class="close-btn">✕</button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import RobotSimulator from '@/components/visualization/RobotSimulator.vue'
import ElevatorSimulator from '@/components/visualization/ElevatorSimulator.vue'
import LogisticsSimulator from '@/components/visualization/LogisticsSimulator.vue'

// Dynamic plan parser that works with any domain
function parsePlanFile(content) {
  console.log('=== PARSING PLAN ===')
  console.log('Content preview:', content.substring(0, 500))
  
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => 
      line.length > 0 && 
      line.includes(':') && 
      line.includes('(') &&
      !line.includes('domain parsed') &&
      !line.includes('grounding') &&
      !line.includes('planning time') &&
      !line.includes('g(n)=') &&
      !line.includes('found plan:') &&
      !line.includes('problem solved') &&
      !line.includes('plan-length') &&
      !line.includes('metric') &&
      !line.includes('heuristic') &&
      !line.includes('search time') &&
      !line.includes('expanded nodes')
    )

  console.log('Filtered action lines:', lines.length)

  const actions = []
  const rooms = new Set()
  const objects = new Set()
  const robots = new Set()

  lines.forEach((line, index) => {
    // Match various time formats: "0.0:", "0:", "AT 0.0:", etc.
    const timeMatch = line.match(/^(?:AT\s+)?(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)/)
    
    if (timeMatch) {
      const startTime = parseFloat(timeMatch[1])
      const actionContent = timeMatch[2].trim()
      const actionParts = actionContent.split(/\s+/)
      const actionName = actionParts[0]
      const parameters = actionParts.slice(1).join(' ')

      console.log(`Action ${index}: ${actionName} at ${startTime}s`)

      // Smart entity detection
      actionParts.slice(1).forEach(param => {
        if (param && param !== '----waiting----' && !param.startsWith('[') && !param.endsWith(']')) {
          const paramLower = param.toLowerCase()
          
          // Identify rooms
          if (paramLower.includes('room') || paramLower.includes('floor') || 
              paramLower.includes('location') || paramLower.includes('warehouse') ||
              paramLower.includes('depot') || paramLower.includes('airport')) {
            rooms.add(param)
          }
          // Identify objects/packages
          else if (paramLower.includes('ball') || paramLower.includes('package') ||
                   paramLower.includes('box') || paramLower.includes('item') ||
                   paramLower.includes('cargo')) {
            objects.add(param)
          }
          // Identify robots/vehicles/elevators
          else if (paramLower.includes('robot') || paramLower.includes('wally') ||
                   paramLower.includes('eve') || paramLower.includes('truck') ||
                   paramLower.includes('elevator') || paramLower.includes('plane')) {
            robots.add(param)
          }
        }
      })

      actions.push({
        id: `action-${index}`,
        name: actionName,
        parameters,
        start: startTime,
        end: startTime + 1.0,
        duration: 1.0
      })
    }
  })

  const result = {
    actions,
    rooms: Array.from(rooms),
    objects: Array.from(objects),
    robots: Array.from(robots)
  }

  console.log('=== PARSE RESULT ===')
  console.log('Actions found:', result.actions.length)
  console.log('Rooms found:', result.rooms)
  console.log('Objects found:', result.objects)
  console.log('Robots found:', result.robots)

  return result
}

export default {
  name: 'PDDLVisualizer',
  components: { 
    RobotSimulator,
    ElevatorSimulator, 
    LogisticsSimulator
  },
  setup() {
    // State
    const selectedDomain = ref('robot') // Default to robot
    const fileName = ref('')
    const selectedType = ref('')
    const simulationActive = ref(false)
    const error = ref('')
    const successMessage = ref('')
    const parsedActions = ref([])
    const parsedEntities = ref({ rooms: [], objects: [], robots: [] })
    const fileContent = ref('')

    // Computed
    const canStart = computed(() => fileName.value && selectedType.value && selectedDomain.value)
    const totalDuration = computed(() => 
      parsedActions.value.length > 0 ? Math.max(...parsedActions.value.map(a => a.end)) : 0
    )

    // Domain helper functions
    const getDomainIcon = (domain) => {
      const icons = {
        robot: '🤖',
        elevator: '🛗',
        logistics: '🚚'
      }
      return icons[domain] || '❓'
    }

    const getDomainName = (domain) => {
      const names = {
        robot: 'Robot',
        elevator: 'Elevator',
        logistics: 'Logistics'
      }
      return names[domain] || 'Unknown'
    }

    const getDomainDescription = (domain) => {
      const descriptions = {
        robot: 'Watch robots move between rooms, pick up objects, and deliver them to target locations.',
        elevator: 'See elevators transport people between floors efficiently and safely.',
        logistics: 'Observe trucks, planes, and packages moving through a complex delivery network.'
      }
      return descriptions[domain] || 'Domain visualization system.'
    }

    const getTotalEntities = () => {
      const entities = parsedEntities.value
      return (entities.rooms?.length || 0) + (entities.objects?.length || 0) + (entities.robots?.length || 0)
    }

    // Methods
    const selectDomain = (domain) => {
      selectedDomain.value = domain
      simulationActive.value = false
      console.log('Selected domain:', domain)
    }

    const handleFileUpload = (event) => {
      const file = event.target.files[0]
      if (!file) return

      fileName.value = file.name
      const reader = new FileReader()
      reader.onload = (e) => {
        fileContent.value = e.target.result
        successMessage.value = `File "${file.name}" loaded successfully!`
        console.log('File loaded:', file.name)
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          successMessage.value = ''
        }, 3000)
      }
      reader.readAsText(file)
    }

    const startVisualization = () => {
      try {
        error.value = ''
        
        if (!fileContent.value) {
          error.value = 'No file content found'
          return
        }

        if (!selectedDomain.value) {
          error.value = 'Please select a domain (Robot/Elevator/Logistics)'
          return
        }

        const parseResult = parsePlanFile(fileContent.value)
        
        if (parseResult.actions.length === 0) {
          error.value = 'No valid actions found in plan file. Check console for details.'
          return
        }

        parsedActions.value = parseResult.actions
        
        // For now, pass all entities to the simulator and let it categorize them
        parsedEntities.value = {
          allEntities: parseResult.allEntities,
          rooms: parseResult.rooms || [],
          objects: parseResult.objects || [],
          robots: parseResult.robots || []
        }
        
        simulationActive.value = true
        successMessage.value = `${getDomainName(selectedDomain.value)} visualization started with ${parseResult.actions.length} actions!`
        
        console.log('Visualization started:', {
          domain: selectedDomain.value,
          type: selectedType.value,
          actions: parseResult.actions.length
        })
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          successMessage.value = ''
        }, 3000)
        
      } catch (err) {
        console.error('Error starting visualization:', err)
        error.value = `Error: ${err.message}`
      }
    }

    const loadSamplePlan = (domain) => {
      selectedDomain.value = domain
      
      const samplePlans = {
        robot: `0: (pick ball2 gardena wally)
0: (startmove wally gardena gardenb)
30.0: (drop ball2 gardenb wally)
45.0: (startcharge wally)
202.0: (stopcharge wally)
217.0: (pick ball1 gardena wally)
246.0: (startcharge wally)
256.0: (stopcharge wally)
257.0: (drop ball1 gardenb wally)`,
        
        elevator: `0: (board-elevator person1 floor1 elevator1)
5.0: (move-elevator elevator1 floor1 floor3)
15.0: (leave-elevator person1 floor3 elevator1)
20.0: (move-elevator elevator1 floor3 floor2)
30.0: (board-elevator person2 floor2 elevator1)
35.0: (move-elevator elevator1 floor2 floor1)
45.0: (leave-elevator person2 floor1 elevator1)`,
        
        logistics: `0: (load-truck package1 truck1 location1)
10.0: (drive-truck truck1 location1 location2)
30.0: (unload-truck package1 truck1 location2)
40.0: (load-airplane package2 airplane1 location2)
50.0: (fly-airplane airplane1 location2 location3)
80.0: (unload-airplane package2 airplane1 location3)`
      }

      fileName.value = `sample-${domain}-plan.txt`
      fileContent.value = samplePlans[domain]
      selectedType.value = 'temporal'
      
      successMessage.value = `Sample ${getDomainName(domain)} plan loaded!`
      
      // Auto-start the sample
      setTimeout(() => {
        startVisualization()
      }, 500)
    }

    return {
      // State
      selectedDomain,
      fileName,
      selectedType, 
      simulationActive,
      error,
      successMessage,
      parsedActions,
      parsedEntities,
      
      // Computed
      canStart,
      totalDuration,
      
      // Methods
      getDomainIcon,
      getDomainName,
      getDomainDescription,
      getTotalEntities,
      selectDomain,
      handleFileUpload,
      startVisualization,
      loadSamplePlan
    }
  }
}
</script>

<style scoped>
.pddl-visualizer {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
}

.navigation {
  display: flex;
  gap: 15px;
}

.nav-btn {
  padding: 12px 24px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #2c3e50;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
}

.nav-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.nav-btn.active {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-color: #2980b9;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.main-content {
  display: flex;
  min-height: calc(100vh - 90px);
  max-width: 1400px;
  margin: 0 auto;
  gap: 20px;
  padding: 20px;
}

.sidebar {
  width: 350px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 25px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.section {
  margin-bottom: 30px;
  padding-bottom: 25px;
  border-bottom: 2px solid #f1f3f4;
}

.section:last-child {
  border-bottom: none;
}

.section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
}

.upload-zone {
  border: 3px dashed #bdc3c7;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafbfc;
}

.upload-zone:hover {
  border-color: #3498db;
  background: #f0f8ff;
  transform: translateY(-2px);
}

.upload-zone.has-file {
  border-color: #27ae60;
  background: #f0fff4;
  border-style: solid;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  font-size: 3rem;
}

.upload-text {
  color: #2c3e50;
  font-weight: 600;
  font-size: 16px;
}

.domain-display {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 10px;
  border: 2px solid #dee2e6;
}

.domain-icon {
  font-size: 2.5rem;
}

.domain-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.type-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  transition: border-color 0.3s ease;
}

.type-select:focus {
  outline: none;
  border-color: #3498db;
}

.start-btn {
  width: 100%;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.3);
}

.start-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.label {
  font-weight: 600;
  color: #6c757d;
}

.value {
  color: #2c3e50;
  font-weight: 600;
  text-align: right;
}

.sample-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sample-btn {
  padding: 12px 16px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  text-align: left;
}

.sample-btn.robot {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  color: #1976d2;
}

.sample-btn.elevator {
  background: linear-gradient(135deg, #fff3e0, #ffcc80);
  color: #f57c00;
}

.sample-btn.logistics {
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  color: #388e3c;
}

.sample-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.main-area {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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
}

.welcome-icon {
  font-size: 6rem;
  margin-bottom: 30px;
}

.welcome-content h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #2c3e50;
}

.welcome-content p {
  font-size: 1.2rem;
  color: #6c757d;
  margin-bottom: 40px;
  line-height: 1.6;
}

.getting-started {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  text-align: left;
}

.getting-started h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.getting-started ol {
  margin: 0;
  padding-left: 20px;
}

.getting-started li {
  margin-bottom: 8px;
  color: #495057;
  line-height: 1.5;
}

.simulation-container {
  height: 100%;
}

.domain-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
}

.placeholder-content {
  text-align: center;
  max-width: 500px;
}

.placeholder-icon {
  font-size: 5rem;
  margin-bottom: 20px;
}

.placeholder-content h3 {
  font-size: 2rem;
  margin-bottom: 15px;
  color: #2c3e50;
}

.placeholder-content p {
  font-size: 1.1rem;
  color: #6c757d;
  margin-bottom: 30px;
}

.plan-preview {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  text-align: left;
}

.plan-preview h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.actions-preview {
  font-family: monospace;
  font-size: 14px;
}

.action-preview {
  padding: 5px 0;
  color: #495057;
}

.more-actions {
  color: #6c757d;
  font-style: italic;
  margin-top: 10px;
}

.error-toast, .success-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.error-toast {
  background: rgba(231, 76, 60, 0.95);
  color: white;
  border: 1px solid rgba(192, 57, 43, 0.3);
}

.success-toast {
  background: rgba(39, 174, 96, 0.95);
  color: white;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.close-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.8;
}

.close-btn:hover {
  opacity: 1;
}
</style>