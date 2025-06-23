<template>
  <div class="steps-visualization">
    <h3>Step del piano</h3>
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
    <div style="display: flex; gap: 8px">
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
  flex: 0 0 300px;
  max-width: 340px;
  min-width: 220px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px 18px;
  max-height: 80vh;
  overflow-y: auto;
  margin-left: 16px;
  z-index: 10;
  box-sizing: border-box;
}
.steps-visualization ol {
  padding-left: 18px;
  margin: 0;
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
@media (max-width: 900px) {
  .steps-visualization {
    margin-left: 0;
    margin-top: 12px;
    max-width: 100vw;
    width: 100%;
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
  margin-top: 12px;
  margin-bottom: 8px;
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
  margin-top: 12px;
  margin-bottom: 8px;
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
  margin-top: 12px;
  margin-bottom: 8px;
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
