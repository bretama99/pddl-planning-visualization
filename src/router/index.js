import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import LogisticsPage from '../LogisticsPage.vue';


const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/logistics',
    name: 'Logistics',
    component: LogisticsPage
  }

  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router