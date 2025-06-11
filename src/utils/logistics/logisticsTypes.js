// File: src/utils/logistics/logisticsTypes.js
// Logistics Domain-Specific PDDL Type Configuration and Utilities
// Supports all PDDL types: Classical, Temporal, Numerical, and PDDL+

export const LOGISTICS_PDDL_TYPES = {
  classical: {
    id: 'classical',
    name: 'Classical Logistics PDDL',
    description: 'Step-based package delivery with discrete transportation',
    icon: '🚚',
    features: ['Discrete transportation', 'Simple loading/unloading', 'Sequential routing'],
    defaultDuration: 1.0,
    supportsParallel: false,
    supportsCost: false,
    supportsContinuous: false,
    logisticsFeatures: {
      routeOptimization: 'basic',
      capacityTracking: true,
      fuelManagement: false,
      multiModalTransport: true,
      realTimeTracking: false,
      carbonFootprint: false
    }
  },
  temporal: {
    id: 'temporal',
    name: 'Temporal Logistics PDDL',
    description: 'Time-coordinated logistics with realistic transportation timing',
    icon: '🚚⏱️',
    features: ['Realistic travel times', 'Coordinated schedules', 'Parallel operations'],
    defaultDuration: 5.0,
    supportsParallel: true,
    supportsCost: false,
    supportsContinuous: false,
    logisticsFeatures: {
      routeOptimization: 'temporal',
      capacityTracking: true,
      fuelManagement: false,
      multiModalTransport: true,
      realTimeTracking: true,
      schedulingOptimization: true,
      transitTimeTracking: true
    }
  },
  numerical: {
    id: 'numerical',
    name: 'Numerical Logistics PDDL',
    description: 'Cost-optimized logistics with resource management',
    icon: '🚚🔢',
    features: ['Cost optimization', 'Fuel management', 'Carbon footprint tracking'],
    defaultDuration: 1.0,
    supportsParallel: false,
    supportsCost: true,
    supportsContinuous: false,
    logisticsFeatures: {
      routeOptimization: 'cost-based',
      capacityTracking: true,
      fuelManagement: true,
      multiModalTransport: true,
      carbonFootprint: true,
      costMinimization: true,
      resourceEfficiency: true
    }
  },
  pddl_plus: {
    id: 'pddl_plus',
    name: 'PDDL+ Logistics Control',
    description: 'Hybrid logistics with continuous monitoring and adaptive routing',
    icon: '🚚🌐',
    features: ['Continuous tracking', 'Adaptive routing', 'Environmental factors'],
    defaultDuration: 5.0,
    supportsParallel: true,
    supportsCost: true,
    supportsContinuous: true,
    logisticsFeatures: {
      routeOptimization: 'adaptive',
      capacityTracking: true,
      fuelManagement: true,
      multiModalTransport: true,
      realTimeTracking: true,
      environmentalAdaptation: true,
      predictiveAnalytics: true,
      autonomousDecisions: true
    }
  }
};

// Logistics-specific duration calculations
export function calculateLogisticsDuration(actionType, pddlType) {
  const typeConfig = LOGISTICS_PDDL_TYPES[pddlType] || LOGISTICS_PDDL_TYPES.classical;
  
  // Base durations for logistics actions (in time units)
  const baseDurations = {
    'drive': 8.0,           // Truck driving between cities
    'drive-truck': 8.0,
    'fly': 15.0,            // Airplane flight between airports
    'fly-airplane': 15.0,
    'load': 3.0,            // Loading package into vehicle
    'load-vehicle': 3.0,
    'unload': 2.5,          // Unloading package from vehicle
    'unload-vehicle': 2.5,
    'transfer': 4.0,        // Package transfer between vehicles
    'sort': 1.5,            // Package sorting at facility
    'inspect': 2.0,         // Package inspection
    'maintenance': 20.0     // Vehicle maintenance
  };
  
  let baseDuration = baseDurations[actionType] || typeConfig.defaultDuration;
  
  // Apply PDDL-type specific modifiers for logistics
  switch (pddlType) {
    case 'temporal':
      // Temporal PDDL: More realistic timing based on distance/conditions
      if (typeConfig.logisticsFeatures.realTimeTracking) {
        if (actionType.includes('drive')) {
          baseDuration *= (0.8 + Math.random() * 0.4); // Traffic variation
        } else if (actionType.includes('fly')) {
          baseDuration *= (0.9 + Math.random() * 0.2); // Weather variation
        }
      }
      break;
      
    case 'numerical':
      // Numerical PDDL: Optimize for cost/fuel efficiency
      if (typeConfig.logisticsFeatures.fuelManagement) {
        baseDuration *= 1.1; // Slower for fuel efficiency
      }
      if (typeConfig.logisticsFeatures.costMinimization) {
        // Adjust based on cost optimization
        baseDuration *= (actionType.includes('fly') ? 0.95 : 1.05);
      }
      break;
      
    case 'pddl_plus':
      // PDDL+: Adaptive timing based on environmental factors
      if (typeConfig.logisticsFeatures.environmentalAdaptation) {
        const weatherFactor = Math.random() > 0.8 ? 1.3 : 1.0; // 20% chance of delays
        const trafficFactor = Math.random() > 0.7 ? 1.2 : 1.0; // 30% chance of traffic
        baseDuration *= Math.max(weatherFactor, trafficFactor);
      }
      break;
      
    default:
      // Classical PDDL: Fixed duration
      break;
  }
  
  return baseDuration;
}

// Logistics-specific cost calculations
export function calculateLogisticsCost(actionType, pddlType, params = []) {
  const typeConfig = LOGISTICS_PDDL_TYPES[pddlType] || LOGISTICS_PDDL_TYPES.classical;
  
  if (!typeConfig.supportsCost) return 1;
  
  // Base costs for logistics actions
  const baseCosts = {
    'drive': 12.0,          // Truck operation cost
    'drive-truck': 12.0,
    'fly': 45.0,            // Airplane operation cost
    'fly-airplane': 45.0,
    'load': 2.0,            // Loading operation cost
    'load-vehicle': 2.0,
    'unload': 2.0,          // Unloading operation cost
    'unload-vehicle': 2.0,
    'transfer': 5.0,        // Transfer operation cost
    'sort': 1.0,            // Sorting cost
    'inspect': 1.5,         // Inspection cost
    'maintenance': 100.0    // Maintenance cost
  };
  
  let baseCost = baseCosts[actionType] || 1.0;
  
  // Apply logistics-specific cost modifiers
  if (pddlType === 'numerical') {
    if (typeConfig.logisticsFeatures.fuelManagement) {
      // Fuel cost variations
      const fuelMultiplier = actionType.includes('fly') ? 3.5 : 1.2;
      baseCost *= fuelMultiplier;
    }
    
    if (typeConfig.logisticsFeatures.carbonFootprint) {
      // Carbon tax simulation
      const carbonTax = actionType.includes('fly') ? 5.0 : 2.0;
      baseCost += carbonTax;
    }
    
    if (typeConfig.logisticsFeatures.resourceEfficiency) {
      // Efficiency-based cost adjustment
      const efficiencyFactor = calculateLogisticsEfficiency(actionType, params);
      baseCost *= (2.0 - efficiencyFactor); // Higher efficiency = lower cost
    }
  }
  
  return baseCost;
}

// Calculate logistics fuel consumption
export function calculateLogisticsFuelConsumption(actionType, distance = 100) {
  const fuelRates = {
    'drive': 8.5,           // Liters per 100km
    'drive-truck': 8.5,
    'fly': 25.0,            // Liters per 100km (equivalent)
    'fly-airplane': 25.0,
    'load': 0.1,            // Minimal fuel for loading equipment
    'load-vehicle': 0.1,
    'unload': 0.1,
    'unload-vehicle': 0.1
  };
  
  const baseRate = fuelRates[actionType] || 0;
  return (baseRate * distance) / 100; // Convert to actual consumption
}

// Calculate carbon emissions
export function calculateLogisticsCarbonEmissions(actionType, distance = 100) {
  const emissionFactors = {
    'drive': 0.12,          // kg CO2 per km
    'drive-truck': 0.15,    // Slightly higher for trucks
    'fly': 0.25,            // kg CO2 per km
    'fly-airplane': 0.25,
    'load': 0.001,          // Minimal emissions for equipment
    'load-vehicle': 0.001,
    'unload': 0.001,
    'unload-vehicle': 0.001
  };
  
  const emissionFactor = emissionFactors[actionType] || 0;
  return emissionFactor * distance;
}

// Calculate logistics efficiency
export function calculateLogisticsEfficiency(actionType, params = []) {
  // Base efficiency ratings (0.0 to 1.0)
  const baseEfficiencies = {
    'drive': 0.75,
    'drive-truck': 0.70,
    'fly': 0.60,           // Lower efficiency due to high energy use
    'fly-airplane': 0.60,
    'load': 0.90,
    'load-vehicle': 0.90,
    'unload': 0.90,
    'unload-vehicle': 0.90,
    'transfer': 0.80
  };
  
  let efficiency = baseEfficiencies[actionType] || 0.80;
  
  // Adjust based on vehicle utilization
  const packageCount = params.filter(p => p.includes('package') || p.includes('pkg')).length;
  if (packageCount > 0) {
    efficiency += Math.min(0.2, packageCount * 0.05); // Better utilization = higher efficiency
  }
  
  return Math.min(1.0, efficiency);
}

// Logistics action validation
export function validateLogisticsAction(action, pddlType) {
  const typeConfig = LOGISTICS_PDDL_TYPES[pddlType];
  if (!typeConfig) {
    return { valid: false, error: `Unknown PDDL type: ${pddlType}` };
  }

  // Basic validation
  if (!action.name && !action.type) {
    return { valid: false, error: 'Logistics action missing name/type' };
  }
  
  if (!action.parameters && !action.params) {
    return { valid: false, error: 'Logistics action missing parameters' };
  }

  const actionType = action.name || action.type;
  const params = action.parameters || action.params || [];

  // Logistics-specific validation
  switch (actionType) {
    case 'drive':
    case 'drive-truck':
      if (params.length < 3) {
        return { valid: false, error: 'Drive action requires vehicle, from-location, to-location' };
      }
      break;
      
    case 'fly':
    case 'fly-airplane':
      if (params.length < 3) {
        return { valid: false, error: 'Fly action requires airplane, from-airport, to-airport' };
      }
      break;
      
    case 'load':
    case 'load-vehicle':
      if (params.length < 2) {
        return { valid: false, error: 'Load action requires package and vehicle' };
      }
      break;
      
    case 'unload':
    case 'unload-vehicle':
      if (params.length < 2) {
        return { valid: false, error: 'Unload action requires package and vehicle' };
      }
      break;
  }

  // Duration validation for temporal types
  if (typeConfig.supportsParallel && !action.duration) {
    action.duration = calculateLogisticsDuration(actionType, pddlType, params);
  }

  // Cost validation for numerical types
  if (typeConfig.supportsCost && action.cost === undefined) {
    action.cost = calculateLogisticsCost(actionType, pddlType, params);
  }

  // Logistics-specific enhancements
  if (pddlType === 'numerical') {
    if (typeConfig.logisticsFeatures.fuelManagement && !action.fuelConsumption) {
      action.fuelConsumption = calculateLogisticsFuelConsumption(actionType);
    }
    
    if (typeConfig.logisticsFeatures.carbonFootprint && !action.carbonEmissions) {
      action.carbonEmissions = calculateLogisticsCarbonEmissions(actionType);
    }
  }
  
  if (pddlType === 'pddl_plus' && typeConfig.logisticsFeatures.realTimeTracking) {
    if (!action.continuousEffects) {
      action.continuousEffects = extractLogisticsContinuousEffects(actionType);
    }
  }

  return { valid: true, action };
}

// Extract continuous effects for PDDL+
function extractLogisticsContinuousEffects(actionType) {
  const effects = [];
  
  if (actionType.includes('drive') || actionType.includes('fly')) {
    effects.push({
      type: 'fuel-consumption',
      rate: actionType.includes('fly') ? 2.5 : 1.2,
      target: 'fuel-level',
      operation: 'decrease'
    });
    
    effects.push({
      type: 'emissions',
      rate: actionType.includes('fly') ? 0.25 : 0.12,
      target: 'carbon-footprint',
      operation: 'increase'
    });
    
    effects.push({
      type: 'position',
      rate: actionType.includes('fly') ? 500 : 80,
      target: 'distance-traveled',
      operation: 'increase'
    });
  }
  
  return effects;
}

// Format logistics action display
export function formatLogisticsActionDisplay(action, pddlType) {
  const typeConfig = LOGISTICS_PDDL_TYPES[pddlType] || LOGISTICS_PDDL_TYPES.classical;
  const actionType = action.name || action.type || 'unknown';
  const params = action.parameters || action.params || [];
  
  let display = `${actionType} [${params.join(', ')}]`;
  
  // Add timing information
  const time = action.time || action.start || 0;
  display = `${time.toFixed(1)}: ${display}`;
  
  // Add duration for temporal types
  if (typeConfig.supportsParallel && action.duration) {
    display += ` (${action.duration.toFixed(1)}h)`;
  }
  
  // Add cost for numerical types
  if (typeConfig.supportsCost && action.cost) {
    display += ` [cost: $${action.cost.toFixed(0)}]`;
  }
  
  // Add logistics-specific information
  if ((actionType.includes('drive') || actionType.includes('fly')) && params.length >= 3) {
    const vehicle = params[0];
    const from = params[1];
    const to = params[2];
    display += ` [${vehicle}: ${from} → ${to}]`;
  }
  
  if ((actionType.includes('load') || actionType.includes('unload')) && params.length >= 2) {
    const packageId = params[0];
    const vehicle = params[1];
    const actionArrow = actionType.includes('load') ? '→' : '←';
    display += ` [${packageId} ${actionArrow} ${vehicle}]`;
  }
  
  if (pddlType === 'numerical') {
    if (action.fuelConsumption) {
      display += ` [fuel: ${action.fuelConsumption.toFixed(1)}L]`;
    }
    if (action.carbonEmissions) {
      display += ` [CO2: ${action.carbonEmissions.toFixed(1)}kg]`;
    }
  }
  
  return display;
}

// Create logistics action template
export function createLogisticsActionTemplate(pddlType, actionType) {
  const typeConfig = LOGISTICS_PDDL_TYPES[pddlType] || LOGISTICS_PDDL_TYPES.classical;
  
  const template = {
    time: 0,
    name: actionType,
    parameters: [],
    description: '',
    domain: 'logistics',
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
  
  // Logistics-specific templates
  switch (actionType) {
    case 'drive':
    case 'drive-truck':
      template.parameters = ['truck1', 'cityA', 'cityB'];
      template.description = 'Drive truck between cities';
      break;
      
    case 'fly':
    case 'fly-airplane':
      template.parameters = ['plane1', 'airport1', 'airport2'];
      template.description = 'Fly airplane between airports';
      break;
      
    case 'load':
    case 'load-vehicle':
      template.parameters = ['package1', 'truck1'];
      template.description = 'Load package into vehicle';
      break;
      
    case 'unload':
    case 'unload-vehicle':
      template.parameters = ['package1', 'truck1'];
      template.description = 'Unload package from vehicle';
      break;
  }
  
  if (typeConfig.supportsCost) {
    template.cost = calculateLogisticsCost(actionType, pddlType, template.parameters);
    template.fuelConsumption = calculateLogisticsFuelConsumption(actionType);
    template.carbonEmissions = calculateLogisticsCarbonEmissions(actionType);
  }
  
  if (typeConfig.supportsParallel) {
    template.duration = calculateLogisticsDuration(actionType, pddlType, template.parameters);
  }
  
  return template;
}

// Calculate logistics-specific metrics
export function calculateLogisticsMetrics(actions, pddlType) {
  if (!actions || actions.length === 0) {
    return {
      totalActions: 0,
      totalDuration: 0,
      totalCost: 0,
      deliveryEfficiency: 100,
      fuelConsumption: 0,
      carbonEmissions: 0,
      vehicleUtilization: 100,
      routeOptimization: 100
    };
  }

  const typeConfig = LOGISTICS_PDDL_TYPES[pddlType] || LOGISTICS_PDDL_TYPES.classical;
  const metrics = {
    totalActions: actions.length,
    totalDuration: 0,
    totalCost: 0,
    deliveryEfficiency: 100,
    fuelConsumption: 0,
    carbonEmissions: 0,
    vehicleUtilization: 100,
    routeOptimization: 100
  };

  // Calculate cost if supported
  if (typeConfig.supportsCost) {
    metrics.totalCost = actions.reduce((sum, action) => {
      return sum + calculateLogisticsCost(action.name || action.type, pddlType, action.parameters || action.params);
    }, 0);
  }

  // Calculate duration
  if (typeConfig.supportsParallel) {
    metrics.totalDuration = Math.max(...actions.map(a => (a.end || (a.time || a.start || 0) + (a.duration || typeConfig.defaultDuration))));
  } else {
    const lastAction = actions[actions.length - 1];
    metrics.totalDuration = lastAction.time || lastAction.start || actions.length;
  }

  // Logistics-specific metrics
  const transportActions = actions.filter(a => 
    (a.name || a.type || '').includes('drive') || 
    (a.name || a.type || '').includes('fly')
  );
  
  const loadActions = actions.filter(a => (a.name || a.type || '').includes('load'));
  const unloadActions = actions.filter(a => (a.name || a.type || '').includes('unload'));
  
  // Calculate delivery efficiency
  if (loadActions.length > 0 && unloadActions.length > 0) {
    const deliveryCompletionRate = Math.min(loadActions.length, unloadActions.length) / Math.max(loadActions.length, unloadActions.length);
    metrics.deliveryEfficiency = deliveryCompletionRate * 100;
  }
  
  // Calculate fuel consumption and emissions for numerical/PDDL+ types
  if (typeConfig.supportsCost || typeConfig.supportsContinuous) {
    metrics.fuelConsumption = transportActions.reduce((sum, action) => {
      return sum + calculateLogisticsFuelConsumption(action.name || action.type);
    }, 0);
    
    metrics.carbonEmissions = transportActions.reduce((sum, action) => {
      return sum + calculateLogisticsCarbonEmissions(action.name || action.type);
    }, 0);
  }
  
  // Calculate vehicle utilization
  const uniqueVehicles = new Set();
  actions.forEach(action => {
    const params = action.parameters || action.params || [];
    if (params.length > 0) {
      const vehicle = params.find(p => p.includes('truck') || p.includes('plane'));
      if (vehicle) uniqueVehicles.add(vehicle);
    }
  });
  
  if (uniqueVehicles.size > 0) {
    metrics.vehicleUtilization = Math.min(100, (actions.length / uniqueVehicles.size) * 5);
  }
  
  // Calculate route optimization
  if (transportActions.length > 0) {
    const transportToLoadRatio = transportActions.length / Math.max(1, loadActions.length);
    const idealRatio = 1.2; // Slightly more transport than loading
    metrics.routeOptimization = Math.max(0, 100 - Math.abs(transportToLoadRatio - idealRatio) * 25);
  }

  return metrics;
}

// Get logistics PDDL type configuration
export function getLogisticsPDDLTypeConfig(pddlType) {
  return LOGISTICS_PDDL_TYPES[pddlType] || LOGISTICS_PDDL_TYPES.classical;
}

// Check if logistics PDDL type supports feature
export function logisticsPDDLTypeSupports(pddlType, feature) {
  const config = getLogisticsPDDLTypeConfig(pddlType);
  switch (feature) {
    case 'parallel':
      return config.supportsParallel;
    case 'cost':
      return config.supportsCost;
    case 'continuous':
      return config.supportsContinuous;
    case 'fuelManagement':
      return config.logisticsFeatures?.fuelManagement || false;
    case 'carbonFootprint':
      return config.logisticsFeatures?.carbonFootprint || false;
    case 'realTimeTracking':
      return config.logisticsFeatures?.realTimeTracking || false;
    case 'routeOptimization':
      return config.logisticsFeatures?.routeOptimization !== 'basic';
    case 'multiModalTransport':
      return config.logisticsFeatures?.multiModalTransport || false;
    default:
      return false;
  }
}

// Advanced route optimization
export function optimizeLogisticsRoute(actions, optimizationCriteria = 'cost') {
  if (!actions || actions.length === 0) return actions;
  
  const optimizedActions = [...actions];
  
  // Group actions by vehicle
  const vehicleActions = {};
  optimizedActions.forEach(action => {
    const params = action.parameters || action.params || [];
    const vehicle = params.find(p => p.includes('truck') || p.includes('plane')) || 'unknown';
    
    if (!vehicleActions[vehicle]) {
      vehicleActions[vehicle] = [];
    }
    vehicleActions[vehicle].push(action);
  });
  
  // Optimize each vehicle's route
  Object.keys(vehicleActions).forEach(vehicle => {
    const actions = vehicleActions[vehicle];
    
    switch (optimizationCriteria) {
      case 'cost':
        actions.sort((a, b) => (a.cost || 0) - (b.cost || 0));
        break;
      case 'time':
        actions.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
      case 'fuel':
        actions.sort((a, b) => (a.fuelConsumption || 0) - (b.fuelConsumption || 0));
        break;
      case 'emissions':
        actions.sort((a, b) => (a.carbonEmissions || 0) - (b.carbonEmissions || 0));
        break;
    }
  });
  
  // Rebuild action sequence
  const result = [];
  let time = 0;
  
  // Interleave actions from different vehicles for parallel execution
  const vehicleQueues = Object.values(vehicleActions);
  while (vehicleQueues.some(queue => queue.length > 0)) {
    vehicleQueues.forEach(queue => {
      if (queue.length > 0) {
        const action = queue.shift();
        action.time = time;
        action.start = time;
        result.push(action);
      }
    });
    time += 1;
  }
  
  return result.sort((a, b) => (a.time || 0) - (b.time || 0));
}

// Supply chain visibility tracking
export function trackLogisticsSupplyChain(actions) {
  const supplyChain = {
    packages: {},
    vehicles: {},
    locations: {},
    timeline: []
  };
  
  actions.forEach(action => {
    const actionType = action.name || action.type;
    const params = action.parameters || action.params || [];
    const time = action.time || action.start || 0;
    
    // Track package movements
    if (actionType.includes('load') || actionType.includes('unload')) {
      const packageId = params[0];
      const vehicleId = params[1];
      
      if (!supplyChain.packages[packageId]) {
        supplyChain.packages[packageId] = {
          id: packageId,
          status: 'pending',
          location: 'origin',
          vehicle: null,
          timeline: []
        };
      }
      
      if (actionType.includes('load')) {
        supplyChain.packages[packageId].status = 'in-transit';
        supplyChain.packages[packageId].vehicle = vehicleId;
      } else {
        supplyChain.packages[packageId].status = 'delivered';
        supplyChain.packages[packageId].vehicle = null;
      }
      
      supplyChain.packages[packageId].timeline.push({
        time,
        action: actionType,
        vehicle: vehicleId
      });
    }
    
    // Track vehicle movements
    if (actionType.includes('drive') || actionType.includes('fly')) {
      const vehicleId = params[0];
      const fromLocation = params[1];
      const toLocation = params[2];
      
      if (!supplyChain.vehicles[vehicleId]) {
        supplyChain.vehicles[vehicleId] = {
          id: vehicleId,
          type: actionType.includes('drive') ? 'truck' : 'airplane',
          location: fromLocation,
          route: [],
          cargo: []
        };
      }
      
      supplyChain.vehicles[vehicleId].location = toLocation;
      supplyChain.vehicles[vehicleId].route.push({
        time,
        from: fromLocation,
        to: toLocation
      });
    }
    
    // Add to global timeline
    supplyChain.timeline.push({
      time,
      action: actionType,
      params,
      description: formatLogisticsActionDisplay(action, 'classical')
    });
  });
  
  return supplyChain;
}

// Performance benchmarking
export function benchmarkLogisticsPerformance(actions, pddlType) {
  const metrics = calculateLogisticsMetrics(actions, pddlType);
  
  // Industry benchmarks (example values)
  const benchmarks = {
    deliveryEfficiency: 95,
    vehicleUtilization: 85,
    routeOptimization: 90,
    fuelEfficiency: 8.0, // L/100km
    carbonIntensity: 0.12 // kg CO2/km
  };
  
  const performance = {
    overall: 0,
    categories: {}
  };
  
  // Calculate performance scores
  performance.categories.delivery = Math.min(100, (metrics.deliveryEfficiency / benchmarks.deliveryEfficiency) * 100);
  performance.categories.utilization = Math.min(100, (metrics.vehicleUtilization / benchmarks.vehicleUtilization) * 100);
  performance.categories.routing = Math.min(100, (metrics.routeOptimization / benchmarks.routeOptimization) * 100);
  
  if (metrics.fuelConsumption > 0) {
    const fuelEfficiency = actions.length / metrics.fuelConsumption * 100; // Actions per liter
    performance.categories.fuel = Math.min(100, (fuelEfficiency / benchmarks.fuelEfficiency) * 100);
  } else {
    performance.categories.fuel = 100; // No fuel data
  }
  
  if (metrics.carbonEmissions > 0) {
    const carbonEfficiency = actions.length / metrics.carbonEmissions * 100; // Actions per kg CO2
    performance.categories.carbon = Math.min(100, (carbonEfficiency / benchmarks.carbonIntensity) * 100);
  } else {
    performance.categories.carbon = 100; // No emissions data
  }
  
  // Calculate overall performance
  const categoryScores = Object.values(performance.categories);
  performance.overall = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;
  
  // Add improvement recommendations
  performance.recommendations = [];
  
  if (performance.categories.delivery < 90) {
    performance.recommendations.push('Improve delivery completion rates');
  }
  if (performance.categories.utilization < 80) {
    performance.recommendations.push('Optimize vehicle utilization');
  }
  if (performance.categories.routing < 85) {
    performance.recommendations.push('Enhance route planning algorithms');
  }
  if (performance.categories.fuel < 85) {
    performance.recommendations.push('Implement fuel-efficient driving practices');
  }
  if (performance.categories.carbon < 80) {
    performance.recommendations.push('Consider alternative transportation modes');
  }
  
  return performance;
}