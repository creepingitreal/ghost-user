<template>
  <div class="final">
    <div class="scanline" />
    <canvas ref="matrixCanvas" class="matrix" :class="{ active: stage === 'victory' }" />

    <!-- ── BASIC COMPLETE ── intermediate screen → push to advanced -->
    <transition name="fade-out">
      <div v-if="stage === 'basic-complete'" class="debrief">
        <div class="db-header">
          <div class="eyebrow">OPERATION GHOST USER // BASIC TRACK COMPLETE</div>
          <h1 class="db-title green">FIELD ANALYSIS CONFIRMED</h1>
          <p class="db-sub">
            You've proven your credentials, Analyst. But the case isn't closed.
            The Ghost User is still at large. The Advanced Investigation awaits.
          </p>
        </div>

        <div class="clue-grid">
          <div v-for="(c, i) in basicClueObjs" :key="i" class="clue-cell" :class="c.earned ? 'earned' : 'locked'">
            <div class="ci">B{{ String(i+1).padStart(2,'0') }}</div>
            <div class="cw">{{ c.earned ? c.word : '░░░░░░░' }}</div>
          </div>
        </div>

        <div class="cipher amber-cipher">
          <span class="cipher-label">PRELIMINARY FINDINGS</span>
          You've collected {{ basicEarned }}/5 basic clues. Take the first letter of each:
          <strong class="cipher-letters">{{ basicFirstLetters }}</strong>
          — this is only half the picture. The full perpetrator identity requires the Advanced track.
        </div>

        <div class="input-section">
          <div class="input-label">PARTIAL CODE CONFIRMED</div>
          <p class="partial-note">
            Your basic clues spell: <strong class="green">{{ basicFirstLetters }}</strong><br>
            Complete the Advanced Investigation to reveal the full suspect identity.
          </p>
          <button class="sub-btn" @click="goAdvanced">
            [ BEGIN ADVANCED INVESTIGATION → ]
          </button>
        </div>

        <router-link :to="{ name: 'home' }" class="back-link">← Return to HQ</router-link>
      </div>
    </transition>

    <!-- ── ADVANCED DEBRIEF — solve the cipher ── -->
    <transition name="fade-out">
      <div v-if="stage === 'debrief'" class="debrief">
        <div class="db-header">
          <div class="eyebrow">OPERATION GHOST USER // FINAL DEBRIEF</div>
          <h1 class="db-title">CASE CLOSED?</h1>
          <p class="db-sub">
            {{ earnedCount }} of {{ allClues.length }} clue fragments collected.
            Assemble them. The perpetrator's identity is encoded in the sequence.
          </p>
        </div>

        <div class="clue-grid">
          <div v-for="(c, i) in allClues" :key="i" class="clue-cell" :class="c.earned ? 'earned' : 'locked'">
            <div class="ci">{{ String(i+1).padStart(2,'0') }}</div>
            <div class="cw">{{ c.earned ? c.word : '░░░░░░░' }}</div>
            <div class="cs">{{ c.source }}</div>
          </div>
        </div>

        <div class="cipher">
          <span class="cipher-label">CIPHER KEY</span>
          Take the <strong>first letter</strong> of each clue word in order.
          The sequence spells the suspect's username.
          <br><br>
          <span class="cipher-example">
            e.g. RECON → <strong>R</strong>, VECTOR → <strong>V</strong> ...
            reading all first letters gives you the login handle.
          </span>
        </div>

        <div class="input-section">
          <div class="input-label">SUSPECT USERNAME</div>
          <div class="input-row">
            <input
                v-model="answer"
                class="sus-input"
                :class="{ shake: shaking }"
                placeholder="enter username..."
                @keyup.enter="submit"
                autocomplete="off"
            />
            <button class="sub-btn" @click="submit">[ SUBMIT ]</button>
          </div>
          <div v-if="wrongMsg" class="wrong-msg">✗ {{ wrongMsg }}</div>
          <div v-if="earnedCount < allClues.length" class="missing-note">
            ⚠ {{ allClues.length - earnedCount }} clue(s) missing — complete all tasks for full evidence.
          </div>
        </div>

        <router-link :to="{ name: 'home' }" class="back-link">← Return to HQ</router-link>
      </div>
    </transition>

    <!-- ── VICTORY ── -->
    <transition name="fade-in">
      <div v-if="stage === 'victory'" class="victory">
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
import { useRoute, useRouter } from 'vue-router'
import { useProgressStore } from '../stores/progressStore.js'
import { useSoundStore }    from '../stores/soundStore.js'
import { basicTasks }       from '../validators/basic.js'
import { advancedTasks }    from '../validators/advanced.js'

const route         = useRoute()
const router        = useRouter()
const progressStore = useProgressStore()
const soundStore    = useSoundStore()

const CORRECT = 'ghost_proc_44'

// Which mode brought us here
const incomingMode = computed(() => route.params?.mode || 'advanced')

// stage: 'basic-complete' | 'debrief' | 'victory'
const stage = ref(incomingMode.value === 'basic' ? 'basic-complete' : 'debrief')

// ── Clue objects ──────────────────────────────────────────────────────────────
function buildClues(mode, tasks) {
  return tasks.map((t, i) => ({
    word:   t.clue,
    earned: progressStore.isSolved(mode, t.id),
    source: `${mode.slice(0,3).toUpperCase()} ${String(i+1).padStart(2,'0')}`,
  }))
}

const basicClueObjs    = ref([])
const advancedClueObjs = ref([])

onMounted(() => {
  basicClueObjs.value    = buildClues('basic',    basicTasks)
  advancedClueObjs.value = buildClues('advanced', advancedTasks)
})

const allClues    = computed(() => [...basicClueObjs.value, ...advancedClueObjs.value])
const earnedCount = computed(() => allClues.value.filter(c => c.earned).length)
const basicEarned = computed(() => basicClueObjs.value.filter(c => c.earned).length)

const basicFirstLetters = computed(() =>
    basicClueObjs.value
        .filter(c => c.earned)
        .map(c => c.word[0])
        .join('')
)

// ── Answer & submission ───────────────────────────────────────────────────────
const answer   = ref('')
const wrongMsg = ref('')
const shaking  = ref(false)
const attempts = ref(0)

function submit() {
  attempts.value++
  if (answer.value.trim().toLowerCase() === CORRECT) {
    wrongMsg.value = ''
    stage.value    = 'victory'
    soundStore.play('victory')
    startMatrix()
  } else {
    wrongMsg.value = 'That username does not match the evidence. Check your clue sequence.'
    shaking.value  = true
    soundStore.play('wrong')
    setTimeout(() => { shaking.value = false }, 600)
  }
}

function goAdvanced() {
  router.push({ name: 'task', params: { mode: 'advanced', id: 1 } })
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
      ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 16, (drops[i] - 1) * 16)
      if (drops[i] * 16 > c.height && Math.random() > 0.975) drops[i] = 0
      drops[i] += 0.55
    }
    raf = requestAnimationFrame(draw)
  }
  draw()
}

onUnmounted(() => cancelAnimationFrame(raf))
</script>
