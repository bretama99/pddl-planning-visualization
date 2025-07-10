/**
 * LPG++ SOL Plan Parser Module
 * Parser for LPG++ solution files supporting all planning paradigms
 */

import { Plan, PlanAction, PlanProcess } from '../types/pddl';

export class SOLParser {
  /**
   * Parse LPG++ .SOL file
   */
  static parsePlan(solText: string): Plan {
    const lines = solText.split('\n').filter(line => line.trim().length > 0);
    const plan: Plan = {
      type: 'classical',
      actions: [],
      processes: [],
      totalDuration: 0,
      makespan: 0,
      cost: 0
    };

    // Detect plan type from header comments or content
    plan.type = this.detectPlanType(solText);

    let actionIdCounter = 0;
    let processIdCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip comments and empty lines
      if (line.startsWith(';') || line.startsWith('#') || line.length === 0) {
        // Extract metadata from comments
        this.extractMetadata(line, plan);
        continue;
      }

      // Parse different line formats based on plan type
      if (plan.type === 'classical') {
        const action = this.parseClassicalAction(line, actionIdCounter++);
        if (action) {
          plan.actions.push(action);
        }
      } else if (plan.type === 'temporal') {
        const action = this.parseTemporalAction(line, actionIdCounter++);
        if (action) {
          plan.actions.push(action);
        }
      } else if (plan.type === 'numerical') {
        const action = this.parseNumericalAction(line, actionIdCounter++);
        if (action) {
          plan.actions.push(action);
        }
      } else if (plan.type === 'pddl+') {
        const result = this.parsePDDLPlusLine(line, actionIdCounter, processIdCounter);
        if (result.action) {
          plan.actions.push(result.action);
          actionIdCounter++;
        }
        if (result.process) {
          plan.processes!.push(result.process);
          processIdCounter++;
        }
      }
    }

    // Calculate plan metrics
    this.calculatePlanMetrics(plan);

    // Sort actions by start time
    plan.actions.sort((a, b) => a.startTime - b.startTime);

    return plan;
  }

  private static detectPlanType(solText: string): Plan['type'] {
    const text = solText.toLowerCase();

    if (text.includes('process') || text.includes('event') || text.includes('pddl+')) {
      return 'pddl+';
    }

    if (text.includes('increase') || text.includes('decrease') || text.includes('metric')) {
      return 'numerical';
    }

    if (text.includes('[') && text.includes(']') && text.includes(':')) {
      return 'temporal';
    }

    return 'classical';
  }

  private static extractMetadata(line: string, plan: Plan): void {
    const lowerLine = line.toLowerCase();

    // Extract cost information
    if (lowerLine.includes('cost:') || lowerLine.includes('total cost:')) {
      const costMatch = line.match(/cost:\s*([\d.]+)/i);
      if (costMatch) {
        plan.cost = parseFloat(costMatch[1]);
      }
    }

    // Extract makespan information
    if (lowerLine.includes('makespan:') || lowerLine.includes('total time:')) {
      const makespanMatch = line.match(/makespan:\s*([\d.]+)/i);
      if (makespanMatch) {
        plan.makespan = parseFloat(makespanMatch[1]);
      }
    }

    // Extract plan length
    if (lowerLine.includes('plan length:') || lowerLine.includes('actions:')) {
      const lengthMatch = line.match(/(?:plan length|actions):\s*(\d+)/i);
      if (lengthMatch) {
        // This will be validated against actual parsed actions
      }
    }
  }

  private static parseClassicalAction(line: string, actionId: number): PlanAction | null {
    // Classical format: "(action-name arg1 arg2 arg3)"
    const match = line.match(/^\s*\(\s*([^)]+)\s*\)\s*$/);
    if (!match) return null;

    const parts = match[1].split(/\s+/);
    if (parts.length === 0) return null;

    return {
      id: `action_${actionId}`,
      name: parts[0],
      args: parts.slice(1),
      startTime: actionId, // Sequential ordering for classical plans
      duration: 1, // Default duration
      endTime: actionId + 1,
      status: 'pending'
    };
  }

  private static parseTemporalAction(line: string, actionId: number): PlanAction | null {
    // Temporal format: "[start_time] (action-name arg1 arg2) [duration]"
    // Alternative: "start_time: (action-name arg1 arg2) [duration]"
    
    let match = line.match(/^\s*\[\s*([\d.]+)\s*\]\s*\(\s*([^)]+)\s*\)\s*\[\s*([\d.]+)\s*\]\s*$/);
    
    if (!match) {
      // Try alternative format: "start_time: (action) [duration]"
      match = line.match(/^\s*([\d.]+)\s*:\s*\(\s*([^)]+)\s*\)\s*\[\s*([\d.]+)\s*\]\s*$/);
    }

    if (!match) {
      // Try simple format: "start_time (action) duration"
      match = line.match(/^\s*([\d.]+)\s+\(\s*([^)]+)\s*\)\s+([\d.]+)\s*$/);
    }

    if (!match) return null;

    const startTime = parseFloat(match[1]);
    const actionParts = match[2].split(/\s+/);
    const duration = parseFloat(match[3]);

    return {
      id: `action_${actionId}`,
      name: actionParts[0],
      args: actionParts.slice(1),
      startTime,
      duration,
      endTime: startTime + duration,
      status: 'pending'
    };
  }

  private static parseNumericalAction(line: string, actionId: number): PlanAction | null {
    // Numerical format can include metric costs and numeric effects
    // "[start_time] (action-name arg1 arg2) [duration] [cost: value]"
    
    const baseAction = this.parseTemporalAction(line, actionId);
    if (!baseAction) return null;

    // Extract numeric effects from the line
    const numericEffects: any[] = [];
    
    // Look for increase/decrease patterns
    const increaseMatch = line.match(/increase\s+\(([^)]+)\)\s+([\d.]+)/g);
    if (increaseMatch) {
      increaseMatch.forEach(match => {
        const parts = match.match(/increase\s+\(([^)]+)\)\s+([\d.]+)/);
        if (parts) {
          numericEffects.push({
            function: parts[1],
            change: parseFloat(parts[2])
          });
        }
      });
    }

    const decreaseMatch = line.match(/decrease\s+\(([^)]+)\)\s+([\d.]+)/g);
    if (decreaseMatch) {
      decreaseMatch.forEach(match => {
        const parts = match.match(/decrease\s+\(([^)]+)\)\s+([\d.]+)/);
        if (parts) {
          numericEffects.push({
            function: parts[1],
            change: -parseFloat(parts[2])
          });
        }
      });
    }

    if (numericEffects.length > 0) {
      baseAction.numericEffects = numericEffects;
    }

    return baseAction;
  }

  private static parsePDDLPlusLine(line: string, actionId: number, processId: number): {
    action?: PlanAction;
    process?: PlanProcess;
  } {
    // PDDL+ can have actions, processes, and events
    
    if (line.includes('process')) {
      return { process: this.parsePDDLPlusProcess(line, processId) };
    }

    if (line.includes('event')) {
      // Events are treated as instantaneous actions
      const action = this.parseTemporalAction(line.replace('event', ''), actionId);
      if (action) {
        action.duration = 0; // Events are instantaneous
        action.endTime = action.startTime;
      }
      return { action };
    }

    // Regular action
    const action = this.parseNumericalAction(line, actionId);
    return { action };
  }

  private static parsePDDLPlusProcess(line: string, processId: number): PlanProcess | null {
    // Process format: "[start_time] process(name arg1 arg2) [end_time]"
    const match = line.match(/^\s*\[\s*([\d.]+)\s*\]\s*process\s*\(\s*([^)]+)\s*\)\s*(?:\[\s*([\d.]+)\s*\])?\s*$/);
    if (!match) return null;

    const startTime = parseFloat(match[1]);
    const processParts = match[2].split(/\s+/);
    const endTime = match[3] ? parseFloat(match[3]) : undefined;

    return {
      id: `process_${processId}`,
      name: processParts[0],
      args: processParts.slice(1),
      startTime,
      endTime,
      effects: [], // Will be populated from domain information
      isActive: false
    };
  }

  private static calculatePlanMetrics(plan: Plan): void {
    if (plan.actions.length === 0) {
      plan.totalDuration = 0;
      plan.makespan = 0;
      return;
    }

    // Calculate total duration and makespan
    const lastAction = plan.actions.reduce((latest, action) => 
      action.endTime > latest.endTime ? action : latest
    );

    plan.totalDuration = lastAction.endTime;
    
    if (plan.makespan === 0) {
      plan.makespan = plan.totalDuration;
    }

    // Calculate total cost if not already set
    if (plan.cost === 0 && plan.type === 'numerical') {
      plan.cost = plan.actions.reduce((total, action) => {
        const actionCost = action.numericEffects?.reduce((sum, effect) => {
          if (effect.function.includes('cost') || effect.function.includes('fuel')) {
            return sum + Math.abs(effect.change);
          }
          return sum;
        }, 0) || 0;
        return total + actionCost;
      }, 0);
    }
  }

  /**
   * Validate parsed plan for consistency
   */
  static validatePlan(plan: Plan): string[] {
    const errors: string[] = [];

    // Check for overlapping actions (if not temporal planning)
    if (plan.type !== 'temporal' && plan.type !== 'pddl+') {
      for (let i = 0; i < plan.actions.length - 1; i++) {
        const current = plan.actions[i];
        const next = plan.actions[i + 1];
        
        if (current.endTime > next.startTime) {
          errors.push(`Action overlap detected: ${current.name} ends at ${current.endTime} but ${next.name} starts at ${next.startTime}`);
        }
      }
    }

    // Check for negative durations
    plan.actions.forEach(action => {
      if (action.duration < 0) {
        errors.push(`Negative duration for action ${action.name}: ${action.duration}`);
      }
      
      if (action.startTime < 0) {
        errors.push(`Negative start time for action ${action.name}: ${action.startTime}`);
      }
    });

    // Check process validity for PDDL+
    if (plan.type === 'pddl+' && plan.processes) {
      plan.processes.forEach(process => {
        if (process.endTime && process.endTime <= process.startTime) {
          errors.push(`Invalid process duration for ${process.name}: starts at ${process.startTime}, ends at ${process.endTime}`);
        }
      });
    }

    // Check plan consistency
    if (plan.totalDuration <= 0 && plan.actions.length > 0) {
      errors.push('Plan has actions but zero total duration');
    }

    return errors;
  }

  /**
   * Generate plan statistics
   */
  static generatePlanStats(plan: Plan): Record<string, any> {
    const stats: Record<string, any> = {
      actionCount: plan.actions.length,
      totalDuration: plan.totalDuration,
      makespan: plan.makespan,
      planType: plan.type,
      cost: plan.cost || 0
    };

    // Action type distribution
    const actionTypes: Record<string, number> = {};
    plan.actions.forEach(action => {
      actionTypes[action.name] = (actionTypes[action.name] || 0) + 1;
    });
    stats.actionTypes = actionTypes;

    // Parallelism statistics for temporal plans
    if (plan.type === 'temporal' || plan.type === 'pddl+') {
      const timePoints = new Set<number>();
      plan.actions.forEach(action => {
        timePoints.add(action.startTime);
        timePoints.add(action.endTime);
      });

      let maxParallelism = 0;
      Array.from(timePoints).sort((a, b) => a - b).forEach(time => {
        const activeActions = plan.actions.filter(action => 
          action.startTime <= time && action.endTime > time
        ).length;
        maxParallelism = Math.max(maxParallelism, activeActions);
      });

      stats.maxParallelism = maxParallelism;
    }

    // Process statistics for PDDL+
    if (plan.type === 'pddl+' && plan.processes) {
      stats.processCount = plan.processes.length;
      stats.processTypes = {};
      plan.processes.forEach(process => {
        stats.processTypes[process.name] = (stats.processTypes[process.name] || 0) + 1;
      });
    }

    return stats;
  }
}
