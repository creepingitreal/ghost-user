<template>
  <pre :is="clickable ? 'button' : 'pre'"
       :class="[small ? 'ascii-small' : 'ascii-banner', clickable ? 'banner-clickable' : '']"
       @click="onClick"
       aria-label="Go home"
       :type="clickable ? 'button' : undefined"
  >
     ____ _               _   _   _
    / ___| |__   ___  ___| |_| | | |___  ___ _ __
   | |  _| '_ \ / _ \/ __| __| | | / __|/ _ \ '__|
   | |_| | | | | (_) \__ \ |_| |_| \__ \  __/ |
    \____|_| |_|\___/|___/\__|\___/|___/\___|_|

         G H O S T   U S E R   A R C H I V E
                   S Q L   G A M E
  </pre>
</template>

<script setup>
  const props = defineProps({
    small: { type: Boolean, default: false },
    clickable: { type: Boolean, default: false },
  })

  const emit = defineEmits(['banner-click'])

  function onClick () {
    if (!props.clickable) return
    emit('banner-click')
  }
</script>