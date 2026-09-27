type SoundKind = 'tap' | 'step' | 'art' | 'hover';
let enabled = true;
let context: AudioContext | undefined;
let master: GainNode | undefined;
let last = 0;
const buffers = new Map<number, AudioBuffer>();

/** A short damped string, synthesized locally. No audio downloads or autoplay. */
function stringBuffer(frequency: number) {
  if (buffers.has(frequency)) return buffers.get(frequency)!;
  const rate = context!.sampleRate;
  const buffer = context!.createBuffer(1, Math.floor(rate * .75), rate);
  const samples = buffer.getChannelData(0);
  const period = Math.floor(rate / frequency);
  for (let i = 0; i < period; i++) samples[i] = Math.random() * 2 - 1;
  for (let i = period; i < samples.length; i++) samples[i] = .495 * (samples[i - period] + samples[i - period + 1]);
  buffers.set(frequency, buffer);
  return buffer;
}
export function setSoundEnabled(value: boolean) {
  enabled = value;
  if (value && !context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = .1;
    master.connect(context.destination);
  }
  if (context && master) {
    master.gain.setTargetAtTime(value ? .1 : 0, context.currentTime, .025);
    if (value) void context.resume().then(() => playSound('tap'));
  }
}
export function playSound(kind: SoundKind = 'tap', note = 0) {
  if (!enabled || !context || context.state !== 'running' || !master || document.hidden) return;
  const now = performance.now();
  if (now - last < (kind === 'step' ? 650 : kind === 'hover' ? 180 : 100)) return;
  last = now;
  const notes = kind === 'art' || kind === 'hover' ? [220, 277, 330, 440] : [330, 392, 440, 494];
  const source = context.createBufferSource();
  source.buffer = stringBuffer(notes[Math.abs(note) % notes.length]);
  const volume = context.createGain();
  volume.gain.value = kind === 'hover' ? .28 : kind === 'step' ? .35 : .7;
  source.connect(volume); volume.connect(master);
  source.start();
  source.onended = () => { source.disconnect(); volume.disconnect(); };
}

/** Browsers allow audio after a trusted activation, even with Sound on by default. */
export function installSoundUnlock() {
  function unlock(event: Event) {
    if (!event.isTrusted || !enabled || context?.state === 'running') return;
    if (event instanceof KeyboardEvent && (event.repeat || event.metaKey || event.ctrlKey || event.altKey)) return;
    setSoundEnabled(true);
  }
  document.addEventListener('click', unlock);
  document.addEventListener('keydown', unlock);
  return () => { document.removeEventListener('click', unlock); document.removeEventListener('keydown', unlock); };
}
