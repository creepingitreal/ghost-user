<template>
  <div class="splash" @click="enter" :class="{ leaving }">
    <!-- Scanline overlay -->
    <div class="scanlines" />

    <!-- Glitch grid background -->
    <canvas ref="gridCanvas" class="grid-canvas" />

    <!-- Centre content -->
    <div class="splash-body" :class="{ visible: bodyVisible }">
      <div class="eyebrow">CLASSIFIED // NEXUS FINANCIAL INCIDENT RESPONSE</div>

      <div class="title-block">
        <div class="title-pre">OPERATION</div>
        <h1 class="title-main">
          <span v-for="(ch, i) in titleChars" :key="i"
                class="title-char"
                :style="{ animationDelay: `${0.6 + i * 0.07}s` }">{{ ch }}</span>
        </h1>
          <Banner :style="{ animationDelay: `${0.6 + i * 0.07}s` }"/>
        <div class="title-sub">SQL FORENSICS TRAINING MODULE</div>
      </div>

      <div class="incident-bar">
        <span class="inc-item"><span class="inc-label">DATE</span> 2024-06-03</span>
        <span class="inc-sep">|</span>
        <span class="inc-item"><span class="inc-label">TIME</span> 02:09 UTC</span>
        <span class="inc-sep">|</span>
        <span class="inc-item"><span class="inc-label">STATUS</span> <span class="blink-red">● ACTIVE BREACH</span></span>
      </div>

      <p class="briefing-text">
        Nexus Financial's database has been compromised. 436 MB of client data is missing.
        The attacker's footprints are still warm. <strong>You have six hours.</strong>
      </p>

      <button class="enter-btn" @click.stop="enter">
        <span class="enter-text">ACCEPT ASSIGNMENT</span>
        <span class="enter-arrow">→</span>
      </button>

      <div class="corner-tag">v2.0 // MYSQL DIALECT // ANALYST CLEARANCE</div>
    </div>

    <!-- Corner decorations -->
    <div class="corner corner-tl" />
    <div class="corner corner-tr" />
    <div class="corner corner-bl" />
    <div class="corner corner-br" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Banner from "../components/Banner.vue";

const router   = useRouter()
const gridCanvas = ref(null)
const bodyVisible = ref(false)
const leaving   = ref(false)

const titleChars = 'GHOST USER'.split('')

let raf, ctx, cols, rows, drops

function initGrid() {
  const canvas = gridCanvas.value
  if (!canvas) return
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
  ctx  = canvas.getContext('2d')
  cols = Math.floor(canvas.width  / 20)
  rows = Math.floor(canvas.height / 20)
  drops = Array.from({ length: cols }, () => Math.random() * rows)

  function draw() {
    ctx.fillStyle = 'rgba(10, 15, 10, 0.18)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.font = '13px "Courier New", monospace'

    for (let i = 0; i < cols; i++) {
      const chars = '01ABCDEF◆▸░▒▓'
      const ch = chars[Math.floor(Math.random() * chars.length)]
      const alpha = 0.08 + Math.random() * 0.12
      ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`
      ctx.fillText(ch, i * 20, drops[i] * 20)
      if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0
      drops[i] += 0.4
    }
    raf = requestAnimationFrame(draw)
  }
  draw()
}

function enter() {
  if (leaving.value) return
  leaving.value = true
  setTimeout(() => router.push({ name: 'home' }), 500)
}

onMounted(() => {
  initGrid()
  setTimeout(() => { bodyVisible.value = true }, 200)
  window.addEventListener('resize', initGrid)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', initGrid)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');

.splash {
  position: fixed; inset: 0;
  background: #060c06;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: opacity 0.5s ease;
  font-family: 'Rajdhani', sans-serif;
}
.splash.leaving { opacity: 0; pointer-events: none; }

.grid-canvas {
  position: absolute; inset: 0;
  pointer-events: none;
}

.scanlines {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px, transparent 3px,
    rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px
  );
}

/* ── Corners ── */
.corner {
  position: absolute; width: 28px; height: 28px;
  border-color: rgba(0,255,136,0.5); border-style: solid;
}
.corner-tl { top: 24px; left: 24px;  border-width: 2px 0 0 2px; }
.corner-tr { top: 24px; right: 24px; border-width: 2px 2px 0 0; }
.corner-bl { bottom: 24px; left: 24px;  border-width: 0 0 2px 2px; }
.corner-br { bottom: 24px; right: 24px; border-width: 0 2px 2px 0; }

/* ── Body ── */
.splash-body {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 2rem;
  opacity: 0; transform: translateY(16px);
  transition: opacity 0.8s ease, transform 0.8s ease;
  max-width: 720px; width: 100%;
}
.splash-body.visible { opacity: 1; transform: translateY(0); }

.eyebrow {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.7rem; letter-spacing: 0.2em;
  color: rgba(0,255,136,0.4);
  margin-bottom: 2.4rem;
}

.title-block { margin-bottom: 1.8rem; }

.title-pre {
  font-size: 0.85rem; letter-spacing: 0.35em; font-weight: 600;
  color: rgba(0,255,136,0.55);
  margin-bottom: 0.3rem;
}

h1.title-main {
  font-size: clamp(3.5rem, 10vw, 7rem);
  font-weight: 700; letter-spacing: 0.12em;
  color: #00ff88; margin: 0;
  text-shadow: 0 0 40px rgba(0,255,136,0.3);
  display: flex; justify-content: center; gap: 0;
}
.title-char {
  display: inline-block;
  opacity: 0; transform: translateY(-20px);
  animation: charDrop 0.4s ease forwards;
}
@keyframes charDrop {
  to { opacity: 1; transform: translateY(0); }
}

.title-sub {
  font-size: 0.75rem; letter-spacing: 0.3em; font-weight: 600;
  color: rgba(0,255,136,0.4);
  margin-top: 0.5rem;
}

/* ── Incident bar ── */
.incident-bar {
  display: flex; align-items: center; gap: 1rem;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.72rem; letter-spacing: 0.08em;
  color: rgba(0,255,136,0.6);
  border: 1px solid rgba(0,255,136,0.15);
  padding: 0.5rem 1.2rem;
  margin-bottom: 1.8rem;
}
.inc-label { color: rgba(0,255,136,0.35); margin-right: 0.4rem; }
.inc-sep   { color: rgba(0,255,136,0.2); }
.blink-red { color: #ff4444; animation: blink 1.1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

/* ── Briefing text ── */
.briefing-text {
  font-size: 1.05rem; line-height: 1.7;
  color: rgba(200,216,200,0.7);
  max-width: 520px;
  margin-bottom: 2.4rem;
}
.briefing-text strong { color: #00ff88; }

/* ── Enter button ── */
.enter-btn {
  display: flex; align-items: center; gap: 0.8rem;
  background: transparent;
  border: 1px solid rgba(0,255,136,0.5);
  color: #00ff88;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem; font-weight: 600; letter-spacing: 0.2em;
  padding: 0.85rem 2.2rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative; overflow: hidden;
}
.enter-btn::before {
  content: '';
  position: absolute; inset: 0;
  background: rgba(0,255,136,0);
  transition: background 0.2s;
}
.enter-btn:hover::before { background: rgba(0,255,136,0.08); }
.enter-btn:hover { border-color: #00ff88; box-shadow: 0 0 20px rgba(0,255,136,0.2); }
.enter-arrow { font-size: 1.1rem; transition: transform 0.2s; }
.enter-btn:hover .enter-arrow { transform: translateX(4px); }

/* ── Corner tag ── */
.corner-tag {
  position: fixed; bottom: 28px; right: 36px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.6rem; letter-spacing: 0.12em;
  color: rgba(0,255,136,0.2);
}
</style>
