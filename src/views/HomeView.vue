<template>
  <div class="home">
    <div class="scanline" />

    <div class="home-inner">

      <!-- Header -->
      <header class="site-header">
        <div class="header-left">
          <span class="ascii">{{ascii}}</span>
          <div class="logo-eyebrow">NEXUS FINANCIAL // IR PORTAL</div>
        </div>
        <div class="header-right">
          <span class="status-dot" :class="{ resolved: caseSolved }" />
          <span class="status-text" :class="{ resolved: caseSolved }">
            {{ caseSolved ? 'CASE RESOLVED' : 'BREACH ACTIVE' }}
          </span>
        </div>
      </header>

      <!-- Briefing strip -->
      <div class="briefing-strip">
        <div class="strip-item">
          <span class="strip-label">INCIDENT</span>
          <span class="strip-value">NX-2024-0603</span>
        </div>
        <div class="strip-divider" />
        <div class="strip-item">
          <span class="strip-label">VECTOR</span>
          <span class="strip-value">DB EXFILTRATION</span>
        </div>
        <div class="strip-divider" />
        <div class="strip-item">
          <span class="strip-label">EXFILTRATED</span>
          <span class="strip-value" :class="caseSolved ? 'resolved-val' : 'danger'">
            {{ caseSolved ? 'RECOVERED' : '436 MB' }}
          </span>
        </div>
        <div class="strip-divider" />
        <div class="strip-item">
          <span class="strip-label">SUSPECT</span>
          <span class="strip-value" :class="caseSolved ? 'resolved-val' : 'warning'">
          {{ caseSolved ? 'IDENTIFIED' : 'UNIDENTIFIED' }}
          </span>
        </div>
      </div>

      <!-- Incident briefing -->
      <div class="inc-panel">
        <div class="inc-panel-header">
          <h1 class="inc-panel-label">
            {{ caseSolved ? '// CASE CLOSED — NX-2024-0603' : '// INCIDENT BRIEFING — GHOST USER' }}
          </h1>
        </div>
        <div class="inc-panel-body">
          <p class="inc-text">
            At <strong>02:14 UTC</strong>, an unidentified intruder — codename
            <strong>Ghost User</strong> — breached internal systems and initiated a
            sequence of tampered logs, corrupted identities, and high-risk data
            movements. Their path through the network is fragmented and obscured.
          </p>
          <p class="inc-text">
            Your mission is to reconstruct the Ghost User's movements using SQL-based
            investigation across <code>users</code>, <code>transactions</code>, and
            <code>audit_logs</code>. Each successful analysis reveals a
            <strong>CLUE</strong> used to unmask the Ghost User's signature.
          </p>
        </div>
      </div>

      <!-- Section label -->
      <div class="paths-header-row">
        <span class="paths-header">YOUR INVESTIGATION PATHS</span>
      </div>

      <!-- Track cards -->
      <div class="tracks">
        <!-- Basic -->
        <div class="track-card" :class="{ complete: basicComplete }">
          <div class="track-header">

            <div class="track-header-text">
              <div class="track-tag">TRACK 01</div>
              <div class="track-name">Field Analyst</div>
              <button class="brief-toggle" @click="toggleDesc('basic')">
                Mission briefing
                <span class="toggle-arrow" :class="{ open: descOpen.basic }">▾</span>
              </button>
              <div class="track-desc" :class="{ open: descOpen.basic }">
                Five targeted queries. Map the database, expose ghost accounts, trace the data outflow, and identify the attacker's origin IP. Every task teaches a core MySQL skill.
              </div>
            </div>
            <div class="track-badge basic-badge" :class="{ complete: basicComplete }">
              {{ basicComplete ? 'COMPLETE' : 'BASIC' }}
            </div>
          </div>

          <div class="track-skills">
            <span v-for="s in basicSkills" :key="s" class="skill-tag">{{ s }}</span>
          </div>

          <div class="track-progress">
            <div class="progress-row">
              <span class="progress-label">{{ basicComplete ? 'Investigation complete' : 'Progress' }}</span>
              <span class="progress-count" :class="{ complete: basicComplete }">{{ basicSolved }}/5</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :class="{ complete: basicComplete }" :style="{ width: (basicSolved / 5 * 100) + '%' }" />
            </div>
          </div>

          <!-- Complete state: show reset option -->
          <template v-if="basicComplete">
            <div class="complete-msg">✓ All tasks solved</div>
            <div class="complete-actions">
              <router-link :to="{ name: 'task', params: { mode: 'basic', id: 1 } }" class="track-btn basic-btn">
                REVIEW TRACK&nbsp<span class="btn-arrow">→</span>
              </router-link>
              <button class="reset-btn" @click="confirmReset('basic')">↺ Clear &amp; restart</button>
            </div>
          </template>

          <!-- In-progress / not started -->
          <router-link v-else :to="basicStartRoute" class="track-btn basic-btn">
            {{ basicSolved === 0 ? 'BEGIN INVESTIGATION' : 'CONTINUE' }}
            <span class="btn-arrow">→</span>
          </router-link>
        </div>

        <!-- Advanced -->
        <div class="track-card track-adv" :class="{ complete: advComplete }">
          <div class="track-header">
            <div class="track-header-text">
              <div class="track-tag adv-tag">TRACK 02</div>
              <div class="track-name">Senior Investigator</div>
              <button class="brief-toggle adv-toggle" @click="toggleDesc('advanced')">
                Mission briefing
                <span class="toggle-arrow" :class="{ open: descOpen.advanced }">▾</span>
              </button>
              <div class="track-desc" :class="{ open: descOpen.advanced }">
                Ten deep-dive queries: JOINs, CTEs, GROUP BY, aggregates, privilege escalation, timeline reconstruction. At the end — identify the perpetrator by name.
              </div>
            </div>
            <div class="track-badge adv-badge" :class="{ complete: advComplete }">
              {{ advComplete ? 'COMPLETE' : 'ADVANCED' }}
            </div>
          </div>

          <div class="track-skills">
            <span v-for="s in advSkills" :key="s" class="skill-tag adv-skill">{{ s }}</span>
          </div>

          <div class="track-progress">
            <div class="progress-row">
              <span class="progress-label">{{ advComplete ? 'Investigation complete' : 'Progress' }}</span>
              <span class="progress-count adv-count" :class="{ complete: advComplete }">{{ advSolved }}/10</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill adv-fill" :class="{ complete: advComplete }" :style="{ width: (advSolved / 10 * 100) + '%' }" />
            </div>
          </div>

          <template v-if="advComplete">
            <div class="complete-msg adv-complete-msg">✓ All tasks solved</div>
            <div class="complete-actions">
              <router-link :to="{ name: 'task', params: { mode: 'advanced', id: 1 } }" class="track-btn adv-btn">
                REVIEW TRACK&nbsp<span class="btn-arrow">→</span>
              </router-link>
              <button class="reset-btn adv-reset-btn" @click="confirmReset('advanced')">↺ Clear &amp; restart</button>
            </div>
          </template>

          <router-link v-else :to="advStartRoute" class="track-btn adv-btn">
            {{ advSolved === 0 ? 'BEGIN INVESTIGATION' : 'CONTINUE' }}
            <span class="btn-arrow">→</span>
          </router-link>
        </div>

      </div>

      <div class="home-footer">
        Complete the Advanced track to unlock the Final Debrief — identify the perpetrator.
      </div>
    </div>
  </div>
</template>

<script setup>
import '../assets/home-view.css'
import { ref, computed, onMounted } from 'vue'
import { useProgressStore } from '../stores/progressStore.js'

const progressStore = useProgressStore()

const descOpen = ref({ basic: false, advanced: false })
function toggleDesc(track) { descOpen.value[track] = !descOpen.value[track] }

const basicSkills = ['SHOW TABLES', 'DESCRIBE', 'IS NULL', 'SUM', 'GROUP BY', 'LIKE']
const advSkills   = ['COUNT DISTINCT', 'JOIN', 'LEFT JOIN', 'COALESCE', 'ORDER BY', 'CTE', 'ABS']

const ascii = [
  '  ____ _               _   _   _               ',
  ' / ___| |__   ___  ___| |_| | | |___  ___ _ __ ',
  "| |  _| '_ \\ / _ \\/ __| __| | | / __|/ _ \\ '__|",
  '| |_| | | | | (_) \\__ \\ |_| |_| \\__ \\  __/ |   ',
  ' \\____|_| |_|\\___/|___/\\__|\\___/|___/\\___|_|   ',
  '',
  'S Q L   F O R E N S I C S   //   M Y S Q L   D I A L E C T',
  '',
].join('\n')


// ── Progress — read directly from store (handles object format correctly) ─────
const basicSolved = computed(() => progressStore.countSolved('basic'))
const advSolved   = computed(() => progressStore.countSolved('advanced'))
const basicComplete = computed(() => basicSolved.value === 5)
const advComplete   = computed(() => advSolved.value === 10)

// ── Routing — find first unsolved task ────────────────────────────────────────
function getStartId(mode, total) {
  for (let i = 1; i <= total; i++) {
    if (!progressStore.isSolved(mode, i)) return i
  }
  return 1
}

const basicStartRoute = computed(() => ({
  name: 'task', params: { mode: 'basic', id: getStartId('basic', 5) }
}))
const advStartRoute = computed(() => ({
  name: 'task', params: { mode: 'advanced', id: getStartId('advanced', 10) }
}))

const caseSolved = computed(() => progressStore.isCaseSolved())

// ── Reset ─────────────────────────────────────────────────────────────────────
function confirmReset(mode) {
  const label = mode === 'basic' ? 'Basic' : 'Advanced'
  if (confirm(`Clear all ${label} track progress and start from the beginning?`)) {
    progressStore.reset(mode)
  }
}

// Refresh counts on mount in case store was hydrated before component loaded
onMounted(() => {
  // progressStore already reads from localStorage on init — nothing extra needed
})
</script>
