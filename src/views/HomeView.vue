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
import '../assets/home-view.css'
import { ref, computed, onMounted } from 'vue'

const descOpen = ref({ basic: false, advanced: false })
function toggleDesc(track) { descOpen.value[track] = !descOpen.value[track] }

const basicProgress = ref([])
const advProgress   = ref([])

const basicSkills = ['SHOW TABLES','DESCRIBE','IS NULL','SUM','GROUP BY','LIKE']
const advSkills   = ['COUNT DISTINCT','JOIN','LEFT JOIN','COALESCE','ORDER BY','CTE','ABS']

onMounted(() => {
  try {
    const basic = JSON.parse(localStorage.getItem('ghost-basic-progress') || '[]')
    basicProgress.value = Array.isArray(basic) ? basic : []
    const adv = JSON.parse(localStorage.getItem('ghost-advanced-progress') || '[]')
    advProgress.value = Array.isArray(adv) ? adv : []
  } catch (_) {
    basicProgress.value = []
    advProgress.value = []
  }
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
  name: 'task', params: { mode: 'basic', id: getStartId(basicProgress.value, 5) }
}))
const advStartRoute = computed(() => ({
  name: 'task', params: { mode: 'advanced', id: getStartId(advProgress.value, 10) }
}))
</script>
