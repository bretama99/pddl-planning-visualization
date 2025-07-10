/**
 * Plan Store - Central state management for PDDL visualization
 * Using Zustand for lightweight state management
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  PDDLDomain,
  PDDLProblem,
  Plan,
  ParsedFiles,
  PlaybackState,
  VisualizationConfig,
  WorldState,
  AnimationEvent,
  SceneObject,
  NumericFluent,
  PlanAction
} from '../types/pddl';
import { PDDLDomainType } from '../parsers/plannerOutputParser';

interface PlanStoreState {
  // File and parsing state
  files: ParsedFiles;
  isLoading: boolean;
  loadingStatus: string;
  parseErrors: string[];

  // Scene and objects
  sceneObjects: SceneObject[];
  roomLayout: any[];
  
  // Animation and playback
  playbackState: PlaybackState;
  animationEvents: AnimationEvent[];
  worldState: WorldState;
  
  // Visualization configuration
  config: VisualizationConfig;
  
  // UI state
  selectedAction: PlanAction | null;
  numericFluents: Record<string, NumericFluent>;
  
  // Planning metrics and type
  planningMetrics?: any;
  plannerType?: string;
  
  // Domain classification
  domainType?: PDDLDomainType;
  domainClassification?: {
    type: PDDLDomainType;
    confidence: number;
    indicators: string[];
    requirements: string[];
  };
  
  // Actions
  setFiles: (files: Partial<ParsedFiles>) => void;
  setLoading: (loading: boolean, status?: string) => void;
  setParseErrors: (errors: string[]) => void;
  updatePlaybackState: (state: Partial<PlaybackState>) => void;
  updateWorldState: (state: Partial<WorldState>) => void;
  setSceneObjects: (objects: SceneObject[]) => void;
  updateNumericFluent: (name: string, fluent: Partial<NumericFluent>) => void;
  setSelectedAction: (action: PlanAction | null) => void;
  updateVisualizationConfig: (config: Partial<VisualizationConfig>) => void;
  
  // Complex actions
  parseDomainFile: (content: string) => Promise<void>;
  parseProblemFile: (content: string) => Promise<void>;
  parsePlanFile: (content: string) => Promise<void>;
  generateScene: () => Promise<void>;
  playPlan: () => void;
  pausePlan: () => void;
  seekToTime: (time: number) => void;
  resetPlan: () => void;
  initializeNumericFluents: (problemData: PDDLProblem) => void;
  updateNumericFluentsFromAction: (action: PlanAction) => void;
}

export const usePlanStore = create<PlanStoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    files: {
      domain: null,
      problem: null,
      plan: null
    },
    isLoading: false,
    loadingStatus: '',
    parseErrors: [],
    
    sceneObjects: [],
    roomLayout: [],
    
    playbackState: {
      isPlaying: false,
      currentTime: 0,
      speed: 1.0,
      totalDuration: 0,
      currentAction: null,
      nextAction: null
    },
    
    animationEvents: [],
    worldState: {
      facts: [],
      numericFluents: {},
      time: 0
    },
    
    config: {
      showLabels: true,
      showConnections: true,
      showNumericFluents: true,
      showProcesses: true,
      cameraMode: 'perspective',
      renderMode: 'realistic',
      domain: 'robot' as 'robot' | 'logistics'
    },
    
    selectedAction: null,
    numericFluents: {},
    
    // Basic setters
    setFiles: (files) => set((state) => ({
      files: { ...state.files, ...files }
    })),
    
    setLoading: (loading, status = '') => set({
      isLoading: loading,
      loadingStatus: status
    }),
    
    setParseErrors: (errors) => set({ parseErrors: errors }),
    
    updatePlaybackState: (newState) => set((state) => ({
      playbackState: { ...state.playbackState, ...newState }
    })),
    
    updateWorldState: (newState) => set((state) => ({
      worldState: { ...state.worldState, ...newState }
    })),
    
    setSceneObjects: (objects) => set({ sceneObjects: objects }),
    
    updateNumericFluent: (name, fluent) => set((state) => ({
      numericFluents: {
        ...state.numericFluents,
        [name]: { ...state.numericFluents[name], ...fluent }
      }
    })),
    
    setSelectedAction: (action) => set({ selectedAction: action }),
    
    updateVisualizationConfig: (config) => set((state) => ({
      config: { ...state.config, ...config }
    })),
    
    // Complex actions
    parseDomainFile: async (content: string) => {
      const { setLoading, setParseErrors, setFiles } = get();
      
      try {
        setLoading(true, 'Parsing PDDL domain file...');
        
        // Import parser dynamically to avoid circular dependencies
        const { PDDLParser } = await import('../parsers/pddlParser');
        const domain = PDDLParser.parseDomain(content);
        
        // Classify domain type
        const domainClassification = PDDLParser.getDomainClassificationSummary(domain);
        const domainType = domainClassification.type;
        
        console.log('Domain Classification:', domainClassification);
        
        setFiles({ domain });
        setParseErrors([]);
        
        // Update domain classification in store
        set({ domainType, domainClassification });
        
        // If problem is also loaded, validate compatibility
        const { files } = get();
        if (files.problem) {
          const errors = PDDLParser.validateDomainProblem(domain, files.problem);
          if (errors.length > 0) {
            setParseErrors(errors);
          }
        }
        
      } catch (error) {
        console.error('Error parsing domain file:', error);
        setParseErrors([`Failed to parse domain file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      } finally {
        setLoading(false);
      }
    },
    
    parseProblemFile: async (content: string) => {
      const { setLoading, setParseErrors, setFiles } = get();
      
      try {
        setLoading(true, 'Parsing PDDL problem file...');
        
        const { PDDLParser } = await import('../parsers/pddlParser');
        const problem = PDDLParser.parseProblem(content);
        
        setFiles({ problem });
        setParseErrors([]);
        
        // Initialize numeric fluents from problem data
        get().initializeNumericFluents(problem);
        
        // If domain is also loaded, validate compatibility
        const { files } = get();
        if (files.domain) {
          const errors = PDDLParser.validateDomainProblem(files.domain, problem);
          if (errors.length > 0) {
            setParseErrors(errors);
          }
        }
        
      } catch (error) {
        console.error('Error parsing problem file:', error);
        setParseErrors([`Failed to parse problem file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      } finally {
        setLoading(false);
      }
    },
    
    parsePlanFile: async (content: string) => {
      const { setLoading, setParseErrors, setFiles, updatePlaybackState } = get();
      
      try {
        setLoading(true, 'Parsing plan file...');
        
        // Try universal planner output parser first
        let plan, metrics, plannerType;
        
        try {
          console.log('Plan file content preview:', content.substring(0, 300));
          console.log('Plan file lines (first 10):', content.split('\n').slice(0, 10));
          
          const { PlannerOutputParser } = await import('../parsers/plannerOutputParser');
          const result = PlannerOutputParser.parsePlannerOutput(content);
          plan = result.plan;
          metrics = result.metrics;
          plannerType = result.plannerType;
          
          console.log(`Detected ${plannerType} planning output`);
          console.log('Planning metrics:', metrics);
          console.log('Parsed actions count:', plan.actions.length);
          
        } catch (universalError) {
          // Fallback to SOL parser for LPG++ files
          console.log('Falling back to SOL parser');
          const { SOLParser } = await import('../parsers/solParser');
          plan = SOLParser.parsePlan(content);
          metrics = {};
          plannerType = 'classical';
        }
        
        // Validate plan
        if (plan.actions.length === 0) {
          setParseErrors(['No valid actions found in plan file']);
        } else {
          setParseErrors([]);
        }
        
        setFiles({ plan });
        
        // Store planning metrics
        set({ planningMetrics: metrics, plannerType });
        
        // Update playback state
        updatePlaybackState({
          totalDuration: plan.totalDuration,
          currentTime: 0,
          currentAction: plan.actions.length > 0 ? plan.actions[0] : null,
          nextAction: plan.actions.length > 1 ? plan.actions[1] : null
        });
        
        // Initialize numeric fluents from plan (only for non-Classical domains)
        const { domainClassification, files } = get();
        let shouldInitializeFluents = true;
        
        // Check domain classification - if available and Classical, don't initialize fluents
        if (domainClassification?.type === PDDLDomainType.CLASSICAL) {
          shouldInitializeFluents = false;
        } else if (files.domain) {
          // If domain is loaded but not classified yet, classify it
          try {
            const { PDDLParser } = await import('../parsers/pddlParser');
            const classification = PDDLParser.getDomainClassificationSummary(files.domain);
            if (classification.type === PDDLDomainType.CLASSICAL) {
              shouldInitializeFluents = false;
            }
          } catch (error) {
            console.warn('Could not classify domain for fluent initialization:', error);
          }
        }
        
        if (shouldInitializeFluents) {
          const fluents: Record<string, NumericFluent> = {};
          
          // Initialize fluents from plan actions with numeric effects
          plan.actions.forEach(action => {
            action.numericEffects?.forEach(effect => {
              if (!fluents[effect.function]) {
                const fluentType = effect.function.toLowerCase().includes('battery') ? 'battery' : 'other';
                fluents[effect.function] = {
                  name: effect.function,
                  value: fluentType === 'battery' ? 100 : 0, // Default battery at 100%, others at 0
                  initialValue: fluentType === 'battery' ? 100 : 0,
                  type: fluentType,
                  minValue: fluentType === 'battery' ? 0 : undefined,
                  maxValue: fluentType === 'battery' ? 100 : undefined,
                  unit: fluentType === 'battery' ? '%' : undefined
                };
              }
            });
          });
          
          // Auto-detect robots from plan actions and create battery fluents for non-Classical domains
          const robotsInPlan = new Set<string>();
          plan.actions.forEach(action => {
            if (action.args) {
              action.args.forEach(arg => {
                // Check if this argument is likely a robot based on common robot names or action patterns
                if (arg.toLowerCase().includes('robot') || 
                    arg.toLowerCase().includes('wally') || 
                    arg.toLowerCase().includes('eve') ||
                    arg.toLowerCase().includes('gripper') ||
                    arg.toLowerCase().includes('arm') ||
                    ['r1', 'r2', 'r3', 'r4', 'r5'].includes(arg.toLowerCase())) {
                  robotsInPlan.add(arg);
                }
              });
            }
          });
          
          // Create battery fluents for detected robots
          robotsInPlan.forEach(robotId => {
            const batteryKey = `battery_${robotId.toLowerCase()}`;
            if (!fluents[batteryKey]) {
              fluents[batteryKey] = {
                name: 'battery',
                objectId: robotId,
                value: 100,
                initialValue: 100,
                type: 'battery',
                minValue: 0,
                maxValue: 100,
                unit: '%'
              };
            }
          });
          
          set({ numericFluents: fluents });
          console.log('Initialized numeric fluents from plan for non-Classical domain');
          console.log('Detected robots in plan:', Array.from(robotsInPlan));
          console.log('Created battery fluents:', Object.keys(fluents).filter(k => k.startsWith('battery_')));
        } else {
          set({ numericFluents: {} });
          console.log('Skipped numeric fluent initialization for Classical domain');
        }
        
      } catch (error) {
        console.error('Error parsing plan file:', error);
        setParseErrors([`Failed to parse plan file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      } finally {
        setLoading(false);
      }
    },
    
    generateScene: async () => {
      const { setLoading, files, setSceneObjects, setParseErrors } = get();
      const { domain, problem, plan } = files;
      
      if (!domain || !problem || !plan) {
        console.warn('Cannot generate scene: missing domain, problem, or plan');
        return;
      }
      
      try {
        setLoading(true, 'Generating 3D scene...');
        
        // Import scene generator
        const { SceneGenerator } = await import('../three/SceneGenerator');
        const objects = await SceneGenerator.generateScene(domain, problem, plan);
        
        setSceneObjects(objects);
        
      } catch (error) {
        console.error('Error generating scene:', error);
        setParseErrors([`Failed to generate scene: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      } finally {
        setLoading(false);
      }
    },
    
    playPlan: () => {
      const { updatePlaybackState, files } = get();
      
      if (!files.plan) return;
      
      updatePlaybackState({ isPlaying: true });
      
      // Start animation loop with proper time tracking
      let lastTime = Date.now();
      
      const animate = () => {
        const state = get();
        if (!state.playbackState.isPlaying) return;
        
        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;
        
        const newTime = state.playbackState.currentTime + deltaTime * state.playbackState.speed;
        
        if (newTime >= state.playbackState.totalDuration) {
          // Plan finished
          updatePlaybackState({
            isPlaying: false,
            currentTime: state.playbackState.totalDuration
          });
          return;
        }
        
        // Update current and next actions
        const plan = state.files.plan!;
        const currentAction = plan.actions.find(action => 
          action.startTime <= newTime && action.endTime > newTime
        ) || null;
        
        const nextAction = plan.actions.find(action => 
          action.startTime > newTime
        ) || null;
        
        updatePlaybackState({
          currentTime: newTime,
          currentAction,
          nextAction
        });
        
        // Update world state
        updateWorldState(newTime);
        
        requestAnimationFrame(animate);
      };
      
      requestAnimationFrame(animate);
    },
    
    pausePlan: () => {
      set((state) => ({
        playbackState: { ...state.playbackState, isPlaying: false }
      }));
    },
    
    seekToTime: (time: number) => {
      const { updatePlaybackState, files } = get();
      
      if (!files.plan) return;
      
      const clampedTime = Math.max(0, Math.min(time, files.plan.totalDuration));
      
      // Find current and next actions at this time
      const currentAction = files.plan.actions.find(action => 
        action.startTime <= clampedTime && action.endTime > clampedTime
      ) || null;
      
      const nextAction = files.plan.actions.find(action => 
        action.startTime > clampedTime
      ) || null;
      
      updatePlaybackState({
        currentTime: clampedTime,
        currentAction,
        nextAction
      });
      
      // Update world state for this time
      updateWorldState(clampedTime);
    },
    
    resetPlan: () => {
      set((state) => ({
        playbackState: {
          ...state.playbackState,
          isPlaying: false,
          currentTime: 0,
          currentAction: state.files.plan?.actions[0] || null,
          nextAction: state.files.plan?.actions[1] || null
        }
      }));
      
      // Reset world state
      updateWorldState(0);
    },
    
    initializeNumericFluents: (problemData: PDDLProblem) => {
      const { domainClassification, files } = get();
      const numericFluents: Record<string, NumericFluent> = {};
      
      // Determine domain type - if not classified yet, check domain file
      let domainType = domainClassification?.type;
      if (!domainType && files.domain) {
        const { PDDLParser } = require('../parsers/pddlParser');
        const classification = PDDLParser.getDomainClassificationSummary(files.domain);
        domainType = classification.type;
      }
      
      // Only initialize numeric fluents for non-Classical domains
      if (domainType === PDDLDomainType.CLASSICAL) {
        set({ numericFluents: {} });
        return;
      }
      
      // Initialize numeric fluents from problem initial state
      if (problemData.init?.numeric) {
        problemData.init.numeric.forEach((numericInit: any) => {
          const { functionName, objectId, value, type } = numericInit;
          const fluentKey = objectId ? `${functionName}_${objectId}` : functionName;
          
          numericFluents[fluentKey] = {
            name: functionName,
            objectId: objectId,
            value: value,
            initialValue: value, // Store initial value for reference
            type: type || 'other',
            minValue: type === 'battery' ? 0 : undefined,
            maxValue: type === 'battery' ? 100 : undefined,
            unit: type === 'battery' ? '%' : type === 'time' ? 's' : undefined
          };
        });
      }
      
      // Auto-detect and initialize battery fluents for known robots (only for non-Classical domains)
      const robots = problemData.objects?.filter(obj => 
        obj.type.toLowerCase().includes('robot') || 
        obj.type.toLowerCase().includes('gripper') ||
        obj.type.toLowerCase().includes('agent') ||
        obj.type.toLowerCase().includes('vehicle')
      ) || [];
      
      robots.forEach(robot => {
        const batteryKey = `battery_${robot.name.toLowerCase()}`;
        if (!numericFluents[batteryKey]) {
          // Check if there's a battery function in the problem init for this robot
          const batteryInit = problemData.init?.numeric?.find((init: any) => 
            init.functionName && init.functionName.toLowerCase().includes('battery') && 
            (init.objectId === robot.name || init.functionName.toLowerCase().includes(robot.name.toLowerCase()))
          );
          
          const initialBattery = batteryInit ? batteryInit.value : 100;
          
          numericFluents[batteryKey] = {
            name: 'battery',
            objectId: robot.name,
            value: initialBattery,
            initialValue: initialBattery,
            type: 'battery',
            minValue: 0,
            maxValue: 100,
            unit: '%'
          };
        }
      });
      
      set({ numericFluents });
      console.log('Initialized numeric fluents for domain type:', domainType);
      console.log('Numeric fluents:', numericFluents);
    },
    
    updateNumericFluentsFromAction: (action: PlanAction) => {
      const { numericFluents } = get();
      const updatedFluents = { ...numericFluents };
      
      // Find robot ID from action arguments
      let robotId = '';
      if (action.args && action.args.length > 0) {
        // Look for robot names in arguments - try each argument
        for (const arg of action.args) {
          if (arg.toLowerCase().includes('robot') || 
              arg.toLowerCase().includes('wally') || 
              arg.toLowerCase().includes('eve') ||
              arg.toLowerCase().includes('gripper') ||
              ['r1', 'r2', 'r3', 'r4', 'r5'].includes(arg.toLowerCase())) {
            robotId = arg;
            break;
          }
        }
        // Fallback to first argument if no obvious robot found
        if (!robotId) {
          robotId = action.args[action.args.length - 1]; // Last argument is often the robot
        }
      }
      
      if (!robotId) {
        console.log(`No robot found in action: ${action.name}`, action.args);
        return;
      }
      
      const batteryKey = `battery_${robotId.toLowerCase()}`;
      
      if (!updatedFluents[batteryKey]) {
        console.log(`No battery fluent found for robot: ${robotId}`);
        return;
      }
      
      // Calculate battery consumption based on action specifics
      const actionName = action.name.toLowerCase();
      let batteryChange = 0;
      
      // Check if action has explicit numeric effects for battery
      if (action.numericEffects) {
        const batteryEffect = action.numericEffects.find(effect => 
          effect.function.toLowerCase().includes('battery') || 
          (typeof effect.function === 'object' && effect.function[0]?.toLowerCase().includes('battery'))
        );
        
        if (batteryEffect) {
          // Use explicit battery effect from plan
          const change = typeof batteryEffect.value === 'number' ? batteryEffect.value : 0;
          batteryChange = batteryEffect.operation === 'decrease' ? -change : 
                         batteryEffect.operation === 'increase' ? change : 0;
          console.log(`Using explicit battery effect: ${batteryEffect.operation} ${change}`);
        }
      }
      
      // Fallback to action-based estimates if no explicit effects
      if (batteryChange === 0) {
        if (actionName.includes('move') || actionName.includes('drive') || actionName.includes('go')) {
          // Movement cost based on distance/duration
          const duration = action.duration || 1;
          batteryChange = -Math.min(30, Math.max(10, duration * 2)); // 10-30% based on duration
        } else if (actionName.includes('pick') || actionName.includes('load')) {
          batteryChange = -5; // Pick/load actions consume 5% battery
        } else if (actionName.includes('drop') || actionName.includes('unload')) {
          batteryChange = -2; // Drop/unload actions consume 2% battery
        } else if (actionName.includes('fly')) {
          // Flying costs more than ground movement
          const duration = action.duration || 1;
          batteryChange = -Math.min(40, Math.max(15, duration * 3)); // 15-40% based on duration
        } else if (actionName.includes('charge') || actionName.includes('recharge')) {
          const duration = action.duration || 1;
          batteryChange = Math.min(80, Math.max(20, duration * 10)); // 20-80% based on duration
        }
      }
      
      if (batteryChange !== 0) {
        const oldValue = updatedFluents[batteryKey].value;
        const newValue = Math.max(0, Math.min(100, oldValue + batteryChange));
        updatedFluents[batteryKey] = {
          ...updatedFluents[batteryKey],
          value: newValue
        };
        
        const actionDetails = action.duration ? ` (duration: ${action.duration}s)` : '';
        console.log(`Battery update for ${robotId} - ${action.name}${actionDetails}: ${oldValue}% ${batteryChange > 0 ? '+' : ''}${batteryChange}% = ${newValue}%`);
        
        set({ numericFluents: updatedFluents });
      } else {
        console.log(`No battery impact for ${robotId} - ${action.name}`);
      }
    }
  }))
);

// Make store accessible globally for animation manager
if (typeof window !== 'undefined') {
  (window as any).__planStore = { getState: () => usePlanStore.getState() };
}

// Subscribe to playback state changes and expose current time globally
usePlanStore.subscribe((state) => {
  if (typeof window !== 'undefined') {
    (window as any).planStoreCurrentTime = state.playbackState.currentTime;
  }
});

// Helper function to update world state based on time
function updateWorldState(time: number) {
  const state = usePlanStore.getState();
  const { files, updateWorldState, updateNumericFluent } = state;
  
  if (!files.plan || !files.problem) return;
  
  // Calculate world state at given time
  const newFacts = [...files.problem.init];
  const newNumericFluents = { ...state.numericFluents };
  
  // Apply effects of completed actions
  files.plan.actions
    .filter(action => action.endTime <= time)
    .forEach(action => {
      // Apply numeric effects
      action.numericEffects?.forEach(effect => {
        if (newNumericFluents[effect.function]) {
          const currentValue = newNumericFluents[effect.function].value;
          const newValue = Math.max(
            newNumericFluents[effect.function].minValue || 0,
            Math.min(
              newNumericFluents[effect.function].maxValue || 100,
              currentValue + effect.change
            )
          );
          
          updateNumericFluent(effect.function, { value: newValue });
        }
      });
    });
  
  updateWorldState({
    facts: newFacts,
    numericFluents: newNumericFluents,
    time
  });
}

// Selectors for derived state
export const selectPlanStats = () => {
  const { files } = usePlanStore.getState();
  if (!files.plan) return null;
  
  return {
    actionCount: files.plan.actions.length,
    totalDuration: files.plan.totalDuration,
    planType: files.plan.type,
    cost: files.plan.cost
  };
};

export const selectCurrentActionProgress = () => {
  const { playbackState } = usePlanStore.getState();
  const { currentAction, currentTime } = playbackState;
  
  if (!currentAction) return 0;
  
  const elapsed = currentTime - currentAction.startTime;
  const progress = elapsed / currentAction.duration;
  return Math.max(0, Math.min(1, progress));
};
