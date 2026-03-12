import App from './App.vue'
import { createApp } from 'vue'
import { useThemeStore } from './stores/themeStore'
import { pinia } from "./plugins/pinia.js";
import router from './router'
import './assets/style.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')

const theme = useThemeStore()
theme.apply()
