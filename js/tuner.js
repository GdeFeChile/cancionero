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

/**
 * Render a radial tuner gauge on a canvas element.
 * Draws a 270° arc (from -135° to +135° relative to 12 o'clock)
 * with gradient fill, needle indicator, and status-based color transitions.
 *
 * @param {HTMLCanvasElement} canvasEl - The canvas element to draw on
 * @param {number} cents - Pitch deviation in cents (-50 to +50)
 * @param {string} status - Tuning status: 'in-tune' | 'flat' | 'sharp'
 */
export function renderGauge(canvasEl, cents, status, noteText, freqText) {
  const dpr = window.devicePixelRatio || 1;
  const size = parseInt(canvasEl.getAttribute('width'), 10) || 260;
  canvasEl.width = size * dpr;
  canvasEl.height = size * dpr;

  const ctx = canvasEl.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 16;
  const lineWidth = 10;

  // Arc angles (canvas 0 = 3 o'clock, going clockwise)
  // 12 o'clock = -π/2. We want 270° centered at 12 o'clock = -135° to +135°
  const arcStart = -5 * Math.PI / 4;   // -225° = 7:30 position
  const arcEnd = Math.PI / 4;          // 45° = 4:30 position
  const arcRange = 3 * Math.PI / 2;    // 270°

  // Clamp cents to [-50, 50]
  const clamped = Math.max(-50, Math.min(50, cents || 0));

  // Needle angle: 0¢ = center of arc = 12 o'clock
  const frac = (clamped + 50) / 100;
  const needleAngle = arcStart + frac * arcRange;

  // Clear
  ctx.clearRect(0, 0, size, size);

  // ── Background arc ──
  ctx.beginPath();
  ctx.arc(cx, cy, radius, arcStart, arcEnd);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // ── Active fill arc (from center to needle position) ──
  const centerAngle = -Math.PI / 2; // 12 o'clock = 0¢

  let fillStart, fillEnd;
  if (clamped < 0) {
    fillStart = needleAngle;
    fillEnd = centerAngle;
  } else if (clamped > 0) {
    fillStart = centerAngle;
    fillEnd = needleAngle;
  } else {
    fillStart = centerAngle;
    fillEnd = centerAngle;
  }

  if (clamped !== 0 && Math.abs(fillEnd - fillStart) > 0.01) {
    const grad = ctx.createLinearGradient(
      cx + radius * Math.cos(fillStart),
      cy + radius * Math.sin(fillStart),
      cx + radius * Math.cos(fillEnd),
      cy + radius * Math.sin(fillEnd)
    );

    if (Math.abs(clamped) < 5) {
      grad.addColorStop(0, '#c8f65a');
      grad.addColorStop(1, '#c8f65a');
    } else if (clamped < 0) {
      const severity = Math.abs(clamped) / 50;
      const r = Math.round(245 - severity * 40);
      const g = Math.round(200 - severity * 80);
      const b = Math.round(66 + severity * 0);
      grad.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
      grad.addColorStop(1, '#c8f65a');
    } else {
      const severity = Math.abs(clamped) / 50;
      const r = Math.round(200 + severity * 45);
      const g = Math.round(246 - severity * 100);
      const b = Math.round(90 - severity * 48);
      grad.addColorStop(0, '#c8f65a');
      grad.addColorStop(1, `rgb(${r}, ${g}, ${b})`);
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, fillStart, fillEnd);
    ctx.strokeStyle = grad;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // ── Needle indicator ──
  const needleLen = radius - 4;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.strokeStyle = status === 'in-tune' ? '#c8f65a'
    : status === 'flat' ? '#f5c842'
    : '#f57042';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // ── Center dot ──
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
  ctx.fillStyle = status === 'in-tune' ? '#c8f65a'
    : status === 'flat' ? '#f5c842'
    : '#f57042';
  ctx.fill();

  // ── Note text in center ──
  if (noteText) {
    ctx.fillStyle = '#f0efea';
    ctx.font = `bold ${Math.max(14, size / 10)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(noteText, cx, cy - 10);
  }

  // ── Frequency text below note ──
  if (freqText) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `${Math.max(9, size / 18)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(freqText, cx, cy + 14);
  }
}

export { startTuner, stopTuner };
export function setOnPitchDetected(cb) { onPitchDetected = cb; }
export function getIsRunning() { return isRunning; }
