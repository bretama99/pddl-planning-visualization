
import * as THREE from 'three'

export class Movement {
  constructor() {
    this.pathfinder = new Pathfinder()
  }
  
  // Calculate smooth movement path
  calculateSmoothPath(start, end, obstacles = []) {
    // Simple A* pathfinding implementation
    const path = this.pathfinder.findPath(start, end, obstacles)
    
    // Smooth the path using Catmull-Rom splines
    return this.smoothPath(path)
  }
  
  smoothPath(waypoints) {
    if (waypoints.length < 3) return waypoints
    
    const smoothedPath = []
    const segments = 20 // Number of points between each waypoint
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p0 = waypoints[Math.max(0, i - 1)]
      const p1 = waypoints[i]
      const p2 = waypoints[i + 1]
      const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)]
      
      for (let t = 0; t < segments; t++) {
        const u = t / segments
        const point = this.catmullRom(p0, p1, p2, p3, u)
        smoothedPath.push(point)
      }
    }
    
    smoothedPath.push(waypoints[waypoints.length - 1])
    return smoothedPath
  }
  
  catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t
    const t3 = t2 * t
    
    const v0 = new THREE.Vector3().subVectors(p2, p0).multiplyScalar(0.5)
    const v1 = new THREE.Vector3().subVectors(p3, p1).multiplyScalar(0.5)
    
    const x = (2 * p1.x - 2 * p2.x + v0.x + v1.x) * t3 + 
              (-3 * p1.x + 3 * p2.x - 2 * v0.x - v1.x) * t2 + 
              v0.x * t + p1.x
              
    const y = (2 * p1.y - 2 * p2.y + v0.y + v1.y) * t3 + 
              (-3 * p1.y + 3 * p2.y - 2 * v0.y - v1.y) * t2 + 
              v0.y * t + p1.y
              
    const z = (2 * p1.z - 2 * p2.z + v0.z + v1.z) * t3 + 
              (-3 * p1.z + 3 * p2.z - 2 * v0.z - v1.z) * t2 + 
              v0.z * t + p1.z
    
    return new THREE.Vector3(x, y, z)
  }
  
  // Calculate movement duration based on distance and speed
  calculateMovementDuration(start, end, speed = 1) {
    const distance = start.distanceTo(end)
    return distance / speed
  }
  
  // Interpolate between positions
  interpolatePosition(start, end, t) {
    return new THREE.Vector3().lerpVectors(start, end, t)
  }
  
  // Calculate facing direction
  calculateFacingDirection(from, to) {
    const direction = new THREE.Vector3().subVectors(to, from).normalize()
    return Math.atan2(direction.x, direction.z)
  }
}

class Pathfinder {
  constructor() {
    this.grid = null
    this.gridSize = 0.5 // Grid resolution
  }
  
  findPath(start, end, obstacles = []) {
    // Simple pathfinding - for more complex scenarios, implement A*
    const path = [start]
    
    // Check if direct path is clear
    if (this.isDirectPathClear(start, end, obstacles)) {
      path.push(end)
      return path
    }
    
    // Simple obstacle avoidance
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    
    // Try going around obstacles
    const offset = new THREE.Vector3(2, 0, 2)
    const waypoint1 = midpoint.clone().add(offset)
    const waypoint2 = midpoint.clone().sub(offset)
    
    if (this.isDirectPathClear(start, waypoint1, obstacles) && 
        this.isDirectPathClear(waypoint1, end, obstacles)) {
      path.push(waypoint1)
    } else if (this.isDirectPathClear(start, waypoint2, obstacles) && 
               this.isDirectPathClear(waypoint2, end, obstacles)) {
      path.push(waypoint2)
    }
    
    path.push(end)
    return path
  }
  
  isDirectPathClear(start, end, obstacles) {
    const distance = start.distanceTo(end)
    const steps = Math.ceil(distance / this.gridSize)
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const point = new THREE.Vector3().lerpVectors(start, end, t)
      
      // Check collision with obstacles
      for (const obstacle of obstacles) {
        if (this.isPointInObstacle(point, obstacle)) {
          return false
        }
      }
    }
    
    return true
  }
  
  isPointInObstacle(point, obstacle) {
    const box = new THREE.Box3().setFromObject(obstacle)
    return box.containsPoint(point)
  }
}