import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Box, 
  Users, 
  MapPin, 
  Package,
  Zap,
  Circle
} from 'lucide-react';
import { usePlanStore } from '../store/planStore';
import { PDDLObject } from '../types/pddl';

interface ObjectIconProps {
  type: string;
  size?: number;
}

const ObjectIcon: React.FC<ObjectIconProps> = ({ type, size = 16 }) => {
  const iconProps = { size, className: "text-visualizer-text-muted" };
  
  const typeHierarchy = type.toLowerCase();
  
  if (typeHierarchy.includes('robot') || typeHierarchy.includes('agent')) {
    return <Users {...iconProps} className="text-primary" />;
  }
  if (typeHierarchy.includes('room') || typeHierarchy.includes('location')) {
    return <MapPin {...iconProps} className="text-warning" />;
  }
  if (typeHierarchy.includes('ball') || typeHierarchy.includes('sphere')) {
    return <Circle {...iconProps} className="text-accent" />;
  }
  if (typeHierarchy.includes('box') || typeHierarchy.includes('container')) {
    return <Package {...iconProps} className="text-info" />;
  }
  if (typeHierarchy.includes('tool') || typeHierarchy.includes('device')) {
    return <Zap {...iconProps} className="text-destructive" />;
  }
  
  return <Box {...iconProps} />;
};

interface ObjectGroupProps {
  title: string;
  objects: PDDLObject[];
  color: string;
}

const ObjectGroup: React.FC<ObjectGroupProps> = ({ title, objects, color }) => {
  if (objects.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <h4 className="text-sm font-medium text-visualizer-text">{title}</h4>
        <Badge variant="outline" className="text-xs">
          {objects.length}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-1">
        {objects.map((obj) => (
          <div
            key={obj.name}
            className="flex items-center space-x-2 p-2 rounded bg-visualizer-background-secondary border border-visualizer-border hover:bg-visualizer-border/20 transition-colors"
          >
            <ObjectIcon type={obj.type} size={14} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-visualizer-text truncate">
                {obj.name}
              </div>
              <div className="text-xs text-visualizer-text-muted">
                {obj.type}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DomainObjects: React.FC = () => {
  const { files, config } = usePlanStore();

  if (!files.problem) {
    return (
      <Card className="p-4">
        <div className="text-center text-visualizer-text-muted text-sm">
          Load a problem file to view domain objects
        </div>
      </Card>
    );
  }

  // Group objects by domain type
  const categorizeObjects = () => {
    if (config.domain === 'logistics') {
      // Logistics domain categorization
      const vehicles = files.problem!.objects.filter(obj => 
        obj.type.toLowerCase().includes('airplane') || 
        obj.type.toLowerCase().includes('truck') || 
        obj.type.toLowerCase().includes('vehicle')
      );
      
      const places = files.problem!.objects.filter(obj => 
        obj.type.toLowerCase().includes('airport') || 
        obj.type.toLowerCase().includes('location') ||
        obj.type.toLowerCase().includes('place')
      );
      
      const packages = files.problem!.objects.filter(obj => 
        obj.type.toLowerCase().includes('package') ||
        obj.type.toLowerCase().includes('physobj')
      );
      
      const cities = files.problem!.objects.filter(obj => 
        obj.type.toLowerCase().includes('city')
      );

      return { vehicles, places, packages, cities, robots: [], rooms: [], items: [], tools: [] };
    } else {
      // Robot domain categorization
      const robots = files.problem!.objects.filter(obj => 
        obj.type.toLowerCase().includes('robot') || 
        obj.type.toLowerCase().includes('agent')
      );
      
      const rooms = files.problem!.objects.filter(obj => 
        obj.type.toLowerCase().includes('room') || 
        obj.type.toLowerCase().includes('location')
      );
      
      const items = files.problem!.objects.filter(obj => 
        !robots.includes(obj) && 
        !rooms.includes(obj) &&
        (obj.type.toLowerCase().includes('ball') ||
         obj.type.toLowerCase().includes('obj') ||
         obj.type.toLowerCase().includes('sphere') ||
         obj.type.toLowerCase().includes('box') ||
         obj.type.toLowerCase().includes('container'))
      );
      
      const tools = files.problem!.objects.filter(obj => 
        !robots.includes(obj) && 
        !rooms.includes(obj) && 
        !items.includes(obj) &&
        (obj.type.toLowerCase().includes('tool') ||
         obj.type.toLowerCase().includes('device'))
      );

      return { robots, rooms, items, tools, vehicles: [], places: [], packages: [], cities: [] };
    }
  };

  const categories = categorizeObjects();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-visualizer-border bg-visualizer-background-secondary">
        <h3 className="text-sm font-semibold text-visualizer-text">Domain Objects</h3>
        <p className="text-xs text-visualizer-text-muted mt-1">
          {files.problem.objects.length} objects total ({config.domain} domain)
        </p>
      </div>

      {/* Objects List */}
      <div className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-thin">
        {config.domain === 'logistics' ? (
          <>
            <ObjectGroup 
              title="🚚 Vehicles" 
              objects={categories.vehicles} 
              color="primary" 
            />
            
            {categories.vehicles.length > 0 && categories.places.length > 0 && <Separator />}
            
            <ObjectGroup 
              title="🏢 Places" 
              objects={categories.places} 
              color="warning" 
            />
            
            {categories.places.length > 0 && categories.packages.length > 0 && <Separator />}
            
            <ObjectGroup 
              title="📦 Packages" 
              objects={categories.packages} 
              color="accent" 
            />
            
            {categories.packages.length > 0 && categories.cities.length > 0 && <Separator />}
            
            <ObjectGroup 
              title="🏙️ Cities" 
              objects={categories.cities} 
              color="secondary" 
            />
          </>
        ) : (
          <>
            <ObjectGroup 
              title="🤖 Robots & Agents" 
              objects={categories.robots} 
              color="primary" 
            />
            
            {categories.robots.length > 0 && categories.rooms.length > 0 && <Separator />}
            
            <ObjectGroup 
              title="🏠 Rooms & Locations" 
              objects={categories.rooms} 
              color="warning" 
            />
            
            {(categories.robots.length > 0 || categories.rooms.length > 0) && categories.items.length > 0 && <Separator />}
            
            <ObjectGroup 
              title="⚾ Items & Objects" 
              objects={categories.items} 
              color="accent" 
            />
            
            {categories.tools && categories.tools.length > 0 && (
              <>
                <Separator />
                <ObjectGroup 
                  title="🔧 Tools & Devices" 
                  objects={categories.tools} 
                  color="secondary" 
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-3 border-t border-visualizer-border bg-visualizer-background-secondary">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-visualizer-text-muted">Domain:</span>
            <span className="text-visualizer-text font-medium">
              {files.domain?.name || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-visualizer-text-muted">Problem:</span>
            <span className="text-visualizer-text font-medium">
              {files.problem?.name || 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};