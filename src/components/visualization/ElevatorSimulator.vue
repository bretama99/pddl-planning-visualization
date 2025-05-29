<template>
  <div class="elevator-simulator">
    <!-- Header -->
    <div class="header">
      <h3>🛗 Elevator Simulation</h3>
      <div class="controls">
        <button @click="play" :disabled="isPlaying" class="btn">▶️ Play</button>
        <button @click="pause" :disabled="!isPlaying" class="btn">⏸️ Pause</button>
        <button @click="reset" class="btn">🔄 Reset</button>
        <input type="range" v-model="speed" min="0.5" max="3" step="0.1" class="slider">
        <span>{{speed}}x</span>
      </div>
    </div>

    <!-- Debug Panel -->
    <div class="debug">
      <strong>Floors:</strong> {{floors.join(', ')}} | 
      <strong>Elevators:</strong> {{elevators.join(', ')}} | 
      <strong>Passengers:</strong> {{passengerList.join(', ')}}
    </div>

    <!-- Building -->
    <div class="building">
      
      <!-- Floors -->
      <div 
        v-for="(floor, index) in floors" 
        :key="floor"
        class="floor"
        :class="{ active: activeFloor === floor }"
        :style="{ bottom: index * 150 + 'px' }"
      >
        <div class="floor-label">{{floor}}</div>
        
        <!-- Passengers waiting on floor -->
        <div class="waiting-passengers">
          <div 
            v-for="passenger in getWaitingPassengers(floor)" 
            :key="passenger.id"
            class="passenger-waiting"
          >
            <div class="passenger-avatar">👤</div>
            <div class="passenger-name">{{passenger.name}}</div>
            <div class="passenger-dest" v-if="passenger.destination">→ {{passenger.destination}}</div>
          </div>
        </div>
      </div>

      <!-- Elevator -->
      <div class="elevator-shaft">
        <div 
          class="elevator-car"
          :class="{ 
            moving: isMoving,
            'doors-open': doorsOpen 
          }"
          :style="{ 
            bottom: elevatorPosition + 'px',
            transition: isMoving ? `bottom ${2/speed}s ease-in-out` : 'none'
          }"
        >
          <!-- Elevator Interior -->
          <div class="elevator-interior">
            <!-- Floor Display -->
            <div class="floor-display">{{currentFloor}}</div>
            
            <!-- Direction Arrow -->
            <div class="direction" v-if="direction">
              {{direction === 'up' ? '⬆️' : '⬇️'}}
            </div>
            
            <!-- Passengers inside elevator -->
            <div class="inside-passengers">
              <div 
                v-for="passenger in getRidingPassengers()" 
                :key="passenger.id"
                class="passenger-inside"
              >
                <div class="passenger-avatar">👤</div>
                <div class="passenger-name">{{passenger.name}}</div>
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

      <!-- Moving Passenger Animation -->
      <div 
        v-if="movingPassenger" 
        class="moving-passenger"
        :style="movingPassengerStyle"
      >
        <div class="passenger-avatar">👤</div>
        <div class="passenger-name">{{movingPassenger.name}}</div>
      </div>
    </div>

    <!-- Action Timeline -->
    <div class="timeline">
      <h4>Actions</h4>
      <div class="actions">
        <div 
          v-for="(action, index) in actions" 
          :key="index"
          class="action"
          :class="{ 
            current: index === currentStep,
            completed: index < currentStep 
          }"
        >
          <span class="time">{{getActionTime(action)}}</span>
          <span class="desc">{{getActionDesc(action)}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElevatorSimulator',
  props: {
    entities: { type: Object, default: () => ({}) },
    actions: { type: Array, default: () => [] }
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
      
      // Entities
      floors: [],
      elevators: [],
      passengerList: [],
      passengers: [],
      
      // Animation
      activeFloor: null,
      movingPassenger: null,
      
      // Timer
      timer: null
    }
  },
  computed: {
    elevatorPosition() {
      const floorIndex = this.floors.indexOf(this.currentFloor);
      return floorIndex * 150 + 20;
    },
    
    movingPassengerStyle() {
      if (!this.movingPassenger) return {};
      
      const floorIndex = this.floors.indexOf(this.movingPassenger.currentLocation);
      const baseY = floorIndex * 150 + 50;
      
      if (this.movingPassenger.state === 'boarding') {
        return {
          left: '350px',
          bottom: baseY + 'px',
          transform: 'translateX(50px)',
          transition: 'all 1.5s ease-in-out'
        };
      } else if (this.movingPassenger.state === 'exiting') {
        return {
          left: '450px',
          bottom: baseY + 'px',
          transform: 'translateX(-50px)',
          transition: 'all 1.5s ease-in-out'
        };
      }
      
      return {};
    }
  },
  watch: {
    actions: { handler: 'initialize', immediate: true },
    entities: { handler: 'initialize', immediate: true }
  },
  methods: {
    initialize() {
      if (!this.actions.length) return;
      
      console.log('Initializing elevator simulator...');
      
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
      this.activeFloor = null;
      this.movingPassenger = null;
      
      console.log('Initialization complete:', {
        floors: this.floors,
        elevators: this.elevators,
        passengers: this.passengers.length
      });
    },
    
    extractEntities() {
      const floors = new Set();
      const elevators = new Set();
      const passengers = new Set();
      
      // Extract from actions
      this.actions.forEach(action => {
        const type = action.type || action.name || '';
        const params = action.params || (action.parameters ? action.parameters.split(' ') : []);
        
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
          const params = a.params || (a.parameters ? a.parameters.split(' ') : []);
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
      this.initialize();
    },
    
    executeNextAction() {
      if (this.currentStep >= this.actions.length) {
        this.pause();
        return;
      }
      
      const action = this.actions[this.currentStep];
      const type = action.type || action.name || '';
      const params = action.params || (action.parameters ? action.parameters.split(' ') : []);
      
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
      const params = action.params || (action.parameters ? action.parameters.split(' ') : []);
      
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
</script>

<style scoped>
.elevator-simulator {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  color: white;
  font-family: Arial, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slider {
  width: 80px;
  margin: 0 10px;
}

.debug {
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.building {
  position: relative;
  width: 100%;
  height: 600px;
  background: linear-gradient(180deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 10px;
  border: 3px solid #1976d2;
  margin-bottom: 20px;
}

.floor {
  position: absolute;
  left: 0;
  right: 0;
  height: 150px;
  border-top: 2px solid #1976d2;
  display: flex;
  align-items: center;
  padding: 0 20px;
  transition: all 0.3s ease;
}

.floor.active {
  background: rgba(76, 175, 80, 0.3);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
}

.floor-label {
  font-weight: bold;
  color: #1976d2;
  background: white;
  padding: 8px 16px;
  border-radius: 8px;
  margin-right: 20px;
}

.waiting-passengers {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.passenger-waiting {
  background: rgba(33, 150, 243, 0.8);
  padding: 10px;
  border-radius: 15px;
  text-align: center;
  min-width: 80px;
  animation: bounce 2s infinite;
}

.passenger-avatar {
  font-size: 24px;
  margin-bottom: 5px;
}

.passenger-name {
  font-size: 12px;
  font-weight: bold;
}

.passenger-dest {
  font-size: 10px;
  opacity: 0.8;
  margin-top: 2px;
}

.elevator-shaft {
  position: absolute;
  top: 20px;
  bottom: 20px;
  left: 400px;
  width: 120px;
  background: linear-gradient(180deg, #424242 0%, #616161 100%);
  border: 3px solid #757575;
  border-radius: 10px;
}

.elevator-car {
  position: absolute;
  width: 114px;
  height: 130px;
  background: linear-gradient(135deg, #ffd54f 0%, #ffb74d 100%);
  border: 2px solid #ff8f00;
  border-radius: 8px;
  left: 3px;
  transition: all 0.3s ease;
}

.elevator-car.moving {
  animation: shake 0.5s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(255, 193, 7, 0.6);
}

.elevator-interior {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px;
}

.floor-display {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #000;
  color: #4caf50;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.direction {
  position: absolute;
  top: 5px;
  left: 5px;
  font-size: 16px;
  animation: pulse 1s infinite;
}

.inside-passengers {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.passenger-inside {
  text-align: center;
  font-size: 10px;
}

.doors {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 10;
}

.door {
  width: 50%;
  height: 100%;
  background: rgba(144, 164, 174, 0.9);
  border: 1px solid #607d8b;
  transition: transform 1s ease-in-out;
}

.door.open {
  transform: scaleX(0);
}

.door-left.open {
  transform-origin: left;
}

.door-right.open {
  transform-origin: right;
}

.moving-passenger {
  position: absolute;
  text-align: center;
  background: rgba(255, 152, 0, 0.9);
  padding: 8px;
  border-radius: 12px;
  z-index: 20;
  animation: walk 0.5s ease-in-out infinite;
}

.timeline {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  max-height: 200px;
  overflow-y: auto;
}

.timeline h4 {
  margin: 0 0 15px 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action {
  display: flex;
  gap: 15px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.action.completed {
  background: rgba(76, 175, 80, 0.3);
}

.action.current {
  background: rgba(255, 193, 7, 0.3);
  animation: pulse 2s infinite;
}

.time {
  font-weight: bold;
  min-width: 60px;
  color: #81c784;
}

.desc {
  flex: 1;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
}

@keyframes walk {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
</style>