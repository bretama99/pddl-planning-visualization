import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  History,
  Clock
} from 'lucide-react';
import { usePlanStore, selectCurrentActionProgress } from '../store/planStore';

export const TimelineControls: React.FC = () => {
  const {
    playbackState,
    files,
    playPlan,
    pausePlan,
    seekToTime,
    resetPlan,
    updatePlaybackState
  } = usePlanStore();
  
  const actionProgress = selectCurrentActionProgress();
  const [isDragging, setIsDragging] = useState(false);
  
  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    if (playbackState.isPlaying) {
      pausePlan();
    } else {
      playPlan();
    }
  }, [playbackState.isPlaying, playPlan, pausePlan]);
  
  // Handle timeline seeking
  const handleSeek = useCallback((values: number[]) => {
    const newTime = values[0];
    seekToTime(newTime);
  }, [seekToTime]);
  
  // Handle speed change
  const handleSpeedChange = useCallback((speed: string) => {
    updatePlaybackState({ speed: parseFloat(speed) });
  }, [updatePlaybackState]);
  
  // Handle step forward/backward
  const handleStepBackward = useCallback(() => {
    if (!files.plan) return;
    
    // Find previous action
    const currentIndex = files.plan.actions.findIndex(
      action => action.id === playbackState.currentAction?.id
    );
    
    if (currentIndex > 0) {
      const prevAction = files.plan.actions[currentIndex - 1];
      seekToTime(prevAction.startTime);
    } else {
      seekToTime(0);
    }
  }, [files.plan, playbackState.currentAction, seekToTime]);
  
  const handleStepForward = useCallback(() => {
    if (!files.plan) return;
    
    // Find next action
    const currentIndex = files.plan.actions.findIndex(
      action => action.id === playbackState.currentAction?.id
    );
    
    if (currentIndex < files.plan.actions.length - 1) {
      const nextAction = files.plan.actions[currentIndex + 1];
      seekToTime(nextAction.startTime);
    } else {
      seekToTime(playbackState.totalDuration);
    }
  }, [files.plan, playbackState.currentAction, playbackState.totalDuration, seekToTime]);
  
  // Handle reset
  const handleReset = useCallback(() => {
    resetPlan();
  }, [resetPlan]);
  
  // Calculate progress percentage
  const progressPercentage = playbackState.totalDuration > 0 
    ? (playbackState.currentTime / playbackState.totalDuration) * 100 
    : 0;
  
  // Generate time markers
  const timeMarkers = [];
  const markerCount = 5;
  for (let i = 0; i <= markerCount; i++) {
    const time = (i / markerCount) * playbackState.totalDuration;
    timeMarkers.push(time);
  }
  
  return (
    <div className="p-4">
      {/* History Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <History size={20} className="mr-3 text-purple-600 dark:text-purple-400" />
            Plan Timeline
          </h3>
          <div className="flex items-center space-x-3 text-lg font-bold">
            <span className="bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-lg text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
              {formatTime(playbackState.currentTime)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">/</span>
            <span className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {formatTime(playbackState.totalDuration)}
            </span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          {/* Speed Control */}
          <Select value={playbackState.speed.toString()} onValueChange={handleSpeedChange}>
            <SelectTrigger className="w-20 h-8 text-xs bg-visualizer-border text-visualizer-text border-visualizer-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="1">1.0x</SelectItem>
              <SelectItem value="2">2.0x</SelectItem>
              <SelectItem value="4">4.0x</SelectItem>
            </SelectContent>
          </Select>

          {/* Transport Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStepBackward}
            className="p-2 text-visualizer-text-muted hover:text-visualizer-text hover:bg-visualizer-border"
            title="Previous Action"
          >
            <SkipBack size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className="p-2 text-white bg-accent hover:bg-accent/80"
            title={playbackState.isPlaying ? "Pause" : "Play"}
          >
            {playbackState.isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStepForward}
            className="p-2 text-visualizer-text-muted hover:text-visualizer-text hover:bg-visualizer-border"
            title="Next Action"
          >
            <SkipForward size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="p-2 text-visualizer-text-muted hover:text-visualizer-text hover:bg-visualizer-border"
            title="Reset to Start"
          >
            <Square size={16} />
          </Button>
        </div>
      </div>

      {/* History Scrubber */}
      <div className="mb-4">
        <div className="relative">
          {/* History Slider */}
          <Slider
            value={[playbackState.currentTime]}
            max={playbackState.totalDuration}
            step={0.1}
            onValueChange={handleSeek}
            onValueCommit={handleSeek}
            className="w-full"
          />
          
          {/* Time Markers */}
          <div className="absolute inset-x-0 top-6 flex justify-between text-xs text-visualizer-text-muted pointer-events-none">
            {timeMarkers.map((time, index) => (
              <span key={index}>{formatTime(time)}</span>
            ))}
          </div>

          {/* Action Markers */}
          {files.plan && (
            <div className="absolute inset-x-0 top-0 pointer-events-none">
              {files.plan.actions.map((action) => {
                const leftPercentage = (action.startTime / playbackState.totalDuration) * 100;
                return (
                  <div
                    key={action.id}
                    className="absolute w-0.5 h-4 bg-warning opacity-75"
                    style={{ left: `${leftPercentage}%` }}
                    title={`${action.name} at ${formatTime(action.startTime)}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Current Action Display */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-3">
          <span className="text-visualizer-text-muted">Current Action:</span>
          {playbackState.currentAction ? (
            <div className="flex items-center space-x-2 px-3 py-1 action-card-active rounded-lg">
              <div className="status-indicator active" />
              <span className="font-mono text-visualizer-text">
                {playbackState.currentAction.name}({playbackState.currentAction.args.join(', ')})
              </span>
              <span className="text-xs text-visualizer-text-muted">
                {formatTime(playbackState.currentAction.startTime)} - {formatTime(playbackState.currentAction.endTime)}
              </span>
              {/* Progress bar for current action */}
              <div className="w-12 h-1 bg-visualizer-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${actionProgress * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1 bg-visualizer-border rounded-lg">
              <Clock size={12} className="text-visualizer-text-muted" />
              <span className="text-visualizer-text-muted">No active action</span>
            </div>
          )}
        </div>
        
        {playbackState.nextAction && (
          <div className="flex items-center space-x-2 text-xs text-visualizer-text-muted">
            <span>Next:</span>
            <span className="font-mono">
              {playbackState.nextAction.name}({playbackState.nextAction.args.join(', ')})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
