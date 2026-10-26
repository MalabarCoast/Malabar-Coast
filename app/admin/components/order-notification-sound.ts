let audioContext: AudioContext | undefined;
let notificationSound: AudioBuffer | undefined;
let soundRequest: Promise<AudioBuffer | undefined> | undefined;
let activeSource: AudioBufferSourceNode | undefined;

export function notificationAudioRunning() { return audioContext?.state === "running"; }

function getAudioContext() {
  const Constructor = window.AudioContext || (window as typeof window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
  if (!Constructor) return undefined;
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new Constructor();
    audioContext.onstatechange = () => window.dispatchEvent(new Event("malabar:audio-state"));
  }
  return audioContext;
}

export async function armOrderNotificationSound() {
  const context = getAudioContext();
  if (!context) return false;
  // Resume synchronously from the enabling tap, before any network await.
  if (context.state !== "running") {
    try { await context.resume(); } catch { return false; }
  }
  if (context.state !== "running") return false;
  soundRequest ??= fetch("/sounds/mixkit-futuristic-doorbell-928.wav", {signal: AbortSignal.timeout(5000)})
    .then((response) => {if (!response.ok) throw new Error("Sound unavailable"); return response.arrayBuffer();})
    .then((buffer) => context.decodeAudioData(buffer))
    .then((sound) => {notificationSound = sound; return sound;})
    .catch(() => {soundRequest = undefined; return undefined;});
  await soundRequest;
  return notificationAudioRunning();
}

export function stopOrderNotificationSound() {
  try { activeSource?.stop(); } catch { /* Already ended. */ }
  activeSource = undefined;
}

export function playOrderNotificationSound() {
  const context = audioContext;
  if (!context || context.state !== "running") return false;
  stopOrderNotificationSound();
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -3;
  compressor.knee.value = 6;
  compressor.ratio.value = 8;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.1;
  compressor.connect(context.destination);
  if (notificationSound) {
    const source = context.createBufferSource();
    const gain = context.createGain();
    let peak = 0;
    for (let channel = 0; channel < notificationSound.numberOfChannels; channel++) {
      for (const sample of notificationSound.getChannelData(channel)) peak = Math.max(peak, Math.abs(sample));
    }
    // Normalize quiet recordings, with compression to prevent clipping.
    gain.gain.value = peak > 0 ? Math.min(3, 0.95 / peak) : 1;
    source.buffer = notificationSound;
    source.connect(gain); gain.connect(compressor); source.start();
    activeSource = source;
    source.onended = () => {source.disconnect(); gain.disconnect(); compressor.disconnect();};
  } else {
    // A synthesized bell still works if the WAV download is unavailable.
    for (let index = 0; index < 3; index++) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.45;
      oscillator.frequency.value = index % 2 ? 880 : 660;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.65, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);
      oscillator.connect(gain); gain.connect(compressor);
      oscillator.start(start); oscillator.stop(start + 0.4);
      oscillator.onended = () => {oscillator.disconnect(); gain.disconnect(); if (index === 2) compressor.disconnect();};
    }
  }
  return true;
}
