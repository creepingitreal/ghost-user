// src/stores/timerStore.js
import { defineStore } from 'pinia'

export const useTimerStore = defineStore('timer', {
    state: () => ({
        startTime:  Date.now(),
        elapsedMs:  0,
        intervalId: null,
        running:    false,
    }),

    getters: {
        displayTime(state) {
            const s = Math.floor(state.elapsedMs / 1000)
            const m = Math.floor(s / 60)
            const sec = String(s % 60).padStart(2, '0')
            return `${m}:${sec}`
        },
    },

    actions: {
        start() {
            if (this.running) return
            this.startTime = Date.now() - this.elapsedMs
            this.running   = true
            this.intervalId = setInterval(() => {
                this.elapsedMs = Date.now() - this.startTime
            }, 1000)
        },

        pause() {
            if (!this.running) return
            clearInterval(this.intervalId)
            this.running = false
        },

        reset() {
            clearInterval(this.intervalId)
            this.elapsedMs  = 0
            this.startTime  = Date.now()
            this.running    = false
            this.intervalId = null
        },

        resetAndStart() {
            this.reset()
            this.start()
        },
    },
})