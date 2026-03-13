<!-- HomeView.vue -->
<template>
  <div class="terminal">

    <!-- Header -->
    <div class="home-header">
      <Banner clickable @banner-click="restartHome" />
    </div>

    <!-- Case Title -->
    <div class="case-title-block">
      <span class="case-label">CASE FILE</span>
      <h1 class="case-title">Ghost User Archive</h1>
      <span class="case-status">● STATUS: ACTIVE</span>
    </div>

    <!-- Incident Brief -->
    <div class="brief-panel">
      <div class="brief-header">
        <span class="brief-icon">▮</span>
        <span class="brief-title">INCIDENT BRIEFING</span>
      </div>
      <div class="brief-body">
        <p>
          At <strong>02:14 UTC</strong>, an unidentified intruder — codename
          <strong class="highlight">Ghost User</strong> — breached internal systems and
          initiated a sequence of tampered logs, corrupted identities, and
          high-risk data movements. Their path through the network is
          fragmented and obscured.
        </p>
        <p>
          Your mission is to reconstruct the Ghost User's movements using
          SQL-based investigation across
          <code>users</code>, <code>transactions</code>, and
          <code>audit_logs</code>. Each successful query will unlock a
          <strong>CLUE FRAGMENT</strong> used to unmask the Ghost User's
          signature.
        </p>
      </div>
    </div>

    <!-- Intelligence Note -->
    <div class="intel-block">
      <div class="intel-row">
        <span class="intel-key">BREACH TIME</span>
        <span class="intel-val">2024-06-03 02:14 UTC</span>
      </div>
      <div class="intel-row">
        <span class="intel-key">TABLES IN SCOPE</span>
        <span class="intel-val">users · transactions · audit_logs</span>
      </div>
      <div class="intel-row">
        <span class="intel-key">ADVANCED TABLES</span>
        <span class="intel-val">+ sessions · network_events</span>
      </div>
      <div class="intel-row">
        <span class="intel-key">PROGRESS</span>
        <span class="intel-val">Saved automatically</span>
      </div>
    </div>

    <!-- Investigation Paths -->
    <div class="paths-section">
      <p class="paths-label">SELECT YOUR INVESTIGATION PATH</p>

      <div class="path-cards">
        <!-- Basic -->
        <div class="path-card basic">
          <div class="path-card-header">
            <span class="path-icon">▶</span>
            <span class="path-name">Basic Investigation</span>
          </div>
          <div class="path-card-body">
            <p>Five tasks. Core SQL fundamentals. Learn to navigate the database, find missing records, aggregate data, group results, and trace an IP address. Ideal if you want a refresher on everyday SQL.</p>
            <div class="path-meta">
              <span class="path-tag">SELECT</span>
              <span class="path-tag">WHERE</span>
              <span class="path-tag">COUNT / SUM</span>
              <span class="path-tag">GROUP BY</span>
              <span class="path-tag">DISTINCT</span>
            </div>
          </div>
          <div class="path-card-footer">
            <div class="path-progress" v-if="basicProgress.total > 0">
              <span class="path-progress-text">{{ basicProgress.solved }}/{{ basicProgress.total }} completed</span>
              <div class="path-progress-bar">
                <div class="path-progress-fill basic-fill" :style="{ width: `${(basicProgress.solved / basicProgress.total) * 100}%` }" />
              </div>
            </div>
            <router-link
                class="btn path-btn"
                :to="{ name: 'puzzle', params: { mode: 'basic', id: basicStartId } }"
            >
              {{ basicProgress.solved > 0 ? '▶ Continue' : '▶ Begin Investigation' }}
            </router-link>
          </div>
        </div>

        <!-- Advanced -->
        <div class="path-card advanced">
          <div class="path-card-header">
            <span class="path-icon adv">⚡</span>
            <span class="path-name adv">Advanced Investigation</span>
          </div>
          <div class="path-card-body">
            <p>Ten tasks, progressively harder. Goes deeper with joins, subqueries, aggregation with HAVING, LEFT JOIN with COALESCE, and a final CTE query. Linked to the basic storyline.</p>
            <div class="path-meta">
              <span class="path-tag adv">JOIN</span>
              <span class="path-tag adv">SUBQUERY</span>
              <span class="path-tag adv">LEFT JOIN</span>
              <span class="path-tag adv">COALESCE</span>
              <span class="path-tag adv">WITH / CTE</span>
            </div>
          </div>
          <div class="path-card-footer">
            <div class="path-progress" v-if="advancedProgress.total > 0">
              <span class="path-progress-text">{{ advancedProgress.solved }}/{{ advancedProgress.total }} completed</span>
              <div class="path-progress-bar">
                <div class="path-progress-fill adv-fill" :style="{ width: `${(advancedProgress.solved / advancedProgress.total) * 100}%` }" />
              </div>
            </div>
            <router-link
                class="btn path-btn secondary"
                :to="{ name: 'puzzle', params: { mode: 'advanced', id: advancedStartId } }"
            >
              {{ advancedProgress.solved > 0 ? '⚡ Continue' : '⚡ Begin Investigation' }}
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer note -->
    <p class="footer-note">
      Your progress is saved in the browser. Close and return at any time without losing your place.
    </p>

  </div>
</template>

<script setup>
import Banner from '../components/Banner.vue'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { basicPuzzles } from '../validators/basic'
import { advancedPuzzles } from '../validators/advanced'

const router = useRouter()

function restartHome() {
  const ok = window.confirm('Return to home? Your progress will remain saved.')
  if (ok) router.push({ name: 'home' })
}

function getProgress(mode, puzzles) {
  const saved = JSON.parse(localStorage.getItem(`ghost-${mode}-progress`) || '{}')
  const solved = Object.values(saved).filter(v => v.solved).length
  return { solved, total: puzzles.length }
}

const basicProgress    = computed(() => getProgress('basic',    basicPuzzles))
const advancedProgress = computed(() => getProgress('advanced', advancedPuzzles))

// Resume from last unsolved puzzle, or task 1
function getStartId(mode, puzzles) {
  const saved = JSON.parse(localStorage.getItem(`ghost-${mode}-progress`) || '{}')
  const solvedIds = Object.entries(saved).filter(([, v]) => v.solved).map(([k]) => parseInt(k))
  const next = puzzles.find(p => !solvedIds.includes(p.id))
  return next ? next.id : puzzles[0].id
}

const basicStartId    = computed(() => getStartId('basic',    basicPuzzles))
const advancedStartId = computed(() => getStartId('advanced', advancedPuzzles))
</script>

<style scoped>
/* Design tokens — must match PuzzleView exactly */
:root {
  --green:  #00ff88;
  --bg:     #0a0f0a;
  --text:   #c8d8c8;
  --muted:  rgba(200, 216, 200, 0.45);
  --border: rgba(0, 255, 136, 0.18);
  --font-mono: "Courier New", Courier, monospace;
}

/* ── Header ── */
.home-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

/* ── Case Title ── */
.case-title-block {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.case-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--muted);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 2px;
}

.case-title {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  color: var(--green);
  font-weight: 700;
  letter-spacing: 0.05em;
  margin: 0;
  text-shadow: 0 0 16px rgba(0, 255, 136, 0.35);
}

.case-status {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--green);
  letter-spacing: 0.1em;
  animation: blink-status 2.5s step-end infinite;
}

@keyframes blink-status {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* ── Brief Panel ── */
.brief-panel {
  border: 1px solid var(--border);
  border-left: 3px solid var(--green);
  border-radius: 4px;
  background: rgba(0, 255, 136, 0.02);
  margin-bottom: 16px;
  overflow: hidden;
}

.brief-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 255, 136, 0.1);
}

.brief-icon {
  color: var(--green);
  font-size: 0.75rem;
}

.brief-title {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--green);
  letter-spacing: 0.1em;
}

.brief-body {
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 0.83rem;
  line-height: 1.7;
  color: var(--text);
}

.brief-body p {
  margin: 0 0 10px;
}

.brief-body p:last-child {
  margin-bottom: 0;
}

.brief-body strong { color: var(--text); font-weight: 700; }
.highlight { color: var(--green) !important; }

.brief-body code {
  background: rgba(0, 255, 136, 0.08);
  border: 1px solid rgba(0, 255, 136, 0.2);
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 0.82rem;
  color: var(--green);
}

/* ── Intel block ── */
.intel-block {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 24px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
}

.intel-row {
  display: flex;
  gap: 16px;
  padding: 7px 14px;
  border-bottom: 1px solid rgba(0, 255, 136, 0.07);
}

.intel-row:last-child { border-bottom: none; }

.intel-key {
  color: var(--muted);
  letter-spacing: 0.08em;
  min-width: 160px;
  flex-shrink: 0;
}

.intel-val { color: var(--text); }

/* ── Investigation Paths ── */
.paths-section { margin-bottom: 20px; }

.paths-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--muted);
  letter-spacing: 0.12em;
  margin: 0 0 12px;
}

.path-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 600px) {
  .path-cards { grid-template-columns: 1fr; }
}

/* ── Path Card ── */
.path-card {
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.25);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.path-card.basic:hover {
  border-color: rgba(0, 255, 136, 0.45);
  box-shadow: 0 0 16px rgba(0, 255, 136, 0.07);
}

.path-card.advanced:hover {
  border-color: rgba(255, 170, 0, 0.45);
  box-shadow: 0 0 16px rgba(255, 170, 0, 0.07);
}

.path-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  background: rgba(0, 255, 136, 0.03);
}

.path-card.advanced .path-card-header {
  background: rgba(255, 170, 0, 0.03);
}

.path-icon { color: var(--green); font-size: 0.8rem; }
.path-icon.adv { color: #ffaa00; }

.path-name {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--green);
  letter-spacing: 0.04em;
}

.path-name.adv { color: #ffaa00; }

.path-card-body {
  padding: 12px 14px;
  flex: 1;
}

.path-card-body p {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.65;
  color: var(--muted);
  margin: 0 0 12px;
}

.path-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.path-tag {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  padding: 2px 7px;
  border: 1px solid rgba(0, 255, 136, 0.25);
  border-radius: 2px;
  color: var(--green);
  background: rgba(0, 255, 136, 0.05);
  letter-spacing: 0.06em;
}

.path-tag.adv {
  border-color: rgba(255, 170, 0, 0.3);
  color: #ffaa00;
  background: rgba(255, 170, 0, 0.05);
}

.path-card-footer {
  padding: 10px 14px 14px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Path Progress ── */
.path-progress { display: flex; flex-direction: column; gap: 5px; }

.path-progress-text {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--muted);
}

.path-progress-bar {
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.path-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}

.basic-fill    { background: var(--green); }
.adv-fill      { background: #ffaa00; }

/* ── Path Button ── */
.path-btn {
  align-self: flex-start;
  font-size: 0.8rem;
  padding: 7px 14px;
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
  text-decoration: none;
  transition: background 0.15s, box-shadow 0.15s;
  white-space: nowrap;
}

.btn:hover {
  background: rgba(0, 255, 136, 0.08);
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.18);
}

.btn.secondary {
  border-color: #ffaa00;
  color: #ffaa00;
}

.btn.secondary:hover {
  background: rgba(255, 170, 0, 0.07);
  box-shadow: 0 0 10px rgba(255, 170, 0, 0.15);
}

/* ── Footer ── */
.footer-note {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--muted);
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  text-align: center;
}
</style>