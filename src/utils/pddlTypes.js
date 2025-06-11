// Enhanced PDDL Types Configuration and Utilities
// File: src/utils/pddlTypes.js
// Supports all domains: Robot, Logistics, and Enhanced Elevator

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
    supportsContinuous: false,
    elevatorFeatures: {
      capacityTracking: true,
      stepBasedMovement: true,
      simpleScheduling: true,
      basicSafety: true
    }
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
    supportsContinuous: false,
    elevatorFeatures: {
      realisticTiming: true,
      parallelElevators: true,
      temporalConstraints: true,
      smartScheduling: true,
      doorTimingOptimization: true
    }
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
    supportsContinuous: false,
    elevatorFeatures: {
      energyOptimization: true,
      costMinimization: true,
      resourceTracking: true,
      loadOptimization: true,
      maintenanceCosts: true
    }
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
    supportsContinuous: true,
    elevatorFeatures: {
      continuousMonitoring: true,
      autonomousEvents: true,
      environmentalFactors: true,
      processControl: true,
      hybridSafety: true,
      predictiveMaintenance: true
    }
  }
};

// Helper methods for Classical PDDL
export function extractPreconditions() {
  // Simple precondition extraction for classical actions
  return {
    positive: [],
    negative: [],
    complex: null
  };
}

export function extractEffects() {
  // Simple effect extraction for classical actions
  return {
    add: [],
    delete: [],
    complex: null
  };
}

// Helper methods for Temporal PDDL
export function calculateTemporalDuration(actionType) {
  const durations = {
    'move-up': 3.5,
    'move-down': 3.2,
    'load': 4.5,
    'unload': 4.0,
    'emergency-stop': 0.5
  };
  return durations[actionType] || 3.0;
}

export function extractTemporalConstraints() {
  return {
    atStart: [],
    atEnd: [],
    overAll: []
  };
}

export function extractAtStartConditions() {
  // Extract conditions that must be true at action start
  return [];
}

export function extractAtEndConditions() {
  // Extract conditions that must be true at action end
  return [];
}

export function extractOverAllConditions() {
  // Extract conditions that must be true throughout action duration
  return [];
}

export function calculateResourceUsageOverTime(actionType, duration) {
  const baseUsage = {
    'move-up': { energy: 0.1, wear: 0.05 },
    'move-down': { energy: 0.05, wear: 0.03 },
    'load': { energy: 0.02, wear: 0.01 },
    'unload': { energy: 0.02, wear: 0.01 }
  };
  
  const usage = baseUsage[actionType] || { energy: 0.05, wear: 0.02 };
  return {
    energy: usage.energy * duration,
    wear: usage.wear * duration,
    time: duration
  };
}

export function identifyConflictingActions() {
  // Identify which other actions cannot run in parallel
  return [];
}

// Helper methods for Numerical PDDL
export function parseNumericalResources(resourceInfo, actionType) {
  const resources = {
    cost: 0,
    effects: {},
    increases: {},
    decreases: {},
    assignments: {},
    fuel: 0,
    energy: 0,
    battery: 0,
    capacity: 0
  };

  if (resourceInfo) {
    // Parse cost: X, fuel: Y, energy: Z format
    const costMatch = resourceInfo.match(/cost:\s*(\d+(?:\.\d+)?)/);
    if (costMatch) resources.cost = parseFloat(costMatch[1]);
    
    const fuelMatch = resourceInfo.match(/fuel:\s*([+-]?\d+(?:\.\d+)?)/);
    if (fuelMatch) resources.fuel = parseFloat(fuelMatch[1]);
    
    const energyMatch = resourceInfo.match(/energy:\s*([+-]?\d+(?:\.\d+)?)/);
    if (energyMatch) resources.energy = parseFloat(energyMatch[1]);
    
    const batteryMatch = resourceInfo.match(/battery:\s*([+-]?\d+(?:\.\d+)?)/);
    if (batteryMatch) resources.battery = parseFloat(batteryMatch[1]);
  }

  // Set defaults based on action type
  if (resources.cost === 0) {
    resources.cost = getDefaultCost(actionType);
  }

  return resources;
}

export function getDefaultCost(actionType) {
  const costs = {
    'move-up': 5,
    'move-down': 3,
    'load': 2,
    'unload': 2,
    'emergency-stop': 10
  };
  return costs[actionType] || 3;
}

export function extractNumericFluents() {
  // Extract numeric fluents affected by this action
  return {};
}

export function calculateOptimizationWeight(actionType) {
  // Calculate weight for optimization (lower is better)
  const weights = {
    'move-up': 1.2,
    'move-down': 1.0,
    'load': 0.8,
    'unload': 0.8,
    'emergency-stop': 5.0
  };
  return weights[actionType] || 1.0;
}

export function calculateResourceEfficiency(resources) {
  // Calculate efficiency rating (0-100%)
  const totalCost = resources.cost + Math.abs(resources.fuel) + Math.abs(resources.energy);
  if (totalCost === 0) return 100;
  
  const efficiency = Math.max(0, 100 - (totalCost * 10));
  return Math.min(100, efficiency);
}

export function extractResourceConstraints() {
  // Extract resource constraints for this action
  return {};
}

// Helper methods for PDDL+
export function parseContinuousEffects(continuousInfo) {
  const effects = {
    rate: 0,
    target: null,
    condition: null,
    variables: {}
  };

  if (continuousInfo) {
    // Parse rate: X/sec, target: Y format
    const rateMatch = continuousInfo.match(/rate:\s*(\d+(?:\.\d+)?)(?:\/sec)?/);
    if (rateMatch) effects.rate = parseFloat(rateMatch[1]);
    
    const targetMatch = continuousInfo.match(/target:\s*([^,\]]+)/);
    if (targetMatch) effects.target = targetMatch[1].trim();
  }

  return effects;
}

export function calculatePDDLPlusDuration(elementType, actionType, continuousEffects) {
  switch (elementType) {
    case 'event':
      return 0; // Events are instantaneous
    case 'process':
      return continuousEffects.rate > 0 ? 10.0 / continuousEffects.rate : 5.0;
    case 'action':
    default:
      return calculateTemporalDuration(actionType);
  }
}

export function extractDiscreteEffects() {
  // Extract discrete state changes
  return [];
}

export function extractEventTrigger() {
  // Extract what triggers this event
  return null;
}

export function calculateEventProbability() {
  // Calculate probability of event occurring
  return Math.random() > 0.1 ? 1.0 : 0.0; // 90% chance
}

export function extractEnvironmentalFactors() {
  // Extract environmental factors affecting this action
  return {};
}

export function identifyExternalInfluences() {
  // Identify external influences on this action
  return [];
}

export function extractAutonomousConditions() {
  // Extract conditions for autonomous execution
  return [];
}

export function extractStopConditions() {
  // Extract conditions that stop a process
  return [];
}

export function extractDiscreteState() {
  // Extract discrete state variables
  return {};
}

export function extractContinuousState() {
  // Extract continuous state variables
  return {};
}

// Validation methods
export function validateAction(action, pddlType) {
  const validationRules = {
    classical: validateClassicalAction,
    temporal: validateTemporalAction,
    numerical: validateNumericalAction,
    pddl_plus: validatePDDLPlusAction
  };

  const validator = validationRules[pddlType];
  return validator ? validator(action) : { valid: true };
}

export function validateClassicalAction(action) {
  if (!action.type || !action.params) {
    return { valid: false, error: 'Classical action missing type or parameters' };
  }
  return { valid: true };
}

export function validateTemporalAction(action) {
  if (!action.duration || action.duration <= 0) {
    return { valid: false, error: 'Temporal action must have positive duration' };
  }
  if (action.start >= action.end) {
    return { valid: false, error: 'Temporal action start time must be before end time' };
  }
  return { valid: true };
}

export function validateNumericalAction(action) {
  if (action.cost < 0) {
    return { valid: false, error: 'Numerical action cannot have negative cost' };
  }
  return { valid: true };
}

export function validatePDDLPlusAction(action) {
  if (!['action', 'process', 'event'].includes(action.elementType)) {
    return { valid: false, error: 'PDDL+ element must be action, process, or event' };
  }
  if (action.isProcess && !action.continuousEffects?.rate) {
    return { valid: false, error: 'PDDL+ process must have continuous rate' };
  }
  return { valid: true };
}

// Utility methods
export function getActionDescription(action, pddlType) {
  // const typeInfo = PDDL_TYPES[pddlType] || PDDL_TYPES.classical;
  let desc = `${action.type} [${action.params.join(', ')}]`;
  
  switch (pddlType) {
    case 'temporal':
      desc += ` (${action.duration}s)`;
      if (action.canExecuteInParallel) desc += ` [parallel]`;
      break;
    case 'numerical':
      desc += ` [cost: ${action.cost}]`;
      if (action.resourceEfficiency < 80) desc += ` [inefficient]`;
      break;
    case 'pddl_plus':
      desc += ` {${action.elementType}}`;
      if (action.isProcess) desc += ` [rate: ${action.processRate}/s]`;
      break;
  }
  
  return desc;
}

export function generateExecutionPlan(actions, pddlType) {
  switch (pddlType) {
    case 'classical':
      return generateSequentialPlan(actions);
    case 'temporal':
      return generateTemporalPlan(actions);
    case 'numerical':
      return generateOptimizedPlan(actions);
    case 'pddl_plus':
      return generateHybridPlan(actions);
    default:
      return actions;
  }
}

export function generateSequentialPlan(actions) {
  // Classical: simple sequential execution
  return actions.map((action, index) => ({
    ...action,
    executionOrder: index,
    startTime: index,
    endTime: index + 1
  }));
}

export function generateTemporalPlan(actions) {
  // Temporal: consider overlaps and dependencies
  const plan = [];
  let currentTime = 0;
  
  for (const action of actions) {
    const startTime = Math.max(currentTime, action.start);
    plan.push({
      ...action,
      executionOrder: plan.length,
      startTime: startTime,
      endTime: startTime + action.duration
    });
    
    // Only advance time if no parallelism
    if (!action.canExecuteInParallel) {
      currentTime = startTime + action.duration;
    }
  }
  
  return plan;
}

export function generateOptimizedPlan(actions) {
  // Numerical: optimize based on costs
  const sortedActions = [...actions].sort((a, b) => 
    (a.cost / a.resourceEfficiency) - (b.cost / b.resourceEfficiency)
  );
  
  return sortedActions.map((action, index) => ({
    ...action,
    executionOrder: index,
    optimizationRank: index + 1
  }));
}

export function generateHybridPlan(actions) {
  // PDDL+: separate actions, processes, and events
  const actionsByType = {
    actions: actions.filter(a => a.isAction),
    processes: actions.filter(a => a.isProcess),
    events: actions.filter(a => a.isEvent)
  };
  
  const plan = [];
  
  // Schedule actions first
  actionsByType.actions.forEach((action, index) => {
    plan.push({
      ...action,
      executionOrder: index,
      scheduleType: 'discrete'
    });
  });
  
  // Schedule processes (can run in parallel)
  actionsByType.processes.forEach((process) => {
    plan.push({
      ...process,
      executionOrder: plan.length,
      scheduleType: 'continuous'
    });
  });
  
  // Events are triggered by conditions
  actionsByType.events.forEach((event) => {
    plan.push({
      ...event,
      executionOrder: plan.length,
      scheduleType: 'event-driven'
    });
  });
  
  return plan;
}

// Enhanced elevator-specific duration calculations
export function calculateElevatorDuration(actionType, pddlType) {
  const typeConfig = PDDL_TYPES[pddlType] || PDDL_TYPES.classical;
  
  // Base durations for elevator actions
  const baseDurations = {
    'move-up': 3.5,
    'move-down': 3.2,
    'load': 4.5,
    'unload': 4.0,
    'emergency-stop': 0.5,
    'door-open': 2.5,
    'door-close': 2.0
  };
  
  let baseDuration = baseDurations[actionType] || typeConfig.defaultDuration;
  
  // Apply PDDL-type specific modifiers for elevators
  switch (pddlType) {
    case 'temporal':
      // Temporal PDDL: Consider real-world timing constraints
      if (typeConfig.elevatorFeatures.doorTimingOptimization) {
        baseDuration *= 0.9; // Optimized door timing
      }
      break;
      
    case 'numerical':
      // Numerical PDDL: Duration based on energy/cost optimization
      if (typeConfig.elevatorFeatures.energyOptimization) {
        baseDuration *= 1.1; // Slower for energy efficiency
      }
      break;
      
    case 'pddl_plus':
      // PDDL+: Consider environmental factors
      if (typeConfig.elevatorFeatures.environmentalFactors) {
        baseDuration *= (0.9 + Math.random() * 0.2); // Environmental variation
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
  const typeConfig = PDDL_TYPES[pddlType] || PDDL_TYPES.classical;
  
  if (!typeConfig.supportsCost) return 1;
  
  // Base costs for elevator actions
  const baseCosts = {
    'move-up': 5.0,    // More energy going up
    'move-down': 2.0,  // Regenerative braking
    'load': 1.5,      // Door operation + boarding
    'unload': 1.5,    // Door operation + exiting
    'emergency-stop': 10.0, // High cost for emergency
    'door-open': 0.5,
    'door-close': 0.5
  };
  
  let baseCost = baseCosts[actionType] || 1.0;
  
  // Apply elevator-specific cost modifiers
  if (pddlType === 'numerical') {
    if (typeConfig.elevatorFeatures.maintenanceCosts) {
      baseCost *= 1.2; // Include maintenance costs
    }
    if (typeConfig.elevatorFeatures.loadOptimization) {
      // Adjust cost based on passenger count (if available)
      const passengerCount = params.filter(p => p.includes('person')).length;
      baseCost *= Math.max(0.5, 1.0 + (passengerCount * 0.1));
    }
  }
  
  return baseCost;
}

// Calculate elevator energy cost
export function calculateElevatorEnergyCost(actionType) {
  const energyCosts = {
    'move-up': 0.15,      // High energy going up
    'move-down': 0.05,    // Low energy with regenerative braking
    'load': 0.02,         // Door operation energy
    'unload': 0.02,       // Door operation energy
    'emergency-stop': 0.08, // Emergency braking energy
    'door-open': 0.01,
    'door-close': 0.01
  };
  
  return energyCosts[actionType] || 0.03;
}

// Calculate total duration for different PDDL types with elevator awareness
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

// Calculate metrics based on PDDL type with elevator enhancements
export function calculatePDDLMetrics(actions, pddlType) {
  if (!actions || actions.length === 0) {
    return {
      totalActions: 0,
      totalDuration: 0,
      totalCost: 0,
      parallelActions: 0,
      maxParallelism: 0,
      // Enhanced elevator metrics
      elevatorEfficiency: 100,
      energyConsumption: 0,
      passengerThroughput: 0,
      safetyScore: 100
    };
  }

  const typeConfig = PDDL_TYPES[pddlType] || PDDL_TYPES.classical;
  const metrics = {
    totalActions: actions.length,
    totalDuration: calculateTotalDuration(actions, pddlType),
    totalCost: 0,
    parallelActions: 0,
    maxParallelism: 0,
    // Enhanced elevator metrics
    elevatorEfficiency: 100,
    energyConsumption: 0,
    passengerThroughput: 0,
    safetyScore: 100
  };

  // Calculate cost if supported
  if (typeConfig.supportsCost) {
    metrics.totalCost = actions.reduce((sum, action) => {
      return sum + calculateElevatorCost(action.type || action.name, pddlType, action.params || action.parameters);
    }, 0);
  }

  // Calculate parallelism if supported
  if (typeConfig.supportsParallel) {
    const timeSlices = getTimeSlices(actions);
    metrics.parallelActions = countParallelActions(timeSlices);
    metrics.maxParallelism = getMaxParallelism(timeSlices);
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
  }

  return metrics;
}

// Validate action format for PDDL type with elevator awareness
export function validateActionForPDDLType(action, pddlType) {
  const typeConfig = PDDL_TYPES[pddlType];
  if (!typeConfig) {
    return { valid: false, error: `Unknown PDDL type: ${pddlType}` };
  }

  // Basic validation
  if (!action.type && !action.name) {
    return { valid: false, error: 'Action missing type' };
  }
  
  if (!action.params && !action.parameters) {
    return { valid: false, error: 'Action missing parameters' };
  }

  // Time validation
  if (action.time === undefined && action.start === undefined) {
    return { valid: false, error: 'Action missing time information' };
  }

  // Duration validation for temporal types
  if (typeConfig.supportsParallel && !action.duration) {
    action.duration = calculateElevatorDuration(action.type || action.name, pddlType, action.params || action.parameters);
  }

  // Cost validation for numerical types
  if (typeConfig.supportsCost && action.cost === undefined) {
    action.cost = calculateElevatorCost(action.type || action.name, pddlType, action.params || action.parameters);
  }

  // Elevator-specific validation
  const actionType = action.type || action.name || '';
  if (actionType.includes('move') || actionType.includes('load') || actionType.includes('unload')) {
    // Validate elevator-specific constraints
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
  }

  return { valid: true, action };
}

// Format action display based on PDDL type with elevator enhancements
export function formatActionDisplay(action, pddlType) {
  const typeConfig = PDDL_TYPES[pddlType] || PDDL_TYPES.classical;
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
  if (actionType.includes('move') || actionType.includes('load') || actionType.includes('unload')) {
    if (pddlType === 'numerical' && action.energyCost) {
      display += ` [energy: ${action.energyCost.toFixed(2)}kWh]`;
    }
    
    if (pddlType === 'pddl_plus' && action.continuousEffects) {
      display += ` [continuous]`;
    }
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
    // Elevator-specific features
    case 'elevatorOptimization':
      return config.elevatorFeatures?.energyOptimization || false;
    case 'elevatorMonitoring':
      return config.elevatorFeatures?.continuousMonitoring || false;
    case 'elevatorScheduling':
      return config.elevatorFeatures?.smartScheduling || false;
    default:
      return false;
  }
}

// Convert between PDDL types (basic conversion) with elevator awareness
export function convertActionBetweenTypes(action, fromType, toType) {
  const fromConfig = getPDDLTypeConfig(fromType);
  const toConfig = getPDDLTypeConfig(toType);
  
  const convertedAction = { ...action };
  const actionType = action.type || action.name || '';
  
  // Convert temporal to classical: remove duration
  if (fromConfig.supportsParallel && !toConfig.supportsParallel) {
    delete convertedAction.duration;
    delete convertedAction.end;
  }
  
  // Convert classical to temporal: add duration
  if (!fromConfig.supportsParallel && toConfig.supportsParallel) {
    convertedAction.duration = calculateElevatorDuration(actionType, toType, action.params);
    convertedAction.end = (convertedAction.start || convertedAction.time || 0) + convertedAction.duration;
  }
  
  // Convert from/to numerical: handle cost
  if (fromConfig.supportsCost && !toConfig.supportsCost) {
    delete convertedAction.cost;
    delete convertedAction.energyCost;
  }
  
  if (!fromConfig.supportsCost && toConfig.supportsCost) {
    convertedAction.cost = calculateElevatorCost(actionType, toType, action.params);
    convertedAction.energyCost = calculateElevatorEnergyCost(actionType);
  }
  
  // Convert from/to PDDL+: handle continuous effects
  if (fromConfig.supportsContinuous && !toConfig.supportsContinuous) {
    delete convertedAction.continuousEffects;
    delete convertedAction.actionType;
  }
  
  if (!fromConfig.supportsContinuous && toConfig.supportsContinuous) {
    convertedAction.continuousEffects = [];
    convertedAction.actionType = 'action'; // Default to action type
  }
  
  return convertedAction;
}

// Create domain-specific action templates with elevator support
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
        template.actionType = 'action';
      }
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

// Estimate action duration based on type and domain with elevator enhancements
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
      'move-up': 3.5,     // Enhanced realistic timing
      'move-down': 3.2,   // Slightly faster going down
      'load': 4.5,        // Door operation + passenger boarding
      'unload': 4.0,      // Door operation + passenger exiting
      'emergency-stop': 0.5,
      'door-open': 2.5,
      'door-close': 2.0
    },
    logistics: {
      drive: 10.0,
      fly: 15.0,
      load: 3.0,
      unload: 3.0
    }
  };
  
  const domainDurations = durations[domain] || {};
  let baseDuration = domainDurations[actionType] || typeConfig.defaultDuration;
  
  // Apply elevator-specific PDDL type adjustments
  if (domain === 'elevator') {
    baseDuration = calculateElevatorDuration(actionType, pddlType);
  } else {
    // Adjust for other domains based on PDDL type
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
  
  return baseDuration;
}

// Generate sample plan for testing with elevator support
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

// Comprehensive PDDL Type Handler for Advanced Elevator Simulator
// Supports: Classical, Temporal (PDDL 2.1), Numerical (PDDL 2.1), and PDDL+
// Each type gets specialized treatment based on its unique features

export class PDDLTypeManager {
  constructor(pddlType = 'classical') {
    this.pddlType = pddlType;
    this.features = this.getPDDLFeatures(pddlType);
    console.log(`🔧 PDDL Type Manager initialized for: ${pddlType}`);
    console.log(`✨ Available features:`, this.features);
  }

  // Define features available for each PDDL type
  getPDDLFeatures(type) {
    const features = {
      classical: {
        name: 'Classical PDDL',
        icon: '🎯',
        description: 'Step-based discrete state planning',
        capabilities: [
          'Discrete actions',
          'Instantaneous state changes',
          'Sequential execution',
          'Boolean predicates only',
          'No time concept',
          'Simple preconditions/effects'
        ],
        timing: 'step-based',
        parallelism: false,
        resources: false,
        continuous: false,
        events: false,
        processes: false
      },

      temporal: {
        name: 'Temporal PDDL (PDDL 2.1)',
        icon: '⏱️',
        description: 'Time-based planning with durative actions',
        capabilities: [
          'Durative actions with explicit duration',
          'Temporal constraints (at start, at end, over all)',
          'Parallel action execution',
          'Time-based scheduling',
          'Temporal windows',
          'Concurrent resource usage'
        ],
        timing: 'real-time',
        parallelism: true,
        resources: false,
        continuous: false,
        events: false,
        processes: false,
        temporalConstraints: ['at_start', 'at_end', 'over_all']
      },

      numerical: {
        name: 'Numerical PDDL (PDDL 2.1)',
        icon: '🔢',
        description: 'Planning with numeric fluents and optimization',
        capabilities: [
          'Numeric fluents (functions)',
          'Resource consumption/production',
          'Cost optimization',
          'Quantity constraints',
          'Mathematical operations',
          'Metric optimization'
        ],
        timing: 'step-based',
        parallelism: false,
        resources: true,
        continuous: false,
        events: false,
        processes: false,
        numericOperations: ['increase', 'decrease', 'assign', 'scale-up', 'scale-down']
      },

      pddl_plus: {
        name: 'PDDL+ (Hybrid Planning)',
        icon: '🌐',
        description: 'Hybrid discrete/continuous planning with processes and events',
        capabilities: [
          'Discrete actions + continuous processes',
          'Autonomous events',
          'Mixed discrete/continuous dynamics',
          'Environmental interactions',
          'Process start/stop control',
          'Event-driven planning'
        ],
        timing: 'hybrid',
        parallelism: true,
        resources: true,
        continuous: true,
        events: true,
        processes: true,
        hybridElements: ['actions', 'processes', 'events']
      }
    };

    return features[type] || features.classical;
  }

  // Parse action based on PDDL type with type-specific handling
  parseAction(line, index) {
    console.log(`🔍 Parsing ${this.pddlType} action: "${line}"`);
    
    switch (this.pddlType) {
      case 'classical':
        return this.parseClassicalAction(line, index);
      case 'temporal':
        return this.parseTemporalAction(line, index);
      case 'numerical':
        return this.parseNumericalAction(line, index);
      case 'pddl_plus':
        return this.parsePDDLPlusAction(line, index);
      default:
        return this.parseClassicalAction(line, index);
    }
  }

  // CLASSICAL PDDL - Step-based discrete actions
  parseClassicalAction(line, index) {
    // Classical PDDL: "(action param1 param2)" or "step: (action param1 param2)"
    let match = line.match(/^(?:(?:step\s+)?(\d+)[:.]?\s*)?(?:\()?([^)]*)\)?$/i);
    
    if (match) {
      const stepNumber = match[1] ? parseInt(match[1]) : index;
      const actionContent = match[2].trim();
      const actionParts = actionContent.split(/\s+/).filter(p => p);
      
      if (actionParts.length === 0) return null;

      return {
        id: `classical-${index}`,
        type: actionParts[0],
        params: actionParts.slice(1),
        step: stepNumber,
        time: stepNumber,
        start: stepNumber,
        end: stepNumber + 1,
        duration: 1, // Classical actions are instantaneous (1 step)
        pddlType: 'classical',
        
        // Classical-specific properties
        instantaneous: true,
        preconditions: extractPreconditions(actionParts),
        effects: extractEffects(actionParts),
        
        // No temporal or numeric properties
        cost: 1, // Unit cost
        resources: {},
        
        // Metadata
        original: line,
        parsed: true
      };
    }
    
    return null;
  }

  // TEMPORAL PDDL - Durative actions with time constraints
  parseTemporalAction(line, index) {
    // Temporal PDDL: "0.000: (action param1 param2) [duration]" or with constraints
    let match = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[(?:D:)?(\d+(?:\.\d+)?)\])?/);
    
    if (match) {
      const startTime = parseFloat(match[1]);
      const actionContent = match[2].trim();
      const explicitDuration = match[3] ? parseFloat(match[3]) : null;
      const actionParts = actionContent.split(/\s+/).filter(p => p);
      
      if (actionParts.length === 0) return null;

      const duration = explicitDuration || calculateTemporalDuration(actionParts[0]);
      
      return {
        id: `temporal-${index}`,
        type: actionParts[0],
        params: actionParts.slice(1),
        time: startTime,
        start: startTime,
        end: startTime + duration,
        duration: duration,
        pddlType: 'temporal',
        
        // Temporal-specific properties
        durative: true,
        temporalConstraints: extractTemporalConstraints(actionParts),
        
        // Temporal constraint types
        atStart: extractAtStartConditions(actionParts),
        atEnd: extractAtEndConditions(actionParts),
        overAll: extractOverAllConditions(actionParts),
        
        // Resource usage over time
        resourceUsage: calculateResourceUsageOverTime(actionParts[0], duration),
        
        // Parallel execution capability
        canExecuteInParallel: true,
        conflictsWith: identifyConflictingActions(actionParts),
        
        // Metadata
        original: line,
        parsed: true
      };
    }
    
    return null;
  }

  // NUMERICAL PDDL - Resource-aware planning with optimization
  parseNumericalAction(line, index) {
    // Numerical PDDL: "0: (action param1 param2) [cost: X] [resource: Y]"
    let match = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[(.*?)\])?/);
    
    if (match) {
      const time = parseFloat(match[1]);
      const actionContent = match[2].trim();
      const resourceInfo = match[3] || '';
      const actionParts = actionContent.split(/\s+/).filter(p => p);
      
      if (actionParts.length === 0) return null;

      const resources = parseNumericalResources(resourceInfo, actionParts[0]);
      
      return {
        id: `numerical-${index}`,
        type: actionParts[0],
        params: actionParts.slice(1),
        time: time,
        start: time,
        end: time + 1, // Instantaneous but with resource effects
        duration: 1,
        pddlType: 'numerical',
        
        // Numerical-specific properties
        cost: resources.cost || getDefaultCost(actionParts[0]),
        resourceEffects: resources.effects,
        numericFluents: extractNumericFluents(actionParts),
        
        // Optimization metrics
        fuelConsumption: resources.fuel || 0,
        energyUsage: resources.energy || 0,
        batteryDrain: resources.battery || 0,
        capacityChange: resources.capacity || 0,
        
        // Numeric operations
        increases: resources.increases || {},
        decreases: resources.decreases || {},
        assignments: resources.assignments || {},
        
        // Cost optimization
        optimizationWeight: calculateOptimizationWeight(actionParts[0]),
        resourceEfficiency: calculateResourceEfficiency(resources),
        
        // Constraints
        resourceConstraints: extractResourceConstraints(actionParts),
        
        // Metadata
        original: line,
        parsed: true
      };
    }
    
    return null;
  }

  // PDDL+ - Hybrid discrete/continuous planning
  parsePDDLPlusAction(line, index) {
    // PDDL+: "0.000: (action param1 param2) {type} [continuous-effects]"
    let match = line.match(/^(\d+(?:\.\d+)?):\s*(?:\()?([^)]+)\)?(?:\s*\{(action|process|event)\})?(?:\s*\[(.*?)\])?/);
    
    if (match) {
      const time = parseFloat(match[1]);
      const actionContent = match[2].trim();
      const elementType = match[3] || 'action'; // action, process, or event
      const continuousInfo = match[4] || '';
      const actionParts = actionContent.split(/\s+/).filter(p => p);
      
      if (actionParts.length === 0) return null;

      const continuousEffects = parseContinuousEffects(continuousInfo, actionParts[0]);
      const duration = calculatePDDLPlusDuration(elementType, actionParts[0], continuousEffects);
      
      return {
        id: `pddl-plus-${index}`,
        type: actionParts[0],
        params: actionParts.slice(1),
        time: time,
        start: time,
        end: time + duration,
        duration: duration,
        pddlType: 'pddl_plus',
        
        // PDDL+ specific properties
        elementType: elementType, // 'action', 'process', or 'event'
        isAction: elementType === 'action',
        isProcess: elementType === 'process',
        isEvent: elementType === 'event',
        
        // Hybrid dynamics
        discreteEffects: extractDiscreteEffects(actionParts),
        continuousEffects: continuousEffects,
        
        // Process-specific properties
        processRate: continuousEffects.rate || 0,
        processTarget: continuousEffects.target,
        processCondition: continuousEffects.condition,
        
        // Event-specific properties
        eventTrigger: elementType === 'event' ? extractEventTrigger(actionParts) : null,
        eventProbability: elementType === 'event' ? calculateEventProbability(actionParts) : 1.0,
        
        // Environmental interaction
        environmentalFactors: extractEnvironmentalFactors(actionParts),
        externalInfluences: identifyExternalInfluences(actionParts),
        
        // Autonomous behavior
        autonomousConditions: extractAutonomousConditions(actionParts),
        stopConditions: extractStopConditions(actionParts),
        
        // Mixed dynamics
        hybridState: {
          discrete: extractDiscreteState(actionParts),
          continuous: extractContinuousState(actionParts)
        },
        
        // Metadata
        original: line,
        parsed: true
      };
    }
    
    return null;
  }
}