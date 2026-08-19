/**
 * Generates a lightweight WAV buffer that mimics the cadence of speech so the
 * player and waveform work instantly, even with no TTS engine available.
 */
export function generateMockWav(text: string, rate = 1): Buffer {
  const sampleRate = 22050
  const words = (text.trim() || 'AuraVoice Studio preview').split(/\s+/).slice(0, 120)

  const samples: number[] = []
  const pushSilence = (ms: number) => {
    const n = Math.floor((ms / 1000) * sampleRate)
    for (let i = 0; i < n; i++) samples.push(0)
  }
  const pushTone = (ms: number, freq: number, amp: number) => {
    const n = Math.floor((ms / 1000) * sampleRate)
    for (let i = 0; i < n; i++) {
      const env = Math.sin((Math.PI * i) / n) // fade in/out
      const vibrato = 1 + 0.02 * Math.sin((2 * Math.PI * 5 * i) / sampleRate)
      samples.push(Math.sin((2 * Math.PI * freq * vibrato * i) / sampleRate) * amp * env)
    }
  }

  const baseFreq = 120
  for (const word of words) {
    const syllables = Math.max(1, Math.round(word.length / 3))
    for (let s = 0; s < syllables; s++) {
      const seed = (word.charCodeAt(s % word.length) || 100) % 12
      const freq = baseFreq + seed * 18 + (s % 2 === 0 ? 0 : 40)
      const dur = (70 + (word.length % 5) * 18) / rate
      pushTone(dur, freq, 0.28)
      pushTone(dur * 0.6, freq * 1.5, 0.14) // faint harmonic
      pushSilence(24 / rate)
    }
    pushSilence(90 / rate)
  }
  pushSilence(120)

  const numSamples = samples.length
  const buffer = Buffer.alloc(44 + numSamples * 2)

  // WAV header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + numSamples * 2, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20) // PCM
  buffer.writeUInt16LE(1, 22) // mono
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(numSamples * 2, 40)

  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(v * 32767), offset)
    offset += 2
  }
  return buffer
}
