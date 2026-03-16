// src/stores/progress.js
// Keyed by: ghost-{mode}-progress → object { "1": { solved, clue, assisted, solvedAt }, ... }
// Supports isSolved, isUnlocked, markSolved, reset, hint tracking

import { defineStore } from 'pinia'

const KEY = (mode) => `ghost-${mode}-progress`

function load(mode) {
    try {
        const raw = localStorage.getItem(KEY(mode))
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        // Handle both array and object formats from older versions
        if (Array.isArray(parsed)) {
            const obj = {}
            parsed.forEach((v, i) => { if (v) obj[i + 1] = v })
            return obj
        }
        return parsed || {}
    } catch { return {} }
}

function save(mode, data) {
    try { localStorage.setItem(KEY(mode), JSON.stringify(data)) } catch {}
}

export const useProgressStore = defineStore('progress', {
    state: () => ({
        basic:    load('basic'),
        advanced: load('advanced'),
        basicHints:    {},
        advancedHints: {},
    }),

    actions: {
        markSolved(mode, id, meta = {}) {
            if (!this[mode]) this[mode] = {}
            this[mode][id] = {
                solved:    true,
                clue:      meta.clue    || '',
                assisted:  meta.assisted || false,
                solvedAt:  meta.solvedAt || new Date().toISOString(),
            }
            save(mode, this[mode])
        },

        isSolved(mode, id) {
            return !!this[mode]?.[id]?.solved
        },

        isUnlocked(mode, id) {
            if (id === 1) return true
            return this.isSolved(mode, id - 1)
        },

        getSolvedData(mode, id) {
            return this[mode]?.[id] || null
        },

        solvedIds(mode) {
            return Object.entries(this[mode] || {})
                .filter(([, v]) => v?.solved)
                .map(([k]) => parseInt(k))
        },

        acquiredClues(mode, tasks) {
            return tasks
                .filter(t => this.isSolved(mode, t.id))
                .map(t => t.clue)
        },

        markHintUsed(mode, id) {
            const key = `${mode}Hints`
            if (!this[key]) this[key] = {}
            this[key][id] = true
        },

        isHintUsed(mode, id) {
            return !!this[`${mode}Hints`]?.[id]
        },

        reset(mode) {
            if (mode) {
                this[mode] = {}
                save(mode, {})
            } else {
                this.basic    = {}
                this.advanced = {}
                save('basic', {})
                save('advanced', {})
            }
        },

        countSolved(mode) {
            return Object.values(this[mode] || {}).filter(v => v?.solved).length
        },
    },
})