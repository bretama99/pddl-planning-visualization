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
    <!-- Success/Error Toast Animations and animations-->
    <transition name="toast-slide">
      <div v-if="error" class="error-toast" @click="error = ''">
        <div class="toast-icon">⚠️</div>
        <span class="toast-message">{{ error }}</span>
        <button class="close-btn">✕</button>
        <div class="toast-progress"></div>
      </div>
    </transition>
<!-- show success message -->
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
          <span class="title-text">PDDL Domain Visualizer</span>
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

    <div class="main-content">
      <!-- Enhanced Sidebar -->
      <div class="sidebar">
        <!-- File Upload Section -->
        <div class="section">
          <h3 class="section-title">
            <span class="section-icon">📁</span>
            <span>Upload Plan File</span>
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
                {{ isUploading ? 'Processing...' : fileName || 'Drop plan file here or click to browse' }}
              </div>
              <div v-if="fileName" class="file-info">
                <div class="file-name">{{ fileName }}</div>
                <div class="file-size">{{ fileSize }}</div>
              </div>
            </div>
            <div class="upload-waves" v-if="isUploading">
              <div class="wave"></div>
              <div class="wave"></div>
              <div class="wave"></div>
            </div>
          </div>
        </div>

        <!-- Domain Selection -->
        <transition name="section-expand">
          <div class="section" v-if="fileName">
            <h3 class="section-title">
              <span class="section-icon">🎯</span>
              <span>Selected Domain</span>
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
                {{ isProcessing ? 'Processing...' : `Start ${getDomainName(selectedDomain)} Visualization` }}
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
              <span>Plan Statistics</span>
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
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
    const selectedDomain = ref('robot')
    const fileName = ref('')
    const fileSize = ref('')
    const selectedType = ref('')
    const simulationActive = ref(false)
    const error = ref('')
    const successMessage = ref('')
    const parsedActions = ref([])
    const parsedEntities = ref({ rooms: [], objects: [], robots: [] })
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
      { icon: '⚡', text: 'Real-time plan visualization' },
      { icon: '🎨', text: 'Interactive domain graphics' },
      { icon: '📊', text: 'Plan statistics and metrics' },
      { icon: '🔄', text: 'Multiple PDDL formats support' },
      { icon: '🎯', text: 'Domain-specific optimizations' },
      { icon: '📱', text: 'Responsive design' }
    ]

    const steps = [
      { title: 'Upload Plan File', description: 'Select your PDDL plan file from your computer' },
      { title: 'Choose Domain', description: 'Select the appropriate domain type (Robot/Elevator/Logistics)' },
      { title: 'Start Visualization', description: 'Click the start button to begin the interactive simulation' },
      { title: 'Enjoy the Show', description: 'Watch your plan execute with beautiful animations' }
    ]

    // Computed
    const canStart = computed(() => fileName.value && selectedType.value && selectedDomain.value)
    const totalDuration = computed(() => 
      parsedActions.value.length > 0 ? Math.max(...parsedActions.value.map(a => a.end)) : 0
    )

    const statsItems = computed(() => {
      // const entities = parsedEntities.value
      const total = getTotalEntities()
      return [
        { 
          icon: '🏢', 
          label: 'Domain', 
          value: getDomainName(selectedDomain.value),
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
          value: totalDuration.value.toFixed(1) + 's',
          percentage: Math.min((totalDuration.value / 300) * 100, 100)
        },
        { 
          icon: '📦', 
          label: 'Entities', 
          value: total,
          percentage: Math.min((total / 20) * 100, 100)
        }
      ]
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

    // Domain helper functions
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
      return (entities.rooms?.length || 0) + (entities.objects?.length || 0) + (entities.robots?.length || 0)
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
      console.log('Selected domain:', domain)
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
        }, 1000) // Simulate processing time
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

          const parseResult = parsePlanFile(fileContent.value)
          
          if (parseResult.actions.length === 0) {
            error.value = 'No valid actions found in plan file. Check console for details.'
            isProcessing.value = false
            return
          }

          parsedActions.value = parseResult.actions
          parsedEntities.value = {
            allEntities: parseResult.allEntities,
            rooms: parseResult.rooms || [],
            objects: parseResult.objects || [],
            robots: parseResult.robots || []
          }
          
          simulationActive.value = true
          isProcessing.value = false
          successMessage.value = `${getDomainName(selectedDomain.value)} visualization started with ${parseResult.actions.length} actions!`
          generateParticles('visualization-start', 40)
          
          console.log('Visualization started:', {
            domain: selectedDomain.value,
            type: selectedType.value,
            actions: parseResult.actions.length
          })
          
          setTimeout(() => { successMessage.value = '' }, 3000)
        }, 1500) // Simulate processing time
        
      } catch (err) {
        console.error('Error starting visualization:', err)
        error.value = `Error: ${err.message}`
        isProcessing.value = false
      }
    }

    // Lifecycle
    onMounted(() => {
      particleTimer.value = setInterval(updateParticles, 50)
      // Generate some initial ambient particles
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
      fileName,
      fileSize,
      selectedType, 
      simulationActive,
      error,
      successMessage,
      parsedActions,
      parsedEntities,
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
      getDomainIcon,
      getDomainName,
      getDomainSubtitle,
      getDomainDescription,
      getTotalEntities,
      getParticleStyle,
      selectDomain,
      handleFileUpload,
      onDragOver,
      onDragLeave,
      onDrop,
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

/* Header */
.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.main-title {
  margin: 0;
  color: #2c3e50;
  font-size: 2.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
}

.title-icon {
  font-size: 2.5rem;
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
  gap: 15px;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 14px 28px;
  border: 2px solid transparent;
  border-radius: 15px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #2c3e50;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
}

.btn-icon {
  font-size: 20px;
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
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.nav-btn.active {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-color: #2980b9;
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
  transform: translateY(-2px);
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

/* Main Content */
.main-content {
  display: flex;
  min-height: calc(100vh - 110px);
  max-width: 100%;
  margin: 0 auto;
  gap: 5px;
  padding: 8px;
}

/* Sidebar */
.sidebar {
  width: 380px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.2);
  position: relative;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  border-radius: 20px;
  pointer-events: none;
}

.section {
  margin-bottom: 35px;
  padding-bottom: 30px;
  border-bottom: 2px solid rgba(241, 243, 244, 0.6);
  position: relative;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.section-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.section-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, #3498db, transparent);
  margin-left: 15px;
  border-radius: 1px;
}

/* Section Transitions */
.section-expand-enter-active, .section-expand-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-expand-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
  max-height: 0;
}

.section-expand-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
  max-height: 0;
}

/* Upload Zone */
.upload-zone {
  border: 3px dashed #bdc3c7;
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #fafbfc, #f8f9fa);
  position: relative;
  overflow: hidden;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-zone::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(52, 152, 219, 0.05), transparent);
  animation: upload-glow 4s linear infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-zone:hover::before {
  opacity: 1;
}

@keyframes upload-glow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.upload-zone:hover {
  border-color: #3498db;
  background: linear-gradient(135deg, #f0f8ff, #e3f2fd);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.2);
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
  gap: 15px;
  position: relative;
  z-index: 1;
}

.upload-icon {
  font-size: 3.5rem;
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
  font-size: 16px;
  text-align: center;
  line-height: 1.4;
}

.file-info {
  margin-top: 10px;
  padding: 10px 15px;
  background: rgba(39, 174, 96, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(39, 174, 96, 0.3);
}

.file-name {
  font-weight: 600;
  color: #27ae60;
  font-size: 14px;
}

.file-size {
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
}

.upload-waves {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  overflow: hidden;
}

.wave {
  position: absolute;
  bottom: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, #f39c12, transparent);
  animation: wave-move 2s ease-in-out infinite;
}

.wave:nth-child(2) { animation-delay: 0.5s; }
.wave:nth-child(3) { animation-delay: 1s; }

@keyframes wave-move {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Domain Display */
.domain-display {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 15px;
  border: 2px solid #dee2e6;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.domain-display::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.domain-display.robot-theme {
  border-color: #3498db;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.domain-display.robot-theme::before {
  background: conic-gradient(from 0deg, transparent, rgba(52, 152, 219, 0.1), transparent);
  animation: theme-glow 3s linear infinite;
}

.domain-display.elevator-theme {
  border-color: #f39c12;
  background: linear-gradient(135deg, #fff3e0, #ffcc80);
}

.domain-display.elevator-theme::before {
  background: conic-gradient(from 0deg, transparent, rgba(243, 156, 18, 0.1), transparent);
  animation: theme-glow 3s linear infinite;
}

.domain-display.logistics-theme {
  border-color: #27ae60;
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
}

.domain-display.logistics-theme::before {
  background: conic-gradient(from 0deg, transparent, rgba(39, 174, 96, 0.1), transparent);
  animation: theme-glow 3s linear infinite;
}

.domain-display:hover::before {
  opacity: 1;
}

@keyframes theme-glow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.domain-icon {
  font-size: 3rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-pulse {
  position: absolute;
  width: 60px;
  height: 60px;
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
  font-size: 1.4rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.domain-subtitle {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

/* Start Button */
.start-btn {
  width: 100%;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  padding: 18px 24px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.start-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.6s;
}

.start-btn:hover:not(:disabled)::before {
  left: 100%;
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

.start-icon {
  font-size: 1.3rem;
  transition: transform 0.3s ease;
}

.start-btn:hover:not(:disabled) .start-icon {
  transform: scale(1.2) rotate(15deg);
}

.start-text {
  position: relative;
  z-index: 1;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.4);
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
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}

.elevator-btn {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.elevator-btn:hover:not(:disabled) {
  box-shadow: 0 8px 25px rgba(243, 156, 18, 0.4);
}

.logistics-btn {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
}

.logistics-btn:hover:not(:disabled) {
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.4);
}

/* Info Grid */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
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
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.info-item:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
}

.label {
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-icon {
  font-size: 1.1rem;
}

.value {
  color: #2c3e50;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 8px;
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

/* Features List */
.features-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05), rgba(52, 152, 219, 0.02));
  border-radius: 10px;
  border: 1px solid rgba(52, 152, 219, 0.1);
  transition: all 0.3s ease;
  animation: feature-slide 0.5s ease-out;
  animation-delay: var(--delay, 0s);
  animation-fill-mode: both;
}

@keyframes feature-slide {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.feature-item:hover {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(52, 152, 219, 0.05));
  transform: translateX(5px);
  border-color: rgba(52, 152, 219, 0.2);
}

.feature-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.feature-text {
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

/* Main Area */
.main-area {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
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

/* Welcome Screen */
.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 50px;
  position: relative;
  z-index: 1;
}

.welcome-content {
  text-align: center;
  max-width: 700px;
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
  font-size: 8rem;
  margin-bottom: 30px;
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
  width: 120px;
  height: 120px;
  margin: -60px 0 0 -60px;
  animation-delay: 0s;
}

.ring:nth-child(2) {
  width: 160px;
  height: 160px;
  margin: -80px 0 0 -80px;
  animation-delay: 1s;
}

.ring:nth-child(3) {
  width: 200px;
  height: 200px;
  margin: -100px 0 0 -100px;
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
  font-size: 2.8rem;
  margin-bottom: 20px;
  color: #2c3e50;
  font-weight: 700;
  position: relative;
  display: inline-block;
}

.title-underline {
  position: absolute;
  bottom: -10px;
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
  font-size: 1.3rem;
  color: #6c757d;
  margin-bottom: 50px;
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

/* Getting Started */
.getting-started {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 35px;
  border-radius: 20px;
  text-align: left;
  margin-bottom: 40px;
  border: 2px solid rgba(52, 152, 219, 0.1);
  animation: getting-started-slide 1s ease-out 0.9s both;
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
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.steps-icon {
  font-size: 1.6rem;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 15px;
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
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.step-item:hover {
  transform: translateY(-3px);
  border-color: rgba(52, 152, 219, 0.3);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.15);
}

.step-item:hover .step-glow {
  opacity: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 5px;
}

.step-description {
  color: #6c757d;
  line-height: 1.5;
  font-size: 0.95rem;
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

/* Domain Showcase */
.domain-showcase {
  animation: showcase-fade 1s ease-out 1.1s both;
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
  font-size: 1.4rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 25px;
  text-align: center;
}

.domain-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.domain-card {
  background: linear-gradient(135deg, #fff, #f8f9fa);
  border: 2px solid #e9ecef;
  border-radius: 15px;
  padding: 25px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: card-rise 0.6s ease-out;
  animation-delay: calc(var(--index, 0) * 0.2s);
  animation-fill-mode: both;
}

@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.domain-card:hover {
  transform: translateY(-8px) scale(1.05);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.domain-card.active {
  border-color: #3498db;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
}

.domain-card:hover .card-glow {
  opacity: 1;
}

.card-icon {
  font-size: 3rem;
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

/* Simulation Container */
.simulation-container {
  height: 100%;
  position: relative;
  z-index: 1;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .sidebar {
    width: 100%;
    max-width: none;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 25px;
  }
  
  .navigation {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 20px;
  }
  
  .main-title {
    font-size: 1.8rem;
  }
  
  .title-icon {
    font-size: 2rem;
  }
  
  .navigation {
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  
  .nav-btn {
    width: 200px;
    justify-content: center;
  }
  
  .main-content {
    padding: 15px;
  }
  
  .sidebar {
    padding: 20px;
  }
  
  .welcome-screen {
    padding: 30px 20px;
  }
  
  .welcome-icon {
    font-size: 6rem;
  }
  
  .welcome-title {
    font-size: 2.2rem;
  }
  
  .welcome-description {
    font-size: 1.1rem;
  }
  
  .domain-cards {
    grid-template-columns: 1fr;
  }
  
  .steps-list {
    gap: 15px;
  }
  
  .step-item {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .step-number {
    align-self: center;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.5rem;
    flex-direction: column;
    gap: 10px;
  }
  
  .title-icon {
    font-size: 1.8rem;
  }
  
  .nav-btn {
    width: 100%;
    padding: 12px 20px;
  }
  
  .upload-zone {
    padding: 20px;
    min-height: 100px;
  }
  
  .upload-icon {
    font-size: 2.5rem;
  }
  
  .upload-text {
    font-size: 14px;
  }
  
  .welcome-icon {
    font-size: 4rem;
  }
  
  .welcome-title {
    font-size: 1.8rem;
  }
  
  .getting-started {
    padding: 25px;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
  
  .domain-icon {
    font-size: 2.5rem;
  }
  
  .start-btn {
    padding: 16px 20px;
    font-size: 1rem;
  }
}

/* Custom Scrollbar */
.sidebar::-webkit-scrollbar {
  width: 8px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(241, 243, 244, 0.5);
  border-radius: 4px;
}

.sidebar::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #bdc3c7, #95a5a6);
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.3);
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
}

/* Loading States */
.loading-pulse {
  animation: loading-pulse 1.5s ease-in-out infinite;
}

@keyframes loading-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Focus States for Accessibility */
.nav-btn:focus,
.start-btn:focus,
.upload-zone:focus {
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
  .domain-card {
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
  .floating-shape,
  .title-icon,
  .welcome-icon,
  .btn-glow,
  .card-glow,
  .step-glow,
  .icon-pulse,
  .ring,
  .particle {
    animation: none !important;
  }
  
  .upload-zone:hover,
  .nav-btn:hover,
  .start-btn:hover,
  .domain-card:hover,
  .step-item:hover {
    transform: none !important;
  }
  
  .transition-all {
    transition: none !important;
  }
}
</style>