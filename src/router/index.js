import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PuzzleView from '../views/PuzzleView.vue'
import FinalView from '../views/FinalView.vue'
import { pinia } from '../plugins/pinia'
import { useProgressStore } from '../stores/progressStore'
import SplashView from "../views/SplashView.vue";

const routes = [
    {
        path: '/',
        name: 'splash',
        component: SplashView,
    },
    { path: '/home', name: 'home', component: HomeView },
    { path: '/:mode(basic|advanced)/:id(\\d+)', name: 'puzzle', component: PuzzleView, props: true },
    { path: '/:mode(basic|advanced)/final', name: 'final', component: FinalView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
    {
        path: '/final',
        name: 'final',
        component: FinalView,
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

router.beforeEach((to) => {
    if (to.name !== 'puzzle') return true

    const mode = to.params.mode
    const id = Number(to.params.id)

    const progress = useProgressStore(pinia)
    if (id === 1) return true

    return progress.isUnlocked(mode, id)
        ? true
        : { name: 'puzzle', params: { mode, id: id - 1 } }
})

export default router