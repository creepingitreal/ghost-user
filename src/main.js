import { createApp } from 'vue'
import { pinia } from "./plugins/pinia.js";
import router from './router'
import App from './App.vue'
import './assets/style.css'

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')