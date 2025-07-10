/**
 * Animation Manager - Handles timing and execution of plan animations
 * Coordinates all visual effects with precise timing from the plan
 */

import * as THREE from 'three';
import { AnimationEvent, PlanAction, PlanProcess, NumericFluent } from '../types/pddl';
import { InverseKinematics } from './InverseKinematics';

export interface AnimationConfig {
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'bounce';
  loop: boolean;
  delay: number;
}

export class AnimationManager {
  private scene: THREE.Scene;
  private clock: THREE.Clock;
  private mixer: THREE.AnimationMixer;
  private activeAnimations: Map<string, THREE.AnimationAction> = new Map();
  private pendingEvents: AnimationEvent[] = [];
  private completedEvents: Set<string> = new Set();
  private activeTweens: Map<string, any> = new Map();
  private batteryUpdatedEvents: Set<string> = new Set(); // Track which events have had battery updates
  private ikSystem: InverseKinematics;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.clock = new THREE.Clock();
    this.mixer = new THREE.AnimationMixer(scene);
    this.ikSystem = new InverseKinematics();
    
    // Initialize IK chains for robots in the scene
    this.initializeIKChains();
  }

  /**
   * Schedule animation events from plan actions
   */
  scheduleAnimations(actions: PlanAction[], processes?: PlanProcess[]): void {
    this.clearAllAnimations();
    
    // Debug: Log all actions being processed
    console.log('Actions to animate:', actions.map(action => `${action.name}(${action.args.join(', ')})`));
    
    // Convert actions to animation events
    actions.forEach(action => {
      const events = this.createAnimationEventsFromAction(action);
      this.pendingEvents.push(...events);
    });
    
    // Convert processes to continuous animations
    if (processes) {
      processes.forEach(process => {
        const events = this.createAnimationEventsFromProcess(process);
        this.pendingEvents.push(...events);
      });
    }
    
    console.log(`Scheduled ${this.pendingEvents.length} animation events`);
  }

  /**
   * Update animations for current time - synchronized with plan timeline
   */
  update(currentTime: number): void {
    // Execute pending events that should start now (but haven't been started yet)
    const eventsToExecute = this.pendingEvents.filter(event => 
      event.startTime <= currentTime && 
      !this.completedEvents.has(event.id) && 
      !this.completedEvents.has(`${event.id}_started`)
    );
    
    eventsToExecute.forEach(event => {
      this.executeAnimationEvent(event, currentTime);
    });
    
    // Update mixer
    this.mixer.update(this.clock.getDelta());
    
    // Update active timeline-based tweens
    this.updateTimelineTweens(currentTime);
    
    // Update continuous status indicators
    this.updateRobotStatusIndicators();
    
    // Check for completed animations
    this.checkCompletedAnimations(currentTime);
  }

  /**
   * Update timeline-based tween animations
   */
  private updateTimelineTweens(currentTime: number): void {
    const completedTweens: string[] = [];
    
    this.activeTweens.forEach((tween, id) => {
      if (tween.update) {
        const stillActive = tween.update(currentTime);
        if (!stillActive) {
          // Complete the animation event
          const event = this.pendingEvents.find(e => e.id === id);
          if (event) {
            this.completeAnimationEvent(event);
          }
          completedTweens.push(id);
        }
      }
    });
    
    // Remove completed tweens
    completedTweens.forEach(id => this.activeTweens.delete(id));
  }

  /**
   * Create animation events from a plan action
   */
  private createAnimationEventsFromAction(action: PlanAction): AnimationEvent[] {
    const events: AnimationEvent[] = [];
    
    const actionName = action.name.toLowerCase().replace(/[-_]/g, '');
    console.log(`Creating animation events for action: ${action.name} (normalized: ${actionName}) - Duration: ${action.duration}s`);
    
    switch (actionName) {
      case 'move':
      case 'go':
      case 'navigate':
      case 'movetoroom':
      case 'gotoroom':
      case 'moveto':
      case 'startmove':
      case 'reprisemovement':
      case 'drive':
      case 'fly':
        // Handle movement actions for all domains
        let moveType: 'move' | 'startmove' | 'reprisemovement' | 'drive' | 'fly' = 'move';
        if (actionName === 'startmove') moveType = 'startmove';
        else if (actionName === 'reprisemovement') moveType = 'reprisemovement';
        else if (actionName === 'drive') moveType = 'drive';
        else if (actionName === 'fly') moveType = 'fly';
        
        events.push({
          id: `${action.id}_${moveType}`,
          type: moveType as any,
          objectId: action.args[0], // entity doing the moving (1st argument)
          startTime: action.startTime,
          duration: action.duration,
          data: {
            entity: action.args[0], // robot/vehicle (1st argument)
            from: action.args[1], // source location (2nd argument)
            to: action.args[2] // destination location (3rd argument)
          },
          completed: false
        });
        break;
        
      case 'pick':
      case 'grab':
      case 'take':
        events.push({
          id: `${action.id}_pick`,
          type: 'pick',
          objectId: action.args[2], // robot doing the picking (3rd argument)
          startTime: action.startTime,
          duration: action.duration,
          data: {
            target: action.args[0], // object being picked (1st argument)
            location: action.args[1] // pick location (2nd argument)
          },
          completed: false
        });
        break;
        
      case 'drop':
      case 'place':
      case 'put':
        events.push({
          id: `${action.id}_drop`,
          type: 'drop',
          objectId: action.args[2], // robot doing the dropping (3rd argument)
          startTime: action.startTime,
          duration: action.duration,
          data: {
            target: action.args[0], // object being dropped (1st argument)
            location: action.args[1] // drop location (2nd argument)
          },
          completed: false
        });
        break;

      case 'startcharge':
        events.push({
          id: `${action.id}_startcharge`,
          type: 'startcharge',
          objectId: action.args[0], // robot starting charge (1st argument)
          startTime: action.startTime,
          duration: action.duration,
          data: {
            robot: action.args[0] // robot (1st argument)
          },
          completed: false
        });
        break;

      case 'stopcharge':
        events.push({
          id: `${action.id}_stopcharge`,
          type: 'stopcharge',
          objectId: action.args[0], // robot stopping charge (1st argument)
          startTime: action.startTime,
          duration: action.duration,
          data: {
            robot: action.args[0] // robot (1st argument)
          },
          completed: false
        });
        break;

      // Numerical planning actions
      case 'increase':
      case 'decrease':
      case 'assign':
      case 'scaleto':
      case 'scaleup':
      case 'scaledown':
        events.push({
          id: `${action.id}_numeric`,
          type: 'numeric',
          objectId: action.args[0] || action.name,
          startTime: action.startTime,
          duration: action.duration,
          data: {
            operation: actionName,
            function: action.args[0],
            value: action.args[1],
            args: action.args
          },
          completed: false
        });
        break;
        
      default:
        // Generic action visualization
        events.push({
          id: `${action.id}_generic`,
          type: 'custom',
          objectId: action.args[0] || action.name,
          startTime: action.startTime,
          duration: action.duration,
          data: {
            actionName: action.name,
            args: action.args
          },
          completed: false
        });
        break;
    }
    
    return events;
  }

  /**
   * Create animation events from a process
   */
  private createAnimationEventsFromProcess(process: PlanProcess): AnimationEvent[] {
    const events: AnimationEvent[] = [];
    
    events.push({
      id: `${process.id}_process`,
      type: 'process',
      objectId: process.args[0] || process.name,
      startTime: process.startTime,
      duration: (process.endTime || process.startTime + 1.0) - process.startTime,
      data: {
        processName: process.name,
        args: process.args,
        effects: process.effects
      },
      completed: false
    });
    
    return events;
  }

  /**
   * Execute a specific animation event
   */
  private executeAnimationEvent(event: AnimationEvent, currentTime: number): void {
    console.log(`Executing animation event: ${event.type} for ${event.objectId} at time ${currentTime}`);
    
    // Update numeric fluents for all action events
    if (event.data && (event.data.actionName || event.data.action)) {
      const actionData = event.data.action || {
        name: event.data.actionName,
        args: event.data.args || [event.objectId],
        startTime: event.startTime,
        duration: event.duration
      };
      
      // Check durative-action conditions for temporal domains
      if (event.data.actionName && !this.checkDurativeConditions(actionData)) {
        console.warn(`Skipping action due to failed durative conditions: ${event.data.actionName}`);
        return;
      }
      
      // Update numeric fluents for this action
      this.updateNumericFluentsForAction(actionData);
    } else if (event.type && ['pick', 'drop', 'move', 'load', 'unload', 'drive', 'fly'].includes(event.type)) {
      // For events without explicit action data, create action from event info
      const implicitAction = {
        name: event.type,
        args: [event.objectId, ...(event.data?.targetLocation ? [event.data.targetLocation] : [])],
        startTime: event.startTime,
        duration: event.duration,
        endTime: event.startTime + event.duration
      } as any;
      
      // Only update battery when action completes (not when it starts)
      if (currentTime >= implicitAction.endTime && !this.batteryUpdatedEvents.has(event.id)) {
        console.log(`Action completed - updating battery for: ${event.type} on ${event.objectId}`);
        this.updateNumericFluentsForAction(implicitAction);
        this.batteryUpdatedEvents.add(event.id);
      }
    }
    
    // Try to find the object by name in the scene (case-insensitive)
    let object = this.scene.getObjectByName(event.objectId);
    
    // If not found, search case-insensitively through all children
    if (!object) {
      const targetId = event.objectId.toLowerCase();
      this.scene.traverse((child) => {
        if (child.name.toLowerCase() === targetId || 
            (child.userData.pddlObject && child.userData.pddlObject.name.toLowerCase() === targetId)) {
          object = child;
        }
      });
    }
    
    // Debug: List all available objects if target not found
    if (!object) {
      const availableObjects: string[] = [];
      this.scene.traverse((child) => {
        if (child.userData.pddlObject) {
          availableObjects.push(`${child.userData.pddlObject.name} (${child.userData.pddlObject.type})`);
        } else if (child.name && child.name !== '') {
          availableObjects.push(`${child.name} (unnamed)`);
        }
      });
      console.warn(`Animation target object not found: ${event.objectId}`);
      console.warn(`Available objects:`, availableObjects);
      return;
    }
    
    console.log(`Found animation target: ${object.name || object.userData.pddlObject?.name} for event ${event.type}`);
    
    // Mark event as started to prevent duplicate execution
    if (!this.completedEvents.has(event.id)) {
      this.completedEvents.add(`${event.id}_started`);
    }

    switch (event.type) {
      case 'move':
      case 'startmove':
      case 'reprisemovement':
      case 'drive':
      case 'fly':
        this.animateTimelinedMove(object, event, currentTime);
        break;
        
      case 'pick':
        this.animatePick(object, event, currentTime);
        break;
        
      case 'drop':
        this.animateDrop(object, event, currentTime);
        break;
        
      case 'startcharge':
        this.animateStartCharge(object, event, currentTime);
        break;
        
      case 'stopcharge':
        this.animateStopCharge(object, event, currentTime);
        break;

      case 'numeric':
        this.animateNumericEffect(object, event, currentTime);
        break;
        
      case 'custom':
        this.animateCustomAction(object, event, currentTime);
        break;
    }
  }

  /**
   * Animate movement synchronized with timeline - supports all entities (robots, trucks, airplanes)
   */
  private animateTimelinedMove(object: THREE.Object3D, event: AnimationEvent, currentTime: number): void {
    const { from, to, entity } = event.data;
    
    // Get source and target positions
    let fromObject = this.scene.getObjectByName(from);
    let toObject = this.scene.getObjectByName(to);
    
    // Search more thoroughly if not found (case-insensitive)
    if (!fromObject) {
      const fromId = from.toLowerCase();
      this.scene.traverse((child) => {
        if (child.name.toLowerCase() === fromId || 
            (child.userData.pddlObject?.name.toLowerCase() === fromId)) {
          fromObject = child;
        }
      });
    }
    
    if (!toObject) {
      const toId = to.toLowerCase();
      this.scene.traverse((child) => {
        if (child.name.toLowerCase() === toId || 
            (child.userData.pddlObject?.name.toLowerCase() === toId)) {
          toObject = child;
        }
      });
    }
    
    if (!fromObject || !toObject) {
      console.warn(`Movement source or target not found: ${from} -> ${to}`);
      return;
    }
    
    const startPos = fromObject.position.clone();
    const endPos = toObject.position.clone();
    
    // Determine entity type for specialized animations
    const entityType = object.userData.pddlObject?.type?.toLowerCase() || '';
    const isRobot = entityType.includes('robot') || entityType.includes('agent');
    const isTruck = entityType.includes('truck') || entityType.includes('vehicle');
    const isAirplane = entityType.includes('airplane') || entityType.includes('aircraft');
    
    // Adjust end position based on entity type
    if (isAirplane) {
      // Airplanes fly at altitude
      endPos.y = Math.max(endPos.y, 8);
      startPos.y = Math.max(startPos.y, 8);
    } else {
      // Ground vehicles get slight offset to prevent overlap
      endPos.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        0,
        (Math.random() - 0.5) * 0.5
      ));
    }
    
    // Store animation state for timeline-based updates
    const animationData = {
      startTime: event.startTime,
      duration: event.duration, // Use actual action duration from plan
      startPos: startPos.clone(),
      endPos: endPos.clone(),
      targetRotation: 0,
      entityType
    };
    
    // Calculate movement direction for rotation
    const direction = endPos.clone().sub(startPos).normalize();
    if (direction.length() > 0.1) {
      animationData.targetRotation = Math.atan2(direction.x, direction.z);
    }
    
    // Store animation for timeline updates
    this.activeTweens.set(event.id, {
      object,
      animationData,
      update: (currentTime: number) => {
        const elapsed = currentTime - animationData.startTime;
        const progress = Math.min(Math.max(elapsed / animationData.duration, 0), 1);
        
        // Smooth easing function
        const easeProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // Interpolate position based on timeline progress
        const currentPos = animationData.startPos.clone().lerp(animationData.endPos, easeProgress);
        
        // Apply entity-specific animations throughout the duration
        if (isRobot) {
          // Robot walking animation with arm swinging
          const walkCycle = Math.sin(progress * Math.PI * 12) * 0.02;
          currentPos.y += Math.abs(walkCycle);
          
          // Arm swinging animation
          object.traverse((child) => {
            if (child.name === 'leftArm') {
              child.rotation.x = Math.sin(progress * Math.PI * 12) * 0.3;
            }
            if (child.name === 'rightArm') {
              child.rotation.x = -Math.sin(progress * Math.PI * 12) * 0.3;
            }
          });
        } else if (isTruck) {
          // Truck driving with slight bouncing
          const bounce = Math.sin(progress * Math.PI * 20) * 0.05;
          currentPos.y += Math.abs(bounce);
          
          // Add exhaust smoke effect during movement
          if (progress > 0.1 && progress < 0.9) {
            this.addExhaustSmoke(object, progress);
          }
        } else if (isAirplane) {
          // Airplane flight with altitude changes and banking
          const flightPhase = progress < 0.3 ? 'takeoff' : progress > 0.7 ? 'landing' : 'cruise';
          
          if (flightPhase === 'takeoff') {
            // Takeoff phase - gradual altitude gain
            const takeoffProgress = progress / 0.3;
            currentPos.y = animationData.startPos.y + (8 - animationData.startPos.y) * takeoffProgress;
            object.rotation.x = -0.2 * (1 - takeoffProgress); // Nose up
          } else if (flightPhase === 'landing') {
            // Landing phase - gradual descent
            const landingProgress = (progress - 0.7) / 0.3;
            currentPos.y = 8 + (animationData.endPos.y - 8) * landingProgress;
            object.rotation.x = -0.15 * landingProgress; // Nose down
          } else {
            // Cruise phase - steady altitude with slight banking
            currentPos.y = 8;
            object.rotation.z = Math.sin(progress * Math.PI * 4) * 0.1; // Banking turns
          }
          
          // Add contrails during flight
          this.addContrails(object, progress);
        }
        
        // Update object position
        object.position.copy(currentPos);
        
        // Smooth rotation towards movement direction
        if (progress > 0.05 && animationData.targetRotation !== 0) {
          object.rotation.y = THREE.MathUtils.lerp(object.rotation.y, animationData.targetRotation, 0.1);
        }
        
        // Return false when animation is complete
        return progress < 1;
      }
    });
    
    console.log(`Started timeline-synchronized ${entityType} movement for ${object.name}, duration: ${event.duration}s`);
  }

  /**
   * Animate picking up an object with realistic arm IK and visual effects
   */
  private animatePick(object: THREE.Object3D, event: AnimationEvent, currentTime: number): void {
    const { target, location } = event.data;
    
    // Find the target object
    let targetObject: THREE.Object3D | null = null;
    
    this.scene.traverse((child) => {
      if (!targetObject && (
          child.name === target || 
          child.name.toLowerCase() === target.toLowerCase() ||
          child.userData.pddlObject?.name === target ||
          child.userData.pddlObject?.name?.toLowerCase() === target.toLowerCase()
      )) {
        targetObject = child;
      }
    });
    
    if (!targetObject) {
      console.warn(`Pick target object not found: ${target}`);
      return;
    }

    const originalPosition = targetObject.position.clone();
    const attachmentPos = new THREE.Vector3(0, 1, 0.5);

    // Timeline-based picking animation with phases
    this.activeTweens.set(event.id, {
      object,
      targetObject,
      originalPosition,
      update: (currentTime: number) => {
        const elapsed = currentTime - event.startTime;
        const progress = Math.min(Math.max(elapsed / event.duration, 0), 1);
        
        if (progress < 0.3) {
          // Phase 1: Robot approaches target (0-30%)
          const approachProgress = progress / 0.3;
          this.animateRobotArms(object, 'reaching', approachProgress);
          
          // Add focus beam effect
          if (Math.random() < 0.1) {
            this.addPickupBeam(object, targetObject);
          }
          
        } else if (progress < 0.7) {
          // Phase 2: Grasping action (30-70%)
          const graspProgress = (progress - 0.3) / 0.4;
          this.animateRobotArms(object, 'grasping', graspProgress);
          
          // Make target object glow to show interaction
          if (targetObject instanceof THREE.Mesh && targetObject.material instanceof THREE.MeshPhongMaterial) {
            targetObject.material.emissive.setHSL(0.6, 1, 0.2 * graspProgress);
          }
          
        } else {
          // Phase 3: Lifting and attachment (70-100%)
          const liftProgress = (progress - 0.7) / 0.3;
          this.animateRobotArms(object, 'lifting', liftProgress);
          
          // Smoothly move target to attachment position
          const currentPos = originalPosition.clone().lerp(attachmentPos, liftProgress);
          targetObject.position.copy(currentPos);
          
          if (progress >= 1) {
            // Complete attachment
            object.add(targetObject);
            targetObject.position.copy(attachmentPos);
            
            // Reset target object material
            if (targetObject instanceof THREE.Mesh && targetObject.material instanceof THREE.MeshPhongMaterial) {
              targetObject.material.emissive.setScalar(0);
            }
            
            // Add pickup completion effect
            this.addPickupCompleteEffect(object);
            
            console.log(`Successfully picked up ${target} with ${object.name}`);
            return false;
          }
        }
        
        return true;
      }
    });
    
    console.log(`Started enhanced pick animation for ${target}, duration: ${event.duration}s`);
  }

  /**
   * Animate dropping an object
   */
  private animateDrop(object: THREE.Object3D, event: AnimationEvent, currentTime: number): void {
    const { target, location } = event.data;
    
    // Find the target object that should be attached to the robot
    let targetObject: THREE.Object3D | null = null;
    
    object.traverse((child) => {
      if (!targetObject && (
          child.name === target || 
          child.userData.pddlObject?.name === target
      )) {
        targetObject = child;
      }
    });
    
    if (!targetObject) {
      console.warn(`Drop target object not found: ${target}`);
      return;
    }

    // Timeline-based dropping animation
    this.activeTweens.set(event.id, {
      object,
      targetObject,
      update: (currentTime: number) => {
        const elapsed = currentTime - event.startTime;
        const progress = Math.min(Math.max(elapsed / event.duration, 0), 1);
        
        if (progress >= 1) {
          // Detach and place object
          const worldPos = new THREE.Vector3();
          targetObject!.getWorldPosition(worldPos);
          object.remove(targetObject!);
          targetObject!.position.copy(worldPos);
          this.scene.add(targetObject!);
          console.log(`Dropped ${target} from ${object.name}`);
          return false;
        }
        
        return true;
      }
    });
  }

  /**
   * Initialize IK chains for robots in the scene
   */
  private initializeIKChains(): void {
    this.scene.traverse((child) => {
      if (child.userData.pddlObject && child.userData.pddlObject.type === 'robot') {
        try {
          // Create IK chains for both arms
          this.ikSystem.createArmChain(child as THREE.Group, true);  // Right arm
          this.ikSystem.createArmChain(child as THREE.Group, false); // Left arm
          console.log(`Initialized IK chains for robot: ${child.userData.pddlObject.name}`);
        } catch (error) {
          console.warn(`Could not initialize IK for robot ${child.userData.pddlObject.name}:`, error);
        }
      }
    });
  }

  /**
   * Animate start charging with enhanced effects
   */
  private animateStartCharge(object: THREE.Object3D, event: AnimationEvent, currentTime: number): void {
    // Mark as charging
    object.userData.isCharging = true;
    
    // Create charging station visual effect
    const chargingStation = new THREE.Group();
    const stationBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    const chargingPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8),
      new THREE.MeshPhongMaterial({ color: 0x666666 })
    );
    chargingPost.position.y = 0.5;
    
    chargingStation.add(stationBase);
    chargingStation.add(chargingPost);
    chargingStation.position.copy(object.position);
    chargingStation.position.z += 1.2; // Position behind robot
    this.scene.add(chargingStation);
    
    // Timeline-based charging animation
    this.activeTweens.set(event.id, {
      object,
      chargingStation,
      originalEmissive: new Map(),
      update: (currentTime: number) => {
        const elapsed = currentTime - event.startTime;
        const progress = Math.min(Math.max(elapsed / event.duration, 0), 1);
        
        // Charging effects - pulsing glow and sparks
        const pulse = Math.sin(elapsed * 8) * 0.5 + 0.5;
        const intensity = 0.2 + pulse * 0.3;
        
        // Add charging glow to robot
        object.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
            if (!this.activeTweens.get(event.id).originalEmissive.has(child)) {
              this.activeTweens.get(event.id).originalEmissive.set(child, child.material.emissive.clone());
            }
            child.material.emissive.setHSL(0.33, 1, intensity); // Green charging glow
          }
        });
        
        // Add electrical sparks periodically
        if (Math.random() < 0.1) {
          this.addElectricalSpark(object, chargingStation);
        }
        
        // Charging progress indicator
        const progressIndicator = chargingStation.getObjectByName('progress');
        if (!progressIndicator && progress > 0.1) {
          const indicator = new THREE.Mesh(
            new THREE.RingGeometry(0.3, 0.35, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 })
          );
          indicator.name = 'progress';
          indicator.rotation.x = -Math.PI / 2;
          indicator.position.y = 0.15;
          chargingStation.add(indicator);
        }
        
        return progress < 1;
      }
    });
    
    console.log(`Started enhanced charging animation for ${object.name}, duration: ${event.duration}s`);
  }

  /**
   * Animate stop charging
   */
  private animateStopCharge(object: THREE.Object3D, event: AnimationEvent, currentTime: number): void {
    // Mark as no longer charging
    object.userData.isCharging = false;
    
    // Find and remove charging station
    let chargingStation: THREE.Object3D | null = null;
    this.scene.traverse((child) => {
      if (child.name === 'chargingStation' || child.userData.isChargingStation) {
        chargingStation = child;
      }
    });
    
    // Timeline-based stop charging animation
    this.activeTweens.set(event.id, {
      object,
      chargingStation,
      update: (currentTime: number) => {
        const elapsed = currentTime - event.startTime;
        const progress = Math.min(Math.max(elapsed / event.duration, 0), 1);
        
        // Fade out charging effects
        const fadeOut = 1 - progress;
        
        // Gradually reduce charging glow
        object.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
            child.material.emissive.setHSL(0.33, 1, 0.2 * fadeOut);
          }
        });
        
        // Add disconnection spark effect
        if (progress > 0.8 && Math.random() < 0.2) {
          this.addDisconnectionSpark(object);
        }
        
        if (progress >= 1) {
          // Reset charging effects completely
          object.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
              child.material.emissive.setScalar(0);
            }
          });
          
          // Remove charging station
          if (chargingStation) {
            this.scene.remove(chargingStation);
          }
          
          return false;
        }
        
        return true;
      }
    });
    
    console.log(`Started stop charging animation for ${object.name}, duration: ${event.duration}s`);
  }

  /**
   * Animate numerical effects for numerical planning
   */
  private animateNumericEffect(object: THREE.Object3D, event: AnimationEvent, currentTime: number): void {
    const { operation, function: funcName, value } = event.data;
    
    // Create numerical visualization
    this.activeTweens.set(event.id, {
      object,
      update: (currentTime: number) => {
        const elapsed = currentTime - event.startTime;
        const progress = Math.min(Math.max(elapsed / event.duration, 0), 1);
        
        // Add numerical effect visualization
        if (progress < 0.2) {
          // Show numeric change indicator
          this.addNumericIndicator(object, operation, value, progress / 0.2);
        }
        
        // Apply visual effect based on operation
        const effectIntensity = Math.sin(progress * Math.PI * 2) * 0.2;
        
        switch (operation) {
          case 'increase':
            // Growing effect
            const growScale = 1 + effectIntensity;
            object.scale.setScalar(growScale);
            break;
          case 'decrease':
            // Shrinking effect
            const shrinkScale = 1 - effectIntensity * 0.5;
            object.scale.setScalar(shrinkScale);
            break;
          case 'assign':
            // Color change effect
            object.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
                child.material.emissive.setHSL(0.1, 1, effectIntensity);
              }
            });
            break;
        }
        
        if (progress >= 1) {
          // Reset effects
          object.scale.set(1, 1, 1);
          object.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
              child.material.emissive.setScalar(0);
            }
          });
          return false;
        }
        
        return true;
      }
    });
    
    console.log(`Started numerical effect animation: ${operation} for ${object.name}, duration: ${event.duration}s`);
  }

  /**
   * Add numeric indicator for numerical planning
   */
  private addNumericIndicator(object: THREE.Object3D, operation: string, value: string, progress: number): void {
    const indicator = new THREE.Sprite(
      new THREE.SpriteMaterial({ 
        color: operation === 'increase' ? 0x00ff00 : operation === 'decrease' ? 0xff0000 : 0x0000ff,
        transparent: true, 
        opacity: 0.8 * progress 
      })
    );
    
    indicator.position.copy(object.position);
    indicator.position.y += 2;
    indicator.scale.setScalar(0.5 * progress);
    
    this.scene.add(indicator);
    
    // Remove after animation
    setTimeout(() => {
      this.scene.remove(indicator);
    }, 1000);
  }

  /**
   * Animate custom action with generic visualization
   */
  private animateCustomAction(object: THREE.Object3D, event: AnimationEvent, currentTime: number): void {
    // Simple scale pulse for generic actions
    const originalScale = object.scale.clone();
    
    this.activeTweens.set(event.id, {
      object,
      originalScale,
      update: (currentTime: number) => {
        const elapsed = currentTime - event.startTime;
        const progress = Math.min(Math.max(elapsed / event.duration, 0), 1);
        
        const scale = 1 + 0.1 * Math.sin(progress * Math.PI * 4);
        object.scale.setScalar(scale);
        
        if (progress >= 1) {
          object.scale.copy(originalScale);
          return false;
        }
        
        return true;
      }
    });
  }

  /**
   * Update continuous robot status indicators
   */
  private updateRobotStatusIndicators(): void {
    this.scene.traverse((child) => {
      if (child.userData.pddlObject?.type === 'robot') {
        // Update charging status indicator if robot is charging
        if (child.userData.isCharging) {
          const time = this.clock.getElapsedTime();
          const pulse = Math.sin(time * 3) * 0.5 + 0.5;
          
          // Find status indicator
          const statusIndicator = child.getObjectByName('status_indicator');
          if (statusIndicator instanceof THREE.Mesh && statusIndicator.material instanceof THREE.MeshBasicMaterial) {
            statusIndicator.material.color.setHSL(0.33, 1, 0.3 + pulse * 0.4);
          }
        }
      }
    });
  }

  /**
   * Check for completed animations
   */
  private checkCompletedAnimations(currentTime: number): void {
    const completedEvents = this.pendingEvents.filter(event => 
      event.startTime + event.duration <= currentTime && !this.completedEvents.has(event.id)
    );
    
    completedEvents.forEach(event => {
      this.completeAnimationEvent(event);
    });
  }

  /**
   * Mark animation event as completed
   */
  private completeAnimationEvent(event: AnimationEvent): void {
    this.completedEvents.add(event.id);
    const action = this.activeAnimations.get(event.id);
    if (action) {
      action.stop();
      this.activeAnimations.delete(event.id);
    }
    
    // Trigger battery update when action completes
    if (!this.batteryUpdatedEvents.has(event.id)) {
      if (event.data && (event.data.actionName || event.data.action)) {
        const actionData = event.data.action || {
          name: event.data.actionName,
          args: event.data.args || [event.objectId],
          startTime: event.startTime,
          duration: event.duration
        };
        console.log(`Action completed - updating battery for: ${actionData.name} with args:`, actionData.args);
        this.updateNumericFluentsForAction(actionData);
        this.batteryUpdatedEvents.add(event.id);
      } else if (event.type && ['pick', 'drop', 'move', 'load', 'unload', 'drive', 'fly'].includes(event.type)) {
        const implicitAction = {
          name: event.type,
          args: [event.objectId, ...(event.data?.targetLocation ? [event.data.targetLocation] : [])],
          startTime: event.startTime,
          duration: event.duration
        } as any;
        console.log(`Action completed - updating battery for: ${event.type} on ${event.objectId}`);
        this.updateNumericFluentsForAction(implicitAction);
        this.batteryUpdatedEvents.add(event.id);
      }
    }
  }

  /**
   * Clear all animations
   */
  clearAllAnimations(): void {
    this.activeAnimations.forEach(action => action.stop());
    this.activeAnimations.clear();
    this.activeTweens.clear();
    this.pendingEvents = [];
    this.completedEvents.clear();
    this.batteryUpdatedEvents.clear(); // Reset battery update tracking
  }

  /**
   * Seek to specific time
   */
  seekToTime(time: number): void {
    this.clearAllAnimations();
    
    // Execute all events up to this time
    const eventsToExecute = this.pendingEvents.filter(event => 
      event.startTime <= time && event.startTime + event.duration > time
    );
    
    eventsToExecute.forEach(event => {
      this.executeAnimationEvent(event, time);
    });
  }

  /**
   * Add exhaust smoke effect for trucks
   */
  private addExhaustSmoke(object: THREE.Object3D, progress: number): void {
    // Create simple smoke particle effect
    const smokeInterval = Math.floor(progress * 100) % 10;
    if (smokeInterval === 0) {
      const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ 
          color: 0x666666, 
          transparent: true, 
          opacity: 0.5 
        })
      );
      
      // Position behind the truck
      const exhaustPos = object.position.clone();
      exhaustPos.add(new THREE.Vector3(-0.5, 0.2, 0));
      smoke.position.copy(exhaustPos);
      
      this.scene.add(smoke);
      
      // Animate smoke rising and fading
      const smokeAnimation = () => {
        smoke.position.y += 0.02;
        smoke.material.opacity *= 0.95;
        
        if (smoke.material.opacity > 0.01) {
          requestAnimationFrame(smokeAnimation);
        } else {
          this.scene.remove(smoke);
        }
      };
      smokeAnimation();
    }
  }

  /**
   * Add contrails effect for airplanes
   */
  private addContrails(object: THREE.Object3D, progress: number): void {
    // Create contrail trail effect
    const trailInterval = Math.floor(progress * 100) % 5;
    if (trailInterval === 0) {
      const contrail = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 6, 6),
        new THREE.MeshBasicMaterial({ 
          color: 0xffffff, 
          transparent: true, 
          opacity: 0.8 
        })
      );
      
      // Position behind the airplane
      const trailPos = object.position.clone();
      trailPos.add(new THREE.Vector3(0, -0.2, -1));
      contrail.position.copy(trailPos);
      
      this.scene.add(contrail);
      
      // Animate contrail fading
      const contrailAnimation = () => {
        contrail.material.opacity *= 0.98;
        contrail.scale.multiplyScalar(1.01);
        
        if (contrail.material.opacity > 0.01) {
          requestAnimationFrame(contrailAnimation);
        } else {
          this.scene.remove(contrail);
        }
      };
      contrailAnimation();
    }
  }

  /**
   * Add electrical spark effect for charging
   */
  private addElectricalSpark(robot: THREE.Object3D, chargingStation: THREE.Object3D): void {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 6, 6),
      new THREE.MeshBasicMaterial({ 
        color: 0xffff00, 
        transparent: true, 
        opacity: 1.0 
      })
    );
    
    // Position spark between robot and charging station
    const robotPos = robot.position.clone();
    const stationPos = chargingStation.position.clone();
    const sparkPos = robotPos.clone().lerp(stationPos, 0.5 + (Math.random() - 0.5) * 0.4);
    sparkPos.y += Math.random() * 0.5;
    spark.position.copy(sparkPos);
    
    this.scene.add(spark);
    
    // Animate spark
    const sparkAnimation = () => {
      spark.material.opacity *= 0.9;
      spark.scale.multiplyScalar(1.05);
      
      if (spark.material.opacity > 0.01) {
        requestAnimationFrame(sparkAnimation);
      } else {
        this.scene.remove(spark);
      }
    };
    sparkAnimation();
  }

  /**
   * Add disconnection spark effect
   */
  private addDisconnectionSpark(robot: THREE.Object3D): void {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshBasicMaterial({ 
        color: 0xff4400, 
        transparent: true, 
        opacity: 1.0 
      })
    );
    
    // Position spark near robot
    const sparkPos = robot.position.clone();
    sparkPos.add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      Math.random() * 0.5,
      Math.random() * 0.5
    ));
    spark.position.copy(sparkPos);
    
    this.scene.add(spark);
    
    // Animate spark
    const sparkAnimation = () => {
      spark.material.opacity *= 0.85;
      spark.position.y += 0.01;
      
      if (spark.material.opacity > 0.01) {
        requestAnimationFrame(sparkAnimation);
      } else {
        this.scene.remove(spark);
      }
    };
    sparkAnimation();
  }

  /**
   * Animate robot arms for pick/drop actions
   */
  private animateRobotArms(robot: THREE.Object3D, action: 'reaching' | 'grasping' | 'lifting', progress: number): void {
    robot.traverse((child) => {
      if (child.name === 'leftArm' || child.name === 'rightArm') {
        switch (action) {
          case 'reaching':
            child.rotation.x = -0.5 * progress;
            child.rotation.z = child.name === 'leftArm' ? -0.3 * progress : 0.3 * progress;
            break;
          case 'grasping':
            child.rotation.x = -0.5 + 0.2 * progress;
            child.rotation.y = (child.name === 'leftArm' ? -1 : 1) * 0.2 * progress;
            break;
          case 'lifting':
            child.rotation.x = -0.3 - 0.4 * progress;
            child.rotation.z = child.name === 'leftArm' ? -0.2 : 0.2;
            break;
        }
      }
    });
  }

  /**
   * Add pickup beam effect
   */
  private addPickupBeam(robot: THREE.Object3D, target: THREE.Object3D): void {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, robot.position.distanceTo(target.position), 8),
      new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.6 
      })
    );
    
    // Position beam between robot and target
    const midPoint = robot.position.clone().lerp(target.position, 0.5);
    beam.position.copy(midPoint);
    beam.lookAt(target.position);
    beam.rotateX(Math.PI / 2);
    
    this.scene.add(beam);
    
    // Animate beam
    setTimeout(() => {
      this.scene.remove(beam);
    }, 200);
  }

  /**
   * Add pickup completion effect
   */
  private addPickupCompleteEffect(robot: THREE.Object3D): void {
    const effect = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.4, 16),
      new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.8 
      })
    );
    
    effect.position.copy(robot.position);
    effect.position.y += 1.5;
    effect.rotation.x = -Math.PI / 2;
    
    this.scene.add(effect);
    
    // Animate effect
    const effectAnimation = () => {
      effect.material.opacity *= 0.9;
      effect.scale.multiplyScalar(1.02);
      
      if (effect.material.opacity > 0.01) {
        requestAnimationFrame(effectAnimation);
      } else {
        this.scene.remove(effect);
      }
    };
    effectAnimation();
  }

  /**
   * Check durative-action conditions for temporal domains
   */
  private checkDurativeConditions(action: PlanAction): boolean {
    // Access store through global reference
    const store = (window as any).__planStore;
    if (!store) return true;
    
    const numericFluents = store.getState().numericFluents;
    
    // Check battery condition for move actions (battery > 20)
    if (action.name.toLowerCase() === 'move' && action.args && action.args.length > 0) {
      const robotId = action.args[0].toLowerCase();
      const batteryKey = `battery_${robotId}`;
      const batteryFluent = numericFluents[batteryKey];
      
      if (batteryFluent && batteryFluent.value <= 20) {
        console.warn(`Cannot execute move action for ${robotId}: insufficient battery (${batteryFluent.value} <= 20)`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Update numeric fluents based on action execution
   */
  private updateNumericFluentsForAction(action: PlanAction): void {
    // Try multiple ways to access the store
    let store = (window as any).__planStore;
    
    if (!store) {
      // Try to get store from global scope
      const globalStore = (window as any).planStore;
      if (globalStore) {
        store = globalStore;
      } else {
        // Import directly and access
        try {
          const { usePlanStore } = require('../store/planStore');
          store = { getState: () => usePlanStore.getState() };
        } catch (error) {
          console.warn('Could not access plan store for battery updates:', error);
          return;
        }
      }
    }
    
    try {
      console.log(`Triggering battery update for action: ${action.name} with args:`, action.args);
      store.getState().updateNumericFluentsFromAction(action);
    } catch (error) {
      console.error('Error updating numeric fluents:', error);
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clearAllAnimations();
    this.mixer.uncacheRoot(this.scene);
  }
}