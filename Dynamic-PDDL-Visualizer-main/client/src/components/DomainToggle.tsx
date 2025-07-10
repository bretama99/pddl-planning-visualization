import React from 'react';
import { usePlanStore } from '@/store/planStore';

interface DomainToggleProps {
  className?: string;
}

export const DomainToggle: React.FC<DomainToggleProps> = ({ className = '' }) => {
  const { config, updateVisualizationConfig } = usePlanStore();
  
  const handleDomainChange = (domain: 'robot' | 'logistics') => {
    updateVisualizationConfig({ domain });
    console.log(`Switched to ${domain} domain`);
  };

  return (
    <div className={`flex items-center space-x-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Domain:</span>
      
      <div className="flex space-x-2">
        <button
          onClick={() => handleDomainChange('robot')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            config.domain === 'robot'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          🤖 Robot Manipulation
        </button>
        
        <button
          onClick={() => handleDomainChange('logistics')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            config.domain === 'logistics'
              ? 'bg-green-500 text-white shadow-md'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          🚚 Logistics
        </button>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {config.domain === 'robot' ? 'Robots, rooms, balls, boxes' : 'Airplanes, trucks, packages, airports, cities'}
      </div>
    </div>
  );
};