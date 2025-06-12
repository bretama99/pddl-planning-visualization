// File: src/utils/robot/robotTypes.js
// Robot Domain-Specific PDDL Type Configuration and Utilities
// Supports all PDDL types: Classical, Temporal, Numerical, and PDDL+

export const ROBOT_PDDL_TYPES = {
  classical: {
    id: 'classical',
    name: 'Classical Robot PDDL',
    description: 'Step-based robot navigation with discrete actions',
    icon: '🤖',
    features: ['Discrete navigation', 'Object manipulation', 'Sequential execution'],
    defaultDuration: 1.0,
    supportsParallel: false,
    supportsCost: false,
    supportsContinuous: false,
    robotFeatures: {
      pathPlanning: 'basic',
      objectTracking: true,
      collisionAvoidance: 'simple',
      batteryManagement: false,
      multiRobotCoordination: false
    }
  },
  temporal: {
    id: 'temporal',
    name: 'Temporal Robot PDDL',
    description: 'Time-based robot coordination with durative actions',
    icon: '🤖⏱️',
    features: ['Durative movement', 'Temporal constraints', 'Parallel robot operation'],
    defaultDuration: 2.0,
    supportsParallel: true,
    supportsCost: false,
    supportsContinuous: false,
    robotFeatures: {
      pathPlanning: 'advanced',
      objectTracking: true,
      collisionAvoidance: 'temporal',
      batteryManagement: false,
      multiRobotCoordination: true,
      temporalSync: true
    }
  },
  numerical: {
    id: 'numerical',
    name: 'Numerical Robot PDDL',
    description: 'Resource-aware robot planning with optimization',
    icon: '🤖🔢',
    features: ['Battery optimization', 'Cost minimization', 'Resource constraints'],
    defaultDuration: 1.0,
    supportsParallel: false,
    supportsCost: true,
    supportsContinuous: false,
    robotFeatures: {
      pathPlanning: 'optimized',
      objectTracking: true,
      collisionAvoidance: 'cost-aware',
      batteryManagement: true,
      energyOptimization: true,
      loadCapacityTracking: true
    }
  },
  pddl_plus: {
    id: 'pddl_plus',
    name: 'PDDL+ Robot Planning',
    description: 'Hybrid robot control with continuous processes',
    icon: '🤖🌐',
    features: ['Continuous navigation', 'Sensor integration', 'Autonomous behavior'],
    defaultDuration: 2.0,
    supportsParallel: true,
    supportsCost: true,
    supportsContinuous: true,
    robotFeatures: {
      pathPlanning: 'continuous',
      objectTracking: true,
      collisionAvoidance: 'predictive',
      batteryManagement: true,
      sensorIntegration: true,
      autonomousDecisions: true,
      environmentMapping: true
    }
  }
};

// Robot-specific action duration calculations
export function calculateRobotDuration(actionType, pddlType) {
  const typeConfig = ROBOT_PDDL_TYPES[pddlType] || ROBOT_PDDL_TYPES.classical;
  
  // Base durations for robot actions
  const baseDurations = {
    'move': 3.0,      // Room-to-room navigation
    'pick': 1.5,      // Object pickup
    'pick-up': 1.5,
    'pickup': 1.5,
    'drop': 1.5,      // Object placement
    'put-down': 1.5,
    'putdown': 1.5,
    'navigate': 4.0,  // Complex navigation
    'search': 5.0,    // Object search
    'charge': 10.0    // Battery charging
  };
  
  let baseDuration = baseDurations[actionType] || typeConfig.defaultDuration;
  
  // Apply PDDL-type specific modifiers for robots
  switch (pddlType) {
    case 'temporal':
      // Temporal PDDL: More realistic timing
      if (typeConfig.robotFeatures.multiRobotCoordination) {
        baseDuration *= 1.1; // Coordination overhead
      }
      break;
      
    case 'numerical':
      // Numerical PDDL: Optimize for energy efficiency
      if (typeConfig.robotFeatures.energyOptimization) {
        baseDuration *= 1.2; // Slower for efficiency
      }
      break;
      
    case 'pddl_plus':
      // PDDL+: Continuous processes take different time
      if (typeConfig.robotFeatures.autonomousDecisions) {
        baseDuration *= 0.9; // Autonomous optimization
      }
      break;
      
    default:
      // Classical PDDL: Fixed duration
      break;
  }
  
  return baseDuration;
}

// Robot-specific cost calculations
export function calculateRobotCost(actionType, pddlType, params = []) {
  const typeConfig = ROBOT_PDDL_TYPES[pddlType] || ROBOT_PDDL_TYPES.classical;
  
  if (!typeConfig.supportsCost) return 1;
  
  // Base costs for robot actions
  const baseCosts = {
    'move': 2.0,      // Movement energy cost
    'pick': 1.0,      // Manipulation cost
    'pick-up': 1.0,
    'pickup': 1.0,
    'drop': 1.0,
    'put-down': 1.0,
    'putdown': 1.0,
    'navigate': 3.0,  // Complex navigation cost
    'search': 4.0,    // Sensor usage cost
    'charge': -5.0    // Negative cost (gains energy)
  };
  
  let baseCost = baseCosts[actionType] || 1.0;
  
  // Apply robot-specific cost modifiers
  if (pddlType === 'numerical') {
    if (typeConfig.robotFeatures.batteryManagement) {
      // Adjust cost based on battery level simulation
      const batteryFactor = Math.random() * 0.5 + 0.75; // 75-125%
      baseCost *= batteryFactor;
    }
    
    if (typeConfig.robotFeatures.loadCapacityTracking) {
      // Adjust cost based on object count
      const objectCount = params.filter(p => p.includes('obj') || p.includes('box')).length;
      baseCost *= Math.max(1.0, 1.0 + (objectCount * 0.2));
    }
  }
  
  return baseCost;
}

// Calculate robot energy consumption
export function calculateRobotEnergyCost(actionType) {
  const energyCosts = {
    'move': 0.08,      // Moving between rooms
    'pick': 0.03,      // Arm movement
    'pick-up': 0.03,
    'pickup': 0.03,
    'drop': 0.03,
    'put-down': 0.03,
    'putdown': 0.03,
    'navigate': 0.12,  // Complex navigation
    'search': 0.15,    // Sensor activation
    'charge': -0.50    // Charging (negative = gain)
  };
  
  return energyCosts[actionType] || 0.05;
}

// Robot action validation
export function validateRobotAction(action, pddlType) {
  const typeConfig = ROBOT_PDDL_TYPES[pddlType];
  if (!typeConfig) {
    return { valid: false, error: `Unknown PDDL type: ${pddlType}` };
  }

  // Basic validation
  if (!action.name && !action.type) {
    return { valid: false, error: 'Robot action missing name/type' };
  }
  
  if (!action.parameters && !action.params) {
    return { valid: false, error: 'Robot action missing parameters' };
  }

  const actionType = action.name || action.type;
  const params = action.parameters || action.params || [];

  // Robot-specific validation
  switch (actionType) {
    case 'move':
      if (params.length < 3) {
        return { valid: false, error: 'Move action requires robot, from-room, to-room' };
      }
      break;
      
    case 'pick':
    case 'pick-up':
    case 'pickup':
      if (params.length < 3) {
        return { valid: false, error: 'Pick action requires object, room, robot' };
      }
      break;
      
    case 'drop':
    case 'put-down':
    case 'putdown':
      if (params.length < 3) {
        return { valid: false, error: 'Drop action requires object, room, robot' };
      }
      break;
  }

  // Duration validation for temporal types
  if (typeConfig.supportsParallel && !action.duration) {
    action.duration = calculateRobotDuration(actionType, pddlType);
  }

  // Cost validation for numerical types
  if (typeConfig.supportsCost && action.cost === undefined) {
    action.cost = calculateRobotCost(actionType, pddlType, params);
  }

  return { valid: true, action };
}

// Format robot action display
export function formatRobotActionDisplay(action, pddlType) {
  const typeConfig = ROBOT_PDDL_TYPES[pddlType] || ROBOT_PDDL_TYPES.classical;
  const actionType = action.name || action.type || 'unknown';
  const params = action.parameters || action.params || [];
  
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
  
  // Add robot-specific information
  if (actionType === 'move' && params.length >= 3) {
    display += ` [${params[0]}: ${params[1]} → ${params[2]}]`;
  }
  
  if ((actionType === 'pick' || actionType.includes('pick')) && params.length >= 3) {
    display += ` [${params[2]} picks ${params[0]}]`;
  }
  
  if (typeConfig.supportsCost && action.energyCost) {
    display += ` [energy: ${action.energyCost.toFixed(2)}kWh]`;
  }
  
  return display;
}

// Create robot action template
export function createRobotActionTemplate(pddlType, actionType) {
  const typeConfig = ROBOT_PDDL_TYPES[pddlType] || ROBOT_PDDL_TYPES.classical;
  
  const template = {
    time: 0,
    name: actionType,
    parameters: [],
    description: '',
    domain: 'robot',
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
    template.energyCost = calculateRobotEnergyCost(actionType);
  }
  
  // Robot-specific templates
  switch (actionType) {
    case 'move':
      template.parameters = ['robot1', 'roomA', 'roomB'];
      template.description = 'Robot moves between rooms';
      break;
      
    case 'pick':
    case 'pick-up':
      template.parameters = ['obj1', 'room1', 'robot1'];
      template.description = 'Robot picks up object';
      break;
      
    case 'drop':
    case 'put-down':
      template.parameters = ['obj1', 'room1', 'robot1'];
      template.description = 'Robot puts down object';
      break;
      
    case 'navigate':
      template.parameters = ['robot1', 'path1'];
      template.description = 'Robot follows navigation path';
      break;
      
    case 'search':
      template.parameters = ['robot1', 'obj1', 'room1'];
      template.description = 'Robot searches for object';
      break;
  }
  
  if (typeConfig.supportsCost) {
    template.cost = calculateRobotCost(actionType, pddlType, template.parameters);
  }
  
  if (typeConfig.supportsParallel) {
    template.duration = calculateRobotDuration(actionType, pddlType);
  }
  
  return template;
}

// Calculate robot-specific metrics
export function calculateRobotMetrics(actions, pddlType) {
  if (!actions || actions.length === 0) {
    return {
      totalActions: 0,
      totalDuration: 0,
      totalCost: 0,
      robotEfficiency: 100,
      energyConsumption: 0,
      tasksCompleted: 0,
      navigationEfficiency: 100
    };
  }

  const typeConfig = ROBOT_PDDL_TYPES[pddlType] || ROBOT_PDDL_TYPES.classical;
  const metrics = {
    totalActions: actions.length,
    totalDuration: 0,
    totalCost: 0,
    robotEfficiency: 100,
    energyConsumption: 0,
    tasksCompleted: 0,
    navigationEfficiency: 100
  };

  // Calculate cost if supported
  if (typeConfig.supportsCost) {
    metrics.totalCost = actions.reduce((sum, action) => {
      return sum + calculateRobotCost(action.name || action.type, pddlType, action.parameters || action.params);
    }, 0);
  }

  // Calculate duration
  if (typeConfig.supportsParallel) {
    metrics.totalDuration = Math.max(...actions.map(a => (a.end || (a.time || a.start || 0) + (a.duration || typeConfig.defaultDuration))));
  } else {
    const lastAction = actions[actions.length - 1];
    metrics.totalDuration = lastAction.time || lastAction.start || actions.length;
  }

  // Robot-specific metrics
  const moveActions = actions.filter(a => (a.name || a.type || '').includes('move'));
  const taskActions = actions.filter(a => 
    (a.name || a.type || '').includes('pick') || 
    (a.name || a.type || '').includes('drop')
  );
  
  // Calculate robot efficiency
  if (taskActions.length > 0) {
    const moveToTaskRatio = moveActions.length / taskActions.length;
    const idealRatio = 1.2; // Ideal: slightly more moves than tasks
    metrics.robotEfficiency = Math.max(0, 100 - Math.abs(moveToTaskRatio - idealRatio) * 30);
  }
  
  // Calculate energy consumption for numerical/PDDL+ types
  if (typeConfig.supportsCost || typeConfig.supportsContinuous) {
    metrics.energyConsumption = actions.reduce((sum, action) => {
      const energyCost = calculateRobotEnergyCost(action.name || action.type);
      return sum + energyCost;
    }, 0);
  }
  
  // Calculate tasks completed
  const pickActions = actions.filter(a => (a.name || a.type || '').includes('pick'));
  const dropActions = actions.filter(a => (a.name || a.type || '').includes('drop'));
  metrics.tasksCompleted = Math.min(pickActions.length, dropActions.length);
  
  // Calculate navigation efficiency
  if (moveActions.length > 0) {
    const uniqueRooms = new Set();
    moveActions.forEach(action => {
      const params = action.parameters || action.params || [];
      if (params.length >= 3) {
        uniqueRooms.add(params[1]); // from room
        uniqueRooms.add(params[2]); // to room
      }
    });
    
    const roomCoverage = uniqueRooms.size;
    const movesPerRoom = moveActions.length / Math.max(1, roomCoverage);
    metrics.navigationEfficiency = Math.max(0, 100 - (movesPerRoom - 1) * 20);
  }

  return metrics;
}

// Get robot PDDL type configuration
export function getRobotPDDLTypeConfig(pddlType) {
  return ROBOT_PDDL_TYPES[pddlType] || ROBOT_PDDL_TYPES.classical;
}

// Check if robot PDDL type supports feature
export function robotPDDLTypeSupports(pddlType, feature) {
  const config = getRobotPDDLTypeConfig(pddlType);
  switch (feature) {
    case 'parallel':
      return config.supportsParallel;
    case 'cost':
      return config.supportsCost;
    case 'continuous':
      return config.supportsContinuous;
    case 'batteryManagement':
      return config.robotFeatures?.batteryManagement || false;
    case 'multiRobotCoordination':
      return config.robotFeatures?.multiRobotCoordination || false;
    case 'energyOptimization':
      return config.robotFeatures?.energyOptimization || false;
    default:
      return false;
  }
}