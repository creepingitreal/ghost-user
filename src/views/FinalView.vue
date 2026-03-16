<template>
  <div class="final">
    <div class="scanline" />
    <canvas ref="matrixCanvas" class="matrix" :class="{ active: stage === 'victory' }" />

    <!-- ── BASIC COMPLETE — intermediate screen ── -->
    <transition name="fade-out">
      <div v-if="stage === 'basic-complete'" class="debrief">
        <div class="db-header">
          <div class="eyebrow">OPERATION GHOST USER // BASIC TRACK COMPLETE</div>
          <h1 class="db-title green">FIELD ANALYSIS CONFIRMED</h1>
          <p class="db-sub">
            You've mapped the database, identified the ghost accounts, traced the data
            outflow, found the entry point, and pinned the origin IP. Solid work —
            but the case isn't closed. The identity of the person behind this operation
            is still unknown. That requires the Advanced Investigation.
          </p>
        </div>

        <div class="evidence-block">
          <div class="evidence-label">EVIDENCE COLLECTED — BASIC TRACK</div>
          <div class="clue-grid">
            <div v-for="(c, i) in basicClueObjs" :key="i" class="clue-cell" :class="c.earned ? 'earned' : 'locked'">
              <div class="ci">B{{ String(i+1).padStart(2,'0') }}</div>
              <div class="cw">{{ c.earned ? c.word : '░░░░░░░' }}</div>
            </div>
          </div>
        </div>

        <div class="cipher">
          <span class="cipher-label">WHAT COMES NEXT</span>
          The Advanced Investigation goes deeper — sessions, network packets, privilege
          escalation, and the complete attack timeline. At the end, you will identify
          the suspect by name. The username is in the database. You'll find it.
        </div>

        <div class="input-section">
          <button class="sub-btn" @click="goAdvanced">
            [ BEGIN ADVANCED INVESTIGATION → ]
          </button>
        </div>

        <BackToHQ label="← Return to HQ" btn-class="back-link-btn" />
      </div>
    </transition>

    <!-- ── ADVANCED DEBRIEF — identify the suspect ── -->
    <transition name="fade-out">
      <div v-if="stage === 'debrief'" class="debrief">
        <div class="db-header">
          <div class="eyebrow">OPERATION GHOST USER // FINAL DEBRIEF</div>
          <h1 class="db-title">IDENTIFY THE SUSPECT</h1>
          <p class="db-sub">
            {{ earnedCount }} of {{ allClues.length }} evidence markers collected.
            You've traced the breach from first probe to final logout. One question remains.
          </p>
        </div>

        <!-- Evidence trail -->
        <div class="evidence-block">
          <div class="evidence-label">FULL EVIDENCE TRAIL</div>
          <div class="clue-grid">
            <div v-for="(c, i) in allClues" :key="i" class="clue-cell" :class="c.earned ? 'earned' : 'locked'">
              <div class="ci">{{ String(i+1).padStart(2,'0') }}</div>
              <div class="cw">{{ c.earned ? c.word : '░░░░░░░' }}</div>
              <div class="cs">{{ c.source }}</div>
            </div>
          </div>
        </div>

        <!-- Case summary -->
        <div class="cipher">
          <span class="cipher-label">CASE SUMMARY</span>
          A coordinated intrusion on June 3rd. Four compromised accounts. Automated tooling.
          Privilege escalation to root in under two minutes. 436 MB exfiltrated over HTTPS.
          Forty-four audit entries erased to cover the trail.<br><br>
          During the investigation you pulled a direct database record that revealed the
          username of the primary account — the one purpose-built for this operation.
          <strong>That username is the answer.</strong>
        </div>

        <!-- Answer input -->
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
                spellcheck="false"
            />
            <button class="sub-btn" @click="submit">[ SUBMIT ]</button>
          </div>
          <div v-if="wrongMsg" class="wrong-msg">✗ {{ wrongMsg }}</div>
          <div v-if="earnedCount < allClues.length" class="missing-note">
            ⚠ {{ allClues.length - earnedCount }} evidence marker(s) still locked — complete all tasks for the full picture.
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
              <span class="vs-l">MARKERS</span>
            </div>
            <div class="vic-stat">
              <span class="vs-n">{{ attempts }}</span>
              <span class="vs-l">ATTEMPTS</span>
            </div>
          </div>
          <BackToHQ label="←&nbspReturn to HQ" btn-class="back-link-btn" />
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
import BackToHQ from "../components/BackToHQ.vue";

const route         = useRoute()
const router        = useRouter()
const progressStore = useProgressStore()
const soundStore    = useSoundStore()

const CORRECT = 'ghost_proc_44'

const incomingMode = computed(() => route.params?.mode || 'advanced')
const stage = ref(incomingMode.value === 'basic' ? 'basic-complete' : 'debrief')

// ── Build evidence marker objects ─────────────────────────────────────────────
function buildClues(mode, tasks) {
  return tasks.map((t, i) => ({
    word:   t.clue,
    earned: progressStore.isSolved(mode, t.id),
    source: `${mode === 'basic' ? 'BAS' : 'ADV'} ${String(i + 1).padStart(2, '0')}`,
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

// ── Answer ────────────────────────────────────────────────────────────────────
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
    wrongMsg.value = `That username doesn't match our records. The account you're looking for was identified in Advanced Task 5.`
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