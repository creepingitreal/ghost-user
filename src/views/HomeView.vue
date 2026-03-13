<template>
  <div class="home">
    <div class="scanlines" />

    <div class="home-inner">
      <!-- Header -->
      <header class="site-header">
        <div class="header-left">
          <div class="logo-eyebrow">NEXUS FINANCIAL // IR PORTAL</div>
          <h1 class="logo">OPERATION <span class="logo-accent">GHOST USER</span></h1>
        </div>
        <div class="header-right">
          <span class="status-dot" />
          <span class="status-text">BREACH ACTIVE</span>
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
          <span class="strip-value danger">436 MB</span>
        </div>
        <div class="strip-divider" />
        <div class="strip-item">
          <span class="strip-label">SUSPECT</span>
          <span class="strip-value warning">UNIDENTIFIED</span>
        </div>
      </div>

      <!-- Two track cards -->
      <div class="tracks">
        <!-- Basic -->
        <div class="track-card">
          <div class="track-header">
            <div>
              <div class="track-tag">TRACK 01</div>
              <div class="track-name">Field Analyst</div>
              <div class="track-desc-toggle" @click="toggleDesc('basic')">
                Mission briefing
                <span class="toggle-arrow" :class="{ open: descOpen.basic }">▾</span>
              </div>
              <div class="track-desc" :class="{ open: descOpen.basic }">
                Five targeted queries. You'll map the database, hunt ghost accounts, trace stolen data to its source, and pinpoint the attacker's IP. Every query teaches a core MySQL skill. Start here if you're new to SQL forensics.
              </div>
            </div>
            <div class="track-badge basic-badge">BASIC</div>
          </div>

          <div class="track-skills">
            <span v-for="s in basicSkills" :key="s" class="skill-tag">{{ s }}</span>
          </div>

          <div class="track-progress">
            <div class="progress-row">
              <span class="progress-label">Progress</span>
              <span class="progress-count">{{ basicSolved }}/5</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (basicSolved / 5 * 100) + '%' }" />
            </div>
          </div>

          <router-link :to="basicStartRoute" class="track-btn basic-btn">
            {{ basicSolved === 0 ? 'BEGIN INVESTIGATION' : basicSolved === 5 ? 'REVIEW TRACK' : 'CONTINUE' }}
            <span class="btn-arrow">→</span>
          </router-link>
        </div>

        <!-- Advanced -->
        <div class="track-card">
          <div class="track-header">
            <div>
              <div class="track-tag">TRACK 02</div>
              <div class="track-name">Senior Investigator</div>
              <div class="track-desc-toggle" @click="toggleDesc('advanced')">
                Mission briefing
                <span class="toggle-arrow" :class="{ open: descOpen.advanced }">▾</span>
              </div>
              <div class="track-desc" :class="{ open: descOpen.advanced }">
                Ten deep-dive queries spanning JOIN, CTE, GROUP BY, aggregate functions, and timeline reconstruction. You'll build a complete forensic picture and unmask the primary perpetrator. Collect clues as you go — you'll need them at the end.
              </div>
            </div>
            <div class="track-badge adv-badge">ADVANCED</div>
          </div>

          <div class="track-skills">
            <span v-for="s in advSkills" :key="s" class="skill-tag adv-skill">{{ s }}</span>
          </div>

          <div class="track-progress">
            <div class="progress-row">
              <span class="progress-label">Progress</span>
              <span class="progress-count">{{ advSolved }}/10</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill adv-fill" :style="{ width: (advSolved / 10 * 100) + '%' }" />
            </div>
          </div>

          <router-link :to="advStartRoute" class="track-btn adv-btn">
            {{ advSolved === 0 ? 'BEGIN INVESTIGATION' : advSolved === 10 ? 'REVIEW TRACK' : 'CONTINUE' }}
            <span class="btn-arrow">→</span>
          </router-link>
        </div>
      </div>

      <!-- Footer note -->
      <div class="home-footer">
        Complete the Advanced track to unlock the Final Debrief — identify the perpetrator using your collected clues.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const descOpen = ref({ basic: false, advanced: false })
function toggleDesc(track) { descOpen.value[track] = !descOpen.value[track] }

const basicProgress = ref([])
const advProgress   = ref([])

const basicSkills = ['SHOW TABLES','DESCRIBE','IS NULL','SUM','GROUP BY','LIKE']
const advSkills   = ['COUNT DISTINCT','JOIN','LEFT JOIN','COALESCE','ORDER BY','CTE','ABS']

onMounted(() => {
  try {
    basicProgress.value = JSON.parse(localStorage.getItem('ghost-basic-progress') || '[]')
    advProgress.value   = JSON.parse(localStorage.getItem('ghost-advanced-progress') || '[]')
  } catch (_) {}
})

const basicSolved = computed(() => basicProgress.value.filter(p => p?.solved).length)
const advSolved   = computed(() => advProgress.value.filter(p => p?.solved).length)

function getStartId(progress, total) {
  for (let i = 0; i < total; i++) {
    if (!progress[i]?.solved) return i + 1
  }
  return 1
}

const basicStartRoute = computed(() => ({
  name: 'puzzle', params: { mode: 'basic', id: getStartId(basicProgress.value, 5) }
}))
const advStartRoute = computed(() => ({
  name: 'puzzle', params: { mode: 'advanced', id: getStartId(advProgress.value, 10) }
}))
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.home {
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  background: #0a0f0a;
  font-family: 'Rajdhani', sans-serif;
  color: #c8d8c8;
  position: relative;
  display: flex; flex-direction: column;
}

.scanlines {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px, transparent 3px,
    rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px
  );
}

.home-inner {
  position: relative; z-index: 1;
  max-height: 100vh;
  display: flex; flex-direction: column;
  padding: 1.2rem 1.8rem 0.8rem;
  gap: 0.9rem;
  overflow: hidden;
}

/* ── Header ── */
.site-header {
  display: flex; align-items: flex-end; justify-content: space-between;
}
.logo-eyebrow {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.6rem; letter-spacing: 0.18em;
  color: rgba(0,255,136,0.35);
  margin-bottom: 0.15rem;
}
.logo {
  font-size: 1.4rem; font-weight: 700; letter-spacing: 0.1em;
  color: rgba(200,216,200,0.85);
}
.logo-accent { color: #00ff88; }
.header-right {
  display: flex; align-items: center; gap: 0.5rem;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.65rem; letter-spacing: 0.12em;
}
.status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #ff4444; animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse { 50% { opacity: 0.3; } }
.status-text { color: rgba(255,68,68,0.7); }

/* ── Briefing strip ── */
.briefing-strip {
  display: flex; align-items: center; gap: 0;
  border: 1px solid rgba(0,255,136,0.12);
  background: rgba(0,0,0,0.3);
  padding: 0.5rem 1rem;
}
.strip-item { display: flex; flex-direction: column; gap: 0.1rem; flex: 1; }
.strip-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.55rem; letter-spacing: 0.15em;
  color: rgba(0,255,136,0.35);
}
.strip-value {
  font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em;
  color: rgba(200,216,200,0.8);
}
.strip-value.danger  { color: #ff4444; }
.strip-value.warning { color: #ffc800; }
.strip-divider { width: 1px; height: 28px; background: rgba(0,255,136,0.1); margin: 0 1rem; }

/* ── Tracks ── */
.tracks {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
  flex: 1; min-height: 0;
}

.track-card {
  border: 1px solid rgba(0,255,136,0.14);
  border-left: 2px solid rgba(0,255,136,0.4);
  background: rgba(0,0,0,0.35);
  padding: 1rem 1.1rem;
  display: flex; flex-direction: column; gap: 0.7rem;
}

.track-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
.track-tag {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.55rem; letter-spacing: 0.2em;
  color: rgba(0,255,136,0.4); margin-bottom: 0.15rem;
}
.track-name { font-size: 1.05rem; font-weight: 700; color: #c8d8c8; margin-bottom: 0.3rem; }

.track-desc-toggle {
  font-size: 0.72rem; color: rgba(0,255,136,0.55);
  cursor: pointer; display: flex; align-items: center; gap: 0.3rem;
  user-select: none; width: fit-content;
}
.track-desc-toggle:hover { color: #00ff88; }
.toggle-arrow { font-size: 0.9rem; transition: transform 0.2s; display: inline-block; }
.toggle-arrow.open { transform: rotate(180deg); }

.track-desc {
  font-size: 0.78rem; line-height: 1.55;
  color: rgba(200,216,200,0.55);
  max-height: 0; overflow: hidden;
  transition: max-height 0.3s ease, margin-top 0.2s;
  margin-top: 0;
}
.track-desc.open {
  max-height: 120px;
  margin-top: 0.4rem;
}

.track-badge {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.6rem; letter-spacing: 0.12em; font-weight: 600;
  padding: 0.25rem 0.55rem;
  border: 1px solid; white-space: nowrap; flex-shrink: 0;
}
.basic-badge { border-color: rgba(0,255,136,0.4); color: rgba(0,255,136,0.7); }
.adv-badge   { border-color: rgba(255,170,0,0.4); color: rgba(255,170,0,0.7); }

/* ── Skills ── */
.track-skills { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.skill-tag {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.58rem; padding: 0.15rem 0.45rem;
  border: 1px solid rgba(0,255,136,0.18);
  color: rgba(0,255,136,0.5);
  background: rgba(0,255,136,0.04);
}
.adv-skill {
  border-color: rgba(255,170,0,0.18);
  color: rgba(255,170,0,0.5);
  background: rgba(255,170,0,0.04);
}

/* ── Progress ── */
.track-progress { display: flex; flex-direction: column; gap: 0.3rem; }
.progress-row { display: flex; justify-content: space-between; }
.progress-label { font-size: 0.68rem; color: rgba(200,216,200,0.4); }
.progress-count { font-family: 'Share Tech Mono', monospace; font-size: 0.68rem; color: rgba(0,255,136,0.7); }
.progress-bar {
  height: 3px; background: rgba(0,255,136,0.1);
}
.progress-fill {
  height: 100%; background: #00ff88;
  transition: width 0.4s ease;
}
.adv-fill { background: #ffaa00; }

/* ── CTA button ── */
.track-btn {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.55rem 0.9rem;
  border: 1px solid rgba(0,255,136,0.35);
  color: #00ff88; background: transparent;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.78rem; font-weight: 600; letter-spacing: 0.12em;
  text-decoration: none;
  transition: all 0.2s;
  margin-top: auto;
}
.track-btn:hover {
  background: rgba(0,255,136,0.07);
  border-color: #00ff88;
}
.adv-btn {
  border-color: rgba(255,170,0,0.35); color: #ffaa00;
}
.adv-btn:hover { background: rgba(255,170,0,0.07); border-color: #ffaa00; }
.btn-arrow { font-size: 1rem; }

/* ── Footer ── */
.home-footer {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.6rem; letter-spacing: 0.06em;
  color: rgba(0,255,136,0.22);
  text-align: center; padding-bottom: 0.5rem;
}
</style>
