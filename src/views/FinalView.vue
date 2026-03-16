<template>
  <div class="final scanlines">
    <div class="nav">
      <button class="btn-ghost sm" @click="goHome">← Back to HQ</button>
      <div class="nav-right">
          <span class="mode-pill" :class="mode">
            {{ mode === 'basic' ? '▶ Basic' : '⚡ Advanced' }}
          </span>
        <span class="task-count">Task {{ currentIndex + 1 }} / {{ totalTasks }}</span>
        <span class="timer-display">{{ timerStore.displayTime }}</span>

        <button class="btn-ghost sm mute-btn" @click="soundStore.toggle()" :title="soundStore.muted ? 'Unmute' : 'Mute'">
          {{ soundStore.muted ? '🔇' : '🔊' }}
        </button>

        <button class="btn-ghost sm mute-btn" @click="resetProgress">
          🔁
        </button>


        <button class="btn-ghost sm mute-btn" @click="theme.toggle()">
          {{ theme.mode === 'light' ? '🌙' : '☀️' }}
        </button>
      </div>
    </div>
    <canvas ref="matrixCanvas" class="matrix" :class="{ active: solved }" />

    <!-- ── DEBRIEF ── -->
    <transition name="fade-out">
      <div v-if="!solved" class="debrief">
        <div class="db-header">
          <div class="eyebrow">OPERATION GHOST USER // FINAL DEBRIEF</div>
          <h1 class="db-title">CASE CLOSED?</h1>
          <p class="db-sub">
            You've collected {{ earnedCount }} of {{ allClues.length }} intelligence fragments.
            Assemble them. The perpetrator's identity is encoded in the sequence.
          </p>
        </div>

        <!-- Clue grid -->
        <div class="clue-grid">
          <div
            v-for="(c, i) in allClues"
            :key="i"
            class="clue-cell"
            :class="c.earned ? 'earned' : 'locked'"
          >
            <div class="ci">{{ String(i+1).padStart(2,'0') }}</div>
            <div class="cw">{{ c.earned ? c.word : '░░░░░░░' }}</div>
            <div class="cs">{{ c.source }}</div>
          </div>
        </div>

        <!-- Cipher -->
        <div class="cipher">
          <span class="cipher-label">CIPHER KEY</span>
          Take the <strong>first letter</strong> of each unlocked clue word, in order.
          The result reveals the suspect's username.
        </div>

        <!-- Input -->
        <div class="input-section">
          <div class="input-label">SUSPECT USERNAME</div>
          <div class="input-row">
            <input
              v-model="answer"
              class="sus-input"
              :class="{ shake: shaking }"
              placeholder="enter username..."
              @keyup.enter="submit"
            />
            <button class="sub-btn" @click="submit">[ SUBMIT ]</button>
          </div>
          <div v-if="wrongMsg" class="wrong-msg">✗ {{ wrongMsg }}</div>
        </div>

        <router-link :to="{ name: 'home' }" class="back-link">← return to HQ</router-link>
      </div>
    </transition>

    <!-- ── VICTORY ── -->
    <transition name="fade-in">
      <div v-if="solved" class="victory">
        <div class="vic-box">
          <div class="vic-eye">CASE CLOSED // NX-2024-0603</div>
          <div class="vic-label">PRIMARY SUSPECT IDENTIFIED</div>
          <div class="vic-name">{{ answer }}</div>
          <div class="vic-divider" />
          <div class="vic-msg">
            WARRANT ISSUED. EVIDENCE COMPILED.<br>
            436 MB OF EXFILTRATED DATA TRACED TO SINGLE ACTOR.<br>
            <span class="vic-sub">Good work, Analyst.</span>
          </div>
          <div class="vic-stats">
            <div class="vic-stat">
              <span class="vs-n">{{ earnedCount }}</span>
              <span class="vs-l">CLUES</span>
            </div>
            <div class="vic-stat">
              <span class="vs-n">{{ attempts }}</span>
              <span class="vs-l">ATTEMPTS</span>
            </div>
          </div>
          <router-link :to="{ name: 'home' }" class="vic-btn">[ RETURN TO HQ ]</router-link>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import '../assets/final-view.css'
import { ref, computed, onMounted, onUnmounted } from 'vue'

const BASIC_CLUES    = ['RECON','PHANTOM','EXODUS','BREACH','TRACED']
const ADVANCED_CLUES = ['VECTOR','TOOLKIT','INGRESS','PRIMARY','IDENTITY','ESCALATE','ERASURE','TIMELINE','IMPACT','UNMASKED']
const CORRECT        = 'ghost_proc_44'

function loadClues(mode, words) {
  try {
    const prog = JSON.parse(localStorage.getItem(`ghost-${mode}-progress`) || '[]')
    return words.map((word, i) => ({
      word,
      earned: !!prog[i]?.solved,
      source: `${mode.slice(0,3).toUpperCase()} ${String(i+1).padStart(2,'0')}`,
    }))
  } catch {
    return words.map((word, i) => ({ word, earned: false, source: '' }))
  }
}

const allClues   = ref([])
const earnedCount = computed(() => allClues.value.filter(c => c.earned).length)

onMounted(() => {
  allClues.value = [
    ...loadClues('basic', BASIC_CLUES),
    ...loadClues('advanced', ADVANCED_CLUES),
  ]
})

const answer   = ref('')
const solved   = ref(false)
const shaking  = ref(false)
const wrongMsg = ref('')
const attempts = ref(0)

function submit() {
  attempts.value++
  if (answer.value.trim().toLowerCase() === CORRECT) {
    wrongMsg.value = ''
    solved.value = true
    startMatrix()
  } else {
    wrongMsg.value = 'That username does not match the evidence. Check your clue sequence.'
    shaking.value = true
    setTimeout(() => { shaking.value = false }, 600)
  }
}

// ── Matrix rain ───────────────────────────────────────────────────────────────
const matrixCanvas = ref(null)
let raf

function startMatrix() {
  const c = matrixCanvas.value
  if (!c) return
  c.width  = window.innerWidth
  c.height = window.innerHeight
  const ctx   = c.getContext('2d')
  const cols  = Math.floor(c.width / 16)
  const drops = Array.from({ length: cols }, () => Math.random() * -80)
  const chars = '01アイウGHOST_PROC_44░▒▓◆SQL'

  function draw() {
    ctx.fillStyle = 'rgba(0,5,0,0.05)'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.font = '14px "Share Tech Mono", monospace'

    for (let i = 0; i < cols; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)]
      ctx.fillStyle = '#ffffff'
      ctx.fillText(ch, i * 16, drops[i] * 16)
      ctx.fillStyle = '#00ff41'
      const ch2 = chars[Math.floor(Math.random() * chars.length)]
      ctx.fillText(ch2, i * 16, (drops[i] - 1) * 16)
      if (drops[i] * 16 > c.height && Math.random() > 0.975) drops[i] = 0
      drops[i] += 0.55
    }
    raf = requestAnimationFrame(draw)
  }
  draw()
}

onUnmounted(() => cancelAnimationFrame(raf))
</script>
