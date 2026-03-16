<template>
  <!-- Vue 3 fragment — button + teleported modal as siblings under one root -->
  <span class="back-hq-root">
    <button class="hq-btn" :class="btnClass" @click="open = true">
      {{ label }}
    </button>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="open" class="hq-overlay" @click.self="open = false">
          <div class="hq-box">
            <div class="hq-eyebrow">// NAVIGATION</div>
            <div class="hq-title">RETURN TO HQ?</div>

            <div class="hq-body">
              <p>What would you like to do with your current investigation progress?</p>
            </div>

            <div class="hq-actions">
              <button class="hq-action-btn save-btn" @click="saveAndGo">
                <span class="action-icon">✓</span>
                <span class="action-text">
                  <span class="action-label">SAVE PROGRESS</span>
                  <span class="action-sub">Keep completed tasks and return to HQ</span>
                </span>
              </button>

              <button class="hq-action-btn discard-btn" @click="discardAndGo">
                <span class="action-icon">✗</span>
                <span class="action-text">
                  <span class="action-label">ABANDON INVESTIGATION</span>
                  <span class="action-sub">Clear all progress for this track and return to HQ</span>
                </span>
              </button>

              <button class="hq-action-btn cancel-btn" @click="open = false">
                <span class="action-icon">←</span>
                <span class="action-text">
                  <span class="action-label">STAY ON THIS PAGE</span>
                  <span class="action-sub">Continue the investigation</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </span>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '../stores/progressStore.js'

const props = defineProps({
  mode: {
    type: String,
    default: null,
  },
  label: {
    type: String,
    default: '← Back to HQ',
  },
  btnClass: {
    type: String,
    default: '',
  },
})

const router        = useRouter()
const progressStore = useProgressStore()
const open          = ref(false)

function saveAndGo() {
  open.value = false
  router.push({ name: 'home' })
}

function discardAndGo() {
  if (props.mode) {
    progressStore.reset(props.mode)
  }
  open.value = false
  router.push({ name: 'home' })
}
</script>
