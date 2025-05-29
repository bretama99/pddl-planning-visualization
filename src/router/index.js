import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import RobotVisualization from '@/views/RobotVisualization.vue'
import ElevatorVisualization from '@/views/ElevatorVisualization.vue'
import LogisticsVisualization from '@/views/LogisticsVisualization.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/robot',
    name: 'Robot',
    component: RobotVisualization
  },
  {
    path: '/elevator',
    name: 'Elevator',
    component: ElevatorVisualization
  },
  {
    path: '/logistics',
    name: 'Logistics',
    component: LogisticsVisualization
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router