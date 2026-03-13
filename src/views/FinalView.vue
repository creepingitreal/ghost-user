<template>
  <div class="final-wrap">
    <div class="scanlines" />
    <canvas ref="matrixCanvas" class="matrix-canvas" :class="{ active: solved }" />

    <!-- ── DEBRIEF PANEL ── -->
    <transition name="fade-out">
      <div v-if="!solved" class="debrief">
        <!-- Header -->
        <div class="debrief-header">
          <div class="eyebrow">OPERATION GHOST USER // FINAL DEBRIEF</div>
          <h1>CASE CLOSED?</h1>
          <p class="subtitle">
            You've collected {{ clues.length }} intelligence fragments. Assemble them.
            The perpetrator's identity is hidden in the sequence.
          </p>
        </div>

        <!-- Clue display -->
        <div class="clue-grid">
          <div
            v-for="(clue, i) in allClues"
            :key="i"
            class="clue-cell"
            :class="{ earned: clue.earned, locked: !clue.earned }"
          >
            <div class="clue-index">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="clue-word">{{ clue.earned ? clue.word : '░░░░░░░' }}</div>
            <div class="clue-source">{{ clue.source }}</div>
          </div>
        </div>

        <!-- Cipher hint -->
        <div class="cipher-hint">
          <span class="cipher-label">CIPHER</span>
          Take the <strong>first letter</strong> of each unlocked clue word, in order.
          The suspect's username begins with the result.
        </div>

        <!-- Answer form -->
        <div class="answer-section">
          <div class="answer-label">SUSPECT IDENTITY</div>
          <div class="answer-row">
            <input
              v-model="answer"
              class="answer-input"
              placeholder="enter username..."
              @keyup.enter="submit"
              :class="{ shake: shaking, wrong: wrongAttempt }"
            />
            <button class="submit-btn" @click="submit">
              <span>SUBMIT</span>
              <span class="btn-arrow">→</span>
            </button>
          </div>
          <div v-if="wrongAttempt" class="wrong-msg">
            ✗ &nbsp;That username doesn't match the evidence. Review your clues.
          </div>
        </div>

        <!-- Back link -->
        <router-link :to="{ name: 'home' }" class="back-link">← Return to HQ</router-link>
      </div>
    </transition>

    <!-- ── VICTORY SCREEN ── -->
    <transition name="fade-in">
      <div v-if="solved" class="victory">
        <div class="vic-content">
          <div class="vic-eyebrow">CASE CLOSED // SUSPECT IDENTIFIED</div>

          <div class="vic-target">
            <div class="vic-target-label">PRIMARY PERPETRATOR</div>
            <div class="vic-username">{{ answer }}</div>
          </div>

          <div class="vic-message">
            CASE FILE NX-2024-0603 RESOLVED<br>
            <span class="vic-sub">
              Evidence compiled. Arrest warrant issued.<br>
              436 MB of exfiltrated data traced to single actor.<br>
              Good work, Analyst.
            </span>
          </div>

          <div class="vic-stats">
            <div class="vic-stat">
              <div class="vic-stat-val">{{ clues.length }}</div>
              <div class="vic-stat-label">CLUES COLLECTED</div>
            </div>
            <div class="vic-stat">
              <div class="vic-stat-val">{{ attempts }}</div>
              <div class="vic-stat-label">ATTEMPTS</div>
            </div>
          </div>

          <router-link :to="{ name: 'home' }" class="vic-btn">
            ← RETURN TO HQ
          </router-link>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// ── All clues in order ────────────────────────────────────────────────────────
const BASIC_CLUES    = ['RECON','PHANTOM','EXODUS','BREACH','TRACED']
const ADVANCED_CLUES = ['VECTOR','TOOLKIT','INGRESS','PRIMARY','IDENTITY','ESCALATE','ERASURE','TIMELINE','IMPACT','UNMASKED']

// Load earned clues from localStorage
function loadProgress(mode, puzzleClues) {
    try {
        const saved = JSON.parse(localStorage.getItem(`ghost-${mode}-progress`) || '[]')
        return puzzleClues.map((word, i) => ({
            word,
            earned: !!saved[i]?.solved,
            source: `${mode.toUpperCase()} ${String(i + 1).padStart(2, '0')}`,
        }))
    } catch { return puzzleClues.map((word, i) => ({ word, earned: false, source: `${mode.toUpperCase()} ${String(i + 1).padStart(2, '0')}` })) }
}

const basicClueObjs    = ref([])
const advancedClueObjs = ref([])

onMounted(() => {
    basicClueObjs.value    = loadProgress('basic', BASIC_CLUES)
    advancedClueObjs.value = loadProgress('advanced', ADVANCED_CLUES)
})

const allClues = computed(() => [...basicClueObjs.value, ...advancedClueObjs.value])
const clues    = computed(() => allClues.value.filter(c => c.earned))

// The correct answer
const CORRECT = 'ghost_proc_44'

const answer      = ref('')
const solved      = ref(false)
const wrongAttempt = ref(false)
const shaking     = ref(false)
const attempts    = ref(0)

function submit() {
    attempts.value++
    if (answer.value.trim().toLowerCase() === CORRECT) {
        solved.value = true
        startMatrix()
    } else {
        wrongAttempt.value = true
        shaking.value = true
        setTimeout(() => { shaking.value = false }, 600)
    }
}

// ── Matrix rain ───────────────────────────────────────────────────────────────
const matrixCanvas = ref(null)
let raf2, mCtx, mCols, mDrops

function startMatrix() {
    const canvas = matrixCanvas.value
    if (!canvas) return
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    mCtx  = canvas.getContext('2d')
    mCols = Math.floor(canvas.width / 16)
    mDrops = Array.from({ length: mCols }, () => Math.random() * -50)

    function draw() {
        mCtx.fillStyle = 'rgba(0, 5, 0, 0.06)'
        mCtx.fillRect(0, 0, canvas.width, canvas.height)
        mCtx.font = '14px "Courier New", monospace'

        for (let i = 0; i < mCols; i++) {
            const chars = '01アイウエオカキクケコSQLGHOST▸◆░▒▓'
            const ch = chars[Math.floor(Math.random() * chars.length)]
            // leading char bright green
            mCtx.fillStyle = '#ffffff'
            mCtx.fillText(ch, i * 16, mDrops[i] * 16)
            // trail green
            mCtx.fillStyle = '#00ff88'
            mCtx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 16, (mDrops[i] - 1) * 16)

            if (mDrops[i] * 16 > canvas.height && Math.random() > 0.975) mDrops[i] = 0
            mDrops[i] += 0.5
        }
        raf2 = requestAnimationFrame(draw)
    }
    draw()
}

onUnmounted(() => { cancelAnimationFrame(raf2) })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.final-wrap {
    min-height: 100vh; background: #060c06;
    font-family: 'Rajdhani', sans-serif;
    color: #c8d8c8;
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
}

.scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background: repeating-linear-gradient(to bottom, transparent 0, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px);
}

.matrix-canvas {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    opacity: 0; transition: opacity 1s ease;
}
.matrix-canvas.active { opacity: 1; }

/* ── Debrief ── */
.debrief {
    position: relative; z-index: 2;
    max-width: 820px; width: 100%;
    padding: 2.5rem 2rem;
    display: flex; flex-direction: column; gap: 1.8rem;
}

.debrief-header { text-align: center; }
.eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.2em;
    color: rgba(0,255,136,0.35); margin-bottom: 0.6rem;
}
.debrief-header h1 {
    font-size: 2.4rem; font-weight: 700; letter-spacing: 0.1em;
    color: #00ff88; margin-bottom: 0.5rem;
}
.subtitle { font-size: 0.9rem; color: rgba(200,216,200,0.6); line-height: 1.6; }

/* ── Clue grid ── */
.clue-grid {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.6rem;
}
.clue-cell {
    border: 1px solid;
    padding: 0.6rem 0.5rem;
    display: flex; flex-direction: column; gap: 0.25rem;
    text-align: center;
    transition: border-color 0.3s;
}
.clue-cell.earned  { border-color: rgba(0,255,136,0.35); background: rgba(0,255,136,0.04); }
.clue-cell.locked  { border-color: rgba(255,255,255,0.07); background: rgba(0,0,0,0.2); }

.clue-index {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.55rem; color: rgba(0,255,136,0.3);
}
.clue-word {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em;
    color: #00ff88;
}
.clue-cell.locked .clue-word { color: rgba(200,216,200,0.15); }
.clue-source { font-size: 0.58rem; color: rgba(200,216,200,0.25); }

/* ── Cipher hint ── */
.cipher-hint {
    border: 1px solid rgba(255,200,0,0.2);
    background: rgba(255,200,0,0.04);
    padding: 0.75rem 1rem;
    font-size: 0.82rem; color: rgba(255,200,0,0.7);
    line-height: 1.6;
}
.cipher-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.18em;
    color: rgba(255,200,0,0.4); display: block; margin-bottom: 0.25rem;
}
.cipher-hint strong { color: #ffc800; }

/* ── Answer ── */
.answer-section { display: flex; flex-direction: column; gap: 0.6rem; }
.answer-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.18em;
    color: rgba(0,255,136,0.4);
}
.answer-row { display: flex; gap: 0.6rem; }
.answer-input {
    flex: 1;
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(0,255,136,0.3);
    color: #00ff88; padding: 0.7rem 1rem;
    font-family: 'Share Tech Mono', monospace; font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
}
.answer-input:focus { border-color: #00ff88; }
.answer-input.wrong { border-color: rgba(255,68,68,0.5); }

@keyframes shake {
    0%,100% { transform: translateX(0); }
    20%,60%  { transform: translateX(-6px); }
    40%,80%  { transform: translateX(6px); }
}
.answer-input.shake { animation: shake 0.5s ease; }

.submit-btn {
    display: flex; align-items: center; gap: 0.6rem;
    background: transparent;
    border: 1px solid rgba(0,255,136,0.45);
    color: #00ff88; padding: 0.7rem 1.4rem;
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.82rem; font-weight: 600; letter-spacing: 0.15em;
    cursor: pointer; transition: all 0.2s;
}
.submit-btn:hover { background: rgba(0,255,136,0.08); border-color: #00ff88; }
.btn-arrow { font-size: 1rem; }

.wrong-msg {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.72rem; color: #ff6666;
}

.back-link {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.1em;
    color: rgba(0,255,136,0.35); text-decoration: none;
    align-self: flex-start; transition: color 0.2s;
}
.back-link:hover { color: #00ff88; }

/* ── Victory ── */
.victory {
    position: fixed; inset: 0; z-index: 10;
    display: flex; align-items: center; justify-content: center;
    padding: 2rem;
}
.vic-content {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; align-items: center;
    gap: 1.6rem; text-align: center;
    max-width: 560px;
    background: rgba(0, 8, 0, 0.85);
    border: 1px solid rgba(0,255,136,0.3);
    padding: 3rem 2.5rem;
}
.vic-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.2em;
    color: rgba(0,255,136,0.4);
}
.vic-target {
    display: flex; flex-direction: column; gap: 0.3rem;
}
.vic-target-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.18em;
    color: rgba(0,255,136,0.35);
}
.vic-username {
    font-family: 'Share Tech Mono', monospace;
    font-size: 2rem; font-weight: 700; letter-spacing: 0.12em;
    color: #00ff88;
    text-shadow: 0 0 30px rgba(0,255,136,0.5);
    animation: victoryPulse 2s ease-in-out infinite;
}
@keyframes victoryPulse {
    0%,100% { text-shadow: 0 0 30px rgba(0,255,136,0.5); }
    50%     { text-shadow: 0 0 60px rgba(0,255,136,0.9), 0 0 80px rgba(0,255,136,0.4); }
}
.vic-message {
    font-size: 0.82rem; line-height: 1.8; color: rgba(200,216,200,0.7);
    font-weight: 600; letter-spacing: 0.05em;
}
.vic-sub { font-size: 0.75rem; color: rgba(200,216,200,0.45); }
.vic-stats {
    display: flex; gap: 3rem;
}
.vic-stat { display: flex; flex-direction: column; gap: 0.2rem; align-items: center; }
.vic-stat-val {
    font-family: 'Share Tech Mono', monospace;
    font-size: 1.6rem; color: #00ff88;
}
.vic-stat-label {
    font-size: 0.6rem; letter-spacing: 0.15em;
    color: rgba(200,216,200,0.35);
}
.vic-btn {
    display: inline-block;
    border: 1px solid rgba(0,255,136,0.4);
    color: #00ff88;
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.8rem; font-weight: 600; letter-spacing: 0.15em;
    padding: 0.65rem 1.6rem;
    text-decoration: none;
    transition: all 0.2s;
}
.vic-btn:hover { background: rgba(0,255,136,0.08); }

/* ── Transitions ── */
.fade-out-leave-active { transition: opacity 0.8s ease; }
.fade-out-leave-to    { opacity: 0; }
.fade-in-enter-active { transition: opacity 0.8s ease 0.5s; }
.fade-in-enter-from   { opacity: 0; }
</style>
