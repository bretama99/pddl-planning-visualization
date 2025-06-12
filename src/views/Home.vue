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

// File: src/components/visualization/PDDLVisualizer.vue - Script Section Update
// FIXED: Import dynamic parsers and remove hardcoded domain detection

<script>
// Updated PDDLVisualizer.vue script section with integrated debug code and FIXED dynamic imports
import { ref, computed, onMounted, onUnmounted } from 'vue'

// FIXED: Updated imports to use the new organized structure with dynamic functions
import { parseRobotDomain } from '@/utils/robot/robotParser.js'
import { parseElevatorDomain } from '@/utils/elevator/elevatorParser.js'
import { parseLogisticsDomain } from '@/utils/logistics/logisticsParser.js' // FIXED parser
import { calculateTotalDuration } from '@/utils/common/pddlUtils.js'

// FIXED: Import domain-specific types with dynamic capabilities
import { getRobotPDDLTypeConfig } from '@/utils/robot/robotTypes.js'
import { getElevatorPDDLTypeConfig } from '@/utils/elevator/elevatorTypes.js'
import { getLogisticsPDDLTypeConfig } from '@/utils/logistics/logisticsTypes.js' // FIXED types

// FIXED: Import dynamic detection functions
import { detectEntityTypeDynamic, detectVehicleTypeDynamic } from '@/components/visualization/dynamicLogisticsFunctions.js'

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

    // FIXED: Domain-specific parsers mapping - Updated to use new structure
    const domainParsers = {
      robot: parseRobotDomain,
      elevator: parseElevatorDomain,
      logistics: parseLogisticsDomain // FIXED parser
    }

    // FIXED: Domain-specific PDDL type config getters
    const domainPDDLTypeConfigs = {
      robot: getRobotPDDLTypeConfig,
      elevator: getElevatorPDDLTypeConfig,
      logistics: getLogisticsPDDLTypeConfig // FIXED types
    }

    // FIXED: Enhanced domain detection function - completely dynamic
    const detectDomainFromContent = (content) => {
      const contentLower = content.toLowerCase();
      
      // FIXED: Dynamic keyword detection using extensible patterns
      const domainKeywordPatterns = {
        robot: ['robot', 'room', 'pick', 'drop', 'move', 'carry', 'gripper', 'at-robby'],
        elevator: ['elevator', 'floor', 'passenger', 'lift', 'board', 'up', 'down', 'above', 'below'],
        logistics: ['truck', 'airplane', 'package', 'load', 'unload', 'drive', 'fly', 'cargo', 'airport', 'city', 'obj', 'tru', 'apn', 'apt', 'pos', 'cit']
      }
      
      // FIXED: Dynamic entity detection in content
      const detectedEntities = {
        robot: 0,
        elevator: 0,
        logistics: 0
      }
      
      // Count keyword matches
      Object.keys(domainKeywordPatterns).forEach(domain => {
        domainKeywordPatterns[domain].forEach(keyword => {
          const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length
          detectedEntities[domain] += matches
        })
      })
      
      // FIXED: Also detect by entity patterns in the content
      const words = contentLower.split(/\s+/)
      words.forEach(word => {
        const entityType = detectEntityTypeDynamic(word)
        const vehicleType = detectVehicleTypeDynamic(word)
        
        // Boost logistics score for detected logistics entities
        if (['package', 'vehicle', 'airport', 'city'].includes(entityType) ||
            ['truck', 'airplane', 'ship'].includes(vehicleType)) {
          detectedEntities.logistics += 2
        }
        
        // Boost robot score for robot entities
        if (word.includes('robot') || word.includes('room') || word.includes('gripper')) {
          detectedEntities.robot += 2
        }
        
        // Boost elevator score for elevator entities
        if (word.includes('elevator') || word.includes('floor') || word.includes('passenger')) {
          detectedEntities.elevator += 2
        }
      })
            
      // FIXED: Return domain with highest score
      const sortedDomains = Object.entries(detectedEntities)
        .sort(([,a], [,b]) => b - a)
      
      const detectedDomain = sortedDomains[0][0]
      // const confidence = sortedDomains[0][1]      
      return detectedDomain
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

      // FIXED: Add type-specific metrics using domain-specific configs
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
      console.log('🎯 FIXED Selected domain:', domain)
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

    // FIXED: Enhanced processFile with dynamic auto-detection
    const processFile = (file) => {
      isUploading.value = true
      generateParticles('upload', 25)
      
      fileName.value = file.name
      fileSize.value = formatFileSize(file.size)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setTimeout(() => {
          fileContent.value = e.target.result
          
          // FIXED: DYNAMIC AUTO-DETECT DOMAIN
          const detectedDomain = detectDomainFromContent(fileContent.value);
          selectedDomain.value = detectedDomain;
          
          isUploading.value = false
          successMessage.value = `File "${file.name}" loaded successfully! Auto-detected: ${getDomainName(detectedDomain)}`
          generateParticles('success', 30)          
          setTimeout(() => { successMessage.value = '' }, 3000)
        }, 1000)
      }
      reader.readAsText(file)
    }

    // FIXED: Enhanced startVisualization with dynamic parsing and debug logging
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
          // FIXED: Check if content contains logistics keywords dynamically
          const detectedKeywords = []
          const words = fileContent.value.toLowerCase().split(/\s+/)
          words.forEach(word => {
            const entityType = detectEntityTypeDynamic(word)
            const vehicleType = detectVehicleTypeDynamic(word)
            if (entityType !== 'unknown' || vehicleType !== 'vehicle') {
              detectedKeywords.push(`${word}(${entityType}/${vehicleType})`)
            }
          })
          // FIXED: Route to domain-specific parser
          const parser = domainParsers[selectedDomain.value]
          if (!parser) {
            error.value = `No parser found for domain: ${selectedDomain.value}`
            isProcessing.value = false
            return
          }
          
          // FIXED: Parse and log results
          const parseResult = parser(fileContent.value, selectedPDDLType.value)
          
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
          
          setTimeout(() => { successMessage.value = '' }, 3000)
        }, 1500)
        
      } catch (err) {
        error.value = `Error: ${err.message}`
        isProcessing.value = false
      }
    }

    // Lifecycle
    onMounted(() => {
      particleTimer.value = setInterval(updateParticles, 50)
      generateParticles('ambient', 10)
      console.log('🎬 FIXED PDDL Visualizer mounted with dynamic detection and organized structure')
    })

    onUnmounted(() => {
      if (particleTimer.value) {
        clearInterval(particleTimer.value)
      }
      console.log('🛑 FIXED PDDL Visualizer unmounted')
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
@import './home.css'
</style>