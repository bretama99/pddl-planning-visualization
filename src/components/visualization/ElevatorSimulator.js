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
      
      // Enhanced Multi-Elevator System
      elevators: [],           // Array of elevator objects
      activeElevatorId: 0,     // Currently selected elevator for main view
      
      // Floor system
      minPosition: 0,
      maxPosition: 0,
      floorLabels: [],
      floorHeights: [],        // Physical floor heights for realistic movement
      
      // Enhanced Passenger System
      passengers: [],
      passengerQueue: [],      // Queue of passengers waiting
      
      // Real-world constraints
      elevatorSpecs: {
        maxCapacity: 1000,     // kg
        maxPassengers: 8,      // people
        maxSpeed: 2.5,         // m/s
        acceleration: 1.0,     // m/s²
        doorOpenTime: 3.0,     // seconds
        doorCloseTime: 2.0,    // seconds
        floorHeight: 3.5,      // meters per floor
        emergencyMode: false
      },
      
      // Advanced features
      showCapacityWarning: false,
      showOverloadAlert: false,
      emergencyStop: false,
      maintenanceMode: false,
      energyConsumption: 0,
      totalTrips: 0,
      averageWaitTime: 0,
      
      // Animation and UI
      movingPassenger: null,
      animationQueue: [],
      currentActionDuration: 1000,
      showSuccess: false,
      successMessage: '',
      
      // Performance metrics
      metrics: {
        totalEnergyUsed: 0,
        totalPassengersServed: 0,
        averageJourneyTime: 0,
        peakUsageTime: 0,
        elevatorEfficiency: 100,
        maintenanceAlerts: []
      },
      
      // Smart scheduling
      pendingCalls: [],        // Floor call requests
      elevatorAlgorithm: 'SCAN', // FCFS, SCAN, LOOK, etc.
      
      // Timer
      timer: null,
      
      // Emergency scenarios
      emergencyScenarios: [
        'Fire alarm - All elevators return to ground floor',
        'Power outage - Emergency backup power activated',
        'Overload detected - Passenger evacuation required',
        'Mechanical failure - Maintenance mode activated',
        'Seismic activity - Safety protocols engaged'
      ]
    }
  },
  computed: {
    // Main elevator for primary display
    mainElevator() {
      return this.elevators[this.activeElevatorId] || this.elevators[0] || this.createDefaultElevator();
    },
    
    // Current floor name for main elevator
    currentFloorName() {
      const floorIndex = this.mainElevator.position - this.minPosition;
      return this.floorLabels[floorIndex] || 'Floor?';
    },
    
    // Visual position for main elevator
    elevatorVisualPosition() {
      const floorIndex = this.mainElevator.position - this.minPosition;
      return floorIndex * 150 + 20;
    },
    
    // Capacity utilization percentage
    capacityUtilization() {
      const currentWeight = this.mainElevator.passengers.reduce((total, p) => total + p.weight, 0);
      return Math.round((currentWeight / this.elevatorSpecs.maxCapacity) * 100);
    },
    
    // Passenger count in main elevator
    passengerCount() {
      return this.mainElevator.passengers.length;
    },
    
    // Show duration info for PDDL types that support it
    showDurationInfo() {
      return this.pddlType === 'temporal' || this.pddlType === 'pddl_plus' || this.pddlType === 'numerical';
    },
    
    // Advanced elevator status
    elevatorStatus() {
      if (this.emergencyStop) return 'EMERGENCY';
      if (this.maintenanceMode) return 'MAINTENANCE';
      if (this.mainElevator.isMoving) return 'MOVING';
      if (this.mainElevator.doorsOpen) return 'DOORS OPEN';
      if (this.mainElevator.passengers.length === 0) return 'IDLE';
      return 'OCCUPIED';
    },
    
    // Energy efficiency rating
    energyRating() {
      if (this.metrics.totalEnergyUsed === 0) return 'A+';
      const efficiency = this.metrics.elevatorEfficiency;
      if (efficiency >= 90) return 'A+';
      if (efficiency >= 80) return 'A';
      if (efficiency >= 70) return 'B';
      if (efficiency >= 60) return 'C';
      return 'D';
    },
    
    // Smart passenger animation styles
    movingPassengerStyle() {
      if (!this.movingPassenger) return { display: 'none' };
      
      const floorIndex = this.mainElevator.position - this.minPosition;
      const baseY = floorIndex * 150 + 70;
      
      if (this.movingPassenger.animationState === 'boarding') {
        return {
          position: 'absolute',
          left: '200px',
          bottom: baseY + 'px',
          transform: 'translateX(150px)',
          transition: 'transform 2.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
          zIndex: 100,
          opacity: 1
        };
      } else if (this.movingPassenger.animationState === 'exiting') {
        return {
          position: 'absolute', 
          left: '350px',
          bottom: baseY + 'px',
          transform: 'translateX(200px)',
          transition: 'transform 2.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
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
    },
    // Monitor capacity for safety
    capacityUtilization: {
      handler(newVal) {
        if (newVal > 100) {
          this.showOverloadAlert = true;
          this.triggerEmergencyProtocol('overload');
        } else if (newVal > 85) {
          this.showCapacityWarning = true;
        } else {
          this.showCapacityWarning = false;
          this.showOverloadAlert = false;
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.initialize();
    // Start performance monitoring
    this.startPerformanceMonitoring();
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    // PDDL Type utilities
    getPDDLTypeName(type) {
      const types = {
        classical: 'Classical',
        temporal: 'Temporal', 
        numerical: 'Numerical',
        pddl_plus: 'PDDL+'
      };
      return types[type] || 'Unknown';
    },

    getPDDLTypeDescription(type) {
      const descriptions = {
        classical: '🎯 Step-based discrete actions',
        temporal: '⏱️ Time-based durative actions',
        numerical: '🔢 Cost-optimized with resources',
        pddl_plus: '🌐 Hybrid discrete/continuous'
      };
      return descriptions[type] || 'Unknown PDDL type';
    },

    // Enhanced initialization with multi-elevator support
    initialize() {
      console.log('🛗 Initializing advanced elevator system...');
      console.log('📋 Actions received:', this.actions?.length || 0);
      console.log('📦 Entities received:', this.entities);
      console.log('🔧 PDDL Type:', this.pddlType);
      
      this.resetSimulationState();
      
      if (!this.actions || this.actions.length === 0) {
        this.setupDefaults();
        return;
      }
      
      // Enhanced initialization steps
      this.calculatePositionRange();
      this.createFloorLabels();
      this.detectAndCreateElevators();
      this.createEnhancedPassengers();
      this.setupRealisticConstraints();
      this.initializeSmartScheduling();
      
      this.currentStep = 0;
      this.isPlaying = false;
      
      console.log('🛗 Advanced elevator system initialized:', {
        elevators: this.elevators.length,
        floors: this.floorLabels.length,
        passengers: this.passengers.length,
        algorithm: this.elevatorAlgorithm,
        maxCapacity: this.elevatorSpecs.maxCapacity + 'kg',
        pddlType: this.pddlType
      });
    },

    // Reset all simulation state
    resetSimulationState() {
      this.elevators = [];
      this.passengers = [];
      this.passengerQueue = [];
      this.pendingCalls = [];
      this.floorLabels = [];
      this.floorHeights = [];
      this.currentStep = 0;
      this.isPlaying = false;
      this.emergencyStop = false;
      this.maintenanceMode = false;
      this.movingPassenger = null;
      this.animationQueue = [];
      this.showSuccess = false;
      this.successMessage = '';
      this.energyConsumption = 0;
      this.totalTrips = 0;
      
      // Reset metrics
      this.metrics = {
        totalEnergyUsed: 0,
        totalPassengersServed: 0,
        averageJourneyTime: 0,
        peakUsageTime: 0,
        elevatorEfficiency: 100,
        maintenanceAlerts: []
      };
      
      this.cleanup();
    },

    // Calculate floor range from actions
    calculatePositionRange() {
      let pos = 0;
      let min = 0, max = 0;
      
      console.log('📐 Calculating position range from actions...');
      
      this.actions.forEach((action) => {
        if (action.type === 'move-up') {
          pos++;
          max = Math.max(max, pos);
        } else if (action.type === 'move-down') {
          pos--;
          min = Math.min(min, pos);
        }
      });
      
      this.minPosition = min;
      this.maxPosition = max;
      
      console.log(`📐 Position range: ${min} to ${max} (${max - min + 1} floors)`);
    },

    // Create realistic floor labels and heights
    createFloorLabels() {
      const floorCount = this.maxPosition - this.minPosition + 1;
      this.floorLabels = [];
      this.floorHeights = [];
      
      for (let i = 0; i < floorCount; i++) {
        const floorNum = i + 1;
        this.floorLabels.push(`Floor ${floorNum}`);
        this.floorHeights.push(this.elevatorSpecs.floorHeight * i);
      }
      
      console.log(`🏢 Created ${floorCount} floors:`, this.floorLabels);
    },

    // Detect and create multiple elevators from actions
    detectAndCreateElevators() {
      const elevatorIds = new Set();
      
      // Extract elevator IDs from actions
      this.actions.forEach(action => {
        if ((action.type === 'move-up' || action.type === 'move-down') && action.params[0]) {
          elevatorIds.add(action.params[0]);
        } else if ((action.type === 'load' || action.type === 'unload') && action.params[1]) {
          elevatorIds.add(action.params[1]);
        }
      });
      
      // Create elevator objects
      if (elevatorIds.size === 0) {
        elevatorIds.add('elevator1'); // Default elevator
      }
      
      this.elevators = Array.from(elevatorIds).map((id, index) => 
        this.createElevatorObject(id, index)
      );
      
      console.log(`🛗 Created ${this.elevators.length} elevators:`, 
        this.elevators.map(e => e.id));
    },

    // Create advanced elevator object
    createElevatorObject(id, index) {
      return {
        id: id,
        position: 0,
        isMoving: false,
        direction: null,
        doorsOpen: false,
        passengers: [],
        currentWeight: 0,
        targetFloors: [],
        lastMaintenanceTime: 0,
        totalDistance: 0,
        energyUsed: 0,
        trips: 0,
        status: 'idle',
        emergency: false,
        
        // Physical specifications
        maxCapacity: this.elevatorSpecs.maxCapacity,
        maxPassengers: this.elevatorSpecs.maxPassengers,
        speed: this.elevatorSpecs.maxSpeed,
        
        // Performance metrics
        efficiency: 100,
        lastInspection: Date.now(),
        nextMaintenance: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        
        // Smart features
        preferredFloors: [0], // Ground floor preference
        usage: new Array(24).fill(0), // Hourly usage tracking
        
        // Visual properties
        color: this.getElevatorColor(index),
        theme: this.getElevatorTheme(index)
      };
    },

    // Get elevator color theme
    getElevatorColor(index) {
      const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
      return colors[index % colors.length];
    },

    // Get elevator theme
    getElevatorTheme(index) {
      const themes = ['modern', 'classic', 'futuristic', 'luxury', 'industrial'];
      return themes[index % themes.length];
    },

    // Create default elevator when no actions
    createDefaultElevator() {
      return this.createElevatorObject('elevator1', 0);
    },

    // Create enhanced passengers with realistic attributes
    createEnhancedPassengers() {
      this.passengers = [];
      const passengerNames = new Set();
      
      // Extract passenger names
      this.actions.forEach(action => {
        if ((action.type === 'load' || action.type === 'unload') && action.params[0]) {
          passengerNames.add(action.params[0]);
        }
      });
      
      // Create realistic passenger objects
      let id = 1;
      passengerNames.forEach(name => {
        const passenger = this.createPassengerObject(id++, name);
        this.passengers.push(passenger);
      });
      
      console.log(`👥 Created ${this.passengers.length} enhanced passengers`);
    },

    // Create realistic passenger object
    createPassengerObject(id, name) {
      return {
        id: id,
        name: name,
        position: this.getPassengerInitialPosition(name),
        state: 'waiting',
        
        // Physical attributes
        weight: this.generateRealisticWeight(),
        height: this.generateRealisticHeight(),
        mobility: this.generateMobilityLevel(),
        
        // Journey details
        originFloor: 0,
        destinationFloor: 0,
        arrivalTime: 0,
        waitingTime: 0,
        journeyTime: 0,
        
        // Preferences and behavior
        urgency: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
        accessibilityNeeds: Math.random() > 0.9,
        vipStatus: Math.random() > 0.95,
        
        // Visual representation
        avatar: this.generatePassengerAvatar(),
        color: this.generatePassengerColor(),
        
        // Behavioral attributes
        patience: Math.random() * 100 + 50, // 50-150 seconds
        satisfaction: 100,
        
        // Animation state
        animationState: null
      };
    },

    // Generate realistic passenger weight (40-120 kg)
    generateRealisticWeight() {
      return Math.floor(Math.random() * 80) + 40;
    },

    // Generate realistic height (150-200 cm)
    generateRealisticHeight() {
      return Math.floor(Math.random() * 50) + 150;
    },

    // Generate mobility level
    generateMobilityLevel() {
      const levels = ['normal', 'wheelchair', 'elderly', 'pregnant'];
      return levels[Math.floor(Math.random() * levels.length)];
    },

    // Generate passenger avatar
    generatePassengerAvatar() {
      const avatars = ['👤', '🧑‍💼', '👩‍⚕️', '🧓', '🤰', '♿', '👨‍🎓', '👩‍🔬'];
      return avatars[Math.floor(Math.random() * avatars.length)];
    },

    // Generate passenger color
    generatePassengerColor() {
      const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
      return colors[Math.floor(Math.random() * colors.length)];
    },

    // Get passenger initial position from actions
    getPassengerInitialPosition(passengerName) {
      const loadAction = this.actions.find(a => 
        a.type === 'load' && a.params && a.params[0] === passengerName
      );
      
      if (!loadAction) {
        console.log(`⚠️ No load action found for ${passengerName}`);
        return 0;
      }
      
      const loadIndex = this.actions.indexOf(loadAction);
      let pos = 0;
      
      for (let i = 0; i < loadIndex; i++) {
        const action = this.actions[i];
        if (action.type === 'move-up') {
          pos++;
        } else if (action.type === 'move-down') {
          pos--;
        }
      }
      
      return pos;
    },

    // Setup realistic elevator constraints
    setupRealisticConstraints() {
      // Adjust specs based on number of elevators and building height
      const floorCount = this.floorLabels.length;
      // const elevatorCount = this.elevators.length;
      
      // Scale capacity based on building size
      if (floorCount > 10) {
        this.elevatorSpecs.maxCapacity = 1200; // High-rise building
        this.elevatorSpecs.maxPassengers = 12;
      } else if (floorCount > 5) {
        this.elevatorSpecs.maxCapacity = 1000; // Medium building
        this.elevatorSpecs.maxPassengers = 8;
      } else {
        this.elevatorSpecs.maxCapacity = 800; // Low-rise building
        this.elevatorSpecs.maxPassengers = 6;
      }
      
      // Adjust speed based on building height
      this.elevatorSpecs.maxSpeed = Math.min(3.0, 1.5 + (floorCount * 0.1));
      
      console.log('⚙️ Realistic constraints configured:', {
        maxCapacity: this.elevatorSpecs.maxCapacity + 'kg',
        maxPassengers: this.elevatorSpecs.maxPassengers,
        maxSpeed: this.elevatorSpecs.maxSpeed + 'm/s',
        floorHeight: this.elevatorSpecs.floorHeight + 'm'
      });
    },

    // Initialize smart scheduling algorithm
    initializeSmartScheduling() {
      // Choose algorithm based on building characteristics
      const floorCount = this.floorLabels.length;
      const elevatorCount = this.elevators.length;
      
      if (elevatorCount > 1) {
        this.elevatorAlgorithm = 'DESTINATION_DISPATCH';
      } else if (floorCount > 8) {
        this.elevatorAlgorithm = 'SCAN';
      } else {
        this.elevatorAlgorithm = 'LOOK';
      }
      
      console.log(`🧠 Smart scheduling initialized: ${this.elevatorAlgorithm}`);
    },

    // Default setup
    setupDefaults() {
      this.minPosition = 0;
      this.maxPosition = 2;
      this.floorLabels = ['Floor 1', 'Floor 2', 'Floor 3'];
      this.elevators = [this.createDefaultElevator()];
      this.passengers = [];
    },

    // SIMULATION CONTROLS

    // Start simulation
    play() {
      if (this.currentStep >= this.actions.length) return;
      
      this.isPlaying = true;
      this.executeActionSequentially();
    },

    // Execute actions sequentially with realistic timing
    executeActionSequentially() {
      if (!this.isPlaying || this.currentStep >= this.actions.length) {
        if (this.currentStep >= this.actions.length) {
          this.pause();
          this.showSuccessMessage('🎉 All actions completed! Check system metrics.');
          this.generateFinalReport();
        }
        return;
      }
      
      const action = this.actions[this.currentStep];
      const actionDuration = this.getRealisticActionDuration(action);
      
      this.executeNextAction();
      
      setTimeout(() => {
        if (this.isPlaying) {
          this.executeActionSequentially();
        }
      }, actionDuration / this.speed);
    },

    // Get realistic action duration with advanced calculations
    getRealisticActionDuration(action) {
      const elevator = this.getElevatorFromAction(action);
      
      switch (this.pddlType) {
        case 'temporal':
          if (action.duration !== undefined) {
            return action.duration * 1000;
          }
          return this.calculatePhysicalDuration(action, elevator);
          
        case 'pddl_plus':
          if (action.duration !== undefined) {
            return action.duration * 1000 * 1.2; // More complex processes
          }
          return this.calculatePhysicalDuration(action, elevator) * 1.2;
          
        case 'numerical': {
          const cost = action.cost || this.getDefaultCost(action.type);
          return this.calculatePhysicalDuration(action, elevator) * (cost / 5.0);
        }
          
        default:
          return this.calculatePhysicalDuration(action, elevator);
      }
    },

    // Calculate realistic physical duration
    calculatePhysicalDuration(action, elevator) {
      switch (action.type) {
        case 'move-up':
        case 'move-down': {
          {
            const distance = this.elevatorSpecs.floorHeight;
            const acceleration = this.elevatorSpecs.acceleration;
            const maxSpeed = elevator ? elevator.speed : this.elevatorSpecs.maxSpeed;
            
            // Physics: t = sqrt(2d/a) for acceleration phase
            const accelTime = Math.sqrt(2 * distance / acceleration);
            const accelDistance = 0.5 * acceleration * accelTime * accelTime;
            
            let totalTime;
            if (accelDistance * 2 >= distance) {
              // Never reach max speed
              totalTime = 2 * accelTime;
            } else {
              // Reach max speed
              const constantSpeedDistance = distance - (2 * accelDistance);
              const constantSpeedTime = constantSpeedDistance / maxSpeed;
              totalTime = (2 * accelTime) + constantSpeedTime;
            }
            
            return Math.max(2000, totalTime * 1000); // Minimum 2 seconds
          }
        }
        
        case 'load':
        case 'unload': {
          {
            const passengerCount = this.getPassengerCountFromAction(action);
            const baseTime = this.elevatorSpecs.doorOpenTime + this.elevatorSpecs.doorCloseTime;
            const boardingTime = passengerCount * 1.5; // 1.5 seconds per passenger
            
            return (baseTime + boardingTime) * 1000;
          }
        }
        
        default:
          return 3000;
      }
    },

    // Get elevator from action
    getElevatorFromAction(action) {
      if (action.params && action.params[1]) {
        return this.elevators.find(e => e.id === action.params[1]);
      }
      return this.mainElevator;
    },

    // Get passenger count from action
    getPassengerCountFromAction() {
      // For now, assume 1 passenger per action
      // This could be enhanced to parse multiple passengers
      return 1;
    },

    // Get default cost for numerical PDDL
    getDefaultCost(actionType) {
      switch (actionType) {
        case 'move-up':
        case 'move-down':
          return 5;
        case 'load':
        case 'unload':
          return 2;
        default:
          return 3;
      }
    },

    // Pause simulation
    pause() {
      this.isPlaying = false;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    // Reset simulation
    reset() {
      this.pause();
      this.initialize();
    },

    // ADVANCED ACTION EXECUTION

    // Execute next action with advanced logic
    executeNextAction() {
      if (this.currentStep >= this.actions.length) {
        this.pause();
        this.showSuccessMessage('All actions completed!');
        return;
      }
      
      const action = this.actions[this.currentStep];
      console.log(`🛗 Executing advanced action: ${action.type} [${action.params?.join(', ') || ''}]`);
      
      this.currentActionDuration = this.getRealisticActionDuration(action);
      
      // Enhanced action execution
      switch (action.type) {
        case 'move-up':
          this.executeAdvancedMovement('up', action);
          break;
        case 'move-down':
          this.executeAdvancedMovement('down', action);
          break;
        case 'load':
          this.executeAdvancedLoad(action);
          break;
        case 'unload':
          this.executeAdvancedUnload(action);
          break;
      }
      
      this.currentStep++;
      this.updateSystemMetrics();
    },

    // Advanced movement with physics and constraints
    executeAdvancedMovement(direction, action) {
      const elevator = this.getElevatorFromAction(action) || this.mainElevator;
      
      if (this.emergencyStop) {
        this.showWarning('Movement blocked - Emergency stop active');
        return;
      }
      
      const oldPosition = elevator.position;
      
      if (direction === 'up' && elevator.position < this.maxPosition) {
        elevator.position++;
      } else if (direction === 'down' && elevator.position > this.minPosition) {
        elevator.position--;
      } else {
        this.showWarning('Invalid movement - Floor limit reached');
        return;
      }
      
      // Update elevator state
      elevator.direction = direction;
      elevator.isMoving = true;
      elevator.status = 'moving';
      
      // Calculate energy consumption
      const distance = Math.abs(elevator.position - oldPosition) * this.elevatorSpecs.floorHeight;
      const weight = elevator.currentWeight + 500; // Elevator car weight
      const energyUsed = this.calculateEnergyConsumption(distance, weight, direction);
      
      elevator.energyUsed += energyUsed;
      elevator.totalDistance += distance;
      this.energyConsumption += energyUsed;
      
      // Update passenger positions
      elevator.passengers.forEach(p => {
        p.position = elevator.position;
      });
      
      // Smart scheduling - update calls
      this.updateElevatorCalls(elevator);
      
      const moveDuration = this.currentActionDuration / this.speed;
      setTimeout(() => {
        elevator.isMoving = false;
        elevator.direction = null;
        elevator.status = 'idle';
        
        // Check for maintenance needs
        this.checkMaintenanceRequirements(elevator);
        
        console.log(`🛗 Movement completed: ${elevator.id} now at position ${elevator.position}`);
      }, moveDuration);
    },

    // Calculate realistic energy consumption
    calculateEnergyConsumption(distance, weight, direction) {
      const baseConsumption = 0.05; // kWh per meter per kg
      const directionMultiplier = direction === 'up' ? 1.2 : 0.8; // More energy going up
      return distance * weight * baseConsumption * directionMultiplier;
    },

    // Advanced loading with capacity and safety checks
    executeAdvancedLoad(action) {
      const passengerName = action.params?.[0];
      const elevator = this.getElevatorFromAction(action) || this.mainElevator;
      const passenger = this.passengers.find(p => p.name === passengerName);
      
      if (!passenger) {
        this.showWarning(`Passenger ${passengerName} not found`);
        return;
      }
      
      // Safety checks
      if (!this.performSafetyChecks(elevator, passenger)) {
        return;
      }
      
      console.log(`🛗 Advanced load sequence for ${passengerName}`);
      
      const totalDuration = this.currentActionDuration / this.speed;
      const phase1 = totalDuration * 0.2; // Door opening
      const phase2 = totalDuration * 0.6; // Passenger boarding
      // const phase3 = totalDuration * 0.2; // Door closing
      
      // Phase 1: Open doors with safety checks
      this.openElevatorDoors(elevator);
      
      setTimeout(() => {
        // Phase 2: Passenger boarding with animations
        this.boardPassenger(passenger, elevator);
        
        setTimeout(() => {
          // Phase 3: Close doors and update system
          this.closeElevatorDoors(elevator);
          this.updatePassengerMetrics(passenger, 'boarded');
          
        }, phase2);
        
      }, phase1);
    },

    // Advanced unloading with destination verification
    executeAdvancedUnload(action) {
      const passengerName = action.params?.[0];
      const elevator = this.getElevatorFromAction(action) || this.mainElevator;
      const passenger = this.passengers.find(p => p.name === passengerName);
      
      if (!passenger) {
        this.showWarning(`Passenger ${passengerName} not found`);
        return;
      }
      
      if (passenger.state !== 'riding') {
        this.showWarning(`Passenger ${passengerName} is not in elevator`);
        return;
      }
      
      console.log(`🛗 Advanced unload sequence for ${passengerName}`);
      
      const totalDuration = this.currentActionDuration / this.speed;
      const phase1 = totalDuration * 0.2; // Door opening
      const phase2 = totalDuration * 0.6; // Passenger exiting
      // const phase3 = totalDuration * 0.2; // Door closing
      
      // Phase 1: Open doors
      this.openElevatorDoors(elevator);
      
      setTimeout(() => {
        // Phase 2: Passenger exiting
        this.disembarkPassenger(passenger, elevator);
        
        setTimeout(() => {
          // Phase 3: Close doors and update metrics
          this.closeElevatorDoors(elevator);
          this.updatePassengerMetrics(passenger, 'delivered');
          this.checkDestinationReached(passenger);
          
        }, phase2);
        
      }, phase1);
    },

    // SAFETY AND CAPACITY MANAGEMENT

    // Perform comprehensive safety checks
    performSafetyChecks(elevator, passenger) {
      // Weight capacity check
      const newWeight = elevator.currentWeight + passenger.weight;
      if (newWeight > elevator.maxCapacity) {
        this.triggerOverloadAlert(elevator, passenger);
        return false;
      }
      
      // Passenger count check
      if (elevator.passengers.length >= elevator.maxPassengers) {
        this.showWarning(`Elevator ${elevator.id} at maximum passenger capacity`);
        return false;
      }
      
      // Emergency mode check
      if (elevator.emergency || this.emergencyStop) {
        this.showWarning('Cannot board passengers - Emergency mode active');
        return false;
      }
      
      // Maintenance mode check
      if (this.maintenanceMode) {
        this.showWarning('Cannot board passengers - Maintenance mode active');
        return false;
      }
      
      // Accessibility check
      if (passenger.accessibilityNeeds && !this.checkAccessibilityCompliance(elevator)) {
        this.showWarning('Accessibility requirements not met');
        return false;
      }
      
      return true;
    },

    // Trigger overload alert with detailed information
    triggerOverloadAlert(elevator, passenger) {
      this.showOverloadAlert = true;
      const currentWeight = elevator.currentWeight;
      const passengerWeight = passenger.weight;
      const maxCapacity = elevator.maxCapacity;
      const excess = (currentWeight + passengerWeight) - maxCapacity;
      
      this.showWarning(
        `⚠️ OVERLOAD ALERT: ${elevator.id}\n` +
        `Current: ${currentWeight}kg + Passenger: ${passengerWeight}kg = ${currentWeight + passengerWeight}kg\n` +
        `Exceeds capacity by ${excess}kg (Max: ${maxCapacity}kg)`
      );
      
      // Trigger emergency protocol
      this.triggerEmergencyProtocol('overload');
      
      // Add to maintenance alerts
      this.metrics.maintenanceAlerts.push({
        type: 'overload',
        elevator: elevator.id,
        time: new Date().toISOString(),
        details: `Attempted overload by ${excess}kg`
      });
    },

    // Check accessibility compliance
    checkAccessibilityCompliance() {
      // Simulate accessibility features check
      return Math.random() > 0.1; // 90% compliance rate
    },

    // Open elevator doors with safety protocols
    openElevatorDoors(elevator) {
      if (elevator.isMoving) {
        this.showWarning('Cannot open doors while moving');
        return false;
      }
      
      elevator.doorsOpen = true;
      elevator.status = 'doors_open';
      
      // Door open sensor simulation
      setTimeout(() => {
        if (elevator.doorsOpen) {
          this.checkDoorObstruction(elevator);
        }
      }, 1000);
      
      console.log(`🚪 Doors opened: ${elevator.id}`);
      return true;
    },

    // Close elevator doors with safety checks
    closeElevatorDoors(elevator) {
      // Door safety check
      if (!this.performDoorSafetyCheck(elevator)) {
        setTimeout(() => this.closeElevatorDoors(elevator), 1000);
        return;
      }
      
      elevator.doorsOpen = false;
      elevator.status = 'idle';
      console.log(`🚪 Doors closed: ${elevator.id}`);
    },

    // Check for door obstruction
    checkDoorObstruction(elevator) {
      // Simulate door sensor
      const obstruction = Math.random() < 0.05; // 5% chance of obstruction
      
      if (obstruction) {
        this.showWarning(`Door obstruction detected on ${elevator.id}`);
        // Keep doors open longer
        setTimeout(() => {
          if (elevator.doorsOpen) {
            this.checkDoorObstruction(elevator);
          }
        }, 2000);
      }
    },

    // Perform door safety check
    performDoorSafetyCheck() {
      // Check for passengers still boarding/exiting
      if (this.movingPassenger && this.movingPassenger.animationState) {
        return false;
      }
      
      // Simulate safety sensors
      return Math.random() > 0.02; // 98% success rate
    },

    // PASSENGER MANAGEMENT

    // Board passenger with detailed tracking
    boardPassenger(passenger, elevator) {
      passenger.animationState = 'boarding';
      this.movingPassenger = passenger;
      
      setTimeout(() => {
        // Complete boarding
        passenger.state = 'riding';
        passenger.position = elevator.position;
        passenger.boardingTime = Date.now();
        
        // Add to elevator
        elevator.passengers.push(passenger);
        elevator.currentWeight += passenger.weight;
        
        // Update passenger journey
        passenger.originFloor = elevator.position;
        passenger.waitingTime = passenger.boardingTime - passenger.arrivalTime;
        
        this.movingPassenger = null;
        
        // Update capacity warning
        this.updateCapacityWarning(elevator);
        
        console.log(`👤 ${passenger.name} boarded ${elevator.id} (Weight: ${passenger.weight}kg)`);
      }, 2000);
    },

    // Disembark passenger with journey completion
    disembarkPassenger(passenger, elevator) {
      passenger.animationState = 'exiting';
      this.movingPassenger = passenger;
      
      setTimeout(() => {
        // Complete disembarking
        passenger.state = 'delivered';
        passenger.destinationFloor = elevator.position;
        passenger.journeyTime = Date.now() - passenger.boardingTime;
        
        // Remove from elevator
        const index = elevator.passengers.indexOf(passenger);
        if (index > -1) {
          elevator.passengers.splice(index, 1);
          elevator.currentWeight -= passenger.weight;
        }
        
        // Update trip counter
        elevator.trips++;
        this.totalTrips++;
        
        this.movingPassenger = null;
        
        // Update satisfaction based on journey time
        this.updatePassengerSatisfaction(passenger);
        
        // Show success message
        this.showSuccessMessage(
          `✅ ${passenger.name} delivered to ${this.currentFloorName}! ` +
          `Journey time: ${(passenger.journeyTime / 1000).toFixed(1)}s`
        );
        
        console.log(`👤 ${passenger.name} delivered (Journey: ${passenger.journeyTime}ms)`);
      }, 2000);
    },

    // Update passenger satisfaction based on experience
    updatePassengerSatisfaction(passenger) {
      let satisfaction = 100;
      
      // Deduct for long waiting time
      if (passenger.waitingTime > 30000) { // 30 seconds
        satisfaction -= 20;
      }
      
      // Deduct for long journey time
      if (passenger.journeyTime > 60000) { // 60 seconds
        satisfaction -= 15;
      }
      
      // Bonus for VIP passengers
      if (passenger.vipStatus) {
        satisfaction += 10;
      }
      
      // Bonus for accessibility support
      if (passenger.accessibilityNeeds && satisfaction > 80) {
        satisfaction += 5;
      }
      
      passenger.satisfaction = Math.max(0, Math.min(100, satisfaction));
    },

    // Update capacity warning status
    updateCapacityWarning(elevator) {
      const utilization = (elevator.currentWeight / elevator.maxCapacity) * 100;
      
      if (utilization > 90) {
        this.showCapacityWarning = true;
        this.showWarning(`Capacity warning: ${elevator.id} at ${utilization.toFixed(1)}%`);
      } else {
        this.showCapacityWarning = false;
      }
    },

    // SMART SCHEDULING AND ALGORITHMS

    // Update elevator calls for smart scheduling
    updateElevatorCalls(elevator) {
      // Remove completed calls
      this.pendingCalls = this.pendingCalls.filter(call => 
        call.floor !== elevator.position || call.elevator !== elevator.id
      );
      
      // Add new calls based on passengers
      this.passengers.forEach(passenger => {
        if (passenger.state === 'waiting' && passenger.position !== elevator.position) {
          this.addFloorCall(passenger.position, elevator.id);
        }
      });
    },

    // Add floor call to queue
    addFloorCall(floor, elevatorId) {
      const existingCall = this.pendingCalls.find(call => 
        call.floor === floor && call.elevator === elevatorId
      );
      
      if (!existingCall) {
        this.pendingCalls.push({
          floor: floor,
          elevator: elevatorId,
          timestamp: Date.now(),
          priority: this.calculateCallPriority(floor)
        });
      }
    },

    // Calculate call priority for smart scheduling
    calculateCallPriority(floor) {
      // Higher priority for ground floor and high traffic floors
      if (floor === 0) return 10; // Ground floor highest priority
      if (floor === this.maxPosition) return 8; // Top floor high priority
      
      // Medium priority for middle floors
      return 5;
    },

    // EMERGENCY AND MAINTENANCE SYSTEMS

    // Trigger emergency protocol
    triggerEmergencyProtocol(type) {
      console.log(`🚨 Emergency protocol triggered: ${type}`);
      
      this.emergencyStop = true;
      
      // Stop all elevators
      this.elevators.forEach(elevator => {
        elevator.emergency = true;
        elevator.status = 'emergency';
        
        if (elevator.isMoving) {
          elevator.isMoving = false;
          elevator.direction = null;
        }
      });
      
      // Show emergency scenario
      this.showEmergencyScenario(type);
      
      // Add to alerts
      this.metrics.maintenanceAlerts.push({
        type: 'emergency',
        subtype: type,
        time: new Date().toISOString(),
        details: `Emergency protocol activated: ${type}`
      });
    },

    // Show emergency scenario
    showEmergencyScenario(type) {
      const scenarios = {
        overload: 'Overload detected - Passenger evacuation required',
        fire: 'Fire alarm - All elevators return to ground floor',
        power: 'Power outage - Emergency backup power activated',
        seismic: 'Seismic activity - Safety protocols engaged'
      };
      
      const scenario = scenarios[type] || 'Emergency situation detected';
      this.showWarning(`🚨 EMERGENCY: ${scenario}`);
    },

    // Check maintenance requirements
    checkMaintenanceRequirements(elevator) {
      // Check based on usage
      if (elevator.totalDistance > 10000) { // 10km
        this.scheduleMaintenance(elevator, 'distance');
      }
      
      // Check based on time
      if (Date.now() > elevator.nextMaintenance) {
        this.scheduleMaintenance(elevator, 'scheduled');
      }
      
      // Check based on trips
      if (elevator.trips > 1000) {
        this.scheduleMaintenance(elevator, 'usage');
      }
      
      // Random component failures
      if (Math.random() < 0.001) { // 0.1% chance
        this.scheduleMaintenance(elevator, 'component_failure');
      }
    },

    // Schedule maintenance
    scheduleMaintenance(elevator, reason) {
      this.metrics.maintenanceAlerts.push({
        type: 'maintenance_required',
        elevator: elevator.id,
        reason: reason,
        time: new Date().toISOString(),
        details: `Maintenance required due to ${reason}`
      });
      
      this.showWarning(`🔧 Maintenance required for ${elevator.id}: ${reason}`);
    },

    // PERFORMANCE MONITORING

    // Start performance monitoring
    startPerformanceMonitoring() {
      // Update metrics every 5 seconds
      this.performanceTimer = setInterval(() => {
        this.updatePerformanceMetrics();
      }, 5000);
    },

    // Update system metrics
    updateSystemMetrics() {
      // Update energy efficiency
      if (this.totalTrips > 0) {
        const baselineEnergy = this.totalTrips * 0.5; // Baseline energy per trip
        this.metrics.elevatorEfficiency = Math.max(0, 
          100 - ((this.energyConsumption - baselineEnergy) / baselineEnergy * 100)
        );
      }
      
      // Update passenger metrics
      const deliveredPassengers = this.passengers.filter(p => p.state === 'delivered');
      this.metrics.totalPassengersServed = deliveredPassengers.length;
      
      if (deliveredPassengers.length > 0) {
        const avgJourney = deliveredPassengers.reduce((sum, p) => sum + p.journeyTime, 0) / deliveredPassengers.length;
        this.metrics.averageJourneyTime = avgJourney / 1000; // Convert to seconds
      }
      
      // Update total energy
      this.metrics.totalEnergyUsed = this.energyConsumption;
    },

    // Update performance metrics
    updatePerformanceMetrics() {
      // Calculate average wait time
      const waitingPassengers = this.passengers.filter(p => p.state === 'waiting');
      if (waitingPassengers.length > 0) {
        const avgWait = waitingPassengers.reduce((sum, p) => {
          return sum + (Date.now() - (p.arrivalTime || Date.now()));
        }, 0) / waitingPassengers.length;
        this.averageWaitTime = avgWait / 1000; // Convert to seconds
      }
      
      // Update peak usage tracking
      const currentHour = new Date().getHours();
      this.elevators.forEach(elevator => {
        elevator.usage[currentHour]++;
      });
    },

    // Generate final report
    generateFinalReport() {
      const report = {
        simulation: {
          totalActions: this.actions.length,
          duration: this.calculateTotalDuration(),
          pddlType: this.pddlType
        },
        elevators: {
          count: this.elevators.length,
          totalTrips: this.totalTrips,
          totalDistance: this.elevators.reduce((sum, e) => sum + e.totalDistance, 0),
          averageEfficiency: this.elevators.reduce((sum, e) => sum + e.efficiency, 0) / this.elevators.length
        },
        passengers: {
          total: this.passengers.length,
          served: this.metrics.totalPassengersServed,
          averageJourneyTime: this.metrics.averageJourneyTime,
          averageSatisfaction: this.passengers.reduce((sum, p) => sum + p.satisfaction, 0) / this.passengers.length
        },
        energy: {
          totalConsumption: this.energyConsumption.toFixed(2) + ' kWh',
          efficiency: this.energyRating,
          costEstimate: (this.energyConsumption * 0.12).toFixed(2) + ' USD'
        },
        safety: {
          emergencyActivations: this.metrics.maintenanceAlerts.filter(a => a.type === 'emergency').length,
          maintenanceAlerts: this.metrics.maintenanceAlerts.length,
          overloadIncidents: this.metrics.maintenanceAlerts.filter(a => a.subtype === 'overload').length
        }
      };
      
      console.log('📊 Final Simulation Report:', report);
      this.showSuccessMessage('📊 Simulation complete! Check console for detailed report.');
    },

    // Calculate total simulation duration
    calculateTotalDuration() {
      if (this.actions.length === 0) return 0;
      
      const lastAction = this.actions[this.actions.length - 1];
      switch (this.pddlType) {
        case 'temporal':
        case 'pddl_plus':
          return Math.max(...this.actions.map(a => a.end || a.time + 2));
        case 'numerical':
          return lastAction.time || this.actions.length;
        default:
          return lastAction.time || this.actions.length;
      }
    },

    // UTILITY FUNCTIONS

    // Get passengers at specific floor
    getPassengersAtFloor(position) {
      return this.passengers.filter(p => 
        p.position === position && (p.state === 'waiting' || p.state === 'delivered')
      );
    },
    
    // Get passengers currently riding
    getRidingPassengers() {
      return this.mainElevator.passengers || [];
    },

    // Get position for floor index
    getPositionForFloor(floorIndex) {
      return this.minPosition + floorIndex;
    },
    
    // Format action description with PDDL type information
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
      
      // Add PDDL type specific information
      switch (this.pddlType) {
        case 'temporal':
          if (action.duration !== undefined) {
            desc += ` ⏱️(${action.duration}s)`;
          }
          break;
          
        case 'pddl_plus':
          if (action.duration !== undefined) {
            desc += ` 🌐(${action.duration}s)`;
          }
          if (action.process) {
            desc += ` [process: ${action.process}]`;
          }
          break;
          
        case 'numerical':
          if (action.cost !== undefined) {
            desc += ` 💰[cost: ${action.cost}]`;
          }
          break;
      }
      
      return desc;
    },

    // Update passenger metrics
    updatePassengerMetrics(passenger, action) {
      const timestamp = Date.now();
      
      switch (action) {
        case 'boarded':
          passenger.boardingTime = timestamp;
          break;
        case 'delivered':
          passenger.deliveryTime = timestamp;
          if (passenger.boardingTime) {
            passenger.journeyTime = timestamp - passenger.boardingTime;
          }
          break;
      }
    },

    // Check if passenger reached destination
    checkDestinationReached(passenger) {
      if (passenger.destinationFloor === passenger.position) {
        passenger.satisfaction += 10; // Bonus for reaching correct destination
      }
    },

    // Show success message
    showSuccessMessage(message) {
      this.successMessage = message;
      this.showSuccess = true;
      setTimeout(() => {
        this.showSuccess = false;
      }, 4000);
    },

    // Show warning message
    showWarning(message) {
      console.warn('⚠️', message);
      // Could be enhanced to show in UI
    },

    // Additional Vue template methods
    resetEmergency() {
      this.emergencyStop = false;
      this.showOverloadAlert = false;
      
      // Reset all elevators
      this.elevators.forEach(elevator => {
        elevator.emergency = false;
        elevator.status = 'idle';
      });
      
      console.log('🔄 Emergency reset');
    },

    toggleEmergency() {
      if (this.emergencyStop) {
        this.resetEmergency();
      } else {
        this.triggerEmergencyProtocol('manual');
      }
    },

    getWaitingTime(passenger) {
      if (passenger.arrivalTime) {
        return Math.floor((Date.now() - passenger.arrivalTime) / 1000);
      }
      return 0;
    },

    hasUpCall(floor) {
      return this.pendingCalls.some(call => call.floor === floor && call.direction === 'up');
    },

    hasDownCall(floor) {
      return this.pendingCalls.some(call => call.floor === floor && call.direction === 'down');
    },

    callElevator(floor, direction) {
      this.addFloorCall(floor, this.mainElevator.id);
      console.log(`📞 Elevator called to floor ${floor + 1} (${direction})`);
    },

    getFloorName(position) {
      const floorIndex = position - this.minPosition;
      return this.floorLabels[floorIndex] || 'Floor?';
    },

    getStatusIcon(status) {
      const icons = {
        idle: '🟢',
        moving: '🔵',
        doors_open: '🟡',
        emergency: '🔴',
        maintenance: '🟠'
      };
      return icons[status] || '⚪';
    },

    getSystemHealth() {
      if (this.emergencyStop || this.maintenanceMode) return 'critical';
      if (this.metrics.maintenanceAlerts.length > 3) return 'warning';
      if (this.capacityUtilization > 90) return 'warning';
      return 'optimal';
    },

    getAlertIcon(type) {
      const icons = {
        emergency: '🚨',
        overload: '⚖️',
        maintenance_required: '🔧',
        component_failure: '⚠️'
      };
      return icons[type] || '📋';
    },

    formatAlertTime(timeString) {
      return new Date(timeString).toLocaleTimeString();
    },

    // Cleanup resources
    cleanup() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      
      if (this.performanceTimer) {
        clearInterval(this.performanceTimer);
        this.performanceTimer = null;
      }
    }
  }
}