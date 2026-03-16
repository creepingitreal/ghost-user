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

<style scoped>
.table {
  font-size: 14px;
  border-collapse: separate;
  border-spacing: 0 0; /* remove default spacing, use borders instead */
  width: 100%;
}
.table th,
.table td {
  padding: 3px 10px; /* vertical and horizontal padding */
  text-align: left;
  border-right: 1px solid var(--green-dim);
}
.table th:last-child,
.table td:last-child {
  border-right: none;
}
.table tr {
  border-right: 1px solid var(--green-dim);
}
.table tr:last-child {
  border-bottom: none;
}
.table th {
  background: rgb(36 36 36 / 0.61);
  font-weight: 600;
}
</style>