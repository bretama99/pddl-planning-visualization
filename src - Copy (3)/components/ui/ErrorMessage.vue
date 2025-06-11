<template>
  <div class="error-message" :class="severityClass">
    <div class="error-content">
      <span class="error-icon">{{ errorIcon }}</span>
      <div class="error-text">
        <strong>{{ errorTitle }}</strong>
        <p>{{ message }}</p>
      </div>
    </div>
    <button @click="$emit('dismiss')" class="dismiss-btn">✕</button>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ErrorMessage',
  props: {
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      default: 'error',
      validator: value => ['error', 'warning', 'info', 'success'].includes(value)
    }
  },
  emits: ['dismiss'],
  setup(props) {
    const severityClass = computed(() => `error-${props.severity}`)
    
    const errorIcon = computed(() => {
      const icons = {
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        success: '✅'
      }
      return icons[props.severity] || '❌'
    })
    
    const errorTitle = computed(() => {
      const titles = {
        error: 'Error',
        warning: 'Warning',
        info: 'Information',
        success: 'Success'
      }
      return titles[props.severity] || 'Error'
    })
    
    return {
      severityClass,
      errorIcon,
      errorTitle
    }
  }
}
</script>

<style scoped>
.error-message {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  border-radius: 8px;
  margin: 15px 0;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-error {
  background: linear-gradient(135deg, #fee, #fdd);
  border-left: 4px solid #e74c3c;
  color: #721c24;
}

.error-warning {
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
  border-left: 4px solid #f39c12;
  color: #856404;
}

.error-info {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-left: 4px solid #3498db;
  color: #0c5460;
}

.error-success {
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  border-left: 4px solid #27ae60;
  color: #155724;
}

.error-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-icon {
  font-size: 1.2rem;
}

.error-text strong {
  display: block;
  margin-bottom: 4px;
  font-size: 1rem;
}

.error-text p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.dismiss-btn {
  background: rgba(0,0,0,0.1);
  border: none;
  color: inherit;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.dismiss-btn:hover {
  background: rgba(0,0,0,0.2);
}
</style>