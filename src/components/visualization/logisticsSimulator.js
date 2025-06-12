// File: src/components/visualization/logisticsSimulator.js
// Fixed Dynamic Realistic Logistics Simulator - Part 1 (Lines 1-400)
// Handles Sample Plan Format Dynamically

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export function createLogisticsSimulator(props) {
  console.log('🚚 Creating FIXED dynamic logistics simulator:', props)
  
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

  // FIXED: Enhanced action parsing from props - handles sample plan format
  const parsedActions = computed(() => {
    console.log('🔍 FIXED parsing logistics actions from props:', typeof props.actions, props.actions)
    
    if (!props.actions) return []
    
    if (Array.isArray(props.actions)) {
      return props.actions.map((action, index) => {
        console.log(`🔧 FIXED processing action ${index}:`, action)
        
        const parsed = {
          id: `logistics-${index}`,
          name: action.name || action.type,
          parameters: action.parameters || action.params || [],
          step: action.step || action.time || index,
          start: action.start || action.time || 0,
          end: action.end || (action.start || action.time || 0) + (action.duration || 1),
          duration: action.duration || getRealisticDuration(action.name || action.type),
          type: props.pddlType || 'classical',
          cost: action.cost || 1,
          raw: action.rawLine || action.originalLine || action.description || `${action.time || index}: (${action.name || action.type})`,
          // FIXED: Enhanced action details extraction
          actionType: action.actionType || getActionType(action.name || action.type),
          vehicle: action.vehicle || extractVehicle(action.parameters || action.params || []),
          package: action.package || extractPackage(action.parameters || action.params || []),
          location: action.location || extractLocation(action.name || action.type, action.parameters || action.params || []),
          fromLocation: action.fromLocation || extractFromLocation(action.name || action.type, action.parameters || action.params || []),
          toLocation: action.toLocation || extractToLocation(action.name || action.type, action.parameters || action.params || []),
          city: action.city || extractCity(action.parameters || action.params || [])
        }
        
        // FIXED: Set vehicle type based on action - improved detection
        if (parsed.vehicle) {
          vehicleTypes.value[parsed.vehicle] = determineVehicleType(parsed.vehicle)
        }
        
        return parsed
      })
    }
    
    return []
  })

  // FIXED: Extract entities dynamically from actions and props - improved entity handling
  const logisticsEntities = computed(() => {
    console.log('🔍 FIXED extracting entities dynamically from actions and props:', props.entities)
    
    // Start with empty entities - no defaults
    let entities = {
      trucks: [],
      airplanes: [],
      packages: [],
      cities: [],
      airports: [],
      positions: [],
      locations: [],
      vehicles: []
    }
    
    // Merge with props entities if available - FIXED: better merging
    if (props.entities && typeof props.entities === 'object') {
      entities = {
        trucks: Array.isArray(props.entities.trucks) ? [...props.entities.trucks] : [],
        airplanes: Array.isArray(props.entities.airplanes) ? [...props.entities.airplanes] : [],
        packages: Array.isArray(props.entities.packages) ? [...props.entities.packages] : [],
        cities: Array.isArray(props.entities.cities) ? [...props.entities.cities] : [],
        airports: Array.isArray(props.entities.airports) ? [...props.entities.airports] : [],
        positions: Array.isArray(props.entities.positions) ? [...props.entities.positions] : [],
        locations: Array.isArray(props.entities.locations) ? [...props.entities.locations] : [],
        vehicles: Array.isArray(props.entities.vehicles) ? [...props.entities.vehicles] : []
      }
      console.log('📦 FIXED using props entities:', entities)
    }
    
    // FIXED: Extract dynamically from actions ONLY if props entities are empty
    if (parsedActions.value.length > 0) {
      const extractedEntities = extractEntitiesFromActions(parsedActions.value)
      console.log('🔍 FIXED extracted entities from actions:', extractedEntities)
      
      // Only use extracted entities if props entities are empty - FIXED: better logic
      Object.keys(extractedEntities).forEach(key => {
        if (entities[key].length === 0 && extractedEntities[key].length > 0) {
          entities[key] = [...extractedEntities[key]]
        }
      })
    }
    
    // FIXED: Merge vehicles array if empty - improved merging
    if (entities.vehicles.length === 0) {
      entities.vehicles = [...entities.trucks, ...entities.airplanes]
    }
    
    // FIXED: Merge locations array if empty - improved merging
    if (entities.locations.length === 0) {
      entities.locations = [...entities.positions, ...entities.airports, ...entities.cities]
    }
    
    console.log('🚛 FINAL FIXED logistics entities (DYNAMIC):', entities)
    return entities
  })

  // FIXED: Dynamically extract entities from actions - improved extraction
  function extractEntitiesFromActions(actions) {
    const entities = {
      trucks: new Set(),
      airplanes: new Set(),
      packages: new Set(),
      cities: new Set(),
      airports: new Set(),
      positions: new Set(),
      locations: new Set(),
      vehicles: new Set()
    }
    
    actions.forEach(action => {
      console.log(`🔍 FIXED extracting from action:`, action.name, action.parameters)
      
      // FIXED: Extract vehicles with improved detection
      if (action.vehicle) {
        entities.vehicles.add(action.vehicle)
        const vehicleType = determineVehicleType(action.vehicle)
        if (vehicleType === 'truck') {
          entities.trucks.add(action.vehicle)
        } else if (vehicleType === 'airplane') {
          entities.airplanes.add(action.vehicle)
        }
      }
      
      // FIXED: Extract packages with improved detection
      if (action.package) {
        entities.packages.add(action.package)
      }
      
      // FIXED: Extract locations with improved categorization
      if (action.location) {
        entities.locations.add(action.location)
        categorizeLocationFixed(action.location, entities)
      }
      if (action.fromLocation) {
        entities.locations.add(action.fromLocation)
        categorizeLocationFixed(action.fromLocation, entities)
      }
      if (action.toLocation) {
        entities.locations.add(action.toLocation)
        categorizeLocationFixed(action.toLocation, entities)
      }
      
      // FIXED: Extract cities
      if (action.city) {
        entities.cities.add(action.city)
      }
    })
    
    // FIXED: Convert sets to arrays
    return {
      trucks: Array.from(entities.trucks),
      airplanes: Array.from(entities.airplanes),
      packages: Array.from(entities.packages),
      cities: Array.from(entities.cities),
      airports: Array.from(entities.airports),
      positions: Array.from(entities.positions),
      locations: Array.from(entities.locations),
      vehicles: Array.from(entities.vehicles)
    }
  }
  
  // FIXED: Categorize location based on naming patterns - improved detection
  function categorizeLocationFixed(location, entities) {
    const locationLower = location.toLowerCase()
    
    // FIXED: Better pattern matching for sample plan format
    if (locationLower.startsWith('apt') || locationLower.includes('airport')) {
      entities.airports.add(location)
    } else if (locationLower.startsWith('pos') || locationLower.includes('position')) {
      entities.positions.add(location)
    } else if (locationLower.startsWith('cit') || locationLower.includes('city')) {
      entities.cities.add(location)
    } else if (locationLower.startsWith('loc') || locationLower.includes('location')) {
      entities.positions.add(location) // Treat generic locations as positions
    }
  }
  
  // FIXED: Determine vehicle type from name - improved detection for sample plan
  function determineVehicleType(vehicleName) {
    const nameLower = vehicleName.toLowerCase()
    
    // FIXED: Better pattern matching for sample plan format (tru1, apn1, etc.)
    if (nameLower.startsWith('tru') || nameLower.includes('truck')) return 'truck'
    if (nameLower.startsWith('apn') || nameLower.includes('plane') || nameLower.includes('airplane')) return 'airplane'
    if (nameLower.includes('air') || nameLower.includes('flight')) return 'airplane'
    
    // FIXED: Additional patterns for common naming conventions
    if (nameLower.match(/^truck\d+/) || nameLower.match(/^t\d+/)) return 'truck'
    if (nameLower.match(/^plane\d+/) || nameLower.match(/^p\d+/) || nameLower.match(/^air\d+/)) return 'airplane'
    
    return 'truck' // Default to truck
  }

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
    const baseDuration = getVehicleMovementDuration(vehicleType)
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
    
    console.log(`🚛 FIXED ${vehicle} (${vehicleType}) moving: ${Math.round(progress * 100)}% - elapsed: ${elapsed.toFixed(1)}s`)
    
    // Update vehicle status
    vehicleStatus.value[vehicle] = 'moving'
    
    // Complete movement when progress reaches 100%
    if (progress >= 1) {
      completeRealisticVehicleMovement(vehicle)
    }
  }

  // Get vehicle movement duration based on type
  function getVehicleMovementDuration(vehicleType) {
    if (vehicleType === 'airplane') return 8.0 // Planes take longer but fly direct
    return 6.0 // Trucks
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
    const duration = getLoadingDuration(vehicleType)
    const elapsed = (now - startTime) / 1000
    let progress = Math.min(1, elapsed / duration)
    
    // Realistic loading curve - faster in middle, slower at start/end
    progress = easeInOutCubic(progress)
    loadingProgress.value[vehicle] = progress
    
    const type = loadingType.value[vehicle]
    vehicleStatus.value[vehicle] = type
    
    console.log(`📦 FIXED ${vehicle} (${vehicleType}) ${type} progress: ${Math.round(progress * 100)}%`)
    
    if (progress >= 1) {
      completeLoadingAnimation(vehicle)
    }
  }

  // Get loading duration based on vehicle type
  function getLoadingDuration(vehicleType) {
    if (vehicleType === 'airplane') return 4.0 // Planes take longer to load
    return 3.0 // Trucks
  }
  // File: src/components/visualization/logisticsSimulator.js
// Fixed Dynamic Realistic Logistics Simulator - Part 2 (Lines 401-800)

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
      
      console.log(`📦 FIXED Package ${packageId} transfer progress: ${Math.round(progress * 100)}%`)
      
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
      console.log(`✅ FIXED ${vehicle} completed movement to ${targetLocation}`)
      
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
    console.log(`🏁 FIXED Movement cleanup completed for ${vehicle}`)
  }

  function completeLoadingAnimation(vehicle) {
    const type = loadingType.value[vehicle]
    console.log(`✅ FIXED Completed ${type} animation for ${vehicle}`)
    
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
    console.log(`📦 FIXED Cargo animation completed for ${packageId}`)
  }

  // FIXED: Enhanced action execution with step-by-step descriptions - improved for sample plan
  function executeAction(action) {
    console.log(`⚡ FIXED Executing realistic action:`, action)
    
    if (!action) return
    
    const actionType = action.actionType || action.name || action.type || ''
    console.log(`🎯 FIXED Action type: "${actionType}"`)
    
    // Set detailed action description
    updateActionDescription(action)
    
    // FIXED: Enhanced action routing based on sample plan format
    if (actionType.includes('load') || actionType === 'load-vehicle' || actionType === 'load') {
      executeRealisticLoadAction(action)
    } else if (actionType.includes('unload') || actionType === 'unload-vehicle' || actionType === 'unload') {
      executeRealisticUnloadAction(action)
    } else if (actionType.includes('drive') || actionType === 'drive-truck' || actionType === 'drive') {
      executeRealisticMovementAction(action)
    } else if (actionType.includes('fly') || actionType === 'fly-airplane' || actionType === 'fly') {
      executeRealisticMovementAction(action)
    } else {
      console.log(`⚠️ FIXED Unknown action type: ${actionType}`)
    }

    // Handle resources for numerical PDDL
    if (props.pddlType === 'numerical') {
      totalCost.value += action.cost || 1
      currentFuel.value = Math.max(0, currentFuel.value - (action.cost || 1))
    }
  }

  // FIXED: Update action description with improved formatting for sample plan
  function updateActionDescription(action) {
    const vehicle = action.vehicle || 'vehicle'
    const vehicleType = vehicleTypes.value[vehicle] || determineVehicleType(vehicle)
    const packageId = action.package || 'package'
    const fromLocation = action.fromLocation || action.location
    const toLocation = action.toLocation
    const city = action.city
    
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
      case 'drive-truck': {
        const cityInfo = city ? ` in ${city}` : ''
        currentActionDescription.value = `🚚 Truck ${vehicle} driving from ${fromLocation} to ${toLocation}${cityInfo}`
        actionDetails.value = {
          type: 'driving',
          vehicle,
          vehicleType: 'truck',
          from: fromLocation,
          to: toLocation,
          city: city,
          description: `Truck traveling via ground transport route${cityInfo}`
        }
        break
      }
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
    
    console.log(`📦 FIXED Realistic cargo transfer started: ${packageId} from ${fromSource} to ${toTarget}`)
  }

  // FIXED: Execute realistic load action - improved parameter handling for sample plan
  function executeRealisticLoadAction(action) {
    // FIXED: Better parameter extraction for sample plan format
    const vehicle = action.vehicle || action.parameters?.[1] || action.params?.[1] || 'unknown-vehicle'
    const packageId = action.package || action.parameters?.[0] || action.params?.[0] || 'unknown-package'
    const location = action.location || action.parameters?.[2] || action.params?.[2] || 'unknown-location'
    
    console.log(`📦 FIXED REALISTIC LOADING: ${vehicle} loading ${packageId} at ${location}`)
    
    // FIXED: Ensure correct positioning with validation
    if (vehicleLocations.value[vehicle] !== location) {
      console.log(`🔧 FIXED Correcting vehicle ${vehicle} location from ${vehicleLocations.value[vehicle]} to ${location}`)
      vehicleLocations.value[vehicle] = location
    }
    if (packageLocations.value[packageId] !== location) {
      console.log(`🔧 FIXED Correcting package ${packageId} location from ${packageLocations.value[packageId]} to ${location}`)
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
      
      console.log(`✅ FIXED REALISTIC LOADING COMPLETED: ${vehicle} now carrying ${packageId}`)
      createRealisticLoadingEffect(vehicle, location)
    })
    
    if (!animationFrame) {
      startMovementAnimation()
    }
    
    createActionParticles('loading')
  }

  // FIXED: Execute realistic unload action - improved parameter handling for sample plan
  function executeRealisticUnloadAction(action) {
    // FIXED: Better parameter extraction for sample plan format
    const vehicle = action.vehicle || action.parameters?.[1] || action.params?.[1] || 'unknown-vehicle'
    const packageId = action.package || action.parameters?.[0] || action.params?.[0] || 'unknown-package'
    const location = action.location || action.parameters?.[2] || action.params?.[2] || 'unknown-location'
    
    console.log(`📤 FIXED REALISTIC UNLOADING: ${vehicle} unloading ${packageId} at ${location}`)
    
    // FIXED: Ensure vehicle is at correct location
    if (vehicleLocations.value[vehicle] !== location) {
      console.log(`🔧 FIXED Correcting vehicle ${vehicle} location from ${vehicleLocations.value[vehicle]} to ${location}`)
      vehicleLocations.value[vehicle] = location
    }
    
    // FIXED: Ensure package is in vehicle
    if (!vehicleCarrying.value[vehicle]?.includes(packageId)) {
      if (!vehicleCarrying.value[vehicle]) {
        vehicleCarrying.value[vehicle] = []
      }
      console.log(`🔧 FIXED Adding ${packageId} to ${vehicle} cargo (was missing)`)
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
      
      // File: src/components/visualization/logisticsSimulator.js
// Fixed Dynamic Realistic Logistics Simulator - Part 3 (Lines 801-1200)

      console.log(`✅ FIXED REALISTIC UNLOADING COMPLETED: ${packageId} now at ${location}`)
      createRealisticUnloadingEffect(vehicle, location)
    })
    
    if (!animationFrame) {
      startMovementAnimation()
    }
    
    createActionParticles('unloading')
  }

  // FIXED: Execute realistic movement action - improved parameter handling for sample plan
  function executeRealisticMovementAction(action) {
    // FIXED: Better parameter extraction for sample plan format (handles drive-truck with city parameter)
    const vehicle = action.vehicle || action.parameters?.[0] || action.params?.[0] || 'unknown-vehicle'
    const fromLocation = action.fromLocation || action.parameters?.[1] || action.params?.[1] || 'unknown-from'
    const toLocation = action.toLocation || action.parameters?.[2] || action.params?.[2] || 'unknown-to'
    const city = action.city || action.parameters?.[3] || action.params?.[3] // For drive-truck actions
    
    console.log(`🚛 FIXED REALISTIC MOVEMENT: ${vehicle} moving from ${fromLocation} to ${toLocation}${city ? ` in ${city}` : ''}`)
    
    // FIXED: Validate and correct vehicle starting location
    if (vehicleLocations.value[vehicle] !== fromLocation) {
      console.warn(`⚠️ FIXED Vehicle ${vehicle} corrected from ${vehicleLocations.value[vehicle]} to ${fromLocation}`)
      vehicleLocations.value[vehicle] = fromLocation
    }
    
    // FIXED: Generate realistic route based on vehicle type and locations
    const route = generateRealisticRoute(fromLocation, toLocation, vehicleTypes.value[vehicle], city)
    vehicleRoutes.value[vehicle] = route
    
    vehicleStartLocations.value[vehicle] = fromLocation
    vehicleTargetLocations.value[vehicle] = toLocation
    vehicleMovementProgress.value[vehicle] = 0
    vehicleMovementStartTime.value[vehicle] = Date.now()
    vehicleStatus.value[vehicle] = 'moving'
    
    // FIXED: Calculate direction for realistic vehicle rotation
    const locationPositions = calculateLocationPositions()
    const startPos = locationPositions[fromLocation]
    const endPos = locationPositions[toLocation]
    if (startPos && endPos) {
      const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x)
      vehicleDirection.value[vehicle] = angle * (180 / Math.PI)
    }
    
    movingVehicles.value.add(vehicle)
    activeVehicles.value.add(vehicle)
    
    console.log(`🎯 FIXED REALISTIC MOVEMENT STARTED: ${vehicle} from ${fromLocation} to ${toLocation}`)
    console.log(`📊 Moving vehicles now: ${Array.from(movingVehicles.value)}`)
    console.log(`📊 Movement progress: ${vehicleMovementProgress.value[vehicle]}`)
    console.log(`📊 Movement start time: ${vehicleMovementStartTime.value[vehicle]}`)
    
    if (!animationFrame) {
      console.log(`🎬 FIXED Starting animation frame`)
      startMovementAnimation()
    }
    
    createRealisticDepartureEffect(vehicle, fromLocation)
    createActionParticles('movement')
  }

  // FIXED: Generate realistic route with city consideration
  function generateRealisticRoute(fromLocation, toLocation, vehicleType, city = null) {
    const waypoints = [fromLocation]
    
    if (vehicleType === 'airplane') {
      // Airplanes: takeoff, cruise altitude, approach
      waypoints.push(`${fromLocation}-takeoff`)
      waypoints.push(`${fromLocation}-${toLocation}-cruise`)
      waypoints.push(`${toLocation}-approach`)
    } else {
      // Trucks: follow ground routes with intermediate checkpoints
      if (city) {
        waypoints.push(`${fromLocation}-${city}-checkpoint`)
      }
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

  // FIXED: Helper functions for realistic durations based on action types
  function getRealisticDuration(actionType) {
    const type = actionType?.toLowerCase() || ''
    if (type.includes('load') || type.includes('unload')) {
      return type.includes('airplane') || type.includes('apn') ? 4.0 : 3.0
    } else if (type.includes('fly')) {
      return 8.0 // Longer for airplane travel
    } else if (type.includes('drive')) {
      return 6.0 // Medium for truck travel
    }
    return 3.0
  }

  // FIXED: Enhanced helper functions
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
    return vehicleTypes.value[vehicle] || determineVehicleType(vehicle)
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

  // Auto-play with enhanced timing and better debugging
  let playInterval = null

  watch([isPlaying, playbackSpeed], ([playing, speed]) => {
    console.log('🎭 FIXED Watch triggered - isPlaying:', playing, 'speed:', speed, 'currentStep:', currentStep.value, 'totalActions:', parsedActions.value.length)
    
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
      console.log('🔄 FIXED Cleared existing play interval')
    }

    if (playing && currentStep.value < parsedActions.value.length) {
      console.log('🚀 FIXED Starting action execution loop')
      
      const executeNextStep = () => {
        if (currentStep.value < parsedActions.value.length && isPlaying.value) {
          console.log(`🎬 FIXED Auto-executing step ${currentStep.value + 1}/${parsedActions.value.length}`)
          
          const currentAction = parsedActions.value[currentStep.value]
          console.log('📋 FIXED Current action:', currentAction)
          
          stepForward()
          
          // Enhanced timing based on action type
          const action = parsedActions.value[currentStep.value - 1]
          const delay = action ? (action.duration * 1000) / speed : 3000 / speed
          
          console.log(`⏰ FIXED Next step in ${delay}ms`)
          
          setTimeout(() => {
            if (isPlaying.value) {
              executeNextStep()
            } else {
              console.log('⏹️ FIXED Execution stopped - isPlaying is false')
            }
          }, delay)
        } else {
          console.log('🏁 FIXED Execution finished - stopping playback')
          isPlaying.value = false
        }
      }
      
      // Start immediately
      executeNextStep()
    } else if (playing) {
      console.log('⚠️ FIXED Cannot play - no actions or already at end')
    }
  })

  // FIXED: Enhanced playback control functions
  function togglePlayback() {
    console.log('🎬 FIXED TOGGLE PLAYBACK called, current state:', isPlaying.value)
    
    if (isPlaying.value) {
      // Currently playing, so pause
      isPlaying.value = false
      console.log('⏸️ FIXED Paused simulation')
    } else {
      // Currently paused, so play
      isPlaying.value = true
      console.log('▶️ FIXED Starting simulation with', parsedActions.value.length, 'actions')
      
      // Start the animation loop if not already running
      if (!animationFrame) {
        startMovementAnimation()
      }
    }
  }

  function stepForward() {
    if (currentStep.value < parsedActions.value.length) {
      const action = parsedActions.value[currentStep.value]
      
      console.log(`🎯 FIXED Executing enhanced step ${currentStep.value + 1}: ${action.name}`)
      
      // Start action timing
      actionStartTime.value = Date.now()
      actionProgress.value = 0
      actionPhase.value = 'starting'
      
      executeAction(action)
      currentStep.value++
      
      console.log(`📊 FIXED Progress: ${currentStep.value}/${parsedActions.value.length}`)
      
      if (currentStep.value >= parsedActions.value.length) {
        showSuccess.value = true
        currentActionDescription.value = '🎉 All logistics operations completed successfully!'
        actionPhase.value = 'completed'
        console.log('🎉 FIXED All enhanced logistics actions completed!')
        setTimeout(() => {
          showSuccess.value = false
        }, 5000)
      }
    }
  }
  // File: src/components/visualization/logisticsSimulator.js
// Fixed Dynamic Realistic Logistics Simulator - Part 4 (Lines 1201-1600)

  function resetSimulation() {
    console.log('🔄 FIXED Resetting enhanced realistic logistics simulation')
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

  // FIXED: Enhanced helper functions for action extraction - improved for sample plan
  function getActionType(actionName) {
    const name = actionName?.toLowerCase() || ''
    if (name.includes('load') || name === 'load-vehicle') return 'load-vehicle'
    if (name.includes('unload') || name === 'unload-vehicle') return 'unload-vehicle'
    if (name.includes('drive') || name === 'drive-truck') return 'drive-truck'
    if (name.includes('fly') || name === 'fly-airplane') return 'fly-airplane'
    return 'unknown'
  }

  // FIXED: Extract vehicle from parameters - improved pattern matching
  function extractVehicle(params) {
    if (!params || !Array.isArray(params)) return null
    // Look for vehicle patterns: tru1, apn1, truck1, airplane1, etc.
    return params.find(p => p && (
      p.match(/^tru\d+/) || p.match(/^apn\d+/) || 
      p.includes('truck') || p.includes('plane') || p.includes('airplane') ||
      p.match(/^truck\d+/) || p.match(/^plane\d+/)
    )) || null
  }

  // FIXED: Extract package from parameters - improved pattern matching
  function extractPackage(params) {
    if (!params || !Array.isArray(params)) return null
    // Look for package patterns: obj12, package1, pkg1, etc.
    return params.find(p => p && (
      p.match(/^obj\d+/) || p.includes('package') || p.includes('cargo') ||
      p.match(/^package\d+/) || p.match(/^pkg\d+/) || p.match(/^cargo\d+/)
    )) || null
  }

  // FIXED: Extract location for load/unload actions
  function extractLocation(actionName, params) {
    if (!params || !Array.isArray(params)) return null
    
    const name = actionName?.toLowerCase() || ''
    if (name.includes('load') || name.includes('unload')) {
      return params[2] || null // Third parameter is location for load/unload
    }
    return null
  }

  // FIXED: Extract from location for movement actions
  function extractFromLocation(actionName, params) {
    if (!params || !Array.isArray(params)) return null
    
    const name = actionName?.toLowerCase() || ''
    if (name.includes('drive') || name.includes('fly')) {
      return params[1] || null // Second parameter is from location for drive/fly
    }
    return null
  }

  // FIXED: Extract to location for movement actions
  function extractToLocation(actionName, params) {
    if (!params || !Array.isArray(params)) return null
    
    const name = actionName?.toLowerCase() || ''
    if (name.includes('drive') || name.includes('fly')) {
      return params[2] || null // Third parameter is to location for drive/fly
    }
    return null
  }

  // FIXED: Extract city for drive-truck actions (4th parameter)
  function extractCity(params) {
    if (!params || !Array.isArray(params)) return null
    // Look for city patterns: cit1, city1, etc. (usually 4th parameter for drive-truck)
    return params.find(p => p && (
      p.match(/^cit\d+/) || p.includes('city') || p.match(/^city\d+/)
    )) || null
  }

  // FIXED: Enhanced initialization with realistic positioning - improved for sample plan
  function initializeRealisticLocations() {
    console.log('🏁 FIXED Initializing enhanced realistic logistics locations...')
    console.log('📊 FIXED Available data:', {
      allVehicles: allVehicles.value,
      allPackages: allPackages.value,
      allLocations: allLocations.value,
      parsedActionsCount: parsedActions.value.length
    })

    if (allLocations.value.length === 0) {
      console.warn('⚠️ FIXED NO LOCATIONS FOUND - cannot initialize')
      return
    }

    if (allVehicles.value.length === 0) {
      console.warn('⚠️ FIXED NO VEHICLES FOUND - cannot initialize')
      return
    }

    // FIXED: Initialize vehicle locations with realistic starting positions
    allVehicles.value.forEach(vehicle => {
      let startLocation = allLocations.value[0]
      const vehicleType = getVehicleType(vehicle)
      
      console.log(`🚚 FIXED Initializing vehicle ${vehicle} (${vehicleType})...`)
      
      // FIXED: Find first action for this vehicle to determine starting location
      const vehicleActions = parsedActions.value
        .filter(action => action.vehicle === vehicle)
        .sort((a, b) => (a.start || a.time || 0) - (b.start || b.time || 0))
      
      console.log(`📋 FIXED Found ${vehicleActions.length} actions for ${vehicle}:`, vehicleActions.map(a => a.actionType))
      
      if (vehicleActions.length > 0) {
        const firstAction = vehicleActions[0]
        
        if (firstAction.actionType === 'load-vehicle' && firstAction.location) {
          startLocation = firstAction.location
        } else if ((firstAction.actionType === 'drive-truck' || firstAction.actionType === 'fly-airplane') && firstAction.fromLocation) {
          startLocation = firstAction.fromLocation
        } else if (firstAction.location) {
          startLocation = firstAction.location
        } else if (firstAction.fromLocation) {
          startLocation = firstAction.fromLocation
        }
      } else {
        // FIXED: Better fallback logic based on vehicle type
        console.warn(`⚠️ FIXED No actions found for vehicle ${vehicle} - using intelligent fallback`)
        if (vehicleType === 'airplane') {
          // Airplanes start at airports
          const airports = allLocations.value.filter(loc => loc.includes('apt'))
          startLocation = airports.length > 0 ? airports[0] : allLocations.value[0]
        } else {
          // Trucks can start at positions
          const positions = allLocations.value.filter(loc => loc.includes('pos'))
          startLocation = positions.length > 0 ? positions[0] : allLocations.value[0]
        }
      }
      
      vehicleLocations.value[vehicle] = startLocation
      vehicleCarrying.value[vehicle] = []
      vehicleFuel.value[vehicle] = 100
      vehicleStatus.value[vehicle] = 'idle'
      vehicleDirection.value[vehicle] = 0
      vehicleAltitude.value[vehicle] = 0
      
      console.log(`✅ FIXED Vehicle ${vehicle} (${vehicleType}) starts in ${startLocation}`)
    })

    // FIXED: Initialize package locations with realistic distribution
    allPackages.value.forEach((pkg) => {
      const firstLoadAction = parsedActions.value
        .filter(action => action.actionType === 'load-vehicle' && action.package === pkg)
        .sort((a, b) => (a.start || a.time || 0) - (b.start || b.time || 0))[0]
      
      if (firstLoadAction && firstLoadAction.location) {
        packageLocations.value[pkg] = firstLoadAction.location
        console.log(`📦 FIXED Package ${pkg} starts in ${firstLoadAction.location}`)
      } else {
        // FIXED: Better fallback - place at positions preferentially
        console.warn(`⚠️ FIXED No load action found for package ${pkg} - placing intelligently`)
        const positions = allLocations.value.filter(loc => loc.includes('pos'))
        packageLocations.value[pkg] = positions.length > 0 ? positions[0] : allLocations.value[0]
        console.log(`📦 FIXED Package ${pkg} placed at ${packageLocations.value[pkg]} (fallback)`)
      }
    })

    console.log('🏁 FIXED Final state after initialization:', {
      vehicleLocations: vehicleLocations.value,
      packageLocations: packageLocations.value,
      vehicleTypes: vehicleTypes.value
    })
  }

  // Watch for props changes
  watch(() => props.actions, (newActions) => {
    console.log('👀 FIXED Actions prop changed:', typeof newActions, newActions)
    resetSimulation()
  }, { immediate: true })

  // Initialize when component mounts
  onMounted(() => {
    console.log('🏗️ FIXED Enhanced realistic logistics simulator mounted')
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
    
    // FIXED: Enhanced helper functions for cities and locations - improved for sample plan
    getCitiesWithLocations: () => {
      const cities = logisticsEntities.value.cities
      const locations = logisticsEntities.value.locations
      
      console.log('🏙️ FIXED getCitiesWithLocations called:', { cities, locations })
      
      if (cities.length === 0 && locations.length === 0) {
        console.warn('⚠️ FIXED NO CITIES OR LOCATIONS FOUND - showing empty state')
        return []
      }
      
      if (cities.length === 0) {
        // FIXED: If no explicit cities, create from locations with better inference
        const inferredCities = new Set()
        locations.forEach(loc => {
          const cityMatch = loc.match(/cit\d+/) || loc.match(/city\d+/)
          if (cityMatch) {
            inferredCities.add(cityMatch[0])
          } else {
            // FIXED: Extract number from location and create city
            const numMatch = loc.match(/\d+/)
            if (numMatch) {
              inferredCities.add(`cit${numMatch[0]}`)
            }
          }
        })
        
        console.log('🔍 FIXED Inferred cities from locations:', Array.from(inferredCities))
        
        return Array.from(inferredCities).map(city => {
          const cityNum = city.match(/\d+/)?.[0]
          const cityLocations = locations.filter(loc => {
            const locNum = loc.match(/\d+/)?.[0]
            return cityNum === locNum
          })
          
          return {
            name: city,
            locations: cityLocations.length > 0 ? cityLocations : [locations[0] || 'default']
          }
        })
      }
      
      // FIXED: Map cities to their locations
      const result = cities.map(city => {
        const cityNum = city.match(/\d+/)?.[0]
        const cityLocations = locations.filter(loc => {
          const locNum = loc.match(/\d+/)?.[0]
          return cityNum === locNum
        })
        
        return {
          name: city,
          locations: cityLocations.length > 0 ? cityLocations : []
        }
      })
      
      console.log('🏙️ FIXED Final cities with locations:', result)
      return result
    },

    // File: src/components/visualization/logisticsSimulator.js
// Fixed Dynamic Realistic Logistics Simulator - Part 5 (Lines 1601-End)

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
      const movingList = allVehicles.value.filter(vehicle => isVehicleMoving(vehicle))
      console.log(`🚗 FIXED getMovingVehicles called: ${movingList.length} vehicles moving:`, movingList)
      return movingList
    },
    
    getLoadingVehicles: () => {
      return allVehicles.value.filter(vehicle => isVehicleLoading(vehicle))
    },
    
    // FIXED: Enhanced moving vehicle style with improved positioning for sample plan
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
        console.warn(`⚠️ FIXED Missing locations for moving vehicle ${vehicle}:`, { startLocation, targetLocation })
        return { display: 'none' }
      }
      
      console.log(`🎯 FIXED Styling moving ${vehicle} (${vehicleType}): ${startLocation} → ${targetLocation} (${Math.round(progress * 100)}%)`)
      
      // FIXED: Calculate positions based on location layout
      const locationPositions = calculateLocationPositions()
      
      const startPos = locationPositions[startLocation] || { x: 20, y: 20 }
      const targetPos = locationPositions[targetLocation] || { x: 80, y: 20 }
      
      console.log(`📍 FIXED Positions: start=${JSON.stringify(startPos)}, target=${JSON.stringify(targetPos)}`)
      
      // FIXED: Enhanced movement with realistic trajectory
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
        
        // FIXED: Add realistic vehicle-specific movement effects
        if (vehicleType === 'airplane') {
          // Airplane - smooth flight path with altitude
          currentY -= altitude
          currentY += Math.sin(Date.now() / 800) * 1 // Slight air turbulence
        } else if (vehicleType === 'truck') {
          // Truck - road following with slight bounce
          currentY += Math.sin(Date.now() / 300) * 0.3 // Road vibration
        }
      }
      
      console.log(`🎨 FIXED Final position: x=${currentX}%, y=${currentY}%`)
      
      return {
        position: 'absolute',
        left: `${currentX}%`,
        top: `${currentY}%`,
        transform: `translate(-50%, -50%) rotate(${direction}deg) scale(${vehicleType === 'airplane' ? 1.2 : 1})`,
        zIndex: vehicleType === 'airplane' ? 1200 : 1000,
        transition: 'none',
        filter: vehicleType === 'airplane' ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
        // FIXED: FORCE VISIBILITY
        opacity: 1,
        display: 'block',
        visibility: 'visible'
      }
    },
    
    // FIXED: Enhanced icon functions with better recognition for sample plan
    getPackageIcon: (packageName) => {
      const name = packageName.toLowerCase()
      
      // FIXED: Better pattern matching for sample plan format (obj12, obj21, etc.)
      if (name.includes('obj1')) return '📦'
      if (name.includes('obj2')) return '📋'
      if (name.includes('obj3')) return '🎁'
      if (name.includes('obj4')) return '📄'
      if (name.includes('obj5')) return '📊'
      
      // FIXED: Additional patterns
      if (name.match(/obj\d*1$/)) return '📦'
      if (name.match(/obj\d*2$/)) return '📋'
      if (name.match(/obj\d*3$/)) return '🎁'
      
      return '📦'
    },
    
    getVehicleIcon: (vehicleName) => {
      const vehicleType = getVehicleType(vehicleName)
      
      // FIXED: Better icon selection based on type
      if (vehicleType === 'truck' || vehicleName.toLowerCase().startsWith('tru')) return '🚚'
      if (vehicleType === 'airplane' || vehicleName.toLowerCase().startsWith('apn')) return '✈️'
      
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
    
    // FIXED: PDDL-specific helper functions
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
    
    // FIXED: Enhanced helper function for location positioning
    calculateLocationPositions
  }

  // FIXED: Helper function to calculate location positions with enhanced layout for sample plan
  function calculateLocationPositions() {
    const positions = {}
    const cities = logisticsEntities.value.cities
    const locations = logisticsEntities.value.locations
    
    console.log(`📍 FIXED Calculating positions for ${cities.length} cities and ${locations.length} locations`)
    
    if (cities.length > 0) {
      // FIXED: Better city-based layout for sample plan (cit1, cit2, cit3, cit4)
      cities.forEach((city, cityIndex) => {
        const cityLocations = locations.filter(loc => {
          const cityNum = city.match(/\d+/)?.[0]
          const locNum = loc.match(/\d+/)?.[0]
          return cityNum === locNum
        })
        
        // FIXED: Improved city positioning - 2x2 grid for 4 cities
        const cityRow = Math.floor(cityIndex / 2)
        const cityCol = cityIndex % 2
        
        cityLocations.forEach((location, locIndex) => {
          const locRow = Math.floor(locIndex / 2)
          const locCol = locIndex % 2
          
          // FIXED: Better spacing and positioning
          positions[location] = {
            x: 15 + (cityCol * 35) + (locCol * 15),
            y: 15 + (cityRow * 35) + (locRow * 15)
          }
        })
      })
    } else {
      // FIXED: Fallback for locations without explicit cities - improved layout
      locations.forEach((location, index) => {
        // FIXED: Group by location type for better organization
        const isAirport = location.includes('apt')
        const isPosition = location.includes('pos')
        
        if (isAirport) {
          // Airports in top row
          positions[location] = {
            x: 20 + (index % 4) * 20,
            y: 10
          }
        } else if (isPosition) {
          // Positions in bottom row
          positions[location] = {
            x: 20 + (index % 4) * 20,
            y: 30
          }
        } else {
          // Other locations distributed
          positions[location] = {
            x: 20 + (index % 4) * 20,
            y: 20 + Math.floor(index / 4) * 20
          }
        }
      })
    }
    
    // FIXED: Ensure we have at least some default positions
    if (Object.keys(positions).length === 0) {
      console.warn('⚠️ FIXED No positions calculated, creating defaults')
      locations.forEach((location, index) => {
        positions[location] = {
          x: 25 + (index % 3) * 25,
          y: 25 + Math.floor(index / 3) * 25
        }
      })
    }
    
    console.log('📍 FIXED Calculated positions:', positions)
    return positions
  }
}

console.log('✅ FIXED Dynamic Realistic Logistics Simulator loaded - handles sample plan format')