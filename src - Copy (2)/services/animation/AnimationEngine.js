import * as THREE from 'three'
import { gsap } from 'gsap'

export class AnimationEngine {
  constructor(scene, renderer) {
    this.scene = scene
    this.renderer = renderer
    this.activeAnimations = new Map()
    this.timeline = gsap.timeline()
    this.isPlaying = false
    this.speed = 1
    
    this.initializeEngine()
  }
  
  initializeEngine() {
    // Set up animation mixer
    this.mixer = new THREE.AnimationMixer(this.scene)
    this.clock = new THREE.Clock()
    
    // Configure GSAP
    gsap.config({
      force3D: true,
      nullTargetWarn: false
    })
  }
  
  // Robot movement animations
  animateMovement(robot, fromPosition, toPosition, duration, onComplete) {
    const animationId = `movement-${Date.now()}`
    
    // Calculate path
    const path = this.calculatePath(fromPosition, toPosition)
    
    // Create movement timeline
    const movementTimeline = gsap.timeline({
      onComplete: () => {
        this.activeAnimations.delete(animationId)
        if (onComplete) onComplete()
      }
    })
    
    // Rotation to face target
    const targetRotation = Math.atan2(
      toPosition.z - fromPosition.z,
      toPosition.x - fromPosition.x
    )
    
    movementTimeline.to(robot.rotation, {
      duration: duration * 0.2,
      y: targetRotation,
      ease: "power2.out"
    })
    
    // Movement animation with path following
    movementTimeline.to(robot.position, {
      duration: duration * 0.8,
      motionPath: {
        path: path,
        autoRotate: false
      },
      ease: "power2.inOut"
    }, "-=0.1")
    
    // Add walking animation
    this.addWalkingAnimation(robot, duration * 0.8)
    
    this.activeAnimations.set(animationId, movementTimeline)
    return animationId
  }
  
  // Object manipulation animations
  animatePickup(robot, object, duration, onComplete) {
    const animationId = `pickup-${Date.now()}`
    
    const pickupTimeline = gsap.timeline({
      onComplete: () => {
        this.activeAnimations.delete(animationId)
        if (onComplete) onComplete()
      }
    })
    
    // Robot arm movement
    const leftArm = robot.getObjectByName('leftArm')
    const rightArm = robot.getObjectByName('rightArm')
    
    if (leftArm && rightArm) {
      // Extend arms
      pickupTimeline.to([leftArm.rotation, rightArm.rotation], {
        duration: duration * 0.3,
        z: Math.PI / 4,
        ease: "power2.out"
      })
      
      // Lift object
      pickupTimeline.to(object.position, {
        duration: duration * 0.4,
        y: robot.position.y + 1.2,
        ease: "power2.inOut"
      }, "-=0.1")
      
      // Attach object to robot
      pickupTimeline.call(() => {
        robot.add(object)
        object.position.set(0, 1.2, 0.5)
      })
      
      // Retract arms
      pickupTimeline.to([leftArm.rotation, rightArm.rotation], {
        duration: duration * 0.3,
        z: 0,
        ease: "power2.in"
      })
    }
    
    this.activeAnimations.set(animationId, pickupTimeline)
    return animationId
  }
  
  animatePutdown(robot, object, targetPosition, duration, onComplete) {
    const animationId = `putdown-${Date.now()}`
    
    const putdownTimeline = gsap.timeline({
      onComplete: () => {
        this.activeAnimations.delete(animationId)
        if (onComplete) onComplete()
      }
    })
    
    const leftArm = robot.getObjectByName('leftArm')
    const rightArm = robot.getObjectByName('rightArm')
    
    if (leftArm && rightArm) {
      // Extend arms
      putdownTimeline.to([leftArm.rotation, rightArm.rotation], {
        duration: duration * 0.3,
        z: Math.PI / 4,
        ease: "power2.out"
      })
      
      // Detach and place object
      putdownTimeline.call(() => {
        this.scene.add(object)
        object.position.copy(targetPosition)
        object.position.y = robot.position.y + 1.2
      })
      
      // Lower object
      putdownTimeline.to(object.position, {
        duration: duration * 0.4,
        y: targetPosition.y,
        ease: "power2.inOut"
      })
      
      // Retract arms
      putdownTimeline.to([leftArm.rotation, rightArm.rotation], {
        duration: duration * 0.3,
        z: 0,
        ease: "power2.in"
      })
    }
    
    this.activeAnimations.set(animationId, putdownTimeline)
    return animationId
  }
  
  // Helper animations
  addWalkingAnimation(robot, duration) {
    const walkTimeline = gsap.timeline({ repeat: -1, yoyo: true })
    
    // Simple bobbing motion
    walkTimeline.to(robot.position, {
      duration: 0.3,
      y: robot.position.y + 0.05,
      ease: "power2.inOut"
    })
    
    // Stop walking after duration
    gsap.delayedCall(duration, () => {
      walkTimeline.kill()
      gsap.to(robot.position, {
        duration: 0.2,
        y: robot.position.y,
        ease: "power2.out"
      })
    })
  }
  
  addBreathingAnimation(robot) {
    const breathingTimeline = gsap.timeline({ repeat: -1, yoyo: true })
    
    breathingTimeline.to(robot.scale, {
      duration: 2,
      y: 1.02,
      ease: "power2.inOut"
    })
    
    return breathingTimeline
  }
  
  // Path calculation
  calculatePath(from, to) {
    const pathPoints = []
    const segments = 10
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const x = from.x + (to.x - from.x) * t
      const z = from.z + (to.z - from.z) * t
      
      // Add slight curve for more natural movement
      const curve = Math.sin(t * Math.PI) * 0.2
      
      pathPoints.push({
        x: x + curve,
        y: from.y,
        z: z
      })
    }
    
    return pathPoints
  }
  
  // Playback controls
  play() {
    this.isPlaying = true
    this.timeline.play()
    this.activeAnimations.forEach(animation => animation.play())
  }
  
  pause() {
    this.isPlaying = false
    this.timeline.pause()
    this.activeAnimations.forEach(animation => animation.pause())
  }
  
  stop() {
    this.isPlaying = false
    this.timeline.pause().seek(0)
    this.activeAnimations.forEach(animation => animation.kill())
    this.activeAnimations.clear()
  }
  
  setSpeed(speed) {
    this.speed = speed
    this.timeline.timeScale(speed)
    this.activeAnimations.forEach(animation => animation.timeScale(speed))
  }
  
  seekTo(time) {
    this.timeline.seek(time)
  }
  
  // Cleanup
  dispose() {
    this.stop()
    this.timeline.kill()
    this.mixer.stopAllAction()
  }
  
  // Update loop
  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime)
    }
  }
}