// src/stores/progressStore.js
import { defineStore } from 'pinia'

const STORAGE_KEY = 'ghost_user_progress_v2'

function load() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { basic: {}, advanced: {} }
    } catch {
        return { basic: {}, advanced: {} }
    }
}

function save(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            basic:    state.basic,
            advanced: state.advanced,
        }))
    } catch {}
}

export const useProgressStore = defineStore('progress', {
    state: () => load(),

    actions: {
        markSolved(mode, id, meta = {}) {
            if (!this[mode]) this[mode] = {}
            this[mode][id] = {
                solved:    true,
                assisted:  meta.assisted  ?? false,
                clue:      meta.clue      ?? '',
                solvedAt:  meta.solvedAt  ?? new Date().toISOString(),
                timeMs:    meta.timeMs    ?? null,
            }
            save(this.$state)
        },

        isSolved(mode, id) {
            return !!this[mode]?.[id]?.solved
        },

        isUnlocked(mode, id) {
            if (id === 1) return true
            return this.isSolved(mode, id - 1)
        },

        getEntry(mode, id) {
            return this[mode]?.[id] ?? null
        },

        getSolvedIds(mode) {
            return Object.entries(this[mode] || {})
                .filter(([, v]) => v?.solved)
                .map(([k]) => parseInt(k))
        },

        getClues(mode) {
            return Object.values(this[mode] || {})
                .filter(v => v?.solved && v?.clue)
                .map(v => v.clue)
        },

        reset() {
            this.basic    = {}
            this.advanced = {}
            save(this.$state)
        },

        // Returns true if user confirmed, false if cancelled
        confirmReset() {
            const confirmed = window.confirm(
                '⚠ RESET INVESTIGATION\n\nThis will permanently clear all task progress and collected clues.\n\nAre you sure?'
            )
            if (confirmed) this.reset()
            return confirmed
        },
    },
})
