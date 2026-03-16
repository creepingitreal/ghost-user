// src/stores/progressStore.js
// Full replacement — adds countSolved(), getSolvedData(), mode arg on reset(),
// and meta object support on markSolved(). All existing methods preserved.

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
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            basic:    state.basic,
            advanced: state.advanced,
        }))
    } catch {}
}

export const useProgressStore = defineStore('progress', {
    state: () => load(),

    actions: {
        // ── Mark a task solved — accepts optional meta { clue, assisted, solvedAt }
        markSolved(mode, id, meta = {}) {
            if (!this[mode]) this[mode] = {}
            this[mode][id] = {
                solved:   true,
                clue:     meta.clue     || '',
                assisted: meta.assisted || false,
                solvedAt: meta.solvedAt || new Date().toISOString(),
            }
            save(this.$state)
        },

        isSolved(mode, id) {
            return !!this[mode]?.[id]?.solved
        },

        isUnlocked(mode, id) {
            if (id === 1) return true
            return !!this[mode]?.[id - 1]
        },

        // ── Returns the full saved object for a task, or null
        getSolvedData(mode, id) {
            return this[mode]?.[id] || null
        },

        // ── Count how many tasks are solved in a track
        countSolved(mode) {
            if (!this[mode]) return 0
            return Object.values(this[mode]).filter(v => v?.solved).length
        },

        // ── Reset — accepts optional mode to clear one track, or clears both
        reset(mode) {
            if (mode) {
                this[mode] = {}
            } else {
                this.basic    = {}
                this.advanced = {}
            }
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
            return this[mode]?.[id]?.timeMs || null
        },
    },
})