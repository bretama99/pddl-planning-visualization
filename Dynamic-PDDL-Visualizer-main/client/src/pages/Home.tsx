import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Box, 
  HelpCircle, 
  Settings, 
  Info, 
  Gauge,
  History,
  ListOrdered
} from 'lucide-react';
import { PlanLoader } from '../components/PlanLoader';
import { ThreeScene } from '../components/ThreeScene';
import { TimelineControls } from '../components/TimelineControls';
import { ActionSequence } from '../components/ActionSequence';
import { DomainObjects } from '../components/DomainObjects';
import { DomainToggle } from '../components/DomainToggle';
import { BatteryPanel } from '../components/BatteryIndicator';
import { DomainClassification } from '../components/DomainClassification';
import { usePlanStore, selectPlanStats } from '../store/planStore';

const Home: React.FC = () => {
  const { 
    files, 
    numericFluents, 
    isLoading, 
    loadingStatus,
    config,
    domainClassification
  } = usePlanStore();
  
  const planStats = selectPlanStats();
  
  // Check if scene is ready
  const hasAllFiles = files.domain && files.problem && files.plan;
  const sceneReady = hasAllFiles && !isLoading;

  return (
    <div className="h-screen flex flex-col bg-visualizer-bg text-visualizer-text">
      {/* Header */}
      <header className="bg-visualizer-card border-b border-visualizer-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Box className="text-primary text-xl" size={24} />
            <h1 className="text-xl font-semibold text-visualizer-text">PDDL Plan Visualizer</h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-visualizer-text-muted">
            <span className="px-2 py-1 bg-visualizer-border rounded text-xs font-mono">v1.0.0</span>
            <span className="text-visualizer-border">|</span>
            <span>Real-time 3D Planning Visualization</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <DomainToggle />
          <Button variant="ghost" size="sm" className="text-visualizer-text-muted hover:text-visualizer-text">
            <HelpCircle size={16} className="mr-1" />
            Help
          </Button>
          <Button variant="ghost" size="sm" className="text-visualizer-text-muted hover:text-visualizer-text">
            <Settings size={16} className="mr-1" />
            Settings
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - File Loading & Controls */}
        <div className="w-80 bg-visualizer-card border-r border-visualizer-border flex flex-col">
          {/* File Loading Section */}
          <div className="p-4 border-b border-visualizer-border">
            <PlanLoader />
          </div>

          {/* Plan Information */}
          {planStats && (
            <div className="p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl border-2 border-green-200 dark:border-green-800 shadow-xl m-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Info size={20} className="mr-3 text-green-600 dark:text-green-400" />
                Plan Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">Plan Type:</span>
                  <span className="text-gray-900 dark:text-white font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg text-sm">
                    {domainClassification?.type || planStats.planType}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">Actions:</span>
                  <span className="text-gray-900 dark:text-white font-bold bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-lg text-sm">
                    {planStats.actionCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">Duration:</span>
                  <span className="text-gray-900 dark:text-white font-bold bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-lg text-sm">
                    {planStats.totalDuration.toFixed(1)}s
                  </span>
                </div>
                {planStats.cost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300 font-semibold">Cost:</span>
                    <span className="text-gray-900 dark:text-white font-bold bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-lg text-sm">
                      {planStats.cost.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Domain Classification */}
          {files.domain && (
            <div className="mb-4">
              <DomainClassification />
            </div>
          )}

          {/* Domain Objects */}
          <div className="flex-1 min-h-0">
            <DomainObjects />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* 3D Scene Viewport */}
          <div className="flex-1 relative">
            <ThreeScene />
            
            {/* Battery Panel Overlay - Show when battery fluents exist or when we have robots in non-Classical domains */}
            {(Object.values(numericFluents).some(f => f.type === 'battery') || 
              (domainClassification?.type !== 'Classical' && Object.keys(numericFluents).length > 0)) && (
              <div className="absolute top-4 right-4 z-50">
                <BatteryPanel />
              </div>
            )}
            
            {/* General Numeric Fluents Overlay */}
            {config.showNumericFluents && Object.keys(numericFluents).length > 0 && 
             !Object.values(numericFluents).some(f => f.type === 'battery') && (
              <div className="absolute top-4 left-4">
                <Card className="bg-visualizer-card/80 backdrop-blur-sm border-visualizer-border min-w-48">
                  <div className="p-3">
                    <h4 className="text-xs font-semibold text-visualizer-text mb-2 flex items-center">
                      <Gauge size={12} className="mr-2 text-accent" />
                      Numeric Fluents
                    </h4>
                    <div className="space-y-2 text-xs">
                      {Object.entries(numericFluents).map(([name, fluent]) => (
                        <div key={name} className="flex items-center justify-between">
                          <span className="text-visualizer-text-muted truncate">{name}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-12 h-1 fluent-bar rounded-full overflow-hidden">
                              <div 
                                className={`fluent-bar-fill transition-all duration-300 ${
                                  fluent.value < 20 ? 'fluent-bar-danger' :
                                  fluent.value < 50 ? 'fluent-bar-warning' : ''
                                }`}
                                style={{ 
                                  width: `${Math.max(0, Math.min(100, (fluent.value / (fluent.maxValue || 100)) * 100))}%` 
                                }}
                              />
                            </div>
                            <span className="text-visualizer-text font-mono w-8 text-right">
                              {Math.round(fluent.value)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 modal-backdrop flex items-center justify-center">
                <Card className="text-center p-6">
                  <div className="spinner w-12 h-12 mx-auto mb-4" />
                  <p className="text-visualizer-text font-medium">Parsing PDDL files and generating scene...</p>
                  <p className="text-visualizer-text-muted text-sm mt-1">{loadingStatus}</p>
                </Card>
              </div>
            )}
          </div>

          {/* History Controls - Always show when files are loaded */}
          {hasAllFiles && (
            <div className="bg-visualizer-card border-t border-visualizer-border">
              <TimelineControls />
            </div>
          )}
        </div>

        {/* Right Sidebar - Action List & Details */}
        {sceneReady && (
          <div className="w-96 bg-visualizer-card border-l border-visualizer-border flex flex-col">
            <ActionSequence />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
