<template>
  <div class="playback-controls">
    <div class="control-buttons">
      <button 
        @click="$emit('play')" 
        :disabled="isPlaying"
        class="control-btn play-btn"
        title="Play simulation"
      >
        ▶️
      </button>
      
      <button 
        @click="$emit('pause')" 
        :disabled="!isPlaying"
        class="control-btn pause-btn"
        title="Pause simulation"
      >
        ⏸️
      </button>
      
      <button 
        @click="$emit('stop')" 
        class="control-btn stop-btn"
        title="Stop and reset"
      >
        ⏹️
      </button>
      
      <button 
        @click="stepBackward"
        :disabled="isPlaying"
        class="control-btn step-btn"
        title="Step backward"
      >
        ⏮️
      </button>
      
      <button 
        @click="stepForward"
        :disabled="isPlaying"
        class="control-btn step-btn"
        title="Step forward"
      >
        ⏭️
      </button>
    </div>

    <div class="time-controls">
      <div class="time-display">
        <span class="current-time">{{ formatTime(currentTime) }}</span>
        <span class="time-separator">/</span>
        <span class="total-time">{{ formatTime(totalTime) }}</span>
      </div>
      
      <div class="progress-container">
        <input 
          type="range"
          :min="0"
          :max="totalTime"
          :step="0.1"
          :value="currentTime"
          @input="$emit('seek', parseFloat($event.target.value))"
          :disabled="isPlaying"
          class="progress-slider"
        />
        <div class="progress-markers">
          <div 
            v-for="(action, index) in actions" 
            :key="index"
            class="action-marker"
            :style="{ left: (action.start / totalTime) * 100 + '%' }"
            :title="`${action.name} at ${formatTime(action.start)}`"
          ></div>
        </div>
      </div>
    </div>

    <div class="speed-controls">
      <label class="speed-label">Speed:</label>
      <div class="speed-buttons">
        <button 
          v-for="speedOption in speedOptions"
          :key="speedOption"
          @click="$emit('speed-change', speedOption)"
          :class="{ active: speed === speedOption }"
          class="speed-btn"
        >
          {{ speedOption }}x
        </button>
      </div>
      
      <div class="custom-speed">
        <input 
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          :value="speed"
          @input="$emit('speed-change', parseFloat($event.target.value))"
          class="speed-slider"
        />
        <span class="speed-value">{{ speed.toFixed(1) }}x</span>
      </div>
    </div>

    <div class="loop-controls">
      <label class="loop-checkbox">
        <input 
          type="checkbox" 
          v-model="loopEnabled"
          @change="$emit('loop-change', loopEnabled)"
        />
        <span class="checkbox-label">🔄 Loop</span>
      </label>
      
      <button 
        @click="$emit('export-video')"
        class="export-btn"
        title="Export as video"
      >
        🎥 Export
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'PlaybackControls',
  props: {
    isPlaying: Boolean,
    currentTime: Number,
    totalTime: Number,
    speed: Number,
    actions: Array
  },
  emits: ['play', 'pause', 'stop', 'seek', 'speed-change', 'step-forward', 'step-backward', 'loop-change', 'export-video'],
  setup(props, { emit }) {
    const loopEnabled = ref(false)
    const speedOptions = [0.25, 0.5, 1, 2, 4]
    
    const formatTime = (time) => {
      const minutes = Math.floor(time / 60)
      const seconds = (time % 60).toFixed(1)
      return `${minutes}:${seconds.padStart(4, '0')}`
    }
    
    const stepForward = () => {
      const nextAction = props.actions.find(action => action.start > props.currentTime)
      if (nextAction) {
        emit('seek', nextAction.start)
      } else {
        emit('seek', props.totalTime)
      }
    }
    
    const stepBackward = () => {
      const prevActions = props.actions.filter(action => action.start < props.currentTime)
      if (prevActions.length > 0) {
        const prevAction = prevActions[prevActions.length - 1]
        emit('seek', prevAction.start)
      } else {
        emit('seek', 0)
      }
    }
    
    return {
      loopEnabled,
      speedOptions,
      formatTime,
      stepForward,
      stepBackward
    }
  }
}
</script>

<style scoped>
.playback-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex-wrap: wrap;
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #3498db;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: scale(1.1);
}

.control-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.play-btn { background: #27ae60; }
.play-btn:hover:not(:disabled) { background: #2ecc71; }

.pause-btn { background: #f39c12; }
.pause-btn:hover:not(:disabled) { background: #e67e22; }

.stop-btn { background: #e74c3c; }
.stop-btn:hover:not(:disabled) { background: #c0392b; }

.step-btn { background: #9b59b6; }
.step-btn:hover:not(:disabled) { background: #8e44ad; }

.time-controls {
  flex: 1;
  min-width: 300px;
}

.time-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin-bottom: 10px;
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: 600;
}

.current-time { color: #27ae60; }
.time-separator { color: #7f8c8d; }
.total-time { color: #34495e; }

.progress-container {
  position: relative;
  margin-bottom: 5px;
}

.progress-slider {
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #3498db;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.progress-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #3498db;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.progress-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  pointer-events: none;
}

.action-marker {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: #e74c3c;
  border-radius: 1px;
  opacity: 0.7;
}

.speed-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.speed-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.speed-buttons {
  display: flex;
  gap: 4px;
}

.speed-btn {
  padding: 6px 12px;
  border: 2px solid #3498db;
  background: white;
  color: #3498db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.speed-btn:hover {
  background: #3498db;
  color: white;
}

.speed-btn.active {
  background: #3498db;
  color: white;
}

.custom-speed {
  display: flex;
  align-items: center;
  gap: 8px;
}

.speed-slider {
  width: 80px;
  height: 4px;
  background: #ecf0f1;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #f39c12;
  border-radius: 50%;
  cursor: pointer;
}

.speed-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f39c12;
  min-width: 35px;
}

.loop-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.loop-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.loop-checkbox input {
  margin: 0;
}

.export-btn {
  background: #9b59b6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.export-btn:hover {
  background: #8e44ad;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .playback-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .time-controls {
    min-width: auto;
  }
  
  .speed-controls, .loop-controls {
    justify-content: center;
  }
}
</style>