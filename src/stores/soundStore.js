import { defineStore } from 'pinia'

export const useSoundStore = defineStore('sound', {
    state: () => ({
        muted: JSON.parse(localStorage.getItem('soundMuted') || 'false')
    }),
    actions: {
        toggle() {
            this.muted = !this.muted
            localStorage.setItem('soundMuted', this.muted)
        }
    }
})