<template>
  <div class="logistics-view">
    <div class="header">
      <h1>🚚 Logistics Network</h1>
      <div class="actions">
        <button @click="showUpload = true" class="btn primary">Load Plan</button>
        <button @click="loadSample" class="btn">Sample</button>
      </div>
    </div>

    <div class="config">
      <div class="config-item">
        <label>Network:</label>
        <select v-model="config.network">
          <option value="local">Local</option>
          <option value="regional">Regional</option>
          <option value="global">Global</option>
        </select>
      </div>
      
      <div class="config-item">
        <label>Fleet:</label>
        <select v-model="config.fleet">
          <option value="mixed">Mixed</option>
          <option value="trucks">Trucks</option>
          <option value="air">Air</option>
        </select>
      </div>
      
      <div class="config-item">
        <label>Traffic:</label>
        <select v-model="config.traffic">
          <option value="normal">Normal</option>
          <option value="heavy">Heavy</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="value">{{ stats.packages }}</div>
        <div class="label">Packages</div>
      </div>
      <div class="stat">
        <div class="value">{{ stats.vehicles }}</div>
        <div class="label">Vehicles</div>
      </div>
      <div class="stat">
        <div class="value">{{ stats.efficiency }}%</div>
        <div class="label">Efficiency</div>
      </div>
      <div class="stat">
        <div class="value">${{ stats.cost }}</div>
        <div class="label">Cost</div>
      </div>
    </div>

    <LogisticsSimulator
      v-if="hasPlan"
      :actions="plan.actions"
    />
    
    <div v-else class="empty">
      <div class="icon">📦</div>
      <h3>No Plan Loaded</h3>
      <p>Load a logistics plan to start simulation</p>
      <button @click="loadSample" class="btn primary">Load Sample</button>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUpload" class="modal" @click="showUpload = false">
      <div class="modal-content" @click.stop>
        <h3>Upload Plan</h3>
        <FileUpload
          @file-uploaded="handleFileUpload"
          accept=".pddl,.txt,.json"
        />
        <button @click="showUpload = false" class="btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import LogisticsSimulator from '@/components/visualization/LogisticsSimulator.vue'
import FileUpload from '@/components/ui/FileUpload.vue'

export default {
  name: 'LogisticsVisualization',
  components: {
    LogisticsSimulator,
    FileUpload
  },
  setup() {
    const showUpload = ref(false)
    const hasPlan = ref(false)
    
    const config = reactive({
      network: 'regional',
      fleet: 'mixed',
      traffic: 'normal'
    })
    
    const stats = reactive({
      packages: 1247,
      vehicles: 23,
      efficiency: 87,
      cost: 124
    })
    
    const plan = ref({
      actions: []
    })
    
    const sampleActions = [
      { name: 'load-truck', start: 0, end: 5, duration: 5 },
      { name: 'move-truck', start: 5, end: 25, duration: 20 },
      { name: 'unload-truck', start: 25, end: 30, duration: 5 },
      { name: 'fly-drone', start: 30, end: 45, duration: 15 }
    ]
    
    const loadSample = () => {
      plan.value.actions = [...sampleActions]
      hasPlan.value = true
    }
    
    const handleFileUpload = ({ name, content }) => {
      try {
        const actions = parseActions(content)
        plan.value.actions = actions
        hasPlan.value = true
        showUpload.value = false
        console.log(`Loaded ${name} with ${actions.length} actions`)
      } catch (error) {
        console.error('Parse error:', error)
        alert('Error parsing file: ' + error.message)
      }
    }
    
    const parseActions = (text) => {
      const lines = text.split('\n')
      const actions = []
      let time = 0
      
      lines.forEach(line => {
        if (line.trim()) {
          actions.push({
            name: line.trim(),
            start: time,
            end: time + 10,
            duration: 10
          })
          time += 10
        }
      })
      
      return actions
    }
    
    return {
      showUpload,
      hasPlan,
      config,
      stats,
      plan,
      loadSample,
      handleFileUpload
    }
  }
}
</script>

<style scoped>
.logistics-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: #f8f9fa;
}

.btn.primary {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.btn.primary:hover {
  background: #2980b9;
}

.config {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.config-item label {
  font-weight: 600;
  color: #2c3e50;
}

.config-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat .value {
  font-size: 2rem;
  font-weight: 700;
  color: #3498db;
  margin-bottom: 5px;
}

.stat .label {
  color: #666;
  font-size: 0.9rem;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.empty .icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.3;
}

.empty h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.empty p {
  margin: 0 0 30px 0;
  color: #666;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  min-width: 400px;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.modal-content input {
  width: 100%;
  padding: 10px;
  margin: 20px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .logistics-view {
    padding: 15px;
  }

  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .config {
    flex-direction: column;
    gap: 15px;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-content {
    margin: 20px;
    min-width: auto;
  }
}
</style>