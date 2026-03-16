<template>
  <!-- Teleport to body so it overlays everything -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="rg-overlay" @click.self="cancel">
        <div class="rg-box">
          <div class="rg-eyebrow">// SYSTEM WARNING</div>
          <div class="rg-title">RELOAD DETECTED</div>
          <div class="rg-body">
            <p>Reloading will <strong>erase all investigation progress</strong>.</p>
            <p class="rg-sub">Completed tasks, clues, and session data will be permanently deleted.</p>
          </div>
          <div class="rg-actions">
            <button class="rg-btn rg-cancel" @click="cancel">[ ABORT — STAY ON PAGE ]</button>
            <button class="rg-btn rg-confirm" @click="confirm">[ CONFIRM RELOAD ]</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * RefreshGuard
 *
 * Usage: place <RefreshGuard /> in App.vue or any layout component.
 *
 * On GitHub Pages the app is a SPA — deep links 404 on hard reload.
 * This component:
 *   1. Intercepts the browser beforeunload event with a native dialog
 *      (handles F5 / Ctrl+R / closing the tab)
 *   2. Shows our own themed modal when the user clicks the browser Back
 *      button while inside a task (popstate), giving them a chance to abort.
 *   3. On confirm → clears ALL progress keys from localStorage then allows
 *      navigation back to home (/#/home) so the SPA reloads cleanly.
 *
 * NOTE: For GitHub Pages you must use hash history (createWebHashHistory)
 * in your router — that is the only reliable way to avoid 404 on refresh
 * without a custom 404.html redirect. This component does NOT fix the
 * routing itself; it only manages the UX around reload/back.
 */
import '../assets/refresh-modal.css'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router  = useRouter()
const visible = ref(false)

let pendingAction = null   // 'popstate' | null

// ── 1. Native browser beforeunload (F5, Ctrl+R, tab close) ───────────────────
function onBeforeUnload(e) {
  e.preventDefault()
  e.returnValue = ''   // required for Chrome to show the native dialog
  // Browser will show its own "Leave site?" dialog.
  // If the user confirms, localStorage is NOT cleared here — the page reloads
  // and progress is preserved (which is the RIGHT behaviour for a true reload).
  // We only clear on an explicit in-app confirm (see confirm() below).
}

// ── 2. Popstate — back button while on a task ─────────────────────────────────
function onPopState() {
  // Only intercept if we're inside a task route
  const path = window.location.hash
  if (!path.includes('/task/') && !path.includes('/puzzle/')) return

  // Push the current state back so the URL doesn't change yet
  history.pushState(null, '', window.location.href)
  pendingAction = 'popstate'
  visible.value = true
}

function cancel() {
  visible.value  = false
  pendingAction  = null
}

function confirm() {
  // Clear all ghost user progress
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && (k.startsWith('ghost-') || k.startsWith('sql_escape'))) {
      keysToRemove.push(k)
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k))

  visible.value = false

  if (pendingAction === 'popstate') {
    // Navigate back to home in the SPA
    router.push({ name: 'home' })
  }
  pendingAction = null
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('popstate',     onPopState)
})
onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('popstate',     onPopState)
})
</script>
