import {createRouter, createWebHashHistory } from 'vue-router'
import { pinia } from '../plugins/pinia'
import { useProgressStore } from '../stores/progressStore'
import HomeView from '../views/HomeView.vue'
import TaskView from '../views/TaskView.vue'
import FinalView from '../views/FinalView.vue'
import SplashView from "../views/SplashView.vue";

const routes = [
    { path: '/', name: '/', component: SplashView },
    { path: '/briefing-room', name: 'home', component: HomeView },
    { path: '/:mode(basic|advanced)/:id(\\d+)', name: 'task', component: TaskView, props: true },
    { path: '/:mode(basic|advanced)/final', name: 'final', component: FinalView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes
})

router.beforeEach((to) => {
    if (to.name !== 'task') return true

    const mode = to.params.mode
    const id = Number(to.params.id)

    const progress = useProgressStore(pinia)
    if (id === 1) return true

    return progress.isUnlocked(mode, id)
        ? true
        : { name: 'task', params: { mode, id: id - 1 } }
})

export default router