/**
 * PDDL Type Definitions
 * Comprehensive type system for PDDL domain/problem representation and plan execution
 */

export interface PDDLType {
  name: string;
  parent?: string;
}

export interface PDDLObject {
  name: string;
  type: string;
  position?: { x: number; y: number; z: number };
  properties?: Record<string, any>;
}

export interface PDDLPredicate {
  name: string;
  parameters: Array<{ name: string; type: string }>;
}

export interface PDDLFact {
  predicate: string;
  args: string[];
}

export interface PDDLFunction {
  name: string;
  parameters: Array<{ name: string; type: string }>;
  returnType: string;
}

export interface PDDLNumericExpression {
  operator: string;
  operands: Array<string | number | PDDLNumericExpression>;
}

export interface PDDLAction {
  name: string;
  parameters: Array<{ name: string; type: string }>;
  preconditions: PDDLFact[];
  effects: PDDLFact[];
  numericEffects?: Array<{
    function: string;
    operation: 'increase' | 'decrease' | 'assign';
    value: number | PDDLNumericExpression;
  }>;
  duration?: number | PDDLNumericExpression;
}

export interface PDDLProcess {
  name: string;
  parameters: Array<{ name: string; type: string }>;
  preconditions: PDDLFact[];
  effects: Array<{
    function: string;
    rate: PDDLNumericExpression | number;
  }>;
}

export interface PDDLEvent {
  name: string;
  parameters: Array<{ name: string; type: string }>;
  preconditions: PDDLFact[];
  effects: PDDLFact[];
}

export interface PDDLDomain {
  name: string;
  requirements: string[];
  types: PDDLType[];
  predicates: PDDLPredicate[];
  functions: PDDLFunction[];
  actions: PDDLAction[];
  processes?: PDDLProcess[];
  events?: PDDLEvent[];
}

export interface PDDLProblem {
  name: string;
  domain: string;
  objects: PDDLObject[];
  init: PDDLFact[];
  goal: PDDLFact[];
  numericInit?: Array<{
    function: string;
    value: number;
  }>;
  metric?: {
    optimization: 'minimize' | 'maximize';
    expression: PDDLNumericExpression;
  };
}

export interface PlanAction {
  id: string | number;
  name: string;
  args: string[];
  startTime: number;
  duration: number;
  endTime: number;
  cost?: number;
  preconditions?: any[];
  effects?: any[];
  numericEffects?: Array<{
    function: string;
    change: number;
  }>;
  status?: 'pending' | 'active' | 'completed' | 'failed';
}

export interface PlanProcess {
  id: string;
  name: string;
  args: string[];
  startTime: number;
  endTime?: number;
  effects: Array<{
    function: string;
    rate: number;
  }>;
  isActive: boolean;
}

export interface Plan {
  type: 'classical' | 'temporal' | 'numerical' | 'pddl+';
  actions: PlanAction[];
  processes?: PlanProcess[];
  totalDuration: number;
  makespan: number;
  cost?: number;
  planCost?: number;
  quality?: number;
}

export interface NumericFluent {
  name: string;
  value: number;
  initialValue?: number; // Store initial value for reference
  minValue?: number;
  maxValue?: number;
  unit?: string;
  objectId?: string; // Which object this fluent belongs to
  type?: 'battery' | 'fuel' | 'capacity' | 'time' | 'distance' | 'other';
}

export interface WorldState {
  facts: PDDLFact[];
  numericFluents: Record<string, NumericFluent>;
  time: number;
}

export interface AnimationEvent {
  id: string;
  type: 'move' | 'pick' | 'drop' | 'numeric' | 'process' | 'custom' | 
        'load-truck' | 'unload-truck' | 'drive-truck' | 
        'load-airplane' | 'unload-airplane' | 'fly-airplane' |
        'startmove' | 'reprisemovement' | 'startcharge' | 'stopcharge' |
        'drive' | 'fly';
  objectId: string;
  startTime: number;
  duration: number;
  data: Record<string, any>;
  completed: boolean;
}

export interface SceneObject {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  meshId?: string;
  parentId?: string;
  properties: Record<string, any>;
}

export interface RoomLayout {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  connections: string[];
}

export interface ParsedFiles {
  domain: PDDLDomain | null;
  problem: PDDLProblem | null;
  plan: Plan | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  totalDuration: number;
  currentAction: PlanAction | null;
  nextAction: PlanAction | null;
}

export interface VisualizationConfig {
  showLabels: boolean;
  showConnections: boolean;
  showNumericFluents: boolean;
  showProcesses: boolean;
  cameraMode: 'perspective' | 'orthographic' | 'top';
  renderMode: 'realistic' | 'wireframe' | 'points';
  domain: 'robot' | 'logistics';
}
