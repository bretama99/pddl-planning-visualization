/**
 * Inverse Kinematics System for Robot Arm Movements
 * Implements realistic arm positioning for pick/drop actions
 */

import * as THREE from 'three';

export interface IKChain {
  joints: THREE.Object3D[];
  lengths: number[];
  constraints: { min: number; max: number }[];
  endEffector: THREE.Object3D;
}

export class InverseKinematics {
  private chains: Map<string, IKChain> = new Map();
  private maxIterations = 10;
  private tolerance = 0.01;

  /**
   * Register an IK chain for a robot arm
   */
  registerChain(robotId: string, chain: IKChain): void {
    this.chains.set(robotId, chain);
  }

  /**
   * Create IK chain for humanoid robot arm
   */
  createArmChain(robot: THREE.Group, isRightArm: boolean = true): IKChain {
    const armPrefix = isRightArm ? 'right' : 'left';
    const side = isRightArm ? 1 : -1;
    
    console.log(`Creating IK chain for ${robot.name} ${armPrefix} arm`);
    
    // Find arm joints in the robot - try multiple naming conventions
    let shoulder = robot.getObjectByName(`${armPrefix}_shoulder`) || 
                   robot.getObjectByName(`${armPrefix}Shoulder`) ||
                   robot.getObjectByName(`shoulder_${armPrefix}`);
    
    let upperArm = robot.getObjectByName(`${armPrefix}_upper_arm`) || 
                   robot.getObjectByName(`${armPrefix}UpperArm`) ||
                   robot.getObjectByName(`upper_arm_${armPrefix}`);
    
    let lowerArm = robot.getObjectByName(`${armPrefix}_lower_arm`) || 
                   robot.getObjectByName(`${armPrefix}LowerArm`) ||
                   robot.getObjectByName(`lower_arm_${armPrefix}`) ||
                   robot.getObjectByName(`${armPrefix}_elbow`);
    
    let hand = robot.getObjectByName(`${armPrefix}_hand`) || 
               robot.getObjectByName(`${armPrefix}Hand`) ||
               robot.getObjectByName(`hand_${armPrefix}`);

    // If we can't find specific joints, create a simplified IK chain using available parts
    if (!shoulder || !upperArm || !lowerArm || !hand) {
      console.warn(`Could not find all arm joints for ${armPrefix} arm. Available objects:`, 
        Array.from(robot.children).map(child => child.name));
      
      // Create a simplified chain with available parts
      let torso = robot.getObjectByName('torso') || robot.getObjectByName('body');
      
      // If no torso, use the robot group itself as a fallback
      if (!torso) {
        const availableChildren = Array.from(robot.children).map(child => child.name).filter(name => name);
        console.log(`Available robot parts for ${robot.name}:`, availableChildren);
        
        // Try to find any part that could serve as a joint
        torso = robot.children.find(child => 
          child.name && (
            child.name.includes('torso') || 
            child.name.includes('body') || 
            child.name.includes('shoulder') ||
            child.name.includes('arm')
          )
        ) || robot.children[0]; // Use first child as fallback
      }
      
      if (torso) {
        const mockChain: IKChain = {
          joints: [torso],
          lengths: [0.5],
          constraints: [{ min: -Math.PI / 4, max: Math.PI / 4 }],
          endEffector: torso
        };
        this.chains.set(robot.name + '_' + armPrefix, mockChain);
        console.log(`Created simplified IK chain for ${robot.name}_${armPrefix} using ${torso.name || 'unnamed part'}`);
        return mockChain;
      } else {
        // Create a minimal chain using the robot itself
        const fallbackChain: IKChain = {
          joints: [robot],
          lengths: [0.5],
          constraints: [{ min: -Math.PI / 4, max: Math.PI / 4 }],
          endEffector: robot
        };
        this.chains.set(robot.name + '_' + armPrefix, fallbackChain);
        console.log(`Created fallback IK chain for ${robot.name}_${armPrefix} using robot group`);
        return fallbackChain;
      }
    }

    const chain: IKChain = {
      joints: [shoulder, upperArm, lowerArm],
      lengths: [0.3, 0.35, 0.25], // Upper arm, lower arm, hand lengths
      constraints: [
        { min: -Math.PI / 2, max: Math.PI / 2 }, // Shoulder rotation
        { min: -Math.PI, max: 0 }, // Elbow (can only bend one way)
        { min: -Math.PI / 4, max: Math.PI / 4 } // Wrist rotation
      ],
      endEffector: hand
    };

    this.chains.set(robot.name + '_' + armPrefix, chain);
    return chain;
  }

  /**
   * Solve IK to position end effector at target
   */
  solveIK(robotId: string, targetPosition: THREE.Vector3, armSide: 'left' | 'right' = 'right'): boolean {
    const chainId = `${robotId}_${armSide}`;
    const chain = this.chains.get(chainId);
    
    if (!chain) {
      console.warn(`No IK chain found for ${chainId}`);
      return false;
    }

    // Convert target to local space of the first joint
    const localTarget = chain.joints[0].worldToLocal(targetPosition.clone());
    
    // Use FABRIK (Forward And Backward Reaching Inverse Kinematics)
    return this.solveFABRIK(chain, localTarget);
  }

  /**
   * FABRIK algorithm implementation
   */
  private solveFABRIK(chain: IKChain, target: THREE.Vector3): boolean {
    const positions: THREE.Vector3[] = [];
    const { joints, lengths } = chain;
    
    // Get initial joint positions
    for (let i = 0; i < joints.length; i++) {
      positions.push(joints[i].position.clone());
    }
    
    // Add end effector position
    positions.push(chain.endEffector.position.clone());
    
    // Check if target is reachable
    const totalLength = lengths.reduce((sum, len) => sum + len, 0);
    const distance = positions[0].distanceTo(target);
    
    if (distance > totalLength) {
      // Target is too far, stretch towards it
      this.stretchToTarget(positions, target, lengths);
      this.applyPositionsToJoints(chain, positions);
      return false;
    }
    
    // FABRIK iterations
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      // Forward reaching
      positions[positions.length - 1] = target.clone();
      
      for (let i = positions.length - 2; i >= 0; i--) {
        const direction = positions[i].clone().sub(positions[i + 1]).normalize();
        positions[i] = positions[i + 1].clone().add(direction.multiplyScalar(lengths[i]));
      }
      
      // Backward reaching
      const root = positions[0].clone();
      
      for (let i = 1; i < positions.length; i++) {
        const direction = positions[i].clone().sub(positions[i - 1]).normalize();
        positions[i] = positions[i - 1].clone().add(direction.multiplyScalar(lengths[i - 1]));
      }
      
      // Check convergence
      if (positions[positions.length - 1].distanceTo(target) < this.tolerance) {
        this.applyPositionsToJoints(chain, positions);
        return true;
      }
    }
    
    this.applyPositionsToJoints(chain, positions);
    return false;
  }

  /**
   * Stretch arm towards unreachable target
   */
  private stretchToTarget(positions: THREE.Vector3[], target: THREE.Vector3, lengths: number[]): void {
    const direction = target.clone().sub(positions[0]).normalize();
    
    for (let i = 1; i < positions.length; i++) {
      const offset = direction.clone().multiplyScalar(lengths[i - 1]);
      positions[i] = positions[i - 1].clone().add(offset);
    }
  }

  /**
   * Apply calculated positions to joint rotations
   */
  private applyPositionsToJoints(chain: IKChain, positions: THREE.Vector3[]): void {
    for (let i = 0; i < chain.joints.length; i++) {
      const joint = chain.joints[i];
      const currentPos = positions[i];
      const nextPos = positions[i + 1];
      
      // Calculate rotation to point towards next position
      const direction = nextPos.clone().sub(currentPos).normalize();
      const currentDirection = new THREE.Vector3(0, 0, 1);
      
      // Calculate rotation quaternion
      const quaternion = new THREE.Quaternion().setFromUnitVectors(currentDirection, direction);
      
      // Apply constraints
      const euler = new THREE.Euler();
      euler.setFromQuaternion(quaternion);
      const constraint = chain.constraints[i];
      
      if (constraint) {
        euler.x = THREE.MathUtils.clamp(euler.x, constraint.min, constraint.max);
        euler.y = THREE.MathUtils.clamp(euler.y, constraint.min, constraint.max);
        euler.z = THREE.MathUtils.clamp(euler.z, constraint.min, constraint.max);
      }
      
      joint.rotation.copy(euler);
    }
  }

  /**
   * Animate arm to target position over time
   */
  animateToTarget(
    robotId: string, 
    targetPosition: THREE.Vector3, 
    duration: number = 1000,
    armSide: 'left' | 'right' = 'right'
  ): Promise<void> {
    const chainId = `${robotId}_${armSide}`;
    const chain = this.chains.get(chainId);
    
    if (!chain) {
      return Promise.reject(`No IK chain found for ${chainId}`);
    }

    return new Promise((resolve) => {
      const startTime = performance.now();
      const initialRotations = chain.joints.map(joint => joint.rotation.clone());
      
      // Calculate target rotations
      const targetFound = this.solveIK(robotId, targetPosition, armSide);
      const targetRotations = chain.joints.map(joint => joint.rotation.clone());
      
      // Restore initial rotations for animation
      chain.joints.forEach((joint, i) => {
        joint.rotation.copy(initialRotations[i]);
      });
      
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smooth animation
        const eased = this.easeInOutCubic(progress);
        
        // Interpolate between initial and target rotations
        chain.joints.forEach((joint, i) => {
          joint.rotation.copy(initialRotations[i]);
          joint.rotation.x += (targetRotations[i].x - initialRotations[i].x) * eased;
          joint.rotation.y += (targetRotations[i].y - initialRotations[i].y) * eased;
          joint.rotation.z += (targetRotations[i].z - initialRotations[i].z) * eased;
        });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * Easing function for smooth animations
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  /**
   * Get natural reaching position for objects
   */
  getReachingPosition(robot: THREE.Group, targetObject: THREE.Object3D): THREE.Vector3 {
    const robotPosition = robot.position;
    const targetPosition = targetObject.position;
    
    // Calculate natural reaching point (slightly above and in front of target)
    const reachOffset = new THREE.Vector3(0, 0.3, 0.2);
    const worldReachPosition = targetPosition.clone().add(reachOffset);
    
    return worldReachPosition;
  }

  /**
   * Dispose of IK chains
   */
  dispose(): void {
    this.chains.clear();
  }
}