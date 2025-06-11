// Enhanced Elevator Domain Parser with Advanced Features
// File: src/utils/enhancedElevatorParser.js

export function parseElevatorDomain(rawContent, pddlType = 'classical') {
  console.log('🛗 Enhanced Elevator Domain Parser started...', { pddlType, contentLength: rawContent.length });
  
  try {
    const lines = rawContent.split('\n').map(line => line.trim()).filter(line => line);
    const result = {
      actions: [],
      entities: {
        elevators: [],
        passengers: [],
        floors: [],
        locations: [],
        // Enhanced entities
        elevatorSpecs: {},
        passengerProfiles: {},
        floorInformation: {}
      },
      metrics: {},
      pddlType: pddlType,
      domain: 'elevator',
      error: null,
      // Advanced features
      multiElevatorSupport: false,
      capacityManagement: true,
      smartScheduling: true,
      emergencyProtocols: true
    };

    let inPlanSection = false;
    // let elevatorCount = 0;
    let maxCapacityDetected = 1000; // Default capacity in kg

    // Enhanced parsing with multi-elevator support
    for (const line of lines) {
      // Detect plan section
      if (line.includes('found plan:') || line.includes('plan found')) {
        inPlanSection = true;
        console.log('📋 Found plan section in elevator domain');
        continue;
      }
      
      // Stop at metrics
      if (inPlanSection && (line.includes('plan-length:') || line.includes('metric') || line.includes('planning time'))) {
        inPlanSection = false;
        continue;
      }
      
      // Parse domain specifications (if present)
      if (line.includes('elevator-capacity')) {
        maxCapacityDetected = parseInt(line.match(/\d+/)?.[0]) || 1000;
        console.log(`🏋️ Detected elevator capacity: ${maxCapacityDetected}kg`);
      }
      
      // Parse multi-elevator indicators
      if (line.includes('elevator') && (line.includes('elevator1') || line.includes('elevator2'))) {
        result.multiElevatorSupport = true;
      }
      
      if (inPlanSection) {
        const action = parseAdvancedElevatorAction(line, pddlType);
        if (action) {
          result.actions.push(action);
          extractAdvancedElevatorEntities(action, result.entities);
          console.log(`🛗 Enhanced elevator action: ${action.type} [${action.params.join(', ')}] at ${action.time}`);
        }
      }
      
      parseStatistics(line, result.metrics);
    }
    
    // Post-process with advanced features
    postProcessAdvancedElevator(result, pddlType, maxCapacityDetected);
    
    console.log('✅ Enhanced elevator parsing complete:', {
      actions: result.actions.length,
      elevators: result.entities.elevators.length,
      passengers: result.entities.passengers.length,
      floors: result.entities.floors.length,
      multiElevator: result.multiElevatorSupport,
      maxCapacity: maxCapacityDetected
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Enhanced elevator parsing error:', error);
    return {
      actions: [],
      entities: { elevators: [], passengers: [], floors: [], locations: [] },
      metrics: {},
      pddlType,
      domain: 'elevator',
      error: `Enhanced elevator parser error: ${error.message}`
    };
  }
}

function parseAdvancedElevatorAction(line, pddlType) {
  let actionMatch;
  
  // Enhanced pattern matching for different PDDL types
  if (pddlType === 'temporal' || pddlType === 'pddl_plus') {
    // Temporal format with duration
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[(?:D:)?(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, durationStr] = actionMatch;
      return createAdvancedElevatorAction(parseFloat(timeStr), actionStr, parseFloat(durationStr) || null, pddlType);
    }
  } else if (pddlType === 'numerical') {
    // Numerical format with costs/resources
    actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[cost:\s*(\d+(?:\.\d+)?)\])?(?:\s*\[weight:\s*(\d+(?:\.\d+)?)\])?/);
    if (actionMatch) {
      const [, timeStr, actionStr, costStr, weightStr] = actionMatch;
      const action = createAdvancedElevatorAction(parseFloat(timeStr), actionStr, null, pddlType);
      action.cost = parseFloat(costStr) || getDefaultActionCost(action.type);
      action.weight = parseFloat(weightStr) || 0;
      return action;
    }
  }
  
  // Standard format
  actionMatch = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)/);
  if (actionMatch) {
    const [, timeStr, actionStr] = actionMatch;
    return createAdvancedElevatorAction(parseFloat(timeStr), actionStr, null, pddlType);
  }
  
  return null;
}

function createAdvancedElevatorAction(time, actionStr, duration = null, pddlType = 'classical') {
  const actionParts = actionStr.trim().split(/\s+/);
  const actionType = actionParts[0];
  const params = actionParts.slice(1);
  
  // Calculate realistic duration based on action type
  if (duration === null) {
    duration = calculateRealisticElevatorDuration(actionType, pddlType, params);
  }
  
  const action = {
    time: time,
    start: time,
    end: time + duration,
    duration: duration,
    type: actionType,
    params: params,
    description: actionStr,
    originalLine: `${time}: (${actionStr})`,
    
    // Enhanced properties
    elevatorId: extractElevatorId(actionType, params),
    passengerId: extractPassengerId(actionType, params),
    weight: extractPassengerWeight(actionType, params),
    priority: calculateActionPriority(actionType, params),
    energyCost: calculateEnergyCost(actionType, params),
    safetyLevel: assessSafetyLevel(actionType, params)
  };
  
  return action;
}

function calculateRealisticElevatorDuration(actionType, pddlType, params) {
  const baseDurations = {
    'move-up': 3.5,         // Realistic elevator movement time
    'move-down': 3.2,       // Slightly faster going down
    'load': 4.5,            // Door operation + passenger boarding
    'unload': 4.0,          // Door operation + passenger exiting
    'emergency-stop': 0.5,  // Immediate stop
    'maintenance': 30.0,    // Maintenance operations
    'door-open': 2.5,       // Door opening sequence
    'door-close': 2.0       // Door closing sequence
  };
  
  let baseDuration = baseDurations[actionType] || 3.0;
  
  // Adjust for PDDL type characteristics
  switch (pddlType) {
    case 'temporal':
      // Temporal PDDL - use exact durations
      return baseDuration;
      
    case 'numerical': {
      // Scale based on resource consumption
      const elevatorId = extractElevatorId(actionType, params);
      const capacity = getElevatorCapacity(elevatorId);
      return baseDuration * (1 + capacity / 2000); // Scale with capacity
    }
    case 'pddl_plus':
      // PDDL+ may have continuous processes
      if (actionType.includes('move')) {
        return baseDuration * 1.3; // Continuous movement takes longer
      }
      return baseDuration;
      
    default:
      return baseDuration;
  }
}

function extractElevatorId(actionType, params) {
  // Look for elevator ID in parameters
  for (const param of params) {
    if (param.includes('elevator') || param.includes('lift')) {
      return param;
    }
  }
  
  // Default elevator for movement actions
  if (actionType === 'move-up' || actionType === 'move-down') {
    return params[0] || 'elevator1';
  }
  
  // For load/unload, elevator is usually second parameter
  if (actionType === 'load' || actionType === 'unload') {
    return params[1] || 'elevator1';
  }
  
  return 'elevator1';
}

function extractPassengerId(actionType, params) {
  if (actionType === 'load' || actionType === 'unload') {
    return params[0] || null;
  }
  return null;
}

function extractPassengerWeight(actionType, params) {
  // Try to extract weight from parameter names
  for (const param of params) {
    if (param.includes('kg') || param.includes('weight')) {
      const weight = parseInt(param.match(/\d+/)?.[0]);
      if (weight) return weight;
    }
  }
  
  // Generate realistic weight for passengers
  if (actionType === 'load' || actionType === 'unload') {
    return generateRealisticPassengerWeight();
  }
  
  return 0;
}

function generateRealisticPassengerWeight() {
  // Generate weight between 45-120 kg with normal distribution
  const mean = 75;
  const stdDev = 15;
  let weight = mean + stdDev * (Math.random() + Math.random() - 1); // Approximate normal distribution
  return Math.max(45, Math.min(120, Math.round(weight)));
}

function calculateActionPriority(actionType) {
  // Higher priority for safety and passenger actions
  switch (actionType) {
    case 'emergency-stop':
      return 10;
    case 'unload':
      return 8;
    case 'load':
      return 7;
    case 'move-up':
    case 'move-down':
      return 5;
    default:
      return 3;
  }
}

function calculateEnergyCost(actionType) {
  // Energy consumption in kWh
  switch (actionType) {
    case 'move-up':
      return 0.05; // More energy going up
    case 'move-down':
      return 0.02; // Less energy going down (regenerative)
    case 'load':
    case 'unload':
      return 0.01; // Door operations
    case 'emergency-stop':
      return 0.03; // Emergency braking
    default:
      return 0.01;
  }
}

function assessSafetyLevel(actionType) {
  // Safety assessment (1-10, 10 being safest)
  switch (actionType) {
    case 'emergency-stop':
      return 10;
    case 'load':
    case 'unload':
      return 8;
    case 'move-up':
    case 'move-down':
      return 7;
    default:
      return 9;
  }
}

function getElevatorCapacity(elevatorId) {
  // Default capacities by elevator type
  if (elevatorId.includes('freight')) return 2000;
  if (elevatorId.includes('passenger')) return 1000;
  if (elevatorId.includes('service')) return 800;
  return 1000; // Standard passenger elevator
}

function getDefaultActionCost(actionType) {
  switch (actionType) {
    case 'move-up': return 3;
    case 'move-down': return 2;
    case 'load': return 1;
    case 'unload': return 1;
    case 'emergency-stop': return 5;
    default: return 2;
  }
}

function extractAdvancedElevatorEntities(action, entities) {
  const { type, elevatorId, passengerId, weight } = action;
  
  // Extract elevators with specifications
  if (elevatorId && !entities.elevators.find(e => e.id === elevatorId)) {
    entities.elevators.push({
      id: elevatorId,
      type: determineElevatorType(elevatorId),
      capacity: getElevatorCapacity(elevatorId),
      maxPassengers: getMaxPassengers(elevatorId),
      speed: getElevatorSpeed(elevatorId),
      floors: []
    });
  }
  
  // Extract passengers with profiles
  if (passengerId && !entities.passengers.find(p => p.id === passengerId)) {
    entities.passengers.push({
      id: passengerId,
      weight: weight || generateRealisticPassengerWeight(),
      mobility: generateMobilityProfile(),
      priority: generatePassengerPriority(),
      accessibilityNeeds: Math.random() > 0.9,
      vipStatus: Math.random() > 0.95
    });
  }
  
  // Track floor usage
  switch (type) {
    case 'move-up':
    case 'move-down':
      // Floors will be calculated in post-processing
      break;
      
    case 'load':
    case 'unload':
      // Track passenger boarding/exiting floors
      break;
  }
}

function determineElevatorType(elevatorId) {
  if (elevatorId.includes('freight')) return 'freight';
  if (elevatorId.includes('service')) return 'service';
  if (elevatorId.includes('express')) return 'express';
  return 'passenger';
}

function getMaxPassengers(elevatorId) {
  const capacity = getElevatorCapacity(elevatorId);
  // Assume average passenger weight of 75kg
  return Math.floor(capacity / 75);
}

function getElevatorSpeed(elevatorId) {
  const type = determineElevatorType(elevatorId);
  switch (type) {
    case 'express': return 3.5; // m/s
    case 'freight': return 1.5;
    case 'service': return 2.0;
    default: return 2.5;
  }
}

function generateMobilityProfile() {
  const profiles = ['normal', 'elderly', 'wheelchair', 'pregnant', 'child'];
  return profiles[Math.floor(Math.random() * profiles.length)];
}

function generatePassengerPriority() {
  const priorities = ['low', 'normal', 'high', 'urgent'];
  const weights = [0.3, 0.5, 0.15, 0.05]; // Most passengers are normal priority
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return priorities[i];
    }
  }
  
  return 'normal';
}

function postProcessAdvancedElevator(result, pddlType, maxCapacity) {
  // Ensure minimum elevator configuration
  if (result.entities.elevators.length === 0) {
    result.entities.elevators = [
      {
        id: 'elevator1',
        type: 'passenger',
        capacity: maxCapacity,
        maxPassengers: Math.floor(maxCapacity / 75),
        speed: 2.5,
        floors: []
      }
    ];
  }
  
  // Generate realistic floor system based on movement actions
  const moveActions = result.actions.filter(a => a.type === 'move-up' || a.type === 'move-down');
  let floorCount = Math.max(3, Math.min(20, moveActions.length + 2));
  
  // Detect building height from actions
  let currentFloor = 0;
  let minFloor = 0;
  let maxFloor = 0;
  
  result.actions.forEach(action => {
    if (action.type === 'move-up') {
      currentFloor++;
      maxFloor = Math.max(maxFloor, currentFloor);
    } else if (action.type === 'move-down') {
      currentFloor--;
      minFloor = Math.min(minFloor, currentFloor);
    }
  });
  
  floorCount = Math.max(3, maxFloor - minFloor + 1);
  
  // Generate floor information
  result.entities.floors = [];
  result.entities.floorInformation = {};
  
  for (let i = 0; i < floorCount; i++) {
    const floorName = `Floor${i + 1}`;
    result.entities.floors.push(floorName);
    
    result.entities.floorInformation[floorName] = {
      level: i,
      height: i * 3.5, // 3.5m per floor
      type: determineFloorType(i, floorCount),
      capacity: 100, // people
      emergencyExit: i === 0 || i === floorCount - 1,
      accessibility: Math.random() > 0.2 // 80% of floors are accessible
    };
  }
  
  // Set elevator specifications based on detected features
  result.entities.elevatorSpecs = {
    defaultCapacity: maxCapacity,
    maxSpeed: 2.5,
    acceleration: 1.0,
    doorTiming: {
      openTime: 2.5,
      closeTime: 2.0,
      holdTime: 5.0
    },
    safety: {
      overloadThreshold: maxCapacity * 1.1,
      emergencyStop: true,
      fireService: true,
      seismicSensors: floorCount > 10
    },
    smartFeatures: {
      destinationDispatch: result.entities.elevators.length > 1,
      predictiveScheduling: true,
      energyOptimization: pddlType === 'numerical',
      loadBalancing: result.entities.elevators.length > 1
    }
  };
  
  // Generate passenger profiles for enhanced simulation
  result.entities.passengerProfiles = {};
  result.entities.passengers.forEach(passenger => {
    result.entities.passengerProfiles[passenger.id] = {
      ...passenger,
      behaviorPattern: generateBehaviorPattern(),
      satisfactionFactors: generateSatisfactionFactors(),
      journeyHistory: []
    };
  });
  
  // Calculate total duration and metrics
  if (result.actions.length > 0) {
    const lastAction = result.actions[result.actions.length - 1];
    
    switch (pddlType) {
      case 'temporal':
      case 'pddl_plus':
        result.totalDuration = Math.max(...result.actions.map(a => a.end || a.time + a.duration));
        result.metrics.parallelActions = calculateParallelActions(result.actions);
        break;
        
      case 'numerical':
        result.totalCost = result.actions.reduce((sum, a) => sum + (a.cost || 1), 0);
        result.totalEnergyConsumption = result.actions.reduce((sum, a) => sum + (a.energyCost || 0), 0);
        result.totalDuration = lastAction.time || result.actions.length;
        break;
        
      default:
        result.totalDuration = lastAction.time || result.actions.length;
    }
    
    // Advanced metrics
    result.metrics.safetyScore = calculateSafetyScore(result.actions);
    result.metrics.efficiencyRating = calculateEfficiencyRating(result.actions, result.entities.elevators.length);
    result.metrics.passengerSatisfaction = calculatePassengerSatisfaction(result.actions, result.entities.passengers);
    result.metrics.energyRating = calculateEnergyRating(result.actions, pddlType);
  }
  
  // Set locations for compatibility
  result.entities.locations = [...result.entities.floors];
  
  console.log('🔧 Advanced elevator post-processing complete:', {
    floors: result.entities.floors.length,
    elevators: result.entities.elevators.length,
    passengers: result.entities.passengers.length,
    totalDuration: result.totalDuration,
    multiElevator: result.multiElevatorSupport,
    smartFeatures: Object.keys(result.entities.elevatorSpecs.smartFeatures).filter(
      key => result.entities.elevatorSpecs.smartFeatures[key]
    ).length
  });
}

function determineFloorType(floorIndex, totalFloors) {
  if (floorIndex === 0) return 'ground';
  if (floorIndex === totalFloors - 1) return 'top';
  if (floorIndex === 1) return 'mezzanine';
  if (floorIndex > totalFloors * 0.8) return 'upper';
  if (floorIndex < totalFloors * 0.3) return 'lower';
  return 'middle';
}

function generateBehaviorPattern() {
  const patterns = ['patient', 'impatient', 'efficient', 'social', 'quiet'];
  return patterns[Math.floor(Math.random() * patterns.length)];
}

function generateSatisfactionFactors() {
  return {
    waitTime: Math.random() * 0.4 + 0.3, // 0.3-0.7 weight
    journeyTime: Math.random() * 0.3 + 0.2, // 0.2-0.5 weight
    comfort: Math.random() * 0.2 + 0.1, // 0.1-0.3 weight
    safety: Math.random() * 0.3 + 0.4 // 0.4-0.7 weight
  };
}

function calculateParallelActions(actions) {
  // Find overlapping temporal actions
  let maxParallel = 0;
  const timeSlots = {};
  
  actions.forEach(action => {
    if (action.start !== undefined && action.end !== undefined) {
      for (let t = Math.floor(action.start); t < Math.ceil(action.end); t++) {
        timeSlots[t] = (timeSlots[t] || 0) + 1;
        maxParallel = Math.max(maxParallel, timeSlots[t]);
      }
    }
  });
  
  return maxParallel;
}

function calculateSafetyScore(actions) {
  if (actions.length === 0) return 100;
  
  const totalSafety = actions.reduce((sum, action) => sum + (action.safetyLevel || 5), 0);
  return Math.round((totalSafety / (actions.length * 10)) * 100);
}

function calculateEfficiencyRating(actions, elevatorCount) {
  if (actions.length === 0) return 100;
  
  const moveActions = actions.filter(a => a.type === 'move-up' || a.type === 'move-down');
  const passengerActions = actions.filter(a => a.type === 'load' || a.type === 'unload');
  
  if (passengerActions.length === 0) return 50;
  
  const moveToPassengerRatio = moveActions.length / passengerActions.length;
  const idealRatio = 1.5; // 1.5 moves per passenger action is efficient
  
  let efficiency = 100 - Math.abs(moveToPassengerRatio - idealRatio) * 20;
  
  // Bonus for multiple elevators
  if (elevatorCount > 1) {
    efficiency += 10;
  }
  
  return Math.max(0, Math.min(100, Math.round(efficiency)));
}

function calculatePassengerSatisfaction(actions, passengers) {
  if (passengers.length === 0) return 100;
  
  // Base satisfaction - higher for fewer actions per passenger
  const actionsPerPassenger = actions.length / passengers.length;
  let satisfaction = Math.max(60, 100 - actionsPerPassenger * 5);
  
  // Bonus for load/unload balance
  const loadActions = actions.filter(a => a.type === 'load').length;
  const unloadActions = actions.filter(a => a.type === 'unload').length;
  
  if (loadActions === unloadActions) {
    satisfaction += 10; // All passengers delivered
  }
  
  return Math.round(satisfaction);
}

function calculateEnergyRating(actions, pddlType) {
  if (pddlType !== 'numerical') return 'A'; // No energy data available
  
  const totalEnergy = actions.reduce((sum, a) => sum + (a.energyCost || 0), 0);
  const actionCount = actions.length;
  
  if (actionCount === 0) return 'A+';
  
  const energyPerAction = totalEnergy / actionCount;
  
  if (energyPerAction < 0.02) return 'A+';
  if (energyPerAction < 0.03) return 'A';
  if (energyPerAction < 0.04) return 'B';
  if (energyPerAction < 0.05) return 'C';
  return 'D';
}

function parseStatistics(line, metrics) {
  if (line.includes('plan-length:')) {
    metrics.planLength = parseInt(line.split(':')[1]);
  } else if (line.includes('planning time (msec):')) {
    metrics.planningTime = parseInt(line.split(':')[1]);
  } else if (line.includes('search time (msec):')) {
    metrics.searchTime = parseInt(line.split(':')[1]);
  } else if (line.includes('expanded nodes:')) {
    metrics.expandedNodes = parseInt(line.split(':')[1]);
  } else if (line.includes('states evaluated:')) {
    metrics.statesEvaluated = parseInt(line.split(':')[1]);
  } else if (line.includes('metric (search):')) {
    metrics.totalCost = parseFloat(line.split(':')[1]);
  }
}

// Export the enhanced parser
export default parseElevatorDomain;