/**
 * Universal Planner Output Parser
 * Supports multiple planning output formats: Classical, Temporal, Numerical, PDDL+
 */

import { Plan, PlanAction, PlanProcess } from '../types/pddl';

export interface PlannerMetrics {
  planLength?: number;
  searchTime?: number;
  planningTime?: number;
  heuristicTime?: number;
  expandedNodes?: number;
  statesEvaluated?: number;
  deadEnds?: number;
  duplicates?: number;
  grounding?: {
    facts: number;
    variables: number;
    actions: number;
    processes: number;
    events: number;
    time: number;
  };
  search?: {
    nodes: Array<{ g: number; h: number; f?: number }>;
  };
}

export enum PlannerType {
  CLASSICAL = 'classical',
  TEMPORAL = 'temporal', 
  NUMERICAL = 'numerical',
  METRIC_TEMPORAL = 'metric_temporal',
  PDDL_PLUS = 'pddl+',
  UNKNOWN = 'unknown'
}

export enum PDDLDomainType {
  CLASSICAL = 'Classical',
  NUMERIC = 'Temporal (Metric) PDDL',
  TEMPORAL = 'Temporal PDDL (PDDL 2.1)',
  METRIC_TEMPORAL = 'Metric Temporal PDDL',
  PDDL_PLUS = 'PDDL+',
  UNKNOWN = 'Unknown'
}

export class PlannerOutputParser {
  /**
   * Parse planner output and extract plan with metadata
   */
  static parsePlannerOutput(output: string): { plan: Plan; metrics: PlannerMetrics; plannerType: PlannerType } {
    const lines = output.trim().split('\n').map(line => line.trim());
    
    // Detect planner type
    const plannerType = this.detectPlannerType(output);
    
    // Extract plan actions
    const actions = this.extractActions(lines, plannerType);
    const processes = this.extractProcesses(lines, plannerType);
    
    // Extract metrics
    const metrics = this.extractMetrics(lines, plannerType);
    
    // Calculate plan duration
    const totalDuration = actions.length > 0 
      ? Math.max(...actions.map(a => a.startTime + a.duration))
      : 0;
    
    const plan: Plan = {
      type: plannerType as any,
      actions,
      processes: processes || [],
      totalDuration,
      makespan: totalDuration,
      planCost: metrics.planLength || actions.length,
      quality: this.calculateQuality(actions, metrics)
    };
    
    return { plan, metrics, plannerType };
  }
  
  /**
   * Detect planner type from output format
   */
  private static detectPlannerType(output: string): PlannerType {
    const lines = output.split('\n').map(line => line.trim());
    const lowerOutput = output.toLowerCase();
    
    console.log('Detecting plan type from output:', output.substring(0, 200) + '...');
    
    // PDDL+ indicators - look for process/event definitions or continuous actions
    if (lowerOutput.includes('process') || lowerOutput.includes('event') || 
        lowerOutput.includes('continuous') || lowerOutput.includes('rate') ||
        lowerOutput.includes('startprocess') || lowerOutput.includes('stopprocess') ||
        lowerOutput.includes('concurrent')) {
      console.log('Detected PDDL+ plan');
      return PlannerType.PDDL_PLUS;
    }
    
    // Numerical indicators - look for numerical functions and operations
    if (lowerOutput.includes('numeric') || lowerOutput.includes('increase') ||
        lowerOutput.includes('decrease') || lowerOutput.includes('assign') ||
        lowerOutput.includes('scale-up') || lowerOutput.includes('scale-down') ||
        /\+\d+|\-\d+/.test(output)) { // Numerical operations like +5, -3
      console.log('Detected numerical plan');
      return PlannerType.NUMERICAL;
    }
    
    // Temporal indicators - look for explicit duration syntax, not just timestamps
    // Check for durative actions with explicit durations
    const hasDurativeActions = lines.some(line => {
      // Look for durative action syntax: [duration] action_name or action_name [duration]
      return /\[\d+\.?\d*\]\s*\w+|\w+.*\[\d+\.?\d*\]/.test(line) ||
             line.includes('durative') ||
             line.includes('over all') ||
             line.includes('at start') ||
             line.includes('at end');
    });
    
    if (lowerOutput.includes('temporal') || lowerOutput.includes('durative') || hasDurativeActions) {
      console.log('Detected temporal plan');
      return PlannerType.TEMPORAL;
    }
    
    // Check if it's just a classical plan with timestamps (like "0.0000: action")
    const hasSimpleTimestamps = lines.some(line => 
      /^\d+\.?\d*:\s*\(\s*\w+/.test(line.trim()) // Pattern: "0.0000: (action ...)"
    );
    
    console.log('Detected classical plan' + (hasSimpleTimestamps ? ' with timestamps' : ''));
    return PlannerType.CLASSICAL;
  }
  
  /**
   * Extract plan actions from different formats
   */
  private static extractActions(lines: string[], plannerType: PlannerType): PlanAction[] {
    const actions: PlanAction[] = [];
    let actionId = 0;
    let foundPlanSection = false;
    
    console.log(`Extracting actions from ${lines.length} lines, planner type: ${plannerType}`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Look for "found plan:" marker in online PDDL editor output
      if (trimmedLine.toLowerCase().includes('found plan:')) {
        foundPlanSection = true;
        console.log('Found plan section marker at line', i);
        continue;
      }
      
      // Skip lines before plan section if we found the marker
      if (!foundPlanSection && lines.some(l => l.toLowerCase().includes('found plan:'))) {
        continue;
      }
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith(';') || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Stop parsing when we hit metrics/statistics after actions
      if (foundPlanSection && (
          trimmedLine.toLowerCase().includes('plan-length:') ||
          trimmedLine.toLowerCase().includes('metric') ||
          trimmedLine.toLowerCase().includes('planning time') ||
          trimmedLine.toLowerCase().includes('search time') ||
          trimmedLine.toLowerCase().includes('expanded nodes'))) {
        console.log('Reached end of plan section at line', i);
        break;
      }
      
      console.log(`Processing line ${i}: "${trimmedLine}"`);
      console.log(`Is action line: ${this.isActionLine(line)}`);
      
      const action = this.parseActionLine(line, actionId, plannerType);
      if (action) {
        console.log(`Successfully parsed action ${actionId}:`, action);
        actions.push(action);
        actionId++;
      } else if (trimmedLine) {
        console.log(`Failed to parse action from line: "${trimmedLine}"`);
      }
    }
    
    console.log(`Total actions extracted: ${actions.length}`);
    return actions;
  }
  
  /**
   * Parse individual action line based on planner type
   */
  private static parseActionLine(line: string, actionId: number, plannerType: PlannerType): PlanAction | null {
    // Skip non-action lines
    if (!this.isActionLine(line)) return null;
    
    switch (plannerType) {
      case PlannerType.CLASSICAL:
        return this.parseClassicalAction(line, actionId);
      case PlannerType.TEMPORAL:
        return this.parseTemporalAction(line, actionId);
      case PlannerType.NUMERICAL:
        return this.parseNumericalAction(line, actionId);
      case PlannerType.PDDL_PLUS:
        return this.parsePDDLPlusAction(line, actionId);
      default:
        return this.parseGenericAction(line, actionId);
    }
  }
  
  /**
   * Check if line contains an action
   */
  private static isActionLine(line: string): boolean {
    const trimmed = line.trim();
    
    // Skip empty lines, comments, and common non-action lines
    if (!trimmed || 
        trimmed.startsWith(';') || 
        trimmed.startsWith('#') ||
        trimmed.startsWith('Plan:') ||
        trimmed.startsWith('Total time:') ||
        trimmed.startsWith('Solution found')) {
      return false;
    }
    
    // Skip LPG metadata lines specifically
    if (trimmed.toLowerCase().includes('version') ||
        trimmed.toLowerCase().includes('seed') ||
        trimmed.toLowerCase().includes('command line') ||
        trimmed.toLowerCase().includes('problem') ||
        trimmed.toLowerCase().includes('search time') ||
        trimmed.toLowerCase().includes('parsing time') ||
        trimmed.toLowerCase().includes('mutex time') ||
        trimmed.toLowerCase().includes('metricvalue')) {
      return false;
    }
    
    // LPG temporal format: "0.0003: (PICK BALL1 ROOMA WALLY) [0.0000]"
    if (/^\s*\d+(?:\.\d+)?\s*:\s*\([^)]+\)\s*\[[\d\.]+\]/.test(trimmed)) {
      return true;
    }
    
    // Online PDDL editor format: "0.0: (pick ball1 rooma wally)"
    if (/^\s*\d+(?:\.\d+)?\s*:\s*\([^)]+\)/.test(trimmed)) {
      return true;
    }
    
    // Enhanced action patterns - more comprehensive matching
    return /^\s*\d+[\.\:]?\s*\(/.test(line) || // "0: (action ...)" or "0.0: (action ...)"
           /^\s*\(/.test(line) || // "(action ...)"
           /^\s*\d+[\.\:]?\s*[a-zA-Z]/.test(line) || // "0: action ..." or "0.0: action ..."
           /^\s*[a-zA-Z][a-zA-Z0-9_-]*\s*\(/.test(line) || // "action(args)"
           /^\s*[a-zA-Z][a-zA-Z0-9_-]*\s+[a-zA-Z]/.test(line) || // "action arg1 arg2"
           /\[[\d\.]+,[\d\.]+\]/.test(line) || // Temporal format "[0.0,1.0]: action"
           /at\s+[\d\.]+:/.test(line); // "at 0.0: action"
  }
  
  /**
   * Parse classical planning action
   */
  private static parseClassicalAction(line: string, actionId: number): PlanAction | null {
    const trimmed = line.trim();
    let name = '';
    let args: string[] = [];
    
    // Format 1: "(action arg1 arg2)" or "0: (action arg1 arg2)"
    const parenMatch = trimmed.match(/(?:\d+[\.\:]?\s*)?\(([^)]+)\)/);
    if (parenMatch) {
      const parts = parenMatch[1].trim().split(/\s+/);
      name = parts[0];
      args = parts.slice(1);
    }
    // Format 2: "0: action arg1 arg2" or "action arg1 arg2"
    else {
      const spaceMatch = trimmed.match(/(?:\d+[\.\:]?\s*)?([a-zA-Z][a-zA-Z0-9_-]*)\s*(.*)/);
      if (spaceMatch) {
        name = spaceMatch[1];
        args = spaceMatch[2] ? spaceMatch[2].trim().split(/\s+/).filter(arg => arg) : [];
      }
    }
    
    if (!name) return null;
    
    return {
      id: actionId.toString(),
      name,
      args,
      startTime: actionId, // Sequential timing for classical
      duration: 1,
      endTime: actionId + 1,
      cost: 1,
      preconditions: [],
      effects: [],
      numericEffects: []
    };
  }
  
  /**
   * Parse temporal planning action
   */
  private static parseTemporalAction(line: string, actionId: number): PlanAction | null {
    const trimmed = line.trim();
    
    // Format 1: "0.0003: (PICK BALL1 ROOMA WALLY) [0.0000]" - LPG format
    const temporalMatch1 = trimmed.match(/(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)\s*\[(\d+(?:\.\d+)?)\]/);
    if (temporalMatch1) {
      const startTime = parseFloat(temporalMatch1[1]);
      const actionPart = temporalMatch1[2].trim();
      const parts = actionPart.split(/\s+/);
      const name = parts[0].toLowerCase(); // LPG uses uppercase, normalize to lowercase
      const args = parts.slice(1).map(arg => arg.toLowerCase()); // normalize args too
      const duration = parseFloat(temporalMatch1[3]);
      
      console.log(`Parsed LPG action: ${name} with args [${args.join(', ')}] at time ${startTime} duration ${duration}`);
      
      return {
        id: actionId.toString(),
        name,
        args,
        startTime,
        duration: duration || 0.1, // Use small duration if 0
        endTime: startTime + (duration || 0.1),
        cost: 1,
        preconditions: [],
        effects: [],
        numericEffects: []
      };
    }
    
    // Format 2: "[0.0,1.0]: action arg1 arg2"
    const temporalMatch2 = trimmed.match(/\[(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\]\s*:\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*(.*)/);
    if (temporalMatch2) {
      const startTime = parseFloat(temporalMatch2[1]);
      const endTime = parseFloat(temporalMatch2[2]);
      const name = temporalMatch2[3];
      const args = temporalMatch2[4] ? temporalMatch2[4].trim().split(/\s+/).filter(arg => arg) : [];
      
      return {
        id: actionId.toString(),
        name,
        args,
        startTime,
        duration: endTime - startTime,
        endTime,
        cost: 1,
        preconditions: [],
        effects: [],
        numericEffects: []
      };
    }
    
    // Format 3: "at 0.0: action arg1 arg2"
    const temporalMatch3 = trimmed.match(/at\s+(\d+(?:\.\d+)?)\s*:\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*(.*)/);
    if (temporalMatch3) {
      const startTime = parseFloat(temporalMatch3[1]);
      const name = temporalMatch3[2];
      const args = temporalMatch3[3] ? temporalMatch3[3].trim().split(/\s+/).filter(arg => arg) : [];
      
      return {
        id: actionId.toString(),
        name,
        args,
        startTime,
        duration: 1.0,
        endTime: startTime + 1.0,
        cost: 1,
        preconditions: [],
        effects: [],
        numericEffects: []
      };
    }
    
    // Format 4: "0.0: action arg1 arg2"
    const temporalMatch4 = trimmed.match(/(\d+(?:\.\d+)?)\s*:\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*(.*)/);
    if (temporalMatch4) {
      const startTime = parseFloat(temporalMatch4[1]);
      const name = temporalMatch4[2];
      const args = temporalMatch4[3] ? temporalMatch4[3].trim().split(/\s+/).filter(arg => arg) : [];
      
      return {
        id: actionId.toString(),
        name,
        args,
        startTime,
        duration: 1.0,
        endTime: startTime + 1.0,
        cost: 1,
        preconditions: [],
        effects: [],
        numericEffects: []
      };
    }
    
    // Format 5: "0.0: (pick ball1 rooma wally)" - Online PDDL editor format
    const temporalMatch5 = trimmed.match(/(\d+(?:\.\d+)?)\s*:\s*\(([^)]+)\)/);
    if (temporalMatch5) {
      const startTime = parseFloat(temporalMatch5[1]);
      const actionPart = temporalMatch5[2].trim();
      const parts = actionPart.split(/\s+/);
      const name = parts[0].toLowerCase(); // Normalize to lowercase
      const args = parts.slice(1).map(arg => arg.toLowerCase()); // Normalize args
      
      console.log(`Parsed online PDDL editor action: ${name} with args [${args.join(', ')}] at time ${startTime}`);
      
      return {
        id: actionId.toString(),
        name,
        args,
        startTime,
        duration: 1.0,
        endTime: startTime + 1.0,
        cost: 1,
        preconditions: [],
        effects: [],
        numericEffects: []
      };
    }
    
    // Try classical format as fallback
    return this.parseClassicalAction(line, actionId);
  }
  
  /**
   * Parse numerical planning action
   */
  private static parseNumericalAction(line: string, actionId: number): PlanAction | null {
    const action = this.parseTemporalAction(line, actionId);
    if (!action) return null;
    
    // Extract numeric effects from action name or comments
    const numericEffects = this.extractNumericEffects(line);
    
    return {
      ...action,
      numericEffects
    };
  }
  
  /**
   * Parse PDDL+ action
   */
  private static parsePDDLPlusAction(line: string, actionId: number): PlanAction | null {
    return this.parseTemporalAction(line, actionId);
  }
  
  /**
   * Parse generic action format
   */
  private static parseGenericAction(line: string, actionId: number): PlanAction | null {
    return this.parseClassicalAction(line, actionId) || this.parseTemporalAction(line, actionId);
  }
  
  /**
   * Extract processes for PDDL+
   */
  private static extractProcesses(lines: string[], plannerType: PlannerType): PlanProcess[] | undefined {
    if (plannerType !== PlannerType.PDDL_PLUS) return undefined;
    
    const processes: PlanProcess[] = [];
    // Implementation for process extraction would go here
    return processes;
  }
  
  /**
   * Extract numeric effects from action line
   */
  private static extractNumericEffects(line: string): any[] {
    const effects: any[] = [];
    
    // Look for increase/decrease/assign patterns
    const increaseMatch = line.match(/increase\s*\(([^)]+)\)\s*(\d+(?:\.\d+)?)/);
    if (increaseMatch) {
      effects.push({
        function: increaseMatch[1].trim(),
        operation: 'increase',
        value: parseFloat(increaseMatch[2])
      });
    }
    
    const decreaseMatch = line.match(/decrease\s*\(([^)]+)\)\s*(\d+(?:\.\d+)?)/);
    if (decreaseMatch) {
      effects.push({
        function: decreaseMatch[1].trim(),
        operation: 'decrease',
        value: parseFloat(decreaseMatch[2])
      });
    }
    
    return effects;
  }
  
  /**
   * Extract planning metrics from output
   */
  private static extractMetrics(lines: string[], plannerType: PlannerType): PlannerMetrics {
    const metrics: PlannerMetrics = {};
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Plan length
      const planLengthMatch = line.match(/plan-length:\s*(\d+)/i);
      if (planLengthMatch) {
        metrics.planLength = parseInt(planLengthMatch[1]);
      }
      
      // Timing information
      const planningTimeMatch = line.match(/planning time[^:]*:\s*(\d+(?:\.\d+)?)/i);
      if (planningTimeMatch) {
        metrics.planningTime = parseFloat(planningTimeMatch[1]);
      }
      
      const searchTimeMatch = line.match(/search time[^:]*:\s*(\d+(?:\.\d+)?)/i);
      if (searchTimeMatch) {
        metrics.searchTime = parseFloat(searchTimeMatch[1]);
      }
      
      const heuristicTimeMatch = line.match(/heuristic time[^:]*:\s*(\d+(?:\.\d+)?)/i);
      if (heuristicTimeMatch) {
        metrics.heuristicTime = parseFloat(heuristicTimeMatch[1]);
      }
      
      // Search statistics
      const expandedNodesMatch = line.match(/expanded nodes:\s*(\d+)/i);
      if (expandedNodesMatch) {
        metrics.expandedNodes = parseInt(expandedNodesMatch[1]);
      }
      
      const statesEvaluatedMatch = line.match(/states evaluated:\s*(\d+)/i);
      if (statesEvaluatedMatch) {
        metrics.statesEvaluated = parseInt(statesEvaluatedMatch[1]);
      }
      
      const deadEndsMatch = line.match(/dead-ends detected:\s*(\d+)/i);
      if (deadEndsMatch) {
        metrics.deadEnds = parseInt(deadEndsMatch[1]);
      }
      
      const duplicatesMatch = line.match(/duplicates detected:\s*(\d+)/i);
      if (duplicatesMatch) {
        metrics.duplicates = parseInt(duplicatesMatch[1]);
      }
      
      // Grounding information
      const groundingTimeMatch = line.match(/grounding time:\s*(\d+(?:\.\d+)?)/i);
      if (groundingTimeMatch) {
        if (!metrics.grounding) metrics.grounding = {} as any;
        metrics.grounding.time = parseFloat(groundingTimeMatch[1]);
      }
      
      // Search progress (g/h values)
      const searchNodeMatch = line.match(/g\(n\)=\s*(\d+(?:\.\d+)?)\s*h\(n\)=(\d+(?:\.\d+)?)/);
      if (searchNodeMatch) {
        if (!metrics.search) metrics.search = { nodes: [] };
        const g = parseFloat(searchNodeMatch[1]);
        const h = parseFloat(searchNodeMatch[2]);
        metrics.search.nodes.push({ g, h, f: g + h });
      }
      
      // AIBR preprocessing info
      const factsMatch = line.match(/\|f\|:(\d+)/);
      if (factsMatch) {
        if (!metrics.grounding) metrics.grounding = {} as any;
        metrics.grounding.facts = parseInt(factsMatch[1]);
      }
      
      const actionsMatch = line.match(/\|a\|:(\d+)/);
      if (actionsMatch) {
        if (!metrics.grounding) metrics.grounding = {} as any;
        metrics.grounding.actions = parseInt(actionsMatch[1]);
      }
    }
    
    return metrics;
  }
  
  /**
   * Calculate plan quality score
   */
  private static calculateQuality(actions: PlanAction[], metrics: PlannerMetrics): number {
    const lengthScore = metrics.planLength ? 100 / metrics.planLength : 50;
    const timeScore = metrics.planningTime ? Math.max(0, 100 - metrics.planningTime / 10) : 50;
    return (lengthScore + timeScore) / 2;
  }
}