// File: src/utils/elevator/elevatorTypes.js
// Elevator Domain-Specific PDDL Type Configuration and Utilities
// Supports all PDDL types: Classical, Temporal, Numerical, and PDDL+

export const ELEVATOR_PDDL_TYPES = {
  classical: {
    id: 'classical',
    name: 'Classical Elevator PDDL',
    description: 'Step-based elevator operation with discrete actions',
    icon: '🛗',
    features: ['Discrete floor movement', 'Simple passenger loading', 'Sequential operation'],
    defaultDuration: 1.0,
    supportsParallel: false,
    supportsCost: false,
    supportsContinuous: false,
    elevatorFeatures: {
      capacityTracking: true,
      stepBasedMovement: true,
      simpleScheduling: true,
      basicSafety: true,
      energyTracking: false,
      multiElevatorSupport: false
    }
  },
  temporal: {
    id: 'temporal',
    name: 'Temporal Elevator PDDL',
    description: 'Time-based elevator coordination with realistic timing',
    icon: '🛗⏱️',
    features: ['Realistic movement timing', 'Parallel elevator operation', 'Door timing optimization'],
    defaultDuration: 2.0,
    supportsParallel: true,
    supportsCost: false,
    supportsContinuous: false,
    elevatorFeatures: {
      realisticTiming: true,
      parallelElevators: true,
      temporalConstraints: true,
      smartScheduling: true,
      doorTimingOptimization: true,
      multiElevatorSupport: true
    }
  },
  numerical: {
    id: 'numerical',
    name: 'Numerical Elevator PDDL',
    description: 'Resource-optimized elevator planning with energy management',
    icon: '🛗🔢',
    features: ['Energy optimization', 'Cost minimization', 'Load capacity management'],
    defaultDuration: 1.0,
    supportsParallel: false,
    supportsCost: true,
    supportsContinuous: false,
    elevatorFeatures: {
      energyOptimization: true,
      costMinimization: true,
      resourceTracking: true,
      loadOptimization: true,
      maintenanceCosts: true,
      capacityTracking: true
    }
  },
  pddl_plus: {
    id: 'pddl_plus',
    name: 'PDDL+ Elevator Control',
    description: 'Hybrid elevator system with continuous monitoring',
    icon: '🛗🌐',
    features: ['Continuous monitoring', 'Autonomous events', 'Predictive maintenance'],
    defaultDuration: 2.0,
    supportsParallel: true,
    supportsCost: true,
    supportsContinuous: true,
    elevatorFeatures: {
      continuousMonitoring: true,
      autonomousEvents: true,
      environmentalFactors: true,
      processControl: true,
      hybridSafety: true,
      predictiveMaintenance: true,
      smartDispatch: true
    }
  }
};

// Enhanced elevator-specific duration calculations
export function calculateElevatorDuration(actionType, pddlType, params = []) {
  const typeConfig = ELEVATOR_PDDL_TYPES[pddlType] || ELEVATOR_PDDL_TYPES.classical;
  
  // Base durations for elevator actions (in seconds)
  const baseDurations = {
    'move-up': 3.5,         // Floor-to-floor up movement
    'move-down': 3.2,       // Floor-to-floor down movement (gravity assist)
    'load': 4.5,            // Door operation + passenger boarding
    'unload': 4.0,          // Door operation + passenger exiting
    'emergency-stop': 0.5,  // Immediate emergency stop
    'door-open': 2.5,       // Door opening sequence
    'door-close': 2.0,      // Door closing sequence
    'maintenance': 30.0,    // Maintenance operations
    'inspection': 15.0,     // Safety inspection
    'calibrate': 10.0       // System calibration
  };
  
  let baseDuration = baseDurations[actionType] || typeConfig.defaultDuration;
  
  // Apply PDDL-type specific modifiers for elevators
  switch (pddlType) {
    case 'temporal':
      // Temporal PDDL: Consider real-world timing constraints
      if (typeConfig.elevatorFeatures.doorTimingOptimization) {
        if (actionType === 'load' || actionType === 'unload') {
          baseDuration *= 0.9; // Optimized door timing
        }
      }
      if (typeConfig.elevatorFeatures.parallelElevators) {
        baseDuration *= 0.95; // Slight efficiency gain from coordination
      }
      break;
      
    case 'numerical':
      // Numerical PDDL: Duration based on energy/cost optimization
      if (typeConfig.elevatorFeatures.energyOptimization) {
        baseDuration *= 1.1; // Slower movement for energy efficiency
      }
      if (typeConfig.elevatorFeatures.loadOptimization) {
        // Adjust duration based on passenger count
        const passengerCount = params.filter(p => p.includes('person') || p.includes('passenger')).length;
        baseDuration *= Math.max(0.8, 1.0 + (passengerCount * 0.05));
      }
      break;
      
    case 'pddl_plus':
      // PDDL+: Consider environmental factors
      if (typeConfig.elevatorFeatures.environmentalFactors) {
        baseDuration *= (0.9 + Math.random() * 0.2); // Environmental variation ±10%
      }
      if (typeConfig.elevatorFeatures.continuousMonitoring) {
        baseDuration *= 1.05; // Slight overhead for monitoring
      }
      break;
      
    default:
      // Classical PDDL: Fixed duration
      break;
  }
  
  return baseDuration;
}

// Enhanced elevator-specific cost calculations
export function calculateElevatorCost(actionType, pddlType, params = []) {
  const typeConfig = ELEVATOR_PDDL_TYPES[pddlType] || ELEVATOR_PDDL_TYPES.classical;
  
  if (!typeConfig.supportsCost) return 1;
  
  // Base costs for elevator actions
  const baseCosts = {
    'move-up': 5.0,         // Higher energy cost going up
    'move-down': 2.0,       // Lower cost with regenerative braking
    'load': 1.5,            // Door operation + lighting
    'unload': 1.5,          // Door operation + lighting
    'emergency-stop': 10.0, // High cost for emergency procedures
    'door-open': 0.5,       // Door motor operation
    'door-close': 0.5,      // Door motor operation
    'maintenance': 50.0,    // Maintenance costs
    'inspection': 25.0,     // Inspection costs
    'calibrate': 15.0       // Calibration costs
  };
  
  let baseCost = baseCosts[actionType] || 1.0;
  
  // Apply elevator-specific cost modifiers
  if (pddlType === 'numerical') {
    if (typeConfig.elevatorFeatures.maintenanceCosts) {
      baseCost *= 1.2; // Include maintenance amortization
    }
    
    if (typeConfig.elevatorFeatures.loadOptimization) {
      // Adjust cost based on passenger weight and count
      const passengerCount = params.filter(p => p.includes('person') || p.includes('passenger')).length;
      const weightFactor = Math.max(0.5, 1.0 + (passengerCount * 0.1));
      baseCost *= weightFactor;
    }
    
    if (typeConfig.elevatorFeatures.energyOptimization) {
      // Time-of-day energy pricing simulation
      const hour = new Date().getHours();
      const peakHours = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
      if (peakHours) {
        baseCost *= 1.3; // Peak energy pricing
      }
    }
  }
  
  return baseCost;
}

// Calculate elevator energy consumption
export function calculateElevatorEnergyCost(actionType, floors = 1, weight = 0) {
  const baseEnergyConsumption = {
    'move-up': 0.15,        // kWh per floor up
    'move-down': 0.05,      // kWh per floor down (regenerative)
    'load': 0.02,           // Door and lighting energy
    'unload': 0.02,         // Door and lighting energy
    'emergency-stop': 0.08, // Emergency braking energy
    'door-open': 0.01,      // Door motor energy
    'door-close': 0.01,     // Door motor energy
    'maintenance': 0.5,     // Maintenance equipment energy
    'inspection': 0.2       // Inspection equipment energy
  };
  
  let energyCost = baseEnergyConsumption[actionType] || 0.03;
  
  // Adjust for floors moved
  if (actionType === 'move-up' || actionType === 'move-down') {
    energyCost *= floors;
  }
  
  // Adjust for passenger weight
  if (weight > 0 && (actionType === 'move-up' || actionType === 'move-down')) {
    const weightFactor = 1.0 + (weight / 1000); // 1000kg baseline
    energyCost *= weightFactor;
  }
  
  return energyCost;
}

// Elevator action validation
export function validateElevatorAction(action, pddlType) {
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

  // Time validation
  if (action.time === undefined && action.start === undefined) {
    return { valid: false, error: 'Elevator action missing time information' };
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

  // Duration validation for temporal types
  if (typeConfig.supportsParallel && !action.duration) {
    action.duration = calculateElevatorDuration(actionType, pddlType, params);
  }

  // Cost validation for numerical types
  if (typeConfig.supportsCost && action.cost === undefined) {
    action.cost = calculateElevatorCost(actionType, pddlType, params);
  }

  // Elevator-specific enhancements
  if (pddlType === 'numerical' && typeConfig.elevatorFeatures.energyOptimization) {
    if (!action.energyCost) {
      action.energyCost = calculateElevatorEnergyCost(actionType);
    }
  }
  
  if (pddlType === 'pddl_plus' && typeConfig.elevatorFeatures.continuousMonitoring) {
    if (!action.continuousEffects) {
      action.continuousEffects = [];
    }
  }

  return { valid: true, action };
}

// Format elevator action display
export function formatElevatorActionDisplay(action, pddlType) {
  const typeConfig = ELEVATOR_PDDL_TYPES[pddlType] || ELEVATOR_PDDL_TYPES.classical;
  const actionType = action.type || action.name || 'unknown';
  const params = action.params || action.parameters || [];
  
  let display = `${actionType} [${params.join(', ')}]`;
  
  // Add timing information
  const time = action.time || action.start || 0;
  display = `${time.toFixed(1)}: ${display}`;
  
  // Add duration for temporal types
  if (typeConfig.supportsParallel && action.duration) {
    display += ` (${action.duration.toFixed(1)}s)`;
  }
  
  // Add cost for numerical types
  if (typeConfig.supportsCost && action.cost) {
    display += ` [cost: ${action.cost.toFixed(1)}]`;
  }
  
  // Add elevator-specific information
  if (actionType === 'move-up' || actionType === 'move-down') {
    const direction = actionType === 'move-up' ? '↑' : '↓';
    display += ` ${direction}`;
  }
  
  if (actionType === 'load' && params.length >= 2) {
    display += ` [${params[0]} → ${params[1]}]`;
  }
  
  if (actionType === 'unload' && params.length >= 2) {
    display += ` [${params[0]} ← ${params[1]}]`;
  }
  
  if (pddlType === 'numerical' && action.energyCost) {
    display += ` [energy: ${action.energyCost.toFixed(2)}kWh]`;
  }
  
  if (pddlType === 'pddl_plus' && action.continuousEffects) {
    display += ` [continuous]`;
  }
  
  return display;
}

// Create elevator action template
export function createElevatorActionTemplate(pddlType, actionType) {
  const typeConfig = ELEVATOR_PDDL_TYPES[pddlType] || ELEVATOR_PDDL_TYPES.classical;
  
  const template = {
    time: 0,
    type: actionType,
    params: [],
    description: '',
    domain: 'elevator',
    pddlType: pddlType
  };
  
  // Add temporal fields
  if (typeConfig.supportsParallel) {
    template.start = 0;
    template.duration = typeConfig.defaultDuration;
    template.end = template.duration;
  }
  
  // Add numerical fields
  if (typeConfig.supportsCost) {
    template.cost = 1.0;
  }
  
  // Elevator-specific templates
  switch (actionType) {
    case 'move-up':
      template.params = ['elevator1'];
      template.description = 'Move elevator up one floor';
      break;
      
    case 'move-down':
      template.params = ['elevator1'];
      template.description = 'Move elevator down one floor';
      break;
      
    case 'load':
      template.params = ['person1', 'elevator1'];
      template.description = 'Load passenger into elevator';
      break;
      
    case 'unload':
      template.params = ['person1', 'elevator1'];
      template.description = 'Unload passenger from elevator';
      break;
      
    case 'door-open':
      template.params = ['elevator1'];
      template.description = 'Open elevator doors';
      break;
      
    case 'door-close':
      template.params = ['elevator1'];
      template.description = 'Close elevator doors';
      break;
  }
  
  // Enhanced elevator template features
  if (typeConfig.supportsCost) {
    template.cost = calculateElevatorCost(actionType, pddlType, template.params);
    template.energyCost = calculateElevatorEnergyCost(actionType);
  }
  
  if (typeConfig.supportsParallel) {
    template.duration = calculateElevatorDuration(actionType, pddlType, template.params);
  }
  
  if (typeConfig.supportsContinuous) {
    template.continuousEffects = [];
    template.elementType = 'action';
  }
  
  return template;
}

// Calculate elevator-specific metrics
export function calculateElevatorMetrics(actions, pddlType) {
  if (!actions || actions.length === 0) {
    return {
      totalActions: 0,
      totalDuration: 0,
      totalCost: 0,
      elevatorEfficiency: 100,
      energyConsumption: 0,
      passengerThroughput: 0,
      safetyScore: 100,
      waitTimeOptimization: 100
    };
  }

  const typeConfig = ELEVATOR_PDDL_TYPES[pddlType] || ELEVATOR_PDDL_TYPES.classical;
  const metrics = {
    totalActions: actions.length,
    totalDuration: 0,
    totalCost: 0,
    elevatorEfficiency: 100,
    energyConsumption: 0,
    passengerThroughput: 0,
    safetyScore: 100,
    waitTimeOptimization: 100
  };

  // Calculate cost if supported
  if (typeConfig.supportsCost) {
    metrics.totalCost = actions.reduce((sum, action) => {
      return sum + calculateElevatorCost(action.type || action.name, pddlType, action.params || action.parameters);
    }, 0);
  }

  // Calculate duration
  if (typeConfig.supportsParallel) {
    metrics.totalDuration = Math.max(...actions.map(a => (a.end || (a.time || a.start || 0) + (a.duration || typeConfig.defaultDuration))));
  } else {
    const lastAction = actions[actions.length - 1];
    metrics.totalDuration = lastAction.time || lastAction.start || actions.length;
  }

  // Enhanced elevator-specific metrics
  const elevatorActions = actions.filter(a => 
    (a.type || a.name || '').includes('move') || 
    (a.type || a.name || '').includes('load') || 
    (a.type || a.name || '').includes('unload')
  );
  
  if (elevatorActions.length > 0) {
    // Calculate elevator efficiency
    const moveActions = elevatorActions.filter(a => 
      (a.type || a.name || '').includes('move'));
    const passengerActions = elevatorActions.filter(a => 
      (a.type || a.name || '').includes('load') || 
      (a.type || a.name || '').includes('unload'));
    
    if (passengerActions.length > 0) {
      const moveToPassengerRatio = moveActions.length / passengerActions.length;
      metrics.elevatorEfficiency = Math.max(0, 100 - Math.abs(moveToPassengerRatio - 1.5) * 20);
    }
    
    // Calculate energy consumption for numerical/PDDL+ types
    if (typeConfig.supportsCost || typeConfig.supportsContinuous) {
      metrics.energyConsumption = elevatorActions.reduce((sum, action) => {
        const energyCost = calculateElevatorEnergyCost(action.type || action.name);
        return sum + energyCost;
      }, 0);
    }
    
    // Calculate passenger throughput
    const loadActions = actions.filter(a => (a.type || a.name || '').includes('load'));
    const unloadActions = actions.filter(a => (a.type || a.name || '').includes('unload'));
    metrics.passengerThroughput = Math.min(loadActions.length, unloadActions.length);
    
    // Calculate safety score
    const emergencyActions = actions.filter(a => 
      (a.type || a.name || '').includes('emergency'));
    metrics.safetyScore = Math.max(0, 100 - (emergencyActions.length * 10));
    
    // Calculate wait time optimization (simplified)
    if (typeConfig.elevatorFeatures.smartScheduling) {
      const avgActionsPerMinute = actions.length / (metrics.totalDuration / 60);
      metrics.waitTimeOptimization = Math.min(100, avgActionsPerMinute * 15);
    }
  }

  return metrics;
}

// Get elevator PDDL type configuration
export function getElevatorPDDLTypeConfig(pddlType) {
  return ELEVATOR_PDDL_TYPES[pddlType] || ELEVATOR_PDDL_TYPES.classical;
}

// Check if elevator PDDL type supports feature
export function elevatorPDDLTypeSupports(pddlType, feature) {
  const config = getElevatorPDDLTypeConfig(pddlType);
  switch (feature) {
    case 'parallel':
      return config.supportsParallel;
    case 'cost':
      return config.supportsCost;
    case 'continuous':
      return config.supportsContinuous;
    case 'energyOptimization':
      return config.elevatorFeatures?.energyOptimization || false;
    case 'multiElevatorSupport':
      return config.elevatorFeatures?.multiElevatorSupport || false;
    case 'smartScheduling':
      return config.elevatorFeatures?.smartScheduling || false;
    case 'continuousMonitoring':
      return config.elevatorFeatures?.continuousMonitoring || false;
    case 'predictiveMaintenance':
      return config.elevatorFeatures?.predictiveMaintenance || false;
    default:
      return false;
  }
}

// Advanced elevator capacity management
export function checkElevatorCapacity(elevatorId, currentLoad, newPassengers = 1, maxCapacity = 1000) {
  const weightPerPassenger = 75; // kg average
  const totalWeight = currentLoad + (newPassengers * weightPerPassenger);
  
  return {
    canLoad: totalWeight <= maxCapacity,
    currentWeight: totalWeight,
    remainingCapacity: maxCapacity - totalWeight,
    utilizationPercent: (totalWeight / maxCapacity) * 100,
    safetyMargin: maxCapacity - totalWeight
  };
}

// Elevator scheduling optimization
export function optimizeElevatorSchedule(actions, elevatorCount = 1) {
  if (elevatorCount === 1) return actions;
  
  // Distribute actions across multiple elevators
  const optimizedActions = [];
  const elevatorQueues = Array(elevatorCount).fill().map(() => []);
  
  actions.forEach((action, index) => {
    const elevatorIndex = index % elevatorCount;
    const newAction = { ...action };
    
    // Update elevator ID in parameters
    if (newAction.params && newAction.params.length > 0) {
      newAction.params = newAction.params.map(param => 
        param.includes('elevator') ? `elevator${elevatorIndex + 1}` : param
      );
    }
    
    elevatorQueues[elevatorIndex].push(newAction);
  });
  
  // Merge queues back into chronological order
  let time = 0;
  while (elevatorQueues.some(queue => queue.length > 0)) {
    elevatorQueues.forEach((queue, elevatorIndex) => {
      if (queue.length > 0) {
        const action = queue.shift();
        action.time = time;
        action.start = time;
        action.elevatorId = `elevator${elevatorIndex + 1}`;
        optimizedActions.push(action);
      }
    });
    time += 1;
  }
  
  return optimizedActions.sort((a, b) => (a.time || 0) - (b.time || 0));
}