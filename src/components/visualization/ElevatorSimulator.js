
    export default {
  name: 'ElevatorSimulator',
  props: {
    actions: { type: Array, default: () => [] },
    entities: { type: Object, default: () => ({}) },
    pddlType: { type: String, default: 'classical' }
  },

  // ================== REACTIVE DATA ==================
  
  data() {
    return {
      // Core Simulation State
      isPlaying: false,
      currentStep: 0,
      speed: 1,
      timer: null,
      
      // Dynamic System Components
      elevators: [],
      passengers: [],
      activeElevatorId: 0,
      
      // Building Structure
      minPosition: 0,
      maxPosition: 0,
      floorLabels: [],
      
      // Plan-Based Constraints
      planConstraints: this.createEmptyConstraints(),
      availableFeatures: this.createEmptyFeatures(),
      
      // UI State Management
      emergencyStop: false,
      showCapacityWarning: false,
      showOverloadAlert: false,
      movingPassenger: null,
      showSuccess: false,
      successMessage: '',
      
      // Performance Metrics
      metrics: this.createEmptyMetrics(),
      currentActionDuration: 1000,
      
      // Advanced Features
      pendingCalls: [],
      elevatorAlgorithm: null
    };
  },

  // ================== COMPUTED PROPERTIES ==================
  
  computed: {
    mainElevator() {
      if (this.elevators.length === 0) {
        return this.createOfflineElevator();
      }
      return this.elevators[this.activeElevatorId] || this.elevators[0];
    },
    
    currentFloorName() {
      const floorIndex = this.mainElevator.position - this.minPosition;
      return this.floorLabels[floorIndex] || `Position ${this.mainElevator.position}`;
    },
    
    capacityUtilization() {
      if (!this.availableFeatures.showCapacity || !this.planConstraints.maxCapacity) return 0;
      const currentWeight = this.calculateCurrentWeight(this.mainElevator);
      return Math.round((currentWeight / this.planConstraints.maxCapacity) * 100);
    },
    
    passengerCount() {
      return this.mainElevator.passengers.length;
    },
    
    showDurationInfo() {
      return this.availableFeatures.showTime;
    },
    
     elevatorStatus() {
      if (this.emergencyStop) return 'EMERGENCY';
      if (this.mainElevator.status === 'offline') return 'OFFLINE';
      if (this.mainElevator.isMoving) return 'MOVING';
      if (this.mainElevator.doorsOpen) return 'DOORS OPEN';
      if (this.mainElevator.passengers.length === 0) return 'IDLE';
      return 'OCCUPIED';
    },
    
    energyRating() {
      if (!this.availableFeatures.showEnergy || !this.metrics.hasEnergyMetrics) return null;
      const efficiency = this.metrics.elevatorEfficiency || 50;
      if (efficiency >= 90) return 'A+';
      if (efficiency >= 80) return 'A';
      if (efficiency >= 70) return 'B';
      if (efficiency >= 60) return 'C';
      return 'D';
    },
    
    movingPassengerStyle() {
      if (!this.movingPassenger) return { display: 'none' };
      
      return this.calculatePassengerAnimationStyle(this.movingPassenger);
    }
  },

  // ================== WATCHERS ==================
  
  watch: {
    actions: { handler: 'initializeDynamic', immediate: true, deep: true },
    entities: { handler: 'initializeDynamic', immediate: true, deep: true },
    pddlType: { handler: 'initializeDynamic', immediate: true },
    
    capacityUtilization: {
      handler(newVal) {
        this.handleCapacityChange(newVal);
      },
      immediate: true
    }
  },

  // ================== LIFECYCLE HOOKS ==================
  
  mounted() {
    this.initializeDynamic();
  },
  
  beforeUnmount() {
    this.cleanup();
  },

  // ================== MAIN METHODS ==================
  
  methods: {
    
    // === INITIALIZATION SECTION ===
    
    initializeDynamic() {
      console.log('🛗 Initializing 100% dynamic elevator system...');
      this.resetDynamicState();
      
      if (!this.hasValidActions()) {
        this.setupEmptyState();
        return;
      }
      
      this.executeInitializationSequence();
      this.logInitializationResults();
    },
    
    executeInitializationSequence() {
      this.extractPlanConstraints();
      this.detectAvailableFeatures();
      this.calculateBuildingStructure();
      this.createSystemComponents();
      this.initializeAdvancedFeatures();
    },
    
    resetDynamicState() {
      this.clearAllArrays();
      this.resetCounters();
      this.resetFlags();
      this.resetConstraintsAndFeatures();
      this.cleanup();
    },
    
    clearAllArrays() {
      this.elevators = [];
      this.passengers = [];
      this.floorLabels = [];
      this.pendingCalls = [];
    },
    
    resetCounters() {
      this.currentStep = 0;
      this.currentActionDuration = 1000;
    },
    
    resetFlags() {
      this.isPlaying = false;
      this.emergencyStop = false;
      this.movingPassenger = null;
      this.showSuccess = false;
      this.elevatorAlgorithm = null;
    },
    
    resetConstraintsAndFeatures() {
      this.planConstraints = this.createEmptyConstraints();
      this.availableFeatures = this.createEmptyFeatures();
      this.metrics = this.createEmptyMetrics();
    },
    
    // === HELPER CREATION METHODS ===
    
    createEmptyConstraints() {
      return {
        hasCapacity: false,
        hasWeight: false,
        hasSpeed: false,
        hasEnergy: false,
        hasTime: false,
        hasCost: false,
        maxCapacity: null,
        maxWeight: null,
        maxSpeed: null,
        energyLimit: null
      };
    },
    
    createEmptyFeatures() {
      return {
        showCapacity: false,
        showWeight: false,
        showSpeed: false,
        showEnergy: false,
        showTime: false,
        showCost: false,
        showParallel: false,
        showContinuous: false,
        showEvents: false
      };
    },
    
    createEmptyMetrics() {
      return {
        totalActions: 0,
        hasTimeMetrics: false,
        hasCostMetrics: false,
        hasEnergyMetrics: false,
        hasCapacityMetrics: false,
        totalDuration: null,
        totalCost: null,
        totalEnergy: null,
        averageCapacityUtilization: null,
        elevatorEfficiency: null,
        passengerThroughput: null,
        safetyScore: 100,
        maintenanceAlerts: []
      };
    },
    
    createOfflineElevator() {
      return {
        id: 'no-elevator',
        position: 0,
        isMoving: false,
        direction: null,
        doorsOpen: false,
        passengers: [],
        currentWeight: 0,
        status: 'offline',
        color: '#95a5a6'
      };
    },
    
    // === PLAN ANALYSIS SECTION ===
    
    hasValidActions() {
      return this.actions && this.actions.length > 0;
    },
    
    setupEmptyState() {
      this.minPosition = 0;
      this.maxPosition = 2;
      this.floorLabels = ['Floor 1', 'Floor 2', 'Floor 3'];
      this.elevators = [];
      this.passengers = [];
      console.warn('⚠️ No plan data - showing empty building structure');
    },
    
    extractPlanConstraints() {
      console.log('📐 Extracting constraints from plan...');
      
      this.analyzeElevatorEntities();
      this.analyzePassengerEntities();
      this.analyzeActionConstraints();
      
      console.log('📐 Extracted constraints:', this.planConstraints);
    },
    
    analyzeElevatorEntities() {
      if (!this.entities.elevators) return;
      
      this.entities.elevators.forEach(elevator => {
        this.processElevatorEntity(elevator);
      });
    },
    
    processElevatorEntity(elevator) {
      if (elevator.capacity !== undefined) {
        this.planConstraints.hasCapacity = true;
        this.planConstraints.maxCapacity = Math.max(
          this.planConstraints.maxCapacity || 0, 
          elevator.capacity
        );
      }
      
      if (elevator.speed !== undefined) {
        this.planConstraints.hasSpeed = true;
        this.planConstraints.maxSpeed = Math.max(
          this.planConstraints.maxSpeed || 0, 
          elevator.speed
        );
      }
      
      if (elevator.energyConsumption !== undefined) {
        this.planConstraints.hasEnergy = true;
      }
    },
    
    analyzePassengerEntities() {
      if (!this.entities.passengers) return;
      
      this.entities.passengers.forEach(passenger => {
        this.processPassengerEntity(passenger);
      });
    },
    
    processPassengerEntity(passenger) {
      if (passenger.weight !== undefined) {
        this.planConstraints.hasWeight = true;
        this.planConstraints.maxWeight = Math.max(
          this.planConstraints.maxWeight || 0, 
          passenger.weight
        );
      }
    },
    
    analyzeActionConstraints() {
      this.actions.forEach(action => {
        this.processActionConstraints(action);
      });
    },
    
    processActionConstraints(action) {
      if (action.duration !== undefined || action.start !== undefined || action.end !== undefined) {
        this.planConstraints.hasTime = true;
      }
      
      if (action.cost !== undefined) {
        this.planConstraints.hasCost = true;
      }
      
      if (action.energyCost !== undefined || action.energy !== undefined) {
        this.planConstraints.hasEnergy = true;
      }
    },
    
    detectAvailableFeatures() {
      console.log('🔍 Detecting available features...');
      
      this.setBasicFeatures();
      this.setPDDLTypeFeatures();
      
      console.log('🔍 Available features:', this.availableFeatures);
    },
    
    setBasicFeatures() {
      this.availableFeatures.showCapacity = this.planConstraints.hasCapacity;
      this.availableFeatures.showWeight = this.planConstraints.hasWeight;
      this.availableFeatures.showSpeed = this.planConstraints.hasSpeed;
      this.availableFeatures.showEnergy = this.planConstraints.hasEnergy;
      this.availableFeatures.showTime = this.planConstraints.hasTime;
      this.availableFeatures.showCost = this.planConstraints.hasCost;
    },
    
    setPDDLTypeFeatures() {
      switch (this.pddlType) {
        case 'temporal':
          this.availableFeatures.showParallel = this.planConstraints.hasTime;
          break;
        case 'numerical':
          this.availableFeatures.showCost = this.planConstraints.hasCost;
          break;
        case 'pddl_plus':
          this.availableFeatures.showParallel = this.planConstraints.hasTime;
          this.availableFeatures.showContinuous = true;
          this.availableFeatures.showEvents = this.checkForEvents();
          break;
      }
    },
    
    checkForEvents() {
      return this.actions.some(action => 
        action.isEvent || 
        action.type?.includes('event') || 
        action.triggered
      );
    },
    
    // === BUILDING STRUCTURE SECTION ===
    
    calculateBuildingStructure() {
      this.calculateDynamicPositionRange();
      this.createDynamicFloorLabels();
    },
    
    calculateDynamicPositionRange() {
      let minPos = 0, maxPos = 0;
      const elevatorPositions = this.trackElevatorMovements();
      
      // Update min/max from movements
      elevatorPositions.forEach(pos => {
        minPos = Math.min(minPos, pos);
        maxPos = Math.max(maxPos, pos);
      });
      
      // Also check floor parameters in actions
      this.updateRangeFromFloorParameters(minPos, maxPos);
      
      this.minPosition = minPos;
      this.maxPosition = maxPos;
      
      console.log(`📐 Position range: ${minPos} to ${maxPos} (${maxPos - minPos + 1} floors)`);
    },
    
    trackElevatorMovements() {
      const elevatorPositions = new Map();
      const allPositions = [];
      
      this.actions.forEach(action => {
        if (action.type === 'move-up' || action.type === 'move-down') {
          const elevatorId = action.params[0];
          
          if (!elevatorPositions.has(elevatorId)) {
            elevatorPositions.set(elevatorId, 0);
          }
          
          let currentPos = elevatorPositions.get(elevatorId);
          
          if (action.type === 'move-up') {
            currentPos++;
          } else if (action.type === 'move-down') {
            currentPos--;
          }
          
          elevatorPositions.set(elevatorId, currentPos);
          allPositions.push(currentPos);
        }
      });
      
      return allPositions;
    },
    
    updateRangeFromFloorParameters(minPos, maxPos) {
      this.actions.forEach(action => {
        if (action.params) {
          action.params.forEach(param => {
            if (param && param.includes('floor')) {
              const floorNum = parseInt(param.replace('floor', ''));
              if (!isNaN(floorNum)) {
                minPos = Math.min(minPos, floorNum);
                maxPos = Math.max(maxPos, floorNum);
              }
            }
          });
        }
      });
    },
    
    createDynamicFloorLabels() {
      const floorCount = this.maxPosition - this.minPosition + 1;
      this.floorLabels = [];
      
      for (let i = 0; i < floorCount; i++) {
        const position = this.minPosition + i;
        this.floorLabels.push(`Floor ${position + 1}`);
      }
      
      console.log(`🏢 Created ${floorCount} floors:`, this.floorLabels);
    },
    
    // === SYSTEM COMPONENTS SECTION ===
    
    createSystemComponents() {
      this.createDynamicElevators();
      this.createDynamicPassengers();
    },
    
    createDynamicElevators() {
      const elevatorIds = this.extractElevatorIds();
      
      this.elevators = Array.from(elevatorIds).map((id, index) => 
        this.createElevatorObject(id, index)
      );
      
      console.log(`🛗 Created ${this.elevators.length} elevators from plan:`, 
        this.elevators.map(e => e.id));
      
      if (this.elevators.length === 0) {
        console.warn('⚠️ No elevators detected in plan actions');
      }
    },
    
    extractElevatorIds() {
      const elevatorIds = new Set();
      
      this.actions.forEach(action => {
        this.extractElevatorFromAction(action, elevatorIds);
      });
      
      this.addEntityElevators(elevatorIds);
      
      if (elevatorIds.size === 0) {
        console.warn('⚠️ No elevators found in plan - this may indicate a parsing issue');
      }
      
      return elevatorIds;
    },
    
    extractElevatorFromAction(action, elevatorIds) {
      if ((action.type === 'move-up' || action.type === 'move-down') && action.params[0]) {
        elevatorIds.add(action.params[0]);
      } else if ((action.type === 'load-person' || action.type === 'unload-person') && action.params[1]) {
        elevatorIds.add(action.params[1]);
      }
      
      if (action.params) {
        action.params.forEach(param => {
          if (param && param.includes('elevator')) {
            elevatorIds.add(param);
          }
        });
      }
    },
    
    addEntityElevators(elevatorIds) {
      if (this.entities.elevators && this.entities.elevators.length > 0) {
        this.entities.elevators.forEach(elevator => {
          elevatorIds.add(elevator.id);
        });
      }
    },
    
    createElevatorObject(id, index) {
      const elevator = this.createBaseElevator(id, index);
      this.addElevatorEntityData(elevator, id);
      this.addElevatorActionData(elevator, id);
      return elevator;
    },
    
    createBaseElevator(id, index) {
      return {
        id: id,
        position: 0,
        isMoving: false,
        direction: null,
        doorsOpen: false,
        passengers: [],
        currentWeight: 0,
        status: 'idle',
        color: this.getElevatorColor(index)
      };
    },
    
    addElevatorEntityData(elevator, id) {
      const entityElevator = this.entities.elevators?.find(e => e.id === id);
      if (!entityElevator) return;
      
      this.addElevatorCapacity(elevator, entityElevator);
      this.addElevatorSpeed(elevator, entityElevator);
      this.addElevatorEnergy(elevator, entityElevator);
    },
    
    addElevatorCapacity(elevator, entityElevator) {
      if (entityElevator.capacity !== undefined) {
        elevator.maxCapacity = entityElevator.capacity;
        console.log(`🛗 ${elevator.id} capacity: ${entityElevator.capacity}kg`);
      }
    },
    
    addElevatorSpeed(elevator, entityElevator) {
      if (entityElevator.speed !== undefined) {
        elevator.speed = entityElevator.speed;
        console.log(`🛗 ${elevator.id} speed: ${entityElevator.speed}m/s`);
      }
    },
    
    addElevatorEnergy(elevator, entityElevator) {
      if (entityElevator.energyConsumption !== undefined) {
        elevator.energyConsumption = entityElevator.energyConsumption;
        elevator.energyUsed = 0;
        console.log(`🛗 ${elevator.id} energy consumption: ${entityElevator.energyConsumption}kWh/floor`);
      }
    },
    
    addElevatorActionData(elevator, id) {
      this.actions.forEach(action => {
        if (action.elevatorId === id) {
          this.processElevatorAction(elevator, action);
        }
      });
    },
    
    processElevatorAction(elevator, action) {
      if (action.elevatorCapacity && !elevator.maxCapacity) {
        elevator.maxCapacity = action.elevatorCapacity;
        console.log(`🛗 ${elevator.id} capacity from action: ${action.elevatorCapacity}kg`);
      }
      
      if (action.elevatorSpeed && !elevator.speed) {
        elevator.speed = action.elevatorSpeed;
        console.log(`🛗 ${elevator.id} speed from action: ${action.elevatorSpeed}m/s`);
      }
      
      if (action.elevatorEnergy && !elevator.energyConsumption) {
        elevator.energyConsumption = action.elevatorEnergy;
        elevator.energyUsed = 0;
        console.log(`🛗 ${elevator.id} energy from action: ${action.elevatorEnergy}kWh`);
      }
    },
    
    createDynamicPassengers() {
      const passengerNames = this.extractPassengerNames();
      
      let id = 1;
      this.passengers = Array.from(passengerNames).map(name => 
        this.createPassengerObject(id++, name)
      );
      
      console.log(`👥 Created ${this.passengers.length} passengers:`, 
        Array.from(passengerNames));
    },
    
    extractPassengerNames() {
      const passengerNames = new Set();
      
      this.actions.forEach(action => {
        this.extractPassengerFromAction(action, passengerNames);
      });
      
      this.addEntityPassengers(passengerNames);
      
      return passengerNames;
    },
    
    extractPassengerFromAction(action, passengerNames) {
      if ((action.type === 'load-person' || action.type === 'unload-person') && action.params[0]) {
        passengerNames.add(action.params[0]);
      } else if (action.type === 'serve-person' && action.params[0]) {
        passengerNames.add(action.params[0]);
      }
      
      if (action.params) {
        action.params.forEach(param => {
          if (param && param.includes('person')) {
            passengerNames.add(param);
          }
        });
      }
    },
    
    addEntityPassengers(passengerNames) {
      if (this.entities.passengers && this.entities.passengers.length > 0) {
        this.entities.passengers.forEach(passenger => {
          passengerNames.add(passenger.id);
        });
      }
    },
    
    createPassengerObject(id, name) {
      const passenger = this.createBasePassenger(id, name);
      this.addPassengerEntityData(passenger, name);
      this.addPassengerActionData(passenger, name);
      return passenger;
    },
    
    createBasePassenger(id, name) {
      return {
        id: id,
        name: name,
        position: this.getPassengerInitialPosition(name),
        state: 'waiting',
        avatar: this.generatePassengerAvatar(),
        color: this.generatePassengerColor()
      };
    },
    
    addPassengerEntityData(passenger, name) {
      const entityPassenger = this.entities.passengers?.find(p => p.id === name);
      if (entityPassenger && entityPassenger.weight !== undefined) {
        passenger.weight = entityPassenger.weight;
        console.log(`👤 ${name} weight: ${entityPassenger.weight}kg`);
      }
    },
    
    addPassengerActionData(passenger, name) {
      const passengerAction = this.actions.find(action => 
        action.passengerId === name && action.passengerWeight
      );
      if (passengerAction) {
        passenger.weight = passengerAction.passengerWeight;
        console.log(`👤 ${name} weight from action: ${passengerAction.passengerWeight}kg`);
      }
    },
    
    getPassengerInitialPosition(passengerName) {
      const loadAction = this.actions.find(a => 
        a.type === 'load-person' && a.params && a.params[0] === passengerName
      );
      
      if (!loadAction) return 0;
      
      if (loadAction.params.length >= 3) {
        const floorParam = loadAction.params[2];
        if (floorParam && floorParam.includes('floor')) {
          const floorNum = parseInt(floorParam.replace('floor', ''));
          return isNaN(floorNum) ? 0 : floorNum;
        }
      }
      
      return 0;
    },
    
    // === ADVANCED FEATURES SECTION ===
    
    initializeAdvancedFeatures() {
      this.initializeDynamicScheduling();
    },
    
    initializeDynamicScheduling() {
      if (this.elevators.length > 1) {
        this.elevatorAlgorithm = 'DYNAMIC_DISPATCH';
        console.log(`🧠 Multi-elevator scheduling: ${this.elevatorAlgorithm}`);
      }
    },
    
    logInitializationResults() {
      console.log('✅ Dynamic elevator system initialized:', {
        elevators: this.elevators.length,
        floors: this.floorLabels.length,
        passengers: this.passengers.length,
        availableFeatures: this.availableFeatures,
        pddlType: this.pddlType
      });
    },
    
    // === SIMULATION CONTROL SECTION ===
    
    play() {
      if (this.currentStep >= this.actions.length || !this.actions.length) return;
      
      this.isPlaying = true;
      this.executeActionSequentially();
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
      this.initializeDynamic();
    },
    
    executeActionSequentially() {
      if (!this.isPlaying || this.currentStep >= this.actions.length) {
        this.handleSimulationComplete();
        return;
      }
      
      const action = this.actions[this.currentStep];
      const actionDuration = this.getDynamicActionDuration(action);
      
      this.executeNextAction();
      
      setTimeout(() => {
        if (this.isPlaying) {
          this.executeActionSequentially();
        }
      }, actionDuration / this.speed);
    },
    
    handleSimulationComplete() {
      if (this.currentStep >= this.actions.length) {
        this.pause();
        this.showSuccessMessage('🎉 All actions completed!');
        this.generateDynamicReport();
      }
    },
    
    // === ACTION EXECUTION SECTION ===
    
    executeNextAction() {
      if (this.currentStep >= this.actions.length) {
        this.pause();
        return;
      }
      
      const action = this.actions[this.currentStep];
      console.log(`🛗 Executing: ${action.type} [${action.params?.join(', ') || ''}]`);
      
      this.currentActionDuration = this.getDynamicActionDuration(action);
      this.routeActionExecution(action);
      
      this.currentStep++;
      this.updateDynamicMetrics();
    },
    
    routeActionExecution(action) {
      const executionMap = {
        'move-up': () => this.executeDynamicMovement('up', action),
        'move-down': () => this.executeDynamicMovement('down', action),
        'load-person': () => this.executeDynamicLoad(action),
        'unload-person': () => this.executeDynamicUnload(action),
        'serve-person': () => this.executeServePerson(action)
      };
      
      const executeAction = executionMap[action.type];
      if (executeAction) {
        executeAction();
      } else {
        console.log(`🔄 Unknown action: ${action.type}`);
      }
    },
    
    getDynamicActionDuration(action) {
      // Priority 1: Explicit duration in action
      if (action.duration !== undefined) {
        console.log(`⏱️ Using action duration: ${action.duration}s for ${action.type}`);
        return action.duration * 1000;
      }
      
      // Priority 2: Calculate from start/end times
      if (this.availableFeatures.showTime && action.start !== undefined && action.end !== undefined) {
        const duration = action.end - action.start;
        console.log(`⏱️ Using calculated duration: ${duration}s for ${action.type}`);
        return duration * 1000;
      }
      
      // Priority 3: Speed-based calculation
      const speedBasedDuration = this.calculateSpeedBasedDuration(action);
      if (speedBasedDuration) {
        return speedBasedDuration;
      }
      
      // Priority 4: PDDL type-specific defaults
      const typeBasedDuration = this.getPDDLTypeActionDuration(action.type);
      console.log(`⏱️ Using PDDL type duration: ${typeBasedDuration/1000}s for ${action.type}`);
      return typeBasedDuration;
    },
    
    calculateSpeedBasedDuration(action) {
      if (!this.availableFeatures.showSpeed) return null;
      
      const elevator = this.getElevatorFromAction(action);
      const speed = (elevator && elevator.speed) || action.elevatorSpeed;
      
      if (speed) {
        const duration = this.calculatePhysicalDuration(action, speed);
        console.log(`⏱️ Using speed-based duration: ${duration/1000}s for ${action.type} (speed: ${speed}m/s)`);
        return duration;
      }
      
      return null;
    },
    
    getPDDLTypeActionDuration(actionType) {
      const baseDurations = {
        'move-up': { classical: 3000, temporal: 3000, numerical: 4000, pddl_plus: 3500 },
        'move-down': { classical: 3000, temporal: 2800, numerical: 3500, pddl_plus: 3200 },
        'load-person': { classical: 2000, temporal: 4500, numerical: 5000, pddl_plus: 4800 },
        'unload-person': { classical: 2000, temporal: 4000, numerical: 4500, pddl_plus: 4200 },
        'serve-person': { classical: 1000, temporal: 1000, numerical: 1500, pddl_plus: 1200 }
      };
      
      const actionDurations = baseDurations[actionType];
      if (actionDurations) {
        return actionDurations[this.pddlType] || actionDurations.classical;
      }
      
      return 2000;
    },
    
    calculatePhysicalDuration(action, speed) {
      const distance = 3.5;
      
      switch (action.type) {
        case 'move-up':
        case 'move-down':
          return (distance / speed) * 1000;
        case 'load-person':
        case 'unload-person':
          return 4000;
        default:
          return 2000;
      }
    },
    
    // === MOVEMENT ACTIONS SECTION ===
    
    executeDynamicMovement(direction, action) {
      const elevator = this.getElevatorFromAction(action);
      if (!elevator) {
        this.showWarning(`Elevator not found for ${action.type} action`);
        return;
      }
      
      if (this.emergencyStop) {
        this.showWarning('Movement blocked - Emergency stop active');
        return;
      }
      
      if (!this.validateMovement(elevator, direction)) {
        return;
      }
      
      this.executeMovement(elevator, direction, action);
    },
    
    validateMovement(elevator, direction) {
      if (direction === 'up' && elevator.position >= this.maxPosition) {
        this.showWarning(`${elevator.id} cannot move up - at top floor`);
        return false;
      }
      
      if (direction === 'down' && elevator.position <= this.minPosition) {
        this.showWarning(`${elevator.id} cannot move down - at bottom floor`);
        return false;
      }
      
      return true;
    },
    
    executeMovement(elevator, direction, action) {
      const oldPosition = elevator.position;
      
      // Update position
      if (direction === 'up') {
        elevator.position++;
      } else {
        elevator.position--;
      }
      
      // Update elevator state
      this.updateElevatorMovementState(elevator, direction, action);
      
      // Calculate and log energy/speed/cost
      this.processMovementMetrics(elevator, oldPosition, direction, action);
      
      // Update passenger positions
      this.updatePassengerPositions(elevator);
      
      // Schedule movement completion
      this.scheduleMovementCompletion(elevator, action);
    },
    
    updateElevatorMovementState(elevator, direction, action) {
      elevator.direction = direction;
      elevator.isMoving = true;
      elevator.status = 'moving';
      
      const speed = action.elevatorSpeed || elevator.speed;
      if (speed && this.availableFeatures.showSpeed) {
        console.log(`🛗 ${elevator.id} moving ${direction} at ${speed}m/s`);
      }
    },
    
    processMovementMetrics(elevator, oldPosition, direction, action) {
      // Calculate and show energy consumption
      if (this.availableFeatures.showEnergy) {
        const energyUsed = this.calculateMovementEnergy(elevator, oldPosition, direction, action);
        elevator.energyUsed = (elevator.energyUsed || 0) + energyUsed;
      }
      
      // Show cost information if available
      if (action.cost && this.availableFeatures.showCost) {
        console.log(`💰 Movement cost: ${action.cost}`);
      }
    },
    
    calculateMovementEnergy(elevator, oldPosition, direction, action) {
      const distance = Math.abs(elevator.position - oldPosition) * 3.5;
      let energyUsed = 0;
      
      if (action.energyCost) {
        energyUsed = action.energyCost;
        console.log(`⚡ Energy from action: ${energyUsed}kWh`);
      } else if (elevator.energyConsumption !== undefined) {
        energyUsed = distance * elevator.energyConsumption;
        console.log(`⚡ Energy calculated: ${energyUsed.toFixed(3)}kWh (${distance}m × ${elevator.energyConsumption}kWh/m)`);
      } else {
        const baseEnergy = direction === 'up' ? 0.15 : 0.05;
        const loadFactor = 1 + (elevator.currentWeight / 1000);
        energyUsed = baseEnergy * loadFactor;
        console.log(`⚡ Energy estimated: ${energyUsed.toFixed(3)}kWh (${direction}, load: ${elevator.currentWeight}kg)`);
      }
      
      return energyUsed;
    },
    
    updatePassengerPositions(elevator) {
      elevator.passengers.forEach(p => {
        p.position = elevator.position;
      });
    },
    
    scheduleMovementCompletion(elevator) {
      const moveDuration = this.currentActionDuration / this.speed;
      setTimeout(() => {
        elevator.isMoving = false;
        elevator.direction = null;
        elevator.status = 'idle';
        
        console.log(`🛗 ${elevator.id} completed movement to position ${elevator.position} (${this.getFloorName(elevator.position)})`);
      }, moveDuration);
    },
    
    // === PASSENGER ACTIONS SECTION ===
    
    executeDynamicLoad(action) {
      const { passenger, elevator } = this.getLoadActionEntities(action);
      if (!passenger || !elevator) return;
      
      const passengerWeight = this.getPassengerWeight(action, passenger);
      console.log(`👤 Loading ${passenger.name} (${passengerWeight}kg) into ${elevator.id}`);
      
      if (!this.validateCapacity(elevator, passengerWeight)) {
        return;
      }
      
      this.logActionMetrics(action);
      this.executeLoadSequence(passenger, elevator, passengerWeight);
    },
    
    getLoadActionEntities(action) {
      const passengerName = action.params?.[0];
      const elevator = this.getElevatorFromAction(action);
      const passenger = this.passengers.find(p => p.name === passengerName);
      
      if (!passenger || !elevator) {
        this.showWarning(`Cannot load ${passengerName}`);
        return { passenger: null, elevator: null };
      }
      
      return { passenger, elevator };
    },
    
    getPassengerWeight(action, passenger) {
      return action.passengerWeight || passenger.weight || 75;
    },
    
    validateCapacity(elevator, passengerWeight) {
      if (this.availableFeatures.showCapacity && elevator.maxCapacity) {
        const newWeight = elevator.currentWeight + passengerWeight;
        if (newWeight > elevator.maxCapacity) {
          console.log(`⚠️ Capacity exceeded: ${newWeight}kg > ${elevator.maxCapacity}kg`);
          this.triggerOverloadAlert(elevator, { weight: passengerWeight });
          return false;
        } else {
          console.log(`✅ Capacity OK: ${newWeight}kg / ${elevator.maxCapacity}kg (${((newWeight/elevator.maxCapacity)*100).toFixed(1)}%)`);
        }
      }
      return true;
    },
    
    logActionMetrics(action) {
      if (action.cost && this.availableFeatures.showCost) {
        console.log(`💰 Load cost: ${action.cost}`);
      }
      
      if (action.energyCost && this.availableFeatures.showEnergy) {
        console.log(`⚡ Load energy: ${action.energyCost}kWh`);
      }
    },
    
    executeLoadSequence(passenger, elevator, passengerWeight) {
      const totalDuration = this.currentActionDuration / this.speed;
      
      this.openElevatorDoors(elevator);
      
      setTimeout(() => {
        passenger.weight = passengerWeight;
        this.boardPassenger(passenger, elevator);
        setTimeout(() => {
          this.closeElevatorDoors(elevator);
        }, totalDuration * 0.6);
      }, totalDuration * 0.2);
    },
    
    executeDynamicUnload(action) {
      const { passenger, elevator } = this.getUnloadActionEntities(action);
      if (!passenger || !elevator) return;
      
      console.log(`🛗 Unloading ${passenger.name} from ${elevator.id}`);
      this.executeUnloadSequence(passenger, elevator);
    },
    
    getUnloadActionEntities(action) {
      const passengerName = action.params?.[0];
      const elevator = this.getElevatorFromAction(action);
      const passenger = this.passengers.find(p => p.name === passengerName);
      
      if (!passenger || !elevator || passenger.state !== 'riding') {
        this.showWarning(`Cannot unload ${passengerName}`);
        return { passenger: null, elevator: null };
      }
      
      return { passenger, elevator };
    },
    
    executeUnloadSequence(passenger, elevator) {
      const totalDuration = this.currentActionDuration / this.speed;
      
      this.openElevatorDoors(elevator);
      
      setTimeout(() => {
        this.disembarkPassenger(passenger, elevator);
        setTimeout(() => {
          this.closeElevatorDoors(elevator);
        }, totalDuration * 0.6);
      }, totalDuration * 0.2);
    },
    
    executeServePerson(action) {
      const passengerName = action.params?.[0];
      const passenger = this.passengers.find(p => p.name === passengerName);
      
      if (passenger) {
        passenger.state = 'served';
        this.showSuccessMessage(`🎉 ${passengerName} successfully served!`);
        console.log(`✅ ${passengerName} served`);
      }
    },
    
    // === DOOR OPERATIONS SECTION ===
    
    openElevatorDoors(elevator) {
      elevator.doorsOpen = true;
      elevator.status = 'doors_open';
      console.log(`🚪 ${elevator.id} doors opened`);
    },
    
    closeElevatorDoors(elevator) {
      elevator.doorsOpen = false;
      elevator.status = 'idle';
      console.log(`🚪 ${elevator.id} doors closed`);
    },
    
    // === PASSENGER BOARDING SECTION ===
    
    boardPassenger(passenger, elevator) {
      passenger.animationState = 'boarding';
      this.movingPassenger = passenger;
      
      setTimeout(() => {
        this.completeBoarding(passenger, elevator);
      }, 2000);
    },
    
    completeBoarding(passenger, elevator) {
      passenger.state = 'riding';
      passenger.position = elevator.position;
      
      elevator.passengers.push(passenger);
      if (passenger.weight) {
        elevator.currentWeight += passenger.weight;
      }
      
      this.movingPassenger = null;
      console.log(`👤 ${passenger.name} boarded ${elevator.id}`);
    },
    
    disembarkPassenger(passenger, elevator) {
      passenger.animationState = 'exiting';
      this.movingPassenger = passenger;
      
      setTimeout(() => {
        this.completeDisembarking(passenger, elevator);
      }, 2000);
    },
    
    completeDisembarking(passenger, elevator) {
      passenger.state = 'delivered';
      
      const index = elevator.passengers.indexOf(passenger);
      if (index > -1) {
        elevator.passengers.splice(index, 1);
        if (passenger.weight) {
          elevator.currentWeight -= passenger.weight;
        }
      }
      
      this.movingPassenger = null;
      this.showSuccessMessage(`✅ ${passenger.name} delivered to ${this.currentFloorName}!`);
      console.log(`👤 ${passenger.name} delivered`);
    },
    
    // === UTILITY METHODS SECTION ===
    
    getElevatorFromAction(action) {
      if (action.type === 'move-up' || action.type === 'move-down') {
        const elevatorId = action.params[0];
        return this.elevators.find(e => e.id === elevatorId) || null;
      }
      
      if (action.type === 'load-person' || action.type === 'unload-person') {
        const elevatorId = action.params[1];
        return this.elevators.find(e => e.id === elevatorId) || null;
      }
      
      if (action.params) {
        for (const param of action.params) {
          if (param && param.includes('elevator')) {
            return this.elevators.find(e => e.id === param) || null;
          }
        }
      }
      
      return this.elevators.length > 0 ? this.elevators[0] : null;
    },
    
    getPassengersAtFloor(position) {
      return this.passengers.filter(p => 
        p.position === position && (p.state === 'waiting' || p.state === 'delivered')
      );
    },
    
    getPositionForFloor(floorIndex) {
      return this.minPosition + floorIndex;
    },
    
    calculateCurrentWeight(elevator) {
      return elevator.passengers.reduce((total, p) => total + (p.weight || 0), 0);
    },
    
    calculatePassengerAnimationStyle(passenger) {
      const floorIndex = this.mainElevator.position - this.minPosition;
      const baseY = floorIndex * 150 + 70;
      
      const baseStyle = {
        position: 'absolute',
        bottom: baseY + 'px',
        zIndex: 100,
        opacity: 1,
        transition: 'transform 2.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
      };
      
      if (passenger.animationState === 'boarding') {
        return { ...baseStyle, left: '200px', transform: 'translateX(150px)' };
      } else if (passenger.animationState === 'exiting') {
        return { ...baseStyle, left: '350px', transform: 'translateX(200px)' };
      }
      
      return { display: 'none' };
    },
    
    // === HELPER METHODS SECTION ===
    
    generatePassengerAvatar() {
      const avatars = ['👤', '🧑‍💼', '👩‍⚕️', '👨‍🎓', '👩‍🔬'];
      return avatars[Math.floor(Math.random() * avatars.length)];
    },
    
    generatePassengerColor() {
      const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    
    getElevatorColor(index) {
      const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
      return colors[index % colors.length];
    },
    
    // === PDDL UTILITIES SECTION ===
    
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
    
    getActionDesc(action) {
      const { type, params } = action;
      let desc = this.getBaseActionDescription(type, params);
      
      const details = this.collectActionDetails(action);
      if (details.length > 0) {
        desc += ` (${details.join(', ')})`;
      }
      
      return desc;
    },
    
    getBaseActionDescription(type, params) {
      const descriptions = {
        'move-up': `🛗 ${params[0]} moves up`,
        'move-down': `🛗 ${params[0]} moves down`,
        'load-person': `👤 ${params[0]} boards ${params[1]}`,
        'unload-person': `👤 ${params[0]} exits ${params[1]}`,
        'serve-person': `✅ ${params[0]} served`
      };
      
      return descriptions[type] || `${type} ${params?.join(' ') || ''}`;
    },
    
    collectActionDetails(action) {
      const details = [];
      
      if (this.availableFeatures.showTime && action.duration !== undefined) {
        details.push(`⏱️${action.duration}s`);
      }
      
      if (this.availableFeatures.showCost && action.cost !== undefined) {
        details.push(`💰${action.cost}`);
      }
      
      if (this.availableFeatures.showEnergy && action.energyCost !== undefined) {
        details.push(`⚡${action.energyCost}kWh`);
      }
      
      if (this.availableFeatures.showWeight && action.passengerWeight !== undefined) {
        details.push(`⚖️${action.passengerWeight}kg`);
      }
      
      if (this.availableFeatures.showSpeed && action.elevatorSpeed !== undefined) {
        details.push(`🚀${action.elevatorSpeed}m/s`);
      }
      
      if (this.availableFeatures.showCapacity && action.elevatorCapacity !== undefined) {
        details.push(`📊${action.elevatorCapacity}kg`);
      }
      
      return details;
    },
    
    // === EMERGENCY & SAFETY SECTION ===
    
    handleCapacityChange(newVal) {
      if (!this.availableFeatures.showCapacity) return;
      
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
    
    triggerEmergencyProtocol(type) {
      console.log(`🚨 Emergency: ${type}`);
      this.emergencyStop = true;
      
      this.elevators.forEach(elevator => {
        elevator.status = 'emergency';
        if (elevator.isMoving) {
          elevator.isMoving = false;
          elevator.direction = null;
        }
      });
    },
    
    triggerOverloadAlert(elevator, passenger) {
      this.showOverloadAlert = true;
      const excess = (elevator.currentWeight + (passenger.weight || 75)) - elevator.maxCapacity;
      this.showWarning(`⚠️ OVERLOAD: ${elevator.id} - Excess: ${excess}kg`);
      this.triggerEmergencyProtocol('overload');
    },
    
    resetEmergency() {
      this.emergencyStop = false;
      this.showOverloadAlert = false;
      
      this.elevators.forEach(elevator => {
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
    
    // === METRICS & REPORTING SECTION ===
    
    updateDynamicMetrics() {
      this.metrics.totalActions = this.actions.length;
      
      this.updateTimeMetrics();
      this.updateCostMetrics();
      this.updateEnergyMetrics();
    },
    
    updateTimeMetrics() {
      if (this.availableFeatures.showTime) {
        this.metrics.hasTimeMetrics = true;
        const lastAction = this.actions[this.actions.length - 1];
        this.metrics.totalDuration = lastAction.end || lastAction.time;
      }
    },
    
    updateCostMetrics() {
      if (this.availableFeatures.showCost) {
        this.metrics.hasCostMetrics = true;
        this.metrics.totalCost = this.actions.reduce((sum, a) => sum + (a.cost || 0), 0);
      }
    },
    
    updateEnergyMetrics() {
      if (this.availableFeatures.showEnergy) {
        this.metrics.hasEnergyMetrics = true;
        this.metrics.totalEnergy = this.elevators.reduce((sum, e) => sum + (e.energyUsed || 0), 0);
      }
    },
    
    generateDynamicReport() {
      const report = this.createBaseReport();
      this.addOptionalReportSections(report);
      
      console.log('📊 Dynamic Report:', report);
      this.showSuccessMessage('📊 Simulation complete! Check console for report.');
    },
    
    createBaseReport() {
      return {
        simulation: {
          totalActions: this.actions.length,
          pddlType: this.pddlType,
          availableFeatures: this.availableFeatures
        },
        elevators: {
          count: this.elevators.length
        },
        passengers: {
          total: this.passengers.length,
          served: this.passengers.filter(p => p.state === 'delivered' || p.state === 'served').length
        }
      };
    },
    
    addOptionalReportSections(report) {
      if (this.metrics.hasTimeMetrics) {
        report.simulation.duration = this.metrics.totalDuration;
      }
      
      if (this.metrics.hasCostMetrics) {
        report.simulation.totalCost = this.metrics.totalCost;
      }
      
      if (this.metrics.hasEnergyMetrics) {
        report.energy = {
          totalConsumption: this.metrics.totalEnergy + ' kWh',
          efficiency: this.energyRating
        };
      }
    },
    
    // === UI HELPERS SECTION ===
    
    showSuccessMessage(message) {
      this.successMessage = message;
      this.showSuccess = true;
      setTimeout(() => {
        this.showSuccess = false;
      }, 4000);
    },
    
    showWarning(message) {
      console.warn('⚠️', message);
    },
    
    // === TEMPLATE HELPERS SECTION ===
    
    getWaitingTime() {
      return 0; // Simplified for now
    },
    
    callElevator(floor, direction) {
      console.log(`📞 Elevator called to floor ${floor + 1} (${direction})`);
    },
    
    getFloorName(position) {
      const floorIndex = position - this.minPosition;
      return this.floorLabels[floorIndex] || `Position ${position}`;
    },
    
    getStatusIcon(status) {
      const icons = {
        idle: '🟢',
        moving: '🔵',
        doors_open: '🟡',
        emergency: '🔴',
        offline: '⚪'
      };
      return icons[status] || '⚪';
    },
    
    getSystemHealth() {
      if (this.emergencyStop) return 'critical';
      if (this.availableFeatures.showCapacity && this.capacityUtilization > 90) return 'warning';
      return 'optimal';
    },
    
    formatFeatureName(feature) {
      const names = {
        showCapacity: 'Capacity',
        showWeight: 'Weight',
        showSpeed: 'Speed', 
        showEnergy: 'Energy',
        showTime: 'Time',
        showCost: 'Cost',
        showParallel: 'Parallel',
        showContinuous: 'Continuous',
        showEvents: 'Events'
      };
      return names[feature] || feature;
    },
    
    // === CLEANUP SECTION ===
    
    cleanup() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }
}// File: src/components/visualization/ElevatorSimulator.js  
// 100% Dynamic Elevator Simulator - Clean & Organized Structure
// Everything based on plan file content only
  