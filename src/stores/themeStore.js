import { defineStore } from 'pinia'

const STORAGE_KEY = 'theme_pref_v1'

export const useThemeStore = defineStore('theme', {
    state: () => ({
        mode: localStorage.getItem(STORAGE_KEY) || 'dark'
    }),

    actions: {
        apply() {
            const isLight = this.mode === 'light'
            document.body.classList.toggle('light', isLight)
            localStorage.setItem(STORAGE_KEY, this.mode)
        },

        toggle() {
            this.mode = this.mode === 'light' ? 'dark' : 'light'
            this.apply()
        }
    }
})