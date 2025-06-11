<!-- Enhanced Realistic Logistics Simulator Template -->
<template>
  <div class="enhanced-logistics-simulator realistic-logistics" :data-pddl="pddlType">
    <!-- Success Message -->
    <transition name="success-popup">
      <div v-if="showSuccess" class="success-message realistic-success">
        🎉 Logistics Operations Completed Successfully!
      </div>
    </transition>

    <!-- Enhanced Particle System -->
    <div class="particle-container">
      <div 
        v-for="particle in particles" 
        :key="particle.id"
        class="particle"
        :class="[particle.type, particle.vehicleType]"
        :style="getParticleStyle(particle)"
      ></div>
    </div>

    <!-- Control Panel -->
    <div class="control-panel realistic-control">
      <div class="panel-header">
        <h2 class="panel-title">
          <span class="title-icon">🚚</span>
          Enhanced Realistic Logistics Control Center
          <span class="pddl-type-badge" :class="`pddl-${pddlType || 'classical'}`">{{ (pddlType || 'classical').toUpperCase() }}</span>
        </h2>
      </div>

      <!-- Playback Controls -->
      <div class="playback-controls">
        <button 
          @click="togglePlayback" 
          class="control-btn primary"
          :disabled="!parsedActions?.length"
        >
          <span v-if="isPlaying">⏸️</span>
          <span v-else>▶️</span>
          {{ isPlaying ? 'Pause' : 'Play' }}
        </button>
        
        <button @click="resetSimulation" class="control-btn secondary">
          🔄 Reset
        </button>
        
        <button @click="stepForward" class="control-btn secondary" :disabled="isPlaying">
          ⏭️ Step
        </button>
      </div>

      <!-- Progress Section -->
      <div class="progress-section">
        <div class="progress-info">
          <span class="step-counter">Step {{ currentStep }} of {{ parsedActions?.length || 0 }}</span>
          <span class="duration-info" v-if="totalDuration && totalDuration > 0">
            Duration: {{ totalDuration.toFixed(1) }}s
          </span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Speed Control -->
      <div class="speed-control">
        <label class="speed-label">⏱️ Speed:</label>
        <input 
          v-model="playbackSpeed" 
          type="range" 
          min="0.5" 
          max="3" 
          step="0.5" 
          class="speed-slider"
        >
        <span class="speed-value">{{ playbackSpeed }}x</span>
      </div>

      <!-- Enhanced Current Action Display -->
      <div v-if="currentAction || currentActionDescription" class="current-action-panel">
        <div class="action-header">
          <span class="action-icon">⚡</span>
          <span class="action-name">{{ currentActionDescription || (currentAction?.name || '').toUpperCase() }}</span>
          <span class="action-timing">
            <template v-if="pddlType === 'temporal'">
              Duration: {{ currentAction?.duration?.toFixed(1) || '1.0' }}s
            </template>
            <template v-else-if="pddlType === 'numerical'">
              Cost: {{ currentAction?.cost || 1 }} | {{ currentAction?.duration?.toFixed(1) || '1.0' }}s
            </template>
            <template v-else>
              {{ currentAction?.duration?.toFixed(1) || '1.0' }}s
            </template>
          </span>
        </div>
        
        <div class="action-details">
          <div class="action-description">{{ actionDetails.description || currentAction?.raw || currentAction?.name || '' }}</div>
          
          <!-- Enhanced PDDL-specific information -->
          <div v-if="pddlType === 'temporal'" class="pddl-info temporal-info">
            ⏱️ Temporal Action - Phase: {{ actionPhase }}
          </div>
          <div v-else-if="pddlType === 'numerical'" class="pddl-info numerical-info">
            💰 Cost: {{ currentAction?.cost || 1 }} | 📊 Efficiency: {{ getEfficiencyScore() }}%
          </div>
          
          <div class="action-progress-container">
            <div class="action-progress-bar">
              <div 
                class="action-progress-fill" 
                :style="{ width: `${actionProgress || 0}%` }"
              ></div>
            </div>
            <span class="progress-text">{{ (actionProgress || 0).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Visualization Area -->
    <div class="visualization-area">
      <!-- No Actions Message -->
      <div v-if="!parsedActions?.length" class="no-actions-message">
        <div class="message-icon">🚚</div>
        <h3>No Logistics Actions Found</h3>
        <p>Please check that your plan file contains valid logistics actions like:</p>
        <ul>
          <li><code>load-vehicle obj12 tru1 pos1</code></li>
          <li><code>drive-truck tru1 pos1 apt1 cit1</code></li>
          <li><code>fly-airplane apn1 apt1 apt3</code></li>
          <li><code>unload-vehicle obj12 tru1 apt1</code></li>
        </ul>
      </div>

      <!-- Enhanced Realistic Logistics Network Visualization -->
      <div v-if="parsedActions?.length" class="enhanced-logistics-network">
        <!-- Cities Grid with Enhanced Realistic Visual Design -->
        <div class="enhanced-cities-grid">
          <div 
            v-for="city in getCitiesWithLocations()" 
            :key="city.name"
            class="enhanced-city-container realistic-city"
            :class="{ 
              'active': hasActiveVehicleInCity(city.name),
              'has-moving-vehicle': hasMovingVehicleInCity(city.name)
            }"
          >
            <div class="city-header">
              <h3 class="city-name">🏙️ {{ (city.name || '').toUpperCase() }}</h3>
              <div class="city-status-indicators">
                <div v-if="hasActiveVehicleInCity(city.name)" class="status-indicator active">🔴 Active</div>
                <div v-if="hasMovingVehicleInCity(city.name)" class="status-indicator moving">🟡 Transit</div>
              </div>
            </div>
            
            <!-- Enhanced Realistic Locations in City -->
            <div class="enhanced-locations-grid">
              <div 
                v-for="location in city.locations" 
                :key="location"
                class="enhanced-location-cell realistic-location"
                :class="{ 
                  'airport': location.includes('apt'),
                  'position': location.includes('pos'),
                  'active': getVehiclesInLocation(location).length > 0,
                  'has-moving-vehicle': hasMovingVehicleInLocation(location),
                  'has-loading': getLoadingVehicles().some(v => vehicleLocations[v] === location)
                }"
              >
                <div class="location-header">
                  <h4 class="location-name">
                    {{ location.includes('apt') ? '✈️' : '📍' }} 
                    {{ (location || '').toUpperCase() }}
                  </h4>
                  <div class="location-status">
                    <div v-if="getVehiclesInLocation(location).length > 0" class="vehicle-count">
                      🚛 {{ getVehiclesInLocation(location).length }}
                    </div>
                    <div v-if="getPackagesInLocation(location).length > 0" class="package-count">
                      📦 {{ getPackagesInLocation(location).length }}
                    </div>
                  </div>
                </div>
                
                <!-- Enhanced Ground Packages Display -->
                <div class="enhanced-packages-area">
                  <div class="packages-header" v-if="getPackagesInLocation(location).length > 0">
                    <span class="packages-label">📦 Ground Packages:</span>
                  </div>
                  <div class="packages-grid">
                    <div 
                      v-for="pkg in getPackagesInLocation(location)" 
                      :key="pkg"
                      class="enhanced-package-item"
                      :class="{ 
                        'carried': isPackageCarried(pkg),
                        'transferring': isCargoTransferring(pkg)
                      }"
                    >
                      <div class="package-visual">
                        <span class="package-icon">{{ getPackageIcon(pkg) }}</span>
                        <div class="package-info">
                          <div class="package-name">{{ pkg || '' }}</div>
                          <div class="package-status">
                            <span v-if="isCargoTransferring(pkg)" class="status-transferring">🔄 Moving</span>
                            <span v-else class="status-ready">✅ Ready</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Enhanced Realistic Stationary Vehicles Display -->
                <div class="enhanced-vehicles-area">
                  <div 
                    v-for="vehicle in getVehiclesInLocation(location)" 
                    :key="`${vehicle}-${location}`"
                    v-show="!isVehicleMoving(vehicle)"
                    class="enhanced-vehicle-container realistic-vehicle"
                    :class="{
                      'loading': isVehicleLoading(vehicle),
                      'truck': getVehicleType(vehicle) === 'truck',
                      'airplane': getVehicleType(vehicle) === 'airplane'
                    }"
                  >
                    <!-- Enhanced Realistic Vehicle Visual -->
                    <div class="enhanced-vehicle-figure" 
                         :class="{ 
                           'realistic-truck': getVehicleType(vehicle) === 'truck',
                           'realistic-airplane': getVehicleType(vehicle) === 'airplane',
                           'loading-animation': isVehicleLoading(vehicle)
                         }">
                      
                      <!-- Vehicle Status Indicator -->
                      <div class="vehicle-status-indicator" 
                           :class="`status-${getVehicleStatus(vehicle)}`">
                        {{ getVehicleStatusIcon(vehicle) }} {{ getVehicleStatus(vehicle).toUpperCase() }}
                      </div>
                      
                      <!-- Realistic Vehicle Main Body -->
                      <div class="vehicle-main-body" 
                           :class="{ 
                             'realistic-truck-body': getVehicleType(vehicle) === 'truck',
                             'realistic-airplane-body': getVehicleType(vehicle) === 'airplane',
                             'loading-animation': isVehicleLoading(vehicle)
                           }">
                        
                        <!-- Vehicle Icon with Enhanced Animation -->
                        <div class="vehicle-icon-container">
                          <div class="vehicle-icon-main">{{ getVehicleIcon(vehicle) }}</div>
                          <div v-if="isVehicleLoading(vehicle)" class="loading-spinner">🔄</div>
                        </div>
                        
                        <!-- Enhanced Realistic Activity Lights -->
                        <div class="activity-lights realistic-lights">
                          <div class="activity-light realistic-light" 
                               :class="{ 
                                 'active': isVehicleLoading(vehicle),
                                 'loading': isVehicleLoading(vehicle) && getVehicleLoadingType(vehicle) === 'loading',
                                 'unloading': isVehicleLoading(vehicle) && getVehicleLoadingType(vehicle) === 'unloading'
                               }"></div>
                        </div>
                        
                        <!-- Enhanced Realistic Loading Progress Indicator -->
                        <div v-if="isVehicleLoading(vehicle)" class="loading-progress-indicator realistic-loading">
                          <div class="loading-progress-bar realistic-loading-bar">
                            <div class="loading-progress-fill realistic-loading-fill" 
                                 :style="{ width: `${getVehicleLoadingProgress(vehicle) * 100}%` }"></div>
                          </div>
                          <div class="loading-action-text realistic-loading-text">
                            {{ getVehicleLoadingType(vehicle) === 'loading' ? '📦 Loading Cargo...' : '📤 Unloading Cargo...' }}
                          </div>
                        </div>
                      </div>
                      
                      <!-- Enhanced Realistic Cargo Bay -->
                      <div v-if="getVehicleCarrying(vehicle).length > 0" class="enhanced-cargo-bay realistic-cargo">
                        <div class="cargo-bay-header">
                          <span class="cargo-label">🚛 Cargo Bay:</span>
                          <span class="cargo-count">{{ getVehicleCarrying(vehicle).length }} items</span>
                        </div>
                        <div class="cargo-items-grid realistic-cargo-grid">
                          <div 
                            v-for="(pkg, index) in getVehicleCarrying(vehicle)" 
                            :key="`cargo-${pkg}`"
                            class="enhanced-cargo-item realistic-cargo-item"
                            :style="{ '--item-index': index }"
                          >
                            <span class="cargo-package-icon">{{ getPackageIcon(pkg) }}</span>
                            <span class="cargo-package-name">{{ pkg }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Enhanced Realistic Vehicle Information Panel -->
                    <div class="enhanced-vehicle-info">
                      <div class="vehicle-name-display">{{ (vehicle || '').toUpperCase() }}</div>
                      <div class="vehicle-status-panel">
                        <div v-if="isVehicleLoading(vehicle)" class="status-loading">
                          <span class="status-icon">🔄</span>
                          <span class="status-text">
                            {{ getVehicleLoadingType(vehicle) === 'loading' ? 'Loading Cargo' : 'Unloading Cargo' }}
                          </span>
                          <div class="status-progress">{{ Math.round(getVehicleLoadingProgress(vehicle) * 100) }}%</div>
                        </div>
                        <div v-else-if="getVehicleCarrying(vehicle).length > 0" class="status-carrying">
                          <span class="status-icon">📦</span>
                          <span class="status-text">Carrying {{ getVehicleCarrying(vehicle).length }} packages</span>
                        </div>
                        <div v-else class="status-idle">
                          <span class="status-icon">😴</span>
                          <span class="status-text">{{ getVehicleType(vehicle) === 'airplane' ? 'Grounded' : 'Parked' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Realistic Moving Vehicles Overlay -->
        <div class="enhanced-moving-vehicles-overlay">
          <!-- Moving Vehicles with Ultra-Realistic Animation -->
          <div 
            v-for="vehicle in getMovingVehicles()" 
            :key="`moving-${vehicle}`"
            class="enhanced-moving-vehicle"
            :style="getEnhancedMovingVehicleStyle(vehicle)"
          >
            <div class="enhanced-moving-vehicle-figure realistic-moving" 
                 :class="{ 
                   'realistic-truck-moving': getVehicleType(vehicle) === 'truck',
                   'realistic-airplane-moving': getVehicleType(vehicle) === 'airplane',
                   'carrying-cargo': getVehicleCarrying(vehicle).length > 0
                 }"
                 :style="{ 
                   '--rotation': getVehicleDirection(vehicle) + 'deg',
                   '--altitude': getVehicleAltitude(vehicle) + 'px'
                 }">
              
              <!-- Enhanced Realistic Vehicle Body with Motion Effects -->
              <div class="moving-vehicle-body">
                <div class="vehicle-icon-moving">{{ getVehicleIcon(vehicle) }}</div>
                
                <!-- Realistic Movement Direction Indicator -->
                <div class="movement-direction-indicator">
                  <div class="direction-arrow">{{ getVehicleType(vehicle) === 'airplane' ? '🛫' : '➡️' }}</div>
                </div>
                
                <!-- Enhanced Activity Light for Movement -->
                <div class="movement-activity-light"></div>
              </div>
              
              <!-- Ultra-Realistic Movement Trail -->
              <div class="realistic-movement-trail">
                <div class="trail-line-main" 
                     :class="getVehicleType(vehicle) === 'airplane' ? 'airplane-trail' : 'truck-trail'"></div>
                <div class="trail-particles-enhanced">
                  <div class="trail-particle" v-for="i in 5" :key="i" :style="{ '--delay': i * 0.2 + 's' }"></div>
                </div>
              </div>
              
              <!-- Enhanced Realistic Cargo Display for Moving Vehicle -->
              <div v-if="getVehicleCarrying(vehicle).length > 0" class="moving-cargo-display">
                <div class="moving-cargo-items">
                  <div 
                    v-for="pkg in getVehicleCarrying(vehicle)" 
                    :key="`moving-cargo-${pkg}`"
                    class="moving-cargo-item"
                  >
                    <span class="moving-package-icon">{{ getPackageIcon(pkg) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Enhanced Realistic Movement Progress Display -->
              <div class="enhanced-movement-progress realistic-progress">
                <div class="movement-progress-bar-container realistic-bar">
                  <div class="movement-progress-bar">
                    <div class="movement-progress-fill realistic-fill" 
                         :style="{ width: `${getVehicleMovementProgress(vehicle) * 100}%` }"></div>
                  </div>
                </div>
                <div class="movement-percentage realistic-percentage">{{ Math.round(getVehicleMovementProgress(vehicle) * 100) }}%</div>
              </div>
              
              <!-- Enhanced PDDL-specific movement information with vehicle type -->
              <div class="enhanced-movement-info realistic-info" :class="`movement-${pddlType}`">
                <template v-if="pddlType === 'temporal'">
                  <div class="temporal-movement-data">
                    <div class="movement-duration">⏱️ {{ getCurrentActionForVehicle(vehicle)?.duration?.toFixed(1) || '1.0' }}s</div>
                    <div class="movement-schedule">
                      ETA: {{ getCurrentActionForVehicle(vehicle)?.end?.toFixed(1) || '1.0' }}s
                    </div>
                  </div>
                </template>
                
                <template v-else-if="pddlType === 'numerical'">
                  <div class="numerical-movement-data">
                    <div class="movement-cost">💰 Cost: {{ getCurrentActionForVehicle(vehicle)?.cost || 1 }}</div>
                    <div class="fuel-indicator">
                      ⛽ Fuel: {{ getVehicleFuel(vehicle) }}%
                    </div>
                  </div>
                </template>
                
                <template v-else>
                  <div class="classical-movement-data">
                    <div class="movement-type">{{ getVehicleType(vehicle) === 'airplane' ? '✈️ Flying' : '🚛 Driving' }}</div>
                    <div class="movement-duration">{{ getCurrentActionForVehicle(vehicle)?.duration?.toFixed(1) || '1.0' }}s</div>
                  </div>
                </template>
              </div>
            </div>
            
            <!-- Enhanced Realistic Moving Vehicle Information Panel -->
            <div class="enhanced-moving-vehicle-info realistic-info">
              <div class="moving-vehicle-name realistic-name">{{ (vehicle || '').toUpperCase() }}</div>
              <div class="moving-vehicle-status">
                <div class="route-info realistic-route">
                  <span class="route-from">{{ vehicleStartLocations[vehicle] || 'Unknown' }}</span>
                  <span class="route-arrow realistic-arrow">→</span>
                  <span class="route-to">{{ vehicleTargetLocations[vehicle] || 'Unknown' }}</span>
                </div>
                <div class="movement-type-display realistic-type">
                  {{ getVehicleType(vehicle) === 'airplane' ? '✈️ Air Transport' : '🚛 Ground Transport' }}
                </div>
              </div>
              
              <!-- Enhanced PDDL-specific status information with vehicle details -->
              <div class="enhanced-pddl-status" :class="`status-${pddlType}`">
                <template v-if="pddlType === 'temporal'">
                  <div class="temporal-status-display">
                    <div class="status-line">⏰ {{ getVehicleType(vehicle) === 'airplane' ? 'Flight Schedule' : 'Route Schedule' }}</div>
                    <div class="status-line">📊 Makespan: {{ getTotalMakespan() }}s</div>
                  </div>
                </template>
                
                <template v-else-if="pddlType === 'numerical'">
                  <div class="numerical-status-display">
                    <div class="status-line">📈 Efficiency: {{ getEfficiencyScore() }}%</div>
                    <div class="status-line">💰 Total Cost: {{ totalCost }}</div>
                  </div>
                </template>
                
                <template v-else>
                  <div class="classical-status-display">
                    <div class="status-line">📝 Step {{ currentStep }} of {{ parsedActions?.length || 0 }}</div>
                    <div class="status-line">🚛 Vehicle Type: {{ getVehicleType(vehicle) }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Realistic Cargo Transfer Animations -->
        <div class="enhanced-cargo-transfer-overlay">
          <div 
            v-for="packageId in Object.keys(cargoAnimations)" 
            :key="`transfer-${packageId}`"
            class="enhanced-cargo-transfer realistic-transfer"
            :style="getCargoTransferStyle(packageId)"
            v-show="isCargoTransferring(packageId)"
          >
            <div class="cargo-transfer-visual">
              <div class="transfer-package-icon rotating">{{ getPackageIcon(packageId) }}</div>
              <div class="transfer-animation-rings">
                <div class="transfer-ring"></div>
                <div class="transfer-ring"></div>
                <div class="transfer-ring"></div>
              </div>
              <div class="transfer-trail">
                <div class="transfer-trail-particle" v-for="i in 3" :key="i"></div>
              </div>
            </div>
            <div class="cargo-transfer-info">
              <div class="transfer-package-name">{{ packageId }}</div>
              <div class="transfer-status">🔄 Transferring...</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Statistics Panel -->
    <div class="enhanced-stats-panel">
      <h3 class="stats-title">📊 Enhanced Realistic Logistics Statistics</h3>
      <div class="enhanced-stats-grid">
        <div class="stat-category">
          <h4 class="category-title">📋 Plan Overview</h4>
          <div class="stat-item">
            <span class="stat-label">Total Actions:</span>
            <span class="stat-value">{{ parsedActions?.length || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Completed:</span>
            <span class="stat-value">{{ currentStep }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Progress:</span>
            <span class="stat-value">{{ progressPercentage.toFixed(1) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Current Phase:</span>
            <span class="stat-value">{{ actionPhase || 'Ready' }}</span>
          </div>
        </div>

        <div class="stat-category">
          <h4 class="category-title">🚛 Fleet Status</h4>
          <div class="stat-item">
            <span class="stat-label">Trucks:</span>
            <span class="stat-value">{{ logisticsEntities?.trucks?.length || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Airplanes:</span>
            <span class="stat-value">{{ logisticsEntities?.airplanes?.length || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Active Vehicles:</span>
            <span class="stat-value">{{ activeVehicles.size }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Moving:</span>
            <span class="stat-value">{{ movingVehicles.size }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Loading/Unloading:</span>
            <span class="stat-value">{{ loadingVehicles.size }}</span>
          </div>
        </div>

        <div class="stat-category">
          <h4 class="category-title">📦 Cargo Status</h4>
          <div class="stat-item">
            <span class="stat-label">Total Packages:</span>
            <span class="stat-value">{{ logisticsEntities?.packages?.length || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">In Transit:</span>
            <span class="stat-value">{{ Object.values(vehicleCarrying).flat().length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Transferring:</span>
            <span class="stat-value">{{ cargoTransferring.size }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Ground Packages:</span>
            <span class="stat-value">{{ Object.keys(packageLocations).length }}</span>
          </div>
        </div>

        <div class="stat-category">
          <h4 class="category-title">🌍 Network</h4>
          <div class="stat-item">
            <span class="stat-label">Cities:</span>
            <span class="stat-value">{{ logisticsEntities?.cities?.length || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Locations:</span>
            <span class="stat-value">{{ logisticsEntities?.locations?.length || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Airports:</span>
            <span class="stat-value">{{ logisticsEntities?.airports?.length || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Positions:</span>
            <span class="stat-value">{{ logisticsEntities?.positions?.length || 0 }}</span>
          </div>
        </div>

        <!-- Enhanced PDDL-specific statistics -->
        <div v-if="pddlType === 'temporal' || pddlType === 'numerical'" class="stat-category">
          <h4 class="category-title">⚙️ PDDL Metrics</h4>
          <div v-if="totalDuration && totalDuration > 0" class="stat-item">
            <span class="stat-label">Duration:</span>
            <span class="stat-value">{{ totalDuration.toFixed(1) }}s</span>
          </div>
          <div v-if="totalCost > 0" class="stat-item">
            <span class="stat-label">Total Cost:</span>
            <span class="stat-value">{{ totalCost }}</span>
          </div>
          <div v-if="pddlType === 'numerical'" class="stat-item">
            <span class="stat-label">Efficiency:</span>
            <span class="stat-value">{{ getEfficiencyScore() }}%</span>
          </div>
          <div v-if="pddlType === 'temporal'" class="stat-item">
            <span class="stat-label">Makespan:</span>
            <span class="stat-value">{{ getTotalMakespan() }}s</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Import the enhanced realistic logistics simulator logic
import { createLogisticsSimulator } from './logisticsSimulator.js'

export default {
  name: 'EnhancedRealisticLogisticsSimulator',
  props: {
    actions: {
      type: [Array, String],
      default: () => []
    },
    entities: {
      type: Object,
      default: () => ({})
    },
    pddlType: {
      type: String,
      default: 'classical'
    }
  },
  setup(props) {
    console.log('🚚 Enhanced Realistic LogisticsSimulator setup:', {
      actionsType: typeof props.actions,
      actionsLength: Array.isArray(props.actions) ? props.actions.length : 'string length: ' + (typeof props.actions === 'string' ? props.actions.length : 'unknown'),
      pddlType: props.pddlType,
      entities: props.entities
    })
    
    const simulatorProps = {
      ...props
    }
    
    const simulator = createLogisticsSimulator(simulatorProps)
    
    // Enhanced helper function for particle styling
    const getParticleStyle = (particle) => {
      const baseStyle = {
        left: particle.x + '%',
        top: particle.y + '%',
        width: particle.size + 'px',
        height: particle.size + 'px',
        opacity: particle.life || 1
      }
      
      if (particle.rotation !== undefined) {
        baseStyle.transform = `rotate(${particle.rotation}deg)`
      }
      
      if (particle.velocity !== undefined) {
        baseStyle.animationDuration = `${2 / particle.velocity}s`
      }
      
      return baseStyle
    }
    
    return {
      ...simulator,
      getParticleStyle
    }
  }
}
</script>

<style src="./LogisticsSimulator.css" scoped></style>
