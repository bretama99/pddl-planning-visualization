import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  CheckCircle, 
  Info, 
  AlertCircle,
  Clock,
  Calculator,
  Zap,
  Sparkles
} from 'lucide-react';
import { usePlanStore } from '../store/planStore';
import { PDDLDomainType } from '../parsers/plannerOutputParser';

interface DomainClassificationProps {
  className?: string;
}

const getDomainTypeIcon = (type: PDDLDomainType) => {
  switch (type) {
    case PDDLDomainType.CLASSICAL:
      return <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case PDDLDomainType.NUMERIC:
      return <Calculator className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case PDDLDomainType.TEMPORAL:
      return <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    case PDDLDomainType.METRIC_TEMPORAL:
      return <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    case PDDLDomainType.PDDL_PLUS:
      return <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
    default:
      return <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
  }
};

const getDomainTypeColor = (type: PDDLDomainType) => {
  switch (type) {
    case PDDLDomainType.CLASSICAL:
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    case PDDLDomainType.NUMERIC:
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
    case PDDLDomainType.TEMPORAL:
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800';
    case PDDLDomainType.METRIC_TEMPORAL:
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
    case PDDLDomainType.PDDL_PLUS:
      return 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 border-pink-200 dark:border-pink-800';
    default:
      return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800';
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return 'text-green-600 dark:text-green-400';
  if (confidence >= 0.7) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

export const DomainClassification: React.FC<DomainClassificationProps> = ({ className = '' }) => {
  const { domainClassification, files } = usePlanStore();

  if (!domainClassification || !files.domain) {
    return null;
  }

  const { type, confidence, indicators, requirements } = domainClassification;

  return (
    <Card className={`${className} border-2 shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getDomainTypeIcon(type)}
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Domain Classification
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                Automatic PDDL domain type detection
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className={`w-4 h-4 ${getConfidenceColor(confidence)}`} />
            <span className={`text-sm font-bold ${getConfidenceColor(confidence)}`}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Domain Type */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Type:</span>
            <Badge className={`${getDomainTypeColor(type)} font-semibold px-3 py-1 text-sm`}>
              {type}
            </Badge>
          </div>
        </div>

        {/* Requirements */}
        {requirements.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Requirements:</span>
            <div className="flex flex-wrap gap-2">
              {requirements.map((req, index) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                  {req}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Classification Indicators */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Classification Indicators:
            </span>
          </div>
          <div className="space-y-1">
            {indicators.map((indicator, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{indicator}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Domain Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {files.domain.actions?.length || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Actions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {files.domain.predicates?.length || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Predicates</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {files.domain.types?.length || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Types</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {files.domain.functions?.length || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Functions</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};