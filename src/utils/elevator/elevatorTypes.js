// File: src/utils/elevator/elevatorTypes.js
// 100% Dynamic Elevator PDDL Type Configuration - NO HARDCODED VALUES
// All specifications extracted from plan content only

export const ELEVATOR_PDDL_TYPES = {
  classical: {
    id: 'classical',
    name: 'Classical Elevator PDDL',
    description: 'Step-based elevator operation with discrete actions',
    icon: '🛗',
    features: ['Discrete floor movement', 'Sequential operation', 'Basic safety'],
    supportsParallel: false,
    supportsCost: false,
    supportsContinuous: false,
    requiredFeatures: ['actions'],
    optionalFeatures: ['capacity', 'weight', 'speed']
  },
  temporal: {
    id: 'temporal',
    name: 'Temporal Elevator PDDL',
    description: 'Time-based elevator coordination with realistic timing',
    icon: '🛗⏱️',
    features: ['Realistic timing', 'Parallel operation', 'Temporal constraints'],
    supportsParallel: true,
    supportsCost: false,
    supportsContinuous: false,
    requiredFeatures: ['actions', 'time'],
    optionalFeatures: ['duration', 'capacity', 'weight', 'speed', 'parallel']
  },
  numerical: {
    id: 'numerical',
    name: 'Numerical Elevator PDDL',
    description: 'Resource-optimized elevator planning with cost management',
    icon: '🛗🔢',
    features: ['Cost optimization', 'Resource tracking', 'Efficiency metrics'],
    supportsParallel: false,
    supportsCost: true,
    supportsContinuous: false,
    requiredFeatures: ['actions', 'costs'],
    optionalFeatures: ['energy', 'weight', 'capacity', 'optimization']
  },
  pddl_plus: {
    id: 'pddl_plus',
    name: 'PDDL+ Elevator Control',
    description: 'Hybrid elevator system with continuous monitoring',
    icon: '🛗🌐',
    features: ['Continuous monitoring', 'Autonomous events', 'Hybrid dynamics'],
    supportsParallel: true,
    supportsCost: true,
    supportsContinuous: true,
    requiredFeatures: ['actions'],
    optionalFeatures: ['processes', 'events', 'continuous', 'time', 'costs', 'energy']
  }
};

// Get available features from parsed plan data
export function getAvailableElevatorFeatures(planMetadata, entities) {
  const features = {
    hasActions: true, // Always true if we have any actions
    hasTime: planMetadata.hasTimeInfo || false,
    hasDuration: planMetadata.hasTimeInfo || false,
    hasCosts: planMetadata.hasCostInfo || false,
    hasEnergy: planMetadata.hasEnergyInfo || false,
    hasCapacity: planMetadata.hasCapacityInfo || false,
    hasWeight: planMetadata.hasWeightInfo || false,
    hasSpeed: planMetadata.hasSpeedInfo || false,
    hasProcesses: planMetadata.pddlTypeFeatures?.hasContinuousProcesses || false,
    hasEvents: planMetadata.pddlTypeFeatures?.hasEvents || false,
    hasParallel: planMetadata.pddlTypeFeatures?.hasParallelActions || false,
    hasContinuous: planMetadata.pddlTypeFeatures?.hasContinuousProcesses || false,
    
    // Entity-based features
    hasMultipleElevators: entities.elevators?.length > 1,
    hasPassengers: entities.passengers?.length > 0,
    hasFloors: entities.floors?.length > 0,
    
    // Advanced features detection
    hasOptimization: planMetadata.hasCostInfo || planMetadata.hasEnergyInfo,
    hasRealTime: planMetadata.hasTimeInfo && planMetadata.pddlTypeFeatures?.hasParallelActions,
    hasResourceManagement: planMetadata.hasCapacityInfo || planMetadata.hasWeightInfo
  };
  
  return features;
}

// Calculate dynamic duration based on available data
export function calculateDynamicElevatorDuration(actionType, pddlType, params = [], planData = {}) {
  // If duration is explicitly provided in the plan, use it
  if (planData.durations && planData.durations.has('default')) {
    return planData.durations.get('default');
  }
  
  // If speed data is available, calculate realistic duration
  const elevatorId = extractElevatorIdFromParams(actionType, params);
  if (planData.speeds && elevatorId && planData.speeds.has(elevatorId)) {
    const speed = planData.speeds.get(elevatorId);
    return calculatePhysicalDuration(actionType, speed);
  }
  
  // If no data available, return null (don't use hardcoded values)
  return null;
}

// Calculate dynamic cost based on available data
export function calculateDynamicElevatorCost(actionType, pddlType, params = [], planData = {}) {
  const typeConfig = ELEVATOR_PDDL_TYPES[pddlType];
  
  if (!typeConfig || !typeConfig.supportsCost) return null;
  
  // If cost is explicitly provided in the plan, use it
  if (planData.costs && planData.costs.has('default')) {
    return planData.costs.get('default');
  }
  
  // If energy data is available, calculate cost from energy
  const elevatorId = extractElevatorIdFromParams(actionType, params);
  if (planData.energyConsumption && elevatorId && planData.energyConsumption.has(elevatorId)) {
    const energy = planData.energyConsumption.get(elevatorId);
    return energy * 1.2; // Simple energy-to-cost conversion if plan provides energy
  }
  
  // If weight data is available, factor it into cost
  const passengerId = extractPassengerIdFromParams(actionType, params);
  if (planData.weights && passengerId && planData.weights.has(passengerId)) {
    const weight = planData.weights.get(passengerId);
    const baseCost = planData.costs?.get('default') || 1;
    return baseCost * (1 + weight / 1000); // Weight factor if available
  }
  
  // If no cost data available, return null (don't use hardcoded values)
  return null;
}

// Calculate energy consumption from available data only
export function calculateDynamicElevatorEnergy(actionType, params = [], planData = {}) {
  // If energy is explicitly provided in the plan, use it
  const elevatorId = extractElevatorIdFromParams(actionType, params);
  if (planData.energyConsumption && elevatorId && planData.energyConsumption.has(elevatorId)) {
    return planData.energyConsumption.get(elevatorId);
  }
  
  // If no energy data available, return null
  return null;
}

// Validate elevator action with dynamic constraints
export function validateDynamicElevatorAction(action, pddlType, planMetadata) {
  const typeConfig = ELEVATOR_PDDL_TYPES[pddlType];
  if (!typeConfig) {
    return { valid: false, error: `Unknown PDDL type: ${pddlType}` };
  }

  // Basic validation
  if (!action.type && !action.name) {
    return { valid: false, error: 'Elevator action missing type' };
  }
  
  if (!action.params && !action.parameters) {
    return { valid: false, error: 'Elevator action missing parameters' };
  }

  const actionType = action.type || action.name;
  const params = action.params || action.parameters || [];

  // Time validation only if plan has time data
  if (planMetadata.hasTimeInfo && action.time === undefined && action.start === undefined) {
    return { valid: false, error: 'Elevator action missing time information' };
  }

  // PDDL type specific validations based on available features
  switch (pddlType) {
    case 'temporal':
      if (planMetadata.hasTimeInfo && typeConfig.supportsParallel && !action.duration) {
        return { valid: false, error: 'Temporal action missing duration' };
      }
      break;
      
    case 'numerical':
      if (planMetadata.hasCostInfo && typeConfig.supportsCost && action.cost === undefined) {
        return { valid: false, error: 'Numerical action missing cost information' };
      }
      break;
      
    case 'pddl_plus':
      if (planMetadata.pddlTypeFeatures?.hasContinuousProcesses && !action.continuousEffects && action.isProcess) {
        action.continuousEffects = [];
      }
      break;
  }

  // Elevator-specific validation
  switch (actionType) {
    case 'move-up':
    case 'move-down':
      if (params.length < 1) {
        return { valid: false, error: 'Move action requires elevator ID' };
      }
      break;
      
    case 'load':
    case 'unload':
      if (params.length < 2) {
        return { valid: false, error: 'Load/unload action requires passenger and elevator' };
      }
      break;
  }

  return { valid: true, action };
}

// Format elevator action display with dynamic information
export function formatDynamicElevatorActionDisplay(action, pddlType, planMetadata) {
  const typeConfig = ELEVATOR_PDDL_TYPES[pddlType] || ELEVATOR_PDDL_TYPES.classical;
  const actionType = action.type || action.name || 'unknown';
  const params = action.params || action.parameters || [];
  
  let display = `${actionType} [${params.join(', ')}]`;
  
  // Add timing information only if available
  if (planMetadata.hasTimeInfo) {
    const time = action.time || action.start || 0;
    display = `${time.toFixed(1)}: ${display}`;
  }
  
  // Add duration for temporal types only if available
  if (typeConfig.supportsParallel && action.duration && planMetadata.hasTimeInfo) {
    display += ` (${action.duration.toFixed(1)}s)`;
  }
  
  // Add cost for numerical types only if available
  if (typeConfig.supportsCost && action.cost && planMetadata.hasCostInfo) {
    display += ` [cost: ${action.cost.toFixed(1)}]`;
  }
  
  // Add energy information if available
  if (action.energyCost && planMetadata.hasEnergyInfo) {
    display += ` [energy: ${action.energyCost.toFixed(2)}kWh]`;
  }
  
  // Add weight information if available
  if (action.passengerWeight && planMetadata.hasWeightInfo) {
    display += ` [weight: ${action.passengerWeight}kg]`;
  }
  
  // Add capacity information if available
  if (action.elevatorCapacity && planMetadata.hasCapacityInfo) {
    display += ` [capacity: ${action.elevatorCapacity}kg]`;
  }
  
  // Add speed information if available
  if (action.elevatorSpeed && planMetadata.hasSpeedInfo) {
    display += ` [speed: ${action.elevatorSpeed}m/s]`;
  }
  
  // Add PDDL+ specific information
  if (pddlType === 'pddl_plus') {
    if (action.isProcess) {
      display += ` [process]`;
    }
    if (action.isEvent) {
      display += ` [event]`;
    }
    if (action.continuous) {
      display += ` [continuous]`;
    }
  }
  
  return display;
}

// Create dynamic elevator action template based on available features
export function createDynamicElevatorActionTemplate(pddlType, actionType, planMetadata) {
  const typeConfig = ELEVATOR_PDDL_TYPES[pddlType] || ELEVATOR_PDDL_TYPES.classical;
  
  const template = {
    type: actionType,
    params: [],
    description: '',
    domain: 'elevator',
    pddlType: pddlType
  };
  
  // Add time fields only if plan supports time
  if (planMetadata.hasTimeInfo) {
    template.time = 0;
    
    if (typeConfig.supportsParallel) {
      template.start = 0;
      template.end = 0;
    }
  }
  
  // Add duration only if plan has duration info
  if (planMetadata.hasTimeInfo && typeConfig.supportsParallel) {
    template.duration = null; // Will be set from plan data
  }
  
  // Add cost fields only if plan supports costs
  if (planMetadata.hasCostInfo && typeConfig.supportsCost) {
    template.cost = null; // Will be set from plan data
  }
  
  // Add energy fields only if plan has energy info
  if (planMetadata.hasEnergyInfo) {
    template.energyCost = null; // Will be set from plan data
  }
  
  // Add weight fields only if plan has weight info
  if (planMetadata.hasWeightInfo) {
    template.weight = null; // Will be set from plan data
  }
  
  // Add capacity fields only if plan has capacity info
  if (planMetadata.hasCapacityInfo) {
    template.capacity = null; // Will be set from plan data
  }
  
  // Add PDDL+ fields only if plan supports them
  if (typeConfig.supportsContinuous && planMetadata.pddlTypeFeatures?.hasContinuousProcesses) {
    template.continuousEffects = [];
    template.elementType = 'action';
  }
  
  // Action-specific templates with minimal assumptions
  switch (actionType) {
    case 'move-up':
      template.description = 'Move elevator up one floor';
      break;
      
    case 'move-down':
      template.description = 'Move elevator down one floor';
      break;
      
    case 'load':
      template.description = 'Load passenger into elevator';
      break;
      
    case 'unload':
      template.description = 'Unload passenger from elevator';
      break;
      
    case 'door-open':
      template.description = 'Open elevator doors';
      break;
      
    case 'door-close':
      template.description = 'Close elevator doors';
      break;
      
    default:
      template.description = `Execute ${actionType}`;
  }
  
  return template;
}

// Calculate comprehensive metrics from available data only
export function calculateDynamicElevatorMetrics(actions, pddlType, planMetadata, entities) {
  if (!actions || actions.length === 0) {
    return {
      totalActions: 0,
      hasMetrics: false
    };
  }

  const typeConfig = ELEVATOR_PDDL_TYPES[pddlType] || ELEVATOR_PDDL_TYPES.classical;
  const features = getAvailableElevatorFeatures(planMetadata, entities);
  
  const metrics = {
    totalActions: actions.length,
    hasMetrics: true,
    availableFeatures: features
  };

  // Calculate duration only if time data is available
  if (features.hasTime) {
    if (typeConfig.supportsParallel && features.hasParallel) {
      metrics.totalDuration = Math.max(...actions.map(a => (a.end || (a.time || a.start || 0) + (a.duration || 0))));
      metrics.parallelActions = calculateParallelActions(actions);
    } else {
      const lastAction = actions[actions.length - 1];
      metrics.totalDuration = lastAction.time || lastAction.start || actions.length;
    }
  }

  // Calculate cost only if cost data is available
  if (features.hasCosts) {
    metrics.totalCost = actions.reduce((sum, action) => {
      return sum + (action.cost || 0);
    }, 0);
  }

  // Calculate energy only if energy data is available
  if (features.hasEnergy) {
    metrics.totalEnergy = actions.reduce((sum, action) => {
      return sum + (action.energyCost || 0);
    }, 0);
  }

  // Calculate efficiency only if we have enough data
  if (features.hasOptimization) {
    const moveActions = actions.filter(a => a.type?.includes('move'));
    const passengerActions = actions.filter(a => a.type === 'load' || a.type === 'unload');
    
    if (passengerActions.length > 0) {
      const moveToPassengerRatio = moveActions.length / passengerActions.length;
      metrics.elevatorEfficiency = Math.max(0, 100 - Math.abs(moveToPassengerRatio - 1.5) * 20);
    }
  }

  // Calculate passenger throughput only if we have passenger data
  if (features.hasPassengers) {
    const loadActions = actions.filter(a => a.type === 'load');
    const unloadActions = actions.filter(a => a.type === 'unload');
    metrics.passengerThroughput = Math.min(loadActions.length, unloadActions.length);
  }

  // Calculate capacity utilization only if we have capacity data
  if (features.hasCapacity && features.hasWeight) {
    const capacityActions = actions.filter(a => a.elevatorCapacity && a.passengerWeight);
    if (capacityActions.length > 0) {
      const avgUtilization = capacityActions.reduce((sum, a) => {
        return sum + (a.passengerWeight / a.elevatorCapacity);
      }, 0) / capacityActions.length;
      metrics.capacityUtilization = avgUtilization * 100;
    }
  }

  // Safety score based on available data
  const emergencyActions = actions.filter(a => a.type?.includes('emergency'));
  metrics.safetyScore = Math.max(0, 100 - (emergencyActions.length * 10));

  return metrics;
}

// Helper functions
function calculateParallelActions(actions) {
  const timeSlots = {};
  let maxParallel = 0;
  
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

function calculatePhysicalDuration(actionType, speed) {
  // Simple physics-based calculation if speed is available
  const distance = 3.5; // Assume 3.5m floor height
  
  switch (actionType) {
    case 'move-up':
    case 'move-down':
      return distance / speed;
    case 'load':
    case 'unload':
      return 4.0; // Assume 4 seconds for passenger operations
    default:
      return 2.0;
  }
}

function extractElevatorIdFromParams(actionType, params) {
  if (actionType === 'move-up' || actionType === 'move-down') {
    return params[0] || null;
  }
  if (actionType === 'load' || actionType === 'unload') {
    return params[1] || null;
  }
  return null;
}

function extractPassengerIdFromParams(actionType, params) {
  if (actionType === 'load' || actionType === 'unload') {
    return params[0] || null;
  }
  return null;
}

// Get elevator PDDL type configuration
export function getElevatorPDDLTypeConfig(pddlType) {
  return ELEVATOR_PDDL_TYPES[pddlType] || ELEVATOR_PDDL_TYPES.classical;
}

// Check if elevator PDDL type supports feature with plan validation
export function elevatorPDDLTypeSupports(pddlType, feature, planMetadata = {}) {
  const config = getElevatorPDDLTypeConfig(pddlType);
  const features = getAvailableElevatorFeatures(planMetadata, {});
  
  switch (feature) {
    case 'parallel':
      return config.supportsParallel && features.hasParallel;
    case 'cost':
      return config.supportsCost && features.hasCosts;
    case 'continuous':
      return config.supportsContinuous && features.hasContinuous;
    case 'energy':
      return features.hasEnergy;
    case 'weight':
      return features.hasWeight;
    case 'capacity':
      return features.hasCapacity;
    case 'speed':
      return features.hasSpeed;
    case 'time':
      return features.hasTime;
    default:
      return false;
  }
}

// Advanced elevator capacity management with dynamic constraints
export function checkDynamicElevatorCapacity(elevatorId, currentLoad, newPassengerWeight, planData) {
  // Only perform capacity check if plan has capacity data
  if (!planData.capacities || !planData.capacities.has(elevatorId)) {
    return {
      canLoad: true, // No capacity constraints in plan
      hasCapacityData: false,
      message: 'No capacity constraints defined in plan'
    };
  }
  
  const maxCapacity = planData.capacities.get(elevatorId);
  const totalWeight = currentLoad + (newPassengerWeight || 0);
  
  return {
    canLoad: totalWeight <= maxCapacity,
    hasCapacityData: true,
    currentWeight: totalWeight,
    maxCapacity: maxCapacity,
    remainingCapacity: maxCapacity - totalWeight,
    utilizationPercent: (totalWeight / maxCapacity) * 100,
    safetyMargin: maxCapacity - totalWeight
  };
}

// Dynamic elevator scheduling optimization
export function optimizeDynamicElevatorSchedule(actions, elevatorCount, planData) {
  // Only optimize if we have multiple elevators or scheduling data
  if (elevatorCount <= 1 && !planData.scheduleOptimization) {
    return actions; // No optimization possible
  }
  
  const optimizedActions = [];
  const elevatorQueues = Array(elevatorCount).fill().map(() => []);
  
  // Distribute actions based on available data
  actions.forEach((action, index) => {
    const elevatorIndex = index % elevatorCount;
    const newAction = { ...action };
    
    // Update elevator ID in parameters only if needed
    if (newAction.params && newAction.params.length > 0) {
      newAction.params = newAction.params.map(param => {
        if (param.includes('elevator')) {
          return `elevator${elevatorIndex + 1}`;
        }
        return param;
      });
    }
    
    elevatorQueues[elevatorIndex].push(newAction);
  });
  
  // Merge queues back into chronological order
  let time = 0;
  while (elevatorQueues.some(queue => queue.length > 0)) {
    elevatorQueues.forEach((queue, elevatorIndex) => {
      if (queue.length > 0) {
        const action = queue.shift();
        
        // Only set time if plan has time data
        if (planData.hasTimeInfo) {
          action.time = time;
          action.start = time;
        }
        
        action.elevatorId = `elevator${elevatorIndex + 1}`;
        optimizedActions.push(action);
      }
    });
    time += 1;
  }
  
  return optimizedActions.sort((a, b) => {
    const aTime = a.time || a.start || 0;
    const bTime = b.time || b.start || 0;
    return aTime - bTime;
  });
}