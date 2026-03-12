
<script setup>
import ResultsTable from '../components/ResultsTable.vue'
import Banner from '../components/Banner.vue'
import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDb } from '../composables/useDb'
import { useSound } from '../composables/useSound'
import { useProgressStore } from '../stores/progressStore'
import { basicPuzzles } from '../validators/basic'
import { advancedPuzzles } from '../validators/advanced'
import { useTimerStore } from '../stores/timerStore'
import {pinia} from "../plugins/pinia.js";

const route = useRoute()
const router = useRouter()
const { exec } = useDb()
const { playSuccess } = useSound()
const store = useProgressStore(pinia)
const timer = useTimerStore?.() // if using timings

const mode = computed(() => route.params.mode)
const id = computed(() => Number(route.params.id))
const bank = computed(() => (mode.value === 'basic' ? basicPuzzles : advancedPuzzles))
const puzzle = computed(() => bank.value.find(p => p.id === id.value))

const title = computed(() => `${mode.value === 'basic' ? 'Basic' : 'Advanced'} Puzzle ${id.value}`)
const nextTo = computed(() => {
  const last = bank.value[bank.value.length - 1].id
  if (id.value >= last) return { name: 'final', params: { mode: mode.value } }
  return { name: 'puzzle', params: { mode: mode.value, id: id.value + 1 } }
})
const backTo = computed(() => (id.value <= 1 ? { name: 'home' } : { name: 'puzzle', params: { mode: mode.value, id: id.value - 1 } }))

const sql = ref('')
const results = ref([])
const message = ref('')
const messageClass = ref('')
const clue = ref('')
const unlockedNext = computed(() => store.isSolved(mode.value, id.value))
const hintVisible = ref(false)

watchEffect(() => { if (puzzle.value) sql.value = puzzle.value.placeholder || '' })

function onBannerClick() {
  const ok = window.confirm('Return to home? Progress is saved.')
  if (ok) router.push({ name: 'home' })
}

async function runQuery() {
  message.value = ''
  messageClass.value = ''
  clue.value = ''
  results.value = []
  try {
    const res = await exec(sql.value)
    results.value = res
    const out = puzzle.value.validate(res)
    if (out === true || out === undefined || out === null) onSuccess()
    else if (typeof out === 'string') { message.value = out.startsWith('✔') ? out : `✖ ${out}`; messageClass.value = out.startsWith('✔') ? 'success' : 'error' }
    else if (out === false) { message.value = '✖ Not quite'; messageClass.value = 'error' }
    else { message.value = '✖ Not quite' }
  } catch {
    message.value = 'Execution error'
    messageClass.value = 'error'
  }
}

function copySql() {
  navigator.clipboard.writeText(sql.value).then(() => {
    message.value = '✔ Copied SQL to clipboard'
    messageClass.value = 'success'
  })
}

function revealHint() {
  if (hintVisible.value) return
  const ok = window.confirm('Reveal hint? This may be recorded.')
  if (ok) {
    hintVisible.value = true
    store.markHintUsed(mode.value, id.value)
  }
}

function onSuccess() {
  playSuccess()
  store.markSolved(mode.value, id.value, timer?.elapsedMs)
  message.value = '✔ Correct'
  messageClass.value = 'success'
  clue.value = (puzzle.value && puzzle.value.clue) || ''
}
</script>

<template>
  <div class="container">
    <div class="terminal">
      <Banner small clickable @banner-click="onBannerClick" />

      <h1>{{ title }}</h1>

      <!-- STORY PROMPT -->
      <div class="schema" style="white-space: pre-wrap">{{ puzzle?.story }}</div>

      <p><strong>Task:</strong> {{ puzzle?.prompt }}</p>

      <label for="sql">SQL</label>
      <button class="btn" @click="copySql">Copy SQL</button>
      <button class="btn secondary" @click="revealHint">💡 Show Hint</button>
      <div v-if="hintVisible" class="schema" style="margin-top:8px; white-space: pre-wrap;">
        <strong>Solution (hint):</strong>
        <pre style="white-space: pre-wrap; margin:0">{{ puzzle?.solutionSql }}</pre>
      </div>

      <textarea id="sql" v-model="sql"></textarea>
      <button class="btn" @click="runQuery">Run Query</button>

      <div id="result" :class="messageClass" v-if="message">{{ message }}</div>
      <div class="success" v-if="clue">CLUE: {{ clue }}</div>

      <div style="margin-top: 10px;">
        <router-link class="btn" :to="backTo">◀ Back</router-link>
        <router-link v-if="unlockedNext" class="btn" :to="nextTo">Next ▶</router-link>
        <span v-else class="btn" style="opacity:.5; pointer-events:none;">Next ▶</span>
      </div>

      <ResultsTable :results="results" />
    </div>
  </div>
</template>
