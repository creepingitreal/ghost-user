import { defineStore } from 'pinia'

const STORAGE_KEY = 'sql_escape_progress_v1'

function load() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { basic: {}, advanced: {} }
    } catch {
        return { basic: {}, advanced: {} }
    }
}

function save(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
}

export const useProgressStore = defineStore('progress', {
    state: () => load(),
    actions: {
        markSolved(mode, id) {
            this[mode][id] = true
            save(this.$state)
        },
        isSolved(mode, id) {
            return !!this[mode][id]
        },
        isUnlocked(mode, id) {
            if (id === 1) return true
            return !!this[mode][id - 1]
        },
        reset() {
            this.basic = {}
            this.advanced = {}
            save(this.$state)
        },
        markHintUsed(mode, id) {
            const key = mode === 'basic' ? 'basicHints' : 'advancedHints'
            if (!this[key]) this[key] = {}
            this[key][id] = true
            save(this.$state)
        },
        isHintUsed(mode, id) {
            const key = mode === 'basic' ? 'basicHints' : 'advancedHints'
            return !!this[key]?.[id]
        },
        getSolveTime(mode, id) {
            return this[mode][id]?.timeMs || null
        }

    }
})