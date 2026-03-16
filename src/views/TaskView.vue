<template>
  <div class="terminal">

    <!-- ── Nav ── -->
    <div class="task-nav">
      <button class="btn secondary small" @click="router.push({ name: 'home' })">← Back to HQ</button>
      <div class="task-nav-right">
        <span class="mode-badge" :class="mode">
          {{ mode === 'basic' ? '▶ Basic' : '⚡ Advanced' }}
        </span>
        <span class="task-counter">Task {{ currentIndex + 1 }} / {{ totalTasks }}</span>
        <span class="timer-display">⏱ {{ timerStore.displayTime }}</span>
        <button class="btn secondary small" @click="soundStore.toggle()" :title="soundStore.muted ? 'Unmute' : 'Mute'">
          {{ soundStore.muted ? '🔇' : '🔊' }}
        </button>
        <button class="btn secondary small" @click="resetProgress">
          🔁
        </button>
        <button class="btn secondary small" @click="theme.toggle()">
          {{ theme.mode === 'light' ? '🌙' : '☀️' }}
        </button>
      </div>
    </div>

    <!-- ── Progress bar ── -->
    <div class="progress-bar-wrap">
      <!-- nodes first in DOM so bar renders behind via z-index -->
      <div class="progress-nodes">
        <div
            v-for="(t, i) in tasks" :key="t.id"
            class="progress-node"
            :class="{
            done:   progressStore.isSolved(mode, t.id),
            active: i === currentIndex,
            locked: i > currentIndex && !progressStore.isSolved(mode, t.id)
          }"
            @click="navigateTo(i)"
            :title="`Task ${i+1}${progressStore.isSolved(mode, t.id) ? ' ✓' : ''}`"
        >
          <span v-if="progressStore.isSolved(mode, t.id)">✓</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
      </div>

      <div class="progress-bg">
        <div class="progress-fill" :style="{ width: progressPct + '%' }" :class="{ complete: isLastTask && taskSolved }" />
      </div>
    </div>

    <!-- ── Clues strip ── -->
    <div v-if="acquiredClues.length" class="clues-strip">
      <span class="clues-label">CLUES:</span>
      <span v-for="c in acquiredClues" :key="c" class="clue-chip">{{ c }}</span>
      <span v-for="n in (totalTasks - acquiredClues.length)" :key="'e'+n" class="clue-chip empty">???</span>
    </div>

    <!-- ── Story panel ── -->
    <div class="story-panel" :class="{ collapsed: storyCollapsed }">
      <div class="story-header" @click="storyCollapsed = !storyCollapsed">
        <span class="story-icon">{{ storyCollapsed ? '▶' : '▼' }}</span>
        <span class="story-title">Mission Briefing — Task {{ currentIndex + 1 }}</span>
        <span class="story-hint">{{ storyCollapsed ? 'expand' : 'collapse' }}</span>
      </div>
      <transition name="story-slide">
        <div v-if="!storyCollapsed" class="story-body">
          <pre class="story-text">{{ task.story }}</pre>
        </div>
      </transition>
    </div>

    <!-- ── Schema ── -->
    <div class="schema-row">
      <button class="btn secondary small" @click="showSchema = !showSchema">
        {{ showSchema ? '▼ Hide' : '▶ Show' }} Database Schema
      </button>
      <transition name="fade">
        <div v-if="showSchema" class="schema-panel">
          <div class="schema-chips">
            <code v-for="q in schemaQueries" :key="q" class="schema-chip" @click="injectQuery(q)">{{ q }}</code>
          </div>
          <span class="schema-note">↑ click to insert into editor</span>
        </div>
      </transition>
    </div>

    <!-- ── Editor —── -->
    <div v-if="!taskSolved" class="editor-panel">
      <label class="prompt-label">🔍 {{ task.prompt }}</label>
      <!-- ── Hint / Solution (hidden once solved) ── -->
      <div class="assist-row">
        <div class="assist-col">
          <button class="assist-toggle hint-toggle" @click="toggleHint">
            {{ hintOpen ? '▼ Hide Hint' : '▸ Show Hint' }}
            <span v-if="hintIndex > 0" class="hint-cnt">({{ hintIndex }}/{{ task.hints.length }})</span>
          </button>
          <div v-if="hintOpen" class="assist-panel hint-panel">
            <pre v-if="isCode(currentHint)" class="hint-code">{{ currentHint }}</pre>
            <p v-else class="hint-prose">{{ currentHint }}</p>
            <div class="assist-actions">
              <button v-if="hintIndex < task.hints.length - 1" class="assist-link" @click="nextHint">Next hint →</button>
              <button v-if="isCode(currentHint)" class="assist-link green" @click="injectQuery(currentHint)">↑ Insert into editor</button>
            </div>
          </div>
        </div>

        <div class="assist-col">
          <button class="assist-toggle sol-toggle" @click="toggleSolution">
            {{ solutionOpen ? '▼ Hide Solution' : '▸ Show Solution' }}
          </button>
          <div v-if="solutionOpen" class="assist-panel sol-panel">
            <pre class="hint-code sol-code">{{ task.solution }}</pre>
            <div class="assist-actions">
              <button class="assist-link green" @click="injectQuery(task.solution)">↑ Insert into editor</button>
            </div>
            <p class="sol-warn">⚠ Solution used — clue will be marked assisted</p>
          </div>
        </div>
      </div>

      <div class="editor-wrap" :class="{ focused: editorFocused }">
        <textarea
            v-model="sqlInput"
            class="sql-editor"
            rows="6"
            placeholder="-- Write your SQL query here...&#10;-- Ctrl+Enter to run"
            spellcheck="false"
            @keydown.ctrl.enter.prevent="runQuery"
            @keydown.meta.enter.prevent="runQuery"
            @focus="editorFocused = true"
            @blur="editorFocused = false"
        />
        <div class="editor-footer">
          <span class="editor-hint">Ctrl+Enter to run</span>
          <div class="editor-actions">
            <button class="btn secondary small" @click="clearEditor" :disabled="!sqlInput">✕ Clear</button>
            <button class="btn" @click="runQuery" :disabled="running || !sqlInput.trim()">
              <span v-if="running" class="spinner">⟳</span>
              {{ running ? 'Running…' : '▶ Run Query' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Results (persisted) ── -->
    <transition name="fade">
      <div v-if="queryResult !== null" class="result-panel">
        <div class="result-header">
          <span class="result-label">Query Results</span>
          <span class="result-count">{{ resultRowCount }} row{{ resultRowCount !== 1 ? 's' : '' }}</span>
        </div>
        <ResultsTable :results="queryResult" />
      </div>
    </transition>

    <!-- ── Error ── -->
    <transition name="fade">
      <div v-if="queryError" class="error-panel">
        <span class="error-icon">⚠</span>
        <div class="error-body">
          <strong>Query Error</strong>
          <span>{{ queryError }}</span>
        </div>
      </div>
    </transition>

    <!-- ── Answer — hidden once solved ── -->
    <div v-if="(queryResult !== null || queryError) && !taskSolved" class="answer-panel">
      <label class="answer-label">📋 Based on your results, enter your answer:</label>
      <div class="answer-row">
        <input
            v-model="userAnswer"
            class="answer-input"
            type="text"
            placeholder="Type your answer here…"
            @keyup.enter="submitAnswer"
        />
        <button class="btn success" @click="submitAnswer" :disabled="!userAnswer.trim()">
          ✓ Submit
        </button>
      </div>
      <p v-if="attemptCount > 1" class="attempt-count">Attempt {{ attemptCount }} — keep digging.</p>
    </div>


    <!-- ── Wrong feedback (inline, not a panel) ── -->
    <transition name="feedback-pop">
      <div v-if="wrongFeedback" class="feedback-panel wrong">
        <div class="wrong-inner">
          <span class="wrong-icon">✗</span>
          <p>{{ wrongFeedback }}</p>
        </div>
      </div>
    </transition>

    <!-- ── Success feedback — PERSISTS, shown when taskSolved ── -->
    <transition name="feedback-pop">
      <div v-if="taskSolved" class="feedback-panel correct">
        <div class="clue-reveal">
          <div class="clue-unlock-label">▮ CLUE FRAGMENT ACQUIRED</div>
          <div class="clue-word-wrap">
            <span class="clue-word" :class="{ assisted: solvedData?.assisted }">
              {{ task.clue }}
            </span>
            <span v-if="solvedData?.assisted" class="assisted-badge">⚠ ASSISTED</span>
          </div>
        </div>
        <p class="feedback-msg">{{ successMsg(currentIndex) }}</p>
        <button class="btn large" @click="nextTask">
          {{ isLastTask ? (mode === 'basic' ? '▶ Proceed to Advanced Investigation →' : '🏁 Final Debrief →') : '▶ Continue Investigation →' }}
        </button>
      </div>
    </transition>

  </div>
</template>

<script setup>
import '../assets/task-view.css'
import ResultsTable from '../components/ResultsTable.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useDb }             from '../composables/useDb'
import { useRouter, useRoute } from 'vue-router'
import { useProgressStore }  from '../stores/progressStore.js'
import { useSoundStore }     from '../stores/soundStore.js'
import { useTimerStore }     from '../stores/timerStore.js'
import { basicTasks }        from '../validators/basic.js'
import { advancedTasks }     from '../validators/advanced.js'
import {useThemeStore} from "../stores/themeStore.js";

const db            = useDb()
const router        = useRouter()
const route         = useRoute()
const progressStore = useProgressStore()
const soundStore    = useSoundStore()
const timerStore    = useTimerStore()
const theme = useThemeStore()

const mode       = computed(() => route.params.mode)
const tasks      = computed(() => mode.value === 'basic' ? basicTasks : advancedTasks)
const totalTasks = computed(() => tasks.value.length)

const currentIndex = computed(() => {
  const id  = parseInt(route.params.id)
  const idx = tasks.value.findIndex(t => t.id === id)
  return idx >= 0 ? idx : 0
})
const task       = computed(() => tasks.value[currentIndex.value])
const isLastTask = computed(() => currentIndex.value === tasks.value.length - 1)
const progressPct = computed(() => (currentIndex.value / totalTasks.value) * 100)

// ── Solved state — always read from store (survives navigation) ───────────────
const taskSolved = computed(() => progressStore.isSolved(mode.value, task.value?.id))
const solvedData  = computed(() => progressStore.getSolvedData(mode.value, task.value?.id))

const acquiredClues = computed(() =>
    tasks.value
        .filter(t => progressStore.isSolved(mode.value, t.id))
        .map(t => t.clue)
)

// ── Local editor state ────────────────────────────────────────────────────────
const sqlInput      = ref('')
const userAnswer    = ref('')
const queryResult   = ref(null)
const queryError    = ref(null)
const wrongFeedback = ref('')
const running       = ref(false)
const editorFocused = ref(false)
const showSchema    = ref(false)
const storyCollapsed = ref(false)
const attemptCount  = ref(0)
const wasAssisted   = ref(false)

// Hints
const hintOpen    = ref(false)
const hintIndex   = ref(0)
const currentHint = computed(() => task.value.hints?.[hintIndex.value] ?? '')

// Solution
const solutionOpen = ref(false)

const schemaQueries = [
  'DESCRIBE users;', 'DESCRIBE transactions;', 'DESCRIBE audit_logs;',
  'DESCRIBE sessions;', 'DESCRIBE network_events;', 'SHOW TABLES;',
]

const resultRowCount = computed(() => queryResult.value?.[0]?.values?.length ?? 0)

function isCode(h) {
  return h.includes('\n') || /^(SELECT|WITH|DESCRIBE|SHOW)\b/i.test(h.trim())
}

// ── Actions ───────────────────────────────────────────────────────────────────
function injectQuery(q) {
  sqlInput.value   = q
  showSchema.value = false
  hintOpen.value   = false
}

function clearEditor() {
  sqlInput.value    = ''
  queryResult.value = null
  queryError.value  = null
  wrongFeedback.value = ''
}

async function runQuery() {
  if (!sqlInput.value.trim() || running.value) return
  soundStore.play('run')
  running.value     = true
  queryResult.value = null
  queryError.value  = null
  wrongFeedback.value = ''
  try {
    queryResult.value = await db.exec(sqlInput.value)
  } catch (e) {
    queryError.value = e.message
  } finally {
    running.value = false
  }
}

function submitAnswer() {
  queryError.value = null;
  if (!userAnswer.value.trim()) return
  attemptCount.value++
  const validation = task.value.validate(queryResult.value, userAnswer.value)
  if (validation === true) {
    soundStore.play('correct')
    progressStore.markSolved(mode.value, task.value.id, {
      clue:      task.value.clue,
      assisted:  wasAssisted.value,
      solvedAt:  new Date().toISOString(),
    })
    storyCollapsed.value = true
    wrongFeedback.value  = ''
  } else {
    soundStore.play('wrong')
    wrongFeedback.value = typeof validation === 'string'
        ? validation
        : 'Incorrect. Re-examine your query results.'
  }
}

function nextTask() {
  soundStore.play('navigate')
  if (isLastTask.value) {
    if (mode.value === 'basic') {
      router.push({ name: 'final', params: { mode: 'basic' } })
    } else {
      router.push({ name: 'final', params: { mode: 'advanced' } })
    }
  } else {
    const next = tasks.value[currentIndex.value + 1]
    router.push({ name: 'task', params: { mode: mode.value, id: next.id } })
  }
}

function navigateTo(index) {
  const target = tasks.value[index]
  if (progressStore.isSolved(mode.value, target.id) || index <= currentIndex.value) {
    router.push({ name: 'task', params: { mode: mode.value, id: target.id } })
  }
}

function toggleHint() {
  hintOpen.value = !hintOpen.value
  if (hintOpen.value) {
    wasAssisted.value = true
    soundStore.play('hint')
  }
}

function nextHint() {
  if (hintIndex.value < (task.value.hints?.length ?? 0) - 1) {
    hintIndex.value++
    wasAssisted.value = true
    soundStore.play('hint')
  }
}

function toggleSolution() {
  solutionOpen.value = !solutionOpen.value
  if (solutionOpen.value) wasAssisted.value = true
}

function successMsg(idx) {
  const msgs = [
    'Solid. The picture is beginning to form.',
    'Good work, Analyst. Another piece falls into place.',
    "Confirmed. The data doesn't lie — even when someone tries to make it.",
    "Excellent. The Ghost User's trail grows clearer.",
    "Outstanding. You're thinking like an investigator now.",
    'Remarkable. Most analysts miss that.',
    'The net is tightening.',
    'Every query brings us closer.',
    'Almost there. One final step.',
    'Case closed. The Ghost User has been unmasked.',
  ]
  return msgs[idx] ?? 'Confirmed.'
}

// ── Reset LOCAL state when task changes (store state persists) ────────────────
watch(() => route.params.id, () => {
  sqlInput.value       = ''
  userAnswer.value     = ''
  queryResult.value    = null
  queryError.value     = null
  wrongFeedback.value  = ''
  attemptCount.value   = 0
  wasAssisted.value    = false
  hintOpen.value       = false
  hintIndex.value      = 0
  solutionOpen.value   = false
  storyCollapsed.value = taskSolved.value   // collapse if already solved
  showSchema.value     = false
}, { immediate: false })

onMounted(() => {
  timerStore.start()
  storyCollapsed.value = taskSolved.value
})

function resetProgress() {
  if (confirm("Reset all progress?")) {
    progressStore.reset(mode)
    timerStore.reset(mode)
    clearEditor()
  }
}
</script>
