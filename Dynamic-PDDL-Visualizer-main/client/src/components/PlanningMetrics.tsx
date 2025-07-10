/**
 * Planning Metrics Visualization Component
 * Displays comprehensive planning statistics and search progress
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlannerMetrics, PlannerType } from '../parsers/plannerOutputParser';
import { Clock, Target, Search, Zap, Database, TrendingUp } from 'lucide-react';

interface PlanningMetricsProps {
  metrics: PlannerMetrics;
  plannerType: PlannerType;
  planLength: number;
}

export const PlanningMetrics: React.FC<PlanningMetricsProps> = ({
  metrics,
  plannerType,
  planLength
}) => {
  const formatTime = (ms?: number) => {
    if (ms === undefined) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatNumber = (num?: number) => {
    if (num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  const getPlannerTypeColor = (type: PlannerType) => {
    switch (type) {
      case PlannerType.CLASSICAL: return 'bg-blue-100 text-blue-800';
      case PlannerType.TEMPORAL: return 'bg-green-100 text-green-800';
      case PlannerType.NUMERICAL: return 'bg-yellow-100 text-yellow-800';
      case PlannerType.PDDL_PLUS: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateEfficiency = () => {
    if (!metrics.expandedNodes || !metrics.statesEvaluated) return 0;
    return Math.round((metrics.expandedNodes / metrics.statesEvaluated) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Header with planner type */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-visualizer-text">Planning Metrics</h3>
        <Badge className={getPlannerTypeColor(plannerType)}>
          {plannerType.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Plan Quality */}
        <Card className="bg-visualizer-card border-visualizer-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-visualizer-text">
              <Target size={16} />
              Plan Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-visualizer-text">
              {planLength} actions
            </div>
            <div className="text-sm text-visualizer-text-muted">
              Cost: {metrics.planLength || planLength}
            </div>
          </CardContent>
        </Card>

        {/* Timing Performance */}
        <Card className="bg-visualizer-card border-visualizer-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-visualizer-text">
              <Clock size={16} />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-visualizer-text">
              {formatTime(metrics.planningTime)}
            </div>
            <div className="text-xs text-visualizer-text-muted space-y-1">
              <div>Search: {formatTime(metrics.searchTime)}</div>
              <div>Heuristic: {formatTime(metrics.heuristicTime)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Search Statistics */}
        <Card className="bg-visualizer-card border-visualizer-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-visualizer-text">
              <Search size={16} />
              Search Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-visualizer-text">
              {formatNumber(metrics.expandedNodes)}
            </div>
            <div className="text-xs text-visualizer-text-muted space-y-1">
              <div>States: {formatNumber(metrics.statesEvaluated)}</div>
              <div>Efficiency: {calculateEfficiency()}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grounding Information */}
      {metrics.grounding && (
        <Card className="bg-visualizer-card border-visualizer-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-visualizer-text">
              <Database size={16} />
              Grounding & Preprocessing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-visualizer-text-muted">Facts</div>
                <div className="font-semibold text-visualizer-text">
                  {formatNumber(metrics.grounding.facts)}
                </div>
              </div>
              <div>
                <div className="text-visualizer-text-muted">Actions</div>
                <div className="font-semibold text-visualizer-text">
                  {formatNumber(metrics.grounding.actions)}
                </div>
              </div>
              <div>
                <div className="text-visualizer-text-muted">Variables</div>
                <div className="font-semibold text-visualizer-text">
                  {formatNumber(metrics.grounding.variables)}
                </div>
              </div>
              <div>
                <div className="text-visualizer-text-muted">Time</div>
                <div className="font-semibold text-visualizer-text">
                  {formatTime(metrics.grounding.time)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Progress Visualization */}
      {metrics.search && metrics.search.nodes.length > 0 && (
        <Card className="bg-visualizer-card border-visualizer-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-visualizer-text">
              <TrendingUp size={16} />
              Search Progress (g + h values)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.search?.nodes?.slice(-10).map((node, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-8 text-visualizer-text-muted">
                    #{(metrics.search?.nodes?.length || 0) - 10 + index + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="text-visualizer-text">
                      g: {node.g.toFixed(1)}
                    </div>
                    <div className="text-visualizer-text">
                      h: {node.h.toFixed(1)}
                    </div>
                    <div className="font-semibold text-visualizer-text">
                      f: {(node.f || node.g + node.h).toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Problem Detection Statistics */}
      {(metrics.deadEnds || metrics.duplicates) && (
        <Card className="bg-visualizer-card border-visualizer-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-visualizer-text">
              <Zap size={16} />
              Problem Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-visualizer-text-muted">Dead Ends</div>
                <div className="font-semibold text-visualizer-text">
                  {formatNumber(metrics.deadEnds)}
                </div>
              </div>
              <div>
                <div className="text-visualizer-text-muted">Duplicates</div>
                <div className="font-semibold text-visualizer-text">
                  {formatNumber(metrics.duplicates)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};