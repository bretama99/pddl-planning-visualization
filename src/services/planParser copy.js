// services/planParser.js
export function parsePlanFile(content, pddlType) {
  console.log('=== PARSING PLAN FILE ===')
  console.log('PDDL Type:', pddlType)
  console.log('Content length:', content.length)
  console.log('Full content:\n', content)
  
  // Check if this is a domain/problem file instead of a plan
  const isDomainFile = content.includes('(define (domain') || content.includes('(define (problem')
  
  if (isDomainFile) {
    console.log('=== DETECTED DOMAIN/PROBLEM FILE - NOT A PLAN ===')
    return {
      actions: [],
      rooms: [],
      objects: [],
      robots: [],
      error: 'This appears to be a domain/problem file, not a plan. Please upload the generated plan file that contains the solution.'
    }
  }
  
  const allLines = content.split('\n')
  console.log('Total lines:', allLines.length)
  
  const lines = allLines
    .map((line, i) => {
      console.log(`Line ${i}: "${line}"`)
      return line.trim()
    })
    .filter((line, i) => {
      const keep = line.length > 0 && 
                   !line.startsWith(';') && 
                   !line.startsWith('//') && 
                   !line.startsWith('*') &&
                   !line.startsWith('#') &&
                   !line.includes('domain parsed') &&
                   !line.includes('problem parsed') &&
                   !line.includes('grounding') &&
                   !line.includes('planning time') &&
                   !line.includes('plan-length') &&
                   !line.includes('metric') &&
                   !line.includes('expanded nodes') &&
                   !line.includes('|f|') &&
                   !line.includes('g(n)=') &&
                   !line.includes('h(n)=') &&
                   !line.includes('problem solved') &&
                   !line.includes('found plan:')
      console.log(`Line ${i} keep: ${keep} - "${line}"`)
      return keep
    })
  
  console.log('Filtered lines:', lines)
  
  const actions = [];
  const rooms = new Set()
  const objects = new Set()
  const robots = new Set()
  
  // Parse plan lines in format: "0.0: (pick ball1 rooma wally)"
  lines.forEach((line, index) => {
    console.log(`\nProcessing line ${index}: "${line}"`)
    
    // Match format: "0.0: (pick ball1 rooma wally)"
    const match = line.match(/^(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)/);
    
    if (match) {
      const startTime = parseFloat(match[1])
      const actionText = match[2].trim()
      const actionParts = actionText.split(/\s+/)
      
      if (actionParts.length > 0) {
        const actionName = actionParts[0]
        const parameters = actionParts.slice(1).join(' ')
        
        console.log(`Found action: ${actionName} with params: ${parameters} at time: ${startTime}`)
        
        // Extract entities from parameters
        actionParts.forEach(part => {
          const p = part.toLowerCase()
          if (p.includes('room')) {
            rooms.add(part)
          } else if (p.includes('ball') || p.includes('box') || p.includes('package') || p.includes('item')) {
            objects.add(part)
          } else if (p.includes('wally') || p.includes('eve') || p.includes('robot')) {
            robots.add(part)
          }
        })
        
        // Create action with proper duration
        let duration = 1.0 // Default duration
        if (actionName === 'move') duration = 1.0
        else if (actionName === 'pick') duration = 1.0  
        else if (actionName === 'drop') duration = 1.0
        
        const action = {
          id: `action-${index}`,
          name: actionName,
          parameters: parameters,
          start: startTime,
          end: startTime + duration,
          duration: duration,
          type: 'temporal'
        }
        
        actions.push(action)
        console.log('Added action:', action)
      }
    } else {
      console.log('Could not parse line:', line)
    }
  })
  
  console.log('=== EXTRACTION COMPLETE ===')
  console.log('Total actions found:', actions.length)
  console.log('Rooms found:', Array.from(rooms))
  console.log('Objects found:', Array.from(objects))  
  console.log('Robots found:', Array.from(robots))
  console.log('Final actions:', actions)
  
  return {
    actions,
    rooms: Array.from(rooms),
    objects: Array.from(objects),
    robots: Array.from(robots)
  }
}

// Helper function to analyze the plan and determine initial object locations
export function analyzeInitialState(actions, rooms, objects) {
  console.log('=== ANALYZING INITIAL STATE ===')
  
  const objectLocations = new Map()
  
  // Find the first pick action for each object to determine initial location
  objects.forEach(objectId => {
    const firstPickAction = actions.find(action => 
      action.name === 'pick' && action.parameters.includes(objectId)
    )
    
    if (firstPickAction) {
      const params = firstPickAction.parameters.split(' ')
      // In "pick ball1 rooma wally", the room is the second parameter
      const roomParam = params[1] 
      const initialRoom = rooms.find(room => 
        room.toLowerCase() === roomParam.toLowerCase()
      )
      
      if (initialRoom) {
        objectLocations.set(objectId, initialRoom)
        console.log(`Object ${objectId} initially in ${initialRoom}`)
      }
    }
  })
  
  return objectLocations
}


export function extractRobotActions(actions) {
  // Filter and categorize robot-specific actions
  const robotActions = actions.filter(action => {
    const actionName = action.name.toLowerCase();
    return actionName.includes('move') || 
           actionName.includes('pickup') || 
           actionName.includes('putdown') || 
           actionName.includes('navigate') ||
           actionName.includes('grab') ||
           actionName.includes('release');
  });
  
  // Add robot-specific metadata
  return robotActions.map(action => ({
    ...action,
    category: getRobotActionCategory(action.name),
    robotId: extractRobotId(action.parameters),
    location: extractLocation(action.parameters),
    object: extractObject(action.parameters)
  }));
}

function getRobotActionCategory(actionName) {
  const name = actionName.toLowerCase();
  if (name.includes('move') || name.includes('navigate')) return 'movement';
  if (name.includes('pickup') || name.includes('grab')) return 'pickup';
  if (name.includes('putdown') || name.includes('release')) return 'putdown';
  return 'other';
}

function extractRobotId(parameters) {
  const parts = parameters.split(' ');
  const robotPart = parts.find(part => part.toLowerCase().includes('robot'));
  return robotPart || 'robot1';
}

function extractLocation(parameters) {
  const parts = parameters.split(' ');
  const locations = parts.filter(part => 
    part.toLowerCase().includes('room') || 
    part.toLowerCase().includes('location') ||
    part.toLowerCase().includes('pos')
  );
  return locations;
}

function extractObject(parameters) {
  const parts = parameters.split(' ');
  const objects = parts.filter(part => 
    part.toLowerCase().includes('box') || 
    part.toLowerCase().includes('item') ||
    part.toLowerCase().includes('object')
  );
  return objects[0] || null;
}