<template>
  <div class="control-panel">
    <div class="left">
      <span>⏱ {{ formattedTime }}</span>
    </div>

    <div class="right">
      <button class="icon-btn" @click="toggleSound">
        {{ soundMuted ? '🔇' : '🔊' }}
      </button>

      <button class="icon-btn" @click="resetProgress">
        🔁
      </button>
    </div>
  </div>
</template>

<script setup>
import { useTimerStore } from '../stores/timerStore.js'
import { useSoundStore } from '../stores/soundStore.js'
import { useProgressStore } from '../stores/progressStore.js'
import {computed} from "vue";

const timer = useTimerStore()
const sound = useSoundStore()
const progress = useProgressStore()

const soundMuted = computed(() => sound.muted)
const formattedTime = computed(() => timer.displayTime)

function toggleSound() {
  sound.toggle()
}

function resetProgress() {
  if (confirm("Reset all progress?")) {
    progress.reset()
    timer.reset()
  }
}
</script>