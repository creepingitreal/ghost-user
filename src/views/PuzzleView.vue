<template>
  <div class="container">
    <div class="terminal">
      <Banner small clickable @banner-click="onBannerClick" />

      <h1>{{ title }}</h1>
      <p>{{ puzzle.prompt }}</p>

        <button class="btn" @click="copySql">Copy SQL</button>
        <textarea id="sql" v-model="sql"></textarea>
        <button class="btn" @click="runQuery">Run Query</button>

      <div id="result" :class="messageClass" v-if="message">{{ message }}</div>
      <div class="success" v-if="clue">CLUE: {{ clue }}</div>

      <div>
        <router-link class="btn" :to="backTo">◀ Back</router-link>
        <router-link v-if="unlockedNext" class="btn" :to="nextTo">Next ▶</router-link>
        <router-link v-else class="btn" style="opacity:.5; pointer-events:none;" to="">Next ▶</router-link>
      </div>

      <ResultsTable :results="results" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDb } from '../composables/useDb'
import { useSound } from '../composables/useSound'
import { useProgressStore } from '../stores/progressStore'
import { basicPuzzles } from '../validators/basic'
import { advancedPuzzles } from '../validators/advanced'
import { useTimerStore } from "../stores/timerStore.js";
import ResultsTable from '../components/ResultsTable.vue'
import Banner from '../components/Banner.vue'

const route = useRoute()
const { exec } = useDb()
const { playSuccess } = useSound()
const store = useProgressStore()

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

const backTo = computed(() => {
  if (id.value <= 1) return { name: 'home' }
  return { name: 'puzzle', params: { mode: mode.value, id: id.value - 1 } }
})

const sql = ref('')
const results = ref([])
const message = ref('')
const messageClass = ref('')
const clue = ref('')
const unlockedNext = computed(() => store.isSolved(mode.value, id.value))

const router = useRouter()

const timer = useTimerStore();

watchEffect(() => {
  if (puzzle.value) sql.value = puzzle.value.placeholder || ''
})


function onBannerClick() {
  const ok = window.confirm('Are you sure you want to leave the session? Progress is saved, but you will return to the home screen.')
  if (ok) {
    router.push({ name: 'home' })
  }
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
    if (out === true || out === undefined || out === null) {
      // treat truthy objects as ok if validator returned boolean-like
      onSuccess()
    } else if (typeof out === 'string') {
      message.value = out.startsWith('✔') ? out : `✖ ${out}`
      messageClass.value = out.startsWith('✔') ? 'success' : 'error'
    } else if (out === false) {
      message.value = '✖ Not quite'
      messageClass.value = 'error'
    } else {
      if (out === true) onSuccess()
      else message.value = '✖ Not quite'
    }
  } catch (e) {
    console.log(e)
    message.value = 'Execution error'
    messageClass.value = 'error'
  }
}

function copySql() {
  navigator.clipboard.writeText(sql.value)
  message.value = '✔'
}

function onSuccess() {
  playSuccess()
  store.markSolved(mode.value, id.value, timer.elapsedMs)
  message.value = '✔ Correct'
  messageClass.value = 'success'
  clue.value = (puzzle.value && puzzle.value.clue) || ''
}
</script>