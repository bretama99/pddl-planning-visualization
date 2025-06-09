// utils/pddlTypes.js
// PDDL Type configurations and utilities

export const PDDL_TYPES = {
  classical: {
    id: 'classical',
    name: 'Classical PDDL',
    description: 'Step-based planning with discrete actions',
    icon: '🎯',
    features: ['Discrete actions', 'State-based', 'Sequential execution'],
    defaultDuration: 1.0,
    supportsParallel: false,
    supportsCost: false,
    supportsContinuous: false
  },
  
  temporal: {
    id: 'temporal',
    name: 'Temporal PDDL',
    description: 'Time-based planning with durative actions',
    icon: '⏱️',
    features: ['Durative actions', 'Temporal constraints', 'Parallel execution'],
    defaultDuration: 2.0,
    supportsParallel: true,
    supportsCost: false,
    supportsContinuous: false
  },
  
  numerical: {
    id: 'numerical',
    name: 'Numerical PDDL',
    description: 'Planning with numeric fluents and constraints',
    icon: '🔢',
    features: ['Numeric fluents', 'Cost optimization', 'Resource constraints'],
    defaultDuration: 1.0,
    supportsParallel: false,
    supportsCost: true,
    supportsContinuous: false
  },
  
  pddl_plus: {
    id: 'pddl_plus',
    name: 'PDDL+',
    description: 'Hybrid discrete/continuous planning',
    icon: '🌐',
    features: ['Continuous processes', 'Events', 'Hybrid dynamics'],
    defaultDuration: 2.0,
    supportsParallel: true,
    supportsCost: true,
    supportsContinuous: true
  }
};

// Calculate total duration for different PDDL types
export function calculateTotalDuration(actions, pddlType) {
  if (!actions || actions.length === 0) return 0;
  
  const typeConfig = PDDL_TYPES[pddlType] || PDDL_TYPES.classical;
  
  switch (pddlType) {
    case 'temporal':
    case 'pddl_plus':
      // For temporal PDDL, find the latest end time
      if (typeConfig.supportsParallel) {
        return Math.max(...actions.map(a => (a.end || (a.time || a.start || 0) + (a.duration || typeConfig.defaultDuration))));
      }
      // If no parallel support, sum durations
      return actions.reduce((total, a) => total + (a.duration || typeConfig.defaultDuration), 0);
    
    case 'numerical': {
      // For numerical PDDL, use the last action time
      const lastAction = actions[actions.length - 1];
      return lastAction.time || lastAction.start || actions.length;
    }
    
    case 'classical':
    default: {
      // For classical PDDL, use step count or last time
      const lastClassicalAction = actions[actions.length - 1];
      return lastClassicalAction.time || lastClassicalAction.start || actions.length;
    }
  }
}

// Calculate metrics based on PDDL type
export function calculatePDDLMetrics(actions, pddlType) {
  if (!actions || actions.length === 0) {
    return {
      totalActions: 0,
      totalDuration: 0,
      totalCost: 0,
      parallelActions: 0,
      maxParallelism: 0
    };
  }

  const typeConfig = PDDL_TYPES[pddlType] || PDDL_TYPES.classical;
  const metrics = {
    totalActions: actions.length,
    totalDuration: calculateTotalDuration(actions, pddlType),
    totalCost: 0,
    parallelActions: 0,
    maxParallelism: 0
  };

  // Calculate cost if supported
  if (typeConfig.supportsCost) {
    metrics.totalCost = actions.reduce((sum, action) => {
      return sum + (action.cost || 1.0);
    }, 0);
  }

  // Calculate parallelism if supported
  if (typeConfig.supportsParallel) {
    const timeSlices = getTimeSlices(actions);
    metrics.parallelActions = countParallelActions(timeSlices);
    metrics.maxParallelism = getMaxParallelism(timeSlices);
  }

  return metrics;
}

// Get time slices for parallel action analysis
function getTimeSlices(actions) {
  const events = [];
  
  actions.forEach(action => {
    const start = action.start || action.time || 0;
    const duration = action.duration || 1.0;
    const end = start + duration;
    
    events.push({ time: start, type: 'start', action });
    events.push({ time: end, type: 'end', action });
  });
  
  // Sort events by time
  events.sort((a, b) => a.time - b.time);
  
  const timeSlices = [];
  let activeActions = [];
  let currentTime = 0;
  
  events.forEach(event => {
    if (event.time > currentTime && activeActions.length > 0) {
      timeSlices.push({
        start: currentTime,
        end: event.time,
        actions: [...activeActions],
        parallelism: activeActions.length
      });
    }
    
    currentTime = event.time;
    
    if (event.type === 'start') {
      activeActions.push(event.action);
    } else {
      activeActions = activeActions.filter(a => a !== event.action);
    }
  });
  
  return timeSlices;
}

// Count actions that run in parallel
function countParallelActions(timeSlices) {
  return timeSlices.reduce((count, slice) => {
    return count + (slice.parallelism > 1 ? slice.actions.length : 0);
  }, 0);
}

// Get maximum number of actions running in parallel
function getMaxParallelism(timeSlices) {
  return Math.max(...timeSlices.map(slice => slice.parallelism), 0);
}

// Validate action format for PDDL type
export function validateActionForPDDLType(action, pddlType) {
  const typeConfig = PDDL_TYPES[pddlType];
  if (!typeConfig) {
    return { valid: false, error: `Unknown PDDL type: ${pddlType}` };
  }

  // Basic validation
  if (!action.type || !action.params) {
    return { valid: false, error: 'Action missing type or parameters' };
  }

  // Time validation
  if (action.time === undefined && action.start === undefined) {
    return { valid: false, error: 'Action missing time information' };
  }

  // Duration validation for temporal types
  if (typeConfig.supportsParallel && !action.duration) {
    action.duration = typeConfig.defaultDuration;
  }

  // Cost validation for numerical types
  if (typeConfig.supportsCost && action.cost === undefined) {
    action.cost = 1.0;
  }

  return { valid: true, action };
}

// Format action display based on PDDL type
export function formatActionDisplay(action, pddlType) {
  const typeConfig = PDDL_TYPES[pddlType] || PDDL_TYPES.classical;
  let display = `${action.type} [${action.params.join(', ')}]`;
  
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
  
  return display;
}

// Get PDDL type configuration
export function getPDDLTypeConfig(pddlType) {
  return PDDL_TYPES[pddlType] || PDDL_TYPES.classical;
}

// Check if PDDL type supports feature
export function pddlTypeSupports(pddlType, feature) {
  const config = getPDDLTypeConfig(pddlType);
  switch (feature) {
    case 'parallel':
      return config.supportsParallel;
    case 'cost':
      return config.supportsCost;
    case 'continuous':
      return config.supportsContinuous;
    default:
      return false;
  }
}

// Convert between PDDL types (basic conversion)
export function convertActionBetweenTypes(action, fromType, toType) {
  const fromConfig = getPDDLTypeConfig(fromType);
  const toConfig = getPDDLTypeConfig(toType);
  
  const convertedAction = { ...action };
  
  // Convert temporal to classical: remove duration
  if (fromConfig.supportsParallel && !toConfig.supportsParallel) {
    delete convertedAction.duration;
    delete convertedAction.end;
  }
  
  // Convert classical to temporal: add duration
  if (!fromConfig.supportsParallel && toConfig.supportsParallel) {
    convertedAction.duration = toConfig.defaultDuration;
    convertedAction.end = (convertedAction.start || convertedAction.time || 0) + convertedAction.duration;
  }
  
  // Convert from/to numerical: handle cost
  if (fromConfig.supportsCost && !toConfig.supportsCost) {
    delete convertedAction.cost;
  }
  
  if (!fromConfig.supportsCost && toConfig.supportsCost) {
    convertedAction.cost = 1.0;
  }
  
  return convertedAction;
}

// Create domain-specific action templates
export function createActionTemplate(domain, pddlType, actionType) {
  const typeConfig = getPDDLTypeConfig(pddlType);
  
  const template = {
    time: 0,
    type: actionType,
    params: [],
    description: '',
    domain: domain,
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
  
  // Domain-specific templates
  switch (domain) {
    case 'robot':
      template.params = actionType === 'move' ? ['robot1', 'roomA', 'roomB'] : 
                      actionType === 'pick-up' ? ['robot1', 'obj1'] :
                      actionType === 'put-down' ? ['robot1', 'obj1'] : [];
      break;
      
    case 'elevator':
      template.params = actionType === 'move-up' ? ['elevator1'] :
                      actionType === 'move-down' ? ['elevator1'] :
                      actionType === 'load' ? ['person1', 'elevator1'] :
                      actionType === 'unload' ? ['person1', 'elevator1'] : [];
      break;
      
    case 'logistics':
      template.params = actionType === 'drive' ? ['truck1', 'cityA', 'cityB'] :
                      actionType === 'fly' ? ['plane1', 'airport1', 'airport2'] :
                      actionType === 'load' ? ['package1', 'truck1'] :
                      actionType === 'unload' ? ['package1', 'truck1'] : [];
      break;
  }
  
  template.description = `${actionType} ${template.params.join(' ')}`;
  
  return template;
}

// Estimate action duration based on type and domain
export function estimateActionDuration(actionType, domain, pddlType) {
  const typeConfig = getPDDLTypeConfig(pddlType);
  
  // Base durations by domain and action type
  const durations = {
    robot: {
      move: 3.0,
      'pick-up': 2.0,
      'put-down': 2.0,
      navigate: 4.0
    },
    elevator: {
      'move-up': 3.0,
      'move-down': 3.0,
      load: 2.0,
      unload: 2.0,
      reached: 0.5
    },
    logistics: {
      drive: 10.0,
      fly: 15.0,
      load: 3.0,
      unload: 3.0
    }
  };
  
  const domainDurations = durations[domain] || {};
  const baseDuration = domainDurations[actionType] || typeConfig.defaultDuration;
  
  // Adjust for PDDL type
  switch (pddlType) {
    case 'temporal':
    case 'pddl_plus':
      return baseDuration;
    case 'numerical':
      return baseDuration * 0.8; // Numerical tends to be more optimized
    case 'classical':
    default:
      return 1.0; // Classical is step-based
  }
}

// Generate sample plan for testing
export function generateSamplePlan(domain, pddlType, actionCount = 10) {
  const actions = [];
  const typeConfig = getPDDLTypeConfig(pddlType);
  
  const actionTypes = {
    robot: ['move', 'pick-up', 'put-down'],
    elevator: ['move-up', 'move-down', 'load', 'unload'],
    logistics: ['drive', 'fly', 'load', 'unload']
  };
  
  const domainActions = actionTypes[domain] || actionTypes.robot;
  let currentTime = 0;
  
  for (let i = 0; i < actionCount; i++) {
    const actionType = domainActions[i % domainActions.length];
    const action = createActionTemplate(domain, pddlType, actionType);
    
    action.time = currentTime;
    action.start = currentTime;
    
    const duration = estimateActionDuration(actionType, domain, pddlType);
    if (typeConfig.supportsParallel) {
      action.duration = duration;
      action.end = currentTime + duration;
    }
    
    if (typeConfig.supportsCost) {
      action.cost = Math.random() * 10 + 1;
    }
    
    actions.push(action);
    
    // Advance time
    if (typeConfig.supportsParallel && Math.random() > 0.7) {
      // Sometimes start parallel actions
      currentTime += Math.random() * 0.5;
    } else {
      currentTime += duration;
    }
  }
  
  return actions;
}