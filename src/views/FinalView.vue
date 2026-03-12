<template>
  <div class="container">
    <div class="terminal">
      <Banner />
      <h1>CASE CLOSED — {{ modeTitle }}</h1>
      <p class="success">Final Phrase: SHADOW EXFIL TAMPER BREACH TRACE</p>
      <h2 class="error">Attacker Handle: SHADOWTRACER</h2>
      <router-link class="btn" to="/">Back to Menu</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Banner from '../components/Banner.vue'

const route = useRoute()
const modeTitle = computed(() => route.params.mode === 'basic' ? 'Basic' : 'Advanced')
</script>