<template>
  <div class="container">
    <div class="terminal">
      <Banner />

      <h1>Leaderboard</h1>

      <table class="table" style="margin-top: 20px;">
        <thead>
        <tr>
          <th>Puzzle</th>
          <th>Mode</th>
          <th>Best Time</th>
        </tr>
        </thead>

        <tbody>
        <tr v-for="row in table" :key="row.key">
          <td>{{ row.id }}</td>
          <td>{{ row.mode }}</td>
          <td>{{ row.time }}</td>
        </tr>
        </tbody>
      </table>

      <div style="margin-top: 20px;">
        <router-link class="btn" to="/">◀ Back</router-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProgressStore } from '../stores/progressStore'
import Banner from "../components/Banner.vue";

const progress = useProgressStore()

function formatTime(ms) {
  if (!ms || ms <= 0) return '—'
  const sec = Math.floor(ms / 1000)
  const minutes = Math.floor(sec / 60)
  const seconds = sec % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const table = computed(() => {
  const rows = []

  for (const mode of ['basic', 'advanced']) {
    const entries = progress[mode]

    for (const id in entries) {
      const entry = entries[id]
      rows.push({
        key: `${mode}-${id}`,
        id: Number(id),
        mode,
        time: formatTime(entry.timeMs)
      })
    }
  }

  // Sort by mode then puzzle number
  rows.sort((a, b) => {
    if (a.mode < b.mode) return -1
    if (a.mode > b.mode) return 1
    return a.id - b.id
  })

  return rows
})
</script>
