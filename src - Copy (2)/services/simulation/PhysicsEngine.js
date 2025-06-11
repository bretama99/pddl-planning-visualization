/**
 * PhysicsEngine.js
 * Real-time physics simulation engine for PDDL visualizations
 * Handles collision detection, movement calculations, and realistic animations
 */

import * as THREE from 'three'

export class PhysicsEngine {
  constructor(scene = null, options = {}) {
    this.scene = scene
    this.options = {
      gravity: -9.81,
      friction: 0.95,
      airResistance: 0.99,
      timeStep: 1/60,
      maxVelocity: 50,
      collisionThreshold: 0.1,
      ...options
    }
    
    // Physics objects registry
    this.physicsObjects = new Map()
    this.collisionPairs = []
    this.constraints = []
    
    // Spatial partitioning for optimization
    this.spatialGrid = new SpatialGrid(100, 100, 10) // 100x100 grid with cell size 10
    
    // Performance tracking
    this.lastUpdateTime = 0
    this.frameTime = 0
    this.isRunning = false
    
    // Event system
    this.eventListeners = new Map()
    
    this.init()
  }
  
  init() {
    console.log('PhysicsEngine initialized with options:', this.options)
  }
  
  /**
   * Register a physics object for simulation
   */
  addPhysicsObject(mesh, properties = {}) {
    const defaultProperties = {
      mass: 1,
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      angularVelocity: new THREE.Vector3(0, 0, 0),
      angularAcceleration: new THREE.Vector3(0, 0, 0),
      isStatic: false,
      isKinematic: false,
      bounciness: 0.3,
      friction: 0.7,
      shape: 'box', // box, sphere, cylinder, capsule
      collisionLayer: 0,
      collisionMask: 0xFFFFFFFF,
      onCollision: null,
      onTrigger: null
    }
    
    const physicsProps = { ...defaultProperties, ...properties }
    
    // Calculate bounding box and collision shape
    const boundingBox = new THREE.Box3().setFromObject(mesh)
    const size = boundingBox.getSize(new THREE.Vector3())
    
    physicsProps.boundingBox = boundingBox
    physicsProps.collisionShape = this.createCollisionShape(physicsProps.shape, size)
    physicsProps.mesh = mesh
    physicsProps.id = mesh.uuid
    
    this.physicsObjects.set(mesh.uuid, physicsProps)
    
    // Add to spatial grid
    this.spatialGrid.addObject(mesh.uuid, mesh.position)
    
    return physicsProps
  }
  
  /**
   * Remove physics object from simulation
   */
  removePhysicsObject(mesh) {
    const id = mesh.uuid
    this.physicsObjects.delete(id)
    this.spatialGrid.removeObject(id)
  }
  
  /**
   * Create collision shape based on type
   */
  createCollisionShape(shapeType, size) {
    switch (shapeType) {
      case 'sphere':
        return {
          type: 'sphere',
          radius: Math.max(size.x, size.y, size.z) / 2
        }
      case 'cylinder':
        return {
          type: 'cylinder',
          radius: Math.max(size.x, size.z) / 2,
          height: size.y
        }
      case 'capsule':
        return {
          type: 'capsule',
          radius: Math.max(size.x, size.z) / 2,
          height: size.y
        }
      case 'box':
      default:
        return {
          type: 'box',
          width: size.x,
          height: size.y,
          depth: size.z
        }
    }
  }
  
  /**
   * Start physics simulation
   */
  start() {
    this.isRunning = true
    this.lastUpdateTime = performance.now()
    this.update()
  }
  
  /**
   * Stop physics simulation
   */
  stop() {
    this.isRunning = false
  }
  
  /**
   * Main update loop
   */
  update() {
    if (!this.isRunning) return
    
    const currentTime = performance.now()
    const deltaTime = Math.min((currentTime - this.lastUpdateTime) / 1000, this.options.timeStep * 4)
    this.lastUpdateTime = currentTime
    this.frameTime = deltaTime
    
    // Update all physics objects
    this.updatePhysicsObjects(deltaTime)
    
    // Detect and resolve collisions
    this.detectCollisions()
    this.resolveCollisions()
    
    // Update constraints
    this.updateConstraints()
    
    // Update spatial grid
    this.updateSpatialGrid()
    
    // Continue loop
    requestAnimationFrame(() => this.update())
  }
  
  /**
   * Update all physics objects
   */
  updatePhysicsObjects(deltaTime) {
    for (const [obj] of this.physicsObjects) {
      if (obj.isStatic) continue
      
      // Apply gravity
      if (!obj.isKinematic) {
        obj.acceleration.y += this.options.gravity
      }
      
      // Update velocity
      obj.velocity.add(obj.acceleration.clone().multiplyScalar(deltaTime))
      
      // Apply friction and air resistance
      obj.velocity.multiplyScalar(this.options.airResistance)
      
      // Clamp velocity
      if (obj.velocity.length() > this.options.maxVelocity) {
        obj.velocity.normalize().multiplyScalar(this.options.maxVelocity)
      }
      
      // Update position
      const displacement = obj.velocity.clone().multiplyScalar(deltaTime)
      obj.mesh.position.add(displacement)
      
      // Update angular velocity and rotation
      obj.angularVelocity.add(obj.angularAcceleration.clone().multiplyScalar(deltaTime))
      obj.angularVelocity.multiplyScalar(this.options.friction)
      
      const angularDisplacement = obj.angularVelocity.clone().multiplyScalar(deltaTime)
      obj.mesh.rotation.x += angularDisplacement.x
      obj.mesh.rotation.y += angularDisplacement.y
      obj.mesh.rotation.z += angularDisplacement.z
      
      // Reset acceleration for next frame
      obj.acceleration.set(0, 0, 0)
      obj.angularAcceleration.set(0, 0, 0)
      
      // Update bounding box
      obj.boundingBox.setFromObject(obj.mesh)
    }
  }
  
  /**
   * Detect collisions between objects
   */
  detectCollisions() {
    this.collisionPairs = []
    
    // Get potentially colliding objects from spatial grid
    const potentialPairs = this.spatialGrid.getBroadPhasePairs()
    
    for (const [id1, id2] of potentialPairs) {
      const obj1 = this.physicsObjects.get(id1)
      const obj2 = this.physicsObjects.get(id2)
      
      if (!obj1 || !obj2) continue
      if (obj1.isStatic && obj2.isStatic) continue
      
      // Check collision layers
      if (!(obj1.collisionLayer & obj2.collisionMask) && 
          !(obj2.collisionLayer & obj1.collisionMask)) continue
      
      const collision = this.checkCollision(obj1, obj2)
      if (collision) {
        this.collisionPairs.push(collision)
        
        // Trigger collision events
        if (obj1.onCollision) obj1.onCollision(collision, obj2)
        if (obj2.onCollision) obj2.onCollision(collision, obj1)
        
        this.emit('collision', { collision, obj1, obj2 })
      }
    }
  }
  
  /**
   * Check collision between two objects
   */
  checkCollision(obj1, obj2) {
    const shape1 = obj1.collisionShape
    const shape2 = obj2.collisionShape
    
    // Box-Box collision
    if (shape1.type === 'box' && shape2.type === 'box') {
      return this.checkBoxBoxCollision(obj1, obj2)
    }
    
    // Sphere-Sphere collision
    if (shape1.type === 'sphere' && shape2.type === 'sphere') {
      return this.checkSphereSphereCollision(obj1, obj2)
    }
    
    // Box-Sphere collision
    if ((shape1.type === 'box' && shape2.type === 'sphere') ||
        (shape1.type === 'sphere' && shape2.type === 'box')) {
      return this.checkBoxSphereCollision(obj1, obj2)
    }
    
    // Default to bounding box intersection
    return this.checkBoundingBoxCollision(obj1, obj2)
  }
  
  /**
   * Box-Box collision detection
   */
  checkBoxBoxCollision(obj1, obj2) {
    const box1 = obj1.boundingBox
    const box2 = obj2.boundingBox
    
    if (!box1.intersectsBox(box2)) return null
    
    const overlap = new THREE.Vector3()
    const center1 = box1.getCenter(new THREE.Vector3())
    const center2 = box2.getCenter(new THREE.Vector3())
    const size1 = box1.getSize(new THREE.Vector3())
    const size2 = box2.getSize(new THREE.Vector3())
    
    const distance = center1.clone().sub(center2)
    const totalSize = size1.clone().add(size2).multiplyScalar(0.5)
    
    overlap.x = totalSize.x - Math.abs(distance.x)
    overlap.y = totalSize.y - Math.abs(distance.y)
    overlap.z = totalSize.z - Math.abs(distance.z)
    
    // Find minimum overlap axis
    const normal = new THREE.Vector3()
    if (overlap.x < overlap.y && overlap.x < overlap.z) {
      normal.x = distance.x > 0 ? 1 : -1
      overlap.y = overlap.z = 0
    } else if (overlap.y < overlap.z) {
      normal.y = distance.y > 0 ? 1 : -1
      overlap.x = overlap.z = 0
    } else {
      normal.z = distance.z > 0 ? 1 : -1
      overlap.x = overlap.y = 0
    }
    
    return {
      obj1,
      obj2,
      normal,
      overlap,
      penetration: Math.min(overlap.x, overlap.y, overlap.z),
      contactPoint: center1.clone().add(center2).multiplyScalar(0.5)
    }
  }
  
  /**
   * Sphere-Sphere collision detection
   */
  checkSphereSphereCollision(obj1, obj2) {
    const center1 = obj1.mesh.position
    const center2 = obj2.mesh.position
    const radius1 = obj1.collisionShape.radius
    const radius2 = obj2.collisionShape.radius
    
    const distance = center1.distanceTo(center2)
    const totalRadius = radius1 + radius2
    
    if (distance >= totalRadius) return null
    
    const direction = center2.clone().sub(center1).normalize()
    const penetration = totalRadius - distance
    
    return {
      obj1,
      obj2,
      normal: direction,
      penetration,
      contactPoint: center1.clone().add(direction.clone().multiplyScalar(radius1))
    }
  }
  
  /**
   * Box-Sphere collision detection
   */
  checkBoxSphereCollision(obj1, obj2) {
    // Determine which is box and which is sphere
    const boxObj = obj1.collisionShape.type === 'box' ? obj1 : obj2
    const sphereObj = obj1.collisionShape.type === 'sphere' ? obj1 : obj2
    
    const boxCenter = boxObj.mesh.position
    const sphereCenter = sphereObj.mesh.position
    const sphereRadius = sphereObj.collisionShape.radius
    
    // Find closest point on box to sphere center
    const boxSize = boxObj.collisionShape
    const halfExtents = new THREE.Vector3(boxSize.width/2, boxSize.height/2, boxSize.depth/2)
    
    const relativePos = sphereCenter.clone().sub(boxCenter)
    const closestPoint = new THREE.Vector3(
      THREE.MathUtils.clamp(relativePos.x, -halfExtents.x, halfExtents.x),
      THREE.MathUtils.clamp(relativePos.y, -halfExtents.y, halfExtents.y),
      THREE.MathUtils.clamp(relativePos.z, -halfExtents.z, halfExtents.z)
    ).add(boxCenter)
    
    const distance = sphereCenter.distanceTo(closestPoint)
    
    if (distance >= sphereRadius) return null
    
    const normal = sphereCenter.clone().sub(closestPoint).normalize()
    const penetration = sphereRadius - distance
    
    return {
      obj1,
      obj2,
      normal,
      penetration,
      contactPoint: closestPoint
    }
  }
  
  /**
   * Bounding box collision detection (fallback)
   */
  checkBoundingBoxCollision(obj1, obj2) {
    if (!obj1.boundingBox.intersectsBox(obj2.boundingBox)) return null
    
    const center1 = obj1.boundingBox.getCenter(new THREE.Vector3())
    const center2 = obj2.boundingBox.getCenter(new THREE.Vector3())
    const normal = center1.clone().sub(center2).normalize()
    
    return {
      obj1,
      obj2,
      normal,
      penetration: this.options.collisionThreshold,
      contactPoint: center1.clone().add(center2).multiplyScalar(0.5)
    }
  }
  
  /**
   * Resolve all detected collisions
   */
  resolveCollisions() {
    for (const collision of this.collisionPairs) {
      this.resolveCollision(collision)
    }
  }
  
  /**
   * Resolve individual collision
   */
  resolveCollision(collision) {
    const { obj1, obj2, normal, penetration, contactPoint } = collision
    
    // Position correction to prevent sinking
    this.correctPosition(obj1, obj2, normal, penetration)
    
    // Velocity resolution
    this.resolveVelocity(obj1, obj2, normal, contactPoint)
  }
  
  /**
   * Correct object positions to prevent interpenetration
   */
  correctPosition(obj1, obj2, normal, penetration) {
    if (penetration <= 0) return
    
    const totalMass = obj1.mass + obj2.mass
    const correction = normal.clone().multiplyScalar(penetration * 0.8) // 80% correction
    
    if (!obj1.isStatic && !obj1.isKinematic) {
      const ratio1 = obj2.mass / totalMass
      obj1.mesh.position.add(correction.clone().multiplyScalar(ratio1))
    }
    
    if (!obj2.isStatic && !obj2.isKinematic) {
      const ratio2 = obj1.mass / totalMass
      obj2.mesh.position.sub(correction.clone().multiplyScalar(ratio2))
    }
  }
  
  /**
   * Resolve collision velocities
   */
  resolveVelocity(obj1, obj2, normal, contactPoint) {
    const relativeVelocity = obj1.velocity.clone().sub(obj2.velocity)
    const velocityAlongNormal = relativeVelocity.dot(normal)
    
    // Objects are separating
    if (velocityAlongNormal > 0) return
    
    // Calculate restitution
    const restitution = Math.min(obj1.bounciness, obj2.bounciness)
    
    // Calculate impulse magnitude
    const j = -(1 + restitution) * velocityAlongNormal
    const impulse = normal.clone().multiplyScalar(j)
    
    // Apply impulse
    if (!obj1.isStatic && !obj1.isKinematic) {
      obj1.velocity.add(impulse.clone().multiplyScalar(1 / obj1.mass))
    }
    
    if (!obj2.isStatic && !obj2.isKinematic) {
      obj2.velocity.sub(impulse.clone().multiplyScalar(1 / obj2.mass))
    }
    
    // Apply friction
    this.applyFriction(obj1, obj2, normal, contactPoint)
  }
  
  /**
   * Apply friction between colliding objects
   */
  applyFriction(obj1, obj2, normal) {
    const relativeVelocity = obj1.velocity.clone().sub(obj2.velocity)
    
    // Calculate tangent vector (perpendicular to normal)
    const tangent = relativeVelocity.clone().sub(normal.clone().multiplyScalar(relativeVelocity.dot(normal)))
    if (tangent.length() < 0.001) return
    
    tangent.normalize()
    
    // Calculate friction magnitude
    const frictionCoeff = Math.sqrt(obj1.friction * obj2.friction)
    const frictionMagnitude = -relativeVelocity.dot(tangent) * frictionCoeff
    
    const frictionImpulse = tangent.clone().multiplyScalar(frictionMagnitude)
    
    // Apply friction impulse
    if (!obj1.isStatic && !obj1.isKinematic) {
      obj1.velocity.add(frictionImpulse.clone().multiplyScalar(1 / obj1.mass))
    }
    
    if (!obj2.isStatic && !obj2.isKinematic) {
      obj2.velocity.sub(frictionImpulse.clone().multiplyScalar(1 / obj2.mass))
    }
  }
  
  /**
   * Update constraint systems
   */
  updateConstraints() {
    for (const constraint of this.constraints) {
      this.updateConstraint(constraint)
    }
  }
  
  /**
   * Update individual constraint
   */
  updateConstraint(constraint) {
    switch (constraint.type) {
      case 'distance':
        this.updateDistanceConstraint(constraint)
        break
      case 'spring':
        this.updateSpringConstraint(constraint)
        break
      case 'hinge':
        this.updateHingeConstraint(constraint)
        break
    }
  }
  
  /**
   * Distance constraint - maintains fixed distance between objects
   */
  updateDistanceConstraint(constraint) {
    const { obj1, obj2, distance, stiffness = 1.0 } = constraint
    
    const pos1 = obj1.mesh.position
    const pos2 = obj2.mesh.position
    const currentDistance = pos1.distanceTo(pos2)
    const difference = currentDistance - distance
    
    if (Math.abs(difference) < 0.001) return
    
    const direction = pos2.clone().sub(pos1).normalize()
    const correction = direction.multiplyScalar(difference * stiffness * 0.5)
    
    if (!obj1.isStatic) {
      obj1.mesh.position.add(correction)
    }
    
    if (!obj2.isStatic) {
      obj2.mesh.position.sub(correction)
    }
  }
  
  /**
   * Spring constraint - applies spring force between objects
   */
  updateSpringConstraint(constraint) {
    const { obj1, obj2, restLength, springConstant, dampingConstant } = constraint
    
    const pos1 = obj1.mesh.position
    const pos2 = obj2.mesh.position
    const displacement = pos2.clone().sub(pos1)
    const currentLength = displacement.length()
    
    if (currentLength === 0) return
    
    const direction = displacement.normalize()
    const extension = currentLength - restLength
    
    // Spring force: F = -k * x
    const springForce = direction.clone().multiplyScalar(-springConstant * extension)
    
    // Damping force: F = -c * v
    const relativeVelocity = obj2.velocity.clone().sub(obj1.velocity)
    const dampingForce = direction.clone().multiplyScalar(-dampingConstant * relativeVelocity.dot(direction))
    
    const totalForce = springForce.add(dampingForce)
    
    // Apply forces
    if (!obj1.isStatic && !obj1.isKinematic) {
      obj1.acceleration.sub(totalForce.clone().multiplyScalar(1 / obj1.mass))
    }
    
    if (!obj2.isStatic && !obj2.isKinematic) {
      obj2.acceleration.add(totalForce.clone().multiplyScalar(1 / obj2.mass))
    }
  }
  
  /**
   * Hinge constraint - constrains rotation around an axis
   */
  updateHingeConstraint(constraint) {
    const { obj1, obj2, anchor, axis, minAngle = -Math.PI, maxAngle = Math.PI } = constraint
    
    // Calculate current angle between objects
    const pos1 = obj1.mesh.position.clone().sub(anchor)
    const pos2 = obj2.mesh.position.clone().sub(anchor)
    
    // Project positions onto plane perpendicular to axis
    const projectedPos1 = pos1.clone().sub(axis.clone().multiplyScalar(pos1.dot(axis)))
    const projectedPos2 = pos2.clone().sub(axis.clone().multiplyScalar(pos2.dot(axis)))
    
    if (projectedPos1.length() === 0 || projectedPos2.length() === 0) return
    
    projectedPos1.normalize()
    projectedPos2.normalize()
    
    const currentAngle = Math.atan2(
      projectedPos1.clone().cross(projectedPos2).dot(axis),
      projectedPos1.dot(projectedPos2)
    )
    
    // Apply angle limits
    let targetAngle = currentAngle
    if (currentAngle < minAngle) {
      targetAngle = minAngle
    } else if (currentAngle > maxAngle) {
      targetAngle = maxAngle
    }
    
    if (Math.abs(targetAngle - currentAngle) > 0.001) {
      const angleDifference = targetAngle - currentAngle
      const correctionAxis = axis.clone().multiplyScalar(angleDifference * 0.1)
      
      if (!obj1.isStatic) {
        obj1.angularVelocity.add(correctionAxis.clone().multiplyScalar(-1))
      }
      
      if (!obj2.isStatic) {
        obj2.angularVelocity.add(correctionAxis)
      }
    }
  }
  
  /**
   * Update spatial grid for broad-phase collision detection
   */
  updateSpatialGrid() {
    this.spatialGrid.clear()
    
    for (const [id, obj] of this.physicsObjects) {
      this.spatialGrid.addObject(id, obj.mesh.position)
    }
  }
  
  /**
   * Add constraint between objects
   */
  addConstraint(type, obj1, obj2, parameters = {}) {
    const constraint = {
      type,
      obj1: this.physicsObjects.get(obj1.uuid),
      obj2: this.physicsObjects.get(obj2.uuid),
      ...parameters
    }
    
    this.constraints.push(constraint)
    return constraint
  }
  
  /**
   * Remove constraint
   */
  removeConstraint(constraint) {
    const index = this.constraints.indexOf(constraint)
    if (index > -1) {
      this.constraints.splice(index, 1)
    }
  }
  
  /**
   * Apply force to physics object
   */
  applyForce(mesh, force, point = null) {
    const obj = this.physicsObjects.get(mesh.uuid)
    if (!obj || obj.isStatic) return
    
    // Linear force
    obj.acceleration.add(force.clone().multiplyScalar(1 / obj.mass))
    
    // Torque (if application point is specified)
    if (point) {
      const centerOfMass = obj.mesh.position
      const r = point.clone().sub(centerOfMass)
      const torque = r.cross(force)
      
      // Assuming unit moment of inertia for simplicity
      obj.angularAcceleration.add(torque.multiplyScalar(1 / obj.mass))
    }
  }
  
  /**
   * Apply impulse to physics object
   */
  applyImpulse(mesh, impulse, point = null) {
    const obj = this.physicsObjects.get(mesh.uuid)
    if (!obj || obj.isStatic) return
    
    // Linear impulse
    obj.velocity.add(impulse.clone().multiplyScalar(1 / obj.mass))
    
    // Angular impulse (if application point is specified)
    if (point) {
      const centerOfMass = obj.mesh.position
      const r = point.clone().sub(centerOfMass)
      const angularImpulse = r.cross(impulse)
      
      obj.angularVelocity.add(angularImpulse.multiplyScalar(1 / obj.mass))
    }
  }
  
  /**
   * Set velocity of physics object
   */
  setVelocity(mesh, velocity) {
    const obj = this.physicsObjects.get(mesh.uuid)
    if (obj && !obj.isStatic) {
      obj.velocity.copy(velocity)
    }
  }
  
  /**
   * Get velocity of physics object
   */
  getVelocity(mesh) {
    const obj = this.physicsObjects.get(mesh.uuid)
    return obj ? obj.velocity.clone() : new THREE.Vector3()
  }
  
  /**
   * Raycast against physics objects
   */
  raycast(origin, direction, maxDistance = Infinity, layerMask = 0xFFFFFFFF) {
    const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0, maxDistance)
    const hits = []
    
    for (const [obj] of this.physicsObjects) {
      if (!(obj.collisionLayer & layerMask)) continue
      
      const intersections = raycaster.intersectObject(obj.mesh, true)
      
      for (const intersection of intersections) {
        hits.push({
          object: obj,
          mesh: obj.mesh,
          point: intersection.point,
          normal: intersection.face ? intersection.face.normal : new THREE.Vector3(0, 1, 0),
          distance: intersection.distance
        })
      }
    }
    
    return hits.sort((a, b) => a.distance - b.distance)
  }
  
  /**
   * Sphere cast for swept collision detection
   */
  sphereCast(center, radius, direction, maxDistance = Infinity, layerMask = 0xFFFFFFFF) {
    const hits = []
    const sphereGeometry = new THREE.SphereGeometry(radius)
    const tempSphere = new THREE.Mesh(sphereGeometry)
    
    // Sample points along the cast direction
    const sampleCount = Math.ceil(maxDistance / radius)
    const stepSize = maxDistance / sampleCount
    
    for (let i = 0; i <= sampleCount; i++) {
      const samplePoint = center.clone().add(direction.clone().multiplyScalar(i * stepSize))
      tempSphere.position.copy(samplePoint)
      
      const tempObj = {
        mesh: tempSphere,
        collisionShape: { type: 'sphere', radius },
        boundingBox: new THREE.Box3().setFromObject(tempSphere),
        collisionLayer: layerMask
      }
      
      for (const [obj] of this.physicsObjects) {
        if (!(obj.collisionLayer & layerMask)) continue
        
        const collision = this.checkCollision(tempObj, obj)
        if (collision) {
          hits.push({
            object: obj,
            mesh: obj.mesh,
            point: collision.contactPoint,
            normal: collision.normal,
            distance: i * stepSize
          })
          break // First hit
        }
      }
      
      if (hits.length > 0) break
    }
    
    return hits
  }
  
  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }
  
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }
  
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      for (const callback of this.eventListeners.get(event)) {
        callback(data)
      }
    }
  }
  
  /**
   * Debug visualization
   */
  enableDebugDraw(scene) {
    this.debugScene = scene
    this.debugMeshes = new Map()
    
    // Create debug materials
    this.debugMaterials = {
      wireframe: new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        wireframe: true,
        transparent: true,
        opacity: 0.5
      }),
      collision: new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.3
      })
    }
  }
  
  updateDebugDraw() {
    if (!this.debugScene) return
    
    // Clear old debug meshes
    for (const [mesh] of this.debugMeshes) {
      this.debugScene.remove(mesh)
    }
    this.debugMeshes.clear()
    
    // Draw collision shapes
    for (const [id, obj] of this.physicsObjects) {
      const debugGeometry = this.createDebugGeometry(obj.collisionShape)
      const debugMesh = new THREE.Mesh(debugGeometry, this.debugMaterials.wireframe)
      
      debugMesh.position.copy(obj.mesh.position)
      debugMesh.rotation.copy(obj.mesh.rotation)
      
      this.debugScene.add(debugMesh)
      this.debugMeshes.set(id, debugMesh)
    }
    
    // Draw collision points
    for (const collision of this.collisionPairs) {
      const pointGeometry = new THREE.SphereGeometry(0.1)
      const pointMesh = new THREE.Mesh(pointGeometry, this.debugMaterials.collision)
      pointMesh.position.copy(collision.contactPoint)
      
      this.debugScene.add(pointMesh)
      
      // Remove after a short time
      setTimeout(() => {
        this.debugScene.remove(pointMesh)
      }, 100)
    }
  }
  
  createDebugGeometry(collisionShape) {
    switch (collisionShape.type) {
      case 'sphere':
        return new THREE.SphereGeometry(collisionShape.radius)
      case 'cylinder':
        return new THREE.CylinderGeometry(
          collisionShape.radius, 
          collisionShape.radius, 
          collisionShape.height
        )
      case 'box':
      default:
        return new THREE.BoxGeometry(
          collisionShape.width,
          collisionShape.height,
          collisionShape.depth
        )
    }
  }
  
  /**
   * Performance monitoring
   */
  getPerformanceStats() {
    return {
      objectCount: this.physicsObjects.size,
      collisionPairs: this.collisionPairs.length,
      constraintCount: this.constraints.length,
      frameTime: this.frameTime * 1000, // Convert to milliseconds
      isRunning: this.isRunning
    }
  }
  
  /**
   * Cleanup
   */
  dispose() {
    this.stop()
    this.physicsObjects.clear()
    this.collisionPairs = []
    this.constraints = []
    this.spatialGrid.clear()
    this.eventListeners.clear()
    
    if (this.debugMeshes) {
      for (const [mesh] of this.debugMeshes) {
        if (this.debugScene) {
          this.debugScene.remove(mesh)
        }
      }
      this.debugMeshes.clear()
    }
  }
}

/**
 * Spatial Grid for broad-phase collision detection optimization
 */
class SpatialGrid {
  constructor(width, height, cellSize) {
    this.width = width
    this.height = height
    this.cellSize = cellSize
    this.cols = Math.ceil(width / cellSize)
    this.rows = Math.ceil(height / cellSize)
    this.cells = new Map()
  }
  
  clear() {
    this.cells.clear()
  }
  
  getKey(x, z) {
    const col = Math.floor(x / this.cellSize)
    const row = Math.floor(z / this.cellSize)
    return `${col},${row}`
  }
  
  addObject(id, position) {
    const key = this.getKey(position.x, position.z)
    
    if (!this.cells.has(key)) {
      this.cells.set(key, new Set())
    }
    
    this.cells.get(key).add(id)
  }
  
  removeObject(id) {
    for (const [key, cell] of this.cells) {
      cell.delete(id)
      if (cell.size === 0) {
        this.cells.delete(key)
      }
    }
  }
  
  getBroadPhasePairs() {
    const pairs = []
    const checked = new Set()
    
    for (const [key, cell] of this.cells) {
      const objects = Array.from(cell)
      
      // Check objects within the same cell
      for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
          const pairKey = `${objects[i]}-${objects[j]}`
          if (!checked.has(pairKey)) {
            pairs.push([objects[i], objects[j]])
            checked.add(pairKey)
          }
        }
      }
      
      // Check adjacent cells
      const [col, row] = key.split(',').map(Number)
      
      for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (dc === 0 && dr === 0) continue
          
          const adjacentKey = `${col + dc},${row + dr}`
          const adjacentCell = this.cells.get(adjacentKey)
          
          if (adjacentCell) {
            const adjacentObjects = Array.from(adjacentCell)
            
            for (const obj1 of objects) {
              for (const obj2 of adjacentObjects) {
                const pairKey = `${Math.min(obj1, obj2)}-${Math.max(obj1, obj2)}`
                if (!checked.has(pairKey)) {
                  pairs.push([obj1, obj2])
                  checked.add(pairKey)
                }
              }
            }
          }
        }
      }
    }
    
    return pairs
  }
}

/**
 * Utility functions for physics calculations
 */
export class PhysicsUtils {
  static calculateMomentOfInertia(mass, shape) {
    // Simplified moment of inertia calculations
    switch (shape.type) {
      case 'sphere':
        return (2/5) * mass * Math.pow(shape.radius, 2)
      case 'box': {
        const { width, height, depth } = shape
        return (mass / 12) * (width*width + height*height + depth*depth)
      }
      case 'cylinder':
        return (1/2) * mass * Math.pow(shape.radius, 2)
      default:
        return mass // Unit inertia
    }
  }
  
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }
  
  static lerp(a, b, t) {
    return a + (b - a) * t
  }
  
  static smoothstep(edge0, edge1, x) {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
  }
}