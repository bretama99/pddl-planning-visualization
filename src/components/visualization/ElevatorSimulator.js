export default {
  name: 'ElevatorSimulator',
  props: {
    entities: { 
      type: Object, 
      default: () => ({}) 
    },
    actions: { 
      type: Array, 
      default: () => [
        { type: 'load', params: ['passenger1'], time: 0 },
        { type: 'move-up', params: ['elevator1'], time: 2 },
        { type: 'move-up', params: ['elevator1'], time: 4 },
        { type: 'unload', params: ['passenger1'], time: 6 },
        { type: 'load', params: ['passenger2'], time: 8 },
        { type: 'move-down', params: ['elevator1'], time: 10 },
        { type: 'unload', params: ['passenger2'], time: 12 }
      ]
    }
  },
  data() {
    return {
      // Simulation state
      isPlaying: false,
      currentStep: 0,
      speed: 1,
      
      // Elevator state
      currentFloor: 'Floor1',
      isMoving: false,
      direction: null,
      doorsOpen: false,
      emergencyStop: false,
      
      // Entities
      floors: [],
      elevators: [],
      passengerList: [],
      passengers: [],
      
      // Animation
      activeFloor: null,
      movingPassenger: null,
      particles: [],
      showSuccess: false,
      successMessage: '',
      
      // Timer
      timer: null,
      particleTimer: null
    }
  },
  computed: {
    elevatorPosition() {
      if (!this.floors.length) return 20;
      const floorIndex = this.floors.indexOf(this.currentFloor);
      if (floorIndex === -1) return 20;
      // Position from bottom up (reverse the index)
      const positionFromBottom = (this.floors.length - 1 - floorIndex) * 150 + 20;
      return positionFromBottom;
    },
    
    movingPassengerStyle() {
      if (!this.movingPassenger || !this.floors.length) return {};
      
      const floorIndex = this.floors.indexOf(this.movingPassenger.currentLocation);
      if (floorIndex === -1) return {};
      
      // Calculate position from bottom up (reverse the index)
      const baseY = (this.floors.length - 1 - floorIndex) * 150 + 50;
      
      if (this.movingPassenger.state === 'boarding') {
        return {
          left: '350px',
          bottom: baseY + 'px',
          transform: 'translateX(50px)',
          transition: 'all 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        };
      } else if (this.movingPassenger.state === 'exiting') {
        return {
          left: '450px',
          bottom: baseY + 'px',
          transform: 'translateX(-50px)',
          transition: 'all 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        };
      }
      
      return {};
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
    }
  },
  mounted() {
    // Start particle animation
    this.particleTimer = setInterval(this.updateParticles, 50);
    
    // Force initialization if not already done
    this.$nextTick(() => {
      if (this.floors.length === 0) {
        this.initialize();
      }
    });
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
    if (this.particleTimer) clearInterval(this.particleTimer);
  },
  methods: {
    // Helper method to safely parse parameters
    parseActionParams(action) {
      if (action.params && Array.isArray(action.params)) {
        return action.params;
      }
      if (action.parameters) {
        if (typeof action.parameters === 'string') {
          return action.parameters.split(' ').filter(p => p.trim());
        }
        if (Array.isArray(action.parameters)) {
          return action.parameters;
        }
      }
      return [];
    },

    // Particle System
    generateParticles(type, count = 10) {
      const newParticles = [];
      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: Math.random() + Date.now(),
          type,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 1,
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360
        });
      }
      this.particles.push(...newParticles);
    },

    updateParticles() {
      this.particles = this.particles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 0.02,
          size: particle.size * 0.98,
          rotation: particle.rotation + 2
        }))
        .filter(particle => particle.life > 0);
    },

    getParticleStyle(particle) {
      return {
        left: particle.x + '%',
        top: particle.y + '%',
        width: particle.size + 'px',
        height: particle.size + 'px',
        opacity: particle.life,
        transform: `rotate(${particle.rotation}deg)`
      };
    },

    showSuccessMessage(message) {
      this.successMessage = message;
      this.showSuccess = true;
      setTimeout(() => {
        this.showSuccess = false;
      }, 3000);
    },

    initialize() {
      console.log('Initializing elevator simulator...');
      
      // Reset all arrays first
      this.floors = [];
      this.elevators = [];
      this.passengerList = [];
      this.passengers = [];
      
      // If no actions, provide defaults
      if (!this.actions || !this.actions.length) {
        this.floors = ['Floor1', 'Floor2', 'Floor3'];
        this.elevators = ['elevator1'];
        this.passengerList = [];
        this.passengers = [];
        console.log('No actions provided, using defaults');
        return;
      }
      
      // Extract entities from actions
      this.extractEntities();
      
      // Create passengers
      this.createPassengers();
      
      // Set initial state
      this.currentStep = 0;
      this.currentFloor = this.floors[Math.floor(this.floors.length / 2)] || 'Floor1';
      this.isMoving = false;
      this.direction = null;
      this.doorsOpen = false;
      this.emergencyStop = false;
      this.activeFloor = null;
      this.movingPassenger = null;
      this.particles = [];
      this.showSuccess = false;
      
      console.log('Initialization complete:', {
        floors: this.floors,
        elevators: this.elevators,
        passengers: this.passengers.length,
        passengerList: this.passengerList
      });
    },
    
    extractEntities() {
      const floors = new Set();
      const elevators = new Set();
      const passengers = new Set();
      
      // Extract from actions
      this.actions.forEach(action => {
        const type = action.type || action.name || '';
        const params = this.parseActionParams(action);
        
        switch (type) {
          case 'move-up':
          case 'move-down':
            if (params[0]) elevators.add(params[0]);
            break;
          case 'load':
          case 'unload':
            if (params[0]) passengers.add(params[0]);
            if (params[1]) elevators.add(params[1]);
            break;
          case 'reached':
            if (params[0]) passengers.add(params[0]);
            break;
        }
      });
      
      // Generate floors based on movements
      let pos = 2; // Start at floor 2
      let min = pos, max = pos;
      
      this.actions.forEach(action => {
        const type = action.type || action.name || '';
        if (type === 'move-up') {
          pos++;
          max = Math.max(max, pos);
        } else if (type === 'move-down') {
          pos--;
          min = Math.min(min, pos);
        }
      });
      
      // Create floor list
      for (let i = 0; i < (max - min + 1); i++) {
        floors.add(`Floor${i + 1}`);
      }
      
      this.floors = Array.from(floors);
      this.elevators = Array.from(elevators);
      this.passengerList = Array.from(passengers);
      
      // Ensure defaults
      if (this.floors.length === 0) this.floors = ['Floor1', 'Floor2', 'Floor3'];
      if (this.elevators.length === 0) this.elevators = ['elevator1'];
    },
    
    createPassengers() {
      this.passengers = [];
      let id = 1;
      
      this.passengerList.forEach(name => {
        // Find where they unload
        const unloadAction = this.actions.find(a => {
          const type = a.type || a.name || '';
          const params = this.parseActionParams(a);
          return type === 'unload' && params[0] === name;
        });
        
        const passenger = {
          id: id++,
          name: name,
          currentLocation: this.floors[0], // Start at ground floor
          destination: null,
          state: 'waiting' // waiting, riding, delivered
        };
        
        // Set destination based on unload action
        if (unloadAction) {
          passenger.destination = this.predictFloorAtTime(unloadAction.time || unloadAction.start);
        }
        
        this.passengers.push(passenger);
      });
    },
    
    predictFloorAtTime(targetTime) {
      let floor = this.currentFloor;
      
      for (const action of this.actions) {
        const actionTime = action.time || action.start || 0;
        if (actionTime > targetTime) break;
        
        const type = action.type || action.name || '';
        const currentIndex = this.floors.indexOf(floor);
        
        if (type === 'move-up' && currentIndex < this.floors.length - 1) {
          floor = this.floors[currentIndex + 1];
        } else if (type === 'move-down' && currentIndex > 0) {
          floor = this.floors[currentIndex - 1];
        }
      }
      
      return floor;
    },
    
    play() {
      if (this.currentStep >= this.actions.length) return;
      
      this.isPlaying = true;
      this.generateParticles('play', 15);
      this.timer = setInterval(() => {
        this.executeNextAction();
      }, 1000 / this.speed);
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
      this.generateParticles('reset', 12);
      this.initialize();
    },
    
    executeNextAction() {
      if (this.currentStep >= this.actions.length) {
        this.pause();
        this.showSuccessMessage('All actions completed successfully!');
        this.generateParticles('success', 25);
        return;
      }
      
      const action = this.actions[this.currentStep];
      const type = action.type || action.name || '';
      const params = this.parseActionParams(action);
      
      console.log(`Executing: ${type} [${params.join(', ')}]`);
      
      switch (type) {
        case 'move-up':
        case 'move-down':
          this.handleMove(type);
          break;
        case 'load':
          this.handleLoad(params[0]);
          break;
        case 'unload':
          this.handleUnload(params[0]);
          break;
        case 'reached':
          this.handleReached(params[0]);
          break;
      }
      
      this.currentStep++;
    },
    
    handleMove(direction) {
      const currentIndex = this.floors.indexOf(this.currentFloor);
      let targetIndex = currentIndex;
      
      if (direction === 'move-up' && currentIndex < this.floors.length - 1) {
        targetIndex = currentIndex + 1;
        this.direction = 'up';
      } else if (direction === 'move-down' && currentIndex > 0) {
        targetIndex = currentIndex - 1;
        this.direction = 'down';
      } else {
        return; // Can't move
      }
      
      const targetFloor = this.floors[targetIndex];
      
      console.log(`Moving ${direction} from ${this.currentFloor} to ${targetFloor}`);
      
      this.generateParticles('movement', 12);
      this.isMoving = true;
      this.activeFloor = targetFloor;
      this.currentFloor = targetFloor;
      
      // Update passengers inside elevator
      this.passengers.forEach(p => {
        if (p.state === 'riding') {
          p.currentLocation = targetFloor;
        }
      });
      
      // Stop moving after animation
      setTimeout(() => {
        this.isMoving = false;
        this.direction = null;
      }, (2000 / this.speed) + 100);
    },
    
    handleLoad(passengerName) {
      const passenger = this.passengers.find(p => p.name === passengerName);
      if (!passenger) return;
      
      console.log(`${passengerName} boarding at ${this.currentFloor}`);
      
      this.generateParticles('load', 8);
      
      // Open doors
      this.doorsOpen = true;
      this.activeFloor = this.currentFloor;
      
      // Start boarding animation
      passenger.state = 'boarding';
      passenger.currentLocation = this.currentFloor;
      this.movingPassenger = passenger;
      
      setTimeout(() => {
        // Passenger enters elevator
        passenger.state = 'riding';
        this.movingPassenger = null;
        
        // Close doors
        setTimeout(() => {
          this.doorsOpen = false;
        }, 500);
      }, 1500);
    },
    
    handleUnload(passengerName) {
      const passenger = this.passengers.find(p => p.name === passengerName);
      if (!passenger) return;
      
      console.log(`${passengerName} exiting at ${this.currentFloor}`);
      
      this.generateParticles('unload', 10);
      
      // Open doors
      this.doorsOpen = true;
      this.activeFloor = this.currentFloor;
      
      // Start exiting animation
      passenger.state = 'exiting';
      passenger.currentLocation = this.currentFloor;
      this.movingPassenger = passenger;
      
      setTimeout(() => {
        // Passenger exits elevator
        passenger.state = 'delivered';
        this.movingPassenger = null;
        this.showSuccessMessage(`${passengerName} delivered successfully!`);
        this.generateParticles('delivery', 15);
        
        // Close doors
        setTimeout(() => {
          this.doorsOpen = false;
        }, 500);
      }, 1500);
    },
    
    handleReached(passengerName) {
      const passenger = this.passengers.find(p => p.name === passengerName);
      if (passenger) {
        passenger.state = 'delivered';
        this.generateParticles('success', 8);
        console.log(`${passengerName} reached destination`);
      }
    },
    
    getWaitingPassengers(floor) {
      return this.passengers.filter(p => 
        p.currentLocation === floor && 
        (p.state === 'waiting' || p.state === 'delivered')
      );
    },
    
    getRidingPassengers() {
      return this.passengers.filter(p => p.state === 'riding');
    },
    
    getActionTime(action) {
      return action.time !== undefined ? action.time : (action.start || 0);
    },
    
    getActionDesc(action) {
      const type = action.type || action.name || '';
      const params = this.parseActionParams(action);
      
      switch (type) {
        case 'move-up':
          return `🛗 Elevator moves up`;
        case 'move-down':
          return `🛗 Elevator moves down`;
        case 'load':
          return `👤 ${params[0]} boards elevator`;
        case 'unload':
          return `👤 ${params[0]} exits elevator`;
        case 'reached':
          return `✅ ${params[0]} reached destination`;
        default:
          return `${type} ${params.join(' ')}`;
      }
    }
  }
}