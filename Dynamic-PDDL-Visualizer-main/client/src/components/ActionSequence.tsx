import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  Play,
  Info,
  Plus,
  Minus,
  ArrowDown,
  Battery
} from 'lucide-react';
import { usePlanStore, selectCurrentActionProgress } from '../store/planStore';
import { PlanAction } from '../types/pddl';
import { PDDLDomainType } from '../parsers/plannerOutputParser';

interface ActionCardProps {
  action: PlanAction;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isPending: boolean;
  progress?: number;
  onActionClick: (action: PlanAction) => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  action,
  index,
  isActive,
  isCompleted,
  isPending,
  progress = 0,
  onActionClick
}) => {
  const { domainClassification } = usePlanStore();
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate battery effects for non-Classical domains
  const getBatteryEffects = () => {
    // Don't show battery effects if no domain classification or if Classical domain
    if (!domainClassification || domainClassification.type === PDDLDomainType.CLASSICAL) {
      return null;
    }
    
    // Check for battery-affecting actions
    const actionName = action.name.toLowerCase();
    let batteryChange = 0;
    let affectedRobot = '';
    
    // Extract robot from action arguments or name
    if (action.args && action.args.length > 0) {
      affectedRobot = action.args.find(arg => 
        arg.toLowerCase().includes('robot') || 
        arg.toLowerCase().includes('wally') || 
        arg.toLowerCase().includes('eve') ||
        arg.toLowerCase().includes('gripper')
      ) || action.args[0];
    }
    
    // Determine battery consumption based on action type
    if (actionName.includes('move') || actionName.includes('go') || actionName.includes('drive')) {
      batteryChange = -20; // Move actions consume 20% battery
    } else if (actionName.includes('charge') || actionName.includes('recharge')) {
      batteryChange = +50; // Charge actions restore 50% battery
    } else if (actionName.includes('pick') || actionName.includes('drop') || actionName.includes('load') || actionName.includes('unload')) {
      batteryChange = -5; // Manipulation actions consume 5% battery
    }
    
    return batteryChange !== 0 ? { change: batteryChange, robot: affectedRobot } : null;
  };
  
  const batteryEffect = getBatteryEffects();

  const cardClassName = `p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
    isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-md' :
    isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600' :
    'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
  }`;

  return (
    <div className={cardClassName} onClick={() => onActionClick(action)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
          Step {index + 1}
        </span>
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
          {formatTime(action.startTime)} - {formatTime(action.endTime)}
        </span>
      </div>
      
      <div className="text-xl font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
        {action.name}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {action.args.map((arg, argIndex) => (
          <Badge key={argIndex} variant="secondary" className="text-sm px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">
            {arg}
          </Badge>
        ))}
      </div>
      
      {/* Status and Progress */}
      <div className="flex items-center justify-between">
        {isActive && progress > 0 ? (
          <div className="flex-1 mr-4">
            <Progress value={progress * 100} className="h-3" />
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
              {(progress * 100).toFixed(0)}% Complete
            </div>
          </div>
        ) : null}
        
        <div className="flex items-center text-sm font-semibold">
          {isCompleted ? (
            <>
              <CheckCircle size={18} className="text-green-600 dark:text-green-400 mr-2" />
              <span className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg">
                Completed
              </span>
            </>
          ) : isActive ? (
            <>
              <Play size={18} className="text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
                Active
              </span>
            </>
          ) : (
            <>
              <Clock size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
              <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                Pending
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Battery Effects Annotation */}
      {batteryEffect && batteryEffect.robot && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Battery className={`w-4 h-4 ${batteryEffect.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Battery {batteryEffect.change > 0 ? 'Gain' : 'Usage'}:
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {batteryEffect.robot}
              </span>
              <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                batteryEffect.change > 0 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
              }`}>
                {batteryEffect.change > 0 ? '+' : ''}{batteryEffect.change}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Numeric Effects Preview */}
      {action.numericEffects && action.numericEffects.length > 0 && (
        <div className="mt-2 pt-2 border-t border-visualizer-border/50">
          <div className="text-xs text-visualizer-text-muted space-y-1">
            {action.numericEffects.slice(0, 2).map((effect, effectIndex) => (
              <div key={effectIndex} className="flex items-center space-x-1">
                {effect.change > 0 ? (
                  <Plus size={10} className="text-accent" />
                ) : (
                  <Minus size={10} className="text-destructive" />
                )}
                <span className="truncate">{effect.function}: {effect.change}</span>
              </div>
            ))}
            {action.numericEffects.length > 2 && (
              <div className="text-xs text-visualizer-text-muted">
                +{action.numericEffects.length - 2} more effects
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ActionSequence: React.FC = () => {
  const {
    files,
    playbackState,
    selectedAction,
    setSelectedAction,
    seekToTime
  } = usePlanStore();
  
  const currentActionProgress = selectCurrentActionProgress();
  
  // Memoize action status calculations
  const actionStates = useMemo(() => {
    if (!files.plan) return [];
    
    return files.plan.actions.map(action => ({
      action,
      isActive: playbackState.currentAction?.id === action.id,
      isCompleted: playbackState.currentTime >= action.endTime,
      isPending: playbackState.currentTime < action.startTime
    }));
  }, [files.plan, playbackState.currentTime, playbackState.currentAction?.id]);
  
  const handleActionClick = (action: PlanAction) => {
    setSelectedAction(action);
    seekToTime(action.startTime);
  };
  
  if (!files.plan || files.plan.actions.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-visualizer-text-muted text-sm">
          No actions to display. Load a plan file to see the action sequence.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-visualizer-border bg-visualizer-background-secondary">
        <h3 className="text-sm font-semibold text-visualizer-text">Action Sequence</h3>
        <p className="text-xs text-visualizer-text-muted mt-1">
          {files.plan.actions.length} actions total
        </p>
      </div>

      {/* Action List */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-thin">
        {actionStates.map(({ action, isActive, isCompleted, isPending }, index) => (
          <ActionCard
            key={action.id}
            action={action}
            index={index}
            isActive={isActive}
            isCompleted={isCompleted}
            isPending={isPending}
            progress={isActive ? currentActionProgress : 0}
            onActionClick={handleActionClick}
          />
        ))}
      </div>
      
      {/* Action Details Panel - Compact Design */}
      {selectedAction && (
        <div className="border-t border-visualizer-border p-3 bg-visualizer-background-secondary">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-visualizer-text flex items-center">
              <Info size={14} className="mr-1 text-warning" />
              Details
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedAction(null)}
              className="h-6 w-6 p-0 text-visualizer-text-muted hover:text-visualizer-text"
            >
              ×
            </Button>
          </div>
          
          <div className="space-y-3 text-xs">
            {/* Basic Info */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-visualizer-text-muted">Action:</span>
                <span className="font-mono text-visualizer-text">{selectedAction.name}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-visualizer-text-muted">Duration:</span>
                <span className="font-mono text-visualizer-text">{selectedAction.duration.toFixed(1)}s</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-visualizer-text-muted">Status:</span>
                <span className={`font-mono ${
                  selectedAction.status === 'completed' ? 'text-accent' :
                  selectedAction.status === 'active' ? 'text-primary' :
                  selectedAction.status === 'failed' ? 'text-destructive' :
                  'text-visualizer-text-muted'
                }`}>
                  {selectedAction.status}
                </span>
              </div>
              {selectedAction.status === 'active' && (
                <div className="flex justify-between mb-1">
                  <span className="text-visualizer-text-muted">Progress:</span>
                  <span className="font-mono text-accent">{(currentActionProgress * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>

            {/* Arguments */}
            <div>
              <div className="text-visualizer-text font-medium mb-1">Arguments</div>
              <div className="space-y-1 ml-2">
                {selectedAction.args.map((arg, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-visualizer-text-muted">arg{index + 1}:</span>
                    <Badge variant="secondary" className="text-xs">{arg}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Numeric Effects */}
            {selectedAction.numericEffects && selectedAction.numericEffects.length > 0 && (
              <div>
                <div className="text-visualizer-text font-medium mb-1">Numeric Effects</div>
                <div className="space-y-1 ml-2">
                  {selectedAction.numericEffects.map((effect, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {effect.change > 0 ? (
                        <Plus size={12} className="text-accent" />
                      ) : (
                        <Minus size={12} className="text-destructive" />
                      )}
                      <span className="text-visualizer-text-muted">{effect.function}</span>
                      <span className="font-mono text-visualizer-text">
                        {effect.change > 0 ? '+' : ''}{effect.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2 border-t border-visualizer-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => seekToTime(selectedAction.startTime)}
                className="w-full text-xs"
              >
                <Play size={12} className="mr-1" />
                Jump to Action
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
