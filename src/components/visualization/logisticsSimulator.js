// File Path: src/components/visualization/logisticsSimulator.js
// Enhanced Logistics Simulator with Realistic Vehicle Movement and Cargo Handling

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export function createLogisticsSimulator(props) {
  console.log('🚚 Creating enhanced logistics simulator:', props)
  
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
  
  // Enhanced movement state
  const movingVehicles = ref(new Set())
  const vehicleMovementProgress = ref({})
  const vehicleTargetLocations = ref({})
  const vehicleStartLocations = ref({})
  const vehicleMovementStartTime = ref({})
  const vehicleRoutes = ref({}) // Store complete route paths
  const vehicleCurrentRoute = ref({}) // Current route segment
  
  // Loading/Unloading animation state
  const loadingVehicles = ref(new Set())
  const loadingProgress = ref({})
  const loadingStartTime = ref({})
  const loadingType = ref({}) // 'loading' or 'unloading'
  
  // Cargo visualization state
  const cargoAnimations = ref({}) // Package movement animations
  const cargoTransferring = ref(new Set()) // Packages being transferred
  
  // PDDL specific state
  const totalCost = ref(0)
  const currentFuel = ref(100)
  const actionStartTime = ref(0)
  const actionProgress = ref(0)
  const vehicleFuel = ref({})

  // Parse actions from props
  const parsedActions = computed(() => {
    console.log('🔍 Parsing logistics actions from props:', typeof props.actions, props.actions)
    
    if (!props.actions) return []
    
    if (Array.isArray(props.actions)) {
      return props.actions.map((action, index) => ({
        id: `logistics-${index}`,
        name: action.type || action.name,
        parameters: action.params || action.parameters || [],
        step: action.time || index,
        start: action.start || action.time || 0,
        end: action.end || (action.start || action.time || 0) + (action.duration || 1),
        duration: action.duration || 1,
        type: props.pddlType || 'classical',
        cost: action.cost || 1,
        raw: action.originalLine || action.description || `${action.time}: (${action.type})`,
        // Extract action details
        actionType: getActionType(action.type || action.name),
        vehicle: extractVehicle(action.params || action.parameters || []),
        package: extractPackage(action.params || action.parameters || []),
        location: extractLocation(action.params || action.parameters || []),
        fromLocation: extractFromLocation(action.type || action.name, action.params || action.parameters || []),
        toLocation: extractToLocation(action.type || action.name, action.params || action.parameters || []),
        city: extractCity(action.params || action.parameters || [])
      }))
    }
    
    if (typeof props.actions === 'string') {
      console.log('📝 Parsing raw string content')
      // Use a simple parser instead of undefined function
      return []
    }
    
    console.log('⚠️ Unknown actions format, returning empty array')
    return []
  })

  // Extract entities - using existing domain parser system
  const logisticsEntities = computed(() => {
    console.log('🔍 Using entities from domain parser:', props.entities)
    
    // Use entities directly from domainParsers.js
    if (props.entities && typeof props.entities === 'object') {
      return {
        trucks: props.entities.trucks || [],
        airplanes: props.entities.airplanes || [],
        packages: props.entities.packages || [],
        cities: props.entities.cities || [],
        airports: props.entities.airports || [],
        positions: props.entities.positions || [],
        locations: props.entities.locations || [],
        vehicles: props.entities.vehicles || []
      }
    }
    
    // Fallback if no entities provided
    return {
      trucks: ['truck1'],
      airplanes: ['airplane1'],
      packages: ['obj1', 'obj2'],
      cities: ['city1', 'city2'],
      airports: ['airport1', 'airport2'],
      positions: ['pos1', 'pos2'],
      locations: ['airport1', 'airport2', 'pos1', 'pos2'],
      vehicles: ['truck1', 'airplane1']
    }
  })

  const allLocations = computed(() => logisticsEntities.value.locations)
  const allVehicles = computed(() => [...logisticsEntities.value.trucks, ...logisticsEntities.value.airplanes])
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

  // Enhanced movement animation with smooth interpolation
  let animationFrame = null
  
  function startMovementAnimation() {
    function animate() {
      const now = Date.now()
      
      // Update vehicle movements with smooth interpolation
      for (const vehicle of movingVehicles.value) {
        updateVehicleMovementSmooth(vehicle, now)
      }
      
      // Update loading/unloading animations
      for (const vehicle of loadingVehicles.value) {
        updateLoadingAnimationSmooth(vehicle, now)
      }
      
      // Update cargo transfer animations
      updateCargoAnimationsSmooth(now)
      
      // Update action progress
      if (currentAction.value && actionStartTime.value) {
        const elapsed = (now - actionStartTime.value) / 1000
        const progress = Math.min(100, (elapsed / (currentAction.value.duration || 1)) * 100)
        actionProgress.value = progress
      }
      
      // Continue animation if needed
      if (movingVehicles.value.size > 0 || loadingVehicles.value.size > 0 || 
          cargoTransferring.value.size > 0 || isPlaying.value) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
  }

  function updateVehicleMovementSmooth(vehicle, now) {
    const startTime = vehicleMovementStartTime.value[vehicle]
    if (!startTime) return
    
    const elapsed = (now - startTime) / 1000
    const totalDuration = 4.0 // Fixed 4 seconds for smooth movement
    let progress = Math.min(1, elapsed / totalDuration)
    
    // Apply smooth easing - starts slow, speeds up, then slows down
    progress = easeInOutCubic(progress)
    vehicleMovementProgress.value[vehicle] = progress
    
    // Get current movement action for this vehicle
    const currentMovement = getCurrentMovementAction(vehicle)
    if (currentMovement) {
      console.log(`🚛 ${vehicle} moving (${currentMovement.type}): ${Math.round(progress * 100)}%`)
    }
    
    // Complete movement when progress reaches 100%
    if (progress >= 1) {
      completeVehicleMovement(vehicle)
    }
  }

  function updateLoadingAnimationSmooth(vehicle, now) {
    const startTime = loadingStartTime.value[vehicle]
    if (!startTime) return
    
    const elapsed = (now - startTime) / 1000
    const duration = 3.0 // 3 seconds for loading/unloading
    let progress = Math.min(1, elapsed / duration)
    
    // Apply smooth easing
    progress = easeInOutCubic(progress)
    loadingProgress.value[vehicle] = progress
    
    console.log(`📦 ${vehicle} ${loadingType.value[vehicle]} progress: ${Math.round(progress * 100)}%`)
    
    if (progress >= 1) {
      completeLoadingAnimation(vehicle)
    }
  }

  function updateCargoAnimationsSmooth(now) {
    for (const [packageId, animation] of Object.entries(cargoAnimations.value)) {
      if (!animation.startTime) continue
      
      const elapsed = (now - animation.startTime) / 1000
      let progress = Math.min(1, elapsed / animation.duration)
      
      // Apply smooth easing for cargo transfer
      progress = easeInOutCubic(progress)
      animation.progress = progress
      
      console.log(`📦 Package ${packageId} transfer progress: ${Math.round(progress * 100)}%`)
      
      if (progress >= 1) {
        completeCargoAnimation(packageId)
      }
    }
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  function getCurrentMovementAction(vehicle) {
    return parsedActions.value.find(action => 
      action.vehicle === vehicle && (action.actionType === 'drive' || action.actionType === 'fly')
    )
  }

  function completeVehicleMovement(vehicle) {
    const targetLocation = vehicleTargetLocations.value[vehicle]
    if (targetLocation) {
      vehicleLocations.value[vehicle] = targetLocation
      console.log(`✅ ${vehicle} completed movement to ${targetLocation}`)
      
      // Create arrival particles
      createVehicleArrivalEffect(vehicle, targetLocation)
    }
    
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

  // Sequential action execution using parsed actions directly
  function executeAction(action) {
    console.log(`⚡ Executing action:`, action)
    
    if (!action) return
    
    // Get action type from domain parser
    const actionType = action.type || action.name || ''
    console.log(`🎯 Action type: "${actionType}"`)
    
    if (actionType.includes('load')) {
      executeEnhancedLoadAction(action)
    } else if (actionType.includes('unload')) {
      executeEnhancedUnloadAction(action)
    } else if (actionType.includes('drive') || actionType.includes('fly')) {
      executeEnhancedMovementAction(action)
    } else {
      console.log(`⚠️ Unknown action type: ${actionType}`)
    }

    // Handle resources for numerical PDDL
    if (props.pddlType === 'numerical') {
      totalCost.value += action.cost || 1
      currentFuel.value = Math.max(0, currentFuel.value - (action.cost || 1))
    }
  }

  function createCargoTransferAnimation(packageId, fromSource, toTarget, onComplete) {
    cargoTransferring.value.add(packageId)
    cargoAnimations.value[packageId] = {
      fromSource,
      toTarget,
      startTime: Date.now(),
      duration: 1.5, // 1.5 seconds for cargo transfer
      progress: 0,
      onComplete
    }
    
    console.log(`📦 Cargo transfer started: ${packageId} from ${fromSource} to ${toTarget}`)
    
    // Complete after duration
    setTimeout(() => {
      if (onComplete) onComplete()
      delete cargoAnimations.value[packageId]
      cargoTransferring.value.delete(packageId)
      console.log(`📦 Cargo transfer completed: ${packageId}`)
    }, 1500)
  }

  // Duplicate generateRoute removed to fix 'already defined' error.

  function executeEnhancedLoadAction(action) {
    // Extract data from domain parser action format
    const vehicle = action.params?.[1] || action.parameters?.[1] || 'unknown-vehicle'
    const packageId = action.params?.[0] || action.parameters?.[0] || 'unknown-package'
    const location = action.params?.[2] || action.parameters?.[2] || 'unknown-location'
    
    console.log(`📦 LOADING: ${vehicle} loading ${packageId} at ${location}`)
    console.log(`📋 Raw action:`, action)
    
    // Rest of loading logic...
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
    
    createCargoTransferAnimation(packageId, 'ground', vehicle, () => {
      if (!vehicleCarrying.value[vehicle]) {
        vehicleCarrying.value[vehicle] = []
      }
      vehicleCarrying.value[vehicle].push(packageId)
      delete packageLocations.value[packageId]
      
      console.log(`✅ LOADING COMPLETED: ${vehicle} now carrying ${packageId}`)
      createLoadingSuccessEffect(vehicle, location)
    })
    
    if (!animationFrame) {
      startMovementAnimation()
    }
    
    createActionParticles('loading')
  }

  function executeEnhancedUnloadAction(action) {
    // Extract data from domain parser action format
    const vehicle = action.params?.[1] || action.parameters?.[1] || 'unknown-vehicle'
    const packageId = action.params?.[0] || action.parameters?.[0] || 'unknown-package'
    const location = action.params?.[2] || action.parameters?.[2] || 'unknown-location'
    
    console.log(`📤 UNLOADING: ${vehicle} unloading ${packageId} at ${location}`)
    console.log(`📋 Raw action:`, action)
    
    // Rest of unloading logic...
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
    
    createCargoTransferAnimation(packageId, vehicle, 'ground', () => {
      if (vehicleCarrying.value[vehicle]) {
        vehicleCarrying.value[vehicle] = vehicleCarrying.value[vehicle].filter(pkg => pkg !== packageId)
      }
      packageLocations.value[packageId] = location
      
      console.log(`✅ UNLOADING COMPLETED: ${packageId} now at ${location}`)
      createUnloadingSuccessEffect(vehicle, location)
    })
    
    if (!animationFrame) {
      startMovementAnimation()
    }
    
    createActionParticles('unloading')
  }

  function executeEnhancedMovementAction(action) {
    // Extract data from domain parser action format  
    const vehicle = action.params?.[0] || action.parameters?.[0] || 'unknown-vehicle'
    const fromLocation = action.params?.[1] || action.parameters?.[1] || 'unknown-from'
    const toLocation = action.params?.[2] || action.parameters?.[2] || 'unknown-to'
    
    console.log(`🚛 MOVEMENT: ${vehicle} moving from ${fromLocation} to ${toLocation}`)
    console.log(`📋 Raw action:`, action)
    
    // Rest of movement logic...
    if (vehicleLocations.value[vehicle] !== fromLocation) {
      console.warn(`⚠️ Vehicle ${vehicle} corrected from ${vehicleLocations.value[vehicle]} to ${fromLocation}`)
      vehicleLocations.value[vehicle] = fromLocation
    }
    
    const route = generateRoute(fromLocation, toLocation, action.type)
    vehicleRoutes.value[vehicle] = route
    vehicleCurrentRoute.value[vehicle] = 0
    
    vehicleStartLocations.value[vehicle] = fromLocation
    vehicleTargetLocations.value[vehicle] = toLocation
    vehicleMovementProgress.value[vehicle] = 0
    vehicleMovementStartTime.value[vehicle] = Date.now()
    
    movingVehicles.value.add(vehicle)
    activeVehicles.value.add(vehicle)
    
    console.log(`🎯 MOVEMENT STARTED: ${vehicle} from ${fromLocation} to ${toLocation}`)
    
    if (!animationFrame) {
      startMovementAnimation()
    }
    
    createVehicleDepartureEffect(vehicle, fromLocation)
    createActionParticles('movement')
  }

  function generateRoute(fromLocation, toLocation, actionType) {
    // Generate intermediate waypoints for more realistic movement
    const waypoints = [fromLocation]
    
    // Add intermediate points based on action type
    if (actionType === 'fly-airplane') {
      // Airplanes fly in straight lines but at higher altitude
      waypoints.push(`${fromLocation}-takeoff`)
      waypoints.push(`${fromLocation}-${toLocation}-cruise`)
      waypoints.push(`${toLocation}-approach`)
    } else {
      // Trucks follow road-like paths
      const midPoint = `${fromLocation}-${toLocation}-road`
      waypoints.push(midPoint)
    }
    
    waypoints.push(toLocation)
    return waypoints
  }

  function createVehicleDepartureEffect() {
    // Create departure particles
    for (let i = 0; i < 8; i++) {
      const particle = {
        id: Date.now() + i + Math.random(),
        type: 'departure',
        x: Math.random() * 100,
        y: Math.random() * 100,
        life: 1,
        size: Math.random() * 4 + 2
      }
      particles.value.push(particle)
    }
  }

  function createVehicleArrivalEffect() {
    // Create arrival particles
    for (let i = 0; i < 10; i++) {
      const particle = {
        id: Date.now() + i + Math.random(),
        type: 'arrival',
        x: Math.random() * 100,
        y: Math.random() * 100,
        life: 1,
        size: Math.random() * 6 + 3
      }
      particles.value.push(particle)
    }
  }

  function createLoadingSuccessEffect() {
    for (let i = 0; i < 6; i++) {
      const particle = {
        id: Date.now() + i + Math.random(),
        type: 'loading-success',
        x: Math.random() * 100,
        y: Math.random() * 100,
        life: 1,
        size: Math.random() * 5 + 2
      }
      particles.value.push(particle)
    }
  }

  function createUnloadingSuccessEffect() {
    for (let i = 0; i < 6; i++) {
      const particle = {
        id: Date.now() + i + Math.random(),
        type: 'unloading-success',
        x: Math.random() * 100,
        y: Math.random() * 100,
        life: 1,
        size: Math.random() * 5 + 2
      }
      particles.value.push(particle)
    }
  }

  function createActionParticles(actionType = 'default') {
    const particleCount = actionType === 'movement' ? 12 : 6
    
    for (let i = 0; i < particleCount; i++) {
      const particle = {
        id: Date.now() + i + Math.random(),
        type: actionType,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        size: Math.random() * 6 + 4,
        rotation: Math.random() * 360
      }
      particles.value.push(particle)
      
      setTimeout(() => {
        particles.value = particles.value.filter(p => p.id !== particle.id)
      }, 4000)
    }
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

  // Auto-play with simple timing
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
          
          // Simple timing - 3 seconds per action
          setTimeout(() => {
            if (isPlaying.value) {
              executeNextStep()
            }
          }, 3000 / speed)
        } else {
          isPlaying.value = false
        }
      }
      
      executeNextStep()
    }
  })

  // Playback control functions
  function togglePlayback() {
    isPlaying.value = !isPlaying.value
    console.log('▶️ Playback toggled:', isPlaying.value)
    
    if (isPlaying.value && !animationFrame) {
      startMovementAnimation()
    }
  }

  function stepForward() {
    if (currentStep.value < parsedActions.value.length) {
      const action = parsedActions.value[currentStep.value]
      
      console.log(`🎯 Executing step ${currentStep.value + 1}: ${action.name}`)
      
      // Start action timing
      actionStartTime.value = Date.now()
      actionProgress.value = 0
      
      executeAction(action)
      currentStep.value++
      
      console.log(`📊 Progress: ${currentStep.value}/${parsedActions.value.length}`)
      
      if (currentStep.value >= parsedActions.value.length) {
        showSuccess.value = true
        console.log('🎉 All logistics actions completed!')
        setTimeout(() => {
          showSuccess.value = false
        }, 3000)
      }
    }
  }

  function resetSimulation() {
    console.log('🔄 Resetting enhanced logistics simulation')
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
    vehicleCurrentRoute.value = {}
    loadingProgress.value = {}
    loadingStartTime.value = {}
    loadingType.value = {}
    cargoAnimations.value = {}
    
    particles.value = []
    totalCost.value = 0
    currentFuel.value = 100
    initializeLocations()
  }

  // Helper functions for extracting action details (same as before)
  function getActionType(actionName) {
    const name = actionName?.toLowerCase() || ''
    if (name.includes('load')) return 'load-vehicle'
    if (name.includes('unload')) return 'unload-vehicle'
    if (name.includes('drive')) return 'drive-truck'
    if (name.includes('fly')) return 'fly-airplane'
    return 'unknown'
  }

  function extractVehicle(params) {
    return params?.find(p => p?.includes('tru') || p?.includes('apn')) || null
  }

  function extractPackage(params) {
    return params?.find(p => p?.includes('obj')) || null
  }

  function extractLocation(params) {
    if (params && params.length > 2) {
      return params[2]
    }
    return null
  }

  function extractFromLocation(actionName, params) {
    const name = actionName?.toLowerCase() || ''
    if (name.includes('drive') || name.includes('fly')) {
      return params?.[1] || null
    }
    return null
  }

  function extractToLocation(actionName, params) {
    const name = actionName?.toLowerCase() || ''
    if (name.includes('drive') || name.includes('fly')) {
      return params?.[2] || null
    }
    return null
  }

  function extractCity(params) {
    return params?.find(p => p?.includes('cit')) || null
  }

  // Helper functions for extracting action details (removed unused extractLogisticsEntities)

  function initializeLocations() {
    console.log('🏁 Initializing enhanced logistics locations...')

    if (allLocations.value.length === 0) {
      console.log('⚠️ No locations found, using defaults')
      return
    }

    // Initialize vehicle locations
    allVehicles.value.forEach(vehicle => {
      let startLocation = allLocations.value[0]
      
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
      }
      
      vehicleLocations.value[vehicle] = startLocation
      vehicleCarrying.value[vehicle] = []
      vehicleFuel.value[vehicle] = 100
      
      console.log(`🚚 Vehicle ${vehicle} starts in ${startLocation}`)
    })

    // Initialize package locations
    allPackages.value.forEach((pkg) => {
      const firstLoadAction = parsedActions.value
        .filter(action => action.actionType === 'load-vehicle' && action.package === pkg)
        .sort((a, b) => a.start - b.start)[0]
      
      if (firstLoadAction && firstLoadAction.location) {
        packageLocations.value[pkg] = firstLoadAction.location
        console.log(`📦 Package ${pkg} starts in ${firstLoadAction.location}`)
      } else {
        const defaultLocation = allLocations.value[0]
        packageLocations.value[pkg] = defaultLocation
        console.log(`📦 Package ${pkg} defaults to ${defaultLocation}`)
      }
    })

    console.log('🏁 Enhanced logistics state initialized')
  }

  // Watch for props changes
  watch(() => props.actions, (newActions) => {
    console.log('👀 Actions prop changed:', typeof newActions, newActions)
    resetSimulation()
  }, { immediate: true })

  // Initialize when component mounts
  onMounted(() => {
    console.log('🏗️ Enhanced logistics simulator mounted')
    initializeLocations()
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
    
    getMovingVehicleStyle: (vehicle) => {
      if (!isVehicleMoving(vehicle)) {
        return { display: 'none' }
      }
      
      const progress = getVehicleMovementProgress(vehicle)
      const startLocation = vehicleStartLocations.value[vehicle]
      const targetLocation = vehicleTargetLocations.value[vehicle]
      
      if (!startLocation || !targetLocation) {
        return { display: 'none' }
      }
      
      console.log(`🎯 Moving ${vehicle}: ${startLocation} → ${targetLocation} (${Math.round(progress * 100)}%)`)
      
      // Calculate positions based on location layout
      const locationPositions = calculateLocationPositions()
      
      const startPos = locationPositions[startLocation] || { x: 20, y: 20 }
      const targetPos = locationPositions[targetLocation] || { x: 80, y: 20 }
      
      // Enhanced movement with route following
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
        
        // Add movement effects for different vehicle types
        if (vehicle.includes('apn')) {
          // Airplane - add slight hover effect
          currentY -= Math.sin(Date.now() / 500) * 2
        } else if (vehicle.includes('tru')) {
          // Truck - add slight road bounce
          currentY += Math.sin(Date.now() / 200) * 0.5
        }
      }
      
      return {
        position: 'absolute',
        left: `${currentX}%`,
        top: `${currentY}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        transition: 'none'
      }
    },
    
    getLoadingVehicleStyle: (vehicle) => {
      if (!isVehicleLoading(vehicle)) {
        return { display: 'none' }
      }
      
      const location = vehicleLocations.value[vehicle]
      const locationPositions = calculateLocationPositions()
      const pos = locationPositions[location] || { x: 50, y: 50 }
      
      const loadingType = getVehicleLoadingType(vehicle)
      const progress = getVehicleLoadingProgress(vehicle)
      
      // Add loading animation effects
      const scale = 1 + Math.sin(progress * Math.PI) * 0.1
      const rotation = loadingType === 'loading' ? progress * 360 : -progress * 360
      
      return {
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
        zIndex: 900,
        transition: 'none'
      }
    },
    
    getCargoTransferStyle: (packageId) => {
      const animation = getCargoAnimation(packageId)
      if (!animation || !animation.progress) {
        return { display: 'none' }
      }
      
      const locationPositions = calculateLocationPositions()
      let fromPos, toPos
      
      if (animation.fromSource === 'ground') {
        // From ground to vehicle
        const location = Object.keys(packageLocations.value).find(loc => 
          packageLocations.value[loc] && Object.values(packageLocations.value).includes(loc)
        ) || 'default'
        fromPos = locationPositions[location] || { x: 50, y: 50 }
        
        // Find vehicle position
        const vehicleLocation = Object.keys(vehicleLocations.value).find(v => v === animation.toTarget)
        toPos = locationPositions[vehicleLocations.value[vehicleLocation]] || { x: 60, y: 50 }
        toPos.y -= 10 // Slightly above vehicle
      } else if (animation.toTarget === 'ground') {
        // From vehicle to ground
        const vehicleLocation = vehicleLocations.value[animation.fromSource]
        fromPos = locationPositions[vehicleLocation] || { x: 50, y: 50 }
        fromPos.y -= 10 // Slightly above vehicle
        
        const location = Object.keys(packageLocations.value).find(loc => 
          packageLocations.value[loc] && Object.values(packageLocations.value).includes(loc)
        ) || 'default'
        toPos = locationPositions[location] || { x: 50, y: 50 }
      } else {
        // Vehicle to vehicle transfer (rare)
        fromPos = { x: 40, y: 50 }
        toPos = { x: 60, y: 50 }
      }
      
      const currentX = fromPos.x + (toPos.x - fromPos.x) * animation.progress
      const currentY = fromPos.y + (toPos.y - fromPos.y) * animation.progress
      
      // Add arc effect for cargo transfer
      const arcHeight = 15
      const arcProgress = Math.sin(animation.progress * Math.PI)
      const finalY = currentY - arcHeight * arcProgress
      
      return {
        position: 'absolute',
        left: `${currentX}%`,
        top: `${finalY}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1100,
        transition: 'none'
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
      if (vehicleName.includes('tru')) return '🚚'
      if (vehicleName.includes('apn')) return '✈️'
      return '🚐'
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
    
    // For debugging
    parsedActions,
    
    // Helper function
    calculateLocationPositions
  }

  // Helper function to calculate location positions  
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
    
    // Add default positions for any missing locations
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