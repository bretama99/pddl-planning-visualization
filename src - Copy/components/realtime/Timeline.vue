<template>
  <div class="timeline-component">
    <div class="timeline-header">
      <h4>📅 Action Timeline</h4>
      <div class="timeline-info">
        <span class="info-item">{{ actions.length }} actions</span>
        <span class="info-item">{{ formatTime(totalTime) }} total</span>
        <span class="info-item">{{ type }} PDDL</span>
      </div>
    </div>
    
    <div class="timeline-container">
      <!-- Time scale -->
      <div class="time-scale">
        <div 
          v-for="mark in timeMarks" 
          :key="mark.time"
          class="time-mark"
          :style="{ left: getTimePosition(mark.time) + '%' }"
        >
          <div class="mark-line"></div>
          <div class="mark-label">{{ formatTime(mark.time) }}</div>
        </div>
      </div>
      
      <!-- Actions track -->
      <div class="actions-track">
        <div class="track-label">
          <span class="track-name">Robot Actions</span>
          <span class="track-count">({{ actions.length }})</span>
        </div>
        
        <div class="track-content">
          <div 
            v-for="action in actions"
            :key="action.id"
            class="action-block"
            :class="{
              'action-move': action.name.includes('move'),
              'action-pickup': action.name.includes('pickup'),
              'action-putdown': action.name.includes('putdown'),
              'action-active': isActionActive(action),
              'action-completed': isActionCompleted(action)
            }"
            :style="getActionStyle(action)"
            @click="$emit('action-click', action)"
            :title="getActionTooltip(action)"
          >
            <div class="action-content">
              <div class="action-name">{{ action.name }}</div>
              <div class="action-params">{{ truncateParams(action.parameters) }}</div>
              <div class="action-duration">{{ formatTime(action.duration) }}</div>
            </div>
            
            <!-- Progress bar for active action -->
            <div class="action-progress" v-if="isActionActive(action)">
              <div 
                class="progress-fill"
                :style="{ width: getActionProgress(action) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Current time indicator -->
      <div 
        class="time-indicator"
        :style="{ left: getTimePosition(currentTime) + '%' }"
      >
        <div class="indicator-line"></div>
        <div class="indicator-label">{{ formatTime(currentTime) }}</div>
      </div>
    </div>
    
    <!-- Action details -->
    <div class="action-details" v-if="selectedAction">
      <h5>Action Details</h5>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Name:</span>
          <span class="detail-value">{{ selectedAction.name }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Parameters:</span>
          <span class="detail-value">{{ selectedAction.parameters }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Start Time:</span>
          <span class="detail-value">{{ formatTime(selectedAction.start) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">{{ formatTime(selectedAction.duration) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'TimelineComponent',
  props: {
    actions: {
      type: Array,
      default: () => []
    },
    currentTime: {
      type: Number,
      default: 0
    },
    totalTime: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      default: 'classical'
    }
  },
  emits: ['action-click'],
  setup(props) {
    const selectedAction = ref(null)
    
    const timeMarks = computed(() => {
      if (props.totalTime === 0) return []
      
      const marks = []
      const interval = Math.max(1, props.totalTime / 10)
      
      for (let time = 0; time <= props.totalTime; time += interval) {
        marks.push({ time })
      }
      
      return marks
    })
    
    const getTimePosition = (time) => {
      if (props.totalTime === 0) return 0
      return (time / props.totalTime) * 100
    }
    
    const getActionStyle = (action) => {
      const left = getTimePosition(action.start)
      const width = getTimePosition(action.duration)
      
      return {
        left: `${left}%`,
        width: `${Math.max(width, 2)}%` // Minimum width for visibility
      }
    }
    
    const getActionProgress = (action) => {
      if (!isActionActive(action)) return 0
      
      const progress = (props.currentTime - action.start) / action.duration
      return Math.min(100, Math.max(0, progress * 100))
    }
    
    const isActionActive = (action) => {
      return props.currentTime >= action.start && props.currentTime < action.end
    }
    
    const isActionCompleted = (action) => {
      return props.currentTime >= action.end
    }
    
    const formatTime = (time) => {
      if (props.type === 'temporal') {
        return `${time.toFixed(1)}s`
      } else {
        return `${time.toFixed(1)}`
      }
    }
    
    const truncateParams = (params) => {
      if (!params) return ''
      return params.length > 20 ? params.substring(0, 20) + '...' : params
    }
    
    const getActionTooltip = (action) => {
      return `${action.name}\nParameters: ${action.parameters}\nStart: ${formatTime(action.start)}\nDuration: ${formatTime(action.duration)}`
    }
    
    const handleActionClick = (action) => {
      selectedAction.value = action
      // Emit the action click event to parent
    }
    
    return {
      selectedAction,
      timeMarks,
      getTimePosition,
      getActionStyle,
      getActionProgress,
      isActionActive,
      isActionCompleted,
      formatTime,
      truncateParams,
      getActionTooltip,
      handleActionClick
    }
  }
}
</script>

<style scoped>
.timeline-component {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.timeline-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.timeline-info {
  display: flex;
  gap: 15px;
}

.info-item {
  font-size: 0.85rem;
  color: #666;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.timeline-container {
  position: relative;
  background: #fafafa;
  border-radius: 8px;
  padding: 15px;
  min-height: 120px;
}

.time-scale {
  position: relative;
  height: 25px;
  border-bottom: 1px solid #ddd;
  margin-bottom: 15px;
}

.time-mark {
  position: absolute;
  top: 0;
}

.mark-line {
  width: 1px;
  height: 15px;
  background: #aaa;
}

.mark-label {
  position: absolute;
  top: 17px;
  left: -15px;
  width: 30px;
  text-align: center;
  font-size: 0.7rem;
  color: #666;
}

.actions-track {
  display: flex;
  align-items: center;
  min-height: 50px;
  gap: 15px;
}

.track-label {
  width: 120px;
  text-align: right;
  padding-right: 10px;
  border-right: 2px solid #ddd;
}

.track-name {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.track-count {
  display: block;
  color: #666;
  font-size: 0.75rem;
  margin-top: 2px;
}

.track-content {
  flex: 1;
  position: relative;
  height: 40px;
  background: rgba(255,255,255,0.8);
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.action-block {
  position: absolute;
  top: 2px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
}

.action-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  z-index: 10;
}

.action-move {
  background: #3498db;
  color: white;
}

.action-pickup {
  background: #27ae60;
  color: white;
}

.action-putdown {
  background: #e74c3c;
  color: white;
}

.action-block:not(.action-move):not(.action-pickup):not(.action-putdown) {
  background: #95a5a6;
  color: white;
}

.action-active {
  border-color: #f39c12 !important;
  box-shadow: 0 0 8px rgba(243, 156, 18, 0.5);
  animation: pulse 2s infinite;
}

.action-completed {
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% { 
    box-shadow: 0 0 8px rgba(243, 156, 18, 0.5);
  }
  50% { 
    box-shadow: 0 0 12px rgba(243, 156, 18, 0.8);
  }
}

.action-content {
  padding: 2px 6px;
  font-size: 0.7rem;
  line-height: 1.2;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.action-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-params {
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.65rem;
}

.action-duration {
  opacity: 0.8;
  font-size: 0.6rem;
}

.action-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255,255,255,0.3);
}

.progress-fill {
  height: 100%;
  background: rgba(255,255,255,0.9);
  transition: width 0.3s ease;
}

.time-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 20;
  pointer-events: none;
}

.indicator-line {
  width: 2px;
  height: 100%;
  background: #e74c3c;
  box-shadow: 0 0 4px rgba(231, 76, 60, 0.5);
}

.indicator-label {
  position: absolute;
  top: -25px;
  left: -20px;
  width: 40px;
  text-align: center;
  background: #e74c3c;
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.action-details {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.action-details h5 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #666;
  font-size: 0.85rem;
}

.detail-value {
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .timeline-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .timeline-info {
    justify-content: center;
  }
  
  .actions-track {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .track-label {
    width: auto;
    text-align: center;
    border-right: none;
    border-bottom: 2px solid #ddd;
    padding-right: 0;
    padding-bottom: 10px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>