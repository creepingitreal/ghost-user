<template>
  <div class="splash" :class="{ leaving }">
    <canvas ref="canvas" class="rain" />
    <div class="scanline" />

    <div class="body" :class="{ show: ready }">
      <!-- ASCII logo -->
      <pre class="ascii">{{ ascii }}</pre>

      <div class="meta">
        <span class="meta-item">NX-2024-0603</span>
        <span class="sep">|</span>
        <span class="meta-item">02:09 UTC</span>
        <span class="sep">|</span>
        <span class="meta-item blink-red">● BREACH ACTIVE</span>
      </div>

      <p class="brief">
        Nexus Financial has been compromised. 436 MB of client data is missing.<br>
        The attacker's footprints are still warm. <strong>You have six hours.</strong>
      </p>

      <button class="enter-btn" @click="enter">
        [ ACCEPT ASSIGNMENT ]
      </button>

      <div class="footer-tag">SQL FORENSICS MODULE // MYSQL DIALECT</div>
    </div>

    <div class="corner tl" /><div class="corner tr" />
    <div class="corner bl" /><div class="corner br" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router  = useRouter()
const canvas  = ref(null)
const ready   = ref(false)
const leaving = ref(false)

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

let raf
function initRain() {
  const c = canvas.value
  if (!c) return
  c.width = window.innerWidth
  c.height = window.innerHeight
  const ctx = c.getContext('2d')
  const cols = Math.floor(c.width / 18)
  const drops = Array.from({ length: cols }, () => Math.random() * -60)
  const chars = '01アカサGHOST░▒▓◆'

  function draw() {
    ctx.fillStyle = 'rgba(10,10,10,0.16)'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.font = '13px "Share Tech Mono", monospace'
    for (let i = 0; i < cols; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)]
      const a  = 0.06 + Math.random() * 0.1
      ctx.fillStyle = `rgba(0,255,65,${a})`
      ctx.fillText(ch, i * 18, drops[i] * 18)
      if (drops[i] * 18 > c.height && Math.random() > 0.975) drops[i] = 0
      drops[i] += 0.35
    }
    raf = requestAnimationFrame(draw)
  }
  draw()
}

function enter() {
  if (leaving.value) return
  leaving.value = true
  setTimeout(() => router.push({ name: 'home' }), 400)
}

onMounted(() => {
  initRain()
  setTimeout(() => { ready.value = true }, 150)
  window.addEventListener('resize', initRain)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', initRain)
})
</script>

<style scoped>
.splash {
  position: fixed; inset: 0;
  background: #0a0a0a;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  transition: opacity 0.4s ease;
  white-space: pre;
}
.splash.leaving { opacity: 0; pointer-events: none; }

.rain {
  position: absolute; inset: 0; pointer-events: none;
}
.scanline {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: repeating-linear-gradient(
    to bottom, transparent 0, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px
  );
}

/* ── corners ── */
.corner {
  position: absolute; width: 22px; height: 22px;
  border-color: rgba(0,255,65,0.45); border-style: solid;
}
.tl { top: 18px; left: 18px;  border-width: 2px 0 0 2px; }
.tr { top: 18px; right: 18px; border-width: 2px 2px 0 0; }
.bl { bottom: 18px; left: 18px;  border-width: 0 0 2px 2px; }
.br { bottom: 18px; right: 18px; border-width: 0 2px 2px 0; }

/* ── body ── */
.body {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 1.5rem;
  opacity: 0; transform: translateY(10px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.body.show { opacity: 1; transform: none; }

/* ── ascii ── */
.ascii {
  font-family: 'Share Tech Mono', monospace;
  //font-size: clamp(0.38rem, 1.1vw, 0.6rem);
  line-height: 1.15;
  color: #00ff41;
  text-shadow: 0 0 18px rgba(0,255,65,0.35);
  white-space: pre;
  margin-bottom: 1.4rem;
  letter-spacing: 0;
}

/* ── meta strip ── */
.meta {
  display: flex; align-items: center; gap: 0.8rem;
  font-size: 0.7rem; letter-spacing: 0.1em;
  color: rgba(0,255,65,0.5);
  border: 1px solid rgba(0,255,65,0.14);
  padding: 0.35rem 1rem;
  margin-bottom: 1.2rem;
}
.sep { color: rgba(0,255,65,0.2); }
.blink-red { color: #ff3333; animation: blink 1.1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

/* ── brief ── */
.brief {
  font-size: 0.82rem; line-height: 1.7;
  color: rgba(184,212,184,0.65);
  max-width: 480px; margin-bottom: 1.8rem;
}
.brief strong { color: #00ff41; }

/* ── enter button ── */
.enter-btn {
  background: transparent;
  border: 1px solid rgba(0,255,65,0.45);
  color: #00ff41;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.85rem; letter-spacing: 0.15em;
  padding: 0.7rem 1.8rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1.4rem;
}
.enter-btn:hover {
  background: rgba(0,255,65,0.07);
  border-color: #00ff41;
  box-shadow: 0 0 16px rgba(0,255,65,0.15);
}

.footer-tag {
  font-size: 0.6rem; letter-spacing: 0.18em;
  color: rgba(0,255,65,0.2);
}
</style>
