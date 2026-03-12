import { defineStore } from 'pinia'

export const useTimerStore = defineStore('timer', {
    state: () => ({
        start: Date.now(),
        elapsedMs: 0,
        intervalId: null
    }),
    getters: {
        displayTime(state) {
            let ms = state.elapsedMs
            const s = Math.floor(ms / 1000)
            return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
        }
    },
    actions: {
        startTimer() {
            this.start = Date.now()
            this.intervalId = setInterval(() => {
                this.elapsedMs = Date.now() - this.start
            }, 1000)
        },
        reset() {
            this.elapsedMs = 0
            this.startTimer()
        }
    }
})
