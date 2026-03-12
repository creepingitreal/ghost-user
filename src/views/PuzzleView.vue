<!-- PuzzleView.vue -->
<template>
  <div class="terminal">

    <!-- Navigation Bar -->
    <div class="puzzle-nav">
      <button class="btn secondary small" @click="router.push({ name: 'home' })">
        ← Back to Briefing
      </button>
      <div class="puzzle-nav-right">
        <span class="mode-badge" :class="mode">
          {{ mode === 'basic' ? '▶ Basic Investigation' : '⚡ Advanced Investigation' }}
        </span>
        <span class="puzzle-counter">Task {{ currentIndex + 1 }} / {{ totalPuzzles }}</span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar">
      <div
          class="progress-fill"
          :style="{ width: `${((currentIndex) / totalPuzzles) * 100}%` }"
          :class="{ complete: isLastPuzzle && feedback?.correct }"
      />
      <div class="progress-nodes">
        <div
            v-for="(p, i) in puzzles"
            :key="p.id"
            class="progress-node"
            :class="{
            done: solvedIds.includes(p.id),
            active: i === currentIndex,
            locked: i > currentIndex && !solvedIds.includes(p.id)
          }"
            @click="navigateTo(i)"
            :title="`Task ${i + 1}${solvedIds.includes(p.id) ? ' ✓' : ''}`"
        >
          <span v-if="solvedIds.includes(p.id)">✓</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
      </div>
    </div>

    <!-- Acquired Clues -->
    <div v-if="acquiredClues.length" class="clues-strip">
      <span class="clues-label">CLUES ACQUIRED:</span>
      <span
          v-for="clue in acquiredClues"
          :key="clue"
          class="clue-chip"
      >{{ clue }}</span>
      <span
          v-for="i in (totalPuzzles - acquiredClues.length)"
          :key="'empty-' + i"
          class="clue-chip empty"
      >???</span>
    </div>

    <!-- Story Panel -->
    <div class="story-panel" :class="{ 'story-collapsed': storyCollapsed }">
      <div class="story-header" @click="storyCollapsed = !storyCollapsed">
        <span class="story-toggle-icon">{{ storyCollapsed ? '▶' : '▼' }}</span>
        <span class="story-title">Mission Briefing — Task {{ currentIndex + 1 }}</span>
        <span class="story-toggle-hint">{{ storyCollapsed ? 'expand' : 'collapse' }}</span>
      </div>
      <transition name="story-slide">
        <div v-if="!storyCollapsed" class="story-body">
          <pre class="story-text">{{ puzzle.story }}</pre>
        </div>
      </transition>
    </div>

    <!-- Schema Helper -->
    <div class="schema-hint">
      <button class="btn secondary small" @click="showSchema = !showSchema">
        {{ showSchema ? '▼ Hide' : '▶ Show' }} Database Schema
      </button>
      <transition name="fade">
        <div v-if="showSchema" class="schema-output">
          <p>Explore the database structure with these queries:</p>
          <div class="schema-queries">
            <code
                v-for="q in schemaQueries"
                :key="q"
                class="schema-query-chip"
                @click="injectQuery(q)"
                title="Click to insert"
            >{{ q }}</code>
          </div>
          <p class="schema-hint-note">↑ Click any query to insert it into the editor</p>
        </div>
      </transition>
    </div>

    <!-- SQL Editor -->
    <div class="editor-panel">
      <label class="prompt-label">
        <span class="prompt-icon">🔍</span>
        {{ puzzle.prompt }}
      </label>
      <div class="editor-wrapper">
        <textarea
            v-model="sqlInput"
            class="sql-editor"
            rows="8"
            placeholder="Write your SQL query here...&#10;&#10;e.g. SELECT * FROM users LIMIT 10;"
            spellcheck="false"
            @keydown.ctrl.enter="runQuery"
            @keydown.meta.enter="runQuery"
        />
        <div class="editor-footer">
          <span class="editor-hint">Ctrl+Enter to run</span>
          <div class="editor-actions">
            <button
                class="btn secondary small"
                @click="clearEditor"
                :disabled="!sqlInput"
            >✕ Clear</button>
            <button
                class="btn"
                @click="runQuery"
                :disabled="running || !sqlInput.trim()"
            >
              <span v-if="running" class="spinner">⟳</span>
              {{ running ? 'Running...' : '▶ Run Query' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Query Results -->
    <transition name="fade">
      <div v-if="queryResult !== null" class="result-panel">
        <div class="result-header">
          <span class="result-label">Query Results</span>
          <span class="result-count">
            {{ resultRowCount }} row{{ resultRowCount !== 1 ? 's' : '' }} returned
          </span>
        </div>
        <ResultsTable :result="queryResult" />
      </div>
    </transition>

    <!-- Error Display -->
    <transition name="fade">
      <div v-if="queryError" class="error-panel">
        <span class="error-icon">⚠</span>
        <div class="error-content">
          <strong>Query Error</strong>
          <span>{{ queryError }}</span>
        </div>
      </div>
    </transition>

    <!-- Answer Input -->
    <transition name="fade">
      <div v-if="queryResult !== null || queryError" class="answer-panel">
        <label class="answer-label">
          <span class="answer-icon">📋</span>
          Based on your results, enter your answer:
        </label>
        <div class="answer-row">
          <input
              v-model="userAnswer"
              class="answer-input"
              type="text"
              placeholder="Type your answer here..."
              @keyup.enter="submitAnswer"
              :disabled="feedback?.correct"
          />
          <button
              class="btn success"
              @click="submitAnswer"
              :disabled="!userAnswer.trim() || feedback?.correct"
          >
            ✓ Submit
          </button>
        </div>
        <p v-if="attemptCount > 1 && !feedback?.correct" class="attempt-count">
          Attempt {{ attemptCount }} — keep digging.
        </p>
      </div>
    </transition>

    <!-- Feedback -->
    <transition name="feedback-pop">
      <div
          v-if="feedback"
          :class="['feedback-panel', feedback.correct ? 'correct' : 'wrong']"
      >
        <template v-if="feedback.correct">
          <div class="clue-reveal">
            <div class="clue-reveal-header">
              <span class="clue-unlocked-label">▮ CLUE FRAGMENT ACQUIRED</span>
            </div>
            <div class="clue-word-wrapper">
              <span class="clue-word">{{ puzzle.clue }}</span>
            </div>
          </div>
          <p class="feedback-message success-message">{{ feedback.message }}</p>
          <button class="btn large" @click="nextPuzzle">
            {{ isLastPuzzle ? '🏁 Complete Investigation' : '▶ Continue Investigation →' }}
          </button>
        </template>
        <template v-else>
          <div class="feedback-wrong-inner">
            <span class="feedback-wrong-icon">✗</span>
            <p>{{ feedback.message }}</p>
          </div>
        </template>
      </div>
    </transition>

  </div>
</template>

<script setup>
import ResultsTable from '../components/ResultsTable.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useDb } from '../composables/useDb'
import { useRouter, useRoute } from 'vue-router'
import { basicPuzzles } from '../validators/basic'
import { advancedPuzzles } from '../validators/advanced'

const db = useDb()
const router = useRouter()
const route = useRoute()

const mode = route.params.mode
const puzzles = mode === 'basic' ? basicPuzzles : advancedPuzzles
const currentId = parseInt(route.params.id)
const currentIndex = computed(() => puzzles.findIndex(p => p.id === currentId))
const puzzle = computed(() => puzzles[currentIndex.value])
const isLastPuzzle = computed(() => currentIndex.value === puzzles.length - 1)
const totalPuzzles = puzzles.length

const progressKey = `ghost-${mode}-progress`
const savedProgress = ref(JSON.parse(localStorage.getItem(progressKey) || '{}'))

const solvedIds = computed(() =>
    Object.entries(savedProgress.value)
        .filter(([, v]) => v.solved)
        .map(([k]) => parseInt(k))
)

const acquiredClues = computed(() =>
    puzzles
        .filter(p => solvedIds.value.includes(p.id))
        .map(p => p.clue)
)

const sqlInput = ref('')
const userAnswer = ref('')
const queryResult = ref(null)
const queryError = ref(null)
const feedback = ref(null)
const running = ref(false)
const showSchema = ref(false)
const storyCollapsed = ref(false)
const attemptCount = ref(0)

const schemaQueries = [
  "SELECT name FROM sqlite_master WHERE type='table';",
  'PRAGMA table_info(users);',
  'PRAGMA table_info(transactions);',
  'PRAGMA table_info(audit_logs);',
  'SELECT * FROM users LIMIT 5;',
  'SELECT * FROM transactions LIMIT 5;',
  'SELECT * FROM audit_logs LIMIT 5;',
]

const resultRowCount = computed(() => {
  if (!queryResult.value || !queryResult.value[0]) return 0
  return queryResult.value[0].values?.length || 0
})

// Reset state when navigating to a new puzzle
watch(() => route.params.id, () => {
  sqlInput.value = ''
  userAnswer.value = ''
  queryResult.value = null
  queryError.value = null
  feedback.value = null
  attemptCount.value = 0
  storyCollapsed.value = false
  showSchema.value = false
  savedProgress.value = JSON.parse(localStorage.getItem(progressKey) || '{}')
})

// Auto-collapse story after solving
watch(feedback, (val) => {
  if (val?.correct) storyCollapsed.value = true
})

onMounted(() => {
  // If this puzzle was already solved, mark it
  if (solvedIds.value.includes(currentId)) {
    // Allow re-doing but show progress
  }
})

async function runQuery() {
  if (!sqlInput.value.trim() || running.value) return
  running.value = true
  queryResult.value = null
  queryError.value = null
  feedback.value = null

  try {
    const result = await db.exec(sqlInput.value)
    queryResult.value = result
  } catch (e) {
    queryError.value = e.message
  } finally {
    running.value = false
  }
}

function submitAnswer() {
  if (!userAnswer.value.trim()) return

  attemptCount.value++
  const validation = puzzle.value.validate(queryResult.value, userAnswer.value)

  if (validation === true) {
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}')
    progress[puzzle.value.id] = {
      solved: true,
      clue: puzzle.value.clue,
      solvedAt: new Date().toISOString()
    }
    localStorage.setItem(progressKey, JSON.stringify(progress))
    savedProgress.value = progress

    feedback.value = {
      correct: true,
      message: getSuccessMessage(currentIndex.value)
    }
  } else {
    feedback.value = {
      correct: false,
      message: typeof validation === 'string'
          ? validation
          : 'Incorrect. Re-examine your query results.'
    }
  }
}

function nextPuzzle() {
  if (isLastPuzzle.value) {
    router.push({ name: 'complete', params: { mode } })
  } else {
    const next = puzzles[currentIndex.value + 1]
    router.push({ name: 'puzzle', params: { mode, id: next.id } })
  }
}

function navigateTo(index) {
  // Allow navigation to solved puzzles or current
  const target = puzzles[index]
  if (solvedIds.value.includes(target.id) || index <= currentIndex.value) {
    router.push({ name: 'puzzle', params: { mode, id: target.id } })
  }
}

function injectQuery(query) {
  sqlInput.value = query
  showSchema.value = false
}

function clearEditor() {
  sqlInput.value = ''
  queryResult.value = null
  queryError.value = null
  feedback.value = null
}

function getSuccessMessage(idx) {
  const messages = [
    'Solid. The picture is beginning to form.',
    'Good work, Analyst. Another piece falls into place.',
    "Confirmed. The data doesn't lie — even when someone tries to make it.",
    "Excellent. The Ghost User's trail grows clearer.",
    'Outstanding. You\'re thinking like an investigator now.',
    'Remarkable. Most analysts miss that.',
    'The net is tightening.',
    'Every query brings us closer.',
    'Almost there. One final step.',
    'Case closed. The Ghost User has been unmasked.'
  ]
  return messages[idx] || 'Confirmed.'
}
</script>

<style scoped>
/* ── Nav ── */
.puzzle-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.puzzle-nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-badge {
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 3px;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  font-weight: 600;
}

.mode-badge.basic {
  background: rgba(0, 255, 136, 0.1);
  color: var(--green);
  border: 1px solid var(--green);
}

.mode-badge.advanced {
  background: rgba(255, 170, 0, 0.1);
  color: #ffaa00;
  border: 1px solid #ffaa00;
}

.puzzle-counter {
  font-size: 0.75rem;
  color: var(--muted);
  font-family: var(--font-mono);
}

/* ── Progress Bar ── */
.progress-bar {
  position: relative;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  margin-bottom: 24px;
  overflow: visible;
}

.progress-fill {
  height: 100%;
  background: var(--green);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.progress-fill.complete {
  background: #00ffff;
}

.progress-nodes {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
}

.progress-node {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--muted);
  user-select: none;
}

.progress-node.done {
  border-color: var(--green);
  color: var(--green);
  background: rgba(0, 255, 136, 0.1);
}

.progress-node.active {
  border-color: var(--green);
  color: var(--green);
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
  background: var(--bg);
}

.progress-node.locked {
  cursor: default;
  opacity: 0.4;
}

/* ── Clues Strip ── */
.clues-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 255, 136, 0.03);
  border: 1px solid rgba(0, 255, 136, 0.15);
  border-radius: 4px;
  margin-bottom: 20px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.clues-label {
  color: var(--muted);
  margin-right: 4px;
}

.clue-chip {
  padding: 2px 10px;
  background: rgba(0, 255, 136, 0.12);
  border: 1px solid var(--green);
  border-radius: 3px;
  color: var(--green);
  font-weight: 700;
  letter-spacing: 0.1em;
  font-size: 0.7rem;
}

.clue-chip.empty {
  background: rgba(255, 255, 255, 0.03);
  border-color: var(--border);
  color: var(--muted);
  font-weight: 400;
  letter-spacing: 0.05em;
}

/* ── Story Panel ── */
.story-panel {
  max-height: 400px;
  background: rgba(0, 255, 136, 0.02);
  border: 1px solid var(--border);
  border-left: 3px solid var(--green);
  border-radius: 4px;
  margin-bottom: 16px;
  overflow-y: auto;
  transition: all 0.2s;
}

.story-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
}

.story-header:hover {
  background: rgba(0, 255, 136, 0.04);
}

.story-toggle-icon {
  color: var(--green);
  font-size: 0.75rem;
  width: 12px;
}

.story-title {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--green);
  font-weight: 600;
  letter-spacing: 0.05em;
  flex: 1;
}

.story-toggle-hint {
  font-size: 0.7rem;
  color: var(--muted);
  font-family: var(--font-mono);
}

.story-body {
  padding: 0 16px 16px;
  border-top: 1px solid rgba(0, 255, 136, 0.1);
}

.story-text {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  line-height: 1.65;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 12px 0 0;
}

/* ── Schema Hint ── */
.schema-hint {
  margin-bottom: 16px;
}

.schema-output {
  margin-top: 10px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--muted);
}

.schema-output p {
  margin: 0 0 10px;
}

.schema-queries {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.schema-query-chip {
  padding: 4px 10px;
  background: rgba(0, 255, 136, 0.06);
  border: 1px solid rgba(0, 255, 136, 0.2);
  border-radius: 3px;
  color: var(--green);
  font-size: 0.72rem;
  cursor: pointer;
  font-family: var(--font-mono);
  transition: background 0.15s;
  user-select: none;
}

.schema-query-chip:hover {
  background: rgba(0, 255, 136, 0.15);
}

.schema-hint-note {
  font-size: 0.7rem;
  color: var(--muted);
  margin: 4px 0 0;
  font-style: italic;
}

/* ── Editor ── */
.editor-panel {
  margin-bottom: 16px;
}

.prompt-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: var(--text);
  margin-bottom: 10px;
  line-height: 1.5;
}

.prompt-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.editor-wrapper {
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.editor-wrapper:focus-within {
  border-color: var(--green);
  box-shadow: 0 0 0 1px rgba(0, 255, 136, 0.2);
}

.sql-editor {

  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  color: var(--green);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  padding: 14px 16px;
  border: none;
  outline: none;
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
  box-sizing: border-box;
  display: block;
}

.sql-editor::placeholder {
  color: rgba(0, 255, 136, 0.25);
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--border);
}

.editor-hint {
  font-size: 0.7rem;
  color: var(--muted);
  font-family: var(--font-mono);
}

.editor-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* ── Results ── */
.result-panel {
  margin-bottom: 16px;
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border);
}

.result-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.result-count {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--green);
}

/* ── Error ── */
.error-panel {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 50, 50, 0.08);
  border: 1px solid rgba(255, 50, 50, 0.3);
  border-radius: 4px;
  margin-bottom: 16px;
  font-family: var(--font-mono);
  font-size: 0.82rem;
}

.error-icon {
  color: #ff4444;
  flex-shrink: 0;
  font-size: 1rem;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.error-content strong {
  color: #ff6666;
}

.error-content span {
  color: var(--muted);
  font-size: 0.78rem;
}

/* ── Answer Panel ── */
.answer-panel {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: 4px;
  margin-bottom: 16px;
}

.answer-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--muted);
  margin-bottom: 10px;
}

.answer-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.answer-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  padding: 9px 14px;
  border-radius: 3px;
  outline: none;
  transition: border-color 0.2s;
}

.answer-input:focus {
  border-color: var(--green);
}

.answer-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.attempt-count {
  margin: 8px 0 0;
  font-size: 0.72rem;
  color: var(--muted);
  font-family: var(--font-mono);
  font-style: italic;
}

/* ── Feedback ── */
.feedback-panel {
  padding: 16px 20px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-family: var(--font-mono);
}

.feedback-panel.correct {
  background: rgba(0, 255, 136, 0.06);
  border: 1px solid rgba(0, 255, 136, 0.4);
}

.feedback-panel.wrong {
  background: rgba(255, 80, 80, 0.06);
  border: 1px solid rgba(255, 80, 80, 0.3);
}

.clue-reveal {
  margin-bottom: 14px;
}

.clue-reveal-header {
  margin-bottom: 10px;
}

.clue-unlocked-label {
  font-size: 0.7rem;
  color: var(--muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.clue-word-wrapper {
  display: inline-block;
  padding: 6px 20px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--green);
  border-radius: 3px;
}

.clue-word {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--green);
  letter-spacing: 0.2em;
  text-shadow: 0 0 12px rgba(0, 255, 136, 0.6);
}

.feedback-message {
  font-size: 0.82rem;
  color: var(--muted);
  margin: 0 0 16px;
  line-height: 1.5;
}

.success-message {
  color: var(--text);
}

.feedback-wrong-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #ff6666;
  font-size: 0.82rem;
}

.feedback-wrong-inner p {
  margin: 0;
  color: var(--text);
  line-height: 1.5;
}

.feedback-wrong-icon {
  color: #ff4444;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--green);
  color: var(--green);
  font-family: var(--font-mono);
  font-size: 0.82rem;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn:hover:not(:disabled) {
  background: rgba(0, 255, 136, 0.1);
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.2);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn.secondary {
  border-color: var(--border);
  color: var(--muted);
}

.btn.secondary:hover:not(:disabled) {
  border-color: var(--muted);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: none;
}

.btn.small {
  padding: 5px 10px;
  font-size: 0.75rem;
}

.btn.success {
  border-color: var(--green);
  color: var(--green);
}

.btn.large {
  padding: 10px 22px;
  font-size: 0.88rem;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.story-slide-enter-active,
.story-slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.story-slide-enter-from,
.story-slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.story-slide-enter-to,
.story-slide-leave-from {
  opacity: 1;
  max-height: 600px;
}

.feedback-pop-enter-active {
  transition: all 0.3s ease;
}

.feedback-pop-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.feedback-pop-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>