import {useSoundStore} from "../stores/soundStore.js";

const beep = new Audio(
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YQAAAAAAAAD//wAAAP//AAD//wAAAP//AAAA//8AAP//AAAA//8AAP//AAAA//8AAP//AAAA'
)

export function useSound() {
    const soundStore = useSoundStore()

    function playSuccess() {
        if (soundStore.muted) return
        beep.currentTime = 0
        beep.play()
    }

    return { playSuccess }
}
