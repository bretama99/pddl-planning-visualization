<template>
  <div class="logistics-simulator">
    <!-- Header -->
    <div class="header">
      <h3>🚚 Logistics Network</h3>
      <div class="controls">
        <button @click="play" :disabled="isPlaying" class="btn">▶️ Play</button>
        <button @click="pause" :disabled="!isPlaying" class="btn">⏸️ Pause</button>
        <button @click="reset" class="btn">🔄 Reset</button>
        <input type="range" v-model="speed" min="0.5" max="3" step="0.1" class="slider">
        <span>{{speed}}x</span>
      </div>
    </div>

    <!-- Show message if no plan loaded -->
    <div v-if="!actions.length" class="no-plan">
      <h4>No Plan Loaded</h4>
      <p>Please upload a logistics PDDL plan using the common upload area above.</p>
    </div>

    <!-- Simulator content (only show if plan is loaded) -->
    <div v-else>
      <!-- Debug Panel -->
      <div class="debug">
        <strong>Locations:</strong> {{locations.join(', ')}} | 
        <strong>Vehicles:</strong> {{vehicles.join(', ')}} | 
        <strong>Packages:</strong> {{packageList.join(', ')}}
      </div>

      <!-- World Map -->
      <div class="world-map">
        
        <!-- Locations (Cities/Warehouses) -->
        <div 
          v-for="(location, index) in locations" 
          :key="location"
          class="location"
          :class="{ active: activeLocation === location }"
          :style="getLocationPosition(location, index)"
        >
          <div class="location-icon">{{getLocationIcon(location)}}</div>
          <div class="location-name">{{location}}</div>
          
          <!-- Packages at this location -->
          <div class="packages-here">
            <div 
              v-for="pkg in getPackagesAtLocation(location)" 
              :key="pkg.id"
              class="package"
              :class="{ loading: pkg.state === 'loading' }"
            >
              <div class="package-icon">📦</div>
              <div class="package-name">{{pkg.name}}</div>
              <div class="package-dest" v-if="pkg.destination">→ {{pkg.destination}}</div>
            </div>
          </div>
          
          <!-- Package count -->
          <div class="package-count" v-if="getPackagesAtLocation(location).length > 0">
            {{getPackagesAtLocation(location).length}} 📦
          </div>
        </div>

        <!-- Moving Vehicles -->
        <div 
          v-for="vehicle in vehicles" 
          :key="vehicle"
          class="vehicle"
          :class="{ 
            moving: vehicleStates[vehicle]?.moving,
            loading: vehicleStates[vehicle]?.loading 
          }"
          :style="getVehiclePosition(vehicle)"
        >
          <div class="vehicle-icon">{{getVehicleIcon(vehicle)}}</div>
          <div class="vehicle-name">{{vehicle}}</div>
          
          <!-- Cargo being carried -->
          <div class="cargo" v-if="getCargoInVehicle(vehicle).length > 0">
            <div 
              v-for="cargo in getCargoInVehicle(vehicle)" 
              :key="cargo.id"
              class="cargo-item"
            >
              📦
            </div>
          </div>
          
          <!-- Cargo count -->
          <div class="cargo-count" v-if="getCargoInVehicle(vehicle).length > 0">
            {{getCargoInVehicle(vehicle).length}} 📦
          </div>
        </div>

        <!-- Route Lines -->
        <svg class="route-overlay" v-if="activeRoute">
          <line 
            :x1="activeRoute.from.x" 
            :y1="activeRoute.from.y"
            :x2="activeRoute.to.x" 
            :y2="activeRoute.to.y"
            class="route-line"
          />
          <circle 
            :cx="activeRoute.from.x" 
            :cy="activeRoute.from.y" 
            r="8" 
            class="route-start"
          />
          <circle 
            :cx="activeRoute.to.x" 
            :cy="activeRoute.to.y" 
            r="8" 
            class="route-end"
          />
        </svg>

        <!-- Loading Animation -->
        <div 
          v-if="loadingPackage" 
          class="loading-animation"
          :style="loadingAnimationStyle"
        >
          <div class="loading-package">📦 {{loadingPackage.name}}</div>
          <div class="loading-arrow">↗️</div>
        </div>
      </div>

      <!-- Action Timeline -->
      <div class="timeline">
        <h4>Logistics Operations</h4>
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

      <!-- Stats -->
      <div class="stats">
        <div class="stat">
          <span class="label">Active Vehicles:</span>
          <span class="value">{{getActiveVehicles()}}</span>
        </div>
        <div class="stat">
          <span class="label">Packages Delivered:</span>
          <span class="value">{{deliveredPackages}}</span>
        </div>
        <div class="stat">
          <span class="label">Total Distance:</span>
          <span class="value">{{totalDistance.toFixed(0)}} km</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LogisticsSimulator',
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
      
      // Entities
      locations: [],
      vehicles: [],
      packageList: [],
      packages: [],
      
      // Vehicle states
      vehicleStates: {},
      locationPositions: {},
      
      // Animation
      activeLocation: null,
      activeRoute: null,
      loadingPackage: null,
      
      // Stats
      deliveredPackages: 0,
      totalDistance: 0,
      
      // Timer
      timer: null
    }
  },
  computed: {
    loadingAnimationStyle() {
      if (!this.loadingPackage || !this.loadingPackage.location) return {};
      
      const pos = this.locationPositions[this.loadingPackage.location];
      if (!pos) return {};
      
      return {
        left: pos.x + 'px',
        top: pos.y - 50 + 'px'
      };
    }
  },
  watch: {
    actions: { handler: 'initialize', immediate: true },
    entities: { handler: 'initialize', immediate: true }
  },
  methods: {
    initialize() {
      if (!this.actions.length) return;
      
      console.log('Initializing logistics simulator...');
      
      // Extract entities from actions
      this.extractEntities();
      
      // Generate location positions
      this.generateLocationPositions();
      
      // Create packages
      this.createPackages();
      
      // Initialize vehicle states
      this.initializeVehicles();
      
      // Reset state
      this.currentStep = 0;
      this.deliveredPackages = 0;
      this.totalDistance = 0;
      this.activeLocation = null;
      this.activeRoute = null;
      this.loadingPackage = null;
      
      console.log('Initialization complete:', {
        locations: this.locations,
        vehicles: this.vehicles,
        packages: this.packages.length
      });
    },
    
    extractEntities() {
      const locations = new Set();
      const vehicles = new Set();
      const packages = new Set();
      
      // Extract from actions
      this.actions.forEach(action => {
        const type = action.type || action.name || '';
        const params = action.params || (action.parameters ? action.parameters.split(' ') : []);
        
        switch (type) {
          case 'load':
          case 'unload':
            if (params[0]) packages.add(params[0]);
            if (params[1]) vehicles.add(params[1]);
            if (params[2]) locations.add(params[2]);
            break;
          case 'drive':
          case 'fly':
          case 'move':
            if (params[0]) vehicles.add(params[0]);
            if (params[1]) locations.add(params[1]);
            if (params[2]) locations.add(params[2]);
            break;
        }
      });
      
      this.locations = Array.from(locations);
      this.vehicles = Array.from(vehicles);
      this.packageList = Array.from(packages);
      
      // Ensure defaults
      if (this.locations.length === 0) this.locations = ['warehouse1', 'warehouse2', 'city1'];
      if (this.vehicles.length === 0) this.vehicles = ['truck1'];
    },
    
    generateLocationPositions() {
      const mapWidth = 700;
      const mapHeight = 400;
      const margin = 80;
      
      this.locations.forEach((location, index) => {
        // Arrange locations in a grid
        const cols = Math.ceil(Math.sqrt(this.locations.length));
        const rows = Math.ceil(this.locations.length / cols);
        
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const x = margin + (col * (mapWidth - 2 * margin)) / Math.max(cols - 1, 1);
        const y = margin + (row * (mapHeight - 2 * margin)) / Math.max(rows - 1, 1);
        
        this.locationPositions[location] = { x, y };
      });
    },
    
    createPackages() {
      this.packages = [];
      let id = 1;
      
      this.packageList.forEach(name => {
        // Find where this package loads
        const loadAction = this.actions.find(a => {
          const type = a.type || a.name || '';
          const params = a.params || (a.parameters ? a.parameters.split(' ') : []);
          return type === 'load' && params[0] === name;
        });
        
        // Find where it unloads
        const unloadAction = this.actions.find(a => {
          const type = a.type || a.name || '';
          const params = a.params || (a.parameters ? a.parameters.split(' ') : []);
          return type === 'unload' && params[0] === name;
        });
        
        const pkg = {
          id: id++,
          name: name,
          currentLocation: loadAction ? loadAction.params[2] : this.locations[0],
          destination: unloadAction ? unloadAction.params[2] : null,
          state: 'waiting', // waiting, loading, transit, delivered
          vehicle: null
        };
        
        this.packages.push(pkg);
      });
    },
    
    initializeVehicles() {
      this.vehicleStates = {};
      
      this.vehicles.forEach(vehicle => {
        this.vehicleStates[vehicle] = {
          currentLocation: this.locations[0],
          moving: false,
          loading: false,
          x: this.locationPositions[this.locations[0]]?.x || 0,
          y: this.locationPositions[this.locations[0]]?.y || 0
        };
      });
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
        case 'load':
          this.handleLoad(params[0], params[1], params[2]);
          break;
        case 'unload':
          this.handleUnload(params[0], params[1], params[2]);
          break;
        case 'drive':
        case 'fly':
        case 'move':
          this.handleMove(params[0], params[1], params[2]);
          break;
      }
      
      this.currentStep++;
    },
    
    handleLoad(packageName, vehicleName, locationName) {
      const pkg = this.packages.find(p => p.name === packageName);
      const vehicleState = this.vehicleStates[vehicleName];
      
      if (!pkg || !vehicleState) return;
      
      console.log(`Loading ${packageName} onto ${vehicleName} at ${locationName}`);
      
      this.activeLocation = locationName;
      vehicleState.loading = true;
      pkg.state = 'loading';
      this.loadingPackage = { name: packageName, location: locationName };
      
      setTimeout(() => {
        pkg.state = 'transit';
        pkg.vehicle = vehicleName;
        pkg.currentLocation = null; // In vehicle
        vehicleState.loading = false;
        this.loadingPackage = null;
      }, 1500 / this.speed);
    },
    
    handleUnload(packageName, vehicleName, locationName) {
      const pkg = this.packages.find(p => p.name === packageName);
      const vehicleState = this.vehicleStates[vehicleName];
      
      if (!pkg || !vehicleState) return;
      
      console.log(`Unloading ${packageName} from ${vehicleName} at ${locationName}`);
      
      this.activeLocation = locationName;
      vehicleState.loading = true;
      pkg.state = 'loading';
      this.loadingPackage = { name: packageName, location: locationName };
      
      setTimeout(() => {
        pkg.state = 'delivered';
        pkg.vehicle = null;
        pkg.currentLocation = locationName;
        vehicleState.loading = false;
        this.loadingPackage = null;
        this.deliveredPackages++;
      }, 1500 / this.speed);
    },
    
    handleMove(vehicleName, fromLocation, toLocation) {
      const vehicleState = this.vehicleStates[vehicleName];
      
      if (!vehicleState) return;
      
      console.log(`${vehicleName} moving from ${fromLocation} to ${toLocation}`);
      
      const fromPos = this.locationPositions[fromLocation];
      const toPos = this.locationPositions[toLocation];
      
      if (!fromPos || !toPos) return;
      
      // Set up route visualization
      this.activeRoute = { from: fromPos, to: toPos };
      
      // Calculate distance
      const distance = this.calculateDistance(fromPos, toPos);
      this.totalDistance += distance;
      
      // Start movement
      vehicleState.moving = true;
      vehicleState.currentLocation = toLocation;
      
      // Animate vehicle movement
      this.animateVehicleMovement(vehicleName, fromPos, toPos);
      
      // Update packages in vehicle
      this.packages.forEach(pkg => {
        if (pkg.vehicle === vehicleName && pkg.state === 'transit') {
          pkg.currentLocation = toLocation;
        }
      });
      
      setTimeout(() => {
        vehicleState.moving = false;
        this.activeRoute = null;
      }, (3000 / this.speed) + 200);
    },
    
    animateVehicleMovement(vehicleName, fromPos, toPos) {
      const vehicleState = this.vehicleStates[vehicleName];
      const duration = 3000 / this.speed;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing
        const easeProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        vehicleState.x = fromPos.x + (toPos.x - fromPos.x) * easeProgress;
        vehicleState.y = fromPos.y + (toPos.y - fromPos.y) * easeProgress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    },
    
    calculateDistance(fromPos, toPos) {
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      return Math.sqrt(dx * dx + dy * dy) / 3; // Scale for display
    },
    
    getLocationPosition(location) {
      const pos = this.locationPositions[location];
      return pos ? { left: pos.x + 'px', top: pos.y + 'px' } : {};
    },
    
    getVehiclePosition(vehicle) {
      const state = this.vehicleStates[vehicle];
      if (!state) return {};
      
      return {
        left: state.x + 'px',
        top: state.y + 'px',
        transition: state.moving ? `all ${3/this.speed}s ease-in-out` : 'none'
      };
    },
    
    getLocationIcon(location) {
      const name = location.toLowerCase();
      if (name.includes('airport') || name.includes('air')) return '✈️';
      if (name.includes('port') || name.includes('harbor')) return '🚢';
      if (name.includes('warehouse') || name.includes('depot')) return '🏭';
      if (name.includes('city') || name.includes('town')) return '🏙️';
      return '📍';
    },
    
    getVehicleIcon(vehicle) {
      const name = vehicle.toLowerCase();
      if (name.includes('plane') || name.includes('aircraft') || name.includes('air')) return '✈️';
      if (name.includes('ship') || name.includes('boat')) return '🚢';
      if (name.includes('truck') || name.includes('van')) return '🚚';
      if (name.includes('train')) return '🚂';
      return '🚛';
    },
    
    getPackagesAtLocation(location) {
      return this.packages.filter(p => 
        p.currentLocation === location && 
        (p.state === 'waiting' || p.state === 'delivered')
      );
    },
    
    getCargoInVehicle(vehicle) {
      return this.packages.filter(p => 
        p.vehicle === vehicle && p.state === 'transit'
      );
    },
    
    getActiveVehicles() {
      return Object.values(this.vehicleStates).filter(state => state.moving).length;
    },
    
    getActionTime(action) {
      return action.time !== undefined ? action.time : (action.start || 0);
    },
    
    getActionDesc(action) {
      const type = action.type || action.name || '';
      const params = action.params || (action.parameters ? action.parameters.split(' ') : []);
      
      switch (type) {
        case 'load':
          return `📦 ${params[0]} loaded onto ${this.getVehicleIcon(params[1])} ${params[1]} at ${this.getLocationIcon(params[2])} ${params[2]}`;
        case 'unload':
          return `📦 ${params[0]} unloaded from ${this.getVehicleIcon(params[1])} ${params[1]} at ${this.getLocationIcon(params[2])} ${params[2]}`;
        case 'drive':
          return `🚚 ${params[0]} drives from ${this.getLocationIcon(params[1])} ${params[1]} to ${this.getLocationIcon(params[2])} ${params[2]}`;
        case 'fly':
          return `✈️ ${params[0]} flies from ${this.getLocationIcon(params[1])} ${params[1]} to ${this.getLocationIcon(params[2])} ${params[2]}`;
        case 'move':
          return `${this.getVehicleIcon(params[0])} ${params[0]} moves from ${this.getLocationIcon(params[1])} ${params[1]} to ${this.getLocationIcon(params[2])} ${params[2]}`;
        default:
          return `${type} ${params.join(' ')}`;
      }
    }
  }
}
</script>

<style scoped>
.logistics-simulator {
  padding: 20px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.no-plan {
  text-align: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  margin: 20px 0;
}

.no-plan h4 {
  margin: 0 0 10px 0;
  color: #81c784;
}

.no-plan p {
  margin: 0;
  opacity: 0.8;
}

.world-map {
  position: relative;
  width: 100%;
  height: 500px;
  background: linear-gradient(180deg, #87ceeb 0%, #98fb98 100%);
  border-radius: 10px;
  border: 3px solid #20b2aa;
  margin-bottom: 20px;
  overflow: hidden;
}

.location {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  cursor: pointer;
}

.location.active {
  animation: pulse 2s infinite;
}

.location-icon {
  font-size: 32px;
  margin-bottom: 5px;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

.location-name {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  min-width: 60px;
}

.packages-here {
  display: flex;
  gap: 5px;
  margin-top: 8px;
  flex-wrap: wrap;
  max-width: 120px;
  justify-content: center;
}

.package {
  background: rgba(255, 152, 0, 0.8);
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 10px;
  color: white;
  text-align: center;
  transition: all 0.3s ease;
}

.package.loading {
  background: rgba(244, 67, 54, 0.8);
  animation: bounce 1s infinite;
}

.package-icon {
  font-size: 12px;
}

.package-name {
  font-weight: bold;
}

.package-dest {
  font-size: 8px;
  opacity: 0.8;
}

.package-count {
  position: absolute;
  top: -10px;
  right: -10px;
  background: rgba(244, 67, 54, 0.9);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: bold;
}

.vehicle {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.vehicle.moving {
  animation: vehicleMove 1s ease-in-out infinite;
}

.vehicle.loading {
  animation: vehicleLoading 1s ease-in-out infinite;
}

.vehicle-icon {
  font-size: 28px;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

.vehicle-name {
  background: rgba(33, 150, 243, 0.9);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  margin-top: 3px;
}

.cargo {
  display: flex;
  gap: 2px;
  margin-top: 3px;
}

.cargo-item {
  font-size: 12px;
}

.cargo-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: rgba(76, 175, 80, 0.9);
  color: white;
  border-radius: 8px;
  padding: 1px 4px;
  font-size: 8px;
  font-weight: bold;
}

.route-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.route-line {
  stroke: #ff4081;
  stroke-width: 3;
  stroke-dasharray: 10, 5;
  animation: dashMove 2s linear infinite;
}

.route-start {
  fill: #4caf50;
  animation: pulse 1s infinite;
}

.route-end {
  fill: #f44336;
  animation: pulse 1s infinite;
}

.loading-animation {
  position: absolute;
  background: rgba(255, 193, 7, 0.9);
  padding: 8px 12px;
  border-radius: 15px;
  color: white;
  font-weight: bold;
  transform: translate(-50%, -50%);
  animation: loadingBounce 1s ease-in-out infinite;
  z-index: 15;
}

.loading-package {
  font-size: 14px;
}

.loading-arrow {
  font-size: 16px;
  text-align: center;
  margin-top: 4px;
}

.timeline {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
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
  font-size: 14px;
}

.stats {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.stat {
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 20px;
  border-radius: 10px;
  text-align: center;
}

.label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 5px;
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: #81c784;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
  60% { transform: translateY(-3px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes vehicleMove {
  0% { transform: translate(-50%, -50%) rotate(-1deg); }
  50% { transform: translate(-50%, -50%) rotate(1deg); }
  100% { transform: translate(-50%, -50%) rotate(-1deg); }
}

@keyframes vehicleLoading {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes dashMove {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 30; }
}

@keyframes loadingBounce {
  0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
  50% { transform: translate(-50%, -50%) translateY(-10px); }
}
</style>