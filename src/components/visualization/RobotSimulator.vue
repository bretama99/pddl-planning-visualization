<template>
  <div class="robot-simulator">
    <!-- Floating Success Message -->
    <transition name="success-popup">
      <div v-if="showSuccess" class="success-message">
        🎉 Task Completed Successfully!
      </div>
    </transition>

    <!-- Particle System -->
    <div class="particles-container">
      <div 
        v-for="particle in particles" 
        :key="particle.id"
        class="particle"
        :class="particle.type"
        :style="getParticleStyle(particle)"
      />
    </div>

    <!-- Controls -->
    <div class="controls">
      <button @click="playPlan" :disabled="isPlaying" class="btn play-btn">
        {{ isPlaying ? '⏸️ Playing...' : '▶️ Play Plan' }}
      </button>
      <button @click="stopPlan" class="btn stop-btn">
        ⏹️ Stop
      </button>
      <button @click="resetPlan" class="btn reset-btn">
        🔄 Reset
      </button>
      <div class="speed-control">
        <label>Speed:</label>
        <input type="range" v-model="playbackSpeed" min="0.5" max="3" step="0.5" class="speed-slider" />
        <span>{{ playbackSpeed }}x</span>
      </div>
    </div>

    <!-- Plan Info -->
    <div class="plan-info">
      <div class="info-card">
        <div class="info-number">{{ actions.length }}</div>
        <div class="info-label">Actions</div>
      </div>
      <div class="info-card">
        <div class="info-number">{{ currentStep + 1 }} / {{ actions.length }}</div>
        <div class="info-label">Step</div>
      </div>
      <div class="info-card">
        <div class="info-number">{{ planRooms.length }}</div>
        <div class="info-label">Rooms</div>
      </div>
      <div class="info-card">
        <div class="info-number">{{ planObjects.length }}</div>
        <div class="info-label">Objects</div>
      </div>
      <div class="info-card">
        <div class="info-number">{{ planRobots.length }}</div>
        <div class="info-label">Robots</div>
      </div>
      
      <div v-if="currentAction" class="current-action">
        <div class="action-header">🎯 Current Action:</div>
        <div class="action-details">
          {{ currentAction.start }}s - {{ currentAction.name.toUpperCase() }} {{ currentAction.parameters }}
        </div>
      </div>
    </div>

    <!-- Simulation Area -->
   <div class="simulation-area">
      <!-- Background Effects -->
      <div class="background-effects">
        <div class="floating-orb" style="--delay: 0s; --duration: 8s;" />
        <div class="floating-orb" style="--delay: 2s; --duration: 12s;" />
        <div class="floating-orb" style="--delay: 4s; --duration: 10s;" />
      </div>

      <!-- Rooms in 4-column layout -->
      <div 
        v-for="room in planRooms" 
        :key="room"
        class="room"
        :class="{ 
          active: activeRoom === room,
          'room-pulse': activeRoom === room && isPlaying
        }"
        :style="getRoomPosition(room)"
      >
        <div class="room-title">
          <span class="room-icon">🏢</span>
          <span>{{ room }}</span>
          <div v-if="activeRoom === room" class="active-indicator">
            <div class="pulse-ring"></div>
            <div class="pulse-ring delay-1"></div>
            <div class="pulse-ring delay-2"></div>
          </div>
        </div>
        
        <!-- Objects in this room -->
        <div class="room-objects">
          <transition-group name="object-move" tag="div">
            <div 
              v-for="obj in getObjectsInRoom(room)" 
              :key="obj"
              class="object object-bounce"
            >
              <span class="object-icon">{{ getObjectIcon(obj) }}</span>
              <span>{{ obj }}</span>
            </div>
          </transition-group>
        </div>
      </div>

      <!-- ALL Robots with Complete Body Structure -->
      <div 
        v-for="robot in planRobots"
        :key="robot"
        v-show="robotPositions[robot] && robotPositions[robot].room"
        class="robot"
        :class="{ 
          'robot-charging': robotCharging[robot],
          'robot-moving': robotMoving[robot] 
        }"
        :style="getRobotPosition(robot)"
      >
        <!-- Complete Robot Body Structure -->
        <div class="robot-body">
          <!-- Robot Head -->
          <div class="robot-head">
            <div class="robot-icon" :style="{ color: getRobotColor(robot).primary }">
              {{ getRobotIcon(robot) }}
              <div v-if="robotCharging[robot]" class="charging-bolt">⚡</div>
              <div class="robot-glow" :style="{ background: `radial-gradient(circle, ${getRobotColor(robot).primary}30, transparent)` }"></div>
            </div>
          </div>

          <!-- Robot Torso -->
          <div class="robot-torso"></div>

          <!-- Robot Arms Container -->
          <div class="robot-arms-container">
            <!-- Left Arm -->
            <div class="robot-arm left-arm" :class="{ 'arm-carrying': (robotCarrying[robot] || []).length > 0 }">
              <div class="upper-arm"></div>
              <div class="lower-arm"></div>
              <div class="robot-hand left-hand">
                <!-- Objects held in left hand -->
                <div 
                  v-for="(obj, index) in getLeftHandObjects(robot)" 
                  :key="`left-${obj}`"
                  class="held-object"
                  :style="{ '--delay': index * 0.1 + 's' }"
                >
                  <span class="held-icon">{{ getObjectIcon(obj) }}</span>
                </div>
              </div>
            </div>

            <!-- Right Arm -->
            <div class="robot-arm right-arm" :class="{ 'arm-carrying': (robotCarrying[robot] || []).length > 0 }">
              <div class="upper-arm"></div>
              <div class="lower-arm"></div>
              <div class="robot-hand right-hand">
                <!-- Objects held in right hand -->
                <div 
                  v-for="(obj, index) in getRightHandObjects(robot)" 
                  :key="`right-${obj}`"
                  class="held-object"
                  :style="{ '--delay': index * 0.1 + 's' }"
                >
                  <span class="held-icon">{{ getObjectIcon(obj) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Robot Legs -->
          <div class="robot-legs-container">
            <div class="robot-leg">
              <div class="upper-leg"></div>
              <div class="lower-leg"></div>
              <div class="robot-foot"></div>
            </div>
            <div class="robot-leg">
              <div class="upper-leg"></div>
              <div class="lower-leg"></div>
              <div class="robot-foot"></div>
            </div>
          </div>
        </div>
        
        <div class="robot-name" :style="{ background: `linear-gradient(135deg, ${getRobotColor(robot).primary}, ${getRobotColor(robot).secondary})` }">
          {{ robot }}
        </div>
        
        <!-- Carrying status display -->
        <div v-if="(robotCarrying[robot] || []).length > 0" class="carrying-status">
          <div class="status-text">
            Carrying: {{ (robotCarrying[robot] || []).length }} item{{ (robotCarrying[robot] || []).length > 1 ? 's' : '' }}
          </div>
        </div>
      </div>

      <!-- Movement trails for all robots -->
      <svg class="movement-trail" width="100%" height="100%">
        <defs>
          <linearGradient v-for="robot in planRobots" :key="`grad-${robot}`" :id="`trailGradient-${robot}`" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" :stop-color="getRobotColor(robot).primary" />
            <stop offset="50%" :stop-color="getRobotColor(robot).secondary" />
            <stop offset="100%" :stop-color="getRobotColor(robot).primary" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path 
          v-for="robot in robotsWithTrails"
          :key="`trail-${robot}`"
          :d="getTrailPath(robot)"
          :stroke="`url(#trailGradient-${robot})`"
          stroke-width="4"
          stroke-dasharray="8,4"
          fill="none"
          opacity="0.8"
          filter="url(#glow)"
          class="trail-animation"
        />
      </svg>
    </div>

    <!-- Action List -->
    <div class="action-list">
      <h4 class="action-list-title">
        <span>📋 Plan Actions</span>
        <div class="title-underline"></div>
      </h4>
      <div class="actions-container">
        <transition-group name="action-slide" tag="div">
          <div 
            v-for="(action, index) in actions" 
            :key="index"
            class="action-item"
            :class="{ 
              current: index === currentStep,
              done: index < currentStep,
              upcoming: index > currentStep
            }"
          >
            <span class="time">{{ action.start }}s</span>
            <span class="action">{{ action.name.toUpperCase() }}</span>
            <span class="params">{{ action.parameters }}</span>
            <div class="action-status">
              <div v-if="index === currentStep" class="status-icon current-icon">▶️</div>
              <div v-else-if="index < currentStep" class="status-icon done-icon">✅</div>
              <div v-else class="status-icon upcoming-icon">⏳</div>
            </div>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script>
import { createRobotSimulator } from './robotSimulator.js'
import './robotSimulator.css'

export default {
  name: 'RobotSimulator',
  props: {
    actions: { 
      type: Array, 
      default: () => [
        { start: 0.0, name: 'pick', parameters: 'box1 roomA robot1' },
        { start: 1.0, name: 'pick', parameters: 'box2 roomB robot2' },
        { start: 2.5, name: 'move', parameters: 'robot1 roomA roomB' },
        { start: 3.0, name: 'move', parameters: 'robot2 roomB roomC' },
        { start: 5.0, name: 'drop', parameters: 'box1 roomB robot1' },
        { start: 5.5, name: 'drop', parameters: 'box2 roomC robot2' },
        { start: 7.0, name: 'pick', parameters: 'box3 roomC robot1' },
        { start: 9.5, name: 'move', parameters: 'robot1 roomB roomA' },
        { start: 12.0, name: 'drop', parameters: 'box3 roomA robot1' },
        { start: 14.0, name: 'startcharge', parameters: 'robot1' },
        { start: 15.0, name: 'startcharge', parameters: 'robot2' },
        { start: 16.0, name: 'stopcharge', parameters: 'robot1' },
        { start: 17.0, name: 'stopcharge', parameters: 'robot2' }
      ]
    },
    entities: { 
      type: Object, 
      default: () => ({ rooms: [], objects: [], robots: [] }) 
    }
  },
  setup(props) {
    return createRobotSimulator(props)
  }
}
</script>