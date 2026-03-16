<template>
  <div class="tv scanline-overlay">
    <div class="tv-inner">

      <!-- ── Nav ── -->
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

      <!-- ── Progress bar + nodes ── -->
      <div class="pbar-wrap">
        <div class="pbar-track">
          <div class="pbar-fill" :style="{ width: progressPct + '%' }" />
        </div>
        <div class="pbar-nodes">
          <div
              v-for="(t, i) in tasks" :key="t.id"
              class="pnode"
              :class="{
              done:   progressStore.isSolved(mode, t.id),
              active: i === currentIndex,
              locked: i > currentIndex && !progressStore.isSolved(mode, t.id),
            }"
              @click="navigateTo(i)"
              :title="`Task ${i+1}${progressStore.isSolved(mode, t.id) ? ' ✓' : ''}`"
          >
            <span v-if="progressStore.isSolved(mode, t.id)">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
        </div>
      </div>

      <!-- ── Acquired clues ── -->
      <div v-if="acquiredClues.length > 0" class="clues-bar">
        <span class="clues-lbl">CLUES:</span>
        <span v-for="c in acquiredClues" :key="c" class="clue-chip">{{ c }}</span>
        <span v-for="i in (totalTasks - acquiredClues.length)" :key="'e'+i" class="clue-chip empty">???</span>
      </div>

      <!-- ── Story panel ── -->
      <div class="panel story-panel">
        <div class="panel-hdr" @click="storyOpen = !storyOpen">
          <span class="green">{{ storyOpen ? '▼' : '▶' }}</span>
          <span class="panel-title">Mission Briefing — Task {{ currentIndex + 1 }}</span>
          <span class="panel-hint">{{ storyOpen ? 'collapse' : 'expand' }}</span>
        </div>
        <transition name="slide">
          <div v-if="storyOpen" class="panel-body">
            <pre class="story-text">{{ task.story }}</pre>
          </div>
        </transition>
      </div>

      <!-- ── Schema helper ── -->
      <div class="schema-row">
        <button class="btn-ghost sm" @click="schemaOpen = !schemaOpen">
          {{ schemaOpen ? '▼ Hide' : '▶ Show' }} Database Schema
        </button>
        <transition name="fade">
          <div v-if="schemaOpen" class="schema-panel">
            <div class="schema-chips">
              <code v-for="q in schemaQueries" :key="q" class="schema-chip" @click="inject(q)">{{ q }}</code>
            </div>
            <span class="schema-note">↑ click any query to insert</span>
          </div>
        </transition>
      </div>

      <!-- ── Editor (hidden once solved) ── -->
      <transition name="fade">
        <div v-if="!solved" class="editor-section">
          <label class="prompt-lbl">🔍 {{ task.prompt }}</label>
          <!-- ── Hint + Solution ── -->
          <div v-if="!solved" class="assist-row">
            <div class="assist-col">
              <button class="btn-assist hint-btn" @click="toggleHint">
                {{ hintOpen ? '▼ Hide Hint' : '▸ Show Hint' }}
                <span v-if="hintIdx > 0" class="hint-cnt">({{ hintIdx }}/{{ task.hints.length }})</span>
              </button>
              <transition name="fade">
                <div v-if="hintOpen" class="assist-body hint-body">
                  <pre v-if="isCode(currentHint)" class="hint-code">{{ currentHint }}</pre>
                  <p v-else class="hint-prose">{{ currentHint }}</p>
                  <div class="assist-links">
                    <button v-if="hintIdx < task.hints.length - 1" class="alink" @click="nextHint">Next hint →</button>
                    <button v-if="isCode(currentHint)" class="alink green-link" @click="inject(currentHint)">↑ Insert into editor</button>
                  </div>
                </div>
              </transition>
            </div>

            <div class="assist-col">
              <button class="btn-assist sol-btn" @click="toggleSolution">
                {{ solOpen ? '▼ Hide Solution' : '▸ Show Solution' }}
              </button>
              <transition name="fade">
                <div v-if="solOpen" class="assist-body sol-body">
                  <pre class="hint-code sol-code">{{ task.solution }}</pre>
                  <div class="assist-links">
                    <button class="alink green-link" @click="inject(task.solution)">↑ Insert into editor</button>
                  </div>
                  <p class="sol-warn">⚠ Solution used — clue marked as assisted</p>
                </div>
              </transition>
            </div>
          </div>
          <div class="editor-wrap" :class="{ focused: edFocused }">
            <textarea
                v-model="sqlInput"
                class="sql-ed"
                rows="6"
                placeholder="Write your SQL query here..."
                spellcheck="false"
                @keydown.ctrl.enter.prevent="runQuery"
                @keydown.meta.enter.prevent="runQuery"
                @keydown="soundStore.play('keypress')"
                @focus="edFocused = true"
                @blur="edFocused = false"
            />
            <div class="ed-footer">
              <span class="ed-hint">Ctrl+Enter to run</span>
              <div class="ed-actions">
                <button class="btn-ghost sm" @click="clearEditor" :disabled="!sqlInput">✕ Clear</button>
                <button class="btn-primary" @click="runQuery" :disabled="running || !sqlInput.trim()">
                  <span v-if="running" class="spinner">⟳</span>
                  {{ running ? 'Running…' : '▶ Run Query' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- ── Results ── -->
      <transition name="fade">
        <div v-if="queryResult !== null" class="result-panel">
          <div class="result-hdr">
            <span class="dim-lbl">RESULTS</span>
            <span class="green-sm">{{ rowCount }} row{{ rowCount !== 1 ? 's' : '' }}</span>
          </div>
          <ResultsTable :results="queryResult" />
        </div>
      </transition>

      <!-- ── Error ── -->
      <transition name="fade">
        <div v-if="queryError" class="error-panel">
          <span class="err-icon">⚠</span>
          <div class="err-body">
            <strong>Query Error</strong>
            <span>{{ queryError }}</span>
          </div>
        </div>
      </transition>

      <!-- ── Answer input (shown when results exist and not yet solved) ── -->
      <transition name="fade">
        <div v-if="(queryResult !== null || queryError) && !solved" class="answer-panel">
          <label class="dim-lbl">📋 Enter your answer:</label>
          <div class="answer-row">
            <input
                v-model="userAnswer"
                class="answer-in"
                type="text"
                placeholder="your answer here…"
                @keyup.enter="submitAnswer"
            />
            <button class="btn-primary" @click="submitAnswer" :disabled="!userAnswer.trim()">
              ✓ Submit
            </button>
          </div>
          <p v-if="attemptCount > 1" class="attempt-note">Attempt {{ attemptCount }}</p>
        </div>
      </transition>

      <!-- ── Feedback ── -->
      <transition name="pop">
        <div v-if="feedback" class="feedback-panel" :class="feedback.correct ? 'fb-ok' : 'fb-bad'">
          <template v-if="feedback.correct">
            <div class="clue-reveal">
              <div class="cu-label">▮ CLUE FRAGMENT ACQUIRED</div>
              <div class="clue-word-row">
                <span class="clue-word" :class="{ assisted: wasAssisted }">{{ task.clue }}</span>
                <span v-if="wasAssisted" class="assisted-tag">⚠ ASSISTED</span>
              </div>
            </div>
            <p class="fb-msg">{{ feedback.message }}</p>
            <button class="btn-next" @click="nextTask">
              {{ isLast ? '🏁 Complete Investigation' : '▶ Continue Investigation →' }}
            </button>
          </template>
          <template v-else>
            <div class="fb-wrong">
              <span class="wrong-x">✗</span>
              <p>{{ feedback.message }}</p>
            </div>
          </template>
        </div>
      </transition>

    </div><!-- /terminal-inner -->
  </div><!-- /terminal -->
</template>

<script setup>
import '../assets/task-view.css'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ResultsTable      from '../components/ResultsTable.vue'
import { useDb }         from '../composables/useDb'
import { useProgressStore } from '../stores/progressStore'
import { useSoundStore }    from '../stores/soundStore'
import { useTimerStore }    from '../stores/timerStore'
import { basicTasks }       from '../validators/basic'
import { advancedTasks }    from '../validators/advanced'
import {useThemeStore} from "../stores/themeStore.js";

const route   = useRoute()
const router  = useRouter()
const db      = useDb()
const progressStore = useProgressStore()
const theme = useThemeStore()
const soundStore    = useSoundStore()
const timerStore    = useTimerStore()

// ── Refresh warning ───────────────────────────────────────────────────────────
function onBeforeUnload(e) {
  e.preventDefault()
  e.returnValue = 'Refreshing will clear your investigation progress. Continue?'
  return e.returnValue
}
onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  timerStore.start()
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
})

// ── Task setup ────────────────────────────────────────────────────────────────
const mode  = route.params.mode
const tasks = mode === 'basic' ? basicTasks : advancedTasks
const totalTasks = tasks.length

const currentIndex = computed(() => {
  const id  = parseInt(route.params.id)
  const idx = tasks.findIndex(t => t.id === id)
  return idx >= 0 ? idx : 0
})
const task    = computed(() => tasks[currentIndex.value])
const isLast  = computed(() => currentIndex.value === totalTasks - 1)

const progressPct = computed(() => (currentIndex.value / totalTasks) * 100)

const acquiredClues = computed(() => {
  return tasks
      .filter(t => progressStore.isSolved(mode, t.id))
      .map(t => {
        const entry = progressStore.getEntry(mode, t.id)
        return entry?.clue || t.clue
      })
})

// ── Editor state ──────────────────────────────────────────────────────────────
const sqlInput    = ref('')
const userAnswer  = ref('')
const queryResult = ref(null)
const queryError  = ref(null)
const feedback    = ref(null)
const running     = ref(false)
const edFocused   = ref(false)
const schemaOpen  = ref(false)
const storyOpen   = ref(true)
const attemptCount = ref(0)
const wasAssisted  = ref(false)
const solved       = ref(false)

const rowCount = computed(() => queryResult.value?.[0]?.values?.length ?? 0)

const schemaQueries = [
  'DESCRIBE users;', 'DESCRIBE transactions;', 'DESCRIBE audit_logs;',
  'DESCRIBE sessions;', 'DESCRIBE network_events;', 'SHOW TABLES;',
]

// ── Hints ─────────────────────────────────────────────────────────────────────
const hintOpen = ref(false)
const hintIdx  = ref(0)
const currentHint = computed(() => task.value.hints?.[hintIdx.value] ?? '')

function isCode(h) {
  return h.includes('\n') || /^(SELECT|WITH|DESCRIBE|SHOW)\b/i.test(h.trim())
}
function toggleHint() {
  hintOpen.value = !hintOpen.value
  if (hintOpen.value) { wasAssisted.value = true; soundStore.play('hint') }
}
function nextHint() {
  if (hintIdx.value < (task.value.hints?.length ?? 0) - 1) {
    hintIdx.value++
    wasAssisted.value = true
    soundStore.play('hint')
  }
}

// ── Solution ──────────────────────────────────────────────────────────────────
const solOpen = ref(false)
function toggleSolution() {
  solOpen.value = !solOpen.value
  if (solOpen.value) wasAssisted.value = true
}

// ── Actions ───────────────────────────────────────────────────────────────────
function inject(q) {
  sqlInput.value   = q.trim()
  schemaOpen.value = false
}

function clearEditor() {
  sqlInput.value   = ''
  queryResult.value = null
  queryError.value  = null
  feedback.value    = null
}

async function runQuery() {
  if (!sqlInput.value.trim() || running.value) return
  soundStore.play('runQuery')
  running.value     = true
  queryResult.value = null
  queryError.value  = null
  feedback.value    = null
  try {
    queryResult.value = await db.exec(sqlInput.value)
  } catch (e) {
    queryError.value = e.message
    soundStore.play('error')
  } finally {
    running.value = false
  }
}

function submitAnswer() {
  queryError.value = null;
  if (!userAnswer.value.trim()) return
  attemptCount.value++
  const v = task.value.validate(queryResult.value, userAnswer.value)
  if (v === true) {
    solved.value = true
    progressStore.markSolved(mode, task.value.id, {
      assisted: wasAssisted.value,
      clue:     task.value.clue,
      timeMs:   timerStore.elapsedMs,
    })
    soundStore.play('correct')
    setTimeout(() => soundStore.play('clueUnlock'), 600)
    storyOpen.value = false
    feedback.value  = { correct: true, message: successMsg(currentIndex.value) }
  } else {
    soundStore.play('wrong')
    feedback.value = {
      correct: false,
      message: typeof v === 'string' ? v : 'Incorrect. Re-examine your results.',
    }
  }
}

// ── Next task — THE FIX ───────────────────────────────────────────────────────
function nextTask() {
  soundStore.play('navigate')
  if (isLast.value) {
    // Pass mode so FinalView knows which track completed
    router.push({ name: 'final', params: { mode } })
  } else {
    const nextTask = tasks[currentIndex.value + 1]
    router.push({ name: 'task', params: { mode, id: String(nextTask.id) } })
  }
}

function goHome() {
  soundStore.play('navigate')
  router.push({ name: 'home' })
}

function navigateTo(idx) {
  const target = tasks[idx]
  if (progressStore.isSolved(mode, target.id) || idx <= currentIndex.value) {
    soundStore.play('navigate')
    router.push({ name: 'task', params: { mode, id: String(target.id) } })
  }
}

function successMsg(idx) {
  const m = [
    'Solid. The picture is beginning to form.',
    'Good work. Another piece falls into place.',
    "Confirmed. The data doesn't lie — even when someone tries to erase it.",
    "Excellent. The Ghost User's trail grows clearer.",
    "Outstanding. You're thinking like an investigator now.",
    'Remarkable. Most analysts miss that.',
    'The net is tightening.',
    'Every query brings us closer.',
    'Almost there.',
    'Case closed. The Ghost User has been unmasked.',
  ]
  return m[idx] ?? 'Confirmed.'
}

// ── Reset on task change ──────────────────────────────────────────────────────
watch(() => route.params.id, () => {
  sqlInput.value    = ''
  userAnswer.value  = ''
  queryResult.value = null
  queryError.value  = null
  feedback.value    = null
  attemptCount.value = 0
  wasAssisted.value  = false
  hintOpen.value     = false
  hintIdx.value      = 0
  solOpen.value      = false
  storyOpen.value    = true
  schemaOpen.value   = false
  solved.value       = false

  // Check if already solved
  if (progressStore.isSolved(mode, parseInt(route.params.id))) {
    solved.value    = true
    storyOpen.value = false
  }
}, { immediate: true })

function resetProgress() {
  if (confirm("Reset all progress?")) {
    progressStore.reset(mode)
    timerStore.reset(mode)
    clearEditor()
  }
}
</script>