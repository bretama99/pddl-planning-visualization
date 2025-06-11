// ElevatorSimulator Utility Functions
// File: src/utils/elevatorSimulatorUtils.js
// Missing functions for ElevatorSimulator Vue component

export function getPDDLTypeName(pddlType) {
  const names = {
    'classical': 'Classical PDDL',
    'temporal': 'Temporal PDDL',
    'numerical': 'Numerical PDDL',
    'pddl_plus': 'PDDL+'
  };
  return names[pddlType] || 'Unknown';
}

export function getPDDLTypeDescription(pddlType) {
  const descriptions = {
    'classical': 'Step-based planning with discrete actions',
    'temporal': 'Time-based planning with durative actions',
    'numerical': 'Planning with numeric fluents and constraints',
    'pddl_plus': 'Hybrid discrete/continuous planning'
  };
  return descriptions[pddlType] || 'Unknown PDDL type';
}

export function setupFloors(result) {
  // Setup floors based on entities or default
  if (result.entities && result.entities.floors && result.entities.floors.length > 0) {
    return result.entities.floors;
  }
  
  // Default floor setup
  return ['Floor 1', 'Floor 2', 'Floor 3'];
}

export function setupElevators(result) {
  // Setup elevators based on entities or default
  if (result.entities && result.entities.elevators && result.entities.elevators.length > 0) {
    return result.entities.elevators;
  }
  
  // Default elevator setup
  return [{
    id: 'elevator-1',
    type: 'standard',
    capacity: 1000,
    maxCapacity: 1000,
    maxPassengers: 8,
    speed: 2.5,
    position: 0,
    isMoving: false,
    direction: null,
    doorsOpen: false,
    passengers: [],
    currentWeight: 0,
    totalDistance: 0,
    energyUsed: 0,
    trips: 0,
    color: '#3498db',
    status: 'idle',
    emergency: false
  }];
}

export function setupPassengers(result) {
  // Setup passengers based on entities or default
  if (result.entities && result.entities.passengers && result.entities.passengers.length > 0) {
    return result.entities.passengers;
  }
  
  return [];
}

export function calculatePositionRange(actions) {
  let position = 0;
  let minFloor = 0;
  let maxFloor = 0;
  
  actions.forEach(action => {
    if (action.type === 'move-up') {
      position++;
      maxFloor = Math.max(maxFloor, position);
    } else if (action.type === 'move-down') {
      position--;
      minFloor = Math.min(minFloor, position);
    }
  });
  
  return { minFloor, maxFloor };
}

export function getActionDescription(action, pddlType) {
  const { type, params } = action;
  const descriptions = {
    'move-up': `🛗 ${params?.[0] || 'Elevator'} moves up`,
    'move-down': `🛗 ${params?.[0] || 'Elevator'} moves down`,
    'load': `👤 ${params?.[0] || 'Passenger'} boards`,
    'unload': `👤 ${params?.[0] || 'Passenger'} exits`
  };
  
  let desc = descriptions[type] || `${type} ${params?.join(' ') || ''}`;
  
  if (pddlType !== 'classical' && action.duration) {
    desc += ` ⏱️(${action.duration}s)`;
  }
  
  return desc;
}

export function getFloorName(position, floorLabels = [], minPosition = 0) {
  const floorIndex = position - minPosition;
  return floorLabels[floorIndex] || `Floor ${position + 1}`;
}

export function getElevatorColor(index) {
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
  return colors[index % colors.length];
}

export function getPassengerColor(index) {
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
  return colors[index % colors.length];
}

export function generateAvatar(passenger) {
  if (passenger.mobility === 'wheelchair') return '♿';
  if (passenger.vipStatus) return '👔';
  if (passenger.mobility === 'elderly') return '🧓';
  if (passenger.mobility === 'child') return '🧒';
  if (passenger.mobility === 'pregnant') return '🤰';
  return '👤';
}

export function calculateCapacityUtilization(elevator) {
  if (!elevator || elevator.maxCapacity === 0) return 0;
  return Math.round((elevator.currentWeight / elevator.maxCapacity) * 100);
}

export function getElevatorStatus(elevator, emergencyStop = false) {
  if (emergencyStop) return 'EMERGENCY';
  if (elevator.isMoving) return 'MOVING';
  if (elevator.doorsOpen) return 'DOORS OPEN';
  if (elevator.passengers?.length > 0) return 'OCCUPIED';
  return 'IDLE';
}

export function getStatusIcon(status) {
  const icons = {
    'idle': '🟢',
    'moving': '🔄',
    'doors open': '🚪',
    'occupied': '👥',
    'emergency': '🚨'
  };
  return icons[status.toLowerCase()] || '❓';
}

export function calculateActionDuration(action, pddlType) {
  if (action.duration && pddlType !== 'classical') {
    return action.duration * 1000; // Convert to milliseconds
  }
  
  const durations = {
    'move-up': 3500,
    'move-down': 3200,
    'load': 4500,
    'unload': 4000,
    'emergency-stop': 500
  };
  
  return durations[action.type] || 3000;
}

export function calculateSystemEfficiency(actions, elevators) {
  if (actions.length === 0 || elevators.length === 0) return 85;
  
  const moveActions = actions.filter(a => ['move-up', 'move-down'].includes(a.type));
  const passengerActions = actions.filter(a => ['load', 'unload'].includes(a.type));
  
  if (passengerActions.length === 0) return 70;
  
  const ratio = moveActions.length / passengerActions.length;
  return Math.max(60, 100 - Math.abs(ratio - 1.5) * 15);
}

export function calculateEnergyRating(elevators) {
  if (elevators.length === 0) return 'B';
  
  const avgEfficiency = elevators.reduce((sum, e) => sum + (e.efficiency || 85), 0) / elevators.length;
  
  if (avgEfficiency > 95) return 'A+';
  if (avgEfficiency > 90) return 'A';
  if (avgEfficiency > 85) return 'B+';
  if (avgEfficiency > 80) return 'B';
  return 'C';
}