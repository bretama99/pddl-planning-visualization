// File Path: src/components/visualization/logisticsSimulator.js
// Enhanced Realistic Logistics Simulator with Smooth Movements and Clear Vehicle Types

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export function createLogisticsSimulator(props) {
  console.log('🚚 Creating enhanced realistic logistics simulator:', props)
  
  // State variables
  const isPlaying = ref(false)
  const currentStep = ref(0)
  const playbackSpeed = ref(1)
  const packageLocations = ref({})
  const vehicleLocations = ref({})
  const vehicleCarrying = ref({})
  const activeVehicles = ref(new Set())
  const showSuccess = ref(false)
  const particles = ref([])
  
  // Enhanced movement state with realistic physics
  const movingVehicles = ref(new Set())
  const vehicleMovementProgress = ref({})
  const vehicleTargetLocations = ref({})
  const vehicleStartLocations = ref({})
  const vehicleMovementStartTime = ref({})
  const vehicleRoutes = ref({}) // Store complete route paths
  const vehicleSpeed = ref({}) // Different speeds for trucks vs planes
  const vehicleAltitude = ref({}) // For airplane altitude simulation
  
  // Enhanced cargo handling state
  const loadingVehicles = ref(new Set())
  const loadingProgress = ref({})
  const loadingStartTime = ref({})
  const loadingType = ref({}) // 'loading' or 'unloading'
  const cargoAnimations = ref({}) // Package movement animations
  const cargoTransferring = ref(new Set()) // Packages being transferred
  
  // Vehicle type and status tracking
  const vehicleTypes = ref({}) // 'truck' or 'airplane'
  const vehicleStatus = ref({}) // 'idle', 'moving', 'loading', 'unloading'
  const vehicleDirection = ref({}) // Movement direction for realistic rotation
  
  // Step-by-step action display
  const currentActionDescription = ref('')
  const actionPhase = ref('') // 'starting', 'in-progress', 'completing'
  const actionDetails = ref({})
  
  // PDDL specific state
  const totalCost = ref(0)
  const currentFuel = ref(100)
  const actionStartTime = ref(0)
  const actionProgress = ref(0)
  const vehicleFuel = ref({})

  // Parse actions from props with enhanced extraction
  const parsedActions = computed(() => {
    console.log('🔍 Parsing logistics actions from props:', typeof props.actions, props.actions)
    
    if (!props.actions) return []
    
    if (Array.isArray(props.actions)) {
      return props.actions.map((action, index) => {
        console.log(`🔧 Processing action ${index}:`, action)
        
        const parsed = {
          id: `logistics-${index}`,
          name: action.type || action.name,
          parameters: action.params || action.parameters || [],
          step: action.time || index,
          start: action.start || action.time || 0,
          end: action.end || (action.start || action.time || 0) + (action.duration || 1),
          duration: action.duration || getRealisticDuration(action.type || action.name),
          type: props.pddlType || 'classical',
          cost: action.cost || 1,
          raw: action.originalLine || action.description || `${action.time}: (${action.type})`,
          // Enhanced action details
          actionType: getActionType(action.type || action.name),
          vehicle: extractVehicle(action.params || action.parameters || []),
          package: extractPackage(action.params || action.parameters || []),
          location: extractLocation(action.type || action.name, action.params || action.parameters || []),
          fromLocation: extractFromLocation(action.type || action.name, action.params || action.parameters || []),
          toLocation: extractToLocation(action.type || action.name, action.params || action.parameters || []),
          city: extractCity(action.params || action.parameters || [])
        }
        
        // Set vehicle type based on action
        if (parsed.vehicle) {
          vehicleTypes.value[parsed.vehicle] = parsed.vehicle.includes('tru') ? 'truck' : 
                                              parsed.vehicle.includes('apn') ? 'airplane' : 'vehicle'
        }
        
        return parsed
      })
    }
    
    return []
  })

  // Extract entities with enhanced logistics support
  const logisticsEntities = computed(() => {
    console.log('🔍 Using entities from domain parser:', props.entities)
    
    if (props.entities && typeof props.entities === 'object') {
      const entities = {
        trucks: props.entities.trucks || [],
        airplanes: props.entities.airplanes || [],
        packages: props.entities.packages || [],
        cities: props.entities.cities || [],
        airports: props.entities.airports || [],
        positions: props.entities.positions || [],
        locations: props.entities.locations || [],
        vehicles: props.entities.vehicles || []
      }
      
      if (entities.vehicles.length === 0) {
        entities.vehicles = [...entities.trucks, ...entities.airplanes]
      }
      
      console.log('🚛 Enhanced logistics entities:', entities)
      return entities
    }
    
    // Enhanced fallback
    return {
      trucks: ['tru1', 'tru2'],
      airplanes: ['apn1', 'apn2'],
      packages: ['obj11', 'obj12', 'obj21', 'obj22', 'obj23'],
      cities: ['cit1', 'cit2'],
      airports: ['apt1', 'apt2'],
      positions: ['pos1', 'pos2'],
      locations: ['apt1', 'apt2', 'pos1', 'pos2'],
      vehicles: ['tru1', 'tru2', 'apn1', 'apn2']
    }
  })

  const allLocations = computed(() => logisticsEntities.value.locations)
  const allVehicles = computed(() => logisticsEntities.value.vehicles)
  const allPackages = computed(() => logisticsEntities.value.packages)

  // Computed properties
  const progressPercentage = computed(() => {
    if (!parsedActions.value?.length) return 0
    return (currentStep.value / parsedActions.value.length) * 100
  })

  const currentAction = computed(() => {
    if (!parsedActions.value?.length || currentStep.value >= parsedActions.value.length) return null
    return parsedActions.value[currentStep.value]
  })

  const totalDuration = computed(() => {
    if (!parsedActions.value?.length) return 0
    return parsedActions.value.reduce((total, action) => total + (action.duration || 1), 0)
  })

  // Enhanced realistic movement animation
  let animationFrame = null
  
  function startMovementAnimation() {
    function animate() {
      const now = Date.now()
      
      // Update vehicle movements with realistic physics
      for (const vehicle of movingVehicles.value) {
        updateRealisticVehicleMovement(vehicle, now)
      }
      
      // Update loading/unloading animations
      for (const vehicle of loadingVehicles.value) {
        updateLoadingAnimationSmooth(vehicle, now)
      }
      
      // Update cargo transfer animations with realistic physics
      updateRealisticCargoAnimations(now)
      
      // Update action progress
      if (currentAction.value && actionStartTime.value) {
        const elapsed = (now - actionStartTime.value) / 1000
        const progress = Math.min(100, (elapsed / (currentAction.value.duration || 1)) * 100)
        actionProgress.value = progress
        
        // Update action phase
        if (progress < 25) {
          actionPhase.value = 'starting'
        } else if (progress < 75) {
          actionPhase.value = 'in-progress'
        } else {
          actionPhase.value = 'completing'
        }
      }
      
      // Continue animation if needed
      if (movingVehicles.value.size > 0 || loadingVehicles.value.size > 0 || 
          cargoTransferring.value.size > 0 || isPlaying.value) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
  }

  // Enhanced realistic vehicle movement with different physics for trucks vs planes
  function updateRealisticVehicleMovement(vehicle, now) {
    const startTime = vehicleMovementStartTime.value[vehicle]
    if (!startTime) return
    
    const vehicleType = vehicleTypes.value[vehicle] || 'vehicle'
    const baseDuration = vehicleType === 'airplane' ? 8.0 : 6.0 // Planes take longer but fly direct
    const elapsed = (now - startTime) / 1000
    let progress = Math.min(1, elapsed / baseDuration)
    
    // Different easing for different vehicle types
    if (vehicleType === 'airplane') {
      // Airplanes: slow takeoff, fast cruise, slow landing
      progress = easeAirplaneMovement(progress)
      // Update altitude for realistic flight path
      vehicleAltitude.value[vehicle] = Math.sin(progress * Math.PI) * 30 // Max 30px altitude
    } else {
      // Trucks: realistic acceleration and deceleration
      progress = easeTruckMovement(progress)
      vehicleAltitude.value[vehicle] = 0
    }
    
    vehicleMovementProgress.value[vehicle] = progress
    
    console.log(`🚛 ${vehicle} (${vehicleType}) moving: ${Math.round(progress * 100)}%`)
    
    // Update vehicle status
    vehicleStatus.value[vehicle] = 'moving'
    
    // Complete movement when progress reaches 100%
    if (progress >= 1) {
      completeRealisticVehicleMovement(vehicle)
    }
  }

  // Realistic easing functions for different vehicle types
  function easeAirplaneMovement(t) {
    // Takeoff (slow start), cruise (fast), landing (slow end)
    if (t < 0.2) {
      // Takeoff phase - slow acceleration
      return 2.5 * t * t
    } else if (t < 0.8) {
      // Cruise phase - constant speed
      return 0.1 + 0.8 * (t - 0.2) / 0.6
    } else {
      // Landing phase - slow deceleration
      const landingT = (t - 0.8) / 0.2
      return 0.9 + 0.1 * (2 * landingT - landingT * landingT)
    }
  }

  function easeTruckMovement(t) {
    // Truck movement: realistic acceleration and deceleration
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }

  function updateLoadingAnimationSmooth(vehicle, now) {
    const startTime = loadingStartTime.value[vehicle]
    if (!startTime) return
    
    const vehicleType = vehicleTypes.value[vehicle] || 'vehicle'
    const duration = vehicleType === 'airplane' ? 4.0 : 3.0 // Planes take longer to load
    const elapsed = (now - startTime) / 1000
    let progress = Math.min(1, elapsed / duration)
    
    // Realistic loading curve - faster in middle, slower at start/end
    progress = easeInOutCubic(progress)
    loadingProgress.value[vehicle] = progress
    
    const type = loadingType.value[vehicle]
    vehicleStatus.value[vehicle] = type
    
    console.log(`📦 ${vehicle} (${vehicleType}) ${type} progress: ${Math.round(progress * 100)}%`)
    
    if (progress >= 1) {
      completeLoadingAnimation(vehicle)
    }
  }

  function updateRealisticCargoAnimations(now) {
    for (const [packageId, animation] of Object.entries(cargoAnimations.value)) {
      if (!animation.startTime) continue
      
      const elapsed = (now - animation.startTime) / 1000
      let progress = Math.min(1, elapsed / animation.duration)
      
      // Realistic cargo transfer with arc trajectory
      progress = easeInOutCubic(progress)
      animation.progress = progress
      
      // Add rotation for realistic package tumbling
      animation.rotation = progress * 180 + Math.sin(progress * Math.PI * 4) * 10
      
      console.log(`📦 Package ${packageId} transfer progress: ${Math.round(progress * 100)}%`)
      
      if (progress >= 1) {
        completeCargoAnimation(packageId)
      }
    }
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  function completeRealisticVehicleMovement(vehicle) {
    const targetLocation = vehicleTargetLocations.value[vehicle]
    if (targetLocation) {
      vehicleLocations.value[vehicle] = targetLocation
      console.log(`✅ ${vehicle} completed movement to ${targetLocation}`)
      
      // Create realistic arrival effects
      createRealisticArrivalEffect(vehicle, targetLocation)
    }
    
    // Reset vehicle state
    vehicleStatus.value[vehicle] = 'idle'
    vehicleAltitude.value[vehicle] = 0
    
    // Clean up movement state
    movingVehicles.value.delete(vehicle)
    delete vehicleMovementProgress.value[vehicle]
    delete vehicleTargetLocations.value[vehicle]
    delete vehicleStartLocations.value[vehicle]
    delete vehicleMovementStartTime.value[vehicle]
    delete vehicleRoutes.value[vehicle]
    
    activeVehicles.value.delete(vehicle)
    console.log(`🏁 Movement cleanup completed for ${vehicle}`)
  }

  function completeLoadingAnimation(vehicle) {
    const type = loadingType.value[vehicle]
    console.log(`✅ Completed ${type} animation for ${vehicle}`)
    
    // Reset vehicle status
    vehicleStatus.value[vehicle] = 'idle'
    
    // Clean up loading state
    loadingVehicles.value.delete(vehicle)
    delete loadingProgress.value[vehicle]
    delete loadingStartTime.value[vehicle]
    delete loadingType.value[vehicle]
    
    activeVehicles.value.delete(vehicle)
  }

  function completeCargoAnimation(packageId) {
    const animation = cargoAnimations.value[packageId]
    if (animation && animation.onComplete) {
      animation.onComplete()
    }
    
    delete cargoAnimations.value[packageId]
    cargoTransferring.value.delete(packageId)
    console.log(`📦 Cargo animation completed for ${packageId}`)
  }

  // Enhanced action execution with step-by-step descriptions
  function executeAction(action) {
    console.log(`⚡ Executing realistic action:`, action)
    
    if (!action) return
    
    const actionType = action.actionType || action.name || action.type || ''
    console.log(`🎯 Action type: "${actionType}"`)
    
    // Set detailed action description
    updateActionDescription(action)
    
    if (actionType.includes('load') || actionType === 'load-vehicle' || actionType === 'load-truck') {
      executeRealisticLoadAction(action)
    } else if (actionType.includes('unload') || actionType === 'unload-vehicle' || actionType === 'unload-truck') {
      executeRealisticUnloadAction(action)
    } else if (actionType.includes('drive') || actionType === 'drive-truck') {
      executeRealisticMovementAction(action)
    } else if (actionType.includes('fly') || actionType === 'fly-airplane') {
      executeRealisticMovementAction(action)
    } else {
      console.log(`⚠️ Unknown action type: ${actionType}`)
    }

    // Handle resources for numerical PDDL
    if (props.pddlType === 'numerical') {
      totalCost.value += action.cost || 1
      currentFuel.value = Math.max(0, currentFuel.value - (action.cost || 1))
    }
  }

  function updateActionDescription(action) {
    const vehicle = action.vehicle || 'vehicle'
    const vehicleType = vehicleTypes.value[vehicle] || 'vehicle'
    const packageId = action.package || 'package'
    const fromLocation = action.fromLocation || action.location
    const toLocation = action.toLocation
    
    const vehicleIcon = vehicleType === 'airplane' ? '✈️' : '🚚'
    const locationIcon = fromLocation?.includes('apt') ? '🛫' : '📍'
    
    switch (action.actionType) {
      case 'load-vehicle':
        currentActionDescription.value = `${vehicleIcon} Loading package ${packageId} onto ${vehicleType} ${vehicle} at ${fromLocation} ${locationIcon}`
        actionDetails.value = {
          type: 'loading',
          vehicle,
          vehicleType,
          package: packageId,
          location: fromLocation,
          description: `Crane operator carefully loading ${packageId} into ${vehicleType}`
        }
        break
      case 'unload-vehicle':
        currentActionDescription.value = `${vehicleIcon} Unloading package ${packageId} from ${vehicleType} ${vehicle} at ${fromLocation} ${locationIcon}`
        actionDetails.value = {
          type: 'unloading',
          vehicle,
          vehicleType,
          package: packageId,
          location: fromLocation,
          description: `Carefully unloading ${packageId} from ${vehicleType} at destination`
        }
        break
      case 'drive-truck':
        currentActionDescription.value = `🚚 Truck ${vehicle} driving from ${fromLocation} to ${toLocation}`
        actionDetails.value = {
          type: 'driving',
          vehicle,
          vehicleType: 'truck',
          from: fromLocation,
          to: toLocation,
          description: `Truck traveling via ground transport route`
        }
        break
      case 'fly-airplane':
        currentActionDescription.value = `✈️ Airplane ${vehicle} flying from ${fromLocation} to ${toLocation}`
        actionDetails.value = {
          type: 'flying',
          vehicle,
          vehicleType: 'airplane',
          from: fromLocation,
          to: toLocation,
          description: `Aircraft following air traffic control route`
        }
        break
      default:
        currentActionDescription.value = `⚙️ Executing ${action.name || action.type}`
        actionDetails.value = { type: 'unknown', description: 'Processing action...' }
    }
  }

  function createRealisticCargoAnimation(packageId, fromSource, toTarget, onComplete) {
    cargoTransferring.value.add(packageId)
    cargoAnimations.value[packageId] = {
      fromSource,
      toTarget,
      startTime: Date.now(),
      duration: 2.0, // 2 seconds for realistic cargo handling
      progress: 0,
      rotation: 0,
      onComplete
    }
    
    console.log(`📦 Realistic cargo transfer started: ${packageId} from ${fromSource} to ${toTarget}`)
  }

  function executeRealisticLoadAction(action) {
    const vehicle = action.vehicle || action.parameters?.[1] || action.params?.[1] || 'unknown-vehicle'
    const packageId = action.package || action.parameters?.[0] || action.params?.[0] || 'unknown-package'
    const location = action.location || action.parameters?.[2] || action.params?.[2] || 'unknown-location'
    
    console.log(`📦 REALISTIC LOADING: ${vehicle} loading ${packageId} at ${location}`)
    
    // Ensure correct positioning
    if (vehicleLocations.value[vehicle] !== location) {
      vehicleLocations.value[vehicle] = location
    }
    if (packageLocations.value[packageId] !== location) {
      packageLocations.value[packageId] = location
    }
    
    activeVehicles.value.add(vehicle)
    loadingVehicles.value.add(vehicle)
    loadingType.value[vehicle] = 'loading'
    loadingProgress.value[vehicle] = 0
    loadingStartTime.value[vehicle] = Date.now()
    vehicleStatus.value[vehicle] = 'loading'
    
    createRealisticCargoAnimation(packageId, 'ground', vehicle, () => {
      if (!vehicleCarrying.value[vehicle]) {
        vehicleCarrying.value[vehicle] = []
      }
      vehicleCarrying.value[vehicle].push(packageId)
      delete packageLocations.value[packageId]
      
      console.log(`✅ REALISTIC LOADING COMPLETED: ${vehicle} now carrying ${packageId}`)
      createRealisticLoadingEffect(vehicle, location)
    })
    
    if (!animationFrame) {
      startMovementAnimation()
    }
    
    createActionParticles('loading')
  }

  function executeRealisticUnloadAction(action) {
    const vehicle = action.vehicle || action.parameters?.[1] || action.params?.[1] || 'unknown-vehicle'
    const packageId = action.package || action.parameters?.[0] || action.params?.[0] || 'unknown-package'
    const location = action.location || action.parameters?.[2] || action.params?.[2] || 'unknown-location'
    
    console.log(`📤 REALISTIC UNLOADING: ${vehicle} unloading ${packageId} at ${location}`)
    
    if (vehicleLocations.value[vehicle] !== location) {
      vehicleLocations.value[vehicle] = location
    }
    
    if (!vehicleCarrying.value[vehicle]?.includes(packageId)) {
      if (!vehicleCarrying.value[vehicle]) {
        vehicleCarrying.value[vehicle] = []
      }
      vehicleCarrying.value[vehicle].push(packageId)
    }
    
    activeVehicles.value.add(vehicle)
    loadingVehicles.value.add(vehicle)
    loadingType.value[vehicle] = 'unloading'
    loadingProgress.value[vehicle] = 0
    loadingStartTime.value[vehicle] = Date.now()
    vehicleStatus.value[vehicle] = 'unloading'
    
    createRealisticCargoAnimation(packageId, vehicle, 'ground', () => {
      if (vehicleCarrying.value[vehicle]) {
        vehicleCarrying.value[vehicle] = vehicleCarrying.value[vehicle].filter(pkg => pkg !== packageId)
      }
      packageLocations.value[packageId] = location
      
      console.log(`✅ REALISTIC UNLOADING COMPLETED: ${packageId} now at ${location}`)
      createRealisticUnloadingEffect(vehicle, location)
    })
    
    if (!animationFrame) {
      startMovementAnimation()
    }
    
    createActionParticles('unloading')
  }

  function executeRealisticMovementAction(action) {
    const vehicle = action.vehicle || action.parameters?.[0] || action.params?.[0] || 'unknown-vehicle'
    const fromLocation = action.fromLocation || action.parameters?.[1] || action.params?.[1] || 'unknown-from'
    const toLocation = action.toLocation || action.parameters?.[2] || action.params?.[2] || 'unknown-to'
    
    console.log(`🚛 REALISTIC MOVEMENT: ${vehicle} moving from ${fromLocation} to ${toLocation}`)
    
    if (vehicleLocations.value[vehicle] !== fromLocation) {
      console.warn(`⚠️ Vehicle ${vehicle} corrected from ${vehicleLocations.value[vehicle]} to ${fromLocation}`)
      vehicleLocations.value[vehicle] = fromLocation
    }
    
    const route = generateRealisticRoute(fromLocation, toLocation, vehicleTypes.value[vehicle])
    vehicleRoutes.value[vehicle] = route
    
    vehicleStartLocations.value[vehicle] = fromLocation
    vehicleTargetLocations.value[vehicle] = toLocation
    vehicleMovementProgress.value[vehicle] = 0
    vehicleMovementStartTime.value[vehicle] = Date.now()
    vehicleStatus.value[vehicle] = 'moving'
    
    // Calculate direction for realistic vehicle rotation
    const locationPositions = calculateLocationPositions()
    const startPos = locationPositions[fromLocation]
    const endPos = locationPositions[toLocation]
    if (startPos && endPos) {
      const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x)
      vehicleDirection.value[vehicle] = angle * (180 / Math.PI)
    }
    
    movingVehicles.value.add(vehicle)
    activeVehicles.value.add(vehicle)
    
    console.log(`🎯 REALISTIC MOVEMENT STARTED: ${vehicle} from ${fromLocation} to ${toLocation}`)
    
    if (!animationFrame) {
      startMovementAnimation()
    }
    
    createRealisticDepartureEffect(vehicle, fromLocation)
    createActionParticles('movement')
  }

  function generateRealisticRoute(fromLocation, toLocation, vehicleType) {
    const waypoints = [fromLocation]
    
    if (vehicleType === 'airplane') {
      // Airplanes: takeoff, cruise altitude, approach
      waypoints.push(`${fromLocation}-takeoff`)
      waypoints.push(`${fromLocation}-${toLocation}-cruise`)
      waypoints.push(`${toLocation}-approach`)
    } else {
      // Trucks: follow ground routes with intermediate checkpoints
      if (fromLocation.includes('apt') || toLocation.includes('apt')) {
        waypoints.push(`${fromLocation}-road-checkpoint`)
      }
      waypoints.push(`${fromLocation}-${toLocation}-highway`)
    }
    
    waypoints.push(toLocation)
    return waypoints
  }

  // Enhanced particle effects for realistic feedback
  function createRealisticDepartureEffect(vehicle) {
    const vehicleType = vehicleTypes.value[vehicle]
    const effectType = vehicleType === 'airplane' ? 'takeoff' : 'departure'
    
    for (let i = 0; i < 15; i++) {
      const particle = {
        id: Date.now() + i + Math.random(),
        type: effectType,
        vehicleType,
        x: Math.random() * 100,
        y: Math.random() * 100,
        life: 1,
        size: Math.random() * 6 + 4,
        velocity: vehicleType === 'airplane' ? Math.random() * 3 + 2 : Math.random() * 2 + 1
      }
      particles.value.push(particle)
    }
  }

  function createRealisticArrivalEffect(vehicle) {
    const vehicleType = vehicleTypes.value[vehicle]
    const effectType = vehicleType === 'airplane' ? 'landing' : 'arrival'
    
    for (let i = 0; i < 12; i++) {
      const particle = {
        id: Date.now() + i + Math.random(),
        type: effectType,
        vehicleType,
        x: Math.random() * 100,
        y: Math.random() * 100,
        life: 1,
        size: Math.random() * 8 + 5
      }
      particles.value.push(particle)
    }
  }

  function createRealisticLoadingEffect(vehicle) {
    const vehicleType = vehicleTypes.value[vehicle]
    for (let i = 0; i < 8; i++) {
      const particle = {
        id: Date.now() + i + Math.random(),
        type: 'loading-success',
        vehicleType,
        x: Math.random() * 100,
        y: Math.random() * 100,
        life: 1,
        size: Math.random() * 5 + 3
      }
      particles.value.push(particle)
    }
  }

  function createRealisticUnloadingEffect(vehicle) {
    const vehicleType = vehicleTypes.value[vehicle]
    for (let i = 0; i < 8; i++) {
      const particle = {
        id: Date.now() + i + Math.random(),
        type: 'unloading-success',
        vehicleType,
        x: Math.random() * 100,
        y: Math.random() * 100,
        life: 1,
        size: Math.random() * 5 + 3
      }
      particles.value.push(particle)
    }
  }

  function createActionParticles(actionType = 'default') {
    const particleCount = actionType === 'movement' ? 20 : 10
    
    for (let i = 0; i < particleCount; i++) {
      const particle = {
        id: Date.now() + i + Math.random(),
        type: actionType,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 1,
        size: Math.random() * 8 + 6,
        rotation: Math.random() * 360
      }
      particles.value.push(particle)
      
      setTimeout(() => {
        particles.value = particles.value.filter(p => p.id !== particle.id)
      }, 5000)
    }
  }

  // Helper functions for realistic durations
  function getRealisticDuration(actionType) {
    const type = actionType?.toLowerCase() || ''
    if (type.includes('load') || type.includes('unload')) {
      return type.includes('airplane') ? 4.0 : 3.0
    } else if (type.includes('fly')) {
      return 8.0 // Longer for airplane travel
    } else if (type.includes('drive')) {
      return 6.0 // Medium for truck travel
    }
    return 3.0
  }

  // Enhanced helper functions
  function getVehiclesInLocation(location) {
    return allVehicles.value.filter(vehicle => {
      if (movingVehicles.value.has(vehicle)) {
        return false
      }
      return vehicleLocations.value[vehicle] === location
    })
  }

  function getPackagesInLocation(location) {
    return allPackages.value.filter(pkg => 
      packageLocations.value[pkg] === location && !cargoTransferring.value.has(pkg)
    )
  }

  function isPackageCarried(pkg) {
    return Object.values(vehicleCarrying.value).some(carried => carried.includes(pkg)) ||
           cargoTransferring.value.has(pkg)
  }

  function getVehicleCarrying(vehicle) {
    return vehicleCarrying.value[vehicle] || []
  }

  function isVehicleMoving(vehicle) {
    return movingVehicles.value.has(vehicle)
  }

  function isVehicleLoading(vehicle) {
    return loadingVehicles.value.has(vehicle)
  }

  function getVehicleLoadingProgress(vehicle) {
    return loadingProgress.value[vehicle] || 0
  }

  function getVehicleLoadingType(vehicle) {
    return loadingType.value[vehicle] || 'idle'
  }

  function getVehicleMovementProgress(vehicle) {
    return vehicleMovementProgress.value[vehicle] || 0
  }

  function getCargoAnimation(packageId) {
    return cargoAnimations.value[packageId] || null
  }

  function isCargoTransferring(packageId) {
    return cargoTransferring.value.has(packageId)
  }

  function getVehicleType(vehicle) {
    return vehicleTypes.value[vehicle] || 'vehicle'
  }

  function getVehicleStatus(vehicle) {
    return vehicleStatus.value[vehicle] || 'idle'
  }

  function getVehicleDirection(vehicle) {
    return vehicleDirection.value[vehicle] || 0
  }

  function getVehicleAltitude(vehicle) {
    return vehicleAltitude.value[vehicle] || 0
  }

  // Auto-play with enhanced timing
  let playInterval = null

  watch([isPlaying, playbackSpeed], ([playing, speed]) => {
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
    }

    if (playing && currentStep.value < parsedActions.value.length) {
      const executeNextStep = () => {
        if (currentStep.value < parsedActions.value.length && isPlaying.value) {
          console.log(`🎬 Auto-executing step ${currentStep.value + 1}`)
          stepForward()
          
          // Enhanced timing based on action type
          const action = parsedActions.value[currentStep.value - 1]
          const delay = action ? (action.duration * 1000) / speed : 3000 / speed
          
          setTimeout(() => {
            if (isPlaying.value) {
              executeNextStep()
            }
          }, delay)
        } else {
          isPlaying.value = false
        }
      }
      
      executeNextStep()
    }
  })

  // Enhanced playback control functions
  function togglePlayback() {
    isPlaying.value = !isPlaying.value
    console.log('▶️ Enhanced playback toggled:', isPlaying.value)
    
    if (isPlaying.value && !animationFrame) {
      startMovementAnimation()
    }
  }

  function stepForward() {
    if (currentStep.value < parsedActions.value.length) {
      const action = parsedActions.value[currentStep.value]
      
      console.log(`🎯 Executing enhanced step ${currentStep.value + 1}: ${action.name}`)
      
      // Start action timing
      actionStartTime.value = Date.now()
      actionProgress.value = 0
      actionPhase.value = 'starting'
      
      executeAction(action)
      currentStep.value++
      
      console.log(`📊 Progress: ${currentStep.value}/${parsedActions.value.length}`)
      
      if (currentStep.value >= parsedActions.value.length) {
        showSuccess.value = true
        currentActionDescription.value = '🎉 All logistics operations completed successfully!'
        actionPhase.value = 'completed'
        console.log('🎉 All enhanced logistics actions completed!')
        setTimeout(() => {
          showSuccess.value = false
        }, 5000)
      }
    }
  }

  function resetSimulation() {
    console.log('🔄 Resetting enhanced realistic logistics simulation')
    isPlaying.value = false
    currentStep.value = 0
    
    // Stop animation
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
    
    // Stop auto-play
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
    }
    
    // Clear all enhanced state
    activeVehicles.value.clear()
    movingVehicles.value.clear()
    loadingVehicles.value.clear()
    cargoTransferring.value.clear()
    
    // Clear state objects
    vehicleMovementProgress.value = {}
    vehicleTargetLocations.value = {}
    vehicleStartLocations.value = {}
    vehicleMovementStartTime.value = {}
    vehicleRoutes.value = {}
    vehicleSpeed.value = {}
    vehicleAltitude.value = {}
    loadingProgress.value = {}
    loadingStartTime.value = {}
    loadingType.value = {}
    cargoAnimations.value = {}
    vehicleStatus.value = {}
    vehicleDirection.value = {}
    
    particles.value = []
    totalCost.value = 0
    currentFuel.value = 100
    currentActionDescription.value = ''
    actionPhase.value = ''
    actionDetails.value = {}
    
    initializeRealisticLocations()
  }

  // Enhanced helper functions for action extraction
  function getActionType(actionName) {
    const name = actionName?.toLowerCase() || ''
    if (name.includes('load')) return 'load-vehicle'
    if (name.includes('unload')) return 'unload-vehicle'
    if (name.includes('drive')) return 'drive-truck'
    if (name.includes('fly')) return 'fly-airplane'
    return 'unknown'
  }

  function extractVehicle(params) {
    if (!params || !Array.isArray(params)) return null
    return params.find(p => p && (p.includes('tru') || p.includes('apn') || p.includes('truck') || p.includes('plane'))) || null
  }

  function extractPackage(params) {
    if (!params || !Array.isArray(params)) return null
    return params.find(p => p && (p.includes('obj') || p.includes('package') || p.includes('cargo'))) || null
  }

  function extractLocation(actionName, params) {
    if (!params || !Array.isArray(params)) return null
    
    const name = actionName?.toLowerCase() || ''
    if (name.includes('load') || name.includes('unload')) {
      return params[2] || null
    }
    return null
  }

  function extractFromLocation(actionName, params) {
    if (!params || !Array.isArray(params)) return null
    
    const name = actionName?.toLowerCase() || ''
    if (name.includes('drive') || name.includes('fly')) {
      return params[1] || null
    }
    return null
  }

  function extractToLocation(actionName, params) {
    if (!params || !Array.isArray(params)) return null
    
    const name = actionName?.toLowerCase() || ''
    if (name.includes('drive') || name.includes('fly')) {
      return params[2] || null
    }
    return null
  }

  function extractCity(params) {
    if (!params || !Array.isArray(params)) return null
    return params.find(p => p && p.includes('cit')) || null
  }

  // Enhanced initialization with realistic positioning
  function initializeRealisticLocations() {
    console.log('🏁 Initializing enhanced realistic logistics locations...')

    if (allLocations.value.length === 0) {
      console.log('⚠️ No locations found, using defaults')
      return
    }

    // Initialize vehicle locations with realistic starting positions
    allVehicles.value.forEach(vehicle => {
      let startLocation = allLocations.value[0]
      const vehicleType = vehicle.includes('tru') ? 'truck' : vehicle.includes('apn') ? 'airplane' : 'vehicle'
      vehicleTypes.value[vehicle] = vehicleType
      
      // Find first action for this vehicle to determine starting location
      const vehicleActions = parsedActions.value
        .filter(action => action.vehicle === vehicle)
        .sort((a, b) => a.start - b.start)
      
      if (vehicleActions.length > 0) {
        const firstAction = vehicleActions[0]
        
        if (firstAction.actionType === 'load-vehicle' && firstAction.location) {
          startLocation = firstAction.location
        } else if ((firstAction.actionType === 'drive-truck' || firstAction.actionType === 'fly-airplane') && firstAction.fromLocation) {
          startLocation = firstAction.fromLocation
        } else if (firstAction.location) {
          startLocation = firstAction.location
        }
      } else {
        // Default starting locations based on vehicle type
        if (vehicleType === 'airplane') {
          startLocation = allLocations.value.find(loc => loc.includes('apt')) || allLocations.value[0]
        } else {
          startLocation = allLocations.value.find(loc => loc.includes('pos')) || allLocations.value[0]
        }
      }
      
      vehicleLocations.value[vehicle] = startLocation
      vehicleCarrying.value[vehicle] = []
      vehicleFuel.value[vehicle] = 100
      vehicleStatus.value[vehicle] = 'idle'
      vehicleDirection.value[vehicle] = 0
      vehicleAltitude.value[vehicle] = 0
      
      console.log(`🚚 Vehicle ${vehicle} (${vehicleType}) starts in ${startLocation}`)
    })

    // Initialize package locations with realistic distribution
    allPackages.value.forEach((pkg) => {
      const firstLoadAction = parsedActions.value
        .filter(action => action.actionType === 'load-vehicle' && action.package === pkg)
        .sort((a, b) => a.start - b.start)[0]
      
      if (firstLoadAction && firstLoadAction.location) {
        packageLocations.value[pkg] = firstLoadAction.location
        console.log(`📦 Package ${pkg} starts in ${firstLoadAction.location}`)
      } else {
        // Default to first position location
        const defaultLocation = allLocations.value.find(loc => loc.includes('pos')) || allLocations.value[0]
        packageLocations.value[pkg] = defaultLocation
        console.log(`📦 Package ${pkg} defaults to ${defaultLocation}`)
      }
    })

    console.log('🏁 Enhanced realistic logistics state initialized')
  }

  // Watch for props changes
  watch(() => props.actions, (newActions) => {
    console.log('👀 Actions prop changed:', typeof newActions, newActions)
    resetSimulation()
  }, { immediate: true })

  // Initialize when component mounts
  onMounted(() => {
    console.log('🏗️ Enhanced realistic logistics simulator mounted')
    initializeRealisticLocations()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (playInterval) {
      clearInterval(playInterval)
    }
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
  })

  return {
    // State
    isPlaying,
    currentStep,
    playbackSpeed,
    showSuccess,
    particles,
    totalCost,
    currentFuel,
    actionProgress,
    
    // Enhanced state
    vehicleMovementProgress,
    vehicleTargetLocations,
    vehicleStartLocations,
    loadingProgress,
    loadingType,
    cargoAnimations,
    currentActionDescription,
    actionPhase,
    actionDetails,
    
    // Computed
    progressPercentage,
    currentAction,
    logisticsEntities,
    allLocations,
    allVehicles,
    allPackages,
    totalDuration,
    
    // Methods
    togglePlayback,
    resetSimulation,
    stepForward,
    getVehiclesInLocation,
    getPackagesInLocation,
    isPackageCarried,
    getVehicleCarrying,
    isVehicleMoving,
    isVehicleLoading,
    getVehicleLoadingProgress,
    getVehicleLoadingType,
    getVehicleMovementProgress,
    getCargoAnimation,
    isCargoTransferring,
    getVehicleType,
    getVehicleStatus,
    getVehicleDirection,
    getVehicleAltitude,
    
    // Enhanced helper functions
    getCitiesWithLocations: () => {
      const cities = logisticsEntities.value.cities
      const locations = logisticsEntities.value.locations
      
      return cities.map(city => {
        const cityNum = city.match(/\d+/)?.[0]
        const cityLocations = locations.filter(loc => {
          const locNum = loc.match(/\d+/)?.[0]
          return cityNum === locNum
        })
        
        return {
          name: city,
          locations: cityLocations.length > 0 ? cityLocations : [city + '_pos', city + '_apt']
        }
      })
    },
    
    hasActiveVehicleInCity: (cityName) => {
      const cities = logisticsEntities.value.cities
      const locations = logisticsEntities.value.locations
      
      const cityInfo = cities.map(city => {
        const cityNum = city.match(/\d+/)?.[0]
        const cityLocations = locations.filter(loc => {
          const locNum = loc.match(/\d+/)?.[0]
          return cityNum === locNum
        })
        
        return {
          name: city,
          locations: cityLocations.length > 0 ? cityLocations : [city + '_pos', city + '_apt']
        }
      }).find(c => c.name === cityName)
      
      if (!cityInfo) return false
      
      return cityInfo.locations.some(location => 
        getVehiclesInLocation(location).length > 0 || 
        allVehicles.value.some(v => isVehicleLoading(v) && vehicleLocations.value[v] === location)
      )
    },
    
    hasMovingVehicleInCity: (cityName) => {
      const cities = logisticsEntities.value.cities
      const locations = logisticsEntities.value.locations
      
      const cityInfo = cities.map(city => {
        const cityNum = city.match(/\d+/)?.[0]
        const cityLocations = locations.filter(loc => {
          const locNum = loc.match(/\d+/)?.[0]
          return cityNum === locNum
        })
        
        return {
          name: city,
          locations: cityLocations.length > 0 ? cityLocations : [city + '_pos', city + '_apt']
        }
      }).find(c => c.name === cityName)
      
      if (!cityInfo) return false
      
      return allVehicles.value.some(vehicle => {
        if (isVehicleMoving(vehicle)) {
          const targetLocation = vehicleTargetLocations.value[vehicle]
          const startLocation = vehicleStartLocations.value[vehicle]
          return cityInfo.locations.includes(targetLocation) || cityInfo.locations.includes(startLocation)
        }
        return false
      })
    },
    
    hasMovingVehicleInLocation: (location) => {
      return allVehicles.value.some(vehicle => {
        if (isVehicleMoving(vehicle)) {
          const targetLocation = vehicleTargetLocations.value[vehicle]
          const startLocation = vehicleStartLocations.value[vehicle]
          return location === targetLocation || location === startLocation
        }
        return false
      })
    },
    
    getMovingVehicles: () => {
      return allVehicles.value.filter(vehicle => isVehicleMoving(vehicle))
    },
    
    getLoadingVehicles: () => {
      return allVehicles.value.filter(vehicle => isVehicleLoading(vehicle))
    },
    
    getEnhancedMovingVehicleStyle: (vehicle) => {
      if (!isVehicleMoving(vehicle)) {
        return { display: 'none' }
      }
      
      const progress = getVehicleMovementProgress(vehicle)
      const startLocation = vehicleStartLocations.value[vehicle]
      const targetLocation = vehicleTargetLocations.value[vehicle]
      const vehicleType = getVehicleType(vehicle)
      const direction = getVehicleDirection(vehicle)
      const altitude = getVehicleAltitude(vehicle)
      
      if (!startLocation || !targetLocation) {
        return { display: 'none' }
      }
      
      console.log(`🎯 Enhanced moving ${vehicle} (${vehicleType}): ${startLocation} → ${targetLocation} (${Math.round(progress * 100)}%)`)
      
      // Calculate positions based on location layout
      const locationPositions = calculateLocationPositions()
      
      const startPos = locationPositions[startLocation] || { x: 20, y: 20 }
      const targetPos = locationPositions[targetLocation] || { x: 80, y: 20 }
      
      // Enhanced movement with realistic trajectory
      const route = vehicleRoutes.value[vehicle] || [startLocation, targetLocation]
      const routeProgress = progress * (route.length - 1)
      const currentSegment = Math.floor(routeProgress)
      const segmentProgress = routeProgress - currentSegment
      
      let currentX, currentY
      
      if (currentSegment >= route.length - 1) {
        currentX = targetPos.x
        currentY = targetPos.y
      } else {
        const currentWaypoint = route[currentSegment]
        const nextWaypoint = route[currentSegment + 1]
        
        const currentPos = locationPositions[currentWaypoint] || startPos
        const nextPos = locationPositions[nextWaypoint] || targetPos
        
        currentX = currentPos.x + (nextPos.x - currentPos.x) * segmentProgress
        currentY = currentPos.y + (nextPos.y - currentPos.y) * segmentProgress
        
        // Add realistic vehicle-specific movement effects
        if (vehicleType === 'airplane') {
          // Airplane - smooth flight path with altitude
          currentY -= altitude
          currentY += Math.sin(Date.now() / 800) * 1 // Slight air turbulence
        } else if (vehicleType === 'truck') {
          // Truck - road following with slight bounce
          currentY += Math.sin(Date.now() / 300) * 0.3 // Road vibration
        }
      }
      
      return {
        position: 'absolute',
        left: `${currentX}%`,
        top: `${currentY}%`,
        transform: `translate(-50%, -50%) rotate(${direction}deg) scale(${vehicleType === 'airplane' ? 1.2 : 1})`,
        zIndex: vehicleType === 'airplane' ? 1200 : 1000,
        transition: 'none',
        filter: vehicleType === 'airplane' ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
      }
    },
    
    getPackageIcon: (packageName) => {
      const name = packageName.toLowerCase()
      
      if (name.includes('obj1')) return '📦'
      if (name.includes('obj2')) return '📋'
      if (name.includes('obj3')) return '🎁'
      if (name.includes('obj4')) return '📄'
      if (name.includes('obj5')) return '📊'
      
      return '📦'
    },
    
    getVehicleIcon: (vehicleName) => {
      const vehicleType = getVehicleType(vehicleName)
      if (vehicleType === 'truck' || vehicleName.includes('tru')) return '🚚'
      if (vehicleType === 'airplane' || vehicleName.includes('apn')) return '✈️'
      return '🚐'
    },
    
    getVehicleStatusIcon: (vehicle) => {
      const status = getVehicleStatus(vehicle)
      const vehicleType = getVehicleType(vehicle)
      
      switch (status) {
        case 'moving':
          return vehicleType === 'airplane' ? '🛫' : '🚛'
        case 'loading':
          return '📦⬆️'
        case 'unloading':
          return '📦⬇️'
        case 'idle':
        default:
          return vehicleType === 'airplane' ? '✈️' : '🚚'
      }
    },
    
    // PDDL-specific helper functions
    getCurrentActionForVehicle: (vehicle) => {
      return parsedActions.value.find(action => 
        action.vehicle === vehicle && action.step === currentStep.value
      )
    },
    
    getTotalMakespan: () => {
      if (!parsedActions.value?.length) return 0
      return Math.max(...parsedActions.value.map(action => action.end || action.start + action.duration))
    },
    
    getVehicleFuel: (vehicle) => {
      return vehicleFuel.value[vehicle] || 100
    },
    
    getEfficiencyScore: () => {
      if (props.pddlType !== 'numerical' || !totalCost.value || !currentStep.value) return 100
      const avgCost = totalCost.value / Math.max(1, currentStep.value)
      return Math.max(0, Math.round(100 - (avgCost - 1) * 10))
    },
    
    // Additional state for template
    vehicleLocations,
    packageLocations,
    vehicleCarrying,
    activeVehicles,
    movingVehicles,
    loadingVehicles,
    cargoTransferring,
    vehicleTypes,
    vehicleStatus,
    
    // For debugging
    parsedActions,
    
    // Helper function
    calculateLocationPositions
  }

  // Helper function to calculate location positions with enhanced layout
  function calculateLocationPositions() {
    const positions = {}
    const cities = logisticsEntities.value.cities
    const locations = logisticsEntities.value.locations
    
    cities.forEach((city, cityIndex) => {
      const cityLocations = locations.filter(loc => {
        const cityNum = city.match(/\d+/)?.[0]
        const locNum = loc.match(/\d+/)?.[0]
        return cityNum === locNum
      })
      
      cityLocations.forEach((location, locIndex) => {
        const cityRow = Math.floor(cityIndex / 2)
        const cityCol = cityIndex % 2
        const locRow = Math.floor(locIndex / 2)
        const locCol = locIndex % 2
        
        positions[location] = {
          x: 15 + (cityCol * 40) + (locCol * 12),
          y: 15 + (cityRow * 35) + (locRow * 12)
        }
      })
    })
    
    // Add default positions for any missing locations with better distribution
    locations.forEach((location, index) => {
      if (!positions[location]) {
        positions[location] = {
          x: 20 + (index % 4) * 20,
          y: 20 + Math.floor(index / 4) * 20
        }
      }
    })
    
    return positions
  }
}