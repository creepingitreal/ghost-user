<template>
  <div id="output">
    <template v-if="!results || results.length === 0">
      No results.
    </template>
    <template v-else>
      <table class="table">
        <thead>
        <tr>
          <th v-for="c in results[0].columns" :key="c">{{ c }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(row, i) in results[0].values" :key="i">
          <td v-for="(cell, j) in row" :key="j">{{ cell === null ? 'NULL' : cell }}</td>
        </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<script setup>
defineProps({
  results: { type: Array, default: () => [] }
})
</script>