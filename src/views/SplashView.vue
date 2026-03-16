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
import '../assets/splash-view.css'
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
