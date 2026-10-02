// The alarm sound: a few short beeps from the Web Audio API, so there is no audio file to ship.
// iOS only lets sound start after a tap, so `unlockSound` has to run in a tap handler; Timers.tsx
// calls it when a timer starts and on the first tap of a page that already has timers.

let context: AudioContext | undefined;

export function unlockSound() {
  try {
    context ??= new AudioContext();
    void context.resume();
  } catch {
    // No Web Audio: the alarm is silent, the overlay and vibration still work
  }
}

const BEEP_SECONDS = 0.15;
const BEEP_PAUSE_SECONDS = 0.12;
const BEEP_COUNT = 3;
const BEEP_FREQUENCY_HZ = 880;
const BEEP_VOLUME = 0.3;

/** "Piep, piep, piep": three beeps, one after the other. */
export function playBeeps() {
  if (!context || context.state !== 'running') return;
  for (let index = 0; index < BEEP_COUNT; index++) {
    const start = context.currentTime + index * (BEEP_SECONDS + BEEP_PAUSE_SECONDS);
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.frequency.value = BEEP_FREQUENCY_HZ;
    volume.gain.value = BEEP_VOLUME;
    oscillator.connect(volume).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + BEEP_SECONDS);
  }
}
