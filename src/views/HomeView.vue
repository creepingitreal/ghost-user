<template>
  <div class="container">
    <div class="terminal">
      <Banner clickable @banner-click="restartHome" />
      <h1>Incident Briefing — Ghost User Archive</h1>

      <p>
        At <strong>02:14 UTC</strong>, an unidentified intruder — codename
        <strong>Ghost User</strong> — breached internal systems and initiated a
        sequence of tampered logs, corrupted identities, and high‑risk data
        movements. Their path through the network is fragmented and obscured.
      </p>

      <p>
        Your mission is to reconstruct the Ghost User’s movements using SQL-based
        investigation across <code>users</code>, <code>transactions</code>, and
        <code>audit_logs</code>. Each successful analysis will reveal a
        <strong>CLUE</strong> used to unmask the Ghost User’s signature.
      </p>

      <h3>Your Investigation Paths</h3>

      <div class="btn-container">
        <router-link
            class="btn"
            :to="{ name: 'puzzle', params: { mode: 'basic', id: 1 } }"
        >
          ▶ Basic Investigation
        </router-link>

        <router-link
            class="btn secondary"
            :to="{ name: 'puzzle', params: { mode: 'advanced', id: 1 } }"
        >
          ⚡ Advanced Investigation
        </router-link>
      </div>

      <p class="kv">
        Your progress is automatically saved. You can leave and return at any time.
      </p>
    </div>
  </div>
</template>

<script setup>
  import Banner from '../components/Banner.vue'
  import { useRouter } from 'vue-router'

  const router = useRouter();

  function restartHome() {
    const ok = window.confirm('Return to home? Your progress will remain saved.')
    if (ok) {
      router.push({ name: 'home' })
    }
  }
</script>