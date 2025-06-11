// File: src/utils/logistics/logisticsParser.js
// Logistics Domain-Specific PDDL Parser with Debug Features
// Handles all PDDL types: classical, temporal, numerical, pddl+

export function parseLogisticsDomain(rawContent, pddlType = 'classical') {
  console.log('🚚 === DEBUG LOGISTICS PARSER STARTED ===');
  console.log('📄 Raw content length:', rawContent.length);
  console.log('📄 First 200 chars:', rawContent.substring(0, 200));
  console.log('📋 PDDL Type:', pddlType);
  
  try {
    const lines = rawContent.split('\n').map(line => line.trim()).filter(line => line);
    console.log(`📋 Total lines after filtering: ${lines.length}`);
    
    const result = {
      actions: [],
      entities: {
        trucks: [],
        airplanes: [],
        packages: [],
        locations: [],
        cities: [],
        airports: [],
        positions: [],
        vehicles: []
      },
      metrics: {},
      pddlType: pddlType,
      domain: 'logistics',
      error: null
    };

    let actionIndex = 0;
    
    // Show first 10 lines for debugging
    console.log('📋 First 10 lines to process:');
    lines.slice(0, 10).forEach((line, i) => {
      console.log(`  ${i}: "${line}"`);
    });

    for (const line of lines) {
      console.log(`\n🔍 Processing line ${actionIndex}: "${line}"`);
      
      // Skip comments and metadata
      if (!line || line.startsWith(';') || line.startsWith('#') ||
          line.includes('domain parsed') || line.includes('problem parsed') ||
          line.includes('grounding') || line.includes('planning time') ||
          line.includes('plan-length') || line.includes('metric') ||
          line.includes('expanded nodes') || line.includes('found plan:') ||
          line.includes('problem solved') || line.includes('g(n)=') ||
          line.includes('h(n)=') || line.includes('search time') ||
          line.includes('states evaluated')) {
        console.log('  ⏩ Skipping metadata/comment line');
        continue;
      }
      
      // Try to parse as action
      const action = parseLogisticsAction(line, pddlType, actionIndex);
      if (action) {
        result.actions.push(action);
        extractLogisticsEntities(action, result.entities);
        console.log(`  ✅ PARSED ACTION:`, {
          name: action.name,
          actionType: action.actionType,
          vehicle: action.vehicle,
          package: action.package,
          location: action.location,
          fromLocation: action.fromLocation,
          toLocation: action.toLocation,
          parameters: action.parameters
        });
        actionIndex++;
      } else {
        console.log('  ❌ Failed to parse as action');
      }
      
      // Parse statistics
      parseStatistics(line, result.metrics);
    }
    
    console.log('\n🏁 === PARSING COMPLETE ===');
    console.log('📊 Final Results:');
    console.log('  Actions:', result.actions.length);
    console.log('  Trucks:', result.entities.trucks);
    console.log('  Airplanes:', result.entities.airplanes);
    console.log('  Packages:', result.entities.packages);
    console.log('  Locations:', result.entities.locations);
    console.log('  Cities:', result.entities.cities);
    console.log('  Airports:', result.entities.airports);
    console.log('  Positions:', result.entities.positions);
    
    // Merge vehicles
    result.entities.vehicles = [...result.entities.trucks, ...result.entities.airplanes];
    
    // Calculate total duration based on PDDL type
    if (result.actions.length > 0) {
      const lastAction = result.actions[result.actions.length - 1];
      switch (pddlType) {
        case 'temporal':
        case 'pddl_plus':
          result.totalDuration = Math.max(...result.actions.map(a => a.end || a.time + a.duration));
          result.metrics.parallelActions = calculateLogisticsParallelActions(result.actions);
          break;
        case 'numerical':
          result.totalCost = result.actions.reduce((sum, a) => sum + (a.cost || 1), 0);
          result.totalDuration = lastAction.time || result.actions.length;
          break;
        default:
          result.totalDuration = lastAction.time || result.actions.length;
      }
    }
    
    if (result.actions.length === 0) {
      console.error('❌ NO ACTIONS PARSED - This is the problem!');
      console.log('📄 Full content for analysis:');
      console.log(rawContent);
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Parsing error:', error);
    return {
      actions: [],
      entities: { trucks: [], airplanes: [], packages: [], locations: [], cities: [], airports: [], vehicles: [] },
      metrics: {},
      pddlType,
      domain: 'logistics',
      error: `Parser error: ${error.message}`
    };
  }
}

function parseLogisticsAction(line, pddlType, index) {
  console.log(`    🔍 Trying to parse: "${line}"`);
  
  // Pattern 1: "0.000: (action param1 param2) [duration]"
  let match = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[(?:D:)?(\d+(?:\.\d+)?)\])?/);
  if (match) {
    const [, timeStr, actionStr, durationStr] = match;
    console.log(`    ✅ Pattern 1 match: time=${timeStr}, action="${actionStr}", duration=${durationStr}`);
    return createLogisticsAction(parseFloat(timeStr), actionStr, parseFloat(durationStr) || null, index, pddlType);
  }
  
  // Pattern 2: "0: (action param1 param2)"
  match = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)/);
  if (match) {
    const [, timeStr, actionStr] = match;
    console.log(`    ✅ Pattern 2 match: time=${timeStr}, action="${actionStr}"`);
    return createLogisticsAction(parseFloat(timeStr), actionStr, null, index, pddlType);
  }
  
  // Pattern 3: "(action param1 param2)" - standalone
  match = line.match(/^\(([^)]+)\)$/);
  if (match) {
    const [, actionStr] = match;
    console.log(`    ✅ Pattern 3 match: action="${actionStr}"`);
    return createLogisticsAction(index, actionStr, null, index, pddlType);
  }
  
  // Pattern 4: "action param1 param2" - no parentheses
  match = line.match(/^(\w+(?:[-_]\w+)?)\s+(.+)$/);
  if (match) {
    const [, actionName, paramsStr] = match;
    const actionStr = `${actionName} ${paramsStr}`;
    console.log(`    ✅ Pattern 4 match: actionName="${actionName}", params="${paramsStr}"`);
    return createLogisticsAction(index, actionStr, null, index, pddlType);
  }
  
  console.log(`    ❌ No patterns matched`);
  return null;
}

function createLogisticsAction(time, actionStr, duration = null, index = 0, pddlType = 'classical') {
  const actionParts = actionStr.trim().split(/\s+/).filter(part => part && part !== '');
  const actionName = actionParts[0].toLowerCase();
  const params = actionParts.slice(1);
  
  console.log(`    🔧 Creating action: name="${actionName}", params=[${params.join(', ')}]`);
  
  // Calculate duration if not provided
  if (duration === null) {
    duration = getDefaultLogisticsDuration(actionName, pddlType);
  }
  
  const action = {
    time: time,
    start: time,
    end: time + duration,
    duration: duration,
    name: actionName,
    parameters: params,
    params: params,
    step: Math.floor(time),
    cost: getDefaultLogisticsCost(actionName, pddlType),
    type: 'logistics',
    index: index
  };

  // Set actionType and extract entities
  setLogisticsActionType(action, actionName, params);
  
  // Add PDDL-specific properties
  if (pddlType === 'numerical') {
    action.fuelConsumption = calculateFuelConsumption(actionName, params);
    action.carbonEmissions = calculateCarbonEmissions(actionName, params);
    action.resourceEfficiency = calculateResourceEfficiency(actionName, params);
  }
  
  if (pddlType === 'temporal' || pddlType === 'pddl_plus') {
    action.canExecuteInParallel = canExecuteInParallel(actionName);
    action.conflictsWith = identifyConflictingActions(actionName, params);
  }
  
  if (pddlType === 'pddl_plus') {
    action.continuousEffects = extractContinuousEffects(actionName, params);
    action.environmentalFactors = extractEnvironmentalFactors(actionName, params);
  }
  
  return action;
}

function setLogisticsActionType(action, actionName, params) {
  console.log(`    🎯 Determining action type for: "${actionName}" with params: [${params.join(', ')}]`);
  
  // LOAD actions
  if ((actionName === 'load' || actionName.includes('load')) && params.length >= 2) {
    action.actionType = 'load-vehicle';
    action.package = params[0];
    action.vehicle = params[1];
    action.location = params[2] || params[1];
    console.log(`    📦 LOAD: package=${action.package}, vehicle=${action.vehicle}, location=${action.location}`);
    return;
  }
  
  // UNLOAD actions
  if ((actionName === 'unload' || actionName.includes('unload')) && params.length >= 2) {
    action.actionType = 'unload-vehicle';
    action.package = params[0];
    action.vehicle = params[1];
    action.location = params[2] || params[1];
    console.log(`    📤 UNLOAD: package=${action.package}, vehicle=${action.vehicle}, location=${action.location}`);
    return;
  }
  
  // DRIVE actions
  if ((actionName === 'drive' || actionName.includes('drive')) && params.length >= 3) {
    action.actionType = 'drive-truck';
    action.vehicle = params[0];
    action.fromLocation = params[1];
    action.toLocation = params[2];
    console.log(`    🚚 DRIVE: vehicle=${action.vehicle}, from=${action.fromLocation}, to=${action.toLocation}`);
    return;
  }
  
  // FLY actions
  if ((actionName === 'fly' || actionName.includes('fly')) && params.length >= 3) {
    action.actionType = 'fly-airplane';
    action.vehicle = params[0];
    action.fromLocation = params[1];
    action.toLocation = params[2];
    console.log(`    ✈️ FLY: vehicle=${action.vehicle}, from=${action.fromLocation}, to=${action.toLocation}`);
    return;
  }
  
  // Fallback
  action.actionType = 'unknown';
  console.log(`    ❓ UNKNOWN action type`);
}

function extractLogisticsEntities(action, entities) {
  console.log(`    📦 Extracting entities from:`, action);
  
  // Extract vehicles
  if (action.vehicle) {
    const vehicleLower = action.vehicle.toLowerCase();
    if (vehicleLower.includes('tru') || vehicleLower.includes('truck')) {
      if (!entities.trucks.includes(action.vehicle)) {
        entities.trucks.push(action.vehicle);
        console.log(`      🚚 Added truck: ${action.vehicle}`);
      }
    } else if (vehicleLower.includes('apn') || vehicleLower.includes('plane') || vehicleLower.includes('airplane')) {
      if (!entities.airplanes.includes(action.vehicle)) {
        entities.airplanes.push(action.vehicle);
        console.log(`      ✈️ Added airplane: ${action.vehicle}`);
      }
    }
  }
  
  // Extract packages
  if (action.package && !entities.packages.includes(action.package)) {
    entities.packages.push(action.package);
    console.log(`      📦 Added package: ${action.package}`);
  }
  
  // Extract locations
  [action.location, action.fromLocation, action.toLocation].forEach(loc => {
    if (loc && !entities.locations.includes(loc)) {
      entities.locations.push(loc);
      console.log(`      📍 Added location: ${loc}`);
      
      // Categorize location
      const locLower = loc.toLowerCase();
      if (locLower.includes('apt') || locLower.includes('airport')) {
        if (!entities.airports.includes(loc)) {
          entities.airports.push(loc);
          console.log(`        🛫 Categorized as airport: ${loc}`);
        }
      } else if (locLower.includes('pos') || locLower.includes('position')) {
        if (!entities.positions.includes(loc)) {
          entities.positions.push(loc);
          console.log(`        📌 Categorized as position: ${loc}`);
        }
      } else if (locLower.includes('cit') || locLower.includes('city')) {
        if (!entities.cities.includes(loc)) {
          entities.cities.push(loc);
          console.log(`        🏙️ Categorized as city: ${loc}`);
        }
      }
    }
  });
}

function getDefaultLogisticsDuration(actionName, pddlType) {
  const baseDurations = {
    'drive': 5.0,
    'drive-truck': 5.0,
    'fly': 8.0,
    'fly-airplane': 8.0,
    'load': 2.0,
    'load-vehicle': 2.0,
    'unload': 2.0,
    'unload-vehicle': 2.0
  };
  
  let baseDuration = baseDurations[actionName] || 3.0;
  
  // Adjust for PDDL type
  switch (pddlType) {
    case 'temporal':
      return baseDuration;
    case 'numerical':
      return baseDuration * 0.9; // Numerical optimization
    case 'pddl_plus':
      return baseDuration * 1.1; // Continuous effects
    default:
      return 1.0; // Classical is step-based
  }
}

function getDefaultLogisticsCost(actionName) {
  const baseCosts = {
    'drive': 4,
    'drive-truck': 4,
    'fly': 8,
    'fly-airplane': 8,
    'load': 1,
    'load-vehicle': 1,
    'unload': 1,
    'unload-vehicle': 1
  };
  
  return baseCosts[actionName] || 2;
}

function calculateFuelConsumption(actionName) {
  switch (actionName) {
    case 'drive':
    case 'drive-truck':
      return 5.5; // Liters per 100km
    case 'fly':
    case 'fly-airplane':
      return 15.8; // Liters per 100km
    default:
      return 0;
  }
}

function calculateCarbonEmissions(actionName) {
  switch (actionName) {
    case 'drive':
    case 'drive-truck':
      return 0.12; // kg CO2 per km
    case 'fly':
    case 'fly-airplane':
      return 0.25; // kg CO2 per km
    default:
      return 0;
  }
}

function calculateResourceEfficiency(actionName) {
  // Calculate efficiency rating (0-100%)
  const baseEfficiency = {
    'drive': 75,
    'fly': 60,
    'load': 90,
    'unload': 90
  };
  
  return baseEfficiency[actionName] || 80;
}

function canExecuteInParallel(actionName) {
  // Loading/unloading can happen in parallel with different vehicles
  return actionName === 'load' || actionName === 'unload';
}

function identifyConflictingActions(actionName, params) {
  // Vehicle movement conflicts with other actions on same vehicle
  if (actionName === 'drive' || actionName === 'fly') {
    return [`load-${params[0]}`, `unload-${params[0]}`];
  }
  
  return [];
}

function extractContinuousEffects(actionName) {
  const effects = [];
  
  if (actionName === 'drive' || actionName === 'fly') {
    effects.push({
      type: 'fuel-consumption',
      rate: actionName === 'fly' ? 2.5 : 1.2,
      target: 'fuel-level',
      operation: 'decrease'
    });
    
    effects.push({
      type: 'emissions',
      rate: actionName === 'fly' ? 0.25 : 0.12,
      target: 'carbon-footprint',
      operation: 'increase'
    });
  }
  
  return effects;
}

function extractEnvironmentalFactors(actionName) {
  const factors = {};
  
  if (actionName === 'fly') {
    factors.weather = Math.random() > 0.8 ? 'adverse' : 'normal';
    factors.airTraffic = Math.random() > 0.7 ? 'heavy' : 'normal';
  }
  
  if (actionName === 'drive') {
    factors.traffic = Math.random() > 0.6 ? 'heavy' : 'normal';
    factors.roadConditions = Math.random() > 0.9 ? 'poor' : 'good';
  }
  
  return factors;
}

function calculateLogisticsParallelActions(actions) {
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

// Shared utility function
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

console.log('✅ Debug Logistics Parser loaded - will show detailed parsing steps');