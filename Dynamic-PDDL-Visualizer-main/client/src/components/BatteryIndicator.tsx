import React from 'react';
import { usePlanStore } from '../store/planStore';
import { Battery, BatteryLow, BatteryWarning } from 'lucide-react';
import { PDDLDomainType } from '../parsers/plannerOutputParser';

interface BatteryIndicatorProps {
  robotId: string;
  className?: string;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({ robotId, className = '' }) => {
  const { numericFluents, domainClassification } = usePlanStore();
  
  // Don't show battery for Classical domains
  if (domainClassification?.type === PDDLDomainType.CLASSICAL) {
    return null;
  }
  
  // Find battery fluent for this robot
  const batteryKey = `battery_${robotId.toLowerCase()}`;
  const batteryFluent = numericFluents[batteryKey];
  
  if (!batteryFluent || batteryFluent.type !== 'battery') {
    return null;
  }
  
  const batteryLevel = batteryFluent.value;
  const maxBattery = batteryFluent.maxValue || 100;
  const batteryPercentage = Math.max(0, Math.min(100, (batteryLevel / maxBattery) * 100));
  
  // Determine battery status and color
  let batteryColor = 'bg-green-500';
  let textColor = 'text-green-600';
  let Icon = Battery;
  
  if (batteryPercentage < 20) {
    batteryColor = 'bg-red-500';
    textColor = 'text-red-600';
    Icon = BatteryLow;
  } else if (batteryPercentage < 40) {
    batteryColor = 'bg-yellow-500';
    textColor = 'text-yellow-600';
    Icon = BatteryWarning;
  }
  
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Icon className={`h-8 w-8 ${textColor}`} />
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">
            {robotId}
          </span>
          <span className={`text-lg font-bold ${textColor} bg-white dark:bg-gray-900 px-2 py-1 rounded-md border`}>
            {batteryLevel.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-4 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden border-2 border-gray-400 dark:border-gray-500">
          <div 
            className={`h-full transition-all duration-500 ${batteryColor} shadow-inner`}
            style={{ width: `${batteryPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-medium">
          {batteryLevel.toFixed(0)} / {maxBattery} units
        </div>
      </div>
    </div>
  );
};

interface BatteryPanelProps {
  className?: string;
}

export const BatteryPanel: React.FC<BatteryPanelProps> = ({ className = '' }) => {
  const { numericFluents } = usePlanStore();
  
  // Find all battery fluents
  const batteryFluents = Object.entries(numericFluents)
    .filter(([key, fluent]) => fluent.type === 'battery')
    .map(([key, fluent]) => ({
      key,
      robotId: fluent.objectId || key.replace('battery_', ''),
      fluent
    }));
  

  
  if (batteryFluents.length === 0) {
    return (
      <div className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border-2 border-yellow-200 dark:border-yellow-800 p-4 min-w-[280px] ${className}`}>
        <h3 className="text-lg font-bold mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
          <Battery className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          Battery Status
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">No battery fluents detected for this domain</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-blue-200 dark:border-blue-800 p-4 min-w-[240px] max-w-[280px] ${className}`}>
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
        <Battery className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        Battery Status
      </h3>
      
      <div className="space-y-3">
        {batteryFluents.map(({ key, robotId, fluent }) => (
          <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
            <BatteryIndicator 
              robotId={robotId}
              className=""
            />
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
        Real-time battery monitoring active
      </div>
    </div>
  );
};