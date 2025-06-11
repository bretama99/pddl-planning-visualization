// File: src/utils/common/pddlUtils.js
// Common PDDL Utilities and Helper Functions
// Shared across all domains (Robot, Elevator, Logistics)

// Import domain-specific types
import { ROBOT_PDDL_TYPES } from '../robot/robotTypes.js';
import { ELEVATOR_PDDL_TYPES } from '../elevator/elevatorTypes.js';
import { LOGISTICS_PDDL_TYPES } from '../logistics/logisticsTypes.js';

// Combined PDDL types configuration
export const ALL_PDDL_TYPES = {
  robot: ROBOT_PDDL_TYPES,
  elevator: ELEVATOR_PDDL_TYPES,
  logistics: LOGISTICS_PDDL_TYPES
};

// Common PDDL type definitions
export const COMMON_PDDL_TYPES = {
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
  
  const typeConfig = COMMON_PDDL_TYPES[pddlType] || COMMON_PDDL_TYPES.classical;
  
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
export function getTimeSlices(actions) {
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
export function countParallelActions(timeSlices) {
  return timeSlices.reduce((count, slice) => {
    return count + (slice.parallelism > 1 ? slice.actions.length : 0);
  }, 0);
}

// Get maximum number of actions running in parallel
export function getMaxParallelism(timeSlices) {
  return Math.max(...timeSlices.map(slice => slice.parallelism), 0);
}

// Calculate comprehensive metrics based on PDDL type
export function calculatePDDLMetrics(actions, pddlType) {
  if (!actions || actions.length === 0) {
    return {
      totalActions: 0,
      totalDuration: 0,
      totalCost: 0,
      parallelActions: 0,
      maxParallelism: 0,
      efficiency: 100,
      resourceUtilization: 0
    };
  }

  const typeConfig = COMMON_PDDL_TYPES[pddlType] || COMMON_PDDL_TYPES.classical;
  const metrics = {
    totalActions: actions.length,
    totalDuration: calculateTotalDuration(actions, pddlType),
    totalCost: 0,
    parallelActions: 0,
    maxParallelism: 0,
    efficiency: 100,
    resourceUtilization: 0
  };

  // Calculate cost if supported
  if (typeConfig.supportsCost) {
    metrics.totalCost = actions.reduce((sum, action) => {
      return sum + (action.cost || 1);
    }, 0);
  }

  // Calculate parallelism if supported
  if (typeConfig.supportsParallel) {
    const timeSlices = getTimeSlices(actions);
    metrics.parallelActions = countParallelActions(timeSlices);
    metrics.maxParallelism = getMaxParallelism(timeSlices);
  }

  // Calculate efficiency (domain-agnostic)
  if (actions.length > 0) {
    const avgCost = metrics.totalCost / actions.length;
    const avgDuration = metrics.totalDuration / actions.length;
    
    // Efficiency based on cost-time ratio (lower is better)
    const costEfficiency = avgCost > 0 ? Math.max(0, 100 - avgCost * 5) : 100;
    const timeEfficiency = avgDuration > 0 ? Math.max(0, 100 - avgDuration * 2) : 100;
    
    metrics.efficiency = (costEfficiency + timeEfficiency) / 2;
  }

  // Calculate resource utilization
  if (typeConfig.supportsCost || typeConfig.supportsContinuous) {
    const maxPossibleCost = actions.length * 10; // Assume max cost of 10 per action
    metrics.resourceUtilization = metrics.totalCost > 0 ? 
      Math.min(100, (metrics.totalCost / maxPossibleCost) * 100) : 0;
  }

  return metrics;
}

// Validate action format for PDDL type (domain-agnostic)
export function validateActionForPDDLType(action, pddlType) {
  const typeConfig = COMMON_PDDL_TYPES[pddlType];
  if (!typeConfig) {
    return { valid: false, error: `Unknown PDDL type: ${pddlType}` };
  }

  // Basic validation
  if (!action.type && !action.name) {
    return { valid: false, error: 'Action missing type/name' };
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
    action.duration = typeConfig.defaultDuration;
  }

  // Cost validation for numerical types
  if (typeConfig.supportsCost && action.cost === undefined) {
    action.cost = 1.0;
  }

  return { valid: true, action };
}

// Format action display based on PDDL type (domain-agnostic)
export function formatActionDisplay(action, pddlType) {
  const typeConfig = COMMON_PDDL_TYPES[pddlType] || COMMON_PDDL_TYPES.classical;
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
  
  return display;
}

// Get PDDL type configuration
export function getPDDLTypeConfig(pddlType) {
  return COMMON_PDDL_TYPES[pddlType] || COMMON_PDDL_TYPES.classical;
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
  
  // Convert from/to PDDL+: handle continuous effects
  if (fromConfig.supportsContinuous && !toConfig.supportsContinuous) {
    delete convertedAction.continuousEffects;
  }
  
  if (!fromConfig.supportsContinuous && toConfig.supportsContinuous) {
    convertedAction.continuousEffects = [];
  }
  
  return convertedAction;
}

// Generate execution plan for actions
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

// Generate sequential execution plan (classical)
export function generateSequentialPlan(actions) {
  return actions.map((action, index) => ({
    ...action,
    executionOrder: index,
    startTime: index,
    endTime: index + 1
  }));
}

// Generate temporal execution plan
export function generateTemporalPlan(actions) {
  const plan = [];
  let currentTime = 0;
  
  for (const action of actions) {
    const startTime = Math.max(currentTime, action.start || action.time || 0);
    const duration = action.duration || 1.0;
    
    plan.push({
      ...action,
      executionOrder: plan.length,
      startTime: startTime,
      endTime: startTime + duration
    });
    
    // Only advance time if no parallelism allowed
    if (!action.canExecuteInParallel) {
      currentTime = startTime + duration;
    }
  }
  
  return plan;
}

// Generate cost-optimized execution plan
export function generateOptimizedPlan(actions) {
  const sortedActions = [...actions].sort((a, b) => 
    (a.cost || 1) - (b.cost || 1)
  );
  
  return sortedActions.map((action, index) => ({
    ...action,
    executionOrder: index,
    optimizationRank: index + 1
  }));
}

// Generate hybrid execution plan (PDDL+)
export function generateHybridPlan(actions) {
  const actionsByType = {
    actions: actions.filter(a => !a.isProcess && !a.isEvent),
    processes: actions.filter(a => a.isProcess),
    events: actions.filter(a => a.isEvent)
  };
  
  const plan = [];
  
  // Schedule discrete actions first
  actionsByType.actions.forEach((action, index) => {
    plan.push({
      ...action,
      executionOrder: index,
      scheduleType: 'discrete'
    });
  });
  
  // Schedule continuous processes
  actionsByType.processes.forEach((process) => {
    plan.push({
      ...process,
      executionOrder: plan.length,
      scheduleType: 'continuous'
    });
  });
  
  // Schedule event-driven actions
  actionsByType.events.forEach((event) => {
    plan.push({
      ...event,
      executionOrder: plan.length,
      scheduleType: 'event-driven'
    });
  });
  
  return plan;
}

// Create generic action template
export function createGenericActionTemplate(domain, pddlType, actionType) {
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
  
  // Add continuous fields
  if (typeConfig.supportsContinuous) {
    template.continuousEffects = [];
  }
  
  return template;
}

// Comprehensive plan analysis
export function analyzePlan(actions, pddlType, domain) {
  const analysis = {
    basic: calculatePDDLMetrics(actions, pddlType, domain),
    temporal: {},
    optimization: {},
    quality: {}
  };
  
  // Temporal analysis
  if (pddlTypeSupports(pddlType, 'parallel')) {
    const timeSlices = getTimeSlices(actions);
    analysis.temporal = {
      timeSlices: timeSlices.length,
      parallelPeriods: timeSlices.filter(slice => slice.parallelism > 1).length,
      maxConcurrency: getMaxParallelism(timeSlices),
      averageConcurrency: timeSlices.reduce((sum, slice) => sum + slice.parallelism, 0) / timeSlices.length
    };
  }
  
  // Optimization analysis
  if (pddlTypeSupports(pddlType, 'cost')) {
    const costs = actions.map(a => a.cost || 1);
    analysis.optimization = {
      totalCost: costs.reduce((sum, cost) => sum + cost, 0),
      averageCost: costs.reduce((sum, cost) => sum + cost, 0) / costs.length,
      costVariance: calculateVariance(costs),
      costEfficiency: calculateCostEfficiency(actions)
    };
  }
  
  // Quality metrics
  analysis.quality = {
    completeness: calculatePlanCompleteness(actions, domain),
    consistency: calculatePlanConsistency(actions),
    robustness: calculatePlanRobustness(actions, pddlType)
  };
  
  return analysis;
}

// Helper function to calculate variance
function calculateVariance(values) {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
}

// Calculate cost efficiency
function calculateCostEfficiency(actions) {
  if (actions.length === 0) return 100;
  
  const totalCost = actions.reduce((sum, action) => sum + (action.cost || 1), 0);
  const baselineCost = actions.length; // Assume baseline cost of 1 per action
  
  return Math.max(0, 100 - ((totalCost - baselineCost) / baselineCost) * 100);
}

// Calculate plan completeness
function calculatePlanCompleteness(actions, domain) {
  // Domain-specific completeness checks
  switch (domain) {
    case 'robot': {
      const pickActions = actions.filter(a => (a.type || a.name || '').includes('pick'));
      const dropActions = actions.filter(a => (a.type || a.name || '').includes('drop'));
      return pickActions.length > 0 && dropActions.length > 0 ? 
        Math.min(pickActions.length, dropActions.length) / Math.max(pickActions.length, dropActions.length) * 100 : 0;
    }
    case 'elevator': {
      const loadActions = actions.filter(a => (a.type || a.name || '').includes('load'));
      const unloadActions = actions.filter(a => (a.type || a.name || '').includes('unload'));
      return loadActions.length > 0 && unloadActions.length > 0 ? 
        Math.min(loadActions.length, unloadActions.length) / Math.max(loadActions.length, unloadActions.length) * 100 : 0;
    }
    case 'logistics': {
      const logisticsLoad = actions.filter(a => (a.type || a.name || '').includes('load'));
      const logisticsUnload = actions.filter(a => (a.type || a.name || '').includes('unload'));
      return logisticsLoad.length > 0 && logisticsUnload.length > 0 ? 
        Math.min(logisticsLoad.length, logisticsUnload.length) / Math.max(logisticsLoad.length, logisticsUnload.length) * 100 : 0;
    }
    default:
      return actions.length > 0 ? 100 : 0;
  }
}

// Calculate plan consistency
function calculatePlanConsistency(actions) {
  if (actions.length === 0) return 100;
  
  // Check for time consistency
  let timeConsistent = true;
  for (let i = 1; i < actions.length; i++) {
    const prevTime = actions[i-1].time || actions[i-1].start || 0;
    const currTime = actions[i].time || actions[i].start || 0;
    if (currTime < prevTime) {
      timeConsistent = false;
      break;
    }
  }
  
  // Check for parameter consistency
  let paramConsistent = true;
  const entities = new Set();
  actions.forEach(action => {
    const params = action.params || action.parameters || [];
    params.forEach(param => entities.add(param));
    
    // Check if action has required parameters
    if (params.length === 0) {
      paramConsistent = false;
    }
  });
  
  // Calculate consistency score
  const timeScore = timeConsistent ? 50 : 0;
  const paramScore = paramConsistent ? 50 : 0;
  
  return timeScore + paramScore;
}

// Calculate plan robustness
function calculatePlanRobustness(actions, pddlType) {
  if (actions.length === 0) return 100;
  
  const typeConfig = getPDDLTypeConfig(pddlType);
  let robustness = 100;
  
  // Reduce robustness for single points of failure
  if (!typeConfig.supportsParallel) {
    robustness -= 20; // Sequential plans are less robust
  }
  
  // Check for dependency chains
  const actionTypes = actions.map(a => a.type || a.name);
  const uniqueTypes = new Set(actionTypes);
  const diversity = uniqueTypes.size / actionTypes.length;
  
  if (diversity < 0.3) {
    robustness -= 30; // Low diversity = less robust
  }
  
  // Check for error handling (simplified)
  const hasErrorHandling = actions.some(a => 
    (a.type || a.name || '').includes('emergency') || 
    (a.type || a.name || '').includes('fallback')
  );
  
  if (!hasErrorHandling) {
    robustness -= 20; // No error handling
  }
  
  return Math.max(0, robustness);
}

