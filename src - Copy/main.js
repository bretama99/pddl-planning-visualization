import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Global CSS
import './assets/css/global.css'

const app = createApp(App)

app.use(router)

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err, info)
}

// Global properties for time formatting
app.config.globalProperties.$formatTime = (time, type = 'temporal') => {
  if (type === 'temporal') {
    return `${time.toFixed(2)}s`
  } else {
    return `Step ${Math.round(time)}`
  }
}

app.mount('#app')