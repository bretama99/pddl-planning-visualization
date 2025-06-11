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

    <!-- Header with Navigation -->
    <div class="header">
      <div class="header-content">
        <h1 class="main-title">
          <span class="title-icon">🤖</span>
          <span class="title-text">PDDL Visualizer</span>
          <div class="title-glow"></div>
        </h1>
        <nav class="navigation">
          <button 
            @click="selectDomain('robot')" 
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
          <button 
            @click="selectDomain('logistics')" 
            :class="{ active: selectedDomain === 'logistics' }"
            class="nav-btn logistics-btn"
          >
            <span class="btn-icon">🚚</span>
            <span>Logistics</span>
            <div class="btn-glow"></div>
          </button>
        </nav>
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
                <div class="value-bar" :style="{ width: item.percentage + '%' }"></div>
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
                       @click="selectDomain(domain.id)">
                    <div class="card-icon">{{ domain.icon }}</div>
                    <div class="card-title">{{ domain.name }}</div>
                    <div class="card-description">{{ domain.description }}</div>
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
              :pddlType="selectedPDDLType"
            />
            
            <!-- Elevator Domain -->
            <ElevatorSimulator 
              v-else-if="selectedDomain === 'elevator'"
              :actions="parsedActions" 
              :entities="parsedEntities"
              :pddlType="selectedPDDLType"
            />
            
            <!-- Logistics Domain -->
            <LogisticsSimulator 
              v-else-if="selectedDomain === 'logistics'"
              :actions="parsedActions" 
              :entities="parsedEntities"
              :pddlType="selectedPDDLType"
            />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
// Updated PDDLVisualizer.vue script section with integrated debug code
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Updated imports to use the new organized structure
import { parseRobotDomain } from '@/utils/robot/robotParser.js'
import { parseElevatorDomain } from '@/utils/elevator/elevatorParser.js'
import { parseLogisticsDomain } from '@/utils/logistics/logisticsParser.js'
import { calculateTotalDuration } from '@/utils/common/pddlUtils.js'

// Import domain-specific types
import { getRobotPDDLTypeConfig } from '@/utils/robot/robotTypes.js'
import { getElevatorPDDLTypeConfig } from '@/utils/elevator/elevatorTypes.js'
import { getLogisticsPDDLTypeConfig } from '@/utils/logistics/logisticsTypes.js'

import RobotSimulator from '@/components/visualization/RobotSimulator.vue'
import ElevatorSimulator from '@/components/visualization/ElevatorSimulator.vue'
import LogisticsSimulator from '@/components/visualization/LogisticsSimulator.vue'

export default {
  name: 'PDDLVisualizer',
  components: { 
    RobotSimulator,
    ElevatorSimulator, 
    LogisticsSimulator
  },
  setup() {
    // State
    const selectedDomain = ref('robot')
    const selectedPDDLType = ref('classical')
    const fileName = ref('')
    const fileSize = ref('')
    const simulationActive = ref(false)
    const error = ref('')
    const successMessage = ref('')
    const parsedActions = ref([])
    const parsedEntities = ref({})
    const planMetrics = ref({})
    const fileContent = ref('')
    const isUploading = ref(false)
    const isProcessing = ref(false)
    const particles = ref([])
    const particleTimer = ref(null)

    // Static data
    const domains = [
      { id: 'robot', name: 'Robot', icon: '🤖', description: 'Autonomous robot navigation and task execution' },
      { id: 'elevator', name: 'Elevator', icon: '🛗', description: 'Multi-floor passenger transportation system' },
      { id: 'logistics', name: 'Logistics', icon: '🚚', description: 'Complex package delivery and routing network' }
    ]

    const features = [
      { icon: '⚡', text: 'Multi-type PDDL support' },
      { icon: '🎨', text: 'Interactive domain graphics' },
      { icon: '📊', text: 'Advanced plan metrics' },
      { icon: '🔄', text: 'Temporal & numerical parsing' },
      { icon: '🎯', text: 'Domain-specific optimizations' },
      { icon: '📱', text: 'Responsive design' }
    ]

    const steps = [
      { title: 'Upload Plan File', description: 'Select your PDDL plan file from your computer' },
      { title: 'Select PDDL Type', description: 'Choose your plan type (Classical, Temporal, Numerical, or PDDL+)' },
      { title: 'Choose Domain', description: 'Select the appropriate domain type (Robot/Elevator/Logistics)' },
      { title: 'Start Visualization', description: 'Click the start button to begin the interactive simulation' }
    ]

    // Domain-specific parsers mapping - Updated to use new structure
    const domainParsers = {
      robot: parseRobotDomain,
      elevator: parseElevatorDomain,
      logistics: parseLogisticsDomain
    }

    // Domain-specific PDDL type config getters
    const domainPDDLTypeConfigs = {
      robot: getRobotPDDLTypeConfig,
      elevator: getElevatorPDDLTypeConfig,
      logistics: getLogisticsPDDLTypeConfig
    }

    // Enhanced domain detection function
    const detectDomainFromContent = (content) => {
      const contentLower = content.toLowerCase();
      
      // Count domain-specific keywords
      const robotKeywords = ['robot', 'room', 'pick', 'drop', 'move', 'carry'];
      const elevatorKeywords = ['elevator', 'floor', 'passenger', 'lift', 'board'];
      const logisticsKeywords = ['truck', 'airplane', 'package', 'load', 'unload', 'drive', 'fly', 'cargo', 'airport', 'city'];
      
      const robotScore = robotKeywords.filter(k => contentLower.includes(k)).length;
      const elevatorScore = elevatorKeywords.filter(k => contentLower.includes(k)).length;
      const logisticsScore = logisticsKeywords.filter(k => contentLower.includes(k)).length;
      
      console.log('🔍 Domain detection scores:', { robotScore, elevatorScore, logisticsScore });
      
      if (logisticsScore > robotScore && logisticsScore > elevatorScore) {
        return 'logistics';
      } else if (elevatorScore > robotScore) {
        return 'elevator';
      } else {
        return 'robot';
      }
    }

    // Computed
    const canStart = computed(() => fileName.value && selectedDomain.value && selectedPDDLType.value)
    
    const totalDuration = computed(() => {
      if (parsedActions.value.length === 0) return 0
      return calculateTotalDuration(parsedActions.value, selectedPDDLType.value)
    })

    const statsItems = computed(() => {
      const total = getTotalEntities()
      const metrics = planMetrics.value
      
      const baseStats = [
        { 
          icon: '🏢', 
          label: 'Domain', 
          value: getDomainName(selectedDomain.value),
          percentage: 100
        },
        { 
          icon: '📋', 
          label: 'PDDL Type', 
          value: getPDDLTypeName(selectedPDDLType.value),
          percentage: 100
        },
        { 
          icon: '⚙️', 
          label: 'Actions', 
          value: parsedActions.value.length,
          percentage: Math.min((parsedActions.value.length / 50) * 100, 100)
        },
        { 
          icon: '⏱️', 
          label: 'Duration', 
          value: totalDuration.value.toFixed(1) + (selectedPDDLType.value === 'classical' ? ' steps' : 's'),
          percentage: Math.min((totalDuration.value / 300) * 100, 100)
        },
        { 
          icon: '📦', 
          label: 'Entities', 
          value: total,
          percentage: Math.min((total / 20) * 100, 100)
        }
      ]

      // Add type-specific metrics using domain-specific configs
      const typeConfig = domainPDDLTypeConfigs[selectedDomain.value]?.(selectedPDDLType.value);
      
      if (typeConfig?.supportsParallel) {
        baseStats.push({
          icon: '🔄',
          label: 'Parallel Actions',
          value: metrics.parallelActions || 0,
          percentage: Math.min(((metrics.parallelActions || 0) / 5) * 100, 100)
        })
      }

      if (typeConfig?.supportsCost) {
        baseStats.push({
          icon: '💰',
          label: 'Total Cost',
          value: (metrics.totalCost || 0).toFixed(1),
          percentage: Math.min(((metrics.totalCost || 0) / 100) * 100, 100)
        })
      }

      return baseStats
    })

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
      const types = {
        classical: 'Classical PDDL',
        temporal: 'Temporal PDDL', 
        numerical: 'Numerical PDDL',
        pddl_plus: 'PDDL+'
      }
      return types[type] || 'Unknown'
    }

    const getPDDLTypeDescription = (type) => {
      const descriptions = {
        classical: 'Step-based planning with discrete actions',
        temporal: 'Time-based planning with durative actions',
        numerical: 'Planning with numeric fluents and constraints',
        pddl_plus: 'Hybrid discrete/continuous planning'
      }
      return descriptions[type] || 'Unknown PDDL type'
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
      const entities = parsedEntities.value
      return Object.values(entities).reduce((total, entityArray) => {
        return total + (Array.isArray(entityArray) ? entityArray.length : 0)
      }, 0)
    }

    // File handling
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Methods
    const selectDomain = (domain) => {
      selectedDomain.value = domain
      simulationActive.value = false
      generateParticles('domain-change', 20)
      console.log('🎯 Selected domain:', domain)
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

    // Enhanced processFile with auto-detection
    const processFile = (file) => {
      isUploading.value = true
      generateParticles('upload', 25)
      
      fileName.value = file.name
      fileSize.value = formatFileSize(file.size)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setTimeout(() => {
          fileContent.value = e.target.result
          
          // AUTO-DETECT DOMAIN
          const detectedDomain = detectDomainFromContent(fileContent.value);
          console.log('🎯 Auto-detected domain:', detectedDomain);
          selectedDomain.value = detectedDomain;
          
          isUploading.value = false
          successMessage.value = `File "${file.name}" loaded successfully! Auto-detected: ${getDomainName(detectedDomain)}`
          generateParticles('success', 30)
          console.log('📁 File loaded:', file.name, 'Size:', fileSize.value)
          
          setTimeout(() => { successMessage.value = '' }, 3000)
        }, 1000)
      }
      reader.readAsText(file)
    }

    // Enhanced startVisualization with debug logging
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

          console.log('🚀 === STARTING VISUALIZATION (DEBUG) ===')
          console.log('🎯 Domain:', selectedDomain.value)
          console.log('📋 PDDL Type:', selectedPDDLType.value)
          console.log('📄 File content length:', fileContent.value.length)
          console.log('📄 First 500 chars:', fileContent.value.substring(0, 500))

          // Check if content contains logistics keywords
          const logisticsKeywords = ['load', 'unload', 'drive', 'fly', 'truck', 'airplane', 'package'];
          const foundKeywords = logisticsKeywords.filter(keyword => 
            fileContent.value.toLowerCase().includes(keyword));
          console.log('🔍 Found logistics keywords:', foundKeywords);

          // Route to domain-specific parser
          const parser = domainParsers[selectedDomain.value]
          if (!parser) {
            error.value = `No parser found for domain: ${selectedDomain.value}`
            isProcessing.value = false
            return
          }

          console.log(`🔧 Using ${selectedDomain.value} domain parser...`)
          
          // Parse and log results
          const parseResult = parser(fileContent.value, selectedPDDLType.value)
          
          console.log('📊 Parse result:', parseResult)
          console.log('📊 Actions found:', parseResult.actions?.length || 0)
          console.log('📊 Entities:', parseResult.entities)
          console.log('📊 Error:', parseResult.error)
          
          if (parseResult.error) {
            error.value = parseResult.error
            isProcessing.value = false
            console.error('❌ Parse error:', parseResult.error)
            return
          }
          
          if (parseResult.actions.length === 0) {
            error.value = `No valid ${getPDDLTypeName(selectedPDDLType.value)} actions found in plan file. Check console for details.`
            isProcessing.value = false
            console.warn('⚠️ No actions parsed - file content preview:')
            console.warn(fileContent.value.split('\n').slice(0, 10).join('\n'))
            return
          }

          // Log first few actions
          console.log('📋 First 3 actions:', parseResult.actions.slice(0, 3))

          // Set parsed data
          parsedActions.value = parseResult.actions
          parsedEntities.value = parseResult.entities || {}
          planMetrics.value = parseResult.metrics || {}
          
          simulationActive.value = true
          isProcessing.value = false
          
          const typeDisplay = getPDDLTypeName(selectedPDDLType.value)
          const domainDisplay = getDomainName(selectedDomain.value)
          successMessage.value = `${typeDisplay} ${domainDisplay} visualization started with ${parseResult.actions.length} actions!`
          generateParticles('visualization-start', 40)
          
          console.log('✅ === VISUALIZATION STARTED (DEBUG) ===')
          console.log('⚙️ Actions:', parseResult.actions.length)
          console.log('📦 Entities summary:')
          Object.keys(parseResult.entities).forEach(key => {
            console.log(`  ${key}: ${parseResult.entities[key]?.length || 0} items`)
            if (parseResult.entities[key]?.length > 0) {
              console.log(`    ${parseResult.entities[key]}`)
            }
          })
          console.log('📊 Metrics:', parseResult.metrics)
          console.log('🎯 Domain:', parseResult.domain)
          console.log('📋 PDDL Type:', parseResult.pddlType)
          
          setTimeout(() => { successMessage.value = '' }, 3000)
        }, 1500)
        
      } catch (err) {
        console.error('💥 Error starting visualization:', err)
        error.value = `Error: ${err.message}`
        isProcessing.value = false
      }
    }

    // Lifecycle
    onMounted(() => {
      particleTimer.value = setInterval(updateParticles, 50)
      generateParticles('ambient', 10)
      console.log('🎬 PDDL Visualizer mounted with new organized structure')
    })

    onUnmounted(() => {
      if (particleTimer.value) {
        clearInterval(particleTimer.value)
      }
      console.log('🛑 PDDL Visualizer unmounted')
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
      features,
      steps,
      
      // Computed
      canStart,
      totalDuration,
      statsItems,
      
      // Methods
      getParticleStyle,
      selectDomain,
      handleFileUpload,
      onDragOver,
      onDragLeave,
      onDrop,
      getPDDLTypeDescription,
      getDomainIcon, 
      getDomainName,
      getDomainSubtitle,
      getDomainDescription,
      startVisualization
    }
  }
}

</script>


<style scoped>
.pddl-visualizer {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
  overflow-x: hidden;
  width: 100%;
}

/* Floating Background Elements */
.floating-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  font-size: 40px;
  opacity: 0.1;
  animation: float-complex var(--duration, 15s) ease-in-out infinite;
  animation-delay: var(--delay, 0s);
  left: var(--x, 50%);
  top: var(--y, 50%);
}

@keyframes float-complex {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 0.1;
  }
  25% {
    transform: translate(30px, -50px) rotate(90deg) scale(1.2);
    opacity: 0.3;
  }
  50% {
    transform: translate(-20px, -80px) rotate(180deg) scale(0.8);
    opacity: 0.5;
  }
  75% {
    transform: translate(-40px, -30px) rotate(270deg) scale(1.1);
    opacity: 0.2;
  }
}

/* Particle System */
.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.particle.upload {
  background: radial-gradient(circle, #3498db, #2980b9);
  box-shadow: 0 0 15px rgba(52, 152, 219, 0.6);
}

.particle.success {
  background: radial-gradient(circle, #27ae60, #2ecc71);
  box-shadow: 0 0 15px rgba(39, 174, 96, 0.6);
}

.particle.processing {
  background: radial-gradient(circle, #f39c12, #e67e22);
  box-shadow: 0 0 15px rgba(243, 156, 18, 0.6);
}

.particle.visualization-start {
  background: radial-gradient(circle, #9b59b6, #8e44ad);
  box-shadow: 0 0 20px rgba(155, 89, 182, 0.8);
}

.particle.domain-change {
  background: radial-gradient(circle, #e74c3c, #c0392b);
  box-shadow: 0 0 15px rgba(231, 76, 60, 0.6);
}

.particle.ambient {
  background: radial-gradient(circle, rgba(255,255,255,0.4), rgba(255,255,255,0.1));
  box-shadow: 0 0 10px rgba(255,255,255,0.3);
}

/* Toast Animations */
.toast-slide-enter-active, .toast-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.8);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.8);
}

.error-toast, .success-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 18px 24px;
  border-radius: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 1000;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255,255,255,0.2);
  position: relative;
  overflow: hidden;
}

.error-toast {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.95), rgba(192, 57, 43, 0.9));
  color: white;
}

.success-toast {
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.95), rgba(46, 204, 113, 0.9));
  color: white;
}

.toast-icon {
  font-size: 24px;
  animation: toast-icon-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes toast-icon-bounce {
  0% { transform: scale(0) rotate(180deg); }
  50% { transform: scale(1.3) rotate(0deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.toast-message {
  flex: 1;
  font-weight: 600;
  font-size: 16px;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255,255,255,0.4);
  animation: toast-progress 3s linear;
}

@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}

.close-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.8;
  transition: all 0.3s ease;
  padding: 4px;
  border-radius: 50%;
}

.close-btn:hover {
  opacity: 1;
  background: rgba(255,255,255,0.2);
  transform: scale(1.1);
}

/* Header - Minimized */
.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
  width: 100%;
}

.header-content {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.main-title {
  margin: 0;
  color: #2c3e50;
  font-size: 1.6rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.title-icon {
  font-size: 2rem;
  animation: title-icon-pulse 3s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

@keyframes title-icon-pulse {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.1) rotate(5deg); }
}

.title-text {
  background: linear-gradient(135deg, #2c3e50, #3498db);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-glow {
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  background: linear-gradient(45deg, transparent, rgba(52, 152, 219, 0.1), transparent);
  border-radius: 10px;
  animation: title-glow-pulse 4s ease-in-out infinite;
  z-index: -1;
}

@keyframes title-glow-pulse {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.navigation {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 10px 20px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #2c3e50;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.btn-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.nav-btn:hover .btn-icon {
  transform: scale(1.2) rotate(10deg);
}

.btn-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(52, 152, 219, 0.1), transparent);
  animation: btn-glow-rotate 3s linear infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-btn:hover .btn-glow {
  opacity: 1;
}

@keyframes btn-glow-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.nav-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.nav-btn.active {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-color: #2980b9;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
  transform: translateY(-1px);
}

.robot-btn.active {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.elevator-btn.active {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.logistics-btn.active {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
}

/* Main Content - FULL WIDTH LAYOUT */
.main-content {
  display: flex;
  min-height: calc(100vh - 80px);
  width: 100%;
  max-width: none;
  margin: 0;
  gap: 15px;
  padding: 15px;
  box-sizing: border-box;
}

/* Sidebar - Fixed Width */
.sidebar {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 16px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.2);
  position: relative;
  flex-shrink: 0;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  border-radius: 16px;
  pointer-events: none;
}

.section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(241, 243, 244, 0.6);
  position: relative;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.section-icon {
  font-size: 1.2rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.section-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, #3498db, transparent);
  margin-left: 12px;
  border-radius: 1px;
}

/* Section Transitions */
.section-expand-enter-active, .section-expand-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-expand-enter-from {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
  max-height: 0;
}

.section-expand-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
  max-height: 0;
}

/* Upload Zone - Compact */
.upload-zone {
  border: 3px dashed #bdc3c7;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #fafbfc, #f8f9fa);
  position: relative;
  overflow: hidden;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-zone:hover {
  border-color: #3498db;
  background: linear-gradient(135deg, #f0f8ff, #e3f2fd);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.2);
}

.upload-zone.has-file {
  border-color: #27ae60;
  background: linear-gradient(135deg, #f0fff4, #e8f5e8);
  border-style: solid;
}

.upload-zone.uploading {
  border-color: #f39c12;
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
  animation: upload-pulse 1.5s ease-in-out infinite;
}

@keyframes upload-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.upload-icon {
  font-size: 2.5rem;
  transition: all 0.3s ease;
}

.upload-icon.pulse {
  animation: icon-spin 1s linear infinite;
}

@keyframes icon-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.upload-text {
  color: #2c3e50;
  font-weight: 600;
  font-size: 13px;
  text-align: center;
  line-height: 1.3;
}

.file-info {
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(39, 174, 96, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(39, 174, 96, 0.3);
}

.file-name {
  font-weight: 600;
  color: #27ae60;
  font-size: 12px;
}

.file-size {
  font-size: 10px;
  color: #6c757d;
  margin-top: 2px;
}

/* PDDL Type Selector */
.pddl-type-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pddl-type-dropdown {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #2c3e50;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 10px center;
  background-repeat: no-repeat;
  background-size: 14px;
  padding-right: 35px;
}

.pddl-type-dropdown:hover {
  border-color: #3498db;
  background: linear-gradient(135deg, #f0f8ff, #e3f2fd);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(52, 152, 219, 0.2);
}

.pddl-type-dropdown:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.pddl-type-description {
  font-size: 11px;
  color: #6c757d;
  line-height: 1.4;
  padding: 6px 10px;
  background: rgba(52, 152, 219, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(52, 152, 219, 0.1);
}

/* Domain Display - Compact */
.domain-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 10px;
  border: 2px solid #dee2e6;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.domain-display.robot-theme {
  border-color: #3498db;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.domain-display.elevator-theme {
  border-color: #f39c12;
  background: linear-gradient(135deg, #fff3e0, #ffcc80);
}

.domain-display.logistics-theme {
  border-color: #27ae60;
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
}

.domain-icon {
  font-size: 2rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-pulse {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(52, 152, 219, 0.2), transparent);
  animation: icon-pulse-anim 2s ease-in-out infinite;
}

@keyframes icon-pulse-anim {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.6;
  }
}

.domain-info {
  flex: 1;
}

.domain-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
}

.domain-subtitle {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

/* Start Button - Compact */
.start-btn {
  width: 100%;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
}

.start-btn:disabled {
  background: linear-gradient(135deg, #bdc3c7, #95a5a6);
  cursor: not-allowed;
  transform: none;
}

.robot-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.robot-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.elevator-btn {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.elevator-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
}

.logistics-btn {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
}

.logistics-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
}

.start-icon {
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

.start-btn:hover:not(:disabled) .start-icon {
  transform: scale(1.2) rotate(15deg);
}

.start-text {
  position: relative;
  z-index: 1;
}

.btn-shimmer {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(255,255,255,0.1), transparent);
  animation: shimmer-rotate 2s linear infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.start-btn:hover:not(:disabled) .btn-shimmer {
  opacity: 1;
}

@keyframes shimmer-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Info Grid - Compact */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  border: 1px solid #e9ecef;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: info-item-slide 0.6s ease-out;
  animation-delay: var(--delay, 0s);
  animation-fill-mode: both;
}

@keyframes info-item-slide {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.info-item:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.label {
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
}

.label-icon {
  font-size: 0.9rem;
}

.value {
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 6px;
}

.value-bar {
  height: 3px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 2px;
  transition: width 1s ease-out;
  animation: bar-grow 1.5s ease-out;
  animation-delay: var(--delay, 0s);
}

@keyframes bar-grow {
  from { width: 0%; }
}

/* Features List - Compact */
.features-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05), rgba(52, 152, 219, 0.02));
  border-radius: 8px;
  border: 1px solid rgba(52, 152, 219, 0.1);
  transition: all 0.3s ease;
  animation: feature-slide 0.5s ease-out;
  animation-delay: var(--delay, 0s);
  animation-fill-mode: both;
}

@keyframes feature-slide {
  from {
    opacity: 0;
    transform: translateX(-15px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.feature-item:hover {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(52, 152, 219, 0.05));
  transform: translateX(3px);
  border-color: rgba(52, 152, 219, 0.2);
}

.feature-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.feature-text {
  color: #2c3e50;
  font-weight: 500;
  font-size: 12px;
}

/* Main Area - FULL WIDTH */
.main-area {
  flex: 1;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.2);
  position: relative;
}

.main-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  pointer-events: none;
}

/* Content Transitions */
.content-fade-enter-active, .content-fade-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

.content-fade-leave-to {
  opacity: 0;
  transform: scale(1.05) translateY(-20px);
}

/* Welcome Screen - FULL WIDTH */
.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 40px;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

.welcome-content {
  text-align: center;
  width: 100%;
  max-width: 1200px;
  animation: welcome-fade-in 1s ease-out;
}

@keyframes welcome-fade-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-icon {
  font-size: 6rem;
  margin-bottom: 25px;
  position: relative;
  display: inline-block;
  animation: welcome-icon-float 4s ease-in-out infinite;
}

@keyframes welcome-icon-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
}

.robot-icon .welcome-icon {
  color: #3498db;
}

.elevator-icon .welcome-icon {
  color: #f39c12;
}

.logistics-icon .welcome-icon {
  color: #27ae60;
}

.icon-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring {
  position: absolute;
  border: 2px solid currentColor;
  border-radius: 50%;
  opacity: 0.3;
  animation: ring-pulse 3s ease-in-out infinite;
}

.ring:nth-child(1) {
  width: 100px;
  height: 100px;
  margin: -50px 0 0 -50px;
  animation-delay: 0s;
}

.ring:nth-child(2) {
  width: 140px;
  height: 140px;
  margin: -70px 0 0 -70px;
  animation-delay: 1s;
}

.ring:nth-child(3) {
  width: 180px;
  height: 180px;
  margin: -90px 0 0 -90px;
  animation-delay: 2s;
}

@keyframes ring-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.1;
  }
}

.welcome-title {
  font-size: 2.4rem;
  margin-bottom: 18px;
  color: #2c3e50;
  font-weight: 700;
  position: relative;
  display: inline-block;
}

.title-underline {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 2px;
  animation: underline-expand 1s ease-out 0.5s both;
}

@keyframes underline-expand {
  from { width: 0%; }
  to { width: 80%; }
}

.welcome-description {
  font-size: 1.1rem;
  color: #6c757d;
  margin-bottom: 40px;
  line-height: 1.6;
  animation: description-fade 1s ease-out 0.7s both;
}

@keyframes description-fade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Getting Started - FULL WIDTH */
.getting-started {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 30px;
  border-radius: 16px;
  text-align: left;
  margin-bottom: 35px;
  border: 2px solid rgba(52, 152, 219, 0.1);
  animation: getting-started-slide 1s ease-out 0.9s both;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

@keyframes getting-started-slide {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.steps-title {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: center;
  justify-content: center;
}

.steps-icon {
  font-size: 1.4rem;
}

.steps-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 2px solid rgba(52, 152, 219, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: step-slide 0.6s ease-out;
  animation-delay: var(--delay, 0s);
  animation-fill-mode: both;
}

@keyframes step-slide {
  from {
    opacity: 0;
    transform: translateX(-25px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.step-item:hover {
  transform: translateY(-2px);
  border-color: rgba(52, 152, 219, 0.3);
  box-shadow: 0 4px 16px rgba(52, 152, 219, 0.15);
}

.step-item:hover .step-glow {
  opacity: 1;
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: 0 3px 12px rgba(52, 152, 219, 0.3);
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
  margin-bottom: 4px;
}

.step-description {
  color: #6c757d;
  line-height: 1.5;
  font-size: 0.9rem;
}

.step-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(52, 152, 219, 0.05), transparent);
  animation: step-glow-rotate 4s linear infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

@keyframes step-glow-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Domain Showcase - FULL WIDTH */
.domain-showcase {
  animation: showcase-fade 1s ease-out 1.1s both;
  width: 100%;
}

@keyframes showcase-fade {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.showcase-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 25px;
  text-align: center;
}

.domain-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
  width: 100%;
  max-width: 100%;
}

.domain-card {
  background: linear-gradient(135deg, #fff, #f8f9fa);
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 25px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: card-rise 0.6s ease-out;
  animation-delay: calc(var(--index, 0) * 0.2s);
  animation-fill-mode: both;
  width: 100%;
  box-sizing: border-box;
}

@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.domain-card:hover {
  transform: translateY(-6px) scale(1.05);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.domain-card.active {
  border-color: #3498db;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
}

.domain-card:hover .card-glow {
  opacity: 1;
}

.card-icon {
  font-size: 2.8rem;
  margin-bottom: 15px;
  transition: transform 0.3s ease;
}

.domain-card:hover .card-icon {
  transform: scale(1.2) rotate(10deg);
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
}

.card-description {
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.4;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(52, 152, 219, 0.1), transparent);
  animation: card-glow-rotate 3s linear infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

@keyframes card-glow-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Simulation Container - FULL WIDTH */
.simulation-container {
  height: 100%;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* Custom Scrollbar */
.sidebar::-webkit-scrollbar {
  width: 5px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(241, 243, 244, 0.5);
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #bdc3c7, #95a5a6);
  border-radius: 3px;
  border: 1px solid rgba(255,255,255,0.3);
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
}

/* Responsive Design - FULL WIDTH MAINTAINED */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .sidebar {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .navigation {
    justify-content: center;
  }
  
  .steps-list {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
  
  .domain-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 16px;
  }
  
  .main-title {
    font-size: 1.4rem;
  }
  
  .title-icon {
    font-size: 1.6rem;
  }
  
  .navigation {
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  
  .nav-btn {
    width: 180px;
    justify-content: center;
  }
  
  .main-content {
    padding: 12px;
  }
  
  .sidebar {
    padding: 16px;
  }
  
  .welcome-screen {
    padding: 25px 16px;
  }
  
  .welcome-icon {
    font-size: 4.5rem;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .welcome-description {
    font-size: 1rem;
  }
  
  .steps-list {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .domain-cards {
    grid-template-columns: 1fr;
  }
  
  .step-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .step-number {
    align-self: center;
  }
  
  .getting-started {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.2rem;
    flex-direction: column;
    gap: 8px;
  }
  
  .title-icon {
    font-size: 1.4rem;
  }
  
  .nav-btn {
    width: 100%;
    padding: 10px 16px;
  }
  
  .upload-zone {
    padding: 16px;
    min-height: 70px;
  }
  
  .upload-icon {
    font-size: 2rem;
  }
  
  .upload-text {
    font-size: 12px;
  }
  
  .welcome-icon {
    font-size: 3.5rem;
  }
  
  .welcome-title {
    font-size: 1.6rem;
  }
  
  .getting-started {
    padding: 16px;
  }
  
  .section-title {
    font-size: 0.95rem;
  }
  
  .domain-icon {
    font-size: 1.8rem;
  }
  
  .start-btn {
    padding: 12px 16px;
    font-size: 0.9rem;
  }
  
  .welcome-content {
    max-width: 100%;
  }
  
  .steps-title {
    font-size: 1.1rem;
  }
  
  .showcase-title {
    font-size: 1.1rem;
  }
}

/* Focus States for Accessibility */
.nav-btn:focus,
.start-btn:focus,
.upload-zone:focus,
.pddl-type-dropdown:focus {
  outline: 3px solid rgba(52, 152, 219, 0.5);
  outline-offset: 2px;
}

.domain-card:focus {
  outline: 2px solid rgba(52, 152, 219, 0.5);
  outline-offset: 2px;
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  .nav-btn,
  .start-btn,
  .domain-card,
  .pddl-type-dropdown {
    border-width: 3px;
  }
  
  .upload-zone {
    border-width: 4px;
  }
  
  .particle {
    display: none;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>