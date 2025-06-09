<template>
  <div class="elevator-simulator">
    <!-- Success Message -->
    <transition name="success-popup">
      <div v-if="showSuccess" class="success-message">
        🎉 {{ successMessage }}
        <!-- Moving Passenger Animation - SMOOTH -->
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
            <span class="avatar-emoji">👤</span>
          </div>
          <div class="passenger-name">{{ movingPassenger.name }}</div>
          <div class="movement-indicator">
            <span v-if="movingPassenger.animationState === 'boarding'">➡️</span>
            <span v-else-if="movingPassenger.animationState === 'exiting'">⬅️</span>
          </div>
        </div>
      </transition>
    </div>
    </transition>

    <!-- Header -->
    <div class="header">
      <h3 class="title">
        <span class="title-icon">🛗</span>
        <span>Elevator Simulation</span>
        <span class="pddl-badge" :class="pddlType">{{ getPDDLTypeName(pddlType) }}</span>
      </h3>
      <div class="controls">
        <button @click="play" :disabled="isPlaying" class="btn play-btn">
          {{ isPlaying ? '⏸️ Playing...' : '▶️ Play' }}
        </button>
        <button @click="pause" :disabled="!isPlaying" class="btn pause-btn">⏸️ Pause</button>
        <button @click="reset" class="btn reset-btn">🔄 Reset</button>
        <div class="speed-control">
          <label>Speed:</label>
          <input type="range" v-model="speed" min="0.5" max="3" step="0.1" class="speed-slider">
          <span class="speed-display">{{speed}}x</span>
        </div>
      </div>
    </div>

    <!-- Debug Panel - Show duration only when relevant -->
    <div class="debug">
      <div class="debug-item">
        <span class="debug-label">🛗 Position:</span>
        <span class="debug-value">{{ elevatorPosition }} ({{ currentFloorName }})</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">📋 PDDL Type:</span>
        <span class="debug-value">{{ getPDDLTypeDescription(pddlType) }}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">👥 Passengers:</span>
        <span class="debug-value">{{ passengers.length ? passengers.map(p => `${p.name}:${p.state}`).join(', ') : 'None' }}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">🎬 Step:</span>
        <span class="debug-value">{{ currentStep + 1 }} / {{ actions.length }}</span>
      </div>
      <!-- Only show duration for PDDL types that support it -->
      <div class="debug-item" v-if="showDurationInfo && currentActionDuration">
        <span class="debug-label">⏱️ Duration:</span>
        <span class="debug-value">{{ (currentActionDuration / 1000).toFixed(1) }}s</span>
      </div>
    </div>

    <!-- Building -->
    <div class="building" v-if="floorLabels.length > 0">
      <!-- Floors -->
      <div 
        v-for="(floorLabel, index) in floorLabels" 
        :key="floorLabel"
        class="floor"
        :class="{ 
          active: currentFloorName === floorLabel,
          'current-floor': currentFloorName === floorLabel
        }"
        :style="{ bottom: index * 150 + 'px' }"
      >
        <div class="floor-label">
          <span class="floor-number">{{ floorLabel }}</span>
          <div v-if="currentFloorName === floorLabel" class="current-floor-marker">🛗</div>
        </div>
        
        <!-- Passengers waiting on floor -->
        <div class="waiting-passengers">
          <div 
            v-for="passenger in getPassengersAtFloor(getPositionForFloor(index))" 
            :key="passenger.id"
            class="passenger-waiting"
            :class="{ 'passenger-excited': passenger.state === 'delivered' }"
          >
            <div class="passenger-avatar">
              <span class="avatar-emoji">👤</span>
            </div>
            <div class="passenger-name">{{ passenger.name }}</div>
            <div v-if="passenger.state === 'delivered'" class="delivery-badge">✅</div>
          </div>
        </div>
      </div>

      <!-- Elevator Shaft -->
      <div class="elevator-shaft">
        <!-- Elevator Car -->
        <div 
          class="elevator-car"
          :class="{ 
            moving: isMoving,
            'doors-open': doorsOpen
          }"
          :style="{ 
            bottom: elevatorVisualPosition + 'px',
            transition: isMoving ? `bottom ${2/speed}s ease-in-out` : 'none'
          }"
        >
          <!-- Elevator Interior -->
          <div class="elevator-interior">
            <!-- Floor Display -->
            <div class="floor-display">
              <div class="display-screen">{{ currentFloorName }}</div>
            </div>
            
            <!-- Direction Arrow -->
            <div class="direction" v-if="direction">
              <span class="direction-arrow">{{ direction === 'up' ? '⬆️' : '⬇️' }}</span>
            </div>
            
            <!-- Passengers inside elevator -->
            <div class="inside-passengers">
              <div 
                v-for="passenger in getRidingPassengers()" 
                :key="passenger.id"
                class="passenger-inside"
              >
                <div class="passenger-avatar">
                  <span class="avatar-emoji">👤</span>
                </div>
                <div class="passenger-name">{{ passenger.name }}</div>
              </div>
            </div>
          </div>
          
          <!-- Elevator Doors -->
          <div class="doors">
            <div class="door door-left" :class="{ open: doorsOpen }"></div>
            <div class="door door-right" :class="{ open: doorsOpen }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Timeline -->
    <div class="timeline">
      <h4 class="timeline-title">
        <span>📋 Actions Timeline</span>
        <div class="timeline-progress" :style="{ width: actions.length ? (currentStep / actions.length) * 100 + '%' : '0%' }"></div>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElevatorSimulator',
  props: {
    actions: { 
      type: Array, 
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
  data() {
    return {
      // Simulation state
      isPlaying: false,
      currentStep: 0,
      speed: 1,
      
      // Elevator state - SIMPLE
      elevatorPosition: 0,        // Integer position (0, +1, -1, +2, etc.)
      isMoving: false,
      direction: null,
      doorsOpen: false,
      
      // Floor system - SIMPLE  
      minPosition: 0,            // Lowest position needed
      maxPosition: 0,            // Highest position needed
      floorLabels: [],           // Visual floor names ["Floor1", "Floor2", etc.]
      
      // Passengers - SIMPLE
      passengers: [],
      
      // Animation - SMOOTH
      movingPassenger: null,     // Passenger currently boarding/exiting
      animationQueue: [],        // Queue for smooth animations
      
      // PDDL Type Support
      currentActionDuration: 1000, // Duration for current action in ms
      
      // Animation
      showSuccess: false,
      successMessage: '',
      
      // Timer
      timer: null
    }
  },
  computed: {
    currentFloorName() {
      // Convert position to floor name
      const floorIndex = this.elevatorPosition - this.minPosition;
      return this.floorLabels[floorIndex] || 'Floor?';
    },
    
    elevatorVisualPosition() {
      // Convert position to visual position (pixels from bottom)
      const floorIndex = this.elevatorPosition - this.minPosition;
      return floorIndex * 150 + 20;
    },

    // Only show duration info for PDDL types that have timing concepts
    showDurationInfo() {
      return this.pddlType === 'temporal' || this.pddlType === 'pddl_plus' || this.pddlType === 'numerical';
    },

    // Smooth passenger animation styles
    movingPassengerStyle() {
      if (!this.movingPassenger) return { display: 'none' };
      
      const floorIndex = this.elevatorPosition - this.minPosition;
      const baseY = floorIndex * 150 + 70; // Centered with elevator
      
      if (this.movingPassenger.animationState === 'boarding') {
        return {
          position: 'absolute',
          left: '200px', // Start outside elevator
          bottom: baseY + 'px',
          transform: 'translateX(150px)', // Move into elevator (smooth)
          transition: 'transform 2.5s cubic-bezier(0.4, 0.0, 0.2, 1)', // Smooth easing
          zIndex: 100,
          opacity: 1
        };
      } else if (this.movingPassenger.animationState === 'exiting') {
        return {
          position: 'absolute', 
          left: '350px', // Start inside elevator
          bottom: baseY + 'px',
          transform: 'translateX(200px)', // Move out of elevator (smooth)
          transition: 'transform 2.5s cubic-bezier(0.4, 0.0, 0.2, 1)', // Smooth easing
          zIndex: 100,
          opacity: 1
        };
      }
      
      return { display: 'none' };
    }
  },
  watch: {
    actions: {
      handler: 'initialize',
      immediate: true,
      deep: true
    },
    entities: {
      handler: 'initialize', 
      immediate: true,
      deep: true
    },
    pddlType: {
      handler: 'initialize',
      immediate: true
    }
  },
  mounted() {
    this.initialize();
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
  },
  methods: {
    getPDDLTypeName(type) {
      const types = {
        classical: 'Classical',
        temporal: 'Temporal', 
        numerical: 'Numerical',
        pddl_plus: 'PDDL+'
      }
      return types[type] || 'Unknown'
    },

    getPDDLTypeDescription(type) {
      const descriptions = {
        classical: '🎯 Step-based discrete actions',
        temporal: '⏱️ Time-based durative actions',
        numerical: '🔢 Cost-optimized with resources',
        pddl_plus: '🌐 Hybrid discrete/continuous'
      }
      return descriptions[type] || 'Unknown PDDL type'
    },

    initialize() {
      console.log('🛗 Initializing elevator...');
      console.log('📋 Actions received:', this.actions?.length || 0);
      console.log('📦 Entities received:', this.entities);
      console.log('🔧 PDDL Type:', this.pddlType);
      
      // Reset all state first
      this.resetSimulationState();
      
      if (!this.actions || this.actions.length === 0) {
        this.setupDefaults();
        return;
      }
      
      // Step 1: Calculate position range from actions DYNAMICALLY
      this.calculatePositionRange();
      
      // Step 2: Create floor labels DYNAMICALLY
      this.createFloorLabels();
      
      // Step 3: Create passengers DYNAMICALLY
      this.createPassengers();
      
      // Step 4: Set initial state
      this.elevatorPosition = 0; // Start at position 0
      this.currentStep = 0;
      this.isPlaying = false;
      
      console.log('🛗 Dynamic initialization complete:', {
        positionRange: `${this.minPosition} to ${this.maxPosition}`,
        floorCount: this.floorLabels.length,
        floors: this.floorLabels.join(', '),
        passengerCount: this.passengers.length,
        passengers: this.passengers.map(p => `${p.name}@${p.position}`).join(', '),
        startPosition: this.elevatorPosition,
        startFloor: this.currentFloorName,
        pddlType: this.pddlType
      });
    },

    resetSimulationState() {
      // Complete reset of all simulation state
      this.elevatorPosition = 0;
      this.isMoving = false;
      this.direction = null;
      this.doorsOpen = false;
      this.currentStep = 0;
      this.isPlaying = false;
      this.movingPassenger = null;
      this.animationQueue = [];
      this.currentActionDuration = 1000;
      this.showSuccess = false;
      this.successMessage = '';
      
      // Clear arrays
      this.floorLabels = [];
      this.passengers = [];
      
      // Clear timers
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      
      console.log('🔄 Simulation state reset');
    },

    calculatePositionRange() {
      let pos = 0;
      let min = 0, max = 0;
      
      console.log('📐 Calculating position range from actions...');
      
      // Simulate all movements to find range DYNAMICALLY
      this.actions.forEach((action, index) => {
        if (action.type === 'move-up') {
          pos++;
          max = Math.max(max, pos);
          console.log(`  Action ${index}: move-up → position ${pos} (max now ${max})`);
        } else if (action.type === 'move-down') {
          pos--;
          min = Math.min(min, pos);
          console.log(`  Action ${index}: move-down → position ${pos} (min now ${min})`);
        }
      });
      
      this.minPosition = min;
      this.maxPosition = max;
      
      console.log(`📐 Dynamic position range calculated: ${min} to ${max} (${max - min + 1} floors needed)`);
    },

    createFloorLabels() {
      const floorCount = this.maxPosition - this.minPosition + 1;
      this.floorLabels = [];
      
      console.log(`🏢 Creating ${floorCount} floors dynamically...`);
      
      for (let i = 0; i < floorCount; i++) {
        this.floorLabels.push(`Floor${i + 1}`);
      }
      
      console.log(`🏢 Dynamic floors created: ${this.floorLabels.join(', ')}`);
    },

    createPassengers() {
      this.passengers = [];
      const passengerNames = new Set();
      
      console.log('👥 Extracting passengers dynamically from actions...');
      
      // Extract passenger names from actions DYNAMICALLY
      this.actions.forEach((action, index) => {
        if ((action.type === 'load' || action.type === 'unload') && action.params && action.params[0]) {
          passengerNames.add(action.params[0]);
          console.log(`  Action ${index}: Found passenger ${action.params[0]} in ${action.type} action`);
        }
      });
      
      // Create passenger objects DYNAMICALLY
      let id = 1;
      passengerNames.forEach(name => {
        const passenger = {
          id: id++,
          name: name,
          position: this.getPassengerInitialPosition(name),
          state: 'waiting' // waiting, riding, delivered
        };
        
        this.passengers.push(passenger);
        console.log(`👥 Dynamic passenger created: ${name} starts at position ${passenger.position}`);
      });
      
      console.log(`👥 Dynamic passenger creation complete: ${this.passengers.length} passengers`);
    },

    getPassengerInitialPosition(passengerName) {
      // Find when this passenger is loaded DYNAMICALLY
      const loadAction = this.actions.find(a => 
        a.type === 'load' && a.params && a.params[0] === passengerName
      );
      
      if (!loadAction) {
        console.log(`⚠️ No load action found for ${passengerName}, defaulting to position 0`);
        return 0;
      }
      
      // Calculate elevator position when loading happens DYNAMICALLY
      const loadIndex = this.actions.indexOf(loadAction);
      let pos = 0;
      
      console.log(`📍 Calculating initial position for ${passengerName} (loads at action ${loadIndex}):`);
      
      for (let i = 0; i < loadIndex; i++) {
        const action = this.actions[i];
        if (action.type === 'move-up') {
          pos++;
          console.log(`    Action ${i}: move-up → position ${pos}`);
        } else if (action.type === 'move-down') {
          pos--;
          console.log(`    Action ${i}: move-down → position ${pos}`);
        }
      }
      
      console.log(`📍 ${passengerName} will wait at position ${pos}`);
      return pos;
    },

    setupDefaults() {
      this.minPosition = 0;
      this.maxPosition = 2;
      this.floorLabels = ['Floor1', 'Floor2', 'Floor3'];
      this.passengers = [];
      this.elevatorPosition = 0;
    },

    // Simulation controls
    play() {
      if (this.currentStep >= this.actions.length) return;
      
      this.isPlaying = true;
      
      // Sequential execution - wait for each action to complete
      this.executeActionSequentially();
    },

    executeActionSequentially() {
      if (!this.isPlaying || this.currentStep >= this.actions.length) {
        if (this.currentStep >= this.actions.length) {
          this.pause();
          this.showSuccessMessage('All actions completed!');
        }
        return;
      }
      
      const action = this.actions[this.currentStep];
      const actionDuration = this.getActionDuration(action);
      
      // Execute current action
      this.executeNextAction();
      
      // Wait for action to complete, then execute next
      setTimeout(() => {
        if (this.isPlaying) {
          this.executeActionSequentially(); // Continue to next action
        }
      }, actionDuration / this.speed);
    },

    getActionDuration(action) {
      // Extract duration based on PDDL type with full support
      switch (this.pddlType) {
        case 'temporal': {
          // TEMPORAL PDDL: Actions have explicit durations
          if (action.duration !== undefined) {
            console.log(`⏱️ Temporal: Using action duration ${action.duration}s`);
            return action.duration * 1000; // Convert to milliseconds
          }
          if (action.end !== undefined && action.start !== undefined) {
            const duration = action.end - action.start;
            console.log(`⏱️ Temporal: Calculated duration ${duration}s from start/end`);
            return duration * 1000;
          }
          // Default durations for temporal PDDL
          return this.getDefaultDuration(action.type);
        }
          
        case 'pddl_plus': {
          // PDDL+: Hybrid continuous/discrete with processes and events
          if (action.duration !== undefined) {
            console.log(`🌐 PDDL+: Using action duration ${action.duration}s`);
            return action.duration * 1000;
          }
          if (action.end !== undefined && action.start !== undefined) {
            const duration = action.end - action.start;
            console.log(`🌐 PDDL+: Calculated duration ${duration}s`);
            return duration * 1000;
          }
          // PDDL+ may have continuous processes - use longer defaults
          return this.getDefaultDuration(action.type) * 1.5; // 50% longer for continuous aspects
        }
          
        case 'numerical': {
          // NUMERICAL PDDL: Duration based on costs/resources
          if (action.cost !== undefined) {
            // Scale cost to time (higher cost = longer duration)
            const duration = Math.max(1000, action.cost * 300); // 300ms per cost unit
            console.log(`🔢 Numerical: Duration ${duration}ms from cost ${action.cost}`);
            return duration;
          }
          if (action.fuel !== undefined) {
            // Alternative: fuel consumption affects duration
            const duration = Math.max(1000, action.fuel * 250);
            console.log(`🔢 Numerical: Duration ${duration}ms from fuel ${action.fuel}`);
            return duration;
          }
          if (action.energy !== undefined) {
            // Alternative: energy consumption affects duration
            const duration = Math.max(1000, action.energy * 200);
            console.log(`🔢 Numerical: Duration ${duration}ms from energy ${action.energy}`);
            return duration;
          }
          // Default for numerical
          return this.getDefaultDuration(action.type);
        }
          
        case 'classical':
        default: {
          // CLASSICAL PDDL: Fixed step-based durations
          const duration = this.getDefaultDuration(action.type);
          console.log(`🎯 Classical: Using fixed duration ${duration}ms`);
          return duration;
        }
      }
    },

    getDefaultDuration(actionType) {
      // Base durations for different action types
      const baseDurations = {
        'move-up': 3000,     // 3 seconds for movement
        'move-down': 3000,   // 3 seconds for movement  
        'load': 5000,        // 5 seconds for boarding (doors + entering)
        'unload': 5000,      // 5 seconds for exiting (doors + leaving)
        'reached': 500       // 0.5 seconds for completion
      };
      
      // PDDL type modifiers
      const typeModifiers = {
        'classical': 1.0,    // Standard duration
        'temporal': 1.2,     // 20% longer (more realistic timing)
        'numerical': 0.8,    // 20% shorter (optimized for cost)
        'pddl_plus': 1.5     // 50% longer (continuous processes)
      };
      
      const baseDuration = baseDurations[actionType] || 2000;
      const modifier = typeModifiers[this.pddlType] || 1.0;
      
      return baseDuration * modifier;
    },
    
    pause() {
      this.isPlaying = false;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    
    reset() {
      this.pause();
      this.initialize();
    },

    executeNextAction() {
      if (this.currentStep >= this.actions.length) {
        this.pause();
        this.showSuccessMessage('All actions completed!');
        return;
      }
      
      const action = this.actions[this.currentStep];
      console.log(`🛗 Executing: ${action.type} [${action.params?.join(', ') || ''}]`);
      
      // Get duration from action based on PDDL type
      this.currentActionDuration = this.getActionDuration(action);
      
      // Execute action with proper sequencing
      switch (action.type) {
        case 'move-up':
          this.executeMovementSequence('up');
          break;
        case 'move-down':
          this.executeMovementSequence('down');
          break;
        case 'load':
          this.executeLoadSequence(action.params?.[0]);
          break;
        case 'unload':
          this.executeUnloadSequence(action.params?.[0]);
          break;
      }
      
      this.currentStep++;
    },

    // PROPER ELEVATOR SEQUENCES

    executeMovementSequence(direction) {
      // Step 1: Start movement
      if (direction === 'up' && this.elevatorPosition < this.maxPosition) {
        console.log(`🛗 Moving up: ${this.elevatorPosition} → ${this.elevatorPosition + 1}`);
        this.elevatorPosition++;
      } else if (direction === 'down' && this.elevatorPosition > this.minPosition) {
        console.log(`🛗 Moving down: ${this.elevatorPosition} → ${this.elevatorPosition - 1}`);
        this.elevatorPosition--;
      } else {
        return; // Invalid movement
      }
      
      this.direction = direction;
      this.isMoving = true;
      
      // Update riding passengers
      this.passengers.forEach(p => {
        if (p.state === 'riding') {
          p.position = this.elevatorPosition;
        }
      });
      
      // Step 2: Complete movement after duration
      const moveDuration = this.currentActionDuration / this.speed;
      setTimeout(() => {
        this.isMoving = false;
        this.direction = null;
        console.log(`🛗 Movement completed. Now at position ${this.elevatorPosition} (${this.currentFloorName})`);
      }, moveDuration);
    },

    executeLoadSequence(passengerName) {
      const passenger = this.passengers.find(p => p.name === passengerName);
      if (!passenger) return;
      
      console.log(`🛗 Load sequence for ${passengerName} at ${this.currentFloorName}`);
      
      // REAL ELEVATOR SEQUENCE:
      // 1. Elevator arrives (already done by previous move)
      // 2. Doors open
      // 3. Passenger enters  
      // 4. Doors close
      
      const totalDuration = this.currentActionDuration / this.speed;
      const phase1 = totalDuration * 0.2; // 20% for doors opening
      const phase2 = totalDuration * 0.6; // 60% for passenger entering
      const phase3 = totalDuration * 0.2; // 20% for doors closing
      
      // Phase 1: Doors open
      this.doorsOpen = true;
      console.log(`🛗 Doors opening...`);
      
      setTimeout(() => {
        // Phase 2: Passenger starts entering
        console.log(`🛗 ${passengerName} entering elevator...`);
        passenger.animationState = 'boarding';
        this.movingPassenger = passenger;
        
        setTimeout(() => {
          // Phase 2 complete: Passenger fully inside
          passenger.state = 'riding';
          passenger.position = this.elevatorPosition;
          this.movingPassenger = null;
          console.log(`🛗 ${passengerName} boarded successfully`);
          
          setTimeout(() => {
            // Phase 3: Doors close
            this.doorsOpen = false;
            console.log(`🛗 Doors closing, ready to move`);
          }, phase3);
          
        }, phase2);
        
      }, phase1);
    },

    executeUnloadSequence(passengerName) {
      const passenger = this.passengers.find(p => p.name === passengerName);
      if (!passenger) return;
      
      console.log(`🛗 Unload sequence for ${passengerName} at ${this.currentFloorName}`);
      
      // REAL ELEVATOR SEQUENCE:
      // 1. Elevator arrives (already done by previous move)
      // 2. Doors open
      // 3. Passenger exits
      // 4. Doors close
      
      const totalDuration = this.currentActionDuration / this.speed;
      const phase1 = totalDuration * 0.2; // 20% for doors opening
      const phase2 = totalDuration * 0.6; // 60% for passenger exiting
      const phase3 = totalDuration * 0.2; // 20% for doors closing
      
      // Phase 1: Doors open
      this.doorsOpen = true;
      console.log(`🛗 Doors opening for exit...`);
      
      setTimeout(() => {
        // Phase 2: Passenger starts exiting
        console.log(`🛗 ${passengerName} exiting elevator...`);
        passenger.animationState = 'exiting';
        this.movingPassenger = passenger;
        
        setTimeout(() => {
          // Phase 2 complete: Passenger fully outside
          passenger.state = 'delivered';
          passenger.position = this.elevatorPosition;
          this.movingPassenger = null;
          
          this.showSuccessMessage(`${passengerName} delivered to ${this.currentFloorName}!`);
          console.log(`🛗 ${passengerName} delivered successfully`);
          
          setTimeout(() => {
            // Phase 3: Doors close
            this.doorsOpen = false;
            console.log(`🛗 Doors closing, ready to move`);
          }, phase3);
          
        }, phase2);
        
      }, phase1);
    },

    // Helper methods
    getPassengersAtFloor(position) {
      return this.passengers.filter(p => 
        p.position === position && (p.state === 'waiting' || p.state === 'delivered')
      );
    },
    
    getRidingPassengers() {
      return this.passengers.filter(p => p.state === 'riding');
    },

    getPositionForFloor(floorIndex) {
      return this.minPosition + floorIndex;
    },
    
    getActionDesc(action) {
      const { type, params } = action;
      let desc = '';
      
      switch (type) {
        case 'move-up':
          desc = `🛗 Elevator moves up`;
          break;
        case 'move-down':
          desc = `🛗 Elevator moves down`;
          break;
        case 'load':
          desc = `👤 ${params?.[0] || '?'} boards elevator`;
          break;
        case 'unload':
          desc = `👤 ${params?.[0] || '?'} exits elevator`;
          break;
        default:
          desc = `${type} ${params?.join(' ') || ''}`;
      }
      
      // Add PDDL type specific information ONLY when the plan contains that information
      switch (this.pddlType) {
        case 'temporal':
          // Only show duration if it exists in the action
          if (action.duration !== undefined) {
            desc += ` ⏱️(${action.duration}s)`;
          } else if (action.start !== undefined && action.end !== undefined) {
            desc += ` ⏱️(${(action.end - action.start).toFixed(1)}s)`;
          }
          // No duration info in plan = no duration display
          break;
          
        case 'pddl_plus':
          // Only show duration if it exists in the action
          if (action.duration !== undefined) {
            desc += ` 🌐(${action.duration}s)`;
          } else if (action.start !== undefined && action.end !== undefined) {
            desc += ` 🌐(${(action.end - action.start).toFixed(1)}s)`;
          }
          // Add process/event info if available
          if (action.process) {
            desc += ` [process: ${action.process}]`;
          }
          if (action.event) {
            desc += ` [event: ${action.event}]`;
          }
          break;
          
        case 'numerical':
          // Only show resource info if it exists in the action
          if (action.cost !== undefined) {
            desc += ` 💰[cost: ${action.cost}]`;
          }
          if (action.fuel !== undefined) {
            desc += ` ⛽[fuel: ${action.fuel}]`;
          }
          if (action.energy !== undefined) {
            desc += ` 🔋[energy: ${action.energy}]`;
          }
          if (action.time !== undefined) {
            desc += ` ⏱️[time: ${action.time}]`;
          }
          break;
          
        case 'classical':
          // Classical PDDL has NO timing or resource info - just the action
          // Don't add anything extra
          break;
          
        default:
          // Unknown PDDL type
          break;
      }
      
      return desc;
    },

    showSuccessMessage(message) {
      this.successMessage = message;
      this.showSuccess = true;
      setTimeout(() => {
        this.showSuccess = false;
      }, 3000);
    }
  }
}
</script>

<style scoped>
@import './ElevatorSimulator.css';
</style>