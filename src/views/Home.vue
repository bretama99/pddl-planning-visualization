```vue
<template>
  <div class="pddl-visualizer">
    <!-- Floating Background Elements -->
    <div class="floating-background">
      <div class="floating-shape" style="--delay: 0s; --duration: 15s; --x: 10%; --y: 20%;">🤖</div>
      <div class="floating-shape" style="--delay: 3s; --duration: 18s; --x: 80%; --y: 10%;">🛗</div>
      <div class="floating-shape" style="--delay: 6s; --duration: 12s; --x: 70%; --y: 70%;">🚚</div>
      <div class="floating-shape" style="--delay: 9s; --duration: 20s; --x: 20%; --y: 80%;">⚙️</div>
      <div class="floating-shape" style="--delay: 12s; --duration: 16s; --x: 50%; --y: 30%;">📁</div>
      <div class="floating-shape" style="--delay: 15s; --duration: 14s; --x: 90%; --y: 60%;">✨</div>
    </div>

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

    <!-- Success/Error Toast Animations -->
    <transition name="toast-slide">
      <div v-if="error" class="error-toast" @click="error = ''">
        <div class="toast-icon">⚠️</div>
        <span class="toast-message">{{ error }}</span>
        <button class="close-btn">✕</button>
        <div class="toast-progress"></div>
      </div>
    </transition>

    <transition name="toast-slide">
      <div v-if="successMessage" class="success-toast" @click="successMessage = ''">
        <div class="toast-icon">✅</div>
        <span class="toast-message">{{ successMessage }}</span>
        <button class="close-btn">✕</button>
        <div class="toast-progress"></div>
      </div>
    </transition>

    <!-- Header with Title on Left and Buttons on Right -->
    <div class="header">
      <div class="header-content">
        <div class="header-container">
          <h1 class="main-title">
            <span class="title-icon">🤖</span>
            <span class="title-text">PDDL Visualizer</span>
            <div class="title-glow"></div>
          </h1>
          <nav class="navigation">
            <button 
              @click="navigateToRobot" 
              :class="{ active: selectedDomain === 'robot' }"
              class="nav-btn robot-btn"
            >
              <span class="btn-icon">🤖</span>
              <span>Robot</span>
              <div class="btn-glow"></div>
            </button>
            <button 
              @click="selectDomain('elevator')" 
              :class="{ active: selectedDomain === 'elevator' }"
              class="nav-btn elevator-btn"
            >
              <span class="btn-icon">🛗</span>
              <span>Elevator</span>
              <div class="btn-glow"></div>
            </button>
            <router-link 
              to="/logistics" 
              class="nav-btn logistics-btn"
              :class="{ active: selectedDomain === 'logistics' }"
              @click="selectDomain('logistics')"
            >
              <span class="btn-icon">🚚</span>
              <span>Logistics</span>
              <div class="btn-glow"></div>
            </router-link>
          </nav>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- Compact Sidebar -->
      <div class="sidebar">
        <!-- File Upload Section -->
        <div class="section">
          <h3 class="section-title">
            <span class="section-icon">📁</span>
            <span>Upload Plan</span>
            <div class="section-line"></div>
          </h3>
          <div class="upload-zone" 
               :class="{ 'has-file': fileName, 'uploading': isUploading }" 
               @click="$refs.fileInput.click()"
               @dragover.prevent="onDragOver"
               @dragleave.prevent="onDragLeave"
               @drop.prevent="onDrop">
            <input ref="fileInput" type="file" accept=".txt,.plan,.pddl" @change="handleFileUpload" style="display: none;">
            <div class="upload-content">
              <div class="upload-icon" :class="{ pulse: isUploading }">
                {{ isUploading ? '🔄' : fileName ? '✅' : '📁' }}
              </div>
              <div class="upload-text">
                {{ isUploading ? 'Processing...' : fileName || 'Drop file or click' }}
              </div>
              <div v-if="fileName" class="file-info">
                <div class="file-name">{{ fileName }}</div>
                <div class="file-size">{{ fileSize }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- PDDL Type Selection -->
        <div class="section">
          <h3 class="section-title">
            <span class="section-icon">⚙️</span>
            <span>PDDL Type</span>
            <div class="section-line"></div>
          </h3>
          <div class="pddl-type-selector">
            <select v-model="selectedPDDLType" class="pddl-type-dropdown">
              <option value="classical">Classical PDDL</option>
              <option value="temporal">Temporal PDDL</option>
            </select>
            <div class="pddl-type-description">
              {{ getPDDLTypeDescription(selectedPDDLType) }}
            </div>
          </div>
          <div class="pddl-type-selector">
            <select v-model="selectedPDDLType" class="pddl-type-dropdown">
              <option value="numerical">Numerical PDDL</option>
              <option value="pddl_plus">PDDL+</option>
            </select>
            <div class="pddl-type-description">
              {{ getPDDLTypeDescription(selectedPDDLType) }}
            </div>
          </div>
        </div>

        <!-- Domain Selection -->
        <transition name="section-expand">
          <div class="section" v-if="fileName">
            <h3 class="section-title">
              <span class="section-icon">🎯</span>
              <span>Domain</span>
              <div class="section-line"></div>
            </h3>
            <div class="domain-display" :class="selectedDomain + '-theme'">
              <div class="domain-icon">
                {{ getDomainIcon(selectedDomain) }}
                <div class="icon-pulse"></div>
              </div>
              <div class="domain-info">
                <div class="domain-name">{{ getDomainName(selectedDomain) }}</div>
                <div class="domain-subtitle">{{ getDomainSubtitle(selectedDomain) }}</div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Start Visualization Section -->
        <transition name="section-expand">
          <div class="section" v-if="fileName && selectedDomain">
            <button @click="startVisualization" :disabled="isProcessing" class="start-btn" :class="selectedDomain + '-btn'">
              <span class="start-icon">{{ isProcessing ? '🔄' : '🚀' }}</span>
              <span class="start-text">
                {{ isProcessing ? 'Processing...' : `Start ${getDomainName(selectedDomain)}` }}
              </span>
              <div class="btn-shimmer"></div>
            </button>
          </div>
        </transition>

        <!-- Plan Statistics -->
        <transition name="section-expand">
          <div class="section" v-if="simulationActive && parsedActions.length > 0">
            <h3 class="section-title">
              <span class="section-icon">📊</span>
              <span>Statistics</span>
              <div class="section-line"></div>
            </h3>
            <div class="info-grid">
              <div class="info-item" v-for="(item, index) in statsItems" :key="index" :style="{ '--delay': index * 0.1 + 's' }">
                <span class="label">
                  <span class="label-icon">{{ item.icon }}</span>
                  {{ item.label }}:
                </span>
                <span class="value">{{ item.value }}</span>
                <div class="value-bar" :style="{ width: safePercentage(item.percentage) + '%' }"></div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Features Section -->
        <div class="section">
          <h3 class="section-title">
            <span class="section-icon">✨</span>
            <span>Features</span>
            <div class="section-line"></div>
          </h3>
          <div class="features-list">
            <div class="feature-item" v-for="(feature, index) in features" :key="index" :style="{ '--delay': index * 0.2 + 's' }">
              <span class="feature-icon">{{ feature.icon }}</span>
              <span class="feature-text">{{ feature.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Visualization Area -->
      <div class="main-area">
        <transition name="content-fade" mode="out-in">
          <div v-if="!simulationActive" class="welcome-screen">
            <div class="welcome-content">
              <div class="welcome-icon" :class="selectedDomain + '-icon'">
                {{ getDomainIcon(selectedDomain) }}
                <div class="icon-rings">
                  <div class="ring"></div>
                  <div class="ring"></div>
                  <div class="ring"></div>
                </div>
              </div>
              <h2 class="welcome-title">
                {{ getDomainName(selectedDomain) }} PDDL Visualizer
                <div class="title-underline"></div>
              </h2>
              <p class="welcome-description">{{ getDomainDescription(selectedDomain) }}</p>
              
              <div class="getting-started">
                <h4 class="steps-title">
                  <span class="steps-icon">🚀</span>
                  Getting Started:
                </h4>
                <div class="steps-list">
                  <div class="step-item" v-for="(step, index) in steps" :key="index" :style="{ '--delay': index * 0.3 + 's' }">
                    <div class="step-number">{{ index + 1 }}</div>
                    <div class="step-content">
                      <div class="step-title">{{ step.title }}</div>
                      <div class="step-description">{{ step.description }}</div>
                    </div>
                    <div class="step-glow"></div>
                  </div>
                </div>
              </div>

              <div class="domain-showcase">
                <div class="showcase-title">Choose Your Domain:</div>
                <div class="domain-cards">
                  <div class="domain-card" 
                       v-for="domain in domains" 
                       :key="domain.id"
                       :class="{ active: selectedDomain === domain.id }"
                       @click="handleDomainCardClick(domain.id)">
                    <div class="card-icon">{{ domain.icon }}</div>
                    <div class="card-title">{{ domain.name }}</div>
                    <div class="card-description">{{ domain.description }}</div>
                    <div v-if="domain.link" class="card-link">
                      <span class="link-icon">🔗</span>
                      <span class="link-text">External App</span>
                    </div>
                    <div class="card-glow"></div>
                  </div>
                </div>
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
              v-else-if="selectedDomain === 'elevator' && selectedPDDLType !== 'pddl_plus' && selectedPDDLType !== 'numerical'"
              :actions="parsedActions" 
              :entities="parsedEntities"
              :pddl-type="selectedPDDLType"
            />

            <!-- Elevator Domain - PDDL+ Type -->
            <ElevatorSimulatorPDDL 
              v-else-if="selectedDomain === 'elevator' && (selectedPDDLType === 'pddl_plus' || selectedPDDLType === 'pddl+' || selectedPDDLType === 'numerical')"
              :actions="parsedActions" 
              :entities="parsedEntities"
              :pddl-type="selectedPDDLType"
            />
            
            <!-- Logistics Domain -->
            <LogisticsSimulator 
              v-else-if="selectedDomain === 'logistics'"
              :actions="parsedActions" 
              :entities="parsedEntities"
            />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
// Complete Home.vue JavaScript section with BULLETPROOF safety fixes
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { parsePlanFile, calculateTotalDuration } from '@/utils/enhancedPDDLParser.js'
import RobotSimulator from '@/components/visualization/RobotSimulator.vue'
import ElevatorSimulator from '@/components/visualization/ElevatorSimulator.vue'
import ElevatorSimulatorPDDL from '@/components/visualization/ElevatorSimulatorPDDL+.vue'
import LogisticsSimulator from '@/components/visualization/LogisticsSimulator.vue'

export default {
  name: 'PDDLVisualizer',
  components: { 
    RobotSimulator,
    ElevatorSimulator, 
    LogisticsSimulator,
    ElevatorSimulatorPDDL
  },
  setup() {
    // Initializes reactive state, computed properties, and methods for the PDDL Visualizer component,
    // handling domain selection, file uploads, PDDL type management, and visualization logic
    // State
    const selectedDomain = ref('robot')
    const selectedPDDLType = ref('')
    const fileName = ref('')
    const fileSize = ref('')
    const simulationActive = ref(false)
    const error = ref('')
    const successMessage = ref('')
    const parsedActions = ref([])
    const parsedEntities = ref({ rooms: [], objects: [], robots: [] })
    const planMetrics = ref({})
    const fileContent = ref('')
    const isUploading = ref(false)
    const isProcessing = ref(false)
    const particles = ref([])
    const particleTimer = ref(null)

    // PDDL Types configuration
    const pddlTypes = [
      { 
        id: 'classical', 
        name: 'Classical PDDL', 
        description: 'Step-based planning with discrete actions',
        icon: '🎯'
      },
      { 
        id: 'temporal', 
        name: 'Temporal PDDL', 
        description: 'Time-based planning with durative actions',
        icon: '⏱️'
      },
      { 
        id: 'numerical', 
        name: 'Numerical PDDL', 
        description: 'Planning with numeric fluents and constraints',
        icon: '🔢'
      },
      { 
        id: 'pddl_plus', 
        name: 'PDDL+', 
        description: 'Hybrid discrete/continuous planning',
        icon: '🌐'
      }
    ]

    // Static data with navigation links
    const domains = [
      { 
        id: 'robot', 
        name: 'Robot', 
        icon: '🤖', 
        description: 'Autonomous robot navigation and task execution',
        link: 'http://localhost:5000'
      },
      { 
        id: 'elevator', 
        name: 'Elevator', 
        icon: '🛗', 
        description: 'Multi-floor passenger transportation system'
      },
      { 
        id: 'logistics', 
        name: 'Logistics', 
        icon: '🚚', 
        description: 'Complex package delivery and routing network',
        link: 'http://localhost:8081'
      }
    ]

    const features = [
      { icon: '⚡', text: 'Multi-type PDDL support' },
      { icon: '🎨', text: 'Interactive domain graphics' },
      { icon: '📊', text: 'Advanced plan metrics' },
      { icon: '🔄', text: 'Temporal & numerical parsing' },
      { icon: '🎯', text: 'Domain-specific optimizations' },
      { icon: '📱', text: 'Responsive design' },
      { icon: '🔗', text: 'External app integration' }
    ]

    const steps = [
      { title: 'Upload Plan File', description: 'Select your PDDL plan file from your computer' },
      { title: 'Select PDDL Type', description: 'Choose your plan type (Classical, Temporal, Numerical, or PDDL+)' },
      { title: 'Choose Domain', description: 'Select the appropriate domain type or navigate to external apps' },
      { title: 'Start Visualization', description: 'Click the start button to begin the interactive simulation' }
    ]

    // SAFE COMPUTED PROPERTIES WITH ERROR HANDLING
    const canStart = computed(() => fileName.value && selectedDomain.value && selectedPDDLType.value)
    
    // BULLETPROOF: Safe total duration calculation
    const totalDuration = computed(() => {
      try {
        if (!parsedActions.value || !Array.isArray(parsedActions.value) || parsedActions.value.length === 0) {
          return 0
        }
        
        const result = calculateTotalDuration(parsedActions.value, selectedPDDLType.value)
        
        // Ensure result is always a safe number
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return result
        } else {
          console.warn('Invalid totalDuration result:', result, 'using fallback')
          return parsedActions.value.length * 1.5 // Safe fallback
        }
      } catch (error) {
        console.error('Error calculating total duration:', error)
        console.error('parsedActions:', parsedActions.value)
        console.error('selectedPDDLType:', selectedPDDLType.value)
        
        // Safe fallback based on action count
        const actionCount = parsedActions.value?.length || 0
        return actionCount * 1.5
      }
    })

    // BULLETPROOF: Stats items that CANNOT FAIL
    const statsItems = computed(() => {
      console.log('📊 Computing statsItems...')
      
      // STEP 1: Safe helper function for .toFixed()
      const safeToFixed = (value, digits = 1) => {
        try {
          if (value === null || value === undefined) return '0.0'
          if (typeof value === 'string') {
            const parsed = parseFloat(value)
            if (isNaN(parsed)) return '0.0'
            return parsed.toFixed(digits)
          }
          if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
            return value.toFixed(digits)
          }
          return '0.0'
        } catch (error) {
          console.error('Error in safeToFixed:', error, 'value:', value)
          return '0.0'
        }
      }

      // STEP 2: Emergency fallback stats
      const emergencyStats = [
        { icon: '🔧', label: 'Status', value: 'Loading...', percentage: 0 },
        { icon: '📋', label: 'Type', value: selectedPDDLType.value || 'Unknown', percentage: 0 },
        { icon: '🏢', label: 'Domain', value: selectedDomain.value || 'Unknown', percentage: 0 }
      ]

      try {
        // STEP 3: Safe entity count
        let total = 0
        try {
          total = getTotalEntities()
          if (typeof total !== 'number' || isNaN(total) || total < 0) total = 0
        } catch (entityError) {
          console.error('Error getting total entities:', entityError)
          total = 0
        }

        // STEP 4: Safe metrics access
        let metrics = {}
        try {
          metrics = planMetrics.value || {}
          if (typeof metrics !== 'object') metrics = {}
        } catch (metricsError) {
          console.error('Error accessing planMetrics:', metricsError)
          metrics = {}
        }

        // STEP 5: Ultra-safe duration calculation
        let safeDuration = 0
        let durationString = '0.0 steps'
        
        try {
          // Try to get totalDuration
          let rawDuration = null
          try {
            rawDuration = totalDuration.value
          } catch (durationAccessError) {
            console.error('Error accessing totalDuration.value:', durationAccessError)
            rawDuration = null
          }

          // Process the duration
          if (typeof rawDuration === 'number' && !isNaN(rawDuration) && isFinite(rawDuration) && rawDuration >= 0) {
            safeDuration = rawDuration
          } else if (typeof rawDuration === 'string' && rawDuration.trim() !== '') {
            const parsed = parseFloat(rawDuration)
            if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0) {
              safeDuration = parsed
            }
          } else {
            // Fallback: calculate from actions
            try {
              if (parsedActions.value && Array.isArray(parsedActions.value) && parsedActions.value.length > 0) {
                safeDuration = parsedActions.value.length * 1.5
              }
            } catch (actionsError) {
              console.error('Error accessing parsedActions for duration fallback:', actionsError)
              safeDuration = 0
            }
          }

          // Create safe duration string
          const durationValue = safeToFixed(safeDuration, 1)
          const suffix = (selectedPDDLType.value === 'classical') ? ' steps' : 's'
          durationString = durationValue + suffix

        } catch (durationError) {
          console.error('Critical error in duration calculation:', durationError)
          safeDuration = 0
          durationString = '0.0 steps'
        }

        // STEP 6: Safe action count
        let actionCount = 0
        try {
          if (parsedActions.value && Array.isArray(parsedActions.value)) {
            actionCount = parsedActions.value.length
          }
          if (typeof actionCount !== 'number' || isNaN(actionCount) || actionCount < 0) {
            actionCount = 0
          }
        } catch (actionError) {
          console.error('Error getting action count:', actionError)
          actionCount = 0
        }

        // STEP 7: Safe percentage calculation
        const safePercentageCalc = (value, max) => {
          try {
            if (typeof value !== 'number' || typeof max !== 'number' || isNaN(value) || isNaN(max) || max <= 0) {
              return 0
            }
            return Math.max(0, Math.min(100, (value / max) * 100))
          } catch (error) {
            return 0
          }
        }

        // STEP 8: Create base stats with maximum safety
        const baseStats = []

        try {
          baseStats.push({
            icon: '🏢',
            label: 'Domain',
            value: getDomainName(selectedDomain.value) || 'Unknown',
            percentage: 100
          })
        } catch (error) {
          baseStats.push({ icon: '🏢', label: 'Domain', value: 'Error', percentage: 0 })
        }

        try {
          baseStats.push({
            icon: '📋',
            label: 'PDDL Type',
            value: getPDDLTypeName(selectedPDDLType.value) || 'Unknown',
            percentage: 100
          })
        } catch (error) {
          baseStats.push({ icon: '📋', label: 'PDDL Type', value: 'Error', percentage: 0 })
        }

        try {
          baseStats.push({
            icon: '⚙️',
            label: 'Actions',
            value: actionCount,
            percentage: safePercentageCalc(actionCount, 50)
          })
        } catch (error) {
          baseStats.push({ icon: '⚙️', label: 'Actions', value: 0, percentage: 0 })
        }

        try {
          baseStats.push({
            icon: '⏱️',
            label: 'Duration',
            value: durationString, // Already safe string
            percentage: safePercentageCalc(safeDuration, 300)
          })
        } catch (error) {
          baseStats.push({ icon: '⏱️', label: 'Duration', value: '0.0 steps', percentage: 0 })
        }

        try {
          baseStats.push({
            icon: '📦',
            label: 'Entities',
            value: total,
            percentage: safePercentageCalc(total, 20)
          })
        } catch (error) {
          baseStats.push({ icon: '📦', label: 'Entities', value: 0, percentage: 0 })
        }

        // STEP 9: Add type-specific metrics with ultra-safe handling
        try {
          if (selectedPDDLType.value === 'temporal' || selectedPDDLType.value === 'pddl_plus') {
            let parallelActions = 0
            try {
              parallelActions = metrics.parallelActions
              if (typeof parallelActions !== 'number' || isNaN(parallelActions) || parallelActions < 0) {
                parallelActions = 0
              }
            } catch (parallelError) {
              parallelActions = 0
            }

            baseStats.push({
              icon: '🔄',
              label: 'Parallel Actions',
              value: parallelActions,
              percentage: safePercentageCalc(parallelActions, 5)
            })
          }

          if (selectedPDDLType.value === 'numerical') {
            let totalCost = 0
            let costString = '0.0'

            try {
              totalCost = metrics.totalCost
              if (typeof totalCost === 'number' && !isNaN(totalCost) && isFinite(totalCost) && totalCost >= 0) {
                costString = safeToFixed(totalCost, 1)
              } else {
                totalCost = 0
                costString = '0.0'
              }
            } catch (costError) {
              totalCost = 0
              costString = '0.0'
            }

            baseStats.push({
              icon: '💰',
              label: 'Total Cost',
              value: costString, // Safe pre-formatted string
              percentage: safePercentageCalc(totalCost, 100)
            })
          }

          if (selectedPDDLType.value === 'pddl_plus') {
            try {
              const actionBreakdown = metrics.actionBreakdown
              if (actionBreakdown && typeof actionBreakdown === 'object') {
                let processCount = 0
                let eventCount = 0

                try {
                  processCount = actionBreakdown.processes
                  if (typeof processCount !== 'number' || isNaN(processCount) || processCount < 0) {
                    processCount = 0
                  }
                } catch (processError) {
                  processCount = 0
                }

                try {
                  eventCount = actionBreakdown.events
                  if (typeof eventCount !== 'number' || isNaN(eventCount) || eventCount < 0) {
                    eventCount = 0
                  }
                } catch (eventError) {
                  eventCount = 0
                }

                if (processCount > 0 || eventCount > 0) {
                  const totalPE = processCount + eventCount
                  const safeActionCount = Math.max(1, actionCount)

                  baseStats.push({
                    icon: '⚡',
                    label: 'Processes/Events',
                    value: `${processCount}/${eventCount}`,
                    percentage: safePercentageCalc(totalPE, safeActionCount)
                  })
                }
              }
            } catch (pddlPlusError) {
              console.error('Error in PDDL+ metrics:', pddlPlusError)
              // Continue without PDDL+ specific metrics
            }
          }
        } catch (typeSpecificError) {
          console.error('Error adding type-specific metrics:', typeSpecificError)
          // Continue with base stats only
        }

        // STEP 10: Final validation of all items
        const validatedStats = baseStats.map((item, index) => {
          try {
            return {
              icon: (item.icon && typeof item.icon === 'string') ? item.icon : '❓',
              label: (item.label && typeof item.label === 'string') ? item.label : 'Unknown',
              value: (item.value !== undefined && item.value !== null) ? item.value : 'N/A',
              percentage: (typeof item.percentage === 'number' && !isNaN(item.percentage) && isFinite(item.percentage))
                ? Math.max(0, Math.min(100, item.percentage))
                : 0
            }
          } catch (itemError) {
            console.error(`Error validating stats item ${index}:`, itemError)
            return {
              icon: '❓',
              label: 'Error',
              value: 'Invalid',
              percentage: 0
            }
          }
        })

        console.log('✅ Stats computed successfully:', validatedStats.length, 'items')
        return validatedStats

      } catch (criticalError) {
        console.error('CRITICAL ERROR in statsItems computation:', criticalError)
        console.error('Stack trace:', criticalError.stack)
        
        // Return emergency stats that cannot fail
        return emergencyStats
      }
    })

    // Safe percentage helper for template
    const safePercentage = (value) => {
      try {
        if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
          return Math.max(0, Math.min(100, value))
        }
        return 0
      } catch (error) {
        console.error('Error in safePercentage:', error)
        return 0
      }
    }

    // Particle system
    const generateParticles = (type, count = 15) => {
      const newParticles = []
      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: Math.random() + Date.now(),
          type,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
          size: Math.random() * 6 + 3,
          rotation: Math.random() * 360
        })
      }
      particles.value.push(...newParticles)
    }

    const updateParticles = () => {
      particles.value = particles.value
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 0.015,
          size: particle.size * 0.99,
          rotation: particle.rotation + 1
        }))
        .filter(particle => particle.life > 0)
    }

    const getParticleStyle = (particle) => {
      return {
        left: particle.x + '%',
        top: particle.y + '%',
        width: particle.size + 'px',
        height: particle.size + 'px',
        opacity: particle.life,
        transform: `rotate(${particle.rotation}deg)`
      }
    }

    // Helper functions
    const getPDDLTypeName = (type) => {
      const typeObj = pddlTypes.find(t => t.id === type)
      return typeObj ? typeObj.name : 'Unknown'
    }

    const getPDDLTypeDescription = (type) => {
      const typeObj = pddlTypes.find(t => t.id === type)
      return typeObj ? typeObj.description : 'Unknown PDDL type'
    }

    const getDomainIcon = (domain) => {
      const icons = { robot: '🤖', elevator: '🛗', logistics: '🚚' }
      return icons[domain] || '❓'
    }

    const getDomainName = (domain) => {
      const names = { robot: 'Robot', elevator: 'Elevator', logistics: 'Logistics' }
      return names[domain] || 'Unknown'
    }

    const getDomainSubtitle = (domain) => {
      const subtitles = {
        robot: 'Autonomous Navigation',
        elevator: 'Vertical Transportation', 
        logistics: 'Supply Chain Management'
      }
      return subtitles[domain] || ''
    }

    const getDomainDescription = (domain) => {
      const descriptions = {
        robot: 'Watch robots move between rooms, pick up objects, and deliver them to target locations with precision and efficiency.',
        elevator: 'See elevators transport people between floors efficiently and safely, optimizing wait times and energy usage.',
        logistics: 'Observe trucks, planes, and packages moving through a complex delivery network with real-time coordination.'
      }
      return descriptions[domain] || 'Domain visualization system.'
    }

    const getTotalEntities = () => {
      try {
        const entities = parsedEntities.value || {}
        return (entities.rooms?.length || 0) + 
               (entities.objects?.length || 0) + 
               (entities.robots?.length || 0) +
               (entities.vehicles?.length || 0) +
               (entities.elevators?.length || 0) +
               (entities.passengers?.length || 0) +
               (entities.packages?.length || 0) +
               (entities.floors?.length || 0) +
               (entities.locations?.length || 0)
      } catch (error) {
        console.error('Error calculating total entities:', error)
        return 0
      }
    }

    // File handling
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Navigation methods
    const navigateToRobot = () => {
      console.log('🤖 Navigating to Robot domain at localhost:5000')
      generateParticles('navigation', 25)
      successMessage.value = 'Redirecting to Robot visualizer...'
      setTimeout(() => {
        window.open('http://localhost:5000', '_blank')
        successMessage.value = ''
      }, 1000)
    }

    const navigateToLogistics = () => {
      console.log('🚚 Navigating to Logistics domain at localhost:8081')
      generateParticles('navigation', 25)
      successMessage.value = 'Redirecting to Logistics visualizer...'
      setTimeout(() => {
        window.open('http://localhost:8081', '_blank')
        successMessage.value = ''
      }, 1000)
    }

    // Methods
    const selectDomain = (domain) => {
      selectedDomain.value = domain
      simulationActive.value = false
      generateParticles('domain-change', 20)
      console.log('Selected domain:', domain)
    }

    const handleDomainCardClick = (domainId) => {
      const domain = domains.find(d => d.id === domainId)
      if (domain && domain.link) {
        if (domainId === 'robot') {
          navigateToRobot()
        } else if (domainId === 'logistics') {
          navigateToLogistics()
        }
      } else {
        selectDomain(domainId)
      }
    }

    const onDragOver = (e) => {
      e.preventDefault()
    }

    const onDragLeave = (e) => {
      e.preventDefault()
    }

    const onDrop = (e) => {
      e.preventDefault()
      const files = e.dataTransfer.files
      if (files.length > 0) {
        processFile(files[0])
      }
    }

    const handleFileUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        processFile(file)
      }
    }

    const processFile = (file) => {
      isUploading.value = true
      generateParticles('upload', 25)
      
      fileName.value = file.name
      fileSize.value = formatFileSize(file.size)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setTimeout(() => {
          fileContent.value = e.target.result
          isUploading.value = false
          successMessage.value = `File "${file.name}" loaded successfully!`
          generateParticles('success', 30)
          console.log('File loaded:', file.name)
          
          setTimeout(() => { successMessage.value = '' }, 3000)
        }, 1000)
      }
      reader.readAsText(file)
    }

    const startVisualization = () => {
      try {
        error.value = ''
        isProcessing.value = true
        generateParticles('processing', 35)
        
        setTimeout(() => {
          if (!fileContent.value) {
            error.value = 'No file content found'
            isProcessing.value = false
            return
          }

          if (!selectedDomain.value) {
            error.value = 'Please select a domain (Robot/Elevator/Logistics)'
            isProcessing.value = false
            return
          }

          if (!selectedPDDLType.value) {
            error.value = 'Please select a PDDL type'
            isProcessing.value = false
            return
          }

          console.log('=== STARTING VISUALIZATION ===')
          console.log('Domain:', selectedDomain.value)
          console.log('PDDL Type:', selectedPDDLType.value)
          console.log('File content length:', fileContent.value.length)

          // For robot domain, pass raw content to let robot simulator handle parsing
          if (selectedDomain.value === 'robot') {
            console.log('🤖 Passing raw content to robot simulator')
            
            parsedActions.value = fileContent.value
            parsedEntities.value = {
              pddlType: selectedPDDLType.value,
              domain: selectedDomain.value
            }
            
            simulationActive.value = true
            isProcessing.value = false
            
            const typeDisplay = getPDDLTypeName(selectedPDDLType.value)
            const domainDisplay = getDomainName(selectedDomain.value)
            successMessage.value = `${typeDisplay} ${domainDisplay} visualization started!`
            generateParticles('visualization-start', 40)
            
            setTimeout(() => { successMessage.value = '' }, 3000)
            return
          }

          // For elevator domain, pass raw content
          if (selectedDomain.value === 'elevator') {
            console.log('🛗 Setting up elevator simulator')
            
            parsedActions.value = fileContent.value
            parsedEntities.value = {
              domain: selectedDomain.value,
              pddlType: selectedPDDLType.value
            }
            
            simulationActive.value = true
            isProcessing.value = false
            
            const typeDisplay = getPDDLTypeName(selectedPDDLType.value)
            const domainDisplay = getDomainName(selectedDomain.value)
            successMessage.value = `${typeDisplay} ${domainDisplay} visualization started!`
            generateParticles('visualization-start', 40)
            
            setTimeout(() => { successMessage.value = '' }, 3000)
            return
          }

          // ENHANCED: Handle plans with metadata for logistics domain
          try {
            // Clean the content first - extract just the plan actions
            let cleanContent = fileContent.value
            
            // Extract plan section if metadata is present
            if (fileContent.value.includes('found plan:') || fileContent.value.includes('problem solved')) {
              const lines = fileContent.value.split('\n')
              let planStart = -1
              let planEnd = lines.length
              
              // Find plan start
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('found plan:') || /^\d+(?:\.\d+)?\s*:\s*\(/.test(lines[i].trim())) {
                  planStart = lines[i].includes('found plan:') ? i + 1 : i
                  break
                }
              }
              
              // Find plan end
              if (planStart !== -1) {
                for (let i = planStart; i < lines.length; i++) {
                  if (lines[i].includes('plan-length') || lines[i].includes('metric') || lines[i].includes('planning time')) {
                    planEnd = i
                    break
                  }
                }
                
                const planLines = lines.slice(planStart, planEnd).filter(line => {
                  const trimmed = line.trim()
                  return trimmed.length > 0 && 
                         !trimmed.startsWith(';') && 
                         /^\d+(?:\.\d+)?\s*:\s*\(/.test(trimmed)
                })
                
                cleanContent = planLines.join('\n')
                console.log('✅ Extracted clean plan content:', cleanContent.split('\n').length, 'actions')
              }
            }
            
            const parseResult = parsePlanFile(cleanContent, selectedPDDLType.value)
            
            if (parseResult.error) {
              error.value = parseResult.error
              isProcessing.value = false
              return
            }
            
            if (parseResult.actions.length === 0) {
              error.value = `No valid ${getPDDLTypeName(selectedPDDLType.value)} actions found in plan file. Check console for details.`
              isProcessing.value = false
              return
            }

            // Set parsed data for logistics
            parsedActions.value = parseResult.actions
            planMetrics.value = parseResult.metrics || {}
            
            parsedEntities.value = {
              rooms: parseResult.rooms || [],
              objects: parseResult.objects || [],
              robots: parseResult.robots || [],
              vehicles: parseResult.vehicles || [],
              elevators: parseResult.elevators || [],
              passengers: parseResult.passengers || [],
              packages: parseResult.packages || [],
              floors: parseResult.floors || [],
              locations: parseResult.locations || [],
              totalDuration: parseResult.totalDuration || 0,
              pddlType: parseResult.pddlType || selectedPDDLType.value,
              domain: selectedDomain.value
            }
            
            simulationActive.value = true
            isProcessing.value = false
            
            const typeDisplay = getPDDLTypeName(parseResult.pddlType || selectedPDDLType.value)
            const domainDisplay = getDomainName(selectedDomain.value)
            successMessage.value = `${typeDisplay} ${domainDisplay} visualization started with ${parseResult.actions.length} actions!`
            generateParticles('visualization-start', 40)
            
            console.log('=== VISUALIZATION STARTED ===')
            console.log('Actions:', parseResult.actions.length)
            console.log('PDDL Type:', parseResult.pddlType)
            console.log('Total duration:', parseResult.totalDuration)
            console.log('Sample actions:', parseResult.actions.slice(0, 3))
            
            setTimeout(() => { successMessage.value = '' }, 3000)
            
          } catch (parseError) {
            console.error('Parse error:', parseError)
            error.value = `Parse error: ${parseError.message}. Check console for details.`
            isProcessing.value = false
          }
          
        }, 1500)
        
      } catch (err) {
        console.error('Error starting visualization:', err)
        error.value = `Error: ${err.message}`
        isProcessing.value = false
      }
    }

    // Lifecycle
    onMounted(() => {
      particleTimer.value = setInterval(updateParticles, 50)
      generateParticles('ambient', 10)
    })

    onUnmounted(() => {
      if (particleTimer.value) {
        clearInterval(particleTimer.value)
      }
    })

    return {
      // State
      selectedDomain,
      selectedPDDLType,
      fileName,
      fileSize,
      simulationActive,
      error,
      successMessage,
      parsedActions,
      parsedEntities,
      planMetrics,
      isUploading,
      isProcessing,
      particles,
      
      // Static data
      domains,
      pddlTypes,
      features,
      steps,
      
      // Computed
      canStart,
      totalDuration,
      statsItems,
      
      // Methods
      getParticleStyle,
      selectDomain,
      handleDomainCardClick,
      navigateToRobot,
      navigateToLogistics,
      handleFileUpload,
      onDragOver,
      onDragLeave,
      onDrop,
      getPDDLTypeDescription,
      getDomainIcon, 
      getDomainName,
      getDomainSubtitle,
      getDomainDescription,
      startVisualization,
      safePercentage
    }
  }
}
</script>
<style scoped>
@import './home.css';

/* HEADER */
.pddl-visualizer .header {
  background: linear-gradient(to right, #a18cd1, #fbc2eb);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.pddl-visualizer .header-content {
  width: 100%;
  margin: 0;
  padding: 0 2rem;
  display: flex;
  align-items: center;
}

/* HEADER CONTAINER */
.pddl-visualizer .header-container {
  display: flex;
  align-items: center;
  justify-content: flex-start; /* Changed from space-between */
  gap: 2rem; /* Added spacing between title and nav */
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 0.75rem 2rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

/* TITLE */
.pddl-visualizer .main-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  position: relative;
  margin: 0;
  flex-grow: 1; /* Allows title to push buttons toward center */
}

.pddl-visualizer .title-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.pddl-visualizer .main-title:hover .title-glow {
  transform: translateX(100%);
}

/* ✅ WHITE BACKGROUND FOR BUTTON CONTAINER */
.pddl-visualizer .nav-wrapper {
  background: #ffffff;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

/* BUTTON ROW */
.pddl-visualizer .navigation {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 1rem;
  align-items: center;
  justify-content: flex-end;
  white-space: nowrap;
  overflow-x: auto;
}

/* ✅ LARGER BUTTONS & TEXT */
.pddl-visualizer .nav-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  min-width: auto;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #5115de, #0e0108);
  color: #ffffff;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;

  overflow: hidden;
}

.pddl-visualizer .nav-btn:hover {
  transform: translateY(-2px);
 
}

.pddl-visualizer .nav-btn.active {
 
  color: #fff;
}

.pddl-visualizer .nav-btn .btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.pddl-visualizer .nav-btn:hover .btn-glow {
  transform: translateX(100%);
}

.pddl-visualizer .btn-icon {
  font-size: 1.25rem;
}

/* RESPONSIVE DESIGN */
@media (max-width: 768px) {
  .pddl-visualizer .header-container {
    flex-wrap: nowrap;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
  }

  .pddl-visualizer .main-title {
    font-size: 1.25rem;
  }

  .pddl-visualizer .nav-btn {
    padding: 0.6rem 1.2rem;
    min-width: 120px;
    font-size: 0.95rem;
  }

  .pddl-visualizer .btn-icon {
    font-size: 1rem;
  }

  .pddl-visualizer .navigation {
    overflow-x: auto;
    flex-wrap: nowrap;
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .pddl-visualizer .header-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .pddl-visualizer .nav-wrapper {
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
  }

  .pddl-visualizer .navigation {
    width: 100%;
    justify-content: flex-start;
  }

  .pddl-visualizer .nav-btn {
    padding: 0.6rem 0.9rem;
    font-size: 0.9rem;
    min-width: 110px;
  }
}

/* CARD LINK */
.pddl-visualizer .card-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: #ffffff;
  backdrop-filter: blur(10px);
}

.pddl-visualizer .link-icon {
  font-size: 0.875rem;
}

.pddl-visualizer .link-text {
  font-weight: 500;
}

.pddl-visualizer .domain-card:hover .card-link {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

/* SUCCESS TOAST */
.pddl-visualizer .success-toast {
  animation: navigation-pulse 0.6s ease-in-out;
}

@keyframes navigation-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* PARTICLES */
.pddl-visualizer .particle.navigation {
  background: linear-gradient(45deg, #ffffff, #fbc2eb);
  border-radius: 50%;
  animation: navigation-float 2s ease-in-out infinite;
}

@keyframes navigation-float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(180deg); }
}
</style>
