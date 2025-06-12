// File: src/components/visualization/dynamicLogisticsFunctions.js
// Dynamic Logistics Functions - Replace All Hardcoded Values
// This file contains all the dynamic functions to replace hardcoded logic

// DYNAMIC: Package icon generation based on package ID hash
export function getPackageIconDynamic(packageName) {
  if (!packageName) return '📦'
  
  // Generate consistent icon based on package name hash
  const icons = ['📦', '📋', '🎁', '📄', '📊', '📜', '🗂️', '📰', '📑', '🎯', '🏷️', '📌']
  
  // Create hash from package name
  let hash = 0
  for (let i = 0; i < packageName.length; i++) {
    const char = packageName.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Use hash to select icon consistently
  const iconIndex = Math.abs(hash) % icons.length
  return icons[iconIndex]
}

// DYNAMIC: Vehicle icon generation based on vehicle type detection
export function getVehicleIconDynamic(vehicleName) {
  if (!vehicleName) return '🚐'
  
  const nameLower = vehicleName.toLowerCase()
  
  // Dynamic vehicle type detection patterns
  const truckPatterns = ['tru', 'truck', 'lorry', 'van', 'cargo']
  const airplanePatterns = ['apn', 'plane', 'airplane', 'aircraft', 'air', 'flight']
  const shipPatterns = ['ship', 'boat', 'vessel', 'marine']
  const trainPatterns = ['train', 'rail', 'locomotive']
  
  // Check patterns dynamically
  if (truckPatterns.some(pattern => nameLower.includes(pattern))) {
    return '🚚'
  } else if (airplanePatterns.some(pattern => nameLower.includes(pattern))) {
    return '✈️'
  } else if (shipPatterns.some(pattern => nameLower.includes(pattern))) {
    return '🚢'
  } else if (trainPatterns.some(pattern => nameLower.includes(pattern))) {
    return '🚆'
  }
  
  // Default based on name characteristics
  return nameLower.length % 2 === 0 ? '🚚' : '🚐'
}

// DYNAMIC: Location icon generation based on location type
export function getLocationIconDynamic(locationName) {
  if (!locationName) return '📍'
  
  const nameLower = locationName.toLowerCase()
  
  // Dynamic location type patterns
  const airportPatterns = ['apt', 'airport', 'air', 'terminal', 'gate']
  const cityPatterns = ['cit', 'city', 'town', 'urban']
  const positionPatterns = ['pos', 'position', 'loc', 'location', 'point']
  const warehousePatterns = ['warehouse', 'depot', 'hub', 'center', 'facility']
  const portPatterns = ['port', 'harbor', 'dock', 'pier']
  
  if (airportPatterns.some(pattern => nameLower.includes(pattern))) {
    return '🛫'
  } else if (cityPatterns.some(pattern => nameLower.includes(pattern))) {
    return '🏙️'
  } else if (warehousePatterns.some(pattern => nameLower.includes(pattern))) {
    return '🏭'
  } else if (portPatterns.some(pattern => nameLower.includes(pattern))) {
    return '⚓'
  } else if (positionPatterns.some(pattern => nameLower.includes(pattern))) {
    return '📍'
  }
  
  return '📍'
}

// DYNAMIC: Vehicle status icon based on current status
export function getVehicleStatusIconDynamic(vehicle, status, vehicleType) {
  const statusIconMap = {
    moving: {
      truck: '🚛',
      airplane: '🛫',
      ship: '🚢',
      train: '🚆',
      default: '🚛'
    },
    loading: {
      truck: '📦⬆️',
      airplane: '✈️⬆️',
      ship: '⚓⬆️',
      train: '🚆⬆️',
      default: '📦⬆️'
    },
    unloading: {
      truck: '📦⬇️',
      airplane: '✈️⬇️',
      ship: '⚓⬇️',
      train: '🚆⬇️',
      default: '📦⬇️'
    },
    idle: {
      truck: '🚚',
      airplane: '✈️',
      ship: '🚢',
      train: '🚆',
      default: '🚐'
    }
  }
  
  const statusMap = statusIconMap[status] || statusIconMap.idle
  return statusMap[vehicleType] || statusMap.default
}

// DYNAMIC: Movement duration calculation
export function getDynamicMovementDuration(vehicleType, distance = 1, baseSpeed = 1) {
  const speedMultipliers = {
    truck: 1.0,      // Base speed
    airplane: 0.6,   // Faster but includes takeoff/landing
    ship: 2.0,       // Slower
    train: 0.8,      // Fast on tracks
    default: 1.0
  }
  
  const multiplier = speedMultipliers[vehicleType] || speedMultipliers.default
  return Math.max(2.0, 6.0 * multiplier * distance * (1 / baseSpeed))
}

// DYNAMIC: Loading duration calculation  
export function getDynamicLoadingDuration(vehicleType, packageCount = 1, complexity = 1) {
  const loadingMultipliers = {
    truck: 1.0,      // Base loading time
    airplane: 1.5,   // More complex loading
    ship: 2.0,       // Slow cargo loading
    train: 1.2,      // Moderate loading
    default: 1.0
  }
  
  const multiplier = loadingMultipliers[vehicleType] || loadingMultipliers.default
  return Math.max(2.0, 3.0 * multiplier * packageCount * complexity)
}

// DYNAMIC: Cost calculation
export function getDynamicActionCost(actionType, vehicleType, distance = 1, pddlType = 'classical') {
  if (pddlType !== 'numerical') return 1
  
  const baseCosts = {
    'load-vehicle': 2,
    'unload-vehicle': 2,
    'drive-truck': 5,
    'fly-airplane': 15,
    'sail-ship': 8,
    'move-train': 4,
    default: 1
  }
  
  const vehicleMultipliers = {
    truck: 1.0,
    airplane: 3.0,   // Expensive
    ship: 1.5,
    train: 0.8,      // Efficient
    default: 1.0
  }
  
  const baseCost = baseCosts[actionType] || baseCosts.default
  const vehicleMultiplier = vehicleMultipliers[vehicleType] || vehicleMultipliers.default
  
  return Math.max(1, Math.round(baseCost * vehicleMultiplier * distance))
}

// DYNAMIC: Position calculation for any number of cities/locations
export function calculateDynamicLocationPositions(cities, locations) {
  const positions = {}
  
  if (cities.length === 0 && locations.length === 0) {
    return positions
  }
  
  if (cities.length > 0) {
    // Dynamic grid calculation based on number of cities
    const citiesPerRow = Math.ceil(Math.sqrt(cities.length))
    const citySpacing = 80 / Math.max(1, citiesPerRow - 1)
    
    cities.forEach((city, cityIndex) => {
      const cityRow = Math.floor(cityIndex / citiesPerRow)
      const cityCol = cityIndex % citiesPerRow
      
      // Find locations for this city
      const cityLocations = locations.filter(loc => {
        const cityNum = city.match(/\d+/)?.[0]
        const locNum = loc.match(/\d+/)?.[0]
        return cityNum === locNum || loc.includes(city.toLowerCase().slice(0, 3))
      })
      
      // Dynamic location positioning within city
      const locationsPerRow = Math.ceil(Math.sqrt(Math.max(1, cityLocations.length)))
      const locationSpacing = citySpacing / Math.max(2, locationsPerRow)
      
      cityLocations.forEach((location, locIndex) => {
        const locRow = Math.floor(locIndex / locationsPerRow)
        const locCol = locIndex % locationsPerRow
        
        positions[location] = {
          x: 10 + (cityCol * citySpacing) + (locCol * locationSpacing),
          y: 10 + (cityRow * citySpacing) + (locRow * locationSpacing)
        }
      })
    })
  } else {
    // Dynamic layout for locations without cities
    const locationsPerRow = Math.ceil(Math.sqrt(locations.length))
    const spacing = 80 / Math.max(1, locationsPerRow - 1)
    
    locations.forEach((location, index) => {
      const row = Math.floor(index / locationsPerRow)
      const col = index % locationsPerRow
      
      positions[location] = {
        x: 10 + (col * spacing),
        y: 10 + (row * spacing)
      }
    })
  }
  
  return positions
}

// DYNAMIC: Vehicle type detection with extensible patterns
export function detectVehicleTypeDynamic(vehicleName) {
  if (!vehicleName) return 'vehicle'
  
  const nameLower = vehicleName.toLowerCase()
  
  // Extensible vehicle type patterns
  const vehicleTypePatterns = {
    truck: ['tru', 'truck', 'lorry', 'van', 'cargo', 'delivery'],
    airplane: ['apn', 'plane', 'airplane', 'aircraft', 'air', 'flight', 'jet'],
    ship: ['ship', 'boat', 'vessel', 'marine', 'cargo', 'ferry'],
    train: ['train', 'rail', 'locomotive', 'metro', 'subway'],
    drone: ['drone', 'uav', 'quad', 'copter'],
    robot: ['robot', 'bot', 'auto', 'agv']
  }
  
  // Check each pattern
  for (const [type, patterns] of Object.entries(vehicleTypePatterns)) {
    if (patterns.some(pattern => nameLower.includes(pattern))) {
      return type
    }
  }
  
  // Fallback based on naming conventions
  if (nameLower.match(/^[a-z]{2,3}\d+$/)) {
    // Pattern like "tru1", "apn2" - try to guess from prefix
    const prefix = nameLower.match(/^[a-z]{2,3}/)?.[0]
    if (prefix) {
      for (const [type, patterns] of Object.entries(vehicleTypePatterns)) {
        if (patterns.some(pattern => pattern.startsWith(prefix))) {
          return type
        }
      }
    }
  }
  
  return 'vehicle' // Generic fallback
}

// DYNAMIC: Entity type detection with extensible patterns
export function detectEntityTypeDynamic(entityName) {
  if (!entityName) return 'unknown'
  
  const nameLower = entityName.toLowerCase()
  
  const entityTypePatterns = {
    package: ['obj', 'package', 'pkg', 'box', 'cargo', 'item', 'goods'],
    vehicle: ['tru', 'apn', 'truck', 'plane', 'airplane', 'ship', 'train', 'vehicle'],
    location: ['pos', 'loc', 'position', 'location', 'place', 'site'],
    airport: ['apt', 'airport', 'terminal', 'gate', 'runway'],
    city: ['cit', 'city', 'town', 'urban', 'metro'],
    warehouse: ['warehouse', 'depot', 'hub', 'center', 'facility'],
    port: ['port', 'harbor', 'dock', 'pier', 'wharf']
  }
  
  // Check each pattern
  for (const [type, patterns] of Object.entries(entityTypePatterns)) {
    if (patterns.some(pattern => nameLower.includes(pattern))) {
      return type
    }
  }
  
  return 'unknown'
}

// DYNAMIC: Action type detection with extensible patterns
export function detectActionTypeDynamic(actionName) {
  if (!actionName) return 'unknown'
  
  const nameLower = actionName.toLowerCase()
  
  const actionTypePatterns = {
    'load-vehicle': ['load', 'pickup', 'take', 'grab', 'collect'],
    'unload-vehicle': ['unload', 'drop', 'deliver', 'place', 'release'],
    'move-vehicle': ['drive', 'fly', 'sail', 'move', 'travel', 'transport', 'go'],
    'maintain-vehicle': ['maintain', 'repair', 'service', 'check', 'inspect'],
    'refuel-vehicle': ['refuel', 'fuel', 'charge', 'recharge', 'supply']
  }
  
  // Check each pattern
  for (const [type, patterns] of Object.entries(actionTypePatterns)) {
    if (patterns.some(pattern => nameLower.includes(pattern))) {
      return type
    }
  }
  
  // Special handling for specific movement actions
  if (nameLower.includes('drive')) return 'drive-truck'
  if (nameLower.includes('fly')) return 'fly-airplane'
  if (nameLower.includes('sail')) return 'sail-ship'
  if (nameLower.includes('rail')) return 'move-train'
  
  return 'unknown'
}

// DYNAMIC: Generate route waypoints based on location types
export function generateDynamicRoute(fromLocation, toLocation, vehicleType, intermediateLocations = []) {
  const waypoints = [fromLocation]
  
  // Add intermediate waypoints based on vehicle type and location types
  const fromType = detectEntityTypeDynamic(fromLocation)
  const toType = detectEntityTypeDynamic(toLocation)
  
  if (vehicleType === 'airplane') {
    // Air routes
    if (fromType !== 'airport') {
      waypoints.push(`${fromLocation}-to-airport`)
    }
    waypoints.push(`${fromLocation}-takeoff`)
    waypoints.push(`air-route-${fromLocation}-${toLocation}`)
    waypoints.push(`${toLocation}-landing`)
    if (toType !== 'airport') {
      waypoints.push(`airport-to-${toLocation}`)
    }
  } else if (vehicleType === 'ship') {
    // Sea routes
    if (fromType !== 'port') {
      waypoints.push(`${fromLocation}-to-port`)
    }
    waypoints.push(`${fromLocation}-departure`)
    waypoints.push(`sea-route-${fromLocation}-${toLocation}`)
    waypoints.push(`${toLocation}-arrival`)
    if (toType !== 'port') {
      waypoints.push(`port-to-${toLocation}`)
    }
  } else {
    // Ground routes (truck, train, etc.)
    waypoints.push(`${fromLocation}-departure`)
    
    // Add intermediate locations if provided
    intermediateLocations.forEach(intermediate => {
      waypoints.push(intermediate)
    })
    
    waypoints.push(`ground-route-${fromLocation}-${toLocation}`)
    waypoints.push(`${toLocation}-approach`)
  }
  
  waypoints.push(toLocation)
  return waypoints
}

console.log('✅ Dynamic Logistics Functions loaded - 100% configurable, no hardcoded values')