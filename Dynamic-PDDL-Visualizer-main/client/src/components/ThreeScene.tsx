import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Home, 
  Maximize, 
  Eye, 
  Lightbulb,
  MousePointer,
  RotateCcw,
  ZoomIn,
  Box
} from 'lucide-react';
import { usePlanStore } from '../store/planStore';
import { SceneManager } from '../three/SceneManager';

// Define OrbitControls type since we can't import it directly
declare global {
  interface Window {
    THREE: any;
  }
}

export const ThreeScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  
  const { 
    files, 
    playbackState, 
    config,
    updateVisualizationConfig,
    sceneObjects,
    isLoading
  } = usePlanStore();
  
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [sceneError, setSceneError] = useState<string | null>(null);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    try {
      // Get container dimensions
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Create scene manager
      const sceneManager = new SceneManager(canvas, width, height);
      sceneManagerRef.current = sceneManager;
      
      // Setup controls (simplified without OrbitControls import)
      let isMouseDown = false;
      let mouseX = 0;
      let mouseY = 0;
      
      const handleMouseDown = (event: MouseEvent) => {
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
      };
      
      const handleMouseMove = (event: MouseEvent) => {
        if (!isMouseDown) return;
        
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        
        // Simple camera rotation
        const camera = sceneManager.Camera as any;
        const radius = camera.position.length();
        const theta = Math.atan2(camera.position.x, camera.position.z) + deltaX * 0.01;
        const phi = Math.acos(camera.position.y / radius) + deltaY * 0.01;
        
        camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(0, 0, 0);
        
        mouseX = event.clientX;
        mouseY = event.clientY;
      };
      
      const handleMouseUp = () => {
        isMouseDown = false;
      };
      
      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        const camera = sceneManager.Camera as any;
        const direction = camera.position.clone().normalize();
        const distance = camera.position.length();
        const newDistance = Math.max(2, Math.min(50, distance + event.deltaY * 0.01));
        camera.position.copy(direction.multiplyScalar(newDistance));
      };
      
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('wheel', handleWheel);
      
      setIsSceneReady(true);
      setSceneError(null);
      
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('wheel', handleWheel);
        
        sceneManager.dispose();
        sceneManagerRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize Three.js scene:', error);
      setSceneError(error instanceof Error ? error.message : 'Unknown error');
      setIsSceneReady(false);
    }
  }, []);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!sceneManagerRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      sceneManagerRef.current.handleResize(rect.width, rect.height);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Generate scene when all files are loaded
  useEffect(() => {
    if (!sceneManagerRef.current || !files.domain || !files.problem || !files.plan) return;
    
    const generateScene = async () => {
      try {
        setSceneError(null);
        const sceneObjects = await sceneManagerRef.current!.generateScene(
          files.domain!,
          files.problem!,
          files.plan!
        );
        console.log('Scene generated successfully with', sceneObjects.length, 'objects');
      } catch (error) {
        console.error('Failed to generate scene:', error);
        setSceneError(error instanceof Error ? error.message : 'Failed to generate scene');
      }
    };
    
    generateScene();
  }, [files.domain, files.problem, files.plan]);
  
  // Update scene based on playback time
  useEffect(() => {
    if (!sceneManagerRef.current || !playbackState) return;
    
    sceneManagerRef.current.updateScene(playbackState.currentTime);
    
    if (playbackState.isPlaying) {
      const animate = () => {
        if (sceneManagerRef.current && playbackState.isPlaying) {
          sceneManagerRef.current.updateScene(playbackState.currentTime);
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackState.isPlaying, playbackState.currentTime]);
  
  // Handle camera mode changes
  const handleCameraModeChange = (mode: string) => {
    updateVisualizationConfig({ cameraMode: mode as any });
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraMode(mode as any);
    }
  };
  
  // Handle render mode changes
  const handleRenderModeChange = (mode: string) => {
    updateVisualizationConfig({ renderMode: mode as any });
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setRenderMode(mode as any);
    }
  };
  
  // Camera control handlers
  const handleHomeView = () => {
    if (sceneManagerRef.current) {
      // Reset camera to default position
      const camera = sceneManagerRef.current.Camera as any;
      camera.position.set(10, 8, 10);
      camera.lookAt(0, 0, 0);
    }
  };
  
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const hasScene = files.domain && files.problem && files.plan && !isLoading;

  return (
    <div ref={containerRef} className="absolute inset-0 three-canvas">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* Scene Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        {/* Camera Controls */}
        <Card className="bg-visualizer-card/80 backdrop-blur-sm border-visualizer-border">
          <div className="p-2 flex flex-col space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHomeView}
              className="p-2 text-visualizer-text-muted hover:text-visualizer-text hover:bg-visualizer-border"
              title="Reset Camera"
            >
              <Home size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFullscreen}
              className="p-2 text-visualizer-text-muted hover:text-visualizer-text hover:bg-visualizer-border"
              title="Fullscreen"
            >
              <Maximize size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-visualizer-text-muted hover:text-visualizer-text hover:bg-visualizer-border"
              title="Toggle Labels"
              onClick={() => updateVisualizationConfig({ showLabels: !config.showLabels })}
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-visualizer-text-muted hover:text-visualizer-text hover:bg-visualizer-border"
              title="Lighting Settings"
            >
              <Lightbulb size={16} />
            </Button>
          </div>
        </Card>

        {/* View Mode Selector */}
        <Card className="bg-visualizer-card/80 backdrop-blur-sm border-visualizer-border">
          <div className="p-2">
            <Select value={config.cameraMode} onValueChange={handleCameraModeChange}>
              <SelectTrigger className="w-32 h-8 text-xs bg-transparent border-none text-visualizer-text-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perspective">Perspective</SelectItem>
                <SelectItem value="orthographic">Orthographic</SelectItem>
                <SelectItem value="top">Top View</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
        
        {/* Render Mode Selector */}
        <Card className="bg-visualizer-card/80 backdrop-blur-sm border-visualizer-border">
          <div className="p-2">
            <Select value={config.renderMode} onValueChange={handleRenderModeChange}>
              <SelectTrigger className="w-32 h-8 text-xs bg-transparent border-none text-visualizer-text-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="wireframe">Wireframe</SelectItem>
                <SelectItem value="points">Points</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>
      
      {/* Empty State */}
      {!hasScene && !sceneError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 opacity-10"
               style={{
                 backgroundImage: 'radial-gradient(circle, hsl(215, 20%, 65%) 1px, transparent 1px)',
                 backgroundSize: '20px 20px'
               }}>
          </div>
          
          <div className="relative z-10 text-center">
            <div className="mb-4">
              <Box className="text-6xl text-visualizer-text-muted mb-2 mx-auto" size={60} />
            </div>
            <h3 className="text-xl font-semibold text-visualizer-text-muted mb-2">3D Scene Viewport</h3>
            <p className="text-sm text-visualizer-text-muted mb-4">Load PDDL files to generate and visualize the planning scene</p>
            <div className="flex items-center justify-center space-x-4 text-xs text-visualizer-text-muted">
              <span><MousePointer size={12} className="inline mr-1" />Left: Rotate</span>
              <span><RotateCcw size={12} className="inline mr-1" />Right: Pan</span>
              <span><ZoomIn size={12} className="inline mr-1" />Wheel: Zoom</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {sceneError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="max-w-md mx-4 bg-destructive/10 border-destructive">
            <div className="p-6 text-center">
              <div className="text-destructive text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-semibold text-destructive mb-2">Scene Generation Error</h3>
              <p className="text-sm text-visualizer-text-muted">{sceneError}</p>
              <Button 
                onClick={() => setSceneError(null)} 
                variant="outline" 
                size="sm" 
                className="mt-4"
              >
                Dismiss
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
