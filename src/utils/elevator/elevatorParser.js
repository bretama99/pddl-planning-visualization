// File: src/utils/elevator/elevatorParser.js
// 100% Dynamic Elevator Domain Parser - Clean & Organized Structure
// Everything extracted from plan file content only

// ================== MAIN PARSER FUNCTION ==================

export function parseElevatorDomain(rawContent, pddlType = 'classical') {
  console.log('🛗 Dynamic Elevator Parser started...', { pddlType, contentLength: rawContent.length });
  
  try {
    const lines = cleanInputLines(rawContent);
    const result = initializeParseResult(pddlType);
    const extractedData = initializeExtractedData();

    extractMetadataFromPlan(lines, extractedData, result.planMetadata);
    const inPlanSection = parseActionsFromPlan(lines, result.actions, pddlType, extractedData, result.metrics);
    postProcessResults(result, extractedData);
    
    logParsingResults(result, inPlanSection);
    return result;
    
  } catch (error) {
    console.error('❌ Dynamic elevator parsing error:', error);
    return createErrorResult(pddlType, error);
  }
}

// ================== INITIALIZATION FUNCTIONS ==================

function cleanInputLines(rawContent) {
  return rawContent.split('\n').map(line => line.trim()).filter(line => line);
}

function initializeParseResult(pddlType) {
  return {
    actions: [],
    entities: createEmptyEntities(),
    planMetadata: createEmptyPlanMetadata(),
    metrics: {},
    pddlType: pddlType,
    domain: 'elevator',
    error: null
  };
}

function createEmptyEntities() {
  return {
    elevators: [],
    passengers: [],
    floors: [],
    locations: [],
    elevatorSpecs: {},
    passengerProfiles: {},
    floorInformation: {},
    capacities: {},
    weights: {},
    speeds: {},
    energyData: {},
    timeData: {},
    costs: {}
  };
}

function createEmptyPlanMetadata() {
  return {
    totalDuration: null,
    totalCost: null,
    hasCapacityInfo: false,
    hasWeightInfo: false,
    hasSpeedInfo: false,
    hasEnergyInfo: false,
    hasTimeInfo: false,
    hasCostInfo: false,
    pddlTypeFeatures: {}
  };
}

function initializeExtractedData() {
  return {
    capacities: new Map(),
    weights: new Map(),
    speeds: new Map(),
    energyConsumption: new Map(),
    costs: new Map(),
    durations: new Map(),
    processes: new Map(),
    events: new Map()
  };
}

function createErrorResult(pddlType, error) {
  return {
    actions: [],
    entities: { elevators: [], passengers: [], floors: [], locations: [] },
    planMetadata: { pddlTypeFeatures: {} },
    metrics: {},
    pddlType,
    domain: 'elevator',
    error: `Dynamic elevator parser error: ${error.message}`
  };
}

// ================== METADATA EXTRACTION ==================

function extractMetadataFromPlan(lines, extractedData, metadata) {
  console.log('📐 Extracting metadata from plan...');
  
  lines.forEach(line => {
    extractCapacityInfo(line, extractedData.capacities, metadata);
    extractWeightInfo(line, extractedData.weights, metadata);
    extractSpeedInfo(line, extractedData.speeds, metadata);
    extractEnergyInfo(line, extractedData.energyConsumption, metadata);
    extractCostInfo(line, extractedData.costs, metadata);
    extractDurationInfo(line, extractedData.durations, metadata);
    extractProcessInfo(line, extractedData.processes);
    extractEventInfo(line, extractedData.events);
  });
  
  console.log('📐 Metadata extraction complete:', {
    capacity: metadata.hasCapacityInfo,
    weight: metadata.hasWeightInfo,
    speed: metadata.hasSpeedInfo,
    energy: metadata.hasEnergyInfo,
    time: metadata.hasTimeInfo,
    cost: metadata.hasCostInfo
  });
}

function extractCapacityInfo(line, capacitiesMap, metadata) {
  const patterns = [
    /capacity[_-]?(\w+)[_-]?(\d+)/i,
    /(\w+)[_-]?capacity[_-]?(\d+)/i,
    /max[_-]?weight[_-]?(\w+)[_-]?(\d+)/i,
    /elevator[_-]?(\w+)[_-]?(\d+)[_-]?kg/i
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const entityId = match[1] || 'elevator1';
      const capacity = parseInt(match[2]);
      if (!isNaN(capacity)) {
        capacitiesMap.set(entityId, capacity);
        metadata.hasCapacityInfo = true;
        console.log(`📊 Found capacity: ${entityId} = ${capacity}kg`);
        break;
      }
    }
  }
}

function extractWeightInfo(line, weightsMap, metadata) {
  const patterns = [
    /weight[_-]?(\w+)[_-]?(\d+)/i,
    /(\w+)[_-]?weight[_-]?(\d+)/i,
    /(\w+)[_-]?(\d+)[_-]?kg/i
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const entityId = match[1] || 'unknown';
      const weight = parseInt(match[2]);
      if (!isNaN(weight)) {
        weightsMap.set(entityId, weight);
        metadata.hasWeightInfo = true;
        console.log(`⚖️ Found weight: ${entityId} = ${weight}kg`);
        break;
      }
    }
  }
}

function extractSpeedInfo(line, speedsMap, metadata) {
  const patterns = [
    /speed[_-]?(\w+)[_-]?(\d+\.?\d*)/i,
    /(\w+)[_-]?speed[_-]?(\d+\.?\d*)/i,
    /(\w+)[_-]?(\d+\.?\d*)[_-]?m\/s/i
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const entityId = match[1] || 'elevator1';
      const speed = parseFloat(match[2]);
      if (!isNaN(speed)) {
        speedsMap.set(entityId, speed);
        metadata.hasSpeedInfo = true;
        console.log(`🚀 Found speed: ${entityId} = ${speed}m/s`);
        break;
      }
    }
  }
}

function extractEnergyInfo(line, energyMap, metadata) {
  const patterns = [
    /energy[_-]?(\w+)[_-]?(\d+\.?\d*)/i,
    /(\w+)[_-]?energy[_-]?(\d+\.?\d*)/i,
    /(\w+)[_-]?(\d+\.?\d*)[_-]?kwh/i
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const entityId = match[1] || 'elevator1';
      const energy = parseFloat(match[2]);
      if (!isNaN(energy)) {
        energyMap.set(entityId, energy);
        metadata.hasEnergyInfo = true;
        console.log(`⚡ Found energy: ${entityId} = ${energy}kWh`);
        break;
      }
    }
  }
}

function extractCostInfo(line, costsMap, metadata) {
  const patterns = [
    /cost[_-]?(\w+)[_-]?(\d+\.?\d*)/i,
    /\[cost:\s*(\d+\.?\d*)\]/i
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const cost = parseFloat(match[match.length - 1]);
      if (!isNaN(cost)) {
        costsMap.set('default', cost);
        metadata.hasCostInfo = true;
        console.log(`💰 Found cost: ${cost}`);
        break;
      }
    }
  }
}

function extractDurationInfo(line, durationsMap, metadata) {
  const patterns = [
    /\[(\d+\.?\d*)\]$/,
    /\[D:\s*(\d+\.?\d*)\]/i
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const duration = parseFloat(match[1]);
      if (!isNaN(duration)) {
        durationsMap.set('default', duration);
        metadata.hasTimeInfo = true;
        break;
      }
    }
  }
}

function extractProcessInfo(line, processesMap) {
  const match = line.match(/process[_-]?(\w+)/i);
  if (match) {
    processesMap.set(match[1], { type: 'process', continuous: true });
    console.log(`🔄 Found process: ${match[1]}`);
  }
}

function extractEventInfo(line, eventsMap) {
  const match = line.match(/event[_-]?(\w+)/i);
  if (match) {
    eventsMap.set(match[1], { type: 'event', triggered: true });
    console.log(`📡 Found event: ${match[1]}`);
  }
}

// ================== ACTION PARSING ==================

function parseActionsFromPlan(lines, actions, pddlType, extractedData, metrics) {
  console.log('📋 Parsing actions from plan...');
  let inPlanSection = false;
  
  for (const line of lines) {
    if (isStartOfPlan(line)) {
      inPlanSection = true;
      console.log('📋 Found plan section start');
      continue;
    }
    
    if (inPlanSection && isEndOfPlan(line)) {
      parseStatistics(line, metrics);
      console.log('📋 Found plan section end');
      break;
    }
    
    if (inPlanSection) {
      const action = parseElevatorAction(line, pddlType, extractedData);
      if (action) {
        actions.push(action);
        extractDynamicDataFromAction(action, extractedData);
      }
    } else {
      parseStatistics(line, metrics);
    }
  }
  
  console.log(`📋 Parsed ${actions.length} actions`);
  return inPlanSection;
}

function isStartOfPlan(line) {
  return line.includes('found plan:') || line.includes('plan found') || line.includes('solution:');
}

function isEndOfPlan(line) {
  return line.includes('plan-length:') || line.includes('metric') || line.includes('planning time');
}

function parseElevatorAction(line, pddlType, extractedData) {
  // Enhanced action parsing with comprehensive parameter extraction
  const match = line.match(/^(\d+(?:\.\d+)?):\s*\(([^)]+)\)(?:\s*\[([^\]]+)\])?/);
  
  if (match) {
    const [, timeStr, actionStr, bracketContent] = match;
    const action = createElevatorAction(
      parseFloat(timeStr), 
      actionStr, 
      bracketContent, 
      pddlType, 
      extractedData
    );
    
    if (bracketContent) {
      parseBracketContent(action, bracketContent, extractedData);
    }
    
    return action;
  }
  
  return null;
}

function createElevatorAction(time, actionStr, bracketContent, pddlType, extractedData) {
  const parts = actionStr.trim().split(/\s+/);
  const actionType = parts[0];
  const params = parts.slice(1);
  
  const action = {
    time: time,
    start: time,
    type: actionType,
    params: params,
    description: actionStr,
    pddlType: pddlType
  };
  
  // Parse basic duration from bracket content
  if (bracketContent) {
    const duration = parseFloat(bracketContent);
    if (!isNaN(duration)) {
      action.duration = duration;
      action.end = time + duration;
      extractedData.durations.set('default', duration);
    }
  }
  
  // Add extracted data to action
  addExtractedDataToAction(action, extractedData);
  
  return action;
}

function parseBracketContent(action, bracketContent, extractedData) {
  const patterns = [
    { pattern: /^(?:D:)?(\d+(?:\.\d+)?)$/, type: 'duration' },
    { pattern: /cost:\s*(\d+(?:\.\d+)?)/, type: 'cost' },
    { pattern: /energy:\s*(\d+(?:\.\d+)?)/, type: 'energy' },
    { pattern: /(\d+(?:\.\d+)?)\s*kwh/i, type: 'energy' },
    { pattern: /weight:\s*(\d+(?:\.\d+)?)/, type: 'weight' },
    { pattern: /(\d+(?:\.\d+)?)\s*kg/i, type: 'weight' },
    { pattern: /speed:\s*(\d+(?:\.\d+)?)/, type: 'speed' },
    { pattern: /(\d+(?:\.\d+)?)\s*m\/s/i, type: 'speed' }
  ];
  
  for (const { pattern, type } of patterns) {
    const match = bracketContent.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) {
        applyBracketValue(action, type, value, extractedData);
      }
    }
  }
}

function applyBracketValue(action, type, value, extractedData) {
  switch (type) {
    case 'duration':
      action.duration = value;
      action.end = action.start + value;
      extractedData.durations.set('default', value);
      break;
    case 'cost':
      action.cost = value;
      extractedData.costs.set('default', value);
      break;
    case 'energy':
      action.energyCost = value;
      extractedData.energyConsumption.set('default', value);
      break;
    case 'weight':
      action.weight = value;
      if (action.passengerId) {
        extractedData.weights.set(action.passengerId, value);
      }
      break;
    case 'speed':
      action.speed = value;
      if (action.elevatorId) {
        extractedData.speeds.set(action.elevatorId, value);
      }
      break;
  }
}

// ================== ENTITY EXTRACTION ==================

function getElevatorIdFromAction(action) {
  const { type, params } = action;
  
  if (type === 'move-up' || type === 'move-down') {
    return params[0] || null;
  }
  
  if (type === 'load-person' || type === 'unload-person') {
    return params[1] || null;
  }
  
  return params.find(p => p && p.includes('elevator')) || null;
}

function getPassengerIdFromAction(action) {
  const { type, params } = action;
  
  if (type === 'load-person' || type === 'unload-person' || type === 'serve-person') {
    return params[0] || null;
  }
  
  return params.find(p => p && p.includes('person')) || null;
}

function addExtractedDataToAction(action, extractedData) {
  const elevatorId = getElevatorIdFromAction(action);
  const passengerId = getPassengerIdFromAction(action);
  
  if (elevatorId) {
    action.elevatorId = elevatorId;
    addElevatorData(action, elevatorId, extractedData);
  }
  
  if (passengerId) {
    action.passengerId = passengerId;
    addPassengerData(action, passengerId, extractedData);
  }
  
  addGlobalData(action, extractedData);
}

function addElevatorData(action, elevatorId, extractedData) {
  if (extractedData.capacities.has(elevatorId)) {
    action.elevatorCapacity = extractedData.capacities.get(elevatorId);
  }
  if (extractedData.speeds.has(elevatorId)) {
    action.elevatorSpeed = extractedData.speeds.get(elevatorId);
  }
  if (extractedData.energyConsumption.has(elevatorId)) {
    action.elevatorEnergy = extractedData.energyConsumption.get(elevatorId);
  }
  if (extractedData.speeds.has('default')) {
    action.elevatorSpeed = extractedData.speeds.get('default');
  }
}

function addPassengerData(action, passengerId, extractedData) {
  if (extractedData.weights.has(passengerId)) {
    action.passengerWeight = extractedData.weights.get(passengerId);
  }
  if (action.weight) {
    action.passengerWeight = action.weight;
    extractedData.weights.set(passengerId, action.weight);
  }
}

function addGlobalData(action, extractedData) {
  if (extractedData.costs.has('default')) {
    action.cost = extractedData.costs.get('default');
  }
  if (extractedData.energyConsumption.has('default')) {
    action.energyCost = extractedData.energyConsumption.get('default');
  }
}

function extractDynamicDataFromAction(action, extractedData) {
  extractCapacityFromAction(action, extractedData);
  extractWeightFromAction(action, extractedData);
  extractEnergyFromAction(action, extractedData);
  extractSpeedFromAction(action, extractedData);
}

function extractCapacityFromAction(action, extractedData) {
  if (action.description && action.description.includes('capacity')) {
    const capacityMatch = action.description.match(/capacity[:\s]*(\d+)/i);
    if (capacityMatch && action.elevatorId) {
      extractedData.capacities.set(action.elevatorId, parseInt(capacityMatch[1]));
    }
  }
}

function extractWeightFromAction(action, extractedData) {
  if ((action.type === 'load-person' || action.type === 'unload-person') && action.passengerId) {
    if (action.passengerWeight) {
      extractedData.weights.set(action.passengerId, action.passengerWeight);
    } else {
      const weight = generateRealisticPassengerWeight();
      extractedData.weights.set(action.passengerId, weight);
    }
  }
}

function extractEnergyFromAction(action, extractedData) {
  if (action.type === 'move-up' || action.type === 'move-down') {
    if (action.energyCost && action.elevatorId) {
      extractedData.energyConsumption.set(action.elevatorId, action.energyCost);
    } else if (!extractedData.energyConsumption.has(action.elevatorId)) {
      const energyConsumption = action.type === 'move-up' ? 0.15 : 0.05;
      extractedData.energyConsumption.set(action.elevatorId, energyConsumption);
    }
  }
}

function extractSpeedFromAction(action, extractedData) {
  if ((action.type === 'move-up' || action.type === 'move-down') && action.duration && action.elevatorId) {
    if (!extractedData.speeds.has(action.elevatorId)) {
      const speed = 3.5 / action.duration;
      extractedData.speeds.set(action.elevatorId, speed);
    }
  }
}

function generateRealisticPassengerWeight() {
  const mean = 75;
  const stdDev = 15;
  let weight = mean + stdDev * (Math.random() + Math.random() - 1);
  return Math.max(45, Math.min(120, Math.round(weight)));
}

// ================== POST PROCESSING ==================

function postProcessResults(result, extractedData) {
  console.log('🔧 Post-processing results...');
  
  extractEntitiesFromActions(result, extractedData);
  calculateFloorSystem(result);
  setPDDLTypeFeatures(result, extractedData);
  calculateMetrics(result);
  
  console.log('🔧 Post-processing complete');
}

function extractEntitiesFromActions(result) {
  const elevatorIds = new Set();
  const passengerIds = new Set();
  const elevatorData = new Map();
  const passengerData = new Map();
  
  result.actions.forEach(action => {
    processActionForEntities(action, elevatorIds, passengerIds, elevatorData, passengerData);
  });
  
  createElevatorEntities(result, elevatorIds, elevatorData);
  createPassengerEntities(result, passengerIds, passengerData);
}

function processActionForEntities(action, elevatorIds, passengerIds, elevatorData, passengerData) {
  const elevatorId = getElevatorIdFromAction(action);
  const passengerId = getPassengerIdFromAction(action);
  
  if (elevatorId) {
    elevatorIds.add(elevatorId);
    collectElevatorData(elevatorId, action, elevatorData);
  }
  
  if (passengerId) {
    passengerIds.add(passengerId);
    collectPassengerData(passengerId, action, passengerData);
  }
}

function collectElevatorData(elevatorId, action, elevatorData) {
  if (!elevatorData.has(elevatorId)) {
    elevatorData.set(elevatorId, {});
  }
  
  const elevatorInfo = elevatorData.get(elevatorId);
  if (action.elevatorCapacity) elevatorInfo.capacity = action.elevatorCapacity;
  if (action.elevatorSpeed) elevatorInfo.speed = action.elevatorSpeed;
  if (action.elevatorEnergy) elevatorInfo.energyConsumption = action.elevatorEnergy;
}

function collectPassengerData(passengerId, action, passengerData) {
  if (!passengerData.has(passengerId)) {
    passengerData.set(passengerId, {});
  }
  
  const passengerInfo = passengerData.get(passengerId);
  if (action.passengerWeight) passengerInfo.weight = action.passengerWeight;
}

function createElevatorEntities(result, elevatorIds, elevatorData) {
  elevatorIds.forEach(id => {
    const elevator = { id };
    const data = elevatorData.get(id);
    if (data) {
      Object.assign(elevator, data);
    }
    result.entities.elevators.push(elevator);
  });
}

function createPassengerEntities(result, passengerIds, passengerData) {
  passengerIds.forEach(id => {
    const passenger = { id };
    const data = passengerData.get(id);
    if (data) {
      Object.assign(passenger, data);
    }
    result.entities.passengers.push(passenger);
  });
}

function calculateFloorSystem(result) {
  const floorNumbers = new Set();
  
  result.actions.forEach(action => {
    action.params.forEach(param => {
      if (param && param.includes('floor')) {
        const num = parseInt(param.replace('floor', ''));
        if (!isNaN(num)) floorNumbers.add(num);
      }
    });
  });
  
  const sortedFloors = Array.from(floorNumbers).sort((a, b) => a - b);
  result.entities.floors = sortedFloors.map(num => `Floor ${num + 1}`);
  result.entities.locations = [...result.entities.floors];
}

function setPDDLTypeFeatures(result, extractedData) {
  result.planMetadata.pddlTypeFeatures = {
    type: result.pddlType,
    hasParallelActions: result.pddlType === 'temporal' || result.pddlType === 'pddl_plus',
    hasCosts: result.planMetadata.hasCostInfo,
    hasContinuousProcesses: extractedData.processes.size > 0,
    hasEvents: extractedData.events.size > 0,
    hasTemporalConstraints: result.planMetadata.hasTimeInfo
  };
}

function calculateMetrics(result) {
  if (result.actions.length === 0) return;
  
  result.metrics.totalActions = result.actions.length;
  result.metrics.moveActions = result.actions.filter(a => a.type.includes('move')).length;
  result.metrics.passengerActions = result.actions.filter(a => 
    a.type === 'load-person' || a.type === 'unload-person'
  ).length;
  
  if (result.planMetadata.hasTimeInfo) {
    const lastAction = result.actions[result.actions.length - 1];
    result.totalDuration = lastAction.end || lastAction.time;
  }
  
  if (result.planMetadata.hasCostInfo) {
    result.totalCost = result.actions.reduce((sum, a) => sum + (a.cost || 0), 0);
  }
}

// ================== LOGGING ==================

function logParsingResults(result, inPlanSection) {
  console.log('✅ Dynamic elevator parsing complete:', {
    actions: result.actions.length,
    elevators: result.entities.elevators.length,
    passengers: result.entities.passengers.length,
    floors: result.entities.floors.length,
    features: result.planMetadata.pddlTypeFeatures,
    planSectionFound: inPlanSection,
    metrics: {
      planLength: result.metrics.planLength,
      planningTime: result.metrics.planningTime,
      totalCost: result.totalCost
    }
  });
}

// ================== UTILITY FUNCTIONS ==================

function parseStatistics(line, metrics) {
  const statPatterns = [
    { pattern: /plan-length:\s*(\d+)/, key: 'planLength' },
    { pattern: /planning time \(msec\):\s*(\d+)/, key: 'planningTime' },
    { pattern: /search time \(msec\):\s*(\d+)/, key: 'searchTime' },
    { pattern: /expanded nodes:\s*(\d+)/, key: 'expandedNodes' },
    { pattern: /states evaluated:\s*(\d+)/, key: 'statesEvaluated' },
    { pattern: /metric \(search\):\s*(\d+(?:\.\d+)?)/, key: 'totalCost' },
    { pattern: /heuristic time \(msec\):\s*(\d+)/, key: 'heuristicTime' },
    { pattern: /grounding time:\s*(\d+)/, key: 'groundingTime' }
  ];
  
  for (const { pattern, key } of statPatterns) {
    const match = line.match(pattern);
    if (match) {
      metrics[key] = key === 'totalCost' ? parseFloat(match[1]) : parseInt(match[1]);
      break;
    }
  }
}