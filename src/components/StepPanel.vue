<template>
  <div class="steps-visualization">
    <h3>Step del piano</h3>
    <div class="steps-list-container">
      <ol>
        <li
          v-for="(step, idx) in steps"
          :key="idx"
          :class="{ current: idx === currentStepIndex }"
        >
          <span v-if="planFormat === 'PDDL+'">
            {{ step.action }}
            <span v-if="step.duration">({{ step.duration }})</span>
          </span>
          <span v-else>
            {{ step }}
          </span>
        </li>
      </ol>
    </div>
    <div class="steps-controls-fixed">
      <button
        class="play-steps-btn"
        @click="$emit('play-steps')"
        :disabled="isPlaying || isPaused"
      >
        ▶️
      </button>
      <button
        class="pause-steps-btn"
        @click="$emit('pause-steps')"
        :disabled="!isPlaying || isPaused"
      >
        ⏸️
      </button>
      <button
        class="resume-steps-btn"
        @click="$emit('resume-steps')"
        :disabled="!isPaused"
      >
        ⏯️
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "StepPanel",
  props: {
    steps: Array,
    currentStepIndex: Number,
    planFormat: String,
    isPlaying: Boolean,
    isPaused: Boolean
  }
};
</script>

<style scoped>
.steps-visualization {
  flex: 0 0 400px;
  max-width: 480px;
  min-width: 260px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px 24px 12px 24px;
  max-height: 80vh;
  margin-left: 16px;
  z-index: 10;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.steps-list-container {
  flex: 1 1 auto;
  overflow-y: auto;
  max-height: 55vh;
}
.steps-visualization ol {
  padding-left: 0;
  margin: 0 0 0 18px;
  list-style-position: inside;
}
.steps-visualization li {
  margin-bottom: 6px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.2s;
}
.steps-visualization li.current {
  background: #1976d2;
  color: #fff;
  font-weight: bold;
}
.steps-controls-fixed {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  margin-top: 12px;
  background: rgba(255,255,255,0.95);
  padding-top: 8px;
  z-index: 20;
}
@media (max-width: 900px) {
  .steps-visualization {
    margin-left: 0;
    margin-top: 12px;
    max-width: 100vw;
    width: 100%;
  }
  .steps-controls-fixed {
    left: 8px;
    right: 8px;
  }
}
.play-steps-btn {
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 1.1em;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: 100%;
  display: block;
}
.pause-steps-btn {
  background: rgb(150, 150, 150);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 1.1em;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: 100%;
  display: block;
  opacity: 1;
  transition: opacity 0.2s;
}
.pause-steps-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.resume-steps-btn {
  background: #43a047;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 1.1em;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: 100%;
  display: block;
  opacity: 1;
  transition: opacity 0.2s;
}
.resume-steps-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
