// src/stores/soundStore.js
// Uses Web Audio API directly — no external files needed.
// All sounds are synthesised: reliable, fast, and audible.

import { defineStore } from 'pinia'

let _ctx = null

function getCtx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Resume if suspended (browser autoplay policy)
    if (_ctx.state === 'suspended') _ctx.resume()
    return _ctx
}

function play(fn) {
    try { fn(getCtx()) } catch (e) { console.warn('[sound]', e) }
}

// ── Sound primitives ──────────────────────────────────────────────────────────

function beep(ctx, freq, duration, gain = 0.35, type = 'square') {
    const osc = ctx.createOscillator()
    const vol = ctx.createGain()
    osc.connect(vol)
    vol.connect(ctx.destination)
    osc.type      = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    vol.gain.setValueAtTime(gain, ctx.currentTime)
    vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
}

function tone(ctx, freq, start, duration, gain = 0.3, type = 'sine') {
    const osc = ctx.createOscillator()
    const vol = ctx.createGain()
    osc.connect(vol)
    vol.connect(ctx.destination)
    osc.type      = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
    vol.gain.setValueAtTime(0.0001, ctx.currentTime + start)
    vol.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01)
    vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
    osc.start(ctx.currentTime + start)
    osc.stop(ctx.currentTime + start + duration + 0.05)
}

// ── Named sounds ──────────────────────────────────────────────────────────────

export const sounds = {
    // Keypress: soft click
    keypress() {
        play(ctx => beep(ctx, 1200, 0.04, 0.12, 'square'))
    },

    // Run query: ascending two-tone blip
    runQuery() {
        play(ctx => {
            beep(ctx, 440, 0.08, 0.25, 'square')
            setTimeout(() => beep(ctx, 660, 0.1, 0.2, 'square'), 80)
        })
    },

    // Error: harsh descending tone
    error() {
        play(ctx => {
            tone(ctx, 220, 0,    0.15, 0.35, 'sawtooth')
            tone(ctx, 165, 0.12, 0.2,  0.3,  'sawtooth')
        })
    },

    // Wrong answer: low double buzz
    wrong() {
        play(ctx => {
            beep(ctx, 180, 0.12, 0.4, 'sawtooth')
            setTimeout(() => beep(ctx, 160, 0.12, 0.4, 'sawtooth'), 150)
        })
    },

    // Correct answer: ascending success chord
    correct() {
        play(ctx => {
            tone(ctx, 523, 0,    0.15, 0.4, 'sine')  // C5
            tone(ctx, 659, 0.1,  0.15, 0.4, 'sine')  // E5
            tone(ctx, 784, 0.2,  0.25, 0.4, 'sine')  // G5
            tone(ctx, 1047,0.35, 0.35, 0.35,'sine')  // C6
        })
    },

    // Unlock clue: short triumphant blip
    clueUnlock() {
        play(ctx => {
            tone(ctx, 880, 0,    0.08, 0.3, 'square')
            tone(ctx, 1100,0.1,  0.08, 0.3, 'square')
            tone(ctx, 1320,0.2,  0.15, 0.3, 'square')
        })
    },

    // Navigate / page transition: single soft blip
    navigate() {
        play(ctx => beep(ctx, 600, 0.06, 0.18, 'sine'))
    },

    // Hint reveal: descending whisper
    hint() {
        play(ctx => {
            tone(ctx, 700, 0,   0.1, 0.2, 'sine')
            tone(ctx, 560, 0.1, 0.1, 0.15,'sine')
        })
    },
}

export const useSoundStore = defineStore('sound', {
    state: () => ({
        muted: JSON.parse(localStorage.getItem('ghost_sound_muted') || 'false'),
    }),
    actions: {
        toggle() {
            this.muted = !this.muted
            localStorage.setItem('ghost_sound_muted', String(this.muted))
        },
        play(name) {
            if (this.muted) return
            if (sounds[name]) sounds[name]()
        },
    },
})