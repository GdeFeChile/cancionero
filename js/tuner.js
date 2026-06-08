let audioContext = null;
let mediaStream = null;
let analyser = null;
let isRunning = false;
let onPitchDetected = null;

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteFromPitch(frequency) {
  if (frequency <= 0) return null;
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
  const rounded = Math.round(noteNum);
  const cents = Math.round((noteNum - rounded) * 100);
  return {
    note: NOTES[rounded % 12],
    octave: Math.floor(rounded / 12) - 1,
    frequency: Math.round(frequency * 100) / 100,
    cents
  };
}

async function startTuner() {
  if (isRunning) return;
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(mediaStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    isRunning = true;
    detectLoop();
  } catch (err) {
    console.error('Tuner error:', err);
    throw err;
  }
}

function stopTuner() {
  isRunning = false;
  if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
  if (audioContext) audioContext.close();
  audioContext = null;
  mediaStream = null;
  analyser = null;
}

function detectLoop() {
  if (!isRunning || !analyser) return;
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  
  // Autocorrelation for pitch detection
  let bestOffset = -1;
  let bestCorrelation = 0;
  for (let offset = 20; offset < buffer.length / 2; offset++) {
    let correlation = 0;
    for (let i = 0; i < buffer.length / 2; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - (correlation / (buffer.length / 2));
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }
  
  if (bestOffset > 0 && bestCorrelation > 0.1) {
    const frequency = audioContext.sampleRate / bestOffset;
    const pitch = noteFromPitch(frequency);
    if (pitch && onPitchDetected) onPitchDetected(pitch);
  }
  
  requestAnimationFrame(detectLoop);
}

export { startTuner, stopTuner };
export function setOnPitchDetected(cb) { onPitchDetected = cb; }
export function getIsRunning() { return isRunning; }
