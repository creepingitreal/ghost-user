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


      <button class="icon-btn" @click="theme.toggle()">
        {{ theme.mode === 'light' ? '🌙' : '☀️' }}
      </button>
    </div>
  </div>
  <slot/>
</template>

<script setup>
import { useTimerStore } from '../stores/timerStore.js'
import { useSoundStore } from '../stores/soundStore.js'
import { useProgressStore } from '../stores/progressStore.js'
import {pinia} from "../plugins/pinia.js";
import {computed} from "vue";
import {useThemeStore} from "../stores/themeStore.js";

const theme = useThemeStore()
const timer = useTimerStore()
const sound = useSoundStore()
const progress = useProgressStore(pinia)

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